import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface UsePaginationOptions {
  totalItems: () => number
  pageSize?: number
  resetDeps?: any[]   // search, filters etc
}

export function usePagination(options: UsePaginationOptions) {
  const route = useRoute()
  const router = useRouter()

  const pageSize = options.pageSize || 10

  // 🔥 URL = source of truth
  const currentPage = computed({
    get: () => Number(route.query.page) || 1,
    set: (page: number) => {
      router.push({
        query: { ...route.query, page }
      })
    }
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(options.totalItems() / pageSize))
  )

  const startIndex = computed(() =>
    (currentPage.value - 1) * pageSize
  )

  const endIndex = computed(() =>
    startIndex.value + pageSize
  )

  // 🔥 Prevent invalid page
  watch(totalPages, (tp) => {
    if (currentPage.value > tp) {
      currentPage.value = tp
    }
  })

  // 🔥 Reset page when filters/search change
  if (options.resetDeps?.length) {
    watch(options.resetDeps, () => {
      currentPage.value = 1
    })
  }

  return {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex
  }
}