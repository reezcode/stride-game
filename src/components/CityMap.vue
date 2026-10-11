<template>
  <div class="backdrop" @mousedown.self="$emit('close')">
    <section class="map anim-rise" role="dialog" aria-modal="true" aria-label="City map">
      <header class="head">
        <div>
          <div class="t-label k">The city · {{ clock }}</div>
          <h2 class="t-display title">Where to?</h2>
        </div>
        <button class="close" title="Close (Esc)" @click="$emit('close')"><IconX :size="20" /></button>
      </header>

      <div class="stage">
        <canvas ref="el" width="2000" height="1240" aria-hidden="true"></canvas>
        <button v-for="(p, i) in pins" :key="p.id" :class="['pin', { here: p.id === current, locked: !p.open }]"
          :style="{ left: `${p.x / 10}%`, top: `${p.y / 6.2}%` }" :disabled="!p.open || p.id === current"
          @click="$emit('go', p.id)">
          <span class="dot"><IconMapPinFilled v-if="p.open" :size="18" /><IconLock v-else :size="15" /></span>
          <span class="label">
            <span class="name">{{ p.open ? p.name : '???' }}<span v-if="p.open" class="t-mono key">{{ i + 1 }}</span></span>
            <span class="sub">{{ p.id === current ? 'You are here' : p.open ? p.blurb : 'You don\'t know where to look yet' }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconX, IconMapPinFilled, IconLock } from '@tabler/icons-vue'
import { places, type PlaceId } from '@/data/story'
import { rng } from '@/game/sprites'

const props = defineProps<{ current: PlaceId; unlocked: string[]; clock: string }>()
const emit = defineEmits<{ go: [id: PlaceId]; close: [] }>()

const pins = computed(() => places.map(p => ({ ...p, open: props.unlocked.includes(p.id) })))
const el = ref<HTMLCanvasElement | null>(null)

// A night city from above: blocks, a river, and the roads you can ride.
function paint() {
  const g = el.value!.getContext('2d')!
  g.setTransform(2, 0, 0, 2, 0, 0)
  g.fillStyle = '#0C1119'; g.fillRect(0, 0, 1000, 620)
  const R = rng(17)
  for (let by = 0; by < 620; by += 44) for (let bx = 0; bx < 1000; bx += 58) {
    if (R() < 0.12) continue
    const w = 30 + R() * 22, h = 22 + R() * 16
    const x = bx + 6 + R() * 6, y = by + 6 + R() * 4
    g.fillStyle = `rgb(${20 + R() * 10},${27 + R() * 10},${38 + R() * 12})`
    g.fillRect(x, y, w, h)
    for (let i = 0; i < 5; i++) if (R() < 0.35) { g.fillStyle = `rgba(242,200,121,${0.25 + R() * 0.5})`; g.fillRect(x + 3 + R() * (w - 8), y + 3 + R() * (h - 8), 2.5, 2.5) }
  }
  // river
  g.strokeStyle = '#0F2238'; g.lineWidth = 46; g.lineCap = 'round'
  g.beginPath(); g.moveTo(-20, 120); g.bezierCurveTo(260, 180, 300, 330, 560, 380); g.bezierCurveTo(760, 420, 800, 560, 1020, 600); g.stroke()
  g.strokeStyle = 'rgba(120,170,230,0.10)'; g.lineWidth = 2
  g.beginPath(); g.moveTo(-20, 112); g.bezierCurveTo(260, 172, 300, 322, 560, 372); g.bezierCurveTo(760, 412, 800, 552, 1020, 592); g.stroke()
  // roads between the places you know
  const open = places.filter(p => props.unlocked.includes(p.id))
  g.lineCap = 'round'; g.lineJoin = 'round'
  for (let i = 0; i < places.length - 1; i++) {
    const a = places[i], b = places[i + 1]
    const known = open.includes(a) && open.includes(b)
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x, b.y + (a.y - b.y) * 0.35); g.lineTo(b.x, b.y + (a.y - b.y) * 0.35); g.lineTo(b.x, b.y)
    g.strokeStyle = '#05070A'; g.lineWidth = 12; g.setLineDash([]); g.stroke()
    g.strokeStyle = known ? '#F0C674' : '#3A4250'; g.lineWidth = 2.5; g.setLineDash(known ? [10, 8] : [3, 9]); g.stroke()
  }
  g.setLineDash([])
  const v = g.createRadialGradient(500, 310, 200, 500, 310, 640)
  v.addColorStop(0, 'rgba(5,7,10,0)'); v.addColorStop(1, 'rgba(5,7,10,0.8)')
  g.fillStyle = v; g.fillRect(0, 0, 1000, 620)
}

function onKey(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === 'Escape') return emit('close')
  const p = pins.value[Number(e.key) - 1]
  if (p && p.open && p.id !== props.current) emit('go', p.id)
}

onMounted(() => { paint(); window.addEventListener('keydown', onKey, true) })
onUnmounted(() => window.removeEventListener('keydown', onKey, true))
</script>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 72; display: grid; place-items: center; padding: 16px; background: #05070AD9; }
.map {
  width: min(1000px, 100%);
  background: var(--color-ink-900);
  border: 1px solid var(--color-ink-600);
  border-radius: 4px;
  box-shadow: 0 30px 90px #000C;
  overflow: hidden;
}
.head { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 22px 14px; }
.k { color: #F0C674; }
.title { font-size: clamp(28px, 4vw, 38px); margin: 6px 0 0; }
.close { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--color-ink-600); border-radius: 3px; background: transparent; cursor: pointer; }
.close:hover { background: var(--color-ink-800); }

.stage { position: relative; }
.stage canvas { display: block; width: 100%; aspect-ratio: 1000 / 620; }
.pin {
  position: absolute;
  transform: translate(-17px, -17px);
  display: flex; align-items: flex-start; gap: 10px;
  padding: 0; border: 0; background: transparent;
  text-align: left; cursor: pointer;
}
.dot {
  display: grid; place-items: center;
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: 50%;
  background: #F0C674; color: #0B0E13;
  box-shadow: 0 0 0 5px #F0C67433, 0 6px 20px #000A;
  transition: transform .15s;
}
.pin:not(:disabled):hover .dot { transform: scale(1.15); }
.label { display: grid; gap: 2px; padding: 6px 12px 8px; max-width: 230px; background: #0B0E13E6; border: 1px solid var(--color-ink-line); border-radius: 3px; }
.name { font-family: var(--font-cond); font-weight: 700; font-size: 20px; line-height: 1.1; display: flex; align-items: center; gap: 8px; }
.key { font-size: 10px; font-weight: 500; padding: 1px 5px; border: 1px solid var(--color-ink-600); border-radius: 2px; color: var(--color-fog-mute); }
.sub { font-size: 12.5px; line-height: 1.35; color: var(--color-fog-dim); }
.pin.here { cursor: default; }
.pin.here .dot { background: var(--color-fog); box-shadow: 0 0 0 5px #E7E3DA33; }
.pin.locked { cursor: not-allowed; }
.pin.locked .dot { background: var(--color-ink-700); color: var(--color-fog-mute); box-shadow: none; }
.pin.locked .label { opacity: .7; }

@media (max-width: 640px) {
  .label { max-width: 130px; padding: 4px 8px 6px; }
  .name { font-size: 16px; }
  .sub { font-size: 11px; }
  .key { display: none; }
}
</style>
