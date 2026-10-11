import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scenarios } from '@/data'
import { XP_RULES, levelFor, maxResolveFor } from '@/game/stride'
import { tr } from '@/i18n'

export type StrideCategory = 'S' | 'T' | 'R' | 'I' | 'D' | 'E'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface FiledConcern {
  id: string
  category: StrideCategory
  title: string
  explanation: string
  severity: Severity
}

export interface XpBreakdown {
  correct: number
  severity: number
  evidence: number
  hints: number
  falsePositives: number
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
  evidenceFound: number[] // indices into scenario.details
  hintsUsed: number
  breakdown: XpBreakdown | null
}

export interface GameState {
  playerName: string
  playerColor: string
  gameStarted: boolean
  gameCompleted: boolean
  totalXP: number
  cases: CaseProgress[]
  completedModules: string[]
  quizScores: Record<string, number>
  briefingSeen: boolean
  visitedRooms: string[]
  lastPos: { x: number; y: number } | null
  prologueSeen: boolean
  scenesSeen: string[]
  wardensDown: string[]
  resolve: number
  finaleDone: boolean
  unlocked: string[]
  storyClues: string[]
  puzzlesDone: string[]
}

const PLAYER_COLORS = [
  { id: 'red',    hex: '#C8442F', label: tr('Brick', 'Bata') },
  { id: 'blue',   hex: '#3567B4', label: tr('Cobalt', 'Kobalt') },
  { id: 'green',  hex: '#3D8A5C', label: tr('Fern', 'Pakis') },
  { id: 'purple', hex: '#7552C2', label: tr('Violet', 'Ungu') },
  { id: 'orange', hex: '#D98A1F', label: tr('Ochre', 'Oker') },
  { id: 'teal',   hex: '#2A8B8B', label: tr('Teal', 'Toska') },
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
    evidenceFound: [],
    hintsUsed: 0,
    breakdown: null,
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

  const completedModules = ref<string[]>([])
  const quizScores       = ref<Record<string, number>>({})

  const briefingSeen = ref(false)
  const visitedRooms = ref<string[]>([])
  const lastPos      = ref<{ x: number; y: number } | null>(null)

  // Story
  const prologueSeen = ref(false)
  const scenesSeen   = ref<string[]>([])
  const wardensDown  = ref<string[]>([])
  const resolve      = ref(maxResolveFor(1))
  const finaleDone   = ref(false)
  const unlocked     = ref<string[]>(['home'])   // places on the city map
  const storyClues   = ref<string[]>([])         // clues and conversations outside the office
  const puzzlesDone  = ref<string[]>([])

  // ── Computed ──

  const solvedCount = computed(() => cases.value.filter(c => c.solved).length)
  const allSolved   = computed(() => solvedCount.value === scenarios.length)

  const phase2Progress = computed(() => (completedModules.value.length / 6) * 100)
  const phase2Completed = computed(() => completedModules.value.length === 6)

  const level      = computed(() => levelFor(totalXP.value))
  const maxResolve = computed(() => maxResolveFor(level.value))

  const evidenceTotal = computed(() => scenarios.reduce((a, s) => a + s.details.length, 0))
  const evidenceCount = computed(() => cases.value.reduce((a, c) => a + c.evidenceFound.length, 0))

  const overallAccuracy = computed(() => {
    const solved = cases.value.filter(c => c.solved)
    if (!solved.length) return 0
    return Math.round(solved.reduce((a, c) => a + c.score, 0) / solved.length)
  })

  const letterGrade = computed(() => {
    const acc = overallAccuracy.value
    if (acc >= 90) return { grade: 'S', label: 'Master Detective', color: '#3D9A6C' }
    if (acc >= 75) return { grade: 'A', label: 'Senior Analyst',   color: '#3567B4' }
    if (acc >= 60) return { grade: 'B', label: 'Junior Analyst',   color: '#CC8419' }
    if (acc >= 45) return { grade: 'C', label: 'Trainee',          color: '#CF4630' }
    return              { grade: 'F', label: 'Needs More Study',   color: '#7B7466' }
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
    resetGame()
    playerName.value  = name
    playerColor.value = color
    gameStarted.value = true
    save()
  }

  function visitCase(scenarioId: string) {
    const c = cases.value.find(c => c.scenarioId === scenarioId)
    if (c && !c.visited) { c.visited = true; save() }
  }

  function visitRoom(roomId: string) {
    if (!visitedRooms.value.includes(roomId)) {
      visitedRooms.value.push(roomId)
      save()
    }
  }

  /** Returns true if this was a new find. */
  function findEvidence(scenarioId: string, index: number) {
    const c = cases.value.find(c => c.scenarioId === scenarioId)
    if (!c || c.evidenceFound.includes(index)) return false
    c.evidenceFound.push(index)
    c.visited = true
    save()
    return true
  }

  function useHint(scenarioId: string) {
    const c = cases.value.find(c => c.scenarioId === scenarioId)
    const s = scenarios.find(s => s.id === scenarioId)
    if (!c || !s || c.solved || c.hintsUsed >= s.hints.length) return
    c.hintsUsed++
    save()
  }

  function solveCase(scenarioId: string, filedConcerns: FiledConcern[]) {
    const c = cases.value.find(c => c.scenarioId === scenarioId)
    if (!c || c.solved) return

    const scenario    = scenarios.find(s => s.id === scenarioId)!
    const groundTruth = scenario.groundTruth

    const filedCats = filedConcerns.map(f => f.category)
    const truthCats = groundTruth.map(g => g.category)

    const correct        = truthCats.filter(cat => filedCats.includes(cat))
    const missed         = truthCats.filter(cat => !filedCats.includes(cat))
    const falsePositives = filedCats.filter(cat => !truthCats.includes(cat))

    let severityMatches = 0
    filedConcerns.forEach(concern => {
      const matched = groundTruth.find(gt => gt.category === concern.category)
      if (matched && matched.severity === concern.severity) severityMatches++
    })

    const breakdown: XpBreakdown = {
      correct:        correct.length * XP_RULES.correct,
      severity:       severityMatches * XP_RULES.severityMatch,
      evidence:       c.evidenceFound.length * XP_RULES.evidence,
      hints:          c.hintsUsed * XP_RULES.hint,
      falsePositives: falsePositives.length * XP_RULES.falsePositive,
    }
    const xp = Math.max(0, Object.values(breakdown).reduce((a, b) => a + b, 0))
    const score = groundTruth.length > 0
      ? Math.round((correct.length / groundTruth.length) * 100)
      : 0

    c.filedConcerns  = filedConcerns
    c.solved         = true
    c.visited        = true
    c.correct        = correct
    c.missed         = missed
    c.falsePositives = falsePositives
    c.score          = score
    c.xpEarned       = xp
    c.breakdown      = breakdown
    totalXP.value   += xp

    if (allSolved.value && !gameCompleted.value) {
      gameCompleted.value = true
      totalXP.value += XP_RULES.completion
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

  function markBriefingSeen() {
    briefingSeen.value = true
    save()
  }

  function setLastPos(x: number, y: number) {
    lastPos.value = { x: Math.round(x), y: Math.round(y) }
    save()
  }

  function markPrologueSeen() {
    prologueSeen.value = true
    save()
  }

  /** Returns true the first time a scene id is marked. */
  function markScene(id: string) {
    if (scenesSeen.value.includes(id)) return false
    scenesSeen.value.push(id)
    save()
    return true
  }

  function defeatWarden(id: string) {
    if (wardensDown.value.includes(id)) return
    wardensDown.value.push(id)
    totalXP.value += XP_RULES.warden
    save()
  }

  function damage(n: number) {
    resolve.value = Math.max(0, resolve.value - n)
    save()
  }

  function restoreResolve() {
    resolve.value = maxResolve.value
    save()
  }

  /** Returns true if the place is new. */
  function unlock(place: string) {
    if (unlocked.value.includes(place)) return false
    unlocked.value.push(place)
    save()
    return true
  }

  /** Returns true the first time a clue is examined. */
  function findClue(id: string) {
    if (storyClues.value.includes(id)) return false
    storyClues.value.push(id)
    totalXP.value += XP_RULES.clue
    save()
    return true
  }

  /** Returns the XP awarded (0 if it was already solved). */
  function solvePuzzle(id: string, attempts: number) {
    if (puzzlesDone.value.includes(id)) return 0
    const xp = XP_RULES.puzzle[Math.min(attempts, XP_RULES.puzzle.length) - 1]
    puzzlesDone.value.push(id)
    totalXP.value += xp
    save()
    return xp
  }

  function finishFinale() {
    finaleDone.value = true
    save()
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
    briefingSeen.value = false
    visitedRooms.value = []
    lastPos.value      = null
    prologueSeen.value = false
    scenesSeen.value   = []
    wardensDown.value  = []
    resolve.value      = maxResolveFor(1)
    finaleDone.value   = false
    unlocked.value     = ['home']
    storyClues.value   = []
    puzzlesDone.value  = []
    try { localStorage.removeItem('stride_game') } catch { /* noop */ }
  }

  function save() {
    try {
      const state: GameState = {
        playerName: playerName.value,
        playerColor: playerColor.value,
        gameStarted: gameStarted.value,
        gameCompleted: gameCompleted.value,
        totalXP: totalXP.value,
        cases: cases.value,
        completedModules: completedModules.value,
        quizScores: quizScores.value,
        briefingSeen: briefingSeen.value,
        visitedRooms: visitedRooms.value,
        lastPos: lastPos.value,
        prologueSeen: prologueSeen.value,
        scenesSeen: scenesSeen.value,
        wardensDown: wardensDown.value,
        resolve: resolve.value,
        finaleDone: finaleDone.value,
        unlocked: unlocked.value,
        storyClues: storyClues.value,
        puzzlesDone: puzzlesDone.value,
      }
      localStorage.setItem('stride_game', JSON.stringify(state))
    } catch { /* noop */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem('stride_game')
      if (!raw) return
      const d = JSON.parse(raw) as Partial<GameState>
      playerName.value    = d.playerName    ?? ''
      playerColor.value   = d.playerColor   ?? PLAYER_COLORS[0].hex
      gameStarted.value   = d.gameStarted   ?? false
      gameCompleted.value = d.gameCompleted ?? false
      totalXP.value       = d.totalXP       ?? 0
      // Merge per scenario so saves from older versions pick up new fields.
      cases.value = scenarios.map(s => ({
        ...newCaseProgress(s.id),
        ...(d.cases?.find(c => c.scenarioId === s.id) ?? {}),
      }))
      completedModules.value = d.completedModules ?? []
      quizScores.value    = d.quizScores    ?? {}
      briefingSeen.value  = d.briefingSeen  ?? false
      visitedRooms.value  = d.visitedRooms  ?? []
      lastPos.value       = d.lastPos       ?? null
      prologueSeen.value  = d.prologueSeen  ?? false
      scenesSeen.value    = d.scenesSeen    ?? []
      wardensDown.value   = d.wardensDown   ?? []
      resolve.value       = Math.min(d.resolve ?? maxResolve.value, maxResolve.value)
      finaleDone.value    = d.finaleDone    ?? false
      // saves from before the city existed were already inside the office
      unlocked.value      = d.unlocked      ?? (d.gameStarted ? ['home', 'kost', 'campus', 'hq'] : ['home'])
      // the campus was added after the office could already be open
      if (unlocked.value.includes('hq') && !unlocked.value.includes('campus')) unlocked.value.push('campus')
      storyClues.value    = d.storyClues    ?? []
      puzzlesDone.value   = d.puzzlesDone   ?? []
    } catch { /* noop */ }
  }

  return {
    playerName, playerColor, gameStarted, gameCompleted,
    totalXP, cases, completedModules, quizScores,
    briefingSeen, visitedRooms, lastPos,
    prologueSeen, scenesSeen, wardensDown, resolve, finaleDone, level, maxResolve,
    unlocked, storyClues, puzzlesDone, unlock, findClue, solvePuzzle,
    solvedCount, allSolved, phase2Progress, phase2Completed,
    evidenceTotal, evidenceCount,
    overallAccuracy, letterGrade, strideCoverage,
    startGame, visitCase, visitRoom, findEvidence, useHint, solveCase, completeModule,
    getCase, markBriefingSeen, setLastPos,
    markPrologueSeen, markScene, defeatWarden, damage, restoreResolve, finishFinale,
    resetGame, save, load,
  }
})
