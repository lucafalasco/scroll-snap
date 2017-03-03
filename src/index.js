const SCROLL_TIMEOUT_DEFAULT = 300
const SCROLL_TIME_DEFAULT = 2
const NOOP = () => {}

export default function (element, config) {
  if (config.scrollTimeout && (isNaN(config.scrollTimeout) || typeof config.scrollTimeout === 'boolean')) throw new Error(`Optional config property 'scrollTimeout' is not valid, expected NUMBER but found ${(typeof config.scrollTimeout).toUpperCase()}`)
  const SCROLL_TIMEOUT = config.scrollTimeout || SCROLL_TIMEOUT_DEFAULT

  if (config.scrollTime && (isNaN(config.scrollTime) || typeof config.scrollTime === 'boolean')) throw new Error(`Optional config property 'scrollTime' is not valid, expected NUMBER but found ${(typeof config.scrollTime).toUpperCase()}`)
  const SCROLL_TIME = config.scrollTime || SCROLL_TIME_DEFAULT

  if (!config.scrollSnapDestination) throw new Error('Required config property scrollSnapDestination is not defined')
  const SCROLL_SNAP_DESTINATION = config.scrollSnapDestination

  let onAnimationEnd
  let timeOutId = null
  let scrollStart = null
  let animating = false
  let timer = 0
  let speedDeltaX
  let speedDeltaY
  let target
  let lastObj
  let lastScrollObj
  let lastScrollValue = {
    x: null,
    y: null
  }

  function checkScrollSpeed (value, axis) {
    function clear () {
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
    timer && clearTimeout(timer)
    timer = setTimeout(clear, 50)
    return delta
  }

  function saveDeclaration (obj) {
    obj.snapLengthUnit = parseSnapCoordValue(SCROLL_SNAP_DESTINATION)
  }

  function bindElement (element) {
    target = element === document ? document.body : element

    element.addEventListener('scroll', startAnimation, false)
    saveDeclaration(target)
  }

  function unbindElement (element) {
    element.removeEventListener('scroll', startAnimation, false)
  }

  function startAnimation () {
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
  function handler (target) {
    // use evt.target as target-element
    lastObj = target

    lastScrollObj = getScrollObj(lastObj)

    // if currently animating, stop it. this prevents flickering.
    if (animationFrame) {
      // cross browser
      if (!window.cancelAnimationFrame(animationFrame)) {
        clearTimeout(animationFrame)
      }
    }

    // if a previous timeout exists, clear it.
    if (timeOutId) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(timeOutId)
    } else {
      scrollStart = {
        y: lastScrollObj.scrollTop,
        x: lastScrollObj.scrollLeft
      }
    }

    timeOutId = setTimeout(animationHandler, SCROLL_TIMEOUT)
  }

  function animationHandler () {
    // if we don't move a thing, we can ignore the timeout: if we did, there'd be another timeout added for scrollStart+1.
    if (scrollStart.y === lastScrollObj.scrollTop && scrollStart.x === lastScrollObj.scrollLeft) {
      // ignore timeout
      return
    }

    // detect direction of scroll. negative is up, positive is down.
    let direction = {
      y: (speedDeltaY > 0) ? 1 : -1,
      x: (speedDeltaX > 0) ? 1 : -1
    }
    let snapPoint

    // get the next snap-point to snap-to
    snapPoint = getNextSnapPoint(lastScrollObj, lastObj, direction)

    lastObj.removeEventListener('scroll', startAnimation, false)

    animating = true

    // smoothly move to the snap point
    smoothScroll(lastScrollObj, snapPoint, function () {
      // after moving to the snap point, rebind the scroll event handler
      animating = false
      lastObj.addEventListener('scroll', startAnimation, false)
      onAnimationEnd()
    })

    // we just jumped to the snapPoint, so this will be our next scrollStart
    if (!isNaN(snapPoint.x || !isNaN(snapPoint.y))) {
      scrollStart = snapPoint
    }
  }

  /**
  * calculator for next snap-point
  * @param  {Object} scrollObj - DOM element
  * @param  {Object} obj - DOM element
  * @param  {integer} direction - signed integer indicating the scroll direction
  * @return {Object}
  */
  function getNextSnapPoint (scrollObj, obj, direction) {
    // get snap length
    let snapLength = {
      y: roundByDirection(direction.y, getYSnapLength(obj, obj.snapLengthUnit.y)),
      x: roundByDirection(direction.x, getXSnapLength(obj, obj.snapLengthUnit.x))
    }
    let top = scrollObj.scrollTop
    let left = scrollObj.scrollLeft

    // calc current and initial snappoint
    let currentPoint = {
      y: top / snapLength.y || 1,
      x: left / snapLength.x || 1
    }
    let nextPoint = {
      y: 0,
      x: 0
    }

    // set target and bounds by direction
    nextPoint.y = roundByDirection(direction.y, currentPoint.y)
    nextPoint.x = roundByDirection(direction.x, currentPoint.x)

    // calculate where to scroll
    const scrollTo = {
      y: nextPoint.y * snapLength.y,
      x: nextPoint.x * snapLength.x
    }

    // stay in bounds (minimum: 0, maxmimum: absolute height)
    scrollTo.y = stayInBounds(0, getScrollHeight(scrollObj), scrollTo.y)
    scrollTo.x = stayInBounds(0, getScrollWidth(scrollObj), scrollTo.x)

    return scrollTo
  }

  /**
  * ceil or floor a number based on direction
  * @param  {Number} direction
  * @param  {Number} currentPoint
  * @return {Number}
  */
  function roundByDirection (direction, currentPoint) {
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      return Math.floor(currentPoint)
    }
    // go down, we ceil the number to jump to the next in view.
    return Math.ceil(currentPoint)
  }

  /**
  * keep scrolling in bounds
  * @param  {Number} min
  * @param  {Number} max
  * @param  {Number} destined
  * @return {Number}
  */
  function stayInBounds (min, max, destined) {
    return Math.max(Math.min(destined, max), min)
  }

  /**
  * parse snap destination/coordinate values.
  * @param  {Object} declaration
  * @return {Object}
  */
  function parseSnapCoordValue (declaration) {
    // regex to parse lengths
    let regex = /(\d+)(px|%|vw) (\d+)(px|%|vh)/g
      // defaults
    let parsed = {
      y: {
        value: 0,
        unit: 'px'
      },
      x: {
        value: 0,
        unit: 'px'
      }
    }
    let parsable
    let result

    // parse value and unit
    if (parsable !== null) {
      result = regex.exec(declaration)
      // if regexp fails, value is null
      if (result !== null) {
        parsed.x = {
          value: result[1],
          unit: result[2]
        }
        parsed.y = {
          value: result[3],
          unit: result[4]
        }
      }
    }
    return parsed
  }

  /**
  * calc length of one snap on y-axis
  * @param  {Object} obj the scroll object
  * @param  {Object} declaration the parsed declaration
  * @return {Number}
  */
  function getYSnapLength (obj, declaration) {
    if (declaration.unit === 'vh') {
      // when using vh, one snap is the length of vh / 100 * value
      return Math.max(document.documentElement.clientHeight, window.innerHeight || 1) / 100 * declaration.value
    } else if (declaration.unit === '%') {
      // when using %, one snap is the length of element height / 100 * value
      return getHeight(obj) / 100 * declaration.value
    } else {
      // when using px, one snap is the length of element height / value
      return getHeight(obj) / declaration.value
    }
  }

  /**
  * calc length of one snap on x-axis
  * @param  {Object} obj the scroll object
  * @param  {Object} declaration the parsed declaration
  * @return {Number}
  */
  function getXSnapLength (obj, declaration) {
    if (declaration.unit === 'vw') {
      // when using vw, one snap is the length of vw / 100 * value
      return Math.max(document.documentElement.clientWidth, window.innerWidth || 1) / 100 * declaration.value
    } else if (declaration.unit === '%') {
      // when using %, one snap is the length of element width / 100 * value
      return getWidth(obj) / 100 * declaration.value
    } else {
      // when using px, one snap is the length of element width / value
      return getWidth(obj) / declaration.value
    }
  }

  /**
  * get an elements scrollable height
  * @param  {Object} obj - DOM element
  * @return {Number}
  */
  function getScrollHeight (obj) {
    return obj.scrollHeight
  }

  /**
  * get an elements scrollable width
  * @param  {Object} obj - DOM element
  * @return {Number}
  */
  function getScrollWidth (obj) {
    return obj.scrollWidth
  }

  /**
  * get an elements height
  * @param  {Object} obj - DOM element
  * @return {Number}
  */
  function getHeight (obj) {
    return obj.offsetHeight
  }

  /**
  * get an elements width
  * @param  {Object} obj - DOM element
  * @return {Number}
  */
  function getWidth (obj) {
    return obj.offsetWidth
  }

  /**
  * return the element scrolling values are applied to.
  * when receiving window.onscroll events, the actual scrolling is on the body.
  * @param  {Object} obj - DOM element
  * @return {Object}
  */
  function getScrollObj (obj) {
    // if the scroll container is body, the scrolling is invoked on window/document.
    if (obj === document || obj === window) {
      // firefox scrolls on document.documentElement
      if (document.documentElement.scrollTop > 0 || document.documentElement.scrollLeft > 0) {
        return document.documentElement
      }
      // chrome scrolls on body
      return document.querySelector('body')
    }

    return obj
  }

  /**
  * ease in cubic function
  * @param  {Number} t current time of the tween
  * @param  {Number} b beginning value of the property
  * @param  {Number} c change between the beginning and destination value
  * @param  {Number} d is the total time of the tween
  * @return {Number}   easing factor
  */
  function easeInCubic (t, b, c, d) {
    return (c * (t = t / d) * t * t) + b
  }

  /**
  * calculate the scroll position we should be in
  * @param  {Number} start    the start point of the scroll
  * @param  {Number} end      the end point of the scroll
  * @param  {Number} elapsed  the time elapsed from the beginning of the scroll
  * @param  {Number} duration the total duration of the scroll (default 500ms)
  * @return {Number}          the next position
  */
  function position (start, end, elapsed, duration) {
    if (elapsed > duration) {
      return end
    }
    return easeInCubic(elapsed, start, (end - start), duration)
  }

  // a current animation frame
  let animationFrame = null

  /**
  * smoothScroll function by Alice Lietieur.
  * @see https://github.com/alicelieutier/smoothScroll
  * we use requestAnimationFrame to be called by the browser before every repaint
  * @param  {Object}   obj      the scroll context
  * @param  {Number}  end      where to scroll to
  * @param  {Function} callback called when the scrolling is finished
  */
  function smoothScroll (obj, end, callback) {
    let start = {
      y: obj.scrollTop,
      x: obj.scrollLeft
    }

      // get animation frame or a fallback
    let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function (fn) {
      window.setTimeout(fn, 15)
    }
    let duration = SCROLL_TIME
    let startTime = null

    // setup the stepping function
    function step (timestamp) {
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
    animationFrame = requestAnimationFrame(step)
  }

  this.bind = function (callback) {
    onAnimationEnd = (typeof callback === 'function') ? callback : NOOP

    bindElement(element)
  }

  this.unbind = function () {
    unbindElement(element)
  }

  return this
}
