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

interface ScrollSnapConfiguration {
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
}

interface SnapLength {
  value: number
  unit: string
}

interface SnapCoord {
  y: SnapLength
  x: SnapLength
}

interface Coords {
  y?: number
  x?: number
}

export default class ScrollSnap {
  snapDestinationX: ScrollSnapConfiguration['snapDestinationX']
  snapDestinationY: ScrollSnapConfiguration['snapDestinationY']
  timeout: ScrollSnapConfiguration['timeout']
  duration: ScrollSnapConfiguration['duration']
  threshold: ScrollSnapConfiguration['threshold']
  snapStop: ScrollSnapConfiguration['snapStop']
  easing: ScrollSnapConfiguration['easing']

  element: HTMLElement
  listenerElement: HTMLElement | Window
  target: HTMLElement
  animating = false

  private onAnimationEnd: () => void
  private scrollHandlerTimer: number
  private scrollSpeedTimer: number
  private scrollStart: Coords
  private speedDeltaX: number
  private speedDeltaY: number
  private snapLengthUnit: SnapCoord
  private lastScrollValue: Coords = {
    x: 0,
    y: 0,
  }
  private animationFrame: number

  constructor(element: HTMLElement, config: ScrollSnapConfiguration) {
    this.element = element
    const {
      snapDestinationX,
      snapDestinationY,
      timeout,
      duration,
      threshold,
      snapStop,
      easing,
    } = config

    if (
      snapDestinationX &&
      typeof snapDestinationX !== 'string' &&
      typeof snapDestinationX !== 'number'
    ) {
      throw new Error(
        `Config property 'snapDestinationX' is not valid, expected STRING or NUMBER but found ${(typeof snapDestinationX).toUpperCase()}`
      )
    }
    this.snapDestinationX = snapDestinationX

    if (
      snapDestinationY &&
      typeof snapDestinationY !== 'string' &&
      typeof snapDestinationY !== 'number'
    ) {
      throw new Error(
        `Config property 'snapDestinationY' is not valid, expected STRING or NUMBER but found ${(typeof snapDestinationY).toUpperCase()}`
      )
    }
    this.snapDestinationY = snapDestinationY

    if (timeout && (isNaN(timeout) || typeof timeout === 'boolean')) {
      throw new Error(
        `Optional config property 'timeout' is not valid, expected NUMBER but found ${(typeof timeout).toUpperCase()}`
      )
    }
    // any value less then TIMEOUT_MIN may cause weird bahaviour on some devices (especially on mobile with momentum scrolling)
    this.timeout = timeout && timeout >= TIMEOUT_MIN ? timeout : TIMEOUT_DEFAULT

    if (duration && (isNaN(duration) || typeof duration === 'boolean')) {
      throw new Error(
        `Optional config property 'duration' is not valid, expected NUMBER but found ${(typeof duration).toUpperCase()}`
      )
    }
    this.duration = duration || DURATION_DEFAULT

    if (threshold && (isNaN(threshold) || typeof threshold === 'boolean')) {
      throw new Error(
        `Optional config property 'threshold' is not valid, expected NUMBER but found ${(typeof threshold).toUpperCase()}`
      )
    }
    this.threshold = threshold || THRESHOLD_DEFAULT

    if (easing && typeof easing !== 'function') {
      throw new Error(
        `Optional config property 'easing' is not valid, expected FUNCTION but found ${(typeof easing).toUpperCase()}`
      )
    }
    this.easing = easing || EASING_DEFAULT

    if (snapStop && typeof snapStop !== 'boolean') {
      throw new Error(
        `Optional config property 'snapStop' is not valid, expected BOOLEAN but found ${(typeof snapStop).toUpperCase()}`
      )
    }
    this.snapStop = snapStop || SNAPSTOP_DEFAULT
  }

  private checkScrollSpeed(value: number, axis: 'x' | 'y') {
    const clear = () => {
      this.lastScrollValue[axis] = null
    }

    const newValue = value
    let delta

    if (this.lastScrollValue[axis] !== null) {
      delta = newValue - this.lastScrollValue[axis]
    } else {
      delta = 0
    }

    this.lastScrollValue[axis] = newValue
    this.scrollSpeedTimer && clearTimeout(this.scrollSpeedTimer)
    this.scrollSpeedTimer = window.setTimeout(clear, 100)

    return delta
  }

  private saveDeclaration(obj: HTMLElement) {
    this.snapLengthUnit = this.parseSnapCoordValue(this.snapDestinationX, this.snapDestinationY)
  }

  private bindElement(element: HTMLElement) {
    this.target = element
    this.listenerElement = element === document.documentElement ? window : element

    this.listenerElement.addEventListener('scroll', this.startAnimation, false)
    this.saveDeclaration(this.target)
  }

  private unbindElement() {
    this.listenerElement.removeEventListener('scroll', this.startAnimation, false)
  }

  private startAnimation = () => {
    this.speedDeltaX = this.checkScrollSpeed(this.target.scrollLeft, 'x')
    this.speedDeltaY = this.checkScrollSpeed(this.target.scrollTop, 'y')

    if (this.animating || (this.speedDeltaX === 0 && this.speedDeltaY === 0)) {
      return
    }

    this.handler(this.target)
  }

  /**
   * scroll handler
   * this is the callback for scroll events.
   */
  private handler(target: HTMLElement) {
    // if currently animating, stop it. this prevents flickering.
    if (this.animationFrame) {
      clearTimeout(this.animationFrame)
    }

    // if a previous timeout exists, clear it.
    if (this.scrollHandlerTimer) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(this.scrollHandlerTimer)
    } else {
      this.scrollStart = {
        y: target.scrollTop,
        x: target.scrollLeft,
      }
    }

    this.scrollHandlerTimer = window.setTimeout(this.animationHandler, this.timeout)
  }

  private animationHandler = () => {
    // if we don't move a thing, we can ignore the timeout: if we did, there'd be another timeout added for this.scrollStart+1.
    if (
      this.scrollStart.y === this.target.scrollTop &&
      this.scrollStart.x === this.target.scrollLeft
    ) {
      // ignore timeout
      return
    }

    // detect direction of scroll. negative is up, positive is down.
    const direction = {
      y: Math.sign(this.speedDeltaY),
      x: Math.sign(this.speedDeltaX),
    }

    // get the next snap-point to snap-to
    const snapPoint = this.getNextSnapPoint(this.target, direction)

    this.listenerElement.removeEventListener('scroll', this.startAnimation, false)

    this.animating = true

    // smoothly move to the snap point
    this.smoothScroll(this.target, snapPoint, () => {
      // after moving to the snap point, rebind the scroll event handler
      this.animating = false
      this.listenerElement.addEventListener('scroll', this.startAnimation, false)
      this.onAnimationEnd()

      // reset scrollStart
      this.scrollStart = {
        y: this.target.scrollTop,
        x: this.target.scrollLeft,
      }
    })
  }

  private getNextSnapPoint(target: HTMLElement, direction: Coords) {
    // get snap length
    const snapLength = {
      y: Math.round(this.getYSnapLength(this.target, this.snapLengthUnit.y)),
      x: Math.round(this.getXSnapLength(this.target, this.snapLengthUnit.x)),
    }
    const top = this.target.scrollTop
    const left = this.target.scrollLeft

    const startPoint = {
      y: this.scrollStart.y / snapLength.y || 0,
      x: this.scrollStart.x / snapLength.x || 0,
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
    if (this.isAboveThreshold(direction.y, currentPoint.y)) {
      if (this.snapStop) {
        nextPoint.y = this.roundByDirection(-direction.y, startPoint.y + direction.y)
      } else {
        nextPoint.y = this.roundByDirection(direction.y, currentPoint.y)
      }
    } else {
      nextPoint.y = this.roundByDirection(direction.y * -1, currentPoint.y)
    }

    if (this.isAboveThreshold(direction.x, currentPoint.x)) {
      if (this.snapStop) {
        nextPoint.x = this.roundByDirection(-direction.x, startPoint.x + direction.x)
      } else {
        nextPoint.x = this.roundByDirection(direction.x, currentPoint.x)
      }
    } else {
      nextPoint.x = this.roundByDirection(direction.x * -1, currentPoint.x)
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
    scrollTo.y = this.stayInBounds(0, target.scrollHeight, scrollTo.y)
    scrollTo.x = this.stayInBounds(0, target.scrollWidth, scrollTo.x)

    return scrollTo
  }

  private isAboveThreshold(direction: number, value: number) {
    return direction > 0 ? value % 1 > this.threshold : 1 - (value % 1) > this.threshold
  }

  private roundByDirection(direction: number, value: number) {
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      return Math.floor(value)
    }
    // go down, we ceil the number to jump to the next in view.
    return Math.ceil(value)
  }

  private stayInBounds(min: number, max: number, destined: number) {
    return Math.max(Math.min(destined, max), min)
  }

  private parseSnapCoordValue(
    x: ScrollSnapConfiguration['snapDestinationX'],
    y: ScrollSnapConfiguration['snapDestinationY']
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

  private getYSnapLength(obj: HTMLElement, declaration: SnapLength) {
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

  private getXSnapLength(obj: HTMLElement, declaration: SnapLength) {
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

  private isEdge(coords: Coords) {
    return (coords.x === 0 && this.speedDeltaY === 0) || (coords.y === 0 && this.speedDeltaX === 0)
  }

  private smoothScroll(obj: HTMLElement, end: Coords, callback: (...args: any) => void) {
    const position = (start: number, end: number, elapsed: number, duration: number) => {
      if (elapsed > duration) {
        return end
      }

      return start + (end - start) * this.easing(elapsed / duration)
    }

    const start = {
      y: obj.scrollTop,
      x: obj.scrollLeft,
    }

    // get animation frame or a fallback
    const requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      function (fn) {
        return window.setTimeout(fn, 15)
      }
    const duration = this.isEdge(start) ? 1 : this.duration
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

      // check if we are over due;
      if (elapsed < duration) {
        requestAnimationFrame(step)
      } else {
        // is there a callback?
        if (typeof callback === 'function') {
          // stop execution and run the callback
          return callback(end)
        }
      }
    }
    this.animationFrame = requestAnimationFrame(step)
  }

  bind(callback?: () => void) {
    this.onAnimationEnd = typeof callback === 'function' ? callback : NOOP
    this.bindElement(this.element)
    return this
  }

  unbind() {
    this.unbindElement()
    return this
  }
}
