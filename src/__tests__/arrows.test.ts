import { getBackgroundBrightness, createArrowElements, updateArrowsPosition } from '../arrows'

describe('arrows', () => {
  describe('getBackgroundBrightness', () => {
    it('detects background brightness correctly', () => {
      const element = document.createElement('div')

      element.style.backgroundColor = 'rgb(255, 255, 255)'
      expect(getBackgroundBrightness(element)).toBe('light')

      element.style.backgroundColor = 'rgb(0, 0, 0)'
      expect(getBackgroundBrightness(element)).toBe('dark')
    })
  })

  describe('createArrowElements', () => {
    it('creates arrow elements with correct properties', () => {
      const target = document.createElement('div')
      const arrows = createArrowElements(target)

      expect(Object.keys(arrows)).toEqual(['up', 'down', 'left', 'right'])
      Object.values(arrows).forEach((arrow) => {
        expect(arrow.classList.contains('scroll-snap-arrow')).toBe(true)
      })
    })
  })

  describe('updateArrowsPosition', () => {
    it('updates arrow positions based on container', () => {
      const container = document.createElement('div')
      const arrows = createArrowElements(container)
      const arrowContainer = document.createElement('div')

      Object.defineProperty(container, 'getBoundingClientRect', {
        value: () => ({
          top: 0,
          left: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        }),
      })

      updateArrowsPosition(container, arrows, arrowContainer)
      expect(arrows.up.style.display).toBe('none')
    })
  })
})
