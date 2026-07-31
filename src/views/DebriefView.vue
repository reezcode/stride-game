<template>
  <div class="debrief-bg min-h-screen">
    <div class="scanline-layer" aria-hidden="true"></div>

    <!-- Header -->
    <div class="debrief-header">
      <button class="back-btn" @click="router.push('/game')">← Back to Map</button>
      <div class="header-title">Mission Debrief</div>
      <button class="reset-btn" @click="confirmReset = true">↺ New Game</button>
    </div>

    <div class="debrief-content">

      <!-- ─── Hero Score ─── -->
      <div class="score-hero animate-fade-up">
        <!-- Player character display -->
        <div class="hero-char-wrap">
          <div class="hero-char" :style="`background: ${store.playerColor};`">
            <div class="hero-visor"></div>
          </div>
          <div class="hero-glow" :style="`background: ${store.playerColor};`"></div>
        </div>

        <div class="hero-info">
          <div class="hero-name">{{ store.playerName }}</div>
          <div class="grade-badge" :style="`color: ${store.letterGrade.color}; border-color: ${store.letterGrade.color}44; background: ${store.letterGrade.color}15;`">
            {{ store.letterGrade.grade }} — {{ store.letterGrade.label }}
          </div>
          <div class="hero-stats">
            <div class="stat">
              <div class="stat-val" style="color: #E8960A;">{{ store.totalXP.toLocaleString() }}</div>
              <div class="stat-lbl">Total XP</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-val" style="color: #12A67A;">{{ store.overallAccuracy }}%</div>
              <div class="stat-lbl">Accuracy</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-val" style="color: #2276D2;">{{ store.solvedCount }}/5</div>
              <div class="stat-lbl">Cases Solved</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── STRIDE Coverage Radar ─── -->
      <div class="section animate-fade-up" style="animation-delay: 0.1s;">
        <div class="section-title">STRIDE Coverage</div>
        <div class="stride-coverage">
          <div v-for="cov in store.strideCoverage" :key="cov.letter" class="cov-row">
            <div class="cov-letter" :style="`color: ${catColor(cov.letter)};`">{{ cov.letter }}</div>
            <div class="cov-name">{{ catName(cov.letter) }}</div>
            <div class="cov-bar-wrap">
              <div class="cov-bar-bg">
                <div class="cov-bar-fill"
                  :style="`width: ${cov.pct}%; background: ${catColor(cov.letter)};`">
                </div>
              </div>
            </div>
            <div class="cov-pct" :style="`color: ${catColor(cov.letter)};`">
              {{ cov.hit }}/{{ cov.total }}
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Case-by-Case Breakdown ─── -->
      <div class="section animate-fade-up" style="animation-delay: 0.2s;">
        <div class="section-title">Case Breakdown</div>
        <div class="cases-list">
          <div v-for="(c, i) in store.cases" :key="c.scenarioId" class="case-card">
            <!-- Case header -->
            <div class="case-header">
              <div class="case-num-badge" :style="c.solved ? 'background:#12A67A22; border-color:#12A67A55; color:#12A67A;' : 'background:#E8453C22; border-color:#E8453C55; color:#E8453C;'">
                {{ i + 1 }}
              </div>
              <div class="case-title-area">
                <div class="case-title">{{ scenarioTitle(c.scenarioId) }}</div>
                <div class="case-id">{{ c.scenarioId }}</div>
              </div>
              <div class="case-score-badge" :style="`color: ${scoreColor(c.score)};`">
                {{ c.score }}%
              </div>
              <div class="case-xp">+{{ c.xpEarned }} XP</div>
            </div>

            <!-- Results grid -->
            <div v-if="c.solved" class="case-body">
              <!-- Correct hits -->
              <div v-if="c.correct.length" class="result-group">
                <div class="result-label correct-label">✓ Correctly Identified</div>
                <div class="tag-row">
                  <span v-for="cat in c.correct" :key="cat"
                    class="cat-tag"
                    :style="`background: ${catColor(cat)}18; border-color: ${catColor(cat)}55; color: ${catColor(cat)};`">
                    {{ cat }} — {{ catName(cat) }}
                  </span>
                </div>
              </div>

              <!-- Missed -->
              <div v-if="c.missed.length" class="result-group">
                <div class="result-label missed-label">✗ Missed Threats</div>
                <div class="tag-row">
                  <span v-for="cat in c.missed" :key="cat"
                    class="cat-tag missed-tag"
                    :style="`background: rgba(232,69,60,0.08); border-color: rgba(232,69,60,0.25); color: rgba(232,69,60,0.7);`">
                    {{ cat }} — {{ catName(cat) }}
                  </span>
                </div>
                <!-- Show ground truth explanations for missed -->
                <div v-for="gt in getGroundTruth(c.scenarioId, c.missed)" :key="gt.category" class="truth-card">
                  <div class="truth-header">
                    <span class="truth-cat" :style="`color: ${catColor(gt.category)};`">{{ gt.category }}</span>
                    <span class="truth-title">{{ gt.title }}</span>
                    <span class="truth-sev" :style="`color: ${sevColor(gt.severity)};`">{{ gt.severity }}</span>
                  </div>
                  <p class="truth-explain">{{ gt.explanation }}</p>
                </div>
              </div>

              <!-- False positives -->
              <div v-if="c.falsePositives.length" class="result-group">
                <div class="result-label fp-label">⚠ False Positives</div>
                <div class="tag-row">
                  <span v-for="cat in c.falsePositives" :key="cat"
                    class="cat-tag"
                    style="background: rgba(232,150,10,0.08); border-color: rgba(232,150,10,0.25); color: rgba(232,150,10,0.7);">
                    {{ cat }} — {{ catName(cat) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="case-unsolved">
              Case not investigated
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Play Again ─── -->
      <div class="action-row animate-fade-up" style="animation-delay: 0.3s;">
        <button class="btn-game py-3 px-8" @click="router.push('/game')">
          ← Back to Map
        </button>
        <button
          class="btn-game-accent py-3 px-8"
          style="background: rgba(18,166,122,0.15); border-color: rgba(18,166,122,0.4); color: #4ECDA4;"
          @click="confirmReset = true">
          ↺ Play Again
        </button>
      </div>
    </div>

    <!-- Reset confirm modal -->
    <Transition name="fade">
      <div v-if="confirmReset" class="modal-backdrop" @click.self="confirmReset = false">
        <div class="modal-box animate-bounce-in">
          <div class="modal-icon">⚠️</div>
          <h3 class="modal-title">Start New Game?</h3>
          <p class="modal-body">This will erase all progress and XP. Are you sure?</p>
          <div class="modal-actions">
            <button class="btn-game py-2.5 px-6 text-sm" @click="confirmReset = false">Cancel</button>
            <button class="btn-game-accent py-2.5 px-6 text-sm"
              style="background: rgba(232,69,60,0.2); border-color: rgba(232,69,60,0.5); color: #ff6b6b;"
              @click="resetAndRestart">
              Yes, Reset
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { scenarios } from '@/data'

const router = useRouter()
const store  = useGameStore()
store.load()

if (!store.gameStarted) router.replace('/')

const confirmReset = ref(false)

const catColors: Record<string, string> = {
  S: '#E8453C', T: '#E8960A', R: '#12A67A',
  I: '#2276D2', D: '#52A882', E: '#7B41E0',
}
const catNames: Record<string, string> = {
  S: 'Spoofing', T: 'Tampering', R: 'Repudiation',
  I: 'Info Disclosure', D: 'Denial of Svc', E: 'Elevation',
}
function catColor(l: string) { return catColors[l] ?? '#888' }
function catName(l: string)  { return catNames[l]  ?? l }

function scenarioTitle(id: string) {
  return scenarios.find(s => s.id === id)?.title ?? id
}

function getGroundTruth(scenarioId: string, cats: string[]) {
  const s = scenarios.find(s => s.id === scenarioId)
  return s?.groundTruth.filter(gt => cats.includes(gt.category)) ?? []
}

function scoreColor(score: number) {
  if (score >= 80) return '#12A67A'
  if (score >= 50) return '#E8960A'
  return '#E8453C'
}

function sevColor(sev: string) {
  const m: Record<string, string> = {
    Critical: '#E8453C', High: '#E8960A', Medium: '#2276D2', Low: '#12A67A',
  }
  return m[sev] ?? '#888'
}

function resetAndRestart() {
  store.resetGame()
  router.replace('/')
}
</script>

<style scoped>
.debrief-bg {
  background: var(--game-bg);
  background-image:
    radial-gradient(ellipse 50% 50% at 80% 20%, rgba(18,166,122,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 20% 80%, rgba(114,65,224,0.06) 0%, transparent 60%);
  min-height: 100vh;
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

.debrief-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: rgba(8,8,18,0.88);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  z-index: 10;
}
.header-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(232,232,255,0.7);
}
.back-btn, .reset-btn {
  font-size: 12px;
  font-weight: 700;
  color: rgba(232,232,255,0.4);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  padding: 4px 8px;
}
.back-btn:hover, .reset-btn:hover { color: rgba(232,232,255,0.85); }

.debrief-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: relative;
  z-index: 2;
}

/* Hero Score */
.score-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
}
.hero-char-wrap {
  position: relative;
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-char {
  width: 52px;
  height: 62px;
  border-radius: 50% 50% 38% 38%;
  position: relative;
  z-index: 1;
}
.hero-visor {
  position: absolute;
  top: 9px; left: 8px; right: 8px;
  height: 16px;
  background: rgba(200,230,255,0.9);
  border-radius: 50% 50% 28% 28%;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.15);
}
.hero-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  opacity: 0.15;
  filter: blur(16px);
}

.hero-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.hero-name {
  font-size: 22px;
  font-weight: 900;
  color: var(--game-text);
  line-height: 1;
}
.grade-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.hero-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat-val { font-size: 20px; font-weight: 900; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.stat-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(232,232,255,0.3); }
.stat-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.08); }

/* Sections */
.section { display: flex; flex-direction: column; gap: 14px; }
.section-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(232,232,255,0.3);
}

/* STRIDE Coverage */
.stride-coverage { display: flex; flex-direction: column; gap: 8px; }
.cov-row {
  display: grid;
  grid-template-columns: 20px 130px 1fr 36px;
  align-items: center;
  gap: 10px;
}
.cov-letter { font-size: 13px; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
.cov-name { font-size: 11px; font-weight: 600; color: rgba(232,232,255,0.5); }
.cov-bar-wrap { flex: 1; }
.cov-bar-bg {
  height: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
}
.cov-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.4,0,0.2,1);
}
.cov-pct { font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-align: right; }

/* Cases */
.cases-list { display: flex; flex-direction: column; gap: 12px; }
.case-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.case-card:hover { border-color: rgba(255,255,255,0.14); }

.case-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.case-num-badge {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}
.case-title-area { flex: 1; min-width: 0; }
.case-title { font-size: 13px; font-weight: 700; color: var(--game-text); }
.case-id { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: rgba(232,232,255,0.3); }
.case-score-badge { font-size: 16px; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
.case-xp {
  font-size: 11px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: rgba(232,150,10,0.7);
}

.case-body {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.case-unsolved {
  font-size: 11px;
  color: rgba(232,232,255,0.2);
  padding: 10px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-style: italic;
}

.result-group { display: flex; flex-direction: column; gap: 6px; }
.result-label { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.correct-label { color: rgba(18,166,122,0.7); }
.missed-label  { color: rgba(232,69,60,0.7); }
.fp-label      { color: rgba(232,150,10,0.7); }

.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid;
  font-family: 'JetBrains Mono', monospace;
}
.missed-tag {}

/* Ground truth explanation */
.truth-card {
  background: rgba(232,69,60,0.04);
  border: 1px solid rgba(232,69,60,0.12);
  border-radius: 8px;
  padding: 10px 12px;
}
.truth-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.truth-cat {
  font-size: 12px;
  font-weight: 900;
  font-family: 'JetBrains Mono', monospace;
}
.truth-title { font-size: 12px; font-weight: 700; color: var(--game-text); flex: 1; }
.truth-sev { font-size: 10px; font-weight: 700; }
.truth-explain { font-size: 11px; color: rgba(232,232,255,0.5); line-height: 1.6; margin: 0; }

/* Actions */
.action-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 8px;
}

/* Reset modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-box {
  background: #0D0D20;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 18px;
  padding: 28px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-icon { font-size: 32px; }
.modal-title { font-size: 18px; font-weight: 800; color: var(--game-text); }
.modal-body { font-size: 13px; color: var(--game-text-dim); line-height: 1.5; }
.modal-actions { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
