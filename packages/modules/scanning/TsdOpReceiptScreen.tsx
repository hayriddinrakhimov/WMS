'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { type ExpectedReceipt } from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { palletsForExpectedReceipt } from './build-tsd-operation-summary'
import { TsdShell } from './TsdShell'
import { TsdSimulateScan } from './TsdSimulateScan'
import { formatScanLabel, nextPalletSscc } from './tsd-simulate-scan'

export function TsdOpReceiptScreen({
  receipt,
  warehouseTaskId,
  onBack,
}: {
  receipt: ExpectedReceipt
  warehouseTaskId?: string
  onBack: () => void
}) {
  const { pallets, completeTsdOpReceipt } = useDemoStore()
  const [scanned, setScanned] = useState<string[]>([])

  const erPallets = useMemo(
    () => palletsForExpectedReceipt(pallets, receipt.id),
    [pallets, receipt.id],
  )

  const expectedCount = receipt.palletCount || erPallets.length || 1
  const remaining = Math.max(expectedCount - scanned.length, 0)

  const simulateScan = () => {
    const sscc = nextPalletSscc(pallets, erPallets, scanned)
    if (!sscc) {
      toast.info('Все палеты уже отсканированы')
      return
    }
    if (scanned.includes(sscc)) {
      toast.info('Палета уже в списке')
      return
    }
    setScanned((prev) => [...prev, sscc])
    toast.success(`Отсканирована палета ${formatScanLabel(sscc)}`)
  }

  const simulateScanAll = () => {
    let added = 0
    const next = [...scanned]
    while (next.length < expectedCount) {
      const sscc = nextPalletSscc(pallets, erPallets, next)
      if (!sscc || next.includes(sscc)) break
      next.push(sscc)
      added++
    }
    if (!added) {
      toast.info('Нечего сканировать')
      return
    }
    setScanned(next)
    toast.success(`Отсканировано палет: ${added}`)
  }

  const acceptAll = () => {
    if (!scanned.length) {
      toast.error('Сначала отсканируйте палеты')
      return
    }
    const result = completeTsdOpReceipt(receipt.id, scanned, warehouseTaskId)
    if (result.ok) {
      toast.success(result.message)
      onBack()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <TsdShell
      actions={
        <>
          <button
            type="button"
            className="tsd-actions__btn tsd-actions__btn--primary"
            disabled={!scanned.length}
            onClick={acceptAll}
          >
            Принять
          </button>
          {remaining > 1 ? (
            <button
              type="button"
              className="tsd-actions__btn tsd-actions__btn--secondary"
              onClick={simulateScanAll}
            >
              Сканировать всё ({remaining})
            </button>
          ) : null}
        </>
      }
    >
      <div className="tsd-receipt">
        <header className="tsd-receipt__header">
          <button type="button" className="tsd-runner__back" onClick={onBack} aria-label="Назад">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="tsd-runner__type">Приём ОП</p>
            <h1 className="tsd-runner__title">{receipt.number}</h1>
            <p className="tsd-receipt__meta">
              {receipt.productName} · {receipt.supplierName}
            </p>
            <p className="tsd-receipt__meta tsd-receipt__meta--route">
              Размещение: <strong>Главный склад</strong>
            </p>
          </div>
        </header>

        <div className="tsd-receipt__body">
          <div className="tsd-alert tsd-alert--warn" role="note">
            <ShieldCheck className="size-5 shrink-0" />
            <div>
              <p className="tsd-alert__title">Проверьте целостность упаковки</p>
              <p className="tsd-alert__text">Нажмите «Сканировать» для эмуляции считывания палеты</p>
            </div>
          </div>

          <div className="tsd-receipt__progress">
            <span className="tsd-receipt__progress-label">Отсканировано палет</span>
            <span className="tsd-receipt__progress-value">
              {scanned.length} / {expectedCount}
            </span>
          </div>

          <TsdSimulateScan
            label="Сканировать палету"
            hint={remaining > 0 ? `Осталось: ${remaining}` : 'Все палеты отсканированы'}
            disabled={remaining === 0}
            onScan={simulateScan}
          />

          {scanned.length ? (
            <ul className="tsd-scanned-list">
              {scanned.map((code) => (
                <li key={code}>
                  <Check className="size-4 text-[var(--dash-green)]" />
                  {code}
                </li>
              ))}
            </ul>
          ) : (
            <p className="tsd-receipt__empty">Нажмите «Сканировать» для начала приёмки</p>
          )}

          {scanned.length > 0 && scanned.length < expectedCount ? (
            <p className="tsd-receipt__partial">
              <AlertTriangle className="inline size-3.5" /> Можно принять частично: {scanned.length} из{' '}
              {expectedCount} палет
            </p>
          ) : null}
        </div>
      </div>
    </TsdShell>
  )
}
