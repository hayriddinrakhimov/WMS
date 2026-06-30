# Архитектура WMS — модули и домен

## Веб-навигация (`lib/web-nav.ts`)

Точка входа веб-кабинета. Инициализирует реестр модулей и экспортирует:

- `WebScreen` — идентификатор активного модуля (`ModuleId`)
- `getWebScreenTitle(screen)` — заголовок вкладки
- `getNavItemsForRole(role)` — пункты бокового меню по роли

## Модули приложения

| ID | Название | Web route | Роли | Назначение |
|----|----------|-----------|------|------------|
| `home` | Главная | `/dashboard` | все | Executive dashboard, KPI, быстрые действия |
| `supply` | Снабжение | `/procurement` | warehouse_manager, management, admin | Спрос, заявки ЗН-xxx, закупки, Упак |
| `warehouses` | Склады | `/warehouses` | warehouse_manager, agronomist, management, admin | Остатки, операции, приёмки ОП-xxx, задания |
| `scanning` | Сканирование | `/scanning` | warehouse_manager, agronomist, management, admin | Веб-интерфейс сканирования |
| `reports` | Отчёты | `/reports` | warehouse_manager, management, accountant, admin | Отчёты, история канистры, PDF |

Каждый модуль регистрируется через `registerModule()` в `packages/domain/registry.ts` и описывается `ModuleManifest` (иконка Lucide, виджеты дашборда, документы, операции).

## Роли (`packages/domain/roles.ts`)

| Роль | Метка | Доступ |
|------|-------|--------|
| `warehouse_manager` | Заведующий склада | Склады, снабжение, ТСД-операции |
| `agronomist` | Агроном | Выдача/возврат, ограниченный склад |
| `management` | Менеджмент | Обзор, KPI, согласования |
| `accountant` | Бухгалтерия | Отчёты |
| `admin` | Администратор | Полный доступ |

## Пакет `@wms/domain` — ключевые сущности

### Упаковка и маркировка

- **Pallet**, **Box**, **Canister** — иерархия SSCC / SGTIN.
- **PackageStatus** — 15+ статусов жизненного цикла канистры.
- **buildUpakHierarchy()** — генерация демо-данных из сценария August Upak.

### Снабжение (`procurement.ts`)

- **ProcurementRequest** — заявки ЗН-xxx (статусы: draft → approved → fulfilled).
- **ConsolidatedDemand**, **SupplierOrder** — сводные и заказы поставщику.
- **ExpectedReceipt** — ожидаемые приёмки ОП-xxx.

### Складские операции

- **WarehouseTask** — задания ОТБ-xxx (отбор, перемещение).
- **advanceCanisterOnScan()** — продвижение статуса канистры по скану на ТСД.
- **resolveScan()** — распознавание SSCC/SGTIN.

### Маршрут канистры (`journey.ts`)

- **CANISTER_JOURNEY_STEPS** — 15 этапов от «Ожидание» до «Готово».
- **getCanisterJourneyInfo(status)** — прогресс %, подсказки для UI.

### Справочники

- **ENTERPRISES** — предприятия холдинга.
- **NOMENCLATURE_TORNADO** — GTIN и название демо-препарата.
- **SUPPLIER_AUGUST** — демо-поставщик.

### Импорт

- **simulateUpakImport()** — загрузка Упак → ОП-001 + 1320 канистр.
- **validateImport()** — валидация файла.

## UI-компоненты (структура)

```
app/                    # Next.js App Router
components/web/         # WebSidebar, WebCabinet, WebMainContent
components/tsd/         # Мобильный shell, задачи, сканер
packages/modules/       # home, supply, warehouses, scanning, reports
lib/demo-store.tsx      # In-memory демо-состояние (заявки, канистры, задачи)
lib/auth.ts             # DEMO_USERS, OTP
```

## Поток данных в демо

1. Seed-заявки (`seed-requests.ts`) — включая **ЗН-006**.
2. Действия пользователя → `demo-store` → обновление канистр/задач.
3. Скан на ТСД → `advanceCanisterOnScan()` → новый статус + запись в history.
4. Dashboard читает агрегаты из demo-store.

## Связь ЗН-006 с канистрой

- ЗН-006 — утверждённый спрос ТОО 1 на 80 л Торнадо для ДС №1.
- После Упак/ОП-001 канистра `341X1302R9S18` проходит отбор по заданию **ОТБ-001**, связанному со спросом.
- Финальная точка — статус `disposed`, отчёт в модуле Отчёты.
