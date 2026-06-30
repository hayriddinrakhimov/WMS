'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function RequestWorkspaceModal({
  title,
  subtitle,
  status,
  onClose,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  status?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="supply-request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
      <button type="button" className="supply-request-modal__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="supply-request-modal__panel">
        <header className="supply-request-modal__header">
          <div className="min-w-0 flex-1">
            <h2 id="request-modal-title" className="supply-request-modal__title truncate">
              {title}
            </h2>
            {subtitle ? <p className="supply-request-modal__subtitle truncate">{subtitle}</p> : null}
          </div>
          {status ? <div className="supply-request-modal__status shrink-0">{status}</div> : null}
          <button
            type="button"
            className="supply-request-modal__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="supply-request-modal__body">{children}</div>
        {footer ? <footer className="supply-request-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
