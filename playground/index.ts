import ScrollSnap from '../src/index'

function callback() {
  console.log('snap')
}

const baseConfig = {
  timeout: 100,
  duration: 300,
  threshold: 0.2,
  easing: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

const container = document.getElementById('container')
container.scrollLeft = window.innerWidth * 0.9
container.scrollTop = window.innerHeight * 0.9

const snap = new ScrollSnap(container, {
  snapDestinationX: '90%',
  snapDestinationY: '90%',
  ...baseConfig,
}).bind(callback)

;(window as any).unbind = () => {
  snap.unbind()
}
;(window as any).bind = () => {
  snap.bind(callback)
}
