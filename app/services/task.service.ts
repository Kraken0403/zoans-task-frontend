export const getTasks = () => {
    const { $api } = useNuxtApp()
    return $api.get('/tasks')
  }
  
  export const getMyTasks = () => {
    const { $api } = useNuxtApp()
    return $api.get('/me/tasks')
  }
  
  export const getTask = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.get(`/tasks/${id}`)
  }
  
  export const createTask = (payload: any) => {
    const { $api } = useNuxtApp()
    return $api.post('/tasks', payload)
  }
  
  export const updateTask = (id: number, payload: any) => {
    const { $api } = useNuxtApp()
    return $api.patch(`/tasks/${id}`, payload)
  }
  
  export const deleteTask = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.delete(`/tasks/${id}`)
  }
  
  export const getTasksByClient = (clientId: number) => {
    const { $api } = useNuxtApp()
    return $api.get(`/clients/${clientId}/tasks`)
  }
  