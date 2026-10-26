import { useEffect, useState } from 'react'

const layers = ['soft', 'middle', 'strong'] as const

export function EdgeBlur() {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setSupported(
        (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)')) &&
        !reducedTransparency.matches &&
        !reducedMotion.matches,
      )
    }
    update()
    reducedTransparency.addEventListener('change', update)
    reducedMotion.addEventListener('change', update)
    return () => {
      reducedTransparency.removeEventListener('change', update)
      reducedMotion.removeEventListener('change', update)
    }
  }, [])

  if (!supported) return null

  return (
    <div className="edge-blur" aria-hidden="true">
      {layers.map((layer) => (
        <span key={`top-${layer}`} className={`edge-blur__layer edge-blur__layer--top edge-blur__layer--${layer}`} />
      ))}
      {layers.map((layer) => (
        <span key={`bottom-${layer}`} className={`edge-blur__layer edge-blur__layer--bottom edge-blur__layer--${layer}`} />
      ))}
    </div>
  )
}
