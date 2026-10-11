<template>
  <StoryScene :lines="prologue" @done="finish" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { prologue } from '@/data/story'
import StoryScene from '@/components/StoryScene.vue'
import { unlockAudio } from '@/game/audio'
import { setMood } from '@/game/music'

const router = useRouter()
const store = useGameStore()

// browsers only allow sound after the first key or tap
function start() { unlockAudio(); setMood('story') }
onMounted(() => { window.addEventListener('pointerdown', start, { once: true }); window.addEventListener('keydown', start, { once: true }) })
onUnmounted(() => { window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); setMood(null) })

function finish() {
  store.markPrologueSeen()
  router.replace('/game')
}
</script>
