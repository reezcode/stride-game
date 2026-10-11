<!-- Her handwritten book lies under the bank's statement. Move the lens to read through it, and mark the lines that were changed. -->
<template>
  <div class="lens-game">
    <p class="how">{{ $t('game.lensHow') }}</p>
    <div ref="el" class="sheet" :style="{ height: `${rows.length * ROW}px` }"
      @pointermove="move" @pointerdown="move" @pointerleave="x = -999" @click="tap">
      <div class="layer bank">
        <div v-for="(r, i) in rows" :key="i" :class="['line', { on: picked.includes(i) }]">
          <span class="t-mono">{{ r.other }}</span>
          <span v-if="picked.includes(i)" class="tag">{{ puzzle.mark }}</span>
        </div>
      </div>
      <div class="layer book" :style="{ clipPath: `circle(${R}px at ${x}px ${y}px)` }">
        <div v-for="(r, i) in rows" :key="i" class="line">{{ r.text }}</div>
      </div>
      <div class="ring" :style="{ left: `${x - R}px`, top: `${y - R}px`, width: `${R * 2}px`, height: `${R * 2}px` }"></div>
    </div>
    <div class="legend"><span>{{ puzzle.columns?.[1] }}</span><span class="pen">{{ puzzle.columns?.[0] }} · {{ $t('game.underLens') }}</span></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Puzzle } from '@/data/story'
import { sfx } from '@/game/audio'
import { t } from '@/i18n'

const props = defineProps<{ puzzle: Puzzle }>()
const emit = defineEmits<{ result: [ok: boolean, note: string] }>()
const ROW = 54, R = 92
const rows = props.puzzle.items
const el = ref<HTMLElement | null>(null)
const x = ref(-999), y = ref(0)
const picked = ref<number[]>([])

function move(e: PointerEvent) {
  const b = el.value!.getBoundingClientRect()
  x.value = e.clientX - b.left; y.value = e.clientY - b.top
}
function tap(e: MouseEvent) {
  const i = Math.floor((e.clientY - el.value!.getBoundingClientRect().top) / ROW)
  if (i < 0 || i >= rows.length) return
  const at = picked.value.indexOf(i)
  if (at === -1) picked.value.push(i); else picked.value.splice(at, 1)
  sfx.blip()
}
function check() {
  const right = picked.value.filter(i => rows[i].pick).length
  const wrong = picked.value.length - right
  const missed = rows.filter(r => r.pick).length - right
  emit('result', !wrong && !missed, t('puzzle.wrongCount', { right, wrong, missed }))
}
defineExpose({ check })
</script>

<style scoped>
.how { margin: 0 0 10px; font-size: 13px; color: var(--color-pen-3); }
.sheet { position: relative; border: 1px solid var(--color-paper-line); border-radius: 3px; overflow: hidden; cursor: none; touch-action: none; user-select: none; }
.layer { position: absolute; inset: 0; }
.line { height: 54px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 16px; border-bottom: 1px dashed var(--color-paper-line); }
.bank { background: #F6F2E8; }
.bank .line { font-size: 13px; }
.bank .line.on { background: #FBF8F1; box-shadow: inset 4px 0 0 var(--cat); }
.book { background: #FFFDF2 repeating-linear-gradient(transparent 0 26px, #9DB7D955 26px 27px); pointer-events: none; }
.book .line { font-family: 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 17px; color: #1F3F8A; border-bottom-color: transparent; }
.ring { position: absolute; border-radius: 50%; border: 3px solid #2C241D; box-shadow: 0 6px 22px #0006, inset 0 0 18px #0002; pointer-events: none; }
.tag { padding: 2px 8px; border-radius: 2px; background: var(--cat); color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
.legend { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: var(--color-pen-3); }
.legend .pen { color: #1F3F8A; }
</style>
