import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scenarios } from '@/data'

export type Phase = 0 | 1 | 2 | 3 | 4 // 0=landing, 1=blind review, 2=learning, 3=guided, 4=results

export interface BlindAnswer {
  scenarioId: string
  threats: {
    id: string
    description: string
    category?: string
    severity?: string
  }[]
  tableRows?: {
    asset: string
    threat: string
    impact: string
    notes: string
  }[]
  answerMode: 'freetext' | 'table'
  freeText?: string
}

export interface GuidedAnswer {
  scenarioId: string
  strideCategories: {
    category: 'S' | 'T' | 'R' | 'I' | 'D' | 'E'
    finding: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low'
    recommendation: string
    selected: boolean
  }[]
}

export const useProgressStore = defineStore('progress', () => {
  const currentPhase = ref<Phase>(0)
  const userName = ref('')
  const sessionStarted = ref(false)

  // Phase 1: Blind Review
  const blindAnswers = ref<BlindAnswer[]>([])
  const phase1Submitted = ref(false)

  // Phase 2: STRIDE Learning
  const completedModules = ref<string[]>([]) // ['S', 'T', ...]
  const quizScores = ref<Record<string, number>>({}) // { S: 2, T: 3, ... }
  const phase2Completed = ref(false)

  // Phase 3: Guided Review
  const guidedAnswers = ref<GuidedAnswer[]>([])
  const phase3Submitted = ref(false)

  // Computed
  const canAccessPhase2 = computed(() => phase1Submitted.value)
  const canAccessPhase3 = computed(() => phase2Completed.value)
  const canAccessResults = computed(() => phase3Submitted.value)

  const phase2Progress = computed(() => (completedModules.value.length / 6) * 100)

  const nextUnlockedModule = computed(() => {
    const order = ['S', 'T', 'R', 'I', 'D', 'E']
    for (const m of order) {
      if (!completedModules.value.includes(m)) return m
    }
    return null
  })

  // Actions
  function startSession(name: string) {
    userName.value = name
    sessionStarted.value = true
    currentPhase.value = 1
    saveToStorage()
  }

  function submitBlindAnswers(answers: BlindAnswer[]) {
    blindAnswers.value = answers
    phase1Submitted.value = true
    currentPhase.value = 2
    saveToStorage()
  }

  function completeModule(letter: string, score: number) {
    if (!completedModules.value.includes(letter)) {
      completedModules.value.push(letter)
    }
    quizScores.value[letter] = score
    if (completedModules.value.length === 6) {
      phase2Completed.value = true
      currentPhase.value = 3
    }
    saveToStorage()
  }

  function submitGuidedAnswers(answers: GuidedAnswer[]) {
    guidedAnswers.value = answers
    phase3Submitted.value = true
    currentPhase.value = 4
    saveToStorage()
  }

  function getBlindAnswerForScenario(id: string) {
    return blindAnswers.value.find(a => a.scenarioId === id)
  }

  function getGuidedAnswerForScenario(id: string) {
    return guidedAnswers.value.find(a => a.scenarioId === id)
  }

  // Compute analysis comparing blind vs guided
  const analysisResults = computed(() => {
    if (!phase3Submitted.value) return []
    return scenarios.map(scenario => {
      const blind = blindAnswers.value.find(a => a.scenarioId === scenario.id)
      const guided = guidedAnswers.value.find(a => a.scenarioId === scenario.id)
      const groundTruth = scenario.groundTruth

      const selectedCategories = guided?.strideCategories
        .filter(c => c.selected)
        .map(c => c.category) ?? []

      const correctHits = groundTruth.filter(gt =>
        selectedCategories.includes(gt.category)
      )
      const missed = groundTruth.filter(gt =>
        !selectedCategories.includes(gt.category)
      )
      const falsePositives = selectedCategories.filter(c =>
        !groundTruth.some(gt => gt.category === c)
      )

      const score = groundTruth.length > 0
        ? Math.round((correctHits.length / groundTruth.length) * 100)
        : 0

      return {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        groundTruth,
        blindText: blind?.freeText || '',
        blindTableRows: blind?.tableRows || [],
        blindAnswerMode: blind?.answerMode || 'freetext',
        selectedCategories,
        correctHits,
        missed,
        falsePositives,
        score,
      }
    })
  })

  // Coverage radar per STRIDE letter
  const strideCoverage = computed(() => {
    const letters = ['S', 'T', 'R', 'I', 'D', 'E'] as const
    return letters.map(letter => {
      const totalForLetter = scenarios.reduce((acc, sc) =>
        acc + sc.groundTruth.filter(gt => gt.category === letter).length, 0)

      const hitForLetter = analysisResults.value.reduce((acc, ar) => {
        const hits = ar.correctHits.filter(h => h.category === letter).length
        return acc + hits
      }, 0)

      return {
        letter,
        total: totalForLetter,
        hit: hitForLetter,
        pct: totalForLetter > 0 ? Math.round((hitForLetter / totalForLetter) * 100) : 0,
      }
    })
  })

  function saveToStorage() {
    try {
      localStorage.setItem('stride_progress', JSON.stringify({
        currentPhase: currentPhase.value,
        userName: userName.value,
        sessionStarted: sessionStarted.value,
        blindAnswers: blindAnswers.value,
        phase1Submitted: phase1Submitted.value,
        completedModules: completedModules.value,
        quizScores: quizScores.value,
        phase2Completed: phase2Completed.value,
        guidedAnswers: guidedAnswers.value,
        phase3Submitted: phase3Submitted.value,
      }))
    } catch (e) { /* noop */ }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('stride_progress')
      if (!saved) return
      const data = JSON.parse(saved)
      currentPhase.value = data.currentPhase ?? 0
      userName.value = data.userName ?? ''
      sessionStarted.value = data.sessionStarted ?? false
      blindAnswers.value = data.blindAnswers ?? []
      phase1Submitted.value = data.phase1Submitted ?? false
      completedModules.value = data.completedModules ?? []
      quizScores.value = data.quizScores ?? {}
      phase2Completed.value = data.phase2Completed ?? false
      guidedAnswers.value = data.guidedAnswers ?? []
      phase3Submitted.value = data.phase3Submitted ?? false
    } catch (e) { /* noop */ }
  }

  function resetSession() {
    currentPhase.value = 0
    userName.value = ''
    sessionStarted.value = false
    blindAnswers.value = []
    phase1Submitted.value = false
    completedModules.value = []
    quizScores.value = {}
    phase2Completed.value = false
    guidedAnswers.value = []
    phase3Submitted.value = false
    localStorage.removeItem('stride_progress')
  }

  return {
    currentPhase,
    userName,
    sessionStarted,
    blindAnswers,
    phase1Submitted,
    completedModules,
    quizScores,
    phase2Completed,
    guidedAnswers,
    phase3Submitted,
    canAccessPhase2,
    canAccessPhase3,
    canAccessResults,
    phase2Progress,
    nextUnlockedModule,
    analysisResults,
    strideCoverage,
    startSession,
    submitBlindAnswers,
    completeModule,
    submitGuidedAnswers,
    getBlindAnswerForScenario,
    getGuidedAnswerForScenario,
    saveToStorage,
    loadFromStorage,
    resetSession,
  }
})
