import { ScanLine } from 'lucide-react'
import type { ModuleManifest } from '@wms/domain'

export const scanningManifest: ModuleManifest = {
  id: 'scanning',
  title: 'Сканирование',
  icon: ScanLine,
  webRoute: '/scanning',
  mobileRoute: '/m/scanning',
  roles: ['warehouse_manager', 'agronomist', 'management', 'admin'],
  widgets: [],
  documents: [],
  operations: [],
}
