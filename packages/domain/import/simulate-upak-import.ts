import type { Canister } from '../package'
import type { Box, ExpectedReceipt, Pallet, ProductBatch } from '../packaging-hierarchy'
import { SUPPLIER_AUGUST, NOMENCLATURE_TORNADO } from '../reference-data'
import {
  TOTAL_BOXES,
  TOTAL_CANISTERS,
  TOTAL_PALLETS,
  TOTAL_VOLUME_LITERS,
  buildUpakHierarchy,
  DEMO_CANISTER_ID,
} from '../scenarios/august-upak-scenario'

export interface SimulatedImportResult {
  pallets: Pallet[]
  boxes: Box[]
  canisters: Canister[]
  batches: ProductBatch[]
  expectedReceipt: ExpectedReceipt
  activeDemoCanisterId: string
  importedAt: string
}

export function simulateUpakImport(options?: {
  consolidatedDemandId?: string
  consolidatedDemandNumber?: string
  requestNumbers?: string[]
  demandSummary?: string
}): SimulatedImportResult {
  const importedAt = new Date().toISOString()
  const { pallets, boxes, canisters, batches } = buildUpakHierarchy(importedAt)

  const demandSummary =
    options?.demandSummary ??
    (options?.consolidatedDemandNumber
      ? `По сводной ${options.consolidatedDemandNumber} ожидаем приход ${NOMENCLATURE_TORNADO.name}`
      : undefined)

  const expectedReceipt: ExpectedReceipt = {
    id: 'er-001',
    number: 'ОП-001',
    supplierId: SUPPLIER_AUGUST.id,
    supplierName: SUPPLIER_AUGUST.name,
    productName: NOMENCLATURE_TORNADO.name,
    gtin: NOMENCLATURE_TORNADO.gtin,
    palletCount: TOTAL_PALLETS,
    boxCount: TOTAL_BOXES,
    canisterCount: TOTAL_CANISTERS,
    volumeLiters: TOTAL_VOLUME_LITERS,
    status: 'validation_pending',
    createdAt: importedAt,
    batches: batches.map((b) => b.batchNumber),
    consolidatedDemandId: options?.consolidatedDemandId,
    consolidatedDemandNumber: options?.consolidatedDemandNumber,
    requestNumbers: options?.requestNumbers,
    demandSummary,
  }
  return {
    pallets,
    boxes,
    canisters,
    batches,
    expectedReceipt,
    activeDemoCanisterId: DEMO_CANISTER_ID,
    importedAt,
  }
}
