<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTasks, updateTask } from '@/services/task.service'
import * as XLSX from 'xlsx'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()

/* ================= STATE ================= */

const tasks = ref<any[]>([])
const selectedIds = ref<number[]>([])
const loading = ref(true)

const search = ref('')
const statusFilter = ref<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
const dueFilter = ref<'ALL' | 'OVERDUE' | 'UPCOMING'>('ALL')

const currentPage = ref(1)
const pageSize = 10

const showConfirm = ref(false)
const showActions = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success',
})

/* ================= FETCH ================= */

const fetchTasks = async () => {
  loading.value = true
  const { data } = await getTasks({})
  tasks.value = data
  loading.value = false
}

onMounted(fetchTasks)

/* ================= SORT BY DUE DATE ================= */

const sortedTasks = computed(() => {
  return [...tasks.value].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
})

/* ================= FILTERING ================= */

const filteredTasks = computed(() => {
  const now = new Date()

  return sortedTasks.value.filter(t => {
    const matchSearch =
      !search.value ||
      [
        t.title,
        t.client?.name,
        ...(t.assignments || []).map((a: any) => a.user?.name),
      ]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(search.value.toLowerCase()))

    const matchStatus =
      statusFilter.value === 'ALL' ||
      t.status === statusFilter.value

    const dueDate = t.dueDate ? new Date(t.dueDate) : null

    const matchDue =
      dueFilter.value === 'ALL' ||
      (dueFilter.value === 'OVERDUE' && dueDate && dueDate < now) ||
      (dueFilter.value === 'UPCOMING' && dueDate && dueDate >= now)

    return matchSearch && matchStatus && matchDue
  })
})

/* ================= PAGINATION ================= */

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredTasks.value.length / pageSize)),
)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTasks.value.slice(start, start + pageSize)
})

watch([search, statusFilter, dueFilter], () => {
  currentPage.value = 1
})

/* ================= SELECTION ================= */

const toggleAll = (checked: boolean) => {
  selectedIds.value = checked ? paginatedTasks.value.map(t => t.id) : []
}

const selectedTasks = computed(() =>
  tasks.value.filter(t => selectedIds.value.includes(t.id)),
)

/* ================= VALIDATION ================= */

const invoiceValidation = computed(() => {
  if (!selectedTasks.value.length) return { valid: false, reason: '' }

  // 1️⃣ All completed
  if (selectedTasks.value.some(t => t.status !== 'COMPLETED')) {
    return { valid: false, reason: 'Only completed tasks can be invoiced' }
  }

  // 2️⃣ All billable
  if (selectedTasks.value.some(t => !t.isBillable)) {
    return { valid: false, reason: 'Some selected tasks are not billable' }
  }

  // 3️⃣ Not already invoiced
  if (selectedTasks.value.some(t => t.status === 'INVOICED')) {
    return { valid: false, reason: 'Some selected tasks already invoiced' }
  }

  // 4️⃣ Same client
  const clientIds = [
    ...new Set(selectedTasks.value.map(t => t.client?.id)),
  ]
  if (clientIds.length !== 1) {
    return { valid: false, reason: 'Tasks must belong to same client' }
  }

  return { valid: true, reason: '' }
})

/* ================= MARK COMPLETE ================= */

const markCompleted = async () => {
  try {
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
    fetchTasks()
  } catch {
    snackbar.value = {
      show: true,
      message: 'Failed to update tasks',
      type: 'error',
    }
  }
}

/* ================= EXPORT ================= */

const exportSelected = () => {
  const rows = selectedTasks.value.map(t => ({
    Title: t.title,
    Client: t.client?.name,
    Status: t.status,
    DueDate: t.dueDate
      ? new Date(t.dueDate).toLocaleDateString()
      : '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
  XLSX.writeFile(wb, 'tasks.xlsx')

  showActions.value = false
}

/* ================= SEND TO INVOICE ================= */

const sendToInvoice = () => {
  if (!invoiceValidation.value.valid) {
    snackbar.value = {
      show: true,
      message: invoiceValidation.value.reason,
      type: 'error',
    }
    return
  }

  const clientId = selectedTasks.value[0].client.id

  router.push({
    path: '/invoices/create',
    query: {
      sourceType: 'TASKS',
      clientId,
      taskIds: JSON.stringify(selectedIds.value),
    },
  })
}

/* ================= HELPERS ================= */

const statusClass = (status: string) => {
  if (status === 'COMPLETED') return 'bg-[#006644] text-white'
  if (status === 'INVOICED') return 'bg-[#0052CC] text-white'
  if (status === 'PENDING') return 'bg-[#DEEBFF] text-[#0747A6]'
  return 'bg-[#DFE1E6] text-[#172B4D]'
}

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString() : '—'
</script>


<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">

    <!-- ================= HEADER ================= -->
    <div class="flex justify-between items-center mb-5">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-[20px] font-semibold text-[#172B4D]">
            Tasks
          </h1>
          <span class="text-xs px-2 py-[2px] rounded-full bg-[#DFE1E6]">
            {{ filteredTasks.length }}
          </span>
        </div>
        <p class="text-sm text-[#5E6C84]">
          Generated task instances (sorted by earliest due date)
        </p>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="search"
          placeholder="Search tasks"
          class="pl-3 pr-3 py-2 w-64 text-sm
                 border border-[#DFE1E6] rounded-md"
        />

        <!-- Actions Dropdown -->
        <div class="relative">
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
              class="absolute right-0 mt-1 w-56 bg-white
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

              <button
                class="w-full px-3 py-2 text-left text-sm
                      hover:bg-[#F4F5F7]"
                :class="invoiceValidation.valid
                  ? 'text-[#0052CC]'
                  : 'text-gray-400 cursor-not-allowed'"
                :disabled="!invoiceValidation.valid"
                @click="sendToInvoice"
              >
                Send to Invoice
              </button>
            </div>
          </div>

      </div>
    </div>

    <!-- ================= FILTERS ================= -->
    <div class="flex gap-3 mb-4">
      <select v-model="statusFilter" class="form-input w-40">
        <option value="ALL">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="COMPLETED">Completed</option>
      </select>

      <select v-model="dueFilter" class="form-input w-40">
        <option value="ALL">All Due</option>
        <option value="OVERDUE">Overdue</option>
        <option value="UPCOMING">Upcoming</option>
      </select>
    </div>

    <!-- ================= TABLE ================= -->
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
              <input
                type="checkbox"
                :value="task.id"
                v-model="selectedIds"
              />
            </td>

            <td class="px-4 py-3 font-medium text-[#172B4D]">
              {{ task.title }}
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
          </tr>

          <tr v-if="!paginatedTasks.length && !loading">
            <td colspan="6" class="text-center py-6 text-[#5E6C84]">
              No tasks found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ================= PAGINATION ================= -->
    <div class="flex justify-between px-4 py-4 text-sm">
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

    <!-- ================= CONFIRM ================= -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Complete Tasks"
      message="Mark selected tasks as completed?"
      confirmText="Complete"
      @confirm="markCompleted"
      @cancel="showConfirm = false"
    />

    <!-- ================= SNACKBAR ================= -->
    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>

