export const getClientGroups = () => {
  const { $api } = useNuxtApp()
  return $api.get('/client-groups')
}

export const getClientGroup = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.get(`/client-groups/${id}`)
}

export const createClientGroup = (payload: {
  name: string
  code: string
}) => {
  const { $api } = useNuxtApp()
  return $api.post('/client-groups', payload)
}

export const updateClientGroup = (
  id: number,
  payload: {
    name: string
    code: string
  }
) => {
  const { $api } = useNuxtApp()
  return $api.patch(`/client-groups/${id}`, payload)
}

export const deleteClientGroup = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.delete(`/client-groups/${id}`)
}

/* ========================
   BULK ASSIGN CLIENTS
======================== */

export const assignClients = (
  groupId: number,
  clientIds: number[]
) => {
  const { $api } = useNuxtApp()

  if (!clientIds?.length) {
    return Promise.reject(new Error('No clients selected'))
  }

  return $api.patch(
    `/client-groups/${groupId}/assign-clients`,
    { clientIds }
  )
}

/* ========================
   BULK REMOVE CLIENTS
======================== */

export const removeClientsFromGroup = (
  groupId: number,
  clientIds: number[]
) => {
  const { $api } = useNuxtApp()

  if (!clientIds?.length) {
    return Promise.reject(new Error('No clients selected'))
  }

  return $api.patch(
    `/client-groups/${groupId}/remove-clients`,
    { clientIds }
  )
}
