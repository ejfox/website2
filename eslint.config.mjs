import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Base JS config
  js.configs.recommended,
  
  // TypeScript config
  ...tseslint.configs.recommended,
  
  // Vue config
  ...pluginVue.configs['flat/recommended'],
  
  // Global configuration for all files
  {
    languageOptions: {
      globals: {
        // Basic browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        SVGElement: 'readonly',
        Event: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        DOMParser: 'readonly',
        
        // Node.js globals (for universal/isomorphic code)
        process: 'readonly',
        Buffer: 'readonly',
        
        // Vue/Nuxt auto-imports (available everywhere)
        defineNuxtConfig: 'readonly',
        useRuntimeConfig: 'readonly',
        $fetch: 'readonly',
        createError: 'readonly',
        useHead: 'readonly',
        useState: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        navigateTo: 'readonly',
        useFetch: 'readonly',
        useAsyncData: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        
        // Vue Composition API
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        nextTick: 'readonly',
        defineComponent: 'readonly',
        
        // Vue TypeScript types
        Ref: 'readonly',
        
        // Custom composables
        useNumberFormat: 'readonly',
        useStats: 'readonly',
        useWeightCalculations: 'readonly',
        usePredictions: 'readonly',
        useProcessedMarkdown: 'readonly',
        useTransition: 'readonly',
        useD3Heatmap: 'readonly',
        useHeatmapColors: 'readonly',
        useHeatmapLayout: 'readonly',
        useTooltipPosition: 'readonly',
        useUmami: 'readonly',
        useClientStripe: 'readonly',
        markdownParser: 'readonly',
        
        // Common utilities
        format: 'readonly',
        
        // Project-specific globals
        ANIMATION_SETTINGS: 'readonly'
      }
    }
  },
  
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CustomEvent: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        location: 'readonly',
        history: 'readonly',
        
        // Vue/Nuxt auto-imports
        defineNuxtConfig: 'readonly',
        definePageMeta: 'readonly',
        useHead: 'readonly',
        useSeoMeta: 'readonly',
        useRuntimeConfig: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        navigateTo: 'readonly',
        useState: 'readonly',
        useCookie: 'readonly',
        useFetch: 'readonly',
        useAsyncData: 'readonly',
        useLazyFetch: 'readonly',
        useLazyAsyncData: 'readonly',
        useRequestHeaders: 'readonly',
        useRequestURL: 'readonly',
        useNuxtApp: 'readonly',
        useNuxtData: 'readonly',
        refreshCookie: 'readonly',
        clearNuxtData: 'readonly',
        abortNavigation: 'readonly',
        addRouteMiddleware: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        onBeforeRouteLeave: 'readonly',
        onBeforeRouteUpdate: 'readonly',
        preloadComponents: 'readonly',
        preloadRouteComponents: 'readonly',
        reloadNuxtApp: 'readonly',
        useLoadingIndicator: 'readonly',
        useError: 'readonly',
        createError: 'readonly',
        showError: 'readonly',
        clearError: 'readonly',
        isNuxtError: 'readonly',
        useRequestEvent: 'readonly',
        useRequestFetch: 'readonly',
        setResponseStatus: 'readonly',
        $fetch: 'readonly',
        
        // Server-side globals for API routes
        defineEventHandler: 'readonly',
        getQuery: 'readonly',
        readBody: 'readonly',
        getRouterParams: 'readonly',
        getHeaders: 'readonly',
        getHeader: 'readonly',
        setHeaders: 'readonly',
        setHeader: 'readonly',
        appendHeaders: 'readonly',
        appendHeader: 'readonly',
        getCookie: 'readonly',
        setCookie: 'readonly',
        deleteCookie: 'readonly',
        parseCookies: 'readonly',
        getClientIP: 'readonly',
        
        // Node.js globals for isomorphic code
        process: 'readonly',
        Buffer: 'readonly',
        
        // Additional Web APIs
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        PerformanceObserver: 'readonly',
        
        // VueUse composables (common ones)
        useDark: 'readonly',
        useClipboard: 'readonly',
        useStorage: 'readonly',
        useLocalStorage: 'readonly',
        useSessionStorage: 'readonly',
        useEventListener: 'readonly',
        useResizeObserver: 'readonly',
        useIntersectionObserver: 'readonly',
        useMutationObserver: 'readonly',
        useMediaQuery: 'readonly',
        useDeviceOrientation: 'readonly',
        useGeolocation: 'readonly',
        useNetwork: 'readonly',
        useOnline: 'readonly',
        usePageLeave: 'readonly',
        useTitle: 'readonly',
        useFavicon: 'readonly',
        useFullscreen: 'readonly',
        usePermission: 'readonly',
        useShare: 'readonly',
        useVibrate: 'readonly',
        useWakeLock: 'readonly',
        
        // Custom composables from this project
        useNumberFormat: 'readonly',
        usePredictions: 'readonly',
        useProcessedMarkdown: 'readonly',
        useTransition: 'readonly',
        useD3Heatmap: 'readonly',
        useHeatmapColors: 'readonly',
        useHeatmapLayout: 'readonly',
        useTooltipPosition: 'readonly',
        useUmami: 'readonly',
        useWeightCalculations: 'readonly',
        useClientStripe: 'readonly',
        markdownParser: 'readonly',
        
        // Vue Composition API
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        readonly: 'readonly',
        watchEffect: 'readonly',
        watchPostEffect: 'readonly',
        watchSyncEffect: 'readonly',
        watch: 'readonly',
        isRef: 'readonly',
        unref: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        isProxy: 'readonly',
        isReactive: 'readonly',
        isReadonly: 'readonly',
        shallowRef: 'readonly',
        triggerRef: 'readonly',
        customRef: 'readonly',
        shallowReactive: 'readonly',
        shallowReadonly: 'readonly',
        toRaw: 'readonly',
        markRaw: 'readonly',
        effectScope: 'readonly',
        getCurrentScope: 'readonly',
        onScopeDispose: 'readonly',
        
        // Vue lifecycle
        onBeforeMount: 'readonly',
        onMounted: 'readonly',
        onBeforeUpdate: 'readonly',
        onUpdated: 'readonly',
        onBeforeUnmount: 'readonly',
        onUnmounted: 'readonly',
        onErrorCaptured: 'readonly',
        onRenderTracked: 'readonly',
        onRenderTriggered: 'readonly',
        onActivated: 'readonly',
        onDeactivated: 'readonly',
        onServerPrefetch: 'readonly',
        
        // Vue utilities
        nextTick: 'readonly',
        defineComponent: 'readonly',
        defineAsyncComponent: 'readonly',
        resolveComponent: 'readonly',
        getCurrentInstance: 'readonly',
        h: 'readonly',
        inject: 'readonly',
        provide: 'readonly',
        
        // Vue directives
        withDirectives: 'readonly',
        vShow: 'readonly',
        vModelText: 'readonly',
        vModelCheckbox: 'readonly',
        vModelRadio: 'readonly',
        vModelSelect: 'readonly',
        vModelDynamic: 'readonly',
        withModifiers: 'readonly',
        withKeys: 'readonly',
        
        // Vue transitions
        Transition: 'readonly',
        TransitionGroup: 'readonly',
        
        // Vue keep-alive
        KeepAlive: 'readonly',
        
        // Vue suspense
        Suspense: 'readonly',
        
        // Vue teleport
        Teleport: 'readonly'
      }
    }
  },
  
  // Server-side globals (for API routes and server code)
  {
    files: ['server/**/*.ts', 'server/**/*.js'],
    languageOptions: {
      globals: {
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        
        // Nuxt server globals
        defineEventHandler: 'readonly',
        getQuery: 'readonly',
        readBody: 'readonly',
        getRouterParams: 'readonly',
        getHeaders: 'readonly',
        getHeader: 'readonly',
        setHeaders: 'readonly',
        setHeader: 'readonly',
        appendHeaders: 'readonly',
        appendHeader: 'readonly',
        getCookie: 'readonly',
        setCookie: 'readonly',
        deleteCookie: 'readonly',
        parseCookies: 'readonly',
        getClientIP: 'readonly',
        useRuntimeConfig: 'readonly',
        createError: 'readonly',
        $fetch: 'readonly',
        
        // Web APIs available in server context
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        FormData: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly'
      }
    }
  },
  
  // Configuration files (CommonJS)
  {
    files: ['*.config.js', '*.config.mjs', 'tailwind.config.js'],
    languageOptions: {
      globals: {
        module: 'writable',
        exports: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  
  // Global rules
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'error'
    }
  },
  
  // Ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**',
      '.output/**',
      'anime.esm.js',
      'test/**'
    ]
  }
)