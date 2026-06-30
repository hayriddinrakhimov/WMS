export type PackageStatus =
  | 'not_created'
  | 'expected_receipt'
  | 'received_acceptance'
  | 'in_storage_main'
  | 'reserved'
  | 'picking'
  | 'ready_to_ship'
  | 'in_transit_child'
  | 'received_child'
  | 'in_storage_child'
  | 'issued_agronomist'
  | 'returned_empty'
  | 'returned_half_empty'
  | 'returned_full'
  | 'empty_container'
  | 'written_off'
  | 'for_disposal_child'
  | 'in_transit_disposal'
  | 'in_disposal_zone'
  | 'disposed'

export type ReturnCondition = 'empty' | 'half_empty' | 'full' | 'damaged' | 'lost'

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  not_created: 'Не создана в системе',
  expected_receipt: 'Ожидается к приемке',
  received_acceptance: 'Принято в зоне приемки',
  in_storage_main: 'На хранении',
  reserved: 'Зарезервировано',
  picking: 'В отборе',
  ready_to_ship: 'К выдаче',
  in_transit_child: 'В пути',
  received_child: 'Принято дочерним складом',
  in_storage_child: 'На хранении дочернего склада',
  issued_agronomist: 'Выдано агроному',
  returned_empty: 'Возвращено пустое',
  returned_half_empty: 'Возвращено полупустое',
  returned_full: 'Возвращено полное',
  empty_container: 'Пустая тара',
  written_off: 'Списано',
  for_disposal_child: 'К утилю',
  in_transit_disposal: 'В пути на утиль',
  in_disposal_zone: 'В зоне утиля',
  disposed: 'Утилизировано',
}

export interface PackageHistoryEvent {
  id: string
  at: string
  event: string
  status: PackageStatus
  actor: string
  location: string
  documentId?: string
}

export type CanisterSource = 'import' | 'scenario'

export interface Canister {
  id: string
  productName: string
  gtin: string
  serialNumber: string
  sgtin: string
  batchNumber: string
  productionDate: string
  expiryDate: string
  volumeLiters: number
  boxSscc: string
  palletSscc: string
  source: CanisterSource
  status: PackageStatus
  warehouseId?: string
  warehouseName?: string
  cellId?: string
  reservedForRequestId?: string
  remainderLiters?: number
  returnCondition?: ReturnCondition
  issuedTo?: string
  issueActNumber?: string
  history: PackageHistoryEvent[]
}

export function buildSgtin(gtin: string, serialNumber: string) {
  return `${gtin}${serialNumber}`
}
