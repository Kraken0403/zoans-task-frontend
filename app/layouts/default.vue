<template>
  <div class="flex h-screen overflow-hidden">
    
    <!-- Sidebar -->
    <Sidebar
      v-if="sidebarOpen"
      class="w-64 shrink-0"
    />

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      
      <Topbar
        class="shrink-0"
        :title="pageTitle"
        :showBack="showBack"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />

      <main class="flex-1 overflow-auto bg-gray-50">
        <slot />
      </main>

    </div>

  </div>
</template>

  
  <script setup>
  import { ref } from 'vue'
  import Topbar from '@/components/layout/Topbar.vue'
  import Sidebar from '@/components/layout/Sidebar.vue'
  const sidebarOpen = ref(true)
  
  // You can compute these per page
  const pageTitle = 'Tasks'
  const showBack = false
  </script>
  