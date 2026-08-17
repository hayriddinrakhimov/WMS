import type {
  AuditEntry,
  Box,
  Canister,
  DemoDocument,
  ExpectedReceipt,
  ImportValidation,
  Operation,
  OperationServiceState,
  Pallet,
  PickTask,
  ProductBatch,
  ProcurementRequest,
  ConsolidatedDemand,
  SupplierOrder,
  StockBalance,
  TsdShipment,
  TsdTask,
  WarehouseTask,
} from '@wms/domain'

export const DEFAULT_CANISTERS: Canister[] = []

export interface DemoSummary {
  statReceived: number
  statTransferred: number
  statIssued: number
  statReturned: number
}

// v12 intentionally resets legacy demo data so old company names cannot persist in UI.
export const DEMO_STORAGE_KEY = 'wms-promo-state-v12'

export type PersistedDemoState = {
  webUserId: string | null
  webScreen: string
  summary: DemoSummary
  operations: Operation[]
  documents: DemoDocument[]
  auditLog: AuditEntry[]
  stock: StockBalance[]
  canisters: Canister[]
  pallets: Pallet[]
  boxes: Box[]
  expectedReceipts: ExpectedReceipt[]
  pickTasks: PickTask[]
  batches: ProductBatch[]
  importCompleted: boolean
  importValidation: ImportValidation | null
  activeDemoCanisterId: string | null
  procurementRequests: ProcurementRequest[]
  consolidatedDemands: ConsolidatedDemand[]
  supplierOrders: SupplierOrder[]
  tsdTasks: TsdTask[]
  tsdShipments: TsdShipment[]
  warehouseTasks: WarehouseTask[]
  webFilter?: Record<string, unknown>
}

export const DEFAULT_SUMMARY: DemoSummary = {
  statReceived: 0,
  statTransferred: 0,
  statIssued: 0,
  statReturned: 0,
}

const DEFAULT_STATE: PersistedDemoState = {
  webUserId: null,
  webScreen: 'home',
  summary: DEFAULT_SUMMARY,
  operations: [],
  documents: [],
  auditLog: [],
  stock: [],
  canisters: DEFAULT_CANISTERS,
  pallets: [],
  boxes: [],
  expectedReceipts: [],
  pickTasks: [],
  batches: [],
  importCompleted: false,
  importValidation: null,
  activeDemoCanisterId: null,
  procurementRequests: [],
  consolidatedDemands: [],
  supplierOrders: [],
  tsdTasks: [],
  tsdShipments: [],
  warehouseTasks: [],
}

const MODULE_SCREENS = ['home', 'supply', 'scanning', 'warehouses', 'reports']

function normalizeWebScreen(screen?: string) {
  return MODULE_SCREENS.includes(screen ?? '') ? screen! : 'home'
}

export function loadDemoState(): PersistedDemoState {
  if (typeof window === 'undefined') return DEFAULT_STATE

  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return DEFAULT_STATE

    const parsed = JSON.parse(raw) as Partial<PersistedDemoState>

    return {
      ...DEFAULT_STATE,
      ...parsed,
      webScreen: normalizeWebScreen(parsed.webScreen),
      summary: { ...DEFAULT_SUMMARY, ...parsed.summary },
      operations: parsed.operations ?? [],
      documents: parsed.documents ?? [],
      auditLog: parsed.auditLog ?? [],
      stock: parsed.stock ?? [],
      canisters: parsed.canisters ?? DEFAULT_CANISTERS,
      pallets: parsed.pallets ?? [],
      boxes: parsed.boxes ?? [],
      expectedReceipts: parsed.expectedReceipts ?? [],
      pickTasks: parsed.pickTasks ?? [],
      batches: parsed.batches ?? [],
      importCompleted: parsed.importCompleted ?? false,
      importValidation: parsed.importValidation ?? null,
      activeDemoCanisterId: parsed.activeDemoCanisterId ?? null,
      procurementRequests: parsed.procurementRequests ?? [],
      consolidatedDemands: parsed.consolidatedDemands ?? [],
      supplierOrders: parsed.supplierOrders ?? [],
      tsdTasks: parsed.tsdTasks ?? [],
      tsdShipments: parsed.tsdShipments ?? [],
      warehouseTasks: parsed.warehouseTasks ?? [],
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveDemoState(state: PersistedDemoState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function toOperationState(state: {
  operations: Operation[]
  documents: DemoDocument[]
  auditLog: AuditEntry[]
}): OperationServiceState {
  return {
    operations: state.operations,
    documents: state.documents,
    auditLog: state.auditLog,
  }
}

export type { OperationItem } from '@wms/domain'
