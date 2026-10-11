<template>
  <div class="backdrop" @mousedown.self="$emit('close')">
    <article class="sheet paper anim-rise" role="dialog" aria-modal="true" :aria-label="$t('nb.title')">
      <header class="head">
        <div class="head-main">
          <div class="t-label kicker">{{ $t('nb.kicker') }} · {{ store.playerName }}</div>
          <h2 class="t-display title">{{ $t('nb.title') }}</h2>
        </div>
        <button class="close" :title="$t('nb.close')" @click="$emit('close')"><IconX :size="20" stroke-width="2" /></button>
      </header>

      <div class="body">
        <!-- The six words: each one appears once you have worked it out for yourself -->
        <h3 class="h">{{ $t('nb.words') }} <span class="h-meta t-mono">{{ words.filter(w => w.known).length }}/6</span></h3>
        <ol class="words">
          <li v-for="w in words" :key="w.letter" :class="{ known: w.known }" :style="{ '--cat': w.color }">
            <span class="w-letter">{{ w.known ? w.letter : '?' }}</span>
            <div class="w-main">
              <div class="w-q">{{ w.question }}</div>
              <template v-if="w.known">
                <div class="w-name">{{ w.name }}</div>
                <p v-if="w.lesson" class="w-lesson">{{ w.lesson }}</p>
                <div class="w-meta">
                  <span v-if="w.puzzle">{{ $t('nb.fromPuzzle', { title: w.puzzle }) }}</span>
                  <span v-if="w.total">{{ $t('nb.cases', { n: w.hit, total: w.total }) }}</span>
                  <span v-if="w.puzzle" class="w-perk">{{ $t('nb.perk', { name: w.counter }) }}</span>
                </div>
              </template>
              <div v-else class="w-unknown">{{ $t('nb.unknown') }}</div>
            </div>
          </li>
        </ol>

        <h3 class="h">{{ $t('nb.proofs') }} <span class="h-meta t-mono">{{ gathered.length }}/{{ proofs.length }}</span></h3>
        <ul v-if="gathered.length" class="list proofs">
          <li v-for="p in gathered" :key="p.id"><b>{{ p.title }}</b><span>{{ p.text }}</span></li>
        </ul>
        <p v-else class="none">{{ $t('nb.nothing') }}</p>
        <p v-if="store.wrongAccusations" class="none warn">{{ $t('nb.wrong', { n: store.wrongAccusations }) }}</p>

        <template v-for="g in groups" :key="g.id">
          <h3 class="h">{{ g.name }} <span class="h-meta t-mono">{{ g.found.length }}/{{ g.total }}</span></h3>
          <ul v-if="g.found.length" class="list">
            <li v-for="f in g.found" :key="f.id"><b>{{ f.label }}</b><span>{{ f.text }}</span></li>
          </ul>
          <p v-else class="none">{{ $t('nb.nothing') }}</p>
        </template>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { IconX } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { scenarios } from '@/data'
import { clues, talks, puzzles, proofs, places, COUNTERS, fill, type Line } from '@/data/story'
import { interactables } from '@/game/world'
import { STRIDE } from '@/game/stride'
import { sfx } from '@/game/audio'

const emit = defineEmits<{ close: [] }>()
const store = useGameStore()

const gathered = computed(() => proofs.filter(p => store.getCase(p.id)?.solved))

// A word is yours once you solved its puzzle, put it on record in a case, or passed its manual chapter.
const words = computed(() => STRIDE.map(s => {
  const puzzle = puzzles.find(p => p.letter === s.letter && store.puzzlesDone.includes(p.id))
  const cov = store.strideCoverage.find(c => c.letter === s.letter)!
  return {
    ...s,
    known: !!puzzle || cov.hit > 0 || store.completedModules.includes(s.letter),
    puzzle: puzzle?.title,
    lesson: puzzle?.lesson,
    counter: COUNTERS.find(c => c.id === s.letter)?.name ?? '',
    hit: cov.hit, total: cov.total,
  }
}))

const labelOf = (id: string) => interactables.find(i => i.id === id)?.label ?? id
// the first thing said or seen is enough to jog the memory
function gist(lines: Line[]) {
  const l = lines.find(l => l.k === 'narr' || l.k === 'say')
  return l && 'text' in l ? fill(l.text, store.playerName) : ''
}

const groups = computed(() => places.map(p => {
  const all = [
    ...Object.entries(clues).filter(([, c]) => c.place === p.id),
    ...Object.entries(talks).filter(([, c]) => c.place === p.id),
  ]
  const ps = puzzles.filter(z => z.place === p.id)
  return {
    id: p.id, name: p.name,
    total: all.length + ps.length + (p.id === 'hq' ? store.evidenceTotal : 0),
    found: [
      ...all.filter(([id]) => store.storyClues.includes(id)).map(([id, c]) => ({ id, label: labelOf(id), text: gist(c.lines) })),
      ...ps.filter(z => store.puzzlesDone.includes(z.id)).map(z => ({ id: z.id, label: z.title, text: z.brief })),
      ...(p.id === 'hq' ? store.cases.flatMap(c => {
        const sc = scenarios.find(s => s.id === c.scenarioId)!
        return c.evidenceFound.map(i => ({
          id: `${c.scenarioId}-${i}`,
          label: interactables.find(x => x.scenarioId === c.scenarioId && x.detail === i)?.label ?? sc.code,
          text: sc.details[i],
        }))
      }) : []),
    ],
  }
}))

function onKey(e: KeyboardEvent) {
  e.stopPropagation()
  if (!e.repeat && (e.key === 'Escape' || e.key.toLowerCase() === 'n')) { e.preventDefault(); emit('close') }
}

onMounted(() => { window.addEventListener('keydown', onKey, true); sfx.paper() })
onUnmounted(() => window.removeEventListener('keydown', onKey, true))
</script>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 62; display: grid; place-items: center; padding: 16px; background: #05070AB8; }
.sheet { width: min(860px, 100%); height: min(860px, calc(100dvh - 32px)); display: flex; flex-direction: column; border-radius: 4px; box-shadow: 0 30px 80px #000A; overflow: hidden; }
.head { display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px 12px; border-bottom: 1px solid var(--color-paper-line); }
.head-main { flex: 1; min-width: 0; }
.kicker { color: var(--color-pen-3); margin-bottom: 6px; }
.title { font-size: clamp(26px, 4vw, 36px); margin: 0; }
.close { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border: 1px solid var(--color-paper-line); border-radius: 3px; background: transparent; cursor: pointer; }
.close:hover { background: var(--color-paper-2); }
.body { flex: 1; overflow-y: auto; padding: 4px 24px 24px; }

.h { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 13px; font-weight: 700; margin: 22px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--color-pen); }
.h-meta { font-weight: 500; color: var(--color-pen-3); font-size: 12px; }

.words { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.words li { display: flex; gap: 12px; padding: 12px 14px; border: 1px dashed var(--color-paper-line); border-radius: 3px; background: #F1ECDF; }
.words li.known { border-style: solid; border-left: 4px solid var(--cat); background: #FBF8F1; }
.w-letter { font-family: var(--font-cond); font-weight: 700; font-size: 34px; line-height: .9; width: 24px; flex-shrink: 0; color: var(--color-pen-3); }
.known .w-letter { color: var(--cat); }
.w-main { min-width: 0; }
.w-q { font-size: 13.5px; font-weight: 600; line-height: 1.4; }
.w-name { margin-top: 3px; font-family: var(--font-cond); font-weight: 700; font-size: 19px; color: var(--cat); }
.w-lesson { margin: 4px 0 0; font-size: 13px; line-height: 1.5; color: var(--color-pen-2); }
.w-meta { display: grid; gap: 1px; margin-top: 6px; font-size: 12px; color: var(--color-pen-3); }
.w-perk { color: var(--cat); font-weight: 600; }
.w-unknown { margin-top: 4px; font-size: 13px; font-style: italic; color: var(--color-pen-3); }

.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.list li { display: grid; grid-template-columns: minmax(140px, 220px) 1fr; gap: 14px; padding: 8px 0; border-bottom: 1px dashed var(--color-paper-line); font-size: 13.5px; line-height: 1.5; }
.list span { color: var(--color-pen-2); }
.proofs li { border-left: 3px solid #2F7D57; padding-left: 10px; }
.none { margin: 0; font-size: 13px; color: var(--color-pen-3); font-style: italic; }
.none.warn { margin-top: 8px; color: #B8321F; font-style: normal; }

@media (max-width: 640px) {
  .backdrop { padding: 0; }
  .sheet { height: 100dvh; border-radius: 0; }
  .head, .body { padding-left: 16px; padding-right: 16px; }
  .words { grid-template-columns: 1fr; }
  .list li { grid-template-columns: 1fr; gap: 2px; }
}
</style>
