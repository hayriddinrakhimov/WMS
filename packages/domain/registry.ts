import type { AppModule, ModuleManifest } from './module'
import type { ModuleId, ModuleFilter, UserRole } from './types'

const modules = new Map<ModuleId, AppModule>()

export function registerModule(module: AppModule) {
  modules.set(module.manifest.id, module)
}

export function getModule(id: ModuleId): AppModule | undefined {
  return modules.get(id)
}

export function getAllModules(): AppModule[] {
  return Array.from(modules.values())
}

export function getModulesForRole(role: UserRole): ModuleManifest[] {
  return getAllModules()
    .map((m) => m.manifest)
    .filter((m) => m.roles.includes(role))
}

export function getWidgetsForDashboard(role: UserRole) {
  return getAllModules().flatMap((m) =>
    m.manifest.widgets.filter((w) => w.roles.includes(role)),
  )
}

export function resolveModuleByWebRoute(route: string): ModuleId | null {
  for (const m of getAllModules()) {
    if (m.manifest.webRoute === route || route === m.manifest.id) return m.manifest.id
  }
  return null
}

export function resolveModuleByMobileRoute(route: string): ModuleId | null {
  for (const m of getAllModules()) {
    if (m.manifest.mobileRoute === route) return m.manifest.id
  }
  return null
}

export function resolveScreen(screen: string): ModuleId | null {
  if (modules.has(screen as ModuleId)) return screen as ModuleId
  return resolveModuleByWebRoute(screen) ?? resolveModuleByMobileRoute(screen)
}

export function getNavItemsForRole(role: UserRole) {
  return getModulesForRole(role).map((m) => ({
    id: m.id,
    title: m.title,
    icon: m.icon,
    webRoute: m.webRoute,
    mobileRoute: m.mobileRoute,
  }))
}

export type { ModuleFilter }
