import type { ConsolidatedDemand, ProcurementRequest, SupplierOrder } from '@wms/domain'
import { getCatalogProduct } from './request-catalog'
import type { SupplyItemsTableRow } from './SupplyItemsTable'

type SupplierRow =
  | { kind: 'consolidated'; data: ConsolidatedDemand }
  | { kind: 'supplier_order'; data: SupplierOrder }

export function linkedRequestsForRow(
  row: SupplierRow,
  procurementRequests: ProcurementRequest[],
  consolidatedDemands: ConsolidatedDemand[],
) {
  if (row.kind === 'consolidated') {
    return procurementRequests.filter((r) => row.data.requestIds.includes(r.id))
  }
  const requestIds = new Set(
    consolidatedDemands
      .filter((d) => row.data.consolidatedDemandIds.includes(d.id))
      .flatMap((d) => d.requestIds),
  )
  return procurementRequests.filter((r) => requestIds.has(r.id))
}

export function supplierOrderLineRows(
  order: SupplierOrder,
  consolidatedDemands: ConsolidatedDemand[],
  procurementRequests: ProcurementRequest[],
): SupplyItemsTableRow[] {
  const linked = linkedRequestsForRow(
    { kind: 'supplier_order', data: order },
    procurementRequests,
    consolidatedDemands,
  )

  return order.items.map((item) => {
    const matchedItems = linked.flatMap((r) =>
      r.items.filter((i) => i.productCode === item.productCode),
    )
    const receivedQty = matchedItems.reduce((sum, i) => sum + i.receivedQty, 0)
    const receiptNumbers = [
      ...new Set(
        matchedItems
          .map((i) => i.receiptNumber)
          .filter((value): value is string => Boolean(value)),
      ),
    ]
    const requestNumbers = linked
      .filter((r) => r.items.some((i) => i.productCode === item.productCode))
      .map((r) => r.number)

    return {
      productCode: item.productCode,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      price: getCatalogProduct(item.productCode)?.price ?? 0,
      receivedQty,
      receiptNumbers,
      requestNumbers,
    }
  })
}

export function procurementRequestLineRows(request: ProcurementRequest): SupplyItemsTableRow[] {
  return request.items.map((item) => ({
    productCode: item.productCode,
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    receivedQty: item.receivedQty,
    receiptNumbers: item.receiptNumber ? [item.receiptNumber] : [],
  }))
}
