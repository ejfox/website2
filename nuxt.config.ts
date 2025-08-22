export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  
  devServer: {
    port: 3006
  },

  nitro: {
    preset: 'node-server'
  },

  css: ['~/assets/css/global.css']
})
