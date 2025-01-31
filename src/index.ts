import { ScrollSnapSettings, Coordinates, EventHandlers, SnapCoordinates } from './types'
import {
  TIMEOUT_DEFAULT,
  DURATION_DEFAULT,
  THRESHOLD_DEFAULT,
  SNAPSTOP_DEFAULT,
  SHOW_ARROWS_DEFAULT,
  ENABLE_KEYBOARD_DEFAULT,
  NOOP,
  easeInOutQuad as EASING_DEFAULT,
} from './constants'
import {
  parseSnapCoordinatesValue,
  getYSnapLength,
  getXSnapLength,
  stayInBounds,
  roundToNearestSnapPoint,
} from './utils'
import { createArrowElements, updateArrowsPosition } from './arrows'
import { smoothScrollAxis } from './animations'
import { addEventHandler, cleanupEventHandlers, handleKeydown } from './handlers'
import { validateSettings } from './validation'

export type { ScrollSnapSettings }

export default function createScrollSnap(
  element: HTMLElement,
  settings: ScrollSnapSettings = {},
  callback?: () => void
) {
  const onAnimationEnd = typeof callback === 'function' ? callback : NOOP

  let listenerElement: HTMLElement | Window
  let target: HTMLElement
  let arrowContainer: HTMLDivElement | null = null

  let scrollHandlerTimer: number
  let scrollSpeedTimer: number
  let scrollStart: Coordinates
  let speedDeltaX: number
  let speedDeltaY: number
  let snapLengthUnit: SnapCoordinates
  let lastScrollValue: Coordinates = { x: 0, y: 0 }

  let isControlledScroll = false
  let arrows: Record<string, HTMLElement> = {}
  let lastWindowWidth = window.innerWidth
  let lastWindowHeight = window.innerHeight
  let animating = { x: false, y: false }
  let animationFrame = { x: 0, y: 0 }
  let activeHandlers: EventHandlers[] = []
  let activeDirections = { x: 0, y: 0 }
  let lastValidSnapPoints = { x: 0, y: 0 }

  validateSettings(settings)
  const {
    timeout = TIMEOUT_DEFAULT,
    duration = DURATION_DEFAULT,
    threshold = THRESHOLD_DEFAULT,
    snapStop = SNAPSTOP_DEFAULT,
    showArrows = SHOW_ARROWS_DEFAULT,
    enableKeyboard = ENABLE_KEYBOARD_DEFAULT,
    easing = EASING_DEFAULT,
  } = settings

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
    let delta = lastScrollValue[axis] !== null ? newValue - lastScrollValue[axis] : 0

    lastScrollValue[axis] = newValue
    scrollSpeedTimer && clearTimeout(scrollSpeedTimer)
    scrollSpeedTimer = window.setTimeout(clear, 100)

    return delta
  }

  function bindElement(element: HTMLElement) {
    target = element
    listenerElement = element === document.documentElement ? window : element

    addEventHandler(listenerElement, 'scroll', startAnimation, activeHandlers)
    snapLengthUnit = parseSnapCoordinatesValue(settings.snapDestinationX, settings.snapDestinationY)

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

  function startAnimation() {
    speedDeltaX = checkScrollSpeed(target.scrollLeft, 'x')
    speedDeltaY = checkScrollSpeed(target.scrollTop, 'y')

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

  function handler(target: HTMLElement) {
    if (animationFrame.x) clearTimeout(animationFrame.x)
    if (animationFrame.y) clearTimeout(animationFrame.y)

    if (scrollHandlerTimer) {
      clearTimeout(scrollHandlerTimer)
    } else {
      scrollStart = {
        y: target.scrollTop,
        x: target.scrollLeft,
      }
    }

    scrollHandlerTimer = window.setTimeout(animationHandler, timeout)
  }

  function shouldMove(direction: number, currentPoint: number) {
    if (isControlledScroll) return true

    const fractionalPart = currentPoint % 1
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

    if (isControlledScroll) {
      const nextPoint = Math.round(currentPoint) + direction
      return stayInBounds(0, target[size] - target[clientSize], nextPoint * snapLength)
    }

    if (!shouldMove(direction, currentPoint)) {
      return roundToNearestSnapPoint(currentScroll, snapLength)
    }

    let nextPoint: number
    if (snapStop) {
      const currentRoundedPoint = Math.round(lastValidPoint / snapLength)
      nextPoint = currentRoundedPoint + (direction > 0 ? 1 : -1)
    } else {
      nextPoint = direction > 0 ? Math.ceil(currentPoint) : Math.floor(currentPoint)
    }

    return stayInBounds(0, target[size] - target[clientSize], nextPoint * snapLength)
  }

  function animationHandler() {
    // If the scroll position has changed during the timeout, restart the timer
    if (scrollStart.y === target.scrollTop && scrollStart.x === target.scrollLeft) {
      return
    }

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

    if (activeDirections.x !== 0 && !animating.x) {
      listenerElement.removeEventListener('scroll', startAnimation)
      animating.x = true
      smoothScrollAxis(target, { x: snapPoints.x }, 'x', easing, duration, animationFrame, () => {
        animating.x = false
        activeDirections.x = 0
        listenerElement.addEventListener('scroll', startAnimation)
        setLastValidSnapPoint('x', snapPoints.x)
        if (!animating.y) onAnimationEnd()
      })
    }

    if (activeDirections.y !== 0 && !animating.y) {
      listenerElement.removeEventListener('scroll', startAnimation)
      animating.y = true
      smoothScrollAxis(target, { y: snapPoints.y }, 'y', easing, duration, animationFrame, () => {
        animating.y = false
        activeDirections.y = 0
        listenerElement.addEventListener('scroll', startAnimation)
        setLastValidSnapPoint('y', snapPoints.y)
        if (!animating.x) onAnimationEnd()
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

    addEventHandler(
      element,
      'mouseenter',
      () => updateArrowsPosition(element, arrows, arrowContainer),
      activeHandlers
    )
    addEventHandler(
      element,
      'scroll',
      () => updateArrowsPosition(element, arrows, arrowContainer),
      activeHandlers
    )
    addEventHandler(
      window,
      'scroll',
      () => updateArrowsPosition(element, arrows, arrowContainer),
      activeHandlers
    )

    updateArrowsPosition(element, arrows, arrowContainer)
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
    const snapLength = {
      y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
      x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
    }

    const delta = directionMap[direction]
    const nextPoint = {
      y: delta.y
        ? roundToNearestSnapPoint(target.scrollTop + delta.y * snapLength.y, snapLength.y)
        : roundToNearestSnapPoint(target.scrollTop, snapLength.y),
      x: delta.x
        ? roundToNearestSnapPoint(target.scrollLeft + delta.x * snapLength.x, snapLength.x)
        : roundToNearestSnapPoint(target.scrollLeft, snapLength.x),
    }

    activeDirections[axis] = directionMap[direction][axis]
    animating[axis] = true

    smoothScrollAxis(target, nextPoint, axis, easing, duration, animationFrame, () => {
      animating[axis] = false
      activeDirections[axis] = 0
      isControlledScroll = false
      setLastValidSnapPoint(axis, nextPoint[axis])
      onAnimationEnd()
    })
  }

  function handleResize() {
    const oldSnapLength = {
      y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
      x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
    }

    const currentPoint = {
      y: Math.round(target.scrollTop / oldSnapLength.y),
      x: Math.round(target.scrollLeft / oldSnapLength.x),
    }

    requestAnimationFrame(() => {
      const newSnapLength = {
        y: Math.round(getYSnapLength(target, snapLengthUnit.y)),
        x: Math.round(getXSnapLength(target, snapLengthUnit.x)),
      }

      const scrollTo = {
        y: currentPoint.y * newSnapLength.y,
        x: currentPoint.x * newSnapLength.x,
      }

      if (window.innerWidth !== lastWindowWidth || window.innerHeight !== lastWindowHeight) {
        isControlledScroll = true
        smoothScrollAxis(target, scrollTo, 'x', easing, duration, animationFrame, () => {
          smoothScrollAxis(target, scrollTo, 'y', easing, duration, animationFrame, () => {
            isControlledScroll = false
            if (showArrows) {
              updateArrowsPosition(element, arrows, arrowContainer)
            }
          })
        })

        lastWindowWidth = window.innerWidth
        lastWindowHeight = window.innerHeight
      }
    })
  }

  function bind() {
    bindElement(element)

    if (enableKeyboard) {
      if (!element.getAttribute('tabindex')) {
        element.setAttribute('tabindex', '0')
      }
      addEventHandler(
        element,
        'keydown',
        (e) => handleKeydown(e, target, enableKeyboard, scrollToDirection),
        activeHandlers
      )
    }

    addEventHandler(window, 'resize', handleResize, activeHandlers)
    setupArrows()
  }

  function unbind() {
    cleanupEventHandlers(activeHandlers)
    activeHandlers = []

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

    if (animationFrame.x) {
      cancelAnimationFrame(animationFrame.x)
      animationFrame.x = 0
    }
    if (animationFrame.y) {
      cancelAnimationFrame(animationFrame.y)
      animationFrame.y = 0
    }

    animating = { x: false, y: false }
    activeDirections = { x: 0, y: 0 }
    listenerElement = null
    target = null
  }

  bind()

  return {
    bind,
    unbind,
  }
}
