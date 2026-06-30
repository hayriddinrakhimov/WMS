'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check } from 'lucide-react'
import {
  DEMO_PALLET_SSCC,
  TSD_QUARANTINE_REASON_LABELS,
  TSD_TASK_TYPE_LABELS,
  type TsdQuarantineReason,
  type TsdTask,
} from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { TsdShell } from './TsdShell'
import { TsdSimulateScan } from './TsdSimulateScan'
import { formatScanLabel, nextScanCodeForTask } from './tsd-simulate-scan'

export function TsdTaskRunner({
  task,
  onBack,
}: {
  task: TsdTask
  onBack: () => void
}) {
  const {
    acceptPalletByScan,
    pallets,
    boxes,
    completeTsdReceiptTask,
    completeTsdShipmentTask,
    completeTsdTransferReceiptTask,
    quarantineTsdTask,
    webUser,
  } = useDemoStore()

  const [scanned, setScanned] = useState<string[]>([])
  const [problemOpen, setProblemOpen] = useState(false)
  const [reason, setReason] = useState<TsdQuarantineReason>('damaged')
  const [note, setNote] = useState('')

  const scanHint = useMemo(() => {
    if (task.type === 'receipt') return 'Эмуляция сканирования палеты'
    if (task.type === 'shipment_by_request') return 'Эмуляция сканирования палеты или коробки'
    return 'Эмуляция сканирования перемещения'
  }, [task.type])

  const simulateScan = () => {
    const code = nextScanCodeForTask(task.type, pallets, boxes, scanned)
    if (!code) {
      toast.info('Больше нечего сканировать')
      return
    }
    setScanned((prev) => (prev.includes(code) ? prev : [...prev, code]))
    toast.success(`Отсканировано: ${formatScanLabel(code)}`)
  }

  const finishTask = () => {
    if (!scanned.length) {
      toast.error('Сначала отсканируйте хотя бы одну единицу')
      return
    }
    const actor = webUser?.name ?? 'Кладовщик'

    if (task.type === 'receipt') {
      const pallet = scanned.find((c) => c.startsWith('00')) ?? scanned[0]!
      const result = acceptPalletByScan(pallet, actor)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      const done = completeTsdReceiptTask(task.id, scanned)
      if (done.ok) toast.success(done.message)
      else toast.error(done.message)
      onBack()
      return
    }

    if (task.type === 'shipment_by_request') {
      const result = completeTsdShipmentTask(task.id, scanned)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      onBack()
      return
    }

    const result = completeTsdTransferReceiptTask(task.id, scanned)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
    onBack()
  }

  const submitQuarantine = () => {
    const code = scanned[0] ?? DEMO_PALLET_SSCC
    const result = quarantineTsdTask(task.id, code, reason, note)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
    onBack()
  }

  const done = task.status === 'completed' || task.status === 'quarantine'

  const bottomActions = !done ? (
    problemOpen ? (
      <button type="button" className="tsd-actions__btn tsd-actions__btn--danger" onClick={submitQuarantine}>
        Отправить в карантин
      </button>
    ) : (
      <>
        <button type="button" className="tsd-actions__btn tsd-actions__btn--primary" onClick={finishTask}>
          Завершить задачу
        </button>
        <button
          type="button"
          className="tsd-actions__btn tsd-actions__btn--secondary"
          onClick={() => setProblemOpen(true)}
        >
          <AlertTriangle className="size-4" />
          Сообщить о проблеме
        </button>
      </>
    )
  ) : (
    <button type="button" className="tsd-actions__btn tsd-actions__btn--secondary" onClick={onBack}>
      К списку задач
    </button>
  )

  return (
    <TsdShell actions={bottomActions}>
      <div className="tsd-runner">
        <header className="tsd-runner__header">
          <button type="button" className="tsd-runner__back" onClick={onBack} aria-label="Назад">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="tsd-runner__type">{TSD_TASK_TYPE_LABELS[task.type]}</p>
            <h1 className="tsd-runner__title">{task.title}</h1>
          </div>
        </header>

        <div className="tsd-runner__body">
          <p className="tsd-runner__desc">{task.description}</p>

          {!done ? (
            <>
              <TsdSimulateScan
                className="tsd-scan-field--hero"
                label="Сканировать"
                hint={scanHint}
                onScan={simulateScan}
              />

              {scanned.length ? (
                <ul className="tsd-scanned-list">
                  {scanned.map((code) => (
                    <li key={code}>
                      <Check className="size-4 text-[var(--dash-green)]" />
                      {code}
                    </li>
                  ))}
                </ul>
              ) : null}

              {problemOpen ? (
                <div className="tsd-problem">
                  <div className="tsd-problem__head">
                    <p className="tsd-problem__title">Карантин задачи</p>
                    <button
                      type="button"
                      className="tsd-problem__cancel"
                      onClick={() => setProblemOpen(false)}
                    >
                      Отмена
                    </button>
                  </div>
                  <label className="tsd-field">
                    <span>Причина</span>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as TsdQuarantineReason)}
                      className="tsd-field__input"
                    >
                      {Object.entries(TSD_QUARANTINE_REASON_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="tsd-field">
                    <span>Комментарий</span>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="tsd-field__input"
                      placeholder="Что не так?"
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : (
            <div className={cn('tsd-done', task.status === 'quarantine' && 'tsd-done--warn')}>
              {task.status === 'completed' ? 'Задача выполнена' : 'Задача в карантине'}
              {task.quarantineReason ? (
                <p className="text-sm text-[var(--app-muted)]">
                  {TSD_QUARANTINE_REASON_LABELS[task.quarantineReason]}
                  {task.quarantineScanCode ? ` · ${task.quarantineScanCode}` : ''}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </TsdShell>
  )
}
