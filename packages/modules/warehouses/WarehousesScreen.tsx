'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { ModulePageLayout } from '../shared/ModulePageLayout'
import { ModuleToolbar, ModuleToolbarButton, ModuleToolbarSearch } from '../shared/ModuleToolbar'
import { WarehouseSelector } from '../shared/WarehouseSelector'
import { StockBalanceDetailPanel } from './StockBalanceDetailPanel'
import { WarehouseOperationsScreen } from './operations/WarehouseOperationsScreen'
import { formatStockBalance, stockCategory } from './warehouse-stock-utils'
import { WAREHOUSES_MOCK, type WarehouseViewTab } from './mock-data'
import type { ModuleRenderContext, StockBalance, WarehouseTaskTab } from '@wms/domain'

const STATUS_LABELS: Record<StockBalance['status'], string> = {
  on_warehouse: 'На складе',
  issued: 'Выдано',
  half_empty: 'Полупустая',
  disposal: 'Утиль',
  written_off: 'Списано',
}

export function WarehousesScreen({ filter, onNavigate }: ModuleRenderContext) {
  const { stock, expectedReceipts } = useDemoStore()

  const defaultWarehouseId = WAREHOUSES_MOCK[0]!.id
  const warehouseId = filter?.warehouseId ?? defaultWarehouseId
  const tab = (filter?.tab as WarehouseViewTab | undefined) ?? 'balances'
  const [search, setSearch] = useState('')
  const [selectedStock, setSelectedStock] = useState<StockBalance | null>(null)

  useEffect(() => {
    if (!filter?.warehouseId) {
      onNavigate('warehouses', { warehouseId: defaultWarehouseId, tab: 'balances' })
    }
  }, [filter?.warehouseId, defaultWarehouseId, onNavigate])

  const warehouseStats = useMemo(
    () =>
      WAREHOUSES_MOCK.map((w) => ({
        ...w,
        items: stock.filter((s) => s.warehouseId === w.id).length,
      })),
    [stock],
  )

  const warehouseName = warehouseStats.find((w) => w.id === warehouseId)?.name ?? 'Склад'

  const whStock = useMemo(
    () => stock.filter((s) => s.warehouseId === warehouseId),
    [stock, warehouseId],
  )

  const filteredStock = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return whStock
    return whStock.filter(
      (s) =>
        s.productName.toLowerCase().includes(q) ||
        stockCategory(s.productName).toLowerCase().includes(q),
    )
  }, [whStock, search])

  const pendingReceipts = useMemo(() => expectedReceipts, [expectedReceipts])

  const navigateTab = (nextTab: WarehouseViewTab) => {
    setSelectedStock(null)
    onNavigate('warehouses', { warehouseId, tab: nextTab })
  }

  const handleWarehouseSelect = (id: string) => {
    setSelectedStock(null)
    onNavigate('warehouses', { warehouseId: id, tab })
  }

  const renderBalances = () => (
    <div className={`wh-screen${selectedStock ? ' wh-screen--detail-open' : ''}`}>
      <div className="wh-screen__main">
        <div className="module-content-table wh-balances-table">
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Категория</th>
                <th>Остаток</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-sm text-[var(--app-muted)]">
                    {whStock.length === 0 ? 'Нет остатков на складе' : 'Ничего не найдено'}
                  </td>
                </tr>
              ) : (
                filteredStock.map((row, index) => {
                  const rowKey = `${row.productName}-${row.batchNumber ?? index}`
                  const isActive =
                    selectedStock?.productName === row.productName &&
                    selectedStock?.batchNumber === row.batchNumber
                  return (
                    <tr
                      key={rowKey}
                      className={isActive ? 'wh-balances-table__row--active' : undefined}
                      onClick={() => setSelectedStock(row)}
                    >
                      <td>
                        <div className="font-medium">{row.productName}</div>
                        <div className="text-xs text-[var(--app-muted)]">{STATUS_LABELS[row.status]}</div>
                      </td>
                      <td className="text-[var(--app-muted)]">{stockCategory(row.productName)}</td>
                      <td className="font-medium tabular-nums">{formatStockBalance(row)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStock ? (
        <>
          <button
            type="button"
            className="wh-screen__backdrop"
            aria-label="Закрыть карточку"
            onClick={() => setSelectedStock(null)}
          />
          <StockBalanceDetailPanel
            item={selectedStock}
            warehouseName={warehouseName}
            onClose={() => setSelectedStock(null)}
          />
        </>
      ) : null}
    </div>
  )

  const renderInventory = () => (
    <div className="wh-panel p-4 md:p-5">
      <p className="mb-4 text-sm text-[var(--app-muted)]">
        Инвентаризация склада «{warehouseName}» — демо-режим
      </p>
      <button
        type="button"
        className="supply-requests__btn supply-requests__btn--primary"
        onClick={() => toast.info('Демо: запуск инвентаризации')}
      >
        Начать инвентаризацию
      </button>
    </div>
  )

  const renderReceipt = () => (
    <div className="wh-panel space-y-3 p-4 md:p-5">
      {pendingReceipts.length === 0 ? (
        <p className="text-sm text-[var(--app-muted)]">Нет ожидаемых приёмок на этом складе</p>
      ) : (
        pendingReceipts.map((receipt) => (
          <div key={receipt.id} className="rounded-xl border border-[var(--app-border)] px-4 py-3">
            <div className="font-medium">{receipt.number}</div>
            <div className="mt-1 text-sm text-[var(--app-muted)]">{receipt.supplierName}</div>
            <div className="mt-2 text-xs text-[var(--app-muted)]">Статус: {receipt.status}</div>
          </div>
        ))
      )}
    </div>
  )

  const renderContent = () => {
    if (tab === 'inventory') return renderInventory()
    if (tab === 'receipt') return renderReceipt()
    return renderBalances()
  }

  if (tab === 'operations') {
    return (
      <WarehouseOperationsScreen
        onBack={() => navigateTab('balances')}
        initialTab={(filter?.opsTab as WarehouseTaskTab | undefined) ?? undefined}
        initialTaskId={filter?.taskId}
      />
    )
  }

  const toolbar = (
    <ModuleToolbar
      left={
        <WarehouseSelector
          warehouses={warehouseStats}
          selectedId={warehouseId}
          onSelect={handleWarehouseSelect}
        />
      }
      center={
        <ModuleToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder="Поиск по товару или категории…"
        />
      }
      right={
        <>
          <ModuleToolbarButton
            variant="secondary"
            icon={<ClipboardList className="size-4" />}
            onClick={() => navigateTab('operations')}
          >
            Операции
          </ModuleToolbarButton>
          <ModuleToolbarButton
            variant={tab === 'inventory' ? 'primary' : 'secondary'}
            icon={<ClipboardList className="size-4" />}
            onClick={() => navigateTab(tab === 'inventory' ? 'balances' : 'inventory')}
          >
            Инвентаризация
          </ModuleToolbarButton>
        </>
      }
    />
  )

  return <ModulePageLayout toolbar={toolbar}>
    <div className="h-full min-h-0">{renderContent()}</div>
  </ModulePageLayout>
}
