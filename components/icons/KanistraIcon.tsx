import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

export const KanistraIcon = forwardRef<SVGSVGElement, LucideProps>(function KanistraIcon(
  { className, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M9 3h6v3H9z" />
      <path d="M8 6h8v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6z" />
      <path d="M10 11h4" />
    </svg>
  )
})
