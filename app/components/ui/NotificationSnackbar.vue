<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  show: boolean
  message: string
  type?: 'success' | 'error' | 'info'
}>()

const emit = defineEmits(['close'])

const bgClass = computed(() => {
  if (props.type === 'success') return 'bg-green-600'
  if (props.type === 'error') return 'bg-red-600'
  return 'bg-gray-800'
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg text-white text-sm flex items-center gap-3"
      :class="bgClass"
    >
      <span>{{ message }}</span>
      <button class="text-white/80 hover:text-white" @click="emit('close')">
        ✕
      </button>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
