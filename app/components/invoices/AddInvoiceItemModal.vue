<script setup lang="ts">
import { ref } from 'vue'
import { addInvoiceItem } from '@/services/invoices.service'

const props = defineProps<{ invoiceId: number }>()
const emit = defineEmits(['close', 'saved'])

const form = ref({
  title: '',
  quantity: 1,
  unitPrice: 0,
})

const save = async () => {
  await addInvoiceItem(props.invoiceId, form.value)
  emit('saved')
  emit('close')
}
</script>

<template>
  <div class="modal">
    <h3 class="mb-4">Add Item</h3>

    <input v-model="form.title" placeholder="Title" />
    <input type="number" v-model="form.quantity" />
    <input type="number" v-model="form.unitPrice" />

    <div class="flex justify-end mt-4 gap-2">
      <button @click="$emit('close')">Cancel</button>
      <button class="btn-primary" @click="save">Save</button>
    </div>
  </div>
</template>
