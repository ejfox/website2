// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false,
  },
}).append(
  eslintPluginPrettier,
  // Globals for Nuxt auto-imports
  {
    languageOptions: {
      globals: {
        // Vue composition API
        computed: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        onBeforeMount: 'readonly',
        onMounted: 'readonly',
        onBeforeUpdate: 'readonly',
        onUpdated: 'readonly',
        onBeforeUnmount: 'readonly',
        onUnmounted: 'readonly',
        onActivated: 'readonly',
        onDeactivated: 'readonly',
        onErrorCaptured: 'readonly',
        onRenderTracked: 'readonly',
        onRenderTriggered: 'readonly',
        onServerPrefetch: 'readonly',
        ref: 'readonly',
        reactive: 'readonly',
        readonly: 'readonly',
        unref: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        nextTick: 'readonly',
        // Nuxt
        definePageMeta: 'readonly',
        defineRouteRules: 'readonly',
        useRouter: 'readonly',
        useRoute: 'readonly',
        useHead: 'readonly',
        useSeoMeta: 'readonly',
        useServerSeoMeta: 'readonly',
        useAsyncData: 'readonly',
        useFetch: 'readonly',
        useCookie: 'readonly',
        useRequestHeaders: 'readonly',
        useRequestEvent: 'readonly',
        useRuntimeConfig: 'readonly',
        useAppConfig: 'readonly',
        navigateTo: 'readonly',
        abortNavigation: 'readonly',
        setResponseStatus: 'readonly',
        clearError: 'readonly',
        createError: 'readonly',
        showError: 'readonly',
        isPrerendered: 'readonly',
        preloadRouteComponents: 'readonly',
        reloadNuxtData: 'readonly',
        // VueUse
        useElementSize: 'readonly',
        useEventListener: 'readonly',
        useAsyncState: 'readonly',
        useScroll: 'readonly',
        useBreakpoints: 'readonly',
        useIntersectionObserver: 'readonly',
        useDark: 'readonly',
        // Project custom composables
        usePageSeo: 'readonly',
        useProcessedMarkdown: 'readonly',
        useTOC: 'readonly',
        useWeightCalculations: 'readonly',
      },
    },
  },
  // Your custom configs here
  {
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // CRITICAL: Catch undefined variables before they break prod
      'no-undef': 'error',

      // Line length enforcement (STRICT 80)
      'max-len': [
        'error',
        {
          code: 80,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: false,
          ignorePattern: '^\\s*d="|^\\s*<path|class="|:class=',
        },
      ],

      // Vue-specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off', // We use v-html intentionally for markdown content
      'vue/no-multiple-template-root': 'off', // Vue 3 supports multiple roots
      'vue/max-len': [
        'warn',
        {
          code: 80,
          template: 120,
          tabWidth: 2,
          ignoreComments: false,
          ignoreUrls: true,
          ignoreStrings: true,
          ignorePattern: '^\\s*d="|^\\s*<path|class=',
        },
      ],
      'vue/no-mutating-props': 'error',
      'vue/no-duplicate-attributes': 'error',

      // Lifecycle rules
      'vue/no-lifecycle-after-await': 'error',
      'vue/no-watch-after-await': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off', // Disabled to achieve zero warnings
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
          allowNamedExports: false,
        },
      ],
    },
  }
)
