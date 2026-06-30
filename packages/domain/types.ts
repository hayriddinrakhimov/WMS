export type UserRole =
  | 'warehouse_manager'
  | 'agronomist'
  | 'management'
  | 'accountant'
  | 'admin'

/** @deprecated demo alias */
export type LegacyUserRole = 'storekeeper' | 'mol' | 'manager'

export type ModuleId = 'home' | 'supply' | 'scanning' | 'warehouses' | 'reports'

export type TsdOperationScreen = 'receipt' | 'issue' | 'return' | 'transfer' | 'inventory' | 'writeoff' | 'disposal'

export type WebScreen = ModuleId

export interface User {
  id: string
  otp: string
  name: string
  role: UserRole
  warehouseId?: string
  /** Предприятие снабженца — видит только свои заявки */
  enterpriseId?: string
}

export interface Warehouse {
  id: string
  name: string
  type: 'main' | 'child'
}

export type ModuleFilter = {
  tab?: string
  /** Вкладка модуля «Операции» склада (awaiting, discrepancy, …) */
  opsTab?: string
  /** landing — выбор раздела; list — список; detail/create — документ */
  view?: 'landing' | 'list' | 'detail' | 'create'
  requestId?: string
  receiptId?: string
  warehouseId?: string
  deficitOnly?: boolean
  reportId?: string
  canisterId?: string
  sgtin?: string
  taskId?: string
}

export interface ModuleRenderContext {
  user: User | null
  filter?: ModuleFilter
  onNavigate: (moduleId: ModuleId, filter?: ModuleFilter) => void
}
