import { cn } from '@/lib/utils'

export function TsdLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-white',
        className,
      )}
      aria-hidden
    >
      AA
    </div>
  )
}
