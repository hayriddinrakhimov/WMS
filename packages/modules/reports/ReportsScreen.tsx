'use client'

import { useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { CanisterCard, CanisterTimeline } from '@wms/ui'
import { DEMO_CANISTER_SN, findCanisterByScan } from '@wms/domain'
import {
  GENERATED_REPORTS_SEED,
  REPORTS_CATALOG,
  REPORT_CATEGORY_STYLES,
  type GeneratedReportRow,
} from './mock-data'
import { ReportHistoryPanel } from './ReportHistoryPanel'
import { ModulePageLayout, type ModuleNavItem } from '../shared/ModulePageLayout'
import type { ModuleRenderContext } from '@wms/domain'

const REPORTS_NAV: ModuleNavItem[] = REPORTS_CATALOG.map((r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  code: r.code,
  badge: {
    label: r.category,
    bg: REPORT_CATEGORY_STYLES[r.category].bg,
    text: REPORT_CATEGORY_STYLES[r.category].text,
  },
}))

export function ReportsScreen({ filter, user, onNavigate }: ModuleRenderContext) {
  const { canisters } = useDemoStore()
  const [reportId, setReportId] = useState(filter?.reportId ?? 'r-stock')
  const [generated, setGenerated] = useState<GeneratedReportRow[]>(GENERATED_REPORTS_SEED)
  const [historyCode, setHistoryCode] = useState(filter?.sgtin ?? DEMO_CANISTER_SN)

  const template = useMemo(
    () => REPORTS_CATALOG.find((r) => r.id === reportId) ?? REPORTS_CATALOG[0],
    [reportId],
  )

  const historyCanister = useMemo(() => {
    if (template.id !== 'r-canister-history' || !historyCode.trim()) return undefined
    return findCanisterByScan(canisters, historyCode)
  }, [canisters, historyCode, template.id])

  const downloadRow = (row: GeneratedReportRow) => {
    const blob = new Blob([`Отчёт: ${row.fileLabel}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerate = (format: 'PDF' | 'XLSX') => {
    const now = new Date().toISOString()
    const stamp = new Date().toLocaleDateString('ru-RU').replace(/\./g, '')
    const ext = format === 'PDF' ? 'pdf' : 'xlsx'
    const slug = template.id.replace('r-', '')
    setGenerated((prev) => [
      {
        id: `gen-${Date.now()}`,
        reportId: template.id,
        status: 'ready',
        createdAt: now,
        format,
        userName: user?.name ?? 'Система',
        fileName: `${slug}-${stamp}.${ext}`,
        fileLabel: `${template.title} · ${new Date().toLocaleDateString('ru-RU')}`,
      },
      ...prev,
    ])
  }

  const canisterExtraFilters =
    template.id === 'r-canister-history' ? (
      <label className="flex min-w-[200px] flex-col gap-1 text-xs text-[var(--app-muted)]">
        SGTIN / серийный номер
        <input
          value={historyCode}
          onChange={(e) => setHistoryCode(e.target.value)}
          placeholder="341X1302R9S18"
          className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 font-mono text-sm"
        />
      </label>
    ) : null

  const footer =
    template.id === 'r-canister-history' ? (
      <section className="shrink-0 border-t border-[var(--app-border)] bg-[#fafbfc] px-5 py-4 md:px-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
          Предпросмотр канистры
        </h3>
        {historyCanister ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <CanisterCard canister={historyCanister} />
            <div className="max-h-48 overflow-auto rounded-xl border border-[var(--app-border)] bg-white p-3">
              <CanisterTimeline events={historyCanister.history} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--app-muted)]">
            {canisters.length === 0
              ? 'Загрузите Упак.xlsx в модуле «Снабжение»'
              : 'Введите SGTIN или серийный номер канистры'}
          </p>
        )}
      </section>
    ) : undefined

  return (
    <ModulePageLayout
      sidebarTitle="Отчёты"
      items={REPORTS_NAV}
      activeId={reportId}
      onSelect={(id) => {
        setReportId(id)
        onNavigate('reports', { reportId: id, view: 'list' })
      }}
      showSubnav
      fullBleedPanel
      footer={footer}
    >
      <ReportHistoryPanel
        template={template}
        rows={generated}
        onGenerate={handleGenerate}
        onDownload={downloadRow}
        extraFilters={canisterExtraFilters}
      />
    </ModulePageLayout>
  )
}
