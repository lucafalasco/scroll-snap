// import createScrollSnap from 'https://unpkg.com/scroll-snap/dist/esm/index.js'
import createScrollSnap from '../dist/esm/index.js'

// Initialize scroll snap for documentation example
const example = document.getElementById('example')

if (example) {
  createScrollSnap(
    example,
    {
      snapDestinationY: '100%',
      timeout: 100,
      duration: 300,
      threshold: 0.2,
    },
    () => {
      console.log('snapped')
    }
  )
}

// Force initial scroll position to top
example.scrollTop = 0

// Add active class to nav links on scroll
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
