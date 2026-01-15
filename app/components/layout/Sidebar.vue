<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'
import NotificationSnackbar from '~/components/ui/NotificationSnackbar.vue'

const auth = useAuthStore()

const showConfirm = ref(false)
const showSnackbar = ref(false)

const logout = () => {
  showConfirm.value = false
  auth.logout()
  showSnackbar.value = true
}
</script>

<template>
  <aside class="w-64 bg-[#F4F5F7] border-r border-[#DFE1E6] flex flex-col">
    <!-- Brand -->
    <div class="px-4 py-3 text-[15px] font-semibold text-[#0052CC] border-b border-[#DFE1E6]">
      Zoans Tasks
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-3 space-y-1">
      <NuxtLink
        to="/"
        class="nav-item"
        active-class="nav-item-active"
      >
        <Icon name="mdi:view-dashboard-outline" size="20" />
        <span>Dashboard</span>
      </NuxtLink>

      <NuxtLink
        to="/clients"
        class="nav-item"
        active-class="nav-item-active"
        >
        <Icon name="mdi:account-multiple-outline" size="20" />
        <span>Clients</span>
        </NuxtLink>


      <NuxtLink
        to="/tasks"
        class="nav-item"
        active-class="nav-item-active"
      >
        <Icon name="mdi:clipboard-text-outline" size="20" />
        <span>Tasks</span>
      </NuxtLink>

      <NuxtLink
        to="/me"
        class="nav-item"
        active-class="nav-item-active"
      >
        <Icon name="mdi:account-outline" size="20" />
        <span>My Tasks</span>
      </NuxtLink>

      <NuxtLink
        to="/my-companies"
        class="nav-item"
        active-class="nav-item-active"
      >
        <Icon name="mdi:settings-outline" size="20" />
        <span>My Companies</span>
      </NuxtLink>
      
      <NuxtLink
        to="/invoices"
        class="nav-item"
        active-class="nav-item-active"
      >
        <Icon name="mdi:file-document-outline" size="20" />
        <span>Invoices</span>
      </NuxtLink>
    </nav>

    <!-- Logout -->
    <button
      class="nav-item border-t border-[#DFE1E6]"
      @click="showConfirm = true"
    >
      <Icon name="mdi:logout" size="20" />
      <span>Logout</span>
    </button>

    <!-- Confirm dialog -->
    <ConfirmDialog
      :show="showConfirm"
      title="Log out?"
      message="You will be logged out of the system."
      @cancel="showConfirm = false"
      @confirm="logout"
    />

    <!-- Snackbar -->
    <NotificationSnackbar
      :show="showSnackbar"
      message="Logged out successfully"
      type="info"
      @close="showSnackbar = false"
    />
  </aside>
</template>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #172B4D;
  transition: background-color 0.15s ease;
}

.nav-item:hover {
  background-color: #EBECF0;
}

.nav-item-active {
  background-color: #DEEBFF;
  font-weight: 500;
}
</style>
