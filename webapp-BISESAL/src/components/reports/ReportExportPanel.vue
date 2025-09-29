<script setup lang="ts">
import SelectCustom from '../ui/SelectCustom.vue'
import { computed, ref, watch } from 'vue'

export type ReportExportOption = { label: string; value: string | number }

export type ExportFormat = 'pdf' | 'xlsx' | 'xls' | 'csv'

export interface ReportExportPayload {
  reportType: string | number
  form: string | number
  block: string | number
  region: string | number
  municipalityId?: string | number
  year: number
  monthStart: string
  monthEnd: string
  serviceType: string | number
  unitId?: string | number
}

const props = defineProps<{
  reportTypes: ReportExportOption[]
  forms: ReportExportOption[]
  blocks: ReportExportOption[]
  regions: ReportExportOption[]
  municipalities: ReportExportOption[]
  services: ReportExportOption[]
  units: ReportExportOption[]
  years: number[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'generate', payload: ReportExportPayload): void
  (e: 'export', format: ExportFormat, payload: ReportExportPayload): void
  (e: 'search-unit'): void
  (e: 'region-change', value: string | number): void
  (e: 'municipality-change', value: string | number): void
}>()

const selectedReportType = ref(props.reportTypes?.[0]?.value ?? '')
const selectedForm = ref(props.forms?.[0]?.value ?? '')
const selectedBlock = ref(props.blocks?.[0]?.value ?? '')
const selectedRegion = ref(props.regions?.[0]?.value ?? '')
const selectedMunicipality = ref(props.municipalities?.[0]?.value ?? '')
const selectedYear = ref(props.years?.[0] ?? new Date().getFullYear())
const selectedMonthStart = ref('00')
const selectedMonthEnd = ref('13')
const selectedService = ref(props.services?.[0]?.value ?? '')
const selectedUnit = ref<string | number | ''>('')
const selectedFormat = ref<ExportFormat>('pdf')
const formatOptions: { label: string; value: ExportFormat }[] = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel (XLSX)', value: 'xlsx' },
  { label: 'Excel 97-2003 (XLS)', value: 'xls' },
  { label: 'CSV', value: 'csv' }
]
const yearOptions = computed(() => props.years.map(year => ({ label: String(year), value: year })))

const monthStartOptions: { label: string; value: string }[] = [
  { label: '[Todos]', value: '00' },
  { label: 'Enero', value: '01' },
  { label: 'Febrero', value: '02' },
  { label: 'Marzo', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Mayo', value: '05' },
  { label: 'Junio', value: '06' },
  { label: 'Julio', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Septiembre', value: '09' },
  { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' },
  { label: 'Diciembre', value: '12' }
]

const monthEndOptions: { label: string; value: string }[] = [
  { label: 'Enero', value: '01' },
  { label: 'Febrero', value: '02' },
  { label: 'Marzo', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Mayo', value: '05' },
  { label: 'Junio', value: '06' },
  { label: 'Julio', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Septiembre', value: '09' },
  { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' },
  { label: 'Diciembre', value: '12' },
  { label: '[Todos]', value: '13' }
]

watch(
  [selectedMonthStart, selectedMonthEnd],
  ([start, end]) => {
    const startNum = Number(start)
    const endNum = Number(end)

    if (endNum !== 13 && startNum !== 0 && endNum < startNum) {
      selectedMonthEnd.value = start
    }

    if (startNum === 13) {
      selectedMonthStart.value = '00'
    }
    if (endNum === 0) {
      selectedMonthEnd.value = '13'
    }
  },
  { immediate: true }
)

const ensureOption = (options: ReportExportOption[], selected: typeof selectedRegion) => {
  if (!options.length) {
    selected.value = ''
    return
  }

  const exists = options.some((op) => op.value === selected.value)
  if (!exists) {
    selected.value = options[0]?.value ?? ''
  }
}

const ensureNumberOption = (options: number[], selected: typeof selectedYear) => {
  if (!options.length) {
    selected.value = new Date().getFullYear()
    return
  }

  if (!options.includes(selected.value)) {
    selected.value = options[0] ?? new Date().getFullYear()
  }
}

watch(
  () => props.reportTypes,
  (options = []) => {
    ensureOption(options, selectedReportType)
  },
  { immediate: true }
)

watch(
  () => props.forms,
  (options = []) => {
    ensureOption(options, selectedForm)
  },
  { immediate: true }
)

watch(
  () => props.blocks,
  (options = []) => {
    ensureOption(options, selectedBlock)
  },
  { immediate: true }
)

watch(
  () => props.regions,
  (options = []) => {
    ensureOption(options, selectedRegion)
  },
  { immediate: true }
)


watch(
  () => props.municipalities,
  (options = []) => {
    ensureOption(options, selectedMunicipality)
  },
  { immediate: true }
)

watch(
  () => props.services,
  (options = []) => {
    ensureOption(options, selectedService)
  },
  { immediate: true }
)

watch(
  () => props.units,
  (options = []) => {
    if (!options.length) {
      selectedUnit.value = ''
      return
    }

    const exists = options.some((op) => op.value === selectedUnit.value)
    if (!exists) {
      selectedUnit.value = options[0]?.value ?? ''
    }
  },
  { immediate: true }
)

watch(
  () => props.years,
  (options = []) => {
    ensureNumberOption(options, selectedYear)
  },
  { immediate: true }
)

watch(selectedRegion, (valor) => {
  emit('region-change', valor)
  const muniPrimero = props.municipalities?.[0]
  selectedMunicipality.value = muniPrimero ? muniPrimero.value : ''
})


watch(selectedMunicipality, (valor) => {
  emit('municipality-change', valor)
})

const payload = computed<ReportExportPayload>(() => ({
  reportType: selectedReportType.value,
  form: selectedForm.value,
  block: selectedBlock.value,
  region: selectedRegion.value,
  municipalityId: selectedMunicipality.value ? selectedMunicipality.value : undefined,
  year: selectedYear.value,
  monthStart: selectedMonthStart.value,
  monthEnd: selectedMonthEnd.value,
  serviceType: selectedService.value,
  unitId: selectedUnit.value ? selectedUnit.value : undefined
}))

const handleGenerate = () => {
  emit('generate', payload.value)
}

const handleExport = () => {
  emit('export', selectedFormat.value, payload.value)
}

const handleSearchUnit = () => {
  emit('search-unit')
}
</script>

<template>
  <section
    class="rounded-card border border-border bg-surface p-6 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
  >
    <header class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
          Generador de reportes
        </h2>
        <p class="text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
          Selecciona filtros para generar y exportar reportes institucionales
        </p>
      </div>
      <div class="flex gap-3">
        <button
          class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors duration-200 hover:bg-brand-base/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base dark:border-border-dark dark:text-text-inverted"
          type="button"
          :disabled="loading"
          @click="handleGenerate"
        >
          {{ loading ? 'Generando…' : 'Generar vista previa' }}
        </button>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-text-secondary dark:text-text-muted" for="export-format">
            Formato
          </label>
          <SelectCustom
            v-model="selectedFormat"
            :options="formatOptions"
            placeholder="Seleccionar formato"
            class="w-48"
          />
          <button
            class="rounded-lg bg-gradient-to-br from-brand-base to-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-card transition-transform duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base"
            type="button"
            :disabled="loading"
            @click="handleExport"
          >
            {{ loading ? 'Exportando…' : 'Exportar' }}
          </button>
        </div>
      </div>
    </header>

    <div class="space-y-6">
      <!-- Tipo de reporte (primero) -->
      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="report-type">Tipo de reporte</label>
          <SelectCustom
            v-model="selectedReportType"
            :options="reportTypes"
            placeholder="Seleccionar tipo de reporte"
          />
        </div>
      </div>

      <!-- Región y Municipio -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="region">Región</label>
          <SelectCustom
            v-model="selectedRegion"
            :options="regions"
            placeholder="Seleccionar región"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="municipality">Municipio</label>
          <SelectCustom
            v-model="selectedMunicipality"
            :options="municipalities"
            placeholder="Seleccionar municipio"
          />
        </div>
      </div>

      <!-- Formulario y Bloque -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="report-form">Formulario</label>
          <SelectCustom
            v-model="selectedForm"
            :options="forms"
            placeholder="Seleccionar formulario"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="report-block">Bloque</label>
          <SelectCustom
            v-model="selectedBlock"
            :options="blocks"
            placeholder="Seleccionar bloque"
          />
        </div>
      </div>

      <!-- Año, Mes inicial y Mes final -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="year">Año</label>
          <SelectCustom
            v-model="selectedYear"
            :options="yearOptions"
            placeholder="Seleccionar año"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="month-start">Mes inicial</label>
          <SelectCustom
            v-model="selectedMonthStart"
            :options="monthStartOptions"
            placeholder="Seleccionar mes inicial"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="month-end">Mes final</label>
          <SelectCustom
            v-model="selectedMonthEnd"
            :options="monthEndOptions"
            placeholder="Seleccionar mes final"
          />
        </div>
      </div>

      <!-- Tipo de servicio -->
      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="service">Tipo de servicio</label>
          <SelectCustom
            v-model="selectedService"
            :options="services"
            placeholder="Seleccionar tipo de servicio"
          />
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
      <div class="space-y-1">
        <label class="text-sm font-semibold text-text-secondary dark:text-text-muted" for="unit">
          Unidad de salud (US)
        </label>
        <div class="flex gap-2">
          <SelectCustom
            v-model="selectedUnit"
            :options="units"
            placeholder="[Opcional]"
            allow-empty
          />
          <button
            class="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary transition-colors duration-200 hover:bg-brand-base/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base dark:border-border-dark dark:text-text-inverted"
            type="button"
            @click="handleSearchUnit"
          >
            Buscar
          </button>
        </div>
        <p class="text-xs text-text-secondary/70 dark:text-text-muted">
          Usa el buscador para localizar una unidad específica. Déjalo vacío para incluir todas.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary shadow-sm transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark dark:text-text-muted">
        <p class="font-semibold text-text-primary dark:text-text-inverted">Consejos</p>
        <ul class="mt-2 list-disc space-y-1 pl-4 text-xs">
          <li>Presiona “Generar vista previa” para validar los datos antes de exportar.</li>
          <li>Puedes exportar en PDF o Excel según los requerimientos institucionales.</li>
          <li>Selecciona un rango de meses para reportes trimestrales o anuales.</li>
        </ul>
      </div>
    </div>
  </section>
</template>
