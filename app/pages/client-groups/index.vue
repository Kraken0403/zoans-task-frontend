<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getClientGroups,
  deleteClientGroup,
} from '@/services/clients-groups.service'
import AddEditClientGroupModal from '@/components/clients/AddEditClientGroupModal.vue'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const router = useRouter()

const groups = ref<any[]>([])
const selectedIds = ref<number[]>([])
const loading = ref(true)

const search = ref('')
const currentPage = ref(1)
const pageSize = 10

const showConfirm = ref(false)
const showModal = ref(false)
const showActionsMenu = ref(false)

const editGroup = ref<any | null>(null)
const singleDeleteId = ref<number | null>(null)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success',
})

/* ================= FETCH ================= */

const fetchGroups = async () => {
  try {
    loading.value = true
    const { data } = await getClientGroups()
    groups.value = data
  } catch (e: any) {
    snackbar.value = {
      show: true,
      message: 'Failed to fetch groups',
      type: 'error',
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchGroups)

/* ================= SEARCH + PAGINATION ================= */

const filteredGroups = computed(() => {
  if (!search.value) return groups.value
  const q = search.value.toLowerCase()
  return groups.value.filter(g =>
    [g.name, g.code]
      .filter(Boolean)
      .some(v => v.toLowerCase().includes(q))
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredGroups.value.length / pageSize))
)

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredGroups.value.slice(start, start + pageSize)
})

watch(search, () => (currentPage.value = 1))

/* ================= MODAL HELPERS ================= */

const openAddGroup = () => {
  editGroup.value = null
  showModal.value = true
}

const openEditGroup = (group: any) => {
  editGroup.value = { ...group }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editGroup.value = null
}

/* ================= DELETE ================= */

const openSingleDelete = (id: number) => {
  singleDeleteId.value = id
  showConfirm.value = true
}

const openBulkDelete = () => {
  singleDeleteId.value = null
  showConfirm.value = true
}

const confirmDelete = async () => {
  try {
    if (singleDeleteId.value) {
      await deleteClientGroup(singleDeleteId.value)
    } else {
      for (const id of selectedIds.value) {
        await deleteClientGroup(id)
      }
    }

    snackbar.value = {
      show: true,
      message: 'Groups deleted successfully',
      type: 'success',
    }

    singleDeleteId.value = null
    selectedIds.value = []
    showConfirm.value = false
    showActionsMenu.value = false

    fetchGroups()
  } catch (e: any) {
    snackbar.value = {
      show: true,
      message: 'Failed to delete groups',
      type: 'error',
    }
  }
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

/* ================= NAVIGATION ================= */

const goToGroup = (id: number) => {
  router.push(`/client-groups/${id}`)
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">

    <!-- Header -->
    <div class="flex justify-between items-center mb-5">
      <div class="flex items-center gap-2">
        <h1 class="text-[20px] font-semibold text-[#172B4D]">
          Client Groups
        </h1>

        <span
          class="text-xs px-2 py-[2px] rounded-full
                 bg-[#DFE1E6] text-[#172B4D]"
        >
          {{ groups.length }}
        </span>
      </div>

      <div class="flex items-center gap-2">

        <!-- Search -->
        <input
          v-model="search"
          placeholder="Search groups"
          class="pl-3 pr-3 py-2 w-64 text-sm
                 border border-[#DFE1E6] rounded-md
                 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]"
        />

        <!-- Actions Dropdown -->
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
              class="w-full px-3 py-2 text-left text-sm text-red-600
                     hover:bg-[#F4F5F7]"
              @click="openBulkDelete"
            >
              Delete selected
            </button>
          </div>
        </div>

        <!-- Add Button -->
        <button
          class="bg-[#0052CC] text-white px-4 py-2 rounded-md
                 hover:bg-[#0747A6] text-sm"
          @click="openAddGroup"
        >
          + Add Group
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
            <th class="px-4 py-3 text-left">Clients</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="group in paginatedGroups"
            :key="group.id"
            class="border-t hover:bg-[#F9FAFB] cursor-pointer"
            @click="goToGroup(group.id)"
          >
            <td class="px-4 py-3" @click.stop>
              <input
                type="checkbox"
                :value="group.id"
                v-model="selectedIds"
              />
            </td>

            <td class="px-4 py-3 font-mono text-xs">
              {{ group.code }}
            </td>

            <td class="px-4 py-3 font-medium text-[#0052CC]">
              {{ group.name }}
            </td>

            <td class="px-4 py-3 text-[#5E6C84]">
              {{ group.clients?.length || 0 }}
            </td>

            <td class="px-4 py-3 text-right" @click.stop>
              <div class="flex justify-end gap-3">
                <button
                  class="text-[#0052CC] hover:underline"
                  @click="openEditGroup(group)"
                >
                  Edit
                </button>

                <button
                  class="text-red-600 hover:underline"
                  @click="openSingleDelete(group.id)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!paginatedGroups.length && !loading">
            <td colspan="5" class="text-center py-6 text-[#5E6C84]">
              No groups found
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

    <!-- Modal -->
    <AddEditClientGroupModal
      v-if="showModal"
      :group="editGroup"
      @close="closeModal"
      @saved="fetchGroups"
    />

    <!-- Confirm -->
    <ConfirmDialog
      :show="showConfirm"
      title="Delete Groups"
      message="Are you sure you want to delete selected groups?"
      @confirm="confirmDelete"
      @cancel="showConfirm = false"
    />

    <!-- Snackbar -->
    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
