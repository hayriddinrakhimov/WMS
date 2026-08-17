/**
 * Integration file for agricultural product replacements
 * Company: KAZFOODPRODUCTS
 * 
 * This file imports and applies all agricultural product mappings
 * to replace mechanical engineering products throughout the system
 */

import {
  AGRICULTURAL_PRODUCTS,
  COMPANY_MAPPING,
  PRODUCT_MAPPING,
  replaceProductName,
  getAgriculturalProduct,
} from './data-replacements'

/**
 * Function to apply all replacements to demo store data
 * Replaces company name and product names in procurement requests, etc.
 */
export function applyAgricultureReplacements(data: any) {
  if (!data) return data

  // Replace company names
  if (data.supplierName) {
    data.supplierName = COMPANY_MAPPING[data.supplierName as keyof typeof COMPANY_MAPPING] || data.supplierName
  }

  if (data.enterpriseName) {
    data.enterpriseName = COMPANY_MAPPING[data.enterpriseName as keyof typeof COMPANY_MAPPING] || data.enterpriseName
  }

  // Replace product names in items
  if (Array.isArray(data.items)) {
    data.items = data.items.map((item: any) => ({
      ...item,
      productName: replaceProductName(item.productName),
    }))
  }

  // Replace in canister product names
  if (data.productName) {
    data.productName = replaceProductName(data.productName)
  }

  return data
}

/**
 * Get agricultural product by category and number
 */
export function getAgroProductByNumber(productNumber: number, category: string = 'additive') {
  const categoryMap: { [key: string]: 'additive' | 'pesticide' | 'fertilizer' | 'herbicide' | 'fungicide' | 'treatment' | 'regulator' } = {
    'добавка': 'additive',
    'additive': 'additive',
    'пестицид': 'pesticide',
    'pesticide': 'pesticide',
    'удобрение': 'fertilizer',
    'fertilizer': 'fertilizer',
    'гербицид': 'herbicide',
    'herbicide': 'herbicide',
    'фунгицид': 'fungicide',
    'fungicide': 'fungicide',
    'протравитель': 'treatment',
    'treatment': 'treatment',
    'регулятор': 'regulator',
    'regulator': 'regulator',
  }

  const normalizedCategory = categoryMap[category.toLowerCase()] || 'additive'
  return getAgriculturalProduct(productNumber, normalizedCategory)
}

export { AGRICULTURAL_PRODUCTS, COMPANY_MAPPING, PRODUCT_MAPPING, replaceProductName, getAgriculturalProduct }
