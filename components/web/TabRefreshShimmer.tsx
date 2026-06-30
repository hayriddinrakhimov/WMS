'use client'

import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return <div className={cn('tab-refresh-shimmer__bone', className)} aria-hidden />
}

export function TabRefreshShimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn('tab-refresh-shimmer', className)}
      role="status"
      aria-live="polite"
      aria-label="Обновление данных"
    >
      <div className="tab-refresh-shimmer__toolbar">
        <Bone className="h-9 w-44" />
        <Bone className="h-9 w-32" />
        <div className="ml-auto flex gap-2">
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-36" />
        </div>
      </div>

      <div className="tab-refresh-shimmer__body">
        <div className="tab-refresh-shimmer__table-head">
          <Bone className="h-4 w-[18%]" />
          <Bone className="h-4 w-[14%]" />
          <Bone className="h-4 w-[12%]" />
          <Bone className="h-4 w-[16%]" />
          <Bone className="h-4 w-[14%]" />
          <Bone className="h-4 w-[12%]" />
        </div>

        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="tab-refresh-shimmer__row">
            <Bone className="h-4 w-[22%]" />
            <Bone className="h-4 w-[14%]" />
            <Bone className="h-4 w-[10%]" />
            <Bone className="h-4 w-[18%]" />
            <Bone className="h-4 w-[12%]" />
            <Bone className="h-4 w-[8%]" />
          </div>
        ))}
      </div>

      <p className="tab-refresh-shimmer__hint">Загрузка данных…</p>
    </div>
  )
}
