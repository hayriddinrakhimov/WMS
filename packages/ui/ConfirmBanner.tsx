import { Check, X } from 'lucide-react'
import type { Operation } from '@wms/domain'

export function ConfirmBanner({
  operation,
  onConfirm,
  onReject,
}: {
  operation: Operation
  onConfirm: () => void
  onReject: () => void
}) {
  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-950/30">
      <p className="text-sm font-medium">Ожидает подтверждения: {operation.type}</p>
      <p className="mt-0.5 text-xs text-[var(--app-muted)]">
        {operation.items.length} поз. · от {operation.createdBy}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--app-accent)] px-3 py-1.5 text-xs font-medium text-white"
        >
          <Check className="size-3.5" />
          Подтвердить
        </button>
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-xs"
        >
          <X className="size-3.5" />
          Отклонить
        </button>
      </div>
    </div>
  )
}
