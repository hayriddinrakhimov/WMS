import { PACKAGE_STATUS_LABELS, type Canister } from '@wms/domain'
import { cn } from '@/lib/utils'

export function CanisterCard({ canister, className }: { canister: Canister; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{canister.productName}</p>
          <p className="mt-0.5 font-mono text-xs text-[var(--app-muted)]">{canister.sgtin}</p>
        </div>
        <span className="rounded-full bg-[var(--app-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--app-accent)]">
          {PACKAGE_STATUS_LABELS[canister.status]}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-[var(--app-muted)]">GTIN</dt>
          <dd className="font-mono">{canister.gtin}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Серийный №</dt>
          <dd className="font-mono">{canister.serialNumber}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Партия</dt>
          <dd>{canister.batchNumber}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Срок годности</dt>
          <dd>{canister.expiryDate}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Объём</dt>
          <dd>{canister.volumeLiters} л</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Ячейка</dt>
          <dd>{canister.cellId ?? '—'}</dd>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-[var(--app-muted)]">Упаковка</dt>
          <dd className="font-mono text-[11px]">
            Палета {canister.palletSscc} → Коробка {canister.boxSscc}
          </dd>
        </div>
        {canister.remainderLiters !== undefined ? (
          <div>
            <dt className="text-[var(--app-muted)]">Остаток</dt>
            <dd>{canister.remainderLiters} л</dd>
          </div>
        ) : null}
        {canister.issuedTo ? (
          <div>
            <dt className="text-[var(--app-muted)]">Выдано</dt>
            <dd>{canister.issuedTo}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
