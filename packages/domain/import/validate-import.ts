import type { Canister } from '../package'
import type { Box, ImportValidation, ImportValidationCheck, Pallet } from '../packaging-hierarchy'
import { NOMENCLATURE_TORNADO } from '../reference-data'
import {
  TOTAL_BOXES,
  TOTAL_CANISTERS,
  TOTAL_PALLETS,
} from '../scenarios/august-upak-scenario'

export function validateImport(
  pallets: Pallet[],
  boxes: Box[],
  canisters: Canister[],
): ImportValidation {
  const checks: ImportValidationCheck[] = []
  const validatedAt = new Date().toISOString()

  const palletCount = pallets.length
  const boxCount = boxes.length
  const canisterCount = canisters.length

  checks.push({
    id: 'count-pallets',
    label: 'Количество палет',
    passed: palletCount === TOTAL_PALLETS,
    detail: `Палет: ${palletCount} (ожидается ${TOTAL_PALLETS})`,
  })

  checks.push({
    id: 'count-boxes',
    label: 'Количество коробок',
    passed: boxCount === TOTAL_BOXES,
    detail: `Коробок: ${boxCount} (ожидается ${TOTAL_BOXES})`,
  })

  checks.push({
    id: 'count-canisters',
    label: 'Количество канистр',
    passed: canisterCount === TOTAL_CANISTERS,
    detail: `Канистр: ${canisterCount} (ожидается ${TOTAL_CANISTERS})`,
  })

  const byBatch = new Map<string, number>()
  for (const c of canisters) {
    byBatch.set(c.batchNumber, (byBatch.get(c.batchNumber) ?? 0) + 1)
  }
  const batchDetail = [...byBatch.entries()].map(([b, n]) => `${b}: ${n}`).join(', ')
  checks.push({
    id: 'batches',
    label: 'Количество канистр по партиям',
    passed: byBatch.size >= 1,
    detail: batchDetail || 'Партии не найдены',
  })

  const gtinMismatch = canisters.filter((c) => c.gtin !== NOMENCLATURE_TORNADO.gtin)
  checks.push({
    id: 'gtin',
    label: 'Совпадение GTIN',
    passed: gtinMismatch.length === 0,
    detail:
      gtinMismatch.length === 0
        ? `GTIN: ${NOMENCLATURE_TORNADO.gtin}`
        : `Несовпадений: ${gtinMismatch.length}`,
  })

  let expiryMismatch = 0
  for (const pallet of pallets) {
    const palletBoxes = boxes.filter((b) => b.palletSscc === pallet.sscc)
    for (const box of palletBoxes) {
      const boxCans = canisters.filter((c) => c.boxSscc === box.sscc)
      for (const can of boxCans) {
        if (can.expiryDate !== pallet.expiryDate || can.expiryDate !== box.expiryDate) {
          expiryMismatch++
        }
      }
    }
  }
  checks.push({
    id: 'expiry',
    label: 'Совпадение сроков годности',
    passed: expiryMismatch === 0,
    detail: expiryMismatch === 0 ? 'Сроки годности: найдены' : `Несовпадений: ${expiryMismatch}`,
  })

  const dupPallets = findDuplicates(pallets.map((p) => p.sscc))
  checks.push({
    id: 'dup-pallets',
    label: 'Дубликаты палет',
    passed: dupPallets.length === 0,
    detail: dupPallets.length === 0 ? 'Дубликаты: не найдены' : dupPallets.join(', '),
  })

  const dupBoxes = findDuplicates(boxes.map((b) => b.sscc))
  checks.push({
    id: 'dup-boxes',
    label: 'Дубликаты коробок',
    passed: dupBoxes.length === 0,
    detail: dupBoxes.length === 0 ? 'Дубликаты: не найдены' : dupBoxes.join(', '),
  })

  const dupCanisters = findDuplicates(canisters.map((c) => c.sgtin))
  checks.push({
    id: 'dup-canisters',
    label: 'Дубликаты канистр',
    passed: dupCanisters.length === 0,
    detail: dupCanisters.length === 0 ? 'Дубликаты: не найдены' : dupCanisters.join(', '),
  })

  const boxesWithoutCanisters = boxes.filter((b) => b.canisterIds.length === 0)
  checks.push({
    id: 'boxes-empty',
    label: 'Коробки без канистр',
    passed: boxesWithoutCanisters.length === 0,
    detail:
      boxesWithoutCanisters.length === 0
        ? 'Все коробки содержат канистры'
        : `${boxesWithoutCanisters.length} коробок без канистр`,
  })

  const canistersWithoutBox = canisters.filter((c) => !c.boxSscc || !boxes.some((b) => b.sscc === c.boxSscc))
  checks.push({
    id: 'canisters-orphan',
    label: 'Канистры без коробок',
    passed: canistersWithoutBox.length === 0,
    detail:
      canistersWithoutBox.length === 0
        ? 'Все канистры привязаны к коробкам'
        : `${canistersWithoutBox.length} канистр без коробок`,
  })

  const passed = checks.every((c) => c.passed)

  return {
    passed,
    palletCount,
    boxCount,
    canisterCount,
    checks,
    validatedAt,
  }
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const dups = new Set<string>()
  for (const v of values) {
    const key = v.toUpperCase()
    if (seen.has(key)) dups.add(v)
    else seen.add(key)
  }
  return [...dups]
}
