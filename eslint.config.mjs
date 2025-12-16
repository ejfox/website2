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
        defineAsyncComponent: 'readonly',
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
        defineNuxtPlugin: 'readonly',
        defineEventHandler: 'readonly',
        definePageMeta: 'readonly',
        defineRouteRules: 'readonly',
        onNuxtReady: 'readonly',
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
        // Nitro Server
        getQuery: 'readonly',
        readBody: 'readonly',
        getHeader: 'readonly',
        setHeader: 'readonly',
        getCookie: 'readonly',
        setCookie: 'readonly',
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
        useLazyFetch: 'readonly',
        useDateFormat: 'readonly',
        useProjectSlug: 'readonly',
        useMarkdown: 'readonly',
        useNumberFormat: 'readonly',
        useStats: 'readonly',
        useKalshi: 'readonly',
        useCalibration: 'readonly',
        useMouse: 'readonly',
      },
    },
  },
  // Your custom configs here
  {
    rules: {
      // ============================================================
      // CORE: The linter is our god. Treat warnings as errors.
      // ============================================================

      // Prettier integration
      'prettier/prettier': 'error',

      // CRITICAL: Catch undefined variables before they break prod
      'no-undef': 'error',

      // Unused variables are dead code - errors, not warnings
      'no-unused-vars': 'off', // Disable in favor of TS version
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Never allow debugger statements in prod
      'no-debugger': 'error',

      // Console statements should be intentional, not accidental
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // Catch accidental equality bugs (==  vs ===)
      eqeqeq: ['error', 'always'],
      'no-eq-null': 'error',

      // Async/await issues that will silently fail
      'no-return-await': 'error',

      // Import/export issues
      'no-duplicate-imports': 'error',

      // Catch unreachable code
      'no-unreachable': 'error',
      'no-fallthrough': 'error',

      // Catch common logic errors
      'no-cond-assign': 'error',
      'no-constant-condition': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',

      // ============================================================
      // LINE LENGTH (STRICT)
      // ============================================================
      'max-len': [
        'error',
        {
          code: 80,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true, // Allow long JSDoc headers
          // Ignore: SVG paths, class attrs, JSDoc tags in HTML comments
          ignorePattern:
            '^\\s*d="|^\\s*<path|class="|:class=|^\\s*\\*|@file|@description|@props|@returns|@param|@endpoint|@usage|@env',
        },
      ],

      // ============================================================
      // VUE: Strict component rules
      // ============================================================
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off', // Intentional for markdown
      'vue/no-multiple-template-root': 'off', // Vue 3

      // Catch refactoring mistakes in templates
      'vue/no-unused-components': 'error',
      'vue/no-unused-vars': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/require-prop-types': 'error',

      // Prevent prop mutations (common bug)
      'vue/no-mutating-props': 'error',
      'vue/no-duplicate-attributes': 'error',

      // Prevent computed mutations
      'vue/no-side-effects-in-computed-properties': 'error',

      // Lifecycle safety
      'vue/no-lifecycle-after-await': 'error',
      'vue/no-watch-after-await': 'error',
      'vue/no-async-in-computed-properties': 'error',

      // Attribute/prop issues
      'vue/require-valid-default-prop': 'error',
      'vue/valid-model-definition': 'error',

      'vue/max-len': [
        'error',
        {
          code: 80,
          template: 120,
          tabWidth: 2,
          ignoreComments: true, // Allow long JSDoc headers
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreHTMLTextContents: true,
          // Ignore: SVG paths, class attrs, JSDoc tags in HTML comments
          ignorePattern:
            '^\\s*d="|^\\s*<path|class=|@file|@description|@props|@returns|@param|@endpoint|@usage|@env|@emits',
        },
      ],

      // ============================================================
      // TYPESCRIPT: Strict type checking
      // ============================================================
      '@typescript-eslint/no-explicit-any': 'off',
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
