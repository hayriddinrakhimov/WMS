'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ModuleNavItem {
  id: string
  title: string
  description?: string
  code?: string
  badge?: { label: string; bg: string; text: string }
}

export function ModulePageLayout({
  sidebarTitle,
  items = [],
  activeId = '',
  onSelect = () => {},
  panelTitle,
  panelCode,
  panelDescription,
  headerActions,
  toolbar,
  showSubnav = false,
  fullBleedPanel = false,
  children,
  footer,
}: {
  sidebarTitle?: string
  items?: ModuleNavItem[]
  activeId?: string
  onSelect?: (id: string) => void
  panelTitle?: string
  panelCode?: string
  panelDescription?: string
  headerActions?: ReactNode
  /** Верхняя панель: селектор, поиск, кнопки (как в референсе складов) */
  toolbar?: ReactNode
  /** Вторая боковая навигация — только для отчётности */
  showSubnav?: boolean
  /** Правая панель сама рисует шапку (отчёты) */
  fullBleedPanel?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  const active = items.find((i) => i.id === activeId) ?? items[0]
  const title = panelTitle ?? active?.title
  const code = panelCode ?? active?.code
  const description = panelDescription ?? active?.description

  return (
    <div className={cn('flex h-full min-h-0 w-full flex-col', showSubnav && 'module-layout')}>
      {showSubnav ? (
        <div className="module-layout flex min-h-0 flex-1">
          <aside className="module-subnav flex h-full w-[min(100%,300px)] shrink-0 flex-col border-r border-[var(--app-border)] bg-[#fafbfc]">
            <div className="border-b border-[var(--app-border)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                {sidebarTitle}
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              <ul className="space-y-0.5 px-2">
                {items.map((item) => {
                  const isActive = item.id === activeId
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={cn(
                          'module-subnav__item w-full rounded-lg px-3 py-3 text-left transition-colors',
                          isActive && 'module-subnav__item--active',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {item.badge ? (
                            <span
                              className="module-subnav__badge shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ background: item.badge.bg, color: item.badge.text }}
                            >
                              {item.badge.label}
                            </span>
                          ) : (
                            <span />
                          )}
                          {item.code ? (
                            <span className="shrink-0 text-[10px] font-medium text-[var(--app-muted)]">
                              {item.code}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
                          {item.title}
                        </p>
                        {item.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--app-muted)]">
                            {item.description}
                          </p>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
            {!fullBleedPanel && toolbar ? (
              <header className="shrink-0 border-b border-[var(--app-border)] bg-white">{toolbar}</header>
            ) : null}
            {!fullBleedPanel && !toolbar ? (
              <header className="shrink-0 border-b border-[var(--app-border)] px-5 py-4 md:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-[var(--foreground)] md:text-xl">
                      {title}
                      {code ? (
                        <span className="ml-2 text-base font-medium text-[var(--app-muted)]">{code}</span>
                      ) : null}
                    </h1>
                    {description ? (
                      <p className="mt-1 text-sm text-[var(--app-muted)]">{description}</p>
                    ) : null}
                  </div>
                  {headerActions ? <div className="flex flex-wrap items-center gap-2">{headerActions}</div> : null}
                </div>
              </header>
            ) : null}
            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
            {footer}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
          {!fullBleedPanel && toolbar ? (
            <header className="shrink-0 border-b border-[var(--app-border)] bg-white">{toolbar}</header>
          ) : null}
          {!fullBleedPanel && !toolbar && (title || headerActions) ? (
            <header className="shrink-0 border-b border-[var(--app-border)] px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {title ? (
                  <div>
                    <h1 className="text-lg font-bold text-[var(--foreground)] md:text-xl">
                      {title}
                      {code ? (
                        <span className="ml-2 text-base font-medium text-[var(--app-muted)]">{code}</span>
                      ) : null}
                    </h1>
                    {description ? (
                      <p className="mt-1 text-sm text-[var(--app-muted)]">{description}</p>
                    ) : null}
                  </div>
                ) : (
                  <span />
                )}
                {headerActions ? <div className="flex flex-wrap items-center gap-2">{headerActions}</div> : null}
              </div>
            </header>
          ) : null}
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          {footer}
        </div>
      )}
    </div>
  )
}
