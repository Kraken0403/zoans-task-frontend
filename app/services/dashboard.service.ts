// services/dashboard.service.ts

/* ===========================
   📊 GET DASHBOARD SUMMARY
=========================== */
export const getDashboardSummary = () => {
    const { $api } = useNuxtApp()
    return $api.get('/dashboard/summary')
  }
  
  /* ===========================
     🔥 OPTIONAL: REFRESH DATA
     (If you later want manual refresh)
  =========================== */
  export const refreshDashboardSummary = () => {
    const { $api } = useNuxtApp()
    return $api.get('/dashboard/summary', {
      params: { refresh: true },
    })
  }
  