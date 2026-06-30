'use client'

import { useMemo } from 'react'
import {
  ClipboardList,
  ClipboardX,
  History,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import {
  type AuditEntry,
  type WarehouseTask,
  type WarehouseTaskOperationType,
} from '@wms/domain'
import { cn } from '@/lib/utils'
import {
  sortWarehouseTasksForTsd,
  warehouseTaskProgress,
  warehouseTaskRoute,
  warehouseTaskSource,
  warehouseTaskStatusLabel,
  warehouseTaskSubtitle,
  warehouseTaskTitle,
  WAREHOUSE_TASK_TSD_STATUS_CLASS,
} from './tsd-warehouse-tasks'
import { formatHistoryTime, tsdHistoryLabel } from './tsd-history-labels'

const TYPE_ICONS: Record<WarehouseTaskOperationType, typeof PackageOpen> = {
  receiving: PackageOpen,
  transfer: PackageCheck,
  issue: UserRound,
  return: RotateCcw,
  writeoff: ClipboardX,
  utilization: ClipboardX,
  inventory: ClipboardList,
}

function TsdTaskCard({
  task,
  onOpen,
}: {
  task: WarehouseTask
  onOpen: () => void
}) {
  const Icon = TYPE_ICONS[task.operationType]
  const current = task.status === 'in_progress' || task.status === 'discrepancy'
  const statusClass = WAREHOUSE_TASK_TSD_STATUS_CLASS[task.status] ?? 'tsd-task-badge--ready'
  const source = warehouseTaskSource(task)
  const route = warehouseTaskRoute(task)
  const progress = warehouseTaskProgress(task)

  return (
    <button
      type="button"
      className={cn('tsd-task2', current && 'tsd-task2--current')}
      onClick={onOpen}
    >
      <span className={cn('tsd-task2__icon', `tsd-task2__icon--${task.operationType}`)}>
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>

      <span className="tsd-task2__body">
        <span className="tsd-task2__head">
          <span className="tsd-task2__identity">
            <span className="tsd-task2__num">{warehouseTaskTitle(task)}</span>
            <span className="tsd-task2__op">{warehouseTaskSubtitle(task)}</span>
          </span>
          <span className={cn('tsd-task-badge', statusClass)}>
            {task.status === 'discrepancy' ? <ShieldAlert className="size-3" /> : null}
            {warehouseTaskStatusLabel(task)}
          </span>
        </span>

        {(source || route) && (
          <span className="tsd-task2__meta">
            {source ? <span className="tsd-task2__meta-line">{source}</span> : null}
            {route ? <span className="tsd-task2__meta-line tsd-task2__meta-line--route">{route}</span> : null}
          </span>
        )}

        {progress ? (
          <span className="tsd-task2__progress">
            <span className="tsd-task2__progress-track" aria-hidden>
              <span
                className="tsd-task2__progress-fill"
                style={{ width: `${progress.percent}%` }}
              />
            </span>
            <span className="tsd-task2__progress-label">
              {progress.scanned.toLocaleString('ru-RU')}
              <span className="text-[var(--app-muted)]">
                {' '}
                / {progress.expected.toLocaleString('ru-RU')}
              </span>
            </span>
          </span>
        ) : null}
      </span>
    </button>
  )
}

export function TsdHomeTasks({
  tasks,
  completedTasks,
  history,
  onOpenTask,
  onOpenHistory,
}: {
  tasks: WarehouseTask[]
  completedTasks: WarehouseTask[]
  history: AuditEntry[]
  onOpenTask: (task: WarehouseTask) => void
  onOpenHistory: () => void
}) {
  const activeTasks = useMemo(() => sortWarehouseTasksForTsd(tasks), [tasks])

  const stats = useMemo(
    () => ({
      total: activeTasks.length,
      active: activeTasks.filter((t) => t.status === 'in_progress').length,
      warn: activeTasks.filter((t) => t.status === 'discrepancy').length,
    }),
    [activeTasks],
  )

  return (
    <div className="tsd-tasks__scroll">
      <div className="tsd-kpi-row">
        <div className="tsd-kpi">
          <span className="tsd-kpi__value">{stats.total}</span>
          <span className="tsd-kpi__label">Задач</span>
        </div>
        <div className="tsd-kpi tsd-kpi--blue">
          <span className="tsd-kpi__value">{stats.active}</span>
          <span className="tsd-kpi__label">В работе</span>
        </div>
        <div className="tsd-kpi tsd-kpi--warn">
          <span className="tsd-kpi__value">{stats.warn}</span>
          <span className="tsd-kpi__label">Расхожд.</span>
        </div>
      </div>

      <section className="tsd-panel">
        <div className="tsd-panel__head">
          <h2 className="tsd-panel__title">Задачи</h2>
          <span className="tsd-panel__count">{activeTasks.length}</span>
        </div>

        {activeTasks.length ? (
          <ul className="tsd-task-cards">
            {activeTasks.map((task) => (
              <li key={task.id}>
                <TsdTaskCard task={task} onOpen={() => onOpenTask(task)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="tsd-empty">
            <ClipboardList className="size-7 text-[var(--app-muted)]" />
            <p>Нет задач</p>
          </div>
        )}
      </section>

      {completedTasks.length ? (
        <section className="tsd-panel tsd-panel--muted">
          <div className="tsd-panel__head">
            <h2 className="tsd-panel__title">Завершённые</h2>
            <span className="tsd-panel__count">{completedTasks.length}</span>
          </div>
          <ul className="tsd-task-cards">
            {completedTasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <TsdTaskCard task={task} onOpen={() => onOpenTask(task)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="tsd-panel">
        <div className="tsd-panel__head">
          <h2 className="tsd-panel__title">История</h2>
          <button type="button" className="tsd-panel__link" onClick={onOpenHistory}>
            <History className="size-3.5" />
            Все
          </button>
        </div>
        {history.length ? (
          <ul className="tsd-feed">
            {history.slice(0, 4).map((entry) => (
              <li key={entry.id} className="tsd-feed__item">
                <span className="tsd-feed__dot" aria-hidden />
                <div className="tsd-feed__content">
                  <time className="tsd-feed__time">{formatHistoryTime(entry.at)}</time>
                  <span className="tsd-feed__text">
                    {tsdHistoryLabel(entry.action)}
                    {entry.barcode ? (
                      <span className="tsd-feed__code"> {entry.barcode}</span>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tsd-feed__empty">Пусто</p>
        )}
      </section>
    </div>
  )
}
