export default defineNuxtPlugin(() => {
  // Nuxt 4 way - use useHead!
  useHead({
    script: [{
      src: 'https://umami.tools.ejfox.com/script.js',
      async: true,
      defer: true,
      'data-website-id': '165590cb-c361-4ad8-9459-6c6390744c64'
    }]
  })
})
