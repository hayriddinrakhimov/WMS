'use client'

import type { AppModule } from '@wms/domain'
import { warehousesManifest } from './manifest'
import { WarehousesScreen } from './WarehousesScreen'

export const warehousesModule: AppModule = {
  manifest: warehousesManifest,
  render: (ctx) => <WarehousesScreen {...ctx} />,
}
