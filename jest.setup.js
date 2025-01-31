import '@testing-library/jest-dom'

export default () => {
  Object.defineProperty(window, 'requestAnimationFrame', {
    value: (callback) => setTimeout(callback, 0),
  })
}
