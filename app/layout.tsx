import type { Metadata } from 'next'
import { DemoStoreProvider } from '@/lib/demo-store'
import { Toaster } from '@/components/ui/Toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'KAZFOOD PRODUCTS WMS',
  description: 'Промо-макет WMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <DemoStoreProvider>
          {children}
          <Toaster />
        </DemoStoreProvider>
      </body>
    </html>
  )
}
