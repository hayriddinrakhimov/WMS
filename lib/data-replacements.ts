/**
 * Data replacements for transitioning from mechanical engineering to agriculture sector
 * Company: атамекен-агро → KAZFOODPRODUCTS
 * 
 * Product mapping: Все продукты переходят на агросферу
 * - Добавки кормовые (1, 2, 3...)
 * - Пестициды (1, 2, 3...)
 * - Удобрения (1, 2, 3...)
 * - Гербициды (1, 2, 3...)
 * - Фунгициды (1, 2, 3...)
 * - Протравители (1, 2, 3...)
 */

// Старые продукты машиностроения (для поиска и замены)
export const MECHANICAL_PRODUCTS = {
  PRODUCT_1: 'Продукт 1',
  PRODUCT_2: 'Продукт 2',
  PRODUCT_3: 'Продукт 3',
  TORNADO: 'Торнадо 540',
}

// Новые сельскохозяйственные продукты
export const AGRICULTURAL_PRODUCTS = {
  // Кормовые добавки
  FEED_ADDITIVE_1: {
    name: 'Добавка кормовая 1 - Виттаспорин',
    category: 'Кормовые добавки',
    description: 'Пробиотическая добавка для животных',
  },
  FEED_ADDITIVE_2: {
    name: 'Добавка кормовая 2 - Монензин',
    category: 'Кормовые добавки',
    description: 'Стимулятор роста молодняка',
  },
  FEED_ADDITIVE_3: {
    name: 'Добавка кормовая 3 - Премикс витаминно-минеральный',
    category: 'Кормовые добавки',
    description: 'Источник витаминов и микроэлементов',
  },

  // Пестициды
  PESTICIDE_1: {
    name: 'Пестицид 1 - Амистар Экстра',
    category: 'Пестициды',
    description: 'Фунгицид широкого спектра действия',
  },
  PESTICIDE_2: {
    name: 'Пестицид 2 - Фастак',
    category: 'Пестициды',
    description: 'Инсектицид для защиты от вредителей',
  },
  PESTICIDE_3: {
    name: 'Пестицид 3 - Децис Эксперт',
    category: 'Пестициды',
    description: 'Инсектоакарицид комбинированный',
  },

  // Удобрения
  FERTILIZER_1: {
    name: 'Удобрение 1 - Азофоска (16-16-16)',
    category: 'Удобрения',
    description: 'Комплексное минеральное удобрение',
  },
  FERTILIZER_2: {
    name: 'Удобрение 2 - Нитрофоска (10-10-10)',
    category: 'Удобрения',
    description: 'Универсальное удобрение',
  },
  FERTILIZER_3: {
    name: 'Удобрение 3 - Суперфосфат двойной',
    category: 'Удобрения',
    description: 'Фосфорное удобрение длительного действия',
  },

  // Гербициды
  HERBICIDE_1: {
    name: 'Гербицид 1 - Раундап',
    category: 'Гербициды',
    description: 'Универсальный гербицид сплошного действия',
  },
  HERBICIDE_2: {
    name: 'Гербицид 2 - Титус',
    category: 'Гербициды',
    description: 'Селективный гербицид для зерновых',
  },
  HERBICIDE_3: {
    name: 'Гербицид 3 - Зенкор',
    category: 'Гербициды',
    description: 'Гербицид для пропашных культур',
  },

  // Фунгициды
  FUNGICIDE_1: {
    name: 'Фунгицид 1 - Анторакол',
    category: 'Фунгициды',
    description: 'Фунгицид от болезней листьев',
  },
  FUNGICIDE_2: {
    name: 'Фунгицид 2 - Тилт',
    category: 'Фунгициды',
    description: 'Фунгицид системного действия',
  },
  FUNGICIDE_3: {
    name: 'Фунгицид 3 - Бавистин',
    category: 'Фунгициды',
    description: 'Фунгицид контактного действия',
  },

  // Протравители семян
  SEED_TREATMENT_1: {
    name: 'Протравитель 1 - Винцит Ультра',
    category: 'Обработка семян',
    description: 'Протравитель для зерновых культур',
  },
  SEED_TREATMENT_2: {
    name: 'Протравитель 2 - Коронет',
    category: 'Обработка семян',
    description: 'Протравитель комбинированный',
  },
  SEED_TREATMENT_3: {
    name: 'Протравитель 3 - ТМТД',
    category: 'Обработка семян',
    description: 'Фунгицид для предпосевной обработки',
  },

  // Регуляторы роста
  GROWTH_REGULATOR_1: {
    name: 'Регулятор роста 1 - Эпин-Экстра',
    category: 'Регуляторы роста',
    description: 'Адаптоген для растений',
  },
  GROWTH_REGULATOR_2: {
    name: 'Регулятор роста 2 - Циркон',
    category: 'Регуляторы роста',
    description: 'Природный регулятор роста',
  },
  GROWTH_REGULATOR_3: {
    name: 'Регулятор роста 3 - Гибберелины',
    category: 'Регуляторы роста',
    description: 'Растительный гормон для активизации роста',
  },
}

// Маппинг компании
export const COMPANY_MAPPING = {
  'атамекен-агро': 'KAZFOODPRODUCTS',
  'Атамекен-Агро': 'KAZFOODPRODUCTS',
  'Атамекен': 'KAZFOODPRODUCTS',
  'SUPPLIER_AUGUST': 'KAZFOODPRODUCTS',
}

// Маппинг продуктов (замена прямых совпадений)
export const PRODUCT_MAPPING: { [key: string]: typeof AGRICULTURAL_PRODUCTS[keyof typeof AGRICULTURAL_PRODUCTS] | null } = {
  // Заменяем старые названия на новые
  'Торнадо 540': AGRICULTURAL_PRODUCTS.PESTICIDE_1,
  'NOMENCLATURE_TORNADO': AGRICULTURAL_PRODUCTS.PESTICIDE_1,
}

// Функция для замены названия продукта
export function replaceProductName(oldName: string | null | undefined): string {
  if (!oldName) return 'Продукт KAZFOODPRODUCTS'

  // Проверяем маппинг
  const mapped = PRODUCT_MAPPING[oldName]
  if (mapped) return mapped.name

  // Если в названии есть "продукт", заменяем на добавку
  if (oldName.toLowerCase().includes('продукт')) {
    return 'Добавка кормовая - KAZFOODPRODUCTS'
  }

  return oldName
}

// Функция для получения агро-продукта по индексу (1, 2, 3...)
export function getAgriculturalProduct(index: number, category: 'additive' | 'pesticide' | 'fertilizer' | 'herbicide' | 'fungicide' | 'treatment' | 'regulator' = 'additive') {
  const categoryMap: { [key: string]: keyof typeof AGRICULTURAL_PRODUCTS } = {
    additive: `FEED_ADDITIVE_${Math.max(1, index)}`,
    pesticide: `PESTICIDE_${Math.max(1, index)}`,
    fertilizer: `FERTILIZER_${Math.max(1, index)}`,
    herbicide: `HERBICIDE_${Math.max(1, index)}`,
    fungicide: `FUNGICIDE_${Math.max(1, index)}`,
    treatment: `SEED_TREATMENT_${Math.max(1, index)}`,
    regulator: `GROWTH_REGULATOR_${Math.max(1, index)}`,
  }

  const key = categoryMap[category] as keyof typeof AGRICULTURAL_PRODUCTS
  return AGRICULTURAL_PRODUCTS[key]
}
