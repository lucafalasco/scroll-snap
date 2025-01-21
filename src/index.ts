function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

const TIMEOUT_MIN = 50
const TIMEOUT_DEFAULT = 100
const DURATION_DEFAULT = 300
const THRESHOLD_DEFAULT = 0.2
const SNAPSTOP_DEFAULT = false
const EASING_DEFAULT = easeInOutQuad
const NOOP = () => {}

export interface ScrollSnapSettings {
  /**
   * snap-destination for x and y axes
   * should be a valid css value expressed as px|%|vw|vh
   */
  snapDestinationX?: string | number
  snapDestinationY?: string | number
  /**
   * time in ms after which scrolling is considered finished
   */
  timeout?: number
  /**
   * duration in ms for the smooth snap
   */
  duration?: number
  /**
   * threshold to reach before scrolling to next/prev element, expressed as a percentage in the range [0, 1]
   */
  threshold?: number
  /**
   * when true, the scroll container is not allowed to "pass over" the other snap positions
   */
  snapStop?: boolean
  /**
   * custom easing function
   * @param t normalized time typically in the range [0, 1]
   */
  easing?: (t: number) => number
  /**
   * show navigation arrows on hover
   */
  showArrows?: boolean
  /**
   * enable keyboard navigation
   */
  enableKeyboard?: boolean
}

function getBackgroundBrightness(element: HTMLElement): 'light' | 'dark' {
  const bgColor = window.getComputedStyle(element).backgroundColor
  const rgb = bgColor.match(/\d+/g)?.map(Number) || [255, 255, 255]
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  return brightness > 128 ? 'light' : 'dark'
}

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
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>`
    )}`,
  down: (color: string) =>
    `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>`
    )}`,
} as const

function createArrowElements(target: HTMLElement) {
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
      transition: all 0.3s ease;
      cursor: pointer;
      z-index: 1000;
      background-image: url(${ARROW_SVG[direction as keyof typeof ARROW_SVG](iconColor)});
      background-color: ${bgColor};
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
    `

    // Add hover effect
    element.addEventListener('mouseenter', () => {
      element.style.opacity = '0.95'
      element.style.transform = 'scale(1.05)'
      element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
    })
    element.addEventListener('mouseleave', () => {
      element.style.opacity = '0.6'
      element.style.transform = 'scale(1)'
      element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
    })
  })

  return arrows
}

function updateArrowsPosition(element: HTMLElement, arrows: Record<string, HTMLElement>) {
  const rect = element.getBoundingClientRect()
  const padding = 16 // Consistent padding
  const halfArrowSize = 20 // Half of arrow size for centering

  // Center vertically for left/right arrows, horizontally for up/down arrows
  arrows.up.style.top = `${rect.top + padding}px`
  arrows.up.style.left = `${rect.left + rect.width / 2 - halfArrowSize}px`

  arrows.down.style.bottom = `${window.innerHeight - rect.bottom + padding}px`
  arrows.down.style.left = `${rect.left + rect.width / 2 - halfArrowSize}px`

  arrows.left.style.left = `${rect.left + padding}px`
  arrows.left.style.top = `${rect.top + rect.height / 2 - halfArrowSize}px`

  arrows.right.style.right = `${window.innerWidth - rect.right + padding}px`
  arrows.right.style.top = `${rect.top + rect.height / 2 - halfArrowSize}px`

  // Only show arrows when there's scroll available in that direction
  arrows.up.style.display = element.scrollTop > 0 ? 'flex' : 'none'
  arrows.down.style.display =
    element.scrollTop < element.scrollHeight - element.clientHeight ? 'flex' : 'none'
  arrows.left.style.display = element.scrollLeft > 0 ? 'flex' : 'none'
  arrows.right.style.display =
    element.scrollLeft < element.scrollWidth - element.clientWidth ? 'flex' : 'none'
}

interface SnapLength {
  value: number
  unit: string
}

interface SnapCoordinates {
  y: SnapLength
  x: SnapLength
}

interface Coordinates {
  y?: number
  x?: number
}

export default function createScrollSnap(
  element: HTMLElement,
  settings: ScrollSnapSettings = {},
  callback?: () => void
) {
  const onAnimationEnd = typeof callback === 'function' ? callback : NOOP

  let listenerElement: HTMLElement | Window
  let target: HTMLElement
  let animating = false

  let scrollHandlerTimer: number
  let scrollSpeedTimer: number
  let scrollStart: Coordinates
  let speedDeltaX: number
  let speedDeltaY: number
  let snapLengthUnit: SnapCoordinates
  let lastScrollValue: Coordinates = {
    x: 0,
    y: 0,
  }
  let animationFrame: number

  const { snapDestinationX, snapDestinationY } = settings

  if (
    snapDestinationX &&
    typeof snapDestinationX !== 'string' &&
    typeof snapDestinationX !== 'number'
  ) {
    throw new Error(
      `Settings property 'snapDestinationX' is not valid, expected STRING or NUMBER but found ${(typeof snapDestinationX).toUpperCase()}`
    )
  }

  if (
    snapDestinationY &&
    typeof snapDestinationY !== 'string' &&
    typeof snapDestinationY !== 'number'
  ) {
    throw new Error(
      `Settings property 'snapDestinationY' is not valid, expected STRING or NUMBER but found ${(typeof snapDestinationY).toUpperCase()}`
    )
  }

  if (settings.timeout && (isNaN(settings.timeout) || typeof settings.timeout === 'boolean')) {
    throw new Error(
      `Optional settings property 'timeout' is not valid, expected NUMBER but found ${(typeof settings.timeout).toUpperCase()}`
    )
  }
  // any value less then TIMEOUT_MIN may cause weird bahaviour on some devices (especially on mobile with momentum scrolling)
  const timeout =
    settings.timeout && settings.timeout >= TIMEOUT_MIN ? settings.timeout : TIMEOUT_DEFAULT

  if (settings.duration && (isNaN(settings.duration) || typeof settings.duration === 'boolean')) {
    throw new Error(
      `Optional settings property 'duration' is not valid, expected NUMBER but found ${(typeof settings.duration).toUpperCase()}`
    )
  }
  const duration = settings.duration || DURATION_DEFAULT

  if (
    settings.threshold &&
    (isNaN(settings.threshold) || typeof settings.threshold === 'boolean')
  ) {
    throw new Error(
      `Optional settings property 'threshold' is not valid, expected NUMBER but found ${(typeof settings.threshold).toUpperCase()}`
    )
  }
  const threshold = settings.threshold || THRESHOLD_DEFAULT
  let isSimulatedScroll = false

  if (settings.easing && typeof settings.easing !== 'function') {
    throw new Error(
      `Optional settings property 'easing' is not valid, expected FUNCTION but found ${(typeof settings.easing).toUpperCase()}`
    )
  }
  const easing = settings.easing || EASING_DEFAULT

  if (settings.snapStop && typeof settings.snapStop !== 'boolean') {
    throw new Error(
      `Optional settings property 'snapStop' is not valid, expected BOOLEAN but found ${(typeof settings.snapStop).toUpperCase()}`
    )
  }
  const snapStop = settings.snapStop || SNAPSTOP_DEFAULT

  const showArrows = settings.showArrows ?? false
  const enableKeyboard = settings.enableKeyboard ?? true

  let arrows: Record<string, HTMLElement> = {}

  function checkScrollSpeed(value: number, axis: 'x' | 'y') {
    const clear = () => {
      lastScrollValue[axis] = null
    }

    const newValue = value
    let delta

    if (lastScrollValue[axis] !== null) {
      delta = newValue - lastScrollValue[axis]
    } else {
      delta = 0
    }

    lastScrollValue[axis] = newValue
    scrollSpeedTimer && clearTimeout(scrollSpeedTimer)
    scrollSpeedTimer = window.setTimeout(clear, 100)

    return delta
  }

  function bindElement(element: HTMLElement) {
    target = element
    listenerElement = element === document.documentElement ? window : element

    listenerElement.addEventListener('scroll', startAnimation, false)
    snapLengthUnit = parseSnapCoordinatesValue(snapDestinationX, snapDestinationY)
  }

  function unbindElement() {
    listenerElement.removeEventListener('scroll', startAnimation, false)
  }

  function startAnimation() {
    speedDeltaX = checkScrollSpeed(target.scrollLeft, 'x')
    speedDeltaY = checkScrollSpeed(target.scrollTop, 'y')

    if (animating || (speedDeltaX === 0 && speedDeltaY === 0)) {
      return
    }

    handler(target)
  }

  /**
   * scroll handler
   * this is the callback for scroll events.
   */
  function handler(target: HTMLElement) {
    // if currently animating, stop it. this prevents flickering.
    if (animationFrame) {
      clearTimeout(animationFrame)
    }

    // if a previous timeout exists, clear it.
    if (scrollHandlerTimer) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(scrollHandlerTimer)
    } else {
      scrollStart = {
        y: target.scrollTop,
        x: target.scrollLeft,
      }
    }

    scrollHandlerTimer = window.setTimeout(animationHandler, timeout)
  }

  function animationHandler() {
    // if we don't move a thing, we can ignore the timeout: if we did, there'd be another timeout added for scrollStart+1.
    if (scrollStart.y === target.scrollTop && scrollStart.x === target.scrollLeft) {
      // ignore timeout
      return
    }

    // detect direction of scroll. negative is up, positive is down.
    const direction = {
      y: Math.sign(speedDeltaY),
      x: Math.sign(speedDeltaX),
    }

    // get the next snap-point to snap-to
    const snapPoint = getNextSnapPoint(target, direction)

    listenerElement.removeEventListener('scroll', startAnimation, false)

    animating = true

    // smoothly move to the snap point
    smoothScroll(target, snapPoint, () => {
      // after moving to the snap point, rebind the scroll event handler
      animating = false
      listenerElement.addEventListener('scroll', startAnimation, false)
      onAnimationEnd()

      // reset scrollStart
      scrollStart = {
        y: target.scrollTop,
        x: target.scrollLeft,
      }
    })
  }

  function getNextSnapPoint(target: HTMLElement, direction: Coordinates) {
    // get snap length
    const snapLength = {
      y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
      x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
    }
    const top = target.scrollTop
    const left = target.scrollLeft

    const startPoint = {
      y: scrollStart.y / snapLength.y || 0,
      x: scrollStart.x / snapLength.x || 0,
    }
    const currentPoint = {
      y: top / snapLength.y || 0,
      x: left / snapLength.x || 0,
    }
    const nextPoint = {
      y: 0,
      x: 0,
    }

    /**
     * Set target and bounds by direction,
     * if threshold has not been reached, scroll back to currentPoint
     **/
    if (isAboveThreshold(direction.y, currentPoint.y)) {
      if (snapStop) {
        nextPoint.y = roundByDirection(-direction.y, startPoint.y + direction.y)
      } else {
        nextPoint.y = roundByDirection(direction.y, currentPoint.y)
      }
    } else {
      nextPoint.y = roundByDirection(direction.y * -1, currentPoint.y)
    }

    if (isAboveThreshold(direction.x, currentPoint.x)) {
      if (snapStop) {
        nextPoint.x = roundByDirection(-direction.x, startPoint.x + direction.x)
      } else {
        nextPoint.x = roundByDirection(direction.x, currentPoint.x)
      }
    } else {
      nextPoint.x = roundByDirection(direction.x * -1, currentPoint.x)
    }

    // DEBUG
    // console.log('direction', direction)
    // console.log('startPoint', startPoint)
    // console.log('currentPoint', currentPoint)
    // console.log('nextPoint', nextPoint)

    // calculate where to scroll
    const scrollTo = {
      y: nextPoint.y * snapLength.y,
      x: nextPoint.x * snapLength.x,
    }

    // stay in bounds (minimum: 0, maxmimum: absolute height)
    scrollTo.y = stayInBounds(0, target.scrollHeight, scrollTo.y)
    scrollTo.x = stayInBounds(0, target.scrollWidth, scrollTo.x)

    return scrollTo
  }

  function isAboveThreshold(direction: number, value: number) {
    const effectiveThreshold = isSimulatedScroll ? 0 : threshold
    return direction > 0 ? value % 1 > effectiveThreshold : 1 - (value % 1) > effectiveThreshold
  }

  function roundByDirection(direction: number, value: number) {
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      return Math.floor(value)
    }
    // go down, we ceil the number to jump to the next in view.
    return Math.ceil(value)
  }

  function stayInBounds(min: number, max: number, destined: number) {
    return Math.max(Math.min(destined, max), min)
  }

  function parseSnapCoordinatesValue(
    x: ScrollSnapSettings['snapDestinationX'],
    y: ScrollSnapSettings['snapDestinationY']
  ) {
    // regex to parse lengths
    const regex = /([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?)(px|%|vw|vh)/
    // defaults
    const parsed = {
      y: {
        value: 0,
        unit: 'px',
      },
      x: {
        value: 0,
        unit: 'px',
      },
    }

    if (typeof y === 'number') {
      parsed.y.value = y
    } else {
      const resultY = regex.exec(y)
      if (resultY !== null) {
        parsed.y = {
          value: Number(resultY[1]),
          unit: resultY[2],
        }
      }
    }

    if (typeof x === 'number') {
      parsed.x.value = x
    } else {
      const resultX = regex.exec(x)
      if (resultX !== null) {
        parsed.x = {
          value: Number(resultX[1]),
          unit: resultX[2],
        }
      }
    }

    return parsed
  }

  function getYSnapLength(obj: HTMLElement, declaration: SnapLength) {
    // get y snap length based on declaration unit
    if (declaration.unit === 'vh') {
      return (
        (Math.max(document.documentElement.clientHeight, window.innerHeight || 1) / 100) *
        declaration.value
      )
    } else if (declaration.unit === '%') {
      return (obj.clientHeight / 100) * declaration.value
    } else {
      return declaration.value
    }
  }

  function getXSnapLength(obj: HTMLElement, declaration: SnapLength) {
    // get x snap length based on declaration unit
    if (declaration.unit === 'vw') {
      return (
        (Math.max(document.documentElement.clientWidth, window.innerWidth || 1) / 100) *
        declaration.value
      )
    } else if (declaration.unit === '%') {
      return (obj.clientWidth / 100) * declaration.value
    } else {
      return declaration.value
    }
  }

  function isEdge(Coordinates: Coordinates) {
    return (Coordinates.x === 0 && speedDeltaY === 0) || (Coordinates.y === 0 && speedDeltaX === 0)
  }

  function smoothScroll(obj: HTMLElement, end: Coordinates, callback: (...args: any) => void) {
    // Clear any existing animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }

    const position = (start: number, end: number, elapsed: number, period: number) => {
      if (elapsed > period) {
        return end
      }
      return start + (end - start) * easing(elapsed / period)
    }

    const start = {
      y: obj.scrollTop,
      x: obj.scrollLeft,
    }

    let startTime: number

    // setup the stepping function
    function step(timestamp: number) {
      if (!startTime) {
        startTime = timestamp
      }
      const elapsed = timestamp - startTime

      // change position on y-axis if result is a number.
      if (!isNaN(end.y)) {
        obj.scrollTop = position(start.y, end.y, elapsed, duration)
      }

      // change position on x-axis if result is a number.
      if (!isNaN(end.x)) {
        obj.scrollLeft = position(start.x, end.x, elapsed, duration)
      }

      // check if we are over due
      if (elapsed < duration) {
        animationFrame = requestAnimationFrame(step)
      } else {
        // Ensure final position is reached
        if (!isNaN(end.y)) obj.scrollTop = end.y
        if (!isNaN(end.x)) obj.scrollLeft = end.x

        // Clean up and call callback
        animationFrame = 0
        wrappedCallback(end)
      }
    }

    const wrappedCallback = (end: Coordinates) => {
      isSimulatedScroll = false
      if (typeof callback === 'function') {
        callback(end)
      }
    }

    animationFrame = requestAnimationFrame(step)
  }

  function setupArrows() {
    if (!showArrows) return

    arrows = createArrowElements(target)

    // Create a container for the arrows
    const arrowContainer = document.createElement('div')
    arrowContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 999;
    `

    // Add arrows to container and attach click handlers
    Object.entries(arrows).forEach(([direction, arrow]) => {
      arrow.onclick = (e) => {
        e.stopPropagation()
        scrollToDirection(direction as 'up' | 'down' | 'left' | 'right')
      }
      arrowContainer.appendChild(arrow)
    })

    document.body.appendChild(arrowContainer)

    // Initial position update
    updateArrowsPosition(element, arrows)

    // Update positions on scroll and resize
    const updatePositions = () => updateArrowsPosition(element, arrows)
    element.addEventListener('scroll', updatePositions)
    window.addEventListener('resize', updatePositions)

    // Show arrows on container hover
    element.addEventListener('mouseenter', () => {
      Object.values(arrows).forEach((arrow) => {
        if (arrow.style.display !== 'none') {
          arrow.style.opacity = '0.6' // Initial opacity when container is hovered
        }
      })
    })

    // Hide arrows when leaving container or arrows
    const hideArrows = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement
      if (!element.contains(relatedTarget) && !relatedTarget?.closest('.scroll-snap-arrow')) {
        Object.values(arrows).forEach((arrow) => {
          arrow.style.opacity = '0'
        })
      }
    }

    element.addEventListener('mouseleave', hideArrows)
    Object.values(arrows).forEach((arrow) => {
      arrow.addEventListener('mouseleave', hideArrows)
    })
  }

  function scrollToDirection(direction: 'up' | 'down' | 'left' | 'right') {
    if (animating) return // Prevent multiple animations

    const dir = {
      x: direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
      y: direction === 'up' ? -1 : direction === 'down' ? 1 : 0,
    }

    // Calculate snap length
    const snapLength = {
      y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
      x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
    }

    // Get current position in snap units
    const currentPoint = {
      y: target.scrollTop / snapLength.y || 0,
      x: target.scrollLeft / snapLength.x || 0,
    }

    // Calculate next point
    const nextPoint = {
      y: dir.y === 0 ? currentPoint.y : Math.round(currentPoint.y) + dir.y,
      x: dir.x === 0 ? currentPoint.x : Math.round(currentPoint.x) + dir.x,
    }

    // Calculate scroll destination
    const scrollTo = {
      y: nextPoint.y * snapLength.y,
      x: nextPoint.x * snapLength.x,
    }

    // Stay in bounds
    scrollTo.y = stayInBounds(0, target.scrollHeight - target.clientHeight, scrollTo.y)
    scrollTo.x = stayInBounds(0, target.scrollWidth - target.clientWidth, scrollTo.x)

    // Perform the smooth scroll
    animating = true
    smoothScroll(target, scrollTo, () => {
      animating = false
      onAnimationEnd()
    })
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!enableKeyboard) return

    switch (e.key) {
      case 'ArrowUp':
        scrollToDirection('up')
        break
      case 'ArrowDown':
        scrollToDirection('down')
        break
      case 'ArrowLeft':
        scrollToDirection('left')
        break
      case 'ArrowRight':
        scrollToDirection('right')
        break
    }
  }

  function bind() {
    bindElement(element)
    setupArrows()
    if (enableKeyboard) {
      window.addEventListener('keydown', handleKeydown)
    }
  }

  function unbind() {
    unbindElement()
    if (enableKeyboard) {
      window.removeEventListener('keydown', handleKeydown)
    }
    if (showArrows) {
      window.removeEventListener('resize', () => updateArrowsPosition(element, arrows))
      element.removeEventListener('scroll', () => updateArrowsPosition(element, arrows))
      Object.values(arrows).forEach((arrow) => arrow.remove())
    }
  }

  bind()

  return {
    bind,
    unbind,
  }
}
