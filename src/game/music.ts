// Background score.
//
// For each mood the game first looks for a recorded track at
// /music/<mood>.mp3 (drop files into public/music/ to use your own). If there
// is none, it plays a quiet generated score instead: slow pads and a few
// sparse notes, different for every place.

import { audioGraph, isMuted } from './audio'

export type Mood = 'home' | 'kost' | 'campus' | 'hq' | 'fight' | 'finale' | 'story'

interface Score { bar: number; chords: number[][]; scale: number[]; notes: number; pulse?: number; wave: OscillatorType }

const N = (semi: number) => 220 * 2 ** (semi / 12)   // semitones from A3

// Each chord is a list of semitone offsets; one chord per bar, looping.
const SCORES: Record<Mood, Score> = {
  home:   { bar: 4.8, wave: 'triangle', notes: 2, chords: [[-12, 3, 7], [-16, 0, 7], [-9, 3, 8], [-14, 2, 7]],   scale: [12, 15, 19, 22, 24] },
  kost:   { bar: 5.2, wave: 'sine',     notes: 2, chords: [[-12, 0, 7], [-17, 2, 5], [-14, 3, 10], [-12, 3, 7]], scale: [12, 14, 15, 19, 22] },
  campus: { bar: 5.6, wave: 'sine',     notes: 1, chords: [[-19, 0, 5], [-17, 2, 7], [-21, 0, 3], [-19, 2, 5]],  scale: [10, 12, 15, 17, 22] },
  hq:     { bar: 4.4, wave: 'sawtooth', notes: 1, chords: [[-24, -12, 3], [-23, -11, 2], [-24, -12, 1], [-26, -14, 3]], scale: [12, 13, 15, 19], pulse: 2 },
  fight:  { bar: 2.4, wave: 'sawtooth', notes: 2, chords: [[-24, -12, 3], [-24, -12, 6], [-23, -11, 3], [-26, -14, 1]], scale: [12, 15, 18, 19, 24], pulse: 8 },
  finale: { bar: 3.6, wave: 'triangle', notes: 2, chords: [[-24, -12, 0], [-21, -9, 3], [-19, -7, 5], [-24, -12, 7]],  scale: [12, 15, 19, 24, 27], pulse: 4 },
  story:  { bar: 5.4, wave: 'sine',     notes: 1, chords: [[-12, 3, 7], [-14, 2, 5], [-17, 0, 3], [-12, 0, 7]],  scale: [12, 15, 19, 22] },
}

let mood: Mood | null = null
let timer = 0
let bus: GainNode | null = null
let track: HTMLAudioElement | null = null
const hasFile: Partial<Record<Mood, boolean>> = {}

function stopSynth() {
  clearTimeout(timer); timer = 0
  const { ctx } = audioGraph()
  if (bus && ctx) {
    const old = bus
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
    window.setTimeout(() => old.disconnect(), 2500)
  }
  bus = null
}

function playSynth(m: Mood) {
  const { ctx, master } = audioGraph()
  if (!ctx || !master) return
  const s = SCORES[m]
  bus = ctx.createGain()
  bus.gain.setValueAtTime(0, ctx.currentTime)
  bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'; lp.frequency.value = m === 'fight' ? 1400 : 900
  bus.connect(lp).connect(master)
  const out = bus
  let bar = 0

  const voice = (freq: number, at: number, dur: number, peak: number, type: OscillatorType, attack: number) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(g).connect(out)
    o.start(at); o.stop(at + dur + 0.1)
  }

  const schedule = () => {
    if (bus !== out) return
    const t0 = ctx.currentTime + 0.1
    const chord = s.chords[bar % s.chords.length]
    for (const semi of chord) voice(N(semi), t0, s.bar * 1.15, 0.022, s.wave, s.bar * 0.35)
    for (let i = 0; i < s.notes; i++) {
      if (Math.random() < 0.3) continue
      const semi = s.scale[Math.floor(Math.random() * s.scale.length)]
      voice(N(semi), t0 + Math.random() * s.bar * 0.8, 2.4, 0.03, 'triangle', 0.02)
    }
    if (s.pulse) for (let i = 0; i < s.pulse; i++) voice(N(chord[0]), t0 + (s.bar / s.pulse) * i, 0.22, 0.05, 'sine', 0.01)
    bar++
    timer = window.setTimeout(schedule, s.bar * 1000)
  }
  schedule()
}

function stopTrack() {
  if (!track) return
  const old = track
  track = null
  const fade = window.setInterval(() => {
    old.volume = Math.max(0, old.volume - 0.05)
    if (old.volume <= 0) { clearInterval(fade); old.pause() }
  }, 60)
}

/** Changes the score. Safe to call often; the same mood twice does nothing. */
export function setMood(next: Mood | null) {
  if (next === mood) return
  mood = next
  stopSynth(); stopTrack()
  if (!next) return
  if (hasFile[next] === false) { playSynth(next); return }
  const a = new Audio(`/music/${next}.mp3`)
  a.loop = true
  a.volume = isMuted() ? 0 : 0.45
  const fallback = () => { hasFile[next] = false; if (mood === next && !bus) playSynth(next) }
  a.addEventListener('error', fallback, { once: true })
  a.addEventListener('canplay', () => {
    hasFile[next] = true
    if (mood !== next) return
    track = a
    a.play().catch(fallback)
  }, { once: true })
}

/** Recorded tracks do not pass through the synth's master gain, so mute them here. */
export function syncMusicMute() {
  if (track) track.volume = isMuted() ? 0 : 0.45
}
