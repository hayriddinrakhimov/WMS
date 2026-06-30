import { PACKAGE_STATUS_LABELS, type PackageHistoryEvent } from '@wms/domain'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  return iso.slice(0, 10).split('-').reverse().join('.')
}

export function CanisterTimeline({ events, className }: { events: PackageHistoryEvent[]; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-[var(--app-border)]', className)}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--app-border)] bg-[var(--app-page)]">
            <tr>
              <th className="px-3 py-2 font-medium text-[var(--app-muted)]">Дата</th>
              <th className="px-3 py-2 font-medium text-[var(--app-muted)]">Событие</th>
              <th className="px-3 py-2 font-medium text-[var(--app-muted)]">Статус</th>
              <th className="px-3 py-2 font-medium text-[var(--app-muted)]">Кто</th>
              <th className="px-3 py-2 font-medium text-[var(--app-muted)]">Где</th>
            </tr>
          </thead>
          <tbody>
            {[...events].reverse().map((e) => (
              <tr key={e.id} className="border-b border-[var(--app-border)] last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.at)}</td>
                <td className="px-3 py-2">{e.event}</td>
                <td className="px-3 py-2 text-xs">{PACKAGE_STATUS_LABELS[e.status]}</td>
                <td className="px-3 py-2">{e.actor}</td>
                <td className="px-3 py-2">{e.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="divide-y divide-[var(--app-border)] md:hidden">
        {[...events].reverse().map((e) => (
          <li key={e.id} className="px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--app-muted)]">{formatDate(e.at)}</p>
              <p className="text-[10px] text-[var(--app-accent)]">{PACKAGE_STATUS_LABELS[e.status]}</p>
            </div>
            <p className="mt-1 text-sm font-medium">{e.event}</p>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              {e.actor} · {e.location}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
