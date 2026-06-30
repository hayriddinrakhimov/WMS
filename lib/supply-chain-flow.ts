import type { ProcurementRequest, WarehouseTask } from '@wms/domain'

/** Все входящие поставки по ОП принимаются только на главный склад. */
export const MAIN_WAREHOUSE_ID = 'wh-1'

const TRANSFER_READY_STATUSES = new Set<ProcurementRequest['status']>([
  'partially_fulfilled',
  'in_transit',
  'fulfilled',
])

export function requestReadyForWarehouseTransfer(
  request: ProcurementRequest | undefined,
): boolean {
  if (!request) return true
  return TRANSFER_READY_STATUSES.has(request.status)
}

export function warehouseTransferBlockedReason(
  _task: WarehouseTask,
  _request: ProcurementRequest | undefined,
): string | null {
  return null
}

export function receivingTaskDestinationLabel(): string {
  return 'Главный склад'
}

export function transferRouteLabel(fromMain = true, targetName?: string): string {
  if (fromMain && targetName) return `Главный склад → ${targetName}`
  return targetName ?? 'Дочерний склад'
}
