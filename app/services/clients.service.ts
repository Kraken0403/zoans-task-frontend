// services/clients.service.ts

export const getClients = () => {
  const { $api } = useNuxtApp()
  return $api.get('/clients')
}

export const getClient = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.get(`/clients/${id}`)
}

export const createClient = (payload: any) => {
  const { $api } = useNuxtApp()
  return $api.post('/clients', payload)
}

export const updateClient = (id: number, payload: any) => {
  const { $api } = useNuxtApp()
  return $api.patch(`/clients/${id}`, payload)
}

export const deleteClient = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.delete(`/clients/${id}`)
}

/* ======================
   EXCEL IMPORT
====================== */

export const getUngroupedClients = () => {
  const { $api } = useNuxtApp()
  return $api.get('/clients/ungrouped')
}

export const getAvailableClientsForGroup = (groupId: number) => {
  const { $api } = useNuxtApp()
  return $api.get(`/clients/available-for-group/${groupId}`)
}



export const importClientsExcel = (file: File) => {
  const { $api } = useNuxtApp()

  const formData = new FormData()
  formData.append('file', file)

  return $api.post('/clients/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
