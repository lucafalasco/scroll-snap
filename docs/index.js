import createScrollSnap from '../dist/esm/index.js'

const getPreferredTheme = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

const savedTheme = localStorage.getItem('theme')
const initialTheme = savedTheme || getPreferredTheme()
setTheme(initialTheme)

const themeToggle = document.querySelector('.theme-toggle')
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  })
}

const example = document.getElementById('example')
if (example) {
  createScrollSnap(example, { snapDestinationY: '100%' })
}

const horizontalExample = document.getElementById('example-horizontal')
if (horizontalExample) {
  createScrollSnap(horizontalExample, {
    snapDestinationX: '100%',
    timeout: 100,
    duration: 300,
  })
}

const durationExample = document.getElementById('example-duration')
if (durationExample) {
  createScrollSnap(durationExample, {
    snapDestinationY: '100%',
    duration: 800,
  })
}

const thresholdExample = document.getElementById('example-threshold')
if (thresholdExample) {
  createScrollSnap(thresholdExample, {
    snapDestinationY: '100%',
    threshold: 0.5,
    duration: 300,
  })
}

const easingExample = document.getElementById('example-easing')
if (easingExample) {
  createScrollSnap(easingExample, {
    snapDestinationY: '100%',
    duration: 500,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  })
}

const navigationExample = document.getElementById('example-navigation')
if (navigationExample) {
  createScrollSnap(navigationExample, {
    snapDestinationY: '100%',
    timeout: 100,
    duration: 300,
    showArrows: true,
    enableKeyboard: true,
  })
}

;[example, horizontalExample, durationExample, thresholdExample, easingExample, navigationExample]
  .filter(Boolean)
  .forEach((el) => {
    if (el.id.includes('horizontal')) {
      el.scrollLeft = 0
    } else {
      el.scrollTop = 0
    }
  })

const observerOptions = {
  threshold: 0.5,
  rootMargin: '-100px 0px -50px 0px',
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.id
      document.querySelectorAll('.docs-nav-link').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`)
      })
    }
  })
}, observerOptions)

document.querySelectorAll('[id]').forEach((section) => observer.observe(section))
