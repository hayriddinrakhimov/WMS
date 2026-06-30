'use client'

import { useDemoStore } from '@/lib/demo-store'
import { WebSidebar } from '@/components/web/WebSidebar'
import { WebMainContent } from '@/components/web/WebMainContent'
import { TsdShellProvider } from '@/components/web/TsdShellContext'
import { moduleLandingTitle } from '@/lib/work-tabs'
import type { User } from '@/lib/types'
import type { WebScreen } from '@/lib/web-nav'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const COMPACT_BREAKPOINT = 720

interface WebCabinetProps {
  user: User
  onLogout: () => void
}

export function WebCabinet({ user, onLogout }: WebCabinetProps) {
  const { webScreen, navigateActiveWorkTab } = useDemoStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isScanning = webScreen === 'scanning'

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < COMPACT_BREAKPOINT)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isScanning) setMenuOpen(false)
  }, [isScanning])

  const handleNavigate = (moduleId: WebScreen) => {
    navigateActiveWorkTab({ moduleId, filter: { view: 'landing' } }, moduleLandingTitle(moduleId))
    setMenuOpen(false)
  }

  if (isScanning) {
    return (
      <div
        ref={rootRef}
        className="flex h-full min-h-0 w-full min-w-0 items-stretch justify-center overflow-hidden bg-[var(--app-page)]"
      >
        <div
          className={cn(
            'tsd-frame relative flex h-full w-full max-w-[430px] flex-col overflow-hidden border-x border-[var(--app-border)] shadow-xl',
          )}
        >
          {menuOpen ? (
            <button
              type="button"
              className="tsd-drawer-backdrop"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}
          <aside className={cn('tsd-drawer tsd-drawer--wide', menuOpen && 'tsd-drawer--open')} aria-hidden={!menuOpen}>
            <WebSidebar
              activeScreen={webScreen}
              onNavigate={handleNavigate}
              onNavigateSupply={() => {
                navigateActiveWorkTab(
                  { moduleId: 'supply', filter: { tab: 'demand', view: 'list' } },
                  'Снабжение',
                )
                setMenuOpen(false)
              }}
              user={user}
              onLogout={onLogout}
            />
          </aside>
          <TsdShellProvider onOpenMenu={() => setMenuOpen(true)}>
            <WebMainContent compact scanningMode />
          </TsdShellProvider>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-[var(--app-page)]">
      <WebSidebar
        activeScreen={webScreen}
        onNavigate={(moduleId) =>
          navigateActiveWorkTab(
            { moduleId, filter: { view: 'landing' } },
            moduleLandingTitle(moduleId),
          )
        }
        onNavigateSupply={() =>
          navigateActiveWorkTab(
            { moduleId: 'supply', filter: { tab: 'demand', view: 'list' } },
            'Снабжение',
          )
        }
        user={user}
        onLogout={onLogout}
        compact={compact}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <WebMainContent compact={compact} />
      </main>
    </div>
  )
}
