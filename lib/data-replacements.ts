/**
 * Data replacements for transitioning from mechanical engineering to agriculture sector
 * Company: Атамекен-Агро → Агрохолдинг
 *
 * Product mapping: Все продукты переходят на тестовые агро-данные
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

// Тестовые сельскохозяйственные продукты
export const AGRICULTURAL_PRODUCTS = {
  // Кормовые добавки
  FEED_ADDITIVE_1: {
    name: 'Тестовая кормовая добавка 1',
    category: 'Кормовые добавки',
    description: 'Моковая позиция для демонстрации снабжения',
  },
  FEED_ADDITIVE_2: {
    name: 'Тестовая кормовая добавка 2',
    category: 'Кормовые добавки',
    description: 'Моковая позиция для демонстрации заявки',
  },
  FEED_ADDITIVE_3: {
    name: 'Тестовая кормовая добавка 3',
    category: 'Кормовые добавки',
    description: 'Моковая позиция для демонстрации остатков',
  },

  // Пестициды
  PESTICIDE_1: {
    name: 'Тестовый СЗР 1',
    category: 'СЗР',
    description: 'Моковая канистра для демонстрации приемки',
  },
  PESTICIDE_2: {
    name: 'Тестовый СЗР 2',
    category: 'СЗР',
    description: 'Моковая канистра для демонстрации перемещения',
  },
  PESTICIDE_3: {
    name: 'Тестовый СЗР 3',
    category: 'СЗР',
    description: 'Моковая канистра для демонстрации выдачи агроному',
  },

  // Удобрения
  FERTILIZER_1: {
    name: 'Тестовое удобрение 1',
    category: 'Удобрения',
    description: 'Моковая позиция для демонстрации склада',
  },
  FERTILIZER_2: {
    name: 'Тестовое удобрение 2',
    category: 'Удобрения',
    description: 'Моковая позиция для демонстрации сводной заявки',
  },
  FERTILIZER_3: {
    name: 'Тестовое удобрение 3',
    category: 'Удобрения',
    description: 'Моковая позиция для демонстрации отчетов',
  },

  // Гербициды
  HERBICIDE_1: {
    name: 'Тестовый гербицид 1',
    category: 'Гербициды',
    description: 'Моковая позиция для демонстрации движения',
  },
  HERBICIDE_2: {
    name: 'Тестовый гербицид 2',
    category: 'Гербициды',
    description: 'Моковая позиция для демонстрации приемки',
  },
  HERBICIDE_3: {
    name: 'Тестовый гербицид 3',
    category: 'Гербициды',
    description: 'Моковая позиция для демонстрации возврата',
  },

  // Фунгициды
  FUNGICIDE_1: {
    name: 'Тестовый фунгицид 1',
    category: 'Фунгициды',
    description: 'Моковая позиция для демонстрации ТСД',
  },
  FUNGICIDE_2: {
    name: 'Тестовый фунгицид 2',
    category: 'Фунгициды',
    description: 'Моковая позиция для демонстрации документов',
  },
  FUNGICIDE_3: {
    name: 'Тестовый фунгицид 3',
    category: 'Фунгициды',
    description: 'Моковая позиция для демонстрации утилизации',
  },

  // Протравители семян
  SEED_TREATMENT_1: {
    name: 'Тестовый протравитель 1',
    category: 'Обработка семян',
    description: 'Моковая позиция для демонстрации агросценария',
  },
  SEED_TREATMENT_2: {
    name: 'Тестовый протравитель 2',
    category: 'Обработка семян',
    description: 'Моковая позиция для демонстрации заявки',
  },
  SEED_TREATMENT_3: {
    name: 'Тестовый протравитель 3',
    category: 'Обработка семян',
    description: 'Моковая позиция для демонстрации отчетности',
  },

  // Регуляторы роста
  GROWTH_REGULATOR_1: {
    name: 'Тестовый регулятор роста 1',
    category: 'Регуляторы роста',
    description: 'Моковая позиция для демонстрации учета',
  },
  GROWTH_REGULATOR_2: {
    name: 'Тестовый регулятор роста 2',
    category: 'Регуляторы роста',
    description: 'Моковая позиция для демонстрации склада',
  },
  GROWTH_REGULATOR_3: {
    name: 'Тестовый регулятор роста 3',
    category: 'Регуляторы роста',
    description: 'Моковая позиция для демонстрации возврата',
  },
}

// Маппинг компании
export const COMPANY_MAPPING = {
  'атамекен-агро': 'Агрохолдинг',
  'Атамекен-Агро': 'Агрохолдинг',
  'Атамекен': 'Агрохолдинг',
  'KAZFOOD PRODUCTS': 'Агрохолдинг',
  'KAZFOODPRODUCTS': 'Агрохолдинг',
  'Казфуд продактс': 'Агрохолдинг',
  'Казфудпродактс': 'Агрохолдинг',
  'казфуд продактс': 'Агрохолдинг',
  'казфудпродактс': 'Агрохолдинг',
  'SUPPLIER_AUGUST': 'Агрохолдинг',
}

// Маппинг продуктов (замена прямых совпадений)
export const PRODUCT_MAPPING: { [key: string]: any } = {
  // Заменяем старые названия на тестовые
  'Торнадо 540': AGRICULTURAL_PRODUCTS.PESTICIDE_1,
  'NOMENCLATURE_TORNADO': AGRICULTURAL_PRODUCTS.PESTICIDE_1,
}

// Функция для замены названия продукта
export function replaceProductName(oldName: string | null | undefined): string {
  if (!oldName) return 'Тестовый продукт Агрохолдинг'

  // Проверяем маппинг
  const mapped = PRODUCT_MAPPING[oldName]
  if (mapped) return mapped.name

  // Если в названии есть "продукт", заменяем на тестовую позицию
  if (oldName.toLowerCase().includes('продукт')) {
    return 'Тестовая позиция СЗР - Агрохолдинг'
  }

  return oldName
}

// Получение всех продуктов по категориям
const productsByCategory = {
  additive: [AGRICULTURAL_PRODUCTS.FEED_ADDITIVE_1, AGRICULTURAL_PRODUCTS.FEED_ADDITIVE_2, AGRICULTURAL_PRODUCTS.FEED_ADDITIVE_3],
  pesticide: [AGRICULTURAL_PRODUCTS.PESTICIDE_1, AGRICULTURAL_PRODUCTS.PESTICIDE_2, AGRICULTURAL_PRODUCTS.PESTICIDE_3],
  fertilizer: [AGRICULTURAL_PRODUCTS.FERTILIZER_1, AGRICULTURAL_PRODUCTS.FERTILIZER_2, AGRICULTURAL_PRODUCTS.FERTILIZER_3],
  herbicide: [AGRICULTURAL_PRODUCTS.HERBICIDE_1, AGRICULTURAL_PRODUCTS.HERBICIDE_2, AGRICULTURAL_PRODUCTS.HERBICIDE_3],
  fungicide: [AGRICULTURAL_PRODUCTS.FUNGICIDE_1, AGRICULTURAL_PRODUCTS.FUNGICIDE_2, AGRICULTURAL_PRODUCTS.FUNGICIDE_3],
  treatment: [AGRICULTURAL_PRODUCTS.SEED_TREATMENT_1, AGRICULTURAL_PRODUCTS.SEED_TREATMENT_2, AGRICULTURAL_PRODUCTS.SEED_TREATMENT_3],
  regulator: [AGRICULTURAL_PRODUCTS.GROWTH_REGULATOR_1, AGRICULTURAL_PRODUCTS.GROWTH_REGULATOR_2, AGRICULTURAL_PRODUCTS.GROWTH_REGULATOR_3],
}

// Функция для получения агро-продукта по индексу (1, 2, 3...)
export function getAgriculturalProduct(index: number, category: 'additive' | 'pesticide' | 'fertilizer' | 'herbicide' | 'fungicide' | 'treatment' | 'regulator' = 'additive') {
  const products = productsByCategory[category]
  const validIndex = Math.max(0, Math.min(index - 1, products.length - 1))
  return products[validIndex]
}
