<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getTaskMaster,
  getGeneratedTasksByMaster,
} from '@/services/task-masters.service'

const route = useRoute()
const master = ref<any>(null)
const tasks = ref<any[]>([])

onMounted(async () => {
  const id = Number(route.params.id)
  master.value = (await getTaskMaster(id)).data
  tasks.value = (await getGeneratedTasksByMaster(id)).data
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-lg font-semibold mb-4">
      {{ master?.title }}
    </h1>

    <div class="bg-white border rounded-md">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7]">
          <tr>
            <th class="px-4 py-2 text-left">Client</th>
            <th class="px-4 py-2 text-left">Due Date</th>
            <th class="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="t in tasks" :key="t.id" class="border-t">
            <td class="px-4 py-2">{{ t.client?.name }}</td>
            <td class="px-4 py-2">
              {{ new Date(t.dueDate).toLocaleDateString() }}
            </td>
            <td class="px-4 py-2">{{ t.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
