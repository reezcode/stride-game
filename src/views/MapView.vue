<template>
  <div class="game-world" :class="{ 'panel-open': panelOpen }" tabindex="0" ref="worldRef" @keydown="onKey" @keyup="onKeyUp" @touchstart.prevent>

    <!-- Scanline overlay -->
    <div class="scanline-layer" aria-hidden="true"></div>

    <!-- ─── HUD ─── -->
    <GameHUD />

    <!-- ─── Map canvas ─── -->
    <div class="map-container">
      <div class="map-floor" :style="`transform: translate(${camX}px, ${camY}px)`">

        <!-- Floor grid pattern -->
        <div class="floor-grid" aria-hidden="true"></div>

        <!-- ════════════ ROOM WALLS ════════════ -->
        <!-- Server Room -->
        <div class="room-wall room-server"  style="left:20px;  top:40px;  width:320px; height:260px;"></div>
        <!-- Auth Lab -->
        <div class="room-wall room-auth"    style="left:420px; top:40px;  width:320px; height:260px;"></div>
        <!-- Finance Vault -->
        <div class="room-wall room-finance" style="left:820px; top:40px;  width:320px; height:260px;"></div>
        <!-- Admin Wing -->
        <div class="room-wall room-admin"   style="left:120px; top:440px; width:320px; height:260px;"></div>
        <!-- Archive Bay -->
        <div class="room-wall room-archive" style="left:560px; top:440px; width:320px; height:260px;"></div>
        <!-- Learn Desk area -->
        <div class="room-wall room-learn"   style="left:20px;  top:780px; width:260px; height:200px;"></div>
        <!-- Debrief room -->
        <div class="room-wall room-debrief" style="left:780px; top:780px; width:380px; height:200px;"></div>

        <!-- Corridor lines -->
        <div class="corridor-h" style="top:360px;"></div>
        <div class="corridor-v" style="left:360px;"></div>
        <div class="corridor-v" style="left:760px;"></div>

        <!-- Neon corridor strips -->
        <div class="neon-h" style="top:356px;"></div>
        <div class="neon-h" style="top:364px; opacity:0.4;"></div>
        <div class="neon-v" style="left:356px;"></div>
        <div class="neon-v" style="left:764px;"></div>

        <!-- Corridor intersection glow nodes -->
        <div class="junction-dot" style="left:360px; top:360px;"></div>
        <div class="junction-dot" style="left:760px; top:360px;"></div>

        <!-- Floor direction arrows -->
        <div class="floor-arrow" style="left:155px; top:378px;">▼</div>
        <div class="floor-arrow" style="left:540px; top:378px;">▼</div>
        <div class="floor-arrow" style="left:905px; top:378px;">▼</div>
        <div class="floor-arrow" style="left:378px; top:195px;">▶</div>
        <div class="floor-arrow" style="left:378px; top:575px;">▶</div>
        <div class="floor-arrow" style="left:778px; top:195px;">▶</div>
        <div class="floor-arrow" style="left:778px; top:575px;">▶</div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ──────── SERVER ROOM CONTENTS ───────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Server rack 1 -->
        <div class="s-rack" style="left:36px; top:65px;">
          <div class="s-rack-unit" v-for="n in 6" :key="n"
            :style="`animation-delay:${n*0.25}s`">
            <div class="s-rack-led" :class="n%2===0 ? 'led-green' : 'led-red'"></div>
            <div class="s-rack-bar"></div><div class="s-rack-bar short"></div>
          </div>
        </div>
        <!-- Server rack 2 -->
        <div class="s-rack" style="left:96px; top:65px;">
          <div class="s-rack-unit" v-for="n in 6" :key="n"
            :style="`animation-delay:${n*0.18+0.1}s`">
            <div class="s-rack-led" :class="n%3===0 ? 'led-orange' : 'led-green'"></div>
            <div class="s-rack-bar"></div><div class="s-rack-bar short"></div>
          </div>
        </div>
        <!-- Server rack 3 -->
        <div class="s-rack" style="left:156px; top:65px;">
          <div class="s-rack-unit" v-for="n in 6" :key="n"
            :style="`animation-delay:${n*0.3+0.05}s`">
            <div class="s-rack-led" :class="n%2===0 ? 'led-blue' : 'led-green'"></div>
            <div class="s-rack-bar"></div><div class="s-rack-bar short"></div>
          </div>
        </div>
        <!-- Cooling vent top -->
        <div class="vent-grill" style="left:230px; top:55px;"></div>
        <div class="vent-grill" style="left:276px; top:55px;"></div>
        <!-- Server glow ambience -->
        <div class="room-glow"
          style="left:36px; top:65px; width:180px; height:130px; background:radial-gradient(ellipse, rgba(18,166,122,0.18) 0%, transparent 70%);"></div>
        <!-- Warning tape -->
        <div class="warn-tape" style="left:30px; top:278px; width:290px;"></div>
        <!-- Security camera top-right of room -->
        <div class="sec-cam" style="left:298px; top:52px; transform:scaleX(-1);">
          <div class="cam-b"></div><div class="cam-l"><div class="cam-eye"></div></div>
        </div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ─────────── AUTH LAB CONTENTS ───────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Monitor desk 1 -->
        <div class="work-desk" style="left:444px; top:115px; width:76px; height:28px;"></div>
        <div class="monitor-obj" style="left:452px; top:90px;">
          <div class="mon-screen blue-screen"></div>
        </div>
        <!-- Monitor desk 2 -->
        <div class="work-desk" style="left:554px; top:115px; width:76px; height:28px;"></div>
        <div class="monitor-obj" style="left:562px; top:90px;">
          <div class="mon-screen blue-screen blink-screen"></div>
        </div>
        <!-- Chair in front of desk 1 -->
        <div class="chair-obj" style="left:470px; top:148px;"></div>
        <div class="chair-obj" style="left:578px; top:148px;"></div>
        <!-- Keypad panel on right wall -->
        <div class="keypad-panel" style="left:706px; top:70px;">
          <div class="kp-status" style="background:#12A67A; box-shadow:0 0 8px #12A67A;"></div>
          <div class="kp-grid">
            <div class="kp-btn" v-for="n in 12" :key="n"></div>
          </div>
        </div>
        <!-- Screen glow ambience -->
        <div class="room-glow"
          style="left:440px; top:60px; width:200px; height:80px; background:radial-gradient(ellipse, rgba(34,118,210,0.2) 0%, transparent 70%);"></div>
        <!-- Biometric scanner -->
        <div class="bio-scanner" style="left:440px; top:252px;">
          <div class="bio-beam"></div>
          <span class="bio-text">BIOMETRIC</span>
        </div>
        <!-- Security camera -->
        <div class="sec-cam" style="left:428px; top:52px;">
          <div class="cam-b"></div><div class="cam-l"><div class="cam-eye"></div></div>
        </div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ──────── FINANCE VAULT CONTENTS ──────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Big vault door -->
        <div class="vault-door-obj" style="left:870px; top:85px;">
          <div class="vd-outer">
            <div class="vd-ring vd-r1"></div>
            <div class="vd-ring vd-r2"></div>
            <div class="vd-handle"></div>
            <div class="vd-led" style="background:#E8453C; box-shadow:0 0 8px #E8453C;"></div>
          </div>
        </div>
        <!-- Safe stacks -->
        <div class="safe-obj" style="left:1074px; top:80px;"></div>
        <div class="safe-obj" style="left:1074px; top:120px; opacity:0.75;"></div>
        <!-- Warning stripes under vault door -->
        <div class="warn-tape" style="left:830px; top:278px; width:280px; --tape-angle:-45deg;"></div>
        <!-- Vault glow ambience -->
        <div class="room-glow"
          style="left:840px; top:55px; width:280px; height:200px; background:radial-gradient(ellipse, rgba(232,150,10,0.1) 0%, transparent 70%);"></div>
        <!-- Security camera -->
        <div class="sec-cam" style="left:1098px; top:52px; transform:scaleX(-1);">
          <div class="cam-b"></div><div class="cam-l"><div class="cam-eye"></div></div>
        </div>
        <!-- Caution label -->
        <div class="obj-label caution-label" style="left:900px; top:282px;">⚠ HIGH SECURITY ZONE</div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ─────────── ADMIN WING CONTENTS ──────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Meeting table (oval) -->
        <div class="meeting-table" style="left:160px; top:510px;">
          <!-- Chairs around it -->
          <div class="mt-chair" style="top:-18px; left:50%; transform:translateX(-50%);"></div>
          <div class="mt-chair" style="bottom:-18px; left:50%; transform:translateX(-50%);"></div>
          <div class="mt-chair" style="left:-18px; top:50%; transform:translateY(-50%);"></div>
          <div class="mt-chair" style="right:-18px; top:50%; transform:translateY(-50%);"></div>
        </div>
        <!-- Filing cabinets -->
        <div class="cabinet-obj" style="left:128px; top:588px;"></div>
        <div class="cabinet-obj" style="left:154px; top:588px; opacity:0.85;"></div>
        <!-- Wall-mounted monitor -->
        <div class="wall-mon" style="left:380px; top:455px;">
          <div class="wm-screen purple-screen">
            <div class="wm-line" v-for="i in 4" :key="i"></div>
          </div>
        </div>
        <!-- Plant -->
        <div class="plant-obj" style="left:393px; top:562px;">🌿</div>
        <!-- Glow -->
        <div class="room-glow"
          style="left:130px; top:450px; width:280px; height:200px; background:radial-gradient(ellipse, rgba(114,65,224,0.08) 0%, transparent 70%);"></div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ─────────── ARCHIVE BAY CONTENTS ──────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Shelf unit 1 -->
        <div class="shelf-unit" style="left:574px; top:458px;">
          <div class="shelf-row" v-for="r in 4" :key="r">
            <div class="s-box" v-for="b in 3" :key="b"
              :style="`background:hsl(${(r*45+b*30)%360},55%,15%); border-color:hsl(${(r*45+b*30)%360},55%,26%)`"></div>
          </div>
        </div>
        <!-- Shelf unit 2 -->
        <div class="shelf-unit" style="left:700px; top:458px;">
          <div class="shelf-row" v-for="r in 4" :key="r">
            <div class="s-box" v-for="b in 3" :key="b"
              :style="`background:hsl(${(r*60+b*20+90)%360},55%,15%); border-color:hsl(${(r*60+b*20+90)%360},55%,26%)`"></div>
          </div>
        </div>
        <!-- Crate stacks -->
        <div class="crate-obj" style="left:640px; top:625px;"></div>
        <div class="crate-obj small-crate" style="left:670px; top:637px;"></div>
        <!-- Glow -->
        <div class="room-glow"
          style="left:565px; top:450px; width:280px; height:200px; background:radial-gradient(ellipse, rgba(82,168,130,0.08) 0%, transparent 70%);"></div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ─────────── LEARN DESK CONTENTS ──────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Bookshelf -->
        <div class="book-shelf" style="left:28px; top:800px;">
          <div class="book" v-for="i in 8" :key="i"
            :style="`height:${28+i*4}px; background:hsl(${i*45},60%,22%); border-color:hsl(${i*45},60%,30%);`"></div>
        </div>
        <!-- Study desk -->
        <div class="work-desk" style="left:120px; top:868px; width:120px; height:30px;"></div>
        <!-- Desk lamp -->
        <div class="desk-lamp-obj" style="left:222px; top:848px;">
          <div class="lamp-arm"></div>
          <div class="lamp-shade"></div>
          <div class="lamp-glow-spot"></div>
        </div>
        <!-- Plant -->
        <div class="plant-obj" style="left:242px; top:862px;">🌱</div>
        <!-- Warm glow -->
        <div class="room-glow"
          style="left:20px; top:790px; width:230px; height:170px; background:radial-gradient(ellipse, rgba(232,150,10,0.1) 0%, transparent 70%);"></div>

        <!-- ═══════════════════════════════════════ -->
        <!-- ──────── DEBRIEF ROOM CONTENTS ──────── -->
        <!-- ═══════════════════════════════════════ -->

        <!-- Big presentation screen on left wall -->
        <div class="pres-screen" style="left:792px; top:800px;">
          <div class="ps-content">
            <div class="ps-line" v-for="i in 5" :key="i"
              :style="`width:${60-i*8}%; background:${store.allSolved ? '#12A67A' : '#2276D2'};`"></div>
          </div>
        </div>
        <!-- Chairs facing screen -->
        <div class="chair-row">
          <div class="chair-obj debrief-chair" style="left:884px; top:878px;"></div>
          <div class="chair-obj debrief-chair" style="left:916px; top:878px;"></div>
          <div class="chair-obj debrief-chair" style="left:948px; top:878px;"></div>
          <div class="chair-obj debrief-chair" style="left:980px; top:878px;"></div>
        </div>
        <!-- Trophy if all solved -->
        <div class="trophy-stand" style="left:1100px; top:820px;">
          <div class="trophy-emoji" :class="{ 'trophy-lit': store.allSolved }">🏆</div>
          <div class="trophy-plinth"></div>
        </div>
        <!-- Glow -->
        <div class="room-glow"
          :style="`left:790px; top:790px; width:360px; height:180px; background:radial-gradient(ellipse, rgba(232,150,10,${store.allSolved ? 0.15 : 0.04}) 0%, transparent 70%); transition:background 1s;`">
        </div>

        <!-- ── Terminal nodes (5 scenarios) ── -->
        <TerminalNode
          v-for="t in terminals" :key="t.id"
          :terminal="t"
          :case-progress="store.getCase(t.scenarioId)"
          :is-near="nearTerminalId === t.id"
          :style="`left:${t.x}px; top:${t.y}px;`"
          @interact="openCase(t.scenarioId)"
        />

        <!-- Learn Desk interact node -->
        <div class="desk-node learn-desk"
          :class="{ 'desk-near': nearLearnDesk }"
          style="left:60px; top:840px;"
          @click="goLearn">
          <div class="desk-icon">📚</div>
          <div class="desk-label">STRIDE<br/>Reference</div>
          <div v-if="nearLearnDesk" class="interact-hint">[ E ] Study</div>
        </div>

        <!-- Debrief desk (revealed when all solved) -->
        <Transition name="fade-scale">
          <div v-if="store.allSolved"
            class="desk-node debrief-desk"
            :class="{ 'desk-near': nearDebriefDesk }"
            style="left:820px; top:840px;"
            @click="goDebrief">
            <div class="desk-icon">🏆</div>
            <div class="desk-label">Mission<br/>Debrief</div>
            <div v-if="nearDebriefDesk" class="interact-hint">[ E ] Debrief</div>
          </div>
        </Transition>

        <!-- Player character (always on top) -->
        <PlayerCharacter
          :x="playerX"
          :y="playerY"
          :color="store.playerColor"
          :facing="facing"
          :moving="isMoving"
          :name="store.playerName"
        />

      </div>
    </div>

    <!-- Interaction prompt (when near terminal) -->
    <Transition name="slide-prompt">
      <div v-if="nearTerminalId && !panelOpen" class="interact-banner">
        <span class="key-badge">E</span>
        Investigate Terminal
        <span class="case-badge">{{ nearScenarioCode }}</span>
      </div>
    </Transition>

    <!-- ─── Virtual Joystick (mobile) ─── -->
    <VirtualJoystick
      v-if="isMobile"
      @move="onJoystickMove"
      @stop="onJoystickStop"
    />

    <!-- ─── Investigation panel (overlay) ─── -->
    <Transition name="panel-slide">
      <InvestigationPanel
        v-if="panelOpen && activeScenarioId"
        :scenario-id="activeScenarioId"
        @close="panelOpen = false"
        @solved="onCaseSolved"
      />
    </Transition>

    <!-- ─── Solved XP pop ─── -->
    <Transition name="xp-pop">
      <div v-if="showXP" class="xp-toast animate-xp-pop">
        +{{ lastXP }} XP
      </div>
    </Transition>

    <!-- ─── Case sealed stamp ─── -->
    <Transition name="stamp-in">
      <div v-if="showStamp" class="case-stamp animate-stamp">
        CASE<br/>SEALED
      </div>
    </Transition>

    <!-- ─── Mini-map (corner) ─── -->
    <div class="mini-map">
      <div class="mini-map-label">MAP</div>
      <div class="mini-map-world">
        <div v-for="t in terminals" :key="t.id"
          class="mini-terminal"
          :class="store.getCase(t.scenarioId)?.solved ? 'mini-solved' : 'mini-unsolved'"
          :style="`left:${t.x/12}px; top:${t.y/12}px;`">
        </div>
        <div class="mini-player"
          :style="`left:${playerX/12}px; top:${playerY/12}px; background:${store.playerColor};`">
        </div>
      </div>
    </div>

    <!-- Controls hint (bottom left) -->
    <div class="controls-hint">
      <span class="key-sm">W A S D</span> or <span class="key-sm">↑ ← ↓ →</span> to move &nbsp;·&nbsp;
      <span class="key-sm">E</span> to interact
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { scenarios } from '@/data'
import GameHUD from '@/components/GameHUD.vue'
import PlayerCharacter from '@/components/PlayerCharacter.vue'
import TerminalNode from '@/components/TerminalNode.vue'
import VirtualJoystick from '@/components/VirtualJoystick.vue'
import InvestigationPanel from '@/components/InvestigationPanel.vue'

const router = useRouter()
const store  = useGameStore()
store.load()

// Guard
if (!store.gameStarted) router.replace('/')

// Map dimensions
const MAP_W = 1200
const MAP_H = 1100

// Terminal positions
const terminals = [
  { id: 'T1', scenarioId: 'SC-001', x: 120,  y: 100,  label: 'TX-API',   code: 'SC-001' },
  { id: 'T2', scenarioId: 'SC-002', x: 520,  y: 100,  label: 'AUTH-SRV', code: 'SC-002' },
  { id: 'T3', scenarioId: 'SC-003', x: 920,  y: 100,  label: 'FIN-CORE', code: 'SC-003' },
  { id: 'T4', scenarioId: 'SC-004', x: 220,  y: 500,  label: 'ADMIN-01', code: 'SC-004' },
  { id: 'T5', scenarioId: 'SC-005', x: 660,  y: 500,  label: 'STORE-FS', code: 'SC-005' },
]

const INTERACT_RANGE = 80
const SPEED = 3

// Player state
const playerX = ref(580)
const playerY = ref(700)
const facing  = ref<'left'|'right'|'up'|'down'>('down')
const isMoving = ref(false)

// Camera
const worldRef = ref<HTMLElement|null>(null)
const camX = ref(0)
const camY = ref(0)

// Keys held
const keys = ref<Record<string, boolean>>({})
// Joystick state (mobile)
const joyDx = ref(0)
const joyDy = ref(0)

// Panels
const panelOpen = ref(false)
const activeScenarioId = ref<string|null>(null)

// XP/Stamp feedback
const showXP   = ref(false)
const showStamp = ref(false)
const lastXP   = ref(0)

const isMobile = ref(false)

// Near detection
const nearTerminalId = computed(() => {
  for (const t of terminals) {
    const cx = t.x + 40
    const cy = t.y + 40
    const dist = Math.hypot(playerX.value - cx, playerY.value - cy)
    if (dist < INTERACT_RANGE) return t.id
  }
  return null
})

const nearScenarioCode = computed(() => {
  if (!nearTerminalId.value) return ''
  return terminals.find(t => t.id === nearTerminalId.value)?.code ?? ''
})

const nearLearnDesk = computed(() => {
  const dist = Math.hypot(playerX.value - 100, playerY.value - 870)
  return dist < INTERACT_RANGE
})

const nearDebriefDesk = computed(() => {
  const dist = Math.hypot(playerX.value - 870, playerY.value - 870)
  return dist < INTERACT_RANGE
})

// Game loop
let animFrame = 0
function gameLoop() {
  if (!panelOpen.value) {
    let dx = 0
    let dy = 0

    if (keys.value['w'] || keys.value['arrowup'])    dy -= SPEED
    if (keys.value['s'] || keys.value['arrowdown'])  dy += SPEED
    if (keys.value['a'] || keys.value['arrowleft'])  dx -= SPEED
    if (keys.value['d'] || keys.value['arrowright']) dx += SPEED

    // Joystick
    if (Math.abs(joyDx.value) > 0.1 || Math.abs(joyDy.value) > 0.1) {
      dx += joyDx.value * SPEED
      dy += joyDy.value * SPEED
    }

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707
      dy *= 0.707
    }

    if (dx !== 0 || dy !== 0) {
      playerX.value = Math.max(20, Math.min(MAP_W - 20, playerX.value + dx))
      playerY.value = Math.max(20, Math.min(MAP_H - 20, playerY.value + dy))
      isMoving.value = true

      if (Math.abs(dx) > Math.abs(dy)) facing.value = dx > 0 ? 'right' : 'left'
      else facing.value = dy > 0 ? 'down' : 'up'
    } else {
      isMoving.value = false
    }

    // Camera follow
    if (worldRef.value) {
      const vw = worldRef.value.clientWidth
      const vh = worldRef.value.clientHeight
      const targetCamX = Math.min(0, Math.max(vw - MAP_W, vw / 2 - playerX.value))
      const targetCamY = Math.min(0, Math.max(vh - MAP_H, vh / 2 - playerY.value))
      camX.value += (targetCamX - camX.value) * 0.1
      camY.value += (targetCamY - camY.value) * 0.1
    }
  }

  animFrame = requestAnimationFrame(gameLoop)
}

function onKey(e: KeyboardEvent) {
  keys.value[e.key.toLowerCase()] = true
  if (e.key === 'e' || e.key === 'E') {
    if (nearTerminalId.value && !panelOpen.value) {
      const t = terminals.find(t => t.id === nearTerminalId.value)
      if (t) openCase(t.scenarioId)
    } else if (nearLearnDesk.value) goLearn()
    else if (nearDebriefDesk.value) goDebrief()
  }
}
function onKeyUp(e: KeyboardEvent) {
  keys.value[e.key.toLowerCase()] = false
}
function onJoystickMove(dx: number, dy: number) {
  joyDx.value = dx; joyDy.value = dy
}
function onJoystickStop() {
  joyDx.value = 0; joyDy.value = 0
}

function openCase(scenarioId: string) {
  const c = store.getCase(scenarioId)
  if (c?.solved) return // already solved; show brief result?
  store.visitCase(scenarioId)
  activeScenarioId.value = scenarioId
  panelOpen.value = true
}

function onCaseSolved(xp: number) {
  panelOpen.value = false
  lastXP.value    = xp
  showStamp.value = true
  setTimeout(() => { showStamp.value = false }, 1800)
  setTimeout(() => { showXP.value = true }, 300)
  setTimeout(() => { showXP.value = false }, 1800)
}

function goLearn() { router.push('/learn') }
function goDebrief() { router.push('/debrief') }

onMounted(() => {
  isMobile.value = window.matchMedia('(pointer: coarse)').matches
  worldRef.value?.focus()
  gameLoop()
})
onUnmounted(() => cancelAnimationFrame(animFrame))
</script>

<style scoped>
.game-world {
  position: fixed;
  inset: 0;
  background: var(--game-bg);
  overflow: hidden;
  outline: none;
  cursor: none;
  user-select: none;
}
/* Restore cursor when the investigation panel is open */
.game-world.panel-open {
  cursor: default;
}

.scanline-layer {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.08) 2px,
    rgba(0,0,0,0.08) 4px
  );
  pointer-events: none;
  z-index: 100;
}

.map-container {
  position: absolute;
  inset: 0;
  top: 56px; /* below HUD */
  overflow: hidden;
}

.map-floor {
  position: absolute;
  width: 1200px;
  height: 1100px;
  background: #0A0A18;
  will-change: transform;
  transition: none;
}

.floor-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Rooms */
.room-wall {
  position: absolute;
  background: #0D0D20;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
}

.corridor-h {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: rgba(255,255,255,0.05);
}
.corridor-v {
  position: absolute;
  top: 0; bottom: 0;
  width: 1px;
  background: rgba(255,255,255,0.05);
}

.room-label {
  position: absolute;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.18);
  font-family: 'JetBrains Mono', monospace;
  pointer-events: none;
}

/* Desk nodes */
.desk-node {
  position: absolute;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}
.desk-node:hover {
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
}
.desk-near {
  border-color: rgba(255,255,255,0.4) !important;
  box-shadow: 0 0 20px rgba(255,255,255,0.08);
}
.desk-icon { font-size: 22px; }
.desk-label {
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.3;
}
.interact-hint {
  font-size: 9px;
  color: rgba(255,255,255,0.7);
  font-family: 'JetBrains Mono', monospace;
  margin-top: 2px;
}

/* Interact banner */
.interact-banner {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(13,13,30,0.92);
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(12px);
  color: rgba(232,232,255,0.9);
  font-size: 13px;
  font-weight: 600;
  z-index: 50;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: white;
}
.case-badge {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(232,69,60,0.2);
  border: 1px solid rgba(232,69,60,0.4);
  color: #E8453C;
}

/* Mini-map */
.mini-map {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 100px;
  height: 92px;
  border-radius: 8px;
  background: rgba(8,8,18,0.85);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  overflow: hidden;
  z-index: 40;
}
.mini-map-label {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.3);
  font-family: 'JetBrains Mono', monospace;
}
.mini-map-world {
  position: absolute;
  inset: 16px 4px 4px;
}
.mini-terminal {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 2px;
  transform: translate(-50%, -50%);
}
.mini-unsolved { background: #E8453C; box-shadow: 0 0 4px #E8453C; }
.mini-solved   { background: #12A67A; box-shadow: 0 0 4px #12A67A; }
.mini-player {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px currentColor;
  z-index: 2;
}

/* XP toast */
.xp-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  font-weight: 900;
  color: #12A67A;
  text-shadow: 0 0 20px #12A67A88;
  pointer-events: none;
  z-index: 200;
  font-family: 'JetBrains Mono', monospace;
}

/* Case stamp */
.case-stamp {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-4deg);
  font-size: 2rem;
  font-weight: 900;
  color: #12A67A;
  border: 4px solid #12A67A;
  padding: 12px 24px;
  border-radius: 8px;
  text-align: center;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  pointer-events: none;
  z-index: 200;
  font-family: 'JetBrains Mono', monospace;
  box-shadow: 0 0 30px #12A67A44;
}

/* Controls hint */
.controls-hint {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(255,255,255,0.22);
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 40;
  white-space: nowrap;
}
.key-sm {
  display: inline-flex;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}

/* Transitions */
.slide-prompt-enter-active, .slide-prompt-leave-active { transition: all 0.25s ease; }
.slide-prompt-enter-from, .slide-prompt-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

.panel-slide-enter-active { transition: all 0.3s cubic-bezier(0.34,1.2,0.64,1); }
.panel-slide-leave-active { transition: all 0.2s ease; }
.panel-slide-enter-from { opacity: 0; transform: scale(0.94) translateY(12px); }
.panel-slide-leave-to   { opacity: 0; transform: scale(0.96) translateY(8px); }

.xp-pop-enter-active { transition: none; }
.xp-pop-leave-active { transition: none; }

.stamp-in-enter-active { transition: none; }
.stamp-in-leave-active { transition: all 0.3s ease; }
.stamp-in-leave-to { opacity: 0; transform: translate(-50%, -50%) rotate(-4deg) scale(0.8); }

.fade-scale-enter-active { animation: bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
.fade-scale-leave-active { transition: all 0.2s ease; }
.fade-scale-leave-to { opacity: 0; transform: scale(0.8); }

/* ════════════════════════════════════════════════
   MAP DECORATION ELEMENTS
   ════════════════════════════════════════════════ */

/* Room tints */
.room-wall { position: absolute; }
.room-server  { background: #0D0D1E; border: 1px solid rgba(18,166,122,0.12); border-radius: 8px; }
.room-auth    { background: #0D0D1E; border: 1px solid rgba(34,118,210,0.12); border-radius: 8px; }
.room-finance { background: #0D0D1E; border: 1px solid rgba(232,150,10,0.12); border-radius: 8px; }
.room-admin   { background: #0D0D1E; border: 1px solid rgba(114,65,224,0.12); border-radius: 8px; }
.room-archive { background: #0D0D1E; border: 1px solid rgba(82,168,130,0.12); border-radius: 8px; }
.room-learn   { background: #0D0D1E; border: 1px solid rgba(232,150,10,0.10); border-radius: 8px; }
.room-debrief { background: #0D0D1E; border: 1px solid rgba(232,150,10,0.12); border-radius: 8px; }

/* Neon corridor lines */
.neon-h {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 4%,
    rgba(114,65,224,0.35) 30%,
    rgba(34,118,210,0.35) 70%,
    transparent 96%);
  pointer-events: none;
}
.neon-v {
  position: absolute;
  top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(180deg,
    transparent 4%,
    rgba(34,118,210,0.3) 30%,
    rgba(114,65,224,0.3) 70%,
    transparent 96%);
  pointer-events: none;
}

/* Intersection glow dots */
.junction-dot {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(114,65,224,0.6);
  box-shadow: 0 0 16px 4px rgba(114,65,224,0.35);
  animation: juncPulse 2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes juncPulse {
  0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
  50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.4); }
}

/* Floor arrows */
.floor-arrow {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: rgba(255,255,255,0.1);
  font-family: monospace;
  pointer-events: none;
  animation: arrowFade 2.5s ease-in-out infinite;
}
@keyframes arrowFade {
  0%,100% { opacity: 0.15; }
  50%     { opacity: 0.4; }
}

/* Ambient room glow blobs */
.room-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
}

/* Warning tape */
.warn-tape {
  position: absolute;
  height: 10px;
  background: repeating-linear-gradient(
    -45deg,
    rgba(232,150,10,0.55), rgba(232,150,10,0.55) 6px,
    rgba(8,8,24,0.4) 6px, rgba(8,8,24,0.4) 12px
  );
  border-radius: 2px;
  pointer-events: none;
}

/* ── SERVER RACKS ── */
.s-rack {
  position: absolute;
  width: 50px;
  background: #0A0A18;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 8px rgba(0,0,0,0.5);
}
.s-rack-unit {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  animation: rackPulse 1.5s ease-in-out infinite;
}
.s-rack-led {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.led-green  { background:#12A67A; box-shadow:0 0 4px #12A67A; }
.led-red    { background:#E8453C; box-shadow:0 0 4px #E8453C; animation: ledBlink 0.8s step-end infinite; }
.led-orange { background:#E8960A; box-shadow:0 0 4px #E8960A; animation: ledBlink 1.2s step-end infinite; }
.led-blue   { background:#2276D2; box-shadow:0 0 4px #2276D2; }
@keyframes rackPulse {
  0%,100% { opacity: 0.8; }
  50%     { opacity: 1; }
}
@keyframes ledBlink {
  0%,49% { opacity: 1; }
  50%,100% { opacity: 0.15; }
}
.s-rack-bar {
  height: 3px;
  flex: 1;
  border-radius: 1px;
  background: rgba(255,255,255,0.12);
}
.s-rack-bar.short { flex: 0.6; }

/* Cooling vent grill */
.vent-grill {
  position: absolute;
  width: 36px;
  height: 16px;
  background: repeating-linear-gradient(
    90deg,
    rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 3px,
    transparent 3px, transparent 6px
  );
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 3px;
  pointer-events: none;
}

/* Security camera */
.sec-cam {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}
.cam-b {
  width: 14px;
  height: 8px;
  background: #1a1a2e;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 3px 0 0 3px;
}
.cam-l {
  width: 10px;
  height: 6px;
  background: #0A0A18;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0 2px 2px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cam-eye {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #E8453C;
  box-shadow: 0 0 5px #E8453C;
  animation: camBlink 2.5s ease-in-out infinite;
}
@keyframes camBlink {
  0%,85%,100% { opacity: 1; }
  90% { opacity: 0; }
}

/* ── MONITORS ── */
.monitor-obj {
  position: absolute;
  width: 60px;
  height: 38px;
  background: #080818;
  border: 1.5px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.mon-screen {
  width: 52px;
  height: 30px;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}
.blue-screen {
  background: linear-gradient(135deg, #0a1a3a 0%, #0d2060 100%);
}
.blue-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 3px,
    rgba(34,118,210,0.15) 3px, rgba(34,118,210,0.15) 4px
  );
}
.blink-screen { animation: screenBlink 3s ease-in-out infinite; }
@keyframes screenBlink {
  0%,80%,100% { opacity: 1; }
  85% { opacity: 0.3; }
}

/* Work desk */
.work-desk {
  position: absolute;
  background: #16162A;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  pointer-events: none;
}

/* Chair */
.chair-obj {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #1e1e32;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50% 50% 30% 30%;
  pointer-events: none;
}
.debrief-chair { border-color: rgba(232,150,10,0.2); }

/* Keypad panel */
.keypad-panel {
  position: absolute;
  width: 26px;
  background: #0D0D1E;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  pointer-events: none;
}
.kp-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 auto;
}
.kp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.kp-btn {
  width: 5px;
  height: 5px;
  border-radius: 1px;
  background: rgba(255,255,255,0.12);
}

/* Biometric scanner */
.bio-scanner {
  position: absolute;
  width: 80px;
  height: 22px;
  background: #0A0A18;
  border: 1px solid rgba(34,118,210,0.4);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  pointer-events: none;
}
.bio-beam {
  width: 70px;
  height: 2px;
  background: rgba(34,118,210,0.6);
  border-radius: 1px;
  animation: bioScan 1.6s ease-in-out infinite;
}
@keyframes bioScan {
  0%,100% { transform: translateY(-4px); opacity: 0.3; }
  50%     { transform: translateY(4px);  opacity: 1; }
}
.bio-text {
  font-size: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: rgba(34,118,210,0.6);
  letter-spacing: 0.06em;
}

/* ── VAULT DOOR ── */
.vault-door-obj {
  position: absolute;
  pointer-events: none;
}
.vd-outer {
  width: 100px;
  height: 160px;
  background: #1a1428;
  border: 3px solid rgba(232,150,10,0.4);
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(232,150,10,0.08), inset 0 0 12px rgba(0,0,0,0.5);
}
.vd-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(232,150,10,0.35);
}
.vd-r1 { width: 70px;  height: 70px; }
.vd-r2 { width: 44px;  height: 44px; border-color: rgba(232,150,10,0.5); }
.vd-handle {
  position: absolute;
  width: 30px;
  height: 6px;
  background: rgba(232,150,10,0.5);
  border-radius: 3px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-35deg);
}
.vd-led {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: ledBlink 1.5s step-end infinite;
}

/* Safe boxes */
.safe-obj {
  position: absolute;
  width: 38px;
  height: 32px;
  background: #1a1428;
  border: 1px solid rgba(232,150,10,0.3);
  border-radius: 4px;
  pointer-events: none;
}
.safe-obj::after {
  content: '';
  position: absolute;
  top: 50%; left: 4px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(232,150,10,0.4);
}

/* ── MEETING TABLE ── */
.meeting-table {
  position: absolute;
  width: 100px;
  height: 60px;
  background: #18182e;
  border: 1px solid rgba(114,65,224,0.25);
  border-radius: 30px;
  pointer-events: none;
}
.mt-chair {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #1e1e32;
  border: 1px solid rgba(114,65,224,0.2);
  border-radius: 50% 50% 30% 30%;
}

/* Filing cabinet */
.cabinet-obj {
  position: absolute;
  width: 22px;
  height: 50px;
  background: #14142A;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  pointer-events: none;
}
.cabinet-obj::before,
.cabinet-obj::after {
  content: '';
  position: absolute;
  left: 2px; right: 2px;
  height: 1px;
  background: rgba(255,255,255,0.08);
}
.cabinet-obj::before { top: 33%; }
.cabinet-obj::after  { top: 66%; }

/* Wall monitor */
.wall-mon {
  position: absolute;
  width: 70px;
  height: 46px;
  background: #08080E;
  border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  overflow: hidden;
  pointer-events: none;
}
.wm-screen { width: 100%; height: 100%; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
.purple-screen { background: #0d0820; }
.wm-line {
  height: 3px;
  background: rgba(114,65,224,0.4);
  border-radius: 1.5px;
  animation: wmFlick 1.8s ease-in-out infinite;
}
.wm-line:nth-child(1) { width: 80%; animation-delay: 0s; }
.wm-line:nth-child(2) { width: 60%; animation-delay: 0.3s; }
.wm-line:nth-child(3) { width: 90%; animation-delay: 0.6s; }
.wm-line:nth-child(4) { width: 50%; animation-delay: 0.9s; }
@keyframes wmFlick {
  0%,100% { opacity: 0.4; }
  50%     { opacity: 0.8; }
}

/* Plant */
.plant-obj {
  position: absolute;
  font-size: 20px;
  pointer-events: none;
  filter: drop-shadow(0 4px 8px rgba(18,166,122,0.25));
}

/* ── SHELF UNITS ── */
.shelf-unit {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 5px;
  pointer-events: none;
}
.shelf-row {
  display: flex;
  gap: 3px;
  padding: 3px 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 3px;
}
.s-box {
  width: 22px;
  height: 26px;
  border-radius: 2px;
  border: 1px solid;
}

/* Crates */
.crate-obj {
  position: absolute;
  width: 28px;
  height: 28px;
  background: #1A1428;
  border: 1px solid rgba(255,150,10,0.25);
  border-radius: 4px;
  pointer-events: none;
}
.crate-obj::after {
  content: '';
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 1px;
  background: rgba(255,150,10,0.15);
}
.small-crate { width: 20px; height: 20px; }

/* ── BOOKSHELF ── */
.book-shelf {
  position: absolute;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  padding: 4px;
  background: #14142A;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  pointer-events: none;
}
.book {
  width: 10px;
  border-radius: 1px 1px 0 0;
  border: 1px solid;
  min-height: 24px;
}

/* Desk lamp */
.desk-lamp-obj {
  position: absolute;
  pointer-events: none;
}
.lamp-arm {
  width: 2px;
  height: 20px;
  background: rgba(232,150,10,0.5);
  border-radius: 1px;
  transform: rotate(-15deg);
  transform-origin: bottom;
  margin-left: 6px;
}
.lamp-shade {
  width: 14px;
  height: 8px;
  background: rgba(232,150,10,0.3);
  border: 1px solid rgba(232,150,10,0.5);
  border-radius: 0 0 7px 7px;
  margin-top: -4px;
}
.lamp-glow-spot {
  width: 40px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(232,150,10,0.25) 0%, transparent 70%);
  margin-top: 2px;
  margin-left: -13px;
  pointer-events: none;
}

/* ── PRESENTATION SCREEN ── */
.pres-screen {
  position: absolute;
  width: 72px;
  height: 52px;
  background: #050510;
  border: 2px solid rgba(34,118,210,0.3);
  border-radius: 4px;
  overflow: hidden;
  pointer-events: none;
}
.ps-content {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  justify-content: center;
}
.ps-line {
  height: 3px;
  border-radius: 1.5px;
  transition: width 0.5s ease, background 0.5s ease;
  animation: psAnim 2s ease-in-out infinite;
}
@keyframes psAnim {
  0%,100% { opacity: 0.5; }
  50%     { opacity: 1; }
}

/* Trophy stand */
.trophy-stand {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}
.trophy-emoji {
  font-size: 22px;
  filter: grayscale(0.7);
  transition: all 0.5s ease;
}
.trophy-lit {
  filter: grayscale(0) drop-shadow(0 0 10px rgba(232,150,10,0.7));
  animation: trophyGlow 2s ease-in-out infinite;
}
@keyframes trophyGlow {
  0%,100% { filter: grayscale(0) drop-shadow(0 0 8px rgba(232,150,10,0.6)); }
  50%     { filter: grayscale(0) drop-shadow(0 0 18px rgba(232,150,10,0.9)); }
}
.trophy-plinth {
  width: 28px;
  height: 8px;
  background: rgba(232,150,10,0.25);
  border: 1px solid rgba(232,150,10,0.4);
  border-radius: 2px;
}

/* Object label */
.obj-label {
  position: absolute;
  font-size: 7px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(255,255,255,0.2);
  letter-spacing: 0.06em;
  pointer-events: none;
  white-space: nowrap;
}
.caution-label {
  color: rgba(232,150,10,0.45);
}
.chair-row { position: absolute; }
</style>
