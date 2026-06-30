import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selectedIds,
  onToggle,
  className,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-[var(--app-border)]', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[var(--app-border)] bg-[var(--app-page)]">
          <tr>
            {onToggle ? <th className="w-10 px-3 py-2" /> : null}
            {columns.map((col) => (
              <th key={col.key} className={cn('px-3 py-2 font-medium text-[var(--app-muted)]', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--app-border)] last:border-0">
              {onToggle ? (
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(row.id) ?? false}
                    onChange={() => onToggle(row.id)}
                    className="size-4 rounded border-[var(--app-border)]"
                  />
                </td>
              ) : null}
              {columns.map((col) => (
                <td key={col.key} className={cn('px-3 py-2', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
