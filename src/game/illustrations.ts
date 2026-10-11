// Drawn scenes for story beats. Each one paints a 1600×900 stage; the caller
// scales it to cover the screen. `t` is seconds, for small ambient motion.

import { rr, shade, rng, type Ctx } from './sprites'
import type { ArtId } from '@/data/story'

const W = 1600, H = 900

interface Look { shirt: string; hair: string; skin: string; long?: boolean; glasses?: boolean; bun?: boolean }

const PEOPLE: Record<string, Look> = {
  sari:  { skin: '#D9A77E', hair: '#2A1C17', shirt: '#2A8B8B', long: true },
  dimas: { skin: '#C6905F', hair: '#17130F', shirt: '#B5622B' },
  raka:  { skin: '#CFA07A', hair: '#1B1B1F', shirt: '#4A4F5A', glasses: true },
  ratna: { skin: '#D2A380', hair: '#5A534E', shirt: '#7A3B52', glasses: true, bun: true },
  laras: { skin: '#DDB08A', hair: '#231814', shirt: '#E2B33C', long: true },
}

function sky(g: Ctx, stops: string[], y0 = 0, y1 = H) {
  const gr = g.createLinearGradient(0, y0, 0, y1)
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c))
  g.fillStyle = gr
  g.fillRect(0, y0, W, y1 - y0)
}

function glow(g: Ctx, x: number, y: number, r: number, color: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, 0))
  g.fillStyle = gr
  g.fillRect(x - r, y - r, r * 2, r * 2)
}

/** A standing figure about 300·s tall; (x, y) is between the feet. */
function person(g: Ctx, x: number, y: number, s: number, l: Look, o: { back?: boolean; shadow?: number; arms?: 'down' | 'clap' } = {}) {
  if (o.shadow) l = { ...l, shirt: shade(l.shirt, -o.shadow), skin: shade(l.skin, -o.shadow), hair: shade(l.hair, -o.shadow) }
  g.save()
  g.translate(x, y); g.scale(s, s)
  const dark = shade(l.shirt, -0.3)
  g.fillStyle = 'rgba(0,0,0,0.25)'
  g.beginPath(); g.ellipse(0, 0, 58, 12, 0, 0, Math.PI * 2); g.fill()
  // legs
  g.fillStyle = '#2B2F38'
  rr(g, -34, -120, 30, 120, 10); g.fill()
  rr(g, 4, -120, 30, 120, 10); g.fill()
  if (l.long) { g.fillStyle = l.hair; rr(g, -40, -292, 80, 120, 34); g.fill() }
  // arms
  g.fillStyle = dark
  if (o.arms === 'clap') { rr(g, -30, -200, 60, 26, 13); g.fill() }
  else { rr(g, -58, -212, 22, 96, 11); g.fill(); rr(g, 36, -212, 22, 96, 11); g.fill() }
  // torso
  const tg = g.createLinearGradient(-44, 0, 44, 0)
  tg.addColorStop(0, shade(l.shirt, 0.12)); tg.addColorStop(1, dark)
  g.fillStyle = tg
  rr(g, -44, -222, 88, 116, 26); g.fill()
  if (o.arms === 'clap') { g.fillStyle = l.skin; rr(g, -14, -202, 28, 22, 9); g.fill() }
  // head
  g.fillStyle = shade(l.skin, -0.12); rr(g, -11, -238, 22, 24, 8); g.fill()
  g.fillStyle = l.skin
  g.beginPath(); g.ellipse(0, -262, 32, 36, 0, 0, Math.PI * 2); g.fill()
  g.fillStyle = l.hair
  g.beginPath()
  if (o.back) g.ellipse(0, -264, 33, 37, 0, 0, Math.PI * 2)
  else { g.moveTo(-33, -262); g.quadraticCurveTo(-36, -304, 0, -302); g.quadraticCurveTo(36, -304, 33, -262); g.quadraticCurveTo(20, -284, 0, -283); g.quadraticCurveTo(-20, -284, -33, -262) }
  g.fill()
  if (l.bun) { g.beginPath(); g.arc(0, -306, 14, 0, Math.PI * 2); g.fill() }
  if (!o.back) {
    g.fillStyle = '#1B1612'
    g.beginPath(); g.arc(-12, -258, 3.2, 0, Math.PI * 2); g.arc(12, -258, 3.2, 0, Math.PI * 2); g.fill()
    if (l.glasses) {
      g.strokeStyle = '#1B1612'; g.lineWidth = 2.4
      rr(g, -24, -268, 20, 18, 5); g.stroke(); rr(g, 4, -268, 20, 18, 5); g.stroke()
    }
  }
  g.restore()
}

function windowPane(g: Ctx, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, frame = '#3A3F49') {
  g.fillStyle = frame; g.fillRect(x - 8, y - 8, w + 16, h + 16)
  g.fillStyle = fill; g.fillRect(x, y, w, h)
  g.fillStyle = frame; g.fillRect(x + w / 2 - 3, y, 6, h); g.fillRect(x, y + h / 2 - 3, w, 6)
}

function cityline(g: Ctx, base: number, seed: number, color: string, lit: string, minH: number, maxH: number, t: number) {
  const R = rng(seed)
  let x = -20
  while (x < W) {
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

// ─── Scenes ──────────────────────────────────────────────────────────────

const SCENES: Record<ArtId, (g: Ctx, t: number, player: Look) => void> = {
  /** Friday cake in the pantry. Raka stands a step apart. */
  party(g, t, player) {
    sky(g, ['#E9DCC0', '#D9C6A2'], 0, 620)
    const sun = g.createLinearGradient(0, 120, 0, 420)
    sun.addColorStop(0, '#FCE6B0'); sun.addColorStop(1, '#F2B878')
    windowPane(g, 140, 120, 300, 300, sun, '#8A7A60')
    windowPane(g, 1160, 120, 300, 300, sun, '#8A7A60')
    glow(g, 290, 270, 520, '#FFE0A0', 0.35)
    // bunting
    const cols = ['#C8442F', '#3567B4', '#E2B33C', '#3D8A5C']
    for (let i = 0; i < 22; i++) {
      const x = 80 + i * 68, y = 60 + Math.sin(i * 0.5) * 16 + Math.sin(t * 1.2 + i) * 2
      g.fillStyle = cols[i % 4]
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 44, y); g.lineTo(x + 22, y + 46); g.closePath(); g.fill()
    }
    g.fillStyle = '#8C7B62'; g.fillRect(0, 620, W, 280)
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < W; x += 100) g.fillRect(x, 620, 2, 280)
    person(g, 430, 760, 1.05, PEOPLE.ratna, { arms: 'clap' })
    person(g, 640, 770, 1.05, PEOPLE.sari, { arms: 'clap' })
    person(g, 860, 780, 1.12, player)
    person(g, 1080, 770, 1.08, PEOPLE.dimas, { arms: 'clap' })
    person(g, 1380, 750, 1.02, PEOPLE.raka, { shadow: 0.22 })
    // table and cake in front
    g.fillStyle = '#5B4636'; rr(g, 330, 760, 900, 60, 12); g.fill()
    g.fillStyle = '#6E5644'; rr(g, 330, 760, 900, 18, 9); g.fill()
    g.fillStyle = '#F4EDE0'; rr(g, 770, 690, 180, 72, 10); g.fill()
    g.fillStyle = '#E88FA0'; rr(g, 770, 690, 180, 20, 10); g.fill()
    for (let i = 0; i < 5; i++) {
      const cx = 796 + i * 32
      g.fillStyle = cols[i % 4]; g.fillRect(cx - 3, 660, 6, 32)
      const f = 1 + Math.sin(t * 9 + i * 2) * 0.2
      g.fillStyle = '#FFD45A'; g.beginPath(); g.ellipse(cx, 650, 6 * f, 11 * f, 0, 0, Math.PI * 2); g.fill()
      glow(g, cx, 650, 46, '#FFD45A', 0.35)
    }
  },

  /** Someone at a laptop, seen from behind. */
  laptop(g, t) {
    g.fillStyle = '#07090D'; g.fillRect(0, 0, W, H)
    windowPane(g, 1140, 110, 280, 330, '#0D1626', '#141920')
    cityline(g, 440, 4, '#0A0F18', '#F2C879', 60, 220, t)
    g.fillStyle = '#141920'; g.fillRect(1132, 432, 296, 16)
    glow(g, 800, 470, 620, '#5FA0FF', 0.2 + Math.sin(t * 7) * 0.012)
    // desk
    g.fillStyle = '#12161D'; g.fillRect(260, 640, 1080, 30)
    g.fillStyle = '#0C0F14'; g.fillRect(300, 670, 40, 230); g.fillRect(1260, 670, 40, 230)
    // screen
    g.fillStyle = '#1B2230'; rr(g, 560, 330, 480, 310, 14); g.fill()
    g.fillStyle = '#0B1524'; g.fillRect(580, 350, 440, 270)
    g.font = '600 20px "IBM Plex Mono", monospace'; g.textBaseline = 'top'
    const lines = ['> search --phone +62 812 ••• ••41', '  1 match · wallet USR-0042', '  name   LARAS', '  kin    platform team', '> open --history', '']
    const shown = Math.min(lines.length, 1 + Math.floor((t * 0.9) % (lines.length + 2)))
    for (let i = 0; i < shown; i++) { g.fillStyle = i % 2 ? '#7FB0FF' : '#9FE3B4'; g.fillText(lines[i], 600, 372 + i * 36) }
    if (Math.sin(t * 6) > 0) { g.fillStyle = '#9FE3B4'; g.fillRect(600, 372 + shown * 36, 12, 22) }
    // figure
    g.fillStyle = '#05070A'
    g.beginPath(); g.ellipse(800, 520, 74, 84, 0, 0, Math.PI * 2); g.fill()
    rr(g, 600, 590, 400, 340, 90); g.fill()
    g.strokeStyle = 'rgba(95,160,255,0.35)'; g.lineWidth = 4
    g.beginPath(); g.ellipse(800, 520, 74, 84, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke()
  },

  /** Laras in her rented room, phone lighting up. */
  alone(g, t) {
    sky(g, ['#10141E', '#171C28'], 0, 640)
    const night = g.createLinearGradient(0, 110, 0, 400)
    night.addColorStop(0, '#0E1A30'); night.addColorStop(1, '#1B2A44')
    windowPane(g, 1080, 110, 300, 290, night, '#232936')
    g.fillStyle = '#E9E3CC'; g.beginPath(); g.arc(1300, 180, 26, 0, Math.PI * 2); g.fill()
    glow(g, 1300, 180, 140, '#E9E3CC', 0.18)
    g.fillStyle = '#1B1F2A'; g.fillRect(0, 640, W, 260)
    // desk with a pile of sticky notes
    g.fillStyle = '#242A37'; g.fillRect(1010, 520, 420, 22); g.fillRect(1040, 542, 22, 110); g.fillRect(1380, 542, 22, 110)
    const R = rng(3)
    for (let i = 0; i < 26; i++) { g.fillStyle = ['#E2C95A', '#E89AA8', '#8FC7D9'][i % 3]; g.fillRect(1050 + R() * 320, 420 + R() * 96, 22, 22) }
    // bed
    g.fillStyle = '#2A3040'; rr(g, 160, 560, 760, 130, 16); g.fill()
    g.fillStyle = '#4C4470'; rr(g, 160, 540, 760, 70, 18); g.fill()
    g.fillStyle = '#D9D3C6'; rr(g, 190, 500, 170, 70, 26); g.fill()
    // her: knees up, head down
    const l = PEOPLE.laras
    g.fillStyle = l.hair; rr(g, 548, 300, 132, 230, 56); g.fill()
    g.fillStyle = l.shirt; rr(g, 540, 400, 150, 160, 50); g.fill()
    g.fillStyle = '#2B2F38'; rr(g, 610, 440, 150, 120, 46); g.fill()
    g.fillStyle = shade(l.shirt, -0.25); rr(g, 596, 430, 150, 40, 20); g.fill()
    g.fillStyle = l.skin; g.beginPath(); g.ellipse(640, 376, 46, 48, 0.25, 0, Math.PI * 2); g.fill()
    g.fillStyle = l.hair; g.beginPath(); g.ellipse(632, 356, 52, 40, 0.25, Math.PI * 0.95, Math.PI * 2.1); g.fill()
    // phone and the codes that keep coming
    const pulse = 0.5 + 0.5 * Math.sin(t * 5)
    glow(g, 830, 540, 300, '#7FB0FF', 0.2 + pulse * 0.14)
    g.fillStyle = '#0B0E13'; rr(g, 792, 520, 80, 38, 7); g.fill()
    g.fillStyle = rgba('#A9CBFF', 0.6 + pulse * 0.4); rr(g, 798, 525, 68, 28, 4); g.fill()
    g.font = '600 19px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'
    for (let i = 0; i < 7; i++) {
      const k = ((t * 0.28 + i / 7) % 1)
      const x = 780 + Math.sin(i * 2.3) * 150, y = 500 - k * 420
      g.globalAlpha = Math.sin(k * Math.PI) * 0.85
      g.fillStyle = '#1D2533'; rr(g, x, y, 250, 40, 12); g.fill()
      g.fillStyle = '#C9DBFF'; g.fillText(`Your code is ${String((i * 137911 + 412803) % 1000000).padStart(6, '0')}`, x + 14, y + 21)
    }
    g.globalAlpha = 1
  },

  funeral(g, t) {
    sky(g, ['#5F6770', '#8A9097', '#9AA0A2'], 0, 620)
    g.fillStyle = '#5E6B5A'; g.beginPath(); g.moveTo(0, 620); g.quadraticCurveTo(800, 540, W, 620); g.lineTo(W, H); g.lineTo(0, H); g.fill()
    g.fillStyle = '#4C5849'; g.beginPath(); g.moveTo(0, 720); g.quadraticCurveTo(800, 660, W, 730); g.lineTo(W, H); g.lineTo(0, H); g.fill()
    // tree
    g.fillStyle = '#3A342E'; g.fillRect(1310, 300, 26, 330)
    g.fillStyle = '#46523F'; for (const [x, y, r] of [[1323, 260, 120], [1250, 320, 80], [1400, 330, 86]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    // flowers on fresh earth
    g.fillStyle = '#6B5645'; g.beginPath(); g.ellipse(800, 650, 150, 26, 0, 0, Math.PI * 2); g.fill()
    const R = rng(5)
    for (let i = 0; i < 40; i++) { g.fillStyle = ['#F4EDE0', '#E2B33C', '#E89AA8'][i % 3]; g.beginPath(); g.arc(680 + R() * 240, 636 + R() * 24, 6, 0, Math.PI * 2); g.fill() }
    // mourners from behind, under umbrellas
    const row: [number, Look][] = [[330, PEOPLE.dimas], [520, PEOPLE.sari], [1090, PEOPLE.ratna], [1270, PEOPLE.raka]]
    for (const [x, l] of row) {
      person(g, x, 860, 1.02, { ...l, shirt: '#22252B' }, { back: true })
      g.fillStyle = '#15171B'; g.beginPath(); g.arc(x, 540, 120, Math.PI, 0); g.fill()
      g.fillRect(x - 2, 540, 4, 110)
    }
    person(g, 800, 880, 1.15, { shirt: '#1A1C21', hair: '#2C241D', skin: '#D2A380' }, { back: true })
    rain(g, t, 150, 0.32)
    g.fillStyle = 'rgba(40,46,56,0.25)'; g.fillRect(0, 0, W, H)
  },

  /** 01:31, the phone lights up on your desk. */
  homeNight(g, t, player) {
    sky(g, ['#0C1018', '#131824'], 0, 640)
    const night = g.createLinearGradient(0, 100, 0, 380)
    night.addColorStop(0, '#0C1628'); night.addColorStop(1, '#17243C')
    windowPane(g, 180, 100, 320, 280, night, '#1E2430')
    cityline(g, 380, 8, '#0A0F18', '#F2C879', 30, 120, t)
    g.fillStyle = '#1E2430'; g.fillRect(172, 372, 336, 16)
    g.fillStyle = '#161A24'; g.fillRect(0, 640, W, 260)
    // door ajar to the hall, her room beyond
    g.fillStyle = '#0E1118'; g.fillRect(1240, 180, 200, 460)
    g.fillStyle = '#2A2418'; g.fillRect(1250, 190, 70, 450)
    glow(g, 1290, 420, 220, '#E8C98A', 0.12)
    // clock
    g.fillStyle = '#0B0E13'; rr(g, 1010, 250, 150, 56, 8); g.fill()
    g.fillStyle = '#E0503A'; g.font = '600 34px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'
    g.fillText(Math.sin(t * 3) > 0 ? '01:31' : '01 31', 1028, 280)
    // desk
    g.fillStyle = '#232936'; g.fillRect(520, 610, 720, 24); g.fillRect(550, 634, 24, 266); g.fillRect(1186, 634, 24, 266)
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2)
    glow(g, 960, 590, 380, '#7FB0FF', 0.2 + pulse * 0.12)
    g.fillStyle = '#0B0E13'; rr(g, 920, 584, 86, 28, 6); g.fill()
    g.fillStyle = rgba('#A9CBFF', 0.6 + pulse * 0.4); rr(g, 926, 588, 74, 18, 3); g.fill()
    person(g, 770, 900, 1.5, { ...player, shirt: shade(player.shirt, -0.35) }, { back: true })
    g.fillStyle = '#1A1E28'; rr(g, 660, 660, 220, 260, 24); g.fill()
  },

  /** Kost Melati from the yard. */
  kost(g, t) {
    sky(g, ['#0A0F1A', '#152034', '#22304A'], 0, 700)
    const R = rng(2)
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(230,235,255,${0.2 + R() * 0.6})`; g.fillRect(R() * W, R() * 300, 2, 2) }
    g.fillStyle = '#1B2029'; g.fillRect(0, 700, W, 200)
    // building
    g.fillStyle = '#39463F'; g.fillRect(140, 300, 980, 400)
    g.fillStyle = '#2B352F'; g.beginPath(); g.moveTo(100, 300); g.lineTo(1160, 300); g.lineTo(1100, 230); g.lineTo(160, 230); g.closePath(); g.fill()
    g.fillStyle = '#2E3832'; g.fillRect(140, 690, 980, 14)
    g.font = '700 30px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (const [i, n] of [6, 7, 8].entries()) {
      const x = 220 + i * 310
      g.fillStyle = '#22292A'; g.fillRect(x, 420, 130, 270)
      g.fillStyle = '#4A3B2C'; g.fillRect(x + 8, 428, 114, 262)
      const lit = n === 8
      g.fillStyle = lit ? '#F2C879' : '#131820'; g.fillRect(x + 160, 440, 110, 110)
      g.fillStyle = '#22292A'; g.fillRect(x + 212, 440, 6, 110)
      if (lit) glow(g, x + 215, 495, 220, '#F2C879', 0.22)
      g.fillStyle = '#D8CDB0'; g.fillText(String(n), x + 65, 470)
    }
    // dried flowers at 7
    g.strokeStyle = '#6E6248'; g.lineWidth = 3
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(580 + i * 9, 700); g.lineTo(570 + i * 13, 660); g.stroke(); g.fillStyle = ['#8C7A5A', '#9A6F62'][i % 2]; g.beginPath(); g.arc(570 + i * 13, 656, 7, 0, Math.PI * 2); g.fill() }
    // the warung
    g.fillStyle = '#6E4B2E'; g.fillRect(1240, 560, 250, 150)
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#C8442F' : '#EFE7D6'; g.fillRect(1220 + i * 32, 500, 32, 44) }
    g.fillStyle = '#3A2A1C'; g.fillRect(1232, 544, 8, 166); g.fillRect(1492, 544, 8, 166)
    const fl = 0.85 + Math.sin(t * 11) * 0.05 + Math.sin(t * 3.1) * 0.06
    g.fillStyle = '#FFE2A0'; g.beginPath(); g.arc(1366, 566, 12, 0, Math.PI * 2); g.fill()
    glow(g, 1366, 580, 300, '#F2C879', 0.4 * fl)
    g.fillStyle = 'rgba(240,240,240,0.14)'
    for (let i = 0; i < 4; i++) { const k = (t * 0.3 + i / 4) % 1; g.beginPath(); g.arc(1310 + Math.sin(k * 6 + i) * 14, 560 - k * 130, 12 + k * 20, 0, Math.PI * 2); g.fill() }
    g.textAlign = 'start'
  },

  /** The faculty building after hours: one lit window, a chained gate. */
  campus(g, t) {
    sky(g, ['#080C16', '#121B2E', '#1E2A42'], 0, 720)
    const R = rng(4)
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(230,235,255,${0.2 + R() * 0.5})`; g.fillRect(R() * W, R() * 260, 2, 2) }
    g.fillStyle = '#161B24'; g.fillRect(0, 720, W, 180)
    g.fillStyle = '#2C3340'; g.fillRect(260, 220, 1080, 500)
    g.fillStyle = '#232934'; g.fillRect(230, 190, 1140, 40)
    g.fillStyle = '#3A4252'; g.fillRect(700, 250, 200, 470)
    g.fillStyle = '#D8CDB0'; g.font = '700 26px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('FAKULTAS EKONOMI', 800, 290)
    for (let f = 0; f < 3; f++) for (let c = 0; c < 8; c++) {
      const x = 300 + c * 128 + (c > 3 ? 40 : 0), y = 330 + f * 124
      if (x > 660 && x < 900) continue
      const lit = f === 2 && c === 1
      g.fillStyle = lit ? '#F2C879' : '#141A24'; g.fillRect(x, y, 84, 70)
      g.fillStyle = '#232934'; g.fillRect(x + 40, y, 4, 70)
      if (lit) { glow(g, x + 42, y + 35, 260, '#F2C879', 0.24 + Math.sin(t * 2) * 0.01); g.fillStyle = '#3E4E78'; rr(g, x + 50, y + 22, 22, 48, 9); g.fill() }
    }
    g.fillStyle = '#10141B'; g.fillRect(760, 560, 80, 160)
    // notice board by the door, with one pale gap
    g.fillStyle = '#4A3B2C'; g.fillRect(920, 560, 150, 110)
    g.fillStyle = '#7C6A52'; g.fillRect(928, 568, 134, 94)
    for (const [x, y, c] of [[936, 576, '#E9E4D6'], [984, 580, '#C8442F'], [940, 620, '#8FC7D9']] as const) { g.fillStyle = c; g.fillRect(x, y, 38, 34) }
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.strokeRect(1000, 616, 50, 40); g.setLineDash([])
    // gate, chained
    g.strokeStyle = '#0B0E13'; g.lineWidth = 7
    for (let x = 80; x < W - 60; x += 46) { g.beginPath(); g.moveTo(x, 900); g.lineTo(x, 640); g.stroke() }
    g.lineWidth = 9; g.beginPath(); g.moveTo(60, 660); g.lineTo(W - 60, 660); g.stroke()
    g.strokeStyle = '#8E97A6'; g.lineWidth = 5
    g.beginPath(); g.arc(800, 700, 26, 0, Math.PI * 2); g.stroke()
    // the guard's torch
    glow(g, 1330 + Math.sin(t * 0.7) * 60, 800, 220, '#FFF1C8', 0.22)
    g.fillStyle = '#05070A'; rr(g, 1420, 690, 54, 150, 20); g.fill(); g.beginPath(); g.arc(1447, 668, 24, 0, Math.PI * 2); g.fill()
    g.textAlign = 'start'
  },

  /** PayVault tower with one floor in alarm. */
  tower(g, t) {
    sky(g, ['#06080D', '#0D1422', '#182238'], 0, 780)
    cityline(g, 780, 11, '#0A0F18', '#F2C879', 120, 420, t)
    cityline(g, 780, 12, '#0D131E', '#9CC8FF', 60, 260, t)
    // the tower
    const x = 640, w = 320, top = 60
    g.fillStyle = '#101722'; g.fillRect(x, top, w, 720)
    g.fillStyle = '#0B111A'; g.fillRect(x + w - 60, top, 60, 720)
    const R = rng(21)
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2)
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
    glow(g, x + w / 2, top + 16 + 20 * 20, 420, '#FF4A33', 0.12 + pulse * 0.12)
    g.fillStyle = '#DDE4F0'; g.font = '700 26px "IBM Plex Sans Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('PAYVAULT', x + w / 2, top + 730)
    g.textAlign = 'start'
    // street and your headlight
    g.fillStyle = '#090C12'; g.fillRect(0, 780, W, 120)
    g.fillStyle = 'rgba(255,255,255,0.10)'; for (let i = 0; i < W; i += 120) g.fillRect(i + ((t * 60) % 120), 836, 60, 5)
    glow(g, 300, 830, 260, '#FFF1C8', 0.3)
    g.fillStyle = '#FFF1C8'; g.beginPath(); g.arc(300, 826, 8, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#05070A'; rr(g, 230, 800, 70, 40, 14); g.fill(); g.beginPath(); g.arc(250, 782, 18, 0, Math.PI * 2); g.fill()
  },
}

export function drawArt(g: Ctx, id: ArtId, t: number, playerColor: string) {
  SCENES[id](g, t, { shirt: playerColor, hair: '#2C241D', skin: '#D2A380' })
}

export const ART_W = W, ART_H = H

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
