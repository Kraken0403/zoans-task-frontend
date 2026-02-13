<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { generateTasks, assignTaskMasterClients } from '@/services/task-masters.service'
import { getUsers } from '@/services/users.service'
import { getClients } from '@/services/clients.service'

const props = defineProps<{ taskMaster: any }>()
const emit = defineEmits(['close'])

const loading = ref(false)

/* ---------------- CLIENTS ---------------- */
const clients = ref<any[]>([])
const selectedClients = ref<number[]>([])
const clientSearch = ref('')
const expandedGroups = ref<string[]>([])

/* ---------------- DATE ---------------- */
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const financialYear = ref('')

/* ---------------- USERS ---------------- */
const users = ref<any[]>([])
const assignedToUserId = ref<number | null>(null)

/* ---------------- BILLABLE ---------------- */
const isBillable = ref(true)
const hsnSac = ref('')
const gstRate = ref<number | null>(null)
const unitLabel = ref('')

/* ---------------- FREQUENCY ---------------- */
const frequency = computed(() => props.taskMaster.frequency)
const isEvent = computed(() => frequency.value === 'EVENT_BASED')
const isMonthly = computed(() => frequency.value === 'MONTHLY')
const needsFinancialYear = computed(() => !isEvent.value && !isMonthly.value)

/* ---------------- PREFILL BILLING ---------------- */
watch(
  () => props.taskMaster,
  (m) => {
    if (!m) return

    isBillable.value = m.isBillable ?? true
    hsnSac.value = m.hsnSac || ''
    gstRate.value = m.gstRate ?? null
    unitLabel.value = m.unitLabel || ''
  },
  { immediate: true }
)

/* ---------------- LOAD DATA ---------------- */
onMounted(async () => {
  try {
    const [{ data: usersData }, { data: clientsData }] =
      await Promise.all([getUsers(), getClients()])

    users.value = Array.isArray(usersData) ? usersData : []
    clients.value = Array.isArray(clientsData) ? clientsData : []

    selectedClients.value =
      props.taskMaster.clients?.map((c: any) => c.id) || []

    expandedGroups.value = ['All Clients']

  } catch {
    users.value = []
    clients.value = []
  }
})

/* ---------------- SEARCH ---------------- */
const filteredClients = computed(() => {
  const search = clientSearch.value.toLowerCase()
  return clients.value.filter(c =>
    c.name?.toLowerCase().includes(search)
  )
})

const toggleGroup = () => {
  expandedGroups.value =
    expandedGroups.value.includes('All Clients') ? [] : ['All Clients']
}

/* ---------------- SUBMIT ---------------- */
const submit = async () => {
  if (!selectedClients.value.length) {
    alert('Please select at least one client.')
    return
  }

  const payload: any = {}

  if (!isEvent.value) payload.year = year.value
  if (isMonthly.value) payload.month = month.value

  if (needsFinancialYear.value) {
    if (!financialYear.value) {
      alert('Financial Year is required')
      return
    }
    payload.financialYear = financialYear.value
  }

  if (assignedToUserId.value) {
    payload.assignedToUserId = assignedToUserId.value
  }

  /* 🔥 BILLING PAYLOAD */
  payload.isBillable = isBillable.value

  if (isBillable.value) {
    payload.hsnSac = hsnSac.value || undefined
    payload.gstRate = gstRate.value || undefined
    payload.unitLabel = unitLabel.value || undefined
  }

  loading.value = true

  try {
    await assignTaskMasterClients(
      props.taskMaster.id,
      selectedClients.value
    )

    await generateTasks(props.taskMaster.id, payload)

    emit('close')
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div
      class="bg-white w-full max-w-[650px] rounded-md shadow-lg overflow-hidden flex flex-col"
      style="max-height: 90vh"
    >

      <!-- HEADER -->
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <div class="font-semibold text-[#172B4D]">
          Generate Tasks
        </div>
        <button class="text-[#6B778C]" @click="$emit('close')">✕</button>
      </div>

      <!-- BODY -->
      <div class="p-6 space-y-4 text-sm overflow-y-auto">

        <!-- TASK MASTER -->
        <div>
          <label class="label">Task Master</label>
          <div class="input bg-[#FAFBFC] font-medium">
            {{ props.taskMaster.title }}
          </div>
        </div>

        <!-- CLIENT SELECTION -->
        <div>
          <label class="label">Select Clients</label>

          <input
            v-model="clientSearch"
            placeholder="Search clients..."
            class="input mb-2"
          />

          <div class="client-window">
            <div
              class="group-header"
              @click="toggleGroup"
            >
              All Clients ({{ filteredClients.length }})
            </div>

            <div v-if="expandedGroups.includes('All Clients')">
              <label
                v-for="c in filteredClients"
                :key="c.id"
                class="client-item"
              >
                <input
                  type="checkbox"
                  :value="c.id"
                  v-model="selectedClients"
                />
                {{ c.name }}
              </label>
            </div>
          </div>
        </div>

        <!-- YEAR -->
        <div v-if="!isEvent">
          <label class="label">Year</label>
          <input type="number" v-model="year" class="input" />
        </div>

        <!-- MONTH -->
        <div v-if="isMonthly">
          <label class="label">Month</label>
          <input type="number" v-model="month" class="input" />
        </div>

        <!-- FINANCIAL YEAR -->
        <div v-if="needsFinancialYear">
          <label class="label">Financial Year</label>
          <input
            v-model="financialYear"
            placeholder="e.g. 2025-26"
            class="input"
          />
        </div>

        <!-- ASSIGN TO -->
        <div>
          <label class="label">Assign To (optional)</label>
          <select v-model="assignedToUserId" class="input">
            <option :value="null">— Leave unassigned —</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.name }}
            </option>
          </select>
        </div>

      </div>

      <!-- BILLABLE -->
      <label class="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" v-model="isBillable" />
        Billable
      </label>

      <div v-if="isBillable" class="grid grid-cols-3 gap-4">
        <div>
          <label class="label">HSN / SAC</label>
          <input v-model="hsnSac" class="input" />
        </div>

        <div>
          <label class="label">GST %</label>
          <input type="number" v-model.number="gstRate" class="input" />
        </div>

        <div>
          <label class="label">Unit</label>
          <input v-model="unitLabel" class="input" />
        </div>
      </div>

      <!-- FOOTER -->
      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button class="btn-secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn-primary"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? 'Generating…' : 'Generate Tasks' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #5e6c84;
}
.input {
  width: 100%;
  border: 1px solid #dfe1e6;
  border-radius: 6px;
  padding: 8px 10px;
  background: white;
  font-size: 13px;
}
.input:focus {
  border-color: #4c9aff;
  box-shadow: 0 0 0 2px rgba(76, 154, 255, 0.2);
}
.btn-primary {
  background: #0052cc;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
}
.btn-secondary {
  border: 1px solid #dfe1e6;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.client-window {
  border: 1px solid #dfe1e6;
  border-radius: 6px;
  max-height: 260px;
  overflow-y: auto;
  background: #fff;
}
.group-header {
  background: #f4f5f7;
  padding: 8px 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}
.client-item {
  padding: 6px 10px;
  display: flex;
  gap: 8px;
  font-size: 13px;
}
</style>
