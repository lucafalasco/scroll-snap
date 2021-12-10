import createScrollSnap from 'https://unpkg.com/scroll-snap/dist/esm/index.js'

function callback() {
  console.log('snap')
}

const baseConfig = {
  timeout: 100,
  duration: 300,
  threshold: 0.2,
  easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

const containerVertical = document.getElementById('container')
const containerHorizontal = document.getElementById('container-horizontal')

createScrollSnap(
  containerVertical,
  {
    snapDestinationY: '90%',
    ...baseConfig,
  },
  callback
)
createScrollSnap(
  containerHorizontal,
  {
    snapDestinationX: '100%',
    ...baseConfig,
  },
  callback
)
