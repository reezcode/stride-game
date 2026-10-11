<template>
  <div class="page">
    <nav class="topbar">
      <RouterLink to="/learn" class="back"><IconArrowLeft :size="18" /> {{ $t('learn.manual') }}</RouterLink>
      <button class="back" @click="router.push('/game')">{{ $t('learn.back') }}</button>
    </nav>

    <article v-if="moduleData" class="chapter paper anim-rise" :style="{ '--cat': color }">
      <header class="ch-head">
        <div class="t-label kicker">{{ $t('learn.chapterOf', { n: chapterNo }) }}</div>
        <div class="ch-title-row">
          <span class="ch-letter">{{ moduleData.letter }}</span>
          <div>
            <h1 class="t-display ch-title">{{ moduleData.name }}</h1>
            <div class="ch-tag">{{ moduleData.tagline }}</div>
          </div>
        </div>
        <p class="question">{{ meta.question }}</p>
        <p class="desc">{{ flatten(moduleData.description) }}</p>
        <ul class="keywords">
          <li v-for="kw in moduleData.keywords" :key="kw">{{ kw }}</li>
        </ul>
      </header>

      <section>
        <h2 class="h">{{ $t('learn.fails') }}</h2>
        <ol class="fails">
          <li v-for="fp in moduleData.failPoints" :key="fp.title">
            <component :is="failPointIcons[fp.icon] ?? IconAlertTriangle" :size="20" stroke-width="1.7" class="fail-icon" />
            <div>
              <div class="fail-title">{{ fp.title }}</div>
              <div class="fail-detail">{{ fp.detail }}</div>
            </div>
          </li>
        </ol>
      </section>

      <section>
        <h2 class="h">{{ $t('learn.wild') }}</h2>
        <div v-for="(ex, i) in moduleData.examples" :key="ex.title" class="example">
          <div class="ex-head">
            <span class="t-mono ex-no">{{ moduleData.letter }}.{{ i + 1 }}</span>
            <h3>{{ ex.title }}</h3>
          </div>
          <p>{{ ex.description }}</p>
          <pre class="codeblock">{{ ex.code }}</pre>
        </div>
      </section>

      <section>
        <h2 class="h">
          {{ $t('learn.check') }}
          <span class="h-meta">{{ $t('learn.toPass', { n: moduleData.quiz.length }) }}</span>
        </h2>

        <div v-if="quizSubmitted" class="result" :class="passed ? 'pass' : 'fail'">
          <div class="result-score t-display">{{ quizScore }}/{{ moduleData.quiz.length }}</div>
          <div>
            <div class="result-title">{{ passed ? $t('learn.resPass', { name: moduleData.name }) : $t('learn.resFail') }}</div>
            <div class="result-sub">{{ passed ? (nextLetter ? $t('learn.resNext', { n: chapterNo + 1 }) : $t('learn.resLast')) : $t('learn.resNeed') }}</div>
          </div>
        </div>

        <div class="quiz">
          <QuizQuestion
            v-for="(q, i) in moduleData.quiz" :key="`${attempt}-${i}`"
            :question="q" :index="i" :color="color"
            :selected="quizAnswers[i]" :submitted="quizSubmitted"
            @select="selectAnswer(i, $event)"
          />
        </div>

        <div class="actions">
          <template v-if="!quizSubmitted">
            <span class="muted">{{ $t('learn.answered', { a: answeredCount, b: moduleData.quiz.length }) }}</span>
            <button class="btn btn-ink" :disabled="!allQuestionsAnswered" @click="submitQuiz">{{ $t('learn.checkBtn') }}</button>
          </template>
          <template v-else-if="!passed">
            <span></span>
            <button class="btn btn-ink" @click="retryQuiz"><IconRefresh :size="17" /> {{ $t('learn.retry') }}</button>
          </template>
          <template v-else>
            <button class="btn btn-outline" @click="router.push('/learn')">{{ $t('learn.all') }}</button>
            <button class="btn btn-ink" @click="goNext">
              {{ nextLetter ? $t('learn.next', { name: nextName }) : $t('learn.return') }} <IconArrowRight :size="17" />
            </button>
          </template>
        </div>
      </section>
    </article>

    <div v-else class="missing">
      <p>{{ $t('learn.missing') }}</p>
      <RouterLink to="/learn" class="btn btn-ghost">{{ $t('learn.backManual') }}</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { IconArrowLeft, IconArrowRight, IconRefresh, IconAlertTriangle } from '@tabler/icons-vue'
import { useGameStore } from '@/stores/game'
import { strideData } from '@/data'
import { failPointIcons } from '@/icons'
import { STRIDE, STRIDE_BY } from '@/game/stride'
import QuizQuestion from '@/components/QuizQuestion.vue'

const route  = useRoute()
const router = useRouter()
const store  = useGameStore()

const letter     = computed(() => (route.params.letter as string)?.toUpperCase())
const moduleData = computed(() => strideData[letter.value as keyof typeof strideData] ?? null)
const meta       = computed(() => STRIDE_BY[letter.value] ?? STRIDE[0])
const color      = computed(() => meta.value.color)
const order      = STRIDE.map(s => s.letter as string)
const chapterNo  = computed(() => order.indexOf(letter.value) + 1)
const nextLetter = computed(() => order[order.indexOf(letter.value) + 1] ?? null)
const nextName   = computed(() => nextLetter.value ? STRIDE_BY[nextLetter.value].name : '')

const isLocked = computed(() => {
  const idx = order.indexOf(letter.value)
  return idx > 0 && !store.completedModules.includes(order[idx - 1])
})
if (isLocked.value) router.replace('/learn')

// Source text has hard line breaks from a template literal; let it reflow.
function flatten(s: string) { return s.replace(/\s*\n\s*/g, ' ').trim() }

// Quiz
const attempt       = ref(0)
const quizAnswers   = ref<(number | null)[]>(moduleData.value?.quiz.map(() => null) ?? [])
const quizSubmitted = ref(false)
const quizScore     = ref(0)
const passed        = ref(false)

const allQuestionsAnswered = computed(() => quizAnswers.value.every(a => a !== null))
const answeredCount        = computed(() => quizAnswers.value.filter(a => a !== null).length)

function selectAnswer(qIdx: number, optIdx: number) {
  if (quizSubmitted.value) return
  quizAnswers.value[qIdx] = optIdx
}

function submitQuiz() {
  if (!allQuestionsAnswered.value) return
  const correct = moduleData.value!.quiz.reduce((acc, q, i) => acc + (quizAnswers.value[i] === q.correct ? 1 : 0), 0)
  quizScore.value = correct
  quizSubmitted.value = true
  passed.value = correct >= 2
  if (passed.value) store.completeModule(letter.value, correct)
}

function retryQuiz() {
  attempt.value++
  quizAnswers.value = moduleData.value!.quiz.map(() => null)
  quizSubmitted.value = false
  quizScore.value = 0
  passed.value = false
  window.scrollTo({ top: document.querySelector('.quiz')?.getBoundingClientRect().top! + window.scrollY - 120, behavior: 'smooth' })
}

function goNext() {
  if (nextLetter.value) router.push(`/learn/${nextLetter.value}`)
  else router.push('/game')
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
  font-size: 14px; font-weight: 600; color: var(--color-fog-dim); cursor: pointer; text-decoration: none;
}
.back:hover { color: var(--color-fog); }

.chapter {
  max-width: 888px;
  margin: 0 auto;
  padding: 40px 48px 36px;
  border-radius: 2px;
  box-shadow: 0 30px 80px #0009;
  border-top: 6px solid var(--cat);
}
.kicker { color: var(--color-pen-3); }
.ch-title-row { display: flex; align-items: flex-end; gap: 18px; margin-top: 14px; }
.ch-letter { font-family: var(--font-cond); font-weight: 700; font-size: 104px; line-height: .78; color: var(--cat); }
.ch-title { font-size: clamp(34px, 6vw, 52px); margin: 0; }
.ch-tag { font-size: 15px; color: var(--color-pen-3); margin-top: 6px; }
.question {
  font-family: var(--font-cond);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
  margin: 28px 0 10px;
  padding-left: 14px;
  border-left: 3px solid var(--cat);
}
.desc { font-size: 16px; line-height: 1.7; margin: 0; max-width: 64ch; color: var(--color-pen-2); }
.keywords { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-wrap: wrap; gap: 6px; }
.keywords li {
  font-size: 13px;
  padding: 3px 9px;
  border: 1px solid var(--color-paper-line);
  border-radius: 2px;
  background: #F6F2E8;
}

.h {
  display: flex; align-items: baseline; justify-content: space-between;
  font-size: 14px; font-weight: 700;
  margin: 40px 0 14px; padding-bottom: 8px;
  border-bottom: 2px solid var(--color-pen);
}
.h-meta { font-weight: 500; font-size: 13px; color: var(--color-pen-3); }

.fails { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0 28px; }
.fails li { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px dashed var(--color-paper-line); }
.fail-icon { color: var(--cat); flex-shrink: 0; margin-top: 2px; }
.fail-title { font-weight: 700; font-size: 15px; }
.fail-detail { font-size: 14px; color: var(--color-pen-2); line-height: 1.5; margin-top: 2px; }

.example { margin-bottom: 26px; }
.ex-head { display: flex; align-items: baseline; gap: 10px; }
.ex-head h3 { margin: 0; font-size: 17px; }
.ex-no { font-size: 12px; color: var(--cat); font-weight: 600; }
.example p { font-size: 15px; line-height: 1.6; margin: 6px 0 10px; color: var(--color-pen-2); }

.quiz { display: grid; gap: 14px; }
.result {
  display: flex; align-items: center; gap: 18px;
  padding: 14px 18px; margin-bottom: 18px;
  border-left: 4px solid;
}
.result.pass { border-color: #2F7D57; background: #2F7D5714; }
.result.fail { border-color: #B8321F; background: #B8321F12; }
.result-score { font-size: 44px; }
.result.pass .result-score { color: #2F7D57; }
.result.fail .result-score { color: #B8321F; }
.result-title { font-weight: 700; font-size: 15px; }
.result-sub { font-size: 14px; color: var(--color-pen-2); }

.actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
.muted { font-size: 13px; color: var(--color-pen-3); }

.missing { text-align: center; color: var(--color-fog-dim); padding: 80px 16px; }

@media (max-width: 640px) {
  .chapter { padding: 28px 18px; border-radius: 0; }
  .ch-letter { font-size: 76px; }
  .actions .btn { flex: 1; }
}
</style>
