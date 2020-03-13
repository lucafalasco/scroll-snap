import ScrollSnap from '../../src/index'

const snapConfig = {
  snapDestinationX: '0%',
  snapDestinationY: '90%',
  timeout: 100,
  duration: 300,
  easing: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

function callback() {
  console.log('snap')
}

const element = document.getElementById('container')
const snapObject = new ScrollSnap(element, snapConfig)
snapObject.bind(callback)

// unbind element
// snapObject.unbind();
