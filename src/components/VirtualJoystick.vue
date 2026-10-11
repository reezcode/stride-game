<template>
  <div class="joystick-area" @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend.prevent="onTouchEnd">
    <!-- Base ring -->
    <div class="joystick-base" ref="baseRef">
      <div class="joystick-ring"></div>
      <!-- Knob -->
      <div class="joystick-knob"
        :style="`transform: translate(${knobX}px, ${knobY}px);`">
        <div class="knob-inner"></div>
      </div>
    </div>
    <div class="joystick-label">MOVE</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  move: [dx: number, dy: number]
  stop: []
}>()

const baseRef   = ref<HTMLElement|null>(null)
const knobX     = ref(0)
const knobY     = ref(0)
const touchId   = ref<number|null>(null)
const MAX_RADIUS = 44

function onTouchStart(e: TouchEvent) {
  const touch = e.changedTouches[0]
  touchId.value = touch.identifier
  updateKnob(touch)
}

function onTouchMove(e: TouchEvent) {
  const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.value)
  if (touch) updateKnob(touch)
}

function onTouchEnd() {
  knobX.value = 0
  knobY.value = 0
  touchId.value = null
  emit('stop')
}

function updateKnob(touch: Touch) {
  const base = baseRef.value
  if (!base) return
  const rect = base.getBoundingClientRect()
  const cx   = rect.left + rect.width / 2
  const cy   = rect.top  + rect.height / 2
  let dx = touch.clientX - cx
  let dy = touch.clientY - cy
  const dist = Math.hypot(dx, dy)
  if (dist > MAX_RADIUS) {
    dx = (dx / dist) * MAX_RADIUS
    dy = (dy / dist) * MAX_RADIUS
  }
  knobX.value = dx
  knobY.value = dy
  emit('move', dx / MAX_RADIUS, dy / MAX_RADIUS)
}
</script>

<style scoped>
.joystick-area {
  position: fixed;
  left: 20px;
  bottom: calc(28px + env(safe-area-inset-bottom));
  z-index: 26;
  touch-action: none;
}
.joystick-base {
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.joystick-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #0B0E13B3;
  border: 1px solid var(--color-ink-600);
}
.joystick-knob {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-fog);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.05s linear;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 14px #0008;
}
.knob-inner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #0B0E1333;
}
.joystick-label { display: none; }
</style>
