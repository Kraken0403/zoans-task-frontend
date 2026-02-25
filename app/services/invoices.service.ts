// services/invoices.service.ts

export const getInvoices = () => {
  const { $api } = useNuxtApp()
  return $api.get('/invoices')
}

export const getInvoiceById = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.get(`/invoices/${id}`)
}

export const createInvoice = async (payload: any) => {
  const { $api } = useNuxtApp()

  const res = await $api.post('/invoices', payload)
  console.log('Created Invoice:', res.data)
  return res.data
}
export const addInvoiceItem = (invoiceId: number, payload: any) => {
  const { $api } = useNuxtApp()
  return $api.post(`/invoices/${invoiceId}/items`, payload)
}

export const recalculateInvoice = (invoiceId: number) => {
  const { $api } = useNuxtApp()
  return $api.post(`/invoices/${invoiceId}/recalculate`)
}

export const sendInvoice = (invoiceId: number, payload: any) => {
  const { $api } = useNuxtApp()
  return $api.post(`/invoices/${invoiceId}/send`, payload)
}

export const deleteInvoice = (id: number) => {
  const { $api } = useNuxtApp()
  return $api.delete(`/invoices/${id}`)
}

/* ===========================
   🔥 NEW: STATUS UPDATE
=========================== */
export const updateInvoiceStatus = (
  invoiceId: number,
  status: string,
) => {
  const { $api } = useNuxtApp()
  return $api.patch(`/invoices/${invoiceId}/status`, {
    status,
  })
}

/* ===========================
   🔥 NEW: PDF DOWNLOAD
=========================== */
export const downloadInvoicePdf = (id: number) => {
  const { $api } = useNuxtApp()

  return $api.post(
    `/invoices/${id}/pdf`,
    {}, // 👈 REQUIRED (POST body cannot be undefined)
    {
      responseType: 'blob', // 👈 THIS is the key
    },
  )
}

