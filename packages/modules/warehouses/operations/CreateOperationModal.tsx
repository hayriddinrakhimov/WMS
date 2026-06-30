'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import {
  WAREHOUSE_TASK_ASSIGNEE_TYPE_LABELS,
  WAREHOUSE_TASK_OPERATION_LABELS,
  WAREHOUSE_TASK_PRIORITY_LABELS,
  type WarehouseTaskAssigneeType,
  type WarehouseTaskOperationType,
  type WarehouseTaskPriority,
} from '@wms/domain'
import type { CreateWarehouseTaskInput } from '@/lib/demo-store'
import { cn } from '@/lib/utils'

const OPERATION_TYPES: WarehouseTaskOperationType[] = [
  'receiving',
  'transfer',
  'issue',
  'return',
  'writeoff',
  'utilization',
  'inventory',
]

const PRIORITIES: WarehouseTaskPriority[] = ['low', 'normal', 'high', 'urgent']

const ASSIGNEE_TYPES: WarehouseTaskAssigneeType[] = ['user', 'role', 'warehouse', 'group']

const SOURCE_OPTIONS = [
  'Создано вручную',
  'Из заявки',
  'Из документа приёмки',
  'Из документа перемещения',
  'Из акта',
]

const LOCATION_OPTIONS = [
  'Главный склад',
  'Дочерний склад №1',
  'Дочерний склад №2',
  'Агроном Иванов',
  'Утиль',
  'Списание',
  'Поставщик «Август»',
]

export function CreateOperationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (input: CreateWarehouseTaskInput, mode: 'draft' | 'create' | 'send_to_tsd') => void
}) {
  const [operationType, setOperationType] = useState<WarehouseTaskOperationType>('transfer')
  const [fromLocationName, setFromLocationName] = useState('Главный склад')
  const [toLocationName, setToLocationName] = useState('Дочерний склад №2')
  const [assignedToType, setAssignedToType] = useState<WarehouseTaskAssigneeType>('warehouse')
  const [assignedToName, setAssignedToName] = useState('')
  const [priority, setPriority] = useState<WarehouseTaskPriority>('normal')
  const [sourceLabel, setSourceLabel] = useState(SOURCE_OPTIONS[0]!)
  const [comment, setComment] = useState('')
  const [expectedQty, setExpectedQty] = useState('')

  const build = (): CreateWarehouseTaskInput => ({
    operationType,
    fromLocationName: fromLocationName.trim() || undefined,
    toLocationName: toLocationName.trim() || undefined,
    assignedToType,
    assignedToName: assignedToName.trim() || WAREHOUSE_TASK_ASSIGNEE_TYPE_LABELS[assignedToType],
    priority,
    sourceLabel,
    comment: comment.trim() || undefined,
    expectedQty: expectedQty ? Number(expectedQty) : undefined,
  })

  const submit = (mode: 'draft' | 'create' | 'send_to_tsd') => onSubmit(build(), mode)

  return (
    <div className="op-modal-root" role="dialog" aria-modal>
      <button type="button" className="op-modal-backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="op-modal">
        <header className="op-modal__head">
          <h2 className="op-modal__title">Создать операцию</h2>
          <button type="button" className="op-modal__close" onClick={onClose} aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </header>

        <div className="op-modal__body">
          <div className="op-field">
            <span className="op-field__label">Тип операции</span>
            <div className="op-chip-row">
              {OPERATION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={cn('op-chip', operationType === t && 'op-chip--active')}
                  onClick={() => setOperationType(t)}
                >
                  {WAREHOUSE_TASK_OPERATION_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="op-field-grid">
            <label className="op-field">
              <span className="op-field__label">Склад-источник</span>
              <input
                list="op-locations"
                className="op-input"
                value={fromLocationName}
                onChange={(e) => setFromLocationName(e.target.value)}
                placeholder="Выбор склада"
              />
            </label>
            <label className="op-field">
              <span className="op-field__label">Склад-получатель</span>
              <input
                list="op-locations"
                className="op-input"
                value={toLocationName}
                onChange={(e) => setToLocationName(e.target.value)}
                placeholder="Склад / агроном / утиль"
              />
            </label>
          </div>
          <datalist id="op-locations">
            {LOCATION_OPTIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>

          <div className="op-field-grid">
            <label className="op-field">
              <span className="op-field__label">Поставлена на (тип)</span>
              <select
                className="op-input"
                value={assignedToType}
                onChange={(e) => setAssignedToType(e.target.value as WarehouseTaskAssigneeType)}
              >
                {ASSIGNEE_TYPES.map((t) => (
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
                value={assignedToName}
                onChange={(e) => setAssignedToName(e.target.value)}
                placeholder="Напр. Кладовщики ГС"
              />
            </label>
          </div>

          <div className="op-field">
            <span className="op-field__label">Приоритет</span>
            <div className="op-chip-row">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={cn('op-chip', priority === p && 'op-chip--active')}
                  onClick={() => setPriority(p)}
                >
                  {WAREHOUSE_TASK_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="op-field-grid">
            <label className="op-field">
              <span className="op-field__label">Основание</span>
              <select
                className="op-input"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="op-field">
              <span className="op-field__label">Плановое количество</span>
              <input
                type="number"
                min={0}
                className="op-input"
                value={expectedQty}
                onChange={(e) => setExpectedQty(e.target.value)}
                placeholder="0"
              />
            </label>
          </div>

          <label className="op-field">
            <span className="op-field__label">Комментарий</span>
            <textarea
              className="op-input op-input--area"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий к задаче"
            />
          </label>

          <p className="op-hint">Коды / товары будут сканироваться на ТСД при выполнении.</p>
        </div>

        <footer className="op-modal__foot">
          <button type="button" className="op-btn op-btn--ghost" onClick={() => submit('draft')}>
            Сохранить как черновик
          </button>
          <div className="op-modal__foot-right">
            <button type="button" className="op-btn op-btn--secondary" onClick={() => submit('create')}>
              Создать задачу
            </button>
            <button type="button" className="op-btn op-btn--primary" onClick={() => submit('send_to_tsd')}>
              Создать и отправить на ТСД
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
