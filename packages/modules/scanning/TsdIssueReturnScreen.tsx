'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import {
  PACKAGE_STATUS_LABELS,
  TSD_TASK_TYPE_LABELS,
  type ReturnCondition,
  type TsdTask,
} from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { TsdShell } from './TsdShell'
import { TsdSimulateScan } from './TsdSimulateScan'
import { formatScanLabel, nextCanisterCode } from './tsd-simulate-scan'

const CHILD_WAREHOUSE_ID = 'wh-field-1'

const RETURN_CONDITIONS: { value: ReturnCondition; label: string }[] = [
  { value: 'empty', label: 'Пустая' },
  { value: 'half_empty', label: 'Полупустая' },
  { value: 'full', label: 'Полная' },
]

export function TsdIssueReturnScreen({
  task,
  onBack,
}: {
  task: TsdTask
  onBack: () => void
}) {
  const { canisters, issueCanisterByScan, returnCanisterByScan, ensureDemoIssueReady, ensureDemoReturnReady } =
    useDemoStore()
  const isIssue = task.type === 'issue'

  useEffect(() => {
    if (isIssue) ensureDemoIssueReady()
    else ensureDemoReturnReady()
  }, [isIssue, ensureDemoIssueReady, ensureDemoReturnReady])

  const [returnCondition, setReturnCondition] = useState<ReturnCondition>('empty')
  const [processed, setProcessed] = useState<string[]>([])
  const [photoAttached, setPhotoAttached] = useState(false)
  const [remainderLiters, setRemainderLiters] = useState('5')

  const eligible = useMemo(() => {
    const status = isIssue ? 'in_storage_child' : 'issued_agronomist'
    return canisters.filter(
      (c) =>
        (!c.warehouseId || c.warehouseId === CHILD_WAREHOUSE_ID) && c.status === status,
    )
  }, [canisters, isIssue])

  const remaining = eligible.filter(
    (c) =>
      !processed.includes(c.serialNumber) && !(c.sgtin && processed.includes(c.sgtin)),
  ).length

  const simulateScan = () => {
    const code = nextCanisterCode(eligible, processed)
    if (!code) {
      toast.info(isIssue ? 'Все канистры выданы' : 'Нет канистр к возврату')
      return
    }

    const result = isIssue
      ? issueCanisterByScan(code, { device: 'tsd' })
      : returnCanisterByScan(code, returnCondition, {
          device: 'tsd',
          photoUrl: returnCondition === 'empty' ? undefined : 'demo-photo://return.jpg',
          remainderLiters:
            returnCondition === 'half_empty' ? Number(remainderLiters) || 5 : undefined,
        })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(result.message)
    setProcessed((prev) => (prev.includes(code) ? prev : [...prev, code]))
  }

  const simulateScanAll = () => {
    let count = 0
    let code = nextCanisterCode(eligible, processed)
    const next = [...processed]
    while (code) {
      const result = isIssue
        ? issueCanisterByScan(code, { device: 'tsd' })
        : returnCanisterByScan(code, returnCondition, {
            device: 'tsd',
            photoUrl: returnCondition === 'empty' ? undefined : 'demo-photo://return.jpg',
            remainderLiters:
              returnCondition === 'half_empty' ? Number(remainderLiters) || 5 : undefined,
          })
      if (!result.ok) break
      next.push(code)
      count++
      code = nextCanisterCode(eligible, next)
    }
    if (!count) {
      toast.info('Нечего сканировать')
      return
    }
    setProcessed(next)
    toast.success(`Обработано канистр: ${count}`)
  }

  return (
    <TsdShell
      actions={
        <>
          {remaining > 1 ? (
            <button
              type="button"
              className="tsd-actions__btn tsd-actions__btn--primary"
              onClick={simulateScanAll}
            >
              {isIssue ? 'Выдать всё' : 'Принять всё'} ({remaining})
            </button>
          ) : null}
          <button type="button" className="tsd-actions__btn tsd-actions__btn--secondary" onClick={onBack}>
            К операциям
          </button>
        </>
      }
    >
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

          <div className="tsd-receipt__progress">
            <span className="tsd-receipt__progress-label">
              {isIssue ? 'К выдаче' : 'К возврату'}
            </span>
            <span className="tsd-receipt__progress-value">{remaining}</span>
          </div>

          {!isIssue ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {RETURN_CONDITIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={
                      returnCondition === opt.value
                        ? 'tsd-actions__btn tsd-actions__btn--primary !min-h-9 !px-3 !py-1.5 !text-xs'
                        : 'tsd-actions__btn tsd-actions__btn--secondary !min-h-9 !px-3 !py-1.5 !text-xs'
                    }
                    onClick={() => setReturnCondition(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {returnCondition !== 'empty' ? (
                <div className="mb-3 space-y-2 rounded-xl border border-[var(--app-border)] p-3">
                  <button
                    type="button"
                    className="tsd-actions__btn tsd-actions__btn--secondary w-full !min-h-9 !text-xs"
                    onClick={() => {
                      setPhotoAttached(true)
                      toast.success('Фото тары (демо)')
                    }}
                  >
                    {photoAttached ? 'Фото приложено ✓' : 'Сфотографировать тару'}
                  </button>
                  {returnCondition === 'half_empty' ? (
                    <label className="block text-xs text-[var(--app-muted)]">
                      Остаток, л
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={remainderLiters}
                        onChange={(e) => setRemainderLiters(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--app-border)] px-2 py-1.5 text-sm"
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          <TsdSimulateScan
            label={isIssue ? 'Сканировать и выдать' : 'Сканировать и принять'}
            hint={
              remaining > 0
                ? `Осталось канистр: ${remaining}`
                : isIssue
                  ? 'Все канистры выданы'
                  : 'Нет выданных канистр'
            }
            disabled={remaining === 0}
            onScan={simulateScan}
          />

          {processed.length ? (
            <ul className="tsd-scanned-list">
              {processed.map((code) => (
                <li key={code}>
                  <Check className="size-4 text-[var(--dash-green)]" />
                  {formatScanLabel(code)}
                </li>
              ))}
            </ul>
          ) : null}

          {eligible.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">Ожидают сканирования</p>
              <ul className="space-y-1 text-xs">
                {eligible.slice(0, 6).map((c) => (
                  <li key={c.id} className="rounded-md border border-[var(--app-border)] px-2 py-1.5">
                    <div className="font-medium">{c.serialNumber}</div>
                    <div className="text-[var(--app-muted)]">{c.productName}</div>
                    <div className="text-[var(--app-accent)]">{PACKAGE_STATUS_LABELS[c.status]}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="tsd-receipt__empty">
              {isIssue ? 'Все канистры выданы' : 'Нет выданных канистр к возврату'}
            </p>
          )}
        </div>
      </div>
    </TsdShell>
  )
}
