'use client'

import { Plus } from 'lucide-react'
import { ModuleToolbarButton } from '../shared/ModuleToolbar'

type SupplyTab = 'demand' | 'supplier'

interface SupplyActionButtonsProps {
  tab: SupplyTab
  selectedCount: number
  onCreateRequest: () => void
  onForm: () => void
}

export function SupplyActionButtons({
  tab,
  selectedCount,
  onCreateRequest,
  onForm,
}: SupplyActionButtonsProps) {
  const isFormMode = selectedCount > 0
  const label = isFormMode ? 'Сформировать' : tab === 'demand' ? 'Создать заявку' : 'Сформировать'

  return (
    <ModuleToolbarButton
      variant="primary"
      className="module-toolbar__btn--supply-create"
      icon={
        isFormMode ? (
          <span className="module-toolbar__btn-icon-slot" aria-hidden />
        ) : (
          <Plus className="size-4" />
        )
      }
      onClick={isFormMode ? onForm : onCreateRequest}
    >
      {label}
    </ModuleToolbarButton>
  )
}
