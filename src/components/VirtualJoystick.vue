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
const MAX_RADIUS = 36

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
  bottom: 40px;
  left: 40px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  touch-action: none;
}

.joystick-base {
  width: 90px;
  height: 90px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.joystick-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 2px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
}

.joystick-knob {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  border: 2px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.05s linear;
  position: relative;
  z-index: 2;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}

.knob-inner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
}

.joystick-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  font-family: 'JetBrains Mono', monospace;
}
</style>
