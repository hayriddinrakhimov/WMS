'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavItemsForRole } from '@/lib/web-nav'
import type { WebScreen } from '@/lib/web-nav'
import type { ModuleId, UserRole } from '@wms/domain'

export function AppNavIcon({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
        active ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)]',
      )}
    >
      {children}
    </span>
  )
}

export function AppNavItem({
  active,
  collapsed = false,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  collapsed?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg text-left text-sm transition-colors',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2.5',
        active
          ? 'bg-[var(--app-page)] font-medium text-[var(--foreground)]'
          : 'font-normal text-[var(--foreground)] hover:bg-[var(--app-page)]',
      )}
    >
      <AppNavIcon active={active}>
        <Icon className="h-[17px] w-[17px] stroke-[1.75]" />
      </AppNavIcon>
      {!collapsed && <span className="min-w-0 flex-1 truncate leading-snug">{label}</span>}
    </button>
  )
}

export function AppNavList({
  activeScreen,
  onNavigate,
  onNavigateSupply = () => {},
  collapsed = false,
  role,
}: {
  activeScreen: WebScreen
  onNavigate: (screen: ModuleId) => void
  onNavigateSupply?: () => void
  collapsed?: boolean
  role: UserRole
}) {
  const items = getNavItemsForRole(role)

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        if (item.id !== 'supply') {
          return (
            <AppNavItem
              key={item.id}
              active={activeScreen === item.id}
              collapsed={collapsed}
              icon={item.icon}
              label={item.title}
              onClick={() => onNavigate(item.id)}
            />
          )
        }

        return (
          <AppNavItem
            key={item.id}
            active={activeScreen === 'supply'}
            collapsed={collapsed}
            icon={item.icon}
            label={item.title}
            onClick={onNavigateSupply}
          />
        )
      })}
    </nav>
  )
}
