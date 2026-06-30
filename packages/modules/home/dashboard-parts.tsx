'use client'

import type { ReactNode } from 'react'
import { AlertCircle, ChevronRight, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttentionItem, AttentionTone } from './build-executive-dashboard'

const KPI_TONES = ['blue', 'green', 'amber', 'red', 'slate'] as const
export type KpiTone = (typeof KPI_TONES)[number]

const ATTENTION_ICONS: Record<AttentionTone, LucideIcon> = {
  red: AlertCircle,
  amber: AlertCircle,
  blue: Info,
  green: Info,
}

export function DashSectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="dash-section-title">
      <h3 className="dash-section-title__text">{title}</h3>
      {action}
    </div>
  )
}

export function DashKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'blue',
  onClick,
  highlight,
  compact = false,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  tone?: KpiTone
  onClick?: () => void
  highlight?: boolean
  compact?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'dash-kpi',
        `dash-kpi--${tone}`,
        compact && 'dash-kpi--compact',
        onClick && 'dash-kpi--clickable',
        highlight && 'dash-kpi--highlight',
      )}
    >
      {compact ? (
        <div className="dash-kpi__compact-row">
          <span className="dash-kpi__icon">
            <Icon className="size-4" strokeWidth={2.25} />
          </span>
          <span className="dash-kpi__compact-body">
            <span className="dash-kpi__label">{label}</span>
            {sub ? <span className="dash-kpi__sub">{sub}</span> : null}
          </span>
          <span className="dash-kpi__value">{value}</span>
        </div>
      ) : (
        <>
          <div className="dash-kpi__head">
            <span className="dash-kpi__icon">
              <Icon className="size-[18px]" strokeWidth={2.25} />
            </span>
            <span className="dash-kpi__label">{label}</span>
          </div>
          <p className="dash-kpi__value">{value}</p>
          {sub ? <p className="dash-kpi__sub">{sub}</p> : null}
        </>
      )}
    </Tag>
  )
}

export function DashAttentionList({
  items,
  onItemClick,
  maxVisible = 6,
}: {
  items: AttentionItem[]
  onItemClick?: (item: AttentionItem) => void
  maxVisible?: number
}) {
  const visible = items.slice(0, maxVisible)
  const hidden = items.length - visible.length

  if (!items.length) {
    return (
      <section className="dash-panel dash-panel--compact">
        <DashSectionTitle title="Требует внимания" />
        <p className="dash-empty">Нет срочных задач</p>
      </section>
    )
  }

  return (
    <section className="dash-panel dash-panel--compact">
      <DashSectionTitle
        title="Требует внимания"
        action={
          <span className="dash-badge dash-badge--warn">{items.length}</span>
        }
      />
      <ul className="dash-attention__list">
        {visible.map((item) => {
          const Icon = ATTENTION_ICONS[item.tone]
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onItemClick?.(item)}
                className={cn('dash-attention__row', `dash-attention__row--${item.tone}`)}
              >
                <span className="dash-attention__icon">
                  <Icon className="size-4" />
                </span>
                <span className="dash-attention__text">{item.label}</span>
                <ChevronRight className="dash-attention__chevron" />
              </button>
            </li>
          )
        })}
      </ul>
      {hidden > 0 ? (
        <p className="dash-attention__more">ещё {hidden} уведомлений</p>
      ) : null}
    </section>
  )
}

export function DashTodayBar({
  items,
}: {
  items: { label: string; value: number }[]
}) {
  return (
    <section className="dash-panel dash-panel--compact">
      <DashSectionTitle title="Сегодня" />
      <div className="dash-today__strip">
        {items.map((item) => (
          <div key={item.label} className="dash-today__pill">
            <p className="dash-today__pill-value">{item.value.toLocaleString('ru-RU')}</p>
            <p className="dash-today__pill-label">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DashFocusList({
  items,
  emptyLabel = 'Нет срочных задач',
}: {
  items: {
    id: string
    label: string
    value: number
    icon: LucideIcon
    tone?: KpiTone
    onClick?: () => void
  }[]
  emptyLabel?: string
}) {
  const visible = items.filter((i) => i.value > 0)

  if (visible.length === 0) {
    return (
      <section className="dash-focus dash-focus--empty">
        <p className="text-sm text-[var(--app-muted)]">{emptyLabel}</p>
      </section>
    )
  }

  return (
    <section className="dash-focus">
      <p className="dash-focus__heading">Требует внимания</p>
      <ul className="dash-focus__list">
        {visible.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={item.onClick} className="dash-focus__row">
              <span className={cn('dash-focus__icon', `dash-focus__icon--${item.tone ?? 'blue'}`)}>
                <item.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-left text-sm font-medium">{item.label}</span>
              <span className="dash-focus__count">{item.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function DashModuleLink({
  title,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="dash-module-link">
      <span className="dash-module-link__icon">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-[var(--app-muted)]">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-[var(--app-muted)]" />
    </button>
  )
}
