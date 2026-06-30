import { registerModule } from '@wms/domain'
import { homeModule } from './home'
import { supplyModule } from './supply'
import { scanningModule } from './scanning'
import { warehousesModule } from './warehouses'
import { reportsModule } from './reports'

let initialized = false

export function initModules() {
  if (initialized) return
  registerModule(homeModule)
  registerModule(supplyModule)
  registerModule(scanningModule)
  registerModule(warehousesModule)
  registerModule(reportsModule)
  initialized = true
}

export { homeModule, supplyModule, scanningModule, warehousesModule, reportsModule }
