import type { StockBalance } from '@wms/domain'

export const WAREHOUSES_MOCK = [
  { id: 'wh-1', name: 'Главный склад', type: 'main' as const, items: 0, halfEmpty: 0, disposal: 0 },
  { id: 'wh-field-1', name: 'Дочерний склад №1', type: 'child' as const, items: 0, halfEmpty: 0, disposal: 0 },
  { id: 'wh-field-2', name: 'Дочерний склад №2', type: 'child' as const, items: 0, halfEmpty: 0, disposal: 0 },
]

export const DEMO_STOCK: StockBalance[] = [
  {
    warehouseId: 'wh-1',
    productName: 'Торнадо 540, ВР',
    unit: 'л',
    quantity: 4800,
    expiryDate: '2027-05-10',
    status: 'on_warehouse',
    batchNumber: 'B-2401',
  },
  {
    warehouseId: 'wh-1',
    productName: 'Продукт 1',
    unit: 'л',
    quantity: 2360,
    expiryDate: '2027-03-18',
    status: 'on_warehouse',
    batchNumber: 'B-2398',
  },
  {
    warehouseId: 'wh-1',
    productName: 'Продукт 2',
    unit: 'л',
    quantity: 1240,
    expiryDate: '2026-11-22',
    status: 'on_warehouse',
    batchNumber: 'B-2391',
  },
  {
    warehouseId: 'wh-1',
    productName: 'Продукт 3',
    unit: 'л',
    quantity: 860,
    expiryDate: '2027-08-04',
    status: 'on_warehouse',
    batchNumber: 'B-2405',
  },
  {
    warehouseId: 'wh-1',
    productName: 'Продукт 4',
    unit: 'л',
    quantity: 420,
    expiryDate: '2026-09-15',
    status: 'half_empty',
    batchNumber: 'B-2380',
  },
  {
    warehouseId: 'wh-1',
    productName: 'Продукт 5',
    unit: 'л',
    quantity: 310,
    expiryDate: '2027-01-30',
    status: 'on_warehouse',
    batchNumber: 'B-2395',
  },
  {
    warehouseId: 'wh-1',
    productName: 'Продукт 6',
    unit: 'кг',
    quantity: 2400,
    expiryDate: '2028-04-01',
    status: 'on_warehouse',
    batchNumber: 'S-1102',
  },
  {
    warehouseId: 'wh-field-1',
    productName: 'Торнадо 540, ВР',
    unit: 'л',
    quantity: 640,
    expiryDate: '2027-05-10',
    status: 'on_warehouse',
    batchNumber: 'B-2401',
  },
  {
    warehouseId: 'wh-field-1',
    productName: 'Продукт 2',
    unit: 'л',
    quantity: 280,
    expiryDate: '2026-11-22',
    status: 'on_warehouse',
    batchNumber: 'B-2391',
  },
  {
    warehouseId: 'wh-field-2',
    productName: 'Продукт 3',
    unit: 'л',
    quantity: 150,
    expiryDate: '2027-08-04',
    status: 'on_warehouse',
    batchNumber: 'B-2405',
  },
]

export const INITIAL_STOCK: StockBalance[] = DEMO_STOCK

export const WAREHOUSE_VIEW_TABS = ['balances', 'operations', 'inventory', 'receipt'] as const

export type WarehouseViewTab = (typeof WAREHOUSE_VIEW_TABS)[number]

export const WAREHOUSE_VIEW_TAB_LABELS: Record<WarehouseViewTab, string> = {
  balances: 'Остатки',
  operations: 'Операции',
  inventory: 'Инвентаризация',
  receipt: 'Приёмка',
}
