export default defineNuxtRouteMiddleware(() => {
    if (process.server) return
  
    const token = localStorage.getItem('token')
    if (!token) {
      return navigateTo('/login')
    }
  })
  