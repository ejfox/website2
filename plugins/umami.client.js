export default defineNuxtPlugin(() => {
  const script = document.createElement('script')
  script.async = true
  script.defer = true
  script.dataset.websiteId = '9350451a-f9e6-4689-982a-8cca95c64978'
  script.src = 'https://umami.tools.ejfox.com/umami.js'
  document.head.appendChild(script)
})
