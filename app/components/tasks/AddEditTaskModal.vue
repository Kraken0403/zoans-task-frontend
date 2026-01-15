<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { createTask, updateTask } from '@/services/task.service'
import { getClients } from '@/services/clients.service'
import { getUsers } from '@/services/users.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type Status = 'PENDING' | 'COMPLETED' | 'IN_PROGRESS'

const props = defineProps<{ task?: any }>()
const emit = defineEmits(['close', 'saved'])

const clients = ref<any[]>([])
const users = ref<any[]>([])
const loading = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

/* ===========================
   MODE DETECTION (CRITICAL)
=========================== */

const isEdit = computed(() => !!props.task)
const isGeneratedInstance = computed(() => !!props.task?.parentTaskId)

// ✅ recurring can be edited when:
// - creating a new task
// - editing a recurring template
const canEditRecurring = computed(() => {
  if (!isEdit.value) return true
  if (props.task?.isRecurring && !props.task?.parentTaskId) return true
  return false
})

/* ===========================
   FORM STATE
=========================== */

const form = ref({
  title: '',
  description: '',
  clientId: null as number | null,

  // one-time
  dueDate: '',

  // recurring
  isRecurring: false,
  frequency: 'MONTHLY' as Frequency,
  interval: 1,
  startDate: '',
  endDate: '',
  skipWeekends: false,
  isPaused: false,

  // assignments
  userIds: [] as number[],

  // status
  status: 'PENDING' as Status,
})

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    clientId: null,
    dueDate: '',
    isRecurring: false,
    frequency: 'MONTHLY',
    interval: 1,
    startDate: '',
    endDate: '',
    skipWeekends: false,
    isPaused: false,
    userIds: [],
    status: 'PENDING',
  }
}

watch(
  () => props.task,
  (t) => {
    resetForm()
    if (!t) return

    form.value.title = t.title || ''
    form.value.description = t.description || ''
    form.value.clientId = Number(t.clientId)

    form.value.dueDate = t.dueDate ? String(t.dueDate).slice(0, 10) : ''

    form.value.isRecurring = !!t.isRecurring
    form.value.frequency = t.frequency || 'MONTHLY'
    form.value.interval = t.interval || 1
    form.value.startDate = t.startDate ? String(t.startDate).slice(0, 10) : ''
    form.value.endDate = t.endDate ? String(t.endDate).slice(0, 10) : ''
    form.value.skipWeekends = !!t.skipWeekends
    form.value.isPaused = !!t.isPaused

    form.value.userIds =
      t.assignments?.map((a: any) => Number(a.userId)) || []

    form.value.status = t.status || 'PENDING'
  },
  { immediate: true },
)

/* ===========================
   HELPERS
=========================== */

const toggleUser = (userId: number) => {
  const idx = form.value.userIds.indexOf(userId)
  idx >= 0
    ? form.value.userIds.splice(idx, 1)
    : form.value.userIds.push(userId)
}

/* ===========================
   SUBMIT
=========================== */

const submit = async () => {
  try {
    if (!form.value.title.trim()) {
      snackbar.value = { show: true, message: 'Title is required', type: 'error' }
      return
    }
    if (!form.value.clientId) {
      snackbar.value = { show: true, message: 'Client is required', type: 'error' }
      return
    }

    loading.value = true

    const payload: any = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || undefined,
      userIds: form.value.userIds.length ? form.value.userIds : undefined,
    }

    // ✅ clientId ONLY on create
    if (!isEdit.value) {
      payload.clientId = Number(form.value.clientId)
    }


    /* ===========================
       RECURRING (CREATE + TEMPLATE)
    =========================== */

    if (form.value.isRecurring && canEditRecurring.value) {
      if (!form.value.startDate) {
        snackbar.value = {
          show: true,
          message: 'Start date is required for recurring tasks',
          type: 'error',
        }
        loading.value = false
        return
      }

      payload.isRecurring = true
      payload.frequency = form.value.frequency
      payload.interval = Number(form.value.interval) || 1
      payload.startDate = form.value.startDate
      payload.endDate = form.value.endDate || undefined
      payload.skipWeekends = form.value.skipWeekends
      payload.isPaused = form.value.isPaused
    }

    /* ===========================
       ONE-TIME / INSTANCE
    =========================== */

    if (!form.value.isRecurring && form.value.dueDate) {
      payload.dueDate = form.value.dueDate
    }

    /* ===========================
       CREATE / UPDATE
    =========================== */

    if (isEdit.value && props.task?.id) {
      payload.status = form.value.status
      await updateTask(props.task.id, payload)
    } else {
      await createTask(payload)
    }

    emit('saved')
    emit('close')
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      (Array.isArray(e?.response?.data?.message)
        ? e.response.data.message.join(', ')
        : null) ||
      'Failed to save task'
    snackbar.value = { show: true, message: msg, type: 'error' }
  } finally {
    loading.value = false
  }
}

/* ===========================
   LOAD DATA
=========================== */

onMounted(async () => {
  const [cRes, uRes] = await Promise.all([getClients(), getUsers()])
  clients.value = cRes.data
  users.value = uRes.data
})
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div
      class="bg-white w-full max-w-[720px] rounded-md shadow-lg overflow-hidden flex flex-col"
      style="max-height: 90vh"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <div class="font-semibold text-[#172B4D]">
          {{ isEdit ? 'Edit Task' : 'Add Task' }}
        </div>
        <button class="text-[#6B778C]" @click="$emit('close')">✕</button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4 text-sm overflow-y-auto flex-1">
        <div>
          <label class="label">Title *</label>
          <input v-model="form.title" class="input" />
        </div>

        <div>
          <label class="label">Client *</label>
          <select v-model="form.clientId" class="input">
            <option :value="null" disabled>Select client</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <div v-if="isEdit">
          <label class="label">Status</label>
          <select v-model="form.status" class="input">
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <!-- <option value="OVERDUE">OVERDUE</option> -->
            <option value="IN_PROGRESS">IN PROGRESS</option>
          </select>
        </div>

        <div>
          <label class="label">Assign to</label>
          <div class="border rounded p-3 max-h-40 overflow-auto">
            <label v-for="u in users" :key="u.id" class="flex gap-2 py-1">
              <input
                type="checkbox"
                :checked="form.userIds.includes(u.id)"
                @change="toggleUser(u.id)"
              />
              {{ u.name }}
            </label>
          </div>
        </div>

        <!-- Recurring toggle -->
        <div v-if="canEditRecurring">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="form.isRecurring" />
            Recurring task
          </label>
        </div>

        <!-- One-time -->
        <div v-if="!form.isRecurring">
          <label class="label">Due date</label>
          <input type="date" v-model="form.dueDate" class="input" />
        </div>

        <!-- Recurring config -->
        <div v-if="form.isRecurring && canEditRecurring" class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Frequency</label>
            <select v-model="form.frequency" class="input">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label class="label">Interval</label>
            <input type="number" min="1" v-model="form.interval" class="input" />
          </div>

          <div>
            <label class="label">Start date *</label>
            <input type="date" v-model="form.startDate" class="input" />
          </div>

          <div>
            <label class="label">End date</label>
            <input type="date" v-model="form.endDate" class="input" />
          </div>

          <label class="flex items-center gap-2 col-span-2">
            <input type="checkbox" v-model="form.skipWeekends" />
            Skip weekends (move to Monday)
          </label>

          <label class="flex items-center gap-2 col-span-2">
            <input type="checkbox" v-model="form.isPaused" />
            Pause recurring generation
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task' }}
        </button>
      </div>
    </div>

    <NotificationSnackbar v-bind="snackbar" @close="snackbar.show = false" />
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
  padding: 10px 12px;
}
.btn-primary {
  background: #0052cc;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
}
.btn-secondary {
  border: 1px solid #dfe1e6;
  padding: 10px 16px;
  border-radius: 6px;
}
</style>
