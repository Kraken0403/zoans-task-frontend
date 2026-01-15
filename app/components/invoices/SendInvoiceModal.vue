<script setup lang="ts">
import { ref } from 'vue'
import { sendInvoice } from '@/services/invoices.service'

const props = defineProps<{ invoiceId: number }>()
const emit = defineEmits(['close', 'sent'])

const form = ref({
  toEmail: '',
  subject: '',
  message: '',
})

const send = async () => {
  await sendInvoice(props.invoiceId, form.value)
  emit('sent')
  emit('close')
}
</script>

<template>
  <div class="modal">
    <h3 class="mb-4 ">Send Invoice</h3>

    <input v-model="form.toEmail" placeholder="Recipient Email" />
    <input v-model="form.subject" placeholder="Subject" />
    <textarea v-model="form.message" placeholder="Message"></textarea>

    <div class="flex justify-end mt-4 gap-2">
      <button @click="$emit('close')">Cancel</button>
      <button class="btn-primary" @click="send">Send</button>
    </div>
  </div>
</template>
