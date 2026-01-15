// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-07-15',

  app: {
    head: {
      titleTemplate: '%s · Zoans Task Management',
    }
  },

  css: [
    '@/assets/css/tailwind.css',
  ],

  modules: [
    '@nuxt/icon', '@pinia/nuxt'
  ],

  /* ---------------- ICON ---------------- */
  icon: {
    serverBundle: {
      collections: ['uil', 'mdi'],
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:9000', // backend
    },
  },

  /* ---------------- DEVTOOLS ---------------- */
  devtools: { enabled: true },
} as any)
