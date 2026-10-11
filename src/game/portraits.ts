// Story portraits and the warden sprite. Everything is drawn in a 100×100
// box so callers can scale freely.

import { drawDetective, rr, shade, type Ctx } from './sprites'
import type { CharId } from '@/data/story'

interface Look {
  skin: string
  hair: string
  shirt: string
  style: 'short' | 'long' | 'bun' | 'messy' | 'part'
  glasses?: boolean
  headphones?: boolean
  clip?: string
}

const LOOKS: Partial<Record<CharId, Look>> = {
  sari:  { skin: '#D9A77E', hair: '#2A1C17', shirt: '#2A8B8B', style: 'long' },
  dimas: { skin: '#C6905F', hair: '#17130F', shirt: '#B5622B', style: 'messy', headphones: true },
  raka:  { skin: '#CFA07A', hair: '#1B1B1F', shirt: '#4A4F5A', style: 'part', glasses: true },
  ratna: { skin: '#D2A380', hair: '#5A534E', shirt: '#7A3B52', style: 'bun', glasses: true },
  laras: { skin: '#DDB08A', hair: '#231814', shirt: '#E2B33C', style: 'long', clip: '#E0506E' },
  ayu:   { skin: '#D0A07A', hair: '#2B1D16', shirt: '#6A7FB8', style: 'bun' },
  pakjo: { skin: '#B98458', hair: '#8C8780', shirt: '#E6E1D6', style: 'short' },
  ibu:   { skin: '#D2A380', hair: '#5A534E', shirt: '#8C5A6E', style: 'bun' },
  yati:  { skin: '#C6905F', hair: '#6A645E', shirt: '#5E8C78', style: 'short', glasses: true },
  dewi:  { skin: '#D9A77E', hair: '#231814', shirt: '#3E4E78', style: 'long', glasses: true },
  min:   { skin: '#B98458', hair: '#17130F', shirt: '#2F3A4A', style: 'part' },
}

function bust(g: Ctx, l: Look) {
  const dark = shade(l.shirt, -0.3)

  if (l.style === 'long') {
    g.fillStyle = l.hair
    rr(g, 24, 16, 52, 70, 24); g.fill()
  }

  // shoulders
  const sg = g.createLinearGradient(0, 70, 0, 100)
  sg.addColorStop(0, l.shirt); sg.addColorStop(1, dark)
  g.fillStyle = sg
  rr(g, 12, 70, 76, 44, 22); g.fill()
  // collar
  g.fillStyle = dark
  g.beginPath(); g.moveTo(40, 70); g.lineTo(50, 84); g.lineTo(60, 70); g.closePath(); g.fill()

  // neck + head
  g.fillStyle = shade(l.skin, -0.12)
  rr(g, 42, 58, 16, 18, 6); g.fill()
  g.fillStyle = l.skin
  g.beginPath(); g.ellipse(50, 42, 20, 23, 0, 0, Math.PI * 2); g.fill()

  // hair
  g.fillStyle = l.hair
  g.beginPath()
  switch (l.style) {
    case 'part':
      g.moveTo(29, 40); g.quadraticCurveTo(28, 14, 52, 16); g.quadraticCurveTo(74, 16, 71, 40)
      g.quadraticCurveTo(66, 28, 46, 29); g.quadraticCurveTo(34, 30, 29, 40)
      break
    case 'messy':
      g.moveTo(28, 42); g.lineTo(27, 22); g.lineTo(36, 26); g.lineTo(38, 13); g.lineTo(48, 22)
      g.lineTo(55, 11); g.lineTo(60, 22); g.lineTo(70, 16); g.lineTo(69, 28); g.lineTo(74, 30); g.lineTo(72, 42)
      g.quadraticCurveTo(60, 28, 28, 42)
      break
    default:
      g.moveTo(29, 42); g.quadraticCurveTo(26, 15, 50, 16); g.quadraticCurveTo(74, 15, 71, 42)
      g.quadraticCurveTo(62, 27, 50, 28); g.quadraticCurveTo(38, 27, 29, 42)
  }
  g.closePath(); g.fill()
  if (l.style === 'bun') { g.beginPath(); g.arc(50, 13, 9, 0, Math.PI * 2); g.fill() }
  if (l.clip) { g.fillStyle = l.clip; rr(g, 62, 27, 9, 4, 2); g.fill() }

  // face
  g.fillStyle = '#1B1612'
  g.beginPath(); g.arc(42, 45, 2.1, 0, Math.PI * 2); g.arc(58, 45, 2.1, 0, Math.PI * 2); g.fill()
  if (l.glasses) {
    g.strokeStyle = '#1B1612'; g.lineWidth = 1.6
    rr(g, 35, 39, 13, 11, 3); g.stroke()
    rr(g, 52, 39, 13, 11, 3); g.stroke()
    g.beginPath(); g.moveTo(48, 44); g.lineTo(52, 44); g.stroke()
  }
  if (l.headphones) {
    g.strokeStyle = '#22252B'; g.lineWidth = 5; g.lineCap = 'round'
    g.beginPath(); g.arc(50, 70, 17, 0.15, Math.PI - 0.15); g.stroke()
    g.lineCap = 'butt'
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
    g.save(); g.translate(50, 96); g.scale(2, 2)
    drawDetective(g, 0, 0, opts.playerColor, 'down', 0, false)
    g.restore()
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
