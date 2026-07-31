<template>
  <div class="card overflow-hidden">
    <button class="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all"
      @click="isExpanded = !isExpanded">
      <!-- Score ring -->
      <div class="w-12 h-12 flex-shrink-0 relative">
        <svg viewBox="0 0 40 40" class="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border-dim)" stroke-width="3" />
          <circle cx="20" cy="20" r="16" fill="none"
            :stroke="scoreColor"
            stroke-width="3"
            stroke-linecap="round"
            :stroke-dasharray="`${result.score} ${100 - result.score}`"
            stroke-dashoffset="0"
            pathLength="100" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-xs font-bold"
          :style="`color: ${scoreColor}`">
          {{ result.score }}%
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm">{{ result.scenarioTitle }}</div>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <span v-for="h in result.correctHits" :key="h.category"
            class="text-xs px-1.5 py-0.5 rounded font-mono font-bold"
            :style="`background: ${strideData[h.category].bgColor}; color: ${strideData[h.category].color}; border: 1px solid ${strideData[h.category].borderColor}`">
            {{ h.category }}
          </span>
          <span v-for="m in result.missed" :key="m.category"
            class="text-xs px-1.5 py-0.5 rounded font-mono font-bold opacity-60"
            style="background: var(--color-bg-elevated); color: var(--color-text-muted); border: 1px solid var(--color-border-dim); text-decoration: line-through;">
            {{ m.category }}
          </span>
        </div>
      </div>
      <span class="transition-transform duration-200 text-gray-500 flex-shrink-0" :class="{ 'rotate-180': isExpanded }">▼</span>
    </button>

    <Transition name="expand">
      <div v-if="isExpanded" class="border-t" style="border-color: var(--color-border);">
        <div class="p-5 space-y-5">
          <!-- Correct hits -->
          <div v-if="result.correctHits.length > 0">
            <h3 class="text-xs font-semibold uppercase tracking-wider mb-3"
              style="color: #12A67A; display: flex; align-items: center; gap: 0.4rem;">
              <IconCheck size="12" /> Threats Identified
            </h3>
            <div class="space-y-2">
              <div v-for="h in result.correctHits" :key="h.category + h.title"
                class="flex items-start gap-3 p-3 rounded-xl"
                style="background: #E6F6F1; border: 1px solid #9FD9C6;">
                <span class="text-xs px-2 py-0.5 rounded font-mono font-bold flex-shrink-0"
                  :style="`background: ${strideData[h.category].bgColor}; color: ${strideData[h.category].color}; border: 1px solid ${strideData[h.category].borderColor}`">
                  {{ h.category }}
                </span>
                <div>
                  <div class="text-sm font-medium" style="color: var(--color-text-primary);">{{ h.title }}</div>
                  <div class="text-xs mt-1 leading-relaxed" style="color: var(--color-text-secondary);">{{ h.explanation }}</div>
                  <span class="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                    :style="severityStyle(h.severity)">
                    {{ h.severity }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Missed threats -->
          <div v-if="result.missed.length > 0">
            <h3 class="text-xs font-semibold uppercase tracking-wider mb-3"
              style="color: #E8453C; display: flex; align-items: center; gap: 0.4rem;">
              <IconX size="12" /> Threats Missed
            </h3>
            <div class="space-y-2">
              <div v-for="m in result.missed" :key="m.category + m.title"
                class="flex items-start gap-3 p-3 rounded-xl"
                style="background: #FDECEA; border: 1px solid #F5B8B5;">
                <span class="text-xs px-2 py-0.5 rounded font-mono font-bold flex-shrink-0"
                  :style="`background: ${strideData[m.category].bgColor}; color: ${strideData[m.category].color}; border: 1px solid ${strideData[m.category].borderColor}`">
                  {{ m.category }}
                </span>
                <div>
                  <div class="text-sm font-medium" style="color: var(--color-text-primary);">{{ m.title }}</div>
                  <div class="text-xs mt-1 leading-relaxed" style="color: var(--color-text-secondary);">{{ m.explanation }}</div>
                  <span class="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                    :style="severityStyle(m.severity)">
                    {{ m.severity }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- False positives -->
          <div v-if="result.falsePositives.length > 0">
            <h3 class="text-xs font-semibold uppercase tracking-wider mb-3"
              style="color: #E8960A; display: flex; align-items: center; gap: 0.4rem;">
              <IconZap size="12" /> False Positives
            </h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="fp in result.falsePositives" :key="fp"
                class="text-xs px-2 py-0.5 rounded font-mono font-bold"
                :style="`background: ${strideData[fp as keyof typeof strideData].bgColor}; color: ${strideData[fp as keyof typeof strideData].color}; border: 1px solid ${strideData[fp as keyof typeof strideData].borderColor}`">
                {{ fp }} — {{ strideData[fp as keyof typeof strideData].name }}
              </span>
            </div>
          </div>

          <!-- User's guided findings -->
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider mb-3"
              style="color: var(--color-text-muted); display: flex; align-items: center; gap: 0.4rem;">
              <IconNote size="12" /> Your Findings
            </h3>
            <div class="space-y-2 text-xs" style="color: var(--color-text-secondary);">
              <div v-for="sc in guidedAnswer?.strideCategories.filter(c => c.selected)" :key="sc.category"
                class="p-3 rounded-xl" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border-dim);">
                <span class="font-bold font-mono mr-2" :style="`color: ${strideData[sc.category].color}`">{{ sc.category }}</span>
                <span class="font-medium" style="color: var(--color-text-primary);">{{ strideData[sc.category].name }}</span>
                <span v-if="sc.severity" class="ml-2 px-1.5 py-0.5 rounded text-xs" :style="severityStyle(sc.severity)">
                  {{ sc.severity }}
                </span>
                <p v-if="sc.finding" class="mt-1 text-xs" style="color: var(--color-text-muted);">{{ sc.finding }}</p>
                <p v-if="sc.recommendation" class="mt-1 text-xs italic" style="color: var(--color-text-muted);">→ {{ sc.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { strideData } from '@/data'
import { IconCheck, IconX, IconZap, IconNote } from '@/icons'

const props = defineProps<{
  result: {
    scenarioId: string
    scenarioTitle: string
    score: number
    correctHits: any[]
    missed: any[]
    falsePositives: string[]
    blindText: string
  }
}>()

const isExpanded = ref(false)
const store = useProgressStore()

const guidedAnswer = computed(() => store.getGuidedAnswerForScenario(props.result.scenarioId))

const scoreColor = computed(() => {
  if (props.result.score >= 80) return '#12A67A'
  if (props.result.score >= 50) return '#E8960A'
  return '#E8453C'
})

function severityStyle(sev: string) {
  const map: Record<string, string> = {
    Critical: 'background: #FDECEA; color: #B53028; border: 1px solid #F5B8B5',
    High: 'background: #FEF3E0; color: #925C00; border: 1px solid #F9D49A',
    Medium: 'background: #E8F1FC; color: #155FA0; border: 1px solid #9DC3ED',
    Low: 'background: #ECF5EE; color: #2E6B4A; border: 1px solid #A5CDB5',
  }
  return map[sev] ?? ''
}
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
.expand-enter-to, .expand-leave-from { max-height: 3000px; opacity: 1; }
</style>
