import type { User, Warehouse } from '@wms/domain'
import { ROLE_LABELS, normalizeRole } from '@wms/domain'

export { ROLE_LABELS, normalizeRole }

export const WAREHOUSES: Warehouse[] = [
  { id: 'wh-1', name: 'Главный склад', type: 'main' },
  { id: 'wh-field-1', name: 'Дочерний склад №1', type: 'child' },
  { id: 'wh-field-2', name: 'Дочерний склад №2', type: 'child' },
]

export const DEMO_USERS: User[] = [
  {
    id: 'user-1',
    otp: '111',
    name: 'Иванов А.С.',
    role: 'warehouse_manager',
    warehouseId: 'wh-1',
    enterpriseId: 'ent-hq',
  },
  {
    id: 'user-2',
    otp: '222',
    name: 'Ким В.Р.',
    role: 'warehouse_manager',
    warehouseId: 'wh-field-1',
    enterpriseId: 'ent-ast',
  },
  {
    id: 'user-3',
    otp: '333',
    name: 'Петров К.Н.',
    role: 'agronomist',
    enterpriseId: 'ent-shy',
  },
  {
    id: 'user-4',
    otp: '444',
    name: 'Сидоров М.В.',
    role: 'management',
    warehouseId: 'wh-1',
    enterpriseId: 'ent-hq',
  },
  {
    id: 'user-5',
    otp: '555',
    name: 'Алиева Д.К.',
    role: 'accountant',
  },
  {
    id: 'user-6',
    otp: '666',
    name: 'Нурланов Е.Т.',
    role: 'admin',
    warehouseId: 'wh-1',
    enterpriseId: 'ent-hq',
  },
]

export function authenticateByOtp(code: string): User | null {
  return DEMO_USERS.find((u) => u.otp === code) ?? null
}

export function getUserById(id: string): User | null {
  return DEMO_USERS.find((u) => u.id === id) ?? null
}

export function getWarehouseName(id?: string) {
  if (!id) return undefined
  return WAREHOUSES.find((w) => w.id === id)?.name
}
