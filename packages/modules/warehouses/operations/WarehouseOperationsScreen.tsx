'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Download,
  PackageOpen,
  PackageX,
  Plus,
  RefreshCw,
  RotateCcw,
  Truck,
  UserRound,
} from 'lucide-react'
import {
  WAREHOUSE_TASK_OPERATION_LABELS,
  WAREHOUSE_TASK_SOURCE_TYPE_LABELS,
  WAREHOUSE_TASK_STATUS_LABELS,
  WAREHOUSE_TASK_TAB_LABELS,
  warehouseTaskTab,
  type WarehouseTask,
  type WarehouseTaskOperationType,
  type WarehouseTaskSourceType,
  type WarehouseTaskTab,
} from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import type { CreateWarehouseTaskInput } from '@/lib/demo-store'
import { ModulePageLayout } from '../../shared/ModulePageLayout'
import {
  ModuleToolbar,
  ModuleToolbarButton,
  ModuleToolbarChips,
  ModuleToolbarSearch,
} from '../../shared/ModuleToolbar'
import { cn } from '@/lib/utils'
import { CreateOperationModal } from './CreateOperationModal'
import { OperationTaskDetail } from './OperationTaskDetail'
import { formatPlanFact, formatOpDate, statusBadgeClass } from './operation-format'

const TABS: WarehouseTaskTab[] = [
  'all',
  'ready',
  'in_progress',
  'awaiting',
  'discrepancy',
  'completed',
  'cancelled',
]

const TYPE_ICONS: Record<WarehouseTaskOperationType, typeof PackageOpen> = {
  receiving: PackageOpen,
  transfer: Truck,
  issue: UserRound,
  return: RotateCcw,
  writeoff: PackageX,
  utilization: PackageX,
  inventory: ClipboardList,
}

export function WarehouseOperationsScreen({
  onBack,
  initialTab,
  initialTaskId,
}: {
  onBack: () => void
  initialTab?: WarehouseTaskTab
  initialTaskId?: string
}) {
  const { warehouseTasks, createWarehouseTask, refreshActiveWorkTab } = useDemoStore()

  const [tab, setTab] = useState<WarehouseTaskTab>(initialTab ?? 'all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<WarehouseTaskOperationType | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<WarehouseTaskSourceType | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(initialTaskId ?? null)

  const activeTask = useMemo(
    () => warehouseTasks.find((t) => t.id === activeId) ?? null,
    [warehouseTasks, activeId],
  )

  const counts = useMemo(() => {
    const map: Record<WarehouseTaskTab, number> = {
      all: warehouseTasks.length,
      ready: 0,
      in_progress: 0,
      awaiting: 0,
      discrepancy: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const t of warehouseTasks) map[warehouseTaskTab(t.status)] += 1
    return map
  }, [warehouseTasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return warehouseTasks.filter((t) => {
      if (tab !== 'all' && warehouseTaskTab(t.status) !== tab) return false
      if (typeFilter !== 'all' && t.operationType !== typeFilter) return false
      if (sourceFilter !== 'all' && t.sourceType !== sourceFilter) return false
      if (q) {
        const hay = [
          t.number,
          WAREHOUSE_TASK_OPERATION_LABELS[t.operationType],
          t.assignedToName,
          t.actualExecutorName,
          t.assignedByName,
          t.fromLocationName,
          t.toLocationName,
          t.sourceLabel,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [warehouseTasks, tab, typeFilter, sourceFilter, search])

  const handleCreate = (
    input: CreateWarehouseTaskInput,
    mode: 'draft' | 'create' | 'send_to_tsd',
  ) => {
    const res = createWarehouseTask(input, mode)
    if (res.ok) {
      toast.success(res.message)
      setCreateOpen(false)
      if (res.taskId) setActiveId(res.taskId)
    } else {
      toast.error(res.message)
    }
  }

  const handleRefresh = () => {
    refreshActiveWorkTab()
    toast.info('Список операций обновлён')
  }

  const toolbar = (
    <ModuleToolbar
      left={
        <button type="button" className="op-back" onClick={onBack}>
          <ArrowLeft className="size-4" />
          <span>Склады</span>
        </button>
      }
      center={
        <ModuleToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder="Поиск по №, типу, исполнителю…"
        />
      }
      right={
        <>
          <ModuleToolbarButton
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Создать
          </ModuleToolbarButton>
          <ModuleToolbarButton
            icon={<RefreshCw className="size-4" />}
            onClick={handleRefresh}
            ariaLabel="Обновить"
          />
          <ModuleToolbarButton
            icon={<Download className="size-4" />}
            onClick={() => toast.info('Демо: экспорт списка операций')}
            ariaLabel="Экспорт"
          />
        </>
      }
      subRow={
        <div className="op-subrow">
          <ModuleToolbarChips
            items={TABS.map((t) => ({
              id: t,
              label: `${WAREHOUSE_TASK_TAB_LABELS[t]}${counts[t] ? ` · ${counts[t]}` : ''}`,
            }))}
            activeId={tab}
            onSelect={(id) => setTab(id as WarehouseTaskTab)}
          />
          <div className="op-filters">
            <select
              className="op-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as WarehouseTaskOperationType | 'all')}
            >
              <option value="all">Все типы</option>
              {(Object.keys(WAREHOUSE_TASK_OPERATION_LABELS) as WarehouseTaskOperationType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {WAREHOUSE_TASK_OPERATION_LABELS[t]}
                  </option>
                ),
              )}
            </select>
            <select
              className="op-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as WarehouseTaskSourceType | 'all')}
            >
              <option value="all">Любой источник</option>
              {(Object.keys(WAREHOUSE_TASK_SOURCE_TYPE_LABELS) as WarehouseTaskSourceType[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {WAREHOUSE_TASK_SOURCE_TYPE_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      }
    />
  )

  return (
    <ModulePageLayout toolbar={toolbar}>
      <div className="op-screen">
        <div className="op-screen__main">
          <header className="op-page-head">
            <h1 className="op-page-head__title">Операции</h1>
          </header>

          <div className="op-kpi-row">
            <button
              type="button"
              className={cn('op-kpi', tab === 'ready' && 'op-kpi--active')}
              onClick={() => setTab('ready')}
            >
              <span className="op-kpi__value">{counts.ready}</span>
              <span className="op-kpi__label">Ждут</span>
            </button>
            <button
              type="button"
              className={cn('op-kpi op-kpi--blue', tab === 'in_progress' && 'op-kpi--active')}
              onClick={() => setTab('in_progress')}
            >
              <span className="op-kpi__value">{counts.in_progress}</span>
              <span className="op-kpi__label">В работе</span>
            </button>
            <button
              type="button"
              className={cn('op-kpi op-kpi--amber', tab === 'awaiting' && 'op-kpi--active')}
              onClick={() => setTab('awaiting')}
            >
              <span className="op-kpi__value">{counts.awaiting}</span>
              <span className="op-kpi__label">Ожидают</span>
            </button>
            <button
              type="button"
              className={cn('op-kpi op-kpi--warn', tab === 'discrepancy' && 'op-kpi--active')}
              onClick={() => setTab('discrepancy')}
            >
              <span className="op-kpi__value">{counts.discrepancy}</span>
              <span className="op-kpi__label">Расхожд.</span>
            </button>
          </div>

          <div className="module-content-table op-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Статус</th>
                  <th>Исполнитель</th>
                  <th className="text-right">План / Факт</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="op-table__empty">
                      <div className="op-empty">
                        <ClipboardList className="size-8 text-[var(--app-muted)]" />
                        <p>Задач не найдено</p>
                        <span>Попробуйте сменить фильтр или создайте новую операцию</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((task: WarehouseTask) => {
                    const Icon = TYPE_ICONS[task.operationType]
                    return (
                      <tr
                        key={task.id}
                        className={cn('op-row', activeId === task.id && 'op-row--active')}
                        onClick={() => setActiveId(task.id)}
                      >
                        <td>
                          <div className="op-cell-task">
                            <span
                              className={cn(
                                'op-cell-task__icon',
                                `op-cell-task__icon--${task.operationType}`,
                              )}
                            >
                              <Icon className="size-4" strokeWidth={1.9} />
                            </span>
                            <div className="op-cell-task__main">
                              <span className="op-cell-task__title">
                                {task.number} · {WAREHOUSE_TASK_OPERATION_LABELS[task.operationType]}
                              </span>
                              {(task.fromLocationName || task.toLocationName) && (
                                <span className="op-cell-task__route">
                                  {task.fromLocationName ?? '—'}
                                  <ArrowRight className="mx-1 inline size-3" />
                                  {task.toLocationName ?? '—'}
                                </span>
                              )}
                              <span className="op-cell-task__meta">{task.assignedToName}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={cn('op-badge', statusBadgeClass(task.status))}>
                            {WAREHOUSE_TASK_STATUS_LABELS[task.status]}
                          </span>
                        </td>
                        <td>
                          <span
                            className={cn(
                              'op-cell-executor',
                              !task.actualExecutorName && 'op-cell-executor--empty',
                            )}
                          >
                            {task.actualExecutorName ?? task.assignedToName}
                          </span>
                        </td>
                        <td className="text-right tabular-nums font-medium">
                          {formatPlanFact(task.expectedQty, task.acceptedQty ?? task.scannedQty)}
                        </td>
                        <td className="whitespace-nowrap text-[var(--app-muted)]">
                          {formatOpDate(task.createdAt)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {activeTask ? (
          <>
            <button
              type="button"
              className="op-screen__backdrop"
              aria-label="Закрыть карточку"
              onClick={() => setActiveId(null)}
            />
            <OperationTaskDetail task={activeTask} onClose={() => setActiveId(null)} />
          </>
        ) : null}
      </div>

      {createOpen ? (
        <CreateOperationModal onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
      ) : null}
    </ModulePageLayout>
  )
}
