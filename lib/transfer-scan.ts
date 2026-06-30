import {
  findCanisterByScan,
  resolveScan,
  type Box,
  type Canister,
  type Pallet,
  type TsdShipment,
} from '@wms/domain'

export function resolveCanisterIdsFromScanCodes(
  codes: string[],
  canisters: Canister[],
  pallets: Pallet[],
  boxes: Box[],
): Set<string> {
  const targetIds = new Set<string>()
  for (const code of codes) {
    const found = findCanisterByScan(canisters, code)
    if (found) targetIds.add(found.id)
    const resolution = resolveScan(code, pallets, boxes, canisters)
    if (resolution?.canister) targetIds.add(resolution.canister.id)
    if (resolution?.pallet) {
      canisters
        .filter((c) => c.palletSscc === resolution.pallet!.sscc)
        .forEach((c) => targetIds.add(c.id))
    }
  }
  return targetIds
}

export function mainWarehouseCanistersForSend(canisters: Canister[]): Canister[] {
  return canisters.filter((c) => c.warehouseId === 'wh-1' && c.status === 'in_storage_main')
}

export function canistersForTransferReceive(
  canisters: Canister[],
  shipment: TsdShipment | undefined,
  pallets: Pallet[],
  boxes: Box[],
): Canister[] {
  if (shipment?.shippedCanisterIds?.length) {
    const ids = new Set(shipment.shippedCanisterIds)
    return canisters.filter(
      (c) => ids.has(c.id) && (c.status === 'in_transit_child' || c.status === 'received_child'),
    )
  }
  if (shipment?.scannedCodes.length) {
    const ids = resolveCanisterIdsFromScanCodes(shipment.scannedCodes, canisters, pallets, boxes)
    return canisters.filter((c) => ids.has(c.id) && c.status === 'in_transit_child')
  }
  return canisters.filter((c) => c.status === 'in_transit_child')
}

export function canisterScanCode(canister: Canister): string {
  return canister.serialNumber ?? canister.sgtin ?? canister.id
}

export function isCanisterMarkedScanned(canister: Canister, scannedCodes: string[]): boolean {
  if (scannedCodes.includes(canisterScanCode(canister))) return true
  if (canister.serialNumber && scannedCodes.includes(canister.serialNumber)) return true
  if (canister.sgtin && scannedCodes.includes(canister.sgtin)) return true
  return false
}

/** Сколько уникальных канистр покрыто списком отсканированных кодов. */
export function countUniqueScannedCanisters(
  scannedCodes: string[],
  canisters: Canister[],
  pallets: Pallet[],
  boxes: Box[],
): number {
  return resolveCanisterIdsFromScanCodes(scannedCodes, canisters, pallets, boxes).size
}

/** Один код на канистру — без дублей serial/sgtin/палета. */
export function dedupeScanCodesToCanisters(
  scannedCodes: string[],
  canisters: Canister[],
  pallets: Pallet[],
  boxes: Box[],
): string[] {
  const ids = resolveCanisterIdsFromScanCodes(scannedCodes, canisters, pallets, boxes)
  return [...ids].map((id) => {
    const c = canisters.find((x) => x.id === id)
    return c ? canisterScanCode(c) : id
  })
}

export function estimateCanisterQtyFromRequestItems(
  items: { quantity: number; unit: string }[],
): number {
  return items.reduce((sum, i) => {
    if (i.unit === 'шт') return sum + i.quantity
    return sum + Math.max(1, Math.ceil(i.quantity / 10))
  }, 0)
}

export function senderTransferDone(status: string | undefined): boolean {
  return status === 'completed' || status === 'shipped_by_sender'
}
