/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ],
  theme: {
    extend: {
      fontSize: {
        // Swiss grid: 8px baseline unit
        // Ultra-small Tuftian sizes with increased tracking for legibility
        '5xs': ['0.4375rem', { lineHeight: '0.5rem', letterSpacing: '0.03em' }], // 7px/8px - inline symbols
        '4xs': ['0.5rem', { lineHeight: '0.5rem', letterSpacing: '0.025em' }], // 8px/8px - ultra-dense labels
        '3xs': ['0.5625rem', { lineHeight: '0.75rem', letterSpacing: '0.02em' }], // 9px/12px - dense stats
        '2xs': ['0.625rem', { lineHeight: '0.75rem', letterSpacing: '0.015em' }], // 10px/12px - compact data
        // Standard sizes
        xs: ['0.75rem', '1rem'], // 12px/16px (2 units)
        sm: ['0.875rem', '1.5rem'], // 14px/24px (3 units)
        base: ['1rem', '1.5rem'], // 16px/24px (3 units)
        lg: ['1.25rem', '2rem'], // 20px/32px (4 units)
        xl: ['1.5rem', '2rem'], // 24px/32px (4 units)
        '2xl': ['2rem', '2.5rem'], // 32px/40px (5 units)
        '3xl': ['2.5rem', '3rem'], // 40px/48px (6 units)
        '4xl': ['3rem', '3.5rem'], // 48px/56px (7 units)
        '5xl': ['3.5rem', '4rem'], // 56px/64px (8 units)
        '6xl': ['4.5rem', '5rem'], // 72px/80px (10 units)
        '7xl': ['5.5rem', '6rem'], // 88px/96px (12 units)
        '8xl': ['7rem', '7rem'] // 112px/112px (14 units)
      },
      spacing: {
        // 2, 4, 8 rhythm (based on 8px unit)
        0: '0',
        px: '1px',
        0.5: '0.25rem', // 4px
        1: '0.5rem', // 8px
        2: '1rem', // 16px (2x8)
        3: '1.5rem', // 24px (3x8)
        4: '2rem', // 32px (4x8)
        6: '3rem', // 48px (6x8)
        8: '4rem', // 64px (8x8)
        10: '5rem', // 80px (10x8)
        12: '6rem', // 96px (12x8)
        16: '8rem', // 128px (16x8)
        24: '12rem', // 192px (24x8)
        32: '16rem' // 256px (32x8)
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        serif: [
          'Georgia',
          'Times New Roman',
          'Droid Serif',
          'Times',
          'Source Serif Pro',
          'serif'
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace'
        ]
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.04em',
        widest: '0.08em'
      },
      lineHeight: {
        none: '1',
        tight: '1.2',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '1.75'
      }
    }
  }
}
