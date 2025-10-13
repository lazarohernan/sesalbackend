import type { ComputedRef, Ref } from 'vue'
import { computed, inject, provide } from 'vue'

const apiBaseSymbol = Symbol('apiBase')

export const provideApiBase = (valor: Ref<string> | ComputedRef<string>) => {
  provide(apiBaseSymbol, valor)
}

export const useApiBase = (fallback?: string) => {
  const referencia = inject<Ref<string> | ComputedRef<string>>(apiBaseSymbol)
  return computed(() => {
    if (referencia) {
      return referencia.value
    }
    if (fallback) {
      return fallback
    }
    try {
      return window.location.origin
    } catch (_error) {
      return 'http://localhost:4000'
    }
  })
}
