export const useStatsConfig = () => {
  const colorScheme = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    background: 'var(--color-background)',
    text: 'var(--color-text)',
    chess: {
      win: 'rgb(34, 197, 94)',
      loss: 'rgb(239, 68, 68)',
      draw: 'rgb(156, 163, 175)',
      rating: {
        bullet: 'rgb(249, 115, 22)',
        blitz: 'rgb(59, 130, 246)',
        rapid: 'rgb(34, 197, 94)'
      }
    },
    health: {
      steps: 'rgb(34, 197, 94)',
      exercise: 'rgb(249, 115, 22)',
      stand: 'rgb(59, 130, 246)',
      heart: 'rgb(239, 68, 68)'
    }
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
    },
    chess: {
      ratingChart: {
        height: 200,
        margin: { top: 20, right: 20, bottom: 30, left: 40 },
        lineColors: {
          bullet: 'rgb(249, 115, 22)',
          blitz: 'rgb(59, 130, 246)',
          rapid: 'rgb(34, 197, 94)'
        }
      }
    },
    health: {
      activityChart: {
        height: 200,
        margin: { top: 20, right: 20, bottom: 30, left: 40 },
        colors: {
          steps: 'rgb(34, 197, 94)',
          exercise: 'rgb(249, 115, 22)',
          distance: 'rgb(59, 130, 246)'
        }
      }
    }
  }

  return {
    colorScheme,
    chartDefaults
  }
}
