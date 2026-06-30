'use client'

import { useMemo, useState } from 'react'
import {
  CONSOLIDATED_DEMAND_STATUS_LABELS,
  collectConsolidatedDemandSourceDocuments,
  normalizeCommentHistory,
  type ConsolidatedDemand,
  type ProcurementRequest,
} from '@wms/domain'
import { useDemoStore } from '@/lib/demo-store'
import { toast } from '@/components/ui/Toaster'
import { RequestChatPanel } from './RequestChatPanel'
import { RequestWorkspaceModal } from './RequestWorkspaceModal'
import { SupplyItemsTable, renderSupplyItemsModalFooter, type SupplyItemsTableRow } from './SupplyItemsTable'
import { SupplyModalTabs, type SupplyModalTab } from './SupplyModalTabs'
import { getCatalogProduct } from './request-catalog'
import { SupplyDocumentsPanel, type SupplyDocumentRow } from './SupplyDocumentsPanel'

type ConsolidatedLineRow = SupplyItemsTableRow & {
  receivedQty: number
  receiptNumbers: string[]
  requestNumbers: string[]
}

export function ConsolidatedDemandModal({
  demand,
  requests,
  showActions = false,
  onClose,
  onApprove,
  onReturn,
}: {
  demand: ConsolidatedDemand
  requests: ProcurementRequest[]
  showActions?: boolean
  onClose: () => void
  onApprove?: (id: string) => void
  onReturn?: (id: string, comment: string) => { ok: boolean; message: string }
}) {
  const { addConsolidatedDemandOpFile, addConsolidatedDemandAttachment, addConsolidatedDemandComment, webUser } = useDemoStore()
  const [tab, setTab] = useState<SupplyModalTab>('items')
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnComment, setReturnComment] = useState('')

  const linkedRequests = useMemo(
    () => requests.filter((r) => demand.requestIds.includes(r.id)),
    [requests, demand.requestIds],
  )

  const lineItems = useMemo<ConsolidatedLineRow[]>(() => {
    const rowsFromRequests = () => {
      const map = new Map<string, ConsolidatedLineRow>()
      for (const req of linkedRequests) {
        for (const item of req.items) {
          const existing = map.get(item.productCode)
          if (existing) {
            existing.quantity += item.quantity
            existing.receivedQty += item.receivedQty
            if (item.receiptNumber && !existing.receiptNumbers.includes(item.receiptNumber)) {
              existing.receiptNumbers.push(item.receiptNumber)
            }
            if (!existing.requestNumbers.includes(req.number)) {
              existing.requestNumbers.push(req.number)
            }
          } else {
            map.set(item.productCode, {
              productCode: item.productCode,
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price || getCatalogProduct(item.productCode)?.price || 0,
              receivedQty: item.receivedQty,
              receiptNumbers: item.receiptNumber ? [item.receiptNumber] : [],
              requestNumbers: [req.number],
            })
          }
        }
      }
      return [...map.values()]
    }

    if (demand.items?.length) {
      const byCode = new Map(rowsFromRequests().map((row) => [row.productCode, row]))
      return demand.items.map((item) => {
        const linked = byCode.get(item.productCode)
        return {
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price ?? getCatalogProduct(item.productCode)?.price ?? 0,
          receivedQty: linked?.receivedQty ?? 0,
          receiptNumbers: linked?.receiptNumbers ?? [],
          requestNumbers:
            linked?.requestNumbers ??
            linkedRequests
              .filter((r) => r.items.some((i) => i.productCode === item.productCode))
              .map((r) => r.number),
        }
      })
    }

    return rowsFromRequests()
  }, [demand.items, linkedRequests])

  const allComments = useMemo(() => {
    const fromRequests = linkedRequests.flatMap((r) => normalizeCommentHistory(r))
    const fromDemand = demand.comments ?? []
    return [...fromDemand, ...fromRequests].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [linkedRequests, demand.comments])

  const canAct = showActions && demand.status === 'draft' && onApprove && onReturn

  const allDocuments = useMemo(() => {
    const stored = demand.documents ?? []
    const fromRequests = collectConsolidatedDemandSourceDocuments(linkedRequests)
    const seen = new Set(stored.map((doc) => `${doc.fileName}|${doc.title}`))
    const merged = [
      ...stored,
      ...fromRequests.filter((doc) => !seen.has(`${doc.fileName}|${doc.title}`)),
    ]
    return merged
  }, [demand.documents, linkedRequests])

  const documentRows = useMemo<SupplyDocumentRow[]>(
    () =>
      allDocuments
        .filter((doc) => doc.available)
        .map((doc) => ({
          key: doc.id,
          title: doc.title,
          subtitle: doc.fileName,
          download: {
            onClick: () => toast.info(`Демо: скачивание «${doc.title}»`),
          },
        })),
    [allDocuments],
  )

  const handleUpload = (files: FileList) => {
    const list = Array.from(files)
    if (!list.length) return
    let hasOp = allDocuments.some((doc) => doc.title === 'ОП')
    for (const file of list) {
      const result = !hasOp
        ? addConsolidatedDemandOpFile(demand.id, file.name)
        : addConsolidatedDemandAttachment(demand.id, file.name)
      if (result.ok) {
        if (!hasOp) hasOp = true
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    }
  }

  return (
    <>
      <RequestWorkspaceModal
        title={demand.number}
        subtitle={`Сводная · ${demand.requestNumbers.join(', ')}`}
        status={
          <span className={`supply-requests__status supply-requests__status--${demand.status}`}>
            {CONSOLIDATED_DEMAND_STATUS_LABELS[demand.status]}
          </span>
        }
        onClose={onClose}
        footer={renderSupplyItemsModalFooter(
          tab,
          lineItems,
          canAct ? (
            <>
              <button
                type="button"
                className="supply-requests__btn supply-requests__btn--ghost"
                onClick={() => setReturnOpen(true)}
              >
                Вернуть
              </button>
              <button
                type="button"
                className="supply-requests__btn supply-requests__btn--primary"
                onClick={() => {
                  onApprove(demand.id)
                }}
              >
                Утвердить
              </button>
            </>
          ) : undefined,
        )}
      >
        <div className="supply-requests supply-requests--modal">
          <div className="supply-requests__meta">
            <div>
              <span className="supply-requests__meta-label">Поставщик</span>
              <span>{demand.supplierName}</span>
            </div>
            {demand.deliveryDate ? (
              <div>
                <span className="supply-requests__meta-label">Срок поставки</span>
                <span>{new Date(demand.deliveryDate).toLocaleDateString('ru-RU')}</span>
              </div>
            ) : null}
            {demand.deliveryTerms ? (
              <div>
                <span className="supply-requests__meta-label">Условия поставки</span>
                <span>{demand.deliveryTerms}</span>
              </div>
            ) : null}
            {demand.paymentTerms ? (
              <div>
                <span className="supply-requests__meta-label">Оплата</span>
                <span>{demand.paymentTerms}</span>
              </div>
            ) : null}
          </div>

          <SupplyModalTabs value={tab} onChange={setTab} />

          {tab === 'items' ? <SupplyItemsTable rows={lineItems} /> : null}

          {tab === 'comments' ? (
            <RequestChatPanel
              items={allComments}
              currentUserId={webUser?.id}
              showTitle={false}
              className="supply-requests__chat--tab"
              onSend={(text) => {
                const result = addConsolidatedDemandComment(demand.id, text)
                if (result.ok) toast.success(result.message)
                else toast.error(result.message)
                return result.ok
              }}
            />
          ) : null}

          {tab === 'documents' ? (
            <SupplyDocumentsPanel
              rows={documentRows}
              onUpload={handleUpload}
              uploadAccept=".xlsx,.xls,.pdf,.xml"
            />
          ) : null}
        </div>
      </RequestWorkspaceModal>

      {returnOpen && onReturn ? (
        <div className="work-tab-bar__dialog" role="dialog" aria-modal="true">
          <div className="work-tab-bar__dialog-card">
            <p className="work-tab-bar__dialog-title">Вернуть сводную</p>
            <textarea
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder="Причина возврата (обязательно)"
              rows={3}
              className="w-full rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
            />
            <div className="work-tab-bar__dialog-actions">
              <button type="button" className="work-tab-bar__dialog-btn" onClick={() => setReturnOpen(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="work-tab-bar__dialog-btn work-tab-bar__dialog-btn--danger"
                disabled={!returnComment.trim()}
                onClick={() => {
                  const result = onReturn(demand.id, returnComment)
                  if (result.ok) toast.success(result.message)
                  else toast.error(result.message)
                  if (result.ok) onClose()
                }}
              >
                Вернуть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
