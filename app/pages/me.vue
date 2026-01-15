<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getMyTasks, updateTask } from '@/services/task.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({
  middleware: 'auth',
  title: 'My Tasks',
})

/* ================= STATE ================= */

const tasks = ref<any[]>([])
const loading = ref(true)

const search = ref('')
const statusFilter = ref<'ALL' | 'PENDING' | 'COMPLETED' | 'OVERDUE'>('ALL')

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

/* ================= FETCH ================= */

const fetchMyTasks = async () => {
  loading.value = true
  try {
    const { data } = await getMyTasks()
    tasks.value = data
  } finally {
    loading.value = false
  }
}

onMounted(fetchMyTasks)

/* ================= FILTERING ================= */

const filteredTasks = computed(() => {
  let list = tasks.value

  if (statusFilter.value !== 'ALL') {
    list = list.filter(t => t.status === statusFilter.value)
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      [t.title, t.client?.name]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(q))
    )
  }

  return list
})

/* ================= ACTIONS ================= */

const changeStatus = async (task: any, status: string) => {
  try {
    await updateTask(task.id, { status })
    task.status = status

    snackbar.value = {
      show: true,
      message: 'Task status updated',
      type: 'success',
    }
  } catch {
    snackbar.value = {
      show: true,
      message: 'Failed to update task',
      type: 'error',
    }
  }
}

/* ================= HELPERS ================= */

const statusClass = (status: string) => {
  if (status === 'COMPLETED') return 'bg-green-100 text-green-700'
  if (status === 'OVERDUE') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

const formatDate = (date?: string) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-[20px] font-semibold text-[#172B4D]">
          My Tasks
        </h1>
        <p class="text-sm text-[#5E6C84]">
          Tasks assigned to you
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2">
        <input
          v-model="search"
          placeholder="Search tasks"
          class="px-3 py-2 text-sm border rounded-md w-64"
        />

        <select
          v-model="statusFilter"
          class="px-3 py-2 text-sm border rounded-md"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-10 text-sm text-gray-500">
      Loading tasks…
    </div>

    <!-- Empty -->
    <div
      v-else-if="!filteredTasks.length"
      class="text-center py-10 text-sm text-gray-500"
    >
      No tasks found
    </div>

    <!-- Cards -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="bg-white border border-[#DFE1E6] rounded-md p-4
               hover:shadow-sm transition"
      >
        <!-- Title -->
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-medium text-[#172B4D]">
            {{ task.title }}
          </h3>

          <span
            class="text-xs px-2 py-[2px] rounded-full"
            :class="statusClass(task.status)"
          >
            {{ task.status }}
          </span>
        </div>

        <!-- Meta -->
        <div class="text-sm text-[#5E6C84] space-y-1 mb-4">
          <div>
            <strong>Client:</strong>
            {{ task.client?.name || '—' }}
          </div>

          <div>
            <strong>Due:</strong>
            {{ formatDate(task.dueDate) }}
          </div>
        </div>

        <!-- Status Actions -->
        <div class="flex gap-2">
          <button
            v-if="task.status !== 'PENDING'"
            class="btn-secondary text-xs"
            @click="changeStatus(task, 'PENDING')"
          >
            Mark Pending
          </button>

          <button
            v-if="task.status !== 'COMPLETED'"
            class="btn-primary text-xs"
            @click="changeStatus(task, 'COMPLETED')"
          >
            Complete
          </button>
        </div>
      </div>
    </div>

    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>

<style scoped>
.btn-primary {
  background: #0052cc;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
}
.btn-primary:hover {
  background: #0747a6;
}

.btn-secondary {
  border: 1px solid #dfe1e6;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}
.btn-secondary:hover {
  background: #ebecf0;
}
</style>
