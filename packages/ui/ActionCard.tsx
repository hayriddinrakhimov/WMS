import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export function ActionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  onClick,
  className,
}: {
  title: string
  subtitle?: string
  icon: LucideIcon
  badge?: number
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left transition hover:border-[var(--app-accent)]/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-[var(--app-accent)]/10 p-2 text-[var(--app-accent)]">
          <Icon className="size-5" />
        </div>
        {badge !== undefined && badge > 0 ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {badge}
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-[var(--app-muted)]">{subtitle}</p> : null}
      </div>
    </button>
  )
}
