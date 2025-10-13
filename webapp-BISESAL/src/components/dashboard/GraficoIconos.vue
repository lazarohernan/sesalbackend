<script setup lang="ts">
import { computed } from 'vue'
import {
  Pill,
  Syringe,
  ShieldCheck,
  Bandage,
  Circle,
  AlertOctagon,
  Stethoscope,
  Baby,
  User,
  Users,
  UserCheck,
  Heart,
  CalendarPlus,
  CalendarCheck,
  HeartPulse,
  Home,
  Shield,
  Cross,
  Calendar,
  Activity
} from 'lucide-vue-next'

interface Props {
  datos: Array<{ etiqueta: string; valor: number }>
  titulo?: string
  subtitulo?: string
  altura?: number
}

const props = withDefaults(defineProps<Props>(), {
  titulo: 'Gráfico de Iconos',
  subtitulo: '',
  altura: 500
})

// Mapeo de conceptos a componentes de Lucide Icons
const obtenerIconoConcepto = (concepto: string) => {
  const conceptoLower = concepto.toLowerCase()
  
  // Anticonceptivos
  if (conceptoLower.includes('oral') || conceptoLower.includes('píldora') || conceptoLower.includes('ciclo')) {
    return Pill // Píldoras
  }
  if (conceptoLower.includes('depo') || conceptoLower.includes('provera') || conceptoLower.includes('inyectable')) {
    return Syringe // Inyección
  }
  if (conceptoLower.includes('condón') || conceptoLower.includes('condon') || conceptoLower.includes('preservativo') || conceptoLower.includes('unidades')) {
    return ShieldCheck // Protección
  }
  if (conceptoLower.includes('diu')) {
    return Circle // DIU (dispositivo intrauterino)
  }
  if (conceptoLower.includes('implante') || conceptoLower.includes('subdérm')) {
    return Bandage // Implante subdérmico
  }
  if (conceptoLower.includes('parche')) {
    return Bandage // Parche
  }
  if (conceptoLower.includes('emergencia') || conceptoLower.includes('anticoncepción de emergencia') || conceptoLower.includes('pae')) {
    return AlertOctagon // Emergencia
  }
  if (conceptoLower.includes('esterilización') || conceptoLower.includes('ligadura') || conceptoLower.includes('vasectomía')) {
    return Stethoscope // Procedimiento médico
  }
  
  // Grupos etarios - MÁS ESPECÍFICOS Y COMPLETOS
  if (conceptoLower.includes('menores de 1 mes') || conceptoLower.includes('menor de 1 mes')) {
    return Baby // Recién nacidos
  }
  if (conceptoLower.includes('1 mes a 1 año') || conceptoLower.includes('1 mes a 1 ano')) {
    return Baby // Lactantes
  }
  if (conceptoLower.includes('1 a 4 años') || conceptoLower.includes('1 a 4 anos')) {
    return Baby // Preescolares
  }
  if (conceptoLower.includes('5 a 9 años') || conceptoLower.includes('5 a 9 anos')) {
    return User // Escolares
  }
  if (conceptoLower.includes('10 a 14') || conceptoLower.includes('10-14')) {
    return User // Adolescente temprano
  }
  if (conceptoLower.includes('15 a 19') || conceptoLower.includes('15-19')) {
    return UserCheck // Adolescente/Joven
  }
  if (conceptoLower.includes('20 a 49') || conceptoLower.includes('20-49')) {
    return Users // Adultos en edad reproductiva
  }
  if (conceptoLower.includes('20 a 24') || conceptoLower.includes('20-24')) {
    return UserCheck // Adulto joven
  }
  if (conceptoLower.includes('25 a 29') || conceptoLower.includes('25-29')) {
    return Users // Adultos
  }
  if (conceptoLower.includes('30 a 34') || conceptoLower.includes('30-34')) {
    return Users // Adultos
  }
  if (conceptoLower.includes('35 a 39') || conceptoLower.includes('35-39') ||
      conceptoLower.includes('40 a 44') || conceptoLower.includes('40-44')) {
    return Heart // Adulto maduro
  }
  if (conceptoLower.includes('45 a 49') || conceptoLower.includes('45-49')) {
    return Heart // Adulto maduro
  }
  if (conceptoLower.includes('50 a 59') || conceptoLower.includes('50-59')) {
    return Activity // Adulto mayor inicial
  }
  if (conceptoLower.includes('60 y mas') || conceptoLower.includes('60 y más') || conceptoLower.includes('más')) {
    return Activity // Adulto mayor
  }
  
  // Género
  if (conceptoLower.includes('hombres') || conceptoLower.includes('masculino')) {
    return User // Hombres
  }
  if (conceptoLower.includes('mujeres') || conceptoLower.includes('femenino')) {
    return Users // Mujeres
  }
  
  // Nutrición infantil
  if (conceptoLower.includes('crecimiento adecuado')) {
    return Baby // Crecimiento adecuado
  }
  if (conceptoLower.includes('crecimiento inadecuado') || conceptoLower.includes('bajo percentil')) {
    return AlertOctagon // Problemas de crecimiento
  }
  if (conceptoLower.includes('daño nutricional') || conceptoLower.includes('desnutrición')) {
    return AlertOctagon // Daño nutricional
  }
  
  // Enfermedades infantiles
  if (conceptoLower.includes('diarrea')) {
    return Activity // Diarrea
  }
  if (conceptoLower.includes('neumonía') || conceptoLower.includes('neumonia')) {
    return Stethoscope // Neumonía
  }
  if (conceptoLower.includes('deshidratación') || conceptoLower.includes('deshidratacion')) {
    return AlertOctagon // Deshidratación
  }
  if (conceptoLower.includes('anémico') || conceptoLower.includes('anemico') || conceptoLower.includes('anemia')) {
    return HeartPulse // Anemia
  }
  if (conceptoLower.includes('discapacidad')) {
    return Heart // Discapacidad
  }
  if (conceptoLower.includes('alteración del desarrollo')) {
    return Baby // Desarrollo
  }
  
  // Detección y prevención
  if (conceptoLower.includes('cáncer') || conceptoLower.includes('cancer')) {
    return Shield // Detección de cáncer
  }
  if (conceptoLower.includes('sintomáticos respiratorios') || conceptoLower.includes('sintomaticos respiratorios')) {
    return Stethoscope // Síntomas respiratorios
  }
  
  // Tipo de consulta
  if (conceptoLower.includes('espontaneas') || conceptoLower.includes('espontáneas')) {
    return Calendar // Consultas espontáneas
  }
  if (conceptoLower.includes('referidas')) {
    return CalendarCheck // Consultas referidas
  }
  
  // Tipos de consulta
  if (conceptoLower.includes('primera') || conceptoLower.includes('1a') || conceptoLower.includes('nueva')) {
    return CalendarPlus // Primera consulta
  }
  if (conceptoLower.includes('subsiguiente') || conceptoLower.includes('seguimiento') || conceptoLower.includes('control')) {
    return CalendarCheck // Consulta de seguimiento
  }
  
  // Embarazo y parto
  if (conceptoLower.includes('embarazo') || conceptoLower.includes('gestante') || conceptoLower.includes('prenatal')) {
    return HeartPulse // Embarazo
  }
  if (conceptoLower.includes('parto') || conceptoLower.includes('puerperio') || conceptoLower.includes('postparto')) {
    return Baby // Parto/Bebé
  }
  
  // Planificación familiar
  if (conceptoLower.includes('planificación') || conceptoLower.includes('familia')) {
    return Home // Planificación familiar
  }
  
  // ITS/VIH
  if (conceptoLower.includes('its') || conceptoLower.includes('vih') || conceptoLower.includes('ets')) {
    return Shield // Prevención ITS
  }
  
  // Vacunas
  if (conceptoLower.includes('vacun') || conceptoLower.includes('inmuniz')) {
    return Syringe // Vacunas
  }
  
  // Métodos específicos
  if (conceptoLower.includes('ritmo') || conceptoLower.includes('natural') || conceptoLower.includes('calendario')) {
    return Calendar // Método natural
  }
  
  // Default para conceptos de salud general
  return Cross // Icono médico general (cruz médica)
}

// Calcular el valor máximo para escalar
const valorMaximo = computed(() => {
  if (!props.datos || props.datos.length === 0) return 0
  return Math.max(...props.datos.map(d => d.valor))
})

// Formatear números con separadores de miles
const formatearNumero = (valor: number) => {
  return new Intl.NumberFormat('es-HN', {
    maximumFractionDigits: 0
  }).format(valor)
}

// Calcular el ancho relativo de cada barra (en %)
const calcularAnchoBarra = (valor: number) => {
  if (valorMaximo.value === 0) return 0
  return (valor / valorMaximo.value) * 100
}

// Obtener color basado en el índice alternando entre azul y naranja
const obtenerColor = (index: number) => {
  const colores = [
    'from-accent-base to-accent-dark',  // Azul
    'from-brand-base to-brand-dark'     // Naranja
  ]
  return colores[index % colores.length]
}
</script>

<template>
  <div class="grafico-iconos-contenedor">
    <!-- Header del gráfico -->
    <div v-if="titulo || subtitulo" class="mb-6">
      <h3 v-if="titulo" class="text-xl font-bold text-text-primary dark:text-text-light mb-1">
        {{ titulo }}
      </h3>
      <p v-if="subtitulo" class="text-sm text-text-secondary dark:text-text-muted">
        {{ subtitulo }}
      </p>
    </div>

    <!-- Mensaje si no hay datos -->
    <div v-if="!datos || datos.length === 0" class="flex flex-col items-center justify-center h-64 text-text-secondary dark:text-text-muted">
      <Cross :size="64" class="mb-4 opacity-50" />
      <p class="text-lg font-medium mb-2">No hay datos disponibles</p>
      <p class="text-sm">Selecciona filtros para generar el gráfico</p>
    </div>

    <!-- Grid de items con iconos (5 columnas) -->
    <div v-else class="grid grid-cols-5 gap-4" :style="{ maxHeight: `${altura}px`, overflowY: 'auto' }">
      <div
        v-for="(dato, index) in datos"
        :key="index"
        class="group relative"
      >
        <!-- Card del item -->
        <div class="flex flex-col items-center gap-2 p-3 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-brand-base dark:hover:border-brand-light">
          <!-- Icono del concepto -->
          <div class="flex-shrink-0">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 text-white"
                 :class="obtenerColor(index)">
              <component :is="obtenerIconoConcepto(dato.etiqueta)" :size="24" :stroke-width="2" />
            </div>
          </div>

          <!-- Etiqueta -->
          <div class="text-center px-1">
            <h4 class="text-base font-semibold text-text-primary dark:text-text-light line-clamp-2 leading-tight">
              {{ dato.etiqueta }}
            </h4>
          </div>

          <!-- Valor -->
          <div class="text-center">
            <span class="text-sm font-bold text-brand-base dark:text-brand-light">
              {{ formatearNumero(dato.valor) }}
            </span>
          </div>

          <!-- Barra de progreso -->
          <div class="w-full">
            <div class="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                class="absolute top-0 left-0 h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out"
                :class="obtenerColor(index)"
                :style="{ width: `${calcularAnchoBarra(dato.valor)}%` }"
              >
                <!-- Efecto de brillo -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>

            <!-- Porcentaje del total -->
            <div class="flex items-center justify-center gap-1 mt-1">
              <span class="text-sm text-text-secondary dark:text-text-muted">
                {{ ((dato.valor / valorMaximo) * 100).toFixed(1) }}% del máximo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grafico-iconos-contenedor {
  width: 100%;
}

/* Animación de shimmer para las barras */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Scroll personalizado */
.space-y-3::-webkit-scrollbar {
  width: 8px;
}

.space-y-3::-webkit-scrollbar-track {
  background: rgb(var(--color-surface));
  border-radius: 4px;
}

.space-y-3::-webkit-scrollbar-thumb {
  background: rgb(var(--color-brand-base));
  border-radius: 4px;
}

.space-y-3::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-brand-dark));
}

:global(.dark) .space-y-3::-webkit-scrollbar-track {
  background: rgb(var(--color-surface-dark));
}

:global(.dark) .space-y-3::-webkit-scrollbar-thumb {
  background: rgb(var(--color-brand-light));
}
</style>

