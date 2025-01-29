import { ScrollSnapSettings, SnapCoordinates, SnapLength } from './types'

export function parseSnapCoordinatesValue(
  x: ScrollSnapSettings['snapDestinationX'],
  y: ScrollSnapSettings['snapDestinationY']
): SnapCoordinates {
  const regex = /([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*)(?:[eE][+-]?\d+)?)(px|%|vw|vh)/
  const parsed = {
    y: { value: 0, unit: 'px' },
    x: { value: 0, unit: 'px' },
  }

  if (typeof y === 'number') {
    parsed.y.value = y
  } else {
    const resultY = regex.exec(y)
    if (resultY !== null) {
      parsed.y = { value: Number(resultY[1]), unit: resultY[2] }
    }
  }

  if (typeof x === 'number') {
    parsed.x.value = x
  } else {
    const resultX = regex.exec(x)
    if (resultX !== null) {
      parsed.x = { value: Number(resultX[1]), unit: resultX[2] }
    }
  }

  return parsed
}

export function getYSnapLength(obj: HTMLElement, declaration: SnapLength) {
  if (declaration.unit === 'vh') {
    return (
      (Math.max(document.documentElement.clientHeight, window.innerHeight || 1) / 100) *
      declaration.value
    )
  } else if (declaration.unit === '%') {
    return (obj.clientHeight / 100) * declaration.value
  }
  return declaration.value
}

export function getXSnapLength(obj: HTMLElement, declaration: SnapLength) {
  if (declaration.unit === 'vw') {
    return (
      (Math.max(document.documentElement.clientWidth, window.innerWidth || 1) / 100) *
      declaration.value
    )
  } else if (declaration.unit === '%') {
    return (obj.clientWidth / 100) * declaration.value
  }
  return declaration.value
}

export function stayInBounds(min: number, max: number, destined: number) {
  return Math.max(Math.min(destined, max), min)
}

export function roundToNearestSnapPoint(value: number, snapLength: number) {
  const multiplier = 1000
  return Math.round((value * multiplier) / (snapLength * multiplier)) * snapLength
}
