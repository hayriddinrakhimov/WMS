import { Warehouse } from 'lucide-react'
import type { ModuleManifest } from '@wms/domain'

export const warehousesManifest: ModuleManifest = {
  id: 'warehouses',
  title: 'Склады',
  icon: Warehouse,
  webRoute: '/warehouses',
  mobileRoute: '/m/warehouses',
  roles: ['warehouse_manager', 'agronomist', 'management', 'admin'],
  widgets: [
    { id: 'w-stock', title: 'Остатки', moduleId: 'warehouses', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-half-empty', title: 'Полупустая тара', moduleId: 'warehouses', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-disposal', title: 'Утиль', moduleId: 'warehouses', roles: ['warehouse_manager', 'management', 'admin'] },
  ],
  documents: [
    { id: 'transfer-act', title: 'Акт перемещения', type: 'transfer' },
    { id: 'issue-act', title: 'Акт выдачи', type: 'issue' },
    { id: 'inventory-act', title: 'Акт инвентаризации', type: 'inventory' },
  ],
  operations: [
    { id: 'receipt', title: 'Приёмка', type: 'receipt' },
    { id: 'transfer', title: 'Перемещение', type: 'transfer' },
    { id: 'issue', title: 'Выдача', type: 'issue' },
    { id: 'return', title: 'Возврат', type: 'return' },
    { id: 'half_empty_return', title: 'Полупустая тара', type: 'half_empty_return' },
    { id: 'writeoff_empty', title: 'Списание пустой тары', type: 'writeoff_empty' },
    { id: 'writeoff_expiry', title: 'Списание по сроку', type: 'writeoff_expiry' },
    { id: 'disposal_transfer', title: 'Передача на утилизацию', type: 'disposal_transfer' },
    { id: 'inventory', title: 'Инвентаризация', type: 'inventory' },
  ],
}
