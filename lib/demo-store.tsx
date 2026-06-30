'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  addOperation,
  advanceCanisterOnScan,
  appendHistory,
  confirmOp,
  createAuditEntry,
  DEMO_BOX_SSCC,
  DEMO_CANISTER_ID,
  DEMO_PALLET_SSCC,
  findCanisterByScan,
  rejectOp,
  resolveScan,
  simulateUpakImport,
  validateImport,
  type Box,
  type Canister,
  acceptanceActDocument,
  closeActDocument,
  issueActDocument,
  mergeRequestDocuments,
  returnActDocument,
  supplierReceiptActDocument,
  transferHandshakeActDocument,
  attachmentFromFileName,
  opDocumentFromFileName,
  calcRequestFulfillment,
  getEnterpriseName,
  targetWarehouseForEnterprise,
  normalizeCommentHistory,
  type ConsolidatedDemand,
  type SupplierOrder,
  type SupplierOrderItem,
  buildConsolidatedDemandDocuments,
  type CreateConsolidatedDemandInput,
  type CreateProcurementRequestInput,
  type ExpectedReceipt,
  type ImportValidation,
  type ModuleFilter,
  type ModuleId,
  type Operation,
  type OperationItem,
  type Pallet,
  type PickTask,
  type ProcurementRequest,
  type ProcurementRequestComment,
  type RequestDocument,
  type ProductBatch,
  type ReturnCondition,
  SUPPLIER_AUGUST,
  NOMENCLATURE_TORNADO,
  type ScanResolution,
  type TsdQuarantineReason,
  type TsdShipment,
  type TsdTask,
  type User,
  type WarehouseTask,
  type WarehouseTaskHistoryEntry,
  type WarehouseTaskOperationType,
  type WarehouseTaskPriority,
  type WarehouseTaskStatus,
  type WarehouseTaskAssigneeType,
} from '@wms/domain'
import { authenticateByOtp, getUserById, getWarehouseName } from './auth'
import {
  DEFAULT_SUMMARY,
  DEFAULT_CANISTERS,
  loadDemoState,
  saveDemoState,
  toOperationState,
  type DemoSummary,
} from './demo-persistence'
import { buildSeedProcurementRequests } from '@wms/modules/supply/seed-requests'
import { catalogNameForCode } from '@wms/modules/supply/request-catalog'
import { buildTsdTasks, nextShipmentNumber } from '@wms/modules/scanning/build-tsd-tasks'
import {
  applyLocationToTab,
  canGoBack,
  canGoForward,
  createWorkTab,
  currentLocation,
  findDocumentTab,
  listTitleForFilter,
  locationKey,
  moduleLandingTitle,
  NEW_TAB_LOCATION,
  normalizeNavFilter,
  tabTitleFromLocation,
  withNormalizedLocation,
  type WorkTab,
  type WorkTabLocation,
} from './work-tabs'
import { DEMO_STOCK } from '@wms/modules/warehouses/mock-data'
import { DEMO_WAREHOUSE_TASKS } from '@wms/modules/warehouses/operations-mock'
import { stockBalancesFromCanisters } from '@/lib/stock-from-canisters'
import {
  canisterScanCode,
  estimateCanisterQtyFromRequestItems,
  mainWarehouseCanistersForSend,
  resolveCanisterIdsFromScanCodes,
  senderTransferDone,
} from '@/lib/transfer-scan'
import {
  createReceivingTaskFromExpectedReceipt,
  createReturnApprovalTask,
  createTransferPairFromRequest,
  nextWarehouseTaskNumber,
  wtHistoryEntry,
} from '@/lib/warehouse-task-factory'
import {
  buildDemoOpBundle,
  findOpenExpectedReceipt,
  isOpenExpectedReceipt,
  nextDemoOpNumbers,
  resolveExpectedReceiptForReceivingTask,
  warehouseTaskLinkPatch,
  type DemoOpBundle,
} from '@/lib/provision-demo-op'
import {
  inferTransferHandshakeRole,
  isTransferSenderTask,
  transferHandshakePatch,
} from '@/lib/demo-transfer'
import {
  canistersIssuedForReturn,
  canistersOnChildForIssue,
  childWarehouseIdForTask,
  DEMO_CHILD_WAREHOUSE_ID,
  findReturnApprovalOperation,
  isDemoAdjustmentOperation,
  pickDemoCanisterIds,
} from '@/lib/ensure-demo-operation'
import type { AuditEntry, DemoDocument, StockBalance } from '@wms/domain'

export type { DemoSummary }
export type WebScreen = ModuleId

export interface CreateWarehouseTaskInput {
  operationType: WarehouseTaskOperationType
  fromLocationName?: string
  toLocationName?: string
  assignedToType: WarehouseTaskAssigneeType
  assignedToName: string
  priority: WarehouseTaskPriority
  sourceLabel?: string
  comment?: string
  expectedQty?: number
}

export interface UpdateWarehouseTaskInput {
  assignedToType?: WarehouseTaskAssigneeType
  assignedToName?: string
  priority?: WarehouseTaskPriority
  comment?: string
  expectedQty?: number
  fromLocationName?: string
  toLocationName?: string
  operationType?: WarehouseTaskOperationType
}

interface DemoStoreValue {
  hydrated: boolean
  webUser: User | null
  webScreen: WebScreen
  webFilter?: ModuleFilter
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
  createWarehouseTask: (
    input: CreateWarehouseTaskInput,
    mode: 'draft' | 'create' | 'send_to_tsd',
  ) => { ok: boolean; message: string; taskId?: string }
  createTransferTaskPairFromRequest: (requestId: string) => {
    ok: boolean
    message: string
    senderId?: string
    receiverId?: string
  }
  updateWarehouseTask: (
    taskId: string,
    patch: UpdateWarehouseTaskInput,
  ) => { ok: boolean; message: string }
  cancelWarehouseTask: (taskId: string, reason: string) => { ok: boolean; message: string }
  deleteWarehouseTask: (taskId: string) => { ok: boolean; message: string }
  sendWarehouseTaskToTsd: (taskId: string) => { ok: boolean; message: string }
  startWarehouseTaskOnTsd: (taskId: string) => { ok: boolean; message: string }
  ensureReceivingExpectedReceipt: (warehouseTaskId: string) => {
    ok: boolean
    message: string
    receiptId?: string
  }
  ensureTransferTaskReady: (warehouseTaskId: string) => { ok: boolean; message: string }
  ensureWarehouseTaskDemoReady: (warehouseTaskId: string) => {
    ok: boolean
    message: string
    receiptId?: string
  }
  ensureDemoIssueReady: (warehouseId?: string) => { ok: boolean; message: string }
  ensureDemoReturnReady: (warehouseId?: string) => { ok: boolean; message: string }
  ensureReturnApprovalDemo: (warehouseTaskId: string) => { ok: boolean; message: string }
  completeDemoWarehouseTask: (
    warehouseTaskId: string,
    scannedCodes: string[],
  ) => { ok: boolean; message: string }
  resolveWarehouseDiscrepancy: (
    taskId: string,
    action: 'accept' | 'recheck' | 'cancel',
    reason?: string,
  ) => { ok: boolean; message: string }
  login: (otp: string) => User | null
  logout: () => void
  setWebScreen: (screen: WebScreen) => void
  navigateWeb: (moduleId: ModuleId, filter?: ModuleFilter) => void
  workTabs: WorkTab[]
  activeWorkTabId: string
  activeWorkTab: WorkTab | undefined
  canWorkTabGoBack: boolean
  canWorkTabGoForward: boolean
  openWorkTab: (moduleId: ModuleId, filter?: ModuleFilter, title?: string) => void
  navigateActiveWorkTab: (
    location: WorkTabLocation,
    title?: string,
    options?: { replace?: boolean },
  ) => void
  closeWorkTab: (tabId: string) => void
  selectWorkTab: (tabId: string) => void
  addModuleLandingTab: () => void
  /** @deprecated alias */ addWorkTab: () => void
  workTabBack: () => void
  workTabForward: () => void
  selectWorkTabHistory: (index: number) => void
  refreshActiveWorkTab: () => void
  setActiveWorkTabDirty: (dirty: boolean) => void
  renameActiveWorkTab: (title: string) => void
  saveProcurementRequest: (
    input: CreateProcurementRequestInput,
    mode: 'draft' | 'submit',
    requestId?: string,
  ) => { ok: boolean; message: string; requestId?: string; requestNumber?: string; commentHistory?: ProcurementRequestComment[] }
  addRequestAttachment: (requestId: string, fileName: string) => { ok: boolean; message: string }
  addProcurementRequestComment: (requestId: string, text: string) => { ok: boolean; message: string }
  addConsolidatedDemandComment: (demandId: string, text: string) => { ok: boolean; message: string }
  addSupplierOrderComment: (orderId: string, text: string) => { ok: boolean; message: string }
  addConsolidatedDemandAttachment: (demandId: string, fileName: string) => { ok: boolean; message: string }
  addConsolidatedDemandOpFile: (demandId: string, fileName: string) => { ok: boolean; message: string }
  approveProcurementRequest: (id: string) => { ok: boolean; message: string }
  createConsolidatedDemand: (input: CreateConsolidatedDemandInput) => {
    ok: boolean
    message: string
    demandNumber?: string
    demandId?: string
  }
  approveConsolidatedDemand: (id: string) => { ok: boolean; message: string }
  createSupplierOrder: (consolidatedDemandIds: string[]) => {
    ok: boolean
    message: string
    orderNumber?: string
    orderId?: string
  }
  returnConsolidatedDemand: (id: string, comment: string) => { ok: boolean; message: string }
  returnProcurementRequests: (requestIds: string[], comment: string) => { ok: boolean; message: string }
  confirmOperation: (opId: string, device?: 'web' | 'tsd') => void
  rejectOperation: (opId: string, device?: 'web' | 'tsd') => void
  simulateUpakUpload: (supplierOrderId: string) => { ok: boolean; message: string }
  runImportValidation: () => ImportValidation
  transferExpectedReceiptToWarehouse: (id: string) => { ok: boolean; message: string }
  resolveScanCode: (code: string) => ScanResolution | null
  scanOnTsd: (code: string) => ScanResolution | null
  acceptPalletByScan: (sscc: string, actorName: string) => { ok: boolean; message: string; count?: number }
  placePalletInCell: (sscc: string, cellCode: string, actorName: string) => { ok: boolean; message: string }
  acceptBoxForPicking: (sscc: string, actorName: string) => { ok: boolean; message: string; progress?: string }
  createDemoPickTask: () => { ok: boolean; message: string }
  completeTsdReceiptTask: (taskId: string, scannedCodes: string[]) => { ok: boolean; message: string }
  completeTsdOpReceipt: (
    expectedReceiptId: string,
    scannedSsccs: string[],
    warehouseTaskId?: string,
  ) => { ok: boolean; message: string }
  completeWarehouseTransferSend: (
    warehouseTaskId: string,
    scannedCodes: string[],
  ) => { ok: boolean; message: string }
  completeWarehouseTransferReceive: (
    warehouseTaskId: string,
    scannedCodes: string[],
  ) => { ok: boolean; message: string }
  completeTsdShipmentTask: (taskId: string, scannedCodes: string[]) => { ok: boolean; message: string }
  completeTsdTransferReceiptTask: (taskId: string, scannedCodes: string[]) => { ok: boolean; message: string }
  startTsdTask: (taskId: string) => { ok: boolean; message: string }
  quarantineTsdTask: (
    taskId: string,
    scanCode: string,
    reason: TsdQuarantineReason,
    note?: string,
  ) => { ok: boolean; message: string }
  issueCanisterByScan: (
    code: string,
    options?: { device?: 'web' | 'tsd' },
  ) => { ok: boolean; message: string }
  returnCanisterByScan: (
    code: string,
    returnCondition: ReturnCondition,
    options?: { device?: 'web' | 'tsd'; photoUrl?: string; remainderLiters?: number },
  ) => { ok: boolean; message: string }
  globalSearch: (code: string) => ScanResolution | null
  activeDemoCanister: Canister | undefined
}

const CHILD_WAREHOUSE_ID = 'wh-field-1'

function advanceCanisterToChildStorage(
  canister: Canister,
  actorName: string,
  targetWarehouseId = 'wh-field-1',
): Canister {
  let current = canister
  for (let i = 0; i < 7; i++) {
    if (current.status === 'in_storage_child') break
    const result = advanceCanisterOnScan(current, 'transfer', { actorName })
    if ('error' in result) return current
    current = result.canister
  }
  if (current.status === 'in_storage_child') {
    const warehouseName = getWarehouseName(targetWarehouseId) ?? 'Дочерний склад'
    return {
      ...current,
      warehouseId: targetWarehouseId,
      warehouseName,
      cellId: targetWarehouseId === 'wh-field-2' ? 'C-01-01' : current.cellId ?? 'B-01-02',
    }
  }
  return current
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null)

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [webUser, setWebUser] = useState<User | null>(null)
  const [webScreen, setWebScreen] = useState<WebScreen>('home')
  const [webFilter, setWebFilter] = useState<ModuleFilter | undefined>()
  const [summary, setSummary] = useState<DemoSummary>(DEFAULT_SUMMARY)
  const [operations, setOperations] = useState<Operation[]>([])
  const [documents, setDocuments] = useState<DemoDocument[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [stock, setStock] = useState<StockBalance[]>([])
  const [canisters, setCanisters] = useState<Canister[]>([])
  const [pallets, setPallets] = useState<Pallet[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [expectedReceipts, setExpectedReceipts] = useState<ExpectedReceipt[]>([])
  const [pickTasks, setPickTasks] = useState<PickTask[]>([])
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [importCompleted, setImportCompleted] = useState(false)
  const [importValidation, setImportValidation] = useState<ImportValidation | null>(null)
  const [activeDemoCanisterId, setActiveDemoCanisterId] = useState<string | null>(null)
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([])
  const [consolidatedDemands, setConsolidatedDemands] = useState<ConsolidatedDemand[]>([])
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([])
  const [tsdTasks, setTsdTasks] = useState<TsdTask[]>([])
  const [tsdShipments, setTsdShipments] = useState<TsdShipment[]>([])
  const [warehouseTasks, setWarehouseTasks] = useState<WarehouseTask[]>(DEMO_WAREHOUSE_TASKS)
  const [openIssueAct, setOpenIssueAct] = useState<{
    molId: string
    number: string
    doc: RequestDocument
  } | null>(null)
  const [workTabs, setWorkTabs] = useState<WorkTab[]>([])
  const [activeWorkTabId, setActiveWorkTabId] = useState('')

  useEffect(() => {
    const saved = loadDemoState()
    setWebUser(saved.webUserId ? getUserById(saved.webUserId) : null)
    setWebScreen(saved.webScreen as WebScreen)
    setWebFilter(saved.webFilter as ModuleFilter | undefined)
    setSummary(saved.summary)
    setOperations(saved.operations)
    setDocuments(saved.documents)
    setAuditLog(saved.auditLog)
    setStock(saved.stock.length ? saved.stock : [])
    setCanisters(saved.canisters ?? DEFAULT_CANISTERS)
    setPallets(saved.pallets ?? [])
    setBoxes(saved.boxes ?? [])
    setExpectedReceipts(saved.expectedReceipts ?? [])
    setPickTasks(saved.pickTasks ?? [])
    setBatches(saved.batches ?? [])
    setImportCompleted(saved.importCompleted ?? false)
    setImportValidation(saved.importValidation ?? null)
    setActiveDemoCanisterId(saved.activeDemoCanisterId ?? null)
    const savedRequests = saved.procurementRequests ?? []
    const needsSeed =
      !savedRequests.length || !('productCode' in (savedRequests[0]?.items?.[0] ?? {}))
    const loadedRequests = needsSeed ? buildSeedProcurementRequests() : savedRequests
    setProcurementRequests(
      loadedRequests.map((r) => ({
        ...r,
        items: r.items.map((item) => ({
          ...item,
          productName: catalogNameForCode(item.productCode, item.productName),
        })),
      })),
    )
    setConsolidatedDemands(saved.consolidatedDemands ?? [])
    setSupplierOrders(saved.supplierOrders ?? [])
    const shipments = saved.tsdShipments ?? []
    setTsdShipments(shipments)
    setWarehouseTasks(saved.warehouseTasks ?? DEMO_WAREHOUSE_TASKS)
    setTsdTasks(
      buildTsdTasks({
        importCompleted: saved.importCompleted ?? false,
        expectedReceipts: saved.expectedReceipts ?? [],
        requests: loadedRequests,
        shipments,
        canisters: saved.canisters ?? [],
        savedTasks: saved.tsdTasks?.length ? saved.tsdTasks : undefined,
      }),
    )
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveDemoState({
      webUserId: webUser?.id ?? null,
      webScreen,
      summary,
      operations,
      documents,
      auditLog,
      stock,
      canisters,
      pallets,
      boxes,
      expectedReceipts,
      pickTasks,
      batches,
      importCompleted,
      importValidation,
      activeDemoCanisterId,
      procurementRequests,
      consolidatedDemands,
      supplierOrders,
      tsdTasks,
      tsdShipments,
      warehouseTasks,
      webFilter,
    })
  }, [
    hydrated,
    webUser,
    webScreen,
    webFilter,
    summary,
    operations,
    documents,
    auditLog,
    stock,
    canisters,
    pallets,
    boxes,
    expectedReceipts,
    pickTasks,
    batches,
    importCompleted,
    importValidation,
    activeDemoCanisterId,
    procurementRequests,
    consolidatedDemands,
    supplierOrders,
    tsdTasks,
    tsdShipments,
    warehouseTasks,
  ])

  useEffect(() => {
    if (!hydrated) return
    setTsdTasks((prev) =>
      buildTsdTasks({
        importCompleted,
        expectedReceipts,
        requests: procurementRequests,
        shipments: tsdShipments,
        canisters,
        savedTasks: prev.length ? prev : undefined,
      }),
    )
  }, [hydrated, importCompleted, expectedReceipts, procurementRequests, tsdShipments, canisters])

  const login = useCallback((otp: string) => {
    const user = authenticateByOtp(otp)
    if (!user) return null
    setWebUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    setWebUser(null)
    setWorkTabs([])
    setActiveWorkTabId('')
  }, [])

  const applyWorkTab = useCallback((tab: WorkTab) => {
    const loc = currentLocation(tab)
    setActiveWorkTabId(tab.id)
    setWebScreen(loc.moduleId)
    setWebFilter(loc.filter)
  }, [])

  const activeWorkTab = useMemo(
    () => workTabs.find((t) => t.id === activeWorkTabId),
    [workTabs, activeWorkTabId],
  )

  const canWorkTabGoBack = canGoBack(activeWorkTab)
  const canWorkTabGoForward = canGoForward(activeWorkTab)

  const insertTabAfterActive = useCallback(
    (prev: WorkTab[], tab: WorkTab): WorkTab[] => {
      const index = prev.findIndex((t) => t.id === activeWorkTabId)
      if (index === -1) return [...prev, tab]
      const next = [...prev]
      next.splice(index + 1, 0, tab)
      return next
    },
    [activeWorkTabId],
  )

  const navigateActiveWorkTab = useCallback(
    (
      location: WorkTabLocation,
      title?: string,
      options?: { replace?: boolean },
    ) => {
      const normalized = withNormalizedLocation(
        location.moduleId,
        location.filter,
        title ?? location.label,
      )
      const label = normalized.label ?? tabTitleFromLocation(normalized)

      if (!activeWorkTabId) {
        const tab = createWorkTab(normalized, label)
        setWorkTabs([tab])
        applyWorkTab(tab)
        return
      }

      setWorkTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeWorkTabId) return t
          const current = currentLocation(t)
          if (!options?.replace && locationKey(current) === locationKey(normalized)) {
            return applyLocationToTab(t, normalized)
          }

          let history = [...t.history]
          let historyIndex = t.historyIndex
          if (options?.replace) {
            history[historyIndex] = normalized
          } else {
            history = history.slice(0, historyIndex + 1)
            history.push(normalized)
            historyIndex = history.length - 1
          }
          return applyLocationToTab({ ...t, history, historyIndex }, normalized)
        }),
      )
      setWebScreen(normalized.moduleId)
      setWebFilter(normalized.filter)
    },
    [activeWorkTabId, applyWorkTab],
  )

  const openWorkTab = useCallback(
    (moduleId: ModuleId, filter?: ModuleFilter, title?: string) => {
      const normalized = withNormalizedLocation(moduleId, filter, title)
      const label = normalized.label ?? tabTitleFromLocation(normalized)

      const existing = normalized.filter
        ? findDocumentTab(workTabs, normalized.filter)
        : undefined
      if (existing) {
        applyWorkTab(existing)
        return
      }

      const tab = createWorkTab(normalized, label)
      setWorkTabs((prev) => insertTabAfterActive(prev, tab))
      applyWorkTab(tab)
    },
    [workTabs, applyWorkTab, insertTabAfterActive],
  )

  const selectWorkTab = useCallback(
    (tabId: string) => {
      const tab = workTabs.find((t) => t.id === tabId)
      if (tab) applyWorkTab(tab)
    },
    [workTabs, applyWorkTab],
  )

  const closeWorkTab = useCallback(
    (tabId: string) => {
      setWorkTabs((prev) => {
        const closedIndex = prev.findIndex((t) => t.id === tabId)
        const next = prev.filter((t) => t.id !== tabId)
        if (activeWorkTabId === tabId) {
          if (next.length === 0) {
            const tab = createWorkTab(NEW_TAB_LOCATION, moduleLandingTitle('home'))
            queueMicrotask(() => applyWorkTab(tab))
            return [tab]
          }
          const fallbackIndex = closedIndex > 0 ? closedIndex - 1 : 0
          const fallback = next[fallbackIndex] ?? next[next.length - 1]
          if (fallback) queueMicrotask(() => applyWorkTab(fallback))
        }
        return next
      })
    },
    [activeWorkTabId, applyWorkTab],
  )

  const addWorkTab = useCallback(() => {
    const active = workTabs.find((t) => t.id === activeWorkTabId)
    const moduleId = active ? currentLocation(active).moduleId : webScreen || 'home'

    const tab =
      moduleId === 'supply'
        ? createWorkTab(
            withNormalizedLocation('supply', { tab: 'demand', view: 'list' }),
            'Снабжение',
          )
        : createWorkTab(
            moduleId === 'home'
              ? NEW_TAB_LOCATION
              : withNormalizedLocation(moduleId, { view: 'landing' }),
            moduleLandingTitle(moduleId === 'home' ? 'home' : moduleId),
          )

    setWorkTabs((prev) => insertTabAfterActive(prev, tab))
    applyWorkTab(tab)
  }, [workTabs, activeWorkTabId, webScreen, applyWorkTab, insertTabAfterActive])

  const addModuleLandingTab = addWorkTab

  const moveTabInHistory = useCallback(
    (nextIndex: number) => {
      if (!activeWorkTabId) return
      setWorkTabs((prev) => {
        const tab = prev.find((t) => t.id === activeWorkTabId)
        if (!tab || nextIndex < 0 || nextIndex >= tab.history.length) return prev
        const loc = tab.history[nextIndex]
        const updated = prev.map((t) =>
          t.id === activeWorkTabId
            ? applyLocationToTab({ ...t, historyIndex: nextIndex }, loc)
            : t,
        )
        const updatedTab = updated.find((t) => t.id === activeWorkTabId)!
        queueMicrotask(() => applyWorkTab(updatedTab))
        return updated
      })
    },
    [activeWorkTabId, applyWorkTab],
  )

  const workTabBack = useCallback(() => {
    if (!activeWorkTab) return
    moveTabInHistory(activeWorkTab.historyIndex - 1)
  }, [activeWorkTab, moveTabInHistory])

  const workTabForward = useCallback(() => {
    if (!activeWorkTab) return
    moveTabInHistory(activeWorkTab.historyIndex + 1)
  }, [activeWorkTab, moveTabInHistory])

  const selectWorkTabHistory = useCallback(
    (index: number) => {
      if (!activeWorkTab || index > activeWorkTab.historyIndex) return
      moveTabInHistory(index)
    },
    [activeWorkTab, moveTabInHistory],
  )

  const refreshActiveWorkTab = useCallback(() => {
    if (!activeWorkTabId) return
    setWorkTabs((prev) =>
      prev.map((t) =>
        t.id === activeWorkTabId ? { ...t, refreshKey: t.refreshKey + 1 } : t,
      ),
    )
  }, [activeWorkTabId])

  const setActiveWorkTabDirty = useCallback((dirty: boolean) => {
    if (!activeWorkTabId) return
    setWorkTabs((prev) =>
      prev.map((t) => (t.id === activeWorkTabId ? { ...t, dirty } : t)),
    )
  }, [activeWorkTabId])

  const renameActiveWorkTab = useCallback(
    (title: string) => {
      if (!activeWorkTabId) return
      setWorkTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeWorkTabId) return t
          const history = [...t.history]
          const loc = history[t.historyIndex]
          if (loc) {
            history[t.historyIndex] = { ...loc, label: title }
          }
          return applyLocationToTab({ ...t, title, history }, { ...currentLocation(t), label: title })
        }),
      )
    },
    [activeWorkTabId],
  )

  useEffect(() => {
    if (!hydrated || !webUser || workTabs.length > 0) return
    const tab = createWorkTab(NEW_TAB_LOCATION, moduleLandingTitle('home'))
    setWorkTabs([tab])
    applyWorkTab(tab)
  }, [hydrated, webUser, workTabs.length, applyWorkTab])

  const navigateWeb = useCallback(
    (moduleId: ModuleId, filter?: ModuleFilter) => {
      const normalized = normalizeNavFilter(moduleId, filter)
      const location: WorkTabLocation = { moduleId, filter: normalized }
      navigateActiveWorkTab(location, tabTitleFromLocation(location))
    },
    [navigateActiveWorkTab],
  )

  const applyOpState = useCallback(
    (next: ReturnType<typeof addOperation>) => {
      setOperations(next.operations)
      setDocuments(next.documents)
      setAuditLog(next.auditLog)
    },
    [],
  )

  const simulateUpakUploadFn = useCallback(
    (supplierOrderId: string) => {
      if (importCompleted) {
        return { ok: false, message: 'Импорт уже выполнен. Сбросьте localStorage для повторной загрузки.' }
      }
      const order = supplierOrders.find((o) => o.id === supplierOrderId)
      if (!order) return { ok: false, message: 'Заявка поставщику не найдена' }
      if (order.status !== 'sent') {
        return { ok: false, message: 'Загрузка Упак доступна для отправленных заявок' }
      }

      const demandSummary = `По сводным ${order.consolidatedNumbers.join(', ')} (${order.requestNumbers.join(', ')}) ожидаем приход от ${order.supplierName}`

      const result = simulateUpakImport({
        consolidatedDemandId: order.consolidatedDemandIds[0],
        consolidatedDemandNumber: order.consolidatedNumbers.join(', '),
        requestNumbers: order.requestNumbers,
        demandSummary,
      })
      const validation = validateImport(result.pallets, result.boxes, result.canisters)
      setPallets(result.pallets)
      setBoxes(result.boxes)
      setCanisters(result.canisters)
      setBatches(result.batches)
      setExpectedReceipts([
        { ...result.expectedReceipt, status: validation.passed ? 'ready_for_warehouse' : 'validation_failed' },
      ])
      setImportValidation(validation)
      setImportCompleted(true)
      setActiveDemoCanisterId(result.activeDemoCanisterId)
      setSupplierOrders((prev) =>
        prev.map((o) =>
          o.id === supplierOrderId
            ? {
                ...o,
                status: 'awaiting_delivery' as const,
                expectedReceiptId: result.expectedReceipt.id,
              }
            : o,
        ),
      )
      const linkedRequestIds = consolidatedDemands
        .filter((d) => order.consolidatedDemandIds.includes(d.id))
        .flatMap((d) => d.requestIds)
      setProcurementRequests((prev) =>
        prev.map((r) =>
          linkedRequestIds.includes(r.id)
            ? { ...r, status: 'awaiting_delivery' as const }
            : r,
        ),
      )

      const taskNumber = nextWarehouseTaskNumber(warehouseTasks)
      const receivingTask = createReceivingTaskFromExpectedReceipt(
        { ...result.expectedReceipt, status: validation.passed ? 'ready_for_warehouse' : 'validation_failed' },
        taskNumber,
      )
      setWarehouseTasks((prev) => {
        const withoutDup = prev.filter((t) => t.sourceDocumentId !== result.expectedReceipt.id)
        return [receivingTask, ...withoutDup]
      })

      return {
        ok: true,
        message: validation.passed
          ? `Создана ожидаемая приёмка ${result.expectedReceipt.number}. ${demandSummary}`
          : 'Файл загружен, но проверка не пройдена',
      }
    },
    [importCompleted, supplierOrders, consolidatedDemands, warehouseTasks],
  )

  const applyDemoOpBundle = useCallback((bundle: DemoOpBundle) => {
    setPallets(bundle.pallets)
    setBoxes(bundle.boxes)
    setCanisters(bundle.canisters)
    setBatches(bundle.batches)
    setExpectedReceipts((prev) => [...prev, bundle.expectedReceipt])
    setImportValidation(bundle.validation)
    setImportCompleted(true)
    setActiveDemoCanisterId(bundle.activeDemoCanisterId)
  }, [])

  const runImportValidationFn = useCallback(() => {
    const validation = validateImport(pallets, boxes, canisters)
    setImportValidation(validation)
    setExpectedReceipts((prev) =>
      prev.map((er) =>
        er.id === 'er-001'
          ? { ...er, status: validation.passed ? 'ready_for_warehouse' : 'validation_failed' }
          : er,
      ),
    )
    return validation
  }, [pallets, boxes, canisters])

  const resolveScanCode = useCallback(
    (code: string) => resolveScan(code, pallets, boxes, canisters),
    [pallets, boxes, canisters],
  )

  const acceptPalletByScan = useCallback(
    (sscc: string, actorName: string) => {
      const resolution = resolveScan(sscc, pallets, boxes, canisters)
      if (!resolution?.pallet) return { ok: false, message: 'Палета не найдена' }
      const palletSscc = resolution.pallet.sscc
      const now = new Date().toISOString()

      setPallets((prev) =>
        prev.map((p) => (p.sscc === palletSscc ? { ...p, status: 'received_acceptance' } : p)),
      )
      setBoxes((prev) =>
        prev.map((b) =>
          b.palletSscc === palletSscc ? { ...b, status: 'received_acceptance' } : b,
        ),
      )
      let count = 0
      setCanisters((prev) =>
        prev.map((c) => {
          if (c.palletSscc !== palletSscc || c.status !== 'expected_receipt') return c
          count++
          const isDemo = c.id === DEMO_CANISTER_ID
          const updated = appendHistory(c, {
            at: now,
            event: 'Принята через скан палеты',
            status: 'received_acceptance',
            actor: actorName,
            location: 'Зона приемки',
            documentId: 'ОП-001',
          })
          if (isDemo) {
            return appendHistory(updated, {
              at: now,
              event: 'Попала в ожидаемую приемку',
              status: 'received_acceptance',
              actor: 'Система',
              location: 'Ожидаемая приемка ОП-001',
              documentId: 'ОП-001',
            })
          }
          return updated
        }),
      )
      setExpectedReceipts((prev) =>
        prev.map((er) =>
          er.status === 'awaiting_receipt' ? { ...er, status: 'in_progress' } : er,
        ),
      )
      setSummary((s) => ({ ...s, statReceived: s.statReceived + count }))
      return { ok: true, message: `Палета принята: ${count} канистр`, count }
    },
    [pallets, boxes, canisters],
  )

  const placePalletInCell = useCallback(
    (sscc: string, cellCode: string, actorName: string) => {
      const resolution = resolveScan(sscc, pallets, boxes, canisters)
      if (!resolution?.pallet) return { ok: false, message: 'Палета не найдена' }
      const palletSscc = resolution.pallet.sscc
      const now = new Date().toISOString()

      setPallets((prev) =>
        prev.map((p) => (p.sscc === palletSscc ? { ...p, status: 'in_storage_main' } : p)),
      )
      setBoxes((prev) =>
        prev.map((b) =>
          b.palletSscc === palletSscc ? { ...b, status: 'in_storage_main' } : b,
        ),
      )
      setCanisters((prev) =>
        prev.map((c) => {
          if (c.palletSscc !== palletSscc || c.status !== 'received_acceptance') return c
          const updated = appendHistory(c, {
            at: now,
            event: `Размещена в ячейку ${cellCode}`,
            status: 'in_storage_main',
            actor: actorName,
            location: cellCode,
            documentId: 'ОП-001',
          })
          return {
            ...updated,
            warehouseId: 'wh-1',
            warehouseName: 'Главный склад',
            cellId: cellCode,
          }
        }),
      )
      return { ok: true, message: `Палета размещена в ${cellCode}` }
    },
    [pallets, boxes, canisters],
  )

  const createDemoPickTask = useCallback(() => {
    if (pickTasks.some((t) => t.id === 'pick-001')) {
      return { ok: false, message: 'Задача ОТБ-001 уже создана' }
    }
    const demoPalletBoxes = boxes.filter((b) => b.palletSscc === DEMO_PALLET_SSCC)
    const reservedBoxes = demoPalletBoxes
      .filter((b) => b.sscc !== DEMO_BOX_SSCC)
      .slice(0, 17)
      .map((b) => b.sscc)
    const reservedCanisters = [DEMO_CANISTER_ID]
    const now = new Date().toISOString()

    const task: PickTask = {
      id: 'pick-001',
      number: 'ОТБ-001',
      requestId: 'req-035',
      targetCanisters: 35,
      reservedBoxSsccs: reservedBoxes,
      reservedCanisterIds: reservedCanisters,
      pickedCanisters: 0,
      status: 'reserved',
    }
    setPickTasks([task])

    setCanisters((prev) =>
      prev.map((c) => {
        const inBox = reservedBoxes.includes(c.boxSscc)
        const isDemo = c.id === DEMO_CANISTER_ID
        if (!inBox && !isDemo) return c
        if (c.status !== 'in_storage_main') return c
        return appendHistory(
          { ...c, reservedForRequestId: 'req-035' },
          {
            at: now,
            event: 'Зарезервирована под заявку №req-035',
            status: 'reserved',
            actor: 'Система',
            location: c.cellId ?? 'A-01-03',
            documentId: 'ОТБ-001',
          },
        )
      }),
    )
    setBoxes((prev) =>
      prev.map((b) =>
        reservedBoxes.includes(b.sscc) ? { ...b, status: 'reserved' } : b,
      ),
    )
    return { ok: true, message: 'Задача ОТБ-001: зарезервировано 17 коробок + 1 канистра' }
  }, [pickTasks, boxes])

  const transferExpectedReceiptToWarehouse = useCallback(
    (id: string) => {
      const er = expectedReceipts.find((r) => r.id === id)
      if (!er) return { ok: false, message: 'Ожидаемая приемка не найдена' }
      if (!importValidation?.passed) return { ok: false, message: 'Сначала пройдите проверку импорта' }
      setExpectedReceipts((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'awaiting_receipt' } : r)),
      )
      setSupplierOrders((prev) =>
        prev.map((o) =>
          o.expectedReceiptId === id ? { ...o, status: 'closed' as const } : o,
        ),
      )
      createDemoPickTask()
      return {
        ok: true,
        message: 'ОП передана на склад. Приёмку выполняют кладовщики в модуле «Склады».',
      }
    },
    [expectedReceipts, importValidation, createDemoPickTask],
  )

  const acceptBoxForPicking = useCallback(
    (sscc: string, actorName: string) => {
      const task = pickTasks.find((t) => t.id === 'pick-001')
      if (!task) return { ok: false, message: 'Задача на отбор не найдена' }
      const resolution = resolveScan(sscc, pallets, boxes, canisters)
      if (!resolution?.box) return { ok: false, message: 'Коробка не найдена' }
      if (!task.reservedBoxSsccs.includes(resolution.box.sscc)) {
        return { ok: false, message: 'Коробка не входит в резерв заявки' }
      }
      const now = new Date().toISOString()
      const boxCanisters = canisters.filter((c) => c.boxSscc === resolution.box!.sscc)
      const pickedCount = boxCanisters.length

      setCanisters((prev) =>
        prev.map((c) => {
          if (c.boxSscc !== resolution.box!.sscc) return c
          return appendHistory(c, {
            at: now,
            event: 'Отобрана через скан коробки',
            status: 'picking',
            actor: actorName,
            location: c.cellId ?? 'A-01-03',
            documentId: 'ОТБ-001',
          })
        }),
      )
      setBoxes((prev) =>
        prev.map((b) => (b.sscc === resolution.box!.sscc ? { ...b, status: 'picking' } : b)),
      )
      setPickTasks((prev) =>
        prev.map((t) =>
          t.id === 'pick-001'
            ? {
                ...t,
                pickedCanisters: t.pickedCanisters + pickedCount,
                status: 'picking' as const,
              }
            : t,
        ),
      )
      const taskAfter = pickTasks.find((t) => t.id === 'pick-001')
      const picked = (taskAfter?.pickedCanisters ?? 0) + pickedCount
      return {
        ok: true,
        message: 'Коробка отобрана',
        progress: `${picked} / ${task.targetCanisters}`,
      }
    },
    [pickTasks, pallets, boxes, canisters],
  )

  const appendTsdAudit = useCallback(
    (action: string, device: 'web' | 'tsd', comment?: string, barcode?: string) => {
      const user = webUser
      if (!user) return
      setAuditLog((prev) => [
        ...prev,
        createAuditEntry({
          userId: user.id,
          userName: user.name,
          role: user.role,
          device,
          action,
          comment,
          barcode,
        }),
      ])
    },
    [webUser],
  )

  const ensureReceivingExpectedReceipt = useCallback(
    (warehouseTaskId: string) => {
      const task = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.operationType !== 'receiving') {
        return { ok: false, message: 'Не задача приёмки' }
      }

      const linked = resolveExpectedReceiptForReceivingTask(task, expectedReceipts)
      if (linked && isOpenExpectedReceipt(linked)) {
        if (task.sourceDocumentId !== linked.id) {
          setWarehouseTasks((prev) =>
            prev.map((t) =>
              t.id === warehouseTaskId ? { ...t, ...warehouseTaskLinkPatch(linked) } : t,
            ),
          )
        }
        return { ok: true, message: linked.number, receiptId: linked.id }
      }

      const open = findOpenExpectedReceipt(expectedReceipts)
      if (open) {
        setWarehouseTasks((prev) =>
          prev.map((t) =>
            t.id === warehouseTaskId ? { ...t, ...warehouseTaskLinkPatch(open) } : t,
          ),
        )
        return { ok: true, message: open.number, receiptId: open.id }
      }

      const { id, number } = nextDemoOpNumbers(expectedReceipts)
      const bundle = buildDemoOpBundle({
        label: `Демо ОП для ${task.number}`,
        receiptId: id,
        receiptNumber: number,
      })
      applyDemoOpBundle(bundle)
      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === warehouseTaskId ? { ...t, ...warehouseTaskLinkPatch(bundle.expectedReceipt) } : t,
        ),
      )
      appendTsdAudit('import_upak', 'tsd', `Авто ${number} для ${task.number}`)
      return { ok: true, message: number, receiptId: bundle.expectedReceipt.id }
    },
    [warehouseTasks, expectedReceipts, applyDemoOpBundle, appendTsdAudit],
  )

  const ensureMainWarehouseStock = useCallback(() => {
    if (mainWarehouseCanistersForSend(canisters).length > 0) return false
    const { id, number } = nextDemoOpNumbers(expectedReceipts)
    const bundle = buildDemoOpBundle({
      label: 'Демо запас для перемещения',
      receiptId: id,
      receiptNumber: number,
    })
    applyDemoOpBundle(bundle)
    return true
  }, [canisters, expectedReceipts, applyDemoOpBundle])

  const ensureTransferTaskReady = useCallback(
    (warehouseTaskId: string) => {
      const task = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.operationType !== 'transfer') {
        return { ok: false, message: 'Не задача перемещения' }
      }

      const patch = transferHandshakePatch(task)
      if (Object.keys(patch).length) {
        setWarehouseTasks((prev) =>
          prev.map((t) => (t.id === warehouseTaskId ? { ...t, ...patch } : t)),
        )
      }

      if (isTransferSenderTask({ ...task, ...patch })) {
        ensureMainWarehouseStock()
      }

      return { ok: true, message: task.number }
    },
    [warehouseTasks, ensureMainWarehouseStock],
  )

  const placeCanistersOnChildWarehouse = useCallback(
    (warehouseId: string, count = 3) => {
      let working = canisters
      if (!mainWarehouseCanistersForSend(working).length) {
        const { id, number } = nextDemoOpNumbers(expectedReceipts)
        const bundle = buildDemoOpBundle({
          label: 'Демо запас для дочернего склада',
          receiptId: id,
          receiptNumber: number,
        })
        applyDemoOpBundle(bundle)
        working = bundle.canisters
      }
      const toMove = mainWarehouseCanistersForSend(working).slice(0, count)
      if (!toMove.length) return working
      const moveIds = new Set(toMove.map((c) => c.id))
      const actor = webUser?.name ?? 'Демо'
      const placed = working.map((c) =>
        moveIds.has(c.id) ? advanceCanisterToChildStorage(c, actor, warehouseId) : c,
      )
      setCanisters(placed)
      setStock(stockBalancesFromCanisters(placed))
      return placed
    },
    [canisters, expectedReceipts, applyDemoOpBundle, webUser],
  )

  const ensureChildWarehouseStock = useCallback(
    (warehouseId = DEMO_CHILD_WAREHOUSE_ID) => {
      if (canistersOnChildForIssue(canisters, warehouseId).length > 0) return false
      placeCanistersOnChildWarehouse(warehouseId)
      return true
    },
    [canisters, placeCanistersOnChildWarehouse],
  )

  const ensureIssuedCanisterForReturn = useCallback(
    (warehouseId = DEMO_CHILD_WAREHOUSE_ID) => {
      if (canistersIssuedForReturn(canisters, warehouseId).length > 0) return false
      let pool = canisters
      if (!canistersOnChildForIssue(pool, warehouseId).length) {
        pool = placeCanistersOnChildWarehouse(warehouseId)
      }
      const child = canistersOnChildForIssue(pool, warehouseId)[0]
      if (!child) return false
      const issued = {
        ...child,
        status: 'issued_agronomist' as const,
        issuedTo: 'Демо агроном',
        issueActNumber: 'АВ-DEMO',
      }
      setCanisters((prev) => {
        const base = pool.length > prev.length ? pool : prev
        const next = base.map((c) => (c.id === child.id ? issued : c))
        setStock(stockBalancesFromCanisters(next))
        return next
      })
      return true
    },
    [canisters, placeCanistersOnChildWarehouse],
  )

  const ensureDemoIssueReady = useCallback(
    (warehouseId = DEMO_CHILD_WAREHOUSE_ID) => {
      ensureChildWarehouseStock(warehouseId)
      return { ok: true, message: 'Демо-запас для выдачи готов' }
    },
    [ensureChildWarehouseStock],
  )

  const ensureDemoReturnReady = useCallback(
    (warehouseId = DEMO_CHILD_WAREHOUSE_ID) => {
      ensureIssuedCanisterForReturn(warehouseId)
      return { ok: true, message: 'Демо канистра для возврата готова' }
    },
    [ensureIssuedCanisterForReturn],
  )

  const ensureReturnApprovalDemo = useCallback(
    (warehouseTaskId: string) => {
      const task = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!task || task.operationType !== 'return') {
        return { ok: false, message: 'Задача одобрения не найдена' }
      }
      const existing = findReturnApprovalOperation(task, operations)
      if (existing) return { ok: true, message: existing.id }

      const warehouseId = childWarehouseIdForTask(task)
      ensureIssuedCanisterForReturn(warehouseId)
      const demoCanister =
        canistersIssuedForReturn(canisters, warehouseId)[0] ??
        canisters.find((c) => c.id === DEMO_CANISTER_ID) ??
        canisters[0]
      const returnActNumber = task.sourceDocumentId ?? `АВозвр-DEMO-${Date.now()}`
      const user = webUser
      const state = toOperationState({ operations, documents, auditLog })
      const next = addOperation(
        state,
        'return',
        {
          fromType: 'agronomist',
          fromId: user?.id ?? 'demo-mol',
          toType: 'warehouse',
          toId: warehouseId,
          createdBy: user?.id ?? 'demo',
          documentId: returnActNumber,
          items: [
            {
              id: demoCanister?.id ?? 'can-demo',
              barcode: demoCanister?.sgtin ?? demoCanister?.serialNumber ?? '341X1302R9S18',
              productName: demoCanister?.productName ?? 'Торнадо 540',
              quantity: 1,
              unit: 'шт',
            },
          ],
        },
        {
          userId: user?.id ?? 'demo',
          userName: user?.name ?? 'Демо',
          role: user?.role ?? 'warehouse_manager',
          device: 'tsd',
        },
      )
      applyOpState(next)
      if (!task.sourceDocumentId) {
        setWarehouseTasks((prev) =>
          prev.map((t) =>
            t.id === warehouseTaskId ? { ...t, sourceDocumentId: returnActNumber } : t,
          ),
        )
      }
      return { ok: true, message: returnActNumber }
    },
    [
      warehouseTasks,
      operations,
      documents,
      auditLog,
      canisters,
      webUser,
      ensureIssuedCanisterForReturn,
      applyOpState,
    ],
  )

  const ensureWarehouseTaskDemoReady = useCallback(
    (warehouseTaskId: string) => {
      const task = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }

      switch (task.operationType) {
        case 'receiving':
          return ensureReceivingExpectedReceipt(warehouseTaskId)
        case 'transfer':
          return ensureTransferTaskReady(warehouseTaskId)
        case 'issue':
          ensureDemoIssueReady(childWarehouseIdForTask(task))
          return { ok: true, message: task.number }
        case 'return':
          if (task.status === 'awaiting_receiver_confirmation') {
            return ensureReturnApprovalDemo(warehouseTaskId)
          }
          ensureDemoReturnReady(childWarehouseIdForTask(task))
          return { ok: true, message: task.number }
        case 'writeoff':
        case 'utilization':
        case 'inventory':
          ensureMainWarehouseStock()
          return { ok: true, message: task.number }
        default:
          return { ok: true, message: task.number }
      }
    },
    [
      warehouseTasks,
      ensureReceivingExpectedReceipt,
      ensureTransferTaskReady,
      ensureDemoIssueReady,
      ensureDemoReturnReady,
      ensureReturnApprovalDemo,
      ensureMainWarehouseStock,
    ],
  )

  const wtHistory = useCallback((text: string): WarehouseTaskHistoryEntry => {
    const at = new Date().toISOString()
    return { id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at, text }
  }, [])

  const completeDemoWarehouseTask = useCallback(
    (warehouseTaskId: string, scannedCodes: string[]) => {
      const wt = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!wt) return { ok: false, message: 'Задача не найдена' }
      if (!isDemoAdjustmentOperation(wt.operationType)) {
        return { ok: false, message: 'Операция не поддерживается' }
      }
      const actor = webUser?.name ?? 'Кладовщик'
      const now = new Date().toISOString()
      const qty = Math.max(scannedCodes.length, 1)
      const targetIds = new Set(pickDemoCanisterIds(canisters, qty).slice(0, qty))

      if (wt.operationType === 'writeoff' || wt.operationType === 'utilization') {
        setCanisters((prev) =>
          prev.map((c) =>
            targetIds.has(c.id)
              ? {
                  ...c,
                  status:
                    wt.operationType === 'utilization'
                      ? ('in_disposal_zone' as const)
                      : ('written_off' as const),
                }
              : c,
          ),
        )
      }

      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === warehouseTaskId
            ? {
                ...t,
                status: 'completed' as const,
                scannedQty: qty,
                completedAt: now,
                history: [
                  ...t.history,
                  wtHistory(`Демо: ${wt.operationType} выполнено (${qty} ед., ${actor})`),
                ],
              }
            : t,
        ),
      )
      appendTsdAudit('warehouse_task_demo_complete', 'tsd', `${wt.number}: ${wt.operationType}`)
      return { ok: true, message: `Задача ${wt.number} выполнена (демо)` }
    },
    [warehouseTasks, webUser, canisters, wtHistory, appendTsdAudit],
  )

  const createWarehouseTask = useCallback(
    (input: CreateWarehouseTaskInput, mode: 'draft' | 'create' | 'send_to_tsd') => {
      const actor = webUser?.name ?? 'Диспетчер склада'
      const now = new Date().toISOString()
      const seq = warehouseTasks.length + 1
      const status: WarehouseTaskStatus =
        mode === 'draft' ? 'draft' : mode === 'send_to_tsd' ? 'ready' : 'ready'
      const firstHistory =
        mode === 'draft'
          ? wtHistory('Черновик создан вручную')
          : mode === 'send_to_tsd'
            ? wtHistory(`Задача создана вручную (${actor}) и отправлена на ТСД`)
            : wtHistory(`Задача создана вручную (${actor})`)
      const taskNumber = `№${100 + seq}`
      let receivingSource: Partial<WarehouseTask> = {}
      if (input.operationType === 'receiving') {
        const open = findOpenExpectedReceipt(expectedReceipts)
        if (open) {
          receivingSource = warehouseTaskLinkPatch(open)
        } else {
          const { id, number } = nextDemoOpNumbers(expectedReceipts)
          const bundle = buildDemoOpBundle({
            label: `Демо ОП для ${taskNumber}`,
            receiptId: id,
            receiptNumber: number,
          })
          applyDemoOpBundle(bundle)
          receivingSource = warehouseTaskLinkPatch(bundle.expectedReceipt)
        }
      }
      const transferRole =
        input.operationType === 'transfer'
          ? inferTransferHandshakeRole({
              operationType: 'transfer',
              fromLocationName: input.fromLocationName,
              toLocationName: input.toLocationName,
            } as WarehouseTask)
          : undefined
      if (input.operationType === 'transfer' && transferRole === 'sender') {
        ensureMainWarehouseStock()
      }
      const task: WarehouseTask = {
        id: `wt-new-${Date.now()}`,
        number: taskNumber,
        operationType: input.operationType,
        status,
        priority: input.priority,
        sourceType: receivingSource.sourceType ?? 'manual',
        sourceDocumentType: receivingSource.sourceDocumentType ?? 'manual',
        sourceDocumentId: receivingSource.sourceDocumentId,
        sourceLabel: receivingSource.sourceLabel ?? input.sourceLabel ?? 'Создано вручную',
        createdByName: actor,
        assignedByType: 'user',
        assignedByName: actor,
        assignedToType: input.assignedToType,
        assignedToName: input.assignedToName,
        fromLocationName: input.fromLocationName,
        toLocationName: input.toLocationName,
        expectedQty: input.expectedQty,
        scannedQty: 0,
        comment: input.comment,
        createdAt: now,
        history: [firstHistory],
        ...(transferRole ? { handshakeRole: transferRole } : {}),
      }
      setWarehouseTasks((prev) => [task, ...prev])
      appendTsdAudit('warehouse_task_create', 'web', `${task.number} — ${input.operationType}`)
      return {
        ok: true,
        message: mode === 'draft' ? 'Черновик сохранён' : `Задача ${task.number} создана`,
        taskId: task.id,
      }
    },
    [
      warehouseTasks.length,
      expectedReceipts,
      webUser,
      wtHistory,
      appendTsdAudit,
      applyDemoOpBundle,
      ensureMainWarehouseStock,
    ],
  )

  const updateWarehouseTask = useCallback(
    (taskId: string, patch: UpdateWarehouseTaskInput) => {
      const task = warehouseTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      const notes: string[] = []
      if (patch.priority && patch.priority !== task.priority) notes.push('изменён приоритет')
      if (patch.assignedToName && patch.assignedToName !== task.assignedToName)
        notes.push(`назначено на: ${patch.assignedToName}`)
      if (patch.comment !== undefined && patch.comment !== task.comment) notes.push('обновлён комментарий')
      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                ...patch,
                history: notes.length
                  ? [...t.history, wtHistory(`Изменено: ${notes.join(', ')}`)]
                  : t.history,
              }
            : t,
        ),
      )
      appendTsdAudit('warehouse_task_update', 'web', `${task.number}: ${notes.join(', ') || 'без изменений'}`)
      return { ok: true, message: 'Изменения сохранены' }
    },
    [warehouseTasks, wtHistory, appendTsdAudit],
  )

  const cancelWarehouseTask = useCallback(
    (taskId: string, reason: string) => {
      const task = warehouseTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.status === 'completed' || task.status === 'cancelled')
        return { ok: false, message: 'Эту задачу нельзя отменить' }
      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'cancelled' as const,
                cancelReason: reason,
                history: [...t.history, wtHistory(`Задача отменена. Причина: ${reason}`)],
              }
            : t,
        ),
      )
      appendTsdAudit('warehouse_task_cancel', 'web', `${task.number}: ${reason}`)
      return { ok: true, message: 'Задача отменена' }
    },
    [warehouseTasks, wtHistory, appendTsdAudit],
  )

  const deleteWarehouseTask = useCallback(
    (taskId: string) => {
      const task = warehouseTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.status !== 'draft')
        return { ok: false, message: 'Удалить можно только черновик. Используйте отмену с причиной.' }
      setWarehouseTasks((prev) => prev.filter((t) => t.id !== taskId))
      appendTsdAudit('warehouse_task_delete', 'web', `${task.number}`)
      return { ok: true, message: 'Черновик удалён' }
    },
    [warehouseTasks, appendTsdAudit],
  )

  const sendWarehouseTaskToTsd = useCallback(
    (taskId: string) => {
      const task = warehouseTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.status !== 'draft' && task.status !== 'ready' && task.status !== 'assigned')
        return { ok: false, message: 'Задачу нельзя отправить на ТСД в текущем статусе' }
      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'ready' as const,
                history: [...t.history, wtHistory('Задача отправлена на ТСД')],
              }
            : t,
        ),
      )
      appendTsdAudit('warehouse_task_send_tsd', 'web', `${task.number}`)
      return { ok: true, message: `Задача ${task.number} отправлена на ТСД` }
    },
    [warehouseTasks, wtHistory, appendTsdAudit],
  )

  const startWarehouseTaskOnTsd = useCallback(
    (taskId: string) => {
      const task = warehouseTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.status === 'completed' || task.status === 'cancelled')
        return { ok: false, message: 'Задача уже завершена' }
      const actor = webUser?.name ?? 'Кладовщик'
      const now = new Date().toISOString()
      const needsStart = task.status === 'ready' || task.status === 'assigned'
      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: needsStart ? ('in_progress' as const) : t.status,
                actualExecutorName: t.actualExecutorName ?? actor,
                actualExecutorStartedAt: t.actualExecutorStartedAt ?? now,
                startedAt: t.startedAt ?? (needsStart ? now : t.startedAt),
                history: needsStart
                  ? [...t.history, wtHistory(`${actor} взял задачу в работу`)]
                  : t.history,
              }
            : t,
        ),
      )
      if (needsStart) appendTsdAudit('warehouse_task_start', 'tsd', `${task.number}`)
      return { ok: true, message: `Задача ${task.number} в работе` }
    },
    [warehouseTasks, webUser, wtHistory, appendTsdAudit],
  )

  const resolveWarehouseDiscrepancy = useCallback(
    (taskId: string, action: 'accept' | 'recheck' | 'cancel', reason?: string) => {
      const task = warehouseTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.status !== 'discrepancy') return { ok: false, message: 'У задачи нет расхождения' }
      const now = new Date().toISOString()
      if (action === 'accept') {
        setWarehouseTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed' as const,
                  completedAt: now,
                  discrepancyReason: reason ?? t.discrepancyReason,
                  history: [
                    ...t.history,
                    wtHistory(
                      `Принято с расхождением${reason ? ` (причина: ${reason})` : ''}, задача завершена`,
                    ),
                  ],
                }
              : t,
          ),
        )
        appendTsdAudit('warehouse_task_discrepancy_accept', 'web', `${task.number}`)
        return { ok: true, message: 'Принято с расхождением' }
      }
      if (action === 'recheck') {
        setWarehouseTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'awaiting_receiver_confirmation' as const,
                  history: [...t.history, wtHistory('Возвращено на повторную проверку')],
                }
              : t,
          ),
        )
        return { ok: true, message: 'Возвращено на проверку' }
      }
      setWarehouseTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'cancelled' as const,
                cancelReason: reason ?? 'отмена приёмки',
                history: [...t.history, wtHistory(`Приёмка отменена${reason ? ` (${reason})` : ''}`)],
              }
            : t,
        ),
      )
      appendTsdAudit('warehouse_task_discrepancy_cancel', 'web', `${task.number}`)
      return { ok: true, message: 'Приёмка отменена' }
    },
    [warehouseTasks, wtHistory, appendTsdAudit],
  )

  const completeTsdReceiptTask = useCallback(
    (taskId: string, scannedCodes: string[]) => {
      const task = tsdTasks.find((t) => t.id === taskId)
      if (!task || task.type !== 'receipt') return { ok: false, message: 'Задача не найдена' }
      if (task.status === 'locked') return { ok: false, message: 'Задача ещё недоступна' }
      if (!scannedCodes.length) return { ok: false, message: 'Нет отсканированных кодов' }

      setTsdTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t)),
      )
      appendTsdAudit('tsd_receipt_complete', 'tsd', `Приёмка: ${scannedCodes.join(', ')}`)
      return { ok: true, message: 'Приёмка на ТСД завершена' }
    },
    [tsdTasks, appendTsdAudit],
  )

  const scanOnTsd = useCallback(
    (code: string) => {
      const resolution = resolveScan(code, pallets, boxes, canisters)
      if (!resolution) return null
      const label =
        resolution.level === 'pallet'
          ? 'Палета'
          : resolution.level === 'box'
            ? 'Коробка'
            : 'Канистра'
      appendTsdAudit('tsd_scan', 'tsd', label, resolution.code)
      return resolution
    },
    [pallets, boxes, canisters, appendTsdAudit],
  )

  const completeTsdOpReceipt = useCallback(
    (expectedReceiptId: string, scannedSsccs: string[], warehouseTaskId?: string) => {
      const er = expectedReceipts.find((r) => r.id === expectedReceiptId)
      if (!er) return { ok: false, message: 'ОП не найдено' }
      if (er.status === 'completed') return { ok: false, message: 'ОП уже принято' }
      if (!scannedSsccs.length) return { ok: false, message: 'Отсканируйте палеты' }

      const actor = webUser?.name ?? 'Кладовщик'
      const now = new Date().toISOString()
      const actNumber = `АПП-${er.number}`
      const demand = consolidatedDemands.find((d) => d.id === er.consolidatedDemandId)
      const actDoc = supplierReceiptActDocument(actNumber, {
        uploadedBy: actor,
        basisType: 'consolidated',
        basisId: er.consolidatedDemandId,
        basisLabel: demand ? `Сводная ${demand.number}` : er.consolidatedDemandNumber,
      })
      const ssccSet = new Set(scannedSsccs.map((s) => s.trim()).filter(Boolean))

      for (const sscc of ssccSet) {
        const resolution = resolveScan(sscc, pallets, boxes, canisters)
        if (!resolution?.pallet) {
          return { ok: false, message: `Палета ${sscc} не найдена` }
        }
        if (resolution.pallet.expectedReceiptId && resolution.pallet.expectedReceiptId !== expectedReceiptId) {
          return { ok: false, message: `Палета ${sscc} не относится к ${er.number}` }
        }
      }

      let receivedCanisters = 0
      setPallets((prev) =>
        prev.map((p) =>
          ssccSet.has(p.sscc) ? { ...p, status: 'received_acceptance' as const } : p,
        ),
      )
      setBoxes((prev) =>
        prev.map((b) =>
          ssccSet.has(b.palletSscc) ? { ...b, status: 'received_acceptance' as const } : b,
        ),
      )
      setCanisters((prev) => {
        const next = prev.map((c) => {
          if (!ssccSet.has(c.palletSscc) || c.status !== 'expected_receipt') return c
          receivedCanisters++
          const isDemo = c.id === DEMO_CANISTER_ID
          let updated = appendHistory(c, {
            at: now,
            event: 'Принята через скан палеты',
            status: 'received_acceptance',
            actor,
            location: 'Зона приемки',
            documentId: actNumber,
          })
          if (isDemo) {
            updated = appendHistory(updated, {
              at: now,
              event: 'Попала в ожидаемую приемку',
              status: 'received_acceptance',
              actor: 'Система',
              location: `Ожидаемая приемка ${er.number}`,
              documentId: actNumber,
            })
          }
          return appendHistory(
            {
              ...updated,
              warehouseId: 'wh-1',
              warehouseName: 'Главный склад',
              status: 'in_storage_main',
              cellId: 'A-01-03',
            },
            {
              at: now,
              event: 'Размещена на главном складе',
              status: 'in_storage_main',
              actor,
              location: 'A-01-03',
              documentId: actNumber,
            },
          )
        })
        setStock(stockBalancesFromCanisters(next))
        return next
      })
      setExpectedReceipts((prev) =>
        prev.map((item) =>
          item.id === expectedReceiptId ? { ...item, status: 'completed' as const } : item,
        ),
      )
      setSummary((s) => ({ ...s, statReceived: s.statReceived + receivedCanisters }))

      const linkedRequestIds =
        demand?.requestIds ??
        procurementRequests
          .filter((r) => er.requestNumbers?.includes(r.number))
          .map((r) => r.id)

      setConsolidatedDemands((prev) =>
        prev.map((d) => {
          if (d.id !== er.consolidatedDemandId) return d
          const docs = (d.documents ?? []).filter(
            (doc) => !(doc.type === 'acceptance' && doc.source === 'generated'),
          )
          return { ...d, documents: [...docs, actDoc] }
        }),
      )

      setProcurementRequests((prev) =>
        prev.map((r) => {
          if (!linkedRequestIds.includes(r.id)) return r
          const docs = mergeRequestDocuments(r.status, {
            existingDocuments: r.documents,
            uploadedBy: actor,
          }).filter((doc) => !(doc.type === 'acceptance' && doc.source === 'generated'))
          return {
            ...r,
            status: 'partially_fulfilled' as const,
            fulfillmentPercent: 50,
            documents: [...docs, actDoc],
          }
        }),
      )

      setWarehouseTasks((prev) =>
        prev.map((t) => {
          const matches =
            t.id === warehouseTaskId ||
            t.sourceDocumentId === expectedReceiptId ||
            t.sourceLabel === er.number
          if (!matches || t.operationType !== 'receiving') return t
          return {
            ...t,
            status: 'completed' as const,
            scannedQty: receivedCanisters,
            acceptedQty: receivedCanisters,
            completedAt: now,
            history: [
              ...t.history,
              wtHistoryEntry(`Принято ${receivedCanisters} кан. Акт ${actNumber}`),
            ],
          }
        }),
      )

      setTsdTasks((prev) =>
        prev.map((t) =>
          t.type === 'receipt' && t.expectedReceiptId === expectedReceiptId
            ? { ...t, status: 'completed' as const }
            : t,
        ),
      )

      setDocuments((prev) => [
        ...prev,
        {
          id: `doc-${actDoc.id}`,
          title: actDoc.title,
          type: 'acceptance',
          operationId: expectedReceiptId,
          createdAt: now,
        },
      ])

      appendTsdAudit(
        'tsd_op_receipt_complete',
        'tsd',
        `${er.number}: ${ssccSet.size} пал, акт ${actNumber}`,
      )
      return {
        ok: true,
        message: `Принято ${ssccSet.size} пал. Акт приёма поставки ${actNumber} по ${actDoc.basisLabel ?? 'сводной'}`,
      }
    },
    [
      expectedReceipts,
      pallets,
      boxes,
      canisters,
      webUser,
      consolidatedDemands,
      procurementRequests,
      appendTsdAudit,
    ],
  )

  const createTransferTaskPairFromRequest = useCallback(
    (requestId: string) => {
      const request = procurementRequests.find((r) => r.id === requestId)
      if (!request) return { ok: false, message: 'Заявка не найдена' }
      const existing = warehouseTasks.find(
        (t) =>
          t.sourceDocumentId === requestId &&
          t.operationType === 'transfer' &&
          t.status !== 'cancelled' &&
          t.status !== 'completed',
      )
      if (existing) {
        return { ok: false, message: `Перемещение уже создано: ${existing.number}` }
      }

      const actor = webUser?.name ?? 'Администратор'
      let stockCanisters = canisters
      if (!mainWarehouseCanistersForSend(stockCanisters).length) {
        const { id, number } = nextDemoOpNumbers(expectedReceipts)
        const bundle = buildDemoOpBundle({
          label: `Демо запас для ${request.number}`,
          receiptId: id,
          receiptNumber: number,
        })
        applyDemoOpBundle(bundle)
        stockCanisters = bundle.canisters
      }
      const onMain = mainWarehouseCanistersForSend(stockCanisters).length
      const requestQty = estimateCanisterQtyFromRequestItems(request.items)
      const qty =
        onMain > 0
          ? Math.min(requestQty || onMain, onMain)
          : Math.min(requestQty || 8, 8)
      const senderNum = nextWarehouseTaskNumber(warehouseTasks)
      const receiverNum = nextWarehouseTaskNumber([
        ...warehouseTasks,
        { number: senderNum } as WarehouseTask,
      ])
      const { sender, receiver } = createTransferPairFromRequest(
        request,
        senderNum,
        receiverNum,
        qty,
        actor,
      )

      setWarehouseTasks((prev) => [receiver, sender, ...prev])
      appendTsdAudit('warehouse_transfer_pair', 'web', `${sender.number} → ${receiver.number}`)
      return {
        ok: true,
        message: `Созданы задачи ${sender.number} (отгрузка) и ${receiver.number} (приём)`,
        senderId: sender.id,
        receiverId: receiver.id,
      }
    },
    [procurementRequests, warehouseTasks, webUser, appendTsdAudit, canisters, expectedReceipts, applyDemoOpBundle],
  )

  const completeTsdShipmentTask = useCallback(
    (taskId: string, scannedCodes: string[]) => {
      const task = tsdTasks.find((t) => t.id === taskId)
      if (!task || task.type !== 'shipment_by_request') return { ok: false, message: 'Задача не найдена' }
      if (task.status === 'locked') return { ok: false, message: 'Сначала выполните приёмку' }
      if (!task.requestId) return { ok: false, message: 'Нет связанной заявки' }
      if (!scannedCodes.length) return { ok: false, message: 'Нет отсканированных кодов' }

      const request = procurementRequests.find((r) => r.id === task.requestId)
      if (!request) return { ok: false, message: 'Заявка не найдена' }

      const actor = webUser?.name ?? 'Кладовщик'
      const now = new Date().toISOString()
      const demandLabel = `Спрос: заявка ${request.number}`

      const existing = task.shipmentId ? tsdShipments.find((s) => s.id === task.shipmentId) : undefined
      const baseShipment: TsdShipment = existing
        ? { ...existing, status: 'shipped', shippedAt: now, scannedCodes }
        : {
            id: `tsd-ship-${Date.now()}`,
            number: nextShipmentNumber(tsdShipments),
            requestIds: [task.requestId],
            requestNumbers: [request.number],
            status: 'shipped',
            createdAt: now,
            shippedAt: now,
            scannedCodes,
            warehouseId: 'wh-1',
            demandBasisLabel: demandLabel,
          }

      const actNumber = `АПП-${baseShipment.number}`
      const actDoc = transferHandshakeActDocument(actNumber, {
        uploadedBy: actor,
        basisType: 'demand',
        basisId: request.id,
        basisLabel: demandLabel,
      })

      const finalShipment: TsdShipment = {
        ...baseShipment,
        status: 'in_transit',
        actIssuedAt: now,
        demandBasisLabel: demandLabel,
        transferActNumber: actNumber,
        transferActDocumentId: actDoc.id,
      }

      setTsdShipments((prev) => {
        const has = prev.some((s) => s.id === finalShipment.id)
        return has
          ? prev.map((s) => (s.id === finalShipment.id ? finalShipment : s))
          : [...prev, finalShipment]
      })

      setProcurementRequests((prev) =>
        prev.map((r) =>
          r.id === task.requestId
            ? {
                ...r,
                status: 'in_transit' as const,
                documents: [...r.documents.filter((d) => d.id !== actDoc.id), actDoc],
              }
            : r,
        ),
      )
      setTsdTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t)),
      )
      setDocuments((prev) => [
        ...prev,
        {
          id: `doc-${actDoc.id}`,
          title: actDoc.title,
          type: 'acceptance',
          operationId: finalShipment.id,
          createdAt: now,
        },
      ])
      appendTsdAudit(
        'tsd_shipment_complete',
        'tsd',
        `${finalShipment.number}: ${actNumber} по ${demandLabel}`,
      )
      return {
        ok: true,
        message: `Отгрузка по спросу (${request.number}). Сформирован ${actDoc.title} ${actNumber}`,
      }
    },
    [tsdTasks, tsdShipments, procurementRequests, webUser, appendTsdAudit],
  )

  const completeTsdTransferReceiptTask = useCallback(
    (taskId: string, scannedCodes: string[]) => {
      const task = tsdTasks.find((t) => t.id === taskId)
      if (!task || task.type !== 'transfer_receipt') return { ok: false, message: 'Задача не найдена' }
      if (task.status === 'locked') return { ok: false, message: 'Сначала оформите акт приёма-передачи на главном складе' }
      if (!scannedCodes.length) return { ok: false, message: 'Нет отсканированных кодов' }

      const shipmentId = task.shipmentId ?? tsdShipments.find((s) => s.status === 'in_transit')?.id
      if (!shipmentId) return { ok: false, message: 'Перемещение не найдено' }

      const shipment = tsdShipments.find((s) => s.id === shipmentId)
      const actor = webUser?.name ?? 'Кладовщик'
      const closedAt = new Date().toISOString()
      const targetIds = new Set<string>()

      for (const code of scannedCodes) {
        const resolution = resolveScan(code, pallets, boxes, canisters)
        const found = findCanisterByScan(canisters, code)
        if (found) targetIds.add(found.id)
        if (resolution?.pallet) {
          canisters
            .filter((c) => c.palletSscc === resolution.pallet!.sscc)
            .forEach((c) => targetIds.add(c.id))
        }
        if (resolution?.box) {
          canisters
            .filter((c) => c.boxSscc === resolution.box!.sscc)
            .forEach((c) => targetIds.add(c.id))
        }
      }

      const demo = canisters.find((c) => c.id === DEMO_CANISTER_ID)
      if (
        demo &&
        [
          'reserved',
          'picking',
          'ready_to_ship',
          'in_transit_child',
          'received_child',
        ].includes(demo.status)
      ) {
        targetIds.add(DEMO_CANISTER_ID)
      }

      let placedCount = 0
      setCanisters((prev) =>
        prev.map((c) => {
          if (!targetIds.has(c.id)) return c
          const advanced = advanceCanisterToChildStorage(c, actor)
          if (advanced.status === 'in_storage_child' && c.status !== 'in_storage_child') {
            placedCount++
          }
          return advanced
        }),
      )
      if (placedCount > 0) {
        setSummary((s) => ({ ...s, statTransferred: s.statTransferred + placedCount }))
      }

      setTsdShipments((prev) =>
        prev.map((s) =>
          s.id === shipmentId
            ? { ...s, status: 'received' as const, transferActClosedAt: closedAt }
            : s,
        ),
      )

      if (shipment?.transferActDocumentId) {
        setProcurementRequests((prev) =>
          prev.map((r) => {
            if (!shipment.requestIds.includes(r.id)) return r
            return {
              ...r,
              documents: r.documents.map((d) =>
                d.id === shipment.transferActDocumentId ? closeActDocument(d, closedAt) : d,
              ),
            }
          }),
        )
        setDocuments((prev) => [
          ...prev,
          {
            id: `doc-close-${shipment.transferActDocumentId}`,
            title: `Акт приёма-передачи ${shipment.transferActNumber ?? ''} (закрыт)`,
            type: 'acceptance',
            operationId: shipmentId,
            createdAt: closedAt,
          },
        ])
      }

      setTsdTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t)),
      )
      appendTsdAudit(
        'tsd_transfer_receipt_complete',
        'tsd',
        shipment?.transferActNumber
          ? `Закрыт ${shipment.transferActNumber}, размещено ${placedCount} кан.`
          : `Приёмка перемещения: ${scannedCodes.join(', ')}`,
      )
      return {
        ok: true,
        message:
          placedCount > 0
            ? `Акт приёма-передачи закрыт. Размещено ${placedCount} кан. на дочернем складе`
            : shipment?.transferActNumber
              ? `Акт приёма-передачи ${shipment.transferActNumber} закрыт`
              : 'Приёмка перемещения завершена',
      }
    },
    [tsdTasks, tsdShipments, procurementRequests, appendTsdAudit, webUser, pallets, boxes, canisters],
  )

  const completeWarehouseTransferSend = useCallback(
    (warehouseTaskId: string, scannedCodes: string[]) => {
      const wt = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!wt || wt.operationType !== 'transfer' || inferTransferHandshakeRole(wt) !== 'sender') {
        return { ok: false, message: 'Задача отгрузки не найдена' }
      }
      if (!scannedCodes.length) return { ok: false, message: 'Отсканируйте канистры' }

      const request = wt.sourceDocumentId
        ? procurementRequests.find((r) => r.id === wt.sourceDocumentId)
        : undefined
      const actor = webUser?.name ?? 'Кладовщик'
      const now = new Date().toISOString()
      const demandLabel = request ? `Спрос: заявка ${request.number}` : wt.sourceLabel ?? 'Перемещение'

      const actNumber = `АПП-${wt.number.replace('№', 'T-')}`
      const actDoc = transferHandshakeActDocument(actNumber, {
        uploadedBy: actor,
        basisType: request ? 'demand' : 'manual',
        basisId: request?.id,
        basisLabel: demandLabel,
      })

      let workingCanisters = canisters
      let workingPallets = pallets
      let workingBoxes = boxes
      let demoBundle: DemoOpBundle | null = null
      if (!mainWarehouseCanistersForSend(workingCanisters).length) {
        const { id, number } = nextDemoOpNumbers(expectedReceipts)
        demoBundle = buildDemoOpBundle({
          label: `Демо запас для ${wt.number}`,
          receiptId: id,
          receiptNumber: number,
        })
        workingCanisters = demoBundle.canisters
        workingPallets = demoBundle.pallets
        workingBoxes = demoBundle.boxes
        applyDemoOpBundle(demoBundle)
      }

      let targetIds = resolveCanisterIdsFromScanCodes(
        scannedCodes,
        workingCanisters,
        workingPallets,
        workingBoxes,
      )
      let toShip = workingCanisters.filter(
        (c) =>
          targetIds.has(c.id) && c.warehouseId === 'wh-1' && c.status === 'in_storage_main',
      )
      const planQty = wt.expectedQty ?? toShip.length
      if (!toShip.length) {
        const pickCount = Math.min(Math.max(scannedCodes.length, 1), planQty || 8)
        toShip = mainWarehouseCanistersForSend(workingCanisters).slice(0, pickCount)
      } else {
        toShip = toShip.slice(0, planQty)
      }
      if (!toShip.length) {
        return { ok: false, message: 'Не удалось подобрать канистры для отгрузки' }
      }

      const shippedCanisterIds = toShip.map((c) => c.id)
      const shipCodes = toShip.map((c) => canisterScanCode(c))
      const moved = toShip.length
      const shipIdSet = new Set(shippedCanisterIds)

      const shipment: TsdShipment = {
        id: `tsd-ship-${warehouseTaskId}`,
        number: wt.number.replace('№', 'SH-'),
        requestIds: request ? [request.id] : [],
        requestNumbers: request ? [request.number] : [],
        status: 'in_transit',
        createdAt: now,
        shippedAt: now,
        actIssuedAt: now,
        scannedCodes: shipCodes,
        shippedCanisterIds,
        warehouseId: 'wh-1',
        demandBasisLabel: demandLabel,
        transferActNumber: actNumber,
        transferActDocumentId: actDoc.id,
      }

      setCanisters((prev) => {
        const base = demoBundle ? demoBundle.canisters : prev
        const next = base.map((c) => {
          if (!shipIdSet.has(c.id)) return c
          return appendHistory(
            {
              ...c,
              status: 'in_transit_child',
              warehouseId: 'wh-1',
            },
            {
              at: now,
              event: `Отгружено по ${actNumber}`,
              status: 'in_transit_child',
              actor,
              location: 'В пути → ДС №1',
              documentId: actNumber,
            },
          )
        })
        setStock(stockBalancesFromCanisters(next))
        return next
      })

      setTsdShipments((prev) => {
        const has = prev.some((s) => s.id === shipment.id)
        return has ? prev.map((s) => (s.id === shipment.id ? shipment : s)) : [...prev, shipment]
      })

      if (request) {
        setProcurementRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? {
                  ...r,
                  status: 'in_transit' as const,
                  documents: [...r.documents.filter((d) => d.id !== actDoc.id), actDoc],
                }
              : r,
          ),
        )
      }

      setWarehouseTasks((prev) =>
        prev.map((t) => {
          if (t.id === warehouseTaskId) {
            return {
              ...t,
              status: 'completed' as const,
              scannedQty: moved,
              expectedQty: moved,
              completedAt: now,
              history: [...t.history, wtHistoryEntry(`Отгружено ${moved} кан. ${actNumber}`)],
            }
          }
          if (t.id === wt.linkedTaskId) {
            return {
              ...t,
              status: 'awaiting_receiver_confirmation' as const,
              expectedQty: moved,
              scannedQty: 0,
              history: [...t.history, wtHistoryEntry(`Ожидает приёмки ${moved} кан. на дочернем складе`)],
            }
          }
          return t
        }),
      )

      setSummary((s) => ({ ...s, statTransferred: s.statTransferred + moved }))
      appendTsdAudit('warehouse_transfer_send', 'tsd', `${wt.number}: ${actNumber}`)
      return { ok: true, message: `Отгрузка ${wt.number}. ${actDoc.title} ${actNumber}` }
    },
    [warehouseTasks, procurementRequests, webUser, canisters, pallets, boxes, expectedReceipts, applyDemoOpBundle, appendTsdAudit],
  )

  const completeWarehouseTransferReceive = useCallback(
    (warehouseTaskId: string, scannedCodes: string[]) => {
      const wt = warehouseTasks.find((t) => t.id === warehouseTaskId)
      if (!wt || wt.operationType !== 'transfer' || inferTransferHandshakeRole(wt) !== 'receiver') {
        return { ok: false, message: 'Задача приёмки не найдена' }
      }
      if (!scannedCodes.length) return { ok: false, message: 'Отсканируйте канистры' }

      const sender = wt.linkedTaskId
        ? warehouseTasks.find((t) => t.id === wt.linkedTaskId)
        : undefined

      const shipment =
        (wt.linkedTaskId
          ? tsdShipments.find((s) => s.id === `tsd-ship-${wt.linkedTaskId}`)
          : undefined) ??
        tsdShipments.find(
          (s) =>
            s.status === 'in_transit' &&
            wt.sourceDocumentId &&
            s.requestIds.includes(wt.sourceDocumentId),
        )
      const actor = webUser?.name ?? 'Кладовщик'
      const closedAt = new Date().toISOString()
      const requestId = wt.sourceDocumentId
      const linkedRequest = requestId
        ? procurementRequests.find((r) => r.id === requestId)
        : undefined
      const targetWarehouseId =
        linkedRequest?.warehouseId ??
        (linkedRequest ? targetWarehouseForEnterprise(linkedRequest.enterpriseId).id : 'wh-field-1')

      let targetIds: Set<string>
      if (shipment?.shippedCanisterIds?.length) {
        targetIds = new Set(shipment.shippedCanisterIds)
      } else {
        targetIds = resolveCanisterIdsFromScanCodes(scannedCodes, canisters, pallets, boxes)
        if (!targetIds.size && shipment?.scannedCodes.length) {
          targetIds = resolveCanisterIdsFromScanCodes(
            shipment.scannedCodes,
            canisters,
            pallets,
            boxes,
          )
        }
      }
      if (!targetIds.size) {
        return { ok: false, message: 'Не удалось сопоставить отсканированные коды с канистрами' }
      }

      const toReceive = canisters.filter(
        (c) => targetIds.has(c.id) && c.status === 'in_transit_child',
      )
      let placed = toReceive.length
      if (!placed) {
        placed = targetIds.size
      }

      setCanisters((prev) => {
        const next = prev.map((c) => {
          if (!targetIds.has(c.id)) return c
          return advanceCanisterToChildStorage(c, actor, targetWarehouseId)
        })
        setStock(stockBalancesFromCanisters(next))
        return next
      })

      if (shipment) {
        setTsdShipments((prev) =>
          prev.map((s) =>
            s.id === shipment.id
              ? { ...s, status: 'received' as const, transferActClosedAt: closedAt }
              : s,
          ),
        )
        if (shipment.transferActDocumentId) {
          setProcurementRequests((prev) =>
            prev.map((r) => {
              if (!shipment.requestIds.includes(r.id)) return r
              const closedDoc = closeActDocument(
                r.documents.find((d) => d.id === shipment.transferActDocumentId) ??
                  transferHandshakeActDocument(shipment.transferActNumber ?? '', {}),
                closedAt,
              )
              return {
                ...r,
                status: 'fulfilled' as const,
                fulfillmentPercent: 100,
                documents: [
                  ...r.documents.filter((d) => d.id !== shipment.transferActDocumentId),
                  closedDoc,
                ],
              }
            }),
          )
        }
      } else if (requestId) {
        setProcurementRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: 'fulfilled' as const, fulfillmentPercent: 100 }
              : r,
          ),
        )
      }

      setWarehouseTasks((prev) =>
        prev.map((t) => {
          if (t.id === warehouseTaskId || t.id === wt.linkedTaskId) {
            return {
              ...t,
              status: 'completed' as const,
              acceptedQty: placed || scannedCodes.length,
              scannedQty: t.scannedQty ?? placed,
              completedAt: closedAt,
              history: [
                ...t.history,
                wtHistoryEntry(
                  t.id === warehouseTaskId
                    ? `Принято ${placed || scannedCodes.length} кан. Перемещение завершено`
                    : 'Отгрузка подтверждена получателем',
                ),
              ],
            }
          }
          return t
        }),
      )

      setSummary((s) => ({ ...s, statTransferred: s.statTransferred + placed }))
      appendTsdAudit('warehouse_transfer_receive', 'tsd', `${wt.number}: принято ${placed} кан.`)
      return {
        ok: true,
        message: `Приём ${wt.number} завершён. Спрос исполнен (${placed || scannedCodes.length} кан.)`,
      }
    },
    [warehouseTasks, tsdShipments, procurementRequests, webUser, canisters, pallets, boxes, appendTsdAudit],
  )

  const issueCanisterByScan = useCallback(
    (code: string, options?: { device?: 'web' | 'tsd' }) => {
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      const device = options?.device ?? 'web'
      const trimmed = code.trim()
      if (!trimmed) return { ok: false, message: 'Введите SGTIN или серийный номер' }

      const canister = findCanisterByScan(canisters, trimmed)
      if (!canister) return { ok: false, message: 'Канистра не найдена' }
      if (canister.warehouseId && canister.warehouseId !== CHILD_WAREHOUSE_ID) {
        return { ok: false, message: 'Канистра находится на другом складе' }
      }

      const result = advanceCanisterOnScan(canister, 'issue', { actorName: user.name })
      if ('error' in result) return { ok: false, message: result.error }

      const now = new Date().toISOString()
      let actNumber: string
      let actDoc: RequestDocument
      if (openIssueAct?.molId === user.id) {
        actNumber = openIssueAct.number
        actDoc = openIssueAct.doc
      } else {
        actNumber = `АВ-${String(Date.now()).slice(-6)}`
        actDoc = issueActDocument(actNumber, {
          uploadedBy: user.name,
          basisType: 'manual',
          basisLabel: 'Выдача вручную',
          molName: user.name,
        })
        setOpenIssueAct({ molId: user.id, number: actNumber, doc: actDoc })
        setDocuments((prev) => [
          ...prev,
          {
            id: `doc-${actDoc.id}`,
            title: actDoc.title,
            type: 'transfer',
            operationId: actNumber,
            createdAt: now,
          },
        ])
      }

      const issued = {
        ...result.canister,
        issuedTo: user.name,
        issueActNumber: actNumber,
      }
      const withDoc = appendHistory(issued, {
        at: now,
        event: `Выдача по ${actNumber} (МОЛ: ${user.name})`,
        status: 'issued_agronomist',
        actor: user.name,
        location: 'Дочерний склад → МОЛ',
        documentId: actNumber,
      })

      setCanisters((prev) => prev.map((c) => (c.id === canister.id ? withDoc : c)))

      const state = toOperationState({ operations, documents, auditLog })
      const next = addOperation(
        state,
        'issue',
        {
          fromType: 'warehouse',
          fromId: CHILD_WAREHOUSE_ID,
          toType: 'agronomist',
          toId: user.id,
          createdBy: user.id,
          documentId: actNumber,
          items: [
            {
              id: canister.id,
              barcode: canister.sgtin,
              productName: canister.productName,
              quantity: 1,
              unit: 'шт',
            },
          ],
        },
        { userId: user.id, userName: user.name, role: user.role, device },
      )
      applyOpState(next)
      setSummary((s) => ({ ...s, statIssued: s.statIssued + 1 }))
      if (device === 'tsd') {
        appendTsdAudit('tsd_issue', 'tsd', `${canister.serialNumber}: ${actNumber}`)
      }

      return { ok: true, message: `${result.event}. ${actDoc.title} ${actNumber}` }
    },
    [
      webUser,
      canisters,
      operations,
      documents,
      auditLog,
      applyOpState,
      appendTsdAudit,
      openIssueAct,
    ],
  )

  const returnCanisterByScan = useCallback(
    (code: string, returnCondition: ReturnCondition, options?: { device?: 'web' | 'tsd'; photoUrl?: string; remainderLiters?: number }) => {
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      const device = options?.device ?? 'web'
      if (returnCondition !== 'empty' && !options?.photoUrl) {
        return { ok: false, message: 'Для непустой тары приложите фото' }
      }
      if (returnCondition === 'half_empty' && options?.remainderLiters == null) {
        return { ok: false, message: 'Укажите остаток в литрах' }
      }
      const trimmed = code.trim()
      if (!trimmed) return { ok: false, message: 'Введите SGTIN или серийный номер' }

      const canister = findCanisterByScan(canisters, trimmed)
      if (!canister) return { ok: false, message: 'Канистра не найдена' }
      if (canister.warehouseId && canister.warehouseId !== CHILD_WAREHOUSE_ID) {
        return { ok: false, message: 'Канистра находится на другом складе' }
      }

      const result = advanceCanisterOnScan(canister, 'return', {
        actorName: user.name,
        returnCondition,
      })
      if ('error' in result) return { ok: false, message: result.error }

      const now = new Date().toISOString()
      const basisAct = canister.issueActNumber ?? 'без акта выдачи'
      const conditionLabel =
        returnCondition === 'half_empty'
          ? 'полупустая'
          : returnCondition === 'full'
            ? 'полная'
            : 'пустая'
      const returnActNumber = `АВозвр-${String(Date.now()).slice(-6)}`
      const returnActDoc = returnActDocument(returnActNumber, {
        uploadedBy: user.name,
        basisType: 'issue_act',
        basisId: canister.issueActNumber,
        basisLabel: `По акту выдачи ${basisAct}`,
        returnCondition: conditionLabel,
        molName: canister.issuedTo ?? user.name,
      })

      const returned = appendHistory(result.canister, {
        at: now,
        event: `Возврат (${conditionLabel}) по ${returnActNumber}`,
        status: result.canister.status,
        actor: user.name,
        location: 'МОЛ → дочерний склад',
        documentId: returnActNumber,
      })

      setCanisters((prev) => prev.map((c) => (c.id === canister.id ? returned : c)))

      const state = toOperationState({ operations, documents, auditLog })
      const next = addOperation(
        state,
        'return',
        {
          fromType: 'agronomist',
          fromId: user.id,
          toType: 'warehouse',
          toId: CHILD_WAREHOUSE_ID,
          createdBy: user.id,
          documentId: returnActNumber,
          items: [
            {
              id: canister.id,
              barcode: canister.sgtin,
              productName: canister.productName,
              quantity: 1,
              unit: 'шт',
              remainder: options?.remainderLiters ?? result.canister.remainderLiters,
              photoUrl: options?.photoUrl,
            },
          ],
        },
        { userId: user.id, userName: user.name, role: user.role, device },
      )
      applyOpState(next)
      setWarehouseTasks((prev) => [
        ...prev,
        createReturnApprovalTask(prev, {
          returnActNumber,
          createdByName: user.name,
          conditionLabel,
          productName: canister.productName,
          molName: canister.issuedTo ?? user.name,
        }),
      ])
      setDocuments((prev) => [
        ...prev,
        {
          id: `doc-${returnActDoc.id}`,
          title: returnActDoc.title,
          type: 'transfer',
          operationId: returnActNumber,
          createdAt: now,
        },
      ])
      setSummary((s) => ({ ...s, statReturned: s.statReturned + 1 }))
      if (device === 'tsd') {
        appendTsdAudit('tsd_return', 'tsd', `${canister.serialNumber}: ${returnActNumber}`)
      }

      return {
        ok: true,
        message: `${result.event}. ${returnActDoc.title} ${returnActNumber} (основание: ${basisAct})`,
      }
    },
    [webUser, canisters, operations, documents, auditLog, applyOpState, appendTsdAudit],
  )

  const quarantineTsdTask = useCallback(
    (taskId: string, scanCode: string, reason: TsdQuarantineReason, note?: string) => {
      const task = tsdTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (!scanCode.trim()) return { ok: false, message: 'Укажите код сканирования' }

      setTsdTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'quarantine' as const,
                quarantineReason: reason,
                quarantineScanCode: scanCode.trim(),
                quarantineNote: note?.trim() || undefined,
              }
            : t,
        ),
      )
      appendTsdAudit('tsd_quarantine', 'tsd', note?.trim() || reason, scanCode.trim())
      return { ok: true, message: 'Задача отправлена в карантин' }
    },
    [tsdTasks, appendTsdAudit],
  )

  const startTsdTask = useCallback(
    (taskId: string) => {
      const task = tsdTasks.find((t) => t.id === taskId)
      if (!task) return { ok: false, message: 'Задача не найдена' }
      if (task.status === 'locked') return { ok: false, message: 'Задача ещё недоступна' }
      if (task.status === 'completed' || task.status === 'quarantine') {
        return { ok: true, message: 'Задача уже открыта' }
      }
      if (task.status === 'in_progress') return { ok: true, message: 'Задача в работе' }

      setTsdTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' as const } : t)),
      )
      return { ok: true, message: 'Задача начата' }
    },
    [tsdTasks],
  )

  const nextRequestNumber = (list: ProcurementRequest[]) => {
    const nums = list
      .map((r) => parseInt(r.number.replace(/\D/g, ''), 10))
      .filter((n) => !Number.isNaN(n))
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    return `ЗН-${String(next).padStart(3, '0')}`
  }

  const saveProcurementRequest = useCallback(
    (
      input: CreateProcurementRequestInput,
      mode: 'draft' | 'submit',
      requestId?: string,
    ) => {
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      if (!input.items.length) return { ok: false, message: 'Добавьте позиции в заявку' }

      const now = new Date().toISOString()
      const items = input.items.map((i) => ({
        ...i,
        receivedQty: 0,
        warehouseId: user.warehouseId,
        warehouseName: user.warehouseId ? undefined : undefined,
      }))

      const existing = requestId ? procurementRequests.find((r) => r.id === requestId) : undefined
      const status =
        mode === 'draft'
          ? 'draft'
          : existing?.status === 'returned'
            ? 'submitted'
            : 'submitted'
      const fulfillmentPercent = calcRequestFulfillment(
        items.map((i) => ({ ...i, receivedQty: existing?.items.find((x) => x.productCode === i.productCode)?.receivedQty ?? 0 })),
      )

      const prevHistory = existing
        ? existing.commentHistory?.length
          ? existing.commentHistory
          : existing.comment?.trim()
            ? [
                {
                  id: `${existing.id}-comment-legacy`,
                  authorId: existing.createdById,
                  authorName: existing.createdBy,
                  text: existing.comment.trim(),
                  createdAt: existing.submittedAt ?? existing.createdAt,
                },
              ]
            : []
        : []

      const commentHistory = [...prevHistory]
      if (input.comment?.trim()) {
        commentHistory.push({
          id: `rc-${Date.now()}`,
          authorId: user.id,
          authorName: user.name,
          text: input.comment.trim(),
          createdAt: now,
        })
      }

      const assignee = input.assigneeId ? getUserById(input.assigneeId) : user
      const officer = assignee ?? user
      const targetWarehouse = targetWarehouseForEnterprise(input.enterpriseId)

      const request: ProcurementRequest = {
        id: existing?.id ?? `pr-${Date.now()}`,
        number: existing?.number ?? nextRequestNumber(procurementRequests),
        enterpriseId: input.enterpriseId,
        enterpriseName: getEnterpriseName(input.enterpriseId),
        warehouseId: targetWarehouse.id,
        warehouseName: targetWarehouse.name,
        items: items.map((i) => ({
          productCode: i.productCode,
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          price: i.price,
          receivedQty: 0,
          warehouseId: targetWarehouse.id,
          warehouseName: targetWarehouse.name,
        })),
        status,
        createdAt: existing?.createdAt ?? now,
        submittedAt: mode === 'submit' ? now : existing?.submittedAt,
        dueDate: input.dueDate,
        createdBy: officer.name,
        createdById: officer.id,
        comment: commentHistory.length ? commentHistory[commentHistory.length - 1].text : undefined,
        commentHistory,
        fulfillmentPercent: status === 'draft' ? 0 : fulfillmentPercent,
        documents: mergeRequestDocuments(status, {
          existingDocuments: existing?.documents,
          pendingAttachments: input.attachments,
          uploadedBy: user.name,
        }),
      }

      setProcurementRequests((prev) => {
        if (existing) return prev.map((r) => (r.id === existing.id ? request : r))
        return [request, ...prev]
      })

      if (mode === 'submit') {
        const state = toOperationState({ operations, documents, auditLog })
        const next = addOperation(
          state,
          'procurement_request_create',
          {
            fromType: 'warehouse',
            fromId: user.warehouseId ?? 'wh-1',
            toType: 'management',
            toId: 'mgmt',
            createdBy: user.id,
            items: input.items.map((i) => ({
              id: i.productCode,
              barcode: i.productCode,
              productName: i.productName,
              quantity: i.quantity,
              unit: i.unit,
            })),
          },
          { userId: user.id, userName: user.name, role: user.role, device: 'web' },
        )
        applyOpState(next)
      }

      return {
        ok: true,
        message:
          mode === 'draft'
            ? `Черновик ${request.number} сохранён`
            : `Заявка ${request.number} отправлена в отдел закупок`,
        requestId: request.id,
        requestNumber: request.number,
        commentHistory: request.commentHistory,
      }
    },
    [webUser, operations, documents, auditLog, applyOpState, procurementRequests],
  )

  const addRequestAttachment = useCallback(
    (requestId: string, fileName: string) => {
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      let added = false
      setProcurementRequests((prev) =>
        prev.map((request) => {
          if (request.id !== requestId) return request
          if (request.documents.some((doc) => doc.type === 'attachment' && doc.fileName === fileName)) {
            return request
          }
          added = true
          return {
            ...request,
            documents: [
              ...request.documents,
              attachmentFromFileName(fileName, { uploadedBy: user.name }),
            ],
          }
        }),
      )
      if (!added) return { ok: false, message: 'Такой файл уже прикреплён' }
      return { ok: true, message: `Файл «${fileName}» прикреплён` }
    },
    [webUser],
  )

  const addProcurementRequestComment = useCallback(
    (requestId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return { ok: false, message: 'Введите сообщение' }
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      if (!procurementRequests.some((r) => r.id === requestId)) {
        return { ok: false, message: 'Заявка не найдена' }
      }

      const newComment: ProcurementRequestComment = {
        id: `rc-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        text: trimmed,
        createdAt: new Date().toISOString(),
      }

      setProcurementRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                commentHistory: [...normalizeCommentHistory(request), newComment],
                comment: trimmed,
              }
            : request,
        ),
      )
      return { ok: true, message: 'Комментарий добавлен' }
    },
    [webUser, procurementRequests],
  )

  const addConsolidatedDemandComment = useCallback(
    (demandId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return { ok: false, message: 'Введите сообщение' }
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      if (!consolidatedDemands.some((d) => d.id === demandId)) {
        return { ok: false, message: 'Сводная не найдена' }
      }

      const newComment: ProcurementRequestComment = {
        id: `cdc-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        text: trimmed,
        createdAt: new Date().toISOString(),
      }

      setConsolidatedDemands((prev) =>
        prev.map((demand) =>
          demand.id === demandId
            ? { ...demand, comments: [...(demand.comments ?? []), newComment] }
            : demand,
        ),
      )
      return { ok: true, message: 'Комментарий добавлен' }
    },
    [webUser, consolidatedDemands],
  )

  const addSupplierOrderComment = useCallback(
    (orderId: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return { ok: false, message: 'Введите сообщение' }
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      if (!supplierOrders.some((o) => o.id === orderId)) {
        return { ok: false, message: 'Заявка поставщику не найдена' }
      }

      const newComment: ProcurementRequestComment = {
        id: `soc-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        text: trimmed,
        createdAt: new Date().toISOString(),
      }

      setSupplierOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, comments: [...(order.comments ?? []), newComment] }
            : order,
        ),
      )
      return { ok: true, message: 'Комментарий добавлен' }
    },
    [webUser, supplierOrders],
  )

  const addConsolidatedDemandAttachment = useCallback(
    (demandId: string, fileName: string) => {
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }
      let added = false
      setConsolidatedDemands((prev) =>
        prev.map((demand) => {
          if (demand.id !== demandId) return demand
          const docs = demand.documents ?? []
          if (docs.some((doc) => doc.type === 'attachment' && doc.fileName === fileName)) {
            return demand
          }
          added = true
          return {
            ...demand,
            documents: [...docs, attachmentFromFileName(fileName, { uploadedBy: user.name })],
          }
        }),
      )
      if (!added) return { ok: false, message: 'Такой файл уже прикреплён' }
      return { ok: true, message: `Файл «${fileName}» прикреплён` }
    },
    [webUser],
  )

  const addConsolidatedDemandOpFile = useCallback(
    (demandId: string, fileName: string) => {
      const user = webUser
      if (!user) return { ok: false, message: 'Войдите в систему' }

      const demand = consolidatedDemands.find((d) => d.id === demandId)
      if (!demand) return { ok: false, message: 'Сводная не найдена' }
      if ((demand.documents ?? []).some((doc) => doc.title === 'ОП')) {
        return { ok: false, message: 'Файл ОП уже загружен' }
      }

      const linkedRequestIds = demand.requestIds

      setConsolidatedDemands((prev) =>
        prev.map((item) =>
          item.id === demandId
            ? {
                ...item,
                status: 'awaiting_delivery' as const,
                documents: [...(item.documents ?? []), opDocumentFromFileName(fileName, { uploadedBy: user.name })],
              }
            : item,
        ),
      )
      setProcurementRequests((prev) =>
        prev.map((r) =>
          linkedRequestIds.includes(r.id)
            ? {
                ...r,
                status: 'awaiting_delivery' as const,
                documents: mergeRequestDocuments('awaiting_delivery', {
                  existingDocuments: r.documents,
                }),
              }
            : r,
        ),
      )
      return { ok: true, message: `Файл ОП «${fileName}» загружен. Статус: Ожидает поставки` }
    },
    [webUser, consolidatedDemands],
  )

  const createConsolidatedDemand = useCallback(
    (input: CreateConsolidatedDemandInput) => {
      const requests = procurementRequests.filter(
        (r) => input.requestIds.includes(r.id) && r.status === 'approved',
      )
      if (!requests.length) {
        return { ok: false, message: 'Выберите утверждённые заявки' }
      }

      const activeItems = input.items.filter((i) => i.quantity > 0)
      if (!activeItems.length) {
        return { ok: false, message: 'Укажите хотя бы одну позицию с количеством' }
      }
      if (!input.supplierId) {
        return { ok: false, message: 'Выберите поставщика' }
      }

      const seq = consolidatedDemands.length + 1
      const number = `СВ-${String(seq).padStart(3, '0')}`
      const productNames = [...new Set(activeItems.map((i) => i.productName))]
      const productName = productNames.length === 1 ? productNames[0] : 'Смешанная потребность'
      const totalQuantity = activeItems.reduce((sum, i) => sum + i.quantity, 0)
      const unit = activeItems[0]?.unit ?? 'л'
      const requestNumbers = requests.map((r) => r.number)
      const demandSummary = `По заявкам ${requestNumbers.join(', ')} — ${totalQuantity.toLocaleString('ru-RU')} ${unit}, поставщик ${input.supplierName}`

      const demand: ConsolidatedDemand = {
        id: `cd-${Date.now()}`,
        number,
        requestIds: requests.map((r) => r.id),
        requestNumbers,
        productName,
        totalQuantity,
        unit,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        status: 'draft',
        createdAt: new Date().toISOString(),
        demandSummary,
        items: activeItems,
        deliveryDate: input.deliveryDate,
        deliveryTerms: input.deliveryTerms,
        paymentTerms: input.paymentTerms,
        comments: input.comment?.trim()
          ? [
              {
                id: `cd-comment-${Date.now()}`,
                authorId: webUser?.id ?? 'system',
                authorName: webUser?.name ?? 'Снабжение',
                text: input.comment.trim(),
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
        documents: buildConsolidatedDemandDocuments(number, true, {
          sourceRequests: requests,
          pendingAttachments: input.attachments,
          uploadedBy: webUser?.name,
        }),
      }

      setConsolidatedDemands((prev) => [...prev, demand])
      setProcurementRequests((prev) =>
        prev.map((r) =>
          input.requestIds.includes(r.id) ? { ...r, status: 'in_consolidated' as const } : r,
        ),
      )

      return { ok: true, message: `Сводная ${number} создана`, demandNumber: number, demandId: demand.id }
    },
    [procurementRequests, consolidatedDemands.length, webUser],
  )

  const createSupplierOrder = useCallback(
    (consolidatedDemandIds: string[]) => {
      const demands = consolidatedDemands.filter(
        (d) =>
          consolidatedDemandIds.includes(d.id) &&
          (d.status === 'approved' || d.status === 'draft'),
      )
      if (!demands.length) {
        return { ok: false, message: 'Выберите утверждённые сводные' }
      }

      const itemsMap = new Map<string, SupplierOrderItem>()
      for (const demand of demands) {
        if (demand.items?.length) {
          for (const item of demand.items) {
            const existing = itemsMap.get(item.productCode)
            if (existing) {
              existing.quantity += item.quantity
            } else {
              itemsMap.set(item.productCode, {
                productCode: item.productCode,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
              })
            }
          }
          continue
        }
        const requests = procurementRequests.filter((r) => demand.requestIds.includes(r.id))
        for (const req of requests) {
          for (const item of req.items) {
            const existing = itemsMap.get(item.productCode)
            if (existing) {
              existing.quantity += item.quantity
            } else {
              itemsMap.set(item.productCode, {
                productCode: item.productCode,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
              })
            }
          }
        }
      }
      const items = [...itemsMap.values()]

      const seq = supplierOrders.length + 1
      const number = `ЗП-${String(seq).padStart(3, '0')}`
      const requestNumbers = [...new Set(demands.flatMap((d) => d.requestNumbers))]

      const order: SupplierOrder = {
        id: `so-${Date.now()}`,
        number,
        consolidatedDemandIds: demands.map((d) => d.id),
        consolidatedNumbers: demands.map((d) => d.number),
        requestNumbers,
        supplierName: demands[0].supplierName,
        items,
        status: 'sent',
        createdAt: new Date().toISOString(),
        documents: [],
        comments: [],
      }

      setSupplierOrders((prev) => [...prev, order])
      setConsolidatedDemands((prev) =>
        prev.map((d) =>
          consolidatedDemandIds.includes(d.id)
            ? { ...d, status: 'merged' as const, supplierOrderId: order.id }
            : d,
        ),
      )
      return { ok: true, message: `Заявка ${number} сформирована`, orderNumber: number, orderId: order.id }
    },
    [consolidatedDemands, supplierOrders.length, procurementRequests],
  )

  const approveConsolidatedDemand = useCallback(
    (id: string) => {
      const demand = consolidatedDemands.find((d) => d.id === id)
      if (!demand) return { ok: false, message: 'Сводная не найдена' }
      if (demand.status !== 'draft') {
        return { ok: false, message: 'Сводная уже утверждена или в заявке поставщику' }
      }

      const orderResult = createSupplierOrder([id])
      if (!orderResult.ok) return orderResult

      const eDoc = opDocumentFromFileName(`Заявка_${orderResult.orderNumber}.pdf`, {
        uploadedBy: webUser?.name ?? 'Снабжение',
      })
      setSupplierOrders((prev) =>
        prev.map((o) =>
          o.id === orderResult.orderId
            ? { ...o, documents: [...(o.documents ?? []), eDoc] }
            : o,
        ),
      )
      setConsolidatedDemands((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, documents: [...(d.documents ?? []), eDoc] } : d,
        ),
      )

      return {
        ok: true,
        message: `${demand.number} утверждена. ${orderResult.message}. Электронная версия в документах.`,
      }
    },
    [consolidatedDemands, createSupplierOrder, webUser],
  )

  const returnConsolidatedDemand = useCallback(
    (id: string, comment: string) => {
      const trimmed = comment.trim()
      if (!trimmed) return { ok: false, message: 'Укажите причину возврата' }

      const demand = consolidatedDemands.find((d) => d.id === id)
      if (!demand || demand.status !== 'draft') {
        return { ok: false, message: 'Сводная не найдена или уже утверждена' }
      }

      const returnComment: ProcurementRequestComment = {
        id: `ret-${Date.now()}`,
        authorId: webUser?.id ?? 'system',
        authorName: webUser?.name ?? 'Снабжение',
        text: `Возврат сводной ${demand.number}: ${trimmed}`,
        createdAt: new Date().toISOString(),
      }

      setProcurementRequests((prev) =>
        prev.map((r) =>
          demand.requestIds.includes(r.id)
            ? {
                ...r,
                status: 'returned' as const,
                commentHistory: [...normalizeCommentHistory(r), returnComment],
              }
            : r,
        ),
      )
      setConsolidatedDemands((prev) => prev.filter((d) => d.id !== id))
      return { ok: true, message: `Сводная ${demand.number} возвращена` }
    },
    [consolidatedDemands, webUser],
  )

  const approveProcurementRequest = useCallback(
    (id: string) => {
      const request = procurementRequests.find((r) => r.id === id)
      if (!request) return { ok: false, message: 'Заявка не найдена' }
      if (request.status !== 'submitted') {
        return { ok: false, message: 'Утвердить можно только заявку со статусом «На согласовании»' }
      }

      setProcurementRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r)),
      )
      return { ok: true, message: `Заявка ${request.number} утверждена` }
    },
    [procurementRequests],
  )

  const returnProcurementRequests = useCallback(
    (requestIds: string[], comment: string) => {
      const trimmed = comment.trim()
      if (!trimmed) return { ok: false, message: 'Укажите причину возврата' }

      const requests = procurementRequests.filter(
        (r) => requestIds.includes(r.id) && r.status === 'submitted',
      )
      if (!requests.length) {
        return { ok: false, message: 'Нет заявок для возврата' }
      }

      const returnComment: ProcurementRequestComment = {
        id: `ret-${Date.now()}`,
        authorId: webUser?.id ?? 'system',
        authorName: webUser?.name ?? 'Снабжение',
        text: trimmed,
        createdAt: new Date().toISOString(),
      }

      setProcurementRequests((prev) =>
        prev.map((r) =>
          requestIds.includes(r.id) && r.status === 'submitted'
            ? {
                ...r,
                status: 'returned' as const,
                commentHistory: [...normalizeCommentHistory(r), returnComment],
              }
            : r,
        ),
      )
      const numbers = requests.map((r) => r.number).join(', ')
      return { ok: true, message: `Заявки ${numbers} возвращены` }
    },
    [procurementRequests, webUser],
  )

  const confirmOperation = useCallback(
    (opId: string, device: 'web' | 'tsd' = 'web') => {
      const user = webUser
      if (!user) return
      const op = operations.find((o) => o.id === opId)
      const state = toOperationState({ operations, documents, auditLog })
      const next = confirmOp(state, opId, {
        userId: user.id,
        userName: user.name,
        role: user.role,
        device,
      })
      applyOpState(next)
      if (op?.type === 'return' && op.documentId) {
        const now = new Date().toISOString()
        setWarehouseTasks((prev) =>
          prev.map((t) => {
            if (t.operationType !== 'return' || t.sourceDocumentId !== op.documentId) return t
            return {
              ...t,
              status: 'completed' as const,
              completedAt: now,
              acceptedQty: t.scannedQty ?? t.expectedQty ?? 1,
              actualExecutorName: user.name,
              history: [...t.history, wtHistoryEntry(`Возврат одобрен: ${user.name}`)],
            }
          }),
        )
      }
    },
    [webUser, operations, documents, auditLog, applyOpState],
  )

  const rejectOperation = useCallback(
    (opId: string, device: 'web' | 'tsd' = 'web') => {
      const user = webUser
      if (!user) return
      const op = operations.find((o) => o.id === opId)
      const state = toOperationState({ operations, documents, auditLog })
      const next = rejectOp(state, opId, {
        userId: user.id,
        userName: user.name,
        role: user.role,
        device,
      })
      applyOpState(next)
      if (op?.type === 'return' && op.documentId) {
        setWarehouseTasks((prev) =>
          prev.map((t) => {
            if (t.operationType !== 'return' || t.sourceDocumentId !== op.documentId) return t
            return {
              ...t,
              status: 'cancelled' as const,
              cancelReason: 'Отклонено',
              history: [...t.history, wtHistoryEntry(`Возврат отклонён: ${user.name}`)],
            }
          }),
        )
      }
    },
    [webUser, operations, documents, auditLog, applyOpState],
  )

  const globalSearch = useCallback(
    (code: string) => resolveScan(code, pallets, boxes, canisters),
    [pallets, boxes, canisters],
  )

  const activeDemoCanister = useMemo(
    () =>
      canisters.find((c) => c.id === activeDemoCanisterId) ??
      canisters.find((c) => c.id === DEMO_CANISTER_ID),
    [canisters, activeDemoCanisterId],
  )

  const value = useMemo(
    () => ({
      hydrated,
      webUser,
      webScreen,
      webFilter,
      summary,
      operations,
      documents,
      auditLog,
      stock,
      canisters,
      pallets,
      boxes,
      expectedReceipts,
      pickTasks,
      batches,
      importCompleted,
      importValidation,
      activeDemoCanisterId,
      procurementRequests,
      consolidatedDemands,
      supplierOrders,
      tsdTasks,
      tsdShipments,
      warehouseTasks,
      createWarehouseTask,
      createTransferTaskPairFromRequest,
      updateWarehouseTask,
      cancelWarehouseTask,
      deleteWarehouseTask,
      sendWarehouseTaskToTsd,
      startWarehouseTaskOnTsd,
      ensureReceivingExpectedReceipt,
      ensureTransferTaskReady,
      ensureWarehouseTaskDemoReady,
      ensureDemoIssueReady,
      ensureDemoReturnReady,
      ensureReturnApprovalDemo,
      completeDemoWarehouseTask,
      resolveWarehouseDiscrepancy,
      login,
      logout,
      setWebScreen,
      navigateWeb,
      workTabs,
      activeWorkTabId,
      activeWorkTab,
      canWorkTabGoBack,
      canWorkTabGoForward,
      openWorkTab,
      navigateActiveWorkTab,
      closeWorkTab,
      selectWorkTab,
      addModuleLandingTab,
      addWorkTab,
      workTabBack,
      workTabForward,
      selectWorkTabHistory,
      refreshActiveWorkTab,
      setActiveWorkTabDirty,
      renameActiveWorkTab,
      saveProcurementRequest,
      addRequestAttachment,
      addProcurementRequestComment,
      addConsolidatedDemandComment,
      addSupplierOrderComment,
      addConsolidatedDemandAttachment,
      addConsolidatedDemandOpFile,
      approveProcurementRequest,
      createConsolidatedDemand,
      approveConsolidatedDemand,
      createSupplierOrder,
      returnConsolidatedDemand,
      returnProcurementRequests,
      confirmOperation,
      rejectOperation,
      simulateUpakUpload: simulateUpakUploadFn,
      runImportValidation: runImportValidationFn,
      transferExpectedReceiptToWarehouse,
      resolveScanCode,
      scanOnTsd,
      acceptPalletByScan,
      placePalletInCell,
      acceptBoxForPicking,
      createDemoPickTask,
      completeTsdReceiptTask,
      completeTsdOpReceipt,
      completeWarehouseTransferSend,
      completeWarehouseTransferReceive,
      completeTsdShipmentTask,
      completeTsdTransferReceiptTask,
      startTsdTask,
      quarantineTsdTask,
      issueCanisterByScan,
      returnCanisterByScan,
      globalSearch,
      activeDemoCanister,
    }),
    [
      hydrated,
      webUser,
      webScreen,
      webFilter,
      summary,
      operations,
      documents,
      auditLog,
      stock,
      canisters,
      pallets,
      boxes,
      expectedReceipts,
      pickTasks,
      batches,
      importCompleted,
      importValidation,
      activeDemoCanisterId,
      procurementRequests,
      consolidatedDemands,
      supplierOrders,
      tsdTasks,
      tsdShipments,
      warehouseTasks,
      createWarehouseTask,
      createTransferTaskPairFromRequest,
      updateWarehouseTask,
      cancelWarehouseTask,
      deleteWarehouseTask,
      sendWarehouseTaskToTsd,
      startWarehouseTaskOnTsd,
      ensureReceivingExpectedReceipt,
      ensureTransferTaskReady,
      ensureWarehouseTaskDemoReady,
      ensureDemoIssueReady,
      ensureDemoReturnReady,
      ensureReturnApprovalDemo,
      completeDemoWarehouseTask,
      resolveWarehouseDiscrepancy,
      login,
      logout,
      navigateWeb,
      workTabs,
      activeWorkTabId,
      activeWorkTab,
      canWorkTabGoBack,
      canWorkTabGoForward,
      openWorkTab,
      navigateActiveWorkTab,
      closeWorkTab,
      selectWorkTab,
      addModuleLandingTab,
      addWorkTab,
      workTabBack,
      workTabForward,
      selectWorkTabHistory,
      refreshActiveWorkTab,
      setActiveWorkTabDirty,
      renameActiveWorkTab,
      saveProcurementRequest,
      addRequestAttachment,
      addProcurementRequestComment,
      addConsolidatedDemandComment,
      addSupplierOrderComment,
      addConsolidatedDemandAttachment,
      addConsolidatedDemandOpFile,
      approveProcurementRequest,
      createConsolidatedDemand,
      approveConsolidatedDemand,
      createSupplierOrder,
      returnConsolidatedDemand,
      returnProcurementRequests,
      confirmOperation,
      rejectOperation,
      simulateUpakUploadFn,
      runImportValidationFn,
      transferExpectedReceiptToWarehouse,
      resolveScanCode,
      scanOnTsd,
      acceptPalletByScan,
      placePalletInCell,
      acceptBoxForPicking,
      createDemoPickTask,
      completeTsdReceiptTask,
      completeTsdOpReceipt,
      completeWarehouseTransferSend,
      completeWarehouseTransferReceive,
      completeTsdShipmentTask,
      completeTsdTransferReceiptTask,
      startTsdTask,
      quarantineTsdTask,
      issueCanisterByScan,
      returnCanisterByScan,
      globalSearch,
      activeDemoCanister,
    ],
  )

  if (!hydrated) {
    return <div className="h-dvh bg-[var(--app-page)]" />
  }

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider')
  return ctx
}
