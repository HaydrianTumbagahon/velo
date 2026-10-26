export type FitTextOptions = {
  min?: number
}

export function fitText(el: HTMLElement, { min = 0.55 }: FitTextOptions = {}): () => void {
  let frame = 0
  let active = true
  const measure = () => {
    if (!active) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      el.style.fontSize = ''
      const baseSize = Number.parseFloat(getComputedStyle(el).fontSize)
      el.style.setProperty('--fit', '1')
      el.style.fontSize = `calc(var(--fit) * ${baseSize}px)`
      let low = min
      let high = 1
      const maxHeight = getComputedStyle(el).maxHeight
      const checkHeight = maxHeight !== 'none' && Number.isFinite(Number.parseFloat(maxHeight))
      const fits = () =>
        el.scrollWidth <= el.clientWidth &&
        (!checkHeight || el.scrollHeight <= el.clientHeight)

      if (fits()) return
      for (let iteration = 0; iteration < 12; iteration += 1) {
        const middle = (low + high) / 2
        el.style.setProperty('--fit', String(middle))
        if (fits()) low = middle
        else high = middle
      }
      el.style.setProperty('--fit', String(low))
    })
  }

  let previousWidth = -1
  let previousHeight = -1
  const observer = new ResizeObserver(() => {
    const width = el.clientWidth
    const maxHeight = getComputedStyle(el).maxHeight
    const height = maxHeight !== 'none' ? el.clientHeight : -1
    if (width === previousWidth && height === previousHeight) return
    previousWidth = width
    previousHeight = height
    measure()
  })
  observer.observe(el)
  void document.fonts.ready.then(() => {
    if (active) measure()
  })
  measure()

  return () => {
    active = false
    cancelAnimationFrame(frame)
    observer.disconnect()
    el.style.removeProperty('--fit')
    el.style.fontSize = ''
  }
}
