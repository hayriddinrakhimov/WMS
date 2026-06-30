import { getEnterpriseName } from '@wms/domain'
import { calcDeficit, getDeficitRows } from './mock-data'
import { REQUEST_CATALOG } from './request-catalog'

/** Склады, относящиеся к предприятию (демо-маппинг) */
const ENTERPRISE_WAREHOUSE_IDS: Record<string, string[]> = {
  'ent-hq': ['wh-1'],
  'ent-too-1': ['wh-1', 'wh-field-1'],
  'ent-too-2': ['wh-1', 'wh-field-2'],
  'ent-ast': ['wh-2', 'wh-field-1'],
  'ent-shy': ['wh-field-2'],
}

export interface DemandSuggestion {
  enterpriseId: string
  enterpriseName: string
  productCode: string
  productName: string
  unit: string
  demand: number
  stock: number
  inOrder: number
  suggestQty: number
  hasRealData: boolean
}

function productMatchesDeficit(productName: string, deficitProductName: string) {
  const a = productName.toLowerCase()
  const b = deficitProductName.toLowerCase()
  return a.includes(b.split(',')[0].trim()) || b.includes(a.split(',')[0].trim())
}

/** Расчёт рекомендуемого количества по спросу и остаткам предприятия */
export function getDemandSuggestion(
  enterpriseId: string,
  productCode: string,
): DemandSuggestion | null {
  const product = REQUEST_CATALOG.find((p) => p.code === productCode)
  if (!product) return null

  const warehouseIds = ENTERPRISE_WAREHOUSE_IDS[enterpriseId] ?? []
  const rows = getDeficitRows().filter(
    (r) =>
      warehouseIds.includes(r.warehouseId) &&
      productMatchesDeficit(product.name, r.productName),
  )

  if (rows.length > 0) {
    const demand = rows.reduce((s, r) => s + r.recommended, 0)
    const stock = rows.reduce((s, r) => s + r.current, 0)
    const inOrder = rows.reduce((s, r) => s + r.ordered, 0)
    const suggestQty = rows.reduce((s, r) => s + calcDeficit(r), 0)
    return {
      enterpriseId,
      enterpriseName: getEnterpriseName(enterpriseId),
      productCode: product.code,
      productName: product.name,
      unit: product.unit,
      demand,
      stock,
      inOrder,
      suggestQty: Math.max(suggestQty, 1),
      hasRealData: true,
    }
  }

  const seed = product.code.split('').reduce((n, c) => n + c.charCodeAt(0), 0)
  const demand = 80 + (seed % 120)
  const stock = 15 + (seed % 40)
  const inOrder = seed % 20
  const suggestQty = Math.max(1, demand - stock - inOrder)

  return {
    enterpriseId,
    enterpriseName: getEnterpriseName(enterpriseId),
    productCode: product.code,
    productName: product.name,
    unit: product.unit,
    demand,
    stock,
    inOrder,
    suggestQty,
    hasRealData: false,
  }
}
