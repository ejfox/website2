// Global type definitions for the website

declare global {
  // DOM types
  interface CustomEvent<T = any> extends Event {
    detail: T;
  }
  
  interface Location {
    href: string;
    pathname: string;
    search: string;
    hash: string;
  }
  
  interface ScrollToOptions {
    top?: number;
    left?: number;
    behavior?: 'auto' | 'smooth';
  }
  
  interface EventListener {
    (event: Event): void;
  }
  
  interface AddEventListenerOptions {
    capture?: boolean;
    once?: boolean;
    passive?: boolean;
  }
  
  // Fetch API types
  type RequestMode = 'cors' | 'no-cors' | 'same-origin' | 'navigate';
  type RequestCredentials = 'omit' | 'same-origin' | 'include';
  type RequestCache = 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  type RequestRedirect = 'follow' | 'error' | 'manual';
  type HeadersInit = string[][] | Record<string, string> | Headers;
  
  // Web API types
  interface Blob {
    readonly size: number;
    readonly type: string;
    slice(start?: number, end?: number, contentType?: string): Blob;
  }
  
  interface BufferSource {
    readonly byteLength: number;
  }
  
  interface File extends Blob {
    readonly name: string;
    readonly lastModified: number;
  }
  
  type FormDataEntryValue = string | File;
  
  interface FormData {
    append(name: string, value: string | Blob, fileName?: string): void;
    delete(name: string): void;
    get(name: string): FormDataEntryValue | null;
    getAll(name: string): FormDataEntryValue[];
    has(name: string): boolean;
    set(name: string, value: string | Blob, fileName?: string): void;
  }
  
  interface URLSearchParams {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    toString(): string;
  }
  
  type BodyInit = Blob | BufferSource | FormData | URLSearchParams | string;
  
  interface AbortSignal {
    aborted: boolean;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
  
  interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
  }
  
  interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    mode?: RequestMode;
    credentials?: RequestCredentials;
    cache?: RequestCache;
    redirect?: RequestRedirect;
    referrer?: string;
    signal?: AbortSignal | null;
  }
  
  // Window properties
  interface Window {
    // Web Vitals
    addEventListener(type: 'web-vitals', listener: (event: CustomEvent) => void): void;
    
    // Standard DOM properties
    scrollY: number;
    innerWidth: number;
    innerHeight: number;
    location: Location;
    
    // Scroll methods
    scrollTo(options: ScrollToOptions): void;
    addEventListener(type: 'scroll', listener: EventListener, options?: AddEventListenerOptions): void;
    removeEventListener(type: 'scroll', listener: EventListener): void;
    addEventListener(type: 'resize', listener: EventListener, options?: AddEventListenerOptions): void;
    removeEventListener(type: 'resize', listener: EventListener): void;
    
    // Navigation
    open(url: string, target?: string): Window | null;
  }
  
  // Document properties
  interface Document {
    getElementById(id: string): HTMLElement | null;
    documentElement: HTMLElement;
  }
  
  // Global d3 UMD module
  var d3: any;
  
  // Node.js globals
  var setTimeout: (callback: () => void, delay: number) => number;
  var clearTimeout: (id: number) => void;
  var setInterval: (callback: () => void, delay: number) => number;
  var clearInterval: (id: number) => void;
  
  // Nuxt auto-imports
  var useColorMode: () => any;
  var useRouteQuery: () => any;
  var defineNuxtPlugin: (plugin: any) => any;
  var useCookie: (name: string, options?: any) => any;
  var useNuxtApp: () => any;
  var useRouter: () => any;
  var useRoute: () => any;
  var navigateTo: (url: string) => any;
  
  // Process env for Node.js
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      ANALYZE?: string;
      DEBUG?: string;
      GITHUB_TOKEN?: string;
      MONKEYTYPE_TOKEN?: string;
      CHESS_USERNAME?: string;
      RESCUETIME_TOKEN?: string;
      LASTFM_API_KEY?: string;
      LASTFM_SHARED_SECRET?: string;
      UMAMI_USERNAME?: string;
      UMAMI_PASSWORD?: string;
      REDIS_HOST?: string;
    }
  }
}

// Module augmentations
declare module '#app' {
  interface NuxtApp {
    $router: any;
    $route: any;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $router: any;
    $route: any;
  }
}

// Export empty object to make this a module
export {};