export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/weekend-hangs') {
    return navigateTo('https://cal.com/ejfox/weekend-hangs', {
      redirectCode: 301,
      external: true
    })
  }
})
