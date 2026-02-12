// services/task-masters.service.ts

export const getTaskMasters = (params?: {
    isActive?: boolean
    categoryId?: number
    fy?: string
  }) => {
    const { $api } = useNuxtApp()
    return $api.get('/task-masters', { params })
  }
  
  export const getTaskMaster = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.get(`/task-masters/${id}`)
  }
  
  export const createTaskMaster = (payload: any) => {
    const { $api } = useNuxtApp()
    return $api.post('/task-masters', payload)
  }
  
  export const updateTaskMaster = (id: number, payload: any) => {
    const { $api } = useNuxtApp()
    return $api.patch(`/task-masters/${id}`, payload)
  }
  
  export const disableTaskMaster = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.delete(`/task-masters/${id}`)
  }
  
  /* -------- clients -------- */
  
  export const assignTaskMasterClients = (
    taskMasterId: number,
    clientIds: number[],
  ) => {
    const { $api } = useNuxtApp()
    return $api.post(`/task-masters/${taskMasterId}/clients`, { clientIds })
  }
  
  export const unassignTaskMasterClient = (
    taskMasterId: number,
    clientId: number,
  ) => {
    const { $api } = useNuxtApp()
    return $api.delete(
      `/task-masters/${taskMasterId}/clients/${clientId}`,
    )
  }
  
  /* -------- generation -------- */
  
  export const generateTasks = (
    taskMasterId: number,
    payload: {
      year: number
      month: number
      financialYear?: string
      assignedToUserId?: number
    },
  ) => {
    const { $api } = useNuxtApp()
    console.log(payload)
    return $api.post(
      `/task-masters/${taskMasterId}/generate`,
      payload,
    )
  }
  
  
  export const getGeneratedTasksByMaster = (
    taskMasterId: number,
    params: {
      year: number
      month: number
      financialYear?: string
    },
  ) => {
    const { $api } = useNuxtApp()
    return $api.get(
      `/task-masters/${taskMasterId}/tasks`,
      { params },
    )
  }
  