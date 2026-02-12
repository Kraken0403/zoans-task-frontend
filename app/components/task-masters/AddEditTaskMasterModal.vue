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
  background: white;
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

.btn-primary:hover {
  background: #0747a6;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  border: 1px solid #dfe1e6;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.btn-secondary:hover {
  background: #ebecf0;
}
</style>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { createTaskMaster, updateTaskMaster } from '@/services/task-masters.service'
import { getTaskCategories } from '@/services/task-categories.service'
/* ---------------------------------------
   PROPS / EMITS
--------------------------------------- */
type TaskCategory = {
  id: number
  name: string
}
const categories = ref<TaskCategory[]>([])
const categoriesLoading = ref(false)

onMounted(async () => {
  try {
    categoriesLoading.value = true
    const res = await getTaskCategories()
    categories.value = res.data || []
  } finally {
    categoriesLoading.value = false
  }
})


const props = defineProps<{ taskMaster?: any | null }>()
const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.taskMaster)
const loading = ref(false)

/* ---------------------------------------
   CONSTANTS
--------------------------------------- */
const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'EVENT_BASED', label: 'Event Based (One-time)' },
]

/* ---------------------------------------
   FORM STATE
--------------------------------------- */
const form = ref({
  title: '',
  description: '',
  categoryId: null as number | null,

  frequency: 'MONTHLY',
  interval: 1,
  financialYear: '',

  startDate: '',
  endDate: '',

  defaultDueDay: null as number | null,

  isBillable: true,
  hsnSac: '',
  gstRate: null as number | null,
  unitLabel: '',

  isActive: true,
})

/* ---------------------------------------
   FREQUENCY FLAGS
--------------------------------------- */
const isDaily = computed(() => form.value.frequency === 'DAILY')
const isWeekly = computed(() => form.value.frequency === 'WEEKLY')
const isMonthly = computed(() => form.value.frequency === 'MONTHLY')
const isQuarterly = computed(() => form.value.frequency === 'QUARTERLY')
const isYearly = computed(() => form.value.frequency === 'YEARLY')
const isEvent = computed(() => form.value.frequency === 'EVENT_BASED')

/**
 * Unified rules (matches backend)
 */
const needsInterval = computed(() => isMonthly.value)
const needsDueDay = computed(() => isMonthly.value || isQuarterly.value)
const needsFinancialYear = computed(() => !isEvent.value)

/* ---------------------------------------
   PREFILL (EDIT)
--------------------------------------- */
watch(
  () => props.taskMaster,
  m => {
    if (!m) return

    form.value = {
      title: m.title || '',
      description: m.description || '',
      categoryId: m.categoryId ?? null,

      frequency: m.frequency || 'MONTHLY',
      interval: m.interval ?? 1,
      financialYear: m.financialYear || '',

      startDate: m.startDate?.slice(0, 10) || '',
      endDate: m.endDate?.slice(0, 10) || '',

      defaultDueDay: m.defaultDueDay ?? null,

      isBillable: m.isBillable ?? true,
      hsnSac: m.hsnSac || '',
      gstRate: m.gstRate ?? null,
      unitLabel: m.unitLabel || '',

      isActive: m.isActive ?? true,
    }
  },
  { immediate: true },
)

/* ---------------------------------------
   SUBMIT
--------------------------------------- */
const submit = async () => {
  if (!form.value.title.trim()) return
  if (!form.value.categoryId) return
  if (!form.value.startDate) return

  loading.value = true

  const payload: any = {
    title: form.value.title.trim(),
    description: form.value.description || undefined,
    categoryId: form.value.categoryId,

    frequency: form.value.frequency,
    startDate: form.value.startDate,
    endDate: form.value.endDate || undefined,

    isBillable: form.value.isBillable,
    isActive: form.value.isActive,
  }

  if (needsInterval.value) {
    payload.interval = Number(form.value.interval)
  }

  if (needsFinancialYear.value && form.value.financialYear) {
    payload.financialYear = form.value.financialYear
  }

  if (needsDueDay.value && form.value.defaultDueDay) {
    payload.defaultDueDay = Number(form.value.defaultDueDay)
  }

  if (form.value.isBillable) {
    payload.hsnSac = form.value.hsnSac || undefined
    payload.gstRate = form.value.gstRate || undefined
    payload.unitLabel = form.value.unitLabel || undefined
  }

  try {
    isEdit.value
      ? await updateTaskMaster(props.taskMaster!.id, payload)
      : await createTaskMaster(payload)

    emit('saved')
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div
      class="bg-white w-full max-w-[600px] rounded-md shadow-lg overflow-hidden flex flex-col"
      style="max-height: 90vh"
    >
      <!-- HEADER -->
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <div class="font-semibold text-[#172B4D]">
          {{ isEdit ? 'Edit Task Master' : 'Add Task Master' }}
        </div>
        <button class="text-[#6B778C]" @click="$emit('close')">✕</button>
      </div>

      <!-- BODY -->
      <div class="p-6 space-y-4 text-sm overflow-y-auto">
        <div>
          <label class="label">Task Title *</label>
          <input v-model="form.title" class="input" />
        </div>

        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" class="input" />
        </div>

        <div>
          <label class="label">Category *</label>

          <select
            v-model="form.categoryId"
            class="input"
            :disabled="categoriesLoading"
          >
            <option value="" disabled>
              {{ categoriesLoading ? 'Loading categories…' : 'Select category' }}
            </option>

            <option
              v-for="cat in categories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>


        <div>
          <label class="label">Frequency</label>
          <select v-model="form.frequency" class="input">
            <option v-for="f in FREQUENCIES" :key="f.value" :value="f.value">
              {{ f.label }}
            </option>
          </select>
        </div>

        <div v-if="needsInterval">
          <label class="label">Interval (Months)</label>
          <input type="number" min="1" v-model.number="form.interval" class="input" />
        </div>

        <div v-if="needsFinancialYear">
          <label class="label">Financial Year</label>
          <input v-model="form.financialYear" class="input" placeholder="2025-26" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Start Date *</label>
            <input type="date" v-model="form.startDate" class="input" />
          </div>
          <div>
            <label class="label">End Date</label>
            <input type="date" v-model="form.endDate" class="input" />
          </div>
        </div>

        <div v-if="needsDueDay">
          <label class="label">Default Due Day (1–31)</label>
          <input type="number" min="1" max="31" v-model.number="form.defaultDueDay" class="input" />
        </div>

        <label class="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" v-model="form.isBillable" />
          Billable
        </label>

        <div v-if="form.isBillable" class="grid grid-cols-3 gap-4">
          <div>
            <label class="label">HSN / SAC</label>
            <input v-model="form.hsnSac" class="input" />
          </div>
          <div>
            <label class="label">GST %</label>
            <input type="number" v-model.number="form.gstRate" class="input" />
          </div>
          <div>
            <label class="label">Unit</label>
            <input v-model="form.unitLabel" class="input" />
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" v-model="form.isActive" />
          Active
        </label>
      </div>

      <!-- FOOTER -->
      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task Master' }}
        </button>
      </div>
    </div>
  </div>
</template>
