<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTask, updateTask } from '@/services/task.service'
import { getUsers } from '@/services/users.service'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()

/* ================= STATE ================= */

const task = ref<any>(null)
const users = ref<any[]>([])
const loading = ref(true)

const showEditModal = ref(false)
const saving = ref(false)

/* ================= EDIT FORM ================= */

const editForm = ref({
  status: 'PENDING',
  dueDate: '',
  description: '',
  userIds: [] as number[],
})

/* ================= FETCH ================= */

const fetchTask = async () => {
  const { data } = await getTask(Number(route.params.id))
  task.value = data
}

const fetchUsers = async () => {
  const { data } = await getUsers()
  users.value = data
}

onMounted(async () => {
  try {
    await Promise.all([fetchTask(), fetchUsers()])
  } catch {
    router.push('/tasks')
  } finally {
    loading.value = false
  }
})

/* ================= HELPERS ================= */

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString() : '—'

/* ================= EDIT ================= */

const openEditModal = () => {
  editForm.value = {
    status: task.value.status,
    dueDate: task.value.dueDate
      ? task.value.dueDate.slice(0, 10)
      : '',
    description: task.value.description || '',
    userIds: (task.value.assignments || []).map(
      (a: any) => a.userId,
    ),
  }

  showEditModal.value = true
}

const saveTask = async () => {
  try {
    saving.value = true

    await updateTask(task.value.id, {
      status: editForm.value.status,
      description: editForm.value.description,
      dueDate: editForm.value.dueDate
        ? new Date(editForm.value.dueDate)
        : null,

      // 🔥 THIS REPLACES ASSIGNMENTS
      userIds: editForm.value.userIds,
    })

    await fetchTask()
    showEditModal.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <div v-if="loading" class="text-sm text-[#5E6C84]">
      Loading…
    </div>

    <div v-else-if="task" class="space-y-6">
      <!-- ================= TASK CARD ================= -->
      <div class="bg-white border border-[#DFE1E6] rounded-md p-6">
        <div class="flex justify-between mb-4">
          <div>
            <h1 class="text-[20px] font-semibold text-[#172B4D]">
              {{ task.title }}
            </h1>
            <p class="text-sm text-[#5E6C84]">
              Task ID: {{ task.id }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="px-2 py-[2px] text-xs font-medium rounded-full"
              :class="
                task.status === 'COMPLETED'
                  ? 'bg-[#006644] text-white'
                  : task.status === 'PENDING'
                  ? 'bg-[#DEEBFF] text-[#0747A6]'
                  : 'bg-[#DFE1E6] text-[#172B4D]'
              "
            >
              {{ task.status }}
            </span>

            <button
              @click="openEditModal"
              class="px-3 py-1.5 text-sm border rounded-md
                     hover:bg-[#EBECF0]"
            >
              Edit
            </button>
          </div>
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div class="text-[#5E6C84]">Due Date</div>
            <div class="font-medium">
              {{ formatDate(task.dueDate) }}
            </div>
          </div>

          <div>
            <div class="text-[#5E6C84]">Created</div>
            <div class="font-medium">
              {{ formatDate(task.createdAt) }}
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm">
          {{ task.description || 'No description provided.' }}
        </p>

        <!-- Assignments -->
        <div class="mt-4">
          <div class="text-[#5E6C84] text-sm mb-2">
            Assigned To
          </div>

          <span
            v-for="a in task.assignments"
            :key="a.user.id"
            class="inline-block bg-[#DEEBFF] text-[#0747A6]
                   text-xs px-2 py-[2px] rounded-full mr-2"
          >
            {{ a.user.name }}
          </span>

          <span v-if="!task.assignments?.length">—</span>
        </div>
      </div>

      <!-- ================= CLIENT ================= -->
      <div class="bg-white border rounded-md">
        <div class="px-6 py-4 border-b bg-[#F4F5F7]">
          <h2 class="text-sm font-semibold">Client</h2>
        </div>

        <table class="w-full text-sm">
          <tr class="border-t">
            <td class="px-4 py-3 font-medium">
              {{ task.client?.name || '—' }}
            </td>
            <td class="px-4 py-3">
              {{ task.client?.email || '—' }}
            </td>
            <td class="px-4 py-3">
              {{ task.client?.phone || '—' }}
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- ================= EDIT MODAL ================= -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white w-full max-w-md rounded-md shadow-lg">
        <div class="px-5 py-4 border-b font-semibold">
          Edit Task
        </div>

        <div class="p-5 space-y-4 text-sm">
          <!-- Status -->
          <div>
            <label>Status</label>
            <select v-model="editForm.status" class="input">
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <!-- Due Date -->
          <div>
            <label>Due Date</label>
            <input type="date" v-model="editForm.dueDate" class="input" />
          </div>

          <!-- Description -->
          <div>
            <label>Description</label>
            <textarea v-model="editForm.description" class="input" rows="3" />
          </div>

          <!-- Assign Users -->
          <div>
            <label>Assign Users</label>
            <select
              v-model="editForm.userIds"
              multiple
              class="input h-32"
            >
              <option
                v-for="u in users"
                :key="u.id"
                :value="u.id"
              >
                {{ u.name }}
              </option>
            </select>
            <p class="text-xs text-[#5E6C84] mt-1">
              Selecting users replaces old assignments
            </p>
          </div>
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button
            @click="showEditModal = false"
            class="px-3 py-1.5 border rounded-md"
          >
            Cancel
          </button>

          <button
            @click="saveTask"
            :disabled="saving"
            class="px-3 py-1.5 bg-[#0052CC] text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #dfe1e6;
  border-radius: 6px;
  padding: 8px 10px;
}
</style>
