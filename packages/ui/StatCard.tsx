import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  onClick,
  className,
}: {
  label: string
  value: string | number
  onClick?: () => void
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left',
        onClick && 'cursor-pointer transition hover:border-[var(--app-accent)]/40',
        className,
      )}
    >
      <p className="text-xs text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Tag>
  )
}
