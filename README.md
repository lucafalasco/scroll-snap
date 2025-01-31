<p align="center">
  <img src="https://raw.githubusercontent.com/lucafalasco/scroll-snap/master/logo.svg?sanitize=true" width="120px"/>
  <h3 align="center"><code>scroll-snap</code></h3>
</p>

---

[![npm](https://img.shields.io/badge/npm-scroll--snap-red.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/scroll-snap)
[![npm](https://img.shields.io/npm/v/scroll-snap.svg?style=for-the-badge&label)](https://www.npmjs.com/scroll-snap)
[![npm downloads](https://img.shields.io/npm/dm/scroll-snap.svg?style=for-the-badge)](https://www.npmjs.com/package/scroll-snap)

#### Overview

`scroll-snap` is a powerful yet lightweight TypeScript library that provides smooth and customizable page snapping functionality. 
Built as a modern implementation of [CSS Scroll Snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap).

#### Features

- 🪶 Lightweight (~2KB gzipped)
- 🌐 Cross-browser support
- 💪 Zero dependencies
- 🎯 TypeScript ready
- ⚡ Smooth animations
- 🎨 Customizable settings
- ⌨️ Keyboard navigation support
- 🖱️ Optional navigation arrows

#### Installation

```bash
yarn add scroll-snap
```

#### Basic Usage

```typescript
import createScrollSnap from 'scroll-snap'

const element = document.getElementById('container')
const { bind, unbind } = createScrollSnap(element, {
  snapDestinationY: '100%',
})
```

#### React Usage

Check out the [React Hooks demo](https://codesandbox.io/p/sandbox/scroll-snap-react-hooks-pppv8w) to see how to integrate scroll-snap in a React application.

#### Configuration Options

| Option           | Type                  | Default | Description                                    |
| ---------------- | --------------------- | ------- | ---------------------------------------------- |
| snapDestinationX | string \| number      | -       | Horizontal snap points (e.g., '100%', '500px') |
| snapDestinationY | string \| number      | -       | Vertical snap points (e.g., '100%', '500px')   |
| timeout          | number                | 100     | Delay before snapping after scroll ends (ms)   |
| duration         | number                | 300     | Animation duration (ms)                        |
| threshold        | number                | 0.2     | Scroll distance threshold (0 to 1)             |
| snapStop         | boolean               | false   | Prevents skipping intermediate snap positions  |
| showArrows       | boolean               | false   | Shows navigation arrows when hovering          |
| enableKeyboard   | boolean               | true    | Enables keyboard arrow keys navigation         |
| easing           | (t: number) => number | linear  | Animation easing function                      |

#### Examples

##### Vertical Snapping

```typescript
const scrollSnap = createScrollSnap(element, {
  snapDestinationY: '100vh',
  duration: 300,
  easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
})
```

##### Horizontal Scrolling Gallery

```typescript
const scrollSnap = createScrollSnap(element, {
  snapDestinationX: '100%',
  showArrows: true,
  enableKeyboard: true
})
```

##### Custom Threshold

```typescript
const scrollSnap = createScrollSnap(element, {
  snapDestinationY: '50vh',
  threshold: 0.4, // Requires more scroll distance to trigger snap
})
```

#### API Reference

##### Methods

##### `bind()`
Enables scroll snapping and attaches event listeners.

##### `unbind()`
Disables scroll snapping and removes event listeners.

#### Development

```bash
# Clone the repository
git clone https://github.com/lucafalasco/scroll-snap.git
cd scroll-snap

# Install dependencies
yarn

# Start development server
yarn start

# Run unit tests
yarn test

# Run e2e tests
yarn test:e2e

# Build for production
yarn build
```

The dev server will start at `http://localhost:8080` with hot reloading enabled and a playground environment for testing.

#### Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

#### Browser Support

- Chrome 61+
- Firefox 63+
- Safari 11+
- Edge 79+

#### License

MIT © [Luca Falasco](LICENSE)
