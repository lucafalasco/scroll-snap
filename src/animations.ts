import { Coordinates } from './types'

export function smoothScrollAxis(
  obj: HTMLElement,
  end: Coordinates,
  axis: 'x' | 'y',
  easing: (t: number) => number,
  duration: number,
  animationFrame: { x: number; y: number },
  callback: () => void
) {
  const prop = axis === 'x' ? 'scrollLeft' : 'scrollTop'

  if (animationFrame[axis]) {
    cancelAnimationFrame(animationFrame[axis])
  }

  const start = obj[prop]
  const targetEnd = end[axis]

  if (Math.abs(start - targetEnd) < 1 || isNaN(targetEnd)) {
    callback()
    return
  }

  let startTime: number
  let lastPosition = start

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime

    if (elapsed < duration) {
      const nextPos = start + (targetEnd - start) * easing(elapsed / duration)
      if (Math.abs(targetEnd - nextPos) < Math.abs(targetEnd - lastPosition)) {
        obj[prop] = nextPos
        lastPosition = nextPos
      }
      animationFrame[axis] = requestAnimationFrame(step)
    } else {
      obj[prop] = targetEnd
      animationFrame[axis] = 0
      callback()
    }
  }

  animationFrame[axis] = requestAnimationFrame(step)
}

export function smoothScroll(
  obj: HTMLElement,
  end: Coordinates,
  easing: (t: number) => number,
  duration: number,
  animationFrame: { x: number; y: number },
  callback: () => void
) {
  let remaining = 2
  const onComplete = () => {
    remaining--
    if (remaining === 0) callback()
  }

  if (!isNaN(end.x)) {
    smoothScrollAxis(obj, end, 'x', easing, duration, animationFrame, onComplete)
  } else {
    remaining--
  }

  if (!isNaN(end.y)) {
    smoothScrollAxis(obj, end, 'y', easing, duration, animationFrame, onComplete)
  } else {
    remaining--
  }
}
