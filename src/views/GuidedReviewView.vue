<template>
  <div class="min-h-screen pt-20 pb-16 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="animate-fade-up mb-10">
        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] mb-4" style="color: #12A67A;">
          <span class="w-2 h-2 rounded-md" style="background: #12A67A;"></span>
          Phase 3 — Guided Review
        </div>
        <h1 class="text-3xl font-black mb-3">
          Review with <span style="color: #12A67A;">STRIDE</span>
        </h1>
        <p class="text-sm leading-relaxed max-w-xl" style="color: var(--color-text-secondary);">
          Skenario yang sama dari Phase 1 kini tampil kembali. Gunakan framework STRIDE untuk 
          mengklasifikasikan ancaman yang kamu temukan, dan berikan rekomendasi mitigasinya.
        </p>
        <!-- STRIDE legend -->
        <div class="flex flex-wrap gap-2 mt-4">
          <div v-for="item in strideLegend" :key="item.letter"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            :style="`background: ${item.bg}; border: 1px solid ${item.border}; color: ${item.color}`">
            <span class="font-bold font-mono">{{ item.letter }}</span>
            <span class="opacity-80">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="card p-4 mb-8 flex items-center gap-4">
        <div class="flex-1">
          <div class="flex justify-between text-xs mb-2" style="color: var(--color-text-muted);">
            <span>Progress</span>
            <span>{{ answeredCount }}/{{ scenarios.length }} dijawab</span>
          </div>
          <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--color-bg-elevated);">
            <div class="h-full rounded-full transition-all duration-500"
              style="background: #12A67A;"
              :style="{ width: `${(answeredCount / scenarios.length) * 100}%` }">
            </div>
          </div>
        </div>
        <div class="text-2xl font-black" style="color: #12A67A;">{{ answeredCount }}/{{ scenarios.length }}</div>
      </div>

      <!-- Scenario Guided Panels -->
      <div class="space-y-6">
        <div v-for="(scenario, idx) in scenarios" :key="scenario.id">
          <GuidedScenarioPanel
            :scenario="scenario"
            :index="idx"
            :blind-answer="store.getBlindAnswerForScenario(scenario.id)"
            :guided-answer="getGuidedAnswer(scenario.id)"
            @update="updateAnswer"
          />
        </div>
      </div>

      <!-- Submit -->
      <div class="mt-10 pt-8" style="border-top: 1px solid var(--color-border);">
        <div v-if="!allAnswered" class="card p-4 mb-6 flex items-center gap-3">
          <IconAlertTriangle size="16" style="color: #FFB347; flex-shrink: 0;" />
          <p class="text-sm" style="color: var(--color-text-secondary);">
            Select at least one STRIDE category for each scenario before submitting.
          </p>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p class="text-sm font-medium">Done with STRIDE review?</p>
            <p class="text-xs mt-1" style="color: var(--color-text-muted);">Jawaban akan dianalisis dan dibandingkan dengan blind review.</p>
            <p class="text-xs mt-1" style="color: var(--color-text-muted);">Answers will be analyzed and compared with your blind review.</p>
          </div>
          <button
            class="btn-primary px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            :disabled="!allAnswered"
            @click="showConfirm = true"
          >
            Submit & See Results →
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);">
        <div class="card p-8 max-w-md w-full space-y-5" style="border-color: rgba(78,205,196,0.3);">
          <div class="text-center space-y-3">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style="background: rgba(78,205,196,0.1); border: 1px solid rgba(78,205,196,0.3);">
              <IconChartBar size="28" stroke="1.5" style="color: #4ECDC4;" />
            </div>
            <h3 class="text-xl font-bold">Submit STRIDE Review?</h3>
            <p class="text-sm" style="color: var(--color-text-secondary);">
              Your responses will be analyzed against the ground truth and compared
              with your initial blind review findings.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button class="btn-ghost py-3 text-sm" @click="showConfirm = false">Back</button>
            <button class="btn-primary py-3 text-sm" @click="confirmSubmit">See Results →</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore, type GuidedAnswer } from '@/stores/progress'
import { scenarios, strideData } from '@/data'
import { IconAlertTriangle, IconChartBar } from '@/icons'
import GuidedScenarioPanel from '@/components/GuidedScenarioPanel.vue'

const router = useRouter()
const store = useProgressStore()
const showConfirm = ref(false)

const strideLegend = Object.values(strideData).map(d => ({
  letter: d.letter,
  name: d.name,
  color: d.color,
  bg: d.bgColor,
  border: d.borderColor,
}))

// Initialize guided answers
const guidedAnswers = ref<GuidedAnswer[]>(
  scenarios.map(sc => {
    const existing = store.getGuidedAnswerForScenario(sc.id)
    if (existing) return existing
    return {
      scenarioId: sc.id,
      strideCategories: (['S', 'T', 'R', 'I', 'D', 'E'] as const).map(cat => ({
        category: cat,
        finding: '',
        severity: 'Medium' as const,
        recommendation: '',
        selected: false,
      })),
    }
  })
)

function getGuidedAnswer(id: string) {
  return guidedAnswers.value.find(a => a.scenarioId === id)!
}

function updateAnswer(updated: GuidedAnswer) {
  const idx = guidedAnswers.value.findIndex(a => a.scenarioId === updated.scenarioId)
  if (idx !== -1) guidedAnswers.value[idx] = updated
}

const answeredCount = computed(() =>
  guidedAnswers.value.filter(a => a.strideCategories.some(c => c.selected)).length
)
const allAnswered = computed(() => answeredCount.value === scenarios.length)

function confirmSubmit() {
  store.submitGuidedAnswers(guidedAnswers.value)
  showConfirm.value = false
  router.push('/results')
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
