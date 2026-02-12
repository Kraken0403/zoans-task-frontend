
// services/task.service.ts

export const getTasks = (params?: {
  clientId?: number
  assignedToUserId?: number
  categoryId?: number
  status?: string
}) => {
  const { $api } = useNuxtApp()
  return $api.get('/tasks', { params })
}

export const getTask = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.get(`/tasks/${id}`)
}

export const updateTask = (id: number, payload: any) => {
  const { $api } = useNuxtApp()
  return $api.patch(`/tasks/${id}`, payload)
}

export const assignTask = (taskId: number, userId: number) => {
  const { $api } = useNuxtApp()
  return $api.patch(`/tasks/${taskId}/assign`, { userId })
}

export const bulkAssignTasks = (taskIds: number[], userId: number) => {
  const { $api } = useNuxtApp()
  return $api.post('/tasks/bulk-assign', { taskIds, userId })
}

export const getTasksByIds = (ids: number[]) => {
  const { $api } = useNuxtApp()
  return $api.get('/tasks/bulk', {
    params: {
      ids: ids.join(','),
    },
  })
}

export const getMyTasks = () => {
  const { $api } = useNuxtApp()
  return $api.get('/me/tasks')
}
  
export const createTask = (payload: any) => {
    const { $api } = useNuxtApp()
    return $api.post('/tasks', payload)
 }

  