<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import {
  createMyCompany,
  updateMyCompany,
  uploadCompanySeal,
  uploadCompanySignature,
  uploadCompanyLogo
} from '@/services/my-companies.service'
import { INDIAN_STATES } from '@/constants/states'

const props = defineProps<{ company?: any | null }>()
const emit = defineEmits(['close', 'saved', 'notify'])
const config = useRuntimeConfig()

/* ================= FORM ================= */

const form = ref({
  code: '',
  name: '',
  gstin: '',
  pan: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  phone: '',
  email: '',
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
  bankBranch: '',
  tagline: '',
  upiId: '',
  msmeNumber: '',
  msmeCategory: '',
  logoUrl: ''
})

/* ================= STATE CODE AUTO-FILL ================= */

watch(
  () => form.value.state,
  (selectedState) => {
    const found = INDIAN_STATES.find(s => s.name === selectedState)
    form.value.stateCode = found?.code || ''
  }
)

/* ================= FILE HANDLING ================= */

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

const sealFile = ref<File | null>(null)
const signatureFile = ref<File | null>(null)
const logoFile = ref<File | null>(null)

const sealPreview = ref<string | null>(null)
const signaturePreview = ref<string | null>(null)
const logoPreview = ref<string | null>(null)

const validateImage = (file: File) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    emit('notify', { type: 'error', message: 'Only PNG/JPG allowed' })
    return false
  }
  if (file.size > MAX_FILE_SIZE) {
    emit('notify', { type: 'error', message: 'Max size 2MB' })
    return false
  }
  return true
}

const handleFileChange = (
  e: Event,
  fileRef: any,
  previewRef: any
) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]
  if (!file) return

  if (!validateImage(file)) {
    ;(e.target as HTMLInputElement).value = ''
    fileRef.value = null
    previewRef.value = null
    return
  }

  fileRef.value = file
}

watch(sealFile, (file) => {
  if (!file) return
  if (sealPreview.value?.startsWith('blob:'))
    URL.revokeObjectURL(sealPreview.value)
  sealPreview.value = URL.createObjectURL(file)
})

watch(signatureFile, (file) => {
  if (!file) return
  if (signaturePreview.value?.startsWith('blob:'))
    URL.revokeObjectURL(signaturePreview.value)
  signaturePreview.value = URL.createObjectURL(file)
})

watch(logoFile, (file) => {
  if (!file) return
  if (logoPreview.value?.startsWith('blob:'))
    URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(file)
})

/* ================= EDIT PREFILL ================= */

watch(
  () => props.company,
  (c) => {
    sealFile.value = null
    signatureFile.value = null
    logoFile.value = null

    if (!c) return

    Object.assign(form.value, c)

    sealPreview.value = c.sealUrl
      ? `${config.public.apiBase}${c.sealUrl}`
      : null

    signaturePreview.value = c.signatureUrl
      ? `${config.public.apiBase}${c.signatureUrl}`
      : null

    logoPreview.value = c.logoUrl
      ? `${config.public.apiBase}${c.logoUrl}`
      : null
  },
  { immediate: true }
)

/* ================= SUBMIT ================= */

const submit = async () => {
  try {
    let companyId = props.company?.id

    if (companyId) {
      await updateMyCompany(companyId, form.value)
    } else {
      const res = await createMyCompany(form.value)
      companyId = res.id
    }

    if (sealFile.value && companyId)
      await uploadCompanySeal(companyId, sealFile.value)

    if (signatureFile.value && companyId)
      await uploadCompanySignature(companyId, signatureFile.value)

    if (logoFile.value && companyId)
      await uploadCompanyLogo(companyId, logoFile.value)

    emit('notify', { message: 'Company saved', type: 'success' })
    emit('saved')
    emit('close')
  } catch {
    emit('notify', {
      message: 'Something went wrong',
      type: 'error'
    })
  }
}

onBeforeUnmount(() => {
  if (sealPreview.value?.startsWith('blob:'))
    URL.revokeObjectURL(sealPreview.value)
  if (signaturePreview.value?.startsWith('blob:'))
    URL.revokeObjectURL(signaturePreview.value)
})
</script>

<template>
  <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white w-full max-w-xl rounded-md shadow-lg flex flex-col overflow-hidden"
         style="max-height: 90vh">

      <div class="px-5 py-4 border-b font-medium">
        {{ company ? 'Edit Company' : 'Add Company' }}
      </div>

      <div class="p-5 grid grid-cols-2 gap-4 text-sm overflow-y-auto">

        <div>
          <label class="block mb-1">Company Code *</label>
          <input v-model="form.code" class="input uppercase" />
        </div>

        <div>
          <label class="block mb-1">Company Name *</label>
          <input v-model="form.name" class="input" />
        </div>

        <div class="col-span-2">
          <label class="block mb-1">Tagline</label>
          <input v-model="form.tagline" class="input" />
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
          <label class="block mb-1">MSME Number</label>
          <input v-model="form.msmeNumber" class="input" />
        </div>

        <div>
          <label class="block mb-1">MSME Category</label>
          <select v-model="form.msmeCategory" class="input">
            <option value="">Select</option>
            <option>Micro</option>
            <option>Small</option>
            <option>Medium</option>
          </select>
        </div>

        <div>
          <label class="block mb-1">Phone</label>
          <input v-model="form.phone" class="input" />
        </div>

        <div>
          <label class="block mb-1">Email</label>
          <input v-model="form.email" class="input" />
        </div>

        <!-- City -->
        <div>
          <label class="block mb-1">City</label>
          <input v-model="form.city" class="input" />
        </div>

        <!-- State -->
        <div>
          <label class="block mb-1">State *</label>
          <select v-model="form.state" class="input">
            <option value="">Select State</option>
            <option
              v-for="s in INDIAN_STATES"
              :key="s.code"
              :value="s.name"
            >
              {{ s.name }}
            </option>
          </select>
        </div>

        <!-- State Code -->
        <div>
          <label class="block mb-1">State Code</label>
          <input
            v-model="form.stateCode"
            class="input bg-gray-100 cursor-not-allowed"
            disabled
          />
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

        <div class="col-span-2">
          <label class="block mb-1">Account Holder Name</label>
          <input v-model="form.bankName" class="input" />
        </div>

        <div>
          <label class="block mb-1">Account Number</label>
          <input v-model="form.bankAccount" class="input" />
        </div>

        <div>
          <label class="block mb-1">UPI ID</label>
          <input v-model="form.upiId" class="input" />
        </div>

        <div>
          <label class="block mb-1">IFSC</label>
          <input v-model="form.bankIfsc" class="input" />
        </div>

        <div>
          <label class="block mb-1">Bank Branch</label>
          <input v-model="form.bankBranch" class="input" />
        </div>

        <!-- Logo -->
        <div class="col-span-2">
          <label class="block mb-1">Company Logo</label>
          <input type="file" class="input"
                 @change="(e)=>handleFileChange(e, logoFile, logoPreview)" />
          <img v-if="logoPreview" :src="logoPreview" class="h-16 mt-2 border rounded" />
        </div>

        <!-- Seal -->
        <div class="col-span-2">
          <label class="block mb-1">Company Seal</label>
          <input type="file" class="input"
                 @change="(e)=>handleFileChange(e, sealFile, sealPreview)" />
          <img v-if="sealPreview" :src="sealPreview" class="h-20 mt-2 border rounded" />
        </div>

        <!-- Signature -->
        <div class="col-span-2">
          <label class="block mb-1">Company Signature</label>
          <input type="file" class="input"
                 @change="(e)=>handleFileChange(e, signatureFile, signaturePreview)" />
          <img v-if="signaturePreview" :src="signaturePreview" class="h-16 mt-2 border rounded" />
        </div>

      </div>

      <div class="px-5 py-4 border-t flex justify-end gap-2 bg-[#FAFBFC]">
        <button class="border px-4 py-2 rounded-md text-sm"
                @click="$emit('close')">
          Cancel
        </button>
        <button class="bg-[#0052CC] text-white px-4 py-2 rounded-md text-sm"
                @click="submit">
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