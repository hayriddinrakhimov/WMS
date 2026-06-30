'use client'

import { ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TsdSimulateScan({
  label = 'Сканировать',
  hint,
  disabled,
  onScan,
  className,
}: {
  label?: string
  hint?: string
  disabled?: boolean
  onScan: () => void
  className?: string
}) {
  return (
    <div className={cn('tsd-sim-scan', className)}>
      {hint ? <p className="tsd-sim-scan__hint">{hint}</p> : null}
      <button
        type="button"
        className="tsd-sim-scan__btn"
        disabled={disabled}
        onClick={onScan}
      >
        <ScanLine className="size-5" />
        {label}
      </button>
    </div>
  )
}
