'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ModuleLandingTone = 'blue' | 'green' | 'amber' | 'violet' | 'slate' | 'red'

const TONE_STYLES: Record<
  ModuleLandingTone,
  { iconBg: string; iconText: string; ring: string; accent: string }
> = {
  blue: {
    iconBg: 'bg-[#e8f0ff]',
    iconText: 'text-[#2563eb]',
    ring: 'group-hover:ring-[#93c5fd]',
    accent: 'group-hover:border-[#93c5fd]',
  },
  green: {
    iconBg: 'bg-[#e6f5ef]',
    iconText: 'text-[#0d7a52]',
    ring: 'group-hover:ring-[#86efac]',
    accent: 'group-hover:border-[#86efac]',
  },
  amber: {
    iconBg: 'bg-[#fef3c7]',
    iconText: 'text-[#b45309]',
    ring: 'group-hover:ring-[#fcd34d]',
    accent: 'group-hover:border-[#fcd34d]',
  },
  violet: {
    iconBg: 'bg-[#ede9fe]',
    iconText: 'text-[#6d28d9]',
    ring: 'group-hover:ring-[#c4b5fd]',
    accent: 'group-hover:border-[#c4b5fd]',
  },
  slate: {
    iconBg: 'bg-[#f1f5f9]',
    iconText: 'text-[#475569]',
    ring: 'group-hover:ring-[#cbd5e1]',
    accent: 'group-hover:border-[#cbd5e1]',
  },
  red: {
    iconBg: 'bg-[#fdecea]',
    iconText: 'text-[#c62828]',
    ring: 'group-hover:ring-[#fca5a5]',
    accent: 'group-hover:border-[#fca5a5]',
  },
}

export interface ModuleLandingCard {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tone?: ModuleLandingTone
  badge?: string | number
  onClick: () => void
}

interface ModuleLandingProps {
  title: string
  subtitle?: string
  hint?: string
  cards: ModuleLandingCard[]
  /** Встроенный блок без крупного заголовка (например, на главной) */
  embedded?: boolean
}

export function ModuleLanding({ title, subtitle, hint, cards, embedded = false }: ModuleLandingProps) {
  return (
    <div className={cn('module-landing', embedded && 'module-landing--embedded')}>
      {!embedded ? (
        <header className="module-landing__hero">
          <h1 className="module-landing__title">{title}</h1>
          {subtitle ? <p className="module-landing__subtitle">{subtitle}</p> : null}
          {hint ? <p className="module-landing__hint">{hint}</p> : null}
        </header>
      ) : (
        <p className="module-landing__embedded-title">{title}</p>
      )}

      <div className="module-landing__grid">
        {cards.map((card) => {
          const tone = TONE_STYLES[card.tone ?? 'blue']
          const Icon = card.icon
          return (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className={cn('module-landing__card group', tone.accent)}
            >
              <div className="module-landing__card-top">
                <span
                  className={cn(
                    'module-landing__icon',
                    tone.iconBg,
                    tone.iconText,
                    tone.ring,
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                {card.badge !== undefined ? (
                  <span className="module-landing__badge">{card.badge}</span>
                ) : null}
              </div>
              <div className="module-landing__card-body">
                <span className="module-landing__card-title">{card.title}</span>
                <span className="module-landing__card-desc">{card.description}</span>
              </div>
              <ChevronRight className="module-landing__arrow size-4" aria-hidden />
            </button>
          )
        })}
      </div>
    </div>
  )
}
