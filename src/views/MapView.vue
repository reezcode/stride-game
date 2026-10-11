<template>
  <div class="world" @pointerdown.capture="unlock">
    <canvas ref="canvasEl" class="view"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @contextmenu.prevent></canvas>
    <div class="vignette" aria-hidden="true"></div>

    <GameHUD :muted="muted" @manual="goLearn" @menu="menuOpen = true" @toggle-sound="toggleSound" />

    <!-- Room title -->
    <Transition name="banner">
      <div v-if="banner" :key="banner.title" class="banner">
        <div class="banner-title t-display">{{ banner.title }}</div>
        <div class="banner-sub" :class="banner.tone">{{ banner.sub }}</div>
      </div>
    </Transition>

    <!-- Objective -->
    <aside v-if="!panelOpen" class="objective">
      <div class="obj-compass" :style="{ transform: `rotate(${objective.angle}rad)` }" aria-hidden="true">
        <IconNavigationFilled :size="16" />
      </div>
      <div class="obj-text">
        <div class="t-label obj-k">{{ objective.kicker }}</div>
        <div class="obj-main">{{ objective.text }}</div>
      </div>
    </aside>

    <!-- Minimap -->
    <div v-if="!panelOpen" class="minimap" title="Click to walk there">
      <canvas ref="miniEl" @pointerdown.stop="onMiniClick"></canvas>
    </div>

    <!-- Interaction prompt -->
    <Transition name="prompt">
      <button v-if="nearInfo && !panelOpen && !menuOpen && !briefingOpen" class="prompt" @click="interact(nearInfo.id)">
        <span class="kbd">E</span>
        <span>{{ nearInfo.verb }}</span>
        <span class="prompt-obj">{{ nearInfo.label }}</span>
      </button>
    </Transition>

    <!-- Evidence note -->
    <Transition name="note">
      <div v-if="note" :key="note.key" class="note paper" role="status">
        <div class="note-head">
          <span class="t-label">Evidence · {{ note.room }}</span>
          <span class="t-mono note-count">{{ note.count }}</span>
        </div>
        <div class="note-label">{{ note.label }}</div>
        <p class="note-text">{{ note.text }}</p>
        <div class="note-xp t-mono">+{{ XP_RULES.evidence }} XP when the case is sealed</div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" :key="toast.key" class="toast" :class="toast.tone">{{ toast.text }}</div>
    </Transition>

    <!-- Mobile controls -->
    <template v-if="isTouch && !panelOpen">
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

    <!-- Briefing memo -->
    <div v-if="briefingOpen" class="overlay" @mousedown.self="closeBriefing">
      <article class="memo paper anim-rise">
        <div class="t-label memo-k">Internal memo · PayVault security · 02:14</div>
        <h1 class="t-display memo-title">Five rooms tripped the alarm tonight.</h1>
        <p>
          Intrusion detection flagged five systems on the 14th floor. Each breached room has its
          lights cut, a <b>case terminal</b> and evidence left behind by the people who built the system.
        </p>
        <ol class="memo-steps">
          <li><b>Search the room.</b> Marked objects glint when you get close. Each one adds a clue to the case file.</li>
          <li><b>Read the terminal.</b> It shows the endpoint, request and response under investigation.</li>
          <li><b>File a STRIDE report.</b> Pick every category that applies and rate its severity. Wrong categories cost XP.</li>
        </ol>
        <p class="memo-small">The Briefing Room stays locked until all five cases are sealed. The STRIDE field manual is in the Training Room if you need a refresher.</p>
        <div class="controls">
          <div><span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span> or click to walk</div>
          <div><span class="kbd">Shift</span> run</div>
          <div><span class="kbd">E</span> interact</div>
          <div><span class="kbd">M</span> sound</div>
          <div><span class="kbd">Esc</span> menu</div>
        </div>
        <button class="btn btn-ink memo-btn" @click="closeBriefing">
          {{ store.briefingSeen ? 'Back to work' : 'Start the shift' }}
        </button>
      </article>
    </div>

    <!-- Pause menu -->
    <div v-if="menuOpen" class="overlay" @mousedown.self="menuOpen = false">
      <div class="menu anim-rise">
        <div class="t-label menu-k">Paused</div>
        <button class="menu-item" @click="menuOpen = false"><IconPlayerPlay :size="18" /> Resume</button>
        <button class="menu-item" @click="menuOpen = false; briefingOpen = true"><IconNotes :size="18" /> Mission memo</button>
        <button class="menu-item" @click="goLearn"><IconBook2 :size="18" /> STRIDE field manual</button>
        <button class="menu-item" @click="toggleSound">
          <IconVolumeOff v-if="muted" :size="18" /><IconVolume v-else :size="18" />
          Sound: {{ muted ? 'off' : 'on' }}
        </button>
        <button v-if="store.allSolved" class="menu-item" @click="router.push('/debrief')"><IconReportAnalytics :size="18" /> Debrief</button>
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
  IconReportAnalytics, IconLogout,
} from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { scenarios } from '@/data'
import {
  WORLD_W, WORLD_H, TILE, rooms, roomById, doors, interactables, roomAt, SPAWN,
  type Interactable,
} from '@/game/world'
import { move, blocked, findPath, setLocks } from '@/game/physics'
import { Renderer, STATUS_COLOR, type CaseStatus } from '@/game/renderer'
import type { Facing } from '@/game/sprites'
import { sfx, unlockAudio, isMuted, setMuted, startAmbience, stopAmbience } from '@/game/audio'
import { XP_RULES } from '@/game/stride'
import GameHUD from '@/components/GameHUD.vue'
import VirtualJoystick from '@/components/VirtualJoystick.vue'
import InvestigationPanel from '@/components/InvestigationPanel.vue'

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

const paused = computed(() => panelOpen.value || menuOpen.value || briefingOpen.value)

// ── Simulation state (plain, not reactive) ──
const start = (() => {
  const lp = store.lastPos
  if (lp && !blocked(lp.x, lp.y)) return lp
  return SPAWN
})()
let px = start.x, py = start.y
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

// ── Interactables ──

function available(it: Interactable) {
  if (it.kind === 'evidence') {
    const c = store.getCase(it.scenarioId!)
    return !!c && !c.solved && !c.evidenceFound.includes(it.detail!)
  }
  return true
}

const VERB: Record<Interactable['kind'], string> = {
  terminal: 'Open case file', evidence: 'Examine', manual: 'Study', debrief: 'Start debrief', board: 'Read', flavor: 'Check',
}
const nearInfo = computed(() => {
  const it = interactables.find(i => i.id === nearId.value)
  if (!it) return null
  let verb = VERB[it.kind]
  if (it.kind === 'terminal' && store.getCase(it.scenarioId!)?.solved) verb = 'Review findings'
  const label = it.kind === 'terminal'
    ? `${scenarios.find(s => s.id === it.scenarioId)?.code} · ${scenarios.find(s => s.id === it.scenarioId)?.title}`
    : it.label
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
    case 'terminal':
      store.visitCase(it.scenarioId!)
      activeScenarioId.value = it.scenarioId!
      panelOpen.value = true
      keys.clear()
      break
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
    case 'debrief': router.push('/debrief'); break
    case 'board': briefingOpen.value = true; sfx.paper(); break
    case 'flavor': showToast(it.text ?? '', 'plain'); sfx.blip(); break
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
    showToast(`${roomById[id].name} secured · +${c?.xpEarned ?? 0} XP`, 'good', 3600)
    if (store.allSolved) {
      setLocks(true)
      flicker.briefing = time + 1.4
      window.setTimeout(() => showToast('All five cases sealed. The Briefing Room is open.', 'good', 5000), 3800)
    }
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
  walkTo(((e.clientX - r.left) / r.width) * WORLD_W, ((e.clientY - r.top) / r.height) * WORLD_H, null)
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
    const vw = renderer.viewW, vh = renderer.viewH
    const tx = vw >= WORLD_W ? (WORLD_W - vw) / 2 : Math.max(0, Math.min(WORLD_W - vw, px - vw / 2))
    const ty = vh >= WORLD_H ? (WORLD_H - vh) / 2 : Math.max(-56, Math.min(WORLD_H - vh + 40, py - 20 - vh / 2))
    const ck = 1 - Math.exp(-dt * 7)
    camX += (tx - camX) * ck
    camY += (ty - camY) * ck
  }

  return moving
}

function showBanner(roomId: string) {
  const r = roomById[roomId]
  let sub = 'Night lighting'
  let tone = 'plain'
  if (r.scenarioId) {
    const st = caseStatus(r.scenarioId)
    const c = store.getCase(r.scenarioId)!
    const total = scenarios.find(s => s.id === r.scenarioId)!.details.length
    if (st === 'solved') { sub = 'Secured'; tone = 'good' }
    else { sub = `Breach unresolved · evidence ${c.evidenceFound.length}/${total}`; tone = 'bad' }
  } else if (r.lockedUntilSolved) {
    sub = store.allSolved ? 'Debrief ready at the podium' : 'Locked'
  } else if (r.id === 'training') sub = 'STRIDE field manual at the kiosk'
  else if (r.id === 'lobby') sub = 'Case board on the east wall'
  banner.value = { title: r.name, sub, tone }
  clearTimeout(bannerTimer)
  bannerTimer = window.setTimeout(() => { banner.value = null }, 2600)
}

function updateObjective() {
  const here = currentRoom ? roomById[currentRoom] : null
  let tx = px, ty = py
  if (store.allSolved) {
    const it = interactables.find(i => i.id === 'debrief')!
    tx = it.x; ty = it.y
    objective.value.kicker = 'All cases closed'
    objective.value.text = 'Present your findings in the Briefing Room'
  } else if (here?.scenarioId && caseStatus(here.scenarioId) !== 'solved') {
    const sc = scenarios.find(s => s.id === here.scenarioId)!
    const c = store.getCase(sc.id)!
    const missing = interactables.filter(i => i.scenarioId === sc.id && i.kind === 'evidence' && !c.evidenceFound.includes(i.detail!))
    if (missing.length) {
      const m = missing.reduce((a, b) => Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b)
      tx = m.x; ty = m.y
      objective.value.kicker = `${here.name} · evidence ${c.evidenceFound.length}/${sc.details.length}`
      objective.value.text = 'Search for marked objects, then file at the terminal'
    } else {
      const term = interactables.find(i => i.id === `term-${sc.id}`)!
      tx = term.x; ty = term.y
      objective.value.kicker = `${here.name} · all evidence found`
      objective.value.text = 'File your STRIDE report at the terminal'
    }
  } else {
    const open = interactables.filter(i => i.kind === 'terminal' && caseStatus(i.scenarioId!) !== 'solved')
    const t = open.reduce((a, b) => Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b)
    tx = t.x; ty = t.y
    const room = rooms.find(r => r.scenarioId === t.scenarioId)!
    objective.value.kicker = `${store.solvedCount}/${scenarios.length} cases closed`
    objective.value.text = `Nearest breach: ${room.name}`
  }
  objective.value.angle = Math.atan2(ty - py, tx - px) + Math.PI / 4
}

// ── Minimap ──
function drawMini() {
  const c = miniEl.value
  if (!c) return
  const dpr = window.devicePixelRatio || 1
  const W = c.clientWidth, H = c.clientHeight
  if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
  const g = c.getContext('2d')!
  const k = (W / WORLD_W) * dpr
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, c.width, c.height)
  g.setTransform(k, 0, 0, k, 0, 0)
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
  g.fillStyle = '#F2EDE2'
  g.beginPath(); g.arc(px, py, 34, 0, Math.PI * 2); g.fill()
  g.fillStyle = store.playerColor
  g.beginPath(); g.arc(px, py, 22, 0, Math.PI * 2); g.fill()
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
  camX = Math.max(0, Math.min(WORLD_W - renderer.viewW, px - renderer.viewW / 2))
  camY = Math.max(-56, Math.min(WORLD_H - renderer.viewH + 40, py - 20 - renderer.viewH / 2))
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
.minimap canvas { display: block; width: 100%; aspect-ratio: 1600 / 1216; cursor: pointer; }

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
