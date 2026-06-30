'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TsdBottomSheet({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="tsd-sheet-root" role="presentation">
      <button type="button" className="tsd-sheet-backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className={cn('tsd-sheet', className)} role="dialog" aria-modal="true" aria-label={title}>
        <div className="tsd-sheet__handle" aria-hidden />
        <header className="tsd-sheet__header">
          <h2 className="tsd-sheet__title">{title}</h2>
          <button type="button" className="tsd-sheet__close" onClick={onClose} aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </header>
        <div className="tsd-sheet__body">{children}</div>
      </div>
    </div>
  )
}
