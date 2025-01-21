import createScrollSnap from '../src/index'

// Theme constants and utilities
const MOON_PATH = 'M16.5 6C11.5 6 7.5 10 7.5 15s4 9 9 9c-4.5 0-9-4-9-9s4-9 9-9z'
const SUN_PATH = 'M12 3v1.5m0 15V21M3 12h1.5m15 0H21m-3-7L17 6m-10 10l-1 1m11-1l1 1m-10-11L7 5'

// Theme management
const getPreferredTheme = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const setTheme = (theme: string) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme')
  const newTheme = current === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

// Initialize theme
const savedTheme = localStorage.getItem('theme')
setTheme(savedTheme || getPreferredTheme())

// Initialize theme icon
const initialTheme = savedTheme || getPreferredTheme()
const themeIcon = document.querySelector('.theme-icon') as SVGPathElement
if (themeIcon) {
  themeIcon.style.transition = 'none'
  themeIcon.setAttribute('d', initialTheme === 'dark' ? MOON_PATH : SUN_PATH)
  // Force reflow
  themeIcon.getBoundingClientRect()
  themeIcon.style.transition = 'd 0.5s ease'
}

// Add theme toggle listener
const themeToggle = document.querySelector('.theme-toggle')
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme)
}

// Watch for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light')
  }
})

const container = document.getElementById('container')

if (!container) {
  throw new Error('Container element not found')
}

container.scrollLeft = window.innerWidth * 0.9
container.scrollTop = window.innerHeight * 0.9

// Initialize scroll snap with demo configuration
const { bind, unbind } = createScrollSnap(
  container,
  {
    snapDestinationX: '90%',
    snapDestinationY: '90%',
    timeout: 100,
    duration: 300,
    threshold: 0.2,
    easing: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    showArrows: true,
  },
  updateDebugValues
)

function updateDebugValues() {
  const scrollTopDebugElement = document.getElementById('scroll-top')
  if (scrollTopDebugElement) {
    scrollTopDebugElement.innerHTML = `${container!.scrollTop}px`
  }

  const scrollLeftDebugElement = document.getElementById('scroll-left')
  if (scrollLeftDebugElement) {
    scrollLeftDebugElement.innerHTML = `${container!.scrollLeft}px`
  }
}

updateDebugValues()

// attach public methods to window
;(window as any).unbind = unbind
;(window as any).bind = bind
