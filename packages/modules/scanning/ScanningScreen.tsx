'use client'

import { useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { useTsdShell } from '@/components/web/TsdShellContext'
import { getWarehouseName } from '@/lib/auth'
import { toast } from '@/components/ui/Toaster'
import type { ModuleRenderContext, TsdTask, WarehouseTask, ExpectedReceipt } from '@wms/domain'
import { TsdIssueReturnScreen } from './TsdIssueReturnScreen'
import { TsdShell } from './TsdShell'
import { TsdOpReceiptScreen } from './TsdOpReceiptScreen'
import { TsdHomeTasks } from './TsdHomeTasks'
import { TsdTopNav } from './TsdTopNav'
import { TsdHistoryPanel } from './TsdHistoryPanel'
import { TsdStartOperationButton, TsdOperationSheet } from './TsdStartOperation'
import { TsdWarehouseTaskRunner } from './TsdWarehouseTaskRunner'
import { TsdReturnApprovalScreen } from './TsdReturnApprovalScreen'
import { selectTsdHistory } from './tsd-history-labels'
import {
  completedWarehouseTasksForTsd,
  resolveExpectedReceiptForWarehouseTask,
  warehouseTasksForTsdUser,
} from './tsd-warehouse-tasks'

type ActiveView =
  | { kind: 'home' }
  | { kind: 'history' }
  | { kind: 'receipt'; expectedReceiptId: string; warehouseTaskId?: string }
  | { kind: 'warehouse'; warehouseTaskId: string }
  | { kind: 'issue' }
  | { kind: 'return'; basisTaskId?: string }
  | { kind: 'return-approval'; warehouseTaskId: string }

const AUTONOMOUS_ISSUE_TASK: TsdTask = {
  id: 'tsd-issue-auto',
  type: 'issue',
  title: 'Выдача агроному',
  description: 'Автономная выдача с дочернего склада',
  status: 'in_progress',
  sortOrder: 0,
}

const AUTONOMOUS_RETURN_TASK: TsdTask = {
  id: 'tsd-return-auto',
  type: 'return',
  title: 'Возврат с поля',
  description: 'По акту выдачи',
  status: 'in_progress',
  sortOrder: 0,
}

export function ScanningScreen({ user }: ModuleRenderContext) {
  const {
    warehouseTasks,
    expectedReceipts,
    consolidatedDemands,
    procurementRequests,
    operations,
    startWarehouseTaskOnTsd,
    ensureReceivingExpectedReceipt,
    ensureTransferTaskReady,
    ensureWarehouseTaskDemoReady,
    ensureDemoIssueReady,
    ensureDemoReturnReady,
    ensureReturnApprovalDemo,
    completeDemoWarehouseTask,
    auditLog,
    refreshActiveWorkTab,
  } = useDemoStore()
  const { onOpenMenu } = useTsdShell()

  const [view, setView] = useState<ActiveView>({ kind: 'home' })
  const [operationSheetOpen, setOperationSheetOpen] = useState(false)

  const history = useMemo(() => selectTsdHistory(auditLog, 20), [auditLog])

  const myWarehouseTasks = useMemo(
    () => (user ? warehouseTasksForTsdUser(warehouseTasks, user, procurementRequests) : []),
    [warehouseTasks, user, procurementRequests],
  )

  const completedTasks = useMemo(
    () => (user ? completedWarehouseTasksForTsd(warehouseTasks, user) : []),
    [warehouseTasks, user],
  )

  const activeWarehouseTask = useMemo(() => {
    if (view.kind !== 'warehouse') return null
    return warehouseTasks.find((t) => t.id === view.warehouseTaskId) ?? null
  }, [warehouseTasks, view])

  const activeReceipt = useMemo(() => {
    if (view.kind !== 'receipt') return null
    return expectedReceipts.find((er) => er.id === view.expectedReceiptId) ?? null
  }, [expectedReceipts, view])

  const openWarehouseTask = (warehouseTask: WarehouseTask) => {
    const demo = ensureWarehouseTaskDemoReady(warehouseTask.id)
    if (!demo.ok) {
      toast.error(demo.message)
      return
    }

    startWarehouseTaskOnTsd(warehouseTask.id)

    if (warehouseTask.operationType === 'receiving') {
      const receiptId =
        demo.receiptId ??
        resolveExpectedReceiptForWarehouseTask(warehouseTask, expectedReceipts)?.id
      setView({
        kind: 'receipt',
        expectedReceiptId: receiptId ?? 'er-001',
        warehouseTaskId: warehouseTask.id,
      })
      return
    }

    if (warehouseTask.operationType === 'transfer') {
      setView({ kind: 'warehouse', warehouseTaskId: warehouseTask.id })
      return
    }

    if (warehouseTask.operationType === 'issue') {
      setView({ kind: 'issue' })
      return
    }

    if (warehouseTask.operationType === 'return') {
      if (warehouseTask.status === 'awaiting_receiver_confirmation') {
        setView({ kind: 'return-approval', warehouseTaskId: warehouseTask.id })
      } else {
        setView({ kind: 'return', basisTaskId: warehouseTask.id })
      }
      return
    }

    if (
      warehouseTask.operationType === 'writeoff' ||
      warehouseTask.operationType === 'utilization' ||
      warehouseTask.operationType === 'inventory'
    ) {
      setView({ kind: 'warehouse', warehouseTaskId: warehouseTask.id })
      return
    }

    toast.info(`Операция ${warehouseTask.number} пока не поддерживается на ТСД`)
  }

  const openExpectedReceipt = (receipt: ExpectedReceipt) => {
    const linkedTask = warehouseTasks.find(
      (t) =>
        t.operationType === 'receiving' &&
        (t.sourceDocumentId === receipt.id || t.sourceLabel === receipt.number),
    )
    if (linkedTask) {
      openWarehouseTask(linkedTask)
      return
    }
    setView({ kind: 'receipt', expectedReceiptId: receipt.id })
  }

  const handleRefresh = () => {
    refreshActiveWorkTab()
    toast.info('Обновлено')
  }

  const approvalReturnTask = useMemo(() => {
    if (view.kind !== 'return-approval') return null
    return warehouseTasks.find((t) => t.id === view.warehouseTaskId) ?? null
  }, [warehouseTasks, view])

  const approvalReturnOp = useMemo(() => {
    if (!approvalReturnTask?.sourceDocumentId) return undefined
    return operations.find(
      (op) =>
        op.type === 'return' &&
        op.documentId === approvalReturnTask.sourceDocumentId &&
        op.status === 'waiting_confirmation',
    )
  }, [approvalReturnTask, operations])

  if (!user) return null

  if (view.kind === 'history') {
    return <TsdHistoryPanel onBack={() => setView({ kind: 'home' })} />
  }

  if (activeReceipt) {
    return (
      <TsdOpReceiptScreen
        receipt={activeReceipt}
        warehouseTaskId={view.kind === 'receipt' ? view.warehouseTaskId : undefined}
        onBack={() => setView({ kind: 'home' })}
      />
    )
  }

  if (activeWarehouseTask) {
    return (
      <TsdWarehouseTaskRunner task={activeWarehouseTask} onBack={() => setView({ kind: 'home' })} />
    )
  }

  if (view.kind === 'return-approval' && approvalReturnTask) {
    return (
      <TsdReturnApprovalScreen
        task={approvalReturnTask}
        pendingOp={approvalReturnOp}
        onBack={() => setView({ kind: 'home' })}
      />
    )
  }

  if (view.kind === 'issue') {
    return <TsdIssueReturnScreen task={AUTONOMOUS_ISSUE_TASK} onBack={() => setView({ kind: 'home' })} />
  }

  if (view.kind === 'return') {
    return <TsdIssueReturnScreen task={AUTONOMOUS_RETURN_TASK} onBack={() => setView({ kind: 'home' })} />
  }

  const warehouseLabel = getWarehouseName(user.warehouseId) ?? 'Все склады'

  return (
    <TsdShell
      overlay={
        <TsdOperationSheet
          open={operationSheetOpen}
          onClose={() => setOperationSheetOpen(false)}
          tasks={myWarehouseTasks}
          expectedReceipts={expectedReceipts}
          consolidatedDemands={consolidatedDemands}
          onPickTask={openWarehouseTask}
          onPickExpectedReceipt={openExpectedReceipt}
          onAutonomousIssue={() => {
            ensureDemoIssueReady()
            setView({ kind: 'issue' })
          }}
          onAutonomousReturn={() => {
            ensureDemoReturnReady()
            setView({ kind: 'return' })
          }}
        />
      }
      actions={
        operationSheetOpen ? null : (
          <TsdStartOperationButton onClick={() => setOperationSheetOpen(true)} />
        )
      }
    >
      <div className="tsd-home tsd-home--tasks">
        <TsdTopNav
          title={warehouseLabel}
          subtitle={user.name}
          onRefresh={handleRefresh}
          onSettings={onOpenMenu}
        />
        <div className="tsd-tasks">
          <TsdHomeTasks
            tasks={myWarehouseTasks}
            completedTasks={completedTasks}
            history={history}
            onOpenTask={openWarehouseTask}
            onOpenHistory={() => setView({ kind: 'history' })}
          />
        </div>
      </div>
    </TsdShell>
  )
}
