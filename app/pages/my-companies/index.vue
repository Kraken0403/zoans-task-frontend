<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getMyCompanies,
  deleteMyCompany,
} from '@/services/my-companies.service'
import AddEditCompanyModal from '@/components/my-companies/AddEditCompanyModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()

const companies = ref<any[]>([])
const loading = ref(true)

const showModal = ref(false)
const editCompany = ref<any | null>(null)

const showConfirm = ref(false)
const deleteId = ref<number | null>(null)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

/* ================= FETCH ================= */

const fetchCompanies = async () => {
  loading.value = true
  const { data } = await getMyCompanies()
  companies.value = data
  loading.value = false
}

onMounted(fetchCompanies)

/* ================= ACTIONS ================= */

const openAdd = () => {
  editCompany.value = null
  showModal.value = true
}

const openEdit = (company: any) => {
  editCompany.value = { ...company }
  showModal.value = true
}

const confirmDelete = (id: number) => {
  deleteId.value = id
  showConfirm.value = true
}

const remove = async () => {
  if (!deleteId.value) return
  await deleteMyCompany(deleteId.value)

  snackbar.value = {
    show: true,
    message: 'Company deleted successfully',
    type: 'success',
  }

  showConfirm.value = false
  deleteId.value = null
  fetchCompanies()
}

/* ================= ROW NAVIGATION ================= */

const goToCompany = (id: number) => {
  router.push(`/my-companies/${id}`)
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-semibold text-[#172B4D]">
        My Companies
      </h1>

      <button
        class="bg-[#0052CC] text-white px-4 py-2 rounded-md
               hover:bg-[#0747A6] text-sm"
        @click="openAdd"
      >
        + Add Company
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7] text-[#5E6C84]">
          <tr>
            <th class="px-4 py-3 text-left">Company Name</th>
            <th class="px-4 py-3 text-left">GSTIN</th>
            <th class="px-4 py-3 text-left">City</th>
            <th class="px-4 py-3 text-left">State</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="c in companies"
            :key="c.id"
            class="border-t hover:bg-[#F9FAFB] cursor-pointer"
            @click="goToCompany(c.id)"
          >
            <td class="px-4 py-3 font-medium">
              {{ c.name }}
            </td>

            <td class="px-4 py-3">
              {{ c.gstin || '-' }}
            </td>

            <td class="px-4 py-3">
              {{ c.city || '-' }}
            </td>

            <td class="px-4 py-3">
              {{ c.state || '-' }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right" @click.stop>
              <button
                class="text-[#0052CC] hover:underline"
                @click="openEdit(c)"
              >
                Edit
              </button>

              <button
                class="ml-4 text-red-600 hover:underline"
                @click="confirmDelete(c.id)"
              >
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="!companies.length && !loading">
            <td
              colspan="5"
              class="text-center py-6 text-[#5E6C84]"
            >
              No companies added yet
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit Modal -->
    <AddEditCompanyModal
      v-if="showModal"
      :company="editCompany"
      @close="showModal = false"
      @saved="fetchCompanies"
    />

    <!-- Confirm Delete -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Delete Company"
      message="Are you sure you want to delete this company?"
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
