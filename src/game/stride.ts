import type { StrideCategory, Severity } from '@/stores/game'
import { tr } from '@/i18n'

export interface StrideMeta {
  letter: StrideCategory
  name: string
  short: string
  question: string
  color: string
}

// One definition for every screen. Colours match the --color-{s..e} tokens.
export const STRIDE: StrideMeta[] = [
  { letter: 'S', name: 'Spoofing',               short: 'Spoofing',    question: tr('Can someone pretend to be another user or system?', 'Bisakah seseorang berpura-pura menjadi pengguna atau sistem lain?'), color: '#C6304E' },
  { letter: 'T', name: 'Tampering',              short: 'Tampering',   question: tr('Can data or logic be modified when it should not be?', 'Bisakah data atau logika diubah padahal seharusnya tidak?'), color: '#C27A00' },
  { letter: 'R', name: 'Repudiation',            short: 'Repudiation', question: tr('Could an action happen without a trustworthy record of who did it?', 'Bisakah suatu tindakan terjadi tanpa catatan tepercaya tentang siapa pelakunya?'), color: '#00897B' },
  { letter: 'I', name: 'Information Disclosure', short: 'Disclosure',  question: tr('Is data exposed to someone who should not see it?', 'Apakah data terbuka bagi orang yang tidak berhak melihatnya?'), color: '#3567B4' },
  { letter: 'D', name: 'Denial of Service',      short: 'DoS',         question: tr('Can the service be exhausted or made unavailable?', 'Bisakah layanan dikuras atau dibuat tidak tersedia?'), color: '#5E8A1E' },
  { letter: 'E', name: 'Elevation of Privilege', short: 'Elevation',   question: tr('Can someone gain rights they were never granted?', 'Bisakah seseorang memperoleh hak yang tidak pernah diberikan?'), color: '#7A4FC8' },
]

export const STRIDE_BY: Record<string, StrideMeta> = Object.fromEntries(STRIDE.map(s => [s.letter, s]))

export const SEVERITIES: { id: Severity; color: string }[] = [
  { id: 'Critical', color: '#B8321F' },
  { id: 'High',     color: '#C26A12' },
  { id: 'Medium',   color: '#8C7A1E' },
  { id: 'Low',      color: '#5E7F63' },
]
export const SEVERITY_COLOR: Record<string, string> = Object.fromEntries(SEVERITIES.map(s => [s.id, s.color]))

export const XP_RULES = {
  correct: 200,
  severityMatch: 50,
  evidence: 20,
  hint: -25,
  falsePositive: -50,
  completion: 500,
  warden: 150,
  clue: 30,
  puzzle: [90, 70, 50],   // by attempt: first try, second, later
}

export function rankFor(xp: number) {
  if (xp >= 3200) return tr('Lead Investigator', 'Penyelidik Utama')
  if (xp >= 2000) return tr('Senior Analyst', 'Analis Senior')
  if (xp >= 900)  return tr('Analyst', 'Analis')
  if (xp >= 250)  return tr('Junior Analyst', 'Analis Junior')
  return tr('Sleepless', 'Belum Tidur')
}

// Levels: each one adds resolve (how many mistakes you can take in an encounter).
export const LEVELS = [0, 250, 600, 1000, 1500, 2100, 2800, 3600]

export function levelFor(xp: number) {
  let level = 1
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) level = i + 1
  return level
}

export function levelProgress(xp: number) {
  const level = levelFor(xp)
  const from = LEVELS[level - 1]
  const to = LEVELS[level] ?? null
  return { level, pct: to === null ? 100 : Math.round(((xp - from) / (to - from)) * 100), next: to }
}

export const maxResolveFor = (level: number) => 50 + level * 10
