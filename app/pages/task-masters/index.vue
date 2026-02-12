<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getTaskMasters } from '@/services/task-masters.service'
import AddEditTaskMasterModal from '@/components/task-masters/AddEditTaskMasterModal.vue'
import GenerateTasksModal from '@/components/task-masters/GenerateTasksModal.vue'

const router = useRouter()

const masters = ref<any[]>([])
const loading = ref(false)

const showEdit = ref(false)
const showGenerate = ref(false)
const activeMaster = ref<any | null>(null)

/* -------------------------
   SEARCH + FILTER
--------------------------*/
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

/* -------------------------
   SORTING
--------------------------*/
const sortKey = ref<string>('title')
const sortOrder = ref<'asc' | 'desc'>('asc')

const setSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

/* -------------------------
   FILTERED DATA
--------------------------*/
const filteredMasters = computed(() => {
  let data = [...masters.value]

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    data = data.filter(m =>
      m.title.toLowerCase().includes(q)
    )
  }

  // Status filter
  if (statusFilter.value === 'ACTIVE') {
    data = data.filter(m => m.isActive)
  }
  if (statusFilter.value === 'INACTIVE') {
    data = data.filter(m => !m.isActive)
  }

  // Sorting
  data.sort((a, b) => {
    const valA = a[sortKey.value]
    const valB = b[sortKey.value]

    if (valA == null) return 1
    if (valB == null) return -1

    if (typeof valA === 'string') {
      return sortOrder.value === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA)
    }

    return sortOrder.value === 'asc'
      ? valA - valB
      : valB - valA
  })

  return data
})

/* -------------------------
   FETCH
--------------------------*/
const fetchMasters = async () => {
  loading.value = true
  const { data } = await getTaskMasters()
  masters.value = data
  loading.value = false
}

onMounted(fetchMasters)

/* -------------------------
   ACTIONS
--------------------------*/
const openEdit = (m?: any) => {
  activeMaster.value = m || null
  showEdit.value = true
}

const openGenerate = (m: any) => {
  activeMaster.value = m
  showGenerate.value = true
}

const goToMaster = (m: any) => {
  router.push(`/task-masters/${m.id}`)
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between mb-4">
      <h1 class="text-lg font-semibold">Task Masters</h1>
      <button class="bg-[#0052CC] text-white px-4 py-2 rounded-md hover:bg-[#0747A6] text-sm" @click="openEdit()">
        + Add Task Master
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4 items-center">
    <!-- Search -->
      <input
        v-model="searchQuery"
        placeholder="Search task master..."
        class="border rounded-md px-3 py-2 text-sm w-64"
      />

      <!-- Status Filter -->
      <select
        v-model="statusFilter"
        class="border rounded-md px-3 py-2 text-sm"
      >
        <option value="ALL">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>


    <div class="bg-white border rounded-md">
      <table class="w-full text-sm">
        <thead class="bg-[#F4F5F7]">
          <tr>
            <th class="px-4 py-2 text-left cursor-pointer" @click="setSort('title')">
              Title
            </th>

            <th class="px-4 py-2 cursor-pointer" @click="setSort('frequency')">
              Frequency
            </th>

            <th class="px-4 py-2 cursor-pointer" @click="setSort('clients')">
              Clients
            </th>

            <th class="px-4 py-2 cursor-pointer" @click="setSort('isActive')">
              Status
            </th>

            <th class="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="m in filteredMasters"
            :key="m.id"
            class="border-t hover:bg-gray-50 cursor-pointer"
            
          >

            <td class="px-4 py-2 font-medium">{{ m.title }}</td>
            <td class="px-4 py-2">
              {{ m.frequency }} / {{ m.interval }}
            </td>
            <td class="px-4 py-2">
              {{ m.clients?.length || 0 }}
            </td>
            <td class="px-4 py-2">
              <span
                :class="m.isActive ? 'text-green-600' : 'text-red-600'"
              >
                {{ m.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-2 text-right space-x-2">
              <!-- <button @click="openAssign(m)" class="text-blue-600">
                Clients
              </button> -->
              <button @click="openGenerate(m)" class="text-purple-600">
                Generate
              </button>
              <button @click="openEdit(m)" class="text-gray-600">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddEditTaskMasterModal
      v-if="showEdit"
      :taskMaster="activeMaster"
      @close="showEdit = false"
      @saved="fetchMasters"
    />

    <AssignClientsModal
      v-if="showAssign"
      :taskMaster="activeMaster"
      @close="showAssign = false"
    />

    <GenerateTasksModal
      v-if="showGenerate"
      :taskMaster="activeMaster"
      @close="showGenerate = false"
    />
  </div>
</template>
