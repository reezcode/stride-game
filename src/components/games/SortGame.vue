<!-- Messages arrive one at a time on a clock. Swipe each one to the side it belongs on. -->
<template>
  <div class="sort">
    <div v-if="!running" class="start">
      <p>{{ $t('game.sortHow', { mark: puzzle.mark }) }}</p>
      <button class="btn btn-ink" @click="start">{{ $t('game.start') }}</button>
    </div>
    <template v-else>
      <div class="clock"><span :style="{ width: `${left * 100}%` }"></span></div>
      <div class="table" :class="flash">
        <div class="lane l" :class="{ hot: dx < -50 }"><IconArrowLeft :size="18" /> {{ $t('game.real') }}</div>
        <div class="card" :key="at" :style="{ transform: `translateX(${dx}px) rotate(${dx / 22}deg)` }"
          @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
          <div class="card-sub">{{ item.sub }}</div>
          <div class="card-text">{{ item.text }}</div>
        </div>
        <div class="lane r" :class="{ hot: dx > 50 }">{{ puzzle.mark }} <IconArrowRight :size="18" /></div>
      </div>
      <div class="row">
        <button class="btn btn-outline" @click="decide(false)"><span class="kbd">←</span> {{ $t('game.real') }}</button>
        <span class="count t-mono">{{ at + 1 }}/{{ deck.length }} · ✕ {{ strikes }}</span>
        <button class="btn btn-outline" @click="decide(true)">{{ puzzle.mark }} <span class="kbd">→</span></button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-vue'
import type { Puzzle } from '@/data/story'
import { sfx } from '@/game/audio'
import { t } from '@/i18n'

const props = defineProps<{ puzzle: Puzzle }>()
const emit = defineEmits<{ result: [ok: boolean, note: string] }>()

const PER_CARD = 9
const deck = [...props.puzzle.items].sort(() => Math.random() - 0.5)
const running = ref(false)
const at = ref(0)
const strikes = ref(0)
const left = ref(1)
const dx = ref(0)
const flash = ref('')
const item = computed(() => deck[at.value])
let raf = 0, last = 0, grab: number | null = null

function start() { running.value = true; last = performance.now(); raf = requestAnimationFrame(tick); window.addEventListener('keydown', key, true) }
function tick(now: number) {
  left.value -= (now - last) / 1000 / PER_CARD
  last = now
  if (left.value <= 0) judge(false)
  if (running.value) raf = requestAnimationFrame(tick)
}
function decide(fake: boolean) { if (running.value) judge(fake === !!item.value.pick) }
function judge(right: boolean) {
  if (!right) { strikes.value++; sfx.denied() } else sfx.blip()
  flash.value = right ? 'good' : 'bad'
  window.setTimeout(() => { flash.value = '' }, 220)
  dx.value = 0; left.value = 1
  if (at.value + 1 >= deck.length) { stop(); emit('result', strikes.value === 0, t('game.sortNote', { n: strikes.value })); return }
  at.value++
}
function down(e: PointerEvent) { grab = e.clientX - dx.value; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
function move(e: PointerEvent) { if (grab !== null) dx.value = e.clientX - grab }
function up() { if (grab === null) return; grab = null; if (Math.abs(dx.value) > 90) decide(dx.value > 0); else dx.value = 0 }
function key(e: KeyboardEvent) { if (e.key === 'ArrowLeft') decide(false); else if (e.key === 'ArrowRight') decide(true) }
function stop() { running.value = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', key, true) }
onUnmounted(stop)
</script>

<style scoped>
.sort { min-height: 300px; display: grid; align-content: center; gap: 14px; }
.start { display: grid; justify-items: center; gap: 14px; text-align: center; font-size: 14px; color: var(--color-pen-2); }
.start p { margin: 0; max-width: 46ch; line-height: 1.6; }
.clock { height: 6px; background: var(--color-paper-3); border-radius: 3px; overflow: hidden; }
.clock span { display: block; height: 100%; background: var(--cat); }
.table { display: grid; grid-template-columns: 1fr minmax(240px, 380px) 1fr; align-items: center; gap: 12px; padding: 20px 0; border-radius: 4px; transition: background-color .2s; }
.table.good { background: #2F7D5722; } .table.bad { background: #B8321F26; }
.lane { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--color-pen-3); transition: color .15s, transform .15s; }
.lane.l { justify-content: flex-end; } .lane.hot { color: var(--cat); transform: scale(1.12); }
.card { padding: 18px 20px; min-height: 120px; background: #FBF8F1; border: 1px solid var(--color-paper-line); border-radius: 18px 18px 18px 6px; box-shadow: 0 10px 30px #0003; cursor: grab; touch-action: none; user-select: none; animation: drop .25s cubic-bezier(.2,.8,.2,1.2); }
.card:active { cursor: grabbing; }
.card-sub { font-size: 12px; color: var(--color-pen-3); margin-bottom: 8px; }
.card-text { font-size: 18px; line-height: 1.45; }
@keyframes drop { from { opacity: 0; transform: translateY(-16px) scale(.96); } }
.row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.count { font-size: 13px; color: var(--color-pen-3); }
@media (max-width: 640px) { .table { grid-template-columns: 1fr; } .lane { display: none; } }
</style>
