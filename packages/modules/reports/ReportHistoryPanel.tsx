'use client'

import { useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeneratedReportRow, ReportTemplate } from './mock-data'

const PAGE_SIZE = 8

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReportHistoryPanel({
  template,
  rows,
  onGenerate,
  onDownload,
  extraFilters,
}: {
  template: ReportTemplate
  rows: GeneratedReportRow[]
  onGenerate: (format: 'PDF' | 'XLSX') => void
  onDownload: (row: GeneratedReportRow) => void
  extraFilters?: React.ReactNode
}) {
  const [dateFrom, setDateFrom] = useState('2026-06-01')
  const [dateTo, setDateTo] = useState('2026-06-22')
  const [grouping, setGrouping] = useState('warehouse')
  const [formatPdf, setFormatPdf] = useState(true)
  const [formatXlsx, setFormatXlsx] = useState(false)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => rows.filter((r) => r.reportId === template.id), [rows, template.id])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1
  const rangeEnd = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)

  const handleGenerate = () => {
    onGenerate(formatXlsx && !formatPdf ? 'XLSX' : 'PDF')
    setPage(0)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <header className="shrink-0 border-b border-[var(--app-border)] px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)] md:text-xl">
              {template.title}
              <span className="ml-2 text-base font-medium text-[var(--app-muted)]">{template.code}</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)]">{template.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--app-muted)]">
            Период с
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--app-muted)]">
            по
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--app-muted)]">
            Группировка
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value)}
              className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-sm"
            >
              <option value="warehouse">По складу</option>
              <option value="product">По товару</option>
              <option value="batch">По партии</option>
            </select>
          </label>

          {extraFilters}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--app-page)]"
            >
              <BarChart3 className="size-3.5" />
              Показать график
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={formatPdf}
                onChange={(e) => setFormatPdf(e.target.checked)}
                className="accent-[var(--app-accent)]"
              />
              PDF
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={formatXlsx}
                onChange={(e) => setFormatXlsx(e.target.checked)}
                className="accent-[var(--app-accent)]"
              />
              XLSX
            </label>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Сформировать
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4 md:px-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
          Сформированные отчёты
        </h2>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] py-16 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">Отчётов пока нет</p>
            <p className="mt-1 max-w-sm text-xs text-[var(--app-muted)]">
              Настройте параметры и нажмите «Сформировать» — запись появится в этом списке
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--app-border)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[#fafbfc] text-xs text-[var(--app-muted)]">
                  <th className="px-4 py-3 font-semibold">Статус</th>
                  <th className="px-4 py-3 font-semibold">Создан</th>
                  <th className="px-4 py-3 font-semibold">Формат</th>
                  <th className="px-4 py-3 font-semibold">Пользователь</th>
                  <th className="px-4 py-3 font-semibold">Файл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {pageRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#fafbfc]/80">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium',
                          row.status === 'ready' && 'text-[var(--dash-green)]',
                          row.status === 'processing' && 'text-[var(--dash-amber)]',
                          row.status === 'error' && 'text-[var(--dash-red)]',
                        )}
                      >
                        {row.status === 'ready' ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        {row.status === 'ready' ? 'Готово' : row.status === 'processing' ? 'Формируется' : 'Ошибка'}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--foreground)]">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[var(--app-page)] px-2 py-0.5 text-xs font-medium">
                        {row.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{row.userName}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onDownload(row)}
                        className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-[var(--app-accent)] hover:underline"
                      >
                        <Download className="size-3.5 shrink-0" />
                        <span className="truncate">{row.fileLabel}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--app-border)] px-5 py-3 text-xs text-[var(--app-muted)] md:px-6">
          <span>
            {rangeStart}–{rangeEnd} из {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex size-8 items-center justify-center rounded-lg border border-[var(--app-border)] disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="flex size-8 items-center justify-center rounded-lg border border-[var(--app-border)] disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
