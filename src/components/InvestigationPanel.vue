<template>
  <div class="backdrop" @mousedown.self="$emit('close')">
    <article class="sheet paper anim-rise" role="dialog" aria-modal="true" :aria-label="`Case file ${scenario.code}`">
      <header class="head">
        <div class="head-main">
          <div class="t-label kicker">Case file · {{ scenario.code }} · {{ roomName }}</div>
          <h2 class="title t-display">{{ scenario.title }}</h2>
        </div>
        <span v-if="caseState?.solved" class="stamp head-stamp" :class="{ 'anim-stamp': justSealed }"
          :style="{ color: caseState.score >= 50 ? '#2F7D57' : '#B8321F' }">Sealed</span>
        <button class="close" title="Close (Esc)" @click="$emit('close')">
          <IconX :size="20" stroke-width="2" />
        </button>
      </header>

      <nav class="tabs" role="tablist">
        <button v-for="tb in tabs" :key="tb.id" role="tab" :aria-selected="tab === tb.id"
          :class="{ on: tab === tb.id }" @click="tab = tb.id">
          {{ tb.label }}
          <span v-if="tb.badge" class="badge t-mono">{{ tb.badge }}</span>
        </button>
      </nav>

      <div ref="bodyEl" class="body">
        <!-- ───────── Evidence ───────── -->
        <div v-if="tab === 'evidence'" class="cols">
          <section>
            <h3 class="h">Incident summary</h3>
            <p class="lede">{{ scenario.context }}</p>

            <h3 class="h">
              Clues from the room
              <span class="h-meta t-mono">{{ found.length }}/{{ scenario.details.length }} recovered</span>
            </h3>
            <ol class="evidence">
              <li v-for="(d, i) in scenario.details" :key="i" :class="{ missing: !found.includes(i) }">
                <span class="ev-no t-mono">{{ String(i + 1).padStart(2, '0') }}</span>
                <div v-if="found.includes(i)">
                  <p>{{ d }}</p>
                  <div class="ev-src">{{ sourceOf(i) }}</div>
                </div>
                <div v-else>
                  <div class="redacted" :style="{ width: `${60 + ((i * 37) % 35)}%` }"></div>
                  <div class="ev-src">Not recovered. Search the {{ roomName }} for marked objects.</div>
                </div>
              </li>
            </ol>
            <p v-if="!caseState?.solved && found.length < scenario.details.length" class="note">
              Each piece recovered before sealing is worth +{{ XP_RULES.evidence }} XP.
            </p>
          </section>

          <section>
            <h3 class="h">System evidence</h3>
            <div v-for="(info, i) in scenario.systemInfo" :key="i" class="sys">
              <div v-if="info.endpoint" class="sys-row">
                <div class="sys-k">Endpoint</div>
                <code class="endpoint t-mono">{{ info.endpoint }}</code>
              </div>
              <div v-if="info.request" class="sys-row">
                <div class="sys-k">Request</div>
                <pre class="codeblock">{{ info.request }}</pre>
              </div>
              <div v-if="info.response" class="sys-row">
                <div class="sys-k">Response</div>
                <pre class="codeblock resp">{{ info.response }}</pre>
              </div>
              <p v-if="info.note" class="sys-note">{{ info.note }}</p>
            </div>

            <h3 class="h">Analyst hints</h3>
            <ol v-if="hintsShown.length" class="hints">
              <li v-for="h in hintsShown" :key="h">{{ h }}</li>
            </ol>
            <button v-if="!caseState?.solved && hintsShown.length < scenario.hints.length"
              class="btn btn-outline btn-sm" @click="takeHint">
              <IconBulb :size="16" stroke-width="1.8" />
              Request a hint
              <span class="cost t-mono">{{ XP_RULES.hint }} XP</span>
            </button>
            <p v-else-if="!hintsShown.length" class="note">No hints used.</p>
          </section>
        </div>

        <!-- ───────── Report ───────── -->
        <div v-else-if="tab === 'report'" class="report">
          <p class="lede">
            Put on record what this system let someone do to her. Mark every kind of harm that applies, then say
            in your own words what happened. Each one you get right earns <b>+{{ XP_RULES.correct }}</b>, judging how
            serious it was adds <b>+{{ XP_RULES.severityMatch }}</b>, and an accusation that does not hold
            costs <b>{{ XP_RULES.falsePositive }}</b>. A record with a wrong claim in it is easier to throw out.
          </p>

          <div class="picker">
            <button v-for="c in STRIDE" :key="c.letter" type="button"
              :class="['pick', { on: selected.includes(c.letter) }]"
              :style="{ '--cat': c.color }"
              :aria-pressed="selected.includes(c.letter)"
              @click="toggle(c.letter)">
              <span class="pick-letter">{{ c.letter }}</span>
              <span class="pick-text">
                <span class="pick-name">{{ c.question }}</span>
                <span class="pick-q">{{ c.name }}</span>
              </span>
              <IconCheck v-if="selected.includes(c.letter)" class="pick-check" :size="18" stroke-width="2.4" />
            </button>
          </div>

          <div v-if="selected.length" class="concerns">
            <ConcernCard v-for="cat in orderedSelected" :key="cat"
              :category="cat" :concern="getConcern(cat)" @update="concerns[cat] = $event" />
          </div>
        </div>

        <!-- ───────── Findings ───────── -->
        <div v-else-if="tab === 'findings' && caseState" class="findings">
          <blockquote v-if="fragment" class="draft">
            <div class="t-label draft-k">Laras · draft, never sent</div>
            <p>{{ fragment.draft }}</p>
            <footer><b>You can now prove:</b> {{ proof?.text }}</footer>
          </blockquote>
          <div class="score-row">
            <div>
              <div class="big t-display" :style="{ color: scoreColor }">{{ caseState.score }}%</div>
              <div class="muted">of what was done here, on record</div>
            </div>
            <table class="xp-table t-mono">
              <tbody>
                <tr v-for="row in xpRows" :key="row.label" :class="{ neg: row.value < 0, zero: row.value === 0 }">
                  <td>{{ row.label }}</td><td>{{ row.value > 0 ? '+' : '' }}{{ row.value }}</td>
                </tr>
                <tr class="total"><td>Case total</td><td>+{{ caseState.xpEarned }} XP</td></tr>
              </tbody>
            </table>
          </div>

          <h3 class="h">What this system allowed</h3>
          <div v-for="gt in scenario.groundTruth" :key="gt.category + gt.title"
            :class="['truth', caseState.correct.includes(gt.category) ? 'hit' : 'miss']"
            :style="{ '--cat': STRIDE_BY[gt.category].color }">
            <div class="truth-top">
              <span class="pick-letter">{{ gt.category }}</span>
              <div class="truth-title">
                <b>{{ gt.title }}</b>
                <span class="muted">{{ STRIDE_BY[gt.category].name }} · {{ gt.severity }}</span>
              </div>
              <span class="verdict">
                <template v-if="caseState.correct.includes(gt.category)"><IconCheck :size="16" stroke-width="2.4" /> Found</template>
                <template v-else><IconX :size="16" stroke-width="2.4" /> Missed</template>
              </span>
            </div>
            <p>{{ gt.explanation }}</p>
            <p v-if="filedFor(gt.category)" class="yours">
              You wrote: “{{ filedFor(gt.category)!.title }}” · rated {{ filedFor(gt.category)!.severity }}
              <span v-if="filedFor(gt.category)!.severity === gt.severity" class="ok">severity matches</span>
            </p>
          </div>

          <template v-if="caseState.falsePositives.length">
            <h3 class="h">Did not apply</h3>
            <div v-for="cat in caseState.falsePositives" :key="cat" class="truth fp" :style="{ '--cat': STRIDE_BY[cat].color }">
              <div class="truth-top">
                <span class="pick-letter">{{ cat }}</span>
                <div class="truth-title">
                  <b>{{ filedFor(cat)?.title }}</b>
                  <span class="muted">{{ STRIDE_BY[cat].name }} — not a threat in this scenario</span>
                </div>
                <span class="verdict">{{ XP_RULES.falsePositive }} XP</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <footer class="foot">
        <template v-if="caseState?.solved">
          <span class="muted">This case is sealed. Nobody can wipe it now.</span>
          <button class="btn btn-ink" @click="$emit('close')">Return to the floor</button>
        </template>
        <template v-else-if="tab === 'evidence'">
          <span class="muted">{{ found.length < scenario.details.length ? 'You can seal it now, or keep searching the room.' : 'Every clue in the room recovered.' }}</span>
          <button class="btn btn-ink" @click="tab = 'report'">Put it on record <IconArrowRight :size="16" /></button>
        </template>
        <template v-else>
          <span class="muted">{{ submitHint }}</span>
          <button class="btn btn-alarm" :disabled="!canSubmit" @click="seal">
            <IconGavel :size="17" stroke-width="1.8" /> Seal the case
          </button>
        </template>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { IconX, IconCheck, IconBulb, IconArrowRight, IconGavel } from '@tabler/icons-vue'
import { useGameStore, type FiledConcern, type StrideCategory } from '@/stores/game'
import { scenarios } from '@/data'
import { interactables, rooms } from '@/game/world'
import { STRIDE, STRIDE_BY, XP_RULES } from '@/game/stride'
import { sfx } from '@/game/audio'
import { fragments, proofById } from '@/data/story'
import ConcernCard from './ConcernCard.vue'

const props = defineProps<{ scenarioId: string }>()
const emit  = defineEmits<{ close: []; solved: [xp: number] }>()

const store     = useGameStore()
const scenario  = computed(() => scenarios.find(s => s.id === props.scenarioId)!)
const caseState = computed(() => store.getCase(props.scenarioId))
const roomName  = computed(() => rooms.find(r => r.scenarioId === props.scenarioId)?.name ?? '')
const found     = computed(() => caseState.value?.evidenceFound ?? [])
const fragment  = computed(() => fragments[props.scenarioId])
const proof     = computed(() => proofById[props.scenarioId])
const hintsShown = computed(() => scenario.value.hints.slice(0, caseState.value?.hintsUsed ?? 0))

type Tab = 'evidence' | 'report' | 'findings'
const tab = ref<Tab>(caseState.value?.solved ? 'findings' : 'evidence')
const justSealed = ref(false)
const bodyEl = ref<HTMLElement | null>(null)
watch(tab, () => bodyEl.value?.scrollTo({ top: 0 }))

const tabs = computed(() => {
  const list: { id: Tab; label: string; badge?: string }[] = [
    { id: 'evidence', label: 'Clues', badge: `${found.value.length}/${scenario.value.details.length}` },
  ]
  if (caseState.value?.solved) list.push({ id: 'findings', label: 'Findings' })
  else list.push({ id: 'report', label: 'Record', badge: selected.value.length ? String(selected.value.length) : undefined })
  return list
})

function sourceOf(i: number) {
  const it = interactables.find(x => x.scenarioId === props.scenarioId && x.detail === i)
  return it ? `Recovered from: ${it.label}` : ''
}

function takeHint() {
  store.useHint(props.scenarioId)
  sfx.paper()
}

// ── Report ──
const selected = ref<StrideCategory[]>([])
const concerns = ref<Record<string, Omit<FiledConcern, 'id' | 'category'>>>({})
const orderedSelected = computed(() => STRIDE.map(s => s.letter).filter(l => selected.value.includes(l)))

function toggle(letter: StrideCategory) {
  const i = selected.value.indexOf(letter)
  if (i === -1) selected.value.push(letter)
  else selected.value.splice(i, 1)
  sfx.blip()
}

function getConcern(cat: string) {
  return concerns.value[cat] ?? { title: '', explanation: '', severity: 'High' as const }
}

const canSubmit = computed(() =>
  selected.value.length > 0 &&
  selected.value.every(cat => (concerns.value[cat]?.title ?? '').trim().length > 0),
)
const submitHint = computed(() => {
  if (!selected.value.length) return 'Mark at least one kind of harm.'
  const missing = selected.value.filter(c => !(concerns.value[c]?.title ?? '').trim()).length
  return missing ? `${missing} finding${missing > 1 ? 's' : ''} still need a title.` : 'Ready to file.'
})

function seal() {
  if (!canSubmit.value) return
  const filed: FiledConcern[] = orderedSelected.value.map(cat => ({
    id: `${props.scenarioId}-${cat}`,
    category: cat,
    title: concerns.value[cat].title.trim(),
    explanation: concerns.value[cat].explanation.trim(),
    severity: concerns.value[cat].severity,
  }))
  store.solveCase(props.scenarioId, filed)
  justSealed.value = true
  tab.value = 'findings'
  sfx.stamp()
  emit('solved', caseState.value?.xpEarned ?? 0)
}

// ── Findings ──
function filedFor(cat: string) {
  return caseState.value?.filedConcerns.find(f => f.category === cat)
}
const scoreColor = computed(() => {
  const s = caseState.value?.score ?? 0
  return s >= 80 ? '#2F7D57' : s >= 50 ? '#A8680F' : '#B8321F'
})
const xpRows = computed(() => {
  const b = caseState.value?.breakdown
  if (!b) return []
  return [
    { label: 'Correct categories', value: b.correct },
    { label: 'Severity matches',   value: b.severity },
    { label: 'Evidence recovered', value: b.evidence },
    { label: 'Hints used',         value: b.hints },
    { label: 'Wrong categories',   value: b.falsePositives },
  ]
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.stopPropagation(); emit('close') }
}
onMounted(() => { window.addEventListener('keydown', onKey, true); sfx.open() })
onUnmounted(() => { window.removeEventListener('keydown', onKey, true); sfx.close() })
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
  background: #05070AB8;
}

.sheet {
  width: min(980px, 100%);
  height: min(860px, calc(100dvh - 32px));
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  box-shadow: 0 30px 80px #000A, 0 0 0 1px #00000040;
  overflow: hidden;
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px 14px;
}
.head-main { flex: 1; min-width: 0; }
.kicker { color: var(--color-pen-3); margin-bottom: 6px; }
.title { font-size: clamp(26px, 4vw, 36px); margin: 0; }
.head-stamp { color: #2F7D57; font-size: 22px; margin-top: 6px; }
.close {
  display: grid; place-items: center;
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid var(--color-paper-line);
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
}
.close:hover { background: var(--color-paper-2); }

.tabs {
  display: flex;
  gap: 2px;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-paper-line);
}
.tabs button {
  display: flex; align-items: center; gap: 8px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 3px 3px 0 0;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-pen-3);
  cursor: pointer;
  margin-bottom: -1px;
}
.tabs button:hover { color: var(--color-pen); }
.tabs button.on {
  color: var(--color-pen);
  background: var(--color-paper);
  border-color: var(--color-paper-line);
}
.badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  background: var(--color-paper-3);
  color: var(--color-pen-2);
}

.body { flex: 1; overflow-y: auto; padding: 8px 24px 24px; }

.cols { display: grid; grid-template-columns: 1.05fr 1fr; gap: 32px; }
@media (max-width: 820px) { .cols { grid-template-columns: 1fr; gap: 0; } }

.h {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  font-size: 13px;
  font-weight: 700;
  margin: 22px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-pen);
}
.h-meta { font-weight: 500; color: var(--color-pen-3); font-size: 12px; }
.lede { font-size: 15px; line-height: 1.65; margin: 0; white-space: pre-line; color: var(--color-pen); }
.note, .muted { font-size: 13px; color: var(--color-pen-3); }
.note { margin: 10px 0 0; }

.evidence { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.evidence li {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--color-paper-line);
}
.evidence p { margin: 0; font-size: 14px; line-height: 1.5; }
.ev-no { font-size: 12px; color: var(--color-pen-3); padding-top: 2px; }
.ev-src { font-size: 12px; color: var(--color-pen-3); margin-top: 3px; }
.redacted { height: 14px; margin-top: 3px; background: var(--color-pen); border-radius: 1px; opacity: .85; }

.sys { display: grid; gap: 10px; }
.sys-k { font-size: 12px; font-weight: 600; color: var(--color-pen-3); margin-bottom: 4px; }
.endpoint { font-size: 13px; font-weight: 600; background: var(--color-paper-2); padding: 3px 6px; border-radius: 2px; }
.codeblock.resp { color: #BFE3C9; }
.sys-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 10px;
  border-left: 3px solid var(--color-amber);
  background: #DB9A2B1A;
}

.hints { list-style: decimal; margin: 0 0 10px; padding-left: 20px; display: grid; gap: 6px; font-size: 14px; line-height: 1.5; }
.cost { font-size: 11px; color: #B8321F; }

.report .lede { font-size: 14px; color: var(--color-pen-2); margin: 14px 0 16px; }
.picker { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
.pick {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  padding: 12px 12px 12px 14px;
  border: 1px solid var(--color-paper-line);
  border-radius: 3px;
  background: #F6F2E8;
  cursor: pointer;
  position: relative;
}
.pick:hover { border-color: var(--color-pen-3); }
.pick.on { border-color: var(--cat); box-shadow: inset 4px 0 0 var(--cat); background: #FBF8F1; }
.pick-letter {
  font-family: var(--font-cond);
  font-weight: 700;
  font-size: 26px;
  line-height: 1;
  color: var(--cat);
  width: 20px;
  flex-shrink: 0;
}
.pick-text { display: grid; gap: 2px; }
.pick-name { font-weight: 600; font-size: 14px; line-height: 1.35; padding-right: 20px; }
.pick-q { font-size: 12px; color: var(--cat); font-weight: 600; }
.pick-check { position: absolute; top: 10px; right: 10px; color: var(--cat); }

.concerns { display: grid; gap: 12px; margin-top: 18px; }

.draft {
  margin: 16px 0 4px;
  padding: 14px 16px;
  background: #FBF8F1;
  border: 1px solid var(--color-paper-line);
  border-left: 4px solid #E2B33C;
  border-radius: 3px;
}
.draft-k { color: var(--color-pen-3); }
.draft p { margin: 8px 0 10px; font-size: 16px; line-height: 1.55; font-style: italic; }
.draft footer { font-size: 13px; line-height: 1.5; color: var(--color-pen-2); padding-top: 10px; border-top: 1px dashed var(--color-paper-line); }

.findings .score-row {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;
  margin-top: 14px;
}
.big { font-size: 64px; }
.xp-table { border-collapse: collapse; font-size: 13px; min-width: 260px; }
.xp-table td { padding: 4px 0; border-bottom: 1px dashed var(--color-paper-line); }
.xp-table td:last-child { text-align: right; padding-left: 24px; }
.xp-table tr.neg td:last-child { color: #B8321F; }
.xp-table tr.zero { color: var(--color-pen-3); }
.xp-table tr.total td { border-bottom: 0; border-top: 1px solid var(--color-pen); font-weight: 600; padding-top: 8px; }

.truth {
  border: 1px solid var(--color-paper-line);
  border-left: 4px solid var(--cat);
  border-radius: 3px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #F6F2E8;
}
.truth p { margin: 8px 0 0; font-size: 14px; line-height: 1.55; }
.truth-top { display: flex; align-items: flex-start; gap: 12px; }
.truth-title { flex: 1; display: grid; gap: 1px; font-size: 14px; }
.verdict { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; white-space: nowrap; }
.truth.hit .verdict { color: #2F7D57; }
.truth.miss .verdict, .truth.fp .verdict { color: #B8321F; }
.truth.miss { background: #F3E6DD; }
.yours { font-size: 13px !important; color: var(--color-pen-2); font-style: italic; }
.ok { font-style: normal; color: #2F7D57; font-weight: 600; margin-left: 6px; }

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  border-top: 1px solid var(--color-paper-line);
  background: var(--color-paper-2);
}
.foot .muted { min-width: 0; }

@media (max-width: 640px) {
  .backdrop { padding: 0; }
  .sheet { height: 100dvh; border-radius: 0; }
  .head, .body, .foot { padding-left: 16px; padding-right: 16px; }
  .tabs { padding: 0 16px; }
  .foot { flex-direction: column; align-items: stretch; }
  .foot .btn { width: 100%; }
}
</style>
