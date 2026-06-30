import type { Canister, StockBalance } from '@wms/domain'

const ON_WAREHOUSE_STATUSES = new Set<Canister['status']>([
  'received_acceptance',
  'in_storage_main',
  'in_storage_child',
  'received_child',
  'empty_container',
  'returned_empty',
  'returned_half_empty',
  'returned_full',
  'reserved',
  'picking',
  'ready_to_ship',
])

const WAREHOUSE_NAMES: Record<string, string> = {
  'wh-1': 'Главный склад',
  'wh-field-1': 'Дочерний склад №1',
  'wh-field-2': 'Дочерний склад №2',
}

/** Demo stock rows: one line per warehouse with canister count. */
export function stockBalancesFromCanisters(canisters: Canister[]): StockBalance[] {
  const counts = new Map<string, number>()

  for (const c of canisters) {
    if (!ON_WAREHOUSE_STATUSES.has(c.status)) continue
    const wh = c.warehouseId ?? 'wh-1'
    counts.set(wh, (counts.get(wh) ?? 0) + 1)
  }

  return [...counts.entries()].map(([warehouseId, quantity]) => ({
    warehouseId,
    productName: 'СЗР (канистры)',
    unit: 'шт',
    quantity,
    expiryDate: '—',
    status: 'on_warehouse' as const,
    batchNumber: '—',
  }))
}

export function warehouseCanisterCounts(canisters: Canister[]): Record<string, number> {
  const rows = stockBalancesFromCanisters(canisters)
  const out: Record<string, number> = {
    'wh-1': 0,
    'wh-field-1': 0,
    'wh-field-2': 0,
  }
  for (const row of rows) {
    out[row.warehouseId] = row.quantity
  }
  return out
}

export function warehouseDisplayName(id: string): string {
  return WAREHOUSE_NAMES[id] ?? id
}
