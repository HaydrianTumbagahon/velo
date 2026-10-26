import { readFileSync } from 'node:fs'

const brands = JSON.parse(readFileSync(new URL('../src/data/brands.json', import.meta.url), 'utf8'))
const base = { slug: 'velo', theme: { bg: '#F6F5F2', ink: '#0E0E0E', accent: '#B8975A' } }

function rgb(hex) {
  return hex.match(/[a-f\d]{2}/gi).map((part) => Number.parseInt(part, 16) / 255)
}

function oklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  const lRoot = Math.cbrt(l)
  const mRoot = Math.cbrt(m)
  const sRoot = Math.cbrt(s)
  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ]
}

function fromOklab([l, a, b]) {
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b
  const ll = lRoot ** 3
  const mm = mRoot ** 3
  const ss = sRoot ** 3
  return [
    4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss,
  ].map((channel) => Math.max(0, Math.min(1, channel)))
}

function mix(accent, ink, accentPercent) {
  const a = oklab(rgb(accent))
  const i = oklab(rgb(ink))
  return fromOklab(a.map((value, index) => value * accentPercent + i[index] * (1 - accentPercent)))
}

function luminance([r, g, b]) {
  const linear = (channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(rgb(background))].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

function hex(channels) {
  return `#${channels.map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`
}

console.log('Theme       Link contrast  Ink contrast  Override')
for (const { slug, theme } of [base, ...brands]) {
  let accentPercent = 0.62
  let color = mix(theme.accent, theme.ink, accentPercent)
  while (contrast(color, theme.bg) < 4.5 && accentPercent > 0) {
    accentPercent = Math.max(0, accentPercent - 0.01)
    color = mix(theme.accent, theme.ink, accentPercent)
  }
  const linkContrast = contrast(color, theme.bg)
  const inkContrast = contrast(rgb(theme.ink), theme.bg)
  const override = accentPercent < 0.62 ? `${hex(color)} (${Math.round(accentPercent * 100)}% accent)` : 'no'
  console.log(`${slug.padEnd(11)} ${linkContrast.toFixed(2).padStart(7)}:1       ${inkContrast.toFixed(2).padStart(7)}:1      ${override}`)
}
