export const getMyCompanies = () => {
  const { $api } = useNuxtApp()
  return $api.get('/my-companies')
}

export const getMyCompany = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.get(`/my-companies/${id}`)
}

// alias
export const getMyCompanyById = getMyCompany

export const createMyCompany = (payload: any) => {
  const { $api } = useNuxtApp()
  return $api.post('/my-companies', payload)
}

export const updateMyCompany = (id: number, payload: any) => {
  const { $api } = useNuxtApp()
  return $api.patch(`/my-companies/${id}`, payload)
}

export const deleteMyCompany = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.delete(`/my-companies/${id}`)
}


export const uploadCompanySeal = (id: number, file: File) => {
  const { $api } = useNuxtApp()
  const fd = new FormData()
  fd.append('file', file)
  return $api.post(`/my-companies/${id}/seal`, fd)
}

export const uploadCompanySignature = (id: number, file: File) => {
  const { $api } = useNuxtApp()
  const fd = new FormData()
  fd.append('file', file)
  return $api.post(`/my-companies/${id}/signature`, fd)
}
