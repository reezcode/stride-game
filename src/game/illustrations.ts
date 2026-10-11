// Drawn scenes for story beats. Each one paints a 1600×900 stage; the caller
// scales it to cover the screen. `t` is seconds, for small ambient motion.

import { rr, shade, rng, type Ctx } from './sprites'
import type { ArtId } from '@/data/story'

const W = 1600, H = 900

type Mood = 'warm' | 'flat' | 'sad' | 'cold'
interface Look {
  shirt: string; hair: string; skin: string
  pants?: string
  hairStyle?: 'short' | 'long' | 'bun' | 'messy' | 'part'
  glasses?: boolean
  mood?: Mood
}
interface Pose { back?: boolean; arms?: 'down' | 'clap' | 'crossed' | 'phone'; dim?: number; umbrella?: boolean }

const PEOPLE: Record<string, Look> = {
  sari:  { skin: '#D9A77E', hair: '#2A1C17', shirt: '#2A8B8B', hairStyle: 'long', mood: 'warm' },
  dimas: { skin: '#C6905F', hair: '#17130F', shirt: '#B5622B', hairStyle: 'messy', mood: 'warm' },
  raka:  { skin: '#CFA07A', hair: '#1B1B1F', shirt: '#4A4F5A', hairStyle: 'part', glasses: true, mood: 'cold' },
  ratna: { skin: '#D2A380', hair: '#5A534E', shirt: '#7A3B52', hairStyle: 'bun', glasses: true, mood: 'warm' },
  laras: { skin: '#DDB08A', hair: '#231814', shirt: '#E2B33C', hairStyle: 'long', mood: 'sad' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Darkens a hex colour and returns hex, so the result can be shaded again. */
function dimmed(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16), k = 1 - amt
  const c = (v: number) => Math.round(v * k).toString(16).padStart(2, '0')
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`
}

function grad(g: Ctx, x0: number, y0: number, x1: number, y1: number, stops: string[]) {
  const gr = g.createLinearGradient(x0, y0, x1, y1)
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c))
  return gr
}
function sky(g: Ctx, stops: string[], y0 = 0, y1 = H) { g.fillStyle = grad(g, 0, y0, 0, y1, stops); g.fillRect(0, y0, W, y1 - y0) }

function glow(g: Ctx, x: number, y: number, r: number, color: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, 0))
  g.fillStyle = gr
  g.fillRect(x - r, y - r, r * 2, r * 2)
}

function poly(g: Ctx, pts: number[], fill: string | CanvasGradient) {
  g.fillStyle = fill
  g.beginPath(); g.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1])
  g.closePath(); g.fill()
}

/**
 * A standing figure about 320·s tall; (x, y) is between the feet.
 * Shoulders, sleeves, hands, a jawline and a face, so people read as people.
 */
function person(g: Ctx, x: number, y: number, s: number, look: Look, pose: Pose = {}) {
  let l = look
  if (pose.dim) l = { ...l, shirt: dimmed(l.shirt, pose.dim), skin: dimmed(l.skin, pose.dim), hair: dimmed(l.hair, pose.dim), pants: dimmed(l.pants ?? '#2B2F38', pose.dim) }
  const pants = l.pants ?? '#2B2F38'
  const dark = shade(l.shirt, -0.3), light = shade(l.shirt, 0.14), skinD = shade(l.skin, -0.16)
  const arms = pose.arms ?? 'down'
  g.save()
  g.translate(x, y); g.scale(s, s)
  g.lineCap = 'round'; g.lineJoin = 'round'

  g.fillStyle = 'rgba(0,0,0,0.28)'
  g.beginPath(); g.ellipse(0, 2, 62, 11, 0, 0, Math.PI * 2); g.fill()

  // legs and shoes
  g.fillStyle = pants
  poly(g, [-34, -138, -4, -138, -6, -10, -32, -10], pants)
  poly(g, [4, -138, 34, -138, 32, -10, 6, -10], shade(pants, -0.12))
  g.fillStyle = '#16181C'
  rr(g, -38, -14, 36, 16, 7); g.fill(); rr(g, 2, -14, 36, 16, 7); g.fill()

  if (l.hairStyle === 'long') { g.fillStyle = l.hair; rr(g, -42, -306, 84, 132, 36); g.fill() }

  // arms behind the torso
  const sleeve = (x0: number, y0: number, x1: number, y1: number, col: string) => {
    g.strokeStyle = col; g.lineWidth = 24
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke()
  }
  const hand = (hx: number, hy: number) => { g.fillStyle = l.skin; g.beginPath(); g.arc(hx, hy, 11, 0, Math.PI * 2); g.fill() }
  if (arms === 'down') {
    sleeve(-52, -226, -58, -150, dark); hand(-59, -134)
    sleeve(52, -226, 58, -150, dark); hand(59, -134)
  } else if (pose.umbrella) {
    sleeve(-52, -226, -58, -150, dark); hand(-59, -134)
  }

  // torso: shoulders taper to the waist
  g.fillStyle = grad(g, -56, 0, 56, 0, [light, l.shirt, dark])
  g.beginPath()
  g.moveTo(-58, -214); g.quadraticCurveTo(-58, -246, -24, -248); g.lineTo(24, -248); g.quadraticCurveTo(58, -246, 58, -214)
  g.lineTo(42, -128); g.lineTo(-42, -128); g.closePath(); g.fill()
  if (!pose.back) {
    // collar and a hint of buttons
    poly(g, [-18, -248, 0, -222, 18, -248], dark)
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 3; i++) g.fillRect(-1.5, -206 + i * 24, 3, 6)
  }

  // arms in front of the torso
  if (arms === 'clap') {
    sleeve(-52, -224, -14, -186, dark); sleeve(52, -224, 14, -186, dark); hand(-8, -182); hand(8, -186)
  } else if (arms === 'crossed') {
    sleeve(-52, -224, 22, -176, dark); sleeve(52, -224, -22, -170, shade(l.shirt, -0.4)); hand(30, -174); hand(-30, -168)
  } else if (arms === 'phone') {
    sleeve(-52, -224, -58, -150, dark); hand(-59, -134)
    sleeve(52, -224, 30, -176, dark); hand(24, -178)
    g.fillStyle = '#0B0E13'; rr(g, 8, -204, 24, 40, 5); g.fill()
    g.fillStyle = '#A9CBFF'; rr(g, 11, -200, 18, 32, 3); g.fill()
  } else if (pose.umbrella) {
    sleeve(52, -224, 40, -196, dark); hand(36, -198)
  }

  // neck and head
  g.fillStyle = skinD; rr(g, -13, -268, 26, 28, 9); g.fill()
  g.fillStyle = skinD
  g.beginPath(); g.ellipse(-34, -292, 6, 9, 0, 0, Math.PI * 2); g.ellipse(34, -292, 6, 9, 0, 0, Math.PI * 2); g.fill()
  g.fillStyle = pose.back ? l.hair : grad(g, -32, 0, 32, 0, [shade(l.skin, 0.06), shade(l.skin, -0.08)])
  g.beginPath()
  g.moveTo(-33, -300); g.quadraticCurveTo(-33, -336, 0, -336); g.quadraticCurveTo(33, -336, 33, -300)
  g.quadraticCurveTo(33, -266, 10, -256); g.quadraticCurveTo(0, -252, -10, -256); g.quadraticCurveTo(-33, -266, -33, -300); g.fill()

  // hair
  g.fillStyle = l.hair
  g.beginPath()
  if (pose.back) g.ellipse(0, -300, 35, 40, 0, 0, Math.PI * 2)
  else if (l.hairStyle === 'messy') {
    g.moveTo(-35, -294); g.lineTo(-37, -326); g.lineTo(-22, -320); g.lineTo(-18, -344); g.lineTo(-2, -328); g.lineTo(8, -346); g.lineTo(16, -328); g.lineTo(32, -338); g.lineTo(30, -318); g.lineTo(38, -314); g.lineTo(35, -294)
    g.quadraticCurveTo(14, -320, -35, -294)
  } else if (l.hairStyle === 'part') {
    g.moveTo(-35, -296); g.quadraticCurveTo(-38, -342, 4, -340); g.quadraticCurveTo(40, -340, 35, -296); g.quadraticCurveTo(28, -318, -6, -316); g.quadraticCurveTo(-26, -314, -35, -296)
  } else {
    g.moveTo(-35, -292); g.quadraticCurveTo(-40, -342, 0, -340); g.quadraticCurveTo(40, -342, 35, -292); g.quadraticCurveTo(24, -318, 6, -322); g.quadraticCurveTo(-18, -312, -35, -292)
  }
  g.closePath(); g.fill()
  if (l.hairStyle === 'bun') { g.beginPath(); g.arc(0, -346, 15, 0, Math.PI * 2); g.fill() }

  if (!pose.back) {
    const mood = l.mood ?? 'flat'
    const tilt = mood === 'sad' ? -3.5 : mood === 'cold' ? 3 : 0
    g.strokeStyle = shade(l.hair, -0.1); g.lineWidth = 3.4
    g.beginPath(); g.moveTo(-23, -304 - tilt); g.lineTo(-8, -304 + tilt * 0.6); g.moveTo(23, -304 - tilt); g.lineTo(8, -304 + tilt * 0.6); g.stroke()
    for (const ex of [-14, 14]) {
      g.fillStyle = '#F4EFE6'; g.beginPath(); g.ellipse(ex, -292, 6, mood === 'cold' ? 3.2 : 4.4, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#2A1C17'; g.beginPath(); g.arc(ex + (mood === 'cold' ? -1.5 : 0), -292, 3.1, 0, Math.PI * 2); g.fill()
    }
    g.strokeStyle = skinD; g.lineWidth = 2.2
    g.beginPath(); g.moveTo(0, -292); g.quadraticCurveTo(4, -282, -2, -279); g.stroke()
    g.strokeStyle = shade(l.skin, -0.45); g.lineWidth = 3
    g.beginPath()
    if (mood === 'warm') { g.moveTo(-12, -270); g.quadraticCurveTo(0, -260, 12, -270) }
    else if (mood === 'sad') { g.moveTo(-10, -266); g.quadraticCurveTo(0, -271, 10, -266) }
    else { g.moveTo(-10, -268); g.lineTo(10, -268 + (mood === 'cold' ? -1.5 : 0)) }
    g.stroke()
    if (l.glasses) {
      g.strokeStyle = '#1B1612'; g.lineWidth = 2.6
      rr(g, -26, -301, 22, 18, 5); g.stroke(); rr(g, 4, -301, 22, 18, 5); g.stroke()
      g.beginPath(); g.moveTo(-4, -294); g.lineTo(4, -294); g.stroke()
    }
  }
  if (pose.umbrella) {
    g.strokeStyle = '#0E1013'; g.lineWidth = 5
    g.beginPath(); g.moveTo(38, -196); g.lineTo(38, -400); g.stroke()
    g.fillStyle = '#15171B'
    g.beginPath(); g.moveTo(-92, -392); g.quadraticCurveTo(38, -520, 168, -392)
    for (let i = 0; i < 4; i++) g.quadraticCurveTo(168 - 32.5 - i * 65, -412, 168 - 65 - i * 65, -392)
    g.closePath(); g.fill()
  }
  g.restore()
}

function windowPane(g: Ctx, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, frame = '#3A3F49') {
  g.fillStyle = frame; g.fillRect(x - 10, y - 10, w + 20, h + 20)
  g.fillStyle = fill; g.fillRect(x, y, w, h)
  g.fillStyle = frame; g.fillRect(x + w / 2 - 3, y, 6, h); g.fillRect(x, y + h / 2 - 3, w, 6)
  g.fillStyle = shade(typeof frame === 'string' ? frame : '#3A3F49', 0.12); g.fillRect(x - 16, y + h + 8, w + 32, 10)
}

function cityline(g: Ctx, base: number, seed: number, color: string, lit: string, minH: number, maxH: number, t: number, x0 = -20, x1 = W) {
  const R = rng(seed)
  let x = x0
  while (x < x1) {
    const bw = 50 + R() * 90, bh = minH + R() * (maxH - minH)
    g.fillStyle = color
    g.fillRect(x, base - bh, bw, bh)
    for (let wy = base - bh + 12; wy < base - 10; wy += 18) for (let wx = x + 8; wx < x + bw - 10; wx += 16) {
      const r = R()
      if (r < 0.22) { g.fillStyle = rgba(lit, 0.35 + 0.35 * Math.abs(Math.sin(t * 0.3 + r * 40))); g.fillRect(wx, wy, 7, 9) }
    }
    x += bw + 4
  }
}

function rain(g: Ctx, t: number, n: number, alpha: number) {
  const R = rng(9)
  g.strokeStyle = `rgba(200,210,225,${alpha})`; g.lineWidth = 1.5
  g.beginPath()
  for (let i = 0; i < n; i++) {
    const x = R() * (W + 200) - 100, sp = 700 + R() * 500
    const y = ((R() * H + t * sp) % (H + 60)) - 30
    g.moveTo(x, y); g.lineTo(x - 8, y + 34)
  }
  g.stroke()
}

function stars(g: Ctx, seed: number, n: number, maxY: number, t: number) {
  const R = rng(seed)
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = R() * maxY, p = R() * 6
    g.fillStyle = `rgba(230,235,255,${0.25 + 0.45 * Math.abs(Math.sin(t * 0.6 + p))})`
    g.fillRect(x, y, 2, 2)
  }
}

function floorboards(g: Ctx, y: number, color: string) {
  g.fillStyle = color; g.fillRect(0, y, W, H - y)
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 2
  for (let i = -6; i <= 22; i++) { g.beginPath(); g.moveTo(800 + (i - 8) * 70, y); g.lineTo(800 + (i - 8) * 190, H); g.stroke() }
  g.fillStyle = grad(g, 0, y, 0, y + 60, ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']); g.fillRect(0, y, W, 60)
}

/** A phone lying or held, with a lit screen. */
function phone(g: Ctx, x: number, y: number, w: number, h: number, screen: string, tilt = 0) {
  g.save(); g.translate(x, y); g.rotate(tilt)
  g.fillStyle = '#0B0E13'; rr(g, -w / 2, -h / 2, w, h, w * 0.12); g.fill()
  g.fillStyle = screen; rr(g, -w / 2 + w * 0.06, -h / 2 + w * 0.06, w * 0.88, h - w * 0.12, w * 0.07); g.fill()
  g.restore()
}

/** Finishing pass shared by every scene: darkened corners and a little film grain. */
function finish(g: Ctx, t: number, strength = 0.55) {
  const v = g.createRadialGradient(W / 2, H * 0.46, H * 0.35, W / 2, H * 0.5, W * 0.72)
  v.addColorStop(0, 'rgba(4,6,10,0)'); v.addColorStop(1, `rgba(4,6,10,${strength})`)
  g.fillStyle = v; g.fillRect(0, 0, W, H)
  const R = rng(Math.floor(t * 12) + 1)
  for (let i = 0; i < 520; i++) {
    g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)'
    g.fillRect(R() * W, R() * H, 2, 2)
  }
}

// ─── Scenes ──────────────────────────────────────────────────────────────

const SCENES: Record<ArtId, (g: Ctx, t: number, player: Look) => void> = {
  /** Friday cake in the pantry. Everyone claps; Raka stands a step apart with his arms folded. */
  party(g, t, player) {
    sky(g, ['#EADFC6', '#DCCBA8'], 0, 610)
    g.fillStyle = '#CDBB96'; g.fillRect(0, 470, W, 140)                      // wainscot
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 468, W, 5)
    const sun = grad(g, 0, 110, 0, 410, ['#FDE9B6', '#F6C083', '#E99A6A'])
    windowPane(g, 520, 110, 300, 300, sun, '#8A7A60')
    cityline(g, 410, 6, 'rgba(120,70,60,0.45)', '#FFE2A0', 40, 150, t, 520, 820)
    g.fillStyle = '#8A7A60'; g.fillRect(510, 100, 320, 10)
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(520, 130 + i * 48, 300, 5) }  // blinds
    glow(g, 670, 260, 620, '#FFE0A0', 0.34)
    // pantry counter with a coffee machine and a fridge
    g.fillStyle = '#B9B2A4'; g.fillRect(40, 400, 380, 210)
    g.fillStyle = '#D2CBBD'; g.fillRect(30, 388, 400, 18)
    for (let i = 0; i < 3; i++) { g.fillStyle = '#A8A193'; rr(g, 56 + i * 122, 426, 106, 160, 4); g.fill(); g.fillStyle = '#7C7568'; g.fillRect(100 + i * 122, 440, 18, 5) }
    g.fillStyle = '#1D1F23'; rr(g, 70, 300, 96, 90, 8); g.fill(); g.fillStyle = '#C8442F'; g.fillRect(104, 350, 28, 10)
    g.fillStyle = '#E6E9EB'; rr(g, 1300, 190, 190, 420, 10); g.fill(); g.fillStyle = '#C5CACE'; g.fillRect(1300, 340, 190, 5); g.fillRect(1466, 220, 8, 90); g.fillRect(1466, 370, 8, 150)
    for (const [x, y, c] of [[1330, 240, '#E2B33C'], [1380, 262, '#C8442F'], [1345, 400, '#8FC7D9']] as const) { g.fillStyle = c; g.fillRect(x, y, 34, 30) }
    // banner, bunting and balloons
    const cols = ['#C8442F', '#3567B4', '#E2B33C', '#3D8A5C']
    g.fillStyle = '#F4EDE0'; rr(g, 900, 150, 340, 74, 6); g.fill()
    g.fillStyle = '#2B2F38'; g.font = '700 46px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('SELAMAT!', 1070, 190); g.textAlign = 'start'
    for (let i = 0; i < 24; i++) {
      const x = 20 + i * 68, y = 44 + Math.sin(i * 0.5) * 16 + Math.sin(t * 1.2 + i) * 2
      poly(g, [x, y, x + 44, y, x + 22, y + 46], cols[i % 4])
    }
    for (const [bx, c] of [[250, '#E2B33C'], [300, '#C8442F'], [1210, '#3567B4']] as const) {
      const by = 250 + Math.sin(t * 0.8 + bx) * 6
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by + 44); g.quadraticCurveTo(bx + 10, by + 110, bx - 6, by + 160); g.stroke()
      g.fillStyle = c; g.beginPath(); g.ellipse(bx, by, 36, 44, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(bx - 12, by - 14, 8, 12, -0.5, 0, Math.PI * 2); g.fill()
    }
    floorboards(g, 610, '#8C7B62')
    person(g, 470, 800, 1.0, PEOPLE.ratna, { arms: 'clap' })
    person(g, 650, 812, 1.0, PEOPLE.sari, { arms: 'clap' })
    person(g, 860, 824, 1.06, { ...player, mood: 'warm' })
    person(g, 1060, 812, 1.02, PEOPLE.dimas, { arms: 'clap' })
    person(g, 1400, 790, 1.0, PEOPLE.raka, { arms: 'crossed', dim: 0.2 })
    // table, cake, plates and cups in front
    g.fillStyle = '#5B4636'; rr(g, 330, 790, 900, 70, 12); g.fill()
    g.fillStyle = '#F2ECE0'; rr(g, 320, 776, 920, 24, 8); g.fill()
    for (const px of [410, 520, 1060, 1150]) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(px, 780, 34, 9, 0, 0, Math.PI * 2); g.fill() }
    for (const cx of [600, 980]) { g.fillStyle = '#C8442F'; rr(g, cx, 742, 26, 38, 4); g.fill() }
    g.fillStyle = '#F4EDE0'; rr(g, 770, 700, 180, 80, 10); g.fill()
    g.fillStyle = '#E88FA0'; rr(g, 770, 700, 180, 22, 10); g.fill()
    for (let i = 0; i < 9; i++) { g.fillStyle = '#E88FA0'; g.beginPath(); g.arc(780 + i * 20, 724, 9, 0, Math.PI); g.fill() }
    for (let i = 0; i < 5; i++) {
      const cx = 796 + i * 32
      g.fillStyle = cols[i % 4]; g.fillRect(cx - 3, 668, 6, 34)
      const f = 1 + Math.sin(t * 9 + i * 2) * 0.2
      g.fillStyle = '#FFD45A'; g.beginPath(); g.ellipse(cx, 658, 6 * f, 11 * f, 0, 0, Math.PI * 2); g.fill()
      glow(g, cx, 658, 50, '#FFD45A', 0.35)
    }
    // confetti
    const R = rng(12)
    for (let i = 0; i < 70; i++) {
      const x = R() * W, sp = 40 + R() * 70, ph = R() * 900
      const y = (ph + t * sp) % 900
      g.save(); g.translate(x + Math.sin(t * 2 + i) * 14, y); g.rotate(t * 2 + i)
      g.fillStyle = cols[i % 4]; g.fillRect(-5, -2.5, 10, 5); g.restore()
    }
    finish(g, t, 0.4)
  },

  /** That night: someone at a desk, searching for her. */
  laptop(g, t) {
    g.fillStyle = '#07090D'; g.fillRect(0, 0, W, H)
    windowPane(g, 1150, 90, 300, 340, grad(g, 0, 90, 0, 430, ['#0A1220', '#162238']), '#141920')
    cityline(g, 430, 4, '#0A0F18', '#F2C879', 60, 230, t, 1150, 1450)
    rain(g, t, 30, 0.08)
    // shelf with a trophy he never won
    g.fillStyle = '#12161D'; g.fillRect(120, 250, 360, 14)
    for (let i = 0; i < 7; i++) { g.fillStyle = ['#1C2430', '#232B38', '#18202A'][i % 3]; g.fillRect(140 + i * 34, 170 + (i % 2) * 14, 26, 80 - (i % 2) * 14) }
    g.fillStyle = '#3A3320'; g.fillRect(410, 206, 30, 44); g.beginPath(); g.arc(425, 200, 20, Math.PI, 0); g.fill()
    glow(g, 800, 460, 700, '#5FA0FF', 0.22 + Math.sin(t * 7) * 0.012)
    // desk
    g.fillStyle = '#12161D'; g.fillRect(200, 650, 1200, 34)
    g.fillStyle = '#0C0F14'; g.fillRect(240, 684, 44, 216); g.fillRect(1316, 684, 44, 216)
    // second monitor: code
    g.fillStyle = '#161C27'; rr(g, 240, 380, 300, 220, 10); g.fill(); g.fillStyle = '#0A111C'; g.fillRect(254, 394, 272, 192)
    const R = rng(8)
    for (let i = 0; i < 12; i++) { g.fillStyle = ['#3E6FA8', '#4C8A66', '#8A6A3A'][i % 3]; g.fillRect(266 + (i % 3) * 14, 404 + i * 15, 40 + R() * 160, 6) }
    g.fillStyle = '#161C27'; g.fillRect(376, 600, 28, 50)
    // main screen: an internal lookup with her profile on it
    g.fillStyle = '#1B2230'; rr(g, 560, 300, 520, 330, 14); g.fill()
    g.fillStyle = '#0B1524'; g.fillRect(578, 318, 484, 294)
    g.fillStyle = '#12233C'; g.fillRect(578, 318, 484, 36)
    g.fillStyle = '#7FB0FF'; g.font = '600 17px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'
    g.fillText('payvault-admin › customer lookup', 592, 337)
    g.fillStyle = '#0F1D33'; rr(g, 592, 366, 300, 30, 4); g.fill()
    g.fillStyle = '#C9DBFF'; g.fillText('+62 812 •••• ••41' + (Math.sin(t * 6) > 0 ? '▌' : ''), 602, 382)
    g.fillStyle = PEOPLE.laras.shirt; g.beginPath(); g.arc(640, 462, 38, 0, Math.PI * 2); g.fill()
    g.fillStyle = PEOPLE.laras.hair; g.beginPath(); g.arc(640, 452, 26, Math.PI, 0); g.fill()
    g.fillStyle = PEOPLE.laras.skin; g.beginPath(); g.arc(640, 458, 18, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#E7E3DA'; g.font = '700 24px "IBM Plex Sans Condensed", sans-serif'; g.fillText('LARAS W.', 700, 440)
    g.font = '500 15px "IBM Plex Mono", monospace'
    const rows = ['wallet   USR-0042', 'kin      platform team', 'address  Kost Melati, 7', 'last pay 12:41  Warung Pak Jo']
    const shown = 1 + Math.floor((t * 0.7) % (rows.length + 2))
    rows.slice(0, shown).forEach((r, i) => { g.fillStyle = i === 1 ? '#F2C879' : '#9FB7DB'; g.fillText(r, 700, 470 + i * 24) })
    g.fillStyle = '#C8442F'; rr(g, 592, 566, 190, 32, 4); g.fill(); g.fillStyle = '#fff'; g.fillText('open history ▸', 606, 583)
    g.fillStyle = '#161C27'; g.fillRect(800, 630, 40, 22)
    // keyboard, mug
    g.fillStyle = '#0E1218'; rr(g, 640, 656, 320, 22, 5); g.fill()
    g.fillStyle = '#1A2130'; rr(g, 1090, 610, 46, 44, 6); g.fill()
    // him, from behind, rim-lit by the screen
    g.fillStyle = '#05070A'
    g.beginPath(); g.ellipse(800, 560, 82, 92, 0, 0, Math.PI * 2); g.fill()
    g.beginPath(); g.moveTo(560, 900); g.quadraticCurveTo(570, 680, 720, 650); g.lineTo(880, 650); g.quadraticCurveTo(1030, 680, 1040, 900); g.fill()
    g.strokeStyle = 'rgba(95,160,255,0.4)'; g.lineWidth = 4
    g.beginPath(); g.ellipse(800, 560, 82, 92, 0, Math.PI * 1.12, Math.PI * 1.88); g.stroke()
    g.beginPath(); g.moveTo(574, 800); g.quadraticCurveTo(590, 690, 716, 656); g.stroke()
    g.beginPath(); g.moveTo(1026, 800); g.quadraticCurveTo(1010, 690, 884, 656); g.stroke()
    finish(g, t, 0.7)
  },

  /** Laras in her rented room, as the codes keep coming. */
  alone(g, t) {
    sky(g, ['#121724', '#1A2030'], 0, 640)
    windowPane(g, 1100, 100, 300, 300, grad(g, 0, 100, 0, 400, ['#0E1A30', '#1B2A44']), '#232936')
    g.fillStyle = '#E9E3CC'; g.beginPath(); g.arc(1320, 170, 26, 0, Math.PI * 2); g.fill()
    glow(g, 1320, 170, 150, '#E9E3CC', 0.18)
    g.fillStyle = 'rgba(20,26,40,0.85)'; g.fillRect(1100, 100, 60, 300); g.fillRect(1340, 100, 60, 300)   // curtains
    // posters and fairy lights
    g.fillStyle = '#2A3248'; g.fillRect(180, 150, 150, 200); g.fillStyle = '#E2B33C'; g.beginPath(); g.arc(255, 230, 44, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#3A2F45'; g.fillRect(360, 180, 120, 160); g.fillStyle = '#8FC7D9'; g.fillRect(376, 200, 88, 60)
    g.strokeStyle = '#2B3040'; g.lineWidth = 2; g.beginPath(); g.moveTo(120, 110)
    for (let i = 0; i <= 12; i++) g.lineTo(120 + i * 78, 110 + Math.sin(i * 1.3) * 16 + 14)
    g.stroke()
    for (let i = 0; i <= 12; i++) {
      const on = Math.sin(t * 2 + i * 1.7) > -0.2
      g.fillStyle = on ? '#FFD98A' : '#5A4A2A'
      g.beginPath(); g.arc(120 + i * 78, 126 + Math.sin(i * 1.3) * 16 + 14, 5, 0, Math.PI * 2); g.fill()
      if (on) glow(g, 120 + i * 78, 140 + Math.sin(i * 1.3) * 16, 34, '#FFD98A', 0.2)
    }
    floorboards(g, 640, '#1C202B')
    // desk drowning in sticky notes, laptop shut
    g.fillStyle = '#242A37'; g.fillRect(1010, 520, 440, 22); g.fillRect(1040, 542, 22, 110); g.fillRect(1400, 542, 22, 110)
    g.fillStyle = '#3A4252'; rr(g, 1290, 496, 130, 24, 4); g.fill()
    const R = rng(3)
    for (let i = 0; i < 34; i++) { g.fillStyle = ['#E2C95A', '#E89AA8', '#8FC7D9'][i % 3]; g.save(); g.translate(1040 + R() * 240, 410 + R() * 104); g.rotate(R() * 0.5 - 0.25); g.fillRect(0, 0, 24, 24); g.restore() }
    // bed
    g.fillStyle = '#20263A'; rr(g, 120, 470, 90, 220, 14); g.fill()
    g.fillStyle = '#2A3040'; rr(g, 140, 570, 800, 130, 16); g.fill()
    g.fillStyle = '#4C4470'; rr(g, 140, 548, 800, 74, 20); g.fill()
    g.fillStyle = '#5A5182'; rr(g, 520, 560, 420, 50, 18); g.fill()
    g.fillStyle = '#D9D3C6'; rr(g, 190, 506, 190, 72, 28); g.fill()
    // her: knees up, face hidden, arms round her legs
    const l = PEOPLE.laras
    g.fillStyle = l.hair; rr(g, 540, 300, 150, 250, 62); g.fill()
    g.fillStyle = grad(g, 540, 0, 700, 0, [shade(l.shirt, 0.1), l.shirt, shade(l.shirt, -0.3)])
    g.beginPath(); g.moveTo(538, 566); g.quadraticCurveTo(530, 420, 600, 400); g.lineTo(650, 400); g.quadraticCurveTo(712, 420, 706, 566); g.closePath(); g.fill()
    g.fillStyle = '#2B2F38'; g.beginPath(); g.moveTo(620, 566); g.quadraticCurveTo(640, 420, 720, 430); g.quadraticCurveTo(790, 440, 790, 566); g.closePath(); g.fill()
    g.strokeStyle = shade(l.shirt, -0.28); g.lineWidth = 34; g.lineCap = 'round'
    g.beginPath(); g.moveTo(580, 440); g.quadraticCurveTo(650, 520, 760, 478); g.stroke()
    g.fillStyle = l.skin; g.beginPath(); g.arc(766, 476, 15, 0, Math.PI * 2); g.fill()
    g.fillStyle = l.skin; g.beginPath(); g.ellipse(652, 392, 44, 40, 0.3, 0, Math.PI * 2); g.fill()
    g.fillStyle = l.hair; g.beginPath(); g.ellipse(640, 372, 56, 44, 0.3, Math.PI * 0.9, Math.PI * 2.15); g.fill()
    g.fillStyle = '#E0506E'; rr(g, 676, 348, 18, 7, 3); g.fill()
    // the phone, and the codes that will not stop
    const pulse = 0.5 + 0.5 * Math.sin(t * 5)
    glow(g, 860, 552, 320, '#7FB0FF', 0.2 + pulse * 0.14)
    phone(g, 860, 552, 46, 86, rgba('#A9CBFF', 0.6 + pulse * 0.4), 1.35)
    g.font = '600 19px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'
    for (let i = 0; i < 8; i++) {
      const k = ((t * 0.26 + i / 8) % 1)
      const x = 800 + Math.sin(i * 2.3) * 170, y = 520 - k * 440
      g.globalAlpha = Math.sin(k * Math.PI) * 0.9
      g.fillStyle = '#1D2533'; rr(g, x, y, 262, 42, 12); g.fill()
      g.fillStyle = '#7FB0FF'; g.beginPath(); g.arc(x + 20, y + 21, 7, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#C9DBFF'; g.fillText(`PayVault: ${String((i * 137911 + 412803) % 1000000).padStart(6, '0')}`, x + 36, y + 22)
    }
    g.globalAlpha = 1
    finish(g, t, 0.65)
  },

  /** Week three: her receipts go round the campus group. */
  groupchat(g, t) {
    sky(g, ['#101624', '#1B2233', '#141A28'])
    // out of focus: a lecture hall full of lit phones
    const R = rng(31)
    for (let i = 0; i < 46; i++) {
      const x = R() * W, y = 120 + R() * 660, r = 30 + R() * 60
      glow(g, x, y, r, i % 4 ? '#7FB0FF' : '#F2C879', 0.1 + 0.08 * Math.abs(Math.sin(t * 1.3 + i)))
    }
    // a hand holding the phone
    g.fillStyle = '#C6905F'; rr(g, 560, 640, 150, 300, 60); g.fill(); rr(g, 980, 560, 90, 200, 40); g.fill()
    g.fillStyle = '#0B0E13'; rr(g, 590, 70, 420, 800, 44); g.fill()
    g.fillStyle = '#0E1420'; rr(g, 606, 86, 388, 768, 32); g.fill()
    g.fillStyle = '#151D2C'; rr(g, 606, 86, 388, 74, 32); g.fill(); g.fillRect(606, 130, 388, 30)
    g.fillStyle = '#E7E3DA'; g.font = '700 24px "IBM Plex Sans Condensed", sans-serif'; g.textBaseline = 'middle'
    g.fillText('Angkatan 22 · EKO', 660, 116)
    g.fillStyle = '#6F7C92'; g.font = '500 14px "IBM Plex Sans", sans-serif'; g.fillText('214 members', 660, 140)
    g.fillStyle = '#3567B4'; g.beginPath(); g.arc(634, 124, 16, 0, Math.PI * 2); g.fill()
    // the receipt, forwarded
    g.fillStyle = '#232A35'; rr(g, 626, 184, 268, 300, 16); g.fill()
    g.fillStyle = '#6F7C92'; g.fillText('↪ Forwarded', 642, 204)
    g.fillStyle = '#FFFEF8'; g.fillRect(642, 220, 236, 248)
    g.fillStyle = '#1D1B17'; g.font = '700 17px "IBM Plex Mono", monospace'; g.fillText('PAYVAULT RECEIPT', 656, 244)
    g.font = '500 14px "IBM Plex Mono", monospace'
    ;['KLINIK KONSELING', 'HARAPAN', '', 'Laras Wulandari', '0812 •••• ••41', 'Kost Melati 7', '', 'Rp 150.000  LUNAS'].forEach((r, i) => {
      g.fillStyle = i === 3 || i < 2 ? '#B8321F' : '#4A453C'; g.fillText(r, 656, 274 + i * 24)
    })
    // laughter piling up underneath
    const face = (x: number, y: number, r: number) => {
      g.fillStyle = '#F2C94C'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#5A3B12'; g.beginPath(); g.arc(x, y + r * 0.12, r * 0.56, 0.1, Math.PI - 0.1); g.fill()
      g.strokeStyle = '#5A3B12'; g.lineWidth = r * 0.14
      g.beginPath(); g.arc(x - r * 0.38, y - r * 0.2, r * 0.22, Math.PI * 1.1, Math.PI * 1.9); g.arc(x + r * 0.38, y - r * 0.2, r * 0.22, Math.PI * 1.1, Math.PI * 1.9); g.stroke()
      g.fillStyle = '#6FB6E8'; g.beginPath(); g.ellipse(x - r * 0.86, y + r * 0.1, r * 0.2, r * 0.3, 0.4, 0, Math.PI * 2); g.ellipse(x + r * 0.86, y + r * 0.1, r * 0.2, r * 0.3, -0.4, 0, Math.PI * 2); g.fill()
    }
    const n = 2 + Math.floor((t * 1.4) % 6)
    for (let i = 0; i < n; i++) {
      const y = 508 + i * 54, mine = i % 3 === 2
      g.fillStyle = '#232A35'; rr(g, mine ? 800 : 626, y, 170, 44, 14); g.fill()
      for (let k = 0; k < 3 + (i % 3); k++) face((mine ? 822 : 648) + k * 30, y + 22, 12)
    }
    g.fillStyle = '#151D2C'; rr(g, 626, 800, 348, 40, 20); g.fill()
    g.fillStyle = '#C8442F'; rr(g, 900, 184, 78, 30, 15); g.fill(); g.fillStyle = '#fff'; g.font = '700 15px "IBM Plex Mono", monospace'; g.fillText(`+${40 + Math.floor(t * 3) % 160}`, 916, 200)
    // reactions floating off the screen
    for (let i = 0; i < 9; i++) {
      const k = (t * 0.22 + i / 9) % 1
      g.globalAlpha = Math.sin(k * Math.PI) * 0.9
      face(300 + (i % 2) * 1000 + Math.sin(i * 3 + t) * 60 - (i % 2) * 120 + (i % 3) * 60, 820 - k * 760, 22 + (i % 3) * 8)
    }
    g.globalAlpha = 1
    finish(g, t, 0.7)
  },

  /** Seven in the morning, on the train, reading what she sent at two. */
  train(g, t, player) {
    sky(g, ['#F2B880', '#F7D9A6', '#DCE6EE'], 0, 520)
    // the city sliding past the windows
    const slide = (t * 260) % 2000
    g.save(); g.translate(-slide, 0)
    cityline(g, 520, 17, '#C98F6A', '#FFE9B8', 60, 260, 0, 0, 3700)
    g.restore()
    for (let i = 0; i < 8; i++) { const x = ((i * 330 - t * 900) % 2600 + 2600) % 2600 - 300; g.fillStyle = '#5A4638'; g.fillRect(x, 120, 14, 400) }
    glow(g, 1180, 300, 520, '#FFE2A8', 0.45)
    // carriage wall with three windows
    g.fillStyle = '#C9CED3'
    g.fillRect(0, 0, W, 130); g.fillRect(0, 520, W, 380)
    for (const x of [0, 470, 1010, 1550]) g.fillRect(x - 40, 130, 130, 390)
    g.fillStyle = '#AEB4BA'; g.fillRect(0, 118, W, 14); g.fillRect(0, 516, W, 12)
    g.fillStyle = '#E3E6E8'; g.fillRect(0, 0, W, 60)
    g.fillStyle = '#8E959C'; g.fillRect(0, 84, W, 8)                              // grab rail
    for (let i = 0; i < 9; i++) {
      const x = 90 + i * 180, sway = Math.sin(t * 2 + i) * 6
      g.strokeStyle = '#6E757C'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 90); g.lineTo(x + sway, 150); g.stroke()
      g.strokeStyle = '#E3E6E8'; g.lineWidth = 7; g.beginPath(); g.arc(x + sway, 172, 20, 0, Math.PI * 2); g.stroke()
    }
    // seats
    g.fillStyle = '#3F6A8A'; rr(g, 0, 600, W, 150, 20); g.fill()
    g.fillStyle = '#35597A'; g.fillRect(0, 720, W, 40)
    g.fillStyle = '#8E959C'; g.fillRect(0, 760, W, 140)
    // other commuters, half asleep
    person(g, 250, 860, 1.1, { shirt: '#6A7480', hair: '#2A1C17', skin: '#C6905F', mood: 'flat' }, { arms: 'phone', dim: 0.12 })
    person(g, 1330, 866, 1.12, { shirt: '#8A6A5A', hair: '#17130F', skin: '#D0A07A', hairStyle: 'long', mood: 'flat' }, { dim: 0.15 })
    // you, with her message on the screen
    person(g, 760, 880, 1.32, { ...player, mood: 'sad' }, { arms: 'phone' })
    glow(g, 800, 640, 150, '#A9CBFF', 0.3)
    g.fillStyle = '#0E1218EE'; rr(g, 900, 250, 470, 170, 22); g.fill()
    g.fillStyle = '#6F7C92'; g.font = '600 18px "IBM Plex Sans", sans-serif'; g.textBaseline = 'middle'; g.fillText('Laras · 02:07', 928, 286)
    g.fillStyle = '#232A35'; rr(g, 924, 306, 250, 44, 16); g.fill(); rr(g, 924, 358, 410, 44, 16); g.fill()
    g.fillStyle = '#E7E3DA'; g.font = '500 20px "IBM Plex Sans", sans-serif'
    g.fillText('kak are you awake', 942, 329); g.fillText('never mind. sleep well.', 942, 381)
    g.fillStyle = '#0E1218EE'; poly(g, [900, 400, 860, 470, 950, 418], '#0E1218EE')
    finish(g, t, 0.35)
  },

  funeral(g, t) {
    sky(g, ['#565E68', '#838A92', '#9AA0A2'], 0, 620)
    g.fillStyle = '#6E7A70'; g.beginPath(); g.moveTo(0, 560); g.quadraticCurveTo(500, 470, 1100, 540); g.quadraticCurveTo(1400, 570, W, 520); g.lineTo(W, 640); g.lineTo(0, 640); g.fill()
    g.fillStyle = '#5E6B5A'; g.beginPath(); g.moveTo(0, 620); g.quadraticCurveTo(800, 540, W, 620); g.lineTo(W, H); g.lineTo(0, H); g.fill()
    g.fillStyle = '#4C5849'; g.beginPath(); g.moveTo(0, 730); g.quadraticCurveTo(800, 670, W, 740); g.lineTo(W, H); g.lineTo(0, H); g.fill()
    // other graves, far off
    for (const [x, y] of [[180, 590], [300, 600], [1380, 596], [1480, 606], [1100, 584]]) { g.fillStyle = '#7C847C'; rr(g, x, y - 34, 22, 40, 8); g.fill() }
    // frangipani tree, a few flowers still on it
    g.strokeStyle = '#3A342E'; g.lineWidth = 26; g.lineCap = 'round'
    g.beginPath(); g.moveTo(1330, 640); g.quadraticCurveTo(1320, 480, 1350, 380); g.stroke()
    g.lineWidth = 14; g.beginPath(); g.moveTo(1344, 440); g.quadraticCurveTo(1260, 360, 1230, 300); g.moveTo(1350, 400); g.quadraticCurveTo(1430, 340, 1450, 270); g.stroke()
    for (const [x, y, r] of [[1350, 260, 110], [1240, 300, 84], [1450, 290, 90], [1300, 210, 70]]) { g.fillStyle = '#46523F'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    const R = rng(5)
    for (let i = 0; i < 16; i++) { g.fillStyle = '#F4EDE0'; g.beginPath(); g.arc(1200 + R() * 290, 190 + R() * 190, 7, 0, Math.PI * 2); g.fill() }
    // the grave: fresh earth, a wooden marker, petals
    g.fillStyle = '#6B5645'; g.beginPath(); g.ellipse(800, 668, 190, 34, 0, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#7A6452'; g.beginPath(); g.ellipse(800, 660, 170, 24, 0, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#8A7458'; rr(g, 780, 560, 40, 96, 10); g.fill()
    g.fillStyle = '#5E4C38'; g.fillRect(788, 584, 24, 4); g.fillRect(788, 596, 18, 4)
    for (let i = 0; i < 60; i++) { g.fillStyle = ['#F4EDE0', '#E2B33C', '#E89AA8', '#C8442F'][i % 4]; g.beginPath(); g.arc(660 + R() * 280, 646 + R() * 30, 5 + R() * 3, 0, Math.PI * 2); g.fill() }
    // mourners from behind, under umbrellas
    const dark = (l: Look): Look => ({ ...l, shirt: '#22252B', pants: '#1A1C21' })
    person(g, 150, 880, 1.02, dark(PEOPLE.dimas), { back: true, umbrella: true })
    person(g, 340, 890, 1.0, dark(PEOPLE.sari), { back: true, umbrella: true })
    person(g, 1090, 890, 1.0, dark(PEOPLE.ratna), { back: true, umbrella: true })
    person(g, 1290, 880, 1.04, dark(PEOPLE.raka), { back: true, umbrella: true })
    person(g, 560, 900, 1.14, { shirt: '#1A1C21', hair: '#2C241D', skin: '#D2A380', pants: '#15171B' }, { back: true })
    rain(g, t, 170, 0.34)
    g.fillStyle = 'rgba(40,46,56,0.22)'; g.fillRect(0, 0, W, H)
    finish(g, t, 0.6)
  },

  /** 01:31, the phone lights up on your desk. */
  homeNight(g, t, player) {
    sky(g, ['#0C1018', '#141A26'], 0, 640)
    windowPane(g, 160, 90, 340, 300, grad(g, 0, 90, 0, 390, ['#0C1628', '#17243C']), '#1E2430')
    cityline(g, 390, 8, '#0A0F18', '#F2C879', 30, 130, t, 160, 500)
    g.fillStyle = 'rgba(20,26,40,0.8)'; g.fillRect(160, 90, 54, 300)
    // a shelf, a frame with two people in it
    g.fillStyle = '#1B2130'; g.fillRect(600, 230, 330, 12)
    g.fillStyle = '#2A3142'; rr(g, 640, 150, 90, 80, 4); g.fill()
    g.fillStyle = '#3A4458'; g.fillRect(650, 160, 70, 60)
    g.fillStyle = '#E2B33C'; g.beginPath(); g.arc(672, 198, 12, 0, Math.PI * 2); g.fill(); g.fillStyle = player.shirt; g.beginPath(); g.arc(700, 194, 13, 0, Math.PI * 2); g.fill()
    for (let i = 0; i < 5; i++) { g.fillStyle = ['#2C3548', '#343C50', '#262E40'][i % 3]; g.fillRect(760 + i * 30, 164 + (i % 2) * 10, 24, 66 - (i % 2) * 10) }
    floorboards(g, 640, '#161A24')
    // the door stands open; down the hall, her door, shut
    g.fillStyle = '#0E1118'; g.fillRect(1180, 150, 280, 490)
    g.fillStyle = grad(g, 1200, 0, 1440, 0, ['#2A2418', '#1A1710']); g.fillRect(1200, 170, 240, 470)
    g.fillStyle = '#3A2F22'; g.fillRect(1290, 250, 110, 390)
    g.fillStyle = '#E9E4D6'; rr(g, 1318, 300, 56, 22, 3); g.fill()
    g.fillStyle = '#4A453C'; g.font = '700 14px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'; g.fillText('LARAS', 1324, 312)
    glow(g, 1320, 420, 260, '#E8C98A', 0.12)
    g.fillStyle = '#231C14'; poly(g, [1180, 150, 1200, 170, 1200, 640, 1180, 640], '#16110B')
    // bed, slept in badly
    g.fillStyle = '#20263A'; rr(g, 0, 520, 420, 200, 18); g.fill()
    g.fillStyle = '#39415A'; g.beginPath(); g.moveTo(0, 560); g.quadraticCurveTo(180, 500, 300, 570); g.quadraticCurveTo(380, 610, 420, 580); g.lineTo(420, 700); g.lineTo(0, 700); g.fill()
    g.fillStyle = '#C9C3B6'; rr(g, 20, 500, 150, 60, 24); g.fill()
    // clock
    g.fillStyle = '#0B0E13'; rr(g, 990, 250, 160, 60, 8); g.fill()
    g.fillStyle = '#E0503A'; g.font = '600 36px "IBM Plex Mono", monospace'
    g.fillText(Math.sin(t * 3) > 0 ? '01:31' : '01 31', 1008, 282)
    glow(g, 1070, 280, 120, '#E0503A', 0.12)
    // desk, dead monitor, the phone awake
    g.fillStyle = '#232936'; g.fillRect(500, 610, 760, 26); g.fillRect(530, 636, 26, 264); g.fillRect(1204, 636, 26, 264)
    g.fillStyle = '#161C27'; rr(g, 620, 430, 260, 170, 10); g.fill(); g.fillStyle = '#0A0E15'; g.fillRect(632, 442, 236, 146); g.fillStyle = '#161C27'; g.fillRect(736, 600, 28, 12)
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2)
    glow(g, 990, 590, 400, '#7FB0FF', 0.2 + pulse * 0.13)
    phone(g, 990, 596, 96, 30, rgba('#A9CBFF', 0.6 + pulse * 0.4))
    g.fillStyle = '#0E1218EE'; rr(g, 860, 470, 300, 84, 16); g.fill()
    g.fillStyle = '#7FB0FF'; g.font = '600 15px "IBM Plex Sans", sans-serif'; g.fillText('Laras · scheduled', 880, 494)
    g.fillStyle = '#E7E3DA'; g.font = '500 18px "IBM Plex Sans", sans-serif'; g.fillText('kak. if you\'re reading this…', 880, 524)
    person(g, 760, 900, 1.5, player, { back: true, dim: 0.4 })
    g.fillStyle = '#1A1E28'; rr(g, 640, 660, 240, 260, 26); g.fill()
    finish(g, t, 0.7)
  },

  /** Kost Melati from the yard. */
  kost(g, t) {
    sky(g, ['#0A0F1A', '#152034', '#22304A'], 0, 700)
    stars(g, 2, 80, 300, t)
    g.fillStyle = '#E9E3CC'; g.beginPath(); g.arc(1380, 130, 34, 0, Math.PI * 2); g.fill(); glow(g, 1380, 130, 200, '#E9E3CC', 0.14)
    // a mango tree behind the roof
    for (const [x, y, r] of [[120, 250, 130], [40, 330, 100], [230, 300, 90]]) { g.fillStyle = '#16241E'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#1B2029'; g.fillRect(0, 700, W, 200)
    g.fillStyle = '#232934'; for (let i = 0; i < 14; i++) rr(g, 60 + i * 120, 730 + (i % 2) * 40, 90, 26, 6), g.fill()
    // building, tiled roof
    g.fillStyle = '#39463F'; g.fillRect(140, 300, 980, 400)
    poly(g, [90, 300, 1170, 300, 1100, 220, 160, 220], '#5A3A2E')
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(100 + i * 13, 290 - i * 16); g.lineTo(1160 - i * 13, 290 - i * 16); g.stroke() }
    g.fillStyle = '#2E3832'; g.fillRect(140, 690, 980, 14)
    g.fillStyle = '#8A9A8E'; g.fillRect(140, 300, 980, 10)
    g.font = '700 30px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (const [i, n] of [6, 7, 8].entries()) {
      const x = 220 + i * 310
      g.fillStyle = '#22292A'; g.fillRect(x, 420, 130, 270)
      g.fillStyle = grad(g, x, 0, x + 130, 0, ['#5A4836', '#43342A']); g.fillRect(x + 8, 428, 114, 262)
      g.fillStyle = '#C9B37A'; g.beginPath(); g.arc(x + 104, 566, 6, 0, Math.PI * 2); g.fill()
      const lit = n === 8
      g.fillStyle = lit ? '#F2C879' : '#131820'; g.fillRect(x + 160, 440, 110, 110)
      g.fillStyle = '#22292A'; g.fillRect(x + 212, 440, 6, 110); g.fillRect(x + 160, 492, 110, 6)
      if (lit) { glow(g, x + 215, 495, 240, '#F2C879', 0.24); g.fillStyle = '#6A7FB8'; rr(g, x + 226, 470, 26, 80, 10); g.fill(); g.fillStyle = '#2B1D16'; g.beginPath(); g.arc(x + 239, 462, 14, 0, Math.PI * 2); g.fill() }
      g.fillStyle = '#D8CDB0'; g.fillText(String(n), x + 65, 470)
      if (n !== 7) for (let k = 0; k < 2; k++) { g.fillStyle = ['#3567B4', '#C8442F'][k]; rr(g, x + 20 + k * 30, 690, 24, 10, 4); g.fill() }   // sandals
    }
    // a washing line, and dried flowers at her door
    g.strokeStyle = '#8A9A8E'; g.lineWidth = 2; g.beginPath(); g.moveTo(150, 360); g.quadraticCurveTo(330, 384, 500, 360); g.stroke()
    for (const [x, c] of [[210, '#C8442F'], [290, '#E9E4D6'], [370, '#3567B4']] as const) { g.fillStyle = c; g.save(); g.translate(x, 372); g.rotate(Math.sin(t * 1.5 + x) * 0.05); g.fillRect(0, 0, 54, 40); g.restore() }
    g.strokeStyle = '#6E6248'; g.lineWidth = 3
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(574 + i * 8, 700); g.lineTo(560 + i * 13, 656); g.stroke(); g.fillStyle = ['#8C7A5A', '#9A6F62'][i % 2]; g.beginPath(); g.arc(560 + i * 13, 652, 7, 0, Math.PI * 2); g.fill() }
    // the warung, still open
    g.fillStyle = '#6E4B2E'; g.fillRect(1240, 560, 260, 150)
    g.fillStyle = '#8A6240'; g.fillRect(1240, 560, 260, 16)
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#C8442F' : '#EFE7D6'; g.fillRect(1216 + i * 33, 496, 33, 46) }
    g.fillStyle = '#3A2A1C'; g.fillRect(1230, 542, 8, 168); g.fillRect(1500, 542, 8, 168)
    g.fillStyle = '#EFE7D6'; g.font = '700 18px "IBM Plex Sans Condensed", sans-serif'; g.fillText('MIE AYAM PAK JO', 1370, 634)
    for (const px of [1290, 1350]) { g.fillStyle = '#C9CDD1'; rr(g, px, 524, 44, 36, 6); g.fill() }
    g.fillStyle = '#05070A'; g.beginPath(); g.arc(1440, 520, 22, 0, Math.PI * 2); g.fill(); rr(g, 1412, 536, 56, 40, 12); g.fill()
    const fl = 0.85 + Math.sin(t * 11) * 0.05 + Math.sin(t * 3.1) * 0.06
    g.fillStyle = '#FFE2A0'; g.beginPath(); g.arc(1370, 478, 12, 0, Math.PI * 2); g.fill()
    glow(g, 1370, 520, 340, '#F2C879', 0.42 * fl)
    g.fillStyle = 'rgba(240,240,240,0.14)'
    for (let i = 0; i < 5; i++) { const k = (t * 0.3 + i / 5) % 1; g.beginPath(); g.arc(1312 + Math.sin(k * 6 + i) * 14, 520 - k * 150, 12 + k * 22, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#17191D'; rr(g, 1180, 700, 40, 14, 5); g.fill(); g.fillRect(1196, 660, 8, 44)   // stool
    g.textAlign = 'start'
    finish(g, t, 0.6)
  },

  /** The faculty building after hours: one lit window, a chained gate. */
  campus(g, t) {
    sky(g, ['#080C16', '#121B2E', '#1E2A42'], 0, 720)
    stars(g, 4, 70, 260, t)
    for (const [x, y, r] of [[90, 420, 150], [1520, 400, 170], [1420, 480, 110]]) { g.fillStyle = '#0F1A18'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#161B24'; g.fillRect(0, 720, W, 180)
    g.fillStyle = '#1E2430'; poly(g, [640, 720, 960, 720, 1160, 900, 440, 900], '#1E2430')
    g.fillStyle = '#2C3340'; g.fillRect(260, 220, 1080, 500)
    g.fillStyle = '#232934'; g.fillRect(230, 190, 1140, 40)
    g.fillStyle = '#3A4252'; g.fillRect(700, 250, 200, 470)
    for (const cx of [716, 868]) { g.fillStyle = '#4A5364'; g.fillRect(cx, 330, 16, 390) }
    g.fillStyle = '#D8CDB0'; g.font = '700 26px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('FAKULTAS EKONOMI', 800, 290)
    for (let f = 0; f < 3; f++) for (let c = 0; c < 8; c++) {
      const x = 300 + c * 128 + (c > 3 ? 40 : 0), y = 330 + f * 124
      if (x > 660 && x < 900) continue
      const lit = f === 2 && c === 1
      g.fillStyle = lit ? '#F2C879' : '#141A24'; g.fillRect(x, y, 84, 70)
      g.fillStyle = '#232934'; g.fillRect(x + 40, y, 4, 70); g.fillRect(x, y + 33, 84, 4)
      g.fillStyle = '#3A4252'; g.fillRect(x - 6, y + 70, 96, 6)
      if (lit) { glow(g, x + 42, y + 35, 280, '#F2C879', 0.26 + Math.sin(t * 2) * 0.01); g.fillStyle = '#3E4E78'; rr(g, x + 50, y + 26, 22, 44, 9); g.fill(); g.fillStyle = '#231814'; g.beginPath(); g.arc(x + 61, y + 20, 11, 0, Math.PI * 2); g.fill() }
    }
    g.fillStyle = '#10141B'; g.fillRect(760, 560, 80, 160)
    g.fillStyle = '#4A3B2C'; g.fillRect(920, 560, 150, 110)
    g.fillStyle = '#7C6A52'; g.fillRect(928, 568, 134, 94)
    for (const [x, y, c] of [[936, 576, '#E9E4D6'], [984, 580, '#C8442F'], [940, 620, '#8FC7D9']] as const) { g.fillStyle = c; g.fillRect(x, y, 38, 34) }
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.strokeRect(1000, 616, 50, 40); g.setLineDash([])
    // lamp post
    g.fillStyle = '#0B0E13'; g.fillRect(1196, 380, 10, 340); g.fillRect(1150, 376, 56, 10)
    g.fillStyle = '#FFE2A0'; g.beginPath(); g.arc(1156, 392, 10, 0, Math.PI * 2); g.fill(); glow(g, 1156, 420, 260, '#F2C879', 0.2)
    // gate, chained
    g.strokeStyle = '#0B0E13'; g.lineWidth = 7
    for (let x = 80; x < W - 60; x += 46) { g.beginPath(); g.moveTo(x, 900); g.lineTo(x, 640); g.stroke(); poly(g, [x - 7, 640, x + 7, 640, x, 618], '#0B0E13') }
    g.lineWidth = 9; g.beginPath(); g.moveTo(60, 664); g.lineTo(W - 60, 664); g.moveTo(60, 860); g.lineTo(W - 60, 860); g.stroke()
    g.strokeStyle = '#8E97A6'; g.lineWidth = 5
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(770 + i * 15, 700 + Math.sin(i) * 8, 10, 7, i, 0, Math.PI * 2); g.stroke() }
    g.fillStyle = '#C9B37A'; rr(g, 786, 716, 28, 30, 5); g.fill()
    // the guard and his torch
    const sw = Math.sin(t * 0.7) * 70
    g.fillStyle = 'rgba(255,241,200,0.10)'; poly(g, [1440, 760, 1200 + sw, 900, 1420 + sw, 900], 'rgba(255,241,200,0.10)')
    glow(g, 1310 + sw, 860, 200, '#FFF1C8', 0.22)
    g.fillStyle = '#05070A'; rr(g, 1420, 690, 58, 160, 20); g.fill(); g.beginPath(); g.arc(1449, 666, 25, 0, Math.PI * 2); g.fill(); rr(g, 1420, 648, 58, 12, 4); g.fill()
    g.textAlign = 'start'
    finish(g, t, 0.6)
  },

  /** PayVault tower with one floor in alarm. */
  tower(g, t) {
    sky(g, ['#06080D', '#0D1422', '#182238'], 0, 780)
    stars(g, 7, 60, 240, t)
    // low cloud catching the red
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2)
    for (const [x, y, r] of [[420, 230, 220], [1220, 190, 260], [820, 110, 180]]) glow(g, x, y, r, '#2A3550', 0.5)
    cityline(g, 780, 11, '#0A0F18', '#F2C879', 120, 420, t)
    cityline(g, 780, 12, '#0D131E', '#9CC8FF', 60, 260, t)
    const x = 640, w = 320, top = 60
    g.fillStyle = grad(g, x, 0, x + w, 0, ['#131B28', '#0F1620', '#0A1018']); g.fillRect(x, top, w, 720)
    g.fillStyle = '#0B111A'; g.fillRect(x + w - 60, top, 60, 720)
    g.fillStyle = '#1A2434'; g.fillRect(x - 8, top - 10, w + 16, 12); g.fillRect(x + 140, top - 70, 8, 62)
    g.fillStyle = Math.sin(t * 2) > 0 ? '#FF4A33' : '#5A1A12'; g.beginPath(); g.arc(x + 144, top - 72, 5, 0, Math.PI * 2); g.fill()
    const R = rng(21)
    for (let f = 0; f < 34; f++) {
      const y = top + 16 + f * 20
      const alarm = f === 20
      for (let c = 0; c < 14; c++) {
        const r = R()
        if (alarm) g.fillStyle = rgba('#FF4A33', 0.45 + pulse * 0.55)
        else if (r < 0.1) g.fillStyle = 'rgba(242,200,121,0.55)'
        else g.fillStyle = 'rgba(120,150,190,0.10)'
        g.fillRect(x + 14 + c * 21, y, 15, 11)
      }
    }
    glow(g, x + w / 2, top + 16 + 20 * 20, 460, '#FF4A33', 0.13 + pulse * 0.13)
    g.fillStyle = '#DDE4F0'; g.font = '700 26px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('PAYVAULT', x + w / 2, top + 730)
    g.textAlign = 'start'
    // wet street, lamps, and you arriving
    g.fillStyle = '#090C12'; g.fillRect(0, 780, W, 120)
    g.fillStyle = rgba('#FF4A33', 0.05 + pulse * 0.07); g.fillRect(x, 780, w, 120)
    g.fillStyle = 'rgba(255,255,255,0.10)'; for (let i = -120; i < W; i += 120) g.fillRect(i + ((t * 60) % 120), 840, 60, 5)
    for (const lx of [120, 520, 1100, 1480]) { g.fillStyle = '#0B0E13'; g.fillRect(lx, 600, 8, 180); g.fillStyle = '#FFE2A0'; g.beginPath(); g.arc(lx + 4, 598, 9, 0, Math.PI * 2); g.fill(); glow(g, lx + 4, 620, 150, '#F2C879', 0.16); glow(g, lx + 4, 820, 90, '#F2C879', 0.08) }
    glow(g, 330, 834, 280, '#FFF1C8', 0.3)
    g.fillStyle = '#05070A'
    g.beginPath(); g.arc(214, 846, 24, 0, Math.PI * 2); g.arc(316, 846, 24, 0, Math.PI * 2); g.fill()
    rr(g, 220, 806, 96, 30, 12); g.fill(); rr(g, 244, 760, 36, 54, 14); g.fill(); g.beginPath(); g.arc(262, 746, 19, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#FFF1C8'; g.beginPath(); g.arc(326, 820, 8, 0, Math.PI * 2); g.fill()
    finish(g, t, 0.6)
  },
}

export function drawArt(g: Ctx, id: ArtId, t: number, playerColor: string) {
  SCENES[id](g, t, { shirt: playerColor, hair: '#2C241D', skin: '#D2A380', hairStyle: 'short', mood: 'flat' })
}

export const ART_W = W, ART_H = H

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
