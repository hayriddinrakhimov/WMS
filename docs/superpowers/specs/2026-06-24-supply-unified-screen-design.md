# Supply Module — Unified Screen Design Spec

**Date:** 2026-06-24  
**Status:** Approved  
**Module:** Снабжение (`supply`)

---

## Overview

Consolidate the current three-part Supply module (Задачи / Сводная / Упак) into a single screen at `/supply` with two in-toolbar tabs: **Спрос** and **Заявки поставщику**. Procurement requests flow into consolidated demands, then into supplier orders; UPak upload moves into document modals on supplier orders. Sidebar navigation shows only «Снабжение» — no sub-items, no landing cards.

### Current state (baseline)

| Area | Current implementation |
|------|------------------------|
| Screen | `packages/modules/supply/ProcurementScreen.tsx` — landing + 3 sub-tabs (`requests`, `consolidated`, `upak`) |
| Requests | `packages/modules/supply/RequestsPanel.tsx` — table + modals, no row checkboxes |
| Consolidated | `packages/modules/supply/ConsolidatedPanel.tsx` — internal sub-tabs «На согласовании» / «Сформированные» |
| Sidebar | `components/shared/AppNav.tsx` + `SUPPLY_SUBNAV` in `lib/work-tabs.ts` |
| Domain | `packages/domain/procurement.ts` — `ProcurementRequest`, `ConsolidatedDemand` |
| Store | `lib/demo-store.tsx` — `createConsolidatedDemand`, `approveConsolidatedDemand`, `simulateUpakUpload` |
| Toasts | Custom `components/ui/Toaster.tsx` (not Sonner; `sonner` not in `package.json`) |

---

## Goals

1. **Single entry point** — one screen, no landing page, no sidebar sub-navigation.
2. **Clear procurement pipeline** — Спрос → Сводная (internal) → Заявка поставщику → UPak → ожидаемая приёмка.
3. **Contextual actions** — toolbar button switches between «Создать заявку» and «Сформировать» based on tab and selection.
4. **Return workflow** — consolidated drafts can be returned to source requests with mandatory comment.
5. **Unified feedback** — Sonner toasts (top-center) on key transitions.
6. **Remove dead UI** — delete UPak screen, ConsolidatedPanel as standalone module view, landing cards.

---

## Navigation

### Sidebar

- **Keep:** single nav item «Снабжение» (`moduleId: 'supply'`).
- **Remove:** expandable sub-items (Задачи / Сводная / Упак) from `SUPPLY_SUBNAV`.
- **Remove:** `ChevronDown` expand/collapse behavior for supply in `AppNav.tsx`.
- **Click behavior:** navigate directly to `/supply` list view (no `view: 'landing'`).

### Route / work-tab filter

```ts
// New default filter for supply module
{ moduleId: 'supply', filter: { tab: 'demand', view: 'list' } }
```

| Tab key | UI label | Replaces |
|---------|----------|----------|
| `demand` | Спрос | `requests` (Задачи) |
| `supplier` | Заявки поставщику | `consolidated` + `upak` |

- **Remove:** `view: 'landing'` for supply.
- **Remove:** `filter.tab` values `consolidated`, `upak`, `requests` (migrate to `demand` / `supplier`).
- Deep links (`view: 'create'`, `view: 'detail'`, `requestId`) remain on Спрос tab only.

### UI renames

| Old label | New label | Notes |
|-----------|-----------|-------|
| Задачи | **Спрос** | User-facing tab name |
| Сводная | *(internal)* | Visible only as rows `СВ-XXX` on «Заявки поставщику» tab |
| Упак | *(removed as screen)* | UPak upload lives in supplier-order document modal |

---

## Toolbar Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ Предприятие ▼ ]    [ 📋 Спрос | 📦 Заявки поставщику ]    [ Action btn ] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Left: Enterprise selector

- Reuse existing `ModuleToolbar` enterprise `<select>` from `ProcurementScreen.tsx`.
- Filters table data on active tab by `enterpriseId` where applicable.

### Center: Icon tabs

- Two icon+label tab buttons (not URL segments in sidebar — in-toolbar only).
- Icons (suggested): `ClipboardList` for Спрос, `Truck` or `FileBox` for Заявки поставщику.
- Active tab styling consistent with existing `supply-requests__tab--active` or `ModuleToolbar` patterns.
- Tab switch preserves enterprise selection; clears incompatible selections (request checkboxes vs consolidation checkboxes).

### Right: Contextual action button

| Tab | Selection | Button label | Action |
|-----|-----------|--------------|--------|
| Спрос | 0 rows checked | **Создать заявку** | Open create-request modal (`RequestsPanel.openCreate`) |
| Спрос | ≥1 row checked (`submitted`) | **Сформировать** | `createConsolidatedDemand(selectedIds)` → variant B flow (below) |
| Заявки поставщику | 0 rows checked | *(none or disabled)* | — |
| Заявки поставщику | ≥1 approved consolidation checked | **Сформировать** | `createSupplierOrder(selectedConsolidationIds)` |

- Replace / extend `SupplyActionButtons.tsx` for new tab keys and supplier-tab logic.
- On Спрос tab, keep optional due-date filter in toolbar right area (before action button).

---

## Tab: Спрос (ProcurementRequest)

### Table

- Reuse `RequestsPanel` table columns: № заявки, Время подачи, Статус, Удовлетворение, Срок выдачи, Снабженец.
- **Add checkbox column** (first column) — visible and enabled **only** for rows with status `submitted` («На согласовании»).
- Row click (outside checkbox) opens existing detail/create modal — unchanged behavior.
- Checkbox click does not open modal (`stopPropagation`).

### Modals

- **Create modal** — existing `RequestWorkspaceModal` + create form (positions, documents, comments).
- **Detail modal** — existing detail view with tabs «Позиции заказа» / «Документы».
- No changes to catalog, demand-hint, or unit conversion logic.

### «Сформировать» flow (variant B — approved)

When user selects ≥1 `submitted` request and clicks **Сформировать**:

1. Call `createConsolidatedDemand(requestIds)` — creates `ConsolidatedDemand` with status `draft`, number `СВ-XXX`.
2. Source requests transition to `in_consolidated`.
3. **Switch toolbar tab** to «Заявки поставщику» (`tab: 'supplier'`).
4. **Do NOT** auto-open any modal.
5. New `СВ-XXX` row appears in supplier tab table (optional brief row highlight, ~2s).
6. Toast (top-center): `Сводная СВ-003 создана` (use actual number).

---

## Tab: Заявки поставщику

### Table contents

Single unified table showing two entity types (discriminated by `kind` or separate columns):

| Column | ConsolidatedDemand | SupplierOrder |
|--------|-------------------|---------------|
| № | `СВ-XXX` | `ЗП-XXX` |
| Тип | «Сводная» | «Заявка поставщику» |
| Статус | draft / approved | draft / sent / awaiting_delivery / closed |
| Связанные заявки | `requestNumbers` | `consolidatedNumbers` |
| Поставщик | `supplierName` | `supplierName` |
| Объём | `totalQuantity` + unit | aggregated quantity |
| Создана | `createdAt` | `createdAt` |
| Checkbox | only `approved` consolidations | never (orders are terminal actions) |

- Sort: newest first.
- Click row → opens entity modal (see below).

### ConsolidatedDemand draft modal

Opened when clicking a `draft` consolidation row.

**Tabs:** Позиции | Комментарии | Документы

- **Позиции** — aggregated line items from source `ProcurementRequest`s.
- **Комментарии** — thread; system comment on return.
- **Документы** — generated docs only (no UPak at consolidation stage).

**Footer actions:**

| Button | Behavior |
|--------|----------|
| **Утвердить** | `approveConsolidatedDemand(id)` → status `approved`. Toast: `{number} утверждена`. Stay on modal or close — implementer choice; spec requires status update visible in table. |
| **Вернуть** | Opens mandatory-comment sub-dialog (see Return flow). Disabled if no comment entered. |

### ConsolidatedDemand approved modal

- Read-only positions + comments.
- Checkbox on table row (not in modal) enables «Сформировать» for supplier order creation.
- No Утвердить/Вернуть buttons.

### SupplierOrder modal (new entity)

Opened when clicking a `ЗП-XXX` row.

**Tabs:** Позиции | Комментарии | Документы

- **Позиции** — merged lines from linked consolidations.
- **Комментарии** — order comment thread.
- **Документы** — includes **UPak upload** section (migrated from current `tab === 'upak'` UI in `ProcurementScreen.tsx`):
  - File picker (`.xlsx`, `.xls`)
  - «Загрузить и создать ОП» button
  - Post-upload validation stats (pallets / boxes / canisters)
  - Only available when order status is `sent` (or `draft` if sent immediately on formation — see statuses)

### «Сформировать» supplier order flow

When user selects ≥1 `approved` consolidation and clicks **Сформировать**:

1. `createSupplierOrder(consolidatedDemandIds)` — new store action.
2. Creates `SupplierOrder` (`ЗП-XXX`, status `draft` → auto-`sent` on formation per demo flow).
3. Linked consolidations marked as merged/consumed (no longer selectable).
4. Switch stays on «Заявки поставщику» tab.
5. New row with optional brief highlight.
6. Toast: `Заявка ЗП-007 сформирована`.

### UPak upload → warehouse

After UPak upload on a supplier order (via Documents tab):

1. `simulateUpakUpload` refactored to accept `supplierOrderId` (not `consolidatedDemandId`).
2. Supplier order status → `awaiting_delivery` («Ожидает поставку»).
3. Creates `ExpectedReceipt` linked to supplier order (existing `expectedReceipts` in demo store).
4. Toast with receipt number (existing message pattern).
5. Warehouse handoff unchanged (`transferExpectedReceiptToWarehouse`).

---

## Return Flow

Triggered from ConsolidatedDemand **draft** modal via **Вернуть**.

1. User clicks **Вернуть** → inline dialog or secondary step requiring comment text (non-empty).
2. `returnConsolidatedDemand(id, comment)` store action:
   - Delete or archive the consolidation draft.
   - For each `requestId` in `demand.requestIds`: set `ProcurementRequest.status` → `returned` («Возвращена»).
   - Append system comment to each returned request's `commentHistory` with return reason.
3. Close modal; remove row from supplier tab table.
4. Toast: `Сводная {number} возвращена`.
5. Returned requests reappear on Спрос tab with new status badge; checkboxes re-enabled (if still `submitted` logic applies — returned requests are **not** selectable until re-submitted; user must edit and re-submit).

**Re-submission:** User opens returned request → edits → submits → status returns to `submitted`, eligible for consolidation again.

---

## Statuses

### ProcurementRequest

| Status key | Label (RU) | Selectable (checkbox) | Notes |
|------------|--------------|----------------------|-------|
| `draft` | Черновик | No | |
| `submitted` | На согласовании | **Yes** | Only status eligible for «Сформировать» |
| `in_consolidated` | В работе | No | In active consolidation pipeline |
| `returned` | **Возвращена** | No | **NEW** — after consolidation return |
| `partially_fulfilled` | Частично закрыта | No | Keep for receipt partials |
| `fulfilled` | Закрыта | No | |
| `cancelled` | Отменена | No | |

Flow: `draft` → `submitted` → `in_consolidated` → (`fulfilled` / `partially_fulfilled`)  
Branch: consolidation return → `returned` → (re-submit) → `submitted`

### ConsolidatedDemand

| Status key | Label (RU) | Notes |
|------------|--------------|-------|
| `draft` | Черновик сводной | Утвердить / Вернуть in modal |
| `approved` | Утверждена | Checkbox-enabled for supplier order formation |
| `merged` | В заявке поставщику | **NEW** — linked to `SupplierOrder`; no longer checkbox-selectable |

Remove from consolidation lifecycle: `upak_loaded`, `receipt_expected`, `closed` (moved to `SupplierOrder`).

### SupplierOrder (NEW entity)

| Status key | Label (RU) | Notes |
|------------|--------------|-------|
| `draft` | Черновик | Optional transient state |
| `sent` | Отправлена поставщику | Default after formation |
| `awaiting_delivery` | Ожидает поставку | After UPak upload |
| `closed` | Закрыта | Receipt complete |

Flow: `draft`/`sent` → `awaiting_delivery` (UPak) → `closed`

---

## Domain Entities

### ProcurementRequest (existing — extend)

```ts
// packages/domain/procurement.ts
export type ProcurementRequestStatus =
  | 'draft'
  | 'submitted'
  | 'in_consolidated'
  | 'returned'        // NEW
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'
```

### ConsolidatedDemand (existing — simplify statuses)

```ts
export type ConsolidatedDemandStatus = 'draft' | 'approved' | 'merged'

export interface ConsolidatedDemand {
  id: string
  number: string              // СВ-XXX
  requestIds: string[]
  requestNumbers: string[]
  productName: string
  totalQuantity: number
  unit: string
  supplierName: string
  status: ConsolidatedDemandStatus
  createdAt: string
  demandSummary?: string
  supplierOrderId?: string    // NEW — set when merged
  comments?: ProcurementRequestComment[]  // NEW — consolidation comment thread
}
```

### SupplierOrder (NEW)

```ts
export type SupplierOrderStatus = 'draft' | 'sent' | 'awaiting_delivery' | 'closed'

export interface SupplierOrderItem {
  productCode: string
  productName: string
  quantity: number
  unit: string
}

export interface SupplierOrder {
  id: string
  number: string              // ЗП-XXX
  consolidatedDemandIds: string[]
  consolidatedNumbers: string[]
  requestNumbers: string[]    // denormalized for display
  supplierName: string
  items: SupplierOrderItem[]
  status: SupplierOrderStatus
  createdAt: string
  expectedReceiptId?: string
  documents: RequestDocument[]
  comments?: ProcurementRequestComment[]
}
```

### Numbering convention

| Entity | Prefix | Example | Generator location |
|--------|--------|---------|-------------------|
| ProcurementRequest | `ЗН-` | ЗН-007 | `nextRequestNumber()` in `demo-store.tsx` |
| ConsolidatedDemand | `СВ-` | СВ-003 | `createConsolidatedDemand` (existing) |
| SupplierOrder | `ЗП-` | ЗП-001 | `createSupplierOrder` (new) |

Sequence: zero-padded 3 digits, count-based off existing array length + 1.

---

## Toaster (Sonner migration)

Replace custom toast queue in `components/ui/Toaster.tsx` with [Sonner](https://sonner.emilkowal.ski/).

### Install

```bash
npm install sonner
```

### Configuration (from `coockies_proto/components/app-toaster.tsx`)

```tsx
<Toaster
  position="top-center"
  richColors
  closeButton
  duration={6000}
  className="font-sans"
/>
```

### API compatibility

Keep import path `@/components/ui/Toaster` for all consumers (`ProcurementScreen`, `RequestsPanel`, `demo-store` callers, etc.):

```ts
export { toast } from 'sonner'
export function Toaster() { /* Sonner wrapper */ }
```

Or re-export thin wrappers:

```ts
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
}
```

### Layout

- `app/layout.tsx` — keep `<Toaster />` inside `DemoStoreProvider`; no other changes.
- Remove custom `.app-toaster` / `.app-toast` CSS if no longer referenced.

---

## Files to Remove / Deprecate

| File / symbol | Action |
|---------------|--------|
| `packages/modules/supply/ConsolidatedPanel.tsx` | Delete after logic merged into supplier tab |
| `ProcurementScreen` landing (`ModuleLanding` cards) | Remove |
| `ProcurementScreen` `tab === 'upak'` section | Remove (move to supplier modal) |
| `SUPPLY_SUBNAV` in `lib/work-tabs.ts` | Remove export and usages |
| `SupplySubTab` type values `consolidated`, `upak`, `requests` | Replace with `demand`, `supplier` |
| `app-toaster` custom CSS (if orphaned) | Clean up in `globals.css` |

---

## Out of Scope

- Real backend API / persistence beyond demo store + localStorage.
- Multi-supplier selection (demo uses `SUPPLIER_AUGUST` only).
- Email/EDI dispatch to supplier on «Отправлена поставщику».
- Permissions / role-based tab visibility changes.
- Mobile / TSD layouts for supply module.
- Automated tests (unless added in plan as smoke build only).
- Changing warehouse receipt flow in «Склады» module.
- Renumbering existing seed data (keep `ЗН-001` etc.).

---

## Acceptance Criteria

### Navigation
- [ ] Sidebar shows only «Снабжение» — no sub-items, no chevron expand.
- [ ] Clicking «Снабжение» opens unified screen (no landing cards).
- [ ] Work tab title is «Снабжение» (not «Задачи» / «Сводная» / «Упак»).

### Toolbar
- [ ] Enterprise selector on left.
- [ ] Two icon tabs in center: «Спрос» and «Заявки поставщику».
- [ ] Right button: «Создать заявку» (Спрос, no selection) or «Сформировать» (with selection).

### Спрос tab
- [ ] Table matches current RequestsPanel layout + checkbox column.
- [ ] Checkboxes only on `submitted` rows.
- [ ] Create/detail modals work as today.
- [ ] «Сформировать» creates consolidation, switches to supplier tab, shows toast, does not open modal.

### Заявки поставщику tab
- [ ] Table shows ConsolidatedDemand and SupplierOrder rows.
- [ ] Draft consolidation modal: Утвердить / Вернуть with mandatory comment on return.
- [ ] Approved consolidations have row checkboxes; «Сформировать» creates SupplierOrder + toast.
- [ ] Supplier order modal: positions, comments, documents with UPak upload.
- [ ] UPak upload sets order to «Ожидает поставку» and creates ExpectedReceipt.

### Return flow
- [ ] Returned requests show status «Возвращена».
- [ ] Source requests receive comment with return reason.
- [ ] Returned requests can be re-edited and re-submitted.

### Toaster
- [ ] Sonner installed; top-center, richColors, closeButton, 6000ms duration.
- [ ] `import { toast } from '@/components/ui/Toaster'` still works.

### Cleanup
- [ ] No UPak standalone screen.
- [ ] `ConsolidatedPanel.tsx` removed.
- [ ] `SUPPLY_SUBNAV` removed from codebase.

### Build
- [ ] `npm run build` passes with no TypeScript errors.
