import { initModules } from '@wms/modules'
import { getModule } from '@wms/domain'
import type { ModuleId } from '@wms/domain'

initModules()

export type WebScreen = ModuleId

export function getWebScreenTitle(screen: WebScreen) {
  return getModule(screen)?.manifest.title ?? screen
}

export { getNavItemsForRole } from '@wms/domain'
