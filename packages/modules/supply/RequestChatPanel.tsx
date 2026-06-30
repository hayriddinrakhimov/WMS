'use client'

import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import type { ProcurementRequestComment } from '@wms/domain'
import { cn } from '@/lib/utils'

export type ChatMessage = ProcurementRequestComment

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function authorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function RequestChatPanel({
  items,
  currentUserId,
  className,
  title = 'Чат',
  showTitle = true,
  onSend,
  composePlaceholder = 'Написать сообщение…',
  composeDisabled = false,
}: {
  items: ChatMessage[]
  currentUserId?: string
  className?: string
  title?: string
  showTitle?: boolean
  onSend?: (text: string) => boolean | void
  composePlaceholder?: string
  composeDisabled?: boolean
}) {
  const [draft, setDraft] = useState('')

  const messages = useMemo(
    () => [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [items],
  )

  const canSend = Boolean(onSend) && !composeDisabled && draft.trim().length > 0

  const submitDraft = () => {
    if (!onSend || composeDisabled) return
    const text = draft.trim()
    if (!text) return
    const ok = onSend(text)
    if (ok !== false) {
      setDraft('')
    }
  }

  return (
    <section className={cn('supply-requests__chat', className)} aria-label={title}>
      {showTitle ? (
        <div className="supply-requests__chat-header">
          <h3 className="supply-requests__chat-title">{title}</h3>
        </div>
      ) : null}

      <div className="supply-requests__chat-body">
        {!messages.length ? (
          <p className="supply-requests__chat-empty">Сообщений пока нет</p>
        ) : (
          <div className="supply-requests__chat-messages" aria-label="Сообщения чата">
            {messages.map((entry) => {
              const isOwn = currentUserId ? entry.authorId === currentUserId : false
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'supply-requests__chat-row',
                    isOwn && 'supply-requests__chat-row--own',
                  )}
                >
                  <div
                    className={cn(
                      'supply-requests__chat-avatar',
                      isOwn && 'supply-requests__chat-avatar--own',
                    )}
                    aria-hidden
                  >
                    {authorInitials(entry.authorName)}
                  </div>
                  <div
                    className={cn(
                      'supply-requests__chat-bubble',
                      isOwn
                        ? 'supply-requests__chat-bubble--own'
                        : 'supply-requests__chat-bubble--other',
                    )}
                  >
                    {!isOwn ? (
                      <div className="supply-requests__chat-bubble-author">{entry.authorName}</div>
                    ) : null}
                    <p className="supply-requests__chat-bubble-text">{entry.text}</p>
                    <time className="supply-requests__chat-bubble-time" dateTime={entry.createdAt}>
                      {formatDateTime(entry.createdAt)}
                    </time>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {onSend ? (
        <footer className="supply-requests__chat-compose">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitDraft()
              }
            }}
            placeholder={composePlaceholder}
            disabled={composeDisabled}
            className="supply-requests__chat-compose-input"
            aria-label={composePlaceholder}
          />
          <button
            type="button"
            className="supply-requests__chat-compose-btn"
            disabled={!canSend}
            onClick={submitDraft}
            aria-label="Отправить"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </footer>
      ) : null}
    </section>
  )
}
