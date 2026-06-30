import type { ReactNode } from 'react'
import { DataTable, type DataTableColumn } from './DataTable'
import { ListRow } from './ListRow'

export function ResponsiveRecordList<T extends { id: string }>({
  rows,
  columns,
  renderCard,
  selectedIds,
  onToggle,
  onRowClick,
}: {
  rows: T[]
  columns: DataTableColumn<T>[]
  renderCard: (row: T) => { title: string; subtitle?: string; badge?: string | number }
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
  onRowClick?: (row: T) => void
}) {
  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          rows={rows}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      </div>
      <div className="space-y-2 md:hidden">
        {rows.map((row) => {
          const card = renderCard(row)
          const selected = selectedIds?.has(row.id)
          return (
            <div key={row.id} className="flex items-start gap-2">
              {onToggle ? (
                <input
                  type="checkbox"
                  checked={selected ?? false}
                  onChange={() => onToggle(row.id)}
                  className="mt-3 size-4 shrink-0 rounded border-[var(--app-border)]"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <ListRow
                  title={card.title}
                  subtitle={card.subtitle}
                  badge={card.badge}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function ResponsivePanel({
  desktop,
  mobile,
}: {
  desktop: ReactNode
  mobile: ReactNode
}) {
  return (
    <>
      <div className="hidden md:block">{desktop}</div>
      <div className="md:hidden">{mobile}</div>
    </>
  )
}
