<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMyCompanyById,
  deleteMyCompany,
} from '@/services/my-companies.service'
import AddEditCompanyModal from '@/components/my-companies/AddEditCompanyModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()

const company = ref<any | null>(null)
const loading = ref(true)

const showEdit = ref(false)
const showConfirm = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

const showSnackbar = ({
  message,
  type,
}: {
  message: string
  type: 'success' | 'error' | 'info'
}) => {
  snackbar.value = {
    show: true,
    message,
    type,
  }
}


/* ================= FETCH ================= */

const fetchCompany = async () => {
  try {
    loading.value = true
    const { data } = await getMyCompanyById(Number(route.params.id))
    company.value = data
  } catch {
    router.push('/my-companies')
  } finally {
    loading.value = false
  }
}

onMounted(fetchCompany)

/* ================= ACTIONS ================= */

const remove = async () => {
  if (!company.value) return
  await deleteMyCompany(company.value.id)

  snackbar.value = {
    show: true,
    message: 'Company deleted successfully',
    type: 'success',
  }

  setTimeout(() => {
    router.push('/my-companies')
  }, 800)
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <!-- Loading -->
    <div v-if="loading" class="text-sm text-[#5E6C84]">
      Loading company…
    </div>

    <!-- Not found -->
    <div v-else-if="!company" class="text-sm text-red-600">
      Company not found
    </div>

    <!-- Company -->
    <div v-else>
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1 class="text-xl font-semibold text-[#172B4D]">
            {{ company.name }}
          </h1>

          <p class="text-sm text-[#5E6C84] mt-1">
            GSTIN: {{ company.gstin || '—' }}
          </p>
        </div>

        <div class="flex gap-2">
          <button
            class="border px-4 py-2 rounded-md text-sm
                   hover:bg-[#EBECF0]"
            @click="showEdit = true"
          >
            Edit
          </button>

          <button
            class="border border-red-600 text-red-600
                   px-4 py-2 rounded-md text-sm
                   hover:bg-red-50"
            @click="showConfirm = true"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Details Card -->
      <div class="bg-white border rounded-md p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-[#5E6C84]">Email</span>
          <div class="font-medium">{{ company.email || '—' }}</div>
        </div>

        <div>
          <span class="text-[#5E6C84]">Phone</span>
          <div class="font-medium">{{ company.phone || '—' }}</div>
        </div>

        <div>
          <span class="text-[#5E6C84]">PAN</span>
          <div class="font-medium">{{ company.pan || '—' }}</div>
        </div>

        <div>
          <span class="text-[#5E6C84]">City</span>
          <div class="font-medium">{{ company.city || '—' }}</div>
        </div>

        <div>
          <span class="text-[#5E6C84]">State</span>
          <div class="font-medium">{{ company.state || '—' }}</div>
        </div>

        <div>
          <span class="text-[#5E6C84]">Pincode</span>
          <div class="font-medium">{{ company.pincode || '—' }}</div>
        </div>

        <div class="col-span-2">
          <span class="text-[#5E6C84]">Address</span>
          <div class="font-medium">
            {{ company.addressLine1 || '' }}
            {{ company.addressLine2 || '' }}
          </div>
        </div>
      </div>

      <!-- Bank Details -->
      <div class="bg-white border rounded-md p-6 mt-6">
        <h3 class="font-medium mb-4">Bank Details</h3>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-[#5E6C84]">Bank Name</span>
            <div class="font-medium">{{ company.bankName || '—' }}</div>
          </div>

          <div>
            <span class="text-[#5E6C84]">Account Number</span>
            <div class="font-medium">{{ company.bankAccount || '—' }}</div>
          </div>

          <div>
            <span class="text-[#5E6C84]">IFSC</span>
            <div class="font-medium">{{ company.bankIfsc || '—' }}</div>
          </div>

          <div>
            <span class="text-[#5E6C84]">Branch</span>
            <div class="font-medium">{{ company.bankBranch || '—' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <AddEditCompanyModal
      v-if="showEdit && company"
      :company="company"
      @close="showEdit = false"
      @saved="fetchCompany"
      @notify="showSnackbar"
    />


    <!-- Delete Confirm -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Delete Company"
      message="This action cannot be undone. Are you sure?"
      confirmText="Delete"
      type="danger"
      @confirm="remove"
      @cancel="showConfirm = false"
    />

    <!-- Snackbar -->
    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
