import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scenarios } from '@/data'

export type StrideCategory = 'S' | 'T' | 'R' | 'I' | 'D' | 'E'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface FiledConcern {
  id: string
  category: StrideCategory
  title: string
  explanation: string
  severity: Severity
}

export interface CaseProgress {
  scenarioId: string
  visited: boolean
  solved: boolean
  filedConcerns: FiledConcern[]
  score: number           // 0-100
  xpEarned: number
  correct: string[]       // categories correctly identified
  missed: string[]        // categories missed
  falsePositives: string[] // categories incorrectly filed
}

export interface GameState {
  playerName: string
  playerColor: string
  gameStarted: boolean
  gameCompleted: boolean
  totalXP: number
  cases: CaseProgress[]
  // STRIDE learning progress (reused from old system)
  completedModules: string[]
  quizScores: Record<string, number>
}

const PLAYER_COLORS = [
  { id: 'red',    hex: '#E8453C', label: 'Red' },
  { id: 'blue',   hex: '#2276D2', label: 'Blue' },
  { id: 'green',  hex: '#12A67A', label: 'Green' },
  { id: 'purple', hex: '#7B41E0', label: 'Purple' },
  { id: 'orange', hex: '#E8960A', label: 'Orange' },
  { id: 'teal',   hex: '#52A882', label: 'Teal' },
]

export { PLAYER_COLORS }

function newCaseProgress(scenarioId: string): CaseProgress {
  return {
    scenarioId,
    visited: false,
    solved: false,
    filedConcerns: [],
    score: 0,
    xpEarned: 0,
    correct: [],
    missed: [],
    falsePositives: [],
  }
}

export const useGameStore = defineStore('game', () => {
  const playerName   = ref('')
  const playerColor  = ref(PLAYER_COLORS[0].hex)
  const gameStarted  = ref(false)
  const gameCompleted = ref(false)
  const totalXP      = ref(0)

  const cases = ref<CaseProgress[]>(
    scenarios.map(s => newCaseProgress(s.id))
  )

  // STRIDE learning (keep progress from old system)
  const completedModules = ref<string[]>([])
  const quizScores       = ref<Record<string, number>>({})

  // ── Computed ──

  const solvedCount = computed(() => cases.value.filter(c => c.solved).length)
  const allSolved   = computed(() => solvedCount.value === scenarios.length)

  const phase2Progress = computed(() => (completedModules.value.length / 6) * 100)
  const phase2Completed = computed(() => completedModules.value.length === 6)

  const overallAccuracy = computed(() => {
    const solved = cases.value.filter(c => c.solved)
    if (!solved.length) return 0
    return Math.round(solved.reduce((a, c) => a + c.score, 0) / solved.length)
  })

  const letterGrade = computed(() => {
    const acc = overallAccuracy.value
    if (acc >= 90) return { grade: 'S', label: 'Master Detective', color: '#12A67A' }
    if (acc >= 75) return { grade: 'A', label: 'Senior Analyst',   color: '#2276D2' }
    if (acc >= 60) return { grade: 'B', label: 'Junior Analyst',   color: '#E8960A' }
    if (acc >= 45) return { grade: 'C', label: 'Trainee',          color: '#E8453C' }
    return              { grade: 'F', label: 'Needs More Study',   color: '#8A8A84' }
  })

  // Per-category coverage across all cases
  const strideCoverage = computed(() => {
    const letters = ['S', 'T', 'R', 'I', 'D', 'E'] as StrideCategory[]
    return letters.map(letter => {
      const total = scenarios.reduce((acc, sc) =>
        acc + sc.groundTruth.filter(gt => gt.category === letter).length, 0)
      const hit = cases.value.reduce((acc, c) =>
        acc + c.correct.filter(cat => cat === letter).length, 0)
      return {
        letter,
        total,
        hit,
        pct: total > 0 ? Math.round((hit / total) * 100) : 0,
      }
    })
  })

  // ── Actions ──

  function startGame(name: string, color: string) {
    playerName.value  = name
    playerColor.value = color
    gameStarted.value = true
    save()
  }

  function visitCase(scenarioId: string) {
    const c = cases.value.find(c => c.scenarioId === scenarioId)
    if (c) { c.visited = true; save() }
  }

  function solveCase(scenarioId: string, filedConcerns: FiledConcern[]) {
    const c = cases.value.find(c => c.scenarioId === scenarioId)
    if (!c) return

    const scenario    = scenarios.find(s => s.id === scenarioId)!
    const groundTruth = scenario.groundTruth

    const filedCats = filedConcerns.map(f => f.category)
    const truthCats = groundTruth.map(g => g.category)

    const correct       = truthCats.filter(cat => filedCats.includes(cat))
    const missed        = truthCats.filter(cat => !filedCats.includes(cat))
    const falsePositives = filedCats.filter(cat => !truthCats.includes(cat))

    // Severity bonus
    let severityBonus = 0
    filedConcerns.forEach(concern => {
      const matched = groundTruth.find(gt => gt.category === concern.category)
      if (matched && matched.severity === concern.severity) severityBonus += 50
    })

    const baseXP  = correct.length * 200
    const penalty = falsePositives.length * 50
    const xp      = Math.max(0, baseXP + severityBonus - penalty)
    const score   = groundTruth.length > 0
      ? Math.round((correct.length / groundTruth.length) * 100)
      : 0

    c.filedConcerns = filedConcerns
    c.solved         = true
    c.correct        = correct
    c.missed         = missed
    c.falsePositives = falsePositives
    c.score          = score
    c.xpEarned       = xp
    totalXP.value   += xp

    if (allSolved.value) {
      gameCompleted.value = true
      totalXP.value += 500 // completion bonus
    }
    save()
  }

  function completeModule(letter: string, score: number) {
    if (!completedModules.value.includes(letter)) {
      completedModules.value.push(letter)
    }
    quizScores.value[letter] = score
    save()
  }

  function getCase(id: string) {
    return cases.value.find(c => c.scenarioId === id)
  }

  function resetGame() {
    playerName.value   = ''
    playerColor.value  = PLAYER_COLORS[0].hex
    gameStarted.value  = false
    gameCompleted.value = false
    totalXP.value      = 0
    cases.value        = scenarios.map(s => newCaseProgress(s.id))
    completedModules.value = []
    quizScores.value   = {}
    localStorage.removeItem('stride_game')
  }

  function save() {
    try {
      localStorage.setItem('stride_game', JSON.stringify({
        playerName: playerName.value,
        playerColor: playerColor.value,
        gameStarted: gameStarted.value,
        gameCompleted: gameCompleted.value,
        totalXP: totalXP.value,
        cases: cases.value,
        completedModules: completedModules.value,
        quizScores: quizScores.value,
      }))
    } catch { /* noop */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem('stride_game')
      if (!raw) return
      const d = JSON.parse(raw) as GameState
      playerName.value    = d.playerName    ?? ''
      playerColor.value   = d.playerColor   ?? PLAYER_COLORS[0].hex
      gameStarted.value   = d.gameStarted   ?? false
      gameCompleted.value = d.gameCompleted ?? false
      totalXP.value       = d.totalXP       ?? 0
      cases.value         = d.cases         ?? scenarios.map(s => newCaseProgress(s.id))
      completedModules.value = d.completedModules ?? []
      quizScores.value    = d.quizScores    ?? {}
    } catch { /* noop */ }
  }

  return {
    playerName, playerColor, gameStarted, gameCompleted,
    totalXP, cases, completedModules, quizScores,
    solvedCount, allSolved, phase2Progress, phase2Completed,
    overallAccuracy, letterGrade, strideCoverage,
    startGame, visitCase, solveCase, completeModule,
    getCase, resetGame, save, load,
  }
})
