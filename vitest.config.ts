import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Git worktrees live inside the repo at .claude/worktrees/<branch>/, so the
    // default glob collects a second copy of every test file — from a different
    // branch. `yarn test` was reporting 303 tests when this repo has 174, and a
    // stale worktree would fail the suite for reasons unrelated to any commit
    // here. `**/node_modules/**` and `**/dist/**` are vitest's own defaults,
    // repeated because setting `exclude` replaces them rather than adding.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
    },
  },
})
