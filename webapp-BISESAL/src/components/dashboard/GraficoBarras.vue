<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  datos: Array<{ etiqueta: string; valor: number }>
  titulo?: string
  subtitulo?: string
  colorBarra?: string
  altura?: number
}

const props = withDefaults(defineProps<Props>(), {
  titulo: 'Gráfico de Barras',
  subtitulo: '',
  colorBarra: '#f96000',
  altura: 400
})

const contenedor = ref<HTMLDivElement | null>(null)

// Calcular el valor máximo para escalar las barras
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

// Calcular altura de cada barra como porcentaje
const calcularAlturaBarra = (valor: number) => {
  if (valorMaximo.value === 0) return 0
  return (valor / valorMaximo.value) * 100
}

// Calcular el color de la barra (todas naranjas)
const calcularColorBarra = () => {
  return 'brand-base' // Todas las barras en naranja
}

// Calcular la opacidad de la barra para variación visual
const calcularOpacidadBarra = (index: number) => {
  return Math.max(0.7, 1 - (index * 0.03)) // Variación sutil de opacidad
}
</script>

<template>
  <div class="grafico-barras-contenedor">
    <!-- Header del gráfico -->
    <div v-if="titulo || subtitulo" class="grafico-header">
      <h3 v-if="titulo" class="grafico-titulo">{{ titulo }}</h3>
      <p v-if="subtitulo" class="grafico-subtitulo">{{ subtitulo }}</p>
    </div>

    <!-- Mensaje si no hay datos -->
    <div v-if="!datos || datos.length === 0" class="grafico-vacio">
      <svg class="icono-vacio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
      <p class="mensaje-vacio">No hay datos disponibles para mostrar</p>
      <p class="submensaje-vacio">Selecciona filtros para generar el gráfico</p>
    </div>

    <!-- Gráfico de barras -->
    <div v-else ref="contenedor" class="grafico-contenido" :style="{ height: `${altura}px` }">
      <div class="barras-wrapper">
        <div
          v-for="(dato, index) in datos"
          :key="index"
          class="barra-contenedor"
        >
          <!-- Valor encima de la barra -->
          <div class="barra-valor">
            {{ formatearNumero(dato.valor) }}
          </div>
          
          <!-- Barra visual -->
          <div class="barra-wrapper">
            <div
              class="barra"
              :class="`bg-${calcularColorBarra()}`"
              :style="{
                height: `${calcularAlturaBarra(dato.valor)}%`,
                opacity: calcularOpacidadBarra(index)
              }"
            >
              <div class="barra-animacion"></div>
            </div>
          </div>
          
          <!-- Etiqueta debajo de la barra -->
          <div class="barra-etiqueta" :title="dato.etiqueta">
            {{ dato.etiqueta }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grafico-barras-contenedor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grafico-header {
  padding: 0.5rem 0;
}

.grafico-titulo {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--color-brand-dark));
  transition: color 0.3s;
}

:global(.dark) .grafico-titulo {
  color: rgb(var(--color-brand-light));
}

.grafico-subtitulo {
  font-size: 0.875rem;
  color: rgb(var(--color-text-secondary));
  margin-top: 0.25rem;
  transition: color 0.3s;
}

:global(.dark) .grafico-subtitulo {
  color: rgb(var(--color-text-muted));
}

.grafico-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: rgb(var(--color-text-secondary));
  transition: color 0.3s;
}

:global(.dark) .grafico-vacio {
  color: rgb(var(--color-text-muted));
}

.icono-vacio {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  color: rgb(209, 213, 219);
}

:global(.dark) .icono-vacio {
  color: rgb(75, 85, 99);
}

.mensaje-vacio {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.submensaje-vacio {
  font-size: 0.875rem;
}

.grafico-contenido {
  width: 100%;
  padding: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
}

.barras-wrapper {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 1rem;
  height: 100%;
  min-width: max-content;
  padding: 2rem 0 3rem;
}

.barra-contenedor {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  height: 100%;
  gap: 0.5rem;
}

.barra-valor {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--color-brand-base));
  transition: color 0.3s;
  white-space: nowrap;
}

:global(.dark) .barra-valor {
  color: rgb(var(--color-brand-light));
}

.barra-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.barra {
  width: 100%;
  min-height: 4px;
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: barraCrecer 0.6s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.barra:hover {
  transform: scaleY(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.barra-animacion {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 6px 6px 0 0;
}

@keyframes barraCrecer {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: 100%;
    opacity: 1;
  }
}

.barra-etiqueta {
  font-size: 0.75rem;
  color: rgb(var(--color-text-secondary));
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;
  padding: 0 0.25rem;
}

:global(.dark) .barra-etiqueta {
  color: rgb(var(--color-text-muted));
}

/* Responsivo */
@media (max-width: 640px) {
  .barras-wrapper {
    gap: 0.5rem;
  }

  .barra-contenedor {
    min-width: 40px;
  }

  .barra-valor {
    font-size: 0.75rem;
  }

  .barra-etiqueta {
    font-size: 0.625rem;
  }
}
</style>


