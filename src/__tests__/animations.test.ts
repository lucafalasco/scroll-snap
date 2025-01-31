import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import { smoothScrollAxis, smoothScroll } from '../animations'

describe('animations', () => {
  let element: HTMLElement
  let animationFrame: { x: number; y: number }

  beforeEach(() => {
    element = document.createElement('div')
    animationFrame = { x: 0, y: 0 }
  })

  describe('smoothScrollAxis', () => {
    it('executes scroll animation correctly', (done) => {
      const callback = jest.fn()
      const easing = (t: number) => t

      smoothScrollAxis(element, { x: 100, y: 0 }, 'x', easing, 100, animationFrame, () => {
        expect(element.scrollLeft).toBe(100)
        expect(callback).not.toHaveBeenCalled()
        done()
      })
    })
  })

  describe('smoothScroll', () => {
    it('handles both axes simultaneously', (done) => {
      const callback = jest.fn()
      const easing = (t: number) => t

      smoothScroll(element, { x: 100, y: 100 }, easing, 100, animationFrame, () => {
        expect(element.scrollLeft).toBe(100)
        expect(element.scrollTop).toBe(100)
        expect(callback).not.toHaveBeenCalled()
        done()
      })
    })
  })
})
