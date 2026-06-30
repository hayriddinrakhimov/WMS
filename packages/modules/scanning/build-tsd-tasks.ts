import {
  DEMO_PALLET_SSCC,
  type Canister,
  type ExpectedReceipt,
  type ProcurementRequest,
  type TsdShipment,
  type TsdTask,
} from '@wms/domain'

const CHILD_WAREHOUSE_ID = 'wh-field-1'

function childCanisters(canisters: Canister[]) {
  return canisters.filter(
    (c) => !c.warehouseId || c.warehouseId === CHILD_WAREHOUSE_ID,
  )
}

function countForIssue(canisters: Canister[]) {
  return childCanisters(canisters).filter((c) => c.status === 'in_storage_child').length
}

function countForReturn(canisters: Canister[]) {
  return childCanisters(canisters).filter((c) => c.status === 'issued_agronomist').length
}

function transferReceiptDone(shipments: TsdShipment[]) {
  return shipments.some((s) => s.status === 'received')
}

export function buildTsdTasks(input: {
  importCompleted: boolean
  expectedReceipts: ExpectedReceipt[]
  requests: ProcurementRequest[]
  shipments: TsdShipment[]
  canisters: Canister[]
  savedTasks?: TsdTask[]
}): TsdTask[] {
  const fresh = buildFreshTsdTasks(input)

  if (!input.savedTasks?.length) return fresh

  return mergeTsdTasks(input.savedTasks, fresh)
}

function buildFreshTsdTasks(input: {
  expectedReceipts: ExpectedReceipt[]
  requests: ProcurementRequest[]
  shipments: TsdShipment[]
  canisters: Canister[]
}): TsdTask[] {
  const receipt = input.expectedReceipts.find((er) =>
    ['ready_for_warehouse', 'awaiting_receipt', 'in_progress'].includes(er.status),
  )
  const receiptDone = input.expectedReceipts.some((er) => er.status === 'completed')

  const shipmentTarget =
    input.requests.find((r) => r.status === 'partially_fulfilled') ??
    input.requests.find((r) => r.status === 'in_transit')

  const shipment = input.shipments.find((s) => s.status !== 'received')
  const shipmentDone =
    shipment?.status === 'shipped' ||
    shipment?.status === 'act_issued' ||
    shipment?.status === 'in_transit' ||
    shipment?.status === 'received'

  const transferUnlocked =
    shipment?.status === 'in_transit' || shipment?.status === 'act_issued'

  const transferDone = transferReceiptDone(input.shipments)
  const issueCount = countForIssue(input.canisters)
  const returnCount = countForReturn(input.canisters)
  const issueUnlocked = transferDone || issueCount > 0
  const returnUnlocked = returnCount > 0

  return [
    {
      id: 'tsd-task-receipt',
      type: 'receipt',
      title: receipt ? `Приём ${receipt.number}` : 'Приём ОП',
      description: receipt ? `${receipt.palletCount} пал` : '—',
      status: receiptDone ? 'completed' : receipt ? 'pending' : 'locked',
      sortOrder: 1,
      expectedReceiptId: receipt?.id,
    },
    {
      id: 'tsd-task-shipment',
      type: 'shipment_by_request',
      title: shipmentTarget ? `Перемещение ${shipmentTarget.number}` : 'Перемещение с ГС',
      description: shipmentTarget ? 'После приёмки ОП' : '—',
      status: shipmentDone ? 'completed' : shipmentTarget ? 'pending' : 'locked',
      sortOrder: 2,
      requestId: shipmentTarget?.id,
      requestNumber: shipmentTarget?.number,
      shipmentId: shipment?.id,
    },
    {
      id: 'tsd-task-transfer',
      type: 'transfer_receipt',
      title: 'Приём перемещения',
      description: shipment?.transferActNumber ? `По ${shipment.transferActNumber}` : 'Дочерний склад',
      status: transferDone ? 'completed' : transferUnlocked ? 'pending' : 'locked',
      sortOrder: 3,
      shipmentId: shipment?.id,
    },
    {
      id: 'tsd-task-issue',
      type: 'issue',
      title: 'Выдача',
      description: issueCount ? `${issueCount} шт` : '—',
      status: !issueUnlocked
        ? 'locked'
        : issueCount === 0
          ? 'completed'
          : 'pending',
      sortOrder: 4,
    },
    {
      id: 'tsd-task-return',
      type: 'return',
      title: 'Возврат',
      description: returnCount ? `${returnCount} шт` : '—',
      status: !returnUnlocked
        ? 'locked'
        : returnCount === 0
          ? 'completed'
          : 'pending',
      sortOrder: 5,
    },
  ]
}

function mergeTsdTasks(saved: TsdTask[], fresh: TsdTask[]): TsdTask[] {
  const savedByType = new Map(saved.map((t) => [t.type, t]))

  return fresh.map((task) => {
    const prev = savedByType.get(task.type)
    if (!prev) return task
    if (prev.status === 'quarantine' || prev.status === 'in_progress') return prev
    if (prev.status === 'completed' && task.status !== 'completed') {
      return { ...task, status: task.status }
    }
    return { ...prev, ...task, id: prev.id, status: task.status }
  })
}

export function nextShipmentNumber(existing: TsdShipment[]) {
  const n = existing.length + 1
  return `ОТ-${String(n).padStart(3, '0')}`
}
