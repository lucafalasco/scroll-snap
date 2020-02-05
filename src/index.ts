const SCROLL_TIMEOUT_DEFAULT = 300
const SCROLL_TIME_DEFAULT = 2
const NOOP = () => {}

interface ConfigurationObject {
  /**
   * scroll-snap-destination css property
   **/
  scrollSnapDestination: string
  /**
   * time in ms after which scrolling is considered finished
   **/
  scrollTimeout: number
  /**
   * time in ms for the smooth snap
   **/
  scrollTime: number
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

function easeInCubic(t: number, b: number, c: number, d: number) {
  return c * (t = t / d) * t * t + b
}

function position(start: number, end: number, elapsed: number, duration: number) {
  if (elapsed > duration) {
    return end
  }
  return easeInCubic(elapsed, start, end - start, duration)
}

export default class ScrollSnap {
  SCROLL_TIMEOUT: number
  SCROLL_TIME: number
  SCROLL_SNAP_DESTINATION: string
  element: HTMLElement
  target: HTMLElement
  config: ConfigurationObject
  onAnimationEnd: () => void
  scrollHandlerTimer: NodeJS.Timer
  scrollSpeedTimer: NodeJS.Timer
  scrollStart: Coords
  animating = false
  speedDeltaX: number
  speedDeltaY: number
  snapLengthUnit: SnapCoord
  lastScrollValue: Coords = {
    x: 0,
    y: 0,
  }
  animationFrame: number

  constructor(element: HTMLElement, config: ConfigurationObject) {
    this.element = element
    this.config = config
    if (
      config.scrollTimeout &&
      (isNaN(config.scrollTimeout) || typeof config.scrollTimeout === 'boolean')
    ) {
      throw new Error(
        `Optional config property 'scrollTimeout' is not valid, expected NUMBER but found ${(typeof config.scrollTimeout).toUpperCase()}`
      )
    }
    this.SCROLL_TIMEOUT = config.scrollTimeout || SCROLL_TIMEOUT_DEFAULT

    if (config.scrollTime && (isNaN(config.scrollTime) || typeof config.scrollTime === 'boolean')) {
      throw new Error(
        `Optional config property 'scrollTime' is not valid, expected NUMBER but found ${(typeof config.scrollTime).toUpperCase()}`
      )
    }
    this.SCROLL_TIME = config.scrollTime || SCROLL_TIME_DEFAULT

    if (!config.scrollSnapDestination) {
      throw new Error('Required config property scrollSnapDestination is not defined')
    }
    this.SCROLL_SNAP_DESTINATION = config.scrollSnapDestination
  }

  checkScrollSpeed(value: number, axis: 'x' | 'y') {
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
    this.scrollSpeedTimer = setTimeout(clear, 50)
    return delta
  }

  saveDeclaration(obj: HTMLElement) {
    this.snapLengthUnit = this.parseSnapCoordValue(this.SCROLL_SNAP_DESTINATION)
  }

  bindElement(element: HTMLElement) {
    this.target = element
    const listenerElement = element === document.documentElement ? window : element

    /**
     * set webkit-overflow-scrolling to auto.
     * this prevents momentum scrolling on ios devices
     * causing flickering behaviours and delayed transitions.
     */
    this.target.style.overflow = 'auto'
    // @ts-ignore
    this.target.style.webkitOverflowScrolling = 'auto'

    listenerElement.addEventListener('scroll', this.startAnimation, false)
    this.saveDeclaration(this.target)
  }

  unbindElement(element: HTMLElement) {
    // @ts-ignore
    element.style.webkitOverflowScrolling = null
    element.removeEventListener('scroll', this.startAnimation, false)
  }

  startAnimation = () => {
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
  handler(target: HTMLElement) {
    // if currently this.animating, stop it. this prevents flickering.
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

    this.scrollHandlerTimer = setTimeout(this.animationHandler, this.SCROLL_TIMEOUT)
  }

  animationHandler = () => {
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

    this.target.removeEventListener('scroll', this.startAnimation, false)

    this.animating = true

    // smoothly move to the snap point
    this.smoothScroll(this.target, snapPoint, () => {
      // after moving to the snap point, rebind the scroll event handler
      this.animating = false
      this.target.addEventListener('scroll', this.startAnimation, false)
      this.onAnimationEnd()
    })

    // we just jumped to the snapPoint, so this will be our next this.scrollStart
    if (!isNaN(snapPoint.x) || !isNaN(snapPoint.y)) {
      this.scrollStart = snapPoint
    }
  }

  getNextSnapPoint(target: HTMLElement, direction: Coords) {
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

  roundByDirection(direction: number, currentPoint: number) {
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      return Math.floor(currentPoint)
    }
    // go down, we ceil the number to jump to the next in view.
    return Math.ceil(currentPoint)
  }

  stayInBounds(min: number, max: number, destined: number) {
    return Math.max(Math.min(destined, max), min)
  }

  parseSnapCoordValue(declaration: string) {
    // regex to parse lengths
    const regex = /(\d+)(px|%|vw) (\d+)(px|%|vh)/g
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
    let parsable
    let result

    // parse value and unit
    if (parsable !== null) {
      result = regex.exec(declaration)
      // if regexp fails, value is null
      if (result !== null) {
        parsed.x = {
          value: Number(result[1]),
          unit: result[2],
        }
        parsed.y = {
          value: Number(result[3]),
          unit: result[4],
        }
      }
    }
    return parsed
  }

  getYSnapLength(obj: HTMLElement, declaration: SnapLength) {
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

  getXSnapLength(obj: HTMLElement, declaration: SnapLength) {
    if (declaration.unit === 'vw') {
      // when using vw, one snap is the length of vw / 100 * value
      return (
        (Math.max(document.documentElement.clientWidth, window.innerWidth || 1) / 100) *
        declaration.value
      )
    } else if (declaration.unit === '%') {
      // when using %, one snap is the length of element width / 100 * value
      return (obj.offsetWidth / 100) * declaration.value
    } else {
      // when using px, one snap is the length of element width / value
      return obj.offsetWidth / declaration.value
    }
  }

  isEdge(start: Coords) {
    return (start.x === 0 && this.speedDeltaY === 0) || (start.y === 0 && this.speedDeltaX === 0)
  }

  smoothScroll(obj: HTMLElement, end: Coords, callback: (...args: any) => void) {
    const start = {
      y: obj.scrollTop,
      x: obj.scrollLeft,
    }

    // get animation frame or a fallback
    const requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      function(fn) {
        return window.setTimeout(fn, 15)
      }
    const duration = this.isEdge(start) ? 0 : this.SCROLL_TIME
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
  }

  unbind() {
    this.unbindElement(this.element)
  }
}
