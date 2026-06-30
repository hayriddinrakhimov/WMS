import type { StockBalance } from '@wms/domain'
import { REQUEST_CATALOG, getCatalogProduct } from '../supply/request-catalog'
import { formatOrderVolume, formatVolumeBreakdown, isLiquidProduct } from '../supply/request-units'

export type StockHistoryEntry = {
  id: string
  at: string
  type: string
  delta: string
  deltaPositive: boolean
  comment?: string
}

export function productCodeForName(productName: string) {
  return REQUEST_CATALOG.find((p) => p.name === productName)?.code
}

export function stockCategory(productName: string) {
  const product = REQUEST_CATALOG.find((p) => p.name === productName)
  if (!product) return 'СЗР'
  return isLiquidProduct(product) ? 'СЗР' : 'Семена'
}

export function formatStockBalance(item: StockBalance) {
  const product = getCatalogProduct(productCodeForName(item.productName) ?? '')
  if (product) {
    const breakdown = formatVolumeBreakdown(product, item.quantity)
    const volume = formatOrderVolume(product, item.quantity)
    if (breakdown) return `≈${breakdown} (${volume})`
  }
  return `${item.quantity.toLocaleString('ru-RU')} ${item.unit}`
}

function hashSeed(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function stockDetailStats(item: StockBalance) {
  const seed = hashSeed(`${item.warehouseId}:${item.productName}`)
  const product = getCatalogProduct(productCodeForName(item.productName) ?? '')
  const dailyBase = product ? Math.max(12, (seed % 180) + 40) : 50
  const dailyLiters = product && isLiquidProduct(product) ? dailyBase * (product.volumeLiters ?? 10) : dailyBase * 25
  const daysLeft = item.quantity > 0 ? Math.round((item.quantity / dailyLiters) * 10) / 10 : 0
  const in7 = Math.round(dailyBase * 3.8)
  const out7 = Math.round(dailyBase * 5.1)
  const in30 = Math.round(dailyBase * 19.1)
  const out30 = Math.round(dailyBase * 29.3)
  const lastAt = new Date(Date.now() - (seed % 72) * 3_600_000).toISOString()

  return {
    daysLeft,
    in7,
    out7,
    in30,
    out30,
    dailyConsumption: product
      ? `${Math.round(dailyBase / (product.canistersPerBox ?? 2))} кор ${dailyBase % 30} шт (${formatOrderVolume(product, dailyLiters)})`
      : `${dailyBase} ${item.unit}`,
    lastMovement: new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(lastAt)),
  }
}

export function buildStockHistory(item: StockBalance, page: number, pageSize = 10): StockHistoryEntry[] {
  const seed = hashSeed(item.productName)
  const types = [
    { type: 'Приход', positive: true },
    { type: 'Прием перемещения', positive: true, comment: 'Перемещение №ПР-1042' },
    { type: 'Отправка перемещения', positive: false, comment: 'Перемещение №ПР-1038' },
    { type: 'Выдача', positive: false },
    { type: 'Приход', positive: true },
  ]
  const total = 28 + (seed % 12)
  const start = page * pageSize

  const rows: StockHistoryEntry[] = []
  for (let i = 0; i < pageSize; i += 1) {
    const index = start + i
    if (index >= total) break
    const kind = types[index % types.length]!
    const qty = 8 + ((seed + index * 17) % 120)
    const at = new Date(Date.now() - index * 86_400_000 - (seed % 40_000)).toISOString()
    const product = getCatalogProduct(productCodeForName(item.productName) ?? '')
    const delta = product ? `~${qty} кор` : `${qty} ${item.unit}`
    rows.push({
      id: `${item.productName}-${index}`,
      at: new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(at)),
      type: kind.type,
      delta: `${kind.positive ? '+' : '−'}${delta}`,
      deltaPositive: kind.positive,
      comment: kind.comment,
    })
  }
  return rows
}

export function stockHistoryTotal(item: StockBalance) {
  const seed = hashSeed(item.productName)
  return 28 + (seed % 12)
}

export function stockHistoryPageCount(item: StockBalance, pageSize = 10) {
  return Math.ceil(stockHistoryTotal(item) / pageSize)
}
