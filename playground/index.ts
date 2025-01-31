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
const initialTheme = savedTheme || getPreferredTheme()
setTheme(initialTheme)

// Initialize theme icon
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

const container = document.getElementById('container')

if (!container) {
  throw new Error('Container element not found')
}

container.scrollLeft = window.innerWidth * 0.9
container.scrollTop = window.innerHeight * 0.9

// Define type for easing functions
type EasingFunction = (t: number) => number

// Define type-safe easing functions object
const easingFunctions: Record<string, EasingFunction> = {
  Linear: (t: number) => t,
  'Ease In Out Quad': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  'Ease In Quad': (t: number) => t * t,
  'Ease Out Quad': (t: number) => t * (2 - t),
  'Ease In Cubic': (t: number) => t * t * t,
  'Ease Out Cubic': (t: number) => --t * t * t + 1,
}

// Define type-safe configuration interface
interface ScrollSnapConfig {
  snapDestinationX: string
  snapDestinationY: string
  timeout: number
  duration: number
  threshold: number
  snapStop: boolean
  showArrows: boolean
  enableKeyboard: boolean
  easing: EasingFunction
}

// Type-safe default configuration
let currentConfig: ScrollSnapConfig = {
  snapDestinationX: '90%',
  snapDestinationY: '90%',
  timeout: 100,
  duration: 300,
  threshold: 0.2,
  snapStop: false,
  showArrows: true,
  enableKeyboard: true,
  easing: easingFunctions['Ease In Out Quad'],
}

// Initialize scroll snap with demo configuration
let { bind, unbind } = createScrollSnap(container, currentConfig, updateDebugValues)

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

// Create controls widget
interface ControlConfig {
  name: keyof ScrollSnapConfig
  type: 'number' | 'checkbox' | 'select'
  min?: number
  max?: number
  step?: number
  options?: string[]
}

function createControls() {
  const controls = document.createElement('div')
  controls.className = 'controls'

  const controlsConfig: ControlConfig[] = [
    { name: 'timeout', type: 'number', min: 50, max: 1000, step: 50 },
    { name: 'duration', type: 'number', min: 100, max: 1000, step: 100 },
    { name: 'threshold', type: 'number', min: 0, max: 1, step: 0.1 },
    { name: 'snapStop', type: 'checkbox' },
    { name: 'showArrows', type: 'checkbox' },
    { name: 'enableKeyboard', type: 'checkbox' },
    { name: 'easing', type: 'select', options: Object.keys(easingFunctions) },
  ]

  controlsConfig.forEach(({ name, type, min, max, step, options }) => {
    const group = document.createElement('div')
    group.className = 'control-group'

    const label = document.createElement('label')
    label.textContent = name
    group.appendChild(label)

    let input: HTMLInputElement | HTMLSelectElement

    if (type === 'select') {
      input = document.createElement('select')
      options?.forEach((optionName) => {
        const option = document.createElement('option')
        option.value = optionName
        option.textContent = optionName
        input.appendChild(option)
      })
      ;(input as HTMLSelectElement).value =
        Object.keys(easingFunctions).find((key) => easingFunctions[key] === currentConfig.easing) ||
        'Ease In Out Quad'
    } else {
      input = document.createElement('input')
      input.type = type
      if (type === 'number') {
        input.min = min?.toString() || '0'
        input.max = max?.toString() || '1000'
        input.step = step?.toString() || '1'
        input.value = currentConfig[name].toString()
      } else if (type === 'checkbox') {
        input.checked = currentConfig[name] as boolean
      }
    }

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement
      let value: ScrollSnapConfig[keyof ScrollSnapConfig]

      if (target.type === 'checkbox') {
        value = target.checked
      } else if (target.type === 'number') {
        value = parseFloat(target.value)
      } else if (target.type === 'select-one') {
        value = easingFunctions[target.value]
      } else {
        value = target.value
      }

      currentConfig = {
        ...currentConfig,
        [name]: value,
      }

      // Unbind existing instance and create new one with updated config
      unbind()
      const { bind: newBind, unbind: newUnbind } = createScrollSnap(
        container!,
        currentConfig,
        updateDebugValues
      )
      bind = newBind
      unbind = newUnbind
    })

    group.appendChild(input)
    controls.appendChild(group)
  })

  document.body.appendChild(controls)
}

// Initialize controls
createControls()

// attach public methods to window
;(window as any).unbind = unbind
;(window as any).bind = bind
