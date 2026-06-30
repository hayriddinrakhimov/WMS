import {
  ROLE_LABELS,
  WAREHOUSE_TASK_OPERATION_LABELS,
  WAREHOUSE_TASK_STATUS_LABELS,
  warehouseTaskTab,
  type AuditEntry,
  type Canister,
  type PackageStatus,
  type ProcurementRequest,
  type StockBalance,
  type WarehouseTask,
} from '@wms/domain'
import type { DemoSummary } from '@/lib/demo-persistence'
import type { Operation } from '@wms/domain'
import type { DashBarItem, DashRingSegment } from './build-dashboard-metrics'

export const CANISTER_UNIT_PRICE = 14_000
export const CANISTER_VOLUME_LITERS = 10

export type ExecutiveWarehouseFilter = 'all' | 'wh-1' | 'wh-field-1' | 'wh-field-2'

export const EXECUTIVE_WAREHOUSE_OPTIONS: { id: ExecutiveWarehouseFilter; name: string }[] = [
  { id: 'all', name: 'Все склады' },
  { id: 'wh-1', name: 'Главный склад' },
  { id: 'wh-field-1', name: 'Дочерний склад №1' },
  { id: 'wh-field-2', name: 'Дочерний склад №2' },
]

const ON_STOCK_STATUSES: PackageStatus[] = [
  'received_acceptance',
  'in_storage_main',
  'in_storage_child',
  'received_child',
  'empty_container',
  'returned_empty',
  'returned_half_empty',
  'returned_full',
  'reserved',
  'picking',
  'ready_to_ship',
  'for_disposal_child',
  'in_disposal_zone',
]

const ACTIVE_REQUEST_STATUSES = new Set<ProcurementRequest['status']>([
  'submitted',
  'approved',
  'in_consolidated',
  'awaiting_delivery',
  'shipped',
  'in_transit',
  'partially_fulfilled',
])

const ACTIVE_TASK_STATUSES = new Set<WarehouseTask['status']>([
  'ready',
  'assigned',
  'in_progress',
  'shipped_by_sender',
  'awaiting_receiver_confirmation',
  'discrepancy',
])

export type AttentionTone = 'red' | 'amber' | 'blue' | 'green'

export type AttentionItem = {
  id: string
  label: string
  tone: AttentionTone
  taskId?: string
  nav?: { module: 'home' | 'warehouses' | 'supply' | 'reports'; filter?: Record<string, string> }
}

export type ActiveTaskRow = {
  id: string
  number: string
  operationLabel: string
  statusLabel: string
  route: string
  plan: number | undefined
  fact: number | undefined
  assignee: string
  executor?: string
}

export type StockWarehouseRow = {
  warehouseId: string
  name: string
  canisters: number
  cost: number
}

export type TodayMetrics = {
  received: number
  transferred: number
  issued: number
  returned: number
  halfEmpty: number
  writtenOff: number
  disposal: number
}

export type ExecutiveEvent = {
  id: string
  time: string
  userName: string
  roleLabel: string
  action: string
  object: string
  status?: string
}

export type ExecutiveDashboardData = {
  kpis: {
    canisters: number
    pallets: number
    liters: number
    cost: number
    activeRequests: number
    warehouseTasks: number
    awaiting: number
    discrepancies: number
  }
  attention: AttentionItem[]
  activeTasks: ActiveTaskRow[]
  stockByWarehouse: StockWarehouseRow[]
  today: TodayMetrics
  charts: {
    warehouseBars: DashBarItem[]
    weeklyMovement: DashBarItem[]
    packageStatusRing: DashRingSegment[]
  }
  events: ExecutiveEvent[]
}

function resolveCanisterWarehouse(c: Canister): string | undefined {
  if (c.warehouseId) return c.warehouseId
  switch (c.status) {
    case 'in_storage_main':
    case 'received_acceptance':
    case 'reserved':
    case 'picking':
    case 'ready_to_ship':
      return 'wh-1'
    case 'in_storage_child':
    case 'received_child':
      return 'wh-field-1'
    default:
      return undefined
  }
}

function matchesWarehouse(c: Canister, filter: ExecutiveWarehouseFilter): boolean {
  if (filter === 'all') return true
  return resolveCanisterWarehouse(c) === filter
}

function matchesStockRow(s: StockBalance, filter: ExecutiveWarehouseFilter): boolean {
  if (filter === 'all') return true
  return s.warehouseId === filter
}

function isOnStock(c: Canister): boolean {
  return ON_STOCK_STATUSES.includes(c.status)
}

export function canisterStockCost(c: Canister): number {
  if (c.status === 'empty_container' || c.returnCondition === 'empty') return 0
  if (
    c.status === 'returned_half_empty' ||
    c.returnCondition === 'half_empty' ||
    (c.remainderLiters != null && c.remainderLiters > 0 && c.remainderLiters < CANISTER_VOLUME_LITERS)
  ) {
    const liters = c.remainderLiters ?? CANISTER_VOLUME_LITERS / 2
    return Math.round((liters / CANISTER_VOLUME_LITERS) * CANISTER_UNIT_PRICE)
  }
  return CANISTER_UNIT_PRICE
}

function taskMatchesWarehouse(task: WarehouseTask, filter: ExecutiveWarehouseFilter): boolean {
  if (filter === 'all') return true
  const names = EXECUTIVE_WAREHOUSE_OPTIONS.filter((w) => w.id !== 'all').map((w) => w.name)
  const whName = EXECUTIVE_WAREHOUSE_OPTIONS.find((w) => w.id === filter)?.name ?? ''
  return (
    task.fromLocationName?.includes(whName) ||
    task.toLocationName?.includes(whName) ||
    task.assignedToName.includes(whName) ||
    names.some((n) => task.fromLocationName?.includes(n) || task.toLocationName?.includes(n))
  )
}

function countExpiringSoon(canisters: Canister[], withinDays = 30): number {
  const now = Date.now()
  const limit = now + withinDays * 86_400_000
  return canisters.filter((c) => {
    if (!isOnStock(c)) return false
    const exp = new Date(c.expiryDate).getTime()
    return exp >= now && exp <= limit
  }).length
}

const DEMO_EVENTS: ExecutiveEvent[] = [
  {
    id: 'ev-seed-1',
    time: '10:42',
    userName: 'Айбек',
    roleLabel: 'Заведующий склада',
    action: 'принял коробку',
    object: 'BOX-001',
    status: 'Принято',
  },
  {
    id: 'ev-seed-2',
    time: '10:37',
    userName: 'Ерлан',
    roleLabel: 'Заведующий склада',
    action: 'отгрузил перемещение',
    object: '№8',
    status: 'Ожидает приёмки',
  },
  {
    id: 'ev-seed-3',
    time: '10:21',
    userName: 'Администратор',
    roleLabel: 'Администратор',
    action: 'создал общий спрос',
    object: '№4',
    status: 'Новый',
  },
  {
    id: 'ev-seed-4',
    time: '10:10',
    userName: 'Система',
    roleLabel: 'Система',
    action: 'загружен Excel поставщика',
    object: 'Док. №15',
    status: 'Обработка',
  },
  {
    id: 'ev-seed-5',
    time: '09:55',
    userName: 'Иванов',
    roleLabel: 'Агроном',
    action: 'подтвердил получение',
    object: 'Выдача №18',
    status: 'Завершено',
  },
  {
    id: 'ev-seed-6',
    time: '09:40',
    userName: 'Ким В.Р.',
    roleLabel: 'Заведующий склада',
    action: 'отправил возврат на проверку',
    object: 'Возврат №5',
    status: 'Проверка',
  },
]

const SYNTHETIC_WEEKLY: Omit<DashBarItem, 'value'>[] = [
  { id: 'receiving', label: 'Приёмка', color: '#2563eb' },
  { id: 'issue', label: 'Выдача', color: '#7c3aed' },
  { id: 'return', label: 'Возврат', color: '#0891b2' },
  { id: 'transfer', label: 'Перемещение', color: '#0d7a52' },
  { id: 'writeoff', label: 'Списание', color: '#b45309' },
  { id: 'utilization', label: 'Утиль', color: '#c62828' },
]

const SYNTHETIC_WEEKLY_VALUES = [420, 280, 96, 240, 48, 36]

const PACKAGE_STATUS_GROUPS: { id: string; label: string; color: string; statuses: PackageStatus[] }[] = [
  {
    id: 'intact',
    label: 'Нетронутая',
    color: '#2563eb',
    statuses: ['received_acceptance', 'in_storage_main', 'in_storage_child', 'received_child', 'returned_full'],
  },
  { id: 'empty', label: 'Пустая', color: '#94a3b8', statuses: ['empty_container', 'returned_empty'] },
  { id: 'half', label: 'Полупустая', color: '#b45309', statuses: ['returned_half_empty'] },
  { id: 'issued', label: 'Выданная', color: '#7c3aed', statuses: ['issued_agronomist'] },
  {
    id: 'disposal',
    label: 'На утиле',
    color: '#c62828',
    statuses: ['for_disposal_child', 'in_disposal_zone', 'in_transit_disposal'],
  },
  { id: 'written', label: 'Списанная', color: '#475569', statuses: ['written_off', 'disposed'] },
]

export function buildExecutiveDashboard(input: {
  warehouseFilter: ExecutiveWarehouseFilter
  canisters: Canister[]
  pallets: { sscc: string }[]
  stock: StockBalance[]
  requests: ProcurementRequest[]
  warehouseTasks: WarehouseTask[]
  operations: Operation[]
  summary: DemoSummary
  auditLog: AuditEntry[]
}): ExecutiveDashboardData {
  const { warehouseFilter, canisters, stock, requests, warehouseTasks, operations, summary, auditLog } =
    input

  const scopedCanisters = canisters.filter((c) => isOnStock(c) && matchesWarehouse(c, warehouseFilter))
  const scopedStock = stock.filter((s) => matchesStockRow(s, warehouseFilter) && s.unit === 'л')
  const scopedTasks = warehouseTasks.filter((t) => taskMatchesWarehouse(t, warehouseFilter))
  const scopedRequests = requests.filter(
    (r) => ACTIVE_REQUEST_STATUSES.has(r.status) && (warehouseFilter === 'all' || r.warehouseId === warehouseFilter),
  )

  const palletSsccs = new Set(scopedCanisters.map((c) => c.palletSscc).filter(Boolean))
  const liters = scopedStock.reduce((s, row) => s + row.quantity, 0)
  const cost = scopedCanisters.reduce((s, c) => s + canisterStockCost(c), 0)

  const activeTasks = scopedTasks.filter((t) => ACTIVE_TASK_STATUSES.has(t.status))
  const awaiting = scopedTasks.filter((t) => warehouseTaskTab(t.status) === 'awaiting')
  const discrepancies = scopedTasks.filter((t) => warehouseTaskTab(t.status) === 'discrepancy')

  const stockByWarehouse: StockWarehouseRow[] = EXECUTIVE_WAREHOUSE_OPTIONS.filter((w) => w.id !== 'all').map(
    (wh) => {
      const whCanisters = canisters.filter((c) => isOnStock(c) && resolveCanisterWarehouse(c) === wh.id)
      return {
        warehouseId: wh.id,
        name: wh.name,
        canisters: whCanisters.length,
        cost: whCanisters.reduce((s, c) => s + canisterStockCost(c), 0),
      }
    },
  )

  const filteredStockRows =
    warehouseFilter === 'all' ? stockByWarehouse : stockByWarehouse.filter((r) => r.warehouseId === warehouseFilter)

  const attention: AttentionItem[] = []

  for (const task of scopedTasks) {
    if (task.status === 'awaiting_receiver_confirmation' && task.operationType === 'transfer') {
      attention.push({
        id: `att-${task.id}`,
        label: `${task.number} ожидает приёмки на ${task.toLocationName ?? 'склад'}`,
        tone: 'amber',
        taskId: task.id,
        nav: { module: 'warehouses', filter: { tab: 'operations', opsTab: 'awaiting', taskId: task.id } },
      })
    }
    if (task.status === 'in_progress' && task.expectedQty && (task.scannedQty ?? 0) < task.expectedQty) {
      attention.push({
        id: `att-progress-${task.id}`,
        label: `${task.number} не завершена: ${task.scannedQty ?? 0} / ${task.expectedQty}`,
        tone: 'amber',
        taskId: task.id,
        nav: { module: 'warehouses', filter: { tab: 'operations', opsTab: 'in_progress', taskId: task.id } },
      })
    }
    if (task.status === 'discrepancy') {
      attention.push({
        id: `att-disc-${task.id}`,
        label: `${task.number}: расхождение ${task.acceptedQty ?? task.scannedQty ?? 0} / ${task.expectedQty ?? '—'}`,
        tone: 'red',
        taskId: task.id,
        nav: { module: 'warehouses', filter: { tab: 'operations', opsTab: 'discrepancy', taskId: task.id } },
      })
    }
    if (task.status === 'awaiting_receiver_confirmation' && task.operationType === 'issue') {
      attention.push({
        id: `att-issue-${task.id}`,
        label: `${task.number} ожидает подтверждения агронома`,
        tone: 'amber',
        taskId: task.id,
        nav: { module: 'warehouses', filter: { tab: 'operations', opsTab: 'awaiting', taskId: task.id } },
      })
    }
  }

  if (discrepancies.length > 1) {
    attention.push({
      id: 'att-disc-count',
      label: `${discrepancies.length} задачи с расхождением`,
      tone: 'red',
      nav: { module: 'warehouses', filter: { tab: 'operations', opsTab: 'discrepancy' } },
    })
  }

  const expiring = countExpiringSoon(
    warehouseFilter === 'all' ? canisters.filter(isOnStock) : scopedCanisters,
  )
  const expiringCount = expiring
  if (expiringCount > 0) {
    attention.push({
      id: 'att-expiry',
      label: `${expiringCount} канистр с истекающим сроком годности`,
      tone: 'blue',
      nav: { module: 'reports', filter: { reportId: 'r-stock' } },
    })
  }

  const pendingReturnTask = scopedTasks.find(
    (t) => t.operationType === 'return' && t.status === 'awaiting_receiver_confirmation',
  )
  if (pendingReturnTask) {
    attention.push({
      id: `att-return-${pendingReturnTask.id}`,
      label: `${pendingReturnTask.number} · возврат ожидает одобрения`,
      tone: 'amber',
      taskId: pendingReturnTask.id,
      nav: {
        module: 'warehouses',
        filter: { tab: 'operations', opsTab: 'awaiting', taskId: pendingReturnTask.id },
      },
    })
  }

  const utilizationAwaiting = scopedTasks.find(
    (t) => t.operationType === 'utilization' && t.status === 'awaiting_receiver_confirmation',
  )
  if (utilizationAwaiting) {
    attention.push({
      id: `att-util-${utilizationAwaiting.id}`,
      label: `${utilizationAwaiting.number} ожидает подтверждения утиля`,
      tone: 'amber',
      taskId: utilizationAwaiting.id,
      nav: {
        module: 'warehouses',
        filter: { tab: 'operations', opsTab: 'awaiting', taskId: utilizationAwaiting.id },
      },
    })
  }

  const activeTaskRows: ActiveTaskRow[] = activeTasks
    .sort((a, b) => {
      const prio = { urgent: 0, high: 1, normal: 2, low: 3 }
      const pd = prio[a.priority] - prio[b.priority]
      if (pd !== 0) return pd
      return b.createdAt.localeCompare(a.createdAt)
    })
    .slice(0, 6)
    .map((task) => {
      const route =
        task.fromLocationName && task.toLocationName
          ? `${task.fromLocationName} → ${task.toLocationName}`
          : task.toLocationName ?? task.fromLocationName ?? '—'
      const fact =
        task.status === 'discrepancy'
          ? task.acceptedQty ?? task.scannedQty
          : task.scannedQty ?? task.acceptedQty
      return {
        id: task.id,
        number: task.number,
        operationLabel: WAREHOUSE_TASK_OPERATION_LABELS[task.operationType],
        statusLabel: WAREHOUSE_TASK_STATUS_LABELS[task.status],
        route,
        plan: task.expectedQty,
        fact,
        assignee: task.assignedToName,
        executor: task.actualExecutorName,
      }
    })

  const scale = warehouseFilter === 'all' ? 1 : 0.35
  const weeklyMovement: DashBarItem[] = SYNTHETIC_WEEKLY.map((item, i) => ({
    ...item,
    value: Math.round(SYNTHETIC_WEEKLY_VALUES[i]! * scale),
  }))

  const warehouseBars: DashBarItem[] = filteredStockRows.map((row) => ({
    id: row.warehouseId,
    label: row.name.replace('Дочерний склад', 'ДС'),
    value: row.canisters,
    color: row.warehouseId === 'wh-1' ? '#2563eb' : row.warehouseId === 'wh-field-1' ? '#0d7a52' : '#7c3aed',
  }))

  const statusSource =
    warehouseFilter === 'all' ? canisters.filter(isOnStock) : scopedCanisters
  const packageStatusRing: DashRingSegment[] = PACKAGE_STATUS_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    color: g.color,
    value: statusSource.filter((c) => g.statuses.includes(c.status)).length,
  })).filter((s) => s.value > 0)

  const auditEvents: ExecutiveEvent[] = auditLog.slice(0, 8).map((e) => ({
    id: e.id,
    time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(e.at)),
    userName: e.userName,
    roleLabel: ROLE_LABELS[e.role] ?? e.role,
    action: e.action,
    object: e.barcode ?? e.operationId ?? '—',
    status: e.newStatus,
  }))

  const events = auditEvents.length >= 4 ? auditEvents : [...auditEvents, ...DEMO_EVENTS].slice(0, 8)

  const halfEmptyCount = scopedCanisters.filter(
    (c) => c.status === 'returned_half_empty' || c.returnCondition === 'half_empty',
  ).length
  const writtenOffCount = canisters.filter((c) => c.status === 'written_off').length
  const disposalCount = canisters.filter((c) =>
    ['for_disposal_child', 'in_disposal_zone', 'in_transit_disposal'].includes(c.status),
  ).length

  return {
    kpis: {
      canisters: scopedCanisters.length,
      pallets: palletSsccs.size,
      liters,
      cost,
      activeRequests: scopedRequests.length,
      warehouseTasks: activeTasks.length,
      awaiting: awaiting.length,
      discrepancies: discrepancies.length,
    },
    attention,
    activeTasks: activeTaskRows,
    stockByWarehouse: filteredStockRows,
    today: {
      received: summary.statReceived,
      transferred: summary.statTransferred,
      issued: summary.statIssued,
      returned: summary.statReturned,
      halfEmpty: halfEmptyCount,
      writtenOff: writtenOffCount,
      disposal: disposalCount,
    },
    charts: { warehouseBars, weeklyMovement, packageStatusRing },
    events,
  }
}

export function formatTenge(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₸`
}
