export type ReportCategory = 'Остатки' | 'Движения' | 'Снабжение' | 'Склад' | 'Аудит' | 'Трекинг'

export interface ReportTemplate {
  id: string
  code: string
  title: string
  description: string
  category: ReportCategory
}

export const REPORT_CATEGORY_STYLES: Record<ReportCategory, { bg: string; text: string }> = {
  Остатки: { bg: '#e6f5ef', text: '#0d7a52' },
  Движения: { bg: '#e9eeff', text: '#2a48ff' },
  Снабжение: { bg: '#fdecea', text: '#c62828' },
  Склад: { bg: '#fef3c7', text: '#b45309' },
  Аудит: { bg: '#f1f5f9', text: '#475569' },
  Трекинг: { bg: '#ede9fe', text: '#6d28d9' },
}

export const REPORTS_CATALOG: ReportTemplate[] = [
  {
    id: 'r-stock',
    code: 'R01',
    title: 'Остатки по складам',
    description: 'Текущие остатки СЗР в разрезе складов и номенклатуры',
    category: 'Остатки',
  },
  {
    id: 'r-movements',
    code: 'R02',
    title: 'Движения товаров',
    description: 'Приход, расход, перемещения и передачи между складами',
    category: 'Движения',
  },
  {
    id: 'r-deficit',
    code: 'R03',
    title: 'Дефицит и потребность',
    description: 'Потребность к заказу, дефицит по заявкам и рекомендации',
    category: 'Снабжение',
  },
  {
    id: 'r-half-empty',
    code: 'R04',
    title: 'Полупустая тара',
    description: 'Канистры с остатком продукта после выдачи агроному',
    category: 'Склад',
  },
  {
    id: 'r-disposal',
    code: 'R05',
    title: 'Акты утилизации',
    description: 'Списание, передача на утиль и утилизированная тара',
    category: 'Склад',
  },
  {
    id: 'r-audit',
    code: 'R06',
    title: 'Аудит операций',
    description: 'Журнал действий пользователей и складских операций',
    category: 'Аудит',
  },
  {
    id: 'r-canister-history',
    code: 'R07',
    title: 'История канистры',
    description: 'Полный путь SGTIN от импорта Упак до утилизации',
    category: 'Трекинг',
  },
]

/** @deprecated use REPORTS_CATALOG */
export const REPORTS_MOCK = REPORTS_CATALOG

export const REPORT_TABLE_MOCK: { id: string; product: string; warehouse: string; qty: number; unit: string }[] = []

export interface GeneratedReportRow {
  id: string
  reportId: string
  status: 'ready' | 'processing' | 'error'
  createdAt: string
  format: 'PDF' | 'XLSX'
  userName: string
  fileName: string
  fileLabel: string
}

export const GENERATED_REPORTS_SEED: GeneratedReportRow[] = [
  {
    id: 'gen-1',
    reportId: 'r-stock',
    status: 'ready',
    createdAt: '2026-06-20T14:32:00.000Z',
    format: 'PDF',
    userName: 'Нурланов Е.Т.',
    fileName: 'ostatki-sklady-200626.pdf',
    fileLabel: 'Остатки по складам · 20.06.2026',
  },
  {
    id: 'gen-2',
    reportId: 'r-stock',
    status: 'ready',
    createdAt: '2026-06-18T09:15:00.000Z',
    format: 'XLSX',
    userName: 'Иванов А.С.',
    fileName: 'ostatki-sklady-180626.xlsx',
    fileLabel: 'Остатки по складам · 18.06.2026',
  },
  {
    id: 'gen-3',
    reportId: 'r-movements',
    status: 'ready',
    createdAt: '2026-06-19T11:00:00.000Z',
    format: 'PDF',
    userName: 'Иванов А.С.',
    fileName: 'dvizheniya-190626.pdf',
    fileLabel: 'Движения товаров · 19.06.2026',
  },
  {
    id: 'gen-4',
    reportId: 'r-audit',
    status: 'ready',
    createdAt: '2026-06-17T16:45:00.000Z',
    format: 'PDF',
    userName: 'Нурланов Е.Т.',
    fileName: 'audit-170626.pdf',
    fileLabel: 'Аудит операций · 17.06.2026',
  },
  {
    id: 'gen-5',
    reportId: 'r-canister-history',
    status: 'ready',
    createdAt: '2026-06-21T10:20:00.000Z',
    format: 'PDF',
    userName: 'Иванов А.С.',
    fileName: 'kanistra-341X1302R9S18.pdf',
    fileLabel: 'История канистры 341X1302R9S18',
  },
]
