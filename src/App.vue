<template>
  <div>
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="$route.fullPath" />
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
/* Game-wide cursor override: restore default cursor outside map */
body { cursor: default; }
</style>
