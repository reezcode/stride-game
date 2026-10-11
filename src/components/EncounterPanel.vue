<template>
  <div class="backdrop">
    <section class="fight anim-rise" :class="[def.mode, { shake: shaking }]" :style="{ '--foe': def.color }"
      role="dialog" aria-modal="true" :aria-label="`Encounter with ${def.name}`">

      <header class="top">
        <canvas ref="foeEl" class="foe" width="240" height="240" aria-hidden="true"></canvas>
        <div class="foe-info">
          <div class="t-label foe-k">{{ def.mode === 'warden' ? 'Warden' : 'Confrontation' }}</div>
          <h2 class="t-display foe-name">{{ def.name }}</h2>
          <div class="foe-tag">{{ def.tagline }}</div>
          <div class="locks" :aria-label="`${locksLeft} of ${def.locks} remaining`">
            <span v-for="i in def.locks" :key="i" :class="['lock', { open: i > locksLeft }]"></span>
            <span class="locks-label">{{ def.mode === 'warden' ? 'locks' : 'denials' }} left: {{ locksLeft }}</span>
          </div>
        </div>
        <div class="me">
          <div class="me-row"><IconHeartbeat :size="16" stroke-width="1.8" /> Resolve <span class="t-mono">{{ store.resolve }}/{{ store.maxResolve }}</span></div>
          <div class="bar"><div class="bar-fill" :style="{ width: `${(store.resolve / store.maxResolve) * 100}%` }"></div></div>
        </div>
      </header>

      <div class="stage">
        <template v-if="phase === 'pick'">
          <div class="t-label stage-k">{{ def.mode === 'warden' ? `${def.name} moves` : `${def.name} says` }}</div>
          <p :key="round.text" class="move anim-fade">{{ round.text }}</p>
          <p v-if="missText" class="miss">{{ missText }}</p>
        </template>

        <template v-else-if="phase === 'hit'">
          <div class="t-label stage-k good">{{ def.mode === 'warden' ? `${pickedName} lands` : 'He has no answer' }}</div>
          <p class="move anim-fade">{{ round.why }}</p>
        </template>

        <template v-else-if="phase === 'won'">
          <div class="t-label stage-k good">{{ def.mode === 'warden' ? 'Warden down' : 'It is over' }}</div>
          <p class="move anim-fade">{{ def.winText }}</p>
        </template>

        <template v-else>
          <div class="t-label stage-k bad">{{ def.mode === 'warden' ? 'It got to you' : 'He talks his way past you' }}</div>
          <p class="move anim-fade">{{ def.loseText }}</p>
        </template>
      </div>

      <footer class="foot">
        <template v-if="phase === 'pick'">
          <div class="choices" :class="def.mode">
            <button v-for="(o, i) in def.options" :key="o.id" class="choice" :style="{ '--c': o.color }"
              :disabled="disabled.includes(o.id)" @click="pick(o.id)">
              <span class="choice-key t-mono">{{ i + 1 }}</span>
              <span class="choice-text">
                <span class="choice-name">{{ o.name }}</span>
                <span class="choice-line">{{ o.line }}</span>
              </span>
            </button>
          </div>
          <div class="side">
            <button v-if="def.mode === 'warden'" class="btn btn-ghost btn-sm" :disabled="insight <= 0 || narrowed" @click="read"
              title="Each clue you found in this room lets you read one move">
              <IconEye :size="16" stroke-width="1.8" /> Read its move <span class="t-mono">×{{ insight }}</span>
            </button>
            <button class="btn btn-ghost btn-sm" @click="$emit('end', 'flee')">Back off</button>
          </div>
        </template>
        <button v-else class="btn btn-light go" @click="next">
          {{ phase === 'hit' ? 'Keep going' : phase === 'won' ? 'Continue' : 'Fall back' }} <IconArrowRight :size="16" />
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconHeartbeat, IconEye, IconArrowRight } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { drawPortrait, drawWarden } from '@/game/portraits'
import { sfx } from '@/game/audio'

export interface EncounterDef {
  mode: 'warden' | 'proof'
  id: string
  name: string
  color: string
  tagline: string
  locks: number
  hit: number
  insight: number
  rounds: { text: string; answer: string; why: string }[]
  options: { id: string; name: string; line: string; color: string; miss?: string }[]
  winText: string
  loseText: string
}

const props = defineProps<{ def: EncounterDef }>()
const emit = defineEmits<{ end: [result: 'win' | 'lose' | 'flee'] }>()
const store = useGameStore()

type Phase = 'pick' | 'hit' | 'won' | 'lost'
const phase = ref<Phase>('pick')
const locksLeft = ref(props.def.locks)
const insight = ref(props.def.insight)
const narrowed = ref(false)
const disabled = ref<string[]>([])
const missText = ref('')
const pickedName = ref('')
const shaking = ref(false)

// Wardens pick their moves in random order; a confrontation runs as written.
const order = props.def.rounds.map((_, i) => i)
if (props.def.mode === 'warden') order.sort(() => Math.random() - 0.5)
const at = ref(0)
const round = computed(() => props.def.rounds[order[at.value % order.length]])
const used = ref<string[]>([])

function resetRound() {
  disabled.value = props.def.mode === 'proof' ? [...used.value] : []
  missText.value = ''
  narrowed.value = false
}

function pick(id: string) {
  if (phase.value !== 'pick' || disabled.value.includes(id)) return
  const o = props.def.options.find(o => o.id === id)!
  if (id === round.value.answer) {
    locksLeft.value--
    pickedName.value = o.name
    used.value.push(id)
    sfx.hit()
    flash = 1
    phase.value = locksLeft.value <= 0 ? 'won' : 'hit'
    if (phase.value === 'won') sfx.down()
    return
  }
  store.damage(props.def.hit)
  sfx.hurt()
  shaking.value = true
  window.setTimeout(() => { shaking.value = false }, 380)
  disabled.value.push(id)
  missText.value = o.miss ?? 'He shrugs. That doesn\'t answer what he just said.'
  if (store.resolve <= 0) phase.value = 'lost'
}

function read() {
  if (insight.value <= 0 || narrowed.value) return
  insight.value--
  narrowed.value = true
  const wrong = props.def.options.map(o => o.id).filter(id => id !== round.value.answer && !disabled.value.includes(id))
  wrong.sort(() => Math.random() - 0.5)
  disabled.value.push(...wrong.slice(1))
  sfx.blip()
}

function next() {
  if (phase.value === 'won') return emit('end', 'win')
  if (phase.value === 'lost') return emit('end', 'lose')
  at.value++
  resetRound()
  phase.value = 'pick'
}

// ── Foe portrait (animated) ──
const foeEl = ref<HTMLCanvasElement | null>(null)
let raf = 0
let flash = 0
function paint(now: number) {
  const c = foeEl.value
  if (c) {
    const g = c.getContext('2d')!
    g.setTransform(2.4, 0, 0, 2.4, 0, 0)
    g.clearRect(0, 0, 100, 100)
    if (props.def.mode === 'warden') {
      drawWarden(g, 50, 90, 25, props.def.color, now / 1000, phase.value === 'pick', phase.value === 'won')
    } else {
      drawPortrait(g, 'raka', { playerColor: store.playerColor })
    }
    if (flash > 0) {
      g.fillStyle = `rgba(255,255,255,${flash * 0.7})`
      g.fillRect(0, 0, 100, 100)
      flash = Math.max(0, flash - 0.06)
    }
  }
  raf = requestAnimationFrame(paint)
}

function onKey(e: KeyboardEvent) {
  e.stopPropagation()
  if (phase.value === 'pick') {
    const o = props.def.options[Number(e.key) - 1]
    if (o) pick(o.id)
    else if (e.key.toLowerCase() === 'r' && props.def.mode === 'warden') read()
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    next()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  raf = requestAnimationFrame(paint)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey, true)
  cancelAnimationFrame(raf)
})
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  padding: 16px;
  background: radial-gradient(ellipse at 50% 30%, #1A0C0CCC 0%, #05070AF2 70%);
  overflow-y: auto;
}
.fight {
  width: min(880px, 100%);
  background: var(--color-ink-900);
  border: 1px solid var(--color-ink-600);
  border-top: 3px solid var(--foe);
  border-radius: 4px;
  box-shadow: 0 30px 90px #000C;
  display: flex;
  flex-direction: column;
}
.fight.shake { animation: shake .36s; }
@keyframes shake {
  20% { transform: translateX(-7px); } 40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); } 80% { transform: translateX(3px); }
}

.top { display: flex; align-items: center; gap: 18px; padding: 18px 22px; border-bottom: 1px solid var(--color-ink-line); }
.foe { width: 100px; height: 100px; flex-shrink: 0; background: #0B0E13; border: 1px solid var(--color-ink-line); border-radius: 3px; }
.foe-info { flex: 1; min-width: 0; }
.foe-k { color: var(--color-fog-mute); }
.foe-name { font-size: clamp(28px, 5vw, 40px); margin: 4px 0 2px; color: var(--foe); }
.foe-tag { font-size: 14px; color: var(--color-fog-dim); }
.locks { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
.lock { width: 26px; height: 8px; border-radius: 2px; background: var(--foe); transition: background .3s, opacity .3s; }
.lock.open { background: var(--color-ink-600); opacity: .6; }
.locks-label { margin-left: 6px; font-size: 12px; color: var(--color-fog-mute); }

.me { width: 190px; flex-shrink: 0; }
.me-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-fog-dim); }
.me-row .t-mono { margin-left: auto; color: var(--color-fog); font-size: 12px; }
.bar { height: 8px; margin-top: 6px; background: var(--color-ink-700); border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; background: #E2685A; transition: width .35s cubic-bezier(.2,.7,.2,1); }

.stage { padding: 22px 26px 8px; min-height: 172px; }
.stage-k { color: var(--foe); }
.stage-k.good { color: #7FD3A8; }
.stage-k.bad { color: #F08A75; }
.move { margin: 10px 0 0; font-size: clamp(17px, 2.4vw, 21px); line-height: 1.55; color: var(--color-fog); max-width: 62ch; }
.miss { margin: 12px 0 0; padding: 8px 12px; border-left: 3px solid #D9432F; background: #D9432F1A; color: #F5C1B6; font-size: 14px; }

.foot { padding: 16px 22px 20px; display: grid; gap: 12px; }
.choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.choices.proof { grid-template-columns: 1fr; }
.choice {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 12px;
  text-align: left;
  background: var(--color-ink-800);
  border: 1px solid var(--color-ink-600);
  border-left: 4px solid var(--c);
  border-radius: 3px;
  cursor: pointer;
  transition: background-color .12s, border-color .12s, opacity .2s;
}
.choice:not(:disabled):hover { background: var(--color-ink-700); border-color: var(--c); }
.choice:disabled { opacity: .28; cursor: not-allowed; }
.choice-key { font-size: 11px; color: var(--color-fog-mute); padding-top: 3px; }
.choice-text { display: grid; gap: 2px; min-width: 0; }
.choice-name { font-family: var(--font-cond); font-weight: 700; font-size: 18px; line-height: 1.1; }
.choice-line { font-size: 12.5px; line-height: 1.4; color: var(--color-fog-dim); }
.choices.proof .choice-name { font-size: 16px; }
.choices.proof .choice-line { font-size: 13px; }

.side { display: flex; justify-content: space-between; gap: 8px; }
.go { justify-self: end; min-width: 180px; height: 44px; }

@media (max-width: 720px) {
  .backdrop { padding: 0; place-items: stretch; }
  .fight { min-height: 100dvh; border-radius: 0; }
  .top { flex-wrap: wrap; padding: 14px 16px; gap: 12px; }
  .foe { width: 72px; height: 72px; }
  .me { width: 100%; order: 3; }
  .stage { padding: 16px 16px 4px; min-height: 0; flex: 1; }
  .foot { padding: 12px 16px 16px; }
  .choices { grid-template-columns: repeat(2, 1fr); }
  .go { justify-self: stretch; }
}
@media (prefers-reduced-motion: reduce) { .fight.shake { animation: none; } }
</style>
