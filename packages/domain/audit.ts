import type { OperationStatus } from './operation'
import type { UserRole } from './types'

export interface AuditEntry {
  id: string
  at: string
  userId: string
  userName: string
  role: UserRole
  device: 'web' | 'tsd'
  action: string
  operationId?: string
  oldStatus?: OperationStatus
  newStatus?: OperationStatus
  barcode?: string
  comment?: string
}

export function createAuditEntry(
  partial: Omit<AuditEntry, 'id' | 'at'> & { id?: string },
): AuditEntry {
  return {
    id: partial.id ?? `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    ...partial,
  }
}
