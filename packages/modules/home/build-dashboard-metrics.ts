import {
  PROCUREMENT_REQUEST_STATUS_LABELS,
  type ExpectedReceipt,
  type ProcurementRequest,
  type StockBalance,
  type TsdShipment,
  type TsdTask,
} from '@wms/domain'
import { buildTsdOperationSummary } from '../scanning/build-tsd-operation-summary'
import { WAREHOUSES_MOCK } from '../warehouses/mock-data'

export type DashBarItem = {
  id: string
  label: string
  value: number
  color: string
}

export type DashRingSegment = {
  id: string
  label: string
  value: number
  color: string
}

export type DashPipelineStep = {
  id: string
  label: string
  state: 'done' | 'active' | 'pending'
  value?: number
}

export interface SupplyDashboardMetrics {
  totalRequests: number
  statusBars: DashBarItem[]
  pipeline: DashPipelineStep[]
  consolidatedOpen: number
  supplierOrdersOpen: number
}

export interface ScanningDashboardMetrics {
  operationBars: DashBarItem[]
  tasksDone: number
  tasksTotal: number
  palletProgress: { scanned: number; total: number; label: string } | null
}

export interface WarehousesDashboardMetrics {
  warehouseBars: DashBarItem[]
  statusRing: DashRingSegment[]
  stockLiters: number
  skuCount: number
  pendingConfirmations: number
  openReceipts: number
}

const SUPPLY_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  submitted: '#f59e0b',
  approved: '#3b82f6',
  in_consolidated: '#6366f1',
  awaiting_delivery: '#0ea5e9',
  shipped: '#8b5cf6',
  in_transit: '#a855f7',
  fulfilled: '#0d7a52',
  other: '#cbd5e1',
}

const SCAN_COLORS: Record<string, string> = {
  receipt: '#10b981',
  shipment_by_request: '#0ea5e9',
  transfer_receipt: '#8b5cf6',
  issue: '#f59e0b',
  return: '#ec4899',
}

const WH_STATUS_COLORS: Record<StockBalance['status'], string> = {
  on_warehouse: '#0d7a52',
  issued: '#3b82f6',
  half_empty: '#f59e0b',
  disposal: '#ef4444',
  written_off: '#94a3b8',
}

function countByStatus(requests: ProcurementRequest[]) {
  const map = new Map<string, number>()
  for (const r of requests) {
    const key = ['draft', 'submitted', 'approved', 'in_consolidated', 'awaiting_delivery', 'shipped', 'in_transit', 'fulfilled'].includes(
      r.status,
    )
      ? r.status
      : 'other'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

export function buildSupplyDashboardMetrics(input: {
  requests: ProcurementRequest[]
  consolidatedCount: number
  supplierOrdersOpen: number
}): SupplyDashboardMetrics {
  const statusMap = countByStatus(input.requests)
  const order = [
    'submitted',
    'approved',
    'in_consolidated',
    'awaiting_delivery',
    'shipped',
    'in_transit',
    'fulfilled',
    'draft',
  ] as const

  const statusBars: DashBarItem[] = order
    .map((status) => ({
      id: status,
      label: PROCUREMENT_REQUEST_STATUS_LABELS[status],
      value: statusMap.get(status) ?? 0,
      color: SUPPLY_COLORS[status] ?? SUPPLY_COLORS.other,
    }))
    .filter((item) => item.value > 0)

  const pipeline: DashPipelineStep[] = [
    {
      id: 'demand',
      label: 'Заявки',
      state: (statusMap.get('submitted') ?? 0) > 0 ? 'active' : 'done',
      value: (statusMap.get('submitted') ?? 0) + (statusMap.get('approved') ?? 0),
    },
    {
      id: 'consolidated',
      label: 'Сводные',
      state: input.consolidatedCount > 0 ? 'active' : 'pending',
      value: input.consolidatedCount,
    },
    {
      id: 'delivery',
      label: 'Поставка',
      state: (statusMap.get('awaiting_delivery') ?? 0) > 0 ? 'active' : 'pending',
      value: statusMap.get('awaiting_delivery') ?? 0,
    },
    {
      id: 'closed',
      label: 'Закрыто',
      state: (statusMap.get('fulfilled') ?? 0) > 0 ? 'done' : 'pending',
      value: statusMap.get('fulfilled') ?? 0,
    },
  ]

  return {
    totalRequests: input.requests.length,
    statusBars,
    pipeline,
    consolidatedOpen: input.consolidatedCount,
    supplierOrdersOpen: input.supplierOrdersOpen,
  }
}

export function buildScanningDashboardMetrics(input: {
  importCompleted: boolean
  expectedReceipts: ExpectedReceipt[]
  pallets: Parameters<typeof buildTsdOperationSummary>[0]['pallets']
  requests: ProcurementRequest[]
  shipments: TsdShipment[]
  tasks: TsdTask[]
  canisters: Parameters<typeof buildTsdOperationSummary>[0]['canisters']
}): ScanningDashboardMetrics {
  const buckets = buildTsdOperationSummary(input)
  const operationBars: DashBarItem[] = buckets.map((b) => ({
    id: b.type,
    label: b.label,
    value: b.count,
    color: SCAN_COLORS[b.type] ?? '#64748b',
  }))

  const activeTasks = input.tasks.filter((t) => t.status !== 'locked')
  const tasksDone = input.tasks.filter((t) => t.status === 'completed').length

  const openEr = input.expectedReceipts.find((er) =>
    ['ready_for_warehouse', 'awaiting_receipt', 'in_progress'].includes(er.status),
  )
  const scanned =
    openEr != null
      ? input.pallets.filter(
          (p) => p.expectedReceiptId === openEr.id && p.status === 'received_acceptance',
        ).length
      : 0

  return {
    operationBars,
    tasksDone,
    tasksTotal: activeTasks.length || input.tasks.length,
    palletProgress: openEr
      ? {
          scanned,
          total: openEr.palletCount,
          label: openEr.number,
        }
      : null,
  }
}

export function buildWarehousesDashboardMetrics(input: {
  stock: StockBalance[]
  pendingConfirmations: number
  expectedReceipts: ExpectedReceipt[]
}): WarehousesDashboardMetrics {
  const warehouseBars: DashBarItem[] = WAREHOUSES_MOCK.map((wh, index) => {
    const liters = input.stock
      .filter((s) => s.warehouseId === wh.id)
      .reduce((sum, s) => sum + s.quantity, 0)
    const colors = ['#0d7a52', '#3b82f6', '#8b5cf6']
    return {
      id: wh.id,
      label: wh.name,
      value: Math.round(liters),
      color: colors[index % colors.length]!,
    }
  })

  const statusMap = new Map<StockBalance['status'], number>()
  for (const row of input.stock) {
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + row.quantity)
  }

  const statusRing: DashRingSegment[] = (
    ['on_warehouse', 'issued', 'half_empty', 'disposal', 'written_off'] as const
  )
    .map((status) => ({
      id: status,
      label:
        status === 'on_warehouse'
          ? 'На складе'
          : status === 'issued'
            ? 'Выдано'
            : status === 'half_empty'
              ? 'Полупустая'
              : status === 'disposal'
                ? 'Утиль'
                : 'Списано',
      value: statusMap.get(status) ?? 0,
      color: WH_STATUS_COLORS[status],
    }))
    .filter((s) => s.value > 0)

  const openReceipts = input.expectedReceipts.filter((er) =>
    ['ready_for_warehouse', 'awaiting_receipt', 'in_progress'].includes(er.status),
  ).length

  return {
    warehouseBars,
    statusRing,
    stockLiters: Math.round(input.stock.reduce((s, r) => s + r.quantity, 0)),
    skuCount: input.stock.length,
    pendingConfirmations: input.pendingConfirmations,
    openReceipts,
  }
}
