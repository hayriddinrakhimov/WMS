import {
  WAREHOUSE_TASK_OPERATION_LABELS,
  WAREHOUSE_TASK_STATUS_LABELS,
  canOperateWarehouse,
  normalizeRole,
  type ProcurementRequest,
  type ConsolidatedDemand,
  type ExpectedReceipt,
  type TsdTask,
  type User,
  type WarehouseTask,
  type WarehouseTaskOperationType,
  type WarehouseTaskStatus,
} from '@wms/domain'

const ADMIN_ROLES = new Set(['admin', 'management'])
import { getWarehouseName } from '@/lib/auth'
import { resolveExpectedReceiptForReceivingTask } from '@/lib/provision-demo-op'
import {
  MAIN_WAREHOUSE_ID,
} from '@/lib/supply-chain-flow'
import { senderTransferDone } from '@/lib/transfer-scan'

const HIDDEN_ON_TSD: WarehouseTaskStatus[] = ['draft', 'completed', 'cancelled', 'error']

const WAREHOUSE_ASSIGNEE_HINTS: Record<string, string[]> = {
  'wh-1': ['Главный склад', 'Кладовщики ГС', 'Завсклад ГС', 'ГС'],
  'wh-field-1': ['Дочерний склад №1', 'ДС №1', 'Завсклад ДС №1'],
  'wh-field-2': ['Дочерний склад №2', 'ДС №2', 'Завсклад ДС №2'],
}

const RECEIPT_OPEN_STATUSES = new Set<ExpectedReceipt['status']>([
  'ready_for_warehouse',
  'awaiting_receipt',
  'in_progress',
])

export const WAREHOUSE_TASK_TSD_STATUS_SHORT: Partial<Record<WarehouseTaskStatus, string>> = {
  ready: 'Ждёт',
  assigned: 'Ждёт',
  in_progress: 'В работе',
  shipped_by_sender: 'Отгрузка',
  awaiting_receiver_confirmation: 'Приёмка',
  received_by_receiver: 'Принято',
  discrepancy: 'Расхождение',
}

export const WAREHOUSE_TASK_TSD_STATUS_CLASS: Partial<Record<WarehouseTaskStatus, string>> = {
  ready: 'tsd-task-badge--ready',
  assigned: 'tsd-task-badge--ready',
  in_progress: 'tsd-task-badge--active',
  shipped_by_sender: 'tsd-task-badge--active',
  awaiting_receiver_confirmation: 'tsd-task-badge--ready',
  received_by_receiver: 'tsd-task-badge--done',
  discrepancy: 'tsd-task-badge--warn',
}

function assigneeHints(warehouseId?: string): string[] {
  if (!warehouseId) return []
  return WAREHOUSE_ASSIGNEE_HINTS[warehouseId] ?? []
}

function matchesAssigneeHint(name: string, hints: string[]): boolean {
  return hints.some((h) => name.includes(h))
}

export function isWarehouseTaskAssignedToUser(
  task: WarehouseTask,
  user: Pick<User, 'name' | 'warehouseId' | 'role'>,
): boolean {
  const warehouseName = getWarehouseName(user.warehouseId)
  const hints = assigneeHints(user.warehouseId)

  if (task.assignedToType === 'user') {
    return task.assignedToName === user.name || task.actualExecutorName === user.name
  }

  if (task.assignedToType === 'group' || task.assignedToType === 'role') {
    if (matchesAssigneeHint(task.assignedToName, hints)) return true
    return canOperateWarehouse(normalizeRole(user.role)) && hints.length > 0
  }

  if (task.assignedToType === 'warehouse') {
    if (matchesAssigneeHint(task.assignedToName, hints)) return true
    if (warehouseName) {
      return (
        task.fromLocationName?.includes(warehouseName) ||
        task.toLocationName?.includes(warehouseName) ||
        false
      )
    }
  }

  return false
}

function taskWarehouseScope(
  task: WarehouseTask,
): 'main' | 'child' | 'any' {
  if (task.operationType === 'receiving') return 'main'
  if (task.operationType === 'transfer' && task.handshakeRole === 'sender') return 'main'
  if (task.operationType === 'transfer' && task.handshakeRole === 'receiver') return 'child'
  return 'any'
}

function taskVisibleForUserWarehouse(
  task: WarehouseTask,
  user: Pick<User, 'warehouseId' | 'role'>,
): boolean {
  const role = normalizeRole(user.role)
  if (ADMIN_ROLES.has(role)) return true
  const scope = taskWarehouseScope(task)
  if (scope === 'any') return true
  if (scope === 'main') return user.warehouseId === MAIN_WAREHOUSE_ID
  return user.warehouseId !== MAIN_WAREHOUSE_ID && user.warehouseId !== undefined
}

export function warehouseTaskPickerLabel(
  task: WarehouseTask,
  expectedReceipts: ExpectedReceipt[] = [],
  consolidatedDemands: ConsolidatedDemand[] = [],
): { label: string; hint: string } {
  if (task.operationType === 'receiving') {
    const er = expectedReceipts.find(
      (r) =>
        r.id === task.sourceDocumentId ||
        r.number === task.sourceLabel ||
        task.sourceLabel?.includes(r.number),
    )
    const demand = er?.consolidatedDemandId
      ? consolidatedDemands.find((d) => d.id === er.consolidatedDemandId)
      : consolidatedDemands.find((d) => d.number === er?.consolidatedDemandNumber)
    const sv = demand?.number ?? er?.consolidatedDemandNumber
    const pallets = er?.palletCount
    return {
      label: `Приёмка ${task.sourceLabel ?? er?.number ?? task.number}`,
      hint: sv
        ? `Сводная ${sv}${pallets ? ` · ${pallets} пал` : ''} → Главный склад`
        : 'Приёмка поставки на главный склад',
    }
  }

  if (task.operationType === 'transfer') {
    const role = task.handshakeRole === 'sender' ? 'Отгрузка с ГС' : 'Приёмка на ДС'
    const route =
      task.fromLocationName && task.toLocationName
        ? `${task.fromLocationName} → ${task.toLocationName}`
        : task.sourceLabel ?? 'Перемещение'
    return { label: `${task.number} · ${role}`, hint: route }
  }

  if (task.operationType === 'return') {
    return {
      label: task.number,
      hint:
        task.status === 'awaiting_receiver_confirmation'
          ? 'Одобрение возврата'
          : (task.sourceLabel ?? 'Возврат'),
    }
  }

  return {
    label: `${task.number} · ${task.sourceLabel ?? 'Задача'}`,
    hint:
      task.fromLocationName && task.toLocationName
        ? `${task.fromLocationName} → ${task.toLocationName}`
        : 'Складская задача',
  }
}

export function openExpectedReceiptsForTsd(
  expectedReceipts: ExpectedReceipt[],
): ExpectedReceipt[] {
  const open = new Set<ExpectedReceipt['status']>([
    'ready_for_warehouse',
    'awaiting_receipt',
    'in_progress',
  ])
  return expectedReceipts.filter((er) => open.has(er.status))
}

export function warehouseTasksForTsdUser(
  tasks: WarehouseTask[],
  user: Pick<User, 'name' | 'warehouseId' | 'role'>,
  _requests: ProcurementRequest[] = [],
): WarehouseTask[] {
  const role = normalizeRole(user.role)
  const visible = tasks.filter((t) => {
    if (HIDDEN_ON_TSD.includes(t.status)) return false
    if (!taskVisibleForUserWarehouse(t, user)) return false
    if (
      t.operationType === 'transfer' &&
      t.handshakeRole === 'receiver' &&
      t.linkedTaskId
    ) {
      const sender = tasks.find((s) => s.id === t.linkedTaskId)
      if (!sender || !senderTransferDone(sender.status)) return false
    }
    return true
  })
  if (ADMIN_ROLES.has(role)) {
    return visible
  }
  return visible.filter((t) => isWarehouseTaskAssignedToUser(t, user))
}

export function completedWarehouseTasksForTsd(
  tasks: WarehouseTask[],
  user: Pick<User, 'name' | 'warehouseId' | 'role'>,
): WarehouseTask[] {
  const role = normalizeRole(user.role)
  const pool = ADMIN_ROLES.has(role)
    ? tasks
    : tasks.filter((t) => isWarehouseTaskAssignedToUser(t, user))
  return pool
    .filter((t) => t.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
}

function statusRank(status: WarehouseTaskStatus, operationType?: WarehouseTaskOperationType): number {
  if (operationType === 'receiving') return -1
  if (operationType === 'return' && status === 'awaiting_receiver_confirmation') return 0
  if (operationType === 'transfer' && status === 'awaiting_receiver_confirmation') return 1
  if (status === 'in_progress') return 0
  if (status === 'discrepancy') return 1
  if (status === 'ready' || status === 'assigned') return 2
  if (status === 'awaiting_receiver_confirmation' || status === 'shipped_by_sender') return 3
  return 4
}

export function sortWarehouseTasksForTsd(tasks: WarehouseTask[]): WarehouseTask[] {
  return [...tasks].sort((a, b) => {
    const rank = statusRank(a.status, a.operationType) - statusRank(b.status, b.operationType)
    if (rank !== 0) return rank
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function warehouseTaskTitle(task: WarehouseTask): string {
  return task.number
}

export function warehouseTaskSubtitle(task: WarehouseTask): string {
  if (task.operationType === 'receiving') {
    return `${WAREHOUSE_TASK_OPERATION_LABELS.receiving} · Главный склад`
  }
  if (task.operationType === 'transfer' && task.handshakeRole === 'sender') {
    return 'Отгрузка с ГС'
  }
  if (task.operationType === 'transfer' && task.handshakeRole === 'receiver') {
    return 'Приёмка на ДС'
  }
  return WAREHOUSE_TASK_OPERATION_LABELS[task.operationType]
}

export function warehouseTaskSource(task: WarehouseTask): string | null {
  if (!task.sourceLabel || task.sourceLabel === '—') return null
  return task.sourceLabel
}

export function warehouseTaskRoute(task: WarehouseTask): string | null {
  if (task.fromLocationName && task.toLocationName) {
    return `${shortLocation(task.fromLocationName)} → ${shortLocation(task.toLocationName)}`
  }
  if (task.toLocationName) return shortLocation(task.toLocationName)
  if (task.fromLocationName) return shortLocation(task.fromLocationName)
  return null
}

function shortLocation(name: string): string {
  return name
    .replace('Главный склад', 'ГС')
    .replace('Дочерний склад №1', 'ДС №1')
    .replace('Дочерний склад №2', 'ДС №2')
    .replace('Поставщик «Август»', 'Август')
    .replace('Поставщик «Сингента»', 'Сингента')
}

export function warehouseTaskProgress(
  task: WarehouseTask,
): { scanned: number; expected: number; percent: number } | null {
  if (task.expectedQty == null || task.expectedQty <= 0) return null
  const scanned = task.scannedQty ?? 0
  const expected = task.expectedQty
  return {
    scanned,
    expected,
    percent: Math.min(100, Math.round((scanned / expected) * 100)),
  }
}

/** @deprecated use warehouseTaskSource + warehouseTaskRoute + warehouseTaskProgress */
export function warehouseTaskDescription(task: WarehouseTask): string {
  const parts: string[] = []
  if (task.sourceLabel && task.sourceLabel !== '—') parts.push(task.sourceLabel)
  if (task.fromLocationName && task.toLocationName) {
    parts.push(`${task.fromLocationName} → ${task.toLocationName}`)
  } else if (task.toLocationName) {
    parts.push(task.toLocationName)
  } else if (task.fromLocationName) {
    parts.push(task.fromLocationName)
  }
  if (task.expectedQty != null) {
    const scanned = task.scannedQty ?? 0
    if (scanned > 0) parts.push(`${scanned} / ${task.expectedQty}`)
    else parts.push(`${task.expectedQty} шт`)
  }
  return parts.join(' · ') || '—'
}

export function warehouseTaskStatusLabel(
  taskOrStatus: WarehouseTask | WarehouseTaskStatus,
): string {
  const status = typeof taskOrStatus === 'string' ? taskOrStatus : taskOrStatus.status
  const task = typeof taskOrStatus === 'string' ? undefined : taskOrStatus
  if (task?.operationType === 'return' && status === 'awaiting_receiver_confirmation') {
    return 'Одобрение'
  }
  if (task?.operationType === 'transfer' && status === 'awaiting_receiver_confirmation') {
    return 'Приёмка'
  }
  return WAREHOUSE_TASK_TSD_STATUS_SHORT[status] ?? WAREHOUSE_TASK_STATUS_LABELS[status]
}

export function mapWarehouseOperationToTsdType(
  task: WarehouseTask,
): TsdTask['type'] | null {
  switch (task.operationType) {
    case 'receiving':
      return 'receipt'
    case 'transfer':
      return task.handshakeRole === 'receiver' ? 'transfer_receipt' : 'shipment_by_request'
    case 'issue':
      return 'issue'
    case 'return':
      return 'return'
    default:
      return null
  }
}

export function resolveExpectedReceiptForWarehouseTask(
  task: WarehouseTask,
  expectedReceipts: ExpectedReceipt[],
): ExpectedReceipt | null {
  return resolveExpectedReceiptForReceivingTask(task, expectedReceipts)
}

export function resolveTsdTaskForWarehouseTask(
  task: WarehouseTask,
  tsdTasks: TsdTask[],
): TsdTask | null {
  const type = mapWarehouseOperationToTsdType(task)
  if (!type) return null
  const match = tsdTasks.find((t) => t.type === type)
  if (!match || match.status === 'locked') return null
  return match
}

export function warehouseTaskIconType(
  operationType: WarehouseTaskOperationType,
): WarehouseTaskOperationType {
  return operationType
}
