'use client'

import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import type { Operation, WarehouseTask } from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { TsdShell } from './TsdShell'
import { TsdTopNav } from './TsdTopNav'

export function TsdReturnApprovalScreen({
  task,
  pendingOp,
  onBack,
}: {
  task: WarehouseTask
  pendingOp: Operation | undefined
  onBack: () => void
}) {
  const { confirmOperation, rejectOperation, ensureReturnApprovalDemo, operations } = useDemoStore()

  useEffect(() => {
    ensureReturnApprovalDemo(task.id)
  }, [task.id, ensureReturnApprovalDemo])

  const activeOp =
    pendingOp ??
    operations.find(
      (op) =>
        op.type === 'return' &&
        op.status === 'waiting_confirmation' &&
        (op.documentId === task.sourceDocumentId || op.id === task.sourceDocumentId),
    )

  const handleConfirm = () => {
    if (!activeOp) {
      toast.error('Операция не найдена')
      return
    }
    confirmOperation(activeOp.id, 'tsd')
    toast.success('Возврат одобрен')
    onBack()
  }

  const handleReject = () => {
    if (!activeOp) {
      toast.error('Операция не найдена')
      return
    }
    rejectOperation(activeOp.id, 'tsd')
    toast.info('Возврат отклонён')
    onBack()
  }

  return (
    <TsdShell>
      <div className="tsd-home tsd-home--tasks">
        <TsdTopNav title={task.number} subtitle="Одобрение возврата" onBack={onBack} />
        <div className="tsd-panel tsd-panel--muted flex flex-1 flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-medium">{task.sourceLabel}</p>
            {task.comment ? (
              <p className="mt-1 text-xs text-[var(--app-muted)]">{task.comment}</p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              {task.fromLocationName} → {task.toLocationName}
            </p>
          </div>

          {activeOp ? (
            <ul className="space-y-2 text-sm">
              {activeOp.items.map((item) => (
                <li key={item.id} className="rounded-lg border border-[var(--app-border)] bg-white p-3">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-[var(--app-muted)]">{item.barcode}</p>
                  {item.remainder != null ? (
                    <p className="mt-1 text-xs">Остаток: {item.remainder} л</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--app-muted)]">Операция уже обработана</p>
          )}

          {activeOp ? (
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-medium text-white"
                onClick={handleConfirm}
              >
                <Check className="size-4" />
                Одобрить
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] py-3 text-sm font-medium"
                onClick={handleReject}
              >
                <X className="size-4" />
                Отклонить
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </TsdShell>
  )
}
