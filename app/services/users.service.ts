export const getUsers = () => {
    const { $api } = useNuxtApp()
    return $api.get('/users')
  }
  
  export const getUserById = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.get(`/users/${id}`)
  }
  
  export const createUser = (payload: {
    name: string
    email: string
    password: string
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  }) => {
    const { $api } = useNuxtApp()
    return $api.post('/users', payload)
  }
  
  export const updateUser = (
    id: number,
    payload: Partial<{
      name: string
      email: string
      password: string
      role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
      isActive: boolean
    }>
  ) => {
    const { $api } = useNuxtApp()
    return $api.patch(`/users/${id}`, payload)
  }
  
  export const deleteUser = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.delete(`/users/${id}`)
  }
  