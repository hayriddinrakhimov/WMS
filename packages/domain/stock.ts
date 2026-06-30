export interface StockBalance {
  warehouseId: string
  productName: string
  unit: string
  quantity: number
  batchNumber?: string
  expiryDate?: string
  status: 'on_warehouse' | 'issued' | 'half_empty' | 'disposal' | 'written_off'
  cost?: number
}

export interface StockMovement {
  id: string
  at: string
  operationId: string
  warehouseId: string
  productName: string
  quantity: number
  direction: 'in' | 'out'
}

export function calcHalfEmptyCost(capacity: number, remainder: number, unitCost: number) {
  if (capacity <= 0) return 0
  return Math.round((remainder / capacity) * unitCost * 100) / 100
}
