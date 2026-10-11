import {
  TILE, COLS, ROWS, WORLD_W, WORLD_H, rooms, doors, props, signs,
  isWallTile, tileAt, roomAt, type Room, type Prop,
} from './world'
import { rng, rr, shade, withShadow, type Ctx } from './sprites'

export const CAP_H = 12 // top-of-wall band; the rest of a wall tile shows its face

const WALL_MOUNTED = new Set(['whiteboard', 'videoWall', 'screenWall', 'elevator', 'vault'])
const DECALS = new Set(['rug', 'logo', 'hazard'])

// Paint colour of the wall faces you see from inside each room.
const WALL_PAINT: Record<string, string> = {
  datacenter: '#50565E', identity: '#8C9296', treasury: '#4C3B2F', 'hall-n': '#5E636B',
  ops: '#46505E', pantry: '#7A7264', lobby: '#857E73', archive: '#64625D', 'hall-s': '#5E636B',
  training: '#6B5C4F', lifts: '#7C776F', briefing: '#3C3D45',
}

export function paintStatic(scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.round(WORLD_W * scale)
  c.height = Math.round(WORLD_H * scale)
  const g = c.getContext('2d')!
  g.scale(scale, scale)

  g.fillStyle = '#0A0C10'
  g.fillRect(0, 0, WORLD_W, WORLD_H)

  for (const r of rooms) paintFloor(g, r)
  paintDoorways(g)
  for (const p of props) if (DECALS.has(p.kind)) paintProp(g, p)
  paintAmbientOcclusion(g)

  const furniture = props.filter(p => !DECALS.has(p.kind) && !WALL_MOUNTED.has(p.kind))
    .sort((a, b) => (a.y + a.h) - (b.y + b.h))
  for (const p of furniture) paintProp(g, p)

  paintWalls(g)
  for (const p of props) if (WALL_MOUNTED.has(p.kind)) paintProp(g, p)
  paintSigns(g)
  return c
}

// ─── Floors ──────────────────────────────────────────────────────────────

function speckle(g: Ctx, x: number, y: number, w: number, h: number, seed: number, density: number, colors: string[], size = 1) {
  const R = rng(seed)
  const n = Math.floor(w * h * density)
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(R() * colors.length) | 0]
    g.fillRect(x + R() * w, y + R() * h, size, size)
  }
}

function paintFloor(g: Ctx, r: Room) {
  const x = r.x * TILE, y = r.y * TILE, w = r.w * TILE, h = r.h * TILE
  const R = rng(r.x * 131 + r.y * 7)
  g.save()
  g.beginPath(); g.rect(x, y, w, h); g.clip()

  switch (r.floor) {
    case 'raised': {
      g.fillStyle = '#8D939A'; g.fillRect(x, y, w, h)
      for (let ty = y; ty < y + h; ty += TILE) for (let tx = x; tx < x + w; tx += TILE) {
        const v = R() * 10 - 5
        g.fillStyle = `rgb(${141 + v},${147 + v},${154 + v})`
        g.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2)
        if (R() < 0.22) { // perforated airflow panel
          g.fillStyle = '#6E747B'
          for (let py = 5; py < TILE - 3; py += 4) for (let px = 5; px < TILE - 3; px += 4) g.fillRect(tx + px, ty + py, 1.6, 1.6)
        }
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(tx + 1, ty + 1, TILE - 2, 1)
      }
      g.fillStyle = '#5F656C'
      for (let tx = x; tx <= x + w; tx += TILE) g.fillRect(tx - 0.5, y, 1, h)
      for (let ty = y; ty <= y + h; ty += TILE) g.fillRect(x, ty - 0.5, w, 1)
      break
    }
    case 'lab': {
      g.fillStyle = '#C8CCCE'; g.fillRect(x, y, w, h)
      speckle(g, x, y, w, h, 11, 0.02, ['#B9BEC1', '#D5D8DA', '#AEB3B6'])
      g.fillStyle = 'rgba(0,0,0,0.07)'
      for (let tx = x; tx <= x + w; tx += TILE) g.fillRect(tx, y, 1, h)
      for (let ty = y; ty <= y + h; ty += TILE) g.fillRect(x, ty, w, 1)
      break
    }
    case 'wood': {
      const ph = 12
      for (let ty = y; ty < y + h; ty += ph) {
        let tx = x - R() * 80
        while (tx < x + w) {
          const len = 70 + R() * 110
          const v = R() * 18 - 9
          g.fillStyle = `rgb(${104 + v},${72 + v * 0.7},${48 + v * 0.5})`
          g.fillRect(tx, ty, len, ph)
          g.strokeStyle = 'rgba(40,24,12,0.18)'; g.lineWidth = 0.6
          for (let k = 0; k < 3; k++) {
            const gy = ty + 2 + R() * (ph - 4)
            g.beginPath(); g.moveTo(tx + 2, gy)
            g.bezierCurveTo(tx + len * 0.3, gy + R() * 2 - 1, tx + len * 0.6, gy + R() * 2 - 1, tx + len - 2, gy); g.stroke()
          }
          g.fillStyle = 'rgba(30,18,10,0.45)'; g.fillRect(tx, ty, 1, ph)
          tx += len
        }
        g.fillStyle = 'rgba(30,18,10,0.35)'; g.fillRect(x, ty, w, 1)
      }
      g.fillStyle = 'rgba(255,220,180,0.05)'; g.fillRect(x, y, w, h)
      break
    }
    case 'carpet': case 'carpetWarm': case 'carpetDark': {
      const base = r.floor === 'carpet' ? '#3E4858' : r.floor === 'carpetWarm' ? '#6A5747' : '#2E3037'
      g.fillStyle = base; g.fillRect(x, y, w, h)
      for (let ty = y; ty < y + h; ty += TILE * 2) for (let tx = x; tx < x + w; tx += TILE * 2) {
        const alt = ((tx - x) / (TILE * 2) + (ty - y) / (TILE * 2)) % 2 === 0
        g.fillStyle = alt ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)'
        g.fillRect(tx, ty, TILE * 2, TILE * 2)
        g.strokeStyle = alt ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'
        g.lineWidth = 1
        for (let k = 3; k < TILE * 2; k += 4) {
          g.beginPath()
          if (alt) { g.moveTo(tx + k, ty); g.lineTo(tx + k, ty + TILE * 2) }
          else { g.moveTo(tx, ty + k); g.lineTo(tx + TILE * 2, ty + k) }
          g.stroke()
        }
      }
      speckle(g, x, y, w, h, 21, 0.25, [shade(base, 0.1), shade(base, -0.15), shade(base, 0.05)])
      break
    }
    case 'checker': {
      const s = TILE / 2 + 4
      for (let ty = y; ty < y + h; ty += s) for (let tx = x; tx < x + w; tx += s) {
        const k = (Math.round((tx - x) / s) + Math.round((ty - y) / s)) % 2
        g.fillStyle = k ? '#D7D1C4' : '#4A4744'
        g.fillRect(tx, ty, s, s)
      }
      speckle(g, x, y, w, h, 31, 0.03, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.12)'])
      break
    }
    case 'stone': {
      const s = TILE * 2
      for (let ty = y; ty < y + h; ty += s) for (let tx = x; tx < x + w; tx += s) {
        const v = R() * 12 - 6
        g.fillStyle = `rgb(${186 + v},${180 + v},${170 + v})`
        g.fillRect(tx, ty, s, s)
        g.strokeStyle = 'rgba(120,112,100,0.25)'; g.lineWidth = 0.8
        for (let k = 0; k < 2; k++) { // veining
          g.beginPath()
          let vx = tx + R() * s, vy = ty
          g.moveTo(vx, vy)
          for (let st = 0; st < 5; st++) { vx += R() * 18 - 9; vy += s / 5; g.lineTo(vx, vy) }
          g.stroke()
        }
        const hg = g.createLinearGradient(tx, ty, tx + s, ty + s)
        hg.addColorStop(0, 'rgba(255,255,255,0.10)'); hg.addColorStop(0.5, 'rgba(255,255,255,0)')
        g.fillStyle = hg; g.fillRect(tx, ty, s, s)
      }
      g.fillStyle = 'rgba(90,84,74,0.55)'
      for (let tx = x; tx <= x + w; tx += s) g.fillRect(tx - 0.5, y, 1, h)
      for (let ty = y; ty <= y + h; ty += s) g.fillRect(x, ty - 0.5, w, 1)
      break
    }
    case 'concrete': {
      g.fillStyle = '#86837C'; g.fillRect(x, y, w, h)
      for (let i = 0; i < 40; i++) {
        const bx = x + R() * w, by = y + R() * h, br = 20 + R() * 60
        const bg = g.createRadialGradient(bx, by, 0, bx, by, br)
        const dark = R() < 0.5
        bg.addColorStop(0, dark ? 'rgba(60,58,54,0.12)' : 'rgba(255,255,255,0.06)')
        bg.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = bg; g.fillRect(bx - br, by - br, br * 2, br * 2)
      }
      speckle(g, x, y, w, h, 41, 0.08, ['#6F6C66', '#9A978F', '#7C7972'])
      g.fillStyle = 'rgba(50,48,44,0.35)'
      for (let tx = x + TILE * 4; tx < x + w; tx += TILE * 4) g.fillRect(tx, y, 1, h)
      for (let ty = y + TILE * 4; ty < y + h; ty += TILE * 4) g.fillRect(x, ty, w, 1)
      break
    }
    case 'corridor': {
      g.fillStyle = '#7A7E84'; g.fillRect(x, y, w, h)
      speckle(g, x, y, w, h, 51, 0.06, ['#6E7278', '#868A90', '#72767C'])
      g.fillStyle = 'rgba(0,0,0,0.12)'
      for (let tx = x + TILE * 3; tx < x + w; tx += TILE * 3) g.fillRect(tx, y, 1, h)
      // darker border inlay along the walls
      g.fillStyle = '#5E6268'
      g.fillRect(x, y + 4, w, 3)
      g.fillRect(x, y + h - 7, w, 3)
      break
    }
  }
  g.restore()
}

function paintDoorways(g: Ctx) {
  for (const d of doors) {
    const x = d.x * TILE, y = d.y * TILE, w = d.w * TILE, h = d.h * TILE
    // borrow the floor of whichever side is a corridor/room
    const side = d.w >= d.h
      ? (roomAt(x + 4, y + h + 4) ?? roomAt(x + 4, y - 4))
      : (roomAt(x + w + 4, y + 4) ?? roomAt(x - 4, y + 4))
    g.fillStyle = side?.floor === 'stone' ? '#B4AEA3' : '#777B81'
    g.fillRect(x, y, w, h)
    g.fillStyle = '#5A5E64'
    if (d.w >= d.h) {
      g.fillRect(x, y + CAP_H + 4, w, 6)
      g.fillStyle = 'rgba(255,255,255,0.18)'
      for (let k = x + 2; k < x + w; k += 3) g.fillRect(k, y + CAP_H + 5, 1, 4)
    } else {
      g.fillRect(x + 13, y, 6, h)
      g.fillStyle = 'rgba(255,255,255,0.18)'
      for (let k = y + 2; k < y + h; k += 3) g.fillRect(x + 14, k, 4, 1)
    }
  }
}

function paintAmbientOcclusion(g: Ctx) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (isWallTile(c, r)) continue
    const x = c * TILE, y = r * TILE
    if (isWallTile(c, r - 1)) {
      const gr = g.createLinearGradient(0, y, 0, y + 14)
      gr.addColorStop(0, 'rgba(0,0,0,0.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gr; g.fillRect(x, y, TILE, 14)
    }
    if (isWallTile(c - 1, r)) {
      const gr = g.createLinearGradient(x, 0, x + 10, 0)
      gr.addColorStop(0, 'rgba(0,0,0,0.30)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gr; g.fillRect(x, y, 10, TILE)
    }
    if (isWallTile(c + 1, r)) {
      const gr = g.createLinearGradient(x + TILE, 0, x + TILE - 10, 0)
      gr.addColorStop(0, 'rgba(0,0,0,0.30)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gr; g.fillRect(x + TILE - 10, y, 10, TILE)
    }
    if (isWallTile(c, r + 1)) {
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, y + TILE - 4, TILE, 4)
    }
  }
}

// ─── Walls ───────────────────────────────────────────────────────────────

function paintWalls(g: Ctx) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!isWallTile(c, r)) continue
    const x = c * TILE, y = r * TILE
    const openBelow = r + 1 < ROWS && !isWallTile(c, r + 1)
    const capH = openBelow ? CAP_H : TILE

    // cap
    g.fillStyle = '#323842'
    g.fillRect(x, y, TILE, capH)
    g.fillStyle = 'rgba(255,255,255,0.03)'
    if ((c + r) % 2) g.fillRect(x, y, TILE, capH)

    // face, painted per the room in front of it
    if (openBelow) {
      const below = roomAt(x + TILE / 2, y + TILE + 4)
      const isDoorBelow = tileAt(c, r + 1) === 2
      const paint = below ? WALL_PAINT[below.id] ?? '#5A5F66' : isDoorBelow ? '#4A4F56' : '#5A5F66'
      const fg = g.createLinearGradient(0, y + CAP_H, 0, y + TILE)
      fg.addColorStop(0, shade(paint, 0.08))
      fg.addColorStop(1, shade(paint, -0.18))
      g.fillStyle = fg
      g.fillRect(x, y + CAP_H, TILE, TILE - CAP_H)
      g.fillStyle = 'rgba(255,255,255,0.10)'
      g.fillRect(x, y + CAP_H, TILE, 1)
      if (c % 2 === 0) { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x, y + CAP_H + 1, 1, TILE - CAP_H - 4) }
      g.fillStyle = shade(paint, -0.5)
      g.fillRect(x, y + TILE - 3, TILE, 3) // skirting
    }

    // outlines where the wall meets open floor
    g.fillStyle = '#14171C'
    if (!isWallTile(c, r - 1) && r > 0) g.fillRect(x, y, TILE, 1.5)
    if (!isWallTile(c - 1, r) && c > 0) g.fillRect(x, y, 1.5, capH)
    if (!isWallTile(c + 1, r) && c < COLS - 1) g.fillRect(x + TILE - 1.5, y, 1.5, capH)
    g.fillStyle = 'rgba(255,255,255,0.06)'
    if (!isWallTile(c, r - 1) && r > 0) g.fillRect(x, y + 1.5, TILE, 1)

    // door jambs
    if (tileAt(c - 1, r) === 2 || tileAt(c + 1, r) === 2) {
      const left = tileAt(c + 1, r) === 2
      g.fillStyle = '#8A9098'
      g.fillRect(left ? x + TILE - 4 : x, y + (openBelow ? CAP_H - 2 : 0), 4, openBelow ? TILE - CAP_H + 2 : TILE)
    }
    if (tileAt(c, r - 1) === 2 || tileAt(c, r + 1) === 2) {
      const above = tileAt(c, r + 1) === 2
      g.fillStyle = '#8A9098'
      g.fillRect(x + 10, above ? y + TILE - 4 : y, 12, 4)
    }
  }
}

function paintSigns(g: Ctx) {
  g.font = '600 8px "IBM Plex Mono", monospace'
  g.textBaseline = 'middle'
  for (const s of signs) {
    const w = g.measureText(s.text).width + 10
    const x = s.align === 'left' ? s.x : s.x - w / 2
    g.fillStyle = '#E9E5DA'
    rr(g, x, s.y - 6, w, 12, 1.5); g.fill()
    g.fillStyle = '#1C1E22'
    g.fillText(s.text, x + 5, s.y + 0.5)
  }
}

// ─── Props ───────────────────────────────────────────────────────────────

function paper(g: Ctx, x: number, y: number, w: number, h: number, rot: number, tint = '#F1EEE6') {
  g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot)
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-w / 2 + 1, -h / 2 + 1.5, w, h)
  g.fillStyle = tint; g.fillRect(-w / 2, -h / 2, w, h)
  g.fillStyle = 'rgba(0,0,0,0.25)'
  for (let k = 3; k < h - 2; k += 2.5) g.fillRect(-w / 2 + 2, -h / 2 + k, (w - 4) * (0.5 + ((k * 7) % 5) / 10), 0.6)
  g.restore()
}

function monitorBar(g: Ctx, cx: number, y: number, w: number) {
  g.fillStyle = '#111317'
  rr(g, cx - w / 2, y, w, 4, 1); g.fill()
  g.fillStyle = '#2B2F36'
  g.fillRect(cx - 3, y + 4, 6, 4)
  g.fillRect(cx - 6, y + 7, 12, 2)
}

function chairShape(g: Ctx, p: Prop, seat = '#2E333B') {
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2
  const ang = { n: 0, e: Math.PI / 2, s: Math.PI, w: -Math.PI / 2 }[p.face ?? 'n']
  g.save(); g.translate(cx, cy); g.rotate(ang)
  withShadow(g, 5, 3, 0.4, () => {
    g.fillStyle = seat
    rr(g, -8, -7, 16, 15, 5); g.fill()
  })
  g.fillStyle = shade(seat, 0.15)
  rr(g, -6, -5, 12, 9, 4); g.fill()
  g.fillStyle = shade(seat, -0.3)
  rr(g, -9, 6, 18, 5, 2.5); g.fill()           // backrest (behind the sitter)
  g.fillStyle = shade(seat, -0.15)
  g.fillRect(-10, -4, 2, 8); g.fillRect(8, -4, 2, 8) // arms
  g.restore()
}

function plantShape(g: Ctx, p: Prop) {
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2, r = p.w / 2
  const R = rng(p.seed ?? 1)
  withShadow(g, 6, 3, 0.45, () => {
    g.fillStyle = '#5B4A3E'
    g.beginPath(); g.arc(cx, cy, r * 0.62, 0, Math.PI * 2); g.fill()
  })
  g.fillStyle = '#3A2F27'
  g.beginPath(); g.arc(cx, cy, r * 0.5, 0, Math.PI * 2); g.fill()
  const n = 9
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R() * 0.5
    const len = r * (0.75 + R() * 0.45)
    g.save(); g.translate(cx, cy); g.rotate(a)
    const greens = ['#3F7A45', '#4E8C4F', '#356B3C', '#5C9A57']
    g.fillStyle = greens[(R() * greens.length) | 0]
    g.beginPath(); g.ellipse(len * 0.55, 0, len * 0.55, 3.6 + R() * 1.5, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(20,50,25,0.5)'; g.lineWidth = 0.6
    g.beginPath(); g.moveTo(1, 0); g.lineTo(len, 0); g.stroke()
    g.restore()
  }
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.beginPath(); g.arc(cx - 2, cy - 2, r * 0.35, 0, Math.PI * 2); g.fill()
}

function sofaShape(g: Ctx, x: number, y: number, w: number, h: number, back: 'n' | 's' | 'e' | 'w', color = '#3B4A5E') {
  withShadow(g, 8, 4, 0.45, () => { g.fillStyle = shade(color, -0.2); rr(g, x, y, w, h, 5); g.fill() })
  const b = 9
  g.fillStyle = shade(color, -0.1)
  if (back === 's') rr(g, x, y + h - b, w, b, 4)
  else if (back === 'n') rr(g, x, y, w, b, 4)
  else if (back === 'e') rr(g, x + w - b, y, b, h, 4)
  else rr(g, x, y, b, h, 4)
  g.fill()
  const horiz = back === 'n' || back === 's'
  const sx = back === 'w' ? x + b : x + 5, sy = back === 'n' ? y + b : y + 5
  const sw = horiz ? w - 10 : w - b - 5, sh = horiz ? h - b - 5 : h - 10
  const n = Math.max(2, Math.round((horiz ? sw : sh) / 32))
  for (let i = 0; i < n; i++) {
    g.fillStyle = shade(color, 0.08)
    if (horiz) rr(g, sx + (sw / n) * i + 1, sy, sw / n - 2, sh, 3)
    else rr(g, sx, sy + (sh / n) * i + 1, sw, sh / n - 2, 3)
    g.fill()
  }
}

function paintProp(g: Ctx, p: Prop) {
  const { x, y, w, h } = p
  const R = rng(p.seed ?? 1)
  switch (p.kind) {
    case 'rug': {
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 2, y + 3, w, h)
      g.fillStyle = '#5B3F36'; g.fillRect(x, y, w, h)
      g.strokeStyle = '#C2A57A'; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, w - 12, h - 12)
      g.strokeStyle = 'rgba(194,165,122,0.35)'; g.lineWidth = 1; g.strokeRect(x + 11, y + 11, w - 22, h - 22)
      speckle(g, x, y, w, h, p.seed ?? 1, 0.3, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.05)'])
      break
    }
    case 'logo': {
      const cx = x + w / 2, cy = y + h / 2
      g.strokeStyle = 'rgba(120,98,58,0.75)'; g.lineWidth = 3
      g.beginPath(); g.arc(cx, cy, w / 2 - 4, 0, Math.PI * 2); g.stroke()
      g.lineWidth = 1
      g.beginPath(); g.arc(cx, cy, w / 2 - 10, 0, Math.PI * 2); g.stroke()
      g.fillStyle = 'rgba(120,98,58,0.8)'
      g.font = '700 30px "IBM Plex Sans Condensed", sans-serif'
      g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText('PV', cx, cy - 4)
      g.font = '600 8px "IBM Plex Mono", monospace'
      g.fillText('PAYVAULT · EST. 2019', cx, cy + 20)
      g.textAlign = 'start'
      break
    }
    case 'hazard': {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip()
      g.fillStyle = '#D9A21E'; g.fillRect(x, y, w, h)
      g.fillStyle = '#1B1B1B'
      for (let k = -w; k < h + w; k += 10) {
        g.beginPath(); g.moveTo(x, y + k); g.lineTo(x + w, y + k - w); g.lineTo(x + w, y + k - w + 5); g.lineTo(x, y + k + 5); g.fill()
      }
      g.restore()
      break
    }
    case 'rackRow': {
      const n = p.n ?? 6, cw = w / n
      withShadow(g, 10, 5, 0.55, () => { g.fillStyle = '#15181D'; g.fillRect(x, y, w, h) })
      for (let i = 0; i < n; i++) {
        const cx = x + i * cw
        g.fillStyle = '#1E2229'; g.fillRect(cx + 1, y + 1, cw - 2, h - 2)
        g.fillStyle = '#262B33'; g.fillRect(cx + 3, y + 3, cw - 6, h - 10)
        g.fillStyle = 'rgba(255,255,255,0.05)'
        for (let k = 0; k < 4; k++) g.fillRect(cx + 5, y + 5 + k * 3, cw - 10, 1)
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(cx, y, 1, h)
      }
      g.fillStyle = '#0D0F12'
      if (p.face === 's') g.fillRect(x, y + h - 5, w, 5)
      else g.fillRect(x, y, w, 5)
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, w, 1)
      break
    }
    case 'cableTray': {
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2, y + 6, w, h)
      g.fillStyle = 'rgba(28,80,160,0.85)'; g.fillRect(x + 2, y + 3, w - 4, 3)
      g.fillStyle = 'rgba(200,160,40,0.85)'; g.fillRect(x + 2, y + 6, w - 4, 2)
      g.fillStyle = 'rgba(190,60,50,0.8)'; g.fillRect(x + 2, y + 8, w - 4, 1.5)
      g.strokeStyle = '#A9A27A'; g.lineWidth = 1.2
      g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + w, y + 1); g.moveTo(x, y + h - 1); g.lineTo(x + w, y + h - 1); g.stroke()
      g.lineWidth = 1
      for (let k = x + 4; k < x + w; k += 12) { g.beginPath(); g.moveTo(k, y + 1); g.lineTo(k, y + h - 1); g.stroke() }
      break
    }
    case 'crac': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#C3C7CB'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#AEB3B8'; rr(g, x + 3, y + 3, w - 6, h - 6, 2); g.fill()
      for (const fy of [y + h * 0.3, y + h * 0.7]) {
        g.fillStyle = '#2B2F35'
        g.beginPath(); g.arc(x + w / 2, fy, 13, 0, Math.PI * 2); g.fill()
        g.strokeStyle = '#6A7078'; g.lineWidth = 1
        for (let a = 0; a < 6; a++) {
          g.beginPath(); g.moveTo(x + w / 2, fy)
          g.lineTo(x + w / 2 + Math.cos(a) * 12, fy + Math.sin(a) * 12); g.stroke()
        }
        g.beginPath(); g.arc(x + w / 2, fy, 13, 0, Math.PI * 2); g.stroke()
      }
      g.fillStyle = '#1D2329'; g.fillRect(x + 6, y + h / 2 - 3, 14, 6)
      break
    }
    case 'ups': {
      const n = p.n ?? 1, cw = w / n
      for (let i = 0; i < n; i++) {
        withShadow(g, 6, 3, 0.5, () => { g.fillStyle = '#2A2E35'; rr(g, x + i * cw + 1, y, cw - 2, h, 2); g.fill() })
        g.fillStyle = '#3A3F47'; g.fillRect(x + i * cw + 4, y + 3, cw - 8, 3)
        g.fillStyle = '#0E1A12'; g.fillRect(x + i * cw + 6, y + h - 9, 10, 5)
      }
      break
    }
    case 'whiteboard': {
      g.fillStyle = '#7C8187'; g.fillRect(x - 2, y - 1, w + 4, h + 2)
      g.fillStyle = '#ECEEEF'; g.fillRect(x, y, w, h)
      g.lineWidth = 0.9
      const inks = ['#2D4F9E', '#B23A2E', '#2A2A2A']
      for (let k = 0; k < 7; k++) {
        g.strokeStyle = inks[k % 3]
        const sx = x + 4 + R() * (w - 20)
        g.beginPath()
        if (k % 3 === 0) g.strokeRect(sx, y + 2, 10 + R() * 8, h - 5)
        else { g.moveTo(sx, y + 3 + R() * (h - 6)); g.lineTo(sx + 8 + R() * 16, y + 3 + R() * (h - 6)); g.stroke() }
      }
      g.fillStyle = '#9EA3A8'; g.fillRect(x + 4, y + h - 1, w - 8, 2)
      break
    }
    case 'whiteboardV': case 'corkboard': {
      const cork = p.kind === 'corkboard'
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 2, y + 2, w, h)
      g.fillStyle = cork ? '#A57A4F' : '#ECEEEF'; g.fillRect(x, y, w, h)
      g.strokeStyle = '#6A6F75'; g.lineWidth = 1.5; g.strokeRect(x, y, w, h)
      if (cork) {
        const pins = ['#D9432F', '#3567B4', '#DB9A2B', '#E9E5DA']
        for (let k = 0; k < 6; k++) {
          paper(g, x + 1, y + 4 + k * 10.5, w - 2, 8, 0, k % 2 ? '#F1EEE6' : '#F5E7A3')
          g.fillStyle = pins[k % 4]; g.beginPath(); g.arc(x + w / 2, y + 6 + k * 10.5, 1.3, 0, Math.PI * 2); g.fill()
        }
      } else {
        g.strokeStyle = '#B23A2E'; g.lineWidth = 0.8
        for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x + 3, y + 8 + k * 13); g.lineTo(x + w - 3, y + 12 + k * 13); g.stroke() }
      }
      break
    }
    case 'desk': {
      const light = p.room === 'identity' || p.room === 'training'
      const top = light ? '#D9DBDC' : p.room === 'treasury' ? '#5A3E2B' : p.room === 'archive' ? '#8D8F91' : '#B9A385'
      withShadow(g, 8, 4, 0.45, () => { g.fillStyle = shade(top, -0.2); rr(g, x, y, w, h, 2); g.fill() })
      g.fillStyle = top; rr(g, x + 1, y + 1, w - 2, h - 3, 2); g.fill()
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, y + 2, w - 4, 1)
      const n = p.n ?? 1
      const back = p.face === 'n' ? y + h - 9 : y + 3
      for (let i = 0; i < n; i++) monitorBar(g, x + (w / n) * (i + 0.5), back, Math.min(26, w / n - 6))
      // keyboard + mouse + clutter
      const ky = p.face === 'n' ? y + 6 : y + h - 11
      for (let i = 0; i < Math.min(n, 2); i++) {
        const kx = x + (w / Math.min(n, 2)) * (i + 0.5)
        g.fillStyle = '#2A2D33'; rr(g, kx - 11, ky, 22, 6, 1); g.fill()
        g.fillStyle = 'rgba(255,255,255,0.15)'
        for (let k = 0; k < 5; k++) g.fillRect(kx - 10 + k * 4.2, ky + 1.5, 3, 1)
        g.fillStyle = '#2A2D33'; rr(g, kx + 14, ky + 1, 4, 5, 2); g.fill()
      }
      if (R() < 0.8) { // mug
        const mx = x + 6 + R() * 8, my = y + h / 2
        g.fillStyle = R() < 0.5 ? '#E9E5DA' : '#B5432F'
        g.beginPath(); g.arc(mx, my, 3.4, 0, Math.PI * 2); g.fill()
        g.fillStyle = '#3B2A1E'; g.beginPath(); g.arc(mx, my, 2.2, 0, Math.PI * 2); g.fill()
      }
      if (R() < 0.85) paper(g, x + w - 22 - R() * 6, y + 6 + R() * (h - 20), 12, 15, R() * 0.6 - 0.3)
      break
    }
    case 'chair': chairShape(g, p); break
    case 'console': {
      withShadow(g, 10, 5, 0.55, () => { g.fillStyle = '#1D2128'; rr(g, x, y, w, h, 4); g.fill() })
      g.fillStyle = '#2A2F37'; rr(g, x + 2, y + 2, w - 4, h - 4, 3); g.fill()
      g.fillStyle = '#121418'
      if (p.face === 'n') rr(g, x + 5, y + 4, w - 10, 6, 1)
      else rr(g, x + 5, y + h - 10, w - 10, 6, 1)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.18)'
      const ky = p.face === 'n' ? y + 5.5 : y + h - 8.5
      for (let k = 0; k < 9; k++) g.fillRect(x + 7 + k * 4.7, ky, 3, 1)
      break
    }
    case 'cart': {
      withShadow(g, 6, 4, 0.5, () => { g.fillStyle = '#7D838A'; rr(g, x, y, w, h, 2); g.fill() })
      g.fillStyle = '#5E646B'; g.fillRect(x + 2, y + 2, w - 4, h - 4)
      g.fillStyle = '#1A1D22'; rr(g, x + 5, y + 7, 20, 12, 1); g.fill() // laptop base
      g.fillStyle = '#0F1114'; g.fillRect(x + 5, y + 4, 20, 3)             // laptop lid
      break
    }
    case 'sideTable': case 'coffeeTable': {
      const glass = p.kind === 'coffeeTable'
      withShadow(g, 6, 3, 0.4, () => { g.fillStyle = glass ? 'rgba(170,200,210,0.55)' : '#6E513C'; rr(g, x, y, w, h, 3); g.fill() })
      g.strokeStyle = glass ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'; g.lineWidth = 1
      rr(g, x + 1, y + 1, w - 2, h - 2, 3); g.stroke()
      if (glass) {
        paper(g, x + 8, y + 8, 16, 20, -0.2, '#C9433A'); paper(g, x + 28, y + 12, 16, 20, 0.15, '#E3DCC9')
      } else {
        paper(g, x + 6, y + 4, 12, 15, R() * 0.5 - 0.25)
        if (w > 36) { g.fillStyle = '#1A1D22'; rr(g, x + w - 18, y + 6, 12, 9, 1); g.fill() }
        else { g.fillStyle = '#16181C'; rr(g, x + w - 16, y + 7, 10, 14, 2); g.fill() } // tablet
      }
      break
    }
    case 'extinguisher': {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + w / 2 + 1, y + h - 3, 7, 3, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#B3271E'; rr(g, x + 2, y + 2, w - 4, h - 4, 4); g.fill()
      g.fillStyle = '#E04A3A'; g.fillRect(x + 4, y + 4, 2, h - 9)
      g.fillStyle = '#1E1E1E'; g.fillRect(x + 4, y, w - 8, 4)
      break
    }
    case 'plant': plantShape(g, p); break
    case 'printer': {
      withShadow(g, 7, 4, 0.45, () => { g.fillStyle = '#C8CACC'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#A7AAAD'; rr(g, x + 4, y + 4, w - 8, 10, 2); g.fill()
      g.fillStyle = '#2A2D32'; g.fillRect(x + w - 12, y + h - 9, 8, 5)
      paper(g, x + 8, y + 14, 16, 12, 0.08)
      break
    }
    case 'phoneBench': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#3A3F47'; rr(g, x, y, w, h, 2); g.fill() })
      g.fillStyle = '#2E3238'; g.fillRect(x + 2, y + 2, w - 4, h - 4)
      for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) {
        g.fillStyle = '#0B0C0E'; rr(g, x + 5 + i * 13.5, y + 5 + j * 15, 9, 13, 1.5); g.fill()
        g.strokeStyle = 'rgba(200,200,200,0.25)'; g.lineWidth = 0.5
        g.beginPath(); g.moveTo(x + 9.5 + i * 13.5, y + 18 + j * 15); g.lineTo(x + 9.5 + i * 13.5, y + h); g.stroke()
      }
      break
    }
    case 'hsm': {
      withShadow(g, 6, 3, 0.5, () => { g.fillStyle = '#141619'; rr(g, x, y, w, h, 2); g.fill() })
      g.fillStyle = '#B3271E'; g.fillRect(x + 3, y + h - 6, w - 6, 2)
      g.fillStyle = '#2A2E34'; g.fillRect(x + 4, y + 4, w - 8, 8)
      break
    }
    case 'gatePillar': {
      withShadow(g, 5, 3, 0.5, () => { g.fillStyle = '#9DA3AA'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#C9CED3'; g.fillRect(x + 2, y + 2, 2, h - 4)
      g.fillStyle = '#16181B'; g.fillRect(x + 2, y + 8, w - 4, 8)
      break
    }
    case 'gateFlap': {
      g.fillStyle = 'rgba(160,200,220,0.35)'
      g.fillRect(x, y + 2, w / 2 - 6, h - 4); g.fillRect(x + w / 2 + 6, y + 2, w / 2 - 6, h - 4)
      g.strokeStyle = 'rgba(220,240,250,0.6)'; g.lineWidth = 0.8
      g.strokeRect(x, y + 2, w / 2 - 6, h - 4); g.strokeRect(x + w / 2 + 6, y + 2, w / 2 - 6, h - 4)
      break
    }
    case 'vault': {
      const cx = x + w / 2, cy = y + 24
      g.fillStyle = '#3B3F46'; g.fillRect(x, y, w, h)
      g.fillStyle = '#2A2D33'; g.fillRect(x + 6, y + 4, w - 12, h - 6)
      withShadow(g, 10, 5, 0.6, () => {
        const dg = g.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 24)
        dg.addColorStop(0, '#B9BEC4'); dg.addColorStop(1, '#6E747B')
        g.fillStyle = dg
        g.beginPath(); g.arc(cx, cy, 23, 0, Math.PI * 2); g.fill()
      })
      g.strokeStyle = '#4C5258'; g.lineWidth = 2
      g.beginPath(); g.arc(cx, cy, 17, 0, Math.PI * 2); g.stroke()
      g.lineWidth = 2.6; g.strokeStyle = '#3A3F45'
      for (let a = 0; a < 3; a++) {
        const an = a * (Math.PI * 2 / 3) + 0.3
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(an) * 13, cy + Math.sin(an) * 13); g.stroke()
      }
      g.fillStyle = '#2E3237'; g.beginPath(); g.arc(cx, cy, 4, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#9AA0A7'
      for (let a = 0; a < 12; a++) {
        const an = a * Math.PI / 6
        g.beginPath(); g.arc(cx + Math.cos(an) * 21, cy + Math.sin(an) * 21, 1.2, 0, Math.PI * 2); g.fill()
      }
      // hinge bars
      g.fillStyle = '#7E848B'
      g.fillRect(x + 10, y + 12, 18, 5); g.fillRect(x + 10, y + 32, 18, 5)
      break
    }
    case 'safeWall': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#6C5B3C'; g.fillRect(x, y, w, h) })
      const cols = 3, rowsN = 10, cw = (w - 4) / cols, ch = (h - 4) / rowsN
      for (let j = 0; j < rowsN; j++) for (let i = 0; i < cols; i++) {
        const bx = x + 2 + i * cw, by = y + 2 + j * ch
        g.fillStyle = (i + j) % 2 ? '#A88B52' : '#9C8049'; g.fillRect(bx + 0.5, by + 0.5, cw - 1, ch - 1)
        g.fillStyle = '#3D3220'; g.beginPath(); g.arc(bx + cw / 2, by + ch / 2, 1.2, 0, Math.PI * 2); g.fill()
      }
      break
    }
    case 'cashTable': {
      withShadow(g, 8, 4, 0.45, () => { g.fillStyle = '#4A3424'; rr(g, x, y, w, h, 2); g.fill() })
      g.fillStyle = '#5E4430'; rr(g, x + 1, y + 1, w - 2, h - 3, 2); g.fill()
      g.fillStyle = '#2B2E33'; rr(g, x + 6, y + 8, 22, 18, 2); g.fill()  // counting machine
      g.fillStyle = '#464B52'; g.fillRect(x + 9, y + 11, 16, 5)
      for (let k = 0; k < 4; k++) {
        g.fillStyle = k % 2 ? '#7EA37A' : '#6E9469'
        g.fillRect(x + 34 + (k % 2) * 13, y + 8 + Math.floor(k / 2) * 14, 11, 10)
        g.fillStyle = '#C9B98F'; g.fillRect(x + 34 + (k % 2) * 13, y + 12 + Math.floor(k / 2) * 14, 11, 2)
      }
      break
    }
    case 'meetingTable': {
      withShadow(g, 12, 6, 0.5, () => {
        g.fillStyle = '#3E2B1F'
        g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill()
      })
      const tg = g.createLinearGradient(x, y, x + w, y + h)
      tg.addColorStop(0, '#6A4A35'); tg.addColorStop(1, '#4A3324')
      g.fillStyle = tg
      g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = 'rgba(255,255,255,0.07)'
      g.beginPath(); g.ellipse(x + w / 2 - 20, y + h / 2 - 12, w / 4, 6, -0.1, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#1A1D22'; rr(g, x + w / 2 - 14, y + h / 2 - 9, 28, 18, 2); g.fill() // laptop
      g.fillStyle = '#0E1013'; g.fillRect(x + w / 2 - 14, y + h / 2 - 12, 28, 3)
      paper(g, x + 26, y + 22, 14, 18, -0.3); paper(g, x + w - 44, y + 26, 14, 18, 0.2)
      for (const [gx, gy] of [[x + 48, y + 16], [x + w - 52, y + h - 18]]) {
        g.fillStyle = 'rgba(190,220,235,0.6)'; g.beginPath(); g.arc(gx, gy, 3, 0, Math.PI * 2); g.fill()
      }
      break
    }
    case 'videoWall': case 'screenWall': {
      g.fillStyle = '#16181C'; g.fillRect(x, y, w, h)
      if (p.kind === 'videoWall') {
        const n = p.n ?? 3, sw = (w - 4) / n
        for (let i = 0; i < n; i++) { g.fillStyle = '#07090B'; g.fillRect(x + 2 + i * sw + 1, y + 2, sw - 2, h - 4) }
      } else {
        g.fillStyle = '#D9D6CF'; g.fillRect(x + 4, y + 3, w - 8, h - 6)
      }
      break
    }
    case 'cabinet': {
      withShadow(g, 6, 3, 0.45, () => { g.fillStyle = '#8A9096'; rr(g, x, y, w, h, 2); g.fill() })
      g.fillStyle = '#9EA4AA'; g.fillRect(x + 2, y + 2, w - 4, h - 7)
      g.fillStyle = '#5B6067'; g.fillRect(x + w / 2 - 5, y + h - 4, 10, 2)
      break
    }
    case 'sofa': sofaShape(g, x, y, w, h, p.face === 'n' ? 's' : 'n'); break
    case 'sofaV': sofaShape(g, x, y, w, h, p.face === 'w' ? 'e' : 'w'); break
    case 'counter': {
      withShadow(g, 8, 4, 0.45, () => { g.fillStyle = '#B9B2A4'; g.fillRect(x, y, w, h) })
      g.fillStyle = '#CFC8BA'; g.fillRect(x + 1, y + 1, w - 2, h - 2)
      speckle(g, x, y, w, h, 77, 0.15, ['#B2AB9D', '#DAD4C8'])
      // sink
      g.fillStyle = '#8E959C'; rr(g, x + 5, y + 110, w - 10, 30, 6); g.fill()
      g.fillStyle = '#6E757C'; rr(g, x + 8, y + 113, w - 16, 24, 5); g.fill()
      g.fillStyle = '#B9C0C6'; g.fillRect(x + 2, y + 124, 6, 2)
      // coffee machine
      withShadow(g, 5, 3, 0.4, () => { g.fillStyle = '#1D1F23'; rr(g, x + 4, y + 40, w - 8, 26, 3); g.fill() })
      g.fillStyle = '#3B3E44'; g.beginPath(); g.arc(x + w / 2, y + 53, 5, 0, Math.PI * 2); g.fill()
      // microwave
      withShadow(g, 5, 3, 0.4, () => { g.fillStyle = '#D8DBDE'; rr(g, x + 3, y + 166, w - 6, 30, 2); g.fill() })
      g.fillStyle = '#25282C'; g.fillRect(x + 6, y + 170, w - 12, 18)
      break
    }
    case 'fridge': {
      withShadow(g, 8, 4, 0.45, () => { g.fillStyle = '#D5D8DB'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#E6E9EB'; rr(g, x + 2, y + 2, w - 4, h - 4, 2); g.fill()
      g.fillStyle = '#9BA1A7'; g.fillRect(x + w - 6, y + 8, 2, h - 16)
      break
    }
    case 'vending': {
      withShadow(g, 10, 5, 0.5, () => { g.fillStyle = '#1F2B42'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#0D1320'; g.fillRect(x + 3, y + h - 12, w - 6, 9)
      g.fillStyle = '#B5432F'; g.fillRect(x + 3, y + 3, w - 6, 4)
      break
    }
    case 'cooler': {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + w / 2 + 1, y + h / 2 + 3, w / 2, h / 2 - 2, 0, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#E3E6E8'; rr(g, x, y, w, h, 3); g.fill()
      g.fillStyle = 'rgba(80,150,210,0.75)'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 3, 0, Math.PI * 2); g.fill()
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(x + w / 2 - 3, y + h / 2 - 3, 2.5, 0, Math.PI * 2); g.fill()
      break
    }
    case 'roundTable': {
      withShadow(g, 8, 4, 0.45, () => { g.fillStyle = '#BDB5A6'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); g.fill() })
      g.fillStyle = '#DDD6C8'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 2, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#F2EEE6'; g.beginPath(); g.arc(x + w / 2 + 6, y + h / 2 - 4, 3.5, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#4A3225'; g.beginPath(); g.arc(x + w / 2 + 6, y + h / 2 - 4, 2.2, 0, Math.PI * 2); g.fill()
      break
    }
    case 'reception': {
      withShadow(g, 12, 6, 0.55, () => { g.fillStyle = '#2C2925'; rr(g, x, y, w, h, 10); g.fill() })
      g.fillStyle = '#C9BBA2'; rr(g, x + 3, y + h - 12, w - 6, 9, 4); g.fill()  // front counter cap
      g.fillStyle = '#3A3631'; rr(g, x + 3, y + 3, w - 6, h - 17, 6); g.fill()
      monitorBar(g, x + 34, y + 6, 22); monitorBar(g, x + 76, y + 6, 22)
      g.fillStyle = '#9E8A5C'; g.fillRect(x + w / 2 - 12, y + h - 9, 24, 2)
      break
    }
    case 'shelf': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#6C7178'; g.fillRect(x, y, w, h) })
      g.fillStyle = '#585D63'; g.fillRect(x + 1, y + 1, w - 2, h - 2)
      let bx = x + 3
      while (bx < x + w - 10) {
        const bw = 12 + R() * 10
        const tones = ['#B89D74', '#A88E66', '#C2AA82', '#8E7A5A', '#D0C3A6']
        g.fillStyle = tones[(R() * tones.length) | 0]
        g.fillRect(bx, y + 3, Math.min(bw, x + w - 3 - bx), h - 6)
        g.fillStyle = '#F1EEE6'; g.fillRect(bx + 3, y + h / 2 - 2, Math.min(bw, x + w - 3 - bx) - 6, 4)
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(bx, y + 3, 1, h - 6)
        bx += bw + 1
      }
      g.fillStyle = '#82878E'; g.fillRect(x, y, 3, h); g.fillRect(x + w - 3, y, 3, h)
      break
    }
    case 'boxes': {
      for (const [bx, by, bw, bh] of [[x, y + 6, 18, 20], [x + 15, y, 19, 18], [x + 12, y + 14, 16, 14]] as const) {
        withShadow(g, 5, 3, 0.4, () => { g.fillStyle = '#A88A5E'; g.fillRect(bx, by, bw, bh) })
        g.fillStyle = '#B99A6C'; g.fillRect(bx + 1, by + 1, bw - 2, bh - 2)
        g.fillStyle = 'rgba(200,190,160,0.8)'; g.fillRect(bx + bw / 2 - 1.5, by, 3, bh)
      }
      break
    }
    case 'bookshelf': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#4A3526'; g.fillRect(x, y, w, h) })
      let bx = x + 3
      const spines = ['#8C3A2E', '#2E4D7A', '#3F6B47', '#C9A04A', '#6B4A7A', '#D8D2C4', '#2B2B2B']
      while (bx < x + w - 6) {
        const bw = 3 + R() * 4
        g.fillStyle = spines[(R() * spines.length) | 0]
        g.fillRect(bx, y + 3 + R() * 4, bw, h - 8 - R() * 4)
        bx += bw + 0.6
        if (R() < 0.06) bx += 8
      }
      break
    }
    case 'kiosk': {
      withShadow(g, 10, 5, 0.55, () => { g.fillStyle = '#2B2F36'; rr(g, x, y, w, h, 6); g.fill() })
      g.fillStyle = '#3A3F47'; rr(g, x + 4, y + h - 12, w - 8, 8, 3); g.fill()
      g.fillStyle = '#121418'; rr(g, x + 6, y + 5, w - 12, h - 20, 2); g.fill()
      break
    }
    case 'elevator': {
      g.fillStyle = '#5D6168'; g.fillRect(x - 4, y, w + 8, h)
      const dg = g.createLinearGradient(x, 0, x + w, 0)
      dg.addColorStop(0, '#9AA0A6'); dg.addColorStop(0.5, '#C5CAD0'); dg.addColorStop(1, '#8E949A')
      g.fillStyle = dg; g.fillRect(x, y + 3, w, h - 3)
      g.fillStyle = '#4A4E54'; g.fillRect(x + w / 2 - 0.5, y + 3, 1, h - 3)
      g.fillStyle = '#16181C'; g.fillRect(x + w / 2 - 10, y - 2, 20, 6)
      break
    }
    case 'bench': {
      withShadow(g, 6, 3, 0.45, () => { g.fillStyle = '#5A4130'; rr(g, x, y, w, h, 2); g.fill() })
      for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#7A5A42' : '#86644A'; g.fillRect(x + 2, y + 2 + k * ((h - 4) / 4), w - 4, (h - 4) / 4 - 1) }
      break
    }
    case 'podium': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#4A3426'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#6A4C38'; rr(g, x + 3, y + 3, w - 6, h - 8, 2); g.fill()
      g.strokeStyle = '#1A1A1A'; g.lineWidth = 1.5
      g.beginPath(); g.moveTo(x + w / 2, y + 6); g.lineTo(x + w / 2 + 6, y - 4); g.stroke()
      g.fillStyle = '#1A1A1A'; g.beginPath(); g.arc(x + w / 2 + 6, y - 5, 2, 0, Math.PI * 2); g.fill()
      break
    }
    case 'trophyCase': {
      withShadow(g, 8, 4, 0.5, () => { g.fillStyle = '#3A2B20'; g.fillRect(x, y, w, h) })
      g.fillStyle = 'rgba(170,200,215,0.3)'; g.fillRect(x + 3, y + 3, w - 6, h - 6)
      for (let k = 0; k < 4; k++) {
        g.fillStyle = k === 1 ? '#C9A04A' : '#9AA0A6'
        g.beginPath(); g.arc(x + 11 + k * 16, y + h / 2, 4, 0, Math.PI * 2); g.fill()
      }
      break
    }
    case 'longTable': {
      withShadow(g, 10, 5, 0.5, () => { g.fillStyle = '#2F2620'; rr(g, x, y, w, h, 3); g.fill() })
      g.fillStyle = '#463830'; rr(g, x + 2, y + 2, w - 4, h - 4, 2); g.fill()
      for (let k = 0; k < 3; k++) paper(g, x + 20 + k * 55, y + 10, 18, 22, R() * 0.3 - 0.15, '#D8C7A0')
      break
    }
    case 'bin': {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + w / 2 + 1, y + h / 2 + 2, w / 2, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#6A6F75'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#2A2D31'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 2.5, 0, Math.PI * 2); g.fill()
      break
    }
    case 'wetSign': {
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 2, y + 3, w, h)
      g.fillStyle = '#E5B51E'; rr(g, x, y, w, h, 2); g.fill()
      g.fillStyle = '#1B1B1B'; g.fillRect(x + w / 2 - 0.5, y + 1, 1, h - 2)
      g.beginPath(); g.moveTo(x + 4, y + h - 4); g.lineTo(x + w / 2, y + 4); g.lineTo(x + w - 4, y + h - 4); g.closePath()
      g.strokeStyle = '#1B1B1B'; g.lineWidth = 1; g.stroke()
      break
    }
  }
}
