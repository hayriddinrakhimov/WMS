import type { Canister, PackageHistoryEvent, PackageStatus } from './package'

export function appendHistory(
  canister: Canister,
  partial: Omit<PackageHistoryEvent, 'id'> & { id?: string },
): Canister {
  const event: PackageHistoryEvent = {
    id: partial.id ?? `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...partial,
  }
  return {
    ...canister,
    status: event.status,
    history: [...canister.history, event],
  }
}

export function updateCanister(
  canister: Canister,
  patch: Partial<Canister>,
  history?: Omit<PackageHistoryEvent, 'id' | 'status'> & { status?: PackageStatus },
): Canister {
  const next = { ...canister, ...patch }
  if (!history) return next
  return appendHistory(next, {
    at: history.at ?? new Date().toISOString(),
    event: history.event,
    status: history.status ?? next.status,
    actor: history.actor,
    location: history.location,
    documentId: history.documentId,
  })
}

export function findCanisterByScan(canisters: Canister[], code: string): Canister | undefined {
  const normalized = code.trim().toUpperCase()
  return canisters.find(
    (c) =>
      c.sgtin.toUpperCase() === normalized ||
      c.serialNumber.toUpperCase() === normalized ||
      c.boxSscc.toUpperCase() === normalized ||
      c.palletSscc.toUpperCase() === normalized,
  )
}

export const CANISTER_STATUS_CHAIN: PackageStatus[] = [
  'expected_receipt',
  'received_acceptance',
  'in_storage_main',
  'reserved',
  'picking',
  'ready_to_ship',
  'in_transit_child',
  'received_child',
  'in_storage_child',
  'issued_agronomist',
  'returned_empty',
  'for_disposal_child',
  'in_transit_disposal',
  'in_disposal_zone',
  'disposed',
]
