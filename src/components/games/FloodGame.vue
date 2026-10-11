<!-- A live login gateway under attack. Tune the limits so the flood stops and real people still get in. -->
<template>
  <div class="flood">
    <canvas ref="el" width="1520" height="440" aria-hidden="true"></canvas>
    <div v-if="!running" class="start">
      <p>{{ $t('game.floodHow', { s: DURATION }) }}</p>
      <button class="btn btn-ink" @click="start">{{ $t('game.start') }}</button>
    </div>
    <div class="meters">
      <div><span>{{ $t('game.server') }}</span><i><b :style="{ width: `${hp}%`, background: hp > 40 ? '#2F7D57' : '#B8321F' }"></b></i></div>
      <div><span>{{ $t('game.lockedOut') }} {{ locked }}/{{ MAX_LOCKED }}</span><i><b :style="{ width: `${(locked / MAX_LOCKED) * 100}%`, background: '#B8321F' }"></b></i></div>
      <div><span>{{ $t('game.time') }} {{ Math.max(0, DURATION - Math.floor(clock)) }}s</span><i><b :style="{ width: `${(clock / DURATION) * 100}%`, background: 'var(--cat)' }"></b></i></div>
    </div>
    <div class="controls">
      <label class="slider">
        <span>{{ $t('game.limit', { n: limit >= 30 ? '∞' : limit }) }}</span>
        <input v-model.number="limit" type="range" min="1" max="30" />
      </label>
      <label v-for="c in toggles" :key="c.key" class="toggle" :class="{ on: sw[c.key] }">
        <input v-model="sw[c.key]" type="checkbox" /> {{ c.label }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import type { Puzzle } from '@/data/story'
import { sfx } from '@/game/audio'
import { t } from '@/i18n'

defineProps<{ puzzle: Puzzle }>()
const emit = defineEmits<{ result: [ok: boolean, note: string] }>()

const DURATION = 25, MAX_LOCKED = 6, CAPACITY = 9   // logins a second the server can take
const el = ref<HTMLCanvasElement | null>(null)
const running = ref(false)
const hp = ref(100), locked = ref(0), clock = ref(0)
const limit = ref(30)
type Key = 'backoff' | 'human' | 'lockOne' | 'blockAll'
const sw = reactive<Record<Key, boolean>>({ backoff: false, human: false, lockOne: false, blockAll: false })
const toggles: { key: Key; label: string }[] = [
  { key: 'backoff', label: t('game.backoff') }, { key: 'human', label: t('game.human') },
  { key: 'lockOne', label: t('game.lockOne') }, { key: 'blockAll', label: t('game.blockAll') },
]

interface Dot { x: number; y: number; bot: boolean; src: number; state: 'in' | 'pass' | 'drop'; life: number }
let dots: Dot[] = []
const tries: Record<number, number> = {}          // attempts per source in the current window
let raf = 0, last = 0, botAcc = 0, humanAcc = 0, windowT = 0, load = 0, nextHuman = 100
const retries: { at: number; src: number }[] = []
const GATE = 470, SERVER = 700, W = 760, H = 220

function start() {
  dots = []; for (const k in tries) delete tries[k]
  hp.value = 100; locked.value = 0; clock.value = 0; load = 0; windowT = 0; retries.length = 0
  running.value = true; last = performance.now()
}

function spawn(bot: boolean, src: number) {
  dots.push({ x: 0, y: 24 + Math.random() * (H - 48), bot, src, state: 'in', life: 1 })
}

/** Decides one attempt at the gate, by the rules currently switched on. */
function gate(d: Dot) {
  const n = (tries[d.src] = (tries[d.src] ?? 0) + 1)
  let stop = sw.blockAll || n > (limit.value >= 30 ? Infinity : limit.value)
  if (sw.lockOne && n > 1) stop = true              // one earlier miss and the number is locked for good
  if (sw.human && d.bot && n > 3) stop = true        // machines fail the human check
  if (stop) {
    d.state = 'drop'
    if (!d.bot) { locked.value++; sfx.denied() }
  } else d.state = 'pass'
}

function step(dt: number) {
  clock.value += dt
  windowT += dt
  if (windowT > 10) { windowT = 0; for (const k in tries) delete tries[k] }

  // five attacking numbers, pushing harder as time goes on; backing off slows repeat offenders
  const wave = 9 + clock.value * 0.9
  botAcc += dt * wave * (sw.backoff ? 0.3 : 1)
  while (botAcc > 1) { botAcc--; spawn(true, Math.floor(Math.random() * 5)) }
  // ordinary people: one try each, though some mistype and try again
  humanAcc += dt * 1.6
  while (humanAcc > 1) {
    humanAcc--
    const src = nextHuman++
    spawn(false, src)
    if (Math.random() < 0.3) retries.push({ at: clock.value + 1.2, src })
  }
  for (let i = retries.length - 1; i >= 0; i--) if (retries[i].at <= clock.value) { spawn(false, retries[i].src); retries.splice(i, 1) }

  let through = 0
  for (const d of dots) {
    if (d.state === 'drop') { d.life -= dt * 2.4; d.x -= dt * 60; continue }
    d.x += dt * 300
    if (d.state === 'in' && d.x >= GATE) gate(d)
    if (d.state === 'pass' && d.x >= SERVER) { d.life = 0; through++ }
  }
  dots = dots.filter(d => d.life > 0)
  load += (through / dt - load) * Math.min(1, dt * 3)
  if (load > CAPACITY) hp.value = Math.max(0, hp.value - (load - CAPACITY) * dt * 5.5)

  if (hp.value <= 0) finish(false, t('game.floodDown'))
  else if (locked.value >= MAX_LOCKED) finish(false, t('game.floodLocked'))
  else if (clock.value >= DURATION) finish(true, '')
}

function finish(ok: boolean, note: string) { running.value = false; emit('result', ok, note) }

function paint() {
  const g = el.value!.getContext('2d')!
  g.setTransform(2, 0, 0, 2, 0, 0)
  g.fillStyle = '#12161D'; g.fillRect(0, 0, W, H)
  g.strokeStyle = '#ffffff0d'; g.lineWidth = 1
  for (let y = 22; y < H; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
  // gate
  const shut = sw.blockAll
  g.fillStyle = shut ? '#B8321F' : '#F0C674'; g.fillRect(GATE, 8, 4, H - 16)
  g.font = '600 10px "IBM Plex Mono", monospace'; g.textAlign = 'center'
  g.fillText(t('game.gate').toUpperCase(), GATE + 2, H - 2 > 0 ? 8 : 8)
  // server, glowing hotter under load
  const heat = Math.min(1, load / (CAPACITY * 1.6))
  g.fillStyle = `rgb(${40 + heat * 190},${60 + (1 - heat) * 110},${70})`
  g.fillRect(SERVER, 30, 44, H - 60)
  g.fillStyle = '#0B0E13'
  for (let y = 44; y < H - 40; y += 18) g.fillRect(SERVER + 6, y, 32, 5)
  for (const d of dots) {
    g.globalAlpha = Math.max(0, d.life)
    g.fillStyle = d.state === 'drop' ? '#7B7466' : d.bot ? '#E0503A' : '#4CC38A'
    g.beginPath(); g.arc(d.x, d.y, d.bot ? 3 : 4.5, 0, Math.PI * 2); g.fill()
  }
  g.globalAlpha = 1
  g.textAlign = 'left'; g.fillStyle = '#E0503A'; g.fillText('● ' + t('game.bots'), 10, 14)
  g.fillStyle = '#4CC38A'; g.fillText('● ' + t('game.people'), 110, 14)
}

function loop(now: number) {
  // keep real time even when frames come slowly, in steps small enough for the dots
  let left = Math.min(0.25, (now - last) / 1000); last = now
  while (left > 0 && running.value) { const dt = Math.min(0.04, left); step(dt); left -= dt }
  paint()
  raf = requestAnimationFrame(loop)
}
onMounted(() => { last = performance.now(); raf = requestAnimationFrame(loop) })
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<style scoped>
.flood { position: relative; display: grid; gap: 10px; }
canvas { display: block; width: 100%; aspect-ratio: 760 / 220; border-radius: 3px; }
.start { position: absolute; left: 0; right: 0; top: 0; aspect-ratio: 760 / 220; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 16px; text-align: center; background: #12161DE6; color: #E7E3DA; border-radius: 3px; }
.start p { margin: 0; max-width: 52ch; font-size: 14px; line-height: 1.55; }
.start .btn { background: #E7E3DA; color: #0B0E13; }
.meters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px; font-weight: 600; color: var(--color-pen-2); }
.meters i { display: block; height: 7px; margin-top: 4px; background: var(--color-paper-3); border-radius: 3px; overflow: hidden; }
.meters b { display: block; height: 100%; transition: width .2s; }
.controls { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.slider { grid-column: 1 / -1; display: grid; gap: 4px; padding: 10px 12px; border: 1px solid var(--color-paper-line); border-radius: 3px; background: #F6F2E8; font-size: 14px; font-weight: 600; }
.slider input { width: 100%; accent-color: var(--cat); }
.toggle { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border: 1px solid var(--color-paper-line); border-radius: 3px; background: #F6F2E8; font-size: 13.5px; cursor: pointer; }
.toggle.on { border-color: var(--cat); box-shadow: inset 4px 0 0 var(--cat); background: #FBF8F1; font-weight: 600; }
.toggle input { accent-color: var(--cat); }
@media (max-width: 560px) { .controls, .meters { grid-template-columns: 1fr; } }
</style>
