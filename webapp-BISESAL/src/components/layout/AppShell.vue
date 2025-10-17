<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EmbedCode from '../config/EmbedCode.vue'
import DatabaseStatus from '../config/DatabaseStatus.vue'

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
</script>

<template>
  <div
    class="min-h-screen flex flex-col gap-8 px-6 pb-12 transition-colors duration-300 md:px-10 lg:px-12 overflow-hidden"
  >
    <header
      class="flex flex-col gap-6 rounded-card border border-border bg-surface px-6 py-6 shadow-shell transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1
          class="text-3xl font-semibold uppercase tracking-[0.18em] text-primary transition-colors duration-300 dark:text-text-inverted"
        >
          SESAL
        </h1>
        <p class="mt-1 text-base text-text-secondary transition-colors duration-300 dark:text-text-muted">
          Panel analítico institucional
        </p>
      </div>
      <div class="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:gap-6">
        <!-- Estado de Base de Datos -->
        <DatabaseStatus />
        
        <!-- Código de Embedding -->
        <EmbedCode />

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
            <!-- Icono de luna para modo oscuro -->
            <svg v-if="isDark" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <!-- Icono de sol para modo claro -->
            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </span>
          <span class="hidden sm:inline">{{ isDark ? 'Modo oscuro' : 'Modo claro' }}</span>
          <span class="sm:hidden">{{ isDark ? 'Oscuro' : 'Claro' }}</span>
        </button>
      </div>
    </header>

    <main class="flex flex-1 flex-col gap-6 min-w-0">
      <slot />
    </main>
  </div>
</template>
