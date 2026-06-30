import type { LucideIcon } from 'lucide-react'
import type { ModuleId, ModuleRenderContext, UserRole } from './types'
import type { ReactNode } from 'react'

export interface DashboardWidget {
  id: string
  title: string
  moduleId: ModuleId
  roles: UserRole[]
}

export interface ModuleDocument {
  id: string
  title: string
  type: string
}

export interface ModuleOperation {
  id: string
  title: string
  type: string
}

export interface ModuleManifest {
  id: ModuleId
  title: string
  icon: LucideIcon
  webRoute: string
  mobileRoute: string
  roles: UserRole[]
  widgets: DashboardWidget[]
  documents: ModuleDocument[]
  operations: ModuleOperation[]
}

export interface AppModule {
  manifest: ModuleManifest
  render: (ctx: ModuleRenderContext) => ReactNode
}
