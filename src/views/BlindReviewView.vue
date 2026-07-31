<template>
  <div class="min-h-screen pt-20 pb-16 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="animate-fade-up mb-10">
        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] mb-4" style="color: #E8453C;">
          <span class="w-2 h-2 rounded-md" style="background: #E8453C;"></span>
          Phase 1 — Blind Review
        </div>
        <h1 class="text-3xl font-black mb-3">Security Review: <span style="color: #E8453C;">PayVault</span></h1>
        <p class="text-sm leading-relaxed max-w-xl" style="color: var(--color-text-secondary);">
          Berikut adalah 5 skenario dari aplikasi fintech <strong style="color: var(--color-text-primary);">PayVault</strong>.
          Review setiap skenario dan identifikasi ancaman keamanan yang kamu temukan — 
          <em>tanpa framework apapun</em>, gunakan instink dan pengetahuanmu saat ini.
        </p>
        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <span class="tag" style="background: #FDECEA; border: 1px solid #F5B8B5; color: #B53028;">
            <IconFileText size="12" /> {{ scenarios.length }} Scenarios
          </span>
          <span class="tag" style="background: #FEF3E0; border: 1px solid #F9D49A; color: #925C00;">
            <IconAlertTriangle size="12" /> No STRIDE Hints
          </span>
          <span class="tag" style="background: #E6F6F1; border: 1px solid #9FD9C6; color: #0A7A59;">
            <IconCheck size="12" /> Auto-saved
          </span>
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
          style="background: #E8453C;"
              :style="{ width: `${(answeredCount / scenarios.length) * 100}%` }">
            </div>
          </div>
        </div>
        <div class="text-2xl font-bold" style="color: #FF6B9D;">{{ answeredCount }}/{{ scenarios.length }}</div>
      </div>

      <!-- Scenario Cards -->
      <div class="space-y-6">
        <div v-for="(scenario, idx) in scenarios" :key="scenario.id">
          <ScenarioCard
            :scenario="scenario"
            :index="idx"
            :answer="getAnswer(scenario.id)"
            :phase="1"
            @update="updateAnswer"
          />
        </div>
      </div>

      <!-- Submit -->
      <div class="mt-10 pt-8" style="border-top: 1px solid var(--color-border);">
        <div v-if="!allAnswered" class="card p-4 mb-6 flex items-center gap-3">
          <IconAlertTriangle size="16" style="color: #FFB347; flex-shrink: 0;" />
          <p class="text-sm" style="color: var(--color-text-secondary);">
            Complete all {{ scenarios.length }} scenarios before proceeding.
            <strong style="color: var(--color-text-primary);">{{ scenarios.length - answeredCount }}</strong> scenario(s) remaining.
          </p>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p class="text-sm font-medium" style="color: var(--color-text-primary);">Done with blind review?</p>
            <p class="text-xs mt-1" style="color: var(--color-text-muted);">Setelah submit, kamu akan lanjut ke fase pembelajaran STRIDE.</p>
          </div>
          <button
            class="btn-primary px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            :disabled="!allAnswered"
            @click="submitPhase1"
          >
            Submit & Continue to STRIDE →
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Submit confirm modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);">
        <div class="card p-8 max-w-md w-full space-y-5" style="border-color: rgba(255,107,157,0.3);">
          <div class="text-center space-y-3">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style="background: rgba(255,107,157,0.1); border: 1px solid rgba(255,107,157,0.3);">
              <IconEye size="28" stroke="1.5" style="color: #FF6B9D;" />
            </div>
            <h3 class="text-xl font-bold">Submit Blind Review?</h3>
            <p class="text-sm" style="color: var(--color-text-secondary);">
              Once submitted, your answers will be locked and you will proceed to the
              <strong style="color: #7C6FFF;">STRIDE learning phase</strong>.
              Answers cannot be modified after submission.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button class="btn-ghost py-3 text-sm" @click="showConfirm = false">Back & Edit</button>
            <button class="btn-primary py-3 text-sm" @click="confirmSubmit">
              Yes, Submit →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore, type BlindAnswer } from '@/stores/progress'
import { scenarios } from '@/data'
import { IconFileText, IconAlertTriangle, IconCheck, IconEye } from '@/icons'
import ScenarioCard from '@/components/ScenarioCard.vue'

const router = useRouter()
const store = useProgressStore()
const showConfirm = ref(false)

// Initialize answers from store or fresh
const answers = ref<BlindAnswer[]>(
  scenarios.map(sc => {
    const existing = store.getBlindAnswerForScenario(sc.id)
    return existing ?? {
      scenarioId: sc.id,
      answerMode: 'freetext' as const,
      freeText: '',
      threats: [],
      tableRows: [],
    }
  })
)

function getAnswer(id: string) {
  return answers.value.find(a => a.scenarioId === id)!
}

function updateAnswer(updated: BlindAnswer) {
  const idx = answers.value.findIndex(a => a.scenarioId === updated.scenarioId)
  if (idx !== -1) answers.value[idx] = updated
}

const answeredCount = computed(() =>
  answers.value.filter(a => {
    if (a.answerMode === 'freetext') return a.freeText && a.freeText.trim().length > 10
    return a.tableRows && a.tableRows.some(r => r.threat.trim())
  }).length
)

const allAnswered = computed(() => answeredCount.value === scenarios.length)

function submitPhase1() {
  if (!allAnswered.value) return
  showConfirm.value = true
}

function confirmSubmit() {
  store.submitBlindAnswers(answers.value)
  showConfirm.value = false
  router.push('/phase/2')
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div { transform: scale(0.95); }
</style>
