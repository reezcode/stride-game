<template>
  <div class="module-bg min-h-screen pt-6 pb-20 px-4">
    <div class="scanline-layer" aria-hidden="true"></div>
    <div v-if="!moduleData" class="flex items-center justify-center h-96">
      <div class="flex items-center gap-3 text-center">
        <IconLocked size="32" stroke="1.5" style="color: var(--color-text-muted);" />
        <p class="text-sm" style="color: var(--color-text-muted);">Module not found</p>
        <RouterLink to="/phase/2" class="btn-ghost mt-4 inline-block text-sm">← Back</RouterLink>
      </div>
    </div>

    <div v-else class="max-w-3xl mx-auto">
      <!-- Back -->
      <RouterLink to="/learn" class="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-70"
        :style="`color: ${moduleData.color}`">
        ← Back to Reference Desk
      </RouterLink>

      <!-- Module Hero -->
      <div class="animate-fade-up card p-8 mb-8 relative overflow-hidden"
        :style="`border-color: ${moduleData.borderColor}`">
        <!-- Flat accent strip -->
        <div class="absolute top-0 left-0 bottom-0 w-2 pointer-events-none"
          :style="`background: ${moduleData.color};`">
        </div>

        <div class="relative flex items-start gap-6">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
          :style="`background: ${moduleData.bgColor}; border: 1px solid ${moduleData.borderColor}; color: ${moduleData.color}`">
          <component :is="strideIcons[moduleData.letter]" size="36" stroke="2" />
        </div>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-5xl font-black font-mono" :style="`color: ${moduleData.color}`">{{ letter }}</span>
              <div>
                <h1 class="text-2xl font-bold">{{ moduleData.name }}</h1>
                <p class="text-sm" :style="`color: ${moduleData.color}`">{{ moduleData.tagline }}</p>
              </div>
            </div>
            <p class="text-sm leading-relaxed whitespace-pre-line mt-3" style="color: var(--color-text-secondary);">
              {{ moduleData.description }}
            </p>
          </div>
        </div>

        <!-- Keywords -->
        <div class="flex flex-wrap gap-2 mt-6">
          <span v-for="kw in moduleData.keywords" :key="kw"
            class="tag text-xs px-3 py-1.5"
            :style="`background: ${moduleData.bgColor}; color: ${moduleData.color}; border: 1px solid ${moduleData.borderColor}`">
            {{ kw }}
          </span>
        </div>
      </div>

      <!-- Fail Points -->
      <section class="animate-fade-in mb-8">
        <h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--color-text-muted);"
          :style="`gap: 0.5rem; display: flex; align-items: center;`">
          <IconAlertTriangle size="14" style="display: inline;" /> Common Fail Points
        </h2>
        <div class="grid sm:grid-cols-2 gap-3">
          <div v-for="fp in moduleData.failPoints" :key="fp.title"
            class="card p-4 flex items-start gap-3 transition-all hover:border-opacity-50"
            :style="`border-color: ${moduleData.borderColor}40`">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style="background: #EBEBЕ6; color: var(--color-text-primary);">
              <component :is="failPointIcons[fp.icon]" size="20" stroke="2" />
            </div>
            <div>
              <div class="text-sm font-semibold mb-1" style="color: var(--color-text-primary);">{{ fp.title }}</div>
              <div class="text-xs leading-relaxed" style="color: var(--color-text-muted);">{{ fp.detail }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Examples / Code -->
      <section class="animate-fade-in mb-8">
        <h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--color-text-muted);"
          :style="`gap: 0.5rem; display: flex; align-items: center;`">
          <IconEye size="14" style="display: inline;" /> Real-World Examples
        </h2>
        <div class="space-y-4">
          <div v-for="ex in moduleData.examples" :key="ex.title"
            class="card overflow-hidden"
            :style="`border-color: ${moduleData.borderColor}40`">
            <div class="px-5 py-4 border-b flex items-center gap-2"
              style="border-color: var(--color-border);">
              <div class="w-1.5 h-1.5 rounded-full" :style="`background: ${moduleData.color}`"></div>
              <h3 class="text-sm font-semibold" style="color: var(--color-text-primary);">{{ ex.title }}</h3>
            </div>
            <div class="p-5 space-y-3">
              <p class="text-sm" style="color: var(--color-text-secondary);">{{ ex.description }}</p>
              <pre class="text-xs font-mono p-4 rounded-xl leading-relaxed overflow-x-auto"
                style="background: var(--color-bg-elevated); color: #2E7A56; border: 1px solid var(--color-border-dim);">{{ ex.code }}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Quiz Section -->
      <section class="animate-fade-in mb-8">
        <div class="flex items-center gap-3 mb-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-muted); display: flex; align-items: center; gap: 0.5rem;">
            <IconBrain size="14" /> Knowledge Check
          </h2>
          <span class="text-xs px-2 py-0.5 rounded-full"
            :style="`background: ${moduleData.bgColor}; color: ${moduleData.color}; border: 1px solid ${moduleData.borderColor}`">
            Pass ≥ 2/3 to unlock next
          </span>
        </div>

        <div v-if="!quizSubmitted" class="space-y-4">
          <QuizQuestion
            v-for="(q, i) in moduleData.quiz" :key="i"
            :question="q"
            :index="i"
            :color="moduleData.color"
            :selected="quizAnswers[i]"
            :submitted="false"
            :dark="true"
            @select="selectAnswer(i, $event)"
          />
          <button
            class="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
            :disabled="!allQuestionsAnswered"
            :class="allQuestionsAnswered ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
            :style="allQuestionsAnswered
              ? `background: ${moduleData.color}22; color: ${moduleData.color}; border: 1px solid ${moduleData.color}55`
              : 'background: rgba(255,255,255,0.04); color: rgba(232,232,255,0.3); border: 1px solid rgba(255,255,255,0.08)'"
            @click="submitQuiz"
          >
            Submit Quiz ({{ answeredCount }}/{{ moduleData.quiz.length }} answered)
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- Score result -->
          <div class="card p-6 text-center" :style="`border-top: 4px solid ${passed ? '#12A67A' : '#E8453C'}`">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              :style="passed
                ? 'background: rgba(18,166,122,0.15); border: 1px solid rgba(18,166,122,0.3);'
                : 'background: rgba(232,69,60,0.12); border: 1px solid rgba(232,69,60,0.3);'">
              <component :is="passed ? IconCheck : IconRefresh"
                size="28" stroke="2"
                :style="`color: ${passed ? '#12A67A' : '#E8453C'}`" />
            </div>
            <div class="text-3xl font-black mb-2" :style="`color: ${passed ? '#12A67A' : '#E8453C'}`">
              {{ quizScore }}/{{ moduleData.quiz.length }}
            </div>
            <p class="text-sm font-medium mb-1" style="color: rgba(232,232,255,0.85);">
              {{ passed ? 'Passed! You understand ' + moduleData.name : 'Not passed. Try again!' }}
            </p>
            <p class="text-xs" style="color: rgba(232,232,255,0.4);">
              {{ passed ? 'Module complete. Next module unlocked!' : 'You need at least 2/3 correct to pass.' }}
            </p>
          </div>

          <!-- Answer review -->
          <QuizQuestion
            v-for="(q, i) in moduleData.quiz" :key="i"
            :question="q"
            :index="i"
            :color="moduleData.color"
            :selected="quizAnswers[i]"
            :submitted="true"
            :dark="true"
          />

          <div class="flex gap-3">
            <button v-if="!passed" class="btn-ghost flex-1 py-3 text-sm" @click="retryQuiz">
              Try Again
            </button>
            <button v-if="passed" class="btn-primary flex-1 py-3 text-sm" @click="goNext">
              {{ nextRoute ? 'Next Module →' : 'All Done! Back to Map →' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { strideData } from '@/data'
import { strideIcons, failPointIcons, IconLocked, IconAlertTriangle, IconEye, IconBrain, IconCheck, IconRefresh } from '@/icons'
import QuizQuestion from '@/components/QuizQuestion.vue'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
store.load()
if (!store.gameStarted) router.replace('/')

const letter = computed(() => (route.params.letter as string)?.toUpperCase())
const moduleData = computed(() => strideData[letter.value as keyof typeof strideData] ?? null)

const strideOrder = ['S', 'T', 'R', 'I', 'D', 'E']

// Check if module is locked
const isLocked = computed(() => {
  const idx = strideOrder.indexOf(letter.value)
  if (idx === 0) return false
  return !store.completedModules.includes(strideOrder[idx - 1])
})

if (isLocked.value) {
  router.replace('/learn')
}

// Quiz state
const quizAnswers = ref<(number | null)[]>(moduleData.value?.quiz.map(() => null) ?? [])
const quizSubmitted = ref(store.completedModules.includes(letter.value))
const quizScore = ref(store.quizScores[letter.value] ?? 0)
const passed = ref(quizScore.value >= 2)

const allQuestionsAnswered = computed(() => quizAnswers.value.every(a => a !== null))
const answeredCount = computed(() => quizAnswers.value.filter(a => a !== null).length)

function selectAnswer(qIdx: number, optIdx: number) {
  if (quizSubmitted.value) return
  quizAnswers.value[qIdx] = optIdx
}

function submitQuiz() {
  if (!allQuestionsAnswered.value) return
  const correct = moduleData.value!.quiz.reduce((acc, q, i) =>
    acc + (quizAnswers.value[i] === q.correct ? 1 : 0), 0)
  quizScore.value = correct
  quizSubmitted.value = true
  passed.value = correct >= 2

  if (passed.value) {
    store.completeModule(letter.value, correct)
  }
}

function retryQuiz() {
  quizAnswers.value = moduleData.value!.quiz.map(() => null)
  quizSubmitted.value = false
  quizScore.value = 0
  passed.value = false
}

const nextRoute = computed(() => {
  const idx = strideOrder.indexOf(letter.value)
  if (idx < strideOrder.length - 1) return `/learn/${strideOrder[idx + 1]}`
  return null
})

function goNext() {
  if (store.phase2Completed) {
    router.push('/game')
  } else if (nextRoute.value) {
    router.push(nextRoute.value)
  } else {
    router.push('/learn')
  }
}
</script>

<style scoped>
.module-bg {
  background: var(--game-bg);
  background-image:
    radial-gradient(ellipse 50% 40% at 10% 20%, rgba(114,65,224,0.05) 0%, transparent 60%);
  color: var(--game-text);
}
.scanline-layer {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px
  );
  pointer-events: none;
  z-index: 0;
}
.max-w-3xl { position: relative; z-index: 1; }

/* ── Dark overrides for all child light-mode components ── */
.module-bg :deep(.card) {
  background: rgba(255,255,255,0.04) !important;
  border-color: rgba(255,255,255,0.1) !important;
  color: var(--game-text) !important;
}
.module-bg :deep(.card:hover) {
  background: rgba(255,255,255,0.07) !important;
  border-color: rgba(255,255,255,0.18) !important;
}
.module-bg :deep(.card-elevated) {
  background: rgba(255,255,255,0.06) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
/* headings and body text */
.module-bg :deep([style*="color: var(--color-text-primary)"]),
.module-bg :deep([style*="color: #0C0C0A"]) {
  color: var(--game-text) !important;
}
.module-bg :deep([style*="color: var(--color-text-secondary)"]),
.module-bg :deep([style*="color: #4A4A46"]) {
  color: var(--game-text-dim) !important;
}
.module-bg :deep([style*="color: var(--color-text-muted)"]),
.module-bg :deep([style*="color: #8A8A84"]) {
  color: var(--game-text-muted) !important;
}
/* code / pre blocks */
.module-bg :deep(pre) {
  background: rgba(8,8,20,0.8) !important;
  border-color: rgba(255,255,255,0.08) !important;
  color: #7ECDA4 !important;
}
/* icon container in fail points */
.module-bg :deep([style*="background: #EBEBЕ6"]) {
  background: rgba(255,255,255,0.06) !important;
  color: var(--game-text) !important;
}
/* tag pills — keep their category colors, just fix bg text */
.module-bg :deep(.tag) {
  opacity: 0.9;
}
/* quiz option buttons */
.module-bg :deep(.quiz-option) {
  background: rgba(255,255,255,0.04) !important;
  border-color: rgba(255,255,255,0.1) !important;
  color: var(--game-text-dim) !important;
}
.module-bg :deep(.quiz-option:hover) {
  background: rgba(255,255,255,0.08) !important;
}
/* btn-ghost in dark context */
.module-bg :deep(.btn-ghost) {
  border-color: rgba(255,255,255,0.15) !important;
  color: var(--game-text-dim) !important;
  background: rgba(255,255,255,0.04) !important;
}
.module-bg :deep(.btn-ghost:hover) {
  border-color: rgba(255,255,255,0.3) !important;
  color: var(--game-text) !important;
  background: rgba(255,255,255,0.08) !important;
}
/* section borders */
.module-bg :deep([style*="border-color: var(--color-border)"]) {
  border-color: rgba(255,255,255,0.08) !important;
}
/* score card bottom border */
.module-bg :deep(.space-y-4 > .card) {
  border-top-width: 4px !important;
}
/* explanation text in quiz answers */
.module-bg :deep(p[style*="color: var(--color-text"]) {
  color: var(--game-text-dim) !important;
}
</style>
