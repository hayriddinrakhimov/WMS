export type WarehouseTaskOperationType =
  | 'receiving'
  | 'transfer'
  | 'issue'
  | 'return'
  | 'writeoff'
  | 'utilization'
  | 'inventory'

export type WarehouseTaskStatus =
  | 'draft'
  | 'ready'
  | 'assigned'
  | 'in_progress'
  | 'shipped_by_sender'
  | 'awaiting_receiver_confirmation'
  | 'received_by_receiver'
  | 'completed'
  | 'discrepancy'
  | 'cancelled'
  | 'error'

export type WarehouseTaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export type WarehouseTaskSourceType = 'auto' | 'manual'

export type WarehouseTaskSourceDocumentType =
  | 'request'
  | 'supplier_document'
  | 'transfer'
  | 'return'
  | 'inventory'
  | 'discrepancy'
  | 'act'
  | 'manual'

export type WarehouseTaskAssigneeType = 'user' | 'role' | 'warehouse' | 'group'

export type WarehouseTaskAssignedByType = 'system' | 'user'

export interface WarehouseTaskHistoryEntry {
  id: string
  at: string
  text: string
}

export interface WarehouseTask {
  id: string
  number: string
  operationType: WarehouseTaskOperationType
  status: WarehouseTaskStatus
  priority: WarehouseTaskPriority

  sourceType: WarehouseTaskSourceType
  sourceDocumentId?: string
  sourceDocumentType?: WarehouseTaskSourceDocumentType
  sourceLabel?: string

  createdByName?: string

  assignedByType: WarehouseTaskAssignedByType
  assignedByName?: string

  assignedToType: WarehouseTaskAssigneeType
  assignedToName: string

  actualExecutorName?: string
  actualExecutorStartedAt?: string

  fromLocationName?: string
  toLocationName?: string

  expectedQty?: number
  scannedQty?: number
  acceptedQty?: number

  comment?: string
  cancelReason?: string
  discrepancyReason?: string

  /** id парной задачи для двойного рукопожатия (отгрузка ↔ приёмка) */
  linkedTaskId?: string
  /** роль в паре передачи */
  handshakeRole?: 'sender' | 'receiver'

  createdAt: string
  startedAt?: string
  completedAt?: string

  history: WarehouseTaskHistoryEntry[]
}

export const WAREHOUSE_TASK_OPERATION_LABELS: Record<WarehouseTaskOperationType, string> = {
  receiving: 'Приёмка',
  transfer: 'Перемещение',
  issue: 'Выдача',
  return: 'Возврат',
  writeoff: 'Списание',
  utilization: 'Утиль',
  inventory: 'Инвентаризация',
}

export const WAREHOUSE_TASK_STATUS_LABELS: Record<WarehouseTaskStatus, string> = {
  draft: 'Черновик',
  ready: 'Ждёт',
  assigned: 'Назначена',
  in_progress: 'В работе',
  shipped_by_sender: 'Отгружено',
  awaiting_receiver_confirmation: 'Ждёт приёмки',
  received_by_receiver: 'Принято',
  completed: 'Готово',
  discrepancy: 'Расхождение',
  cancelled: 'Отменена',
  error: 'Ошибка',
}

export const WAREHOUSE_TASK_PRIORITY_LABELS: Record<WarehouseTaskPriority, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
  urgent: 'Срочно',
}

export const WAREHOUSE_TASK_SOURCE_TYPE_LABELS: Record<WarehouseTaskSourceType, string> = {
  auto: 'Авто',
  manual: 'Ручная',
}

export const WAREHOUSE_TASK_SOURCE_DOCUMENT_LABELS: Record<WarehouseTaskSourceDocumentType, string> = {
  request: 'Из заявки',
  supplier_document: 'Из документа поставщика',
  transfer: 'Из перемещения',
  return: 'Из возврата',
  inventory: 'Из инвентаризации',
  discrepancy: 'Из расхождения',
  act: 'Из акта',
  manual: 'Создано вручную',
}

export const WAREHOUSE_TASK_ASSIGNEE_TYPE_LABELS: Record<WarehouseTaskAssigneeType, string> = {
  user: 'Пользователь',
  role: 'Роль',
  warehouse: 'Склад',
  group: 'Группа',
}

export const WAREHOUSE_TASK_CANCEL_REASONS = [
  'ошибка создания',
  'неверный склад',
  'неверный исполнитель',
  'дублирующая задача',
  'товар отсутствует',
  'операция больше не нужна',
  'другое',
] as const

export const WAREHOUSE_TASK_DISCREPANCY_REASONS = [
  'не доехало',
  'повреждена тара',
  'ошибка сканирования',
  'ошибка отправителя',
  'излишек',
  'другое',
] as const

export type WarehouseTaskTab =
  | 'all'
  | 'ready'
  | 'in_progress'
  | 'awaiting'
  | 'discrepancy'
  | 'completed'
  | 'cancelled'

export const WAREHOUSE_TASK_TAB_LABELS: Record<WarehouseTaskTab, string> = {
  all: 'Все',
  ready: 'Ждут',
  in_progress: 'В работе',
  awaiting: 'Ожидают',
  discrepancy: 'Расхождения',
  completed: 'Готовые',
  cancelled: 'Отмена',
}

export function warehouseTaskTab(status: WarehouseTaskStatus): WarehouseTaskTab {
  switch (status) {
    case 'draft':
    case 'ready':
    case 'assigned':
      return 'ready'
    case 'in_progress':
      return 'in_progress'
    case 'shipped_by_sender':
    case 'awaiting_receiver_confirmation':
      return 'awaiting'
    case 'discrepancy':
      return 'discrepancy'
    case 'received_by_receiver':
    case 'completed':
      return 'completed'
    case 'cancelled':
    case 'error':
      return 'cancelled'
    default:
      return 'all'
  }
}

export interface WarehouseTaskEditRules {
  /** можно ли менять состав товаров / план */
  composition: boolean
  /** исполнитель / назначение */
  assignee: boolean
  priority: boolean
  comment: boolean
  /** можно ли удалить физически (только черновик) */
  deletable: boolean
  /** можно ли отменить (с причиной) */
  cancellable: boolean
}

export function warehouseTaskEditRules(status: WarehouseTaskStatus): WarehouseTaskEditRules {
  switch (status) {
    case 'draft':
      return {
        composition: true,
        assignee: true,
        priority: true,
        comment: true,
        deletable: true,
        cancellable: true,
      }
    case 'ready':
    case 'assigned':
      return {
        composition: false,
        assignee: true,
        priority: true,
        comment: true,
        deletable: false,
        cancellable: true,
      }
    case 'in_progress':
    case 'shipped_by_sender':
    case 'awaiting_receiver_confirmation':
      return {
        composition: false,
        assignee: status === 'in_progress',
        priority: false,
        comment: true,
        deletable: false,
        cancellable: true,
      }
    default:
      return {
        composition: false,
        assignee: false,
        priority: false,
        comment: false,
        deletable: false,
        cancellable: false,
      }
  }
}

export function isWarehouseTransferType(type: WarehouseTaskOperationType): boolean {
  return type === 'transfer' || type === 'issue' || type === 'return' || type === 'utilization'
}
