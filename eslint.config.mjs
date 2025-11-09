// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false
  }
}).append(
  // Your custom configs here
  {
    rules: {
      // Vue-specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/no-multiple-template-root': 'off', // Vue 3 supports multiple roots

      // Lifecycle rules
      'vue/no-lifecycle-after-await': 'error',
      'vue/no-watch-after-await': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  }
)
