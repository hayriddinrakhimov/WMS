import { StatCard } from './StatCard'

export function DashboardWidgetGrid({
  widgets,
}: {
  widgets: { id: string; title: string; value: string | number; onClick?: () => void }[]
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {widgets.map((w) => (
        <StatCard key={w.id} label={w.title} value={w.value} onClick={w.onClick} />
      ))}
    </div>
  )
}
