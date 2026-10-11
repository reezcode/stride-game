<template>
  <canvas ref="el" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { drawDetective, type Facing } from '@/game/sprites'

const props = withDefaults(defineProps<{ color: string; size?: number; facing?: Facing }>(), {
  size: 48,
  facing: 'down',
})

const el = ref<HTMLCanvasElement | null>(null)

function paint() {
  const c = el.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  c.width = props.size * dpr
  c.height = props.size * dpr
  const g = c.getContext('2d')!
  const k = (props.size / 50) * dpr
  g.setTransform(k, 0, 0, k, 0, 0)
  g.clearRect(0, 0, 50, 50)
  drawDetective(g, 25, 47, props.color, props.facing, 0, false)
}

onMounted(paint)
watch(() => [props.color, props.size, props.facing], paint)
</script>
