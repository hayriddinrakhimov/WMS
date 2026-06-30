'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  WAREHOUSE_TASK_OPERATION_LABELS,
  type WarehouseTask,
} from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import {
  canisterScanCode,
  canistersForTransferReceive,
  countUniqueScannedCanisters,
  dedupeScanCodesToCanisters,
  isCanisterMarkedScanned,
  mainWarehouseCanistersForSend,
} from '@/lib/transfer-scan'
import { isTransferReceiverTask, isTransferSenderTask } from '@/lib/demo-transfer'
import { isDemoAdjustmentOperation } from '@/lib/ensure-demo-operation'
import { toast } from '@/components/ui/Toaster'
import { TsdShell } from './TsdShell'
import { TsdSimulateScan } from './TsdSimulateScan'
import { formatScanLabel } from './tsd-simulate-scan'
import { warehouseTaskRoute, warehouseTaskSource } from './tsd-warehouse-tasks'

export function TsdWarehouseTaskRunner({
  task,
  onBack,
}: {
  task: WarehouseTask
  onBack: () => void
}) {
  const {
    canisters,
    pallets,
    boxes,
    warehouseTasks,
    tsdShipments,
    completeWarehouseTransferSend,
    completeWarehouseTransferReceive,
    completeDemoWarehouseTask,
    ensureTransferTaskReady,
    ensureWarehouseTaskDemoReady,
    webUser,
  } = useDemoStore()

  const [scanned, setScanned] = useState<string[]>([])
  const isSend = isTransferSenderTask(task)
  const isReceive = isTransferReceiverTask(task)
  const isAdjustment = isDemoAdjustmentOperation(task.operationType)

  const senderTask = useMemo(
    () =>
      task.linkedTaskId ? warehouseTasks.find((t) => t.id === task.linkedTaskId) : undefined,
    [warehouseTasks, task.linkedTaskId],
  )

  const shipment = useMemo(() => {
    if (!isReceive || !task.linkedTaskId) return undefined
    return tsdShipments.find((s) => s.id === `tsd-ship-${task.linkedTaskId}`)
  }, [isReceive, task.linkedTaskId, tsdShipments])

  const eligibleCanisters = useMemo(() => {
    if (isAdjustment) return canisters.filter((c) => c.warehouseId === 'wh-1' || !c.warehouseId)
    if (isSend) return mainWarehouseCanistersForSend(canisters)
    if (isReceive) return canistersForTransferReceive(canisters, shipment, pallets, boxes)
    return []
  }, [canisters, isSend, isReceive, isAdjustment, shipment, pallets, boxes])

  const expectedCount = useMemo(() => {
    const cap = eligibleCanisters.length || 1
    if (isAdjustment) return Math.min(task.expectedQty ?? 1, cap)
    if (isReceive) {
      const plan =
        shipment?.shippedCanisterIds?.length ??
        senderTask?.scannedQty ??
        task.expectedQty ??
        cap
      return Math.min(plan, cap)
    }
    const plan = task.expectedQty ?? cap
    return Math.min(plan, cap)
  }, [isReceive, shipment, senderTask, task.expectedQty, eligibleCanisters.length])

  const scannedCanisterCount = useMemo(
    () => countUniqueScannedCanisters(scanned, canisters, pallets, boxes),
    [scanned, canisters, pallets, boxes],
  )

  const receiveBlocked = false
  const receiveEmpty = isReceive && !eligibleCanisters.length

  const simulateScan = () => {
    if (isAdjustment) {
      ensureWarehouseTaskDemoReady(task.id)
    }
    if (isSend && !eligibleCanisters.length) {
      ensureTransferTaskReady(task.id)
    }
    if (receiveEmpty) {
      toast.error('По этой отгрузке нет канистр в пути — повторите отгрузку с ГС')
      return
    }
    if (isSend && !eligibleCanisters.length) {
      toast.info('Подготавливаем демо-запас… нажмите ещё раз')
      return
    }

    const next = eligibleCanisters.find((c) => !isCanisterMarkedScanned(c, scanned))
    if (!next) {
      toast.info('Нечего сканировать')
      return
    }
    const code = canisterScanCode(next)
    setScanned((prev) => (prev.includes(code) ? prev : [...prev, code]))
    toast.success(`Отсканировано: ${formatScanLabel(code)}`)
  }

  const simulateAll = () => {
    if (receiveEmpty) {
      simulateScan()
      return
    }
    const limit = Math.min(expectedCount, eligibleCanisters.length)
    const codes = eligibleCanisters
      .filter((c) => !isCanisterMarkedScanned(c, scanned))
      .slice(0, limit - scannedCanisterCount)
      .map((c) => canisterScanCode(c))
    if (!codes.length) {
      toast.info('Нечего сканировать')
      return
    }
    setScanned((prev) => dedupeScanCodesToCanisters([...prev, ...codes], canisters, pallets, boxes))
    toast.success(`Отсканировано: ${codes.length}`)
  }

  const finish = () => {
    if (!scannedCanisterCount) {
      toast.error('Сначала отсканируйте')
      return
    }
    if (isSend) ensureTransferTaskReady(task.id)
    if (isAdjustment) ensureWarehouseTaskDemoReady(task.id)
    const codes = dedupeScanCodesToCanisters(scanned, canisters, pallets, boxes)
    const result = isSend
      ? completeWarehouseTransferSend(task.id, codes)
      : isReceive
        ? completeWarehouseTransferReceive(task.id, codes)
        : isAdjustment
          ? completeDemoWarehouseTask(task.id, codes)
          : { ok: false, message: 'Неизвестная операция' }
    if (result.ok) {
      toast.success(result.message)
      onBack()
    } else {
      toast.error(result.message)
    }
  }

  const title = WAREHOUSE_TASK_OPERATION_LABELS[task.operationType]
  const progress = `${scannedCanisterCount} / ${expectedCount}`

  return (
    <TsdShell
      actions={
        <>
          <button
            type="button"
            className="tsd-actions__btn tsd-actions__btn--primary"
            onClick={finish}
          >
            {isSend ? 'Завершить отгрузку' : isAdjustment ? 'Завершить операцию' : 'Завершить приём'}
          </button>
          {scannedCanisterCount < expectedCount ? (
            <button
              type="button"
              className="tsd-actions__btn tsd-actions__btn--secondary"
              onClick={simulateAll}
            >
              Сканировать всё
            </button>
          ) : null}
        </>
      }
    >
      <div className="tsd-runner">
        <header className="tsd-runner__header">
          <button type="button" className="tsd-runner__back" onClick={onBack} aria-label="Назад">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="tsd-runner__type">{title}</p>
            <h1 className="tsd-runner__title">{task.number}</h1>
            <p className="tsd-receipt__meta">
              {warehouseTaskSource(task)}
              {warehouseTaskRoute(task) ? ` · ${warehouseTaskRoute(task)}` : ''}
            </p>
          </div>
        </header>

        <div className="tsd-runner__body">
          {receiveEmpty ? (
            <p className="tsd-receipt__empty tsd-receipt__empty--warn">
              Нет канистр в пути — сначала выполните отгрузку с главного склада
              {senderTask ? ` (${senderTask.number})` : ''}.
            </p>
          ) : null}

          <div className="tsd-receipt__progress">
            <span className="tsd-receipt__progress-label">Отсканировано</span>
            <span className="tsd-receipt__progress-value">{progress}</span>
          </div>

          <TsdSimulateScan
            label="Сканировать"
            hint={`Исполнитель: ${webUser?.name ?? '—'} · в пути: ${eligibleCanisters.length}`}
            onScan={simulateScan}
          />

          {scanned.length ? (
            <ul className="tsd-scanned-list">
              {scanned.map((code) => (
                <li key={code}>{formatScanLabel(code)}</li>
              ))}
            </ul>
          ) : (
            <p className="tsd-receipt__empty">Нажмите «Сканировать» для эмуляции</p>
          )}
        </div>
      </div>
    </TsdShell>
  )
}
