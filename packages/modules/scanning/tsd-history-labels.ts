import type { AuditEntry } from '@wms/domain'

const ACTION_LABELS: Record<string, string> = {
  tsd_scan: 'Скан',
  tsd_receipt_complete: 'Приёмка',
  tsd_op_receipt_complete: 'Акт приёмки',
  tsd_shipment_complete: 'Отгрузка',
  tsd_transfer_receipt_complete: 'Перемещение',
  tsd_issue: 'Выдача',
  tsd_return: 'Возврат',
  tsd_quarantine: 'Карантин',
  tsd_task_start: 'Старт',
  issue_transfer_act: 'Акт',
  create_operation: 'Операция',
}

export function tsdHistoryLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export function selectTsdHistory(auditLog: AuditEntry[], limit: number): AuditEntry[] {
  return [...auditLog]
    .filter(
      (e) =>
        e.device === 'tsd' ||
        e.action.startsWith('tsd_') ||
        e.action === 'issue_transfer_act',
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}

export function formatHistoryTime(at: string): string {
  return new Date(at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
