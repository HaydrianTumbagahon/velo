import { FitText } from './FitText'

export function Logo() {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 text-fg">
      <svg
        aria-hidden="true"
        className="h-9 w-9 shrink-0"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 8 24 40 38 14"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
        />
        <circle cx="42" cy="6" r="3" fill="var(--accent)" />
      </svg>
      <FitText as="span" className="font-velo text-xl font-bold tracking-[0.02em]">
        VELO
      </FitText>
    </span>
  )
}
