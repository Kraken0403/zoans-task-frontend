<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import {
  createMyCompany,
  updateMyCompany,
  uploadCompanySeal,
  uploadCompanySignature,
} from '@/services/my-companies.service'

const props = defineProps<{ company?: any | null }>()
const emit = defineEmits(['close', 'saved', 'notify'])

const config = useRuntimeConfig()

const form = ref({
  name: '',
  gstin: '',
  pan: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
})

const sealFile = ref<File | null>(null)
const signatureFile = ref<File | null>(null)

const sealPreview = ref<string | null>(null)
const signaturePreview = ref<string | null>(null)

/* ===========================
   FILE HANDLERS
=========================== */

const onSealChange = (e: Event) => {
  sealFile.value =
    (e.target as HTMLInputElement)?.files?.[0] || null
}

const onSignatureChange = (e: Event) => {
  signatureFile.value =
    (e.target as HTMLInputElement)?.files?.[0] || null
}

/* ===========================
   LIVE PREVIEWS
=========================== */

watch(sealFile, (file) => {
  if (!file) return
  if (sealPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(sealPreview.value)
  }
  sealPreview.value = URL.createObjectURL(file)
})

watch(signatureFile, (file) => {
  if (!file) return
  if (signaturePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(signaturePreview.value)
  }
  signaturePreview.value = URL.createObjectURL(file)
})

/* ===========================
   PREFILL ON EDIT
=========================== */

watch(
  () => props.company,
  (c) => {
    sealFile.value = null
    signatureFile.value = null
    sealPreview.value = null
    signaturePreview.value = null

    if (!c) return

    Object.assign(form.value, c)

    sealPreview.value = c.sealUrl
      ? `${config.public.apiBase}${c.sealUrl}`
      : null

    signaturePreview.value = c.signatureUrl
      ? `${config.public.apiBase}${c.signatureUrl}`
      : null
  },
  { immediate: true },
)

/* ===========================
   SUBMIT
=========================== */

const submit = async () => {
  try {
    emit('notify', { message: 'Saving company...', type: 'info' })

    let companyId = props.company?.id

    if (companyId) {
      await updateMyCompany(companyId, form.value)
    } else {
      const res = await createMyCompany(form.value)
      companyId = res.id
    }

    if (sealFile.value && companyId) {
      emit('notify', { message: 'Uploading company seal...', type: 'info' })
      await uploadCompanySeal(companyId, sealFile.value)
    }

    if (signatureFile.value && companyId) {
      emit('notify', { message: 'Uploading signature...', type: 'info' })
      await uploadCompanySignature(companyId, signatureFile.value)
    }

    emit('notify', {
      message: 'Company saved successfully',
      type: 'success',
    })

    emit('saved')
    emit('close')
  } catch {
    emit('notify', {
      message: 'Something went wrong. Please try again.',
      type: 'error',
    })
  }
}

/* ===========================
   CLEANUP
=========================== */

onBeforeUnmount(() => {
  if (sealPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(sealPreview.value)
  }
  if (signaturePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(signaturePreview.value)
  }
})
</script>

<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div
      class="bg-white w-full max-w-xl rounded-md shadow-lg
             flex flex-col overflow-hidden"
      style="max-height: 90vh"
    >
      <!-- Header (FIXED) -->
      <div class="px-5 py-4 border-b font-medium">
        {{ company ? 'Edit Company' : 'Add Company' }}
      </div>

      <!-- Body (SCROLLABLE) -->
      <div class="p-5 grid grid-cols-2 gap-4 text-sm overflow-y-auto">
        <div>
          <label class="block mb-1">Company Name *</label>
          <input v-model="form.name" class="input" />
        </div>

        <div>
          <label class="block mb-1">GSTIN</label>
          <input v-model="form.gstin" class="input" />
        </div>

        <div>
          <label class="block mb-1">PAN</label>
          <input v-model="form.pan" class="input" />
        </div>

        <div>
          <label class="block mb-1">Phone</label>
          <input v-model="form.phone" class="input" />
        </div>

        <div>
          <label class="block mb-1">Email</label>
          <input v-model="form.email" class="input" />
        </div>

        <div>
          <label class="block mb-1">City</label>
          <input v-model="form.city" class="input" />
        </div>

        <div>
          <label class="block mb-1">State</label>
          <input v-model="form.state" class="input" />
        </div>

        <div>
          <label class="block mb-1">Pincode</label>
          <input v-model="form.pincode" class="input" />
        </div>

        <div class="col-span-2">
          <label class="block mb-1">Address Line 1</label>
          <input v-model="form.addressLine1" class="input" />
        </div>

        <div class="col-span-2">
          <label class="block mb-1">Address Line 2</label>
          <input v-model="form.addressLine2" class="input" />
        </div>

        <div>
          <label class="block mb-1">Account Holder's Name</label>
          <input v-model="form.bankName" class="input" />
        </div>

        <div>
          <label class="block mb-1">Account Number</label>
          <input v-model="form.bankAccount" class="input" />
        </div>

        <div>
          <label class="block mb-1">IFSC</label>
          <input v-model="form.bankIfsc" class="input" />
        </div>

        <!-- Seal -->
        <div class="col-span-2" v-if="company?.id">
          <label class="block mb-1">Company Seal</label>
          <input type="file" accept="image/*" class="input" @change="onSealChange" />
          <img
            v-if="sealPreview"
            :src="sealPreview"
            class="h-20 mt-2 border rounded"
          />
        </div>

        <!-- Signature -->
        <div class="col-span-2" v-if="company?.id">
          <label class="block mb-1">Company Signature</label>
          <input
            type="file"
            accept="image/*"
            class="input"
            @change="onSignatureChange"
          />
          <img
            v-if="signaturePreview"
            :src="signaturePreview"
            class="h-16 mt-2 border rounded"
          />
        </div>
      </div>

      <!-- Footer (FIXED) -->
      <div class="px-5 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button
          class="border px-4 py-2 rounded-md text-sm"
          @click="$emit('close')"
        >
          Cancel
        </button>

        <button
          class="bg-[#0052CC] text-white px-4 py-2 rounded-md text-sm"
          @click="submit"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #DFE1E6;
  border-radius: 4px;
}
</style>
