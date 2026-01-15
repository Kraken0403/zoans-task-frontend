<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getInvoices,
  downloadInvoicePdf,
  updateInvoiceStatus,
} from '@/services/invoices.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()

const invoices = ref<any[]>([])
const loading = ref(true)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

const fetchInvoices = async () => {
  loading.value = true
  const { data } = await getInvoices()
  invoices.value = data
  loading.value = false
}

onMounted(fetchInvoices)

const openInvoice = (id: number) => {
  router.push(`/invoices/${id}`)
}



const changeStatus = async (id: number, status: string) => {
  try {
    await updateInvoiceStatus(id, status)
    snackbar.value = {
      show: true,
      message: `Invoice marked as ${status}`,
      type: 'success',
    }
    fetchInvoices()
  } catch {
    snackbar.value = {
      show: true,
      message: 'Failed to update status',
      type: 'error',
    }
  }
}

const downloadPdf = async (id: number, invoiceNumber: string) => {
  try {
    const res = await downloadInvoicePdf(id)

    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice-${invoiceNumber}.pdf`
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    snackbar.value = {
      show: true,
      message: 'Failed to download PDF',
      type: 'error',
    }
  }
}



</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold">Invoices</h1>

      <button
        class="bg-[#0052CC] text-white px-4 py-2 rounded text-sm hover:bg-[#0041A8]"
        @click="router.push('/invoices/create')"
      >
        + Create Invoice
      </button>
    </div>


    <div class="bg-white border rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7] text-[#5E6C84]">
          <tr>
            <th class="px-4 py-3 text-left">Invoice #</th>
            <th class="px-4 py-3 text-left">Client</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="inv in invoices"
            :key="inv.id"
            class="border-t hover:bg-[#F9FAFB]"
          >
            <td
              class="px-4 py-3 font-medium cursor-pointer text-[#0052CC]"
              @click="openInvoice(inv.id)"
            >
              {{ inv.invoiceNumber }}
            </td>

            <!-- 🔥 FIXED: client snapshot -->
            <td class="px-4 py-3">
              {{ inv.clientName || '-' }}
            </td>

            <td class="px-4 py-3">
              <select
                class="border rounded px-2 py-1 text-xs"
                :value="inv.status"
                @change="changeStatus(inv.id, $event.target.value)"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PAID">PAID</option>
              </select>
            </td>

            <td class="px-4 py-3 text-right font-medium">
              ₹{{ inv.total }}
            </td>

            <!-- ACTIONS -->
            <td class="px-4 py-3 text-right">
              <button
                class="text-[#0052CC] text-xs hover:underline"
                @click="downloadPdf(inv.id, inv.invoiceNumber)"
              >
                Download PDF
              </button>
            </td>

          </tr>

          <tr v-if="!invoices.length && !loading">
            <td colspan="5" class="text-center py-6 text-[#5E6C84]">
              No invoices found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
