'use client'

import { useRef, useState, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DocumentsDropZone({
  onFiles,
  accept,
  title = 'Загрузить файлы',
  subtitle = 'PDF, Excel, Word, изображения и другие',
  hint = 'Перетащите файлы сюда или нажмите для выбора',
  className,
}: {
  onFiles: (files: FileList) => void
  accept?: string
  title?: string
  subtitle?: string
  hint?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const openPicker = () => inputRef.current?.click()

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    if (event.dataTransfer.files?.length) onFiles(event.dataTransfer.files)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        className={cn(
          'supply-requests__docs-upload',
          dragOver && 'supply-requests__docs-upload--active',
          className,
        )}
        onClick={openPicker}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="size-5 text-[var(--app-muted)]" aria-hidden />
        <span className="text-sm font-medium text-[var(--foreground)]">{title}</span>
        <span className="text-xs text-[var(--app-muted)]">{subtitle}</span>
        <span className="text-xs text-[var(--app-muted)]">{hint}</span>
      </button>
    </>
  )
}
