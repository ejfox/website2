import { vi } from 'vitest'

// Mock Nuxt composables
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    baseURL: 'https://ejfox.com'
  }
}))

global.$fetch = vi.fn()
global.useAsyncData = vi.fn()
global.useRoute = vi.fn(() => ({
  params: { slug: ['test'] },
  path: '/test'
}))

// Mock process.client/server
Object.defineProperty(global, 'process', {
  value: {
    client: false,
    server: true,
    env: {}
  }
})