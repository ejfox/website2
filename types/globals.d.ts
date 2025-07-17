// Global type definitions for the website

declare global {
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