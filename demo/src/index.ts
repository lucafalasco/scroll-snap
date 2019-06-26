import ScrollSnap from '../../src/index'

const snapConfig = {
  scrollSnapDestination: '0% 90%', // scroll-snap-destination css property
  scrollTimeout: 100, // time in ms after which scrolling is considered finished
  scrollTime: 300, // time in ms for the smooth snap
}

function callback() {
  console.log('snap')
}

const element = document.getElementById('container')
const snapObject = new ScrollSnap(element, snapConfig)
snapObject.bind(callback)

// unbind element
// snapObject.unbind();
