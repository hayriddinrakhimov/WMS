import {
  TSD_TASK_TYPE_LABELS,
  type Canister,
  type ExpectedReceipt,
  type Pallet,
  type ProcurementRequest,
  type TsdShipment,
  type TsdTask,
  type TsdTaskType,
} from '@wms/domain'

const CHILD_WAREHOUSE_ID = 'wh-field-1'

export interface TsdOperationBucket {
  type: TsdTaskType
  label: string
  count: number
  hint?: string
  expectedReceiptId?: string
  taskId?: string
}

const RECEIPT_OPEN_STATUSES = new Set<ExpectedReceipt['status']>([
  'ready_for_warehouse',
  'awaiting_receipt',
  'in_progress',
])

export function buildTsdOperationSummary(input: {
  importCompleted: boolean
  expectedReceipts: ExpectedReceipt[]
  pallets: Pallet[]
  requests: ProcurementRequest[]
  shipments: TsdShipment[]
  tasks: TsdTask[]
  canisters: Canister[]
}): TsdOperationBucket[] {
  const receiptOps = input.expectedReceipts.filter((er) => RECEIPT_OPEN_STATUSES.has(er.status))
  const receiptTask = input.tasks.find((t) => t.type === 'receipt' && t.status !== 'completed')

  const shipmentTasks = input.tasks.filter(
    (t) =>
      t.type === 'shipment_by_request' &&
      t.status !== 'completed' &&
      t.status !== 'quarantine' &&
      t.status !== 'locked',
  )
  const shipmentRequests = input.requests.filter((r) =>
    ['partially_fulfilled', 'in_transit'].includes(r.status),
  )
  const shipmentCount = Math.max(shipmentTasks.length, shipmentRequests.length > 0 ? 1 : 0)

  const transferTasks = input.tasks.filter(
    (t) =>
      t.type === 'transfer_receipt' &&
      t.status !== 'completed' &&
      t.status !== 'quarantine' &&
      t.status !== 'locked',
  )
  const inTransit = input.shipments.filter((s) => s.status === 'in_transit' || s.status === 'act_issued')
  const transferCount = Math.max(transferTasks.length, inTransit.length)

  const receiptCount = input.importCompleted ? receiptOps.length : 0
  const firstReceipt = receiptOps[0]

  const pendingPallets = firstReceipt
    ? input.pallets.filter(
        (p) =>
          p.expectedReceiptId === firstReceipt.id && p.status !== 'received_acceptance',
      ).length
    : 0

  const childCanisters = input.canisters.filter(
    (c) => !c.warehouseId || c.warehouseId === CHILD_WAREHOUSE_ID,
  )
  const issueCount = childCanisters.filter((c) => c.status === 'in_storage_child').length
  const returnCount = childCanisters.filter((c) => c.status === 'issued_agronomist').length
  const transferDone = input.shipments.some((s) => s.status === 'received')

  const issueTasks = input.tasks.filter(
    (t) => t.type === 'issue' && t.status !== 'completed' && t.status !== 'quarantine' && t.status !== 'locked',
  )
  const returnTasks = input.tasks.filter(
    (t) => t.type === 'return' && t.status !== 'completed' && t.status !== 'quarantine' && t.status !== 'locked',
  )

  return [
    {
      type: 'receipt',
      label: TSD_TASK_TYPE_LABELS.receipt,
      count: receiptCount,
      hint:
        receiptCount > 0 && firstReceipt
          ? `${firstReceipt.number} · ${pendingPallets || firstReceipt.palletCount} пал → ГС`
          : input.importCompleted
            ? 'Нет ОП к приёму'
            : 'Загрузите Упак в снабжении',
      expectedReceiptId: firstReceipt?.id,
      taskId: receiptTask?.id,
    },
    {
      type: 'shipment_by_request',
      label: TSD_TASK_TYPE_LABELS.shipment_by_request,
      count: shipmentCount,
      hint:
        shipmentCount > 0
          ? shipmentTasks[0]?.requestNumber
            ? `ГС → ДС · ${shipmentTasks[0].requestNumber}`
            : 'После приёмки ОП на главном складе'
          : 'Сначала примите ОП на ГС',
      taskId: shipmentTasks[0]?.id,
    },
    {
      type: 'transfer_receipt',
      label: TSD_TASK_TYPE_LABELS.transfer_receipt,
      count: transferCount,
      hint:
        transferCount > 0
          ? inTransit[0]?.number
            ? `Перемещение ${inTransit[0].number}`
            : 'Сканирование на дочернем складе'
          : 'Нет перемещений к приёму',
      taskId: transferTasks[0]?.id,
    },
    {
      type: 'issue',
      label: TSD_TASK_TYPE_LABELS.issue,
      count: transferDone || issueCount > 0 ? issueCount : 0,
      hint:
        issueCount > 0
          ? `${issueCount} кан. к выдаче`
          : transferDone
            ? 'Нет канистр к выдаче'
            : 'Сначала примите перемещение',
      taskId: issueTasks[0]?.id,
    },
    {
      type: 'return',
      label: TSD_TASK_TYPE_LABELS.return,
      count: returnCount,
      hint:
        returnCount > 0
          ? `${returnCount} кан. к возврату`
          : 'Нет выданных канистр',
      taskId: returnTasks[0]?.id,
    },
  ]
}

export function palletsForExpectedReceipt(pallets: Pallet[], expectedReceiptId: string) {
  return pallets.filter((p) => p.expectedReceiptId === expectedReceiptId)
}
