// eslint-disable-next-line no-undef
export default defineNuxtPlugin(() => {
  // Client-only script injection to avoid hydration mismatch
  if (import.meta.client) {
    const script = document.createElement('script')
    script.src = 'https://umami.tools.ejfox.com/script.js'
    script.async = true
    script.defer = true
    script.setAttribute(
      'data-website-id',
      '165590cb-c361-4ad8-9459-6c6390744c64'
    )
    document.head.appendChild(script)
  }
})
