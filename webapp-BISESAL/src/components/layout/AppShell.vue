<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DatabaseConfig from '../config/DatabaseConfig.vue'

const isDark = ref(false)
let mediaQuery: MediaQueryList | null = null

const applyTheme = (value: boolean) => {
  const root = document.documentElement
  root.classList.toggle('dark', value)
  localStorage.setItem('theme', value ? 'dark' : 'light')
}

onMounted(() => {
  const stored = localStorage.getItem('theme')

  if (stored === 'dark') {
    isDark.value = true
  } else if (stored === 'light') {
    isDark.value = false
  } else {
    isDark.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  }

  applyTheme(isDark.value)

  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null
  if (mediaQuery) {
    const handler = (event: MediaQueryListEvent) => {
      const storedPreference = localStorage.getItem('theme')
      if (storedPreference === 'dark' || storedPreference === 'light') return
      isDark.value = event.matches
    }
    mediaQuery.addEventListener('change', handler)
    mediaQueryHandler = handler
  }
})

watch(isDark, (value) => {
  applyTheme(value)
})

const toggleTheme = () => {
  isDark.value = !isDark.value
}

let mediaQueryHandler: ((event: MediaQueryListEvent) => void) | null = null

onBeforeUnmount(() => {
  if (mediaQuery && mediaQueryHandler) {
    mediaQuery.removeEventListener('change', mediaQueryHandler)
  }
})

const themeLabel = computed(() => (isDark.value ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'))

const openConfig = () => {
  // Funcionalidad de configuración general
  alert('Configuración general próximamente disponible')
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col gap-8 px-6 pt-6 pb-12 transition-colors duration-300 md:px-10 lg:px-12"
  >
    <header
      class="flex flex-col gap-6 rounded-card border border-border bg-surface px-6 py-6 shadow-shell transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1
          class="text-3xl font-semibold uppercase tracking-[0.18em] text-brand-dark transition-colors duration-300 dark:text-brand-light"
        >
          BI SESAL
        </h1>
        <p class="mt-1 text-base text-text-secondary transition-colors duration-300 dark:text-text-muted">
          Panel analítico institucional
        </p>
      </div>
      <div class="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:gap-6">
        <!-- Configuración de Base de Datos -->
        <DatabaseConfig />
        
        <button
          class="flex items-center justify-center size-10 self-start rounded-full border border-border bg-surface text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
          type="button"
          aria-label="Configuración General"
          @click="openConfig"
        >
          <span
            aria-hidden="true"
            class="text-lg text-brand-dark transition-colors duration-200 dark:text-brand-light"
          >
            ⚙️
          </span>
        </button>

        <button
          class="flex items-center gap-2 self-start rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
          type="button"
          :aria-pressed="isDark"
          :aria-label="themeLabel"
          @click="toggleTheme"
        >
          <span
            aria-hidden="true"
            class="flex size-5 items-center justify-center rounded-full bg-brand-base/20 text-base text-brand-dark transition-colors duration-200 dark:bg-brand-base/40 dark:text-brand-light"
          >
            {{ isDark ? '🌙' : '☀️' }}
          </span>
          <span class="hidden sm:inline">{{ isDark ? 'Modo oscuro' : 'Modo claro' }}</span>
          <span class="sm:hidden">{{ isDark ? 'Oscuro' : 'Claro' }}</span>
        </button>
      </div>
    </header>

    <main class="flex flex-1 flex-col gap-6">
      <slot />
    </main>
  </div>
</template>
