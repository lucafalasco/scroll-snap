import { test, expect } from '@playwright/test'

test.describe('scroll-snap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should snap to next section when scrolling past threshold', async ({ page }) => {
    const container = page.locator('#scroll-container')

    await container.evaluate((el) => {
      const simulateScroll = (position: number, delay: number) =>
        setTimeout(() => {
          el.scrollTop = position
          el.dispatchEvent(new Event('scroll'))
        }, delay)

      el.scrollTop = 0
      el.dispatchEvent(new Event('scroll'))
      simulateScroll(100, 50)
      simulateScroll(200, 100)
      simulateScroll(300, 150)
    })

    await page.waitForTimeout(500)
    const scrollTop = await container.evaluate((el) => el.scrollTop)
    expect(scrollTop).toBe(600)
  })

  test('should respect threshold when scrolling', async ({ page }) => {
    const container = page.locator('#scroll-container')

    await container.evaluate((el) => {
      const simulateScroll = (position: number, delay: number) =>
        setTimeout(() => {
          el.scrollTop = position
          el.dispatchEvent(new Event('scroll'))
        }, delay)

      el.scrollTop = 0
      el.dispatchEvent(new Event('scroll'))
      simulateScroll(50, 50)
      simulateScroll(100, 100)
    })

    await page.waitForTimeout(500)
    const scrollTop = await container.evaluate((el) => el.scrollTop)
    expect(scrollTop).toBe(0)
  })

  test('should handle keyboard navigation', async ({ page }) => {
    const container = page.locator('#scroll-container')

    await container.evaluate((el) => {
      const simulateKeyDown = () => {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      }
      el.focus()
      simulateKeyDown()
    })

    await page.waitForTimeout(500)
    const scrollTop = await container.evaluate((el) => el.scrollTop)
    expect(scrollTop).toBe(600)
  })
})
