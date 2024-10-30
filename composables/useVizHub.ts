import { ref, type Ref, onMounted } from 'vue'
import * as d3 from 'd3'

export interface VizModule {
  main: (container: HTMLElement) => void
}

export const useVizHub = (contentRef: Ref<HTMLElement | null>) => {
  const vizRefs = ref<HTMLElement[]>([])
  const error = ref<string | null>(null)

  const initializeViz = (vizContainer: HTMLElement, code: string) => {
    try {
      // Create a container for D3
      const container = document.createElement('div')
      container.style.width = '100%'
      container.style.height = '100%'
      vizContainer.innerHTML = '' // Clear existing content
      vizContainer.appendChild(container)
      vizRefs.value.push(container)

      // Create a module from the code
      const module = new Function('exports', 'd3', `
        ${code};
        return exports;
      `)({}, d3) as VizModule

      if (typeof module.main === 'function') {
        module.main(container)
      } else {
        throw new Error('No main function found in visualization code')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize visualization'
      vizContainer.innerHTML = `
        <div class="p-4 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded">
          ${error.value}
        </div>
      `
    }
  }

  return {
    error,
    initializeViz
  }
}