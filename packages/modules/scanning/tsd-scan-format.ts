import type { ScanResolution } from '@wms/domain'

const LEVEL_LABELS = {
  pallet: 'Палета',
  box: 'Коробка',
  canister: 'Канистра',
} as const

export function tsdScanLevelLabel(level: ScanResolution['level']): string {
  return LEVEL_LABELS[level]
}

export function formatTsdScanResult(resolution: ScanResolution): {
  title: string
  subtitle: string
  detail?: string
} {
  const type = LEVEL_LABELS[resolution.level]
  const product =
    resolution.canister?.productName ??
    resolution.box?.productName ??
    resolution.pallet?.productName ??
    ''

  if (resolution.level === 'pallet') {
    const boxes = resolution.pallet?.boxCount ?? 0
    const cans = resolution.canistersOnPallet.length
    return {
      title: type,
      subtitle: resolution.code,
      detail: product ? `${product} · ${boxes} кор · ${cans} шт` : `${boxes} кор · ${cans} шт`,
    }
  }

  if (resolution.level === 'box') {
    const cans = resolution.canistersInBox.length
    return {
      title: type,
      subtitle: resolution.code,
      detail: product ? `${product} · ${cans} шт` : `${cans} шт`,
    }
  }

  return {
    title: type,
    subtitle: resolution.canister?.serialNumber ?? resolution.code,
    detail: product || undefined,
  }
}
