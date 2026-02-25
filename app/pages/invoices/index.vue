<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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

const activeInvoices = computed(() =>
  invoices.value.filter(inv => !inv.deletedAt)
)

const deletedInvoices = computed(() =>
  invoices.value.filter(inv => !!inv.deletedAt)
)

const deletedPage = ref(1)
const deletedPageSize = 10

const deletedInvoicesSorted = computed(() =>
  [...deletedInvoices.value].sort((a, b) => {
    const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
    const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0
    if (bTime !== aTime) return bTime - aTime
    return b.id - a.id
  })
)

const deletedTotalPages = computed(() =>
  Math.max(1, Math.ceil(deletedInvoicesSorted.value.length / deletedPageSize))
)

const paginatedDeletedInvoices = computed(() => {
  const start = (deletedPage.value - 1) * deletedPageSize
  return deletedInvoicesSorted.value.slice(start, start + deletedPageSize)
})

watch(deletedInvoicesSorted, () => {
  deletedPage.value = 1
})

watch(deletedTotalPages, (pages) => {
  if (deletedPage.value > pages) deletedPage.value = pages
})

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



const changeStatus = async (id: number, newStatus: string) => {
  const invoice = invoices.value.find(i => i.id === id)

  if (!invoice) return

  if (invoice.deletedAt) {
    snackbar.value = {
      show: true,
      message: 'Deleted invoice cannot be modified',
      type: 'error',
    }
    return
  }

  // 🔒 Hard lock
  if (invoice.status === 'CANCELLED') {
    snackbar.value = {
      show: true,
      message: 'Cancelled invoice cannot be modified',
      type: 'error',
    }
    return
  }

  // Optional confirm before cancelling
  if (newStatus === 'CANCELLED') {
    const confirmCancel = confirm(
      'Are you sure you want to cancel this invoice? This cannot be undone.'
    )

    if (!confirmCancel) return
  }

  await updateInvoiceStatus(id, newStatus)

  invoice.status = newStatus
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

      <button class="bg-[#0052CC] text-white px-4 py-2 rounded text-sm hover:bg-[#0041A8]"
        @click="router.push('/invoices/create')">
        + Create Invoice
      </button>
    </div>


    <div class="bg-white border rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7] text-[#5E6C84]">
          <tr>
            <th class="px-4 py-3 text-left">
              <div>Invoice #</div>
              <div class="text-xs text-gray-500">
                Company Name
              </div>
            </th>
            <th class="px-4 py-3 text-left">Client</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="inv in activeInvoices" :key="inv.id" class="border-t hover:bg-[#F9FAFB]" :class="inv.status === 'CANCELLED'
              ? 'bg-red-50 opacity-60 cursor-not-allowed'
              : ''">
            <td class="px-4 py-3 font-medium cursor-pointer text-[#0052CC]"
              :class="inv.status !== 'CANCELLED' ? 'cursor-pointer' : 'cursor-not-allowed'"
              @click="inv.status !== 'CANCELLED' && openInvoice(inv.id)">
              <div>{{ inv.invoiceNumber }}</div>
              <div class="text-xs text-gray-500">
                {{ inv.fromCompanyName }}
              </div>
            </td>
            <!-- 🔥 FIXED: client snapshot -->
            <td class="px-4 py-3">
              {{ inv.clientName || '-' }}
            </td>

            <td class="px-4 py-3">
              <select class="border rounded px-2 py-1 text-xs" :value="inv.status"
                :disabled="inv.status === 'CANCELLED'" :class="inv.status === 'CANCELLED'
                    ? 'opacity-50 cursor-not-allowed bg-red-50'
                    : ''" @change="changeStatus(inv.id, ($event.target as HTMLSelectElement).value)">
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </td>

            <td class="px-4 py-3 text-right font-medium" :class="inv.status === 'CANCELLED'
              ? 'line-through text-red-600'
              : ''">
              ₹{{ inv.total }}
            </td>

            <!-- ACTIONS -->
            <td class="px-4 py-3 text-right">
              <button :disabled="inv.status === 'CANCELLED'" :class="[
                'text-xs',
                inv.status === 'CANCELLED'
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[#0052CC] hover:underline'
              ]" @click="inv.status !== 'CANCELLED' && downloadPdf(inv.id, inv.invoiceNumber)">
                Download PDF
              </button>
            </td>

          </tr>

          <tr v-if="!activeInvoices.length && !loading">
            <td colspan="5" class="text-center py-6 text-[#5E6C84]">
              No invoices found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 bg-white border rounded-md p-4" v-if="deletedInvoices.length">
      <h2 class="text-sm font-semibold text-[#172B4D] mb-3">Deleted Invoices</h2>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="inv in paginatedDeletedInvoices"
          :key="inv.id"
          class="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700"
        >
          {{ inv.invoiceNumber }}
        </div>
      </div>

      <div class="flex justify-between items-center mt-4 text-xs text-[#5E6C84]" v-if="deletedInvoices.length > deletedPageSize">
        <span>Page {{ deletedPage }} of {{ deletedTotalPages }}</span>
        <div class="flex gap-2">
          <button
            @click="deletedPage = deletedPage - 1"
            :disabled="deletedPage === 1"
            class="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            @click="deletedPage = deletedPage + 1"
            :disabled="deletedPage === deletedTotalPages"
            class="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <NotificationSnackbar v-bind="snackbar" @close="snackbar.show = false" />
  </div>
</template>
