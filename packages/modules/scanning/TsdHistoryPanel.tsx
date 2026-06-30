'use client'

import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useDemoStore } from '@/lib/demo-store'
import { selectTsdHistory, tsdHistoryLabel } from './tsd-history-labels'

export function TsdHistoryPanel({ onBack }: { onBack: () => void }) {
  const { auditLog } = useDemoStore()

  const entries = useMemo(() => selectTsdHistory(auditLog, 40), [auditLog])

  return (
    <div className="tsd-home tsd-home--tasks tsd-history">
      <header className="tsd-topnav">
        <button type="button" className="tsd-topnav__icon" onClick={onBack} aria-label="Назад">
          <ArrowLeft className="size-5" />
        </button>
        <div className="tsd-topnav__title">
          <span className="tsd-topnav__label">История действий</span>
          <span className="tsd-topnav__sub">{entries.length} событий</span>
        </div>
        <span className="tsd-topnav__icon tsd-topnav__icon--ghost" aria-hidden />
      </header>

      <div className="tsd-tasks__scroll tsd-history__body">
        {entries.length ? (
          <ul className="tsd-feed tsd-feed--full">
            {entries.map((entry) => (
              <li key={entry.id} className="tsd-feed__item">
                <span className="tsd-feed__dot" aria-hidden />
                <div className="tsd-feed__content">
                  <time className="tsd-feed__time">
                    {new Date(entry.at).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  <span className="tsd-feed__text">{tsdHistoryLabel(entry.action)}</span>
                  {entry.comment ? <span className="tsd-feed__sub">{entry.comment}</span> : null}
                  {entry.barcode ? <span className="tsd-feed__code">{entry.barcode}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tsd-feed__empty">Операций на ТСД пока нет</p>
        )}
      </div>
    </div>
  )
}
