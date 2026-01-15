<script setup lang="ts">
import { onMounted, ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getTasks, updateTask } from '@/services/task.service'
import * as XLSX from 'xlsx'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AddEditTaskModal from '@/components/tasks/AddEditTaskModal.vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()

/* ================= STATE ================= */

const tasks = ref<any[]>([])
const selectedIds = ref<number[]>([])
const loading = ref(true)

const search = ref('')
const currentPage = ref(1)
const pageSize = 8

const showConfirm = ref(false)
const showActions = ref(false)
const showModal = ref(false)
const editTask = ref<any | null>(null)

const actionsRef = ref<HTMLElement | null>(null)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success',
})

/* ================= FETCH ================= */

const fetchTasks = async () => {
  loading.value = true
  const { data } = await getTasks()
  tasks.value = data
  loading.value = false
}

onMounted(fetchTasks)

/* ================= CLICK OUTSIDE ================= */

const onClickOutside = (e: MouseEvent) => {
  if (actionsRef.value && !actionsRef.value.contains(e.target as Node)) {
    showActions.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() =>
  document.removeEventListener('click', onClickOutside),
)

/* ================= FILTERING ================= */

const visibleTasks = computed(() =>
  tasks.value.filter(t => !t.isRecurring || t.parentTaskId),
)

const filteredTasks = computed(() => {
  if (!search.value) return visibleTasks.value
  const q = search.value.toLowerCase()

  return visibleTasks.value.filter(t =>
    [
      t.title,
      t.client?.name,
      ...(t.assignments || []).map(a => a.user?.name),
    ]
      .filter(Boolean)
      .some(v => v.toLowerCase().includes(q)),
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredTasks.value.length / pageSize)),
)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTasks.value.slice(start, start + pageSize)
})

watch(search, () => (currentPage.value = 1))

/* ================= SELECTION ================= */

const toggleAll = (checked: boolean) => {
  selectedIds.value = checked ? paginatedTasks.value.map(t => t.id) : []
}

/* ================= ACTIONS ================= */

const markCompleted = async () => {
  for (const id of selectedIds.value) {
    await updateTask(id, { status: 'COMPLETED' })
  }

  snackbar.value = {
    show: true,
    message: 'Tasks marked as completed',
    type: 'success',
  }

  selectedIds.value = []
  showConfirm.value = false
  showActions.value = false
  fetchTasks()
}

/* ================= EXPORT ================= */

const exportSelected = () => {
  const rows = tasks.value
    .filter(t => selectedIds.value.includes(t.id))
    .map(t => ({
      Title: t.title,
      Client: t.client?.name || '',
      Status: t.status,
      DueDate: t.dueDate
        ? new Date(t.dueDate).toLocaleDateString()
        : '',
      AssignedTo: (t.assignments || [])
        .map((a: any) => a.user?.name)
        .join(', '),
    }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
  XLSX.writeFile(wb, 'tasks.xlsx')

  showActions.value = false
}

/* ================= HELPERS ================= */

const statusClass = (status: string) => {
  if (status === 'COMPLETED') return 'bg-[#006644] text-white'
  if (status === 'PENDING') return 'bg-[#DEEBFF] text-[#0747A6]'
  return 'bg-[#DFE1E6] text-[#172B4D]'
}

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString() : '—'
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-5">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-[20px] font-semibold text-[#172B4D]">Tasks</h1>
          <span class="text-xs px-2 py-[2px] rounded-full bg-[#DFE1E6]">
            {{ visibleTasks.length }}
          </span>
        </div>
        <p class="text-sm text-[#5E6C84]">Track and manage all tasks</p>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="search"
          placeholder="Search tasks"
          class="pl-3 pr-3 py-2 w-64 text-sm border border-[#DFE1E6] rounded-md"
        />

        <!-- Actions -->
        <div class="relative" ref="actionsRef">
          <button
            :disabled="!selectedIds.length"
            @click.stop="showActions = !showActions"
            class="flex items-center gap-2 px-3 py-2 text-sm bg-white
                   border border-[#DFE1E6] rounded-md
                   hover:bg-[#EBECF0] disabled:opacity-50"
          >
            Actions
          </button>

          <div
            v-if="showActions"
            class="absolute right-0 mt-1 w-44 bg-white
                   border border-[#DFE1E6] rounded-md shadow z-10"
          >
            <button
              class="w-full px-3 py-2 text-left text-sm hover:bg-[#F4F5F7]"
              @click="showConfirm = true"
            >
              Mark completed
            </button>
            <button
              class="w-full px-3 py-2 text-left text-sm hover:bg-[#F4F5F7]"
              @click="exportSelected"
            >
              Export to Excel
            </button>
          </div>
        </div>

        <button
          class="bg-[#0052CC] text-white px-4 py-2 rounded-md
                 hover:bg-[#0747A6] text-sm"
          @click="editTask = null; showModal = true"
        >
          + Add Task
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7] text-[#5E6C84]">
          <tr>
            <th class="px-4 py-3 w-10">
              <input
                type="checkbox"
                :checked="selectedIds.length === paginatedTasks.length && paginatedTasks.length"
                @change="toggleAll(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th class="px-4 py-3 text-left">Title</th>
            <th class="px-4 py-3 text-left">Client</th>
            <th class="px-4 py-3 text-left">Assigned to</th>
            <th class="px-4 py-3 text-left">Due date</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-right">Edit</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="task in paginatedTasks"
            :key="task.id"
            class="border-t hover:bg-[#F9FAFB] cursor-pointer"
            @click="router.push(`/tasks/${task.id}`)"
          >
            <td class="px-4 py-3" @click.stop>
              <input type="checkbox" :value="task.id" v-model="selectedIds" />
            </td>

            <td class="px-4 py-3 font-medium text-[#172B4D]">
              {{ task.title }}
              <span
                v-if="task.parentTaskId"
                class="ml-2 px-2 py-[2px] text-xs rounded-full
                       bg-[#DEEBFF] text-[#0747A6]"
              >
                Recurring
              </span>
            </td>

            <td class="px-4 py-3 text-[#5E6C84]">
              {{ task.client?.name || '-' }}
            </td>

            <td class="px-4 py-3">
              <span
                v-for="a in task.assignments"
                :key="a.user.id"
                class="inline-block bg-[#DEEBFF] text-[#0747A6]
                       text-xs px-2 py-[2px] rounded-full mr-1"
              >
                {{ a.user.name }}
              </span>
              <span v-if="!task.assignments?.length">—</span>
            </td>

            <td class="px-4 py-3 text-[#5E6C84]">
              {{ formatDate(task.dueDate) }}
            </td>

            <td class="px-4 py-3">
              <span
                class="px-2 py-[2px] rounded-full text-xs font-medium"
                :class="statusClass(task.status)"
              >
                {{ task.status }}
              </span>
            </td>

            <td class="px-4 py-3 text-right" @click.stop>
              <button
                class="text-[#0052CC] hover:text-[#0747A6]"
                @click="editTask = task; showModal = true"
              >
                Edit
              </button>
            </td>
          </tr>

          <tr v-if="!paginatedTasks.length && !loading">
            <td colspan="7" class="text-center py-6 text-[#5E6C84]">
              No tasks found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <AddEditTaskModal
      v-if="showModal"
      :task="editTask"
      @close="showModal = false"
      @saved="fetchTasks"
    />

    <ConfirmDialog
      v-if="showConfirm"
      title="Complete Tasks"
      message="Mark selected tasks as completed?"
      confirmText="Complete"
      @confirm="markCompleted"
      @cancel="showConfirm = false"
    />

    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
