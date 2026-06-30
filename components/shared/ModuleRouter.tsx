'use client'

import { getModule } from '@wms/domain'
import { initModules } from '@wms/modules'
import { useDemoStore } from '@/lib/demo-store'

initModules()

export function ModuleRouter() {
  const { webScreen, webFilter, webUser, navigateWeb } = useDemoStore()
  const mod = getModule(webScreen)
  if (!mod) return null
  return (
    <>
      {mod.render({
        user: webUser,
        filter: webFilter,
        onNavigate: navigateWeb,
      })}
    </>
  )
}
