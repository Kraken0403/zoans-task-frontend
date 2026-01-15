<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/services/auth.service'
import NotificationSnackbar from '@/components/ui/NotificationSnackbar.vue'

definePageMeta({
  layout: false,
})

const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

const showError = ref(false)
const errorMessage = ref('')

const submit = async () => {
  loading.value = true
  showError.value = false

  try {
    const res = await login(email.value, password.value)
    auth.setAuth(res)
    navigateTo('/')
  } catch (e: any) {
    errorMessage.value =
      e?.response?.data?.message || 'Invalid email or password'
    showError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
    <div class="w-full max-w-md bg-white border border-[#DFE1E6] rounded-md p-6">
      <h1 class="text-[18px] font-semibold text-[#172B4D] mb-6 text-center">
        Sign in to Zoans
      </h1>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-[#5E6C84] mb-1">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border border-[#DFE1E6] rounded-md px-3 py-2
                   text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-[#5E6C84] mb-1">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full border border-[#DFE1E6] rounded-md px-3 py-2
                   text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#0052CC] text-white text-sm font-medium
                 py-2 rounded-md hover:bg-[#0747A6]
                 transition disabled:opacity-60"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>

    <!-- Error Snackbar -->
    <NotificationSnackbar
      :show="showError"
      :message="errorMessage"
      type="error"
      @close="showError = false"
    />
  </div>
</template>
