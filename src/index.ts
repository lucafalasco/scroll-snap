function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

const TIMEOUT_MIN = 50
const TIMEOUT_DEFAULT = 100
const DURATION_DEFAULT = 300
const EASING_DEFAULT = easeInOutQuad
const NOOP = () => {}

interface ScrollSnapConfiguration {
  /**
   * snap-destination for x and y axes
   * should be a valid css value expressed as px|%|vw|vh
   **/
  snapDestinationX?: string
  snapDestinationY?: string
  /**
   * time in ms after which scrolling is considered finished
   **/
  timeout?: number
  /**
   * duration in ms for the smooth snap
   **/
  duration?: number
  /**
   * custom easing function
   * @param t normalized time typically in the range [0, 1]
   **/
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
    const { timeout, duration, easing, snapDestinationX, snapDestinationY } = config

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

    if (easing && typeof easing !== 'function') {
      throw new Error(
        `Optional config property 'easing' is not valid, expected FUNCTION but found ${(typeof easing).toUpperCase()}`
      )
    }
    this.easing = easing || EASING_DEFAULT

    if (snapDestinationX && typeof snapDestinationX !== 'string') {
      throw new Error(
        `Optional config property 'snapDestinationX' is not valid, expected STRING but found ${(typeof easing).toUpperCase()}`
      )
    }
    this.snapDestinationX = snapDestinationX

    if (snapDestinationY && typeof snapDestinationY !== 'string') {
      throw new Error(
        `Optional config property 'snapDestinationY' is not valid, expected STRING but found ${(typeof easing).toUpperCase()}`
      )
    }

    this.snapDestinationY = snapDestinationY
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
      y: this.speedDeltaY > 0 ? 1 : -1,
      x: this.speedDeltaX > 0 ? 1 : -1,
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
    })

    // we just jumped to the snapPoint, so this will be our next this.scrollStart
    if (!isNaN(snapPoint.x) || !isNaN(snapPoint.y)) {
      this.scrollStart = snapPoint
    }
  }

  private getNextSnapPoint(target: HTMLElement, direction: Coords) {
    // get snap length
    const snapLength = {
      y: Math.round(this.getYSnapLength(this.target, this.snapLengthUnit.y)),
      x: Math.round(this.getXSnapLength(this.target, this.snapLengthUnit.x)),
    }
    const top = this.target.scrollTop
    const left = this.target.scrollLeft

    // calc current and initial snappoint
    const currentPoint = {
      y: top / snapLength.y || 1,
      x: left / snapLength.x || 1,
    }
    const nextPoint = {
      y: 0,
      x: 0,
    }

    // set target and bounds by direction
    nextPoint.y = this.roundByDirection(direction.y, currentPoint.y)
    nextPoint.x = this.roundByDirection(direction.x, currentPoint.x)

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

  private roundByDirection(direction: number, currentPoint: number) {
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      return Math.floor(currentPoint)
    }
    // go down, we ceil the number to jump to the next in view.
    return Math.ceil(currentPoint)
  }

  private stayInBounds(min: number, max: number, destined: number) {
    return Math.max(Math.min(destined, max), min)
  }

  private parseSnapCoordValue(x: string, y: string) {
    // regex to parse lengths
    const regex = /(\d+)(px|%|vw|vh)/
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

    // parse value and unit
    const resultX = regex.exec(x)
    const resultY = regex.exec(y)

    // if regexp fails, value is null
    if (resultX !== null) {
      parsed.x = {
        value: Number(resultX[1]),
        unit: resultX[2],
      }
    }
    if (resultY !== null) {
      parsed.y = {
        value: Number(resultY[1]),
        unit: resultY[2],
      }
    }

    return parsed
  }

  private getYSnapLength(obj: HTMLElement, declaration: SnapLength) {
    if (declaration.unit === 'vh') {
      // when using vh, one snap is the length of vh / 100 * value
      return (
        (Math.max(document.documentElement.clientHeight, window.innerHeight || 1) / 100) *
        declaration.value
      )
    } else if (declaration.unit === '%') {
      // when using %, one snap is the length of element height / 100 * value
      return (obj.clientHeight / 100) * declaration.value
    } else {
      // when using px, one snap is the length of element height / value
      return obj.clientHeight / declaration.value
    }
  }

  private getXSnapLength(obj: HTMLElement, declaration: SnapLength) {
    if (declaration.unit === 'vw') {
      // when using vw, one snap is the length of vw / 100 * value
      return (
        (Math.max(document.documentElement.clientWidth, window.innerWidth || 1) / 100) *
        declaration.value
      )
    } else if (declaration.unit === '%') {
      // when using %, one snap is the length of element width / 100 * value
      return (obj.clientWidth / 100) * declaration.value
    } else {
      // when using px, one snap is the length of element width / value
      return obj.clientWidth / declaration.value
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
    const duration = this.isEdge(start) ? 0 : this.duration
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
