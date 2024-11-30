import { ref } from 'vue'

export function useVegaConfig() {
  const colorScheme = ref({
    lineColor: '#4A90E2', // Primary line color
    backgroundColor: '#FFFFFF', // Background color for light mode
    textColor: '#333333' // Text color
    // Add more colors as needed
  })

  const getConfig = () => {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      config: {
        background: colorScheme.value.backgroundColor,
        axis: {
          labelColor: colorScheme.value.textColor,
          titleColor: colorScheme.value.textColor
        },
        line: {
          color: colorScheme.value.lineColor
        }
        // Add more configuration options as needed
      }
    }
  }

  return {
    colorScheme,
    getConfig
  }
}
