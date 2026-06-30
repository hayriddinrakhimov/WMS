import {
  buildRequestDocuments,
  calcRequestFulfillment,
  type ProcurementRequest,
} from '@wms/domain'
import { getEnterpriseName } from '@wms/domain'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dueIn(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildSeedProcurementRequests(): ProcurementRequest[] {
  const mk = (
    partial: Omit<ProcurementRequest, 'fulfillmentPercent' | 'documents'> & {
      fulfillmentPercent?: number
    },
  ): ProcurementRequest => {
    const fulfillmentPercent =
      partial.fulfillmentPercent ?? calcRequestFulfillment(partial.items)
    return {
      ...partial,
      fulfillmentPercent,
      documents: buildRequestDocuments(partial.status),
    }
  }

  return [
    mk({
      id: 'pr-seed-001',
      number: 'ЗН-001',
      enterpriseId: 'ent-hq',
      enterpriseName: getEnterpriseName('ent-hq'),
      warehouseId: 'wh-1',
      warehouseName: 'Главный склад',
      status: 'fulfilled',
      createdAt: daysAgo(28),
      submittedAt: daysAgo(27),
      dueDate: dueIn(-5),
      createdBy: 'Иванов А.С.',
      createdById: 'user-1',
      comment: 'Плановая закупка на весну',
      items: [
        {
          productCode: '40002912',
          productName: 'Торнадо 540, ВР',
          quantity: 350,
          unit: 'л',
          price: 2850,
          receivedQty: 350,
          receiptNumber: 'ОП-001',
        },
        {
          productCode: '40001881',
          productName: 'Продукт 1',
          quantity: 120,
          unit: 'л',
          price: 1920,
          receivedQty: 120,
          receiptNumber: 'ОП-001',
        },
      ],
    }),
    mk({
      id: 'pr-seed-002',
      number: 'ЗН-002',
      enterpriseId: 'ent-hq',
      enterpriseName: getEnterpriseName('ent-hq'),
      status: 'partially_fulfilled',
      createdAt: daysAgo(14),
      submittedAt: daysAgo(13),
      dueDate: dueIn(7),
      createdBy: 'Иванов А.С.',
      createdById: 'user-1',
      items: [
        {
          productCode: '40003105',
          productName: 'Продукт 2',
          quantity: 200,
          unit: 'л',
          price: 2100,
          receivedQty: 120,
          receiptNumber: 'ОП-002',
        },
      ],
    }),
    mk({
      id: 'pr-seed-003',
      number: 'ЗН-003',
      enterpriseId: 'ent-ast',
      enterpriseName: getEnterpriseName('ent-ast'),
      warehouseId: 'wh-field-1',
      warehouseName: 'Дочерний склад №1',
      status: 'fulfilled',
      createdAt: daysAgo(21),
      submittedAt: daysAgo(20),
      dueDate: dueIn(-3),
      createdBy: 'Ким В.Р.',
      createdById: 'user-2',
      items: [
        {
          productCode: '40002744',
          productName: 'Продукт 3',
          quantity: 80,
          unit: 'л',
          price: 3400,
          receivedQty: 80,
          receiptNumber: 'ОП-003',
        },
      ],
    }),
    mk({
      id: 'pr-seed-004',
      number: 'ЗН-004',
      enterpriseId: 'ent-ast',
      enterpriseName: getEnterpriseName('ent-ast'),
      status: 'submitted',
      createdAt: daysAgo(2),
      submittedAt: daysAgo(2),
      dueDate: dueIn(14),
      createdBy: 'Ким В.Р.',
      createdById: 'user-2',
      comment: 'Срочно к началу обработки',
      items: [
        {
          productCode: '40002912',
          productName: 'Торнадо 540, ВР',
          quantity: 150,
          unit: 'л',
          price: 2850,
          receivedQty: 0,
        },
        {
          productCode: '40003390',
          productName: 'Продукт 4',
          quantity: 40,
          unit: 'л',
          price: 4200,
          receivedQty: 0,
        },
      ],
    }),
    mk({
      id: 'pr-seed-005',
      number: 'ЗН-005',
      enterpriseId: 'ent-shy',
      enterpriseName: getEnterpriseName('ent-shy'),
      status: 'draft',
      createdAt: daysAgo(0),
      dueDate: dueIn(21),
      createdBy: 'Петров К.Н.',
      createdById: 'user-3',
      items: [
        {
          productCode: '40002117',
          productName: 'Продукт 5',
          quantity: 60,
          unit: 'л',
          price: 5100,
          receivedQty: 0,
        },
      ],
    }),
    mk({
      id: 'pr-seed-006',
      number: 'ЗН-006',
      enterpriseId: 'ent-too-1',
      enterpriseName: getEnterpriseName('ent-too-1'),
      warehouseId: 'wh-field-1',
      warehouseName: 'Дочерний склад №1',
      status: 'approved',
      createdAt: daysAgo(5),
      submittedAt: daysAgo(4),
      dueDate: dueIn(10),
      createdBy: 'Иванов А.С.',
      createdById: 'user-1',
      comment: 'Демо: спрос на ДС №1',
      items: [
        {
          productCode: '40002912',
          productName: 'Торнадо 540, ВР',
          quantity: 80,
          unit: 'л',
          price: 2850,
          receivedQty: 0,
          warehouseId: 'wh-field-1',
          warehouseName: 'Дочерний склад №1',
        },
      ],
    }),
    mk({
      id: 'pr-seed-007',
      number: 'ЗН-007',
      enterpriseId: 'ent-too-2',
      enterpriseName: getEnterpriseName('ent-too-2'),
      warehouseId: 'wh-field-2',
      warehouseName: 'Дочерний склад №2',
      status: 'approved',
      createdAt: daysAgo(4),
      submittedAt: daysAgo(3),
      dueDate: dueIn(12),
      createdBy: 'Иванов А.С.',
      createdById: 'user-1',
      comment: 'Демо: спрос на ДС №2',
      items: [
        {
          productCode: '40001881',
          productName: 'Продукт 1',
          quantity: 60,
          unit: 'л',
          price: 1920,
          receivedQty: 0,
          warehouseId: 'wh-field-2',
          warehouseName: 'Дочерний склад №2',
        },
      ],
    }),
    mk({
      id: 'pr-seed-008',
      number: 'ЗН-008',
      enterpriseId: 'ent-too-2',
      enterpriseName: getEnterpriseName('ent-too-2'),
      status: 'draft',
      createdAt: daysAgo(1),
      dueDate: dueIn(18),
      createdBy: 'Иванов А.С.',
      createdById: 'user-1',
      items: [
        {
          productCode: '40001881',
          productName: 'Продукт 1',
          quantity: 40,
          unit: 'л',
          price: 1920,
          receivedQty: 0,
        },
      ],
    }),
  ]
}
