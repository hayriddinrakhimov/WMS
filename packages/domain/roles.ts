import type { LegacyUserRole, UserRole } from './types'

export const ROLE_LABELS: Record<UserRole, string> = {
  warehouse_manager: 'Заведующий склада',
  agronomist: 'Агроном',
  management: 'Менеджмент',
  accountant: 'Бухгалтерия',
  admin: 'Администратор',
}

const LEGACY_TO_ROLE: Record<LegacyUserRole, UserRole> = {
  storekeeper: 'warehouse_manager',
  mol: 'agronomist',
  manager: 'management',
}

export function normalizeRole(role: UserRole | LegacyUserRole): UserRole {
  if (role in LEGACY_TO_ROLE) return LEGACY_TO_ROLE[role as LegacyUserRole]
  return role as UserRole
}

export function canOperateWarehouse(role: UserRole) {
  return role === 'warehouse_manager' || role === 'management' || role === 'admin'
}
