import type {
  ExpectedReceipt,
  ProcurementRequest,
  WarehouseTask,
  WarehouseTaskHistoryEntry,
} from '@wms/domain'
import {
  getEnterpriseName,
  targetWarehouseForEnterprise,
  TOTAL_CANISTERS,
  warehouseAssigneeGroup,
} from '@wms/domain'

export function wtHistoryEntry(text: string): WarehouseTaskHistoryEntry {
  const at = new Date().toISOString()
  return { id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at, text }
}

export function nextWarehouseTaskNumber(existing: WarehouseTask[]): string {
  const nums = existing
    .map((t) => parseInt(t.number.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `№${next}`
}

export function createReceivingTaskFromExpectedReceipt(
  er: ExpectedReceipt,
  number: string,
): WarehouseTask {
  const now = new Date().toISOString()
  const qty = er.canisterCount || TOTAL_CANISTERS
  return {
    id: `wt-er-${er.id}`,
    number,
    operationType: 'receiving',
    status: 'ready',
    priority: 'high',
    sourceType: 'auto',
    sourceDocumentType: 'supplier_document',
    sourceDocumentId: er.id,
    sourceLabel: er.number,
    createdByName: 'Система',
    assignedByType: 'system',
    assignedByName: 'Система',
    assignedToType: 'group',
    assignedToName: 'Кладовщики ГС',
    fromLocationName: er.supplierName,
    toLocationName: 'Главный склад',
    expectedQty: qty,
    scannedQty: 0,
    createdAt: now,
    history: [
      wtHistoryEntry(`Приёмка поставки на главный склад по ${er.number}`),
    ],
  }
}

export function createTransferPairFromRequest(
  request: ProcurementRequest,
  senderNumber: string,
  receiverNumber: string,
  qty: number,
  createdByName: string,
): { sender: WarehouseTask; receiver: WarehouseTask } {
  const now = new Date().toISOString()
  const pairId = `wt-tr-${request.id}-${Date.now()}`
  const receiverId = `${pairId}-rx`
  const targetWh = request.warehouseId ?? targetWarehouseForEnterprise(request.enterpriseId).id
  const targetName =
    request.warehouseName ?? targetWarehouseForEnterprise(request.enterpriseId).name
  const receiverGroup = warehouseAssigneeGroup(targetWh)

  const sender: WarehouseTask = {
    id: pairId,
    number: senderNumber,
    operationType: 'transfer',
    status: 'ready',
    priority: 'normal',
    sourceType: 'manual',
    sourceDocumentType: 'request',
    sourceDocumentId: request.id,
    sourceLabel: `Спрос: ${request.number}`,
    createdByName,
    assignedByType: 'user',
    assignedByName: createdByName,
    assignedToType: 'group',
    assignedToName: 'Кладовщики ГС',
    fromLocationName: 'Главный склад',
    toLocationName: targetName,
    expectedQty: qty,
    scannedQty: 0,
    linkedTaskId: receiverId,
    handshakeRole: 'sender',
    createdAt: now,
    history: [wtHistoryEntry(`Перемещение по спросу ${request.number}`)],
  }

  const receiver: WarehouseTask = {
    id: receiverId,
    number: receiverNumber,
    operationType: 'transfer',
    status: 'ready',
    priority: 'normal',
    sourceType: 'auto',
    sourceDocumentType: 'request',
    sourceDocumentId: request.id,
    sourceLabel: `Перемещ. ${senderNumber.replace('№', '')}`,
    createdByName: 'Система',
    assignedByType: 'system',
    assignedByName: 'Система',
    assignedToType: 'group',
    assignedToName: receiverGroup,
    fromLocationName: 'Главный склад',
    toLocationName: targetName,
    expectedQty: qty,
    scannedQty: 0,
    acceptedQty: 0,
    linkedTaskId: pairId,
    handshakeRole: 'receiver',
    createdAt: now,
    history: [wtHistoryEntry(`Входящая задача по спросу ${request.number}`)],
  }

  return { sender, receiver }
}

export function createReturnApprovalTask(
  existing: WarehouseTask[],
  params: {
    returnActNumber: string
    createdByName: string
    conditionLabel: string
    productName: string
    molName: string
  },
): WarehouseTask {
  const now = new Date().toISOString()
  return {
    id: `wt-ret-${Date.now()}`,
    number: nextWarehouseTaskNumber(existing),
    operationType: 'return',
    status: 'awaiting_receiver_confirmation',
    priority: 'high',
    sourceType: 'auto',
    sourceDocumentType: 'transfer',
    sourceDocumentId: params.returnActNumber,
    sourceLabel: `Возврат ${params.returnActNumber}`,
    createdByName: params.createdByName,
    assignedByType: 'system',
    assignedByName: 'Система',
    assignedToType: 'group',
    assignedToName: 'Кладовщики ДС №1',
    fromLocationName: params.molName,
    toLocationName: 'Дочерний склад №1',
    expectedQty: 1,
    scannedQty: 1,
    comment: `${params.productName} · ${params.conditionLabel}`,
    createdAt: now,
    history: [
      wtHistoryEntry(`Возврат от МОЛ (${params.conditionLabel}), ожидает одобрения`),
    ],
  }
}
