'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { useDemoStore } from '@/lib/demo-store'
import { CanisterCard } from '@wms/ui'
import type { ModuleId, ModuleRenderContext } from '@wms/domain'
import { cn } from '@/lib/utils'
import { WarehouseSelector } from '../shared/WarehouseSelector'
import { DashAttentionList, DashKpiCard, DashSectionTitle, DashTodayBar } from './dashboard-parts'
import {
  buildExecutiveDashboard,
  EXECUTIVE_WAREHOUSE_OPTIONS,
  type AttentionItem,
  type ExecutiveWarehouseFilter,
} from './build-executive-dashboard'

function formatDateShort() {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function userDisplayName(user: ModuleRenderContext['user']) {
  if (!user?.name) return 'Коллега'
  return user.name.split(' ')[0] ?? user.name
}

function taskStatusClass(status: string) {
  if (status.includes('расхожд') || status.includes('Ошибка')) return 'dash-task-badge--red'
  if (status.includes('Ожида') || status.includes('Отгруж')) return 'dash-task-badge--amber'
  if (status.includes('работе') || status.includes('Назнач')) return 'dash-task-badge--blue'
  return 'dash-task-badge--slate'
}

const EXECUTIVE_WAREHOUSE_SELECTOR = EXECUTIVE_WAREHOUSE_OPTIONS.map((w) => ({
  id: w.id,
  name: w.name,
  type: (w.id === 'all' ? 'all' : w.id === 'wh-1' ? 'main' : 'child') as 'all' | 'main' | 'child',
}))

export function DashboardScreen({ onNavigate, user }: ModuleRenderContext) {
  const {
    summary,
    globalSearch,
    procurementRequests,
    warehouseTasks,
    canisters,
    pallets,
    stock,
    auditLog,
    operations,
    refreshActiveWorkTab,
  } = useDemoStore()

  const [warehouseFilter, setWarehouseFilter] = useState<ExecutiveWarehouseFilter>('all')
  const [searchCode, setSearchCode] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const searchResult = searchCode.trim() ? globalSearch(searchCode) : null

  const data = useMemo(
    () =>
      buildExecutiveDashboard({
        warehouseFilter,
        canisters,
        pallets,
        stock,
        requests: procurementRequests,
        warehouseTasks,
        operations,
        summary,
        auditLog,
      }),
    [warehouseFilter, canisters, pallets, stock, procurementRequests, warehouseTasks, operations, summary, auditLog],
  )

  const greeting = userDisplayName(user)

  const handleRefresh = () => {
    setRefreshing(true)
    refreshActiveWorkTab()
    window.setTimeout(() => setRefreshing(false), 400)
  }

  const goWarehouses = (filter?: Record<string, string>) => {
    onNavigate('warehouses', {
      tab: 'operations',
      warehouseId: warehouseFilter === 'all' ? 'wh-1' : warehouseFilter,
      ...filter,
    })
  }

  const handleAttention = (item: AttentionItem) => {
    if (!item.nav) return
    onNavigate(item.nav.module as ModuleId, item.nav.filter)
  }

  const todayItems = [
    { label: 'Принято', value: data.today.received },
    { label: 'Перемещено', value: data.today.transferred },
    { label: 'Выдано', value: data.today.issued },
    { label: 'Возврат', value: data.today.returned },
    { label: 'Полупустая', value: data.today.halfEmpty },
    { label: 'Списано', value: data.today.writtenOff },
    { label: 'В утиль', value: data.today.disposal },
  ]

  return (
    <div className="dash-exec h-full overflow-auto">
      <div className="dash-exec__inner">
        <header className="dash-exec-hero">
          <div className="dash-exec-hero__main">
            <h1 className="dash-exec-hero__title">Добро пожаловать, {greeting}</h1>
            <div className="dash-exec-hero__meta">
              <span className="dash-exec-hero__chip">
                <CalendarDays className="size-3.5" />
                {formatDateShort()}
              </span>
            </div>
          </div>
          <div className="dash-exec-hero__side">
            <div className="dash-exec-hero__search-row">
              <label className="dash-search dash-search--header">
                <Search className="size-[18px] shrink-0 text-[var(--app-muted)]" />
                <input
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Поиск SSCC / SGTIN / SN…"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--app-muted)]/80"
                />
              </label>
              <WarehouseSelector
                warehouses={EXECUTIVE_WAREHOUSE_SELECTOR}
                selectedId={warehouseFilter}
                onSelect={(id) => setWarehouseFilter(id as ExecutiveWarehouseFilter)}
              />
              <button
                type="button"
                className="dash-exec-hero__refresh"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Обновить"
              >
                <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
                <span className="hidden sm:inline">Обновить</span>
              </button>
            </div>
          </div>
        </header>
        {searchResult?.canister ? (
          <div className="dash-search-result">
            <CanisterCard canister={searchResult.canister} />
          </div>
        ) : null}

        <section className="dash-kpi-strip dash-kpi-strip--compact">
          <DashKpiCard
            compact
            label="Остаток СЗР"
            value={data.kpis.canisters.toLocaleString('ru-RU')}
            sub={`${data.kpis.canisters.toLocaleString('ru-RU')} кан.`}
            icon={Package}
            tone="blue"
            onClick={() => onNavigate('reports', { reportId: 'r-stock', view: 'list' })}
          />
          <DashKpiCard
            compact
            label="Заявки"
            value={String(data.kpis.activeRequests)}
            sub="активные"
            icon={ShoppingCart}
            tone="amber"
            onClick={() => onNavigate('supply', { tab: 'demand', view: 'list' })}
          />
          <DashKpiCard
            compact
            label="Задачи"
            value={String(data.kpis.warehouseTasks)}
            sub="в работе"
            icon={ClipboardList}
            tone="slate"
            onClick={() => goWarehouses({ opsTab: 'all' })}
          />
          <DashKpiCard
            compact
            label="Ожидают"
            value={String(data.kpis.awaiting)}
            sub="подтверждения"
            icon={Truck}
            tone="amber"
            highlight={data.kpis.awaiting > 0}
            onClick={() => goWarehouses({ opsTab: 'awaiting' })}
          />
          <DashKpiCard
            compact
            label="Расхождения"
            value={String(data.kpis.discrepancies)}
            sub="план ≠ факт"
            icon={AlertTriangle}
            tone="red"
            highlight={data.kpis.discrepancies > 0}
            onClick={() => goWarehouses({ opsTab: 'discrepancy' })}
          />
        </section>

        <div className="dash-exec-layout">
          <div className="dash-exec-layout__primary">
            <DashAttentionList items={data.attention} onItemClick={handleAttention} />

            <section className="dash-panel">
              <DashSectionTitle
                title="Задачи в работе"
                action={
                  <button
                    type="button"
                    className="dash-link-btn"
                    onClick={() => goWarehouses({ opsTab: 'in_progress' })}
                  >
                    Все
                    <ChevronRight className="size-4" />
                  </button>
                }
              />
              {data.activeTasks.length === 0 ? (
                <p className="dash-empty">Нет активных задач</p>
              ) : (
                <div className="dash-task-table-wrap">
                  <table className="dash-task-table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Операция</th>
                        <th>Маршрут</th>
                        <th>Статус</th>
                        <th>План / факт</th>
                        <th>Исполнитель</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activeTasks.map((task) => (
                        <tr
                          key={task.id}
                          className="dash-task-table__row"
                          onClick={() => goWarehouses({ opsTab: 'in_progress', taskId: task.id })}
                        >
                          <td className="dash-task-table__num">{task.number}</td>
                          <td>{task.operationLabel}</td>
                          <td className="dash-task-table__route">{task.route}</td>
                          <td>
                            <span className={cn('dash-task-badge', taskStatusClass(task.statusLabel))}>
                              {task.statusLabel}
                            </span>
                          </td>
                          <td className="dash-task-table__qty">
                            {task.fact ?? 0}
                            <span className="text-[var(--app-muted)]"> / {task.plan ?? '—'}</span>
                          </td>
                          <td className="dash-task-table__user">{task.executor ?? task.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="dash-exec-layout__side">
            <section className="dash-panel dash-panel--compact">
              <DashSectionTitle title="Остатки по складам" />
              <div className="dash-stock-list dash-stock-list--compact">
                {data.stockByWarehouse.map((row, i) => (
                  <button
                    key={row.warehouseId}
                    type="button"
                    className="dash-stock-card dash-stock-card--compact"
                    onClick={() => onNavigate('reports', { reportId: 'r-stock', view: 'list' })}
                  >
                    <span className={cn('dash-stock-card__dot', `dash-stock-card__dot--${i}`)} />
                    <span className="dash-stock-card__name">{row.name}</span>
                    <span className="dash-stock-card__qty">{row.canisters} кан.</span>
                    <ChevronRight className="size-3.5 shrink-0 text-[var(--app-muted)]" />
                  </button>
                ))}
              </div>
            </section>

            <DashTodayBar items={todayItems} />
          </aside>
        </div>
      </div>
    </div>
  )
}
