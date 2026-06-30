import { PACKAGE_STATUS_LABELS, type Canister, type PackageStatus } from './package'
import { CANISTER_STATUS_CHAIN } from './package-service'

export const EMPTY_JOURNEY_HINT =
  'Снабжение → Заявки: создайте заявку по дефициту, затем сводную и загрузите Упак'

export const CANISTER_JOURNEY_STEPS: { status: PackageStatus; shortLabel: string; hint: string }[] = [
  {
    status: 'expected_receipt',
    shortLabel: 'Ожидание',
    hint: 'Сформируйте заявки по дефициту, сводную в отделе закупок и загрузите Упак',
  },
  {
    status: 'received_acceptance',
    shortLabel: 'Приёмка',
    hint: 'ТСД: Склады → Операции → Приёмка, отсканируйте SSCC палеты',
  },
  {
    status: 'in_storage_main',
    shortLabel: 'Хранение',
    hint: 'Разместите палету: Перемещение → сканируйте ячейку (A-01-03)',
  },
  {
    status: 'reserved',
    shortLabel: 'Резерв',
    hint: 'Создайте задание на отбор ОТБ-001 на главном складе',
  },
  {
    status: 'picking',
    shortLabel: 'Отбор',
    hint: 'ТСД: Перемещение → сканируйте коробки SSCC по заданию отбора',
  },
  {
    status: 'ready_to_ship',
    shortLabel: 'Отгрузка',
    hint: 'Переместите канистру на дочерний склад: ТСД → Перемещение',
  },
  {
    status: 'in_transit_child',
    shortLabel: 'В пути',
    hint: 'На дочернем складе: Приёмка → сканируйте палету или канистру',
  },
  {
    status: 'received_child',
    shortLabel: 'Приём ДС',
    hint: 'Подтвердите приёмку на дочернем складе',
  },
  {
    status: 'in_storage_child',
    shortLabel: 'Склад ДС',
    hint: 'ТСД: Операции → Выдача, отсканируйте SGTIN канистры',
  },
  {
    status: 'issued_agronomist',
    shortLabel: 'Агроном',
    hint: 'После применения препарата: ТСД → Возврат канистры',
  },
  {
    status: 'returned_empty',
    shortLabel: 'Возврат',
    hint: 'Укажите состояние тары (пустая / полная) и направьте к утилю',
  },
  {
    status: 'for_disposal_child',
    shortLabel: 'К утилю',
    hint: 'ТСД: Утиль → сканируйте канистру для передачи в зону',
  },
  {
    status: 'in_transit_disposal',
    shortLabel: 'Транзит',
    hint: 'Переместите канистру в зону утилизации на складе',
  },
  {
    status: 'in_disposal_zone',
    shortLabel: 'Утиль',
    hint: 'Подтвердите списание: ТСД → Списание',
  },
  {
    status: 'disposed',
    shortLabel: 'Готово',
    hint: 'Маршрут канистры завершён — все этапы пройдены',
  },
]

const JOURNEY_STATUS_ALIASES: Partial<Record<PackageStatus, PackageStatus>> = {
  not_created: 'expected_receipt',
  returned_half_empty: 'returned_empty',
  returned_full: 'returned_empty',
  empty_container: 'for_disposal_child',
  written_off: 'for_disposal_child',
}

function resolveChainStatus(status: PackageStatus): PackageStatus {
  if (CANISTER_STATUS_CHAIN.includes(status)) return status
  return JOURNEY_STATUS_ALIASES[status] ?? 'expected_receipt'
}

export interface CanisterJourneyInfo {
  currentStep: number
  totalSteps: number
  percent: number
  statusLabel: string
  stepShortLabel: string
  currentHint: string
  isComplete: boolean
  segments: { shortLabel: string; hint: string; state: 'done' | 'active' | 'pending' }[]
}

export function getCanisterJourneyInfo(status: PackageStatus): CanisterJourneyInfo {
  const chainStatus = resolveChainStatus(status)
  const idx = CANISTER_STATUS_CHAIN.indexOf(chainStatus)
  const totalSteps = CANISTER_STATUS_CHAIN.length
  const currentStep = idx < 0 ? 0 : idx + 1
  const percent = totalSteps === 0 ? 0 : Math.round((currentStep / totalSteps) * 100)

  const segments = CANISTER_JOURNEY_STEPS.map((step, i) => {
    let state: 'done' | 'active' | 'pending' = 'pending'
    if (status === 'disposed' || i < currentStep - 1) state = 'done'
    else if (i === currentStep - 1) state = 'active'
    return { shortLabel: step.shortLabel, hint: step.hint, state }
  })

  const currentHint =
    status === 'disposed'
      ? CANISTER_JOURNEY_STEPS[totalSteps - 1].hint
      : idx >= 0
        ? CANISTER_JOURNEY_STEPS[idx].hint
        : EMPTY_JOURNEY_HINT

  return {
    currentStep,
    totalSteps,
    percent,
    statusLabel: PACKAGE_STATUS_LABELS[status],
    stepShortLabel: idx >= 0 ? CANISTER_JOURNEY_STEPS[idx].shortLabel : '—',
    currentHint,
    isComplete: status === 'disposed',
    segments,
  }
}

export function getCanisterJourneyFromCanister(canister: Canister | undefined): CanisterJourneyInfo {
  if (!canister) return getEmptyJourneyInfo()
  return getCanisterJourneyInfo(canister.status)
}

export function getEmptyJourneyInfo(): CanisterJourneyInfo {
  const totalSteps = CANISTER_STATUS_CHAIN.length
  return {
    currentStep: 0,
    totalSteps,
    percent: 0,
    statusLabel: 'Ожидает загрузки Упак',
    stepShortLabel: '—',
    currentHint: EMPTY_JOURNEY_HINT,
    isComplete: false,
    segments: CANISTER_JOURNEY_STEPS.map((step) => ({
      shortLabel: step.shortLabel,
      hint: step.hint,
      state: 'pending' as const,
    })),
  }
}
