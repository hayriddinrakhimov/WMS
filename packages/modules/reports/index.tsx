'use client'

import type { AppModule } from '@wms/domain'
import { reportsManifest } from './manifest'
import { ReportsScreen } from './ReportsScreen'

export const reportsModule: AppModule = {
  manifest: reportsManifest,
  render: (ctx) => <ReportsScreen {...ctx} />,
}
