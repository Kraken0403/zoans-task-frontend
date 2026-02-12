<script setup lang="ts">
import { ref } from 'vue'
import { importClientsExcel } from '@/services/clients.service'

const emit = defineEmits(['close', 'imported', 'notify'])

const file = ref<File | null>(null)
const loading = ref(false)

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
}

const submit = async () => {
  if (!file.value) return

  try {
    loading.value = true
    await importClientsExcel(file.value)

    emit('notify', {
      type: 'success',
      message: 'Clients imported successfully',
    })

    emit('imported')
    emit('close')
  } catch (e: any) {
    emit('notify', {
      type: 'error',
      message: e?.response?.data?.message || 'Import failed',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white w-full max-w-md rounded-md shadow">

      <div class="px-5 py-4 border-b font-semibold">
        Import Clients (Excel)
      </div>

      <div class="p-5 space-y-4 text-sm">
        <input
          type="file"
          accept=".xlsx"
          @change="onFileChange"
        />

        <p class="text-xs text-[#5E6C84]">
          Upload the Client Master Excel template.
        </p>
      </div>

      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="btn-secondary" @click="$emit('close')">
          Cancel
        </button>

        <button
          class="btn-primary"
          :disabled="!file || loading"
          @click="submit"
        >
          {{ loading ? 'Importing…' : 'Import' }}
        </button>
      </div>

    </div>
  </div>
</template>
