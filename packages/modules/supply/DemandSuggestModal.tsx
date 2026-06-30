'use client'

import { Sparkles } from 'lucide-react'
import type { DemandSuggestion } from './demand-hint'

export function DemandSuggestModal({
  suggestion,
  onConfirm,
  onCancel,
}: {
  suggestion: DemandSuggestion
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="supply-demand-modal" role="dialog" aria-modal="true" aria-labelledby="demand-modal-title">
      <button type="button" className="supply-demand-modal__backdrop" aria-label="Закрыть" onClick={onCancel} />
      <div className="supply-demand-modal__card">
        <div className="supply-demand-modal__icon">
          <Sparkles className="size-5" />
        </div>
        <h3 id="demand-modal-title" className="supply-demand-modal__title">
          Создать на основе спроса и остатков
        </h3>
        <p className="supply-demand-modal__product">{suggestion.productName}</p>

        <dl className="supply-demand-modal__facts">
          <div>
            <dt>Спрос на предприятие</dt>
            <dd>
              <span className="font-medium">{suggestion.enterpriseName}</span>
              <span className="mt-0.5 block tabular-nums text-[var(--foreground)]">
                {suggestion.demand.toLocaleString('ru-RU')} {suggestion.unit}
              </span>
            </dd>
          </div>
          <div>
            <dt>Остатки</dt>
            <dd className="tabular-nums">
              {suggestion.stock.toLocaleString('ru-RU')} {suggestion.unit}
              {suggestion.inOrder > 0 ? (
                <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
                  в заказе: {suggestion.inOrder} {suggestion.unit}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="supply-demand-modal__highlight">
            <dt>Закажем</dt>
            <dd className="text-lg font-bold tabular-nums text-[var(--primary)]">
              {suggestion.suggestQty.toLocaleString('ru-RU')} {suggestion.unit}
            </dd>
          </div>
        </dl>

        <p className="supply-demand-modal__question">Подтвердить?</p>

        <div className="supply-demand-modal__actions">
          <button type="button" className="supply-requests__btn supply-requests__btn--ghost" onClick={onCancel}>
            Нет
          </button>
          <button
            type="button"
            className="supply-requests__btn supply-requests__btn--primary"
            onClick={onConfirm}
          >
            Да
          </button>
        </div>
      </div>
    </div>
  )
}

export function DemandWandButton({
  label = 'Создать на основе спроса и остатков',
  onClick,
  compact = false,
}: {
  label?: string
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      className={compact ? 'supply-demand-wand supply-demand-wand--compact' : 'supply-demand-wand'}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Sparkles className="size-3.5 shrink-0" />
      {!compact ? <span>{label}</span> : null}
    </button>
  )
}
