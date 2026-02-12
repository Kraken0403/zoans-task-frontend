<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardSummary } from '@/services/dashboard.service'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const loading = ref(true)

const summary = ref<any>({
  taskMastersCount: 0,
  tasksCount: 0,
  myPendingCount: 0,
  overdueCount: 0,
  clientsCount: 0,
  invoicesCount: 0,
  pendingInvoiceAmount: 0,
  upcomingTasks: [],
  overdueTasks: [],
  taskStatusBreakdown: {},
})

const fetchSummary = async () => {
  loading.value = true
  try {
    const { data } = await getDashboardSummary()
    summary.value = data
  } finally {
    loading.value = false
  }
}

onMounted(fetchSummary)

const formatCurrency = (val: number) =>
  `₹ ${Number(val || 0).toLocaleString()}`
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">

    <!-- ================= HEADER ================= -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-[#172B4D]">
        Dashboard
      </h1>
      <p class="text-sm text-[#5E6C84]">
        Overview of operations and performance
      </p>
    </div>

    <!-- ================= KPI GRID ================= -->
    <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">

      <div class="card">
        <p class="card-label">Task Masters</p>
        <p class="card-value">{{ summary.taskMastersCount }}</p>
      </div>

      <div class="card">
        <p class="card-label">Total Tasks</p>
        <p class="card-value">{{ summary.tasksCount }}</p>
      </div>

      <div class="card">
        <p class="card-label text-[#BF2600]">Overdue Tasks</p>
        <p class="card-value text-[#BF2600]">
          {{ summary.overdueCount }}
        </p>
      </div>

      <div class="card">
        <p class="card-label text-[#0747A6]">Clients</p>
        <p class="card-value text-[#0747A6]">
          {{ summary.myPendingCount }}
        </p>
      </div>

      <!-- <div class="card">
        <p class="card-label">Clients</p>
        <p class="card-value">{{ summary.clientsCount }}</p>
      </div> -->

      <div class="card">
        <p class="card-label">Invoices</p>
        <p class="card-value">{{ summary.invoicesCount }}</p>
      </div>

      <div class="card xl:col-span-2">
        <p class="card-label">Pending Invoice Amount</p>
        <p class="card-value text-[#006644]">
          {{ formatCurrency(summary.pendingInvoiceAmount) }}
        </p>
      </div>

    </div>

    <!-- ================= STATUS BREAKDOWN ================= -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

      <!-- Task Status -->
      <div class="panel">
        <h3 class="panel-title">Task Status Overview</h3>

        <div class="flex gap-6 mt-4 text-sm">
          <div>
            <p class="text-gray-500">Pending</p>
            <p class="text-lg font-semibold text-[#0747A6]">
              {{ summary.taskStatusBreakdown.PENDING || 0 }}
            </p>
          </div>

          <div>
            <p class="text-gray-500">Completed</p>
            <p class="text-lg font-semibold text-[#006644]">
              {{ summary.taskStatusBreakdown.COMPLETED || 0 }}
            </p>
          </div>

          <div>
            <p class="text-gray-500">Invoiced</p>
            <p class="text-lg font-semibold text-[#0052CC]">
              {{ summary.taskStatusBreakdown.INVOICED || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Upcoming -->
      <div class="panel">
        <h3 class="panel-title">Upcoming Tasks (Next 7 Days)</h3>

        <div v-if="!summary.upcomingTasks.length" class="empty">
          No upcoming tasks
        </div>

        <div
          v-for="t in summary.upcomingTasks"
          :key="t.id"
          class="task-row"
          @click="router.push(`/tasks/${t.id}`)"
        >
          <div>
            <p class="font-medium">{{ t.title }}</p>
            <p class="text-xs text-gray-500">
              {{ t.client?.name || '—' }}
            </p>
          </div>
          <div class="text-xs text-gray-500">
            {{ new Date(t.dueDate).toLocaleDateString() }}
          </div>
        </div>
      </div>

    </div>

    <!-- ================= OVERDUE SECTION ================= -->
    <div class="panel">
      <h3 class="panel-title text-[#BF2600]">
        Overdue Tasks
      </h3>

      <div v-if="!summary.overdueTasks.length" class="empty">
        No overdue tasks 🎉
      </div>

      <div
        v-for="t in summary.overdueTasks"
        :key="t.id"
        class="task-row overdue"
        @click="router.push(`/tasks/${t.id}`)"
      >
        <div>
          <p class="font-medium">{{ t.title }}</p>
          <p class="text-xs text-gray-500">
            {{ t.client?.name || '—' }}
          </p>
        </div>
        <div class="text-xs text-[#BF2600]">
          {{ new Date(t.dueDate).toLocaleDateString() }}
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.card {
  background: white;
  border: 1px solid #DFE1E6;
  border-radius: 8px;
  padding: 16px;
}

.card-label {
  font-size: 13px;
  color: #5E6C84;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  margin-top: 4px;
}

.panel {
  background: white;
  border: 1px solid #DFE1E6;
  border-radius: 8px;
  padding: 18px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #172B4D;
}

.task-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #F4F5F7;
  cursor: pointer;
}

.task-row:first-of-type {
  border-top: none;
}

.task-row:hover {
  background: #F9FAFB;
}

.task-row.overdue:hover {
  background: #FFEBE6;
}

.empty {
  font-size: 13px;
  color: #5E6C84;
  padding: 12px 0;
}
</style>
