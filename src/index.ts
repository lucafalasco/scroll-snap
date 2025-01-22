// Base easing function for smooth transitions
function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// Default configuration values
const TIMEOUT_MIN = 50
const TIMEOUT_DEFAULT = 100
const DURATION_DEFAULT = 300
const THRESHOLD_DEFAULT = 0.2
const SNAPSTOP_DEFAULT = false
const SHOW_ARROWS_DEFAULT = false
const ENABLE_KEYBOARD_DEFAULT = true
const EASING_DEFAULT = easeInOutQuad
const NOOP = () => {}

export interface ScrollSnapSettings {
  /**
   * Snap destination for x and y axes (px|%|vw|vh)
   */
  snapDestinationX?: string | number
  snapDestinationY?: string | number

  /**
   * Timing configuration for snap behavior
   */
  timeout?: number // Time after which scrolling is considered finished
  duration?: number // Duration of the smooth snap animation
  threshold?: number // Threshold percentage [0,1] to reach before snapping

  /**
   * Prevents passing over intermediate snap positions when true
   */
  snapStop?: boolean

  /**
   * Optional custom easing function for animation
   */
  easing?: (t: number) => number

  /**
   * Navigation options
   */
  showArrows?: boolean
  enableKeyboard?: boolean
}

// Determine optimal arrow colors based on background
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

    // Add hover effect
    element.addEventListener('mouseenter', () => {
      if (element.style.display !== 'none') {
        element.style.opacity = '0.95'
        element.style.transform = 'scale(1.05)'
        element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
      }
    })
    element.addEventListener('mouseleave', () => {
      if (element.style.display !== 'none') {
        element.style.opacity = '0.6'
        element.style.transform = 'scale(1)'
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
      }
    })
  })

  return arrows
}

let arrowContainer: HTMLDivElement | null = null

function updateArrowsPosition(element: HTMLElement, arrows: Record<string, HTMLElement>) {
  // Add early return if arrows or container were cleaned up
  if (!arrowContainer || !Object.keys(arrows).length) return

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

  // If element is being hovered, set opacity for visible arrows
  if (element.matches(':hover')) {
    Object.values(arrows).forEach((arrow) => {
      if (arrow.style.display === 'flex') {
        arrow.style.opacity = '0.6'
      }
    })
  }
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

interface EventHandlers {
  element: HTMLElement | Window
  event: string
  handler: EventListener
}

export default function createScrollSnap(
  element: HTMLElement,
  settings: ScrollSnapSettings = {},
  callback?: () => void
) {
  const onAnimationEnd = typeof callback === 'function' ? callback : NOOP

  let listenerElement: HTMLElement | Window
  let target: HTMLElement

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
  const threshold = settings.threshold ?? THRESHOLD_DEFAULT
  let isControlledScroll = false

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
  const snapStop = settings.snapStop ?? SNAPSTOP_DEFAULT

  if (settings.showArrows && typeof settings.showArrows !== 'boolean') {
    throw new Error(
      `Optional settings property 'showArrows' is not valid, expected BOOLEAN but found ${(typeof settings.snapStop).toUpperCase()}`
    )
  }
  const showArrows = settings.showArrows ?? SHOW_ARROWS_DEFAULT

  if (settings.enableKeyboard && typeof settings.enableKeyboard !== 'boolean') {
    throw new Error(
      `Optional settings property 'enableKeyboard' is not valid, expected BOOLEAN but found ${(typeof settings.snapStop).toUpperCase()}`
    )
  }
  const enableKeyboard = settings.enableKeyboard ?? ENABLE_KEYBOARD_DEFAULT

  let arrows: Record<string, HTMLElement> = {}

  let lastWindowWidth = window.innerWidth
  let lastWindowHeight = window.innerHeight

  let animating = {
    x: false,
    y: false,
  }
  let animationFrame = {
    x: 0,
    y: 0,
  }

  let activeHandlers: EventHandlers[] = []

  // Add tracking for last valid snap points
  let lastValidSnapPoints = {
    x: 0,
    y: 0,
  }

  function getLastValidSnapPoint(axis: 'x' | 'y') {
    return lastValidSnapPoints[axis]
  }

  function setLastValidSnapPoint(axis: 'x' | 'y', value: number) {
    lastValidSnapPoints[axis] = value
  }

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

  function addEventHandler(element: HTMLElement | Window, event: string, handler: EventListener) {
    element.addEventListener(event, handler)
    activeHandlers.push({ element, event, handler })
  }

  function bindElement(element: HTMLElement) {
    target = element
    listenerElement = element === document.documentElement ? window : element

    addEventHandler(listenerElement, 'scroll', startAnimation)
    snapLengthUnit = parseSnapCoordinatesValue(snapDestinationX, snapDestinationY)

    // Initialize last valid snap points
    lastValidSnapPoints = {
      x: roundToNearestSnapPoint(
        element.scrollLeft,
        Math.round(getXSnapLength(element, snapLengthUnit.x))
      ),
      y: roundToNearestSnapPoint(
        element.scrollTop,
        Math.round(getYSnapLength(element, snapLengthUnit.y))
      ),
    }
  }

  function unbindElement() {
    if (listenerElement) {
      // The scroll listener will be removed with other activeHandlers
      listenerElement = null
    }
  }

  // Track active directions
  let activeDirections = {
    x: 0,
    y: 0,
  }

  function startAnimation() {
    speedDeltaX = checkScrollSpeed(target.scrollLeft, 'x')
    speedDeltaY = checkScrollSpeed(target.scrollTop, 'y')

    // Save directions if they are new
    if (speedDeltaX !== 0 && !animating.x) {
      activeDirections.x = Math.sign(speedDeltaX)
    }
    if (speedDeltaY !== 0 && !animating.y) {
      activeDirections.y = Math.sign(speedDeltaY)
    }

    if ((animating.x && animating.y) || (speedDeltaX === 0 && speedDeltaY === 0)) {
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
    if (animationFrame.x) {
      clearTimeout(animationFrame.x)
    }
    if (animationFrame.y) {
      clearTimeout(animationFrame.y)
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

  // Update animation handler to handle consecutive scrolls
  function animationHandler() {
    // Skip if no actual scroll occurred
    if (scrollStart.y === target.scrollTop && scrollStart.x === target.scrollLeft) {
      return
    }

    // Use active directions instead of instantaneous ones for consistent behavior
    const direction = {
      y: activeDirections.y,
      x: activeDirections.x,
    }

    const snapPoints = {
      x: calculateAxisSnapPoint(
        'x',
        direction.x,
        Math.round(getXSnapLength(target, snapLengthUnit.x))
      ),
      y: calculateAxisSnapPoint(
        'y',
        direction.y,
        Math.round(getYSnapLength(target, snapLengthUnit.y))
      ),
    }

    const shouldAnimateX = activeDirections.x !== 0 && !animating.x
    const shouldAnimateY = activeDirections.y !== 0 && !animating.y

    if (shouldAnimateX) {
      listenerElement.removeEventListener('scroll', startAnimation, false)
      animating.x = true
      smoothScrollAxis(target, { x: snapPoints.x }, 'x', () => {
        animating.x = false
        activeDirections.x = 0 // Reset direction after animation
        listenerElement.addEventListener('scroll', startAnimation, false)
        if (!animating.y) onAnimationEnd()
      })
    }

    if (shouldAnimateY) {
      listenerElement.removeEventListener('scroll', startAnimation, false)
      animating.y = true
      smoothScrollAxis(target, { y: snapPoints.y }, 'y', () => {
        animating.y = false
        activeDirections.y = 0 // Reset direction after animation
        listenerElement.addEventListener('scroll', startAnimation, false)
        if (!animating.x) onAnimationEnd()
      })
    }

    scrollStart = {
      y: animating.y ? scrollStart.y : target.scrollTop,
      x: animating.x ? scrollStart.x : target.scrollLeft,
    }
  }

  function roundToNearestSnapPoint(value: number, snapLength: number) {
    // Force precise rounding to avoid floating point errors
    const multiplier = 1000
    return Math.round((value * multiplier) / (snapLength * multiplier)) * snapLength
  }

  function shouldMove(direction: number, currentPoint: number) {
    // For controlled scrolls, we always want to move
    if (isControlledScroll) return true

    const fractionalPart = currentPoint % 1
    // Normalize fractional part to be positive
    const normalizedFraction = fractionalPart >= 0 ? fractionalPart : 1 + fractionalPart

    return direction > 0 ? normalizedFraction > threshold : 1 - normalizedFraction > threshold
  }

  function calculateAxisSnapPoint(axis: 'x' | 'y', direction: number, snapLength: number): number {
    const prop = axis === 'x' ? 'scrollLeft' : 'scrollTop'
    const size = axis === 'x' ? 'scrollWidth' : 'scrollHeight'
    const clientSize = axis === 'x' ? 'clientWidth' : 'clientHeight'

    let currentScroll = target[prop]
    const lastValidPoint = getLastValidSnapPoint(axis)

    if (Math.abs(currentScroll - lastValidPoint) < 1) {
      currentScroll = lastValidPoint
    }

    const currentPoint = currentScroll / snapLength

    // For controlled scrolls, always move one snap point
    if (isControlledScroll) {
      const nextPoint = Math.round(currentPoint) + direction
      return stayInBounds(0, target[size] - target[clientSize], nextPoint * snapLength)
    }

    // For manual scrolls, check threshold
    if (!shouldMove(direction, currentPoint)) {
      return roundToNearestSnapPoint(currentScroll, snapLength)
    }

    // Move to next snap point based on direction
    const nextPoint = direction > 0 ? Math.ceil(currentPoint) : Math.floor(currentPoint)
    return stayInBounds(0, target[size] - target[clientSize], nextPoint * snapLength)
  }

  function getNextSnapPoint(target: HTMLElement, direction: Coordinates) {
    const snapLength = {
      y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
      x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
    }

    // For controlled scrolls (arrows/keyboard), always move exactly one snap point
    return {
      y: direction.y
        ? roundToNearestSnapPoint(target.scrollTop + direction.y * snapLength.y, snapLength.y)
        : roundToNearestSnapPoint(target.scrollTop, snapLength.y),
      x: direction.x
        ? roundToNearestSnapPoint(target.scrollLeft + direction.x * snapLength.x, snapLength.x)
        : roundToNearestSnapPoint(target.scrollLeft, snapLength.x),
    }
  }

  // Ensure scroll position stays within valid boundaries
  function stayInBounds(min: number, max: number, destined: number) {
    return Math.max(Math.min(destined, max), min)
  }

  // Convert snap coordinates from various units (px, %, vw, vh) to actual pixel values
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

  function smoothScrollAxis(
    obj: HTMLElement,
    end: Coordinates,
    axis: 'x' | 'y',
    callback: () => void
  ) {
    const prop = axis === 'x' ? 'scrollLeft' : 'scrollTop'

    if (animationFrame[axis]) {
      cancelAnimationFrame(animationFrame[axis])
    }

    const snapLength =
      axis === 'x'
        ? Math.round(getXSnapLength(obj, snapLengthUnit.x))
        : Math.round(getYSnapLength(obj, snapLengthUnit.y))

    const start = obj[prop]
    // Ensure precise snap point alignment
    const targetEnd = end[axis]

    // Validate end position is on a snap point
    const validatedEnd = roundToNearestSnapPoint(targetEnd, snapLength)

    // Skip animation if already at target or invalid
    if (Math.abs(start - validatedEnd) < 1 || isNaN(validatedEnd)) {
      callback()
      return
    }

    let startTime: number
    let lastPosition = start

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      if (elapsed < duration) {
        const nextPos = start + (validatedEnd - start) * easing(elapsed / duration)
        // Ensure we're moving in the right direction
        if (Math.abs(validatedEnd - nextPos) < Math.abs(validatedEnd - lastPosition)) {
          obj[prop] = nextPos
          lastPosition = nextPos
        }
        animationFrame[axis] = requestAnimationFrame(step)
      } else {
        // Ensure exact final position
        obj[prop] = validatedEnd
        animationFrame[axis] = 0
        isControlledScroll = false
        setLastValidSnapPoint(axis, validatedEnd)
        callback()
      }
    }

    animationFrame[axis] = requestAnimationFrame(step)
  }

  // Replace the existing smoothScroll function with this new one that uses smoothScrollAxis
  function smoothScroll(obj: HTMLElement, end: Coordinates, callback: () => void) {
    const bothAxes = () => {
      if (!animating.x && !animating.y) {
        callback()
      }
    }

    if (!isNaN(end.x)) {
      smoothScrollAxis(obj, end, 'x', bothAxes)
    }
    if (!isNaN(end.y)) {
      smoothScrollAxis(obj, end, 'y', bothAxes)
    }
  }

  // Extract arrow hover handlers to named functions for proper cleanup
  const showArrowsOnHover = () => {
    requestAnimationFrame(() => {
      Object.values(arrows).forEach((arrow) => {
        if (arrow.style.display === 'flex') {
          arrow.style.opacity = '0.6'
        }
      })
    })
  }

  const hideArrowsOnLeave = (e: Event) => {
    const mouseEvent = e as MouseEvent
    const relatedTarget = mouseEvent.relatedTarget as HTMLElement
    if (!element.contains(relatedTarget) && !relatedTarget?.closest('.scroll-snap-arrow')) {
      Object.values(arrows).forEach((arrow) => {
        arrow.style.opacity = '0'
      })
    }
  }

  function setupArrows() {
    if (!showArrows) return

    arrows = createArrowElements(target)

    if (!arrowContainer) {
      arrowContainer = document.createElement('div')
      arrowContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 999;
      `
      document.body.appendChild(arrowContainer)
    }

    Object.entries(arrows).forEach(([direction, arrow]) => {
      arrow.onclick = (e) => {
        e.stopPropagation()
        scrollToDirection(direction as 'up' | 'down' | 'left' | 'right')
      }
      arrowContainer.appendChild(arrow)
    })

    // Add handlers without worrying about cleanup (handled in unbind)
    addEventHandler(element, 'mouseenter', showArrowsOnHover)
    addEventHandler(element, 'mouseleave', hideArrowsOnLeave)
    addEventHandler(element, 'scroll', () => updateArrowsPosition(element, arrows))

    // Initial position and visibility
    updateArrowsPosition(element, arrows)
  }

  function scrollToDirection(direction: 'up' | 'down' | 'left' | 'right') {
    const axis = direction === 'up' || direction === 'down' ? 'y' : 'x'
    if (animating[axis]) return

    const directionMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }

    isControlledScroll = true
    const nextPoint = getNextSnapPoint(target, directionMap[direction])

    activeDirections[axis] = directionMap[direction][axis]
    animating[axis] = true

    smoothScrollAxis(target, nextPoint, axis, () => {
      animating[axis] = false
      activeDirections[axis] = 0
      isControlledScroll = false
      setLastValidSnapPoint(axis, nextPoint[axis])
      onAnimationEnd()
    })
  }

  function handleKeydown(e: Event) {
    const keyEvent = e as KeyboardEvent
    // Only handle events when the target element is focused or the event originated from it
    if (!enableKeyboard || !target.contains(keyEvent.target as Node)) return

    switch (keyEvent.key) {
      case 'ArrowUp':
        e.preventDefault() // Prevent page scrolling
        scrollToDirection('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        scrollToDirection('down')
        break
      case 'ArrowLeft':
        e.preventDefault()
        scrollToDirection('left')
        break
      case 'ArrowRight':
        e.preventDefault()
        scrollToDirection('right')
        break
    }
  }

  function bind() {
    bindElement(element)

    if (enableKeyboard) {
      if (!element.getAttribute('tabindex')) {
        element.setAttribute('tabindex', '0')
      }
      addEventHandler(element, 'keydown', handleKeydown)
    }

    addEventHandler(window, 'resize', handleResize)

    // Setup arrows last to ensure element is properly initialized
    setupArrows()
  }

  function unbind() {
    // Clean up all registered event handlers
    activeHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    activeHandlers = []

    // Clean up arrows
    if (showArrows) {
      Object.values(arrows).forEach((arrow) => {
        arrow.onclick = null
      })

      if (arrowContainer?.parentNode) {
        arrowContainer.parentNode.removeChild(arrowContainer)
        arrowContainer = null
      }

      arrows = {}
    }

    // Cancel any ongoing animations
    if (animationFrame.x) {
      cancelAnimationFrame(animationFrame.x)
      animationFrame.x = 0
    }
    if (animationFrame.y) {
      cancelAnimationFrame(animationFrame.y)
      animationFrame.y = 0
    }

    // Reset states
    animating = { x: false, y: false }
    activeDirections = { x: 0, y: 0 }
    listenerElement = null
    target = null
  }

  function handleResize() {
    // Get current scroll position in terms of snap units
    const oldSnapLength = {
      y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
      x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
    }

    const currentPoint = {
      y: Math.round(target.scrollTop / oldSnapLength.y),
      x: Math.round(target.scrollLeft / oldSnapLength.x),
    }

    // Wait for layout to settle
    requestAnimationFrame(() => {
      // Calculate new snap lengths after resize
      const newSnapLength = {
        y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
        x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
      }

      // Calculate new scroll position
      const scrollTo = {
        y: currentPoint.y * newSnapLength.y,
        x: currentPoint.x * newSnapLength.x,
      }

      // Only scroll if the window dimensions actually changed
      if (window.innerWidth !== lastWindowWidth || window.innerHeight !== lastWindowHeight) {
        isControlledScroll = true
        smoothScroll(target, scrollTo, () => {
          isControlledScroll = false
          if (showArrows) {
            updateArrowsPosition(element, arrows)
          }
        })

        lastWindowWidth = window.innerWidth
        lastWindowHeight = window.innerHeight
      }
    })
  }

  bind()

  return {
    bind,
    unbind,
  }
}
