'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Menu, Plus, RotateCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkTab } from '@/lib/work-tabs'

interface WorkTabBarProps {
  tabs: WorkTab[]
  activeTabId: string
  canGoBack: boolean
  canGoForward: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onAdd: () => void
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  isRefreshing?: boolean
  onOpenMenu?: () => void
  compact?: boolean
}

export function WorkTabBar({
  tabs,
  activeTabId,
  canGoBack,
  canGoForward,
  onSelect,
  onClose,
  onAdd,
  onBack,
  onForward,
  onRefresh,
  isRefreshing = false,
  onOpenMenu,
  compact = false,
}: WorkTabBarProps) {
  const [pendingClose, setPendingClose] = useState<WorkTab | null>(null)

  const requestClose = (tab: WorkTab, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tab.dirty) {
      setPendingClose(tab)
      return
    }
    onClose(tab.id)
  }

  const confirmClose = () => {
    if (pendingClose) onClose(pendingClose.id)
    setPendingClose(null)
  }

  return (
    <>
      <div className={cn('browser-chrome', compact && 'browser-chrome--compact')}>
        <div className="browser-chrome__nav" aria-label="Навигация по экранам">
          {onOpenMenu ? (
            <button
              type="button"
              className="browser-chrome__nav-btn"
              aria-label="Меню"
              title="Меню"
              onClick={onOpenMenu}
            >
              <Menu className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            className="browser-chrome__nav-btn"
            aria-label="Назад"
            title="Назад"
            disabled={!canGoBack}
            onClick={onBack}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="browser-chrome__nav-btn"
            aria-label="Вперёд"
            title="Вперёд"
            disabled={!canGoForward}
            onClick={onForward}
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            className={cn('browser-chrome__nav-btn', isRefreshing && 'browser-chrome__nav-btn--refreshing')}
            aria-label="Обновить"
            title="Обновить"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <RotateCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
          </button>
        </div>

        <div className="browser-chrome__tabs" role="tablist" aria-label="Вкладки">
          <div className="browser-chrome__tab-scroll">
            {tabs.map((tab) => {
              const active = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  title={tab.title}
                  className={cn('browser-chrome__tab', active && 'browser-chrome__tab--active')}
                  onClick={() => onSelect(tab.id)}
                >
                  {tab.dirty ? (
                    <span className="browser-chrome__dirty" aria-hidden title="Есть изменения">
                      ●
                    </span>
                  ) : null}
                  <span className="browser-chrome__tab-title truncate">{tab.title}</span>
                  <button
                    type="button"
                    className="browser-chrome__tab-close"
                    aria-label={`Закрыть «${tab.title}»`}
                    onClick={(e) => requestClose(tab, e)}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            className="browser-chrome__new-tab"
            aria-label="Новая вкладка"
            title="Новая вкладка"
            onClick={onAdd}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {pendingClose ? (
        <div className="work-tab-bar__dialog" role="dialog" aria-modal="true">
          <div className="work-tab-bar__dialog-card">
            <p className="work-tab-bar__dialog-title">Закрыть вкладку?</p>
            <p className="work-tab-bar__dialog-text">
              В «{pendingClose.title}» есть несохранённые изменения. Закрыть без сохранения?
            </p>
            <div className="work-tab-bar__dialog-actions">
              <button type="button" className="work-tab-bar__dialog-btn" onClick={() => setPendingClose(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="work-tab-bar__dialog-btn work-tab-bar__dialog-btn--danger"
                onClick={confirmClose}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
