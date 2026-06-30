import {
  simulateUpakImport,
  validateImport,
  type Box,
  type Canister,
  type ExpectedReceipt,
  type ImportValidation,
  type Pallet,
  type ProductBatch,
  type WarehouseTask,
} from '@wms/domain'

const OPEN_STATUSES = new Set<ExpectedReceipt['status']>([
  'ready_for_warehouse',
  'awaiting_receipt',
  'in_progress',
])

export function isOpenExpectedReceipt(er: ExpectedReceipt): boolean {
  return OPEN_STATUSES.has(er.status)
}

export function findOpenExpectedReceipt(receipts: ExpectedReceipt[]): ExpectedReceipt | null {
  return receipts.find(isOpenExpectedReceipt) ?? null
}

export function resolveExpectedReceiptForReceivingTask(
  task: WarehouseTask,
  expectedReceipts: ExpectedReceipt[],
): ExpectedReceipt | null {
  if (task.operationType !== 'receiving') return null
  if (task.sourceDocumentId) {
    const byDoc = expectedReceipts.find(
      (er) =>
        er.id === task.sourceDocumentId ||
        er.number === task.sourceDocumentId ||
        task.sourceLabel?.includes(er.number),
    )
    if (byDoc) return byDoc
  }
  if (task.sourceLabel) {
    const byLabel = expectedReceipts.find((er) => task.sourceLabel?.includes(er.number))
    if (byLabel) return byLabel
  }
  return findOpenExpectedReceipt(expectedReceipts)
}

export interface DemoOpBundle {
  pallets: Pallet[]
  boxes: Box[]
  canisters: Canister[]
  batches: ProductBatch[]
  expectedReceipt: ExpectedReceipt
  activeDemoCanisterId: string
  validation: ImportValidation
}

export function nextDemoOpNumbers(existing: ExpectedReceipt[]): { id: string; number: string } {
  const nums = existing
    .map((er) => parseInt(er.number.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  const padded = String(next).padStart(3, '0')
  return { id: `er-${padded}`, number: `ОП-${padded}` }
}

export function buildDemoOpBundle(options?: {
  label?: string
  receiptId?: string
  receiptNumber?: string
}): DemoOpBundle {
  const imported = simulateUpakImport({
    demandSummary: options?.label ?? 'Демо ОП — автоматическая загрузка для приёмки',
  })
  const validation = validateImport(imported.pallets, imported.boxes, imported.canisters)
  const receiptId = options?.receiptId ?? imported.expectedReceipt.id
  const receiptNumber = options?.receiptNumber ?? imported.expectedReceipt.number
  const pallets = imported.pallets.map((p) => ({ ...p, expectedReceiptId: receiptId }))
  const boxes = imported.boxes.map((b) => ({ ...b, expectedReceiptId: receiptId }))
  const canisters = imported.canisters.map((c) => ({ ...c, expectedReceiptId: receiptId }))
  const expectedReceipt: ExpectedReceipt = {
    ...imported.expectedReceipt,
    id: receiptId,
    number: receiptNumber,
    status: validation.passed ? 'ready_for_warehouse' : 'validation_failed',
  }
  return {
    pallets,
    boxes,
    canisters,
    batches: imported.batches,
    expectedReceipt,
    activeDemoCanisterId: imported.activeDemoCanisterId,
    validation,
  }
}

export function warehouseTaskLinkPatch(er: ExpectedReceipt): Pick<
  WarehouseTask,
  'sourceDocumentId' | 'sourceDocumentType' | 'sourceLabel' | 'sourceType'
> {
  return {
    sourceDocumentId: er.id,
    sourceDocumentType: 'supplier_document',
    sourceLabel: er.number,
    sourceType: 'auto',
  }
}
