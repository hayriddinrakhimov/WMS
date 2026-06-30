'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import {
  PROCUREMENT_REQUEST_STATUS_LABELS,
  buildRequestDocuments,
  getEnterpriseName,
  normalizeCommentHistory,
  selectableEnterprisesForUser,
  targetWarehouseForEnterprise,
  ALL_ENTERPRISES_FILTER,
  procurementOfficersForEnterprise,
  type CreateProcurementRequestInput,
  type PendingRequestAttachment,
  type ProcurementRequest,
  type ProcurementRequestComment,
  type RequestDocument,
  type User,
} from '@wms/domain'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { useDemoStore } from '@/lib/demo-store'
import { REQUEST_CATALOG, getCatalogProduct, searchCatalog } from './request-catalog'
import { getDemandSuggestion, type DemandSuggestion } from './demand-hint'
import { DemandSuggestModal, DemandWandButton } from './DemandSuggestModal'
import { SupplyDocumentsPanel, type SupplyDocumentRow } from './SupplyDocumentsPanel'
import { RequestChatPanel } from './RequestChatPanel'
import { RequestWorkspaceModal } from './RequestWorkspaceModal'
import { SupplyItemsTable, renderSupplyItemsModalFooter } from './SupplyItemsTable'
import { SupplyModalTabs, type SupplyModalTab } from './SupplyModalTabs'
import { procurementRequestLineRows } from './supply-modal-rows'
import { OrderUnitMenu } from './OrderUnitMenu'
import {
  createEmptyDraftLines,
  defaultOrderUnit,
  displayUnitLabel,
  formatOrderVolume,
  formatVolumeBreakdown,
  fromBaseQuantity,
  toBaseQuantity,
  type OrderUnitId,
  type RequestDraftLine,
} from './request-units'

type FormTab = SupplyModalTab
type DemandModalTarget = { productCode: string }

export type RequestModalOpen =
  | { kind: 'create'; requestId?: string }
  | { kind: 'detail'; requestId: string }

export type RequestsPanelHandle = {
  openCreate: () => void
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function isLineActive(line: RequestDraftLine | undefined): boolean {
  return !!line && line.orderQty > 0
}

function RequestDocumentsSection({
  generatedDocuments,
  uploadedDocuments,
  pendingUploads = [],
  onFiles,
  onRemovePending,
  onDownload,
}: {
  generatedDocuments: Array<{
    id: string
    title: string
    fileName: string
    available: boolean
  }>
  uploadedDocuments: RequestDocument[]
  pendingUploads?: PendingRequestAttachment[]
  onFiles: (files: FileList) => void
  onRemovePending?: (fileName: string) => void
  onDownload: (title: string) => void
}) {
  const rows: SupplyDocumentRow[] = [
    ...generatedDocuments
      .filter((doc) => doc.available)
      .map((doc) => ({
        key: doc.id,
        title: doc.title,
        subtitle: doc.fileName,
        download: {
          onClick: () => onDownload(doc.title),
        },
      })),
    ...uploadedDocuments.map((doc) => ({
      key: doc.id,
      title: doc.title,
      subtitle: `${doc.uploadedBy ? `${doc.uploadedBy} · ` : ''}${
        doc.uploadedAt ? formatDateTime(doc.uploadedAt) : doc.fileName
      }`,
      download: {
        onClick: () => onDownload(doc.title),
      },
    })),
    ...pendingUploads.map((file) => ({
      key: file.fileName,
      title: file.fileName,
      subtitle: 'Будет сохранён с заявкой',
      pending: true,
      ...(onRemovePending
        ? {
            remove: {
              label: `Убрать ${file.fileName}`,
              onClick: () => onRemovePending(file.fileName),
            },
          }
        : {}),
    })),
  ]

  return <SupplyDocumentsPanel rows={rows} onUpload={onFiles} />
}

function draftLinesFromRequest(
  items: ProcurementRequest['items'],
): Record<string, RequestDraftLine> {
  const draft = createEmptyDraftLines()
  for (const item of items) {
    const product = getCatalogProduct(item.productCode)
    if (!product) continue
    const orderUnit = defaultOrderUnit(product)
    draft[item.productCode] = {
      enabled: true,
      orderQty: fromBaseQuantity(product, item.quantity, orderUnit),
      orderUnit,
    }
  }
  return draft
}

function buildItemsFromDraft(
  draftLines: Record<string, RequestDraftLine>,
): CreateProcurementRequestInput['items'] {
  return REQUEST_CATALOG.flatMap((product) => {
    const line = draftLines[product.code]
    if (!line || line.orderQty <= 0) return []
    const quantity = toBaseQuantity(product, line.orderQty, line.orderUnit)
    if (quantity <= 0) return []
    return [
      {
        productCode: product.code,
        productName: product.name,
        quantity,
        unit: product.unit,
        price: product.price,
      },
    ]
  })
}

export const RequestsPanel = forwardRef<
  RequestsPanelHandle,
  {
    user: User | null
    enterpriseId: string
    dueDateFilter?: string
    onDirtyChange?: (dirty: boolean) => void
    autoOpen?: RequestModalOpen
    onAutoOpenConsumed?: () => void
    selectedRequestIds?: Set<string>
    onToggleRequest?: (id: string) => void
    onApproveRequest?: (id: string) => { ok: boolean; message: string }
    onReturnRequest?: (id: string, comment: string) => { ok: boolean; message: string }
    onCreateTransfer?: (id: string) => { ok: boolean; message: string }
  }
>(function RequestsPanel(
  {
    user,
    enterpriseId: activeEnterpriseId,
    dueDateFilter = '',
    onDirtyChange,
    autoOpen,
    onAutoOpenConsumed,
    selectedRequestIds,
    onToggleRequest,
    onApproveRequest,
    onReturnRequest,
    onCreateTransfer,
  },
  ref,
) {
  const { procurementRequests, saveProcurementRequest, addRequestAttachment, addProcurementRequestComment } = useDemoStore()

  const [requestModal, setRequestModal] = useState<RequestModalOpen | null>(null)
  const [pendingModalClose, setPendingModalClose] = useState(false)

  const [detailTab, setDetailTab] = useState<SupplyModalTab>('items')
  const [formTab, setFormTab] = useState<FormTab>('items')
  const [editingId, setEditingId] = useState<string | undefined>()
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [comment, setComment] = useState('')
  const [commentHistory, setCommentHistory] = useState<ProcurementRequestComment[]>([])
  const [productQuery, setProductQuery] = useState('')
  const [draftLines, setDraftLines] = useState<Record<string, RequestDraftLine>>(createEmptyDraftLines)
  const [formEnterpriseId, setFormEnterpriseId] = useState(
    () => user?.enterpriseId ?? 'ent-hq',
  )
  const [formAssigneeId, setFormAssigneeId] = useState(user?.id ?? 'user-1')
  const [pendingAttachments, setPendingAttachments] = useState<PendingRequestAttachment[]>([])
  const [returnRequestOpen, setReturnRequestOpen] = useState(false)
  const [returnRequestComment, setReturnRequestComment] = useState('')

  const docUploadTargetRef = useRef<'create' | 'detail'>('create')
  const [demandModal, setDemandModal] = useState<DemandModalTarget | null>(null)
  const [demandSuggestion, setDemandSuggestion] = useState<DemandSuggestion | null>(null)

  useEffect(() => {
    onDirtyChange?.(false)
  }, [onDirtyChange])

  const resolvedRequestId =
    requestModal?.kind === 'detail'
      ? requestModal.requestId
      : requestModal?.kind === 'create'
        ? requestModal.requestId
        : null

  const allowedEnterprises = useMemo(() => selectableEnterprisesForUser(user), [user])
  const defaultFormEnterpriseId =
    user?.enterpriseId ?? allowedEnterprises[0]?.id ?? 'ent-hq'

  const enterpriseRequests = useMemo(
    () =>
      procurementRequests
        .filter((r) => activeEnterpriseId === ALL_ENTERPRISES_FILTER || r.enterpriseId === activeEnterpriseId)
        .filter((r) => {
          if (!dueDateFilter) return true
          return r.dueDate.slice(0, 10) === dueDateFilter
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [procurementRequests, activeEnterpriseId, dueDateFilter],
  )

  const showAllEnterprises = activeEnterpriseId === ALL_ENTERPRISES_FILTER

  const selectedRequest =
    enterpriseRequests.find((r) => r.id === resolvedRequestId) ??
    procurementRequests.find((r) => r.id === resolvedRequestId)

  const visibleProducts = useMemo(() => searchCatalog(productQuery), [productQuery])

  const editingRequest = editingId
    ? procurementRequests.find((r) => r.id === editingId)
    : undefined
  const formTargetWarehouse = useMemo(
    () => targetWarehouseForEnterprise(formEnterpriseId),
    [formEnterpriseId],
  )
  const supplyOfficers = useMemo(
    () => procurementOfficersForEnterprise(formEnterpriseId),
    [formEnterpriseId],
  )

  useEffect(() => {
    if (!supplyOfficers.some((o) => o.id === formAssigneeId)) {
      setFormAssigneeId(supplyOfficers[0]?.id ?? formAssigneeId)
    }
  }, [supplyOfficers, formAssigneeId])

  const orderTotals = useMemo(() => {
    let totalSum = 0
    let totalVolume = 0
    let selectedCount = 0
    let volumeUnit = 'л'

    for (const product of REQUEST_CATALOG) {
      const line = draftLines[product.code]
      if (!line || line.orderQty <= 0) continue
      const baseQty = toBaseQuantity(product, line.orderQty, line.orderUnit)
      if (baseQty <= 0) continue
      selectedCount += 1
      totalSum += baseQty * product.price
      totalVolume += baseQty
      if (product.unit === 'кг') volumeUnit = 'кг'
    }

    return { totalSum, totalVolume, selectedCount, volumeUnit }
  }, [draftLines])

  const resetForm = () => {
    setEditingId(undefined)
    setDueDate(defaultDueDate())
    setComment('')
    setCommentHistory([])
    setProductQuery('')
    setDraftLines(createEmptyDraftLines())
    setPendingAttachments([])
    const formEnterprise =
      activeEnterpriseId === ALL_ENTERPRISES_FILTER ? defaultFormEnterpriseId : activeEnterpriseId
    setFormEnterpriseId(formEnterprise)
    const officers = procurementOfficersForEnterprise(formEnterprise)
    setFormAssigneeId(
      user?.id && officers.some((o) => o.id === user.id) ? user.id : officers[0]?.id ?? 'user-1',
    )
    setFormTab('items')
  }

  const isCreateFormDirty = () =>
    !!comment.trim() || buildItemsFromDraft(draftLines).length > 0 || pendingAttachments.length > 0

  const openCreateModal = () => {
    resetForm()
    setRequestModal({ kind: 'create' })
  }

  const openEditDraft = (req: ProcurementRequest) => {
    setEditingId(req.id)
    setDueDate(req.dueDate.slice(0, 10))
    setFormEnterpriseId(req.enterpriseId)
    setFormAssigneeId(req.createdById)
    setComment('')
    setCommentHistory(normalizeCommentHistory(req))
    setDraftLines(draftLinesFromRequest(req.items))
  }

  useImperativeHandle(ref, () => ({
    openCreate: openCreateModal,
  }))

  useEffect(() => {
    if (!autoOpen) return
    if (autoOpen.kind === 'create') {
      if (autoOpen.requestId) {
        const req = procurementRequests.find((r) => r.id === autoOpen.requestId)
        if (req) openEditDraft(req)
        setRequestModal({ kind: 'create', requestId: autoOpen.requestId })
      } else {
        openCreateModal()
      }
    } else {
      setRequestModal({ kind: 'detail', requestId: autoOpen.requestId })
      setDetailTab('items')
    }
    onAutoOpenConsumed?.()
  }, [autoOpen, onAutoOpenConsumed, procurementRequests])

  const closeRequestModal = () => {
    if (requestModal?.kind === 'create' && isCreateFormDirty()) {
      setPendingModalClose(true)
      return
    }
    setRequestModal(null)
    resetForm()
    setPendingModalClose(false)
  }

  const confirmModalClose = () => {
    setRequestModal(null)
    resetForm()
    setPendingModalClose(false)
  }

  const openCreate = () => {
    openCreateModal()
  }

  const openRequest = (req: ProcurementRequest) => {
    if (req.status === 'draft' || req.status === 'returned') {
      openEditDraft(req)
      setRequestModal({ kind: 'create', requestId: req.id })
    } else {
      setDetailTab('items')
      setRequestModal({ kind: 'detail', requestId: req.id })
    }
  }

  const openDemandModal = (target: DemandModalTarget) => {
    const suggestion = getDemandSuggestion(formEnterpriseId, target.productCode)
    if (!suggestion) return
    setDemandModal(target)
    setDemandSuggestion(suggestion)
  }

  const closeDemandModal = () => {
    setDemandModal(null)
    setDemandSuggestion(null)
  }

  const applyDemandSuggestion = () => {
    if (!demandModal || !demandSuggestion) return
    const product = getCatalogProduct(demandSuggestion.productCode)
    if (!product) return

    const orderUnit = draftLines[product.code]?.orderUnit ?? defaultOrderUnit(product)
    const orderQty = fromBaseQuantity(product, demandSuggestion.suggestQty, orderUnit)

    setDraftLines((prev) => ({
      ...prev,
      [product.code]: {
        enabled: true,
        orderUnit,
        orderQty: orderQty > 0 ? orderQty : 1,
      },
    }))
    closeDemandModal()
  }

  const toggleRowActive = (productCode: string) => {
    setDraftLines((prev) => {
      const current = prev[productCode]
      if (!current) return prev
      const active = current.orderQty > 0
      const orderQty = active ? 0 : 1
      return {
        ...prev,
        [productCode]: {
          ...current,
          orderQty,
          enabled: orderQty > 0,
        },
      }
    })
  }

  const updateDraftOrder = (productCode: string, orderQty: number, orderUnit: OrderUnitId) => {
    setDraftLines((prev) => {
      const current = prev[productCode]
      if (!current) return prev
      const qty = Math.max(0, orderQty)
      return {
        ...prev,
        [productCode]: {
          ...current,
          orderQty: qty,
          orderUnit,
          enabled: qty > 0,
        },
      }
    })
  }

  const buildInput = (): CreateProcurementRequestInput => ({
    enterpriseId: formEnterpriseId,
    assigneeId: formAssigneeId,
    dueDate,
    comment: comment.trim() || undefined,
    attachments: pendingAttachments.length ? pendingAttachments : undefined,
    items: buildItemsFromDraft(draftLines),
  })

  const handleSave = (mode: 'draft' | 'submit') => {
    if (!buildItemsFromDraft(draftLines).length) {
      toast.error('Отметьте хотя бы одну позицию в номенклатуре')
      return
    }
    const result = saveProcurementRequest(buildInput(), mode, editingId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
    if (result.ok) {
      if (result.commentHistory) {
        setCommentHistory(result.commentHistory)
        setComment('')
      }
      setPendingAttachments([])
      if (mode === 'draft' && result.requestId) {
        setEditingId(result.requestId)
        setRequestModal({ kind: 'create', requestId: result.requestId })
      } else if (result.requestId) {
        setRequestModal({ kind: 'detail', requestId: result.requestId })
        setDetailTab('items')
        resetForm()
      } else {
        closeRequestModal()
      }
    }
  }

  const handleDocDownload = (title: string) => {
    toast.info(`Демо: скачивание «${title}»`)
  }

  const handleDocumentFiles = (files: FileList | null) => {
    if (!files?.length) return
    const names = Array.from(files).map((file) => file.name)
    if (docUploadTargetRef.current === 'detail' && selectedRequest) {
      for (const name of names) {
        const result = addRequestAttachment(selectedRequest.id, name)
        if (result.ok) toast.success(result.message)
        else toast.error(result.message)
      }
      return
    }

    setPendingAttachments((prev) => {
      const known = new Set([
        ...prev.map((file) => file.fileName),
        ...(editingRequest?.documents
          .filter((doc) => doc.type === 'attachment')
          .map((doc) => doc.fileName) ?? []),
      ])
      const next = [...prev]
      for (const name of names) {
        if (!known.has(name)) next.push({ fileName: name })
      }
      return next
    })
  }

  const draftGeneratedDocuments = useMemo(
    () => buildRequestDocuments(editingRequest?.status ?? 'draft'),
    [editingRequest?.status],
  )

  const savedDraftAttachments = useMemo(
    () => editingRequest?.documents.filter((doc) => doc.type === 'attachment') ?? [],
    [editingRequest],
  )

  const renderDetailContent = (inModal = false) => {
    if (!selectedRequest) return null
    return (
      <>
        {!inModal ? (
          <div className="supply-requests__head">
            <button type="button" className="supply-requests__back" onClick={closeRequestModal}>
              ← К списку заявок
            </button>
          </div>
        ) : null}
        {!inModal ? (
          <div className="supply-requests__head-main mb-4">
            <div>
              <h2 className="supply-requests__title">{selectedRequest.number}</h2>
              <p className="supply-requests__subtitle">
                {selectedRequest.enterpriseName} ·{' '}
                {formatDateTime(selectedRequest.submittedAt ?? selectedRequest.createdAt)}
              </p>
            </div>
            <span className={`supply-requests__status supply-requests__status--${selectedRequest.status}`}>
              {PROCUREMENT_REQUEST_STATUS_LABELS[selectedRequest.status]}
            </span>
          </div>
        ) : null}

        <div className="supply-requests__meta">
          <div>
            <span className="supply-requests__meta-label">Срок выдачи</span>
            <span>{new Date(selectedRequest.dueDate).toLocaleDateString('ru-RU')}</span>
          </div>
          <div>
            <span className="supply-requests__meta-label">Склад назначения</span>
            <span>
              {selectedRequest.warehouseName
                ? `Главный склад → ${selectedRequest.warehouseName}`
                : 'Главный склад'}
            </span>
          </div>
          <div>
            <span className="supply-requests__meta-label">Снабженец</span>
            <span>{selectedRequest.createdBy}</span>
          </div>
          <div>
            <span className="supply-requests__meta-label">Удовлетворение</span>
            <span className="font-semibold text-[var(--primary)]">{selectedRequest.fulfillmentPercent}%</span>
          </div>
        </div>

        <SupplyModalTabs value={detailTab} onChange={setDetailTab} />

        {detailTab === 'items' ? (
          <SupplyItemsTable
            rows={procurementRequestLineRows(selectedRequest)}
            showRequests={false}
          />
        ) : null}

        {detailTab === 'comments' ? (
          <RequestChatPanel
            items={normalizeCommentHistory(selectedRequest)}
            currentUserId={user?.id}
            showTitle={false}
            className="supply-requests__chat--tab"
            onSend={(text) => {
              const result = addProcurementRequestComment(selectedRequest.id, text)
              if (result.ok) toast.success(result.message)
              else toast.error(result.message)
              return result.ok
            }}
          />
        ) : null}

        {detailTab === 'documents' ? (
          <RequestDocumentsSection
            generatedDocuments={selectedRequest.documents.filter((doc) => doc.type !== 'attachment')}
            uploadedDocuments={selectedRequest.documents.filter((doc) => doc.type === 'attachment')}
            onFiles={(files) => {
              docUploadTargetRef.current = 'detail'
              handleDocumentFiles(files)
            }}
            onDownload={handleDocDownload}
          />
        ) : null}
      </>
    )
  }

  const renderCreateActions = () => (
    <div className="supply-requests__footer-bar">
      <div className="supply-requests__order-totals">
        <span className="supply-requests__order-totals-count">
          Итого: {orderTotals.selectedCount}{' '}
          {orderTotals.selectedCount === 1 ? 'позиция' : 'позиций'}
        </span>
        <span className="supply-requests__order-totals-volume">
          {orderTotals.totalVolume > 0
            ? `${orderTotals.totalVolume.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${orderTotals.volumeUnit}`
            : '—'}
        </span>
        <span className="supply-requests__order-totals-sum">
          {orderTotals.totalSum > 0 ? `${formatMoney(orderTotals.totalSum)} ₸` : '—'}
        </span>
      </div>
      <div className="supply-requests__actions">
        <button type="button" className="supply-requests__btn supply-requests__btn--ghost" onClick={() => handleSave('draft')}>
          Сохранить черновик
        </button>
        <button type="button" className="supply-requests__btn supply-requests__btn--primary" onClick={() => handleSave('submit')}>
          Отправить заявку
        </button>
      </div>
    </div>
  )

  const renderCreateContent = (inModal = false) => (
    <>
      {demandSuggestion && demandModal ? (
        <DemandSuggestModal
          suggestion={demandSuggestion}
          onConfirm={applyDemandSuggestion}
          onCancel={closeDemandModal}
        />
      ) : null}

      {!inModal ? (
        <div className="supply-requests__head">
          <h2 className="supply-requests__title">
            {editingId ? 'Редактирование черновика' : 'Новая заявка'}
          </h2>
        </div>
      ) : null}

        <div className="supply-requests__meta supply-requests__meta--form">
          <label className="supply-requests__field">
            <span>Срок выдачи</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="supply-requests__field">
            <span>Предприятие</span>
            {allowedEnterprises.length > 0 ? (
              <select
                value={formEnterpriseId}
                onChange={(e) => setFormEnterpriseId(e.target.value)}
                aria-label="Предприятие"
              >
                {allowedEnterprises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            ) : (
              <input type="text" readOnly value={getEnterpriseName(formEnterpriseId)} />
            )}
          </label>
          <label className="supply-requests__field">
            <span>Склад назначения</span>
            <input type="text" readOnly value={formTargetWarehouse.name} />
          </label>
          <label className="supply-requests__field">
            <span>Снабженец</span>
            <select
              value={formAssigneeId}
              onChange={(e) => setFormAssigneeId(e.target.value)}
              aria-label="Снабженец"
            >
              {supplyOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <SupplyModalTabs value={formTab} onChange={setFormTab} />

        {formTab === 'items' ? (
          <div className="space-y-4">
            <label className="supply-requests__search">
              <Search className="size-4 text-[var(--app-muted)]" />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Поиск по номенклатуре…"
              />
            </label>

            <div className="module-content-table supply-requests__nomenclature-table">
              <table>
                <thead>
                  <tr>
                    <th className="w-10" />
                    <th>Номенклатура</th>
                    <th>Заказ</th>
                    <th>Объём</th>
                    <th>Цена / {orderTotals.volumeUnit === 'кг' ? 'кг' : 'л'}</th>
                    <th>Сумма</th>
                    <th className="w-12">Спрос</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-[var(--app-muted)]">
                        Ничего не найдено по запросу
                      </td>
                    </tr>
                  ) : (
                    visibleProducts.map((product) => {
                      const line = draftLines[product.code] ?? {
                        enabled: false,
                        orderQty: 0,
                        orderUnit: defaultOrderUnit(product),
                      }
                      const active = isLineActive(line)
                      const baseQty = active
                        ? toBaseQuantity(product, line.orderQty, line.orderUnit)
                        : 0
                      const breakdown = formatVolumeBreakdown(product, baseQty)
                      const lineSum = baseQty * product.price

                      return (
                        <tr
                          key={product.code}
                          className={cn(
                            'supply-requests__nomenclature-row',
                            active
                              ? 'supply-requests__nomenclature-row--active'
                              : 'supply-requests__nomenclature-row--idle',
                          )}
                          onClick={() => toggleRowActive(product.code)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={active}
                              readOnly
                              tabIndex={-1}
                              aria-label={`Заказать ${product.name}`}
                              className="pointer-events-none"
                            />
                          </td>
                          <td>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-[var(--app-muted)]">
                              {product.code}
                              {product.volumeLiters
                                ? ` · канистра ${product.volumeLiters} л`
                                : product.bagWeightKg
                                  ? ` · мешок ${product.bagWeightKg} кг`
                                  : ''}
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="supply-requests__qty-cell">
                              <input
                                type="number"
                                min={0}
                                step={
                                  line.orderUnit === 'base' || line.orderUnit === 'liters' ? 0.1 : 1
                                }
                                value={active ? line.orderQty : 0}
                                disabled={!active}
                                onChange={(e) =>
                                  updateDraftOrder(
                                    product.code,
                                    Number(e.target.value),
                                    line.orderUnit,
                                  )
                                }
                                className="supply-requests__qty-input"
                              />
                              <span className="supply-requests__qty-unit">
                                {displayUnitLabel(product, line.orderUnit)}
                              </span>
                              <OrderUnitMenu
                                product={product}
                                orderQty={line.orderQty}
                                orderUnit={line.orderUnit}
                                disabled={!active}
                                onChange={(qty, unit) => updateDraftOrder(product.code, qty, unit)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="tabular-nums text-sm font-medium">
                              {active ? formatOrderVolume(product, baseQty) : '—'}
                            </div>
                            {active && breakdown ? (
                              <div className="text-[10px] text-[var(--app-muted)]">{breakdown}</div>
                            ) : null}
                          </td>
                          <td className="tabular-nums">{formatMoney(product.price)} ₸</td>
                          <td className="tabular-nums font-medium">
                            {active && baseQty > 0 ? `${formatMoney(lineSum)} ₸` : '—'}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <DemandWandButton
                              compact
                              onClick={() => openDemandModal({ productCode: product.code })}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {formTab === 'comments' ? (
          <div className="space-y-4">
            <label className="supply-requests__field supply-requests__field--comment">
              <span>Новое сообщение</span>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Особые условия, срочность, склад назначения…"
                className="supply-requests__comment-input"
              />
            </label>
            {commentHistory.length > 0 ? (
              <RequestChatPanel
                items={commentHistory}
                currentUserId={user?.id}
                showTitle={false}
                className="supply-requests__chat--tab"
              />
            ) : null}
          </div>
        ) : null}

        {formTab === 'documents' ? (
          <RequestDocumentsSection
            generatedDocuments={draftGeneratedDocuments}
            uploadedDocuments={savedDraftAttachments}
            pendingUploads={pendingAttachments}
            onFiles={(files) => {
              docUploadTargetRef.current = 'create'
              handleDocumentFiles(files)
            }}
            onRemovePending={(fileName) =>
              setPendingAttachments((prev) => prev.filter((file) => file.fileName !== fileName))
            }
            onDownload={handleDocDownload}
          />
        ) : null}

        {!inModal ? renderCreateActions() : null}
    </>
  )

  return (
    <>
      <div className="module-content-table">
        <table>
          <thead>
            <tr>
              <th className="w-10" aria-label="Выбор" />
              <th>№ заявки</th>
              {showAllEnterprises ? <th>Предприятие</th> : null}
              <th>Время подачи</th>
              <th>Статус</th>
              <th>Удовлетворение</th>
              <th>Срок выдачи</th>
              <th>Снабженец</th>
            </tr>
          </thead>
          <tbody>
            {enterpriseRequests.length === 0 ? (
              <tr>
                <td colSpan={showAllEnterprises ? 8 : 7} className="py-10 text-center text-sm text-[var(--app-muted)]">
                  {showAllEnterprises ? 'Заявок пока нет' : 'Заявок по этому предприятию пока нет'}
                </td>
              </tr>
            ) : (
              enterpriseRequests.map((req) => (
                <tr
                  key={req.id}
                  className="cursor-pointer hover:bg-[#f8fafc]"
                  onClick={() => openRequest(req)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    {req.status === 'approved' && onToggleRequest ? (
                      <input
                        type="checkbox"
                        checked={selectedRequestIds?.has(req.id) ?? false}
                        onChange={() => onToggleRequest(req.id)}
                        aria-label={`Включить ${req.number} в сводную`}
                      />
                    ) : null}
                  </td>
                  <td className="font-semibold">{req.number}</td>
                  {showAllEnterprises ? (
                    <td className="text-sm text-[var(--app-muted)]">{req.enterpriseName}</td>
                  ) : null}
                  <td>{formatDateTime(req.submittedAt ?? req.createdAt)}</td>
                  <td>
                    <span className={`supply-requests__status supply-requests__status--${req.status}`}>
                      {PROCUREMENT_REQUEST_STATUS_LABELS[req.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="supply-requests__fulfill-bar">
                        <div style={{ width: `${req.fulfillmentPercent}%` }} />
                      </div>
                      <span className="text-xs tabular-nums">{req.fulfillmentPercent}%</span>
                    </div>
                  </td>
                  <td>{new Date(req.dueDate).toLocaleDateString('ru-RU')}</td>
                  <td className="text-[var(--app-muted)]">{req.createdBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {requestModal?.kind === 'detail' && selectedRequest ? (
        <RequestWorkspaceModal
          title={selectedRequest.number}
          subtitle={`${selectedRequest.enterpriseName} · ${formatDateTime(selectedRequest.submittedAt ?? selectedRequest.createdAt)}`}
          status={
            <span className={`supply-requests__status supply-requests__status--${selectedRequest.status}`}>
              {PROCUREMENT_REQUEST_STATUS_LABELS[selectedRequest.status]}
            </span>
          }
          onClose={closeRequestModal}
          footer={
            selectedRequest
              ? renderSupplyItemsModalFooter(
                  detailTab,
                  procurementRequestLineRows(selectedRequest),
                  selectedRequest.status === 'submitted' && onApproveRequest && onReturnRequest ? (
                    <>
                      <button
                        type="button"
                        className="supply-requests__btn supply-requests__btn--ghost"
                        onClick={() => setReturnRequestOpen(true)}
                      >
                        Вернуть
                      </button>
                      <button
                        type="button"
                        className="supply-requests__btn supply-requests__btn--primary"
                        onClick={() => {
                          const result = onApproveRequest(selectedRequest.id)
                          if (result.ok) toast.success(result.message)
                          else toast.error(result.message)
                          if (result.ok) closeRequestModal()
                        }}
                      >
                        Утвердить
                      </button>
                    </>
                  ) : selectedRequest.status === 'partially_fulfilled' && onCreateTransfer ? (
                    <button
                      type="button"
                      className="supply-requests__btn supply-requests__btn--primary"
                      onClick={() => {
                        const result = onCreateTransfer(selectedRequest.id)
                        if (result.ok) toast.success(result.message)
                        else toast.error(result.message)
                      }}
                    >
                      Перемещение ГС → {selectedRequest.warehouseName ?? 'ДС'}
                    </button>
                  ) : undefined,
                )
              : undefined
          }
        >
          <div className="supply-requests supply-requests--modal">{renderDetailContent(true)}</div>
        </RequestWorkspaceModal>
      ) : null}

      {requestModal?.kind === 'create' ? (
        <RequestWorkspaceModal
          title={editingId ? 'Редактирование черновика' : 'Новая заявка'}
          onClose={closeRequestModal}
          footer={renderCreateActions()}
        >
          <div className="supply-requests supply-requests--modal">{renderCreateContent(true)}</div>
        </RequestWorkspaceModal>
      ) : null}

      {returnRequestOpen && selectedRequest && onReturnRequest ? (
        <div className="work-tab-bar__dialog" role="dialog" aria-modal="true">
          <div className="work-tab-bar__dialog-card">
            <p className="work-tab-bar__dialog-title">Вернуть заявку</p>
            <textarea
              value={returnRequestComment}
              onChange={(e) => setReturnRequestComment(e.target.value)}
              placeholder="Причина возврата (обязательно)"
              rows={3}
              className="w-full rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
            />
            <div className="work-tab-bar__dialog-actions">
              <button
                type="button"
                className="work-tab-bar__dialog-btn"
                onClick={() => {
                  setReturnRequestOpen(false)
                  setReturnRequestComment('')
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                className="work-tab-bar__dialog-btn work-tab-bar__dialog-btn--danger"
                disabled={!returnRequestComment.trim()}
                onClick={() => {
                  const result = onReturnRequest(selectedRequest.id, returnRequestComment)
                  if (result.ok) toast.success(result.message)
                  else toast.error(result.message)
                  if (result.ok) {
                    setReturnRequestOpen(false)
                    setReturnRequestComment('')
                    closeRequestModal()
                  }
                }}
              >
                Вернуть
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingModalClose ? (
        <div className="work-tab-bar__dialog" role="dialog" aria-modal="true">
          <div className="work-tab-bar__dialog-card">
            <p className="work-tab-bar__dialog-title">Закрыть форму?</p>
            <p className="work-tab-bar__dialog-text">
              Есть несохранённые изменения. Закрыть без сохранения?
            </p>
            <div className="work-tab-bar__dialog-actions">
              <button type="button" className="work-tab-bar__dialog-btn" onClick={() => setPendingModalClose(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="work-tab-bar__dialog-btn work-tab-bar__dialog-btn--danger"
                onClick={confirmModalClose}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
})
