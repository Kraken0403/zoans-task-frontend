<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getClient } from '@/services/clients.service'
import AddEditClientModal from '@/components/clients/AddEditClientModal.vue'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()

const client = ref<any | null>(null)
const loading = ref(true)
const showEdit = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

const fetchClient = async () => {
  try {
    loading.value = true
    const { data } = await getClient(Number(route.params.id))
    client.value = data
  } catch {
    router.push('/clients')
  } finally {
    loading.value = false
  }
}

onMounted(fetchClient)
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <!-- Loading -->
    <div v-if="loading" class="text-sm text-[#5E6C84]">
      Loading client…
    </div>

    <!-- Client Not Found -->
    <div v-else-if="!client" class="text-sm text-red-600">
      Client not found
    </div>

    <!-- Client Details -->
    <div v-else>
      <!-- Client Card -->
      <div class="bg-white border rounded-md p-6 mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-xl font-semibold text-[#172B4D]">
              {{ client.name }}
            </h1>

            <p class="text-sm text-[#5E6C84] mt-1">
              Code: {{ client.code }}
            </p>

            <p class="text-sm mt-2">
              {{ client.email || 'No email provided' }}
            </p>

            <p class="text-sm">
              {{ client.phone || 'No phone provided' }}
            </p>
          </div>

          <button
            class="text-sm px-3 py-2 border rounded-md
                   hover:bg-[#EBECF0]"
            @click="showEdit = true"
          >
            Edit Client
          </button>
        </div>
      </div>

      <!-- Tasks -->
      <div class="bg-white border rounded-md">
        <div class="px-4 py-3 border-b font-medium text-[#172B4D]">
          Tasks
        </div>

        <table class="w-full text-sm">
          <thead class="bg-[#F4F5F7] text-[#5E6C84]">
            <tr>
              <th class="px-4 py-3 text-left">Title</th>
              <th class="px-4 py-3 text-left">Due</th>
              <th class="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="task in client.tasks || []"
              :key="task.id"
              class="border-t hover:bg-[#F9FAFB]"
            >
              <td class="px-4 py-3 font-medium">
                {{ task.title }}
              </td>
              <td class="px-4 py-3">
                {{
                  task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : '—'
                }}
              </td>
              <td class="px-4 py-3">
                {{ task.status }}
              </td>
            </tr>

            <tr v-if="!client.tasks?.length">
              <td colspan="3" class="text-center py-6 text-[#5E6C84]">
                No tasks for this client
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <AddEditClientModal
      v-if="showEdit && client"
      :client="client"
      @close="showEdit = false"
      @saved="fetchClient"
      @notify="(payload) => {
        snackbar.show = true
        snackbar.message = payload.message
        snackbar.type = payload.type
      }"
    />

    <!-- Snackbar -->
    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
  </div>
</template>
