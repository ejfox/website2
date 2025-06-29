import chroma from 'chroma-js'

export function generatePostColor(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  const hue = Math.abs(hash) % 360
  
  const lightColor = chroma.hsl(hue, 0.65, 0.55)
  const darkColor = chroma.hsl(hue, 0.45, 0.70)
  
  return {
    hue,
    light: {
      primary: lightColor.hex(),
      primaryRgb: lightColor.rgb().join(', '),
      secondary: lightColor.alpha(0.15).css(),
      accent: lightColor.saturate(1).darken(0.5).hex(),
      text: lightColor.darken(2).hex(),
      subtle: lightColor.alpha(0.08).css(),
    },
    dark: {
      primary: darkColor.hex(),
      primaryRgb: darkColor.rgb().join(', '),
      secondary: darkColor.alpha(0.15).css(),
      accent: darkColor.saturate(1).brighten(0.5).hex(),
      text: darkColor.brighten(2).hex(),
      subtle: darkColor.alpha(0.08).css(),
    }
  }
}

export function getContrastColor(hexColor: string, isDark: boolean) {
  const color = chroma(hexColor)
  const luminance = color.luminance()
  
  if (isDark) {
    return luminance > 0.5 ? '#000000' : '#ffffff'
  } else {
    return luminance > 0.5 ? '#ffffff' : '#000000'
  }
}