import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import createScrollSnap from '../index'

describe('createScrollSnap', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 1000 })
    Object.defineProperty(container, 'clientHeight', { value: 1000 })
  })

  it('initializes with default settings', () => {
    const { bind, unbind } = createScrollSnap(container)
    expect(typeof bind).toBe('function')
    expect(typeof unbind).toBe('function')
  })

  it('handles custom settings', () => {
    const callback = jest.fn()
    createScrollSnap(
      container,
      {
        snapDestinationY: '100%',
        timeout: 100,
        duration: 300,
        threshold: 0.2,
        enableKeyboard: true,
      },
      callback
    )

    expect(container.hasAttribute('tabindex')).toBe(true)
  })

  it('cleans up on unbind', () => {
    const { unbind } = createScrollSnap(container, { showArrows: true })
    unbind()
    expect(document.querySelector('.scroll-snap-arrow')).toBeNull()
  })
})
