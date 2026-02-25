<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getInvoiceById,
  downloadInvoicePdf,
  updateInvoiceStatus,
  deleteInvoice,
} from '@/services/invoices.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()

const invoice = ref<any | null>(null)
const loading = ref(true)
const showDeleteConfirm = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

const fetchInvoice = async () => {
  try {
    loading.value = true
    const { data } = await getInvoiceById(Number(route.params.id))
    invoice.value = data
  } catch {
    router.push('/invoices')
  } finally {
    loading.value = false
  }
}

onMounted(fetchInvoice)

/* ======================
   ACTIONS
====================== */
const downloadPdf = async () => {
  try {
    const res = await downloadInvoicePdf(invoice.value.id)

    const blob = new Blob([res.data], {
      type: 'application/pdf',
    })

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.value.invoiceNumber}.pdf`
    document.body.appendChild(a)
    a.click()

    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error('PDF download failed', err)
  }
}


const changeStatus = async (status: string) => {
  if (!invoice.value) return

  if (invoice.value.deletedAt) {
    snackbar.value = {
      show: true,
      message: 'Deleted invoice cannot be modified',
      type: 'error',
    }
    return
  }

  try {
    await updateInvoiceStatus(invoice.value.id, status)
    invoice.value.status = status

    snackbar.value = {
      show: true,
      message: 'Invoice status updated',
      type: 'success',
    }
  } catch {
    snackbar.value = {
      show: true,
      message: 'Failed to update status',
      type: 'error',
    }
  }
}

const removeInvoice = async () => {
  if (!invoice.value) return

  try {
    await deleteInvoice(invoice.value.id)
    showDeleteConfirm.value = false
    snackbar.value = {
      show: true,
      message: 'Invoice deleted successfully',
      type: 'success',
    }

    setTimeout(() => {
      router.push('/invoices')
    }, 600)
  } catch {
    snackbar.value = {
      show: true,
      message: 'Failed to delete invoice',
      type: 'error',
    }
  }
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <div v-if="loading" class="text-sm text-gray-500">
      Loading invoice…
    </div>

    <div v-else-if="!invoice" class="text-sm text-red-600">
      Invoice not found
    </div>

    <div v-else class="bg-white border rounded-md p-6 space-y-4">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-xl font-semibold">
            Invoice {{ invoice.invoiceNumber }}
          </h1>
          <p class="text-sm text-gray-500">
            Company: {{ invoice.fromCompanyName || '—' }}
          </p>
          <p class="text-sm text-gray-500">
            Client: {{ invoice.clientName || '—' }}
          </p>
        </div>

        <div class="flex gap-2">
          <select
            class="border rounded px-2 py-1 text-sm"
            :value="invoice.status"
            :disabled="!!invoice.deletedAt"
            @change="changeStatus(($event.target as HTMLSelectElement).value)"
          >
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
          </select>

          <button
            class="px-3 py-2 bg-[#0052CC] text-white rounded text-sm"
            :disabled="!!invoice.deletedAt"
            @click="downloadPdf"
          >
            Download PDF
          </button>

          <button
            class="px-3 py-2 border border-red-600 text-red-600 rounded text-sm"
            :disabled="!!invoice.deletedAt"
            @click="showDeleteConfirm = true"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Amounts -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p><b>Subtotal:</b> ₹{{ invoice.subtotal }}</p>
          <p><b>Total Tax:</b> ₹{{ invoice.total - invoice.subtotal }}</p>
        </div>
        <div>
          <p><b>Total:</b> ₹{{ invoice.total }}</p>
          <p><b>Status:</b> {{ invoice.status }}</p>
          <p v-if="invoice.deletedAt"><b>Deleted:</b> Yes</p>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Invoice"
      message="Are you sure you want to delete this invoice?"
      confirmText="Delete"
      type="danger"
      @confirm="removeInvoice"
      @cancel="showDeleteConfirm = false"
    />

    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
