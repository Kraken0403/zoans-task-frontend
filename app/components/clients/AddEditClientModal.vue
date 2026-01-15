<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { createClient, updateClient } from '@/services/clients.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

const props = defineProps<{ client?: any | null }>()
const emit = defineEmits(['close', 'saved', 'notify'])


const isEdit = computed(() => !!props.client)
const loading = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

/* ===========================
   FORM STATE
=========================== */

const form = ref({
  code: '',
  name: '',
  email: '',
  phone: '',
  gstNumber: '',

  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
})

const resetForm = () => {
  form.value = {
    code: '',
    name: '',
    email: '',
    phone: '',
    gstNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
  }
}

/* ===========================
   PREFILL ON EDIT
=========================== */

watch(
  () => props.client,
  (c) => {
    resetForm()
    if (!c) return

    Object.assign(form.value, {
      code: c.code || '',
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      gstNumber: c.gstNumber || '',
      addressLine1: c.addressLine1 || '',
      addressLine2: c.addressLine2 || '',
      city: c.city || '',
      state: c.state || '',
      stateCode: c.stateCode || '',
      pincode: c.pincode || '',
    })
  },
  { immediate: true },
)

/* ===========================
   SUBMIT
=========================== */

const submit = async () => {
  if (!form.value.name.trim()) {
    snackbar.value = {
      show: true,
      message: 'Client name is required',
      type: 'error',
    }
    return
  }

  try {
    loading.value = true

    const payload = {
      code: form.value.code || undefined,
      name: form.value.name.trim(),
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      gstNumber: form.value.gstNumber || undefined,

      addressLine1: form.value.addressLine1 || undefined,
      addressLine2: form.value.addressLine2 || undefined,
      city: form.value.city || undefined,
      state: form.value.state || undefined,
      stateCode: form.value.stateCode || undefined,
      pincode: form.value.pincode || undefined,
    }

    if (isEdit.value && props.client?.id) {
      await updateClient(props.client.id, payload)
    } else {
      await createClient(payload)
    }

    emit('saved')
    emit('close')
    emit('notify', {
      message: isEdit.value
        ? 'Client updated successfully'
        : 'Client created successfully',
      type: 'success',
    })

    emit('saved')
    emit('close')

  } catch (e: any) {
    emit('notify', {
      message: e?.response?.data?.message || 'Failed to save client',
      type: 'error',
    })
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
      <!-- Header -->
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <div class="font-semibold text-[#172B4D]">
          {{ isEdit ? 'Edit Client' : 'Add Client' }}
        </div>
        <button class="text-[#6B778C]" @click="$emit('close')">✕</button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4 text-sm overflow-y-auto">
        <div>
          <label class="label">Client Code <span class="text-red-600">*</span></label>
          <input v-model="form.code" required class="input"/>
        </div>

        <div>
          <label class="label">
            Client Name <span class="text-red-600">*</span>
          </label>
          <input v-model="form.name" class="input" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Email</label>
            <input v-model="form.email" class="input" />
          </div>

          <div>
            <label class="label">Phone</label>
            <input v-model="form.phone" class="input" />
          </div>
        </div>

        <div>
          <label class="label">GST Number</label>
          <input v-model="form.gstNumber" class="input" />
        </div>

        <div>
          <label class="label">Address Line 1</label>
          <input v-model="form.addressLine1" class="input" />
        </div>

        <div>
          <label class="label">Address Line 2</label>
          <input v-model="form.addressLine2" class="input" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">City</label>
            <input v-model="form.city" class="input" />
          </div>

          <div>
            <label class="label">Pincode</label>
            <input v-model="form.pincode" class="input" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">State <span class="text-red-600">*</span></label>
            <input v-model="form.state" required class="input" />
          </div>


        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button class="btn-secondary" @click="$emit('close')">
          Cancel
        </button>

        <button
          class="btn-primary"
          :disabled="loading || !form.name.trim()"
          @click="submit"
        >
          {{ loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client' }}
        </button>
      </div>
    </div>

    <NotificationSnackbar
      v-bind="snackbar"
      @close="snackbar.show = false"
    />
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
