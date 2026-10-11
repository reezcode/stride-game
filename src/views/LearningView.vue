<template>
  <div class="page">
    <nav class="topbar">
      <button class="back" @click="router.push('/game')"><IconArrowLeft :size="18" /> {{ $t('learn.back') }}</button>
      <span class="t-label top-k">{{ $t('learn.top') }}</span>
    </nav>

    <article class="manual paper anim-rise">
      <header>
        <div class="t-label kicker">{{ $t('learn.kicker') }}</div>
        <h1 class="t-display title">{{ $t('learn.title') }}</h1>
        <p class="intro">
          {{ $t('learn.intro') }}
        </p>

        <div class="progress" :aria-label="$t('learn.passed', { n: store.completedModules.length })">
          <div class="bar">
            <span v-for="s in STRIDE" :key="s.letter" class="seg"
              :style="{ background: store.completedModules.includes(s.letter) ? s.color : undefined }"></span>
          </div>
          <span class="t-mono prog-text">{{ $t('learn.passed', { n: store.completedModules.length }) }}</span>
        </div>
      </header>

      <ol class="chapters">
        <li v-for="(s, idx) in STRIDE" :key="s.letter">
          <button class="chapter" :class="{ locked: isLocked(idx), done: isDone(s.letter) }"
            :disabled="isLocked(idx)" @click="router.push(`/learn/${s.letter}`)">
            <span class="ch-no t-mono">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="ch-letter" :style="{ color: s.color }">{{ s.letter }}</span>
            <span class="ch-text">
              <span class="ch-name">{{ s.name }}</span>
              <span class="ch-tag">{{ tagline(s.letter) }}</span>
            </span>
            <span class="ch-status">
              <template v-if="isDone(s.letter)"><IconCircleCheck :size="18" /> {{ $t('learn.chPassed', { n: store.quizScores[s.letter] ?? 0 }) }}</template>
              <template v-else-if="isLocked(idx)"><IconLock :size="16" /> {{ $t('learn.chLocked', { n: idx }) }}</template>
              <template v-else>{{ $t('learn.chRead') }} <IconArrowRight :size="16" /></template>
            </span>
          </button>
        </li>
      </ol>

      <footer v-if="store.phase2Completed" class="complete">
        <div>
          <div class="done-title">{{ $t('learn.doneTitle') }}</div>
          <div class="done-sub">{{ $t('learn.doneSub') }}</div>
        </div>
        <button class="btn btn-ink" @click="router.push('/game')">{{ $t('learn.return') }}</button>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconArrowRight, IconLock, IconCircleCheck } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { strideData } from '@/data'
import { STRIDE } from '@/game/stride'

const router = useRouter()
const store  = useGameStore()

function isDone(letter: string) { return store.completedModules.includes(letter) }
function isLocked(idx: number) { return idx > 0 && !isDone(STRIDE[idx - 1].letter) }
function tagline(l: string) { return strideData[l as keyof typeof strideData]?.tagline ?? '' }
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
.top-k { color: var(--color-fog-mute); }

.manual {
  max-width: 888px;
  margin: 0 auto;
  padding: 40px 48px 36px;
  border-radius: 2px;
  box-shadow: 0 30px 80px #0009;
}
.kicker { color: var(--color-pen-3); }
.title { font-size: clamp(34px, 6vw, 56px); margin: 14px 0 16px; max-width: 14ch; }
.intro { font-size: 16px; line-height: 1.65; max-width: 62ch; margin: 0; color: var(--color-pen-2); }

.progress { display: flex; align-items: center; gap: 14px; margin-top: 26px; }
.bar { flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; }
.seg { height: 6px; background: var(--color-paper-3); border-radius: 1px; }
.prog-text { font-size: 13px; color: var(--color-pen-3); }

.chapters { list-style: none; margin: 30px 0 0; padding: 0; border-top: 2px solid var(--color-pen); }
.chapter {
  width: 100%;
  display: grid;
  grid-template-columns: 30px 40px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 18px 4px;
  border: 0;
  border-bottom: 1px solid var(--color-paper-line);
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-pen);
}
.chapter:not(:disabled):hover { background: var(--color-paper-2); }
.chapter.locked { cursor: not-allowed; }
.chapter.locked .ch-letter, .chapter.locked .ch-text { opacity: .4; }
.ch-no { font-size: 12px; color: var(--color-pen-3); }
.ch-letter { font-family: var(--font-cond); font-weight: 700; font-size: 40px; line-height: 1; }
.ch-text { display: grid; gap: 2px; }
.ch-name { font-weight: 700; font-size: 18px; }
.ch-tag { font-size: 14px; color: var(--color-pen-3); }
.ch-status { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--color-pen-2); white-space: nowrap; }
.chapter.done .ch-status { color: #2F7D57; }
.chapter.locked .ch-status { color: var(--color-pen-3); font-weight: 500; }

.complete {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  margin-top: 26px; padding: 18px 20px;
  background: #2F7D5714; border-left: 4px solid #2F7D57;
}
.done-title { font-weight: 700; font-size: 16px; }
.done-sub { font-size: 14px; color: var(--color-pen-2); }

@media (max-width: 640px) {
  .manual { padding: 28px 18px; border-radius: 0; }
  .chapter { grid-template-columns: 32px 1fr; grid-template-rows: auto auto; gap: 6px 12px; }
  .ch-no { display: none; }
  .ch-status { grid-column: 2; }
}
</style>
