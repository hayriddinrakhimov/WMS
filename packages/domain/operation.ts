export type OperationType =
  | 'receipt'
  | 'transfer'
  | 'issue'
  | 'return'
  | 'half_empty_return'
  | 'writeoff_empty'
  | 'writeoff_expiry'
  | 'disposal_transfer'
  | 'disposal_complete'
  | 'inventory'
  | 'procurement_request_create'
  | 'procurement_request_approve'
  | 'procurement_receipt'

export type OperationStatus =
  | 'draft'
  | 'waiting_confirmation'
  | 'confirmed'
  | 'document_generated'
  | 'completed'
  | 'rejected'
  | 'error'

export type PartyType = 'warehouse' | 'agronomist' | 'supplier' | 'utilization' | 'management'

export interface OperationItem {
  id: string
  barcode: string
  productName: string
  quantity?: number
  unit?: string
  remainder?: number
  photoUrl?: string
}

export interface Operation {
  id: string
  type: OperationType
  status: OperationStatus
  fromType: PartyType
  fromId: string
  toType: PartyType
  toId: string
  createdBy: string
  confirmedBy?: string
  createdAt: string
  confirmedAt?: string
  documentId?: string
  items: OperationItem[]
}

export function submitOperation(op: Operation): Operation {
  return { ...op, status: 'waiting_confirmation' }
}

export function confirmOperation(op: Operation, userId: string): Operation {
  return {
    ...op,
    status: 'confirmed',
    confirmedBy: userId,
    confirmedAt: new Date().toISOString(),
  }
}

export function rejectOperation(op: Operation): Operation {
  return { ...op, status: 'rejected' }
}

export function generateDocument(op: Operation, documentId: string): Operation {
  return { ...op, status: 'document_generated', documentId }
}

export function completeOperation(op: Operation): Operation {
  return { ...op, status: 'completed' }
}
