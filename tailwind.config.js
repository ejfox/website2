module.exports = {
  content: [
    'content/**/*.md' // Make sure markdown content is included
  ],
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
      }
    }
  }
}
