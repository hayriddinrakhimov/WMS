import type { Canister, Operation, WarehouseTask } from '@wms/domain'
import { DEMO_CANISTER_ID } from '@wms/domain'

export const DEMO_CHILD_WAREHOUSE_ID = 'wh-field-1'
export const DEMO_CHILD_WAREHOUSE_2_ID = 'wh-field-2'

export function childWarehouseIdFromLocation(name?: string): string {
  if (!name) return DEMO_CHILD_WAREHOUSE_ID
  if (name.includes('№2') || name.includes('ДС №2') || name.includes('Дочерний склад №2')) {
    return DEMO_CHILD_WAREHOUSE_2_ID
  }
  return DEMO_CHILD_WAREHOUSE_ID
}

export function childWarehouseIdForTask(task: WarehouseTask): string {
  if (task.operationType === 'issue') {
    return childWarehouseIdFromLocation(task.fromLocationName ?? task.toLocationName)
  }
  if (task.operationType === 'return') {
    return childWarehouseIdFromLocation(task.toLocationName ?? task.fromLocationName)
  }
  return DEMO_CHILD_WAREHOUSE_ID
}

export function canistersOnChildForIssue(
  canisters: Canister[],
  warehouseId = DEMO_CHILD_WAREHOUSE_ID,
): Canister[] {
  return canisters.filter(
    (c) =>
      (!c.warehouseId || c.warehouseId === warehouseId) && c.status === 'in_storage_child',
  )
}

export function canistersIssuedForReturn(
  canisters: Canister[],
  warehouseId = DEMO_CHILD_WAREHOUSE_ID,
): Canister[] {
  return canisters.filter(
    (c) =>
      (!c.warehouseId || c.warehouseId === warehouseId) && c.status === 'issued_agronomist',
  )
}

export function findReturnApprovalOperation(
  task: WarehouseTask,
  operations: Operation[],
): Operation | undefined {
  if (!task.sourceDocumentId) return undefined
  return operations.find(
    (op) =>
      op.type === 'return' &&
      op.status === 'waiting_confirmation' &&
      (op.documentId === task.sourceDocumentId || op.id === task.sourceDocumentId),
  )
}

export function isDemoAdjustmentOperation(type: WarehouseTask['operationType']): boolean {
  return type === 'writeoff' || type === 'utilization' || type === 'inventory'
}

export function pickDemoCanisterIds(canisters: Canister[], limit = 3): string[] {
  const demo = canisters.find((c) => c.id === DEMO_CANISTER_ID)
  if (demo) return [demo.id]
  return canisters.slice(0, limit).map((c) => c.id)
}
