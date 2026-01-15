export const getClients = () => {
    const { $api } = useNuxtApp()
    return $api.get('/clients')
  }
  
  export const getClientById = (id: number) => {
    const { $api } = useNuxtApp()
    return $api.get(`/clients/${id}`)
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
  
  export const importClientsExcel = (formData: FormData) => {
    const { $api } = useNuxtApp()
    return $api.post('/clients/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }
  