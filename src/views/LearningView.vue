<template>
  <div class="learn-bg min-h-screen">
    <div class="scanline-layer" aria-hidden="true"></div>

    <div class="learn-container">

      <!-- Back to game -->
      <button class="back-to-game" @click="router.push('/game')">
        ← Back to Map
      </button>

      <!-- Header -->
      <div class="learn-header animate-fade-up">
        <div class="header-badge">
          <span class="badge-dot"></span>
          STRIDE Reference Desk
        </div>
        <h1 class="learn-title">
          Know Your <span style="color: #7B41E0;">Threats</span>
        </h1>
        <p class="learn-desc">
          Study all 6 STRIDE categories and pass each quiz to complete the desk.
          Use this knowledge to investigate terminals more accurately.
        </p>
      </div>

      <!-- Overall Progress bar -->
      <div class="progress-card animate-fade-up" style="animation-delay:0.1s;">
        <div class="progress-top">
          <span class="progress-label">Learning Progress</span>
          <span class="progress-count">{{ store.completedModules.length }}/6 Modules</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="`width: ${store.phase2Progress}%`"></div>
        </div>
        <div class="letter-track">
          <div v-for="letter in strideOrder" :key="letter"
            class="letter-seg"
            :style="store.completedModules.includes(letter)
              ? `background: ${catColor(letter)};`
              : 'background: rgba(255,255,255,0.06);'">
          </div>
        </div>
      </div>

      <!-- Module cards grid -->
      <div class="modules-grid animate-fade-up" style="animation-delay:0.15s;">
        <button
          v-for="(letter, idx) in strideOrder"
          :key="letter"
          class="module-card"
          :class="{
            'mod-completed': store.completedModules.includes(letter),
            'mod-locked':    isLocked(letter, idx) && !store.completedModules.includes(letter),
            'mod-available': !isLocked(letter, idx) && !store.completedModules.includes(letter),
          }"
          :style="`--cat-color: ${catColor(letter)};`"
          :disabled="isLocked(letter, idx)"
          @click="!isLocked(letter, idx) && router.push(`/learn/${letter}`)"
        >
          <!-- Letter -->
          <div class="mod-letter" :style="`color: ${catColor(letter)};`">{{ letter }}</div>

          <!-- Name & tagline -->
          <div class="mod-name">{{ catName(letter) }}</div>
          <div class="mod-tagline">{{ catTagline(letter) }}</div>

          <!-- Status -->
          <div class="mod-status">
            <template v-if="store.completedModules.includes(letter)">
              <div class="status-chip completed-chip">
                ✓ Done · {{ store.quizScores[letter] ?? 0 }}/3
              </div>
            </template>
            <template v-else-if="isLocked(letter, idx)">
              <div class="status-chip locked-chip">🔒 Locked</div>
            </template>
            <template v-else>
              <div class="status-chip open-chip" :style="`border-color: ${catColor(letter)}55; color: ${catColor(letter)};`">
                Study →
              </div>
            </template>
          </div>

          <!-- Glow bg on hover -->
          <div class="mod-glow" aria-hidden="true"></div>
        </button>
      </div>

      <!-- All done banner -->
      <Transition name="done-reveal">
        <div v-if="store.phase2Completed" class="done-banner animate-fade-up">
          <div class="done-icon">🎓</div>
          <div>
            <div class="done-title">STRIDE Reference Complete!</div>
            <div class="done-sub">All 6 modules passed. Head back to the map and investigate terminals with confidence.</div>
          </div>
          <button class="btn-game-accent py-2.5 px-6 text-sm"
            style="background:rgba(18,166,122,0.15); border-color:rgba(18,166,122,0.4); color:#4ECDA4; flex-shrink:0;"
            @click="router.push('/game')">
            Back to Map →
          </button>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { strideData } from '@/data'

const router = useRouter()
const store  = useGameStore()
store.load()

if (!store.gameStarted) router.replace('/')

const strideOrder = ['S', 'T', 'R', 'I', 'D', 'E']

function isLocked(letter: string, idx: number): boolean {
  if (idx === 0) return false
  const prev = strideOrder[idx - 1]
  return !store.completedModules.includes(prev)
}

const colorMap: Record<string, string> = {
  S: '#E8453C', T: '#E8960A', R: '#12A67A',
  I: '#2276D2', D: '#52A882', E: '#7B41E0',
}
function catColor(l: string) { return colorMap[l] ?? '#888' }
function catName(l: string)  { return strideData[l as keyof typeof strideData]?.name ?? l }
function catTagline(l: string) { return strideData[l as keyof typeof strideData]?.tagline ?? '' }
</script>

<style scoped>
.learn-bg {
  background: var(--game-bg);
  background-image:
    radial-gradient(ellipse 55% 50% at 15% 30%, rgba(114,65,224,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 85% 70%, rgba(34,118,210,0.05) 0%, transparent 60%);
  color: var(--game-text);
}

.scanline-layer {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px
  );
  pointer-events: none;
  z-index: 1;
}

.learn-container {
  max-width: 840px;
  margin: 0 auto;
  padding: 28px 20px 60px;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.back-to-game {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 700;
  color: rgba(232,232,255,0.4);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  padding: 4px 0;
}
.back-to-game:hover { color: rgba(232,232,255,0.8); }

.learn-header { display: flex; flex-direction: column; gap: 8px; }
.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #7B41E0;
}
.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #7B41E0;
  box-shadow: 0 0 6px #7B41E0;
}
.learn-title {
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 900;
  line-height: 1.1;
  color: var(--game-text);
}
.learn-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--game-text-dim);
  max-width: 520px;
}

/* Progress card */
.progress-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.progress-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-label { font-size: 12px; font-weight: 700; color: var(--game-text-dim); }
.progress-count { font-size: 12px; font-weight: 800; color: #7B41E0; font-family: 'JetBrains Mono', monospace; }
.progress-bar-bg {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7B41E0, #2276D2);
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}
.letter-track {
  display: flex;
  gap: 4px;
}
.letter-seg {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  transition: background 0.4s ease;
}

/* Module grid */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.module-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.08);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  overflow: hidden;
}
.module-card:hover:not(:disabled) {
  border-color: var(--cat-color, rgba(255,255,255,0.2));
  background: rgba(255,255,255,0.07);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.module-card:disabled { cursor: not-allowed; opacity: 0.5; }

.mod-completed { border-color: rgba(18,166,122,0.3) !important; }
.mod-locked    { filter: grayscale(0.6); }

.mod-letter {
  font-size: 36px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
  margin-bottom: 2px;
}
.mod-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--game-text);
  line-height: 1.2;
}
.mod-tagline {
  font-size: 10px;
  color: var(--game-text-muted);
  line-height: 1.4;
  margin-bottom: 8px;
}
.mod-status { margin-top: auto; }
.status-chip {
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.completed-chip {
  background: rgba(18,166,122,0.12);
  border-color: rgba(18,166,122,0.3);
  color: #4ECDA4;
}
.locked-chip {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
  color: rgba(232,232,255,0.25);
}
.open-chip { background: rgba(255,255,255,0.05); }

.mod-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 20% 80%, var(--cat-color, transparent) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.module-card:hover:not(:disabled) .mod-glow { opacity: 0.08; }

/* Done banner */
.done-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: rgba(18,166,122,0.06);
  border: 1px solid rgba(18,166,122,0.2);
  border-radius: 14px;
}
.done-icon { font-size: 28px; flex-shrink: 0; }
.done-title { font-size: 14px; font-weight: 800; color: #4ECDA4; margin-bottom: 2px; }
.done-sub { font-size: 12px; color: var(--game-text-dim); line-height: 1.5; }

.done-reveal-enter-active { animation: fadeUp 0.5s both; }
.done-reveal-leave-active { transition: opacity 0.2s; }
.done-reveal-leave-to { opacity: 0; }
</style>
