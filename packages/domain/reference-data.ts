import type { PackageStatus } from './package'

export interface Zone {
  id: string
  warehouseId: string
  name: string
  type: 'receipt' | 'storage' | 'issue' | 'return' | 'disposal'
}

export interface Cell {
  id: string
  warehouseId: string
  zoneId: string
  code: string
}

export interface Supplier {
  id: string
  name: string
}

export interface Nomenclature {
  id: string
  name: string
  gtin: string
  materialNumber: string
  packaging: string
  volumeLiters: number
}

export const SUPPLIER_AUGUST: Supplier = { id: 'sup-august', name: 'Август' }

export const PROCUREMENT_SUPPLIERS: Supplier[] = [
  SUPPLIER_AUGUST,
  { id: 'sup-syngenta', name: 'Сингента' },
  { id: 'sup-bayer', name: 'Байер' },
  { id: 'sup-adama', name: 'Адама' },
]

export const DELIVERY_TERMS_OPTIONS = [
  'DDP — склад покупателя',
  'Склад поставщика',
  'Самовывоз',
] as const

export const PAYMENT_TERMS_OPTIONS = [
  'Предоплата 100%',
  'Отсрочка 30 дней',
  'По факту поставки',
] as const

export const NOMENCLATURE_TORNADO: Nomenclature = {
  id: 'nom-tornado-540',
  name: 'Торнадо 540, ВР',
  gtin: '04670049990035',
  materialNumber: '40002912',
  packaging: 'Канистра 10 л',
  volumeLiters: 10,
}

export const ZONES: Zone[] = [
  { id: 'zone-wh1-receipt', warehouseId: 'wh-1', name: 'Зона приемки', type: 'receipt' },
  { id: 'zone-wh1-storage', warehouseId: 'wh-1', name: 'Основное хранение', type: 'storage' },
  { id: 'zone-wh1-issue', warehouseId: 'wh-1', name: 'Зона выдачи', type: 'issue' },
  { id: 'zone-wh1-return', warehouseId: 'wh-1', name: 'Зона возврата', type: 'return' },
  { id: 'zone-wh1-disposal', warehouseId: 'wh-1', name: 'Зона утиля', type: 'disposal' },
  { id: 'zone-whb-receipt', warehouseId: 'wh-field-1', name: 'Зона приемки', type: 'receipt' },
  { id: 'zone-whb-storage', warehouseId: 'wh-field-1', name: 'Основное хранение', type: 'storage' },
  { id: 'zone-whb-return', warehouseId: 'wh-field-1', name: 'Зона возврата', type: 'return' },
  { id: 'zone-whb-disposal', warehouseId: 'wh-field-1', name: 'Зона утиля', type: 'disposal' },
]

export const CELLS: Cell[] = [
  { id: 'cell-a-01-03', warehouseId: 'wh-1', zoneId: 'zone-wh1-storage', code: 'A-01-03' },
  { id: 'cell-b-01-02', warehouseId: 'wh-field-1', zoneId: 'zone-whb-storage', code: 'B-01-02' },
]

export const DISCREPANCY_REASONS = [
  'Недостача',
  'Излишек',
  'Повреждение упаковки',
  'Несоответствие партии',
  'Несоответствие срока годности',
] as const

export const EXPECTED_RECEIPT_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  validation_pending: 'Ожидает проверки',
  validation_failed: 'Ошибка проверки',
  ready_for_warehouse: 'Готово к передаче',
  awaiting_receipt: 'Ожидается приемка',
  in_progress: 'Приемка в процессе',
  completed: 'Завершена',
}

export const PACKAGE_STATUS_GROUPS: Partial<Record<PackageStatus, string>> = {
  expected_receipt: 'Ожидается к приемке',
  received_acceptance: 'Принято в зоне приемки',
  in_storage_main: 'На хранении',
}
