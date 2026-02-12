// services/task-categories.service.ts

export const getTaskCategories = () => {
    const { $api } = useNuxtApp()
    return $api.get('/task-categories')
  }
  