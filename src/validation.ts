import { ScrollSnapSettings } from './types'
import { TIMEOUT_MIN } from './constants'

export function validateSettings(settings: ScrollSnapSettings) {
  const {
    snapDestinationX,
    snapDestinationY,
    timeout,
    duration,
    threshold,
    easing,
    snapStop,
    showArrows,
    enableKeyboard,
  } = settings

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

  if (timeout && (isNaN(timeout) || typeof timeout === 'boolean')) {
    throw new Error(
      `Optional settings property 'timeout' is not valid, expected NUMBER but found ${(typeof timeout).toUpperCase()}`
    )
  }

  if (timeout && timeout < TIMEOUT_MIN) {
    console.warn(
      `Timeout value less than ${TIMEOUT_MIN}ms may cause issues with momentum scrolling`
    )
  }

  if (duration && (isNaN(duration) || typeof duration === 'boolean')) {
    throw new Error(
      `Optional settings property 'duration' is not valid, expected NUMBER but found ${(typeof duration).toUpperCase()}`
    )
  }

  if (threshold && (isNaN(threshold) || typeof threshold === 'boolean')) {
    throw new Error(
      `Optional settings property 'threshold' is not valid, expected NUMBER but found ${(typeof threshold).toUpperCase()}`
    )
  }

  if (easing && typeof easing !== 'function') {
    throw new Error(
      `Optional settings property 'easing' is not valid, expected FUNCTION but found ${(typeof easing).toUpperCase()}`
    )
  }

  if (snapStop && typeof snapStop !== 'boolean') {
    throw new Error(
      `Optional settings property 'snapStop' is not valid, expected BOOLEAN but found ${(typeof snapStop).toUpperCase()}`
    )
  }

  if (showArrows && typeof showArrows !== 'boolean') {
    throw new Error(
      `Optional settings property 'showArrows' is not valid, expected BOOLEAN but found ${(typeof snapStop).toUpperCase()}`
    )
  }

  if (enableKeyboard && typeof enableKeyboard !== 'boolean') {
    throw new Error(
      `Optional settings property 'enableKeyboard' is not valid, expected BOOLEAN but found ${(typeof snapStop).toUpperCase()}`
    )
  }
}
