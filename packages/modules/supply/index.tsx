'use client'

import type { AppModule } from '@wms/domain'
import { supplyManifest } from './manifest'
import { ProcurementScreen } from './ProcurementScreen'

export const supplyModule: AppModule = {
  manifest: supplyManifest,
  render: (ctx) => <ProcurementScreen {...ctx} />,
}
