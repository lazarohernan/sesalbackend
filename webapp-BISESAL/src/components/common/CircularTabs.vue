<script setup lang="ts">
interface Tab {
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{
    tabs: Tab[]
    activeTab: string
  }>(),
  {
    tabs: () => [],
    activeTab: ''
  }
)

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
}>()

const selectTab = (tabId: string) => {
  emit('update:activeTab', tabId)
}

const isActive = (tabId: string) => props.activeTab === tabId
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="relative flex items-center justify-center rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-base/50"
      :class="[
        isActive(tab.id)
          ? 'border-brand-base bg-brand-base text-white shadow-lg shadow-brand-base/25'
          : 'border-border bg-surface text-text-primary hover:border-brand-base/50 hover:bg-brand-base/5 dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted dark:hover:bg-brand-base/10'
      ]"
      @click="selectTab(tab.id)"
    >
      <!-- Indicador de pestaña activa -->
      <div
        v-if="isActive(tab.id)"
        class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white shadow-sm"
      >
        <div class="h-full w-full rounded-full bg-brand-base"></div>
      </div>

      <span class="relative z-10">{{ tab.label }}</span>
    </button>
  </div>
</template>



