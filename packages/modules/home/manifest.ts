import { Home } from 'lucide-react'
import type { ModuleManifest } from '@wms/domain'

export const homeManifest: ModuleManifest = {
  id: 'home',
  title: 'Главная',
  icon: Home,
  webRoute: '/dashboard',
  mobileRoute: '/m/dashboard',
  roles: ['warehouse_manager', 'agronomist', 'management', 'accountant', 'admin'],
  widgets: [
    { id: 'w-stock', title: 'Остатки', moduleId: 'warehouses', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-deficit', title: 'Дефицит', moduleId: 'supply', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-pending', title: 'Подтверждения', moduleId: 'home', roles: ['warehouse_manager', 'agronomist', 'management', 'admin'] },
    { id: 'w-requests', title: 'Заявки', moduleId: 'supply', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-half-empty', title: 'Полупустая тара', moduleId: 'warehouses', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-disposal', title: 'Утиль', moduleId: 'warehouses', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-docs', title: 'Документы', moduleId: 'reports', roles: ['warehouse_manager', 'management', 'accountant', 'admin'] },
  ],
  documents: [],
  operations: [],
}
