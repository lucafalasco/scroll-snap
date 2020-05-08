<p align="center">
  <img src="https://raw.githubusercontent.com/lucafalasco/scroll-snap/master/logo.svg?sanitize=true" width="300px" style="margin: 20px;"/>
</p

[![npm](https://img.shields.io/badge/npm-scroll--snap-red.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/scroll-snap)
[![npm](https://img.shields.io/npm/v/scroll-snap.svg?style=for-the-badge&label)](https://www.npmjs.com/scroll-snap)
[![npm downloads](https://img.shields.io/npm/dm/scroll-snap.svg?style=for-the-badge)](https://www.npmjs.com/package/scroll-snap)

Snap page when user stops scrolling, basically implements [CSS Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap), adding a customizable configuration and a consistent cross browser behaviour.

- works in all modern browsers
- `requestAnimationFrame` for 60fps
- customizable configuration (including easing functions)
- no additional dependencies
- no extra stylesheet

## Installation

```sh
yarn add scroll-snap
```

You can also grab a pre-built version from [unpkg](https://unpkg.com/scroll-snap/dist/index.js)

## Usage

Call the constructor passing a DOM element and a configuration object as parameters, then use:

`bind()` to initialize the scroll snap and attach the scroll event listener, takes an optional callback as parameter to execute once the animation ends.

`unbind()` to remove the listener on the element.

Check out the following code:

```js
import ScrollSnap from 'scroll-snap'

const snapConfig = {
  /**
   * snap-destination for x and y axes
   * should be a valid css value expressed as px|%|vw|vh
   **/
  snapDestinationX: '0%',
  snapDestinationY: '90%',
  /**
   * time in ms after which scrolling is considered finished
   * [default: 100]
   **/
  timeout: 100,
  /**
   * duration in ms for the smooth snap
   * [default: 300]
   **/
  duration: 300,
  /**
   * custom easing function
   * [default: easeInOutQuad]
   * for reference: https://gist.github.com/gre/1650294
   * @param t normalized time typically in the range [0, 1]
   **/
  easing: easeInOutQuad,
}

function callback() {
  console.log('element snapped')
}

const element = document.getElementById('container')
const snapObject = new ScrollSnap(element, snapConfig)

snapObject.bind(callback)

// unbind the element
// snapObject.unbind();
```

#### [Demo](https://lucafalasco.github.io/scroll-snap/)

#### [Usage with React](https://codesandbox.io/s/n2ynjj8lj?autoresize=1&hidenavigation=1)

## Contributing

```
git clone https://github.com/lucafalasco/scroll-snap.git
cd scroll-snap
yarn install
```

Start the test app from `demo/`:

```
yarn start
```

Build lib for production:

```
yarn build
```

## License

MIT
