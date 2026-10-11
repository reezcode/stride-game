<template>
  <StoryScene :lines="prologue" @done="finish" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { prologue } from '@/data/story'
import StoryScene from '@/components/StoryScene.vue'

const router = useRouter()
const store = useGameStore()

function finish() {
  store.markPrologueSeen()
  router.replace('/game')
}
</script>
