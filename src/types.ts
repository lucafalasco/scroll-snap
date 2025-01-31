export interface ScrollSnapSettings {
  snapDestinationX?: string | number
  snapDestinationY?: string | number
  timeout?: number
  duration?: number
  threshold?: number
  snapStop?: boolean
  easing?: (t: number) => number
  showArrows?: boolean
  enableKeyboard?: boolean
}

export interface SnapLength {
  value: number
  unit: string
}

export interface SnapCoordinates {
  y: SnapLength
  x: SnapLength
}

export interface Coordinates {
  y?: number
  x?: number
}

export interface EventHandlers {
  element: HTMLElement | Window
  event: string
  handler: EventListener
}
