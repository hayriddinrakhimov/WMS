# Скриншоты пути канистры для Notebook LLM

Демо-канистра: **341X1302R9S18** · Палета: **146700499966112311**

Загрузите эту папку вместе с `notebook-llm-bundle.zip` при генерации презентации.

| № | Файл | Этап | Система | Статус канистры |
|---|------|------|---------|-----------------|
| 1 | `01-web-supply-zn006-approved-consolidation.png` | Снабжение: заявка ЗН-006 и сводная | Веб | — |
| 2 | `02-web-upak-import-expected-receipt-op001.png` | Упак загружен: ожидаемая приёмка ОП-001 | Веб | expected_receipt |
| 3 | `03-tsd-op-receipt-scan-pallet-main-warehouse.png` | ТСД: приёмка ОП на главный склад | ТСД | expected_receipt → in_storage_main |
| 4 | `04-canister-on-main-warehouse-storage.png` | Канистра на главном складе после ОП | Веб | — |
| 5 | `05-web-create-transfer-main-to-child-ds1.png` | Веб: создание перемещения ГС → ДС №1 | Веб | — |
| 6 | `06-tsd-transfer-shipment-from-main-warehouse.png` | ТСД: отгрузка с главного склада | ТСД | in_storage_main → in_transit_child |
| 7 | `07-tsd-transfer-receipt-child-warehouse-ds1.png` | ТСД: приёмка на дочернем складе №1 | ТСД | in_transit_child → in_storage_child |
| 8 | `08-tsd-issue-canister-to-agronomist.png` | ТСД: выдача канистры агроному | ТСД | in_storage_child → issued_agronomist |
| 9 | `09-tsd-return-empty-canister-from-field.png` | ТСД: возврат пустой тары с поля | ТСД | issued_agronomist → returned_empty |
| 10 | `10-tsd-return-approval-by-warehouse-manager.png` | ТСД: одобрение возврата завскладом | ТСД | returned_empty · принято на ДС |
| 11 | `11-tsd-disposal-handoff-empty-container.png` | ТСД: передача пустой тары на утиль | ТСД | returned_empty → for_disposal_child |
| 12 | `12-canister-disposed-lifecycle-complete.png` | Канистра утилизирована — цикл завершён | Веб | — |

## Порядок в презентации

Используй файлы **строго по номеру** 01 → 12 как визуальный ряд сценария.