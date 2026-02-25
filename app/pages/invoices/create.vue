<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { createInvoice } from '@/services/invoices.service'
import { getMyCompanies } from '@/services/my-companies.service'
import { getClients } from '@/services/clients.service'
import { getTasksByIds } from '@/services/task.service'
import { getAvailableTasksForInvoice } from '@/services/task.service'

import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const route = useRoute()

/* ================= QUERY ================= */

const sourceType = route.query.sourceType as string | undefined
const clientIdFromQuery = route.query.clientId
  ? Number(route.query.clientId)
  : null

const taskIdsFromQuery = route.query.taskIds
  ? JSON.parse(route.query.taskIds as string)
  : []

const isFromTasks = computed(() => taskIdsFromQuery.length > 0)

/* ================= COMPUTED FILTERS ================= */

const normalizeSearch = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const getFilteredTasks = (search: string) => {
  const query = normalizeSearch(search)

  if (!query) return availableTasks.value

  return availableTasks.value.filter((task) => {
    const searchableFields = [
      task.title,
      task.description,
      task.taskMaster?.title,
      task.hsnSac,
      task.id,
    ]

    return searchableFields.some((field) =>
      normalizeSearch(field).includes(query),
    )
  })
}

const isTaskAlreadySelected = (taskId: number) => {
  return form.value.items.some(i => i.taskId === taskId)
}

const openTaskDropdown = (item: any) => {
  item.showDropdown = true
}

const closeTaskDropdown = (item: any) => {
  setTimeout(() => {
    item.showDropdown = false
  }, 120)
}

/* ================= DROPDOWN DATA ================= */

const companies = ref<any[]>([])
const clients = ref<any[]>([])
const availableTasks = ref<any[]>([])

/* ================= FORM STATE ================= */

const form = ref({
  fromCompanyId: null as number | null,
  clientId: clientIdFromQuery as number | null,

  gstPercent: 18,
  pricingMode: 'EXCLUSIVE',
  discount: 0,

  placeOfSupply: '',
  dueDate: '',
  serviceFrom: '',
  serviceTo: '',
  notes: '',

  isManualTotal: false,

  subtotal: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  total: 0,

  items: [] as any[],
})

/* ================= UI STATE ================= */

const loading = ref(false)
const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

/* ================= FETCH ================= */

onMounted(async () => {
  const [cRes, clRes] = await Promise.all([
    getMyCompanies(),
    getClients(),
  ])

  companies.value = cRes.data
  clients.value = clRes.data

  if (isFromTasks && taskIdsFromQuery.length) {
    await populateFromTasks()
  }
})

/* ================= POPULATE FROM TASKS ================= */

const populateFromTasks = async () => {
  if (!taskIdsFromQuery.length) return

  const { data } = await getTasksByIds(taskIdsFromQuery)
  console.log(data)

  if (!data?.length) return

  // Safety: filter only requested IDs (extra protection)
  const filtered = data.filter((t: any) =>
    taskIdsFromQuery.includes(t.id),
  )

  form.value.items = filtered.map((task: any) => ({
    title: task.title,
    description: task.description || '',
    hsnSac: task.hsnSac || task.taskMaster?.hsnSac || '',
    taskId: task.id,
    quantity: 1,
    unitPrice: task.unitPrice || 0,
    taskSearch: task.title,
    showDropdown: false,
  }))

  form.value.clientId = filtered[0].client.id
}

/* ================= CALCULATIONS ================= */

const itemAmount = (item: any) =>
  Number(item.quantity || 0) * Number(item.unitPrice || 0)

const rawSubtotal = computed(() =>
  form.value.items.reduce((sum, i) => sum + itemAmount(i), 0),
)

const discountedSubtotal = computed(() =>
  rawSubtotal.value - Number(form.value.discount || 0),
)

const gstAmount = computed(() =>
  (discountedSubtotal.value * Number(form.value.gstPercent || 0)) / 100,
)

const total = computed(() =>
  discountedSubtotal.value + gstAmount.value,
)

/* ================= WATCHERS ================= */

watch(
  [discountedSubtotal, gstAmount, total],
  () => {
    form.value.subtotal = Number(discountedSubtotal.value.toFixed(2))
    form.value.cgstAmount = Number((gstAmount.value / 2).toFixed(2))
    form.value.sgstAmount = Number((gstAmount.value / 2).toFixed(2))
    form.value.total = Number(total.value.toFixed(2))
  },
  { immediate: true },
)

onMounted(async () => {
  if (!form.value.clientId) return

  const { data } = await getAvailableTasksForInvoice(
    form.value.clientId
  )

  availableTasks.value = data
})

watch(
  () => form.value.clientId,
  async (clientId) => {
    if (!clientId) return

    const { data } = await getAvailableTasksForInvoice(clientId)
    availableTasks.value = data
  }
)

/* ================= ACTIONS ================= */

const addItem = () => {
  if (isFromTasks.value) return

  if (!form.value.clientId) {
    snackbar.value = {
      show: true,
      message: 'Please select client first',
      type: 'error',
    }
    return
  }

  form.value.items.push({
    taskId: null,
    title: '',
    description: '',
    hsnSac: '',
    quantity: 1,
    unitPrice: 0,
    taskSearch: '',
    showDropdown: false,
  })
}

const removeItem = (index: number) => {
  if (isFromTasks.value) return
  form.value.items.splice(index, 1)
}

const selectTask = (task: any, item: any) => {
  item.taskId = task.id
  item.title = task.title
  item.description = task.description || ''
  item.hsnSac = task.hsnSac || task.taskMaster?.hsnSac || ''
  item.unitPrice = Number(task.unitPrice || 0)

  item.taskSearch = task.title
  item.showDropdown = false
}

const submit = async () => {
  if (!form.value.clientId || !form.value.fromCompanyId) {
    snackbar.value = {
      show: true,
      message: 'Select company and client',
      type: 'error',
    }
    return
  }

  if (!form.value.dueDate) {
    snackbar.value = {
      show: true,
      message: 'Due date is required',
      type: 'error',
    }
    return
  }

  if (
    form.value.serviceFrom &&
    form.value.serviceTo &&
    new Date(form.value.serviceFrom) > new Date(form.value.serviceTo)
  ) {
    snackbar.value = {
      show: true,
      message: 'Service From cannot be after Service To',
      type: 'error',
    }
    return
  }

  try {
    loading.value = true

    const payload = {
      fromCompanyId: form.value.fromCompanyId,
      clientId: form.value.clientId,
      gstPercent: form.value.gstPercent,
      pricingMode: form.value.pricingMode,
      discount: form.value.discount,
      placeOfSupply: form.value.placeOfSupply || null,
      dueDate: form.value.dueDate || null,
      serviceFrom: form.value.serviceFrom || null,
      serviceTo: form.value.serviceTo || null,
      notes: form.value.notes,
      subtotal: form.value.subtotal,
      cgstAmount: form.value.cgstAmount,
      sgstAmount: form.value.sgstAmount,
      igstAmount: form.value.igstAmount,
      total: form.value.total,
      sourceType: isFromTasks.value ? 'TASKS' : 'MANUAL',

      items: form.value.items.map(i => ({
        title: i.title,
        description: i.description,
        hsnSac: i.hsnSac,
        taskId: i.taskId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }

    const data = await createInvoice(payload)

    router.push(`/invoices/${data.id}`)
  } catch (err: any) {
    console.error(err.response?.data || err)

    snackbar.value = {
      show: true,
      message: err.response?.data?.message || 'Failed to create invoice',
      type: 'error',
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class=" bg-[#F9FAFB] min-h-screen w-full mx-auto p-6">
    <h1 class="text-xl font-semibold mb-6">Create Invoice</h1>

    <!-- COMPANY + CLIENT -->
    <div class="flex gap-[15px] w-[100%] mb-[20px]">
      <div class="w-[50%]">
        <label class="field-label">From Company <span class="text-red-600">*</span></label>
        <select v-model="form.fromCompanyId" class="form-input cursor-pointer">
          <option disabled value="">Select Company</option>
          <option v-for="c in companies" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div class="w-[50%]">
        <label class="field-label">Client <span class="text-red-600">*</span></label>
        <select v-model="form.clientId" class="form-input cur" :disabled="isFromTasks">

          <option disabled value="">Select Client</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- INVOICE META -->
    <div class="grid grid-cols-4 gap-4 mb-8">

      <div>
        <label class="field-label">
          Due Date <span class="text-red-600">*</span>
        </label>
        <input type="date" class="form-input" v-model="form.dueDate" />
      </div>
      
      <!-- <div>
        <label class="field-label">Place of Supply</label>
        <input class="form-input" v-model="form.placeOfSupply" placeholder="e.g. Gujarat" />
      </div> -->

      <div>
        <label class="field-label">Service From <span class="text-red-600">*</span></label>
        <input type="date" class="form-input" v-model="form.serviceFrom" />
      </div>

      <div>
        <label class="field-label">Service To <span class="text-red-600">*</span></label>
        <input type="date" class="form-input" v-model="form.serviceTo" />
      </div>

    </div>


    <!-- ITEMS -->
    <div class="bg-white border rounded-md mb-8">
      <div v-for="(item, i) in form.items" :key="i" class="p-4 border-b space-y-4 mb-[20px]">
        <!-- Item Header -->
        <div class="flex justify-between items-center">
          <div class="">
            <h4 class="font-bold text-[#172B4D]">Item No: {{ i + 1 }}</h4>
          </div>
          <!-- <button
              v-if="form.items.length > 1"
              class="text-red-500 border-[1px] border-red-600 text-sm hover:underline bg-[#fff] rounded-[3px] p-[7px]"
              @click="removeItem(i)"
            >
              ✕ Remove
            </button> -->
          <button
            class="text-red-500 border-[1px] border-red-600 text-sm hover:underline bg-[#fff] rounded-[3px] p-[7px]"
            v-if="!isFromTasks && form.items.length > 1" @click="removeItem(i)">
            ✕ Remove
          </button>

        </div>

        <!-- Title + Description -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Item Name</label>
            <div class="relative">
              <input v-model="item.taskSearch" class="form-input" placeholder="Search task..." :disabled="isFromTasks"
                @focus="openTaskDropdown(item)" @input="openTaskDropdown(item)" @blur="closeTaskDropdown(item)" />

              <div v-if="!isFromTasks && item.showDropdown && getFilteredTasks(item.taskSearch).length"
                class="absolute z-50 w-full bg-white border rounded-md max-h-60 overflow-y-auto shadow-md">
                <div v-for="t in getFilteredTasks(item.taskSearch)" :key="t.id" class="px-3 py-2 cursor-pointer" :class="[
                  isTaskAlreadySelected(t.id)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                ]" @mousedown.prevent="!isTaskAlreadySelected(t.id) && selectTask(t, item)">
                  {{ t.title }}
                </div>
              </div>

              <div v-else-if="!isFromTasks && item.showDropdown && !getFilteredTasks(item.taskSearch).length"
                class="absolute z-50 w-full bg-white border rounded-md px-3 py-2 text-xs text-[#5E6C84] shadow-md">
                No completed billable tasks available for selected client
              </div>
            </div>
          </div>

          <div>
            <label class="field-label">Description</label>
            <input class="form-input" v-model="item.description" :disabled="!isFromTasks" />
          </div>
        </div>

        <!-- HSN / QTY / PRICE / AMOUNT -->
        <div class="grid grid-cols-12 gap-4 items-end">
          <div class="col-span-4">
            <label class="field-label">HSN / SAC</label>
            <input class="form-input" v-model="item.hsnSac" :disabled="!isFromTasks" />
          </div>

          <div class="col-span-2">
            <label class="field-label">Quantity</label>
            <input type="number" min="1" class="form-input" v-model.number="item.quantity" />
          </div>

          <div class="col-span-3">
            <label class="field-label">Unit Price
              <span class="relative text-[#6B778C]">
                ( ₹ )
              </span>
            </label>
            <div class="relative">

              <input type="number" class="form-input pl-8" v-model.number="item.unitPrice" />
            </div>
          </div>

          <div class="col-span-3 text-right">
            <label class="field-label">Amount</label>
            <div class="h-[38px] flex items-center justify-end font-medium text-[#172B4D]">
              ₹{{ (item.quantity * item.unitPrice).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <button class="px-4 py-3 text-sm text-[#0052CC] hover:underline" @click="addItem">
        + Add Item
      </button>
    </div>

    <!-- GST -->
    <div class="grid grid-cols-3 gap-6 mb-8">
      <div>
        <label class="field-label">GST %</label>
        <input class="form-input" type="number" v-model.number="form.gstPercent" />
      </div>

      <!-- <div>
          <label class="field-label">Pricing Mode</label>
          <select class="form-input" v-model="form.pricingMode">
            <option value="EXCLUSIVE">Exclusive</option>
            <option value="INCLUSIVE">Inclusive</option>
          </select>
        </div> -->

      <div>
        <label class="field-label">Discount
          <span class="relative text-[#6B778C]">
            ( ₹ )
          </span>
        </label>
        <div class="relative">
          <input class="form-input pl-8" type="number" v-model.number="form.discount" />
        </div>
      </div>
    </div>

    <!-- TOTALS -->
    <div class="bg-[#FAFBFC] p-4 rounded-md mb-8 text-right space-y-1">
      <div>Subtotal: <b>₹{{ discountedSubtotal.toFixed(2) }}</b></div>
      <div>GST: <b>₹{{ gstAmount.toFixed(2) }}</b></div>
      <div class="text-lg">
        Total: <b>₹{{ total.toFixed(2) }}</b>
      </div>
    </div>

    <!-- NOTES -->
    <div class="mb-8">
      <label class="field-label">Invoice Notes</label>
      <textarea class="form-input min-h-[90px]" v-model="form.notes"
        placeholder="Any additional notes for this invoice" />
    </div>

    <!-- ACTIONS -->
    <div class="flex justify-end gap-3">
      <button class="px-4 py-2 border rounded" @click="router.back()">
        Cancel
      </button>
      <button class="px-4 py-2 bg-[#0052CC] text-white rounded" :disabled="loading" @click="submit">
        {{ loading ? 'Creating…' : 'Create Invoice' }}
      </button>
    </div>

    <NotificationSnackbar v-bind="snackbar" @close="snackbar.show = false" />
  </div>
</template>


<style scoped>
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #DFE1E6;
  border-radius: 4px;
}
</style>