import { ShoppingCart } from 'lucide-react'
import type { ModuleManifest } from '@wms/domain'

export const supplyManifest: ModuleManifest = {
  id: 'supply',
  title: 'Снабжение',
  icon: ShoppingCart,
  webRoute: '/procurement',
  mobileRoute: '/m/procurement',
  roles: ['warehouse_manager', 'management', 'admin'],
  widgets: [
    { id: 'w-deficit', title: 'Дефицит', moduleId: 'supply', roles: ['warehouse_manager', 'management', 'admin'] },
    { id: 'w-requests', title: 'Заявки', moduleId: 'supply', roles: ['warehouse_manager', 'management', 'admin'] },
  ],
  documents: [
    { id: 'procurement-request', title: 'Заявка на закуп', type: 'procurement_request' },
    { id: 'procurement-order', title: 'Заказ поставщику', type: 'procurement_order' },
  ],
  operations: [
    { id: 'procurement_request_create', title: 'Создание заявки', type: 'procurement_request_create' },
    { id: 'procurement_request_approve', title: 'Согласование заявки', type: 'procurement_request_approve' },
    { id: 'procurement_receipt', title: 'Приёмка от поставщика', type: 'procurement_receipt' },
  ],
}
