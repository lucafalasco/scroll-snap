import ScrollSnap from '../../src/index'

function callback() {
  console.log('snap')
}

const containerVertical = document.getElementById('container')
const snapVertical = new ScrollSnap(containerVertical, {
  snapDestinationY: '90%',
  timeout: 100,
  duration: 300,
  easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}).bind(callback)

const containerHorizontal = document.getElementById('container-horizontal')
const snapHorizontal = new ScrollSnap(containerHorizontal, {
  snapDestinationX: '90%',
  timeout: 100,
  duration: 300,
  easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}).bind(callback)
;(window as any).unbind = () => {
  snapVertical.unbind()
  snapHorizontal.unbind()
}
;(window as any).bind = () => {
  snapVertical.bind(callback)
  snapHorizontal.bind(callback)
}
