import {
  parseSnapCoordinatesValue,
  getYSnapLength,
  getXSnapLength,
  stayInBounds,
  roundToNearestSnapPoint,
} from '../utils'

describe('utils', () => {
  describe('parseSnapCoordinatesValue', () => {
    it('parses numeric values', () => {
      const result = parseSnapCoordinatesValue(100, 200)
      expect(result).toEqual({
        x: { value: 100, unit: 'px' },
        y: { value: 200, unit: 'px' },
      })
    })

    it('parses percentage values', () => {
      const result = parseSnapCoordinatesValue('50%', '100%')
      expect(result).toEqual({
        x: { value: 50, unit: '%' },
        y: { value: 100, unit: '%' },
      })
    })
  })

  describe('getYSnapLength', () => {
    const element = {
      clientHeight: 1000,
    } as HTMLElement

    it('calculates percentage based snap length', () => {
      const result = getYSnapLength(element, { value: 50, unit: '%' })
      expect(result).toBe(500)
    })

    it('returns pixel values directly', () => {
      const result = getYSnapLength(element, { value: 100, unit: 'px' })
      expect(result).toBe(100)
    })
  })

  describe('stayInBounds', () => {
    it('clamps values within bounds', () => {
      expect(stayInBounds(0, 100, -10)).toBe(0)
      expect(stayInBounds(0, 100, 50)).toBe(50)
      expect(stayInBounds(0, 100, 110)).toBe(100)
    })
  })

  describe('roundToNearestSnapPoint', () => {
    it('rounds to nearest snap point', () => {
      expect(roundToNearestSnapPoint(95, 100)).toBe(100)
      expect(roundToNearestSnapPoint(140, 100)).toBe(100)
      expect(roundToNearestSnapPoint(160, 100)).toBe(200)
    })
  })
})
