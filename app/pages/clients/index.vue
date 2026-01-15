<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getClients, deleteClient } from '@/services/clients.service'
import AddEditClientModal from '@/components/clients/AddEditClientModal.vue'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import * as XLSX from 'xlsx'

const router = useRouter()

const clients = ref<any[]>([])
const selectedIds = ref<number[]>([])
const loading = ref(true)

const search = ref('')
const currentPage = ref(1)
const pageSize = 8

const showModal = ref(false)
const editClient = ref<any | null>(null)

const showConfirm = ref(false)
const showActionsMenu = ref(false)

const clientCount = computed(() => clients.value.length)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success',
})

/* ================= FETCH ================= */

const fetchClients = async () => {
  loading.value = true
  const { data } = await getClients()
  clients.value = data
  loading.value = false
}

onMounted(fetchClients)

/* ================= SEARCH + PAGINATION ================= */

const filteredClients = computed(() => {
  if (!search.value) return clients.value
  const q = search.value.toLowerCase()
  return clients.value.filter(c =>
    [c.code, c.name, c.email, c.phone]
      .filter(Boolean)
      .some(v => v.toLowerCase().includes(q))
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredClients.value.length / pageSize))
)

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredClients.value.slice(start, start + pageSize)
})

watch(search, () => (currentPage.value = 1))

/* ================= SELECTION ================= */

const toggleAll = (checked: boolean) => {
  selectedIds.value = checked
    ? paginatedClients.value.map(c => c.id)
    : []
}

/* ================= ACTIONS ================= */

const exportSelected = () => {
  const rows = clients.value.filter(c => selectedIds.value.includes(c.id))
  if (!rows.length) return

  const sheet = XLSX.utils.json_to_sheet(
    rows.map(c => ({
      Code: c.code,
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
    }))
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Clients')
  XLSX.writeFile(wb, 'clients.xlsx')

  showActionsMenu.value = false
}

const confirmDelete = async () => {
  for (const id of selectedIds.value) {
    await deleteClient(id)
  }

  snackbar.value = {
    show: true,
    message: 'Clients deleted successfully',
    type: 'success',
  }

  selectedIds.value = []
  showConfirm.value = false
  showActionsMenu.value = false
  fetchClients()
}

/* ================= CLICK OUTSIDE ================= */

const closeActions = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.actions-menu')) {
    showActionsMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeActions)
})

/* ================= ROW NAVIGATION ================= */

const goToClient = (id: number) => {
  router.push(`/clients/${id}`)
}

/* ================= MODAL HELPERS (FIX PARSER + PREFILL) ================= */

const openAddClient = () => {
  editClient.value = null
  showModal.value = true
}

const openEditClient = (client: any) => {
  // clone so modal edits don't instantly mutate table row
  editClient.value = { ...client }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editClient.value = null
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-5">
      <div class="flex items-center gap-2">
        <h1 class="text-[20px] font-semibold text-[#172B4D]">
          Clients
        </h1>

        <span
          class="text-xs px-2 py-[2px] rounded-full
                 bg-[#DFE1E6] text-[#172B4D]"
        >
          {{ clientCount }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative">
          <Icon
            name="mdi:magnify"
            size="18"
            class="absolute left-2 top-1/2 -translate-y-1/2 text-[#6B778C]"
          />
          <input
            v-model="search"
            placeholder="Search clients"
            class="pl-8 pr-3 py-2 w-64 text-sm
                   border border-[#DFE1E6] rounded-md
                   focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]"
          />
        </div>

        <!-- Actions -->
        <div class="relative actions-menu">
          <button
            :disabled="!selectedIds.length"
            @click.stop="showActionsMenu = !showActionsMenu"
            class="flex items-center gap-2 px-3 py-2 text-sm
                   bg-white border border-[#DFE1E6] rounded-md
                   hover:bg-[#EBECF0] disabled:opacity-50"
          >
            Actions
            <Icon name="mdi:chevron-down" size="18" />
          </button>

          <div
            v-if="showActionsMenu"
            class="absolute right-0 mt-1 w-44 bg-white
                   border border-[#DFE1E6] rounded-md shadow z-10"
          >
            <button
              class="w-full px-3 py-2 text-left text-sm hover:bg-[#F4F5F7]"
              @click="exportSelected"
            >
              Export selected
            </button>

            <button
              class="w-full px-3 py-2 text-left text-sm text-red-600
                     hover:bg-[#F4F5F7]"
              @click="showConfirm = true"
            >
              Delete selected
            </button>
          </div>
        </div>

        <!-- Add -->
        <button
          class="bg-[#0052CC] text-white px-4 py-2 rounded-md
                 hover:bg-[#0747A6] text-sm"
          @click="openAddClient"
        >
          + Add Client
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7] text-[#5E6C84]">
          <tr>
            <th class="px-4 py-3 w-10"></th>
            <th class="px-4 py-3 text-left">Code</th>
            <th class="px-4 py-3 text-left">Name</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-left">Phone</th>
            <th class="px-4 py-3 text-right">Edit</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="client in paginatedClients"
            :key="client.id"
            class="border-t hover:bg-[#F9FAFB] cursor-pointer"
            @click="goToClient(client.id)"
          >
            <!-- Checkbox -->
            <td class="px-4 py-3" @click.stop>
              <input
                type="checkbox"
                :value="client.id"
                v-model="selectedIds"
              />
            </td>

            <td class="px-4 py-3 font-mono text-xs">
              {{ client.code }}
            </td>

            <td class="px-4 py-3 font-medium text-[#0052CC]">
              {{ client.name }}
            </td>

            <td class="px-4 py-3 text-[#5E6C84]">
              {{ client.email || '-' }}
            </td>

            <td class="px-4 py-3 text-[#5E6C84]">
              {{ client.phone || '-' }}
            </td>

            <!-- Edit -->
            <td class="px-4 py-3 text-right" @click.stop>
              <button
                class="inline-flex items-center gap-1 text-[#0052CC] hover:underline"
                @click="openEditClient(client)"
              >
                <Icon name="mdi:pencil-outline" size="16" />
                Edit
              </button>
            </td>
          </tr>

          <tr v-if="!paginatedClients.length && !loading">
            <td colspan="6" class="text-center py-6 text-[#5E6C84]">
              No clients found
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex justify-between px-4 py-3 border-t text-sm">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <div class="flex gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded-md
                   hover:bg-[#EBECF0] disabled:opacity-50"
          >
            Prev
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 border rounded-md
                   hover:bg-[#EBECF0] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddEditClientModal
      v-if="showModal"
      :client="editClient"
      @close="closeModal"
      @saved="fetchClients"
      @notify="(payload) => {
        snackbar.show = true
        snackbar.message = payload.message
        snackbar.type = payload.type
      }"
    />



    <ConfirmDialog
      v-if="showConfirm"
      title="Delete Clients"
      message="Are you sure you want to delete selected clients?"
      confirmText="Delete"
      type="danger"
      @confirm="confirmDelete"
      @cancel="showConfirm = false"
    />

    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
