import type { Canister } from './package'
import type { Box, Pallet } from './packaging-hierarchy'
import { findCanisterByScan } from './package-service'

export type ScanLevel = 'pallet' | 'box' | 'canister'

export interface ScanResolution {
  level: ScanLevel
  code: string
  pallet?: Pallet
  box?: Box
  canister?: Canister
  canistersInBox: Canister[]
  canistersOnPallet: Canister[]
}

export function resolveScan(
  code: string,
  pallets: Pallet[],
  boxes: Box[],
  canisters: Canister[],
): ScanResolution | null {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const pallet = pallets.find((p) => p.sscc.toUpperCase() === normalized)
  if (pallet) {
    const canistersOnPallet = canisters.filter((c) => c.palletSscc === pallet.sscc)
    return {
      level: 'pallet',
      code: normalized,
      pallet,
      canistersInBox: [],
      canistersOnPallet,
    }
  }

  const box = boxes.find((b) => b.sscc.toUpperCase() === normalized)
  if (box) {
    const canistersInBox = canisters.filter((c) => c.boxSscc === box.sscc)
    const palletForBox = pallets.find((p) => p.sscc === box.palletSscc)
    return {
      level: 'box',
      code: normalized,
      box,
      pallet: palletForBox,
      canistersInBox,
      canistersOnPallet: canisters.filter((c) => c.palletSscc === box.palletSscc),
    }
  }

  const canister = findCanisterByScan(canisters, code)
  if (canister) {
    const boxForCan = boxes.find((b) => b.sscc === canister.boxSscc)
    const palletForCan = pallets.find((p) => p.sscc === canister.palletSscc)
    return {
      level: 'canister',
      code: normalized,
      canister,
      box: boxForCan,
      pallet: palletForCan,
      canistersInBox: canisters.filter((c) => c.boxSscc === canister.boxSscc),
      canistersOnPallet: canisters.filter((c) => c.palletSscc === canister.palletSscc),
    }
  }

  return null
}
