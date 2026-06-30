'use client'

export function TsdShell({
  actions,
  children,
  overlay,
}: {
  actions?: React.ReactNode
  children: React.ReactNode
  overlay?: React.ReactNode
}) {
  return (
    <div className="tsd-shell">
      <div className="tsd-shell__content">{children}</div>
      {overlay}
      {actions ? <footer className="tsd-actions">{actions}</footer> : null}
    </div>
  )
}
