'use client'

import { useState } from 'react'
import { ArrowRight, Send, Pencil, Ban, Trash2, X, Check } from 'lucide-react'
import {
  WAREHOUSE_TASK_ASSIGNEE_TYPE_LABELS,
  WAREHOUSE_TASK_CANCEL_REASONS,
  WAREHOUSE_TASK_DISCREPANCY_REASONS,
  WAREHOUSE_TASK_OPERATION_LABELS,
  WAREHOUSE_TASK_PRIORITY_LABELS,
  WAREHOUSE_TASK_STATUS_LABELS,
  warehouseTaskEditRules,
  type WarehouseTask,
  type WarehouseTaskAssigneeType,
  type WarehouseTaskPriority,
} from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { formatOpDate, priorityBadgeClass, statusBadgeClass } from './operation-format'

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="op-detail__field">
      <span className="op-detail__field-label">{label}</span>
      <span className="op-detail__field-value">{value || '—'}</span>
    </div>
  )
}

export function OperationTaskDetail({
  task,
  onClose,
}: {
  task: WarehouseTask
  onClose: () => void
}) {
  const {
    warehouseTasks,
    operations,
    updateWarehouseTask,
    cancelWarehouseTask,
    deleteWarehouseTask,
    sendWarehouseTaskToTsd,
    resolveWarehouseDiscrepancy,
    confirmOperation,
    rejectOperation,
  } = useDemoStore()

  const [mode, setMode] = useState<'view' | 'edit' | 'cancel'>('view')
  const [editPriority, setEditPriority] = useState<WarehouseTaskPriority>(task.priority)
  const [editAssigneeType, setEditAssigneeType] = useState<WarehouseTaskAssigneeType>(task.assignedToType)
  const [editAssignee, setEditAssignee] = useState(task.assignedToName)
  const [editComment, setEditComment] = useState(task.comment ?? '')
  const [cancelReason, setCancelReason] = useState<string>(WAREHOUSE_TASK_CANCEL_REASONS[0])
  const [discReason, setDiscReason] = useState<string>(task.discrepancyReason ?? WAREHOUSE_TASK_DISCREPANCY_REASONS[0])

  const rules = warehouseTaskEditRules(task.status)
  const linked = task.linkedTaskId
    ? warehouseTasks.find((t) => t.id === task.linkedTaskId)
    : undefined

  const isDiscrepancy = task.status === 'discrepancy'
  const isReturnApproval =
    task.operationType === 'return' && task.status === 'awaiting_receiver_confirmation'
  const pendingReturnOp = isReturnApproval
    ? operations.find(
        (op) =>
          op.type === 'return' &&
          op.documentId === task.sourceDocumentId &&
          op.status === 'waiting_confirmation',
      )
    : undefined
  const diff =
    task.acceptedQty != null && task.expectedQty != null ? task.acceptedQty - task.expectedQty : null

  const run = (res: { ok: boolean; message: string }) => {
    if (res.ok) toast.success(res.message)
    else toast.error(res.message)
    return res.ok
  }

  const saveEdit = () => {
    const ok = run(
      updateWarehouseTask(task.id, {
        priority: rules.priority ? editPriority : undefined,
        assignedToType: rules.assignee ? editAssigneeType : undefined,
        assignedToName: rules.assignee ? editAssignee : undefined,
        comment: rules.comment ? editComment : undefined,
      }),
    )
    if (ok) setMode('view')
  }

  const doCancel = () => {
    if (run(cancelWarehouseTask(task.id, cancelReason))) {
      setMode('view')
      onClose()
    }
  }

  return (
    <aside className="op-detail">
      <header className="op-detail__head">
        <div>
          <div className="op-detail__title-row">
            <h2 className="op-detail__title">
              {task.number} · {WAREHOUSE_TASK_OPERATION_LABELS[task.operationType]}
            </h2>
          </div>
          <div className="op-detail__badges">
            <span className={cn('op-badge', statusBadgeClass(task.status))}>
              {isReturnApproval ? 'Ожидает одобрения' : WAREHOUSE_TASK_STATUS_LABELS[task.status]}
            </span>
            <span className={cn('op-prio', priorityBadgeClass(task.priority))}>
              {WAREHOUSE_TASK_PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>
        <button type="button" className="op-detail__close" onClick={onClose} aria-label="Закрыть">
          <X className="size-5" />
        </button>
      </header>

      <div className="op-detail__body">
        {/* Маршрут */}
        {(task.fromLocationName || task.toLocationName) && (
          <div className="op-route">
            <span className="op-route__node">{task.fromLocationName ?? '—'}</span>
            <ArrowRight className="size-4 shrink-0 text-[var(--app-muted)]" />
            <span className="op-route__node">{task.toLocationName ?? '—'}</span>
          </div>
        )}

        {/* Участники */}
        <section className="op-detail__section">
          <h3 className="op-detail__section-title">Участники</h3>
          <div className="op-detail__grid">
            <Field label="Создал" value={task.createdByName} />
            <Field label="Назначил" value={task.assignedByName} />
            <Field
              label="Поставлена на"
              value={`${task.assignedToName} · ${WAREHOUSE_TASK_ASSIGNEE_TYPE_LABELS[task.assignedToType]}`}
            />
            <Field label="Факт. исполнитель" value={task.actualExecutorName} />
          </div>
        </section>

        {/* Источник */}
        <section className="op-detail__section">
          <h3 className="op-detail__section-title">Источник</h3>
          <div className="op-detail__grid">
            <Field label="Создано" value={formatOpDate(task.createdAt)} />
            <Field label="Источник" value={task.sourceLabel} />
            <Field label="Начато" value={task.startedAt ? formatOpDate(task.startedAt) : undefined} />
            <Field
              label="Завершено"
              value={task.completedAt ? formatOpDate(task.completedAt) : undefined}
            />
          </div>
        </section>

        {/* План / факт */}
        <section className="op-detail__section">
          <h3 className="op-detail__section-title">Количество</h3>
          <div className="op-qty-row">
            <div className="op-qty">
              <span className="op-qty__value">{task.expectedQty ?? '—'}</span>
              <span className="op-qty__label">План</span>
            </div>
            <div className="op-qty">
              <span className="op-qty__value">{task.scannedQty ?? 0}</span>
              <span className="op-qty__label">Отгружено / скан</span>
            </div>
            <div className="op-qty">
              <span className="op-qty__value">{task.acceptedQty ?? 0}</span>
              <span className="op-qty__label">Принято</span>
            </div>
            {diff != null && diff !== 0 ? (
              <div className="op-qty op-qty--warn">
                <span className="op-qty__value">{diff > 0 ? `+${diff}` : diff}</span>
                <span className="op-qty__label">Расхождение</span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Связанные документы */}
        <section className="op-detail__section">
          <h3 className="op-detail__section-title">Связанные документы</h3>
          <div className="op-detail__chips">
            {task.sourceDocumentId ? (
              <span className="op-doc-chip">{task.sourceDocumentId}</span>
            ) : null}
            {linked ? (
              <span className="op-doc-chip">
                Пара {linked.number}
              </span>
            ) : null}
            {!task.sourceDocumentId && !linked ? (
              <span className="text-sm text-[var(--app-muted)]">Нет связанных документов</span>
            ) : null}
          </div>
        </section>

        {task.comment ? (
          <section className="op-detail__section">
            <h3 className="op-detail__section-title">Комментарий</h3>
            <p className="text-sm text-[var(--foreground)]">{task.comment}</p>
          </section>
        ) : null}

        {isReturnApproval ? (
          <section className="op-detail__section op-detail__section--warn">
            <h3 className="op-detail__section-title">Одобрение возврата</h3>
            {pendingReturnOp ? (
              <>
                <p className="mb-2 text-sm text-[var(--foreground)]">
                  {pendingReturnOp.items.map((i) => i.productName).join(', ')} ·{' '}
                  {pendingReturnOp.items.length} поз.
                </p>
                <div className="op-detail__actions">
                  <button
                    type="button"
                    className="op-btn op-btn--primary"
                    onClick={() => {
                      confirmOperation(pendingReturnOp.id)
                      run({ ok: true, message: 'Возврат одобрен' })
                    }}
                  >
                    <Check className="size-4" />
                    Одобрить
                  </button>
                  <button
                    type="button"
                    className="op-btn op-btn--danger"
                    onClick={() => {
                      rejectOperation(pendingReturnOp.id)
                      run({ ok: true, message: 'Возврат отклонён' })
                      onClose()
                    }}
                  >
                    <Ban className="size-4" />
                    Отклонить
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">Операция уже обработана</p>
            )}
          </section>
        ) : null}

        {/* Расхождение */}
        {isDiscrepancy ? (
          <section className="op-detail__section op-detail__section--warn">
            <h3 className="op-detail__section-title">Расхождение</h3>
            <p className="mb-2 text-sm text-[var(--foreground)]">
              План: {task.expectedQty} · Отгружено: {task.scannedQty} · Принято: {task.acceptedQty} ·
              Расхождение: {diff != null && diff > 0 ? `+${diff}` : diff}
            </p>
            <label className="op-field mb-2">
              <span className="op-field__label">Причина</span>
              <select
                className="op-input"
                value={discReason}
                onChange={(e) => setDiscReason(e.target.value)}
              >
                {WAREHOUSE_TASK_DISCREPANCY_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="op-detail__actions">
              <button
                type="button"
                className="op-btn op-btn--primary"
                onClick={() => run(resolveWarehouseDiscrepancy(task.id, 'accept', discReason))}
              >
                Принять с расхождением
              </button>
              <button
                type="button"
                className="op-btn op-btn--secondary"
                onClick={() => run(resolveWarehouseDiscrepancy(task.id, 'recheck'))}
              >
                Вернуть на проверку
              </button>
              <button
                type="button"
                className="op-btn op-btn--danger"
                onClick={() => run(resolveWarehouseDiscrepancy(task.id, 'cancel', discReason))}
              >
                Отменить приёмку
              </button>
            </div>
          </section>
        ) : null}

        {/* Редактирование */}
        {mode === 'edit' ? (
          <section className="op-detail__section op-detail__section--edit">
            <h3 className="op-detail__section-title">Редактирование</h3>
            {rules.assignee ? (
              <div className="op-field-grid mb-2">
                <label className="op-field">
                  <span className="op-field__label">Поставлена на (тип)</span>
                  <select
                    className="op-input"
                    value={editAssigneeType}
                    onChange={(e) => setEditAssigneeType(e.target.value as WarehouseTaskAssigneeType)}
                  >
                    {(['user', 'role', 'warehouse', 'group'] as WarehouseTaskAssigneeType[]).map((t) => (
                      <option key={t} value={t}>
                        {WAREHOUSE_TASK_ASSIGNEE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="op-field">
                  <span className="op-field__label">Исполнитель / роль / склад</span>
                  <input
                    className="op-input"
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                  />
                </label>
              </div>
            ) : null}
            {rules.priority ? (
              <label className="op-field mb-2">
                <span className="op-field__label">Приоритет</span>
                <select
                  className="op-input"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as WarehouseTaskPriority)}
                >
                  {(['low', 'normal', 'high', 'urgent'] as WarehouseTaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {WAREHOUSE_TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {rules.comment ? (
              <label className="op-field mb-2">
                <span className="op-field__label">Комментарий</span>
                <textarea
                  className="op-input op-input--area"
                  rows={2}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                />
              </label>
            ) : null}
            <div className="op-detail__actions">
              <button type="button" className="op-btn op-btn--primary" onClick={saveEdit}>
                <Check className="size-4" /> Сохранить
              </button>
              <button type="button" className="op-btn op-btn--ghost" onClick={() => setMode('view')}>
                Отмена
              </button>
            </div>
          </section>
        ) : null}

        {/* Отмена */}
        {mode === 'cancel' ? (
          <section className="op-detail__section op-detail__section--warn">
            <h3 className="op-detail__section-title">Отмена задачи</h3>
            <label className="op-field mb-2">
              <span className="op-field__label">Причина отмены</span>
              <select
                className="op-input"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                {WAREHOUSE_TASK_CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="op-detail__actions">
              <button type="button" className="op-btn op-btn--danger" onClick={doCancel}>
                Подтвердить отмену
              </button>
              <button type="button" className="op-btn op-btn--ghost" onClick={() => setMode('view')}>
                Назад
              </button>
            </div>
          </section>
        ) : null}

        {/* История */}
        <section className="op-detail__section">
          <h3 className="op-detail__section-title">История</h3>
          <ul className="op-timeline">
            {[...task.history]
              .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
              .map((entry) => (
                <li key={entry.id} className="op-timeline__item">
                  <span className="op-timeline__dot" />
                  <div>
                    <time className="op-timeline__time">{formatOpDate(entry.at)}</time>
                    <p className="op-timeline__text">{entry.text}</p>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      </div>

      {/* Действия */}
      {mode === 'view' ? (
        <footer className="op-detail__foot">
          {(rules.assignee || rules.priority || rules.comment) && (
            <button type="button" className="op-btn op-btn--secondary" onClick={() => setMode('edit')}>
              <Pencil className="size-4" /> Редактировать
            </button>
          )}
          {(task.status === 'draft' || task.status === 'ready' || task.status === 'assigned') && (
            <button
              type="button"
              className="op-btn op-btn--primary"
              onClick={() => run(sendWarehouseTaskToTsd(task.id))}
            >
              <Send className="size-4" /> Отправить на ТСД
            </button>
          )}
          {rules.cancellable && (
            <button type="button" className="op-btn op-btn--ghost" onClick={() => setMode('cancel')}>
              <Ban className="size-4" /> Отменить
            </button>
          )}
          {rules.deletable && (
            <button
              type="button"
              className="op-btn op-btn--danger"
              onClick={() => {
                if (run(deleteWarehouseTask(task.id))) onClose()
              }}
            >
              <Trash2 className="size-4" /> Удалить черновик
            </button>
          )}
        </footer>
      ) : null}
    </aside>
  )
}
