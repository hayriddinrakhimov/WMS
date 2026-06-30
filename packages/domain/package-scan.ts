import type { Canister, PackageStatus, ReturnCondition } from './package'
import { CANISTER_STATUS_CHAIN, appendHistory } from './package-service'
import type { TsdOperationScreen } from './types'

export interface ScanResult {
  ok: boolean
  event?: string
  error?: string
  canister?: Canister
}

const NEXT_ON_RECEIPT: Partial<Record<PackageStatus, PackageStatus>> = {
  expected_receipt: 'received_acceptance',
  received_acceptance: 'in_storage_main',
}

const TRANSFER_CHAIN: PackageStatus[] = [
  'in_storage_main',
  'reserved',
  'picking',
  'ready_to_ship',
  'in_transit_child',
  'received_child',
  'in_storage_child',
]

function nextInChain(current: PackageStatus, chain: PackageStatus[]) {
  const idx = chain.indexOf(current)
  if (idx < 0 || idx >= chain.length - 1) return null
  return chain[idx + 1]
}

export function advanceCanisterOnScan(
  canister: Canister,
  operation: TsdOperationScreen,
  options: {
    actorName: string
    returnCondition?: ReturnCondition
  },
): { canister: Canister; event: string } | { error: string } {
  const actor = options.actorName
  const now = new Date().toISOString()

  if (operation === 'receipt') {
    const next = NEXT_ON_RECEIPT[canister.status]
    if (!next) return { error: `Приемка невозможна для статуса «${canister.status}»` }
    const event =
      next === 'received_acceptance'
        ? 'Принята через скан палеты'
        : 'Размещена в ячейку A-01-03'
    const updated = appendHistory(canister, {
      at: now,
      event,
      status: next,
      actor,
      location: next === 'in_storage_main' ? 'A-01-03' : 'Главный склад',
    })
    return {
      canister: {
        ...updated,
        warehouseId: 'wh-1',
        warehouseName: 'Главный склад',
        cellId: next === 'in_storage_main' ? 'A-01-03' : updated.cellId,
      },
      event,
    }
  }

  if (operation === 'transfer') {
    const next = nextInChain(canister.status, TRANSFER_CHAIN)
    if (!next) {
      if (canister.status === 'in_storage_child') return { error: 'Перемещение уже завершено' }
      return { error: 'Сначала зарезервируйте канистру под заявку' }
    }
    const events: Partial<Record<PackageStatus, string>> = {
      reserved: 'Зарезервирована под заявку №req-035',
      picking: 'Отобрана через скан коробки',
      ready_to_ship: 'Подготовлена к выдаче',
      in_transit_child: 'Передана дочернему складу',
      received_child: 'Принята дочерним складом',
      in_storage_child: 'Размещена на дочернем складе',
    }
    const event = events[next] ?? 'Перемещение'
    const patch: Partial<Canister> = {}
    if (next === 'reserved') patch.reservedForRequestId = 'req-035'
    if (next === 'in_storage_child') {
      patch.warehouseId = 'wh-field-1'
      patch.warehouseName = 'Дочерний склад №1'
      patch.cellId = 'B-01-02'
    }
    const updated = appendHistory({ ...canister, ...patch }, {
      at: now,
      event,
      status: next,
      actor: next === 'reserved' ? 'Система' : actor,
      location: patch.cellId ?? canister.warehouseName ?? 'Склад',
      documentId: next === 'reserved' || next === 'in_transit_child' ? 'ОТБ-001' : undefined,
    })
    return { canister: updated, event }
  }

  if (operation === 'issue') {
    if (canister.status !== 'in_storage_child') {
      return { error: 'Выдача возможна только с дочернего склада' }
    }
    const updated = appendHistory(canister, {
      at: now,
      event: 'Выдана агроному',
      status: 'issued_agronomist',
      actor,
      location: 'Дочерний склад',
    })
    return { canister: updated, event: 'Выдана агроному' }
  }

  if (operation === 'return') {
    if (canister.status !== 'issued_agronomist') {
      return { error: 'Возврат возможен только после выдачи агроному' }
    }
    const cond = options.returnCondition ?? 'empty'
    const statusMap: Record<ReturnCondition, PackageStatus> = {
      empty: 'returned_empty',
      half_empty: 'returned_half_empty',
      full: 'returned_full',
      damaged: 'returned_empty',
      lost: 'returned_empty',
    }
    const status = statusMap[cond]
    const event =
      cond === 'half_empty'
        ? 'Возвращена полупустая'
        : cond === 'full'
          ? 'Возвращена полная'
          : 'Возвращена пустая'
    const updated = appendHistory(canister, {
      at: now,
      event,
      status,
      actor,
      location: 'Дочерний склад',
    })
    return {
      canister: {
        ...updated,
        returnCondition: cond,
        remainderLiters: cond === 'half_empty' ? 2.5 : cond === 'full' ? canister.volumeLiters : 0,
      },
      event,
    }
  }

  if (operation === 'disposal' || operation === 'writeoff') {
    const disposalChain: PackageStatus[] = [
      'returned_empty',
      'for_disposal_child',
      'in_transit_disposal',
      'in_disposal_zone',
      'disposed',
    ]
    const next = nextInChain(canister.status, disposalChain)
    if (!next) return { error: 'Утилизация недоступна для текущего статуса' }
    const events: Partial<Record<PackageStatus, string>> = {
      for_disposal_child: 'Передана на утиль',
      in_transit_disposal: 'В пути на утиль',
      in_disposal_zone: 'Принята в зону утиля',
      disposed: 'Утилизирована',
    }
    const updated = appendHistory(canister, {
      at: now,
      event: events[next] ?? 'Утилизация',
      status: next,
      actor,
      location: next === 'in_disposal_zone' || next === 'disposed' ? 'Зона утиля' : 'Дочерний склад',
    })
    return { canister: updated, event: events[next] ?? 'Утилизирована' }
  }

  if (operation === 'inventory') {
    return { canister, event: 'Инвентаризация: канистра подтверждена' }
  }

  return { error: 'Операция не поддерживается для канистры' }
}

export function getCanisterProgress(status: PackageStatus) {
  const idx = CANISTER_STATUS_CHAIN.indexOf(status)
  if (idx < 0) return 0
  return Math.round(((idx + 1) / CANISTER_STATUS_CHAIN.length) * 100)
}
