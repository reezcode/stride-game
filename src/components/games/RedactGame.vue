<!-- A receipt and a marker pen. Scrub over a value to black it out. -->
<template>
  <div class="redact">
    <p class="how">{{ $t('game.redactHow') }}</p>
    <div ref="el" class="receipt" @pointerdown="down" @pointermove="draw" @pointerup="pen = false" @pointerleave="pen = false" @pointercancel="pen = false">
      <div class="r-head t-mono">PAYVAULT · /receipts/2024-03-16/TXN-90417</div>
      <div v-for="(f, i) in puzzle.items" :key="i" class="rf">
        <span class="label">{{ f.text }}</span>
        <span class="val t-mono" :data-i="i">
          {{ f.sub }}
          <span class="ink" :style="{ left: `${ink[i][0] * 100}%`, width: `${Math.max(0, ink[i][1] - ink[i][0]) * 100}%` }"></span>
        </span>
        <button class="undo" :title="$t('game.erase')" :disabled="ink[i][1] <= ink[i][0]" @click="ink[i] = [1, 0]"><IconEraser :size="16" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconEraser } from '@tabler/icons-vue'
import type { Puzzle } from '@/data/story'
import { t } from '@/i18n'

const props = defineProps<{ puzzle: Puzzle }>()
const emit = defineEmits<{ result: [ok: boolean, note: string] }>()
const el = ref<HTMLElement | null>(null)
const pen = ref(false)
// per field: the stretch of the value that has been inked over, as fractions of its width
const ink = ref<[number, number][]>(props.puzzle.items.map(() => [1, 0]))
const covered = (i: number) => ink.value[i][1] - ink.value[i][0] > 0.72

function down(e: PointerEvent) { pen.value = true; el.value!.setPointerCapture(e.pointerId); draw(e) }
function draw(e: PointerEvent) {
  if (!pen.value) return
  // captured pointers always report the container, so find the value under the pen ourselves
  const hit = (document.elementsFromPoint(e.clientX, e.clientY).find(n => (n as HTMLElement).dataset?.i !== undefined)) as HTMLElement | undefined
  if (!hit) return
  const i = Number(hit.dataset.i), b = hit.getBoundingClientRect()
  const f = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width))
  const [a, z] = ink.value[i]
  ink.value[i] = [Math.min(a, f - 0.06), Math.max(z, f + 0.06)]
}
function check() {
  const items = props.puzzle.items
  const right = items.filter((f, i) => f.pick && covered(i)).length
  const wrong = items.filter((f, i) => !f.pick && covered(i)).length
  const missed = items.filter(f => f.pick).length - right
  emit('result', !wrong && !missed, t('puzzle.wrongCount', { right, wrong, missed }))
}
defineExpose({ check })
</script>

<style scoped>
.how { margin: 0 0 10px; font-size: 13px; color: var(--color-pen-3); }
.receipt { max-width: 520px; margin: 0 auto; padding: 16px 20px 12px; background: #FFFEF8; border: 1px solid var(--color-paper-line); box-shadow: 0 8px 24px #0002; touch-action: none; user-select: none; cursor: crosshair; }
.r-head { font-size: 11px; color: var(--color-pen-3); padding-bottom: 10px; margin-bottom: 4px; border-bottom: 1px dashed var(--color-paper-line); word-break: break-all; }
.rf { display: grid; grid-template-columns: 130px 1fr 28px; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dotted var(--color-paper-line); }
.label { font-size: 12px; font-weight: 600; color: var(--color-pen-3); }
.val { position: relative; font-size: 15px; padding: 3px 4px; justify-self: start; min-width: 60%; }
.ink { position: absolute; top: -1px; bottom: -1px; background: #111; border-radius: 2px; transform: rotate(-.6deg); pointer-events: none; }
.undo { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 3px; background: transparent; color: var(--color-pen-3); cursor: pointer; }
.undo:disabled { opacity: .2; cursor: default; }
@media (max-width: 520px) { .rf { grid-template-columns: 96px 1fr 28px; } }
</style>
