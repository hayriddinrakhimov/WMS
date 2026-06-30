export interface CatalogProduct {
  code: string
  name: string
  unit: 'л' | 'кг'
  price: number
  /** Объём канистры, л */
  volumeLiters?: number
  canistersPerBox?: number
  canistersPerPallet?: number
  /** Вес мешка семян, кг */
  bagWeightKg?: number
  bagsPerBox?: number
  boxesPerPallet?: number
}

export const REQUEST_CATALOG: CatalogProduct[] = [
  {
    code: '40002912',
    name: 'Торнадо 540, ВР',
    unit: 'л',
    price: 2850,
    volumeLiters: 10,
    canistersPerBox: 2,
    canistersPerPallet: 60,
  },
  {
    code: '40001881',
    name: 'Продукт 1',
    unit: 'л',
    price: 1920,
    volumeLiters: 10,
    canistersPerBox: 2,
    canistersPerPallet: 60,
  },
  {
    code: '40003105',
    name: 'Продукт 2',
    unit: 'л',
    price: 2100,
    volumeLiters: 10,
    canistersPerBox: 2,
    canistersPerPallet: 60,
  },
  {
    code: '40002744',
    name: 'Продукт 3',
    unit: 'л',
    price: 3400,
    volumeLiters: 5,
    canistersPerBox: 4,
    canistersPerPallet: 120,
  },
  {
    code: '40003390',
    name: 'Продукт 4',
    unit: 'л',
    price: 4200,
    volumeLiters: 5,
    canistersPerBox: 4,
    canistersPerPallet: 120,
  },
  {
    code: '40002117',
    name: 'Продукт 5',
    unit: 'л',
    price: 5100,
    volumeLiters: 5,
    canistersPerBox: 4,
    canistersPerPallet: 120,
  },
  {
    code: '70001102',
    name: 'Продукт 6',
    unit: 'кг',
    price: 890,
    bagWeightKg: 25,
    bagsPerBox: 4,
    boxesPerPallet: 20,
  },
  {
    code: '70001188',
    name: 'Продукт 7',
    unit: 'кг',
    price: 1250,
    bagWeightKg: 25,
    bagsPerBox: 4,
    boxesPerPallet: 20,
  },
]

export function getCatalogProduct(code: string) {
  return REQUEST_CATALOG.find((p) => p.code === code)
}

/** Подтягивает актуальные названия из каталога (для миграции сохранённых заявок). */
export function catalogNameForCode(code: string, fallback: string) {
  return getCatalogProduct(code)?.name ?? fallback
}

export function searchCatalog(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return REQUEST_CATALOG
  return REQUEST_CATALOG.filter(
    (p) => p.name.toLowerCase().includes(q) || p.code.includes(q),
  )
}
