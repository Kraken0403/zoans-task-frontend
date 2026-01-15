<template>
    <div class="flex h-screen">
      <Sidebar v-if="sidebarOpen" />
  
      <div class="flex-1 flex flex-col">
        <TopBar
          :title="pageTitle"
          :showBack="showBack"
          @toggle-sidebar="sidebarOpen = !sidebarOpen"
        />
  
        <main class="flex-1 overflow-auto">
          <slot />
        </main>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import TopBar from '@/components/layout/TopBar.vue'
  import Sidebar from '@/components/layout/Sidebar.vue'
  const sidebarOpen = ref(true)
  
  // You can compute these per page
  const pageTitle = 'Tasks'
  const showBack = false
  </script>
  