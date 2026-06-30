'use client'

import { WebPanel } from '@/components/demo/Panels'

export function DemoShell() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#eceff1]">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <WebPanel />
      </section>
    </div>
  )
}
