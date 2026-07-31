<template>
  <div class="min-h-screen pt-20 pb-20 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="animate-fade-up mb-10 text-center">
        <div class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-md mb-5"
          style="background: #FEF3E0; border: 1px solid #F9D49A; color: #925C00;">
          <IconChartBar size="14" /> Analysis Complete
        </div>
        <h1 class="text-4xl font-black mb-3" style="color: #0C0C0A;">Security Review Analysis</h1>
        <p class="text-sm" style="color: var(--color-text-secondary);">
          Hi <strong style="color: #0C0C0A;">{{ store.userName }}</strong> —
          here's a comparison of your Blind Review vs STRIDE-guided findings against PayVault.
        </p>
      </div>

      <!-- Overall Score Card -->
      <div class="animate-fade-in card p-8 mb-8 text-center relative overflow-hidden"
        style="border-left: 4px solid #E8960A;">
        <div class="relative">
          <div class="text-7xl font-black mb-2"
            :style="`color: ${overallScore >= 80 ? '#12A67A' : overallScore >= 60 ? '#E8960A' : '#E8453C'}`">
            {{ overallScore }}%
          </div>
          <div class="text-lg font-bold mb-1" style="color: #0C0C0A;">Overall STRIDE Coverage</div>
          <p class="text-sm" style="color: var(--color-text-secondary);">
            {{ scoreFeedback }}
          </p>
          <div class="flex justify-center gap-8 mt-6 flex-wrap">
            <div class="text-center">
              <div class="text-3xl font-black" style="color: #12A67A;">{{ totalHits }}</div>
              <div class="text-xs mt-1 font-medium" style="color: #4A4A46;">Threats Identified</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-black" style="color: #E8453C;">{{ totalMissed }}</div>
              <div class="text-xs mt-1 font-medium" style="color: #4A4A46;">Threats Missed</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-black" style="color: #E8960A;">{{ totalFalsePositives }}</div>
              <div class="text-xs mt-1 font-medium" style="color: #4A4A46;">False Positives</div>
            </div>
          </div>
        </div>
      </div>

      <!-- STRIDE Coverage Radar -->
      <div class="animate-fade-in grid md:grid-cols-2 gap-6 mb-8">
        <!-- Coverage bars -->
        <div class="card p-6">
          <h2 class="text-sm font-semibold mb-5" style="color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em;">
            Coverage per Kategori STRIDE
          </h2>
          <div class="space-y-4">
            <div v-for="cov in store.strideCoverage" :key="cov.letter" class="space-y-1.5">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold font-mono" :style="`color: ${strideData[cov.letter as keyof typeof strideData].color}`">
                    {{ cov.letter }}
                  </span>
                  <span class="text-xs" style="color: var(--color-text-secondary);">
                    {{ strideData[cov.letter as keyof typeof strideData].name }}
                  </span>
                </div>
                <div class="text-xs font-medium" :style="`color: ${cov.pct >= 100 ? '#4ECDC4' : cov.pct >= 50 ? '#FFB347' : '#FF6B6B'}`">
                  {{ cov.hit }}/{{ cov.total }} ({{ cov.pct }}%)
                </div>
              </div>
              <div class="h-2 rounded-full overflow-hidden" style="background: var(--color-bg-elevated);">
                <div class="h-full rounded-full transition-all duration-700"
                  :style="`width: ${cov.total > 0 ? cov.pct : 0}%; background: ${strideData[cov.letter as keyof typeof strideData].color}`">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG Radar Chart -->
        <div class="card p-6 flex flex-col items-center">
          <h2 class="text-sm font-semibold mb-5 self-start" style="color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em;">
            Radar Coverage
          </h2>
          <svg viewBox="0 0 240 240" class="w-full max-w-[220px]">
            <!-- Grid rings -->
            <polygon v-for="r in [20, 40, 60, 80, 100]" :key="r"
              :points="hexPoints(r, 120, 120)"
              fill="none" stroke="var(--color-border-dim)" stroke-width="0.5" />
            <!-- Axis lines -->
            <line v-for="(_, i) in strideOrder" :key="i"
              :x1="120" :y1="120"
              :x2="axisPoint(i, 100, 120, 120).x"
              :y2="axisPoint(i, 100, 120, 120).y"
              stroke="var(--color-border-dim)" stroke-width="0.5" />
            <!-- Coverage polygon -->
            <polygon
              :points="coveragePoints"
              fill="rgba(124,111,255,0.15)"
              stroke="#7C6FFF"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <!-- Dots -->
            <circle v-for="(letter, i) in strideOrder" :key="'dot-'+i"
              :cx="radarPoint(i, letter, 120, 120).x"
              :cy="radarPoint(i, letter, 120, 120).y"
              r="3"
              :fill="strideData[letter as keyof typeof strideData].color"
            />
            <!-- Labels -->
            <text v-for="(letter, i) in strideOrder" :key="'label-'+i"
              :x="labelPoint(i, 120, 120).x"
              :y="labelPoint(i, 120, 120).y"
              text-anchor="middle" dominant-baseline="middle"
              class="text-xs font-bold"
              font-size="10" font-weight="700" font-family="JetBrains Mono, monospace"
              :fill="strideData[letter as keyof typeof strideData].color">
              {{ letter }}
            </text>
          </svg>
        </div>
      </div>

      <!-- Per-Scenario Analysis -->
      <div class="mb-8">
        <h2 class="text-sm font-semibold uppercase tracking-wider mb-5"
          style="color: var(--color-text-muted);">Analisis Per Skenario</h2>
        <div class="space-y-4">
          <ScenarioResult
            v-for="result in store.analysisResults"
            :key="result.scenarioId"
            :result="result"
          />
        </div>
      </div>

      <!-- Key Takeaways -->
      <div class="animate-fade-in card p-6 mb-8" style="border-color: rgba(124,111,255,0.3);">
        <h2 class="text-sm font-semibold uppercase tracking-wider mb-4"
          style="color: var(--color-text-muted); display: flex; align-items: center; gap: 0.5rem;">
          <IconKey size="14" /> Key Takeaways
        </h2>
        <div class="space-y-3">
          <div v-for="(takeaway, i) in keyTakeaways" :key="i"
            class="flex items-start gap-3 text-sm">
            <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              :style="`background: ${takeaway.color}22; color: ${takeaway.color}; border: 1px solid ${takeaway.color}44`">
              {{ i + 1 }}
            </span>
            <span style="color: var(--color-text-secondary);">{{ takeaway.text }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 justify-center">
        <button class="btn-ghost text-sm" style="display: inline-flex; align-items: center; gap: 0.5rem;"
          @click="store.resetSession(); $router.push('/')">
          <IconRefresh size="14" /> Reset Session
        </button>
        <button class="btn-primary text-sm" style="display: inline-flex; align-items: center; gap: 0.5rem;" @click="downloadReport">
          <IconDownload size="14" /> Export Report
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { strideData } from '@/data'
import ScenarioResult from '@/components/ScenarioResult.vue'
import { IconChartBar, IconKey, IconRefresh, IconDownload } from '@/icons'

const store = useProgressStore()
const strideOrder = ['S', 'T', 'R', 'I', 'D', 'E']

const totalHits = computed(() =>
  store.analysisResults.reduce((acc, r) => acc + r.correctHits.length, 0))
const totalMissed = computed(() =>
  store.analysisResults.reduce((acc, r) => acc + r.missed.length, 0))
const totalFalsePositives = computed(() =>
  store.analysisResults.reduce((acc, r) => acc + r.falsePositives.length, 0))

const overallScore = computed(() => {
  const avg = store.analysisResults.reduce((acc, r) => acc + r.score, 0)
  return Math.round(avg / (store.analysisResults.length || 1))
})

const scoreFeedback = computed(() => {
  if (overallScore.value >= 80) return 'Excellent! Kamu sangat teliti dalam mengidentifikasi ancaman dengan STRIDE.'
  if (overallScore.value >= 60) return 'Good! Kamu sudah cukup baik. Ada beberapa ancaman yang masih terlewat.'
  if (overallScore.value >= 40) return 'Fair. STRIDE membantu, tapi masih banyak gap yang perlu diperbaiki.'
  return 'Needs improvement. Pelajari lagi setiap kategori STRIDE dan coba identifikasi fail points-nya.'
})

const keyTakeaways = computed(() => {
  const weakest = [...store.strideCoverage].sort((a, b) => a.pct - b.pct).filter(c => c.total > 0).slice(0, 2)
  const strongest = [...store.strideCoverage].sort((a, b) => b.pct - a.pct).filter(c => c.pct > 0).slice(0, 1)
  const takeaways = []

  if (strongest.length > 0) {
    takeaways.push({ text: `Kamu paling kuat di kategori ${strongest[0].letter} (${strideData[strongest[0].letter as keyof typeof strideData].name}) dengan ${strongest[0].pct}% coverage.`, color: '#4ECDC4' })
  }
  if (weakest.length > 0) {
    takeaways.push({ text: `Fokus untuk meningkatkan pemahaman di ${weakest[0].letter} (${strideData[weakest[0].letter as keyof typeof strideData].name}) — coverage masih ${weakest[0].pct}%.`, color: '#FF6B6B' })
  }
  takeaways.push({ text: 'Gunakan STRIDE sebagai checklist di setiap code/API review untuk memastikan tidak ada kategori ancaman yang terlewat.', color: '#7C6FFF' })
  takeaways.push({ text: 'Perhatikan bahwa satu kerentanan bisa masuk ke lebih dari satu kategori STRIDE — ini adalah hal yang normal dan baik untuk diidentifikasi.', color: '#FFB347' })

  return takeaways
})

// Radar chart helpers
function axisPoint(i: number, r: number, cx: number, cy: number) {
  const angle = (i * 60 - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function hexPoints(r: number, cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const p = axisPoint(i, r, cx, cy)
    return `${p.x},${p.y}`
  }).join(' ')
}

function radarPoint(i: number, letter: string, cx: number, cy: number) {
  const cov = store.strideCoverage.find(c => c.letter === letter)
  const pct = cov?.pct ?? 0
  return axisPoint(i, pct, cx, cy)
}

function labelPoint(i: number, cx: number, cy: number) {
  return axisPoint(i, 115, cx, cy)
}

const coveragePoints = computed(() =>
  strideOrder.map((letter, i) => {
    const p = radarPoint(i, letter, 120, 120)
    return `${p.x},${p.y}`
  }).join(' ')
)

function downloadReport() {
  const lines = [
    `STRIDE Security Review Report`,
    `Reviewer: ${store.userName}`,
    `Date: ${new Date().toLocaleDateString('id-ID')}`,
    `Overall Score: ${overallScore.value}%`,
    ``,
    `=== STRIDE Coverage ===`,
    ...store.strideCoverage.map(c => `${c.letter} (${strideData[c.letter as keyof typeof strideData].name}): ${c.hit}/${c.total} = ${c.pct}%`),
    ``,
    `=== Per-Scenario Results ===`,
    ...store.analysisResults.map(r => [
      `[${r.scenarioId}] ${r.scenarioTitle}: ${r.score}%`,
      `  Correct: ${r.correctHits.map(h => h.category + ' - ' + h.title).join(', ') || 'None'}`,
      `  Missed:  ${r.missed.map(h => h.category + ' - ' + h.title).join(', ') || 'None'}`,
    ].join('\n')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `STRIDE_Report_${store.userName}_${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
