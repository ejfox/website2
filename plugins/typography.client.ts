// Client-side plugin to set typography classes based on route
export default defineNuxtPlugin((nuxtApp) => {
  // Function to update root class based on current route
  const updateRootClass = (route: { path: string }) => {
    if (route.path === '/projects' || route.path.includes('/projects/')) {
      document.documentElement.classList.add('projects-page')
    } else {
      document.documentElement.classList.remove('projects-page')
    }
  }

  // Set initial class
  nuxtApp.hook('app:mounted', () => {
    const router = useRouter()
    updateRootClass(router.currentRoute.value)
  })

  // Update class on route change
  nuxtApp.hook('page:finish', () => {
    const router = useRouter()
    updateRootClass(router.currentRoute.value)
  })
})
