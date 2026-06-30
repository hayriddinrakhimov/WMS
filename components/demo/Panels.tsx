'use client'

import { OtpLoginScreen } from '@/components/auth/OtpLoginScreen'
import { WebCabinet } from '@/components/web/WebCabinet'
import { useDemoStore } from '@/lib/demo-store'

export function WebPanel() {
  const { webUser, logout } = useDemoStore()

  if (!webUser) {
    return <OtpLoginScreen />
  }

  return <WebCabinet user={webUser} onLogout={logout} />
}
