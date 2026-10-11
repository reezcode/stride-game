<!-- Sticky notes on a timeline. Drag them into the order things happened. -->
<template>
  <div class="drag-game">
    <p class="how">{{ $t('game.dragHow') }}</p>
    <ol ref="list" class="rail" @pointermove="move" @pointerup="drop" @pointercancel="drop">
      <li v-for="(i, pos) in order" :key="i" :class="['note', `c${i % 3}`, { lifted: held === i }]"
        :style="{ '--tilt': `${((i * 37) % 7) - 3}deg` }" @pointerdown="grab($event, i)">
        <span class="pos t-mono">{{ pos + 1 }}</span>
        <span>{{ puzzle.items[i].text }}</span>
        <IconGripVertical class="grip" :size="18" />
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconGripVertical } from '@tabler/icons-vue'
import type { Puzzle } from '@/data/story'
import { sfx } from '@/game/audio'
import { t } from '@/i18n'

const props = defineProps<{ puzzle: Puzzle }>()
const emit = defineEmits<{ result: [ok: boolean, note: string] }>()
const n = props.puzzle.items.length
// dealt the same scrambled way every time, and never already solved
const order = ref([3, 0, 5, 1, 4, 2, 6, 7].filter(i => i < n))
const held = ref<number | null>(null)
const list = ref<HTMLElement | null>(null)

function grab(e: PointerEvent, i: number) { held.value = i; list.value!.setPointerCapture(e.pointerId) }
function move(e: PointerEvent) {
  if (held.value === null) return
  const els = [...list.value!.children] as HTMLElement[]
  let to = els.findIndex(el => e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2)
  if (to === -1) to = els.length - 1
  const from = order.value.indexOf(held.value)
  if (to === from) return
  order.value.splice(from, 1)
  order.value.splice(to, 0, held.value)
  sfx.type()
}
function drop() { if (held.value !== null) { held.value = null; sfx.paper() } }
function check() {
  const placed = order.value.filter((v, i) => v === i).length
  emit('result', placed === n, t('puzzle.orderWrong', { n: placed, total: n }))
}
defineExpose({ check })
</script>

<style scoped>
.how { margin: 0 0 10px; font-size: 13px; color: var(--color-pen-3); }
.rail { list-style: none; margin: 0; padding: 4px 0 4px 26px; display: grid; gap: 8px; border-left: 3px solid var(--color-pen); touch-action: none; user-select: none; }
.note { position: relative; display: flex; align-items: center; gap: 12px; padding: 12px 14px; font-size: 15px; line-height: 1.4; color: #2A2418; box-shadow: 0 3px 8px #0003; transform: rotate(var(--tilt)); cursor: grab; transition: transform .15s, box-shadow .15s; }
.note::before { content: ''; position: absolute; left: -33px; top: 50%; width: 11px; height: 11px; margin-top: -6px; border-radius: 50%; background: var(--color-pen); }
.note.c0 { background: #F2DE77; } .note.c1 { background: #F2B3BD; } .note.c2 { background: #A9D8E6; }
.note.lifted { transform: rotate(0) scale(1.03); box-shadow: 0 14px 30px #0006; cursor: grabbing; z-index: 2; }
.pos { width: 24px; height: 24px; flex-shrink: 0; display: grid; place-items: center; border-radius: 50%; background: #0000001F; font-size: 12px; font-weight: 600; }
.grip { margin-left: auto; opacity: .45; flex-shrink: 0; }
</style>
