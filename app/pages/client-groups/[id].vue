<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  getClientGroup,
  assignClients,
  removeClientsFromGroup,
} from '@/services/clients-groups.service'
import { getClients } from '@/services/clients.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

const route = useRoute()
const groupId = Number(route.params.id)

const group = ref<any>(null)
const allClients = ref<any[]>([])
const selectedToAdd = ref<number[]>([])
const selectedToRemove = ref<number[]>([])
const loading = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success',
})

/* ================= FETCH ================= */

const fetchData = async () => {
  try {
    loading.value = true

    const { data } = await getClientGroup(groupId)
    group.value = data

    const res = await getClients()
    allClients.value = res.data
  } catch (err: any) {
    snackbar.value = {
      show: true,
      message: err.response?.data?.message || 'Failed to load data',
      type: 'error',
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

/* ================= AVAILABLE CLIENTS ================= */

const availableClients = computed(() => {
  if (!group.value) return []

  const groupClientIds = group.value.clients.map((c: any) => c.id)

  return allClients.value.filter(
    (client: any) => !groupClientIds.includes(client.id)
  )
})

/* ================= ASSIGN ================= */

const addClients = async () => {
  if (!selectedToAdd.value.length) {
    snackbar.value = {
      show: true,
      message: 'Please select at least one client',
      type: 'error',
    }
    return
  }

  try {
    loading.value = true

    await assignClients(groupId, selectedToAdd.value)

    snackbar.value = {
      show: true,
      message: 'Clients added to group',
      type: 'success',
    }

    selectedToAdd.value = []
    await fetchData()
  } catch (err: any) {
    snackbar.value = {
      show: true,
      message: err.response?.data?.message || 'Failed to add clients',
      type: 'error',
    }
  } finally {
    loading.value = false
  }
}

/* ================= REMOVE ================= */

const removeClients = async () => {
  if (!selectedToRemove.value.length) {
    snackbar.value = {
      show: true,
      message: 'Please select at least one client',
      type: 'error',
    }
    return
  }

  try {
    loading.value = true

    await removeClientsFromGroup(groupId, selectedToRemove.value)

    snackbar.value = {
      show: true,
      message: 'Clients removed from group',
      type: 'success',
    }

    selectedToRemove.value = []
    await fetchData()
  } catch (err: any) {
    snackbar.value = {
      show: true,
      message: err.response?.data?.message || 'Failed to remove clients',
      type: 'error',
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 bg-[#F9FAFB] min-h-screen">
    <div v-if="group">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-[22px] font-semibold text-[#172B4D]">
          {{ group.name }}
        </h1>
        <p class="text-sm text-[#5E6C84]">
          Code: {{ group.code }}
        </p>
      </div>

      <!-- Clients in Group -->

        <div class="bg-white border border-[#DFE1E6] rounded-md mb-6 flex flex-col max-h-[400px]">

        <div class="px-4 py-3 border-b font-medium">
        Clients in Group ({{ group.clients.length }})
        </div>

        <!-- Scrollable list -->
        <div class="overflow-y-auto flex-1">
        <div
            v-for="client in group.clients"
            :key="client.id"
            class="flex justify-between px-4 py-2 border-t"
        >
            <div>
            <div class="font-medium text-[#0052CC]">
                {{ client.name }}
            </div>
            <div class="text-xs text-[#5E6C84]">
                {{ client.code }}
            </div>
            </div>

            <input
            type="checkbox"
            :value="client.id"
            v-model="selectedToRemove"
            />
        </div>
        </div>

        <!-- Sticky Footer -->
        <div
        class="p-4 border-t bg-white sticky bottom-0"
        >
        <button
            class="bg-red-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            :disabled="loading"
            @click="removeClients"
        >
            Remove Selected
        </button>
        </div>
        </div>


        <!-- Add Clients -->
        <div class="bg-white border border-[#DFE1E6] rounded-md flex flex-col max-h-[400px]">

        <div class="px-4 py-3 border-b font-medium">
        Add Clients To Group
        </div>

        <!-- Scrollable list -->
        <div class="overflow-y-auto flex-1">
        <div
            v-for="client in availableClients"
            :key="client.id"
            class="flex justify-between px-4 py-2 border-t"
        >
            <div>
            <div class="font-medium text-[#0052CC]">
                {{ client.name }}
            </div>
            <div class="text-xs text-[#5E6C84]">
                {{ client.code }}
            </div>
            </div>

            <input
            type="checkbox"
            :value="client.id"
            v-model="selectedToAdd"
            />
        </div>
        </div>

        <!-- Sticky Footer -->
        <div
        class="p-4 border-t bg-white sticky bottom-0"
        >
        <button
            class="bg-[#0052CC] text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            :disabled="loading"
            @click="addClients"
        >
            Add Selected
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
