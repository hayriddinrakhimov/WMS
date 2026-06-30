import type { Canister } from '../package'
import { buildSgtin } from '../package'
import type { Box, Pallet, ProductBatch } from '../packaging-hierarchy'
import { NOMENCLATURE_TORNADO } from '../reference-data'
import { appendHistory } from '../package-service'

export const TOTAL_PALLETS = 22
export const TOTAL_BOXES = 660
export const TOTAL_CANISTERS = 1320
export const TOTAL_VOLUME_LITERS = 13200
export const BOXES_PER_PALLET = 30
export const CANISTERS_PER_BOX = 2
export const CANISTERS_PER_PALLET = BOXES_PER_PALLET * CANISTERS_PER_BOX

export const DEMO_PALLET_SSCC = '146700499966112311'
export const DEMO_BOX_SSCC = '146700499966111680'
export const DEMO_CANISTER_SN = '341X1302R9S18'
export const DEMO_CANISTER_ID = 'can-demo-341x1302'

export const BATCH_A = '3260002513'
export const BATCH_B = '3260002593'
export const BATCH_A_PRODUCTION = '15.03.2026'
export const BATCH_A_EXPIRY = '18.03.2031'
export const BATCH_B_PRODUCTION = '19.03.2026'
export const BATCH_B_EXPIRY = '22.03.2031'

const PRODUCT_NAME = 'Торнадо 540, ВР (540 г/л)'
const GTIN = NOMENCLATURE_TORNADO.gtin

function palletSscc(palletIndex: number): string {
  if (palletIndex === 0) return DEMO_PALLET_SSCC
  return `1467004999${String(66112000 + palletIndex).padStart(8, '0')}`
}

function boxSscc(palletIndex: number, boxIndex: number): string {
  if (palletIndex === 0 && boxIndex === 0) return DEMO_BOX_SSCC
  const n = palletIndex * BOXES_PER_PALLET + boxIndex + 1
  return `1467004999${String(66110000 + n).padStart(8, '0')}`
}

function canisterSerial(palletIndex: number, boxIndex: number, canIndex: number): string {
  if (palletIndex === 0 && boxIndex === 0 && canIndex === 0) return DEMO_CANISTER_SN
  const n = palletIndex * CANISTERS_PER_PALLET + boxIndex * CANISTERS_PER_BOX + canIndex + 1
  const prefix = String(340 + (n % 10))
  const mid = String(1300 + (n % 900)).padStart(4, '0')
  const suffix = String(10 + (n % 80)).padStart(2, '0')
  return `${prefix}X${mid}R9S${suffix}`
}

function batchForPallet(palletIndex: number) {
  return palletIndex % 2 === 0
    ? { batch: BATCH_A, production: BATCH_A_PRODUCTION, expiry: BATCH_A_EXPIRY }
    : { batch: BATCH_B, production: BATCH_B_PRODUCTION, expiry: BATCH_B_EXPIRY }
}

export interface UpakHierarchy {
  pallets: Pallet[]
  boxes: Box[]
  canisters: Canister[]
  batches: ProductBatch[]
}

export function buildUpakHierarchy(importedAt: string): UpakHierarchy {
  const pallets: Pallet[] = []
  const boxes: Box[] = []
  const canisters: Canister[] = []
  const batchCounts = new Map<string, { production: string; expiry: string; count: number }>()

  for (let p = 0; p < TOTAL_PALLETS; p++) {
    const pSscc = palletSscc(p)
    const { batch, production, expiry } = batchForPallet(p)
    const boxSsccs: string[] = []

    for (let b = 0; b < BOXES_PER_PALLET; b++) {
      const bSscc = boxSscc(p, b)
      boxSsccs.push(bSscc)
      const canisterIds: string[] = []

      for (let c = 0; c < CANISTERS_PER_BOX; c++) {
        const sn = canisterSerial(p, b, c)
        const id = p === 0 && b === 0 && c === 0 ? DEMO_CANISTER_ID : `can-${p}-${b}-${c}`
        canisterIds.push(id)
        const sgtin = buildSgtin(GTIN, sn)
        const canister = appendHistory(
          {
            id,
            productName: PRODUCT_NAME,
            gtin: GTIN,
            serialNumber: sn,
            sgtin,
            batchNumber: batch,
            productionDate: production,
            expiryDate: expiry,
            volumeLiters: 10,
            boxSscc: bSscc,
            palletSscc: pSscc,
            source: 'import',
            status: 'expected_receipt',
            history: [],
          },
          {
            at: importedAt,
            event: 'Загружена из файла Упак',
            status: 'expected_receipt',
            actor: 'Система',
            location: 'Ожидаемая приемка',
            documentId: 'ОП-001',
          },
        )
        canisters.push(canister)

        const existing = batchCounts.get(batch)
        if (existing) existing.count += 1
        else batchCounts.set(batch, { production, expiry, count: 1 })
      }

      boxes.push({
        sscc: bSscc,
        palletSscc: pSscc,
        canisterIds,
        status: 'expected_receipt',
        productName: PRODUCT_NAME,
        batchNumber: batch,
        expiryDate: expiry,
        expectedReceiptId: 'er-001',
      })
    }

    pallets.push({
      sscc: pSscc,
      status: 'expected_receipt',
      boxSsccs,
      productName: PRODUCT_NAME,
      batchNumber: batch,
      expiryDate: expiry,
      boxCount: BOXES_PER_PALLET,
      canisterCount: CANISTERS_PER_PALLET,
      expectedReceiptId: 'er-001',
    })
  }

  const batches: ProductBatch[] = [...batchCounts.entries()].map(([batchNumber, info]) => ({
    batchNumber,
    gtin: GTIN,
    productionDate: info.production,
    expiryDate: info.expiry,
    canisterCount: info.count,
    volumeLiters: info.count * 10,
  }))

  return { pallets, boxes, canisters, batches }
}

export function findDemoCanister(canisters: Canister[]): Canister | undefined {
  return canisters.find((c) => c.id === DEMO_CANISTER_ID || c.serialNumber === DEMO_CANISTER_SN)
}
