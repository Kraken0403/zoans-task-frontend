export const login = async (email: string, password: string) => {
    const { $api } = useNuxtApp()
    const res = await $api.post('/auth/login', { email, password })
    return res.data
  }
  
