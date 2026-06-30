'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ModuleToolbar({  left,
  center,
  right,
  subRow,
  className,
}: {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  subRow?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('module-toolbar', className)}>
      <div className="module-toolbar__row">
        {left ? <div className="module-toolbar__left">{left}</div> : null}
        {center ? <div className="module-toolbar__center">{center}</div> : null}
        {right ? <div className="module-toolbar__right">{right}</div> : null}
      </div>
      {subRow ? <div className="module-toolbar__sub">{subRow}</div> : null}
    </div>
  )
}

export function ModuleToolbarSearch({
  value,
  onChange,
  placeholder = 'Поиск',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="module-toolbar__search"
    />
  )
}

export function ModuleToolbarButton({
  children,
  onClick,
  variant = 'secondary',
  icon,
  badge,
  className,
  ariaLabel,
  disabled,
}: {
  children?: ReactNode
  onClick?: () => void
  variant?: 'secondary' | 'primary' | 'ghost'
  icon?: ReactNode
  badge?: number
  className?: string
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'module-toolbar__btn',
        variant === 'primary' && 'module-toolbar__btn--primary',
        variant === 'ghost' && 'module-toolbar__btn--ghost',
        disabled && 'opacity-50',
        className,
      )}
    >
      {icon ? <span className="module-toolbar__btn-icon">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
      {badge != null && badge > 0 ? (
        <span className="module-toolbar__badge">{badge}</span>
      ) : null}
    </button>
  )
}

export function ModuleToolbarChips({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string }[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="module-toolbar__chips">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn('module-toolbar__chip', item.id === activeId && 'module-toolbar__chip--active')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function ModuleToolbarIconNav({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string; icon: ReactNode }[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className="module-toolbar__icon-nav" aria-label="Разделы снабжения">
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(item.id)}
            className={cn(
              'module-toolbar__icon-nav-btn',
              isActive && 'module-toolbar__icon-nav-btn--active',
            )}
          >
            {item.icon}
          </button>
        )
      })}
    </nav>
  )
}

export function ModuleToolbarViewToggle({
  mode,
  onChange,
}: {
  mode: 'grid' | 'list'
  onChange: (mode: 'grid' | 'list') => void
}) {
  return (
    <div className="module-toolbar__view-toggle" role="group" aria-label="Вид списка">
      <button
        type="button"
        title="Плитка"
        aria-label="Плитка"
        aria-pressed={mode === 'grid'}
        onClick={() => onChange('grid')}
        className={cn(
          'module-toolbar__view-toggle-btn',
          mode === 'grid' && 'module-toolbar__view-toggle-btn--active',
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        title="Список"
        aria-label="Список"
        aria-pressed={mode === 'list'}
        onClick={() => onChange('list')}
        className={cn(
          'module-toolbar__view-toggle-btn',
          mode === 'list' && 'module-toolbar__view-toggle-btn--active',
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <rect x="1" y="2" width="14" height="2" rx="1" />
          <rect x="1" y="7" width="14" height="2" rx="1" />
          <rect x="1" y="12" width="14" height="2" rx="1" />
        </svg>
      </button>
    </div>
  )
}
