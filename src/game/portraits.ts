// Story portraits and the warden sprite. Everything is drawn in a 100×100
// box so callers can scale freely.

import { rr, shade, type Ctx } from './sprites'
import type { CharId } from '@/data/story'

interface Look {
  skin: string
  hair: string
  shirt: string
  style: 'short' | 'long' | 'bun' | 'messy' | 'part'
  mood?: 'warm' | 'flat' | 'sad' | 'cold'
  wear?: 'collar' | 'hoodie' | 'apron' | 'blazer' | 'tee' | 'uniform'
  old?: boolean
  glasses?: boolean
  headphones?: boolean
  cap?: boolean
  clip?: string
}

const LOOKS: Partial<Record<CharId, Look>> = {
  sari:  { skin: '#D9A77E', hair: '#2A1C17', shirt: '#2A8B8B', style: 'long', mood: 'warm', wear: 'blazer' },
  dimas: { skin: '#C6905F', hair: '#17130F', shirt: '#B5622B', style: 'messy', mood: 'warm', wear: 'tee', headphones: true },
  raka:  { skin: '#CFA07A', hair: '#1B1B1F', shirt: '#4A4F5A', style: 'part', mood: 'cold', wear: 'collar', glasses: true },
  ratna: { skin: '#D2A380', hair: '#5A534E', shirt: '#7A3B52', style: 'bun', mood: 'flat', wear: 'blazer', glasses: true, old: true },
  laras: { skin: '#DDB08A', hair: '#231814', shirt: '#E2B33C', style: 'long', mood: 'warm', wear: 'hoodie', clip: '#E0506E' },
  ayu:   { skin: '#D0A07A', hair: '#2B1D16', shirt: '#6A7FB8', style: 'bun', mood: 'sad', wear: 'tee' },
  pakjo: { skin: '#B98458', hair: '#8C8780', shirt: '#C8442F', style: 'short', mood: 'warm', wear: 'apron', old: true },
  ibu:   { skin: '#D2A380', hair: '#5A534E', shirt: '#8C5A6E', style: 'bun', mood: 'sad', wear: 'collar', old: true },
  yati:  { skin: '#C6905F', hair: '#6A645E', shirt: '#5E8C78', style: 'bun', mood: 'flat', wear: 'collar', glasses: true, old: true },
  dewi:  { skin: '#D9A77E', hair: '#231814', shirt: '#3E4E78', style: 'long', mood: 'flat', wear: 'blazer', glasses: true },
  min:   { skin: '#B98458', hair: '#17130F', shirt: '#3A4A6A', style: 'short', mood: 'flat', wear: 'uniform', cap: true },
}

function bust(g: Ctx, l: Look) {
  const dark = shade(l.shirt, -0.32), light = shade(l.shirt, 0.14)
  const skinD = shade(l.skin, -0.16)
  const mood = l.mood ?? 'flat'

  // a soft pool of light behind the head
  const bg = g.createRadialGradient(50, 40, 6, 50, 46, 64)
  bg.addColorStop(0, 'rgba(255,240,215,0.14)'); bg.addColorStop(1, 'rgba(255,240,215,0)')
  g.fillStyle = bg; g.fillRect(0, 0, 100, 100)

  if (l.style === 'long') { g.fillStyle = l.hair; rr(g, 23, 15, 54, 74, 25); g.fill() }

  // shoulders and what they are wearing
  const sg = g.createLinearGradient(12, 0, 88, 0)
  sg.addColorStop(0, light); sg.addColorStop(0.5, l.shirt); sg.addColorStop(1, dark)
  g.fillStyle = sg
  g.beginPath(); g.moveTo(8, 104); g.quadraticCurveTo(10, 72, 38, 68); g.lineTo(62, 68); g.quadraticCurveTo(90, 72, 92, 104); g.closePath(); g.fill()
  g.fillStyle = skinD; rr(g, 42, 56, 16, 18, 6); g.fill()                 // neck
  switch (l.wear) {
    case 'hoodie':
      g.fillStyle = dark; g.beginPath(); g.ellipse(50, 70, 22, 9, 0, 0, Math.PI); g.fill()
      g.strokeStyle = '#EFEAE0'; g.lineWidth = 1.6
      g.beginPath(); g.moveTo(44, 76); g.lineTo(43, 92); g.moveTo(56, 76); g.lineTo(57, 92); g.stroke()
      break
    case 'blazer':
      g.fillStyle = '#EFEAE0'; g.beginPath(); g.moveTo(40, 68); g.lineTo(50, 92); g.lineTo(60, 68); g.closePath(); g.fill()
      g.fillStyle = dark
      g.beginPath(); g.moveTo(36, 68); g.lineTo(50, 96); g.lineTo(42, 100); g.lineTo(28, 74); g.closePath(); g.fill()
      g.beginPath(); g.moveTo(64, 68); g.lineTo(50, 96); g.lineTo(58, 100); g.lineTo(72, 74); g.closePath(); g.fill()
      break
    case 'apron':
      g.fillStyle = '#EFEAE0'; rr(g, 34, 76, 32, 30, 4); g.fill()
      g.strokeStyle = '#EFEAE0'; g.lineWidth = 3
      g.beginPath(); g.moveTo(36, 78); g.lineTo(42, 66); g.moveTo(64, 78); g.lineTo(58, 66); g.stroke()
      break
    case 'uniform':
      g.fillStyle = dark; g.beginPath(); g.moveTo(40, 68); g.lineTo(50, 80); g.lineTo(60, 68); g.closePath(); g.fill()
      g.fillStyle = '#E2B33C'; rr(g, 62, 80, 10, 7, 1.5); g.fill()
      g.fillStyle = dark; g.fillRect(14, 74, 14, 4); g.fillRect(72, 74, 14, 4)
      break
    case 'tee':
      g.strokeStyle = dark; g.lineWidth = 3
      g.beginPath(); g.arc(50, 66, 11, 0.2, Math.PI - 0.2); g.stroke()
      break
    default:
      g.fillStyle = dark; g.beginPath(); g.moveTo(39, 68); g.lineTo(50, 84); g.lineTo(61, 68); g.closePath(); g.fill()
      g.fillStyle = light
      g.beginPath(); g.moveTo(36, 67); g.lineTo(46, 76); g.lineTo(50, 70); g.closePath(); g.fill()
      g.beginPath(); g.moveTo(64, 67); g.lineTo(54, 76); g.lineTo(50, 70); g.closePath(); g.fill()
  }
  if (l.headphones) {
    g.strokeStyle = '#22252B'; g.lineWidth = 5; g.lineCap = 'round'
    g.beginPath(); g.arc(50, 70, 17, 0.15, Math.PI - 0.15); g.stroke()
    g.lineCap = 'butt'
  }

  // head, with ears and a shadow under the chin
  g.fillStyle = skinD
  g.beginPath(); g.ellipse(29.5, 44, 3.6, 5.5, 0, 0, Math.PI * 2); g.ellipse(70.5, 44, 3.6, 5.5, 0, 0, Math.PI * 2); g.fill()
  const hg = g.createLinearGradient(30, 0, 70, 0)
  hg.addColorStop(0, shade(l.skin, 0.06)); hg.addColorStop(1, shade(l.skin, -0.1))
  g.fillStyle = hg
  g.beginPath(); g.moveTo(30, 38); g.quadraticCurveTo(30, 18, 50, 18); g.quadraticCurveTo(70, 18, 70, 38)
  g.quadraticCurveTo(70, 58, 56, 65); g.quadraticCurveTo(50, 67.5, 44, 65); g.quadraticCurveTo(30, 58, 30, 38); g.fill()

  // hair
  g.fillStyle = l.hair
  g.beginPath()
  switch (l.style) {
    case 'part':
      g.moveTo(29, 41); g.quadraticCurveTo(27, 13, 52, 15); g.quadraticCurveTo(75, 15, 71, 41)
      g.quadraticCurveTo(67, 28, 47, 29); g.quadraticCurveTo(34, 30, 29, 41)
      break
    case 'messy':
      g.moveTo(28, 42); g.lineTo(27, 22); g.lineTo(36, 26); g.lineTo(38, 12); g.lineTo(48, 22)
      g.lineTo(55, 10); g.lineTo(60, 22); g.lineTo(70, 15); g.lineTo(69, 28); g.lineTo(74, 30); g.lineTo(72, 42)
      g.quadraticCurveTo(60, 27, 28, 42)
      break
    case 'long':
      g.moveTo(28, 46); g.quadraticCurveTo(24, 13, 50, 14); g.quadraticCurveTo(76, 13, 72, 46)
      g.quadraticCurveTo(66, 30, 54, 26); g.quadraticCurveTo(40, 34, 28, 46)
      break
    default:
      g.moveTo(29, 42); g.quadraticCurveTo(26, 14, 50, 15); g.quadraticCurveTo(74, 14, 71, 42)
      g.quadraticCurveTo(62, 27, 50, 28); g.quadraticCurveTo(38, 27, 29, 42)
  }
  g.closePath(); g.fill()
  g.strokeStyle = shade(l.hair, 0.3); g.lineWidth = 1.2; g.lineCap = 'round'
  g.beginPath(); g.moveTo(40, 21); g.quadraticCurveTo(50, 17, 60, 21); g.stroke()
  g.lineCap = 'butt'
  if (l.style === 'bun') { g.fillStyle = l.hair; g.beginPath(); g.arc(50, 12, 9, 0, Math.PI * 2); g.fill() }
  if (l.clip) { g.fillStyle = l.clip; rr(g, 62, 27, 9, 4, 2); g.fill() }
  if (l.cap) {
    g.fillStyle = '#20242C'
    g.beginPath(); g.moveTo(27, 30); g.quadraticCurveTo(28, 10, 50, 10); g.quadraticCurveTo(72, 10, 73, 30); g.closePath(); g.fill()
    rr(g, 24, 28, 52, 6, 3); g.fill()
    g.fillStyle = '#E2B33C'; g.beginPath(); g.arc(50, 20, 4, 0, Math.PI * 2); g.fill()
  }

  // brows carry most of the expression
  const tilt = mood === 'sad' ? -2.2 : mood === 'cold' ? 2 : 0
  g.strokeStyle = shade(l.hair, -0.1); g.lineWidth = 2.2; g.lineCap = 'round'
  g.beginPath(); g.moveTo(36, 37 - tilt); g.lineTo(45, 37 + tilt * 0.6); g.moveTo(64, 37 - tilt); g.lineTo(55, 37 + tilt * 0.6); g.stroke()
  // eyes
  const lid = mood === 'cold' ? 1.6 : mood === 'sad' ? 1 : 0
  for (const ex of [41, 59]) {
    g.fillStyle = '#F4EFE6'; g.beginPath(); g.ellipse(ex, 44, 4, 3 - lid * 0.5, 0, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#2A1C17'; g.beginPath(); g.arc(ex, 44.2, 2.1, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 0.8, 43.4, 0.7, 0, Math.PI * 2); g.fill()
    g.strokeStyle = skinD; g.lineWidth = 1.2
    g.beginPath(); g.moveTo(ex - 4.5, 43 + lid * 0.4); g.quadraticCurveTo(ex, 40 + lid, ex + 4.5, 43 + lid * 0.4); g.stroke()
  }
  if (l.old) {
    g.strokeStyle = skinD; g.lineWidth = 0.9
    g.beginPath(); g.moveTo(36, 48.5); g.lineTo(45, 49.5); g.moveTo(64, 48.5); g.lineTo(55, 49.5)
    g.moveTo(40, 54); g.quadraticCurveTo(38.5, 58, 41, 61); g.moveTo(60, 54); g.quadraticCurveTo(61.5, 58, 59, 61); g.stroke()
  }
  // nose and mouth
  g.strokeStyle = skinD; g.lineWidth = 1.4
  g.beginPath(); g.moveTo(50, 45); g.quadraticCurveTo(52.5, 51, 49, 52.5); g.stroke()
  g.strokeStyle = shade(l.skin, -0.42); g.lineWidth = 1.9
  g.beginPath()
  if (mood === 'warm') { g.moveTo(43, 57); g.quadraticCurveTo(50, 62.5, 57, 57) }
  else if (mood === 'sad') { g.moveTo(44, 59.5); g.quadraticCurveTo(50, 56.5, 56, 59.5) }
  else if (mood === 'cold') { g.moveTo(44, 58); g.lineTo(55, 57.2); g.lineTo(57.5, 58.4) }
  else { g.moveTo(44.5, 58); g.lineTo(55.5, 58) }
  g.stroke(); g.lineCap = 'butt'
  if (mood === 'warm') { g.fillStyle = 'rgba(214,110,96,0.18)'; g.beginPath(); g.arc(36, 53, 4, 0, Math.PI * 2); g.arc(64, 53, 4, 0, Math.PI * 2); g.fill() }

  if (l.glasses) {
    g.strokeStyle = '#1B1612'; g.lineWidth = 1.7
    rr(g, 34, 38.5, 14, 11, 3.5); g.stroke()
    rr(g, 52, 38.5, 14, 11, 3.5); g.stroke()
    g.beginPath(); g.moveTo(48, 43); g.lineTo(52, 43); g.moveTo(34, 42); g.lineTo(30, 41); g.moveTo(66, 42); g.lineTo(70, 41); g.stroke()
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(36, 40, 4, 2); g.fillRect(54, 40, 4, 2)
  }
}

/**
 * The warden: a hovering shell around one lens. (x, y) is the point on the
 * floor beneath it; `r` is the shell radius.
 */
export function drawWarden(g: Ctx, x: number, y: number, r: number, color: string, t: number, alert = false, stunned = false) {
  const hover = Math.sin(t * 2.4 + x * 0.05) * r * 0.18
  const cy = y - r * 1.7 + hover

  g.fillStyle = 'rgba(0,0,0,0.4)'
  g.beginPath(); g.ellipse(x, y, r * 0.9, r * 0.32, 0, 0, Math.PI * 2); g.fill()

  const glow = g.createRadialGradient(x, cy, 0, x, cy, r * 3.2)
  glow.addColorStop(0, hexA(color, alert ? 0.5 : 0.28))
  glow.addColorStop(1, hexA(color, 0))
  g.fillStyle = glow
  g.fillRect(x - r * 3.2, cy - r * 3.2, r * 6.4, r * 6.4)

  // shell: three plates that open when it has seen you
  const open = alert ? 0.22 : 0.06
  g.fillStyle = '#12151B'
  g.strokeStyle = stunned ? '#5A6170' : color
  g.lineWidth = Math.max(1, r * 0.13)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + t * (stunned ? 0.1 : alert ? 1.6 : 0.5)
    g.beginPath()
    g.arc(x + Math.cos(a + 1.05) * r * open, cy + Math.sin(a + 1.05) * r * open, r, a + 0.12, a + 2.0)
    g.lineTo(x, cy)
    g.closePath(); g.fill(); g.stroke()
  }

  // lens
  const blink = stunned ? (Math.sin(t * 18) > 0 ? 0.25 : 0.05) : 1
  g.fillStyle = hexA(color, 0.95 * blink)
  g.beginPath(); g.arc(x, cy, r * 0.42, 0, Math.PI * 2); g.fill()
  g.fillStyle = `rgba(255,255,255,${0.85 * blink})`
  g.beginPath(); g.arc(x - r * 0.12, cy - r * 0.12, r * 0.13, 0, Math.PI * 2); g.fill()

  if (alert && !stunned) {
    g.fillStyle = '#FF5A43'
    g.font = `700 ${Math.round(r * 1.2)}px "IBM Plex Sans Condensed", sans-serif`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('!', x, cy - r * 1.9)
    g.textAlign = 'start'
  }
}

/** Paints a character into a 100×100 box at the canvas origin. */
export function drawPortrait(g: Ctx, who: CharId, opts: { playerColor: string; color?: string; time?: number }) {
  g.clearRect(0, 0, 100, 100)
  if (who === 'mc') {
    bust(g, { skin: '#D2A380', hair: '#2C241D', shirt: opts.playerColor, style: 'short', mood: 'sad', wear: 'hoodie' })
    return
  }
  if (who === 'warden') {
    drawWarden(g, 50, 88, 24, opts.color ?? '#E0503A', opts.time ?? 0, true)
    return
  }
  if (who === 'unknown') {
    g.fillStyle = '#05070A'
    rr(g, 12, 70, 76, 44, 22); g.fill()
    g.beginPath(); g.ellipse(50, 42, 21, 24, 0, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#3A4250'
    g.font = '700 30px "IBM Plex Sans Condensed", sans-serif'
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('?', 50, 44)
    g.textAlign = 'start'
    return
  }
  const look = LOOKS[who]
  if (look) bust(g, look)
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
