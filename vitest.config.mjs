import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    pool: 'forks', // Use forks instead of threads for better compatibility
    poolOptions: {
      forks: {
        singleFork: true // Use single fork to avoid worker issues
      }
    },
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '~': resolve(process.cwd()),
      '@': resolve(process.cwd())
    }
  }
})