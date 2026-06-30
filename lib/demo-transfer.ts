import type { WarehouseTask } from '@wms/domain'

export function inferTransferHandshakeRole(task: WarehouseTask): 'sender' | 'receiver' {
  if (task.handshakeRole) return task.handshakeRole
  if (task.fromLocationName?.includes('Главный')) return 'sender'
  if (task.toLocationName?.includes('Главный')) return 'receiver'
  return 'sender'
}

export function isTransferSenderTask(task: WarehouseTask): boolean {
  return task.operationType === 'transfer' && inferTransferHandshakeRole(task) === 'sender'
}

export function isTransferReceiverTask(task: WarehouseTask): boolean {
  return task.operationType === 'transfer' && inferTransferHandshakeRole(task) === 'receiver'
}

export function transferHandshakePatch(
  task: WarehouseTask,
): Pick<WarehouseTask, 'handshakeRole'> | Record<string, never> {
  if (task.handshakeRole) return {}
  return { handshakeRole: inferTransferHandshakeRole(task) }
}
