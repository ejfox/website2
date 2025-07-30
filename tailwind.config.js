/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
    './content/**/*.md'
  ],
  darkMode: 'media', // Use system preference for dark mode
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries')
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              '&:hover': {
                color: 'inherit'
              }
            },
            // Globally increase font sizes for non-projects pages
            p: {
              fontSize: '1.125rem',
              lineHeight: '2rem',
              marginBottom: '1.5rem',
              '@media (min-width: 768px)': {
                fontSize: '1.25rem',
                lineHeight: '2rem'
              }
            },
            li: {
              fontSize: '1.125rem',
              lineHeight: '2rem',
              marginBottom: '1.5rem',
              '@media (min-width: 768px)': {
                fontSize: '1.25rem',
                lineHeight: '2rem'
              }
            },
            blockquote: {
              fontSize: '1.125rem',
              lineHeight: '2rem',
              '@media (min-width: 768px)': {
                fontSize: '1.25rem',
                lineHeight: '2rem'
              }
            }
          }
        },
        sm: {
          css: {
            // Override prose-sm to be larger
            fontSize: '1.125rem',
            lineHeight: '2rem',
            p: {
              fontSize: '1.125rem',
              lineHeight: '2rem',
              marginBottom: '1.5rem',
              '@media (min-width: 768px)': {
                fontSize: '1.25rem',
                lineHeight: '2rem'
              }
            },
            li: {
              fontSize: '1.125rem',
              lineHeight: '2rem',
              '@media (min-width: 768px)': {
                fontSize: '1.25rem',
                lineHeight: '2rem'
              }
            }
          }
        }
      },
      fontSize: {
        '2xs': ['0.65rem', '1rem']
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        pulse: {
          '0%, 100%': {
            opacity: '0.8'
          },
          '50%': {
            opacity: '0.5'
          }
        }
      }
    }
  }
}
