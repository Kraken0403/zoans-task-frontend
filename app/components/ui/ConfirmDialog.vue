<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  message: string
}>()

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="bg-white w-full max-w-sm rounded-lg shadow-lg p-5">
      <h3 class="font-semibold mb-2">
        {{ title || 'Confirm action' }}
      </h3>
      <p class="text-sm text-gray-600 mb-5">
        {{ message }}
      </p>

      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 text-sm rounded border hover:bg-gray-100"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
          @click="emit('confirm')"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
