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
