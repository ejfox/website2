// Lightweight no-op shim for animation utilities used across the app.
// This prevents build-time failures when the real animation lib isn't present.

export function animate() {
  return {
    play: () => {},
    pause: () => {},
    cancel: () => {},
    finished: Promise.resolve()
  }
}

export function stagger() {
  // Return a function placeholder compatible with anime.js stagger
  return () => {}
}

export function createTimeline() {
  const api = {
    add: () => api,
    play: () => {},
    pause: () => {},
    finished: Promise.resolve()
  }
  return api
}

export function onScroll() {
  // Return a placeholder autoplay handler
  return { target: null, onEnter: () => true }
}

export const eases = {
  inOutSine: 'inOutSine',
  cubicBezier: (...args) => `cubicBezier(${args.join(',')})`,
  outElastic: (...args) => `outElastic(${args.join(',')})`,
  outBack: (...args) => `outBack(${args.join(',')})`,
  inBack: (...args) => `inBack(${args.join(',')})`
}
