<p align="center">
  <img src="https://raw.githubusercontent.com/lucafalasco/scroll-snap/master/logo.svg?sanitize=true" width="500px" style="margin: 100px;"/>
</p

[![npm](https://img.shields.io/badge/npm-scroll--snap-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/scroll-snap)
[![npm version](https://img.shields.io/npm/v/scroll-snap.svg?style=flat-square)](https://www.npmjs.com/package/scroll-snap)
[![npm downloads](https://img.shields.io/npm/dm/scroll-snap.svg?style=flat-square)](https://www.npmjs.com/package/scroll-snap)

Snap page when user stops scrolling, basically implements [CSS Scroll Snap Points](https://developer.mozilla.org/en/docs/Web/CSS/CSS_Scroll_Snap_Points), but with a customizable configuration and a consistent cross browser behaviour.

- works in all modern browsers
- `requestAnimationFrame` for 60fps
- customizable configuration
- no additional libraries
- no extra stylesheet

## Installation

```sh
npm install scroll-snap --save
```

or

```sh
yarn add scroll-snap
```

You can also grab a pre-built version from [unpkg](https://unpkg.com/scroll-snap/dist/index.js)

## Usage

Just call the constructor passing a DOM element and a configuration object as parameters, then use:

`bind()` to initialize the scroll snap and bind the listener, accepts an optional callback as parameter to execute once the animation ends.

`unbind()` to remove the listener.

Check out the following code:

```js
import ScrollSnap from "scroll-snap";

const snapConfig = {
  /** REQUIRED
   * scroll-snap-destination css property, as defined here:
   * https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-destination
   **/
  scrollSnapDestination: "0% 90%",
  /** OPTIONAL [default: 100]
   * time in ms after which scrolling is considered finished
   **/
  scrollTimeout: 100,
  /** OPTIONAL [default: 300]
   * time in ms for the smooth snap
   **/
  scrollTime: 300
};

function callback() {
  console.log("called when snap animation ends");
}

const element = document.getElementById("container");
const snapObject = new ScrollSnap(element, snapConfig);

snapObject.bind(callback);

// unbind the element
// snapObject.unbind();
```

[Demo](https://lucafalasco.github.io/scroll-snap/)

[Usage with React](https://codesandbox.io/s/n2ynjj8lj?autoresize=1&hidenavigation=1)

## Contributing

```
git clone https://github.com/lucafalasco/scroll-snap.git
cd scroll-snap
npm install
```

Start the test app from `demo/` and fire up the dev server

```
npm start
```

Build for production:

```
npm run build
```

## License

MIT
