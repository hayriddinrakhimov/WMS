import type { WarehouseTaskPriority, WarehouseTaskStatus } from '@wms/domain'

export function statusBadgeClass(status: WarehouseTaskStatus): string {
  switch (status) {
    case 'draft':
      return 'op-badge--draft'
    case 'ready':
    case 'assigned':
      return 'op-badge--ready'
    case 'in_progress':
      return 'op-badge--active'
    case 'shipped_by_sender':
    case 'awaiting_receiver_confirmation':
      return 'op-badge--awaiting'
    case 'received_by_receiver':
    case 'completed':
      return 'op-badge--done'
    case 'discrepancy':
      return 'op-badge--warn'
    case 'cancelled':
      return 'op-badge--cancelled'
    case 'error':
      return 'op-badge--error'
    default:
      return 'op-badge--draft'
  }
}

export function priorityBadgeClass(priority: WarehouseTaskPriority): string {
  switch (priority) {
    case 'urgent':
      return 'op-prio--urgent'
    case 'high':
      return 'op-prio--high'
    case 'low':
      return 'op-prio--low'
    default:
      return 'op-prio--normal'
  }
}

export function formatOpDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPlanFact(expected?: number, fact?: number): string {
  if (expected == null && fact == null) return '—'
  return `${fact ?? 0} / ${expected ?? 0}`
}
