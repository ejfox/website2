/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue', 
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
    // DELETE processed content scanning - causes CSS bloat
  ],
  plugins: [
    require('@tailwindcss/typography')
  ],
  theme: {
    // Restore prose styles for typography
    extend: {}
  }
}
