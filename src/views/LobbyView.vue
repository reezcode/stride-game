<template>
  <div class="title-screen">
    <canvas ref="bgEl" class="bg" aria-hidden="true"></canvas>
    <div class="bg-shade" aria-hidden="true"></div>

    <main class="layout">
      <section class="intro anim-rise">
        <button class="lang" @click="setLocale(LOCALE === 'en' ? 'id' : 'en')"><IconLanguage :size="16" /> {{ $t('lang.switchTo') }}</button>
        <div class="t-label kicker">{{ $t('lobby.kicker') }}</div>
        <h1 class="t-display wordmark">STRIDE</h1>
        <div class="t-display subtitle">{{ $t('lobby.subtitle') }}</div>
        <p class="pitch">
          {{ $t('lobby.pitch1') }}
        </p>
        <p class="pitch pitch-2">
          {{ $t('lobby.pitch2') }}
        </p>
      </section>

      <section class="card paper anim-rise" style="animation-delay: .08s">
        <div class="slots" role="tablist" :aria-label="$t('lobby.slots')">
          <button v-for="s in slots" :key="s.slot" type="button" role="tab" :aria-selected="s.slot === store.slot"
            :class="['slot', { on: s.slot === store.slot }]" @click="pickSlot(s.slot)">
            <span class="t-label">{{ $t('lobby.slot', { n: s.slot }) }}</span>
            <span class="slot-name">{{ s.empty ? $t('lobby.empty') : s.name }}</span>
            <span class="slot-meta">{{ s.empty ? '—' : s.finished ? $t('lobby.finished') : $t('lobby.slotMeta', { level: s.level, ch: s.chapter }) }}</span>
          </button>
        </div>

        <template v-if="hasSave && !startingOver">
          <div class="t-label card-k">{{ $t('lobby.inProgress') }}</div>
          <div class="resume">
            <DetectiveAvatar :color="store.playerColor" :size="64" />
            <div>
              <div class="resume-name">{{ store.playerName }}</div>
              <div class="resume-meta">
                {{ $t('lobby.resumeMeta', { level: store.level, solved: store.solvedCount, clues: store.evidenceCount, total: store.evidenceTotal }) }}
              </div>
            </div>
          </div>
          <button class="btn btn-ink wide" @click="resume">
            {{ $t('lobby.continue') }} <IconArrowRight :size="18" />
          </button>
          <button class="btn btn-outline wide" @click="startingOver = true">{{ $t('lobby.startOver') }}</button>
        </template>

        <template v-else>
          <div class="t-label card-k">{{ $t('lobby.cardKicker') }}</div>
          <label class="lbl" for="codename">{{ $t('lobby.yourName') }}</label>
          <input id="codename" ref="nameEl" v-model="name" class="field big-field" maxlength="24"
            :placeholder="$t('lobby.namePlaceholder')" autocomplete="off" @keydown.enter="begin" />

          <div class="lbl">{{ $t('lobby.suit') }}</div>
          <div class="suits" role="radiogroup" :aria-label="$t('lobby.suit')">
            <button v-for="c in PLAYER_COLORS" :key="c.id" type="button" role="radio"
              :aria-checked="color === c.hex" :class="['suit', { on: color === c.hex }]"
              @click="color = c.hex">
              <DetectiveAvatar :color="c.hex" :size="40" />
              <span>{{ c.label }}</span>
            </button>
          </div>

          <template v-if="reached > 1">
            <div class="lbl">{{ $t('lobby.startFrom') }}</div>
            <div class="chapters" role="radiogroup" :aria-label="$t('lobby.startFrom')">
              <button v-for="(p, i) in places" :key="p.id" type="button" role="radio" :aria-checked="chapter === i + 1"
                :class="['chapter', { on: chapter === i + 1 }]" :disabled="i + 1 > reached"
                :title="i + 1 > reached ? $t('lobby.chLocked') : undefined" @click="chapter = i + 1">
                <b class="t-mono">{{ i + 1 }}</b> {{ p.name }}
              </button>
            </div>
          </template>

          <p v-if="hasSave" class="warn">{{ $t('lobby.eraseWarn', { name: store.playerName }) }}</p>
          <button class="btn btn-ink wide" :disabled="!name.trim()" @click="begin">
            {{ $t('lobby.begin') }} <IconArrowRight :size="18" />
          </button>
          <button v-if="hasSave" class="btn btn-outline wide" @click="startingOver = false">{{ $t('lobby.cancel') }}</button>
        </template>
      </section>

      <aside class="feed anim-rise" style="animation-delay: .16s" aria-label="Incident feed">
        <div class="t-label feed-k"><span class="rec"></span> {{ $t('lobby.feed') }}</div>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowRight, IconLanguage } from '@tabler/icons-vue'
import { t, setLocale, LOCALE } from '@/i18n'
import { roomById } from '@/game/world'
import { useGameStore, PLAYER_COLORS, chaptersReached } from '@/stores/game'
import { places } from '@/data/story'
import { paintStatic } from '@/game/paintStatic'
import { WORLD_W, WORLD_H } from '@/game/world'
import { unlockAudio, sfx } from '@/game/audio'
import DetectiveAvatar from '@/components/DetectiveAvatar.vue'

const router = useRouter()
const store  = useGameStore()

const hasSave = computed(() => store.gameStarted)
const startingOver = ref(false)
const slots = ref(store.slotSummaries())
const reached = chaptersReached()
const chapter = ref(1)

function pickSlot(n: number) {
  store.selectSlot(n)
  startingOver.value = false
  slots.value = store.slotSummaries()
  sfx.blip()
}
const name  = ref('')
const color = ref(PLAYER_COLORS[1].hex)
const nameEl = ref<HTMLInputElement | null>(null)

const alerts = [
  { time: '01:19:41', code: 'SC-001', room: roomById.datacenter.name, msg: t('lobby.a1') },
  { time: '01:20:12', code: 'SC-002', room: roomById.identity.name,   msg: t('lobby.a2') },
  { time: '01:21:03', code: 'SC-003', room: roomById.treasury.name,   msg: t('lobby.a3') },
  { time: '01:22:30', code: 'SC-004', room: roomById.ops.name,        msg: t('lobby.a4') },
  { time: '01:23:55', code: 'SC-005', room: roomById.archive.name,    msg: t('lobby.a5') },
]

function begin() {
  if (!name.value.trim()) return
  unlockAudio()
  sfx.blip()
  store.startGame(name.value.trim(), color.value, chapter.value)
  // later chapters skip the prologue; the map plays that chapter's arrival
  router.push(chapter.value === 1 ? '/prologue' : '/game')
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
.lang {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 10px; margin-bottom: 14px;
  border: 1px solid var(--color-ink-600); border-radius: 3px;
  background: #0B0E13CC; color: var(--color-fog-dim);
  font-size: 13px; cursor: pointer;
}
.lang:hover { color: var(--color-fog); background: var(--color-ink-800); }
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
.slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; padding-bottom: 14px; border-bottom: 1px dashed var(--color-paper-line); }
.slot {
  display: grid; gap: 1px; padding: 8px 10px; min-width: 0;
  text-align: left;
  border: 1px solid var(--color-paper-line); border-radius: 3px;
  background: #F6F2E8; color: var(--color-pen-3); cursor: pointer;
}
.slot:hover { border-color: var(--color-pen-3); }
.slot.on { border-color: var(--color-pen); box-shadow: inset 0 0 0 1px var(--color-pen); background: #FBF8F1; color: var(--color-pen); }
.slot-name { font-weight: 700; font-size: 14px; color: var(--color-pen); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-meta { font-size: 11.5px; }
.chapters { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.chapter {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border: 1px solid var(--color-paper-line); border-radius: 3px;
  background: #F6F2E8; font-size: 13px; text-align: left; cursor: pointer; color: var(--color-pen-2);
}
.chapter.on { border-color: var(--color-pen); box-shadow: inset 0 0 0 1px var(--color-pen); background: #FBF8F1; color: var(--color-pen); font-weight: 600; }
.chapter:disabled { opacity: .4; cursor: not-allowed; }
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
