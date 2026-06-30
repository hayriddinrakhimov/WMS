'use client'

import { useMemo, useState } from 'react'
import {
  DELIVERY_TERMS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  PROCUREMENT_SUPPLIERS,
  SUPPLIER_AUGUST,
  aggregateItemsFromRequests,
  buildConsolidatedDemandDocuments,
  type ConsolidatedDemandItem,
  type CreateConsolidatedDemandInput,
  type ProcurementRequest,
} from '@wms/domain'
import { toast } from '@/components/ui/Toaster'
import { RequestWorkspaceModal } from './RequestWorkspaceModal'
import { SupplyDocumentsPanel, type SupplyDocumentRow } from './SupplyDocumentsPanel'
import { SupplyModalTabs, type SupplyModalTab } from './SupplyModalTabs'

type FormTab = SupplyModalTab

function defaultDeliveryDate() {
  const d = new Date()
  d.setDate(d.getDate() + 21)
  return d.toISOString().slice(0, 10)
}

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

export function ConsolidationFormModal({
  requests,
  onClose,
  onSubmit,
}: {
  requests: ProcurementRequest[]
  onClose: () => void
  onSubmit: (input: CreateConsolidatedDemandInput) => {
    ok: boolean
    message: string
    demandId?: string
    demandNumber?: string
  }
}) {
  const [tab, setTab] = useState<FormTab>('items')
  const [items, setItems] = useState<ConsolidatedDemandItem[]>(() =>
    aggregateItemsFromRequests(requests),
  )
  const [supplierId, setSupplierId] = useState(SUPPLIER_AUGUST.id)
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate)
  const [deliveryTerms, setDeliveryTerms] = useState<string>(DELIVERY_TERMS_OPTIONS[0])
  const [paymentTerms, setPaymentTerms] = useState<string>(PAYMENT_TERMS_OPTIONS[0])
  const [comment, setComment] = useState('')
  const [pendingFiles, setPendingFiles] = useState<string[]>([])

  const requestNumbers = useMemo(() => requests.map((r) => r.number), [requests])
  const supplier = PROCUREMENT_SUPPLIERS.find((s) => s.id === supplierId) ?? SUPPLIER_AUGUST

  const totals = useMemo(() => {
    const active = items.filter((i) => i.quantity > 0)
    const totalVolume = active.reduce((s, i) => s + i.quantity, 0)
    const totalSum = active.reduce((s, i) => s + i.quantity * (i.price ?? 0), 0)
    const unit = active[0]?.unit ?? 'л'
    return { selectedCount: active.length, totalVolume, totalSum, unit }
  }, [items])

  const previewDocReady = totals.selectedCount > 0 && !!supplierId
  const previewDocuments = useMemo(
    () =>
      buildConsolidatedDemandDocuments('СВ-черновик', previewDocReady, {
        sourceRequests: requests,
        pendingAttachments: pendingFiles.map((fileName) => ({ fileName })),
      }),
    [previewDocReady, requests, pendingFiles],
  )

  const updateQty = (productCode: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productCode === productCode ? { ...item, quantity: Math.max(0, quantity) } : item,
      ),
    )
  }

  const handleDownload = (title: string) => {
    const blob = new Blob(
      [
        `Сводная заявка (черновик)\nЗаявки: ${requestNumbers.join(', ')}\nПоставщик: ${supplier.name}\nСрок поставки: ${deliveryDate}\nУсловия: ${deliveryTerms}\nОплата: ${paymentTerms}\n`,
      ],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = previewDocuments[0]?.fileName ?? 'svodnaya.pdf'
    a.click()
    URL.revokeObjectURL(url)
    toast.info(`Демо: скачивание «${title}»`)
  }

  const documentRows: SupplyDocumentRow[] = [
    ...previewDocuments
      .filter((doc) => doc.available)
      .map((doc) => ({
        key: doc.id,
        title: doc.title,
        subtitle:
          doc.id === 'doc-consolidated'
            ? `${doc.fileName} · ${supplier.name}`
            : doc.fileName,
        download:
          doc.id === 'doc-consolidated'
            ? { onClick: () => handleDownload(doc.title) }
            : { onClick: () => toast.info(`Демо: скачивание «${doc.title}»`) },
        pending: pendingFiles.includes(doc.fileName),
        remove: pendingFiles.includes(doc.fileName)
          ? {
              label: `Убрать ${doc.fileName}`,
              onClick: () =>
                setPendingFiles((prev) => prev.filter((name) => name !== doc.fileName)),
            }
          : undefined,
      })),
  ]

  const handleSubmit = () => {
    const result = onSubmit({
      requestIds: requests.map((r) => r.id),
      supplierId,
      supplierName: supplier.name,
      deliveryDate,
      deliveryTerms,
      paymentTerms,
      comment: comment.trim() || undefined,
      items,
      attachments: pendingFiles.length ? pendingFiles.map((fileName) => ({ fileName })) : undefined,
    })
    if (result.ok) {
      toast.success(result.message)
      onClose()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <RequestWorkspaceModal
      title="Формирование сводной"
      subtitle={`На основе заявок: ${requestNumbers.join(', ')}`}
      onClose={onClose}
      footer={
        <div className="supply-requests__footer-bar">
          <div className="supply-requests__order-totals">
            <span className="supply-requests__order-totals-count">
              Итого: {totals.selectedCount}{' '}
              {totals.selectedCount === 1 ? 'позиция' : 'позиций'}
            </span>
            <span className="supply-requests__order-totals-volume">
              {totals.totalVolume > 0
                ? `${totals.totalVolume.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${totals.unit}`
                : '—'}
            </span>
            <span className="supply-requests__order-totals-sum">
              {totals.totalSum > 0 ? `${formatMoney(totals.totalSum)} ₸` : '—'}
            </span>
          </div>
          <div className="supply-requests__actions">
            <button type="button" className="supply-requests__btn supply-requests__btn--ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="button" className="supply-requests__btn supply-requests__btn--primary" onClick={handleSubmit}>
              Сформировать сводную
            </button>
          </div>
        </div>
      }
    >
      <div className="supply-requests supply-requests--modal">
        <div className="supply-requests__meta supply-requests__meta--form">
          <label className="supply-requests__field">
            <span>Поставщик</span>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} aria-label="Поставщик">
              {PROCUREMENT_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="supply-requests__field">
            <span>Срок поставки</span>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </label>
          <label className="supply-requests__field">
            <span>Условия поставки</span>
            <select value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)}>
              {DELIVERY_TERMS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="supply-requests__field">
            <span>Условия оплаты</span>
            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
              {PAYMENT_TERMS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>

        <SupplyModalTabs value={tab} onChange={setTab} />

        {tab === 'items' ? (
          <div className="module-content-table supply-requests__nomenclature-table">
            <table>
              <thead>
                <tr>
                  <th>Номенклатура</th>
                  <th>Кол-во</th>
                  <th>Ед.</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const lineSum = item.quantity * (item.price ?? 0)
                  return (
                    <tr key={item.productCode}>
                      <td>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-[var(--app-muted)]">{item.productCode}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={item.quantity}
                          onChange={(e) => updateQty(item.productCode, Number(e.target.value))}
                          className="supply-requests__qty-input w-24"
                        />
                      </td>
                      <td className="text-[var(--app-muted)]">{item.unit}</td>
                      <td className="tabular-nums">{item.price ? `${formatMoney(item.price)} ₸` : '—'}</td>
                      <td className="tabular-nums font-medium">
                        {lineSum > 0 ? `${formatMoney(lineSum)} ₸` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'comments' ? (
          <label className="supply-requests__field supply-requests__field--comment block">
            <span>Комментарий для поставщика</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Дополнительные условия для поставщика"
              className="supply-requests__comment-input"
            />
          </label>
        ) : null}

        {tab === 'documents' ? (
          <SupplyDocumentsPanel
            rows={documentRows}
            onUpload={(files) => {
              const names = Array.from(files).map((file) => file.name)
              setPendingFiles((prev) => [...new Set([...prev, ...names])])
            }}
          />
        ) : null}
      </div>
    </RequestWorkspaceModal>
  )
}
