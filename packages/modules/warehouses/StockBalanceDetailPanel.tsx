'use client'

import { useState } from 'react'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RefreshCw,
  Settings2,
  X,
} from 'lucide-react'
import type { StockBalance } from '@wms/domain'
import { toast } from '@/components/ui/Toaster'
import {
  buildStockHistory,
  formatStockBalance,
  stockCategory,
  stockDetailStats,
  stockHistoryPageCount,
  stockHistoryTotal,
} from './warehouse-stock-utils'

export function StockBalanceDetailPanel({
  item,
  warehouseName,
  onClose,
}: {
  item: StockBalance
  warehouseName: string
  onClose: () => void
}) {
  const [historyPage, setHistoryPage] = useState(0)
  const category = stockCategory(item.productName)
  const stats = stockDetailStats(item)
  const history = buildStockHistory(item, historyPage)
  const pageCount = stockHistoryPageCount(item)
  const historyTotal = stockHistoryTotal(item)

  const expiryLabel = item.expiryDate
    ? new Date(item.expiryDate).toLocaleDateString('ru-RU')
    : '—'

  return (
    <aside className="wh-stock-detail" aria-label={`Остаток: ${item.productName}`}>
      <header className="wh-stock-detail__header">
        <div className="wh-stock-detail__title-wrap">
          <h2 className="wh-stock-detail__title">{item.productName}</h2>
          <p className="wh-stock-detail__meta">
            <span>{category}</span>
            <span className="wh-stock-detail__dot" aria-hidden />
            <span>Склад: {warehouseName}</span>
          </p>
        </div>
        <div className="wh-stock-detail__header-actions">
          <button type="button" className="wh-stock-detail__icon-btn" aria-label="Обновить">
            <RefreshCw className="size-4" />
          </button>
          <button type="button" className="wh-stock-detail__icon-btn" onClick={onClose} aria-label="Закрыть">
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div className="wh-stock-detail__body">
        <div className="wh-stock-detail__actions">
        {[
          { icon: Plus, label: 'Приход', className: 'wh-stock-detail__action--add' },
          { icon: ArrowLeftRight, label: 'Перемещение', className: 'wh-stock-detail__action--move' },
          { icon: Minus, label: 'Списание', className: 'wh-stock-detail__action--remove' },
          { icon: Settings2, label: 'Настройки', className: 'wh-stock-detail__action--settings' },
        ].map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            className={`wh-stock-detail__action ${action.className}`}
            onClick={() => toast.info(`Демо: ${action.label}`)}
          >
            <action.icon className="size-4" />
          </button>
        ))}
      </div>

      <div className="wh-stock-detail__cards">
        <div className="wh-stock-detail__card wh-stock-detail__card--balance">
          <span className="wh-stock-detail__card-label">Остаток</span>
          <strong>{formatStockBalance(item)}</strong>
        </div>
        <div className="wh-stock-detail__card wh-stock-detail__card--days">
          <span className="wh-stock-detail__card-label">хватит на</span>
          <strong>{stats.daysLeft} дней</strong>
        </div>
        <div className="wh-stock-detail__card">
          <span className="wh-stock-detail__card-label">Срок годности</span>
          <strong>{expiryLabel}</strong>
        </div>
      </div>

      <div className="wh-stock-detail__stats">
        <div className="wh-stock-detail__stat">
          <span>7 дней</span>
          <p>
            <span className="wh-stock-detail__stat-in">+~{stats.in7} кор</span>
            <span className="wh-stock-detail__stat-out">−~{stats.out7} кор</span>
          </p>
        </div>
        <div className="wh-stock-detail__stat">
          <span>30 дней</span>
          <p>
            <span className="wh-stock-detail__stat-in">+{stats.in30.toLocaleString('ru-RU')} кор</span>
            <span className="wh-stock-detail__stat-out">−~{stats.out30.toLocaleString('ru-RU')} кор</span>
          </p>
        </div>
        <div className="wh-stock-detail__stat">
          <span>Средний расход/день</span>
          <p>{stats.dailyConsumption}</p>
        </div>
        <div className="wh-stock-detail__stat">
          <span>Последнее движение</span>
          <p>{stats.lastMovement}</p>
        </div>
      </div>

      <section className="wh-stock-detail__history">
        <h3>История ({historyTotal})</h3>
        <div className="wh-stock-detail__history-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Δ</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{row.at}</td>
                  <td>{row.type}</td>
                  <td className={row.deltaPositive ? 'wh-stock-detail__delta--in' : 'wh-stock-detail__delta--out'}>
                    {row.delta}
                  </td>
                  <td className="text-[var(--app-muted)]">{row.comment ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageCount > 1 ? (
          <div className="wh-stock-detail__pager">
            <button
              type="button"
              disabled={historyPage <= 0}
              onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span>
              {historyPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={historyPage >= pageCount - 1}
              onClick={() => setHistoryPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label="Следующая страница"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </section>
      </div>
    </aside>
  )
}
