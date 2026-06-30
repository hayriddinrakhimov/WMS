'use client'

import { ArrowLeft, Menu, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TsdTopNav({
  title,
  subtitle,
  onBack,
  onRefresh,
  onSettings,
  refreshing = false,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  onRefresh?: () => void
  onSettings?: () => void
  refreshing?: boolean
}) {
  return (
    <header className="tsd-topnav">
      {onBack ? (
        <button type="button" className="tsd-topnav__icon" aria-label="Назад" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </button>
      ) : (
        <span className="tsd-topnav__brand" aria-hidden>
          ТСД
        </span>
      )}

      <div className="tsd-topnav__title">
        <span className="tsd-topnav__label">{title}</span>
        {subtitle ? <span className="tsd-topnav__sub">{subtitle}</span> : null}
      </div>

      <div className="tsd-topnav__actions">
        {onRefresh ? (
          <button
            type="button"
            className="tsd-topnav__icon"
            aria-label="Обновить"
            title="Обновить"
            onClick={onRefresh}
          >
            <RefreshCw className={cn('size-[18px]', refreshing && 'animate-spin')} />
          </button>
        ) : null}
        {onSettings ? (
          <button
            type="button"
            className="tsd-topnav__icon"
            aria-label="Меню"
            title="Меню"
            onClick={onSettings}
          >
            <Menu className="size-[18px]" />
          </button>
        ) : null}
      </div>
    </header>
  )
}
