const ARROW_SVG = {
  right: (color: string) =>
    `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`
    )}`,
  left: (color: string) =>
    `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>`
    )}`,
  up: (color: string) =>
    `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41-1.41z"/></svg>`
    )}`,
  down: (color: string) =>
    `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`
    )}`,
}

export function getBackgroundBrightness(element: HTMLElement): 'light' | 'dark' {
  const bgColor = window.getComputedStyle(element).backgroundColor
  const rgb = bgColor.match(/\d+/g)?.map(Number) || [255, 255, 255]
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  return brightness > 128 ? 'light' : 'dark'
}

let hoveredArrow: HTMLElement | null = null

export function createArrowElements(target: HTMLElement) {
  const arrows = {
    up: document.createElement('div'),
    down: document.createElement('div'),
    left: document.createElement('div'),
    right: document.createElement('div'),
  }

  Object.entries(arrows).forEach(([direction, element]) => {
    const theme = getBackgroundBrightness(target)
    const iconColor = theme === 'light' ? '#1a1a1a' : '#ffffff'
    const bgColor = theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'

    element.className = `scroll-snap-arrow scroll-snap-arrow-${direction}`
    element.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      background-size: 24px;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
      z-index: 1000;
      background-image: url(${ARROW_SVG[direction as keyof typeof ARROW_SVG](iconColor)});
      background-color: ${bgColor};
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      display: none;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
    `

    element.addEventListener('mouseenter', () => {
      if (element.style.display !== 'none') {
        hoveredArrow = element
        element.style.opacity = '0.95'
        element.style.transform = 'scale(1.05)'
        element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
      }
    })
    element.addEventListener('mouseleave', () => {
      if (element.style.display !== 'none') {
        hoveredArrow = null
        element.style.opacity = '0.6'
        element.style.transform = 'scale(1)'
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
      }
    })
  })

  return arrows
}

export function updateArrowsPosition(
  element: HTMLElement,
  arrows: Record<string, HTMLElement>,
  arrowContainer: HTMLDivElement | null
) {
  if (!arrowContainer || !Object.keys(arrows).length) return

  const rect = element.getBoundingClientRect()
  const padding = 16
  const halfArrowSize = 20

  arrows.up.style.top = `${rect.top + padding}px`
  arrows.up.style.left = `${rect.left + rect.width / 2 - halfArrowSize}px`

  arrows.down.style.bottom = `${window.innerHeight - rect.bottom + padding}px`
  arrows.down.style.left = `${rect.left + rect.width / 2 - halfArrowSize}px`

  arrows.left.style.left = `${rect.left + padding}px`
  arrows.left.style.top = `${rect.top + rect.height / 2 - halfArrowSize}px`

  arrows.right.style.right = `${window.innerWidth - rect.right + padding}px`
  arrows.right.style.top = `${rect.top + rect.height / 2 - halfArrowSize}px`

  Object.values(arrows).forEach((arrow) => {
    const shouldDisplay = getArrowVisibility(element, arrow.className)
    arrow.style.display = shouldDisplay ? 'flex' : 'none'

    if (shouldDisplay) {
      arrow.style.opacity = element.matches(':hover') || arrow === hoveredArrow ? '0.6' : '0'
    }
  })
}

function getArrowVisibility(element: HTMLElement, className: string): boolean {
  if (className.includes('up')) {
    return element.scrollTop > 0
  }
  if (className.includes('down')) {
    return element.scrollTop < element.scrollHeight - element.clientHeight
  }
  if (className.includes('left')) {
    return element.scrollLeft > 0
  }
  if (className.includes('right')) {
    return element.scrollLeft < element.scrollWidth - element.clientWidth
  }
  return false
}
