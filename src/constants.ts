export const TIMEOUT_MIN = 50
export const TIMEOUT_DEFAULT = 100
export const DURATION_DEFAULT = 300
export const THRESHOLD_DEFAULT = 0.2
export const SNAPSTOP_DEFAULT = false
export const SHOW_ARROWS_DEFAULT = false
export const ENABLE_KEYBOARD_DEFAULT = true
export const NOOP = () => {}

export function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
