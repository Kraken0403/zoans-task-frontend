<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/* ================= EMITS ================= */
const emit = defineEmits(['toggle-sidebar'])

/* ================= ROUTER ================= */
const router = useRouter()
const route = useRoute()

/* ================= AUTH ================= */
const authStore = useAuthStore()

// Safe user handling (prevents undefined crash)
const user = computed(() => authStore.user || null)

const userInitial = computed(() => {
  if (!user.value?.name) return 'A'
  return user.value.name.charAt(0).toUpperCase()
})

/* ================= TITLE ================= */

// 1️⃣ Use route meta title if available
// 2️⃣ Otherwise generate from route path
const title = computed(() => {
  if (route.meta?.title) return String(route.meta.title)

  const segment = route.path.split('/')[1]
  if (!segment) return 'Dashboard'

  return segment.charAt(0).toUpperCase() + segment.slice(1)
})

/* ================= BACK BUTTON ================= */

// Show back button if route depth > 1
const showBack = computed(() => {
  return route.path.split('/').filter(Boolean).length > 1
})

/* ================= USER DROPDOWN ================= */

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeOnOutsideClick = (e: MouseEvent) => {
  if (
    userMenuRef.value &&
    !userMenuRef.value.contains(e.target as Node)
  ) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeOnOutsideClick)
})

/* ================= ACTIONS ================= */

const goBack = () => router.back()

const goToSettings = () => {
  showUserMenu.value = false
  router.push('/settings')
}

const goToProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}

const logout = async () => {
  showUserMenu.value = false

  // If your auth store has logout method
  if (authStore.logout) {
    await authStore.logout()
  }

  router.push('/login')
}
</script>

<template>
  <header
    class="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0"
  >
    <!-- ================= LEFT ================= -->
    <div class="flex items-center gap-3 justify-center">
      <!-- Hamburger -->
      <button
        class="text-[#5E6C84] flex items-center hover:text-[#172B4D]"
        @click="emit('toggle-sidebar')"
      >
        <Icon name="mdi:menu" size="22" />
      </button>

      <!-- Back button -->
      <button
        v-if="showBack"
        class="text-[#5E6C84] flex items-center hover:text-[#172B4D]"
        @click="goBack"
      >
        <Icon name="mdi:arrow-left" size="22" />
      </button>

      <!-- Page title -->
      <h1 class="font-semibold text-[#172B4D] text-sm">
        {{ title }}
      </h1>
    </div>

    <!-- ================= RIGHT ================= -->
    <div class="relative" ref="userMenuRef">
      <!-- Avatar -->
      <button
        class="flex items-center gap-2"
        @click.stop="toggleUserMenu"
      >
        <div
          class="h-8 w-8 rounded-full bg-[#0052CC]
                 flex items-center justify-center
                 text-white text-sm font-semibold"
        >
          {{ userInitial }}
        </div>
      </button>

      <!-- Dropdown -->
      <div
        v-if="showUserMenu"
        class="absolute right-0 mt-2 w-52 bg-white
               border border-[#DFE1E6] rounded-md shadow-lg z-50"
      >
        <div class="px-4 py-3 border-b">
          <div class="text-sm font-medium text-[#172B4D]">
            {{ user?.name || 'User' }}
          </div>
          <div class="text-xs text-[#5E6C84]">
            {{ user?.email || '' }}
          </div>
        </div>

        <button
          class="w-full text-left px-4 py-2 text-sm hover:bg-[#F4F5F7]"
          @click="goToProfile"
        >
          Profile
        </button>

        <button
          class="w-full text-left px-4 py-2 text-sm hover:bg-[#F4F5F7]"
          @click="goToSettings"
        >
          Settings
        </button>

        <div class="border-t" />

        <button
          class="w-full text-left px-4 py-2 text-sm
                 text-red-600 hover:bg-[#FDECEA]"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
