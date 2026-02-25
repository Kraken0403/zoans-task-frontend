<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addInvoiceItem } from '@/services/invoices.service'
import { getAvailableTasksForInvoice } from '@/services/task.service'

const props = defineProps<{
  invoiceId: number
  clientId: number
}>()

const emit = defineEmits(['close', 'saved'])

const tasks = ref<any[]>([])
const selectedTaskId = ref<number | null>(null)
const loading = ref(false)

/* ===========================
   FETCH AVAILABLE TASKS
=========================== */

onMounted(async () => {
  tasks.value = await getAvailableTasksForInvoice(props.clientId)
})

/* ===========================
   SAVE
=========================== */

const save = async () => {
  if (!selectedTaskId.value) return

  loading.value = true

  await addInvoiceItem(props.invoiceId, {
    taskId: selectedTaskId.value,
  })

  emit('saved')
  emit('close')
}
</script>

<template>
  <div class="modal">
    <h3 class="mb-4">Add Task</h3>

    <select v-model="selectedTaskId" class="input">
      <option value="">Select Task</option>
      <option
        v-for="t in tasks"
        :key="t.id"
        :value="t.id"
      >
        {{ t.title }} ({{ t.client?.name }})
      </option>
    </select>

    <div class="flex justify-end mt-4 gap-2">
      <button @click="$emit('close')">Cancel</button>
      <button
        class="btn-primary"
        :disabled="!selectedTaskId || loading"
        @click="save"
      >
        {{ loading ? 'Adding...' : 'Add Task' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #dfe1e6;
  border-radius: 6px;
}
</style>