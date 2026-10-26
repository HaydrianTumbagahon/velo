import { forwardRef, type SVGProps } from 'react'

export const Bike = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(function Bike(props, ref) {
  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 1200 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="260" cy="280" r="150" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="940" cy="280" r="150" stroke="var(--ink)" strokeWidth="3" />
      <path
        d="M260 280 465 120l185 160H260l100-130 105 30m185 0 85-105 75 5m-160 100 75-100m-75 0h60m-250 0-45-25h-65m480 225-30-135m-38 0h76"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
    </svg>
  )
})
