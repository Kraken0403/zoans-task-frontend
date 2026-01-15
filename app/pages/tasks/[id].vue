<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTask } from '@/services/task.service'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()

const task = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await getTask(Number(route.params.id))
    task.value = data
  } catch {
    router.push('/tasks')
  } finally {
    loading.value = false
  }
})

const formatDate = (date?: string) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <div v-if="loading" class="text-sm text-[#5E6C84]">
      Loading…
    </div>

    <div v-else-if="task" class="space-y-6">
      <!-- ================= TASK DETAILS ================= -->
      <div class="bg-white border border-[#DFE1E6] rounded-md p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h1 class="text-[20px] font-semibold text-[#172B4D]">
              {{ task.title }}
            </h1>
            <p class="text-sm text-[#5E6C84] mt-1">
              Task ID: {{ task.id }}
            </p>
          </div>

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
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div class="text-[#5E6C84]">Due Date</div>
            <div class="text-[#172B4D] font-medium">
              {{ formatDate(task.dueDate) }}
            </div>
          </div>

          <div>
            <div class="text-[#5E6C84]">Created On</div>
            <div class="text-[#172B4D] font-medium">
              {{ formatDate(task.createdAt) }}
            </div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <div class="text-[#5E6C84] text-sm mb-1">Description</div>
          <p class="text-[#172B4D] text-sm">
            {{ task.description || 'No description provided.' }}
          </p>
        </div>

        <!-- Assigned Users -->
        <div class="mt-4">
          <div class="text-[#5E6C84] text-sm mb-2">Assigned To</div>
          <div>
            <span
              v-for="a in task.assignments"
              :key="a.user.id"
              class="inline-block bg-[#DEEBFF] text-[#0747A6]
                     text-xs px-2 py-[2px] rounded-full mr-2 mb-1"
            >
              {{ a.user.name }}
            </span>
            <span v-if="!task.assignments?.length">—</span>
          </div>
        </div>
      </div>

      <!-- ================= CLIENT DETAILS ================= -->
      <div class="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
        <div class="px-6 py-4 border-b bg-[#F4F5F7]">
          <h2 class="text-sm font-semibold text-[#172B4D]">
            Client Details
          </h2>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-[#FAFBFC] text-[#5E6C84]">
            <tr>
              <th class="px-4 py-3 text-left">Client Name</th>
              <th class="px-4 py-3 text-left">Email</th>
              <th class="px-4 py-3 text-left">Phone</th>
            </tr>
          </thead>

          <tbody>
            <tr class="border-t">
              <td class="px-4 py-3 text-[#172B4D] font-medium">
                {{ task.client?.name || '—' }}
              </td>
              <td class="px-4 py-3 text-[#5E6C84]">
                {{ task.client?.email || '—' }}
              </td>
              <td class="px-4 py-3 text-[#5E6C84]">
                {{ task.client?.phone || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
