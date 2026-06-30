'use client'

import type { AppModule } from '@wms/domain'
import { homeManifest } from './manifest'
import { DashboardScreen } from './DashboardScreen'

export const homeModule: AppModule = {
  manifest: homeManifest,
  render: (ctx) => <DashboardScreen {...ctx} />,
}
