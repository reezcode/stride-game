<template>
  <div class="title-screen">
    <canvas ref="bgEl" class="bg" aria-hidden="true"></canvas>
    <div class="bg-shade" aria-hidden="true"></div>

    <main class="layout">
      <section class="intro anim-rise">
        <div class="t-label kicker">Eleven days later · 01:31</div>
        <h1 class="t-display wordmark">STRIDE</h1>
        <div class="t-display subtitle">Six things they did to her</div>
        <p class="pitch">
          Your sister is gone, and nobody can tell you why. Her last message says she wrote everything down,
          somewhere that is not home.
        </p>
        <p class="pitch pitch-2">
          Follow the trail across the city, from her old room to her boarding house to the place where it started.
          Gather what she left, break the guards that stand in the way, and name the person who did it.
        </p>
      </section>

      <section class="card paper anim-rise" style="animation-delay: .08s">
        <template v-if="hasSave && !startingOver">
          <div class="t-label card-k">Night in progress</div>
          <div class="resume">
            <DetectiveAvatar :color="store.playerColor" :size="64" />
            <div>
              <div class="resume-name">{{ store.playerName }}</div>
              <div class="resume-meta">
                Level {{ store.level }} · {{ store.solvedCount }}/5 cases sealed ·
                {{ store.evidenceCount }}/{{ store.evidenceTotal }} clues
              </div>
            </div>
          </div>
          <button class="btn btn-ink wide" @click="resume">
            Continue <IconArrowRight :size="18" />
          </button>
          <button class="btn btn-outline wide" @click="startingOver = true">Start over</button>
        </template>

        <template v-else>
          <div class="t-label card-k">A story in three places</div>
          <label class="lbl" for="codename">Your name</label>
          <input id="codename" ref="nameEl" v-model="name" class="field big-field" maxlength="24"
            placeholder="e.g. Arya" autocomplete="off" @keydown.enter="begin" />

          <div class="lbl">Suit colour</div>
          <div class="suits" role="radiogroup" aria-label="Suit colour">
            <button v-for="c in PLAYER_COLORS" :key="c.id" type="button" role="radio"
              :aria-checked="color === c.hex" :class="['suit', { on: color === c.hex }]"
              @click="color = c.hex">
              <DetectiveAvatar :color="c.hex" :size="40" />
              <span>{{ c.label }}</span>
            </button>
          </div>

          <p v-if="hasSave" class="warn">Starting over erases {{ store.playerName }}'s progress.</p>
          <button class="btn btn-ink wide" :disabled="!name.trim()" @click="begin">
            Begin the story <IconArrowRight :size="18" />
          </button>
          <button v-if="hasSave" class="btn btn-outline wide" @click="startingOver = false">Cancel</button>
        </template>
      </section>

      <aside class="feed anim-rise" style="animation-delay: .16s" aria-label="Incident feed">
        <div class="t-label feed-k"><span class="rec"></span> PayVault on-call · alerts you have not opened yet</div>
        <ol>
          <li v-for="a in alerts" :key="a.code">
            <span class="t-mono a-time">{{ a.time }}</span>
            <div>
              <div class="a-room">{{ a.room }} <span class="t-mono a-code">{{ a.code }}</span></div>
              <div class="a-msg">{{ a.msg }}</div>
            </div>
          </li>
        </ol>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowRight } from '@tabler/icons-vue'
import { useGameStore, PLAYER_COLORS } from '@/stores/game'
import { paintStatic } from '@/game/paintStatic'
import { WORLD_W, WORLD_H } from '@/game/world'
import { unlockAudio, sfx } from '@/game/audio'
import DetectiveAvatar from '@/components/DetectiveAvatar.vue'

const router = useRouter()
const store  = useGameStore()

const hasSave = ref(store.gameStarted)
const startingOver = ref(false)
const name  = ref('')
const color = ref(PLAYER_COLORS[1].hex)
const nameEl = ref<HTMLInputElement | null>(null)

const alerts = [
  { time: '02:09:41', code: 'SC-001', room: 'Data Center',     msg: 'One token reading transactions that belong to other users' },
  { time: '02:10:12', code: 'SC-002', room: 'Identity Lab',    msg: '31,408 OTP verification attempts in four minutes' },
  { time: '02:11:03', code: 'SC-003', room: 'Treasury',        msg: 'Transfer of −500,000 IDR accepted, sender balance went up' },
  { time: '02:12:30', code: 'SC-004', room: 'Ops Control',     msg: 'Admin API answered a request carrying a user token' },
  { time: '02:13:55', code: 'SC-005', room: 'Records Archive', msg: 'Sequential receipt PDFs downloaded with no session' },
]

function begin() {
  if (!name.value.trim()) return
  unlockAudio()
  sfx.blip()
  store.startGame(name.value.trim(), color.value)
  router.push('/prologue')
}

function resume() {
  unlockAudio()
  router.push('/game')
}

// ── Background: the real floor plan, slowly drifting ──
const bgEl = ref<HTMLCanvasElement | null>(null)
let raf = 0
let plan: HTMLCanvasElement | null = null

function drawBg(now: number) {
  const c = bgEl.value
  if (!c || !plan) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const W = c.clientWidth, H = c.clientHeight
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
  }
  const g = c.getContext('2d')!
  const scale = Math.max(W / (WORLD_W * 0.62), H / (WORLD_H * 0.62))
  const t = now / 1000
  const ox = (Math.sin(t * 0.03) * 0.5 + 0.5) * (WORLD_W * scale - W)
  const oy = (Math.cos(t * 0.021) * 0.5 + 0.5) * (WORLD_H * scale - H)
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.fillStyle = '#06080B'
  g.fillRect(0, 0, W, H)
  g.drawImage(plan, -ox, -oy, WORLD_W * scale, WORLD_H * scale)
  raf = requestAnimationFrame(drawBg)
}

onMounted(async () => {
  plan = paintStatic(1)
  raf = requestAnimationFrame(drawBg)
  await nextTick()
  nameEl.value?.focus()
})
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<style scoped>
.title-screen {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--color-ink-950);
}
.bg { position: fixed; inset: 0; width: 100%; height: 100%; filter: saturate(0.6); }
.bg-shade {
  position: fixed;
  inset: 0;
  background:
    linear-gradient(90deg, #0B0E13F5 0%, #0B0E13D0 38%, #0B0E1399 70%, #0B0E13C0 100%),
    radial-gradient(ellipse at 70% 40%, transparent 0%, #0B0E1380 70%);
}

.layout {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 32px;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 400px);
  grid-template-areas: "intro card" "feed card";
  gap: 40px 56px;
  align-content: center;
}
.intro { grid-area: intro; align-self: end; }
.card  { grid-area: card; align-self: center; }
.feed  { grid-area: feed; align-self: start; }

.kicker { color: #F0C674; }
.wordmark {
  font-size: clamp(84px, 13vw, 168px);
  margin: 14px 0 0;
  letter-spacing: -0.03em;
  line-height: 0.82;
}
.subtitle { font-size: clamp(28px, 4vw, 44px); color: var(--color-fog-dim); margin-top: 10px; font-weight: 600; }
.pitch { max-width: 520px; font-size: 17px; line-height: 1.6; color: var(--color-fog); margin: 22px 0 0; }

.pitch-2 { margin-top: 12px; color: var(--color-fog-dim); font-size: 15px; }

.card {
  padding: 26px 26px 24px;
  border-radius: 3px;
  box-shadow: 0 30px 80px #000C;
  display: grid;
  gap: 10px;
}
.card-k { color: var(--color-pen-3); margin-bottom: 6px; }
.lbl { font-size: 13px; font-weight: 600; color: var(--color-pen-2); margin-top: 6px; }
.big-field { height: 46px; font-size: 16px; }
.suits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.suit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px 6px;
  border: 1px solid var(--color-paper-line);
  border-radius: 3px;
  background: #F6F2E8;
  font-size: 12px;
  color: var(--color-pen-2);
  cursor: pointer;
}
.suit:hover { border-color: var(--color-pen-3); }
.suit.on { border-color: var(--color-pen); box-shadow: inset 0 0 0 1px var(--color-pen); background: #FBF8F1; color: var(--color-pen); font-weight: 600; }
.wide { width: 100%; height: 46px; font-size: 15px; margin-top: 6px; }
.warn { margin: 6px 0 0; font-size: 13px; color: #B8321F; }

.resume { display: flex; align-items: center; gap: 14px; padding: 4px 0 10px; }
.resume-name { font-family: var(--font-cond); font-weight: 700; font-size: 28px; line-height: 1.05; }
.resume-meta { font-size: 13px; color: var(--color-pen-3); margin-top: 4px; }

.feed {
  max-width: 560px;
  border-top: 1px solid var(--color-ink-600);
  padding-top: 14px;
}
.feed-k { display: flex; align-items: center; gap: 8px; color: var(--color-fog-mute); }
.rec { width: 8px; height: 8px; border-radius: 50%; background: var(--color-alarm); animation: blink 1.6s steps(1) infinite; }
@keyframes blink { 50% { opacity: .2; } }
.feed ol { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 10px; }
.feed li { display: grid; grid-template-columns: 70px 1fr; gap: 12px; font-size: 14px; }
.a-time { color: var(--color-fog-mute); font-size: 12px; padding-top: 2px; }
.a-room { font-weight: 600; }
.a-code { color: var(--color-fog-mute); font-size: 11px; font-weight: 400; margin-left: 6px; }
.a-msg { color: var(--color-fog-dim); }

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas: "intro" "card" "feed";
    padding: 32px 16px 40px;
    gap: 28px;
  }
  .intro { align-self: start; }
  .bg-shade { background: #0B0E13D0; }
}
</style>
