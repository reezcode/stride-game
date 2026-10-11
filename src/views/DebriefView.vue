<template>
  <div class="page">
    <nav class="topbar">
      <button class="back" @click="router.push('/game')"><IconArrowLeft :size="18" /> Back to the floor</button>
      <button class="back" @click="confirmReset = true"><IconRefresh :size="17" /> Start over</button>
    </nav>

    <article class="report paper anim-rise">
      <header class="r-head">
        <div>
          <div class="t-label kicker">Sealed record · PayVault HQ · 14th floor · sent to legal and the cyber unit</div>
          <h1 class="t-display title">What was done to Laras</h1>
          <div class="agent">
            <DetectiveAvatar :color="store.playerColor" :size="44" />
            <div>
              <div class="agent-name">{{ store.playerName }}</div>
              <div class="agent-rank">{{ rankFor(store.totalXP) }}</div>
            </div>
          </div>
        </div>
        <div class="grade">
          <span class="stamp anim-stamp grade-stamp" :style="{ color: store.letterGrade.color }">
            {{ store.letterGrade.grade }}
          </span>
          <div class="grade-label">Accuracy grade</div>
        </div>
      </header>

      <dl class="stats">
        <div><dt>Total XP</dt><dd class="t-mono">{{ store.totalXP.toLocaleString() }}</dd></div>
        <div><dt>Threats identified</dt><dd class="t-mono">{{ store.overallAccuracy }}%</dd></div>
        <div><dt>Evidence recovered</dt><dd class="t-mono">{{ store.evidenceCount }}/{{ store.evidenceTotal }}</dd></div>
        <div><dt>Hints used</dt><dd class="t-mono">{{ hintsUsed }}</dd></div>
      </dl>

      <section>
        <h2 class="h">STRIDE coverage <span class="h-meta">expected threats you identified, by category</span></h2>
        <ul class="coverage">
          <li v-for="cov in store.strideCoverage" :key="cov.letter"
            :title="`${STRIDE_BY[cov.letter].name}: ${cov.hit} of ${cov.total} identified`">
            <span class="cov-l" :style="{ color: STRIDE_BY[cov.letter].color }">{{ cov.letter }}</span>
            <span class="cov-name">{{ STRIDE_BY[cov.letter].name }}</span>
            <span class="cov-track">
              <span class="cov-fill" :style="{ width: `${cov.total ? (cov.hit / cov.total) * 100 : 0}%`, background: STRIDE_BY[cov.letter].color }"></span>
            </span>
            <span class="cov-val t-mono">{{ cov.total ? `${cov.hit}/${cov.total}` : '—' }}</span>
          </li>
        </ul>
        <p class="cov-note">Categories with no expected threats in these five cases show a dash.</p>
      </section>

      <section>
        <h2 class="h">Case by case</h2>
        <div v-for="c in store.cases" :key="c.scenarioId" class="case">
          <div class="case-top">
            <span class="t-mono case-code">{{ c.scenarioId }}</span>
            <div class="case-title">
              <b>{{ scenarioTitle(c.scenarioId) }}</b>
              <span class="muted">{{ roomOf(c.scenarioId) }}</span>
            </div>
            <span class="case-score t-mono" :style="{ color: scoreColor(c.score) }">{{ c.solved ? `${c.score}%` : 'open' }}</span>
            <span class="case-xp t-mono">+{{ c.xpEarned }} XP</span>
          </div>

          <div v-if="c.solved" class="case-body">
            <div class="chips">
              <span v-for="cat in c.correct" :key="'c' + cat" class="chip hit" :style="{ '--cat': STRIDE_BY[cat].color }">
                <IconCheck :size="14" stroke-width="2.6" /> {{ STRIDE_BY[cat].name }}
              </span>
              <span v-for="cat in c.missed" :key="'m' + cat" class="chip miss" :style="{ '--cat': STRIDE_BY[cat].color }">
                <IconX :size="14" stroke-width="2.6" /> Missed {{ STRIDE_BY[cat].name }}
              </span>
              <span v-for="cat in c.falsePositives" :key="'f' + cat" class="chip fp" :style="{ '--cat': STRIDE_BY[cat].color }">
                <IconMinus :size="14" stroke-width="2.6" /> {{ STRIDE_BY[cat].name }} did not apply
              </span>
            </div>
            <div v-for="gt in missedTruths(c.scenarioId, c.missed)" :key="gt.title" class="truth" :style="{ '--cat': STRIDE_BY[gt.category].color }">
              <div class="truth-title"><b>{{ gt.title }}</b> <span class="muted">· {{ gt.severity }}</span></div>
              <p>{{ gt.explanation }}</p>
            </div>
          </div>
        </div>
      </section>

      <footer class="r-foot">
        <span class="muted">Filed {{ filedAt }}</span>
        <div class="r-actions">
          <button class="btn btn-outline" @click="router.push('/game')">Back to the floor</button>
          <button class="btn btn-ink" @click="confirmReset = true">Start over</button>
        </div>
      </footer>
    </article>

    <div v-if="confirmReset" class="overlay" @mousedown.self="confirmReset = false">
      <div class="confirm paper anim-rise" role="alertdialog" aria-modal="true">
        <h3>Start over?</h3>
        <p>This erases {{ store.playerName }}'s cases, evidence, XP and manual progress.</p>
        <div class="confirm-actions">
          <button class="btn btn-outline" @click="confirmReset = false">Keep this save</button>
          <button class="btn btn-alarm" @click="resetAndRestart">Erase and restart</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconRefresh, IconCheck, IconX, IconMinus } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { scenarios } from '@/data'
import { rooms } from '@/game/world'
import { STRIDE_BY, rankFor } from '@/game/stride'
import DetectiveAvatar from '@/components/DetectiveAvatar.vue'

const router = useRouter()
const store  = useGameStore()
const confirmReset = ref(false)

const hintsUsed = computed(() => store.cases.reduce((a, c) => a + c.hintsUsed, 0))
const filedAt = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function scenarioTitle(id: string) { return scenarios.find(s => s.id === id)?.title ?? id }
function roomOf(id: string) { return rooms.find(r => r.scenarioId === id)?.name ?? '' }
function missedTruths(id: string, cats: string[]) {
  return scenarios.find(s => s.id === id)?.groundTruth.filter(gt => cats.includes(gt.category)) ?? []
}
function scoreColor(score: number) {
  return score >= 80 ? '#2F7D57' : score >= 50 ? '#A8680F' : '#B8321F'
}

function resetAndRestart() {
  store.resetGame()
  router.replace('/')
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-ink-950); padding-bottom: 64px; }
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 920px; margin: 0 auto; padding: 16px 16px 20px;
}
.back {
  display: inline-flex; align-items: center; gap: 8px;
  background: none; border: 0; padding: 6px 0;
  font-size: 14px; font-weight: 600; color: var(--color-fog-dim); cursor: pointer;
}
.back:hover { color: var(--color-fog); }

.report {
  max-width: 888px;
  margin: 0 auto;
  padding: 40px 48px 32px;
  border-radius: 2px;
  box-shadow: 0 30px 80px #0009;
}
.r-head { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
.kicker { color: var(--color-pen-3); }
.title { font-size: clamp(36px, 6vw, 58px); margin: 12px 0 18px; }
.agent { display: flex; align-items: center; gap: 12px; }
.agent-name { font-weight: 700; font-size: 17px; }
.agent-rank { font-size: 14px; color: var(--color-pen-3); }
.grade { text-align: center; flex-shrink: 0; padding-top: 10px; }
.grade-stamp { font-size: 76px; padding: 6px 22px 2px; border-width: 5px; }
.grade-label { margin-top: 14px; font-size: 13px; font-weight: 600; color: var(--color-pen-2); }

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 30px 0 0;
  border-top: 2px solid var(--color-pen);
  border-bottom: 1px solid var(--color-paper-line);
}
.stats > div { padding: 14px 0 12px; }
.stats > div + div { padding-left: 18px; border-left: 1px solid var(--color-paper-line); }
.stats dt { font-size: 13px; color: var(--color-pen-3); }
.stats dd { margin: 4px 0 0; font-size: 26px; font-weight: 600; }

.h {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  font-size: 14px; font-weight: 700;
  margin: 36px 0 12px; padding-bottom: 8px;
  border-bottom: 2px solid var(--color-pen);
}
.h-meta { font-weight: 400; font-size: 13px; color: var(--color-pen-3); }

.coverage { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.coverage li {
  display: grid;
  grid-template-columns: 22px 190px 1fr 44px;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
}
.cov-l { font-family: var(--font-cond); font-weight: 700; font-size: 20px; line-height: 1; }
.cov-name { font-size: 14px; }
.cov-track { height: 8px; background: var(--color-paper-3); border-radius: 0 4px 4px 0; overflow: hidden; }
.cov-fill { display: block; height: 100%; border-radius: 0 4px 4px 0; transition: width .8s cubic-bezier(.2,.7,.2,1); }
.cov-val { font-size: 13px; text-align: right; color: var(--color-pen); }
.cov-note { font-size: 12px; color: var(--color-pen-3); margin: 8px 0 0; }

.case { padding: 14px 0; border-bottom: 1px dashed var(--color-paper-line); }
.case-top { display: flex; align-items: center; gap: 14px; }
.case-code { font-size: 12px; color: var(--color-pen-3); width: 52px; flex-shrink: 0; }
.case-title { flex: 1; display: grid; font-size: 15px; min-width: 0; }
.case-score { font-size: 18px; font-weight: 600; }
.case-xp { font-size: 13px; color: var(--color-pen-3); width: 76px; text-align: right; }
.case-body { padding-left: 66px; margin-top: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; padding: 3px 9px 3px 7px;
  border-radius: 2px; border: 1px solid var(--color-paper-line);
  border-left: 3px solid var(--cat);
  background: #F6F2E8;
}
.chip.hit svg { color: #2F7D57; }
.chip.miss svg, .chip.fp svg { color: #B8321F; }
.truth { margin-top: 10px; padding: 10px 12px; border-left: 3px solid var(--cat); background: #B8321F0D; }
.truth-title { font-size: 14px; }
.truth p { margin: 4px 0 0; font-size: 14px; line-height: 1.55; color: var(--color-pen-2); }
.muted { color: var(--color-pen-3); font-size: 13px; }

.r-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.r-actions { display: flex; gap: 8px; }

.overlay {
  position: fixed; inset: 0; z-index: 50;
  display: grid; place-items: center; padding: 16px;
  background: #05070AB3;
}
.confirm { width: min(420px, 100%); padding: 24px; border-radius: 3px; box-shadow: 0 30px 80px #000A; }
.confirm h3 { margin: 0 0 8px; font-size: 20px; }
.confirm p { margin: 0; font-size: 15px; line-height: 1.5; color: var(--color-pen-2); }
.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

@media (max-width: 680px) {
  .report { padding: 28px 18px; border-radius: 0; }
  .r-head { flex-direction: column-reverse; }
  .grade { align-self: flex-start; display: flex; align-items: center; gap: 16px; padding: 0; }
  .grade-stamp { font-size: 52px; }
  .grade-label { margin: 0; }
  .stats { grid-template-columns: 1fr 1fr; }
  .stats > div:nth-child(3) { padding-left: 0; border-left: 0; }
  .coverage li { grid-template-columns: 22px 1fr 44px; }
  .cov-track { grid-column: 2 / 4; grid-row: 2; }
  .case-body { padding-left: 0; }
  .case-xp { display: none; }
}
</style>
