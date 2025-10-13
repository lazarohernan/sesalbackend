<template>
  <div class="pivot-view">
    <PivotBuilder />
  </div>
</template>

<script setup lang="ts">
import PivotBuilder from "../components/reports/PivotBuilder.vue";
</script>

<style scoped>
.pivot-view {
  padding: 1.5rem;
  background: #f3f4f6;
  min-height: 100vh;
}
</style>

