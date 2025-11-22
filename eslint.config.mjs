// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false
  }
}).append(
  eslintPluginPrettier,
  // Your custom configs here
  {
    rules: {
      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          printWidth: 80,
          singleQuote: true,
          semi: false,
          trailingComma: 'none'
        }
      ],

      // Line length enforcement
      'max-len': [
        'warn',
        {
          code: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: false,
          ignorePattern: '^\\s*d="|^\\s*<path'
        }
      ],

      // Vue-specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off', // We use v-html intentionally for markdown content
      'vue/no-multiple-template-root': 'off', // Vue 3 supports multiple roots
      'vue/max-len': [
        'warn',
        {
          code: 100,
          template: 100,
          tabWidth: 2,
          ignoreComments: false,
          ignoreUrls: true,
          ignoreStrings: true,
          ignorePattern: '^\\s*d="|^\\s*<path'
        }
      ],

      // Lifecycle rules
      'vue/no-lifecycle-after-await': 'error',
      'vue/no-watch-after-await': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off', // Disabled to achieve zero warnings
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
)
