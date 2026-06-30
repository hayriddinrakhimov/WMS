'use client'

import type { ReactNode } from 'react'
import { getCatalogProduct, type CatalogProduct } from './request-catalog'
import { formatOrderVolume, formatVolumeBreakdown } from './request-units'
import type { SupplyModalTab } from './SupplyModalTabs'

export type SupplyItemsTableRow = {
  productCode: string
  productName: string
  quantity: number
  unit: string
  price: number
  receivedQty?: number
  receiptNumbers?: string[]
  requestNumbers?: string[]
}

export function formatSupplyItemsMoney(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

export function computeSupplyItemsTotals(rows: SupplyItemsTableRow[]) {
  const totalSum = rows.reduce((sum, row) => sum + row.quantity * row.price, 0)
  return { count: rows.length, totalSum }
}

export function SupplyItemsTotalsBar({ rows }: { rows: SupplyItemsTableRow[] }) {
  const totals = computeSupplyItemsTotals(rows)
  if (totals.count === 0) return null

  return (
    <div className="supply-requests__order-totals">
      <span className="supply-requests__order-totals-count">
        {totals.count} {totals.count === 1 ? 'позиция' : 'позиций'}
      </span>
      <span className="supply-requests__order-totals-sum">
        Итого: {formatSupplyItemsMoney(totals.totalSum)} ₸
      </span>
    </div>
  )
}

export function renderSupplyItemsModalFooter(
  tab: SupplyModalTab,
  rows: SupplyItemsTableRow[],
  actions?: ReactNode,
): ReactNode | undefined {
  const showTotals = tab === 'items' && rows.length > 0
  if (!showTotals && !actions) return undefined

  if (showTotals && actions) {
    return (
      <div className="supply-requests__footer-bar">
        <SupplyItemsTotalsBar rows={rows} />
        <div className="supply-requests__actions">{actions}</div>
      </div>
    )
  }

  if (showTotals) {
    return (
      <div className="supply-requests__footer-bar">
        <SupplyItemsTotalsBar rows={rows} />
      </div>
    )
  }

  return <div className="supply-requests__actions">{actions}</div>
}

function formatMoney(n: number) {
  return formatSupplyItemsMoney(n)
}

function formatPackagingQty(product: CatalogProduct | undefined, baseQty: number, unit: string) {
  if (baseQty <= 0) return '—'
  if (product) {
    return formatVolumeBreakdown(product, baseQty) ?? '—'
  }
  return `${baseQty.toLocaleString('ru-RU')} ${unit}`
}

export function SupplyItemsTable({
  rows,
  showRequests = true,
}: {
  rows: SupplyItemsTableRow[]
  showRequests?: boolean
}) {
  return (
    <>
      <div className="module-content-table">
        <table>
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Объём</th>
              <th>Цена</th>
              <th>Сумма</th>
              {showRequests ? <th>Заявки</th> : null}
              <th>Приход</th>
              <th>№ прихода</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const product = getCatalogProduct(row.productCode)
              const lineSum = row.quantity * row.price
              const receivedQty = row.receivedQty ?? 0
              const receiptNumbers = row.receiptNumbers ?? []

              return (
                <tr key={row.productCode}>
                  <td>
                    <div className="font-medium">{row.productName}</div>
                    <div className="text-xs text-[var(--app-muted)]">{row.productCode}</div>
                  </td>
                  <td className="tabular-nums">
                    {formatPackagingQty(product, row.quantity, row.unit)}
                  </td>
                  <td className="tabular-nums">
                    {product
                      ? formatOrderVolume(product, row.quantity)
                      : `${row.quantity.toLocaleString('ru-RU')} ${row.unit}`}
                  </td>
                  <td className="tabular-nums">
                    {row.price > 0 ? `${formatMoney(row.price)} ₸` : '—'}
                  </td>
                  <td className="tabular-nums font-medium">
                    {lineSum > 0 ? `${formatMoney(lineSum)} ₸` : '—'}
                  </td>
                  {showRequests ? (
                    <td className="text-[var(--app-muted)]">
                      {row.requestNumbers?.length ? row.requestNumbers.join(', ') : '—'}
                    </td>
                  ) : null}
                  <td className="tabular-nums">
                    {formatPackagingQty(product, receivedQty, row.unit)}
                  </td>
                  <td className="font-mono text-xs">
                    {receiptNumbers.length ? receiptNumbers.join(', ') : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
