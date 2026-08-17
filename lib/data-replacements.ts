/**
 * Data replacements for transitioning from mechanical engineering to agriculture sector
 * Company: атамекен-агро → KAZFOODPRODUCTS
 */

// Mechanical engineering products (OLD)
export const MECHANICAL_PRODUCTS = {
  TORNADO: { name: 'Торнадо 540', category: 'Двигатель' },
  PUMP: { name: 'Насос ЦНС 60-297', category: 'Гидравлика' },
  REDUCER: { name: 'Редуктор цилиндрический', category: 'Передача' },
  COMPRESSOR: { name: 'Компрессор 4ВУ1.5-0.7', category: 'Воздушный' },
}

// Agricultural products (NEW)
export const AGRICULTURAL_PRODUCTS = {
  SEED_FERTILIZER: { name: 'Удобрение комплексное', category: 'Удобрение' },
  PESTICIDE: { name: 'Инсектицид Амистар Экстра', category: 'Пестицид' },
  HERBICIDE: { name: 'Гербицид Раундап', category: 'Гербицид' },
  FUNGICIDE: { name: 'Фунгицид Анторакол', category: 'Фунгицид' },
  FEED_ADDITIVE: { name: 'Кормовая добавка Виттаспорин', category: 'Кормовые добавки' },
  SEED_TREATMENT: { name: 'Протравитель Винцит Ультра', category: 'Обработка семян' },
  GROWTH_REGULATOR: { name: 'Регулятор роста растений Эпин-Экстра', category: 'Регуляторы роста' },
}

export const COMPANY_MAPPING = {
  'атамекен-агро': 'KAZFOODPRODUCTS',
  'Атамекен-Агро': 'KAZFOODPRODUCTS',
  'Атамекен': 'KAZFOODPRODUCTS',
}
