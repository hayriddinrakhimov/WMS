export interface DeficitRow {
  id: string
  productName: string
  unit: string
  current: number
  ordered: number
  recommended: number
  warehouseId: string
  warehouseName: string
}

export const DEFICIT_MOCK: DeficitRow[] = [
  {
    id: 'd-wh1-tornado',
    productName: 'Торнадо 540, ВР',
    unit: 'л',
    current: 120,
    ordered: 0,
    recommended: 470,
    warehouseId: 'wh-1',
    warehouseName: 'Главный склад',
  },
  {
    id: 'd-wh2-tornado',
    productName: 'Торнадо 540, ВР',
    unit: 'л',
    current: 40,
    ordered: 0,
    recommended: 200,
    warehouseId: 'wh-2',
    warehouseName: 'Склад Астана (ДС)',
  },
  {
    id: 'd-wh1-herb',
    productName: 'Продукт 1',
    unit: 'л',
    current: 80,
    ordered: 50,
    recommended: 180,
    warehouseId: 'wh-1',
    warehouseName: 'Главный склад',
  },
]

export function calcDeficit(row: DeficitRow) {
  return Math.max(0, row.recommended - row.current - row.ordered)
}

export function getDeficitRows(deficitOnly = false) {
  return DEFICIT_MOCK.map((r) => ({ ...r, deficit: calcDeficit(r) })).filter(
    (r) => !deficitOnly || r.deficit > 0,
  )
}

/** @deprecated используйте DEFICIT_MOCK */
export function getTornadoDeficitRow(): DeficitRow {
  return DEFICIT_MOCK[0]
}
