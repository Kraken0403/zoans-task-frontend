<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Props
 * - title: page title to show in topbar
 * - showBack: whether to show back button (internal pages)
 */
const props = defineProps<{
  title: string
  showBack?: boolean
}>()

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()

/* ================= USER DROPDOWN ================= */

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

// TODO: replace with real user data later
const user = {
  name: 'Admin User',
  email: 'admin@example.com',
  avatar: null, // or image URL
}

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

const goBack = () => {
  router.back()
}

const goToSettings = () => {
  showUserMenu.value = false
  router.push('/settings')
}

const goToProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}

const logout = () => {
  showUserMenu.value = false
  // TODO: hook auth logout
  router.push('/login')
}
</script>

<template>
  <header
    class="h-14 bg-white border-b flex items-center justify-between px-6"
  >
    <!-- ================= LEFT ================= -->
    <div class="flex items-center gap-3">
      <!-- Hamburger -->
      <button
        class="text-[#5E6C84] hover:text-[#172B4D]"
        @click="$emit('toggle-sidebar')"
      >
        <Icon name="mdi:menu" size="22" />
      </button>

      <!-- Back button (internal pages only) -->
      <button
        v-if="showBack"
        class="text-[#5E6C84] hover:text-[#172B4D]"
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
      <!-- User avatar -->
      <button
        class="flex items-center gap-2"
        @click.stop="toggleUserMenu"
      >
        <div
          class="h-8 w-8 rounded-full bg-[#0052CC]
                 flex items-center justify-center
                 text-white text-sm font-semibold"
        >
          {{ user.name.charAt(0).toUpperCase() }}
        </div>
      </button>

      <!-- Dropdown -->
      <div
        v-if="showUserMenu"
        class="absolute right-0 mt-2 w-48 bg-white
               border border-[#DFE1E6] rounded-md shadow-lg z-20"
      >
        <div class="px-4 py-3 border-b">
          <div class="text-sm font-medium text-[#172B4D]">
            {{ user.name }}
          </div>
          <div class="text-xs text-[#5E6C84]">
            {{ user.email }}
          </div>
        </div>

        <button
          class="w-full text-left px-4 py-2 text-sm
                 hover:bg-[#F4F5F7]"
          @click="goToProfile"
        >
          Profile
        </button>

        <button
          class="w-full text-left px-4 py-2 text-sm
                 hover:bg-[#F4F5F7]"
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
