export default defineNuxtPlugin(() => {
  const script = document.createElement('script')
  script.async = true
  script.defer = true
  script.dataset.websiteId = '165590cb-c361-4ad8-9459-6c6390744c64'
  script.src = 'https://umami.tools.ejfox.com/script.js'
  document.head.appendChild(script)
})
