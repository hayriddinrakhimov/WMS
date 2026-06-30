import { REQUEST_CATALOG } from './request-catalog'
import type { CatalogProduct } from './request-catalog'

export type OrderUnitId = 'pcs' | 'liters' | 'box' | 'pallet' | 'base'

export type UnitFieldId = 'box' | 'pcs' | 'base'

export const ORDER_UNIT_LABELS: Record<Exclude<OrderUnitId, 'base'>, string> = {
  pcs: 'шт',
  liters: 'л',
  box: 'кор',
  pallet: 'пал',
}

export const PACKAGING_UNIT_HINT =
  'Для упаковок: литры или кг раскладываются в коробки и штуки, а коробки и штуки дают сумму в литрах или кг. Упаковки между собой не конвертируются.'

export function displayUnitLabel(product: CatalogProduct, unit: OrderUnitId): string {
  if (unit === 'base') return isLiquidProduct(product) ? 'л' : 'кг'
  if (!isLiquidProduct(product) && unit === 'pcs') return 'меш'
  return ORDER_UNIT_LABELS[unit as Exclude<OrderUnitId, 'base'>]
}

export function getUnitFields(product: CatalogProduct): { id: UnitFieldId; label: string }[] {
  if (isLiquidProduct(product)) {
    return [
      { id: 'box', label: 'кор' },
      { id: 'pcs', label: 'шт' },
      { id: 'base', label: 'л' },
    ]
  }
  return [
    { id: 'box', label: 'кор' },
    { id: 'pcs', label: 'меш' },
    { id: 'base', label: 'кг' },
  ]
}

export function unitFieldToOrderUnit(field: UnitFieldId): OrderUnitId {
  if (field === 'base') return 'base'
  if (field === 'box') return 'box'
  return 'pcs'
}

export function unitBreakdownFromBase(product: CatalogProduct, baseQty: number) {
  return {
    box: baseQty > 0 ? fromBaseQuantity(product, baseQty, 'box') : 0,
    pcs: baseQty > 0 ? fromBaseQuantity(product, baseQty, 'pcs') : 0,
    base: baseQty > 0 ? roundQty(baseQty) : 0,
  }
}

export function baseFromUnitField(product: CatalogProduct, field: UnitFieldId, value: number): number {
  if (value <= 0) return 0
  if (field === 'base') return value
  if (field === 'box') return toBaseQuantity(product, value, 'box')
  return toBaseQuantity(product, value, 'pcs')
}

const DEFAULT_CANISTERS_PER_BOX = 2
const DEFAULT_BOXES_PER_PALLET = 30
const DEFAULT_CANISTERS_PER_PALLET = DEFAULT_CANISTERS_PER_BOX * DEFAULT_BOXES_PER_PALLET

export function isLiquidProduct(product: CatalogProduct): boolean {
  return product.unit === 'л'
}

export function availableUnits(product: CatalogProduct): OrderUnitId[] {
  if (isLiquidProduct(product)) return ['pcs', 'liters', 'box', 'pallet']
  return ['pcs', 'box', 'pallet']
}

export function defaultOrderUnit(product: CatalogProduct): OrderUnitId {
  return 'pcs'
}

function roundQty(value: number): number {
  const rounded = Math.round(value * 100) / 100
  if (rounded <= 0 && value > 0) return 0.01
  return rounded
}

export function toBaseQuantity(
  product: CatalogProduct,
  qty: number,
  unit: OrderUnitId,
): number {
  if (qty <= 0) return 0

  if (isLiquidProduct(product)) {
    const volume = product.volumeLiters ?? 10
    const perBox = product.canistersPerBox ?? DEFAULT_CANISTERS_PER_BOX
    const perPallet = product.canistersPerPallet ?? DEFAULT_CANISTERS_PER_PALLET
    switch (unit) {
      case 'pcs':
        return qty * volume
      case 'liters':
      case 'base':
        return qty
      case 'box':
        return qty * volume * perBox
      case 'pallet':
        return qty * volume * perPallet
    }
  }

  const bag = product.bagWeightKg ?? 25
  const bagsPerBox = product.bagsPerBox ?? 4
  const boxesPerPallet = product.boxesPerPallet ?? 20
  switch (unit) {
    case 'pcs':
      return qty * bag
    case 'base':
      return qty
    case 'box':
      return qty * bag * bagsPerBox
    case 'pallet':
      return qty * bag * bagsPerBox * boxesPerPallet
    default:
      return qty
  }
}

export function fromBaseQuantity(
  product: CatalogProduct,
  baseQty: number,
  unit: OrderUnitId,
): number {
  if (baseQty <= 0) return 0

  if (isLiquidProduct(product)) {
    const volume = product.volumeLiters ?? 10
    const perBox = product.canistersPerBox ?? DEFAULT_CANISTERS_PER_BOX
    const perPallet = product.canistersPerPallet ?? DEFAULT_CANISTERS_PER_PALLET
    switch (unit) {
      case 'pcs':
        return roundQty(baseQty / volume)
      case 'liters':
      case 'base':
        return roundQty(baseQty)
      case 'box':
        return roundQty(baseQty / (volume * perBox))
      case 'pallet':
        return roundQty(baseQty / (volume * perPallet))
    }
  }

  const bag = product.bagWeightKg ?? 25
  const bagsPerBox = product.bagsPerBox ?? 4
  const boxesPerPallet = product.boxesPerPallet ?? 20
  switch (unit) {
    case 'pcs':
      return roundQty(baseQty / bag)
    case 'base':
      return roundQty(baseQty)
    case 'box':
      return roundQty(baseQty / (bag * bagsPerBox))
    case 'pallet':
      return roundQty(baseQty / (bag * bagsPerBox * boxesPerPallet))
    default:
      return roundQty(baseQty)
  }
}

export function formatOrderVolume(product: CatalogProduct, baseQty: number): string {
  if (baseQty <= 0) return '—'
  const unit = isLiquidProduct(product) ? 'л' : 'кг'
  return `${baseQty.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${unit}`
}

export function formatVolumeBreakdown(product: CatalogProduct, baseQty: number): string | null {
  if (baseQty <= 0) return null

  if (isLiquidProduct(product)) {
    const volume = product.volumeLiters ?? 10
    const perBox = product.canistersPerBox ?? DEFAULT_CANISTERS_PER_BOX
    const perPallet = product.canistersPerPallet ?? DEFAULT_CANISTERS_PER_PALLET
    const cans = baseQty / volume
    const boxes = cans / perBox
    const pallets = boxes / (perPallet / perBox)
    const parts: string[] = []
    if (pallets >= 1) parts.push(`${roundQty(pallets)} пал`)
    if (boxes >= 1) parts.push(`${roundQty(boxes)} кор`)
    if (cans >= 1) parts.push(`${roundQty(cans)} шт`)
    return parts.length ? parts.join(' · ') : null
  }

  const bag = product.bagWeightKg ?? 25
  const bagsPerBox = product.bagsPerBox ?? 4
  const boxesPerPallet = product.boxesPerPallet ?? 20
  const bags = baseQty / bag
  const boxes = bags / bagsPerBox
  const pallets = boxes / boxesPerPallet
  const parts: string[] = []
  if (pallets >= 1) parts.push(`${roundQty(pallets)} пал`)
  if (boxes >= 1) parts.push(`${roundQty(boxes)} кор`)
  if (bags >= 1) parts.push(`${roundQty(bags)} меш`)
  return parts.length ? parts.join(' · ') : null
}

export interface RequestDraftLine {
  enabled: boolean
  orderQty: number
  orderUnit: OrderUnitId
}

export function createEmptyDraftLines(): Record<string, RequestDraftLine> {
  return Object.fromEntries(
    REQUEST_CATALOG.map((product) => [
      product.code,
      {
        enabled: false,
        orderQty: 0,
        orderUnit: defaultOrderUnit(product),
      },
    ]),
  )
}
