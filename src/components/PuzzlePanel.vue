<template>
  <div class="backdrop" @mousedown.self="$emit('close')">
    <article class="sheet paper anim-rise" :style="{ '--cat': meta.color }" role="dialog" aria-modal="true" :aria-label="puzzle.title">
      <header class="head">
        <div class="head-main">
          <div class="t-label kicker">{{ $t('puzzle.kicker', { place }) }}</div>
          <h2 class="t-display title">{{ puzzle.title }}</h2>
        </div>
        <span v-if="solved" class="stamp anim-stamp name-stamp">{{ meta.name }}</span>
        <button class="close" :title="$t('puzzle.close')" @click="$emit('close')"><IconX :size="20" stroke-width="2" /></button>
      </header>

      <div class="body">
        <p class="brief">{{ puzzle.brief }}</p>

        <aside class="know">
          <div class="t-label know-k">{{ $t('puzzle.know') }}</div>
          <ul><li v-for="k in puzzle.know" :key="k">{{ k }}</li></ul>
        </aside>

        <div v-if="puzzle.columns" class="cols-head">
          <span>{{ puzzle.columns[0] }}</span><span>{{ puzzle.columns[1] }}</span>
        </div>

        <ol :class="['items', puzzle.layout, { done: solved }]">
          <li v-for="i in shown" :key="i">
            <button type="button" class="item"
              :class="{ on: isOn(i), bad: reveal && !solved && isWrong(i), right: solved && puzzle.mode === 'pick' && puzzle.items[i].pick }"
              :disabled="solved" :aria-pressed="isOn(i)" @click="toggle(i)">
              <span v-if="puzzle.mode === 'order'" class="num t-mono">{{ solved ? i + 1 : (order.indexOf(i) + 1 || '') }}</span>
              <span class="item-main">
                <span class="item-text">{{ puzzle.items[i].text }}</span>
                <span v-if="puzzle.items[i].sub" class="item-sub">{{ puzzle.items[i].sub }}</span>
              </span>
              <span v-if="puzzle.items[i].other" class="item-other t-mono">{{ puzzle.items[i].other }}</span>
              <span v-if="puzzle.mode === 'pick' && isOn(i)" class="tag">{{ puzzle.mark }}</span>
              <span v-if="solved && puzzle.items[i].why" class="why">{{ puzzle.items[i].why }}</span>
            </button>
          </li>
        </ol>

        <div v-if="solved" class="lesson">
          <span class="lesson-letter">{{ puzzle.letter }}</span>
          <div>
            <p>{{ puzzle.lesson }}</p>
            <p class="perk">{{ $t('puzzle.perk', { name: counter }) }}</p>
          </div>
        </div>
      </div>

      <footer class="foot">
        <template v-if="solved">
          <span class="muted good">{{ award }}</span>
          <button class="btn btn-ink" @click="finish">{{ $t('puzzle.done') }} <IconArrowRight :size="16" /></button>
        </template>
        <template v-else>
          <span class="muted" :class="{ warn: !!feedback }">{{ feedback || (puzzle.mode === 'pick' ? $t('puzzle.pickHint') : $t('puzzle.orderHint')) }}</span>
          <div class="actions">
            <button class="btn btn-outline" @click="clear">{{ $t('puzzle.clear') }}</button>
            <button class="btn btn-ink" :disabled="!canCheck" @click="check">{{ $t('puzzle.check') }}</button>
          </div>
        </template>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconX, IconArrowRight } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { COUNTERS, type Puzzle } from '@/data/story'
import { STRIDE_BY } from '@/game/stride'
import { rng } from '@/game/sprites'
import { sfx } from '@/game/audio'
import { t } from '@/i18n'

const props = defineProps<{ puzzle: Puzzle; place: string }>()
const emit = defineEmits<{ close: []; solved: [xp: number] }>()

const store = useGameStore()
const meta = computed(() => STRIDE_BY[props.puzzle.letter])
const n = props.puzzle.items.length
const counter = COUNTERS.find(c => c.id === props.puzzle.letter)?.name ?? ''

const already = store.puzzlesDone.includes(props.puzzle.id)
const solved = ref(already)
const picked = ref<number[]>([])
const order = ref<number[]>([])
const attempts = ref(0)
const feedback = ref('')
const reveal = ref(false)
const earned = ref(0)

// Order puzzles are dealt shuffled (the same way each time); solved ones show the true order.
const dealt = (() => {
  const idx = props.puzzle.items.map((_, i) => i)
  if (props.puzzle.mode !== 'order') return idx
  const R = rng(n * 7 + props.puzzle.id.length)
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  if (idx.every((v, i) => v === i)) idx.reverse()
  return idx
})()
const shown = computed(() => (solved.value ? props.puzzle.items.map((_, i) => i) : dealt))

const isOn = (i: number) => (props.puzzle.mode === 'pick' ? (solved.value ? !!props.puzzle.items[i].pick : picked.value.includes(i)) : order.value.includes(i))
const isWrong = (i: number) => props.puzzle.mode === 'pick'
  ? picked.value.includes(i) !== !!props.puzzle.items[i].pick
  : order.value.indexOf(i) !== i

const canCheck = computed(() => (props.puzzle.mode === 'pick' ? picked.value.length > 0 : order.value.length === n))
const award = computed(() => {
  if (already && !earned.value) return t('puzzle.solved')
  return attempts.value <= 1 ? t('puzzle.firstTry', { xp: earned.value }) : t('puzzle.attempts', { n: attempts.value, xp: earned.value })
})

function toggle(i: number) {
  if (solved.value) return
  const list = props.puzzle.mode === 'pick' ? picked : order
  const at = list.value.indexOf(i)
  if (at === -1) list.value.push(i)
  else list.value.splice(at, 1)
  feedback.value = ''
  sfx.blip()
}

function clear() {
  picked.value = []; order.value = []
  feedback.value = ''; reveal.value = false
}

function check() {
  if (!canCheck.value || solved.value) return
  attempts.value++
  const items = props.puzzle.items
  let ok: boolean
  if (props.puzzle.mode === 'pick') {
    const right = picked.value.filter(i => items[i].pick).length
    const wrong = picked.value.length - right
    const missed = items.filter(it => it.pick).length - right
    ok = wrong === 0 && missed === 0
    if (!ok) feedback.value = t('puzzle.wrongCount', { right, wrong, missed })
  } else {
    const placed = order.value.filter((v, i) => v === i).length
    ok = placed === n
    if (!ok) feedback.value = t('puzzle.orderWrong', { n: placed, total: n })
  }
  if (!ok) {
    sfx.denied()
    // after a second miss, show which ones are off
    if (attempts.value >= 2) { reveal.value = true; feedback.value += ' ' + t('puzzle.reveal') }
    return
  }
  earned.value = store.solvePuzzle(props.puzzle.id, attempts.value)
  solved.value = true
  sfx.stamp()
}

function finish() {
  if (earned.value) emit('solved', earned.value)
  else emit('close')
}

function onKey(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'Enter') { e.preventDefault(); if (solved.value) finish(); else check() }
}
onMounted(() => { window.addEventListener('keydown', onKey, true); sfx.open() })
onUnmounted(() => { window.removeEventListener('keydown', onKey, true); sfx.close() })
</script>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 62; display: grid; place-items: center; padding: 16px; background: #05070AB8; }
.sheet {
  width: min(820px, 100%);
  max-height: calc(100dvh - 32px);
  display: flex; flex-direction: column;
  border-radius: 4px;
  box-shadow: 0 30px 80px #000A;
  overflow: hidden;
}
.head { display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px 12px; border-bottom: 1px solid var(--color-paper-line); }
.head-main { flex: 1; min-width: 0; }
.kicker { color: var(--color-pen-3); margin-bottom: 6px; }
.title { font-size: clamp(26px, 4vw, 36px); margin: 0; }
.name-stamp { color: var(--cat); font-size: 18px; margin-top: 4px; }
.close { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border: 1px solid var(--color-paper-line); border-radius: 3px; background: transparent; cursor: pointer; }
.close:hover { background: var(--color-paper-2); }

.body { flex: 1; overflow-y: auto; padding: 16px 24px 20px; }
.brief { margin: 0 0 14px; font-size: 15px; line-height: 1.6; }
.know { padding: 10px 14px; margin-bottom: 16px; background: #FBF8F1; border: 1px solid var(--color-paper-line); border-left: 4px solid var(--cat); border-radius: 3px; }
.know-k { color: var(--color-pen-3); }
.know ul { margin: 6px 0 0; padding-left: 18px; font-size: 14px; line-height: 1.5; display: grid; gap: 2px; }

.cols-head { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 14px 6px; font-size: 12px; font-weight: 700; color: var(--color-pen-3); }
.items { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.items.fields { grid-template-columns: repeat(2, 1fr); }
.item {
  position: relative;
  width: 100%;
  display: flex; flex-wrap: wrap; align-items: flex-start; gap: 6px 12px;
  padding: 11px 14px;
  text-align: left;
  background: #F6F2E8;
  border: 1px solid var(--color-paper-line);
  border-radius: 3px;
  cursor: pointer;
  color: var(--color-pen);
}
.item:not(:disabled):hover { border-color: var(--color-pen-3); }
.item.on { border-color: var(--cat); box-shadow: inset 4px 0 0 var(--cat); background: #FBF8F1; }
.item.bad { outline: 2px dashed #B8321F; outline-offset: 1px; }
.item:disabled { cursor: default; }
.items.done .item:not(.right) { opacity: .78; }
.item-main { flex: 1; min-width: 0; display: grid; gap: 2px; }
.item-text { font-size: 15px; line-height: 1.4; }
.item-sub { font-size: 12px; color: var(--color-pen-3); }
.item-other { flex: 1; min-width: 0; font-size: 12.5px; line-height: 1.5; padding-left: 12px; border-left: 1px dashed var(--color-paper-line); }
.tag { align-self: center; padding: 2px 8px; border-radius: 2px; background: var(--cat); color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
.num { width: 26px; height: 26px; flex-shrink: 0; display: grid; place-items: center; border: 1px solid var(--color-paper-line); border-radius: 50%; font-size: 13px; font-weight: 600; background: #FBF8F1; }
.item.on .num { background: var(--cat); border-color: var(--cat); color: #fff; }
.why { flex-basis: 100%; font-size: 13px; line-height: 1.45; color: var(--color-pen-2); font-style: italic; }

/* messages: speech bubbles on a phone-ish column */
.items.messages { gap: 8px; }
.items.messages .item { border-radius: 16px 16px 16px 5px; max-width: 86%; background: #E9E4D6; }
.items.messages .item.on { background: #FBF8F1; }
/* fields: a receipt */
.items.fields .item-main { grid-template-columns: 1fr; }
.items.fields .item-sub { font-family: var(--font-mono); font-size: 13px; color: var(--color-pen); }
.items.fields .item-text { font-size: 12px; font-weight: 600; color: var(--color-pen-3); }

.lesson { display: flex; gap: 14px; margin-top: 18px; padding: 14px 16px; border: 1px solid var(--cat); border-radius: 3px; background: #FBF8F1; }
.lesson-letter { font-family: var(--font-cond); font-weight: 700; font-size: 44px; line-height: .9; color: var(--cat); }
.lesson p { margin: 0; font-size: 15px; line-height: 1.6; }
.lesson .perk { margin-top: 8px; font-size: 13px; font-weight: 600; color: var(--cat); }

.foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--color-paper-line); background: var(--color-paper-2); }
.muted { font-size: 13px; color: var(--color-pen-3); min-width: 0; }
.muted.warn { color: #B8321F; font-weight: 600; }
.muted.good { color: #2F7D57; font-weight: 600; }
.actions { display: flex; gap: 8px; flex-shrink: 0; }

@media (max-width: 640px) {
  .backdrop { padding: 0; }
  .sheet { max-height: 100dvh; height: 100dvh; border-radius: 0; }
  .head, .body, .foot { padding-left: 16px; padding-right: 16px; }
  .items.fields { grid-template-columns: 1fr; }
  .item-other { flex-basis: 100%; padding-left: 0; border-left: 0; border-top: 1px dashed var(--color-paper-line); padding-top: 6px; }
  .foot { flex-direction: column; align-items: stretch; }
  .actions .btn { flex: 1; }
}
</style>
