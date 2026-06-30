import { getEnterpriseById } from './enterprises'

export type ProcurementRequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'in_consolidated'
  | 'awaiting_delivery'
  | 'shipped'
  | 'in_transit'
  | 'returned'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'

export type RequestDocumentType = 'request' | 'transfer' | 'acceptance' | 'invoice' | 'attachment'

export type RequestDocumentSource = 'generated' | 'uploaded'

export type WarehouseActKind = 'supplier_receipt' | 'transfer_handshake' | 'issue' | 'return'

export type WarehouseActBasisType =
  | 'consolidated'
  | 'demand'
  | 'transfer_act'
  | 'issue_act'
  | 'manual'

export interface RequestDocument {
  id: string
  type: RequestDocumentType
  title: string
  fileName: string
  available: boolean
  source?: RequestDocumentSource
  uploadedAt?: string
  uploadedBy?: string
  actKind?: WarehouseActKind
  actNumber?: string
  basisType?: WarehouseActBasisType
  basisId?: string
  basisLabel?: string
  closedAt?: string
}

export interface ProcurementRequestComment {
  id: string
  authorId: string
  authorName: string
  text: string
  createdAt: string
}

export interface ProcurementRequestItem {
  productCode: string
  productName: string
  quantity: number
  unit: string
  price: number
  receivedQty: number
  receiptNumber?: string
  warehouseId?: string
  warehouseName?: string
}

export interface ProcurementRequest {
  id: string
  number: string
  enterpriseId: string
  enterpriseName: string
  warehouseId?: string
  warehouseName?: string
  items: ProcurementRequestItem[]
  status: ProcurementRequestStatus
  createdAt: string
  submittedAt?: string
  dueDate: string
  createdBy: string
  createdById: string
  /** Последний комментарий (совместимость) */
  comment?: string
  commentHistory?: ProcurementRequestComment[]
  fulfillmentPercent: number
  documents: RequestDocument[]
}

export type ConsolidatedDemandStatus = 'draft' | 'approved' | 'awaiting_delivery' | 'merged'

export type SupplierOrderStatus = 'draft' | 'sent' | 'awaiting_delivery' | 'closed'

export interface ConsolidatedDemandItem {
  productCode: string
  productName: string
  quantity: number
  unit: string
  price?: number
}

export interface CreateConsolidatedDemandInput {
  requestIds: string[]
  supplierId: string
  supplierName: string
  deliveryDate: string
  deliveryTerms: string
  paymentTerms: string
  comment?: string
  items: ConsolidatedDemandItem[]
  /** Вложения, добавленные при формировании сводной */
  attachments?: PendingRequestAttachment[]
}

export interface SupplierOrderItem {
  productCode: string
  productName: string
  quantity: number
  unit: string
}

export interface SupplierOrder {
  id: string
  number: string
  consolidatedDemandIds: string[]
  consolidatedNumbers: string[]
  requestNumbers: string[]
  supplierName: string
  items: SupplierOrderItem[]
  status: SupplierOrderStatus
  createdAt: string
  expectedReceiptId?: string
  documents: RequestDocument[]
  comments?: ProcurementRequestComment[]
}

export interface ConsolidatedDemand {
  id: string
  number: string
  requestIds: string[]
  requestNumbers: string[]
  productName: string
  totalQuantity: number
  unit: string
  supplierId: string
  supplierName: string
  status: ConsolidatedDemandStatus
  createdAt: string
  expectedReceiptId?: string
  demandSummary?: string
  supplierOrderId?: string
  comments?: ProcurementRequestComment[]
  items?: ConsolidatedDemandItem[]
  deliveryDate?: string
  deliveryTerms?: string
  paymentTerms?: string
  documents?: RequestDocument[]
}

export const PROCUREMENT_REQUEST_STATUS_LABELS: Record<ProcurementRequestStatus, string> = {
  draft: 'Черновик',
  submitted: 'На согласовании',
  approved: 'Утверждена',
  in_consolidated: 'В работе',
  awaiting_delivery: 'Ожидает поставки',
  shipped: 'Отгружено',
  in_transit: 'В пути',
  returned: 'Возвращена',
  partially_fulfilled: 'Частично закрыта',
  fulfilled: 'Закрыта',
  cancelled: 'Отменена',
}

export const REQUEST_DOCUMENT_LABELS: Record<RequestDocumentType, string> = {
  request: 'Заявка',
  transfer: 'Перемещение на предприятие',
  acceptance: 'Акт приёма-передачи',
  invoice: 'Счёт-фактура',
  attachment: 'Вложение',
}

export const WAREHOUSE_ACT_KIND_LABELS: Record<WarehouseActKind, string> = {
  supplier_receipt: 'Акт приёма поставки',
  transfer_handshake: 'Акт приёма-передачи',
  issue: 'Акт выдачи',
  return: 'Акт возврата',
}

export const CONSOLIDATED_DEMAND_STATUS_LABELS: Record<ConsolidatedDemandStatus, string> = {
  draft: 'Черновик сводной',
  approved: 'Утверждена',
  awaiting_delivery: 'Ожидает поставки',
  merged: 'В заявке поставщику',
}

export const SUPPLIER_ORDER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлена поставщику',
  awaiting_delivery: 'Ожидает поставку',
  closed: 'Закрыта',
}

export function aggregateItemsFromRequests(
  requests: ProcurementRequest[],
): ConsolidatedDemandItem[] {
  const map = new Map<string, ConsolidatedDemandItem>()
  for (const req of requests) {
    for (const item of req.items) {
      const existing = map.get(item.productCode)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        map.set(item.productCode, {
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
        })
      }
    }
  }
  return [...map.values()]
}

export function collectConsolidatedDemandSourceDocuments(
  requests: ProcurementRequest[],
): RequestDocument[] {
  const docs: RequestDocument[] = []
  const seen = new Set<string>()

  for (const req of requests) {
    for (const doc of req.documents) {
      if (!doc.available) continue
      const dedupeKey = `${doc.fileName}|${doc.title}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      docs.push({
        ...doc,
        id: `cd-req-${req.id}-${doc.id}`,
        title: `${req.number}: ${doc.title}`,
        source: doc.source ?? (doc.type === 'attachment' ? 'uploaded' : 'generated'),
      })
    }
  }

  return docs
}

export function buildConsolidatedDemandDocuments(
  number: string,
  available: boolean,
  options?: {
    sourceRequests?: ProcurementRequest[]
    pendingAttachments?: PendingRequestAttachment[]
    uploadedBy?: string
  },
): RequestDocument[] {
  const consolidated: RequestDocument = {
    id: 'doc-consolidated',
    type: 'request',
    title: 'Сводная заявка (электронная)',
    fileName: `svodnaya-${number.replace('СВ-', '')}.pdf`,
    available,
    source: 'generated',
  }

  const fromRequests = options?.sourceRequests
    ? collectConsolidatedDemandSourceDocuments(options.sourceRequests)
    : []
  const knownNames = new Set(fromRequests.map((doc) => doc.fileName))
  const pending = (options?.pendingAttachments ?? [])
    .filter((file) => !knownNames.has(file.fileName))
    .map((file) => attachmentFromFileName(file.fileName, { uploadedBy: options?.uploadedBy }))

  return [consolidated, ...fromRequests, ...pending]
}

export function normalizeCommentHistory(request: ProcurementRequest): ProcurementRequestComment[] {
  if (request.commentHistory?.length) return request.commentHistory
  if (request.comment?.trim()) {
    return [
      {
        id: `${request.id}-comment-legacy`,
        authorId: request.createdById,
        authorName: request.createdBy,
        text: request.comment.trim(),
        createdAt: request.submittedAt ?? request.createdAt,
      },
    ]
  }
  return []
}

export function calcRequestFulfillment(items: ProcurementRequestItem[]): number {
  if (!items.length) return 0
  const ordered = items.reduce((s, i) => s + i.quantity, 0)
  const received = items.reduce((s, i) => s + i.receivedQty, 0)
  if (ordered <= 0) return 0
  return Math.min(100, Math.round((received / ordered) * 100))
}

export function buildRequestDocuments(status: ProcurementRequestStatus): RequestDocument[] {
  const base: RequestDocument[] = [
    {
      id: 'doc-request',
      type: 'request',
      title: REQUEST_DOCUMENT_LABELS.request,
      fileName: 'zayavka.pdf',
      available: status !== 'draft',
      source: 'generated',
    },
    {
      id: 'doc-transfer',
      type: 'transfer',
      title: REQUEST_DOCUMENT_LABELS.transfer,
      fileName: 'peremeshchenie.pdf',
      available: ['partially_fulfilled', 'fulfilled', 'in_consolidated', 'awaiting_delivery'].includes(
        status,
      ),
      source: 'generated',
    },
    {
      id: 'doc-acceptance',
      type: 'acceptance',
      title: REQUEST_DOCUMENT_LABELS.acceptance,
      fileName: 'akt-priema.pdf',
      available: ['partially_fulfilled', 'fulfilled'].includes(status),
      source: 'generated',
    },
    {
      id: 'doc-invoice',
      type: 'invoice',
      title: REQUEST_DOCUMENT_LABELS.invoice,
      fileName: 'schet-faktura.pdf',
      available: ['partially_fulfilled', 'fulfilled'].includes(status),
      source: 'generated',
    },
  ]
  return base
}

export type PendingRequestAttachment = {
  fileName: string
}

export function attachmentFromFileName(
  fileName: string,
  meta?: { uploadedBy?: string },
): RequestDocument {
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'attachment',
    title: fileName,
    fileName,
    available: true,
    source: 'uploaded',
    uploadedAt: new Date().toISOString(),
    uploadedBy: meta?.uploadedBy,
  }
}

export function opDocumentFromFileName(
  fileName: string,
  meta?: { uploadedBy?: string },
): RequestDocument {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'attachment',
    title: 'ОП',
    fileName,
    available: true,
    source: 'uploaded',
    uploadedAt: new Date().toISOString(),
    uploadedBy: meta?.uploadedBy,
  }
}

export function acceptanceActDocument(
  actNumber: string,
  meta?: { uploadedBy?: string },
): RequestDocument {
  return supplierReceiptActDocument(actNumber, { uploadedBy: meta?.uploadedBy })
}

type ActDocumentMeta = {
  uploadedBy?: string
  basisType?: WarehouseActBasisType
  basisId?: string
  basisLabel?: string
  molName?: string
  returnCondition?: string
}

function warehouseActDocument(
  actNumber: string,
  actKind: WarehouseActKind,
  title: string,
  filePrefix: string,
  docType: RequestDocumentType,
  meta?: ActDocumentMeta,
): RequestDocument {
  const slug = actNumber.replace(/[^\dA-Za-zА-Яа-я-]+/g, '-')
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: docType,
    title,
    fileName: `${filePrefix}-${slug}.pdf`,
    available: true,
    source: 'generated',
    uploadedAt: new Date().toISOString(),
    uploadedBy: meta?.uploadedBy,
    actKind,
    actNumber,
    basisType: meta?.basisType,
    basisId: meta?.basisId,
    basisLabel: meta?.basisLabel,
  }
}

/** Приёмка на ГС по сводной → акт приёма поставки */
export function supplierReceiptActDocument(
  actNumber: string,
  meta?: ActDocumentMeta,
): RequestDocument {
  return warehouseActDocument(
    actNumber,
    'supplier_receipt',
    'Акт приёма поставки',
    'akt-priema-postavki',
    'acceptance',
    meta,
  )
}

/** Отгрузка по спросу/заявке → акт приёма-передачи */
export function transferHandshakeActDocument(
  actNumber: string,
  meta?: ActDocumentMeta,
): RequestDocument {
  return warehouseActDocument(
    actNumber,
    'transfer_handshake',
    'Акт приёма-передачи',
    'akt-priema-peredachi',
    'acceptance',
    meta,
  )
}

/** Выдача агроному (МОЛ) — основание вручную */
export function issueActDocument(actNumber: string, meta?: ActDocumentMeta): RequestDocument {
  return warehouseActDocument(
    actNumber,
    'issue',
    'Акт выдачи',
    'akt-vydachi',
    'transfer',
    meta,
  )
}

/** Возврат с поля на основании акта выдачи */
export function returnActDocument(actNumber: string, meta?: ActDocumentMeta): RequestDocument {
  return warehouseActDocument(
    actNumber,
    'return',
    'Акт возврата',
    'akt-vozvrata',
    'transfer',
    meta,
  )
}

export function closeActDocument(doc: RequestDocument, closedAt?: string): RequestDocument {
  const at = closedAt ?? new Date().toISOString()
  return { ...doc, closedAt: at, title: `${doc.title} (закрыт)` }
}

export function mergeRequestDocuments(
  status: ProcurementRequestStatus,
  options?: {
    existingDocuments?: RequestDocument[]
    pendingAttachments?: PendingRequestAttachment[]
    uploadedBy?: string
  },
): RequestDocument[] {
  const generated = buildRequestDocuments(status)
  const existingUploaded = (options?.existingDocuments ?? []).filter((doc) => doc.type === 'attachment')
  const knownNames = new Set(existingUploaded.map((doc) => doc.fileName))
  const pending = (options?.pendingAttachments ?? [])
    .filter((file) => !knownNames.has(file.fileName))
    .map((file) => attachmentFromFileName(file.fileName, { uploadedBy: options?.uploadedBy }))
  return [...generated, ...existingUploaded, ...pending]
}

export type CreateProcurementRequestInput = {
  enterpriseId: string
  dueDate: string
  assigneeId?: string
  comment?: string
  attachments?: PendingRequestAttachment[]
  items: Array<{
    productCode: string
    productName: string
    quantity: number
    unit: string
    price: number
  }>
}

export const PROCUREMENT_OFFICER_PROFILES = [
  { id: 'user-1', name: 'Иванов А.С.', enterpriseId: 'ent-hq' },
  { id: 'user-2', name: 'Ким В.Р.', enterpriseId: 'ent-ast' },
  { id: 'user-3', name: 'Петров К.Н.', enterpriseId: 'ent-shy' },
] as const

export function procurementOfficersForEnterprise(enterpriseId: string) {
  const enterprise = getEnterpriseById(enterpriseId)
  const rootId = enterprise?.parentId ?? enterpriseId
  const matches = PROCUREMENT_OFFICER_PROFILES.filter(
    (officer) => officer.enterpriseId === enterpriseId || officer.enterpriseId === rootId,
  )
  return matches.length ? matches : [...PROCUREMENT_OFFICER_PROFILES]
}
