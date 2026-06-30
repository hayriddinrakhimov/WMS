import {
  completeOperation,
  confirmOperation,
  generateDocument,
  rejectOperation,
  submitOperation,
  type Operation,
  type OperationStatus,
  type OperationType,
} from './operation'
import { createAuditEntry, type AuditEntry } from './audit'
import type { UserRole } from './types'

export interface DemoDocument {
  id: string
  title: string
  type: string
  operationId: string
  createdAt: string
}

export interface OperationServiceState {
  operations: Operation[]
  documents: DemoDocument[]
  auditLog: AuditEntry[]
}

export function createOperation(
  partial: Omit<Operation, 'id' | 'status' | 'createdAt' | 'items'> & {
    items?: Operation['items']
  },
): Operation {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    items: partial.items ?? [],
    ...partial,
  }
}

export function submitOp(
  state: OperationServiceState,
  opId: string,
  ctx: { userId: string; userName: string; role: UserRole; device: 'web' | 'tsd' },
): OperationServiceState {
  const op = state.operations.find((o) => o.id === opId)
  if (!op) return state
  const updated = submitOperation(op)
  return applyOpUpdate(state, op, updated, ctx, 'submit')
}

export function confirmOp(
  state: OperationServiceState,
  opId: string,
  ctx: { userId: string; userName: string; role: UserRole; device: 'web' | 'tsd' },
): OperationServiceState {
  const op = state.operations.find((o) => o.id === opId)
  if (!op) return state
  let updated = confirmOperation(op, ctx.userId)
  updated = generateDocument(updated, `doc-${Date.now()}`)
  const doc: DemoDocument = {
    id: updated.documentId!,
    title: `Документ по операции ${op.type}`,
    type: op.type,
    operationId: op.id,
    createdAt: new Date().toISOString(),
  }
  updated = completeOperation(updated)
  return {
    ...applyOpUpdate(state, op, updated, ctx, 'confirm'),
    documents: [...state.documents, doc],
  }
}

export function rejectOp(
  state: OperationServiceState,
  opId: string,
  ctx: { userId: string; userName: string; role: UserRole; device: 'web' | 'tsd' },
): OperationServiceState {
  const op = state.operations.find((o) => o.id === opId)
  if (!op) return state
  const updated = rejectOperation(op)
  return applyOpUpdate(state, op, updated, ctx, 'reject')
}

export function addOperation(
  state: OperationServiceState,
  type: OperationType,
  partial: Partial<Operation> & Pick<Operation, 'fromType' | 'fromId' | 'toType' | 'toId' | 'createdBy'>,
  ctx: { userId: string; userName: string; role: UserRole; device: 'web' | 'tsd' },
): OperationServiceState {
  const op = createOperation({ type, ...partial })
  const submitted = submitOperation(op)
  const audit = createAuditEntry({
    userId: ctx.userId,
    userName: ctx.userName,
    role: ctx.role,
    device: ctx.device,
    action: 'create_operation',
    operationId: submitted.id,
    newStatus: submitted.status,
  })
  return {
    ...state,
    operations: [...state.operations, submitted],
    auditLog: [...state.auditLog, audit],
  }
}

function applyOpUpdate(
  state: OperationServiceState,
  old: Operation,
  updated: Operation,
  ctx: { userId: string; userName: string; role: UserRole; device: 'web' | 'tsd' },
  action: string,
): OperationServiceState {
  const audit = createAuditEntry({
    userId: ctx.userId,
    userName: ctx.userName,
    role: ctx.role,
    device: ctx.device,
    action,
    operationId: updated.id,
    oldStatus: old.status,
    newStatus: updated.status,
  })
  return {
    ...state,
    operations: state.operations.map((o) => (o.id === updated.id ? updated : o)),
    auditLog: [...state.auditLog, audit],
  }
}

export function getPendingOperations(state: OperationServiceState) {
  return state.operations.filter((o) => o.status === 'waiting_confirmation')
}

export function getOperationsByStatus(state: OperationServiceState, status: OperationStatus) {
  return state.operations.filter((o) => o.status === status)
}
