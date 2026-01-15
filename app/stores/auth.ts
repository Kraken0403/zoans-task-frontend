import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: null as string | null,
  }),

  actions: {
    setAuth(data: any) {
      this.user = data.user
      this.token = data.accessToken
      localStorage.setItem('token', data.accessToken)
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      navigateTo('/login')
    },
  },
})
