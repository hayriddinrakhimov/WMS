'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ClipboardList, Truck } from 'lucide-react'
import { useDemoStore } from '@/lib/demo-store'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { selectableEnterprisesForUser, ALL_ENTERPRISES_FILTER, type User } from '@wms/domain'
import { ModulePageLayout } from '../shared/ModulePageLayout'
import { ModuleToolbar } from '../shared/ModuleToolbar'
import { ConsolidationFormModal } from './ConsolidationFormModal'
import { RequestsPanel, type RequestModalOpen, type RequestsPanelHandle } from './RequestsPanel'
import { SupplierOrdersPanel } from './SupplierOrdersPanel'
import { SupplyActionButtons } from './SupplyActionButtons'
import type { ModuleRenderContext } from '@wms/domain'

type SupplyTab = 'demand' | 'supplier'

function formatFilterDate(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y.slice(2)}`
}

function enterprisesForUser(user: User | null) {
  return selectableEnterprisesForUser(user)
}

export function ProcurementScreen({ filter, user }: ModuleRenderContext) {
  const {
    createConsolidatedDemand,
    approveConsolidatedDemand,
    approveProcurementRequest,
    createTransferTaskPairFromRequest,
    returnConsolidatedDemand,
    returnProcurementRequests,
    simulateUpakUpload,
    procurementRequests,
    consolidatedDemands,
    supplierOrders,
    navigateActiveWorkTab,
  } = useDemoStore()

  const requestsPanelRef = useRef<RequestsPanelHandle>(null)

  const tab = (filter?.tab as SupplyTab | undefined) ?? 'demand'
  const view = filter?.view ?? 'list'
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [highlightId, setHighlightId] = useState<string | undefined>()
  const [consolidationFormOpen, setConsolidationFormOpen] = useState(false)
  const [dueDateFilter, setDueDateFilter] = useState('')
  const dateFilterRef = useRef<HTMLInputElement>(null)

  const allowedEnterprises = useMemo(() => enterprisesForUser(user), [user])
  const defaultEnterpriseId = ALL_ENTERPRISES_FILTER
  const [enterpriseId, setEnterpriseId] = useState(defaultEnterpriseId)
  const canSwitchEnterprise = allowedEnterprises.length > 0
  const activeEnterpriseId = enterpriseId

  useEffect(() => {
    setEnterpriseId((prev) =>
      prev === ALL_ENTERPRISES_FILTER || allowedEnterprises.some((e) => e.id === prev)
        ? prev
        : defaultEnterpriseId,
    )
  }, [user?.id, defaultEnterpriseId, allowedEnterprises])

  useEffect(() => {
    if (!highlightId) return
    const timer = window.setTimeout(() => setHighlightId(undefined), 2000)
    return () => window.clearTimeout(timer)
  }, [highlightId])

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setActiveTab = (nextTab: SupplyTab) => {
    navigateActiveWorkTab(
      { moduleId: 'supply', filter: { tab: nextTab, view: 'list' } },
      'Снабжение',
      { replace: true },
    )
  }

  const handleFormDemand = () => {
    const approvedIds = [...selectedRequests].filter((id) =>
      procurementRequests.some((r) => r.id === id && r.status === 'approved'),
    )
    if (!approvedIds.length) {
      toast.error('Отметьте утверждённые заявки')
      return
    }
    setConsolidationFormOpen(true)
  }

  const handleConsolidationSubmit = (input: Parameters<typeof createConsolidatedDemand>[0]) => {
    const result = createConsolidatedDemand(input)
    if (result.ok && result.demandId) {
      setSelectedRequests(new Set())
      setHighlightId(result.demandId)
      navigateActiveWorkTab(
        { moduleId: 'supply', filter: { tab: 'supplier', view: 'list' } },
        'Снабжение',
        { replace: true },
      )
    }
    return result
  }

  const handleApproveConsolidated = (id: string) => {
    return approveConsolidatedDemand(id)
  }

  const handleUpakUpload = (orderId: string) => {
    const result = simulateUpakUpload(orderId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  const openCreateRequest = () => {
    if (tab !== 'demand') {
      navigateActiveWorkTab(
        { moduleId: 'supply', filter: { tab: 'demand', view: 'create' } },
        'Снабжение',
        { replace: true },
      )
      return
    }
    requestsPanelRef.current?.openCreate()
  }

  const requestModalAutoOpen = useMemo((): RequestModalOpen | undefined => {
    if (tab !== 'demand') return undefined
    if (view === 'create') return { kind: 'create', requestId: filter?.requestId }
    if (view === 'detail' && filter?.requestId) {
      return { kind: 'detail', requestId: filter.requestId }
    }
    return undefined
  }, [tab, view, filter?.requestId])

  const consumeRequestModalRoute = () => {
    navigateActiveWorkTab(
      { moduleId: 'supply', filter: { tab: 'demand', view: 'list' } },
      'Снабжение',
      { replace: true },
    )
  }

  const selectedCount = tab === 'demand' ? selectedRequests.size : 0

  const supplyActions =
    view === 'list' ? (
      <SupplyActionButtons
        tab={tab}
        selectedCount={selectedCount}
        onCreateRequest={openCreateRequest}
        onForm={handleFormDemand}
      />
    ) : null

  const toolbar = (
    <ModuleToolbar
      left={
        <div className="module-toolbar__enterprise">
          {canSwitchEnterprise ? (
            <select
              value={activeEnterpriseId}
              onChange={(e) => setEnterpriseId(e.target.value)}
              className="module-toolbar__enterprise-select"
              aria-label="Предприятие"
            >
              <option value={ALL_ENTERPRISES_FILTER}>Все предприятия</option>
              {allowedEnterprises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="module-toolbar__enterprise-value">Все предприятия</span>
          )}
        </div>
      }
      right={
        <>
          <div className="module-toolbar__tabs" role="tablist" aria-label="Раздел снабжения">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'demand'}
              className={cn('module-toolbar__tab', tab === 'demand' && 'module-toolbar__tab--active')}
              onClick={() => setActiveTab('demand')}
              title="Спрос"
            >
              <ClipboardList className="size-4 shrink-0" aria-hidden />
              <span className="module-toolbar__tab-label">Спрос</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'supplier'}
              className={cn('module-toolbar__tab', tab === 'supplier' && 'module-toolbar__tab--active')}
              onClick={() => setActiveTab('supplier')}
              title="Заявки поставщику"
            >
              <Truck className="size-4 shrink-0" aria-hidden />
              <span className="module-toolbar__tab-label">Поставщики</span>
            </button>
          </div>
          <div className="module-toolbar__date">
            <button
              type="button"
              className={cn(
                'module-toolbar__date-trigger',
                dueDateFilter && 'module-toolbar__date-trigger--active',
              )}
              title={
                dueDateFilter
                  ? tab === 'demand'
                    ? `Срок выдачи: ${new Date(dueDateFilter).toLocaleDateString('ru-RU')}`
                    : `Создано: ${new Date(dueDateFilter).toLocaleDateString('ru-RU')}`
                  : tab === 'demand'
                    ? 'Фильтр по сроку выдачи'
                    : 'Фильтр по дате создания'
              }
              aria-label={tab === 'demand' ? 'Фильтр по сроку выдачи' : 'Фильтр по дате создания'}
              onClick={() => dateFilterRef.current?.showPicker()}
            >
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {dueDateFilter ? (
                <span className="module-toolbar__date-value">{formatFilterDate(dueDateFilter)}</span>
              ) : null}
            </button>
            <input
              ref={dateFilterRef}
              type="date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="module-toolbar__date-input-hidden"
              tabIndex={-1}
              aria-hidden
            />
            {dueDateFilter ? (
              <button
                type="button"
                className="module-toolbar__date-clear"
                onClick={() => setDueDateFilter('')}
                aria-label="Сбросить фильтр по дате"
              >
                ×
              </button>
            ) : null}
          </div>
          {supplyActions}
        </>
      }
    />
  )

  return (
    <ModulePageLayout toolbar={toolbar}>
      <div className="p-0">
        {tab === 'demand' ? (
          <RequestsPanel
            ref={requestsPanelRef}
            user={user}
            enterpriseId={activeEnterpriseId}
            dueDateFilter={dueDateFilter}
            selectedRequestIds={selectedRequests}
            onToggleRequest={toggleRequest}
            onApproveRequest={approveProcurementRequest}
            onReturnRequest={(id, comment) => returnProcurementRequests([id], comment)}
            onCreateTransfer={createTransferTaskPairFromRequest}
            autoOpen={requestModalAutoOpen}
            onAutoOpenConsumed={requestModalAutoOpen ? consumeRequestModalRoute : undefined}
          />
        ) : (
          <SupplierOrdersPanel
            consolidatedDemands={consolidatedDemands}
            supplierOrders={supplierOrders}
            procurementRequests={procurementRequests}
            onApproveConsolidated={handleApproveConsolidated}
            onReturnConsolidated={returnConsolidatedDemand}
            onUpakUpload={handleUpakUpload}
            highlightId={highlightId}
            createdDateFilter={dueDateFilter}
          />
        )}
      </div>

      {consolidationFormOpen ? (
        <ConsolidationFormModal
          requests={procurementRequests.filter(
            (r) => selectedRequests.has(r.id) && r.status === 'approved',
          )}
          onClose={() => setConsolidationFormOpen(false)}
          onSubmit={handleConsolidationSubmit}
        />
      ) : null}
    </ModulePageLayout>
  )
}
