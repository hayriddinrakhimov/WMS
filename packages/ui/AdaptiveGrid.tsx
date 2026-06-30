import { cn } from '@/lib/utils'

export function AdaptiveGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
