<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import {
  getClientGroups,
  deleteClientGroup,
} from '@/services/clients-groups.service'
import AddEditClientGroupModal from '@/components/clients/AddEditClientGroupModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({ middleware: 'auth' })

const groups = ref<any[]>([])
const loading = ref(true)

const showModal = ref(false)
const editGroup = ref<any | null>(null)

const showConfirm = ref(false)
const deleteTarget = ref<any | null>(null)

const snackbar = ref({ show: false, message: '', type: 'success' })

const fetchGroups = async () => {
  loading.value = true
  const { data } = await getClientGroups()
  groups.value = data
  loading.value = false
}

onMounted(fetchGroups)

const count = computed(() => groups.value.length)

const openAdd = () => {
  editGroup.value = null
  showModal.value = true
}

const openEdit = (g: any) => {
  editGroup.value = { ...g }
  showModal.value = true
}

const askDelete = (g: any) => {
  deleteTarget.value = g
  showConfirm.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  await deleteClientGroup(deleteTarget.value.id)
  snackbar.value = { show: true, message: 'Group deleted', type: 'success' }
  showConfirm.value = false
  deleteTarget.value = null
  fetchGroups()
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <div class="flex justify-between items-center mb-5">
      <div class="flex items-center gap-2">
        <h1 class="text-[20px] font-semibold text-[#172B4D]">
          Client Groups
        </h1>
        <span class="text-xs px-2 py-[2px] rounded-full bg-[#DFE1E6] text-[#172B4D]">
          {{ count }}
        </span>
      </div>

      <button
        class="bg-[#0052CC] text-white px-4 py-2 rounded-md hover:bg-[#0747A6] text-sm"
        @click="openAdd"
      >
        + Add Group
      </button>
    </div>

    <div class="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7] text-[#5E6C84]">
          <tr>
            <th class="px-4 py-3 text-left">Code</th>
            <th class="px-4 py-3 text-left">Name</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="g in groups"
            :key="g.id"
            class="border-t hover:bg-[#F9FAFB]"
          >
            <td class="px-4 py-3 font-mono text-xs">{{ g.code }}</td>
            <td class="px-4 py-3 font-medium text-[#172B4D]">{{ g.name }}</td>

            <td class="px-4 py-3 text-right space-x-3">
              <button class="text-[#0052CC] hover:underline" @click="openEdit(g)">
                Edit
              </button>
              <button class="text-red-600 hover:underline" @click="askDelete(g)">
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="!groups.length && !loading">
            <td colspan="3" class="text-center py-6 text-[#5E6C84]">
              No client groups found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddEditClientGroupModal
      v-if="showModal"
      :group="editGroup"
      @close="showModal = false"
      @saved="fetchGroups"
    />

    <ConfirmDialog
      v-if="showConfirm"
      title="Delete Group"
      message="Are you sure you want to delete this group?"
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
