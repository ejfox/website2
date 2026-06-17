/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  plugins: [require('@tailwindcss/typography')],
  theme: {
    extend: {
      fontSize: {
        // Typography scale: 2px font increments, 4px line-height grid
        // Dense sizes for data-heavy UI
        '3xs': ['0.625rem', { lineHeight: '1rem', letterSpacing: '0.02em' }], // 10px/16px - dense stats
        '2xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }], // 12px/16px - small labels
        // Standard sizes
        xs: ['0.875rem', '1.25rem'], // 14px/20px - captions
        sm: ['1rem', '1.5rem'], // 16px/24px - body small
        base: ['1.125rem', '1.75rem'], // 18px/28px - body
        lg: ['1.25rem', '2rem'], // 20px/32px - lead
        xl: ['1.5rem', '2rem'], // 24px/32px - h4
        '2xl': ['1.75rem', '2.25rem'], // 28px/36px - h3
        '3xl': ['2rem', '2.5rem'], // 32px/40px - h2
        '4xl': ['2.5rem', '3rem'], // 40px/48px - h1
        '5xl': ['3rem', '3.5rem'], // 48px/56px - display
        '6xl': ['4rem', '4.5rem'], // 64px/72px - hero
        '7xl': ['5rem', '5.5rem'], // 80px/88px - jumbo
        '8xl': ['6rem', '6rem'], // 96px/96px - massive
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
        32: '16rem', // 256px (32x8)
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Georgia',
          'Times New Roman',
          'Droid Serif',
          'Times',
          'Source Serif Pro',
          'serif',
        ],
        mono: [
          'Monaspace Neon',
          'Monaspace Argon',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.04em',
        widest: '0.08em',
      },
      lineHeight: {
        none: '1',
        tight: '1.2',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '1.75',
      },
    },
  },
}
