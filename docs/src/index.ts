import ScrollSnap from '../../src/index'

function callback() {
  console.log('snap')
}

const baseConfig = {
  timeout: 100,
  duration: 300,
  threshold: 0.2,
  easing: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

const containerVertical = document.getElementById('container')
const snapVertical = new ScrollSnap(containerVertical, {
  snapDestinationY: '90%',
  ...baseConfig,
}).bind(callback)

const containerHorizontal = document.getElementById('container-horizontal')
const snapHorizontal = new ScrollSnap(containerHorizontal, {
  snapDestinationX: '100%',
  ...baseConfig,
}).bind(callback)

;(window as any).unbind = () => {
  snapVertical.unbind()
  snapHorizontal.unbind()
}
;(window as any).bind = () => {
  snapVertical.bind(callback)
  snapHorizontal.bind(callback)
}
