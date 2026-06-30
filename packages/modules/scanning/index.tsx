import type { AppModule } from '@wms/domain'
import { scanningManifest } from './manifest'
import { ScanningScreen } from './ScanningScreen'

export const scanningModule: AppModule = {
  manifest: scanningManifest,
  render: (ctx) => <ScanningScreen {...ctx} />,
}
