import type { PackageStatus } from './package'

export type HierarchyPackageStatus = PackageStatus | 'orphan'

export interface Pallet {
  sscc: string
  status: PackageStatus
  boxSsccs: string[]
  productName: string
  batchNumber: string
  expiryDate: string
  boxCount: number
  canisterCount: number
  expectedReceiptId?: string
}

export interface Box {
  sscc: string
  palletSscc: string
  canisterIds: string[]
  status: PackageStatus
  productName: string
  batchNumber: string
  expiryDate: string
  expectedReceiptId?: string
}

export type ExpectedReceiptStatus =
  | 'draft'
  | 'validation_pending'
  | 'validation_failed'
  | 'ready_for_warehouse'
  | 'awaiting_receipt'
  | 'in_progress'
  | 'completed'

export interface ExpectedReceipt {
  id: string
  number: string
  supplierId: string
  supplierName: string
  productName: string
  gtin: string
  palletCount: number
  boxCount: number
  canisterCount: number
  volumeLiters: number
  status: ExpectedReceiptStatus
  createdAt: string
  batches: string[]
  /** Связь с общей сводной потребности */
  consolidatedDemandId?: string
  consolidatedDemandNumber?: string
  requestNumbers?: string[]
  demandSummary?: string
}

export interface PickTask {
  id: string
  number: string
  requestId: string
  targetCanisters: number
  reservedBoxSsccs: string[]
  reservedCanisterIds: string[]
  pickedCanisters: number
  status: 'draft' | 'reserved' | 'picking' | 'completed'
}

export interface ImportValidationCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

export interface ImportValidation {
  passed: boolean
  palletCount: number
  boxCount: number
  canisterCount: number
  checks: ImportValidationCheck[]
  validatedAt: string
}

export interface ProductBatch {
  batchNumber: string
  gtin: string
  productionDate: string
  expiryDate: string
  canisterCount: number
  volumeLiters: number
}
