module.exports = {
  content: [
    'content/**/*.md' // Make sure markdown content is included
  ],
  darkMode: 'media', // Use system preference for dark mode
  plugins: [require('@tailwindcss/typography')],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none', // Override prose max-width
            color: 'inherit', // Let parent color flow through
            a: {
              color: 'inherit',
              '&:hover': {
                color: 'inherit'
              }
            }
          }
        }
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': {
            opacity: '0.8',
          },
          '50%': {
            opacity: '0.5',
          },
        }
      }
    }
  }
}
