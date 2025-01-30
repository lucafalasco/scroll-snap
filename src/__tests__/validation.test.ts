import { describe, expect, it, jest } from '@jest/globals'
import { validateSettings } from '../validation'
import { TIMEOUT_MIN } from '../constants'

describe('validateSettings', () => {
  it('validates snapDestination coordinates', () => {
    expect(() => validateSettings({ snapDestinationX: '100%' })).not.toThrow()
    expect(() => validateSettings({ snapDestinationX: 100 })).not.toThrow()
    expect(() => validateSettings({ snapDestinationY: '100%' })).not.toThrow()
    expect(() => validateSettings({ snapDestinationY: 100 })).not.toThrow()
    expect(() => validateSettings({ snapDestinationX: true as any })).toThrow()
    expect(() => validateSettings({ snapDestinationY: [] as any })).toThrow()
  })

  it('validates timeout settings', () => {
    expect(() => validateSettings({ timeout: 100 })).not.toThrow()
    expect(() => validateSettings({ timeout: true as any })).toThrow()
    expect(() => validateSettings({ timeout: TIMEOUT_MIN - 1 })).not.toThrow() // Should just warn
  })

  it('validates duration settings', () => {
    expect(() => validateSettings({ duration: 300 })).not.toThrow()
    expect(() => validateSettings({ duration: true as any })).toThrow()
    expect(() => validateSettings({ duration: 'fast' as any })).toThrow()
  })

  it('validates threshold settings', () => {
    expect(() => validateSettings({ threshold: 0.2 })).not.toThrow()
    expect(() => validateSettings({ threshold: true as any })).toThrow()
  })

  it('validates easing function', () => {
    expect(() => validateSettings({ easing: (t: number) => t })).not.toThrow()
    expect(() => validateSettings({ easing: 'linear' as any })).toThrow()
  })

  it('validates boolean settings', () => {
    const booleanSettings = ['snapStop', 'showArrows', 'enableKeyboard']
    booleanSettings.forEach((setting) => {
      expect(() => validateSettings({ [setting]: true })).not.toThrow()
      expect(() => validateSettings({ [setting]: false })).not.toThrow()
      expect(() => validateSettings({ [setting]: 'true' as any })).toThrow()
    })
  })

  it('handles console warnings for low timeout values', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    validateSettings({ timeout: TIMEOUT_MIN - 1 })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
