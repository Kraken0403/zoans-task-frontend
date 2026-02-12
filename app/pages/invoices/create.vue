<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { createInvoice } from '@/services/invoices.service'
import { getMyCompanies } from '@/services/my-companies.service'
import { getClients } from '@/services/clients.service'
import { getTasksByIds } from '@/services/task.service'


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

const isFromTasks = sourceType === 'TASKS'

/* ================= DROPDOWN DATA ================= */

const companies = ref<any[]>([])
const clients = ref<any[]>([])

/* ================= FORM STATE ================= */

const form = ref({
  fromCompanyId: null as number | null,
  clientId: clientIdFromQuery as number | null,

  gstPercent: 18,
  pricingMode: 'EXCLUSIVE',
  discount: 0,

  placeOfSupply: '',
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
  }))

  form.value.clientId = filtered[0].client.id
}



/* ================= CALCULATIONS ================= */

const itemAmount = (item: any) =>
  Number(item.quantity || 0) * Number(item.unitPrice || 0)

const subtotal = computed(() =>
  form.value.items.reduce((sum, i) => sum + itemAmount(i), 0),
)

const gstAmount = computed(() =>
  (subtotal.value * Number(form.value.gstPercent || 0)) / 100,
)

const total = computed(() =>
  subtotal.value + gstAmount.value - Number(form.value.discount || 0),
)

watch(
  [subtotal, gstAmount, total],
  () => {
    form.value.subtotal = Number(subtotal.value.toFixed(2))
    form.value.cgstAmount = Number((gstAmount.value / 2).toFixed(2))
    form.value.sgstAmount = Number((gstAmount.value / 2).toFixed(2))
    form.value.total = Number(total.value.toFixed(2))
  },
  { immediate: true },
)

/* ================= ACTIONS ================= */

const addItem = () => {
  if (isFromTasks) return
  form.value.items.push({
    title: '',
    description: '',
    hsnSac: '',
    quantity: 1,
    unitPrice: 0,
  })
}

const removeItem = (index: number) => {
  if (isFromTasks) return
  form.value.items.splice(index, 1)
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

  try {
    loading.value = true

    const payload = {
      ...form.value,
      sourceType: isFromTasks ? 'TASKS' : 'MANUAL',
    }

    const invoice = await createInvoice(payload)

    router.push(`/invoices/${invoice.id}`)
  } catch (err) {
    snackbar.value = {
      show: true,
      message: 'Failed to create invoice',
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
          <label class="field-label">From Company  <span class="text-red-600">*</span></label>
          <select v-model="form.fromCompanyId" class="form-input cursor-pointer">
            <option disabled value="">Select Company</option>
            <option v-for="c in companies" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
  
        <div class="w-[50%]">
          <label class="field-label">Client <span class="text-red-600">*</span></label>
          <select
            v-model="form.clientId"
            class="form-input cur"
            :disabled="isFromTasks"
          >

            <option disabled value="">Select Client</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
  
      <!-- ITEMS -->
      <div class="bg-white border rounded-md mb-8">
        <div
          v-for="(item, i) in form.items"
          :key="i"
          class="p-4 border-b space-y-4 mb-[20px]"
        >
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
              v-if="!isFromTasks && form.items.length > 1"
              @click="removeItem(i)"
            >
              ✕ Remove
            </button>

          </div>
  
          <!-- Title + Description -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">Item Name</label>
              <input class="form-input" v-model="item.title" />
            </div>
  
            <div>
              <label class="field-label">Description</label>
              <input class="form-input" v-model="item.description" />
            </div>
          </div>
  
          <!-- HSN / QTY / PRICE / AMOUNT -->
          <div class="grid grid-cols-12 gap-4 items-end">
            <div class="col-span-4">
              <label class="field-label">HSN / SAC</label>
              <input class="form-input" v-model="item.hsnSac" />
            </div>
  
            <div class="col-span-2">
              <label class="field-label">Quantity</label>
              <input
                type="number"
                min="1"
                class="form-input"
                v-model.number="item.quantity"
              />
            </div>
  
            <div class="col-span-3">
              <label class="field-label">Unit Price</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]">
                  ₹
                </span>
                <input
                  type="number"
                  class="form-input pl-8"
                  v-model.number="item.unitPrice"
                />
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
  
        <button
          class="px-4 py-3 text-sm text-[#0052CC] hover:underline"
          @click="addItem"
        >
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
          <label class="field-label">Discount</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]">
              ₹
            </span>
            <input
              class="form-input pl-8"
              type="number"
              v-model.number="form.discount"
            />
          </div>
        </div>
      </div>
  
      <!-- TOTALS -->
      <div class="bg-[#FAFBFC] p-4 rounded-md mb-8 text-right space-y-1">
        <div>Subtotal: <b>₹{{ subtotal.toFixed(2) }}</b></div>
        <div>GST: <b>₹{{ ((subtotal * form.gstPercent) / 100).toFixed(2) }}</b></div>
        <div class="text-lg">
          Total: <b>₹{{ total.toFixed(2) }}</b>
        </div>
      </div>
  
      <!-- NOTES -->
      <div class="mb-8">
        <label class="field-label">Invoice Notes</label>
        <textarea
          class="form-input min-h-[90px]"
          v-model="form.notes"
          placeholder="Any additional notes for this invoice"
        />
      </div>
  
      <!-- ACTIONS -->
      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 border rounded"
          @click="router.back()"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-[#0052CC] text-white rounded"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? 'Creating…' : 'Create Invoice' }}
        </button>
      </div>
  
      <NotificationSnackbar
        v-bind="snackbar"
        @close="snackbar.show = false"
      />
    </div>
  </template>
  

  <style scoped>
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #DFE1E6;
  border-radius: 4px;
}</style>
  