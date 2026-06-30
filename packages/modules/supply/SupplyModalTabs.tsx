'use client'

import { cn } from '@/lib/utils'

export type SupplyModalTab = 'items' | 'comments' | 'documents'

export function SupplyModalTabs({
  value,
  onChange,
  showChat = true,
}: {
  value: SupplyModalTab
  onChange: (tab: SupplyModalTab) => void
  showChat?: boolean
}) {
  return (
    <div className="supply-requests__tabs">
      <button
        type="button"
        className={cn(value === 'items' && 'supply-requests__tab--active')}
        onClick={() => onChange('items')}
      >
        Позиции
      </button>
      {showChat ? (
        <button
          type="button"
          className={cn(value === 'comments' && 'supply-requests__tab--active')}
          onClick={() => onChange('comments')}
        >
          Чат
        </button>
      ) : null}
      <button
        type="button"
        className={cn(value === 'documents' && 'supply-requests__tab--active')}
        onClick={() => onChange('documents')}
      >
        Документы
      </button>
    </div>
  )
}
