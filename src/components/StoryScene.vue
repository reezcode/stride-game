<template>
  <div class="scene" :class="[backdrop.bg, { overlay }]" @click="advance">
    <canvas v-show="backdrop.bg === 'day' || backdrop.bg === 'night'" ref="bgEl" class="bg" aria-hidden="true"></canvas>
    <canvas v-show="backdrop.bg === 'art'" ref="artEl" class="art" aria-hidden="true"></canvas>
    <div class="shade" aria-hidden="true"></div>

    <div v-if="backdrop.label" class="t-label where">{{ backdrop.label }}</div>
    <button v-if="canSkip" class="skip" @click.stop="skip">Skip <IconPlayerTrackNext :size="15" /></button>

    <!-- Title card -->
    <Transition name="fade" mode="out-in">
      <div v-if="line?.k === 'card'" :key="idx" class="card">
        <h1 class="t-display card-title">{{ fill(line.title, name) }}</h1>
        <p v-if="line.sub" class="card-sub">{{ fill(line.sub, name) }}</p>
        <p v-if="line.small" class="card-small">{{ line.small }}</p>
      </div>
    </Transition>

    <!-- Phone thread -->
    <Transition name="fade">
      <div v-if="thread" class="phone" @click.stop="advance">
        <div class="phone-head">
          <IconChevronLeft :size="16" />
          <span>{{ thread.title }}</span>
        </div>
        <div ref="msgsEl" class="msgs">
          <div v-for="(m, i) in thread.msgs" :key="i" :class="['msg', m.mine ? 'mine' : 'theirs', { threat: m.from === 'unknown' }]">
            <div class="bubble">{{ m.text }}</div>
            <div v-if="m.meta" class="msg-meta">{{ m.meta }}</div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Proof -->
    <Transition name="fade">
      <div v-if="line?.k === 'proof'" :key="idx" class="proof paper">
        <div class="t-label proof-k">Proof secured</div>
        <div class="proof-title">{{ line.title }}</div>
        <p>{{ line.text }}</p>
        <div class="proof-foot">Sealed, copied off-site. Nobody can wipe this one.</div>
      </div>
    </Transition>

    <!-- Dialogue -->
    <div v-if="line && (line.k === 'say' || line.k === 'narr' || line.k === 'choice')" class="dialogue" :class="line.k">
      <canvas v-show="line.k !== 'narr'" ref="faceEl" class="face" width="200" height="200" aria-hidden="true"></canvas>
      <div class="d-body">
        <div v-if="line.k !== 'narr'" class="d-name" :style="{ color: speakerColor }">{{ speaker }}</div>
        <p class="d-text">{{ shown }}<span v-if="typing" class="caret"></span></p>
        <div v-if="line.k === 'choice' && !typing" class="options">
          <button v-for="o in line.options" :key="o.id" class="opt" :disabled="ruledOut.includes(o.id)"
            @click.stop="choose(o.id)">{{ o.label }}</button>
        </div>
      </div>
    </div>

    <div v-if="line && line.k !== 'choice'" class="hint">
      <span class="kbd">Space</span> or tap to continue
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { IconPlayerTrackNext, IconChevronLeft } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { CAST, fill, type Line, type Backdrop, type CharId, type ArtId } from '@/data/story'
import { drawArt, ART_W, ART_H } from '@/game/illustrations'
import { paintStatic } from '@/game/paintStatic'
import { roomById, TILE } from '@/game/world'
import { drawPortrait } from '@/game/portraits'
import { sfx, motif, unlockAudio } from '@/game/audio'

// `overlay`: played on top of the game, so a scene without a backdrop lets the world show through
const props = withDefaults(defineProps<{ lines: Line[]; canSkip?: boolean; overlay?: boolean }>(), { canSkip: true, overlay: false })
const emit = defineEmits<{ done: [] }>()

const store = useGameStore()
const name = computed(() => store.playerName || 'You')

const idx = ref(-1)
const line = computed<Line | null>(() => props.lines[idx.value] ?? null)
const backdrop = ref<{ bg: Backdrop; room?: string; art?: ArtId; label?: string }>({ bg: 'dark' })

interface Msg { from: CharId; text: string; mine: boolean; meta?: string }
const thread = shallowRef<{ title: string; msgs: Msg[] } | null>(null)

const bgEl = ref<HTMLCanvasElement | null>(null)
const artEl = ref<HTMLCanvasElement | null>(null)
const faceEl = ref<HTMLCanvasElement | null>(null)
const msgsEl = ref<HTMLElement | null>(null)

// ── Typewriter ──
const full = ref('')
const count = ref(0)
const shown = computed(() => full.value.slice(0, count.value))
const typing = computed(() => count.value < full.value.length)
const ruledOut = ref<string[]>([])
let timer = 0

function type(text: string) {
  clearInterval(timer)
  full.value = fill(text, name.value)
  count.value = 0
  timer = window.setInterval(() => {
    count.value = Math.min(full.value.length, count.value + 2)
    if (count.value % 6 === 0) sfx.type()
    if (count.value >= full.value.length) clearInterval(timer)
  }, 22)
}

const speaker = computed(() => {
  const l = line.value
  if (!l || (l.k !== 'say' && l.k !== 'choice')) return ''
  if (l.k === 'say' && l.as) return l.as
  return fill(CAST[l.who].name, name.value)
})
const speakerColor = computed(() => {
  const l = line.value
  if (l?.k === 'say' && l.color) return l.color
  if (l && (l.k === 'say' || l.k === 'choice') && l.who === 'mc') return store.playerColor
  return undefined
})

// ── Flow ──
function show() {
  // backdrop changes apply immediately and fall through to the next line
  while (line.value?.k === 'bg') {
    const b = line.value
    backdrop.value = { bg: b.bg, room: b.room, art: b.art, label: b.label }
    if (b.motif) motif(b.motif)
    paintBackdrop()
    idx.value++
  }
  const l = line.value
  if (!l) { emit('done'); return }

  if (l.k === 'chat') {
    const m: Msg = { from: l.from, text: l.text, mine: isMine(l), meta: l.meta }
    thread.value = thread.value?.title === l.thread
      ? { title: l.thread, msgs: [...thread.value.msgs, m] }
      : { title: l.thread, msgs: [m] }
    sfx.message()
    nextTick(() => msgsEl.value?.scrollTo({ top: msgsEl.value.scrollHeight, behavior: 'smooth' }))
    return
  }
  thread.value = null

  if (l.k === 'card') { if (l.motif) motif(l.motif); return }
  if (l.k === 'proof') { sfx.stamp(); return }
  if (l.k === 'choice') { ruledOut.value = []; type(l.prompt) }
  else type(l.text)
  nextTick(paintFace)
}

// A thread is seen from the phone of whoever is not its title: Laras's own
// threads show her messages on the right, yours show yours.
function isMine(l: Extract<Line, { k: 'chat' }>) {
  const lead = l.thread.split(' · ')[0]
  if (lead === 'Laras') return l.thread.includes('draft') ? true : l.from === 'mc'
  return l.from === 'laras'
}

function advance() {
  unlockAudio()
  const l = line.value
  if (!l) return
  if (typing.value) { clearInterval(timer); count.value = full.value.length; return }
  if (l.k === 'choice') return
  idx.value++
  show()
}

function choose(id: string) {
  const l = line.value
  if (l?.k !== 'choice') return
  if (id === l.answer) { sfx.hit(); idx.value++; show(); return }
  sfx.denied()
  ruledOut.value.push(id)
  type(l.options.find(o => o.id === id)!.reply)
}

function skip() {
  // never skip past a decision
  if (line.value?.k === 'choice') return
  clearInterval(timer)
  let i = Math.max(0, idx.value)
  while (i < props.lines.length && props.lines[i].k !== 'choice') {
    const b = props.lines[i]
    if (b.k === 'bg') backdrop.value = { bg: b.bg, room: b.room, art: b.art, label: b.label }
    i++
  }
  thread.value = null
  idx.value = i
  paintBackdrop()
  show()
}

// ── Painting ──
let plan: HTMLCanvasElement | null = null

function paintBackdrop() {
  const c = bgEl.value
  const room = backdrop.value.room ? roomById[backdrop.value.room] : null
  if (!c || !room) return
  plan ??= paintStatic(1)
  const W = c.clientWidth || window.innerWidth, H = c.clientHeight || window.innerHeight
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
  const g = c.getContext('2d')!
  // cover the screen with the room, plus a little of its surroundings
  const rw = (room.w + 2) * TILE, rh = (room.h + 2) * TILE
  const k = Math.max(c.width / rw, c.height / rh)
  const cx = (room.x + room.w / 2) * TILE, cy = (room.y + room.h / 2) * TILE
  g.fillStyle = '#06080B'
  g.fillRect(0, 0, c.width, c.height)
  g.drawImage(plan, c.width / 2 - cx * k, c.height / 2 - cy * k, plan.width * k, plan.height * k)
}

// Drawn scenes are animated, so they repaint every frame while visible.
let raf = 0
function paintArt(now: number) {
  const c = artEl.value
  const id = backdrop.value.art
  if (c && id && backdrop.value.bg === 'art') {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = Math.round(window.innerWidth * dpr), H = Math.round(window.innerHeight * dpr)
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
    const g = c.getContext('2d')!
    // cover, anchored a little above centre so faces survive a tall phone crop
    const k = Math.max(W / ART_W, H / ART_H)
    g.setTransform(k, 0, 0, k, (W - ART_W * k) / 2, (H - ART_H * k) * 0.4)
    drawArt(g, id, now / 1000, store.playerColor)
  }
  raf = requestAnimationFrame(paintArt)
}

function paintFace() {
  const c = faceEl.value
  const l = line.value
  if (!c || !l || (l.k !== 'say' && l.k !== 'choice')) return
  const g = c.getContext('2d')!
  g.setTransform(2, 0, 0, 2, 0, 0)
  drawPortrait(g, l.who, { playerColor: store.playerColor, color: l.k === 'say' ? l.color : undefined, time: 1.3 })
}

function onKey(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e') { e.preventDefault(); advance() }
  const l = line.value
  if (l?.k === 'choice' && !typing.value) {
    const o = l.options[Number(e.key) - 1]
    if (o && !ruledOut.value.includes(o.id)) choose(o.id)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('resize', paintBackdrop)
  idx.value = 0
  show()
  raf = requestAnimationFrame(paintArt)
})
onUnmounted(() => {
  clearInterval(timer)
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey, true)
  window.removeEventListener('resize', paintBackdrop)
})
</script>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: #05070A;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.scene.overlay.dark { background: linear-gradient(#05070A80 0%, #05070A99 55%, #05070AF2 100%); }
.scene.overlay.dark .card { background: #05070ACC; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; transition: filter .6s; }
.art { position: absolute; inset: 0; width: 100%; height: 100%; }
.scene.art .shade { background: linear-gradient(transparent 55%, #05070AD9 100%); }
.scene.day .bg { filter: brightness(1.02) saturate(1.05); }
.scene.night .bg { filter: brightness(.46) saturate(.6) hue-rotate(-8deg); }
.shade { position: absolute; inset: 0; pointer-events: none; }
.scene.day .shade { background: linear-gradient(#F2D9A022 0%, #0B0E1320 45%, #0B0E13E6 100%); }
.scene.night .shade { background: radial-gradient(ellipse at 50% 40%, #0B1A3320 0%, #05070AD9 85%), linear-gradient(transparent 50%, #05070A 100%); }

.where {
  position: absolute; top: 20px; left: 24px;
  padding: 6px 10px;
  background: #0B0E13CC;
  border: 1px solid var(--color-ink-line);
  border-radius: 3px;
  color: #F0C674;
}
.skip {
  position: absolute; top: 16px; right: 20px;
  display: flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px;
  border: 1px solid var(--color-ink-600);
  border-radius: 3px;
  background: #0B0E13CC;
  color: var(--color-fog-dim);
  font-size: 13px;
  cursor: pointer;
  z-index: 2;
}
.skip:hover { color: var(--color-fog); background: var(--color-ink-800); }

.card {
  position: absolute; inset: 0;
  display: grid; align-content: center; justify-items: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
  background: #05070AE6;
}
.card-title { font-size: clamp(34px, 6vw, 64px); margin: 0; max-width: 18ch; }
.card-sub { margin: 0; max-width: 52ch; font-size: 17px; line-height: 1.6; color: var(--color-fog-dim); }
.card-small { margin: 8px 0 0; max-width: 52ch; font-size: 14px; line-height: 1.6; color: var(--color-fog-mute); }

.phone {
  position: absolute;
  left: 50%; top: 46%;
  transform: translate(-50%, -50%);
  width: min(360px, calc(100vw - 32px));
  max-height: min(560px, calc(100dvh - 150px));
  display: flex; flex-direction: column;
  background: #0E1218;
  border: 1px solid #2E3643;
  border-radius: 22px;
  box-shadow: 0 30px 90px #000C, inset 0 0 0 5px #06080B;
  overflow: hidden;
}
.phone-head {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 18px 12px;
  font-weight: 600; font-size: 15px;
  border-bottom: 1px solid #1E242E;
  color: var(--color-fog);
}
.msgs { padding: 14px 14px 18px; display: grid; gap: 8px; overflow-y: auto; min-height: 180px; align-content: end; }
.msg { display: grid; max-width: 84%; animation: pop .22s cubic-bezier(.2,.8,.2,1.2) both; }
.msg.mine { justify-self: end; justify-items: end; }
.msg.theirs { justify-self: start; justify-items: start; }
.bubble { padding: 9px 13px; border-radius: 16px; font-size: 15px; line-height: 1.4; }
.msg.theirs .bubble { background: #232A35; color: var(--color-fog); border-bottom-left-radius: 5px; }
.msg.mine .bubble { background: #2F6FD0; color: #fff; border-bottom-right-radius: 5px; }
.msg.threat .bubble { background: #3A1512; color: #F5C1B6; border: 1px solid #7A2A20; }
.msg-meta { font-size: 11px; color: var(--color-fog-mute); margin: 3px 6px 0; }
@keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }

.proof {
  position: absolute;
  left: 50%; top: 42%;
  transform: translate(-50%, -50%) rotate(-1deg);
  width: min(460px, calc(100vw - 32px));
  padding: 22px 24px 18px;
  border-radius: 2px;
  box-shadow: 0 30px 80px #000C;
}
.proof-k { color: #2F7D57; }
.proof-title { font-family: var(--font-cond); font-weight: 700; font-size: 26px; margin: 8px 0 8px; line-height: 1.1; }
.proof p { margin: 0; font-size: 15px; line-height: 1.6; }
.proof-foot { margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--color-paper-line); font-size: 12px; color: var(--color-pen-3); }

.dialogue {
  position: absolute;
  left: 50%; bottom: 56px;
  transform: translateX(-50%);
  width: min(820px, calc(100vw - 32px));
  min-height: 132px;
  display: flex; align-items: flex-start; gap: 18px;
  padding: 18px 22px 20px;
  background: #0B0E13F2;
  border: 1px solid var(--color-ink-600);
  border-radius: 4px;
  box-shadow: 0 20px 60px #000A;
}
.face {
  width: 96px; height: 96px; flex-shrink: 0;
  background: #151A22;
  border: 1px solid var(--color-ink-line);
  border-radius: 3px;
}
.d-body { flex: 1; min-width: 0; }
.d-name { font-family: var(--font-cond); font-weight: 700; font-size: 20px; line-height: 1; margin-bottom: 8px; color: #F0C674; }
.d-text { margin: 0; font-size: 18px; line-height: 1.55; color: var(--color-fog); min-height: 2.6em; }
.dialogue.narr { border-left: 3px solid #F0C674; }
.dialogue.narr .d-text { color: #D5CFC2; font-style: italic; }
.caret { display: inline-block; width: 8px; height: 1em; margin-left: 2px; background: var(--color-fog-dim); vertical-align: -2px; animation: blink .7s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }

.options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.opt {
  height: 42px; padding: 0 22px;
  border: 1px solid var(--color-ink-600);
  border-radius: 3px;
  background: var(--color-ink-800);
  font-weight: 600; font-size: 15px;
  cursor: pointer;
}
.opt:not(:disabled):hover { background: var(--color-fog); color: var(--color-ink-950); }
.opt:disabled { opacity: .35; text-decoration: line-through; cursor: not-allowed; }

.hint {
  position: absolute; left: 50%; bottom: 20px;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--color-fog-mute);
  white-space: nowrap;
}

.fade-enter-active, .fade-leave-active { transition: opacity .35s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .dialogue { bottom: 44px; padding: 14px; gap: 12px; min-height: 120px; }
  .face { width: 64px; height: 64px; }
  .d-text { font-size: 16px; }
  .d-name { font-size: 17px; }
  .where { top: 12px; left: 12px; max-width: calc(100vw - 110px); }
  .skip { top: 10px; right: 10px; }
  .hint { bottom: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .msg { animation: none; }
}
</style>
