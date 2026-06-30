'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Warehouse } from 'lucide-react'
import { cn } from '@/lib/utils'

type WarehouseOption = { id: string; name: string; type: 'main' | 'child' | 'all' }

export function WarehouseSelector({
  warehouses,
  selectedId,
  onSelect,
}: {
  warehouses: WarehouseOption[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = warehouses.find((w) => w.id === selectedId) ?? warehouses[0]
  const label = selected?.name ?? 'Склад'

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="module-wh-select">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="module-wh-select__trigger"
        aria-expanded={open}
      >
        <Warehouse className="size-4 shrink-0 text-[var(--app-muted)]" />
        <span className="truncate">{label}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-[var(--app-muted)] transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="module-wh-select__panel">
          <p className="module-wh-select__heading">Склад</p>
          <ul className="module-wh-select__list">
            {warehouses.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => pick(w.id)}
                  className={cn('module-wh-select__item', selectedId === w.id && 'module-wh-select__item--active')}
                >
                  <span className="truncate">{w.name}</span>
                  {w.type !== 'all' ? (
                    <span className="module-wh-select__type">
                      {w.type === 'main' ? 'Главный' : 'Дочерний'}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
