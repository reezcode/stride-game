// Small synthesized sound kit — no asset files. Everything routes through one
// master gain so mute is instant. The context is created on the first user
// gesture (browsers block autoplay before that).

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let hum: { stop: () => void } | null = null

let muted = (() => { try { return localStorage.getItem('stride_muted') === '1' } catch { return false } })()

export function isMuted() { return muted }

export function setMuted(m: boolean) {
  muted = m
  try { localStorage.setItem('stride_muted', m ? '1' : '0') } catch { /* noop */ }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05)
}

export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.9
  master.connect(ctx.destination)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
}

function env(g: GainNode, t: number, a: number, peak: number, dec: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec)
}

function noise(dur: number, filter: BiquadFilterType, freq: number, q: number, peak: number, attack = 0.004) {
  if (!ctx || !master || !noiseBuf) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.playbackRate.value = 0.8 + Math.random() * 0.4
  const f = ctx.createBiquadFilter()
  f.type = filter; f.frequency.value = freq; f.Q.value = q
  const g = ctx.createGain()
  env(g, t, attack, peak, dur)
  src.connect(f).connect(g).connect(master)
  src.start(t, Math.random() * 0.5, dur + attack + 0.05)
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, delay = 0, slideTo?: number) {
  if (!ctx || !master) return
  const t = ctx.currentTime + delay
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  const g = ctx.createGain()
  env(g, t, 0.006, peak, dur)
  o.connect(g).connect(master)
  o.start(t); o.stop(t + dur + 0.05)
}

let stepAlt = false
export const sfx = {
  step(surface: 'hard' | 'soft' = 'hard') {
    stepAlt = !stepAlt
    if (surface === 'soft') noise(0.05, 'lowpass', 520 + (stepAlt ? 60 : 0), 0.7, 0.10)
    else noise(0.045, 'bandpass', 1500 + (stepAlt ? 220 : 0), 1.2, 0.09)
  },
  door() { noise(0.32, 'bandpass', 700, 0.6, 0.05, 0.08) },
  denied() { tone(220, 0.12, 'square', 0.035); tone(165, 0.18, 'square', 0.035, 0.13) },
  blip() { tone(880, 0.06, 'sine', 0.06) },
  pickup() { tone(660, 0.08, 'triangle', 0.08); tone(990, 0.12, 'triangle', 0.07, 0.07) },
  open() { tone(520, 0.05, 'sine', 0.05); tone(780, 0.07, 'sine', 0.05, 0.05); noise(0.08, 'highpass', 3000, 0.5, 0.02) },
  close() { tone(600, 0.06, 'sine', 0.04, 0, 380) },
  paper() { noise(0.12, 'highpass', 2400, 0.4, 0.05, 0.02) },
  stamp() { noise(0.18, 'lowpass', 240, 1, 0.5, 0.002); tone(90, 0.2, 'sine', 0.35, 0, 50) },
  restore() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.25, 'triangle', 0.05, i * 0.07)) },
  alarm() { tone(980, 0.09, 'square', 0.012); tone(740, 0.12, 'square', 0.012, 0.12) },
}

/** Low ventilation drone; quiet enough to sit under everything else. */
export function startAmbience() {
  if (!ctx || !master || hum) return
  const t = ctx.currentTime
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.03, t + 2)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'; lp.frequency.value = 180
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf; src.loop = true
  const o = ctx.createOscillator()
  o.type = 'sine'; o.frequency.value = 55
  const og = ctx.createGain(); og.gain.value = 0.25
  src.connect(lp).connect(g)
  o.connect(og).connect(g)
  g.connect(master)
  src.start(); o.start()
  hum = {
    stop() {
      const n = ctx!.currentTime
      g.gain.setTargetAtTime(0, n, 0.3)
      src.stop(n + 1.5); o.stop(n + 1.5)
    },
  }
}

export function stopAmbience() { hum?.stop(); hum = null }
