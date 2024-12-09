export const useStatsConfig = () => {
  const colorScheme = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    background: 'var(--color-background)',
    text: 'var(--color-text)'
  }

  const chartDefaults = {
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
    transition: {
      duration: 750,
      ease: d3.easeCubicInOut
    },
    responsive: {
      aspectRatio: 16 / 9,
      minHeight: 200
    }
  }

  return {
    colorScheme,
    chartDefaults
  }
}
