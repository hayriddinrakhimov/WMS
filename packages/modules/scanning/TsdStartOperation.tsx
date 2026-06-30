'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, PackageOpen, Play, UserRound } from 'lucide-react'
import type { ConsolidatedDemand, ExpectedReceipt, WarehouseTask } from '@wms/domain'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { TsdBottomSheet } from './TsdBottomSheet'
import {
  openExpectedReceiptsForTsd,
  warehouseTaskPickerLabel,
} from './tsd-warehouse-tasks'

export function TsdStartOperationButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="tsd-actions__btn tsd-actions__btn--primary" onClick={onClick}>
      <Play className="size-5" />
      Начать операцию
    </button>
  )
}

type Step = 'menu' | 'receipt' | 'warehouse'

type ReceiptPick =
  | { kind: 'task'; task: WarehouseTask }
  | { kind: 'er'; receipt: ExpectedReceipt }

export function TsdOperationSheet({
  open,
  onClose,
  tasks,
  expectedReceipts,
  consolidatedDemands,
  onPickTask,
  onPickExpectedReceipt,
  onAutonomousIssue,
  onAutonomousReturn,
}: {
  open: boolean
  onClose: () => void
  tasks: WarehouseTask[]
  expectedReceipts: ExpectedReceipt[]
  consolidatedDemands: ConsolidatedDemand[]
  onPickTask: (task: WarehouseTask) => void
  onPickExpectedReceipt: (receipt: ExpectedReceipt) => void
  onAutonomousIssue: () => void
  onAutonomousReturn: () => void
}) {
  const [step, setStep] = useState<Step>('menu')

  const receivingTasks = useMemo(
    () => tasks.filter((t) => t.operationType === 'receiving'),
    [tasks],
  )

  const warehouseTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.operationType === 'transfer' ||
          (t.operationType === 'return' && t.status !== 'completed'),
      ),
    [tasks],
  )

  const openReceipts = useMemo(
    () => openExpectedReceiptsForTsd(expectedReceipts),
    [expectedReceipts],
  )

  const receiptOptions: ReceiptPick[] = useMemo(() => {
    const picks: ReceiptPick[] = receivingTasks.map((task) => ({ kind: 'task', task }))
    const linkedErIds = new Set(
      receivingTasks
        .map((t) => t.sourceDocumentId)
        .filter((id): id is string => Boolean(id)),
    )
    for (const er of openReceipts) {
      if (!linkedErIds.has(er.id)) {
        picks.push({ kind: 'er', receipt: er })
      }
    }
    return picks
  }, [receivingTasks, openReceipts])

  const reset = () => setStep('menu')

  const close = () => {
    reset()
    onClose()
  }

  const pickReceipt = (pick: ReceiptPick) => {
    close()
    if (pick.kind === 'task') {
      onPickTask(pick.task)
      return
    }
    onPickExpectedReceipt(pick.receipt)
  }

  const receiptHint = (er: ExpectedReceipt) => {
    const demand = er.consolidatedDemandId
      ? consolidatedDemands.find((d) => d.id === er.consolidatedDemandId)
      : consolidatedDemands.find((d) => d.number === er.consolidatedDemandNumber)
    const sv = demand?.number ?? er.consolidatedDemandNumber
    const parts = [sv ? `Сводная ${sv}` : null, er.palletCount ? `${er.palletCount} пал` : null, '→ Главный склад']
    return parts.filter(Boolean).join(' · ')
  }

  const title =
    step === 'menu'
      ? 'Начать операцию'
      : step === 'receipt'
        ? 'Приёмка ОП'
        : 'Складская задача'

  return (
    <TsdBottomSheet open={open} title={title} onClose={close}>
      {step === 'menu' ? (
        <ul className="tsd-sheet__list">
          <li>
            <button
              type="button"
              className="tsd-sheet__item"
              onClick={() => {
                if (!receiptOptions.length) {
                  toast.info('Нет ОП к приёмке — загрузите Упак в снабжении')
                  return
                }
                setStep('receipt')
              }}
            >
              <span className={cn('tsd-sheet__icon', 'tsd-sheet__icon--transfer_receipt')}>
                <PackageOpen className="size-5" strokeWidth={1.9} />
              </span>
              <span className="tsd-sheet__body">
                <span className="tsd-sheet__label">Приёмка ОП</span>
                <span className="tsd-sheet__hint">
                  {receiptOptions.length
                    ? `По сводной · ${receiptOptions.length} к приёмке на ГС`
                    : 'Ожидает загрузки Упак'}
                </span>
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="tsd-sheet__item"
              onClick={() => {
                if (!warehouseTasks.length) {
                  toast.info('Нет задач перемещения или возврата')
                  return
                }
                setStep('warehouse')
              }}
            >
              <span className={cn('tsd-sheet__icon', 'tsd-sheet__icon--shipment_by_request')}>
                <ArrowLeftRight className="size-5" strokeWidth={1.9} />
              </span>
              <span className="tsd-sheet__body">
                <span className="tsd-sheet__label">Перемещение и возврат</span>
                <span className="tsd-sheet__hint">По складской задаче-основанию</span>
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="tsd-sheet__item"
              onClick={() => {
                close()
                onAutonomousIssue()
              }}
            >
              <span className={cn('tsd-sheet__icon', 'tsd-sheet__icon--issue')}>
                <UserRound className="size-5" strokeWidth={1.9} />
              </span>
              <span className="tsd-sheet__body">
                <span className="tsd-sheet__label">Выдача агроному</span>
                <span className="tsd-sheet__hint">Автономно, без задачи-основания</span>
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="tsd-sheet__item"
              onClick={() => {
                close()
                onAutonomousReturn()
              }}
            >
              <span className={cn('tsd-sheet__icon', 'tsd-sheet__icon--return')}>
                <UserRound className="size-5" strokeWidth={1.9} />
              </span>
              <span className="tsd-sheet__body">
                <span className="tsd-sheet__label">Возврат с поля</span>
                <span className="tsd-sheet__hint">По акту выдачи · фото при непустой таре</span>
              </span>
            </button>
          </li>
        </ul>
      ) : null}

      {step === 'receipt' ? (
        <ul className="tsd-sheet__list">
          {receiptOptions.map((pick) => {
            if (pick.kind === 'task') {
              const { label, hint } = warehouseTaskPickerLabel(
                pick.task,
                expectedReceipts,
                consolidatedDemands,
              )
              return (
                <li key={pick.task.id}>
                  <button type="button" className="tsd-sheet__item" onClick={() => pickReceipt(pick)}>
                    <span className="tsd-sheet__body">
                      <span className="tsd-sheet__label">{label}</span>
                      <span className="tsd-sheet__hint">{hint}</span>
                    </span>
                  </button>
                </li>
              )
            }
            return (
              <li key={pick.receipt.id}>
                <button type="button" className="tsd-sheet__item" onClick={() => pickReceipt(pick)}>
                  <span className="tsd-sheet__body">
                    <span className="tsd-sheet__label">Приёмка {pick.receipt.number}</span>
                    <span className="tsd-sheet__hint">{receiptHint(pick.receipt)}</span>
                  </span>
                </button>
              </li>
            )
          })}
          <li>
            <button type="button" className="tsd-sheet__link-btn" onClick={() => setStep('menu')}>
              ← Назад
            </button>
          </li>
        </ul>
      ) : null}

      {step === 'warehouse' ? (
        <ul className="tsd-sheet__list">
          {warehouseTasks.map((task) => {
            const { label, hint } = warehouseTaskPickerLabel(
              task,
              expectedReceipts,
              consolidatedDemands,
            )
            return (
              <li key={task.id}>
                <button
                  type="button"
                  className="tsd-sheet__item"
                  onClick={() => {
                    close()
                    onPickTask(task)
                  }}
                >
                  <span className="tsd-sheet__body">
                    <span className="tsd-sheet__label">{label}</span>
                    <span className="tsd-sheet__hint">{hint}</span>
                  </span>
                </button>
              </li>
            )
          })}
          <li>
            <button type="button" className="tsd-sheet__link-btn" onClick={() => setStep('menu')}>
              ← Назад
            </button>
          </li>
        </ul>
      ) : null}
    </TsdBottomSheet>
  )
}
