'use client'

import { useRef } from 'react'
import { Download, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SupplyDocumentRow = {
  key: string
  title: string
  subtitle: string
  pending?: boolean
  download?: {
    disabled?: boolean
    onClick: () => void
  }
  remove?: {
    label: string
    onClick: () => void
  }
}

export function SupplyDocumentsPanel({
  rows,
  onUpload,
  uploadAccept,
  uploadMultiple = true,
  uploadDisabled,
  uploadLabel = 'Загрузить файлы',
  emptyLabel = 'Файлов пока нет',
  fill = true,
}: {
  rows: SupplyDocumentRow[]
  onUpload?: (files: FileList) => void
  uploadAccept?: string
  uploadMultiple?: boolean
  uploadDisabled?: boolean
  uploadLabel?: string
  emptyLabel?: string
  fill?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        'supply-requests__docs-panel',
        fill && 'supply-requests__docs-panel--fill',
      )}
    >
      <div className="supply-requests__docs-group">
        {rows.length ? (
          <ul className="supply-requests__docs">
            {rows.map((row) => (
              <li
                key={row.key}
                className={cn(
                  'supply-requests__doc',
                  row.pending && 'supply-requests__doc--pending',
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-[var(--app-muted)]" />
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-[var(--app-muted)]">{row.subtitle}</p>
                  </div>
                </div>
                {row.remove ? (
                  <button
                    type="button"
                    className="supply-requests__doc-remove"
                    aria-label={row.remove.label}
                    onClick={row.remove.onClick}
                  >
                    <X className="size-4" />
                  </button>
                ) : row.download ? (
                  <button
                    type="button"
                    className="supply-requests__doc-btn"
                    disabled={row.download.disabled}
                    onClick={row.download.onClick}
                  >
                    <Download className="size-4" />
                    Скачать
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="supply-requests__docs-empty">{emptyLabel}</p>
        )}
      </div>

      {onUpload ? (
        <div className="supply-requests__docs-footer">
          <input
            ref={inputRef}
            type="file"
            multiple={uploadMultiple}
            accept={uploadAccept}
            className="sr-only"
            onChange={(event) => {
              if (event.target.files?.length) onUpload(event.target.files)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className="supply-requests__docs-add-op"
            disabled={uploadDisabled}
            onClick={() => inputRef.current?.click()}
          >
            {uploadLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
