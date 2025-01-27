module.exports = {
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.zinc.800')
          }
        },
        invert: {
          css: {
            color: theme('colors.zinc.200')
          }
        }
      })
    }
  }
}
