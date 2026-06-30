'use client'

import { createContext, useContext } from 'react'

export interface TsdShellContextValue {
  onOpenMenu?: () => void
}

const TsdShellContext = createContext<TsdShellContextValue>({})

export function TsdShellProvider({
  children,
  onOpenMenu,
}: {
  children: React.ReactNode
  onOpenMenu?: () => void
}) {
  return <TsdShellContext.Provider value={{ onOpenMenu }}>{children}</TsdShellContext.Provider>
}

export function useTsdShell() {
  return useContext(TsdShellContext)
}
