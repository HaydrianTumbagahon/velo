import { useCompare } from '../lib/compare'
import { Button } from '../components/Button'

export function CompareToggle({ bike }: { bike: { brand: string; slug: string; name: string } }) {
  const id = `${bike.brand}/${bike.slug}`
  const compare = useCompare()
  const selected = compare.has(id)

  return (
    <Button
      variant="text"
      size="small"
      aria-pressed={selected}
      disabled={!selected && compare.ids.length >= 3}
      onClick={() => (selected ? compare.remove(id) : compare.add(id))}
      className="min-h-11 px-2"
    >
      {selected ? 'Remove from compare' : 'Compare'}
    </Button>
  )
}
