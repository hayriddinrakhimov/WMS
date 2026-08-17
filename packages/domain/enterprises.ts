export interface Enterprise {
  id: string
  name: string
  shortName: string
  /** Дочернее ТОО внутри головного предприятия */
  parentId?: string
}

export const ENTERPRISES: Enterprise[] = [
  { id: 'ent-hq', name: 'KAZFOOD PRODUCTS (головное)', shortName: 'Головное' },
  { id: 'ent-too-1', name: 'ТОО 1', shortName: 'ТОО 1', parentId: 'ent-hq' },
  { id: 'ent-too-2', name: 'ТОО 2', shortName: 'ТОО 2', parentId: 'ent-hq' },
  { id: 'ent-ast', name: 'Филиал Астана', shortName: 'Астана' },
  { id: 'ent-shy', name: 'Филиал Шымкент', shortName: 'Шымкент' },
]

export function getEnterpriseById(id: string) {
  return ENTERPRISES.find((e) => e.id === id)
}

export function getEnterpriseName(id: string) {
  return getEnterpriseById(id)?.name ?? id
}

const WAREHOUSE_LABELS: Record<string, string> = {
  'wh-1': 'Главный склад',
  'wh-field-1': 'Дочерний склад №1',
  'wh-field-2': 'Дочерний склад №2',
}

/** Склад назначения заявки по предприятию (демо: ТОО → дочерний склад). */
export const ENTERPRISE_TARGET_WAREHOUSE: Record<string, string> = {
  'ent-hq': 'wh-1',
  'ent-too-1': 'wh-field-1',
  'ent-too-2': 'wh-field-2',
  'ent-ast': 'wh-field-1',
  'ent-shy': 'wh-field-2',
}

export function targetWarehouseForEnterprise(enterpriseId: string): {
  id: string
  name: string
} {
  const id = ENTERPRISE_TARGET_WAREHOUSE[enterpriseId] ?? 'wh-field-1'
  return { id, name: WAREHOUSE_LABELS[id] ?? id }
}

export function warehouseAssigneeGroup(warehouseId: string): string {
  if (warehouseId === 'wh-field-2') return 'Кладовщики ДС №2'
  if (warehouseId === 'wh-field-1') return 'Кладовщики ДС №1'
  return 'Кладовщики ГС'
}

/** Значение фильтра «все предприятия» в разделе снабжения. */
export const ALL_ENTERPRISES_FILTER = 'all'

/** Головное предприятие и его дочерние ТОО для выпадающего списка. */
export function getSelectableEnterprises(rootId: string): Enterprise[] {
  const root = getEnterpriseById(rootId)
  if (!root) return []
  const children = ENTERPRISES.filter((e) => e.parentId === rootId)
  return children.length ? [root, ...children] : [root]
}

export function selectableEnterprisesForUser(_user: {
  role: string
  enterpriseId?: string
} | null): Enterprise[] {
  return ENTERPRISES
}
