import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import { handleKeydown, addEventHandler, cleanupEventHandlers } from '../handlers'

describe('handlers', () => {
  let mockScrollToDirection: jest.Mock
  let mockTarget: HTMLElement

  beforeEach(() => {
    mockScrollToDirection = jest.fn()
    mockTarget = document.createElement('div')
  })

  describe('handleKeydown', () => {
    it('handles arrow key events when enabled', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      Object.defineProperty(mockEvent, 'target', { value: mockTarget })

      handleKeydown(mockEvent, mockTarget, true, mockScrollToDirection)
      expect(mockScrollToDirection).toHaveBeenCalledWith('up')
    })

    it('ignores events when keyboard navigation is disabled', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      handleKeydown(mockEvent, mockTarget, false, mockScrollToDirection)
      expect(mockScrollToDirection).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('manages event handlers correctly', () => {
      const handlers: any[] = []
      const element = document.createElement('div')
      const handler = jest.fn()

      addEventHandler(element, 'click', handler, handlers)
      expect(handlers).toHaveLength(1)

      cleanupEventHandlers(handlers)
      expect(handlers).toHaveLength(0)
    })
  })
})
