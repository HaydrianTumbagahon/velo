export const specPartOrder = [
  'Frame',
  'Fork',
  'Drivetrain',
  'Brakes',
  'Wheels & tyres',
  'Cockpit',
  'Seat & saddle',
  'Sizes & fit',
  'Weight & limits',
  'Colours',
  'Claimed by the brand',
] as const

export type SpecPartName = (typeof specPartOrder)[number]

export function specPartFor(group: string, label: string): string {
  const row = label.toLocaleLowerCase()
  if (row.includes('size') || row.includes('wheel size')) return 'Sizes & fit'
  if (row.includes('weight')) return 'Weight & limits'
  if (row.includes('colour') || row.includes('color')) return 'Colours'
  if (row.includes('claim')) return 'Claimed by the brand'
  if (row.includes('groupset') || row.includes('cassette') || row.includes('crank') || row.includes('derailleur') || row.includes('shifter')) {
    return 'Drivetrain'
  }
  if (row.includes('saddle') || row.includes('seatpost')) return 'Seat & saddle'
  if (row.includes('cockpit') || row.includes('handlebar') || row.includes('stem')) return 'Cockpit'

  const normalizedGroup = group.toLocaleLowerCase()
  if (normalizedGroup.includes('frame')) return 'Frame'
  if (normalizedGroup.includes('fork')) return 'Fork'
  if (normalizedGroup.includes('drive')) return 'Drivetrain'
  if (normalizedGroup.includes('brake')) return 'Brakes'
  if (normalizedGroup.includes('wheel') || normalizedGroup.includes('tyre') || normalizedGroup.includes('tire')) {
    return 'Wheels & tyres'
  }
  if (normalizedGroup.includes('cockpit') || normalizedGroup.includes('contact')) return 'Cockpit'
  if (normalizedGroup.includes('fit') || normalizedGroup.includes('geometry') || normalizedGroup.includes('size')) {
    return 'Sizes & fit'
  }
  if (normalizedGroup.includes('weight')) return 'Weight & limits'
  return group
}

export function orderedSpecParts(names: Iterable<string>): string[] {
  const available = new Set(names)
  return [
    ...specPartOrder.filter((part) => available.delete(part)),
    ...[...available].sort((a, b) => a.localeCompare(b)),
  ]
}
