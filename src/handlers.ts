import { EventHandlers } from './types'

export function addEventHandler(
  element: HTMLElement | Window,
  event: string,
  handler: EventListener,
  activeHandlers: EventHandlers[]
) {
  element.addEventListener(event, handler)
  activeHandlers.push({ element, event, handler })
}

export function cleanupEventHandlers(activeHandlers: EventHandlers[]) {
  activeHandlers.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler)
  })
  activeHandlers.splice(0, activeHandlers.length)
}

export function handleKeydown(
  e: Event,
  target: HTMLElement,
  enableKeyboard: boolean,
  scrollToDirection: (direction: 'up' | 'down' | 'left' | 'right') => void
) {
  const keyEvent = e as KeyboardEvent
  if (!enableKeyboard || !target.contains(keyEvent.target as Node)) return

  switch (keyEvent.key) {
    case 'ArrowUp':
      e.preventDefault()
      scrollToDirection('up')
      break
    case 'ArrowDown':
      e.preventDefault()
      scrollToDirection('down')
      break
    case 'ArrowLeft':
      e.preventDefault()
      scrollToDirection('left')
      break
    case 'ArrowRight':
      e.preventDefault()
      scrollToDirection('right')
      break
  }
}
