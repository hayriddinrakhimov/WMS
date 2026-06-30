import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ListRow({
  title,
  subtitle,
  badge,
  onClick,
  className,
}: {
  title: string
  subtitle?: string
  badge?: string | number
  onClick?: () => void
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-left',
        onClick && 'cursor-pointer hover:bg-[var(--app-page)]',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle ? <p className="truncate text-xs text-[var(--app-muted)]">{subtitle}</p> : null}
      </div>
      {badge !== undefined ? (
        <span className="rounded-full bg-[var(--app-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--app-accent)]">
          {badge}
        </span>
      ) : null}
      {onClick ? <ChevronRight className="size-4 shrink-0 text-[var(--app-muted)]" /> : null}
    </Tag>
  )
}
