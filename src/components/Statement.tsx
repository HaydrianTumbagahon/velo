import site from '../data/site.json'
import { BigLines } from './BigLines'

export function Statement() {
  return (
    <section
      id="statement"
      className="grid min-h-svh place-items-center px-6 py-[clamp(3rem,10vw,10rem)] md:px-12"
    >
      <BigLines
        lines={site.statement.lines}
        accentWord={site.statement.accent}
        className="w-full max-w-7xl text-left font-brand text-display-l font-medium text-fg"
      />
    </section>
  )
}
