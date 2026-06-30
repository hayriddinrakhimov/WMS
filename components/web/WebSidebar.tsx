'use client'

import { useState } from 'react'
import { ChevronLeft, LogOut } from 'lucide-react'
import { AppNavList } from '@/components/shared/AppNav'
import { cn } from '@/lib/utils'
import type { WebScreen } from '@/lib/web-nav'
import type { User } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/auth'

export const WEB_SIDEBAR_WIDTH = 248
export const WEB_SIDEBAR_COLLAPSED = 72

interface WebSidebarProps {
  activeScreen: WebScreen
  onNavigate: (screen: WebScreen) => void
  onNavigateSupply: () => void
  user: User
  onLogout: () => void
  compact?: boolean
}

export function WebSidebar({
  activeScreen,
  onNavigate,
  onNavigateSupply,
  user,
  onLogout,
  compact = false,
}: WebSidebarProps) {
  const [collapsedManual, setCollapsedManual] = useState(false)
  const collapsed = compact || collapsedManual

  return (
    <aside
      className={cn(
        'relative z-20 flex h-full shrink-0 flex-col border-r border-[var(--app-border)] bg-white transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[248px]',
      )}
    >
      <button
        type="button"
        onClick={() => !compact && setCollapsedManual(!collapsedManual)}
        disabled={compact}
        className={cn(
          'absolute -right-3 top-6 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--app-border)] bg-white text-[var(--muted-foreground)] shadow-sm',
          compact && 'cursor-default opacity-40',
        )}
        aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      >
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
      </button>

      <div className={cn('flex items-center gap-2.5 px-4 pt-5 pb-3', collapsed && 'justify-center px-2')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
          AA
        </span>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-[var(--foreground)]">Атамекен-Агро</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <AppNavList
          activeScreen={activeScreen}
          onNavigate={onNavigate}
          onNavigateSupply={onNavigateSupply}
          collapsed={collapsed}
          role={user.role}
        />
      </div>

      <div className={cn('mt-auto border-t border-[var(--app-border)] px-4 py-4', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-page)] text-xs font-bold text-[var(--primary)]">
            {user.name
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
        </div>

        <div className={cn('pt-3', collapsed ? 'flex justify-center' : '')}>
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'inline-flex items-center gap-1.5 text-[13px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]',
              collapsed && 'p-1',
            )}
            title="Выйти"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
