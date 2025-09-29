<template>
  <div class="relative">
    <button
      type="button"
      @click="toggle"
      class="w-full flex items-center justify-between px-4 py-2 border border-border bg-surface text-text-primary placeholder-text-muted rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-base/50 focus:border-brand-base transition-colors duration-200 dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted dark:placeholder-text-muted"
    >
      <span class="truncate">{{ selectedLabel || placeholder }}</span>
      <svg
        class="w-5 h-5 text-text-secondary transition-transform duration-200 dark:text-text-muted"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-show="isOpen"
      class="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-60 overflow-auto dark:border-border-dark dark:bg-surface-dark"
      @click.stop
    >
      <ul class="py-1">
        <li v-if="allowEmpty" @click="selectOption({ label: placeholder, value: '' })" class="px-4 py-2 cursor-pointer hover:bg-brand-base/10 transition-colors duration-150 dark:hover:bg-brand-base/20" :class="{ 'bg-brand-base/20 text-brand-base font-medium dark:bg-brand-base/30': modelValue === '' }">{{ placeholder }}</li>
        <li
          v-for="option in options"
          :key="option.value"
          @click="selectOption(option)"
          class="px-4 py-2 cursor-pointer hover:bg-brand-base/10 transition-colors duration-150 dark:hover:bg-brand-base/20"
          :class="{ 'bg-brand-base/20 text-brand-base font-medium dark:bg-brand-base/30': modelValue === option.value }"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue: string | number | undefined
  options: Option[]
  placeholder?: string
  allowEmpty?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined]
}>()

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option: Option) => {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
