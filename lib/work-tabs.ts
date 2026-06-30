import { getModule } from '@wms/domain'
import type { ModuleFilter, ModuleId } from '@wms/domain'

export type SupplySubTab = 'demand' | 'supplier'

export type ModuleTabView = 'landing' | 'list' | 'detail' | 'create'

export interface WorkTabLocation {
  moduleId: ModuleId
  filter?: ModuleFilter
  label?: string
}

export interface WorkTab {
  id: string
  /** Заголовок вкладки = title текущей страницы (как document.title) */
  title: string
  moduleId: ModuleId
  filter?: ModuleFilter
  dirty: boolean
  history: WorkTabLocation[]
  historyIndex: number
  refreshKey: number
}

const SUPPLY_SUB_TITLES: Record<SupplySubTab, string> = {
  demand: 'Спрос',
  supplier: 'Заявки поставщику',
}

export function locationKey(location: WorkTabLocation): string {
  const f = location.filter
  return [
    location.moduleId,
    f?.tab ?? '',
    f?.view ?? '',
    f?.requestId ?? '',
    f?.reportId ?? '',
    f?.receiptId ?? '',
  ].join('|')
}

export function isLandingFilter(filter?: ModuleFilter): boolean {
  return !filter?.view || filter.view === 'landing'
}

export function moduleLandingTitle(moduleId: ModuleId): string {
  return getModule(moduleId)?.manifest.title ?? moduleId
}

export function listTitleForFilter(moduleId: ModuleId, filter?: ModuleFilter): string {
  if (moduleId === 'supply') {
    const sub = filter?.tab as SupplySubTab | undefined
    if (sub && SUPPLY_SUB_TITLES[sub]) return SUPPLY_SUB_TITLES[sub]
    return moduleLandingTitle(moduleId)
  }
  return moduleLandingTitle(moduleId)
}

export function defaultFilterForModule(moduleId: ModuleId): ModuleFilter {
  switch (moduleId) {
    case 'warehouses':
      return { view: 'list', tab: 'balances' }
    case 'reports':
      return { view: 'list', reportId: 'r-stock' }
    case 'supply':
      return { tab: 'demand', view: 'list' }
    case 'scanning':
      return { view: 'landing' }
    default:
      return { view: 'landing' }
  }
}

/** Нормализует filter при навигации в текущей вкладке (как URL в браузере). */
export function normalizeNavFilter(moduleId: ModuleId, filter?: ModuleFilter): ModuleFilter {
  if (!filter) return defaultFilterForModule(moduleId)
  if (filter.view === 'landing') {
    if (moduleId === 'warehouses' || moduleId === 'reports' || moduleId === 'supply') {
      return defaultFilterForModule(moduleId)
    }
    return filter
  }
  if (filter.view) return filter
  if (filter.requestId || filter.reportId || filter.receiptId || filter.canisterId) return filter
  if (filter.tab) return { ...filter, view: 'list' }
  if (filter.warehouseId || filter.deficitOnly || filter.sgtin) return filter
  if (moduleId === 'supply') return { tab: 'demand', view: 'list' }
  return defaultFilterForModule(moduleId)
}

export function labelForLocation(location: WorkTabLocation): string {
  if (location.label) return location.label
  const { moduleId, filter } = location
  if (isLandingFilter(filter)) return moduleLandingTitle(moduleId)
  if (filter?.view === 'create') return 'Новая заявка'
  if (filter?.view === 'detail') return 'Документ'
  if (filter?.view === 'list') return listTitleForFilter(moduleId, filter)
  return moduleLandingTitle(moduleId)
}

/** Заголовок вкладки = только текущая страница. */
export function tabTitleFromLocation(location: WorkTabLocation): string {
  return labelForLocation(location)
}

/** Сегменты пути для внутренней логики (не показываются пользователю). */
export function locationPathSegments(location: WorkTabLocation): string[] {
  const segments: string[] = [moduleLandingTitle(location.moduleId)]
  const filter = location.filter
  if (!filter || isLandingFilter(filter)) return segments

  if (location.moduleId === 'supply' && filter.tab) {
    segments.push(listTitleForFilter(location.moduleId, { tab: filter.tab, view: 'list' }))
  } else if (filter.tab) {
    segments.push(filter.tab)
  }

  if (filter.view === 'list') return segments

  if (filter.view === 'create' || filter.view === 'detail') {
    segments.push(location.label ?? labelForLocation(location))
  }

  return segments
}

export function formatLocationPath(location: WorkTabLocation): string {
  return locationPathSegments(location).join(' › ')
}

export function withNormalizedLocation(
  moduleId: ModuleId,
  filter?: ModuleFilter,
  title?: string,
): WorkTabLocation {
  const normalized = normalizeNavFilter(moduleId, filter)
  const location: WorkTabLocation = { moduleId, filter: normalized, label: title }
  const label = title ?? tabTitleFromLocation(location)
  return { ...location, label }
}

export function createWorkTab(location: WorkTabLocation, title?: string): WorkTab {
  const label = title ?? tabTitleFromLocation(location)
  const loc = { ...location, label }
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    moduleId: location.moduleId,
    filter: location.filter,
    title: label,
    dirty: false,
    history: [loc],
    historyIndex: 0,
    refreshKey: 0,
  }
}

export function currentLocation(tab: WorkTab): WorkTabLocation {
  return tab.history[tab.historyIndex] ?? { moduleId: tab.moduleId, filter: tab.filter }
}

export function applyLocationToTab(tab: WorkTab, location: WorkTabLocation): WorkTab {
  const label = location.label ?? tabTitleFromLocation(location)
  const loc = { ...location, label }
  return {
    ...tab,
    moduleId: location.moduleId,
    filter: location.filter,
    title: label,
  }
}

export function canGoBack(tab: WorkTab | undefined): boolean {
  return !!tab && tab.historyIndex > 0
}

export function canGoForward(tab: WorkTab | undefined): boolean {
  return !!tab && tab.historyIndex < tab.history.length - 1
}

/** Документ уже открыт в другой вкладке — переключиться (как Chrome «Перейти на вкладку»). */
export function findDocumentTab(
  tabs: WorkTab[],
  filter: ModuleFilter,
): WorkTab | undefined {
  if (!filter.requestId || (filter.view !== 'detail' && filter.view !== 'create')) return undefined
  return tabs.find((t) => {
    const loc = currentLocation(t)
    return (
      loc.filter?.requestId === filter.requestId &&
      loc.filter?.view === filter.view
    )
  })
}

export const NEW_TAB_LOCATION: WorkTabLocation = {
  moduleId: 'home',
  filter: { view: 'landing' },
}
