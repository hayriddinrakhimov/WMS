'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ModuleRouter } from '@/components/shared/ModuleRouter'
import { TabRefreshShimmer } from '@/components/web/TabRefreshShimmer'
// import { WorkTabBar } from '@/components/web/WorkTabBar'
import { useDemoStore } from '@/lib/demo-store'
import { cn } from '@/lib/utils'

const REFRESH_MIN_MS = 620
const REFRESH_MAX_MS = 880

interface WebMainContentProps {
  compact?: boolean
  scanningMode?: boolean
}

export function WebMainContent({ compact = false, scanningMode = false }: WebMainContentProps) {
  void compact
  const {
    workTabs,
    activeWorkTabId,
    activeWorkTab,
    canWorkTabGoBack,
    canWorkTabGoForward,
    selectWorkTab,
    closeWorkTab,
    addWorkTab,
    workTabBack,
    workTabForward,
    refreshActiveWorkTab,
  } = useDemoStore()

  void workTabs
  void canWorkTabGoBack
  void canWorkTabGoForward
  void selectWorkTab
  void closeWorkTab
  void addWorkTab
  void workTabBack
  void workTabForward

  const refreshKey = activeWorkTab?.refreshKey ?? 0
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsRefreshing(false)
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [activeWorkTabId])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return

    setIsRefreshing(true)
    const delay = REFRESH_MIN_MS + Math.floor(Math.random() * (REFRESH_MAX_MS - REFRESH_MIN_MS))

    refreshTimerRef.current = setTimeout(() => {
      refreshActiveWorkTab()
      refreshTimerRef.current = setTimeout(() => {
        setIsRefreshing(false)
        refreshTimerRef.current = null
      }, 120)
    }, delay)
  }, [isRefreshing, refreshActiveWorkTab])

  void handleRefresh

  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
        scanningMode ? 'bg-transparent' : 'bg-[var(--app-page)]',
      )}
    >
      {/* Вкладки браузера скрыты — раскомментируйте для отображения
      <WorkTabBar
        tabs={workTabs}
        activeTabId={activeWorkTabId}
        canGoBack={canWorkTabGoBack}
        canGoForward={canWorkTabGoForward}
        isRefreshing={isRefreshing}
        onSelect={selectWorkTab}
        onClose={closeWorkTab}
        onAdd={addWorkTab}
        onBack={workTabBack}
        onForward={workTabForward}
        onRefresh={handleRefresh}
        onOpenMenu={scanningMode ? onOpenMenu : undefined}
        compact={scanningMode || compact}
      />
      */}
      <div
        className={cn(
          'relative min-h-0 min-w-0 flex-1 overflow-hidden',
          scanningMode ? 'bg-transparent' : 'bg-white',
        )}
        aria-busy={isRefreshing}
      >
        <div
          className={cn(
            'h-full min-h-0 transition-opacity duration-200',
            isRefreshing && 'pointer-events-none opacity-[0.35]',
          )}
        >
          <ModuleRouter key={`${activeWorkTabId}-${refreshKey}`} />
        </div>
        {isRefreshing ? <TabRefreshShimmer className="absolute inset-0 z-10" /> : null}
      </div>
    </div>
  )
}
