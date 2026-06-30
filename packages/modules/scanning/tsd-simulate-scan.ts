import {
  DEMO_BOX_SSCC,
  DEMO_CANISTER_SN,
  DEMO_PALLET_SSCC,
  type Box,
  type Canister,
  type Pallet,
  type TsdTaskType,
} from '@wms/domain'

const RECEIVED_PALLET_STATUSES = new Set<Pallet['status']>([
  'received_acceptance',
  'in_storage_main',
])

export function nextPalletSscc(
  pallets: Pallet[],
  pool: Pallet[],
  scanned: string[],
): string | null {
  const list = pool.length ? pool : pallets
  const next = list.find(
    (p) => !scanned.includes(p.sscc) && !RECEIVED_PALLET_STATUSES.has(p.status),
  )
  if (next) return next.sscc
  if (!scanned.length) return DEMO_PALLET_SSCC
  return null
}

export function nextScanCodeForTask(
  taskType: TsdTaskType,
  pallets: Pallet[],
  boxes: Box[],
  scanned: string[],
): string | null {
  const pallet = pallets.find(
    (p) => !scanned.includes(p.sscc) && !RECEIVED_PALLET_STATUSES.has(p.status),
  )
  if (pallet) return pallet.sscc

  if (taskType === 'shipment_by_request') {
    const box = boxes.find((b) => !scanned.includes(b.sscc))
    if (box) return box.sscc
  }

  if (!scanned.length) {
    return taskType === 'shipment_by_request' ? DEMO_BOX_SSCC : DEMO_PALLET_SSCC
  }
  return null
}

export function nextCanisterCode(
  eligible: Canister[],
  processed: string[],
): string | null {
  const next = eligible.find(
    (c) =>
      !processed.includes(c.serialNumber) &&
      !(c.sgtin && processed.includes(c.sgtin)),
  )
  return next?.serialNumber ?? next?.sgtin ?? (!processed.length ? DEMO_CANISTER_SN : null)
}

export function formatScanLabel(code: string): string {
  if (code.length > 12) return `…${code.slice(-8)}`
  return code
}
