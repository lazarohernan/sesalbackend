<template>
  <div class="relative w-full h-[500px] overflow-hidden rounded-lg shadow-lg">
    <!-- Slides -->
    <div class="relative w-full h-full">
      <div
        v-for="(image, index) in images"
        :key="image"
        class="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
        :class="{ 'opacity-100': index === currentIndex, 'opacity-0': index !== currentIndex }"
      >
        <img
          :src="image"
          :alt="`Imagen ${index + 1} del banner BI-SESAL`"
          class="w-full h-full object-cover"
        />
        <!-- Overlay para mejor legibilidad del texto -->
        <div class="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
    </div>

    <!-- Contenido superpuesto -->
    <div class="absolute inset-0 flex items-center justify-start z-10">
      <div class="text-left text-white ml-8 max-w-lg">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
          SESAL
        </h1>
        <p class="text-lg md:text-xl mb-8 drop-shadow-md">
          Sistema de Información para el análisis de datos de salud pública en Honduras
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Lista de imágenes
const images = [
  '/img1.jpeg',
  '/img2.jpeg',
  '/img3.jpeg',
  '/img4.jpeg',
  '/img5.jpeg',
  '/img6.jpeg',
  '/img7.jpeg'
]

const currentIndex = ref(0)
let autoPlayInterval: number | null = null

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % images.length
}

// Auto-play del carousel
const startAutoPlay = () => {
  autoPlayInterval = window.setInterval(() => {
    nextSlide()
  }, 5000) // Cambiar cada 5 segundos
}

const stopAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval)
    autoPlayInterval = null
  }
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
