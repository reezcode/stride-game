<template>
  <div class="world" @pointerdown.capture="unlock">
    <canvas ref="canvasEl" class="view"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @contextmenu.prevent></canvas>
    <div class="vignette" aria-hidden="true"></div>

    <GameHUD :muted="muted" :place="zone.name" :show-cases="zoneId === 'hq'" @manual="goLearn" @menu="menuOpen = true" @toggle-sound="toggleSound" />

    <!-- Room title -->
    <Transition name="banner">
      <div v-if="banner" :key="banner.title" class="banner">
        <div class="banner-title t-display">{{ banner.title }}</div>
        <div class="banner-sub" :class="banner.tone">{{ banner.sub }}</div>
      </div>
    </Transition>

    <!-- Objective -->
    <aside v-if="!overlayOpen" class="objective">
      <div class="obj-compass" :style="{ transform: `rotate(${objective.angle}rad)` }" aria-hidden="true">
        <IconNavigationFilled :size="16" />
      </div>
      <div class="obj-text">
        <div class="t-label obj-k">{{ objective.kicker }}</div>
        <div class="obj-main">{{ objective.text }}</div>
      </div>
    </aside>

    <!-- Minimap -->
    <div v-if="!overlayOpen" class="minimap" title="Click to walk there">
      <canvas ref="miniEl" :style="{ aspectRatio: `${zone.w} / ${zone.h}` }" @pointerdown.stop="onMiniClick"></canvas>
    </div>

    <!-- Interaction prompt -->
    <Transition name="prompt">
      <button v-if="nearInfo && !paused" class="prompt" @click="interact(nearInfo.id)">
        <span class="kbd">E</span>
        <span>{{ nearInfo.verb }}</span>
        <span class="prompt-obj">{{ nearInfo.label }}</span>
      </button>
    </Transition>

    <!-- Evidence note -->
    <Transition name="note">
      <div v-if="note" :key="note.key" class="note paper" role="status">
        <div class="note-head">
          <span class="t-label">Clue · {{ note.room }}</span>
          <span class="t-mono note-count">{{ note.count }}</span>
        </div>
        <div class="note-label">{{ note.label }}</div>
        <p class="note-text">{{ note.text }}</p>
        <div class="note-xp t-mono">Lets you read one warden move · +{{ XP_RULES.evidence }} XP when sealed</div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" :key="toast.key" class="toast" :class="toast.tone">{{ toast.text }}</div>
    </Transition>

    <!-- Mobile controls -->
    <template v-if="isTouch && !overlayOpen">
      <VirtualJoystick @move="onJoy" @stop="onJoy(0, 0)" />
      <button class="action-btn" :class="{ ready: !!nearInfo }" :disabled="!nearInfo" @click="nearInfo && interact(nearInfo.id)">
        {{ nearInfo ? nearInfo.verb : 'Use' }}
      </button>
    </template>

    <!-- Case file -->
    <InvestigationPanel
      v-if="panelOpen && activeScenarioId"
      :key="activeScenarioId"
      :scenario-id="activeScenarioId"
      @close="closePanel"
      @solved="onSolved"
    />

    <!-- Laras's message -->
    <div v-if="briefingOpen" class="overlay" @mousedown.self="closeBriefing">
      <article class="memo paper anim-rise">
        <div class="t-label memo-k">Laras · scheduled message · delivered 01:31</div>
        <template v-if="zoneId === 'hq'">
          <h1 class="t-display memo-title">“It is someone inside.”</h1>
          <p>
            Someone at PayVault is wiping three weeks of logs tonight. Five rooms are dark, and in each one
            a <b>warden</b>, a guard program they left running, is sitting on the terminal.
          </p>
          <ol class="memo-steps">
            <li><b>Search the room.</b> Marked objects glint when you get close. Each is a clue the wipe has not reached yet. Wardens notice you sooner when you run.</li>
            <li><b>Break the warden.</b> It attacks the way its maker attacked her. Answer each move with the right counter. Every clue you hold lets you read one move in advance.</li>
            <li><b>Seal the case.</b> At the freed terminal, put on record every kind of harm that system allowed. A sealed case is a proof nobody can delete.</li>
          </ol>
        </template>
        <template v-else>
          <h1 class="t-display memo-title">“I wrote everything down.”</h1>
          <p>
            Not at home, she says, and her phone knows where. Her old room is down the hall.
            Nobody could tell you why she did it. Tonight you start finding out.
          </p>
          <ol class="memo-steps">
            <li><b>Look around.</b> Things worth examining glint when you get close.</li>
            <li><b>Talk to people.</b> They remember more than they think they do.</li>
            <li><b>Follow where it leads.</b> The front door opens the city map. New places appear as you learn about them.</li>
          </ol>
        </template>
        <template v-if="gathered.length">
          <div class="t-label memo-k proofs-k">What you can prove · {{ gathered.length }}/{{ proofs.length }}</div>
          <ul class="proofs">
            <li v-for="p in gathered" :key="p.id"><b>{{ p.title }}</b> {{ p.text }}</li>
          </ul>
        </template>
        <p v-if="zoneId === 'hq'" class="memo-small">
          The Briefing Room stays locked until all five cases are sealed. The manual Laras read is in the Training Room.
          Coffee in the Pantry steadies your nerves. The lift takes you back to the street.
        </p>
        <div class="controls">
          <div><span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span> or click to walk</div>
          <div><span class="kbd">Shift</span> run</div>
          <div><span class="kbd">E</span> interact</div>
          <div><span class="kbd">Tab</span> city map</div>
          <div><span class="kbd">M</span> sound</div>
          <div><span class="kbd">Esc</span> menu</div>
        </div>
        <button class="btn btn-ink memo-btn" @click="closeBriefing">
          {{ store.briefingSeen ? 'Back to it' : 'Start looking' }}
        </button>
      </article>
    </div>

    <CityMap v-if="mapOpen" :current="zoneId" :unlocked="store.unlocked" :clock="CLOCK[zoneId]" @go="travel" @close="mapOpen = false" />
    <EncounterPanel v-if="encounter" :key="encounter.key" :def="encounter.def" @end="encounter.done" />
    <StoryScene v-if="scene" :key="scene.key" :lines="scene.lines" overlay @done="endScene" />

    <!-- Pause menu -->
    <div v-if="menuOpen" class="overlay" @mousedown.self="menuOpen = false">
      <div class="menu anim-rise">
        <div class="t-label menu-k">Paused</div>
        <button class="menu-item" @click="menuOpen = false"><IconPlayerPlay :size="18" /> Resume</button>
        <button class="menu-item" @click="menuOpen = false; briefingOpen = true"><IconNotes :size="18" /> Laras's message</button>
        <button class="menu-item" @click="menuOpen = false; mapOpen = true"><IconMap2 :size="18" /> City map</button>
        <button class="menu-item" @click="goLearn"><IconBook2 :size="18" /> STRIDE field manual</button>
        <button class="menu-item" @click="toggleSound">
          <IconVolumeOff v-if="muted" :size="18" /><IconVolume v-else :size="18" />
          Sound: {{ muted ? 'off' : 'on' }}
        </button>
        <button v-if="store.finaleDone" class="menu-item" @click="router.push('/debrief')"><IconReportAnalytics :size="18" /> Debrief</button>
        <button class="menu-item dim" @click="router.push('/')"><IconLogout :size="18" /> Title screen</button>
        <p class="menu-foot">Progress is saved automatically.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconNavigationFilled, IconPlayerPlay, IconNotes, IconBook2, IconVolume, IconVolumeOff,
  IconReportAnalytics, IconLogout, IconMap2,
} from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { scenarios } from '@/data'
import {
  TILE, rooms, roomById, doors, interactables, roomAt, SPAWN, npcs, zoneAt, zoneById,
  type Interactable, type ZoneId,
} from '@/game/world'
import { move, blocked, findPath, setLocks } from '@/game/physics'
import { Renderer, STATUS_COLOR, type CaseStatus } from '@/game/renderer'
import type { Facing } from '@/game/sprites'
import { sfx, unlockAudio, isMuted, setMuted, startAmbience, stopAmbience } from '@/game/audio'
import { XP_RULES, STRIDE_BY } from '@/game/stride'
import { makeWardens, stepWarden, type Warden } from '@/game/wardens'
import {
  COUNTERS, WARDEN_LOCKS, WARDEN_HIT, NEMESIS, proofs, proofById, fragments, denials,
  finaleIntro, finaleEnd, clues, talks, arrivals, type Line,
} from '@/data/story'
import GameHUD from '@/components/GameHUD.vue'
import VirtualJoystick from '@/components/VirtualJoystick.vue'
import InvestigationPanel from '@/components/InvestigationPanel.vue'
import EncounterPanel, { type EncounterDef } from '@/components/EncounterPanel.vue'
import StoryScene from '@/components/StoryScene.vue'
import CityMap from '@/components/CityMap.vue'

const router = useRouter()
const store  = useGameStore()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const miniEl   = ref<HTMLCanvasElement | null>(null)
let renderer: Renderer | null = null

// ── UI state ──
const panelOpen        = ref(false)
const activeScenarioId = ref<string | null>(null)
const menuOpen         = ref(false)
const briefingOpen     = ref(!store.briefingSeen)
const muted            = ref(isMuted())
const isTouch          = ref(false)
const nearId           = ref<string | null>(null)
const banner = shallowRef<{ title: string; sub: string; tone: string } | null>(null)
const note   = shallowRef<{ key: number; room: string; label: string; text: string; count: string } | null>(null)
const toast  = shallowRef<{ key: number; text: string; tone: string } | null>(null)
const objective = ref({ kicker: '', text: '', angle: 0 })

const scene     = shallowRef<{ key: number; lines: Line[]; then?: () => void } | null>(null)
const encounter = shallowRef<{ key: number; def: EncounterDef; done: (r: 'win' | 'lose' | 'flee') => void } | null>(null)

const mapOpen   = ref(false)

const overlayOpen = computed(() => panelOpen.value || !!scene.value || !!encounter.value || mapOpen.value)
const paused = computed(() => overlayOpen.value || menuOpen.value || briefingOpen.value)
const gathered = computed(() => proofs.filter(p => store.getCase(p.id)?.solved))

// ── Simulation state (plain, not reactive) ──
const start = (() => {
  const lp = store.lastPos
  if (lp && !blocked(lp.x, lp.y)) return lp
  return SPAWN
})()
let px = start.x, py = start.y

// Which of the three places you are in. They share one world but are sealed apart.
const zoneId = ref<ZoneId>(zoneAt(px, py).id)
const zone = computed(() => zoneById[zoneId.value])
const CLOCK: Record<ZoneId, string> = { home: '01:40', kost: '02:05', hq: '02:14' }
const EXIT: Record<ZoneId, string> = { home: 'exit-home', kost: 'exit-kost', hq: 'lift' }
let vx = 0, vy = 0
let facing: Facing = 'down'
let phase = 0
let lightAngle = Math.PI / 2
let path: { x: number; y: number }[] | null = null
let pendingInteract: string | null = null
let target: { x: number; y: number; age: number } | null = null
let joy = { x: 0, y: 0 }
let mouse: { x: number; y: number; t: number } | null = null
let camX = 0, camY = 0
let time = 0
let lastStepIdx = 0
let currentRoom: string | null = null
let alarmTimer = 0
let lockNoticeAt = -10
const keys = new Set<string>()
const doorOpen: Record<string, number> = {}
const particles: { x: number; y: number; life: number; max: number }[] = []
const flicker: Record<string, number> = {}

function caseStatus(id: string): CaseStatus {
  const c = store.getCase(id)
  return c?.solved ? 'solved' : c?.visited ? 'visited' : 'breach'
}

function roomTargetPower(roomId: string) {
  const r = roomById[roomId]
  if (r.scenarioId) return caseStatus(r.scenarioId) === 'solved' ? 1 : 0
  if (r.lockedUntilSolved) return store.allSolved ? 1 : 0
  return 1
}
const roomPower: Record<string, number> = Object.fromEntries(rooms.map(r => [r.id, roomTargetPower(r.id)]))

setLocks(store.allSolved)

// ── Story: scenes, wardens, the confrontation ──

const FIGURE = { x: 1398, y: 1010, shirt: '#4A4F5A', hair: '#1B1B1F', skin: '#CFA07A', back: true }   // beside the podium, watching the wall screen
let wardens: Warden[] = makeWardens(id => !store.wardensDown.includes(id) && !store.getCase(id)?.solved)
const wardenOf = (scenarioId?: string) => wardens.find(w => w.def.id === scenarioId)
let lastLevel = store.level

function playScene(lines: Line[], then?: () => void) {
  keys.clear(); path = null; pendingInteract = null
  scene.value = { key: Date.now(), lines, then }
}
function endScene() {
  const then = scene.value?.then
  scene.value = null
  then?.()
}

/** Call after XP changes: heals and returns a toast suffix if a level was gained. */
function levelNote() {
  if (store.level <= lastLevel) return ''
  lastLevel = store.level
  store.restoreResolve()
  window.setTimeout(() => sfx.levelUp(), 500)
  return ` · Level ${store.level}, resolve restored`
}

function fightWarden(w: Warden) {
  keys.clear(); path = null; pendingInteract = null
  const def: EncounterDef = {
    mode: 'warden', id: w.def.id, name: w.def.name, color: w.def.color, tagline: w.def.tagline,
    locks: WARDEN_LOCKS, hit: WARDEN_HIT,
    insight: store.getCase(w.def.id)?.evidenceFound.length ?? 0,
    rounds: w.def.moves,
    options: COUNTERS.map(c => ({ id: c.id, name: c.name, line: c.line, color: STRIDE_BY[c.id].color, miss: c.miss })),
    winText: w.def.down,
    loseText: 'Your hands are shaking too hard to type. You back out into the hall to breathe. It will still be there.',
  }
  encounter.value = {
    key: Date.now(), def,
    done(result) {
      encounter.value = null
      if (result === 'win') {
        store.defeatWarden(w.def.id)
        wardens = wardens.filter(x => x !== w)
        for (let i = 0; i < 14; i++) {
          particles.push({ x: w.x + (Math.random() - 0.5) * 30, y: w.y - 14 + (Math.random() - 0.5) * 24, life: 0.9, max: 0.9 })
        }
        showToast(`${w.def.name} is down · +${XP_RULES.warden} XP${levelNote()}`, 'good', 4200)
        return
      }
      w.state = 'patrol'; w.path = []
      if (result === 'lose') {
        store.restoreResolve()
        px = w.def.retreat.x; py = w.def.retreat.y; vx = 0; vy = 0
        w.x = w.def.patrol[0].x; w.y = w.def.patrol[0].y; w.wp = 1; w.stun = 2
        showToast('You catch your breath in the hall. More clues would let you read its moves.', 'warn', 5000)
      } else {
        w.stun = 5
        showToast(`${w.def.name} is resetting. You have a few seconds.`, 'plain')
      }
    },
  }
}

/** Ride somewhere else. The first arrival at a place plays its scene. */
function travel(to: ZoneId) {
  mapOpen.value = false
  if (to === zoneId.value) return
  const z = zoneById[to]
  px = z.arrive.x; py = z.arrive.y; vx = 0; vy = 0
  path = null; pendingInteract = null; target = null; keys.clear()
  zoneId.value = to
  currentRoom = null
  snapCamera()
  store.setLastPos(px, py)
  sfx.door()
  const lines = arrivals[to]
  if (lines && store.markScene(`arrive-${to}`)) playScene(lines, () => { if (to === 'hq') briefingOpen.value = true })
}

/** A clue or a conversation outside the office. */
function examine(id: string, lines: Line[], unlocks?: ZoneId) {
  const fresh = store.findClue(id)
  if (fresh) sfx.pickup()
  playScene(lines, () => {
    const opened = unlocks && store.unlock(unlocks)
    if (opened) showToast(`New place on the city map: ${zoneById[unlocks].name} · +${XP_RULES.clue} XP${levelNote()}`, 'good', 6000)
    else if (fresh) showToast(`Noted · +${XP_RULES.clue} XP${levelNote()}`, 'good')
  })
}

function confront() {
  const fight = () => {
    encounter.value = {
      key: Date.now(),
      def: {
        mode: 'proof', id: 'nemesis', name: NEMESIS.name, color: NEMESIS.color, tagline: NEMESIS.tagline,
        locks: denials.length, hit: NEMESIS.hit, insight: 0,
        rounds: denials,
        options: proofs.map(p => ({ id: p.id, name: p.title, line: p.text, color: '#F0C674' })),
        winText: 'Five denials, five files. There is nothing left for him to stand on.',
        loseText: 'He almost talks his way out, and for a second you doubt yourself. Steady. Read the files again.',
      },
      done(result) {
        encounter.value = null
        if (result === 'win') {
          playScene(finaleEnd, () => { store.finishFinale(); router.push('/debrief') })
          return
        }
        store.restoreResolve()
        showToast('He is not going anywhere. Step up to the podium when you are ready.', 'warn', 4500)
      },
    }
  }
  if (store.markScene('finale-intro')) playScene(finaleIntro, fight)
  else fight()
}

// ── Interactables ──

function available(it: Interactable) {
  if (it.kind === 'evidence') {
    const c = store.getCase(it.scenarioId!)
    return !!c && !c.solved && !c.evidenceFound.includes(it.detail!)
  }
  return true
}

const VERB: Record<Interactable['kind'], string> = {
  terminal: 'Open case file', evidence: 'Examine', manual: 'Study', debrief: 'Read the debrief', board: 'Read', flavor: 'Check',
  clue: 'Examine', npc: 'Talk to', travel: 'Leave by',
}
const nearInfo = computed(() => {
  const it = interactables.find(i => i.id === nearId.value)
  if (!it) return null
  let verb = VERB[it.kind]
  if (it.kind === 'terminal' && store.getCase(it.scenarioId!)?.solved) verb = 'Review findings'
  if (it.kind === 'terminal' && wardenOf(it.scenarioId)) verb = 'Locked'
  if (it.kind === 'debrief' && !store.finaleDone) verb = 'Step up'
  let label = it.kind === 'terminal'
    ? `${scenarios.find(s => s.id === it.scenarioId)?.code} · ${scenarios.find(s => s.id === it.scenarioId)?.title}`
    : it.label
  if (it.kind === 'debrief' && !store.finaleDone) label = 'The figure at the podium'
  if (it.kind === 'board') label = 'Laras\'s message'
  return { id: it.id, verb, label }
})

function nearest(): string | null {
  let best: string | null = null, bd = Infinity
  for (const it of interactables) {
    if (!available(it)) continue
    const d = Math.hypot(it.x - px, it.y - py)
    if (d < (it.range ?? 46) && d < bd) { bd = d; best = it.id }
  }
  return best
}

function interact(id: string) {
  const it = interactables.find(i => i.id === id)
  if (!it || paused.value) return
  path = null; pendingInteract = null
  switch (it.kind) {
    case 'terminal': {
      const w = wardenOf(it.scenarioId)
      if (w) {
        sfx.denied()
        showToast(`${w.def.name} has this terminal locked. Break the warden first.`, 'warn')
        return
      }
      store.visitCase(it.scenarioId!)
      activeScenarioId.value = it.scenarioId!
      panelOpen.value = true
      keys.clear()
      break
    }
    case 'evidence': {
      if (!store.findEvidence(it.scenarioId!, it.detail!)) return
      sfx.pickup()
      const sc = scenarios.find(s => s.id === it.scenarioId)!
      const c = store.getCase(sc.id)!
      note.value = {
        key: Date.now(),
        room: rooms.find(r => r.scenarioId === sc.id)?.name ?? '',
        label: it.label,
        text: sc.details[it.detail!],
        count: `${c.evidenceFound.length}/${sc.details.length}`,
      }
      clearTimeout(noteTimer)
      noteTimer = window.setTimeout(() => { note.value = null }, 6500)
      break
    }
    case 'manual': goLearn(); break
    case 'debrief':
      if (store.finaleDone) router.push('/debrief')
      else confront()
      break
    case 'board': briefingOpen.value = true; sfx.paper(); break
    case 'clue': examine(it.id, clues[it.id].lines, clues[it.id].unlocks); break
    case 'npc': examine(it.id, talks[it.id]); break
    case 'travel': mapOpen.value = true; keys.clear(); sfx.open(); break
    case 'flavor':
      if (it.id === 'coffee' && store.resolve < store.maxResolve) {
        store.restoreResolve()
        sfx.heal()
        showToast('Burnt espresso, black. Your hands stop shaking. Resolve restored.', 'good')
      } else { showToast(it.text ?? '', 'plain'); sfx.blip() }
      break
  }
}

let noteTimer = 0, toastTimer = 0, bannerTimer = 0
function showToast(text: string, tone = 'plain', ms = 3200) {
  toast.value = { key: Date.now(), text, tone }
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = null }, ms)
}

// ── Panel lifecycle ──
let pendingRestore: string | null = null
function onSolved() {
  const room = rooms.find(r => r.scenarioId === activeScenarioId.value)
  pendingRestore = room?.id ?? null
}
function closePanel() {
  panelOpen.value = false
  activeScenarioId.value = null
  if (pendingRestore) {
    const id = pendingRestore
    pendingRestore = null
    flicker[id] = time
    sfx.restore()
    const c = store.getCase(roomById[id].scenarioId!)
    showToast(`${roomById[id].name} sealed · +${c?.xpEarned ?? 0} XP${levelNote()}`, 'good', 3600)
    const all = store.allSolved
    if (all) { setLocks(true); flicker.briefing = time + 1.4 }
    // what she tried to say here, and what it lets you prove
    const sid = roomById[id].scenarioId!
    window.setTimeout(() => {
      playScene(
        [...fragments[sid].lines, { k: 'proof', title: proofById[sid].title, text: proofById[sid].text }],
        () => { if (all) showToast('All five sealed. The Briefing Room is open, and someone is in it.', 'good', 6000) },
      )
    }, 1500)
  }
}

function closeBriefing() {
  briefingOpen.value = false
  if (!store.briefingSeen) store.markBriefingSeen()
}

function goLearn() {
  store.setLastPos(px, py)
  router.push('/learn')
}

function toggleSound() {
  muted.value = !muted.value
  setMuted(muted.value)
}

// ── Input ──
function unlock() {
  unlockAudio()
  if (!muted.value) startAmbience()
}

function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  unlock()
  const k = e.key.toLowerCase()
  if (k === 'escape') {
    if (briefingOpen.value) closeBriefing()
    else if (!panelOpen.value) menuOpen.value = !menuOpen.value
    return
  }
  if (k === 'm') { toggleSound(); return }
  if (k === 'tab' && !paused.value) { e.preventDefault(); mapOpen.value = true; keys.clear(); return }
  if (paused.value) return
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
    keys.add(k)
    if (k !== 'shift') { path = null; pendingInteract = null; target = null }
    e.preventDefault()
  }
  if ((k === 'e' || k === 'enter' || k === ' ') && nearId.value) {
    e.preventDefault()
    interact(nearId.value)
  }
}
function onKeyUp(e: KeyboardEvent) { keys.delete(e.key.toLowerCase()) }
function onBlur() { keys.clear() }

function walkTo(wx: number, wy: number, interactId: string | null) {
  const p = findPath(px, py, wx, wy)
  if (!p) { sfx.denied(); return }
  path = p
  pendingInteract = interactId
  const last = p[p.length - 1] ?? { x: px, y: py }
  target = { x: last.x, y: last.y, age: 0 }
}

function onPointerDown(e: PointerEvent) {
  if (paused.value || !renderer || e.button !== 0) return
  const w = renderer.screenToWorld(e.offsetX, e.offsetY, camX, camY)
  let hit: Interactable | null = null, hd = 30
  for (const it of interactables) {
    if (!available(it)) continue
    const d = Math.hypot(it.x - w.x, it.y - w.y)
    if (d < hd) { hd = d; hit = it }
  }
  if (hit && Math.hypot(hit.x - px, hit.y - py) < (hit.range ?? 46)) { interact(hit.id); return }
  if (hit) walkTo(hit.x, hit.y, hit.id)
  else walkTo(w.x, w.y, null)
}

function onPointerMove(e: PointerEvent) {
  if (e.pointerType === 'mouse') mouse = { x: e.offsetX, y: e.offsetY, t: time }
}

function onMiniClick(e: PointerEvent) {
  const el = miniEl.value!
  const r = el.getBoundingClientRect()
  const z = zone.value
  walkTo(z.x + ((e.clientX - r.left) / r.width) * z.w, z.y + ((e.clientY - r.top) / r.height) * z.h, null)
}

function onJoy(x: number, y: number) {
  joy = { x, y }
  if (x || y) { path = null; pendingInteract = null; target = null }
}

// ── Loop ──
let raf = 0
let last = 0
let frame = 0

function step(dt: number) {
  time += dt

  // input → desired velocity
  let ix = 0, iy = 0
  if (!paused.value) {
    if (keys.has('a') || keys.has('arrowleft'))  ix -= 1
    if (keys.has('d') || keys.has('arrowright')) ix += 1
    if (keys.has('w') || keys.has('arrowup'))    iy -= 1
    if (keys.has('s') || keys.has('arrowdown'))  iy += 1
    ix += joy.x; iy += joy.y
  }
  let speed = keys.has('shift') ? 235 : 150
  const mag = Math.hypot(ix, iy)
  if (mag > 1) { ix /= mag; iy /= mag }
  if (mag > 0.05) {
    speed *= Math.min(1, mag)
  } else if (path && path.length && !paused.value) {
    const wp = path[0]
    const dx = wp.x - px, dy = wp.y - py
    const d = Math.hypot(dx, dy)
    if (d < 5) {
      path.shift()
      if (!path.length) {
        path = null
        if (pendingInteract) {
          const id = pendingInteract
          pendingInteract = null
          const it = interactables.find(i => i.id === id)
          if (it && Math.hypot(it.x - px, it.y - py) < (it.range ?? 46) + 12) interact(id)
        }
      }
    } else { ix = dx / d; iy = dy / d; speed = 165 }
  }

  const k = 1 - Math.exp(-dt * 14)
  vx += (ix * speed - vx) * k
  vy += (iy * speed - vy) * k
  if (paused.value) { vx = 0; vy = 0 }

  const before = { x: px, y: py }
  const r = move(px, py, vx * dt, vy * dt)
  px = r.x; py = r.y
  const moved = Math.hypot(px - before.x, py - before.y)
  // stuck against something while auto-walking? give up
  if (path && moved < 0.02 * speed * dt && Math.hypot(ix, iy) > 0) { path = null; pendingInteract = null }

  const moving = moved > 0.3
  if (moving) {
    phase += moved * 0.085
    const sp = Math.hypot(vx, vy)
    if (Math.abs(vx) > Math.abs(vy) * 1.1) facing = vx > 0 ? 'right' : 'left'
    else if (sp > 5) facing = vy > 0 ? 'down' : 'up'
    const idx = Math.floor(phase / Math.PI)
    if (idx !== lastStepIdx) {
      lastStepIdx = idx
      const fl = roomAt(px, py)?.floor ?? 'corridor'
      sfx.step(fl.startsWith('carpet') ? 'soft' : 'hard')
      particles.push({ x: px + (idx % 2 ? 5 : -5), y: py, life: 0.45, max: 0.45 })
    }
  }

  // flashlight aim: mouse if recently used, otherwise travel direction
  let aim = lightAngle
  if (mouse && time - mouse.t < 3 && renderer) {
    const w = renderer.screenToWorld(mouse.x, mouse.y, camX, camY)
    aim = Math.atan2(w.y - (py - 16), w.x - px)
  } else if (moving) {
    aim = Math.atan2(vy, vx)
  }
  let da = aim - lightAngle
  while (da > Math.PI) da -= Math.PI * 2
  while (da < -Math.PI) da += Math.PI * 2
  lightAngle += da * (1 - Math.exp(-dt * 10))

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life -= dt
    particles[i].y -= dt * 6
    if (particles[i].life <= 0) particles.splice(i, 1)
  }
  if (target) { target.age += dt; if (!path && target.age > 0.6) target = null }

  // doors
  for (const d of doors) {
    if (d.style !== 'slide') continue
    const cx = (d.x + d.w / 2) * TILE, cy = (d.y + d.h / 2) * TILE
    const dist = Math.hypot(px - cx, py - cy)
    const locked = d.lock === 'allSolved' && !store.allSolved
    const want = !locked && dist < 84 ? 1 : 0
    const prev = doorOpen[d.id] ?? 0
    const next = prev + (want - prev) * (1 - Math.exp(-dt * 9))
    if (prev < 0.05 && next >= 0.05) sfx.door()
    doorOpen[d.id] = next
    if (locked && dist < 52 && time - lockNoticeAt > 4) {
      lockNoticeAt = time
      sfx.denied()
      showToast(`Briefing Room locked. ${scenarios.length - store.solvedCount} case${scenarios.length - store.solvedCount === 1 ? '' : 's'} still open.`, 'warn')
    }
  }

  // room lighting (with a fluorescent stutter when power comes back)
  for (const room of rooms) {
    const want = roomTargetPower(room.id)
    const f = flicker[room.id]
    if (f !== undefined && time >= f && time - f < 1.3) {
      const tt = time - f
      roomPower[room.id] = Math.sin(tt * 47) * Math.sin(tt * 13) > 0.1 ? Math.min(1, tt) : 0.05
      continue
    }
    if (f !== undefined && time < f) continue
    roomPower[room.id] += (want - roomPower[room.id]) * (1 - Math.exp(-dt * 4))
  }

  // room entry
  const here = roomAt(px, py)
  if (here && here.id !== currentRoom) {
    currentRoom = here.id
    store.visitRoom(here.id)
    if (here.scenarioId) store.visitCase(here.scenarioId)
    if (here.h > 3) showBanner(here.id)
    const w = wardenOf(here.scenarioId)
    if (w && store.markScene(`intro-${w.def.id}`)) { w.stun = 1.5; playScene(w.def.intro) }
  }

  // wardens
  if (!paused.value) {
    for (const w of wardens) {
      const ev = stepWarden(w, dt, { x: px, y: py, running: keys.has('shift') && moving })
      if (ev === 'spotted') sfx.spotted()
      else if (ev === 'touch') { fightWarden(w); break }
    }
  }
  if (here?.scenarioId && caseStatus(here.scenarioId) !== 'solved' && !paused.value) {
    alarmTimer -= dt
    if (alarmTimer <= 0) { sfx.alarm(); alarmTimer = 2.8 }
  }

  // nearest interactable
  const n = paused.value ? null : nearest()
  if (n !== nearId.value) nearId.value = n

  // camera
  if (renderer) {
    const { tx, ty } = camTarget()
    const ck = 1 - Math.exp(-dt * 7)
    camX += (tx - camX) * ck
    camY += (ty - camY) * ck
  }

  return moving
}

/** Where the camera wants to be: on the player, but never showing past the edge of this place. */
function camTarget() {
  const vw = renderer!.viewW, vh = renderer!.viewH, z = zone.value
  return {
    tx: vw >= z.w ? z.x + (z.w - vw) / 2 : Math.max(z.x, Math.min(z.x + z.w - vw, px - vw / 2)),
    ty: vh >= z.h + 96 ? z.y + (z.h - vh) / 2 : Math.max(z.y - 56, Math.min(z.y + z.h - vh + 40, py - 20 - vh / 2)),
  }
}
function snapCamera() {
  if (!renderer) return
  const c = camTarget()
  camX = c.tx; camY = c.ty
}

function showBanner(roomId: string) {
  const r = roomById[roomId]
  let sub = zoneId.value === 'hq' ? 'Night lighting' : zone.value.name
  let tone = 'plain'
  if (r.scenarioId) {
    const st = caseStatus(r.scenarioId)
    const c = store.getCase(r.scenarioId)!
    const total = scenarios.find(s => s.id === r.scenarioId)!.details.length
    const w = wardenOf(r.scenarioId)
    if (st === 'solved') { sub = 'Sealed'; tone = 'good' }
    else { sub = `${w ? `${w.def.name} on guard` : 'Terminal free'} · clues ${c.evidenceFound.length}/${total}`; tone = 'bad' }
  } else if (r.lockedUntilSolved) {
    sub = store.finaleDone ? 'Debrief at the podium' : store.allSolved ? 'Someone is at the podium' : 'Locked'
  } else if (r.id === 'training') sub = 'The manual Laras read is at the kiosk'
  else if (r.id === 'pantry') sub = 'Coffee steadies your nerves'
  else if (r.id === 'lobby') sub = 'Laras\'s message on the east wall'
  banner.value = { title: r.name, sub, tone }
  clearTimeout(bannerTimer)
  bannerTimer = window.setTimeout(() => { banner.value = null }, 2600)
}

function updateObjective() {
  const here = currentRoom ? roomById[currentRoom] : null
  const o = objective.value
  let tx = px, ty = py
  // the trail: home, then her boarding house, then the office
  const trail: ZoneId = store.unlocked.includes('hq') ? 'hq' : store.unlocked.includes('kost') ? 'kost' : 'home'
  const point = (id: string) => { const it = interactables.find(i => i.id === id)!; tx = it.x; ty = it.y }
  const noted = (place: string) => Object.keys(clues).filter(id => clues[id].place === place)
  if (zoneId.value !== trail) {
    point(EXIT[zoneId.value])
    o.kicker = zone.value.name
    o.text = `Leave for ${zoneById[trail].name}`
  } else if (trail === 'home') {
    point('h-phone')
    o.kicker = `Home · ${noted('home').filter(id => store.storyClues.includes(id)).length}/${noted('home').length} examined`
    o.text = 'Her phone is in her old room, down the hall'
  } else if (trail === 'kost') {
    point('k-notebook')
    o.kicker = `Kost Melati · ${noted('kost').filter(id => store.storyClues.includes(id)).length}/${noted('kost').length} examined`
    o.text = 'Room 7: look under the desk drawer'
  } else if (store.allSolved) {
    const it = interactables.find(i => i.id === 'debrief')!
    tx = it.x; ty = it.y
    o.kicker = store.finaleDone ? 'It is over' : 'All five cases sealed'
    o.text = store.finaleDone ? 'Read the debrief at the podium' : 'Someone is waiting in the Briefing Room'
  } else if (here?.scenarioId && caseStatus(here.scenarioId) !== 'solved') {
    const sc = scenarios.find(s => s.id === here.scenarioId)!
    const c = store.getCase(sc.id)!
    const w = wardenOf(sc.id)
    const missing = interactables.filter(i => i.scenarioId === sc.id && i.kind === 'evidence' && !c.evidenceFound.includes(i.detail!))
    o.kicker = `${here.name} · clues ${c.evidenceFound.length}/${sc.details.length}`
    if (missing.length) {
      const m = missing.reduce((a, b) => Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b)
      tx = m.x; ty = m.y
      o.text = w ? `Gather clues out of ${w.def.name}'s sight, or face it now` : 'Search for marked objects, then seal the case at the terminal'
    } else if (w) {
      tx = w.x; ty = w.y
      o.text = `Break ${w.def.name} to free the terminal`
    } else {
      const term = interactables.find(i => i.id === `term-${sc.id}`)!
      tx = term.x; ty = term.y
      o.text = 'Put on record what was done here'
    }
  } else {
    const open = interactables.filter(i => i.kind === 'terminal' && caseStatus(i.scenarioId!) !== 'solved')
    const t = open.reduce((a, b) => Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b)
    tx = t.x; ty = t.y
    const room = rooms.find(r => r.scenarioId === t.scenarioId)!
    o.kicker = `${store.solvedCount}/${scenarios.length} cases sealed`
    o.text = `Nearest dark room: ${room.name}`
  }
  o.angle = Math.atan2(ty - py, tx - px) + Math.PI / 4
}

// ── Minimap ──
function drawMini() {
  const c = miniEl.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  const W = c.clientWidth, H = c.clientHeight
  if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
  const g = c.getContext('2d')!
  const z = zone.value
  const k = (W / z.w) * dpr
  const u = z.w / 1600   // marker sizes were tuned for the office floor
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, c.width, c.height)
  g.setTransform(k, 0, 0, k, -z.x * k, -z.y * k)
  for (const r of rooms) {
    const seen = store.visitedRooms.includes(r.id)
    const x = r.x * TILE, y = r.y * TILE, w = r.w * TILE, h = r.h * TILE
    g.fillStyle = seen ? '#3A414C' : '#1C2129'
    g.fillRect(x, y, w, h)
    if (r.scenarioId) {
      g.strokeStyle = STATUS_COLOR[caseStatus(r.scenarioId)]
      g.lineWidth = 14
      g.strokeRect(x + 7, y + 7, w - 14, h - 14)
    }
  }
  for (const d of doors) {
    g.fillStyle = d.lock && !store.allSolved ? '#E0503A' : '#3A414C'
    g.fillRect(d.x * TILE, d.y * TILE, d.w * TILE, d.h * TILE)
  }
  if (path && path.length) {
    g.strokeStyle = 'rgba(240,232,210,0.6)'; g.lineWidth = 10
    g.setLineDash([24, 18])
    g.beginPath(); g.moveTo(px, py)
    for (const p of path) g.lineTo(p.x, p.y)
    g.stroke(); g.setLineDash([])
  }
  for (const w of wardens) {
    g.fillStyle = w.def.color
    g.beginPath(); g.arc(w.x, w.y, w.state === 'chase' ? 30 : 22, 0, Math.PI * 2); g.fill()
  }
  const exit = interactables.find(i => i.id === EXIT[zoneId.value])!
  g.fillStyle = '#F0C674'
  g.fillRect(exit.x - 22 * u, exit.y - 22 * u, 44 * u, 44 * u)
  g.fillStyle = '#F2EDE2'
  g.beginPath(); g.arc(px, py, 34 * u, 0, Math.PI * 2); g.fill()
  g.fillStyle = store.playerColor
  g.beginPath(); g.arc(px, py, 22 * u, 0, Math.PI * 2); g.fill()
}

function loop(now: number) {
  const dt = Math.min(0.05, (now - (last || now)) / 1000)
  last = now
  const moving = step(dt)
  frame++
  if (frame % 15 === 0) updateObjective()
  if (frame % 6 === 0) drawMini()

  if (renderer) {
    const caseStat: Record<string, CaseStatus> = {}
    for (const s of scenarios) caseStat[s.id] = caseStatus(s.id)
    const found = new Set<string>()
    for (const it of interactables) {
      if (it.kind === 'evidence' && store.getCase(it.scenarioId!)?.evidenceFound.includes(it.detail!)) found.add(it.id)
      if ((it.kind === 'clue' || it.kind === 'npc') && store.storyClues.includes(it.id)) found.add(it.id)
    }
    renderer.draw({
      time, camX, camY,
      player: { x: px, y: py, color: store.playerColor, facing, phase, moving, name: store.playerName, lightAngle },
      doorOpen,
      lockedDoors: new Set(store.allSolved ? [] : doors.filter(d => d.lock).map(d => d.id)),
      roomPower,
      caseStatus: caseStat,
      foundEvidence: found,
      nearId: nearId.value,
      target,
      particles,
      allSolved: store.allSolved,
      wardens: wardens.map(w => ({
        x: w.x, y: w.y, color: w.def.color, name: w.def.name,
        alert: w.state === 'chase', stunned: w.stun > 0, near: currentRoom === w.room.id,
      })),
      npcs: store.allSolved && !store.finaleDone ? [...npcs, FIGURE] : npcs,
      zone: zone.value,
    })
  }
  raf = requestAnimationFrame(loop)
}

function resize() {
  if (!renderer || !canvasEl.value) return
  const el = canvasEl.value
  renderer.resize(el.clientWidth, el.clientHeight, Math.min(2, window.devicePixelRatio || 1))
}

function onVisibility() {
  if (document.hidden) store.setLastPos(px, py)
}

onMounted(() => {
  isTouch.value = window.matchMedia('(pointer: coarse)').matches
  renderer = new Renderer(canvasEl.value!)
  resize()
  // snap the camera onto the player on first frame
  snapCamera()
  const startRoom = roomAt(px, py)
  currentRoom = startRoom?.id ?? null
  if (startRoom) store.visitRoom(startRoom.id)
  if (startRoom?.scenarioId) store.visitCase(startRoom.scenarioId)
  updateObjective()
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  document.addEventListener('visibilitychange', onVisibility)
  raf = requestAnimationFrame(loop)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  store.setLastPos(px, py)
  stopAmbience()
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('blur', onBlur)
  document.removeEventListener('visibilitychange', onVisibility)
  clearTimeout(noteTimer); clearTimeout(toastTimer); clearTimeout(bannerTimer)
})
</script>

<style scoped>
.world {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #06080B;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
.view { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 75% 70% at 50% 55%, transparent 55%, #000000A0 100%);
}

/* Room banner */
.banner {
  position: absolute;
  top: 84px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  z-index: 20;
  text-shadow: 0 2px 12px #000;
}
.banner-title { font-size: 34px; color: var(--color-fog); }
.banner-sub { margin-top: 6px; font-size: 13px; color: var(--color-fog-dim); }
.banner-sub.bad { color: #F08A75; }
.banner-sub.good { color: #7FD3A8; }
.banner-enter-active { transition: opacity .35s, transform .35s; }
.banner-leave-active { transition: opacity .6s; }
.banner-enter-from { opacity: 0; transform: translate(-50%, -6px); }
.banner-leave-to { opacity: 0; }

/* Objective */
.objective {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(360px, calc(100vw - 24px));
  padding: 10px 14px 10px 10px;
  background: #0B0E13E6;
  border: 1px solid var(--color-ink-line);
  border-radius: 4px;
  z-index: 20;
}
.obj-compass {
  display: grid; place-items: center;
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--color-ink-600);
  color: #F0C674;
  transition: transform .25s ease-out;
}
.obj-k { color: var(--color-fog-mute); }
.obj-main { font-size: 14px; line-height: 1.35; margin-top: 2px; }

/* Minimap */
.minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 200px;
  padding: 6px;
  background: #0B0E13E6;
  border: 1px solid var(--color-ink-line);
  border-radius: 4px;
  z-index: 20;
}
.minimap canvas { display: block; width: 100%; cursor: pointer; }

/* Prompt */
.prompt {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100vw - 32px);
  height: 44px;
  padding: 0 16px 0 10px;
  background: var(--color-fog);
  color: var(--color-ink-950);
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 8px 30px #0009;
  cursor: pointer;
  z-index: 25;
}
.prompt .kbd { background: var(--color-ink-950); color: var(--color-fog); border-color: var(--color-ink-950); }
.prompt-obj { font-weight: 400; color: #4A453C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prompt-enter-active, .prompt-leave-active { transition: opacity .15s, transform .15s; }
.prompt-enter-from, .prompt-leave-to { opacity: 0; transform: translate(-50%, 6px); }

/* Evidence note */
.note {
  position: absolute;
  right: 16px;
  top: 76px;
  width: min(340px, calc(100vw - 32px));
  padding: 14px 16px 12px;
  border-radius: 2px;
  box-shadow: 0 12px 40px #000A;
  transform: rotate(0.6deg);
  z-index: 30;
}
.note-head { display: flex; justify-content: space-between; color: var(--color-pen-3); }
.note-count { font-size: 12px; }
.note-label { font-weight: 700; font-size: 15px; margin-top: 8px; }
.note-text { margin: 6px 0 10px; font-size: 14px; line-height: 1.5; }
.note-xp { font-size: 11px; color: #2F7D57; }
.note-enter-active { transition: opacity .25s, transform .3s cubic-bezier(.2,.8,.2,1.2); }
.note-leave-active { transition: opacity .3s, transform .3s; }
.note-enter-from { opacity: 0; transform: translateX(30px) rotate(3deg); }
.note-leave-to { opacity: 0; transform: translateX(20px) rotate(0.6deg); }

/* Toast */
.toast {
  position: absolute;
  left: 50%;
  top: 72px;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  padding: 10px 16px;
  border-radius: 4px;
  background: #11151CF2;
  border: 1px solid var(--color-ink-600);
  font-size: 14px;
  z-index: 32;
  text-align: center;
}
.toast.good { border-color: #3D9A6C; color: #BFE8D0; }
.toast.warn { border-color: #D9432F; color: #F5C1B6; }
.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -6px); }

/* Mobile */
.action-btn {
  position: absolute;
  right: 20px;
  bottom: calc(120px + env(safe-area-inset-bottom));
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 1px solid var(--color-ink-600);
  background: #0B0E13CC;
  color: var(--color-fog-dim);
  font-weight: 600;
  font-size: 13px;
  z-index: 26;
}
.action-btn.ready { background: var(--color-fog); color: var(--color-ink-950); border-color: var(--color-fog); }

/* Overlays */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 16px;
  background: #05070AB3;
  overflow-y: auto;
}
.memo {
  width: min(600px, 100%);
  padding: 28px 32px 28px;
  border-radius: 2px;
  box-shadow: 0 30px 80px #000A;
}
.memo-k { color: var(--color-pen-3); }
.memo-title { font-size: clamp(28px, 5vw, 40px); margin: 10px 0 14px; }
.memo p { font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
.memo-steps { list-style: decimal; margin: 0 0 14px; padding-left: 20px; display: grid; gap: 8px; font-size: 15px; line-height: 1.5; }
.memo-small { font-size: 13px !important; color: var(--color-pen-3); }
.proofs-k { margin-top: 4px; color: #2F7D57; }
.proofs { list-style: none; margin: 8px 0 14px; padding: 0; display: grid; gap: 6px; font-size: 13.5px; line-height: 1.5; }
.proofs li { padding-left: 10px; border-left: 3px solid #2F7D57; }
.proofs b { display: block; }
.controls {
  display: flex; flex-wrap: wrap; gap: 8px 18px;
  padding: 12px 0 0;
  margin-top: 4px;
  border-top: 1px dashed var(--color-paper-line);
  font-size: 13px;
  color: var(--color-pen-2);
}
.controls > div { display: flex; align-items: center; gap: 4px; }
.memo-btn { margin-top: 20px; width: 100%; height: 46px; font-size: 15px; }

.menu {
  width: min(320px, 100%);
  padding: 16px;
  background: var(--color-ink-900);
  border: 1px solid var(--color-ink-line);
  border-radius: 4px;
  box-shadow: 0 30px 80px #000A;
  display: grid;
  gap: 2px;
}
.menu-k { color: var(--color-fog-mute); padding: 4px 8px 10px; }
.menu-item {
  display: flex; align-items: center; gap: 12px;
  height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  text-align: left;
  font-size: 15px;
  cursor: pointer;
  color: var(--color-fog);
}
.menu-item:hover { background: var(--color-ink-800); }
.menu-item.dim { color: var(--color-fog-dim); }
.menu-foot { margin: 10px 8px 2px; font-size: 12px; color: var(--color-fog-mute); }

@media (max-width: 640px) {
  .minimap { width: 132px; top: 64px; bottom: auto; }
  .objective { bottom: auto; top: 64px; right: 156px; left: 8px; padding: 8px; gap: 8px; }
  .obj-main { font-size: 12.5px; }
  .obj-k { font-size: 10px; }
  .banner { top: 150px; }
  .banner-title { font-size: 26px; }
  .prompt { bottom: calc(220px + env(safe-area-inset-bottom)); }
  .note { top: auto; bottom: calc(220px + env(safe-area-inset-bottom)); }
}
</style>
