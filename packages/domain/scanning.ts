export type TsdTaskType =
  | 'receipt'
  | 'shipment_by_request'
  | 'transfer_receipt'
  | 'issue'
  | 'return'

export type TsdTaskStatus = 'pending' | 'in_progress' | 'completed' | 'quarantine' | 'locked'

export type TsdQuarantineReason =
  | 'damaged'
  | 'wrong_product'
  | 'wrong_qty'
  | 'missing_label'
  | 'other'

export const TSD_QUARANTINE_REASON_LABELS: Record<TsdQuarantineReason, string> = {
  damaged: 'Повреждение',
  wrong_product: 'Не тот товар',
  wrong_qty: 'Неверное количество',
  missing_label: 'Нет маркировки',
  other: 'Другое',
}

export const TSD_TASK_TYPE_LABELS: Record<TsdTaskType, string> = {
  receipt: 'Приём ОП',
  shipment_by_request: 'Отгрузка по заявке',
  transfer_receipt: 'Приём перемещения',
  issue: 'Выдача',
  return: 'Возврат',
}

export type TsdShipmentStatus = 'draft' | 'shipped' | 'act_issued' | 'in_transit' | 'received'

export interface TsdShipment {
  id: string
  number: string
  requestIds: string[]
  requestNumbers: string[]
  status: TsdShipmentStatus
  createdAt: string
  shippedAt?: string
  actIssuedAt?: string
  scannedCodes: string[]
  /** id канистр, отгруженных в этой передаче */
  shippedCanisterIds?: string[]
  warehouseId: string
  /** Основание: спрос / заявка */
  demandBasisLabel?: string
  transferActNumber?: string
  transferActDocumentId?: string
  transferActClosedAt?: string
}

export interface TsdTask {
  id: string
  type: TsdTaskType
  title: string
  description: string
  status: TsdTaskStatus
  sortOrder: number
  requestId?: string
  requestNumber?: string
  shipmentId?: string
  expectedReceiptId?: string
  quarantineReason?: TsdQuarantineReason
  quarantineScanCode?: string
  quarantineNote?: string
}
