/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

export {}

declare module 'vue-router' {
  interface RouteMeta {
    guest?: boolean
    nav?: boolean
    role?: 'COOKER' | 'EATER'
  }
}
