'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogProduct } from './request-catalog'
import {
  PACKAGING_UNIT_HINT,
  getUnitFields,
  toBaseQuantity,
  unitBreakdownFromBase,
  unitFieldToOrderUnit,
  type OrderUnitId,
  type UnitFieldId,
} from './request-units'

export function OrderUnitMenu({
  product,
  orderQty,
  orderUnit,
  onChange,
  disabled,
}: {
  product: CatalogProduct
  orderQty: number
  orderUnit: OrderUnitId
  onChange: (orderQty: number, orderUnit: OrderUnitId) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fields = getUnitFields(product)

  const baseQty = useMemo(() => {
    if (orderQty <= 0) return 0
    return toBaseQuantity(product, orderQty, orderUnit)
  }, [product, orderQty, orderUnit])

  const breakdown = useMemo(() => unitBreakdownFromBase(product, baseQty), [product, baseQty])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const applyField = (field: UnitFieldId, raw: string) => {
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) return
    const nextUnit = unitFieldToOrderUnit(field)
    onChange(value, nextUnit)
  }

  const fieldValue = (field: UnitFieldId) => {
    if (field === 'box') return breakdown.box || ''
    if (field === 'pcs') return breakdown.pcs || ''
    return breakdown.base || ''
  }

  return (
    <div className="supply-order-unit" ref={ref}>
      <button
        type="button"
        className="supply-order-unit__trigger"
        disabled={disabled}
        aria-label="Единицы измерения"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span aria-hidden>⋯</span>
      </button>
      {open ? (
        <div className="supply-order-unit__popover" role="dialog" aria-label="Единицы измерения">
          <p className="supply-order-unit__title">Единицы измерения</p>
          <div className="supply-order-unit__fields">
            {fields.map((field) => (
              <label key={field.id} className="supply-order-unit__field">
                <input
                  type="number"
                  min={0}
                  step={field.id === 'base' ? 0.1 : 1}
                  value={fieldValue(field.id)}
                  disabled={disabled}
                  onChange={(e) => applyField(field.id, e.target.value)}
                  className="supply-order-unit__input"
                />
                <span className="supply-order-unit__suffix">{field.label}</span>
              </label>
            ))}
          </div>
          <p className="supply-order-unit__hint">{PACKAGING_UNIT_HINT}</p>
        </div>
      ) : null}
    </div>
  )
}
