import { FileBarChart } from 'lucide-react'
import type { ModuleManifest } from '@wms/domain'

export const reportsManifest: ModuleManifest = {
  id: 'reports',
  title: 'Отчёты',
  icon: FileBarChart,
  webRoute: '/reports',
  mobileRoute: '/m/reports',
  roles: ['warehouse_manager', 'management', 'accountant', 'admin'],
  widgets: [
    { id: 'w-docs', title: 'Документы', moduleId: 'reports', roles: ['warehouse_manager', 'management', 'accountant', 'admin'] },
  ],
  documents: [
    { id: 'report-stock', title: 'Отчёт по остаткам', type: 'report' },
    { id: 'report-movements', title: 'Отчёт по движениям', type: 'report' },
  ],
  operations: [],
}
