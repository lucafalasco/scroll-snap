<p align="center">
  <img src="https://raw.githubusercontent.com/lucafalasco/scroll-snap/master/logo.svg?sanitize=true" width="180px"/>
  <h3 align="center"><code>scroll-snap</code></h3>
</p>

---

[![npm](https://img.shields.io/badge/npm-scroll--snap-red.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/scroll-snap)
[![npm](https://img.shields.io/npm/v/scroll-snap.svg?style=for-the-badge&label)](https://www.npmjs.com/scroll-snap)
[![npm downloads](https://img.shields.io/npm/dm/scroll-snap.svg?style=for-the-badge)](https://www.npmjs.com/package/scroll-snap)

Snap page when user stops scrolling, basically implements [CSS Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap), adding a customizable configuration and a consistent cross browser behaviour.

- Works in all modern browsers
- `requestAnimationFrame` for 60fps
- Customizable settings (including easing functions)
- No additional dependencies
- No extra stylesheet

## Installation

```sh
yarn add scroll-snap
```

You can also grab a pre-built version from [unpkg](https://unpkg.com/scroll-snap/dist/index.js)

## Usage

```js
createScrollSnap(element, settings, [callback])
```

## Arguments 

### `element: HTMLElement`

The HTML DOM Element to attach the scroll listener to.

### `settings: Settings`

A configuraiton object consisting of one or more of the following keys:

#### `snapDestinationX: string | number`

> Snap destination for x axis, should be a valid css value expressed as `px | % | vw | vh`

#### `snapDestinationY: string | number`

> Snap destination for y axis, should be a valid css value expressed as `px | % | vw | vh`

#### `timeout: number`

> Time in ms after which scrolling is considered finished  
> [default: 100]

#### `duration: number`

> Duration in ms for the smooth snap   
> [default: 300]

#### `threshold: number`

> Threshold to reach before scrolling to next/prev element, expressed as a percentage in the range [0, 1]  
> [default: 0.2]

#### `snapStop: boolean`

> When true, the scroll container is not allowed to "pass over" the other snap positions  
> [default: false]

#### `easing: (t: number) => number`

> Custom easing function  
> `@param t`: normalized time typically in the range [0, 1]  
> [default: `easeInOutQuad`]  
>
> For reference: https://gist.github.com/gre/1650294 

### `callback: () => void` [Optional]

Optional callback to execute once the animation ends.

## Returns

An object including two handlers to manually attach and remove the scroll event listener

```js
{
  // attaches the scroll event listener 
  bind: () => void 
  // removes the scroll event listener
  unbind: () => void 
}
```

## Example
```js
import createScrollSnap from 'scroll-snap'

const element = document.getElementById('container')

const { bind, unbind } = createScrollSnap(element, {
  snapDestinationX: '0%',
  snapDestinationY: '90%',
  timeout: 100,
  duration: 300,
  threshold: 0.2,
  snapStop: false,
  easing: easeInOutQuad,
}, () => console.log('element snapped'))

// remove the listener 
// unbind();

// re-instantiate the listener 
// bind();
```

#### [Usage with React](https://codesandbox.io/s/n2ynjj8lj?autoresize=1&hidenavigation=1)

## Contributing

```
git clone https://github.com/lucafalasco/scroll-snap.git
cd scroll-snap
yarn install
```

Start the testing environment from `playground/`:

```
yarn start
```

Build lib for production:

```
yarn build
```

## License

MIT
