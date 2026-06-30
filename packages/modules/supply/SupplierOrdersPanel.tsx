'use client'

import { useMemo, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import {
  CONSOLIDATED_DEMAND_STATUS_LABELS,
  EXPECTED_RECEIPT_STATUS_LABELS,
  SUPPLIER_ORDER_STATUS_LABELS,
  TOTAL_CANISTERS,
  TOTAL_BOXES,
  TOTAL_PALLETS,
  normalizeCommentHistory,
  type ConsolidatedDemand,
  type ProcurementRequest,
  type SupplierOrder,
} from '@wms/domain'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { useDemoStore } from '@/lib/demo-store'
import { DocumentsDropZone } from './DocumentsDropZone'
import { ConsolidatedDemandModal } from './ConsolidatedDemandModal'
import { RequestChatPanel } from './RequestChatPanel'
import { RequestWorkspaceModal } from './RequestWorkspaceModal'
import { SupplyItemsTable, renderSupplyItemsModalFooter } from './SupplyItemsTable'
import { SupplyModalTabs, type SupplyModalTab } from './SupplyModalTabs'
import {
  linkedRequestsForRow,
  supplierOrderLineRows,
} from './supply-modal-rows'

type ModalTab = SupplyModalTab

type Row =
  | { kind: 'consolidated'; data: ConsolidatedDemand }
  | { kind: 'supplier_order'; data: SupplierOrder }

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function rowDisplayMeta(
  row: Row,
  procurementRequests: ProcurementRequest[],
  consolidatedDemands: ConsolidatedDemand[],
) {
  const linked = linkedRequestsForRow(row, procurementRequests, consolidatedDemands)
  const fulfillmentPercent =
    linked.length > 0
      ? Math.round(linked.reduce((sum, r) => sum + r.fulfillmentPercent, 0) / linked.length)
      : 0
  const dueDate =
    row.kind === 'consolidated' && row.data.deliveryDate
      ? row.data.deliveryDate
      : linked.map((r) => r.dueDate).sort()[0]

  return {
    fulfillmentPercent,
    dueDate,
    officer: linked[0]?.createdBy ?? '—',
  }
}

function UpakUploadSection({
  orderId,
  disabled,
  onUpload,
}: {
  orderId: string
  disabled: boolean
  onUpload: (orderId: string) => void
}) {
  const [fileLabel, setFileLabel] = useState<string | null>(null)

  return (
    <section className="space-y-4">
      <h4 className="text-sm font-semibold">Упак поставщика</h4>
      <DocumentsDropZone
        accept=".xlsx,.xls"
        title="Загрузить Упак"
        subtitle="Файл .xlsx или .xls"
        hint="Перетащите Упак сюда или нажмите для выбора"
        className={disabled ? 'pointer-events-none opacity-50' : undefined}
        onFiles={(files) => {
          const file = files[0]
          if (file) setFileLabel(file.name)
        }}
      />
      <button
        type="button"
        disabled={disabled || !fileLabel}
        onClick={() => onUpload(orderId)}
        className="w-full rounded-lg bg-[var(--app-accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Загрузить и создать ОП
      </button>
    </section>
  )
}

function SupplierOrderModal({
  order,
  consolidatedDemands,
  procurementRequests,
  onClose,
  onUpakUpload,
}: {
  order: SupplierOrder
  consolidatedDemands: ConsolidatedDemand[]
  procurementRequests: ProcurementRequest[]
  onClose: () => void
  onUpakUpload: (orderId: string) => void
}) {
  const {
    importCompleted,
    importValidation,
    expectedReceipts,
    transferExpectedReceiptToWarehouse,
    addSupplierOrderComment,
    webUser,
  } = useDemoStore()
  const [tab, setTab] = useState<ModalTab>('items')

  const linkedReceipt = expectedReceipts.find((er) => er.id === order.expectedReceiptId)

  const handleTransfer = () => {
    if (!linkedReceipt) return
    const result = transferExpectedReceiptToWarehouse(linkedReceipt.id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  const upakDisabled = order.status !== 'sent' || importCompleted

  const lineRows = useMemo(
    () => supplierOrderLineRows(order, consolidatedDemands, procurementRequests),
    [order, consolidatedDemands, procurementRequests],
  )

  return (
    <RequestWorkspaceModal
      title={order.number}
      subtitle={`${order.supplierName} · ${order.consolidatedNumbers.join(', ')}`}
      status={
        <span className={`supply-requests__status supply-requests__status--${order.status}`}>
          {SUPPLIER_ORDER_STATUS_LABELS[order.status]}
        </span>
      }
      onClose={onClose}
      footer={renderSupplyItemsModalFooter(tab, lineRows)}
    >
      <div className="supply-requests supply-requests--modal">
        <SupplyModalTabs value={tab} onChange={setTab} />

        {tab === 'items' ? <SupplyItemsTable rows={lineRows} /> : null}

        {tab === 'comments' ? (
          <RequestChatPanel
            items={order.comments ?? []}
            currentUserId={webUser?.id}
            showTitle={false}
            className="supply-requests__chat--tab"
            onSend={(text) => {
              const result = addSupplierOrderComment(order.id, text)
              if (result.ok) toast.success(result.message)
              else toast.error(result.message)
              return result.ok
            }}
          />
        ) : null}

        {tab === 'documents' ? (
          <div className="supply-requests__docs-panel">
            <UpakUploadSection orderId={order.id} disabled={upakDisabled} onUpload={onUpakUpload} />

            {importCompleted && importValidation ? (
              <section className="space-y-4 border-t border-[var(--app-border)] pt-4">
                <h4 className="text-sm font-semibold">Проверка файла</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Палет', value: importValidation.palletCount ?? TOTAL_PALLETS },
                    { label: 'Коробок', value: importValidation.boxCount ?? TOTAL_BOXES },
                    { label: 'Канистр', value: importValidation.canisterCount ?? TOTAL_CANISTERS },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-[var(--app-border)] bg-[#fafbfc] p-4 text-center"
                    >
                      <p className="text-xs text-[var(--app-muted)]">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm">
                  Статус проверки:{' '}
                  <span className={importValidation.passed ? 'text-green-700' : 'text-red-700'}>
                    {importValidation.passed ? 'успешно' : 'есть ошибки'}
                  </span>
                </p>
              </section>
            ) : null}

            {linkedReceipt ? (
              <section className="space-y-3 border-t border-[var(--app-border)] pt-4">
                <h4 className="text-sm font-semibold">Ожидаемая приёмка</h4>
                <div className="rounded-xl border border-[var(--app-border)] p-4 text-sm">
                  <p className="font-semibold">ОП №{linkedReceipt.number}</p>
                  {linkedReceipt.demandSummary ? (
                    <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-900">
                      {linkedReceipt.demandSummary}
                    </p>
                  ) : null}
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-[var(--app-muted)]">Поставщик</dt>
                      <dd>{linkedReceipt.supplierName}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--app-muted)]">Статус</dt>
                      <dd>{EXPECTED_RECEIPT_STATUS_LABELS[linkedReceipt.status] ?? linkedReceipt.status}</dd>
                    </div>
                  </dl>
                  {linkedReceipt.status === 'ready_for_warehouse' ? (
                    <button
                      type="button"
                      onClick={handleTransfer}
                      className="mt-3 rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white"
                    >
                      Передать на склад
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}

            {order.documents.length > 0 ? (
              <div className="supply-requests__docs-group">
                <ul className="supply-requests__docs">
                  {order.documents.map((doc) => (
                    <li key={doc.id} className="supply-requests__doc">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-[var(--app-muted)]" />
                        <span>{doc.title}</span>
                      </div>
                      <button type="button" className="supply-requests__doc-btn">
                        <Download className="size-4" />
                        Скачать
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DocumentsDropZone
              title="Прикрепить файлы"
              subtitle="Дополнительные документы к заявке поставщику"
              onFiles={(files) => {
                for (const file of Array.from(files)) {
                  toast.info(`Демо: файл «${file.name}» прикреплён`)
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </RequestWorkspaceModal>
  )
}

export function SupplierOrdersPanel({
  consolidatedDemands,
  supplierOrders,
  procurementRequests,
  onApproveConsolidated,
  onReturnConsolidated,
  onUpakUpload,
  highlightId,
  createdDateFilter = '',
}: {
  consolidatedDemands: ConsolidatedDemand[]
  supplierOrders: SupplierOrder[]
  procurementRequests: ProcurementRequest[]
  onApproveConsolidated: (id: string) => { ok: boolean; message: string }
  onReturnConsolidated: (id: string, comment: string) => { ok: boolean; message: string }
  onUpakUpload: (orderId: string) => void
  highlightId?: string
  createdDateFilter?: string
}) {
  const [openOrder, setOpenOrder] = useState<SupplierOrder | null>(null)
  const [openConsolidated, setOpenConsolidated] = useState<ConsolidatedDemand | null>(null)

  const rows = useMemo<Row[]>(() => {
    const matchesDate = (createdAt: string) =>
      !createdDateFilter || createdAt.slice(0, 10) === createdDateFilter

    const cons = consolidatedDemands
      .filter((d) => d.status !== 'merged' && matchesDate(d.createdAt))
      .map((data) => ({ kind: 'consolidated' as const, data }))
    const orders = supplierOrders
      .filter((o) => matchesDate(o.createdAt))
      .map((data) => ({ kind: 'supplier_order' as const, data }))
    return [...cons, ...orders].sort(
      (a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime(),
    )
  }, [consolidatedDemands, supplierOrders, createdDateFilter])

  const handleRowClick = (row: Row) => {
    if (row.kind === 'supplier_order') {
      setOpenOrder(row.data)
    } else {
      setOpenConsolidated(row.data)
    }
  }

  const activeConsolidated = openConsolidated
    ? consolidatedDemands.find((d) => d.id === openConsolidated.id) ?? openConsolidated
    : null

  return (
    <>
      <div className="module-content-table">
        <table>
          <thead>
            <tr>
              <th>№ заявки</th>
              <th>Время подачи</th>
              <th>Статус</th>
              <th>Удовлетворение</th>
              <th>Срок выдачи</th>
              <th>Снабженец</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-[var(--app-muted)]">
                  Сводных и заявок поставщику пока нет. Сформируйте сводную на вкладке «Спрос».
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const data = row.data
                const { fulfillmentPercent, dueDate, officer } = rowDisplayMeta(
                  row,
                  procurementRequests,
                  consolidatedDemands,
                )

                return (
                  <tr
                    key={data.id}
                    className={cn(
                      'cursor-pointer hover:bg-[#f8fafc]',
                      highlightId === data.id && 'bg-amber-50 transition-colors duration-2000',
                    )}
                    onClick={() => handleRowClick(row)}
                  >
                    <td className="font-semibold">{data.number}</td>
                    <td>{formatDateTime(data.createdAt)}</td>
                    <td>
                      <span
                        className={cn(
                          'supply-requests__status',
                          `supply-requests__status--${data.status}`,
                        )}
                      >
                        {row.kind === 'consolidated'
                          ? CONSOLIDATED_DEMAND_STATUS_LABELS[row.data.status]
                          : SUPPLIER_ORDER_STATUS_LABELS[row.data.status]}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="supply-requests__fulfill-bar">
                          <div style={{ width: `${fulfillmentPercent}%` }} />
                        </div>
                        <span className="text-xs tabular-nums">{fulfillmentPercent}%</span>
                      </div>
                    </td>
                    <td>
                      {dueDate ? new Date(dueDate).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="text-[var(--app-muted)]">{officer}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {activeConsolidated ? (
        <ConsolidatedDemandModal
          demand={activeConsolidated}
          requests={procurementRequests}
          showActions={activeConsolidated.status === 'draft'}
          onClose={() => setOpenConsolidated(null)}
          onApprove={(id) => {
            const result = onApproveConsolidated(id)
            if (result.ok) toast.success(result.message)
            else toast.error(result.message)
            if (result.ok) setOpenConsolidated(null)
          }}
          onReturn={onReturnConsolidated}
        />
      ) : null}

      {openOrder ? (
        <SupplierOrderModal
          order={supplierOrders.find((o) => o.id === openOrder.id) ?? openOrder}
          consolidatedDemands={consolidatedDemands}
          procurementRequests={procurementRequests}
          onClose={() => setOpenOrder(null)}
          onUpakUpload={onUpakUpload}
        />
      ) : null}
    </>
  )
}
