<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  createClientGroup,
  updateClientGroup,
} from '@/services/clients-groups.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

const props = defineProps<{ group?: any | null }>()
const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.group)
const loading = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

const form = ref({
  name: '',
  code: '',
})

watch(
  () => props.group,
  g => {
    form.value = {
      name: g?.name || '',
      code: g?.code || '',
    }
  },
  { immediate: true },
)

const submit = async () => {
  try {
    if (!form.value.name.trim()) {
      snackbar.value = { show: true, message: 'Name is required', type: 'error' }
      return
    }
    if (!form.value.code.trim()) {
      snackbar.value = { show: true, message: 'Code is required', type: 'error' }
      return
    }

    loading.value = true

    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim().toUpperCase(),
    }

    if (isEdit.value) {
      await updateClientGroup(props.group.id, payload)
    } else {
      await createClientGroup(payload)
    }

    emit('saved')
    emit('close')
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      (Array.isArray(e?.response?.data?.message)
        ? e.response.data.message.join(', ')
        : null) ||
      'Failed to save group'
    snackbar.value = { show: true, message: msg, type: 'error' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white w-full max-w-[520px] rounded-md shadow-lg overflow-hidden">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <div class="font-semibold text-[#172B4D]">
          {{ isEdit ? 'Edit Client Group' : 'Add Client Group' }}
        </div>
        <button class="text-[#6B778C]" @click="$emit('close')">✕</button>
      </div>

      <div class="p-6 space-y-4 text-sm">
        <div>
          <label class="label">Group Name *</label>
          <input v-model="form.name" class="input" placeholder="e.g. Jain Clients" />
        </div>

        <div>
          <label class="label">Group Code *</label>
          <input v-model="form.code" class="input" placeholder="e.g. JAIN" />
          <p class="text-xs text-[#6B778C] mt-1">
            Unique short code. Used in Excel import.
          </p>
        </div>
      </div>

      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Saving…' : isEdit ? 'Save' : 'Create' }}
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
}
.btn-secondary {
  border: 1px solid #dfe1e6;
  padding: 10px 16px;
  border-radius: 6px;
  background: white;
}
</style>
