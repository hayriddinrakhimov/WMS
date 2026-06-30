# Supply Unified Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan step-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-part Supply module (Задачи / Сводная / Упак) with a single `/supply` screen featuring Спрос and Заявки поставщику toolbar tabs, a new SupplierOrder entity, Sonner toasts, and UPak upload inside supplier-order modals.

**Architecture:** Extend `packages/domain/procurement.ts` with `SupplierOrder` and simplified status enums; add store actions in `lib/demo-store.tsx`; refactor `ProcurementScreen.tsx` into a tabbed toolbar layout reusing `RequestsPanel` for Спрос and a new `SupplierOrdersPanel` for the supplier tab; migrate to Sonner via a thin wrapper at `@/components/ui/Toaster`; remove sidebar sub-nav and landing page.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide icons, Sonner (new), existing `@wms/domain` package and `demo-store` pattern.

**Design spec:** `docs/superpowers/specs/2026-06-24-supply-unified-screen-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `components/ui/Toaster.tsx` | Sonner wrapper + `toast` API |
| `app/layout.tsx` | Mount `<Toaster />` (unchanged import) |
| `package.json` | Add `sonner` dependency |
| `packages/domain/procurement.ts` | Types, labels, `SupplierOrder`, `returned` status |
| `packages/domain/index.ts` | Re-export new types |
| `lib/demo-store.tsx` | `supplierOrders` state + CRUD actions |
| `lib/work-tabs.ts` | New tab keys; remove `SUPPLY_SUBNAV` |
| `components/shared/AppNav.tsx` | Flat supply nav item |
| `packages/modules/supply/ProcurementScreen.tsx` | Unified screen orchestrator |
| `packages/modules/supply/RequestsPanel.tsx` | Add checkbox column + selection props |
| `packages/modules/supply/SupplierOrdersPanel.tsx` | **NEW** — supplier tab table + modals |
| `packages/modules/supply/SupplyActionButtons.tsx` | Updated action button logic |
| `packages/modules/supply/ConsolidatedPanel.tsx` | **DELETE** after migration |

---

## Task 1: Sonner migration

### Task 1: Install Sonner and replace custom Toaster

**Files:**
- Modify: `package.json`
- Modify: `components/ui/Toaster.tsx`
- Modify: `app/layout.tsx` (verify only)
- Modify: `app/globals.css` (remove orphaned `.app-toaster` rules if present)

- [ ] **Step 1: Install sonner**

Run: `npm install sonner`
Expected: `package.json` lists `"sonner": "^2.x"` in dependencies.

- [ ] **Step 2: Replace Toaster implementation**

Replace entire contents of `components/ui/Toaster.tsx`:

```tsx
'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info'

/** Drop-in replacement — keeps existing import path across the codebase. */
export const toast = Object.assign(
  (message: string, type: ToastType = 'info') => {
    if (type === 'success') sonnerToast.success(message)
    else if (type === 'error') sonnerToast.error(message)
    else sonnerToast.info(message)
  },
  {
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    info: (message: string) => sonnerToast.info(message),
  },
)

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      duration={6000}
      className="font-sans"
    />
  )
}
```

- [ ] **Step 3: Verify layout still mounts Toaster**

Confirm `app/layout.tsx` line 17 still has `<Toaster />` — no change needed unless import breaks.

- [ ] **Step 4: Remove custom toast CSS (if present)**

In `app/globals.css`, search for `.app-toaster` and `.app-toast` — delete those rule blocks.

- [ ] **Step 5: Smoke test**

Run: `npm run build`
Expected: PASS (no type errors on `toast.success()` calls).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/ui/Toaster.tsx app/globals.css
git commit -m "feat: migrate toast notifications to Sonner"
```

---

## Task 2: Domain types + store

### Task 2a: Extend procurement domain types

**Files:**
- Modify: `packages/domain/procurement.ts`
- Modify: `packages/domain/index.ts`

- [ ] **Step 1: Add returned status and SupplierOrder types**

In `packages/domain/procurement.ts`, update status union and add entity:

```ts
export type ProcurementRequestStatus =
  | 'draft'
  | 'submitted'
  | 'in_consolidated'
  | 'returned'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'

export type ConsolidatedDemandStatus = 'draft' | 'approved' | 'merged'

export type SupplierOrderStatus = 'draft' | 'sent' | 'awaiting_delivery' | 'closed'

export interface SupplierOrderItem {
  productCode: string
  productName: string
  quantity: number
  unit: string
}

export interface SupplierOrder {
  id: string
  number: string
  consolidatedDemandIds: string[]
  consolidatedNumbers: string[]
  requestNumbers: string[]
  supplierName: string
  items: SupplierOrderItem[]
  status: SupplierOrderStatus
  createdAt: string
  expectedReceiptId?: string
  documents: RequestDocument[]
  comments?: ProcurementRequestComment[]
}
```

- [ ] **Step 2: Update label maps**

```ts
export const PROCUREMENT_REQUEST_STATUS_LABELS: Record<ProcurementRequestStatus, string> = {
  draft: 'Черновик',
  submitted: 'На согласовании',
  in_consolidated: 'В работе',
  returned: 'Возвращена',
  partially_fulfilled: 'Частично закрыта',
  fulfilled: 'Закрыта',
  cancelled: 'Отменена',
}

export const CONSOLIDATED_DEMAND_STATUS_LABELS: Record<ConsolidatedDemandStatus, string> = {
  draft: 'Черновик сводной',
  approved: 'Утверждена',
  merged: 'В заявке поставщику',
}

export const SUPPLIER_ORDER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлена поставщику',
  awaiting_delivery: 'Ожидает поставку',
  closed: 'Закрыта',
}
```

- [ ] **Step 3: Extend ConsolidatedDemand interface**

Add optional fields to existing interface:

```ts
export interface ConsolidatedDemand {
  // ...existing fields...
  supplierOrderId?: string
  comments?: ProcurementRequestComment[]
}
```

Remove old status values (`upak_loaded`, `receipt_expected`, `closed`) from the type — fix any compile errors in seed data or store.

- [ ] **Step 4: Export from index**

In `packages/domain/index.ts`, add:

```ts
export {
  type SupplierOrder,
  type SupplierOrderItem,
  type SupplierOrderStatus,
  SUPPLIER_ORDER_STATUS_LABELS,
} from './procurement'
```

- [ ] **Step 5: Commit**

```bash
git add packages/domain/procurement.ts packages/domain/index.ts
git commit -m "feat: add SupplierOrder entity and returned request status"
```

### Task 2b: Demo store — supplier orders and refactored actions

**Files:**
- Modify: `lib/demo-store.tsx`

- [ ] **Step 1: Add supplierOrders to state**

Near `consolidatedDemands` state:

```ts
const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([])
```

Add to context type and `value` memo:

```ts
supplierOrders: SupplierOrder[]
createSupplierOrder: (consolidatedDemandIds: string[]) => { ok: boolean; message: string; orderNumber?: string }
returnConsolidatedDemand: (id: string, comment: string) => { ok: boolean; message: string }
```

- [ ] **Step 2: Implement createSupplierOrder**

```ts
const createSupplierOrder = useCallback(
  (consolidatedDemandIds: string[]) => {
    const demands = consolidatedDemands.filter(
      (d) => consolidatedDemandIds.includes(d.id) && d.status === 'approved',
    )
    if (!demands.length) {
      return { ok: false, message: 'Выберите утверждённые сводные' }
    }

    const seq = supplierOrders.length + 1
    const number = `ЗП-${String(seq).padStart(3, '0')}`
    const requestNumbers = [...new Set(demands.flatMap((d) => d.requestNumbers))]
    const items: SupplierOrderItem[] = /* aggregate items from linked procurement requests */

    const order: SupplierOrder = {
      id: `so-${Date.now()}`,
      number,
      consolidatedDemandIds: demands.map((d) => d.id),
      consolidatedNumbers: demands.map((d) => d.number),
      requestNumbers,
      supplierName: demands[0].supplierName,
      items,
      status: 'sent',
      createdAt: new Date().toISOString(),
      documents: [],
      comments: [],
    }

    setSupplierOrders((prev) => [...prev, order])
    setConsolidatedDemands((prev) =>
      prev.map((d) =>
        consolidatedDemandIds.includes(d.id)
          ? { ...d, status: 'merged' as const, supplierOrderId: order.id }
          : d,
      ),
    )
    return { ok: true, message: `Заявка ${number} сформирована`, orderNumber: number }
  },
  [consolidatedDemands, supplierOrders.length, procurementRequests],
)
```

Implement item aggregation by loading `procurementRequests` for each demand's `requestIds` and summing quantities per `productCode`.

- [ ] **Step 3: Implement returnConsolidatedDemand**

```ts
const returnConsolidatedDemand = useCallback(
  (id: string, comment: string) => {
    const trimmed = comment.trim()
    if (!trimmed) return { ok: false, message: 'Укажите причину возврата' }

    const demand = consolidatedDemands.find((d) => d.id === id)
    if (!demand || demand.status !== 'draft') {
      return { ok: false, message: 'Сводная не найдена или уже утверждена' }
    }

    const returnComment: ProcurementRequestComment = {
      id: `ret-${Date.now()}`,
      authorId: webUser?.id ?? 'system',
      authorName: webUser?.name ?? 'Снабжение',
      text: `Возврат сводной ${demand.number}: ${trimmed}`,
      createdAt: new Date().toISOString(),
    }

    setProcurementRequests((prev) =>
      prev.map((r) =>
        demand.requestIds.includes(r.id)
          ? {
              ...r,
              status: 'returned' as const,
              commentHistory: [...normalizeCommentHistory(r), returnComment],
            }
          : r,
      ),
    )
    setConsolidatedDemands((prev) => prev.filter((d) => d.id !== id))
    return { ok: true, message: `Сводная ${demand.number} возвращена` }
  },
  [consolidatedDemands, webUser],
)
```

- [ ] **Step 4: Update createConsolidatedDemand toast message**

Change success message to match spec format:

```ts
return { ok: true, message: `Сводная ${number} создана`, demandNumber: number }
```

- [ ] **Step 5: Refactor simulateUpakUpload to accept supplierOrderId**

```ts
const simulateUpakUploadFn = useCallback(
  (supplierOrderId: string) => {
    const order = supplierOrders.find((o) => o.id === supplierOrderId)
    if (!order) return { ok: false, message: 'Заявка поставщику не найдена' }
    if (order.status !== 'sent') {
      return { ok: false, message: 'Загрузка Упак доступна для отправленных заявок' }
    }
    // ...existing simulateUpakImport logic using order.consolidatedNumbers...
    setSupplierOrders((prev) =>
      prev.map((o) =>
        o.id === supplierOrderId ? { ...o, status: 'awaiting_delivery' as const, expectedReceiptId: result.expectedReceipt.id } : o,
      ),
    )
    // ...
  },
  [importCompleted, supplierOrders],
)
```

- [ ] **Step 6: Allow re-submit from returned status**

In `saveProcurementRequest`, when `mode === 'submit'` and existing status is `returned`, set status to `submitted`.

- [ ] **Step 7: Commit**

```bash
git add lib/demo-store.tsx
git commit -m "feat: add supplier order and return consolidation store actions"
```

---

## Task 3: Navigation cleanup

### Task 3: Remove supply sub-nav and landing

**Files:**
- Modify: `lib/work-tabs.ts`
- Modify: `components/shared/AppNav.tsx`
- Modify: any nav callers passing `onNavigateSupply(subTab)`

- [ ] **Step 1: Update work-tabs types**

Replace in `lib/work-tabs.ts`:

```ts
export type SupplySubTab = 'demand' | 'supplier'

const SUPPLY_SUB_TITLES: Record<SupplySubTab, string> = {
  demand: 'Спрос',
  supplier: 'Заявки поставщику',
}
```

- [ ] **Step 2: Remove SUPPLY_SUBNAV export**

Delete lines 180–184 (`export const SUPPLY_SUBNAV = [...]`).

Update `listTitleForFilter` — when `moduleId === 'supply'` and no tab, return `'Снабжение'` (not landing sub-title).

Update `normalizeNavFilter` — for supply without tab, default to `{ tab: 'demand', view: 'list' }` instead of `{ view: 'landing' }`.

- [ ] **Step 3: Simplify AppNav supply section**

In `components/shared/AppNav.tsx`:
- Remove `import { SUPPLY_SUBNAV } from '@/lib/work-tabs'`
- Remove `supplyOpen` state and `ChevronDown` trailing icon
- Remove sub-nav `<ul>` block (lines 137–156)
- Change supply item `onClick` to `onNavigateSupply()` with no sub-tab arg — navigates to `{ tab: 'demand', view: 'list' }`

- [ ] **Step 4: Update DemoShell / nav handler**

Find `onNavigateSupply` definition (likely `components/demo/DemoShell.tsx`) — change signature:

```ts
onNavigateSupply: () => navigateActiveWorkTab(
  { moduleId: 'supply', filter: { tab: 'demand', view: 'list' } },
  'Снабжение',
)
```

- [ ] **Step 5: Commit**

```bash
git add lib/work-tabs.ts components/shared/AppNav.tsx components/demo/DemoShell.tsx
git commit -m "refactor: flatten supply sidebar to single nav item"
```

---

## Task 4: Unified ProcurementScreen toolbar + tabs

### Task 4: Refactor ProcurementScreen shell

**Files:**
- Modify: `packages/modules/supply/ProcurementScreen.tsx`
- Modify: `packages/modules/supply/SupplyActionButtons.tsx`

- [ ] **Step 1: Replace SupplyTab type**

```ts
type SupplyTab = 'demand' | 'supplier'
```

- [ ] **Step 2: Remove landing and upak**

Delete:
- `ModuleLanding` import and `isLanding` branch
- All `tab === 'upak'` JSX (lines ~308–441)
- `ConsolidatedPanel` import
- UPak-related state (`fileLabel`, `fileRef`, `activeDemandId`, `importCompleted` UI — move to SupplierOrdersPanel later)

- [ ] **Step 3: Default to list view**

```ts
const tab = (filter?.tab as SupplyTab | undefined) ?? 'demand'
const view = filter?.view ?? 'list'
```

Remove `isLanding` checks — screen always shows tab content.

- [ ] **Step 4: Add icon tab switcher in toolbar center**

Between enterprise selector and right actions:

```tsx
<div className="module-toolbar__tabs flex gap-1">
  <button
    type="button"
    className={cn('module-toolbar__tab', tab === 'demand' && 'module-toolbar__tab--active')}
    onClick={() => setActiveTab('demand')}
    aria-label="Спрос"
  >
    <ClipboardList className="size-4" />
    <span>Спрос</span>
  </button>
  <button
    type="button"
    className={cn('module-toolbar__tab', tab === 'supplier' && 'module-toolbar__tab--active')}
    onClick={() => setActiveTab('supplier')}
    aria-label="Заявки поставщику"
  >
    <Truck className="size-4" />
    <span>Заявки поставщику</span>
  </button>
</div>
```

`setActiveTab` calls `navigateActiveWorkTab({ moduleId: 'supply', filter: { tab, view: 'list' } }, 'Снабжение', { replace: true })`.

- [ ] **Step 5: Update SupplyActionButtons**

```ts
type SupplyTab = 'demand' | 'supplier'

interface SupplyActionButtonsProps {
  tab: SupplyTab
  selectedCount: number
  onCreateRequest: () => void
  onForm: () => void  // consolidation or supplier order
}
```

Logic:
- `demand` + `selectedCount === 0` → «Создать заявку»
- `demand` + `selectedCount > 0` → «Сформировать»
- `supplier` + `selectedCount > 0` → «Сформировать»
- `supplier` + `selectedCount === 0` → render nothing

- [ ] **Step 6: Wire tab content placeholders**

```tsx
{tab === 'demand' ? (
  <RequestsPanel ref={requestsPanelRef} /* existing props + selection props from Task 5 */ />
) : (
  <SupplierOrdersPanel /* props from Task 6 */ />
)}
```

- [ ] **Step 7: Commit**

```bash
git add packages/modules/supply/ProcurementScreen.tsx packages/modules/supply/SupplyActionButtons.tsx
git commit -m "feat: unified supply screen with toolbar icon tabs"
```

---

## Task 5: Спрос tab — checkboxes + form flow

### Task 5: Add selection to RequestsPanel

**Files:**
- Modify: `packages/modules/supply/RequestsPanel.tsx`
- Modify: `packages/modules/supply/ProcurementScreen.tsx`

- [ ] **Step 1: Add selection props to RequestsPanel**

```ts
export function RequestsPanel({
  // ...existing props...
  selectedRequestIds?: Set<string>
  onToggleRequest?: (id: string) => void
}: {
  // ...
  selectedRequestIds?: Set<string>
  onToggleRequest?: (id: string) => void
})
```

- [ ] **Step 2: Add checkbox column to table header**

After opening `<tr>` in thead, add:

```tsx
<th className="w-10" aria-label="Выбор" />
```

- [ ] **Step 3: Add checkbox cells in tbody**

Inside `enterpriseRequests.map`:

```tsx
<td onClick={(e) => e.stopPropagation()}>
  {req.status === 'submitted' && onToggleRequest ? (
    <input
      type="checkbox"
      checked={selectedRequestIds?.has(req.id) ?? false}
      onChange={() => onToggleRequest(req.id)}
      aria-label={`Включить ${req.number} в сводную`}
    />
  ) : null}
</td>
```

Update empty-state `colSpan` from 6 to 7.

- [ ] **Step 4: Wire selection in ProcurementScreen**

```ts
const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())

const handleFormDemand = () => {
  const result = createConsolidatedDemand([...selectedRequests])
  if (result.ok) {
    toast.success(`Сводная ${result.demandNumber ?? ''} создана`.trim())
    setSelectedRequests(new Set())
    navigateActiveWorkTab(
      { moduleId: 'supply', filter: { tab: 'supplier', view: 'list' } },
      'Снабжение',
      { replace: true },
    )
    setHighlightId(result.demandId) // optional 2s row highlight in SupplierOrdersPanel
  } else {
    toast.error(result.message)
  }
}
```

Return `demandId` from `createConsolidatedDemand` alongside `demandNumber`.

- [ ] **Step 5: Add returned status badge styling**

In supply CSS module / globals, add `.supply-requests__status--returned` with distinct color (e.g. orange).

- [ ] **Step 6: Commit**

```bash
git add packages/modules/supply/RequestsPanel.tsx packages/modules/supply/ProcurementScreen.tsx
git commit -m "feat: demand tab checkboxes and consolidation form flow"
```

---

## Task 6: Supplier tab + SupplierOrder panel

### Task 6: Create SupplierOrdersPanel

**Files:**
- Create: `packages/modules/supply/SupplierOrdersPanel.tsx`
- Modify: `packages/modules/supply/ProcurementScreen.tsx`

- [ ] **Step 1: Create panel with unified table**

```tsx
'use client'

import { useMemo, useState } from 'react'
import {
  CONSOLIDATED_DEMAND_STATUS_LABELS,
  SUPPLIER_ORDER_STATUS_LABELS,
  type ConsolidatedDemand,
  type SupplierOrder,
} from '@wms/domain'
import { cn } from '@/lib/utils'

type Row =
  | { kind: 'consolidated'; data: ConsolidatedDemand }
  | { kind: 'supplier_order'; data: SupplierOrder }

export function SupplierOrdersPanel({
  consolidatedDemands,
  supplierOrders,
  selectedConsolidationIds,
  onToggleConsolidation,
  onOpenConsolidated,
  onOpenSupplierOrder,
  highlightId,
}: {
  consolidatedDemands: ConsolidatedDemand[]
  supplierOrders: SupplierOrder[]
  selectedConsolidationIds: Set<string>
  onToggleConsolidation: (id: string) => void
  onOpenConsolidated: (demand: ConsolidatedDemand) => void
  onOpenSupplierOrder: (order: SupplierOrder) => void
  highlightId?: string
}) {
  const rows = useMemo<Row[]>(() => {
    const cons = consolidatedDemands
      .filter((d) => d.status !== 'merged')
      .map((data) => ({ kind: 'consolidated' as const, data }))
    const orders = supplierOrders.map((data) => ({ kind: 'supplier_order' as const, data }))
    return [...cons, ...orders].sort(
      (a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime(),
    )
  }, [consolidatedDemands, supplierOrders])

  // ...table rendering with checkbox only for approved consolidations...
}
```

- [ ] **Step 2: Consolidated draft modal component**

Inside same file or `ConsolidatedDemandModal.tsx`:

- Tabs: positions (aggregate from requests), comments, documents
- Footer: «Утвердить» calls `onApprove(id)`; «Вернуть» opens comment textarea — disabled until non-empty

- [ ] **Step 3: Supplier order modal component**

`SupplierOrderModal.tsx`:
- Reuse `RequestWorkspaceModal` shell
- Tabs: positions, comments, documents
- Documents tab includes UPak upload UI (migrate from old `ProcurementScreen` upak section)

- [ ] **Step 4: Wire form supplier order in ProcurementScreen**

```ts
const [selectedConsolidations, setSelectedConsolidations] = useState<Set<string>>(new Set())

const handleFormSupplierOrder = () => {
  const result = createSupplierOrder([...selectedConsolidations])
  if (result.ok) {
    toast.success(`Заявка ${result.orderNumber} сформирована`)
    setSelectedConsolidations(new Set())
    setHighlightId(result.orderId)
  } else {
    toast.error(result.message)
  }
}
```

- [ ] **Step 5: Row highlight effect**

```tsx
<tr
  className={cn(
    'cursor-pointer hover:bg-[#f8fafc]',
    highlightId === row.data.id && 'bg-amber-50 transition-colors duration-2000',
  )}
>
```

Clear `highlightId` after 2s via `useEffect`.

- [ ] **Step 6: Commit**

```bash
git add packages/modules/supply/SupplierOrdersPanel.tsx packages/modules/supply/ProcurementScreen.tsx
git commit -m "feat: supplier orders panel with unified table and modals"
```

---

## Task 7: Return flow

### Task 7: Consolidation return UI + re-submit

**Files:**
- Modify: `packages/modules/supply/SupplierOrdersPanel.tsx` (or modal file)
- Modify: `lib/demo-store.tsx` (verify returnConsolidatedDemand)
- Modify: `packages/modules/supply/RequestsPanel.tsx`

- [ ] **Step 1: Return dialog in consolidated draft modal**

```tsx
const [returnOpen, setReturnOpen] = useState(false)
const [returnComment, setReturnComment] = useState('')

// Вернуть button:
<button type="button" onClick={() => setReturnOpen(true)}>Вернуть</button>

// Sub-dialog:
{returnOpen ? (
  <div className="work-tab-bar__dialog" role="dialog">
    <div className="work-tab-bar__dialog-card">
      <p className="work-tab-bar__dialog-title">Вернуть сводную</p>
      <textarea
        value={returnComment}
        onChange={(e) => setReturnComment(e.target.value)}
        placeholder="Причина возврата (обязательно)"
        rows={3}
      />
      <div className="work-tab-bar__dialog-actions">
        <button type="button" onClick={() => setReturnOpen(false)}>Отмена</button>
        <button
          type="button"
          disabled={!returnComment.trim()}
          onClick={() => {
            const result = returnConsolidatedDemand(demand.id, returnComment)
            if (result.ok) toast.success(result.message)
            else toast.error(result.message)
            if (result.ok) onClose()
          }}
        >
          Вернуть
        </button>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 2: Verify returned requests show in Спрос table**

Returned requests appear with status badge «Возвращена»; no checkbox.

- [ ] **Step 3: Enable re-submit from returned draft**

In `RequestsPanel.openRequest`:

```ts
if (req.status === 'draft' || req.status === 'returned') {
  openEditDraft(req)
  setRequestModal({ kind: 'create', requestId: req.id })
}
```

- [ ] **Step 4: Manual test return flow**

1. Create + submit request → select → Сформировать → draft appears on supplier tab
2. Open draft → Вернуть with comment → request shows «Возвращена» on Спрос tab
3. Open returned request → edit → submit → status «На согласовании» again

- [ ] **Step 5: Commit**

```bash
git add packages/modules/supply/SupplierOrdersPanel.tsx packages/modules/supply/RequestsPanel.tsx
git commit -m "feat: consolidation return flow with mandatory comment"
```

---

## Task 8: UPak in documents tab

### Task 8: Migrate UPak upload to supplier order modal

**Files:**
- Modify: `packages/modules/supply/SupplierOrderModal.tsx` (or inline in SupplierOrdersPanel)
- Modify: `lib/demo-store.tsx`

- [ ] **Step 1: Extract UPak upload section**

Move from deleted `ProcurementScreen` upak block:

```tsx
function UpakUploadSection({
  orderId,
  disabled,
  onUpload,
}: {
  orderId: string
  disabled: boolean
  onUpload: (orderId: string) => void
}) {
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <section className="space-y-4">
      <h4 className="text-sm font-semibold">Упак поставщика</h4>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
        onChange={() => setFileLabel('Август_1320004171_Упак.xlsx')} />
      <button type="button" disabled={disabled} onClick={() => fileRef.current?.click()}
        className="/* dashed border styles */">
        {fileLabel ?? 'Выберите файл Упак.xlsx'}
      </button>
      <button type="button" disabled={disabled || !fileLabel}
        onClick={() => onUpload(orderId)}
        className="w-full rounded-lg bg-[var(--app-accent)] px-4 py-2.5 text-sm font-medium text-white">
        Загрузить и создать ОП
      </button>
    </section>
  )
}
```

- [ ] **Step 2: Show validation stats after upload**

Read `importValidation`, `importCompleted` from `useDemoStore()` — render pallet/box/canister grid (same as old upak section).

- [ ] **Step 3: Show expected receipts in modal or table row expand**

Display `expectedReceipts` linked via `order.expectedReceiptId` with status label and «Передать на склад» when `ready_for_warehouse`.

- [ ] **Step 4: Commit**

```bash
git add packages/modules/supply/ lib/demo-store.tsx
git commit -m "feat: move UPak upload into supplier order documents tab"
```

---

## Task 9: Cleanup removed files

### Task 9: Delete obsolete supply components

**Files:**
- Delete: `packages/modules/supply/ConsolidatedPanel.tsx`
- Modify: any remaining imports

- [ ] **Step 1: Delete ConsolidatedPanel**

```bash
git rm packages/modules/supply/ConsolidatedPanel.tsx
```

- [ ] **Step 2: Grep for stale references**

Run: `rg "ConsolidatedPanel|SUPPLY_SUBNAV|'upak'|'consolidated'.*supply|tab: 'requests'" packages/ lib/ components/`
Fix any hits — update to `demand`/`supplier` tab keys.

- [ ] **Step 3: Remove unused CSS**

Search `globals.css` and supply styles for `.supply-action-bar` footer layout if footer variant removed.

- [ ] **Step 4: Update seed data if needed**

If seed `ConsolidatedDemand` objects use old statuses (`upak_loaded`, etc.), update in `lib/demo-store.tsx` initial state to `approved` or `merged`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete supply sub-module files and references"
```

---

## Task 10: Build verify

### Task 10: Full build and acceptance smoke test

**Files:** (none — verification only)

- [ ] **Step 1: Typecheck and build**

Run: `npm run build`
Expected: PASS, zero TypeScript errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings).

- [ ] **Step 3: Manual acceptance walkthrough**

| # | Check | Pass |
|---|-------|------|
| 1 | Sidebar: only «Снабжение», no sub-items | |
| 2 | Toolbar: enterprise + 2 icon tabs + action button | |
| 3 | Спрос: checkbox only on «На согласовании» | |
| 4 | Сформировать → tab switch + toast `Сводная СВ-XXX создана` | |
| 5 | Supplier tab: draft modal Утвердить/Вернуть | |
| 6 | Return → request status «Возвращена» | |
| 7 | Approved consolidation → Сформировать → `ЗП-XXX` + toast | |
| 8 | UPak in supplier modal → «Ожидает поставку» + ExpectedReceipt | |
| 9 | Sonner toast top-center with close button | |
| 10 | No landing cards, no /upak screen | |

- [ ] **Step 4: Final commit (if fixups needed)**

```bash
git add -A
git commit -m "fix: supply unified screen build fixups"
```

---

## Self-review

### 1. Spec coverage

| Spec section | Plan task |
|--------------|-----------|
| Navigation — flat sidebar | Task 3 |
| Single screen, no landing | Task 3, 4 |
| Toolbar layout | Task 4 |
| Спрос tab table + checkboxes | Task 5 |
| Сформировать variant B (tab switch, toast, no modal) | Task 5 |
| Заявки поставщику unified table | Task 6 |
| Consolidated draft modal Утвердить/Вернуть | Task 6, 7 |
| SupplierOrder entity + formation | Task 2, 6 |
| Return flow mandatory comment | Task 2, 7 |
| UPak in documents → awaiting_delivery | Task 2, 8 |
| Status enums (returned, merged, SupplierOrder) | Task 2 |
| Numbering ЗН/СВ/ЗП | Task 2 |
| Sonner migration | Task 1 |
| Remove UPak screen, ConsolidatedPanel, SUPPLY_SUBNAV | Task 3, 9 |
| UI renames Задачи→Спрос | Task 3, 4 |
| Acceptance criteria | Task 10 |

**Gaps:** None identified. Optional row highlight covered in Task 5/6.

### 2. Placeholder scan

No TBD/TODO/similar-to placeholders found.

### 3. Type consistency

- `SupplySubTab`: `demand` | `supplier` used consistently in Tasks 3–6.
- `createConsolidatedDemand` returns `{ demandNumber, demandId }` — wired in Task 5.
- `simulateUpakUpload(supplierOrderId)` — signature updated in Task 2, consumed in Task 8.
- `ConsolidatedDemandStatus` simplified — seed data fix in Task 9.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-24-supply-unified-screen.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task (1–10), review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
