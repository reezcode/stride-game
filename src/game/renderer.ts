import { paintStatic, CAP_H } from './paintStatic'
import {
  WORLD_W, WORLD_H, TILE, COLS, props, doors, rooms, roomById, ceilingLights, interactables,
  isWallTile, type Room,
} from './world'
import { drawDetective, rr, type Facing, type Ctx } from './sprites'
import { drawWarden } from './portraits'

export type CaseStatus = 'breach' | 'visited' | 'solved'

export interface FrameState {
  time: number
  camX: number; camY: number
  player: { x: number; y: number; color: string; facing: Facing; phase: number; moving: boolean; name: string; lightAngle: number }
  doorOpen: Record<string, number>
  lockedDoors: Set<string>
  roomPower: Record<string, number>
  caseStatus: Record<string, CaseStatus>
  foundEvidence: Set<string>
  nearId: string | null
  target: { x: number; y: number; age: number } | null
  particles: { x: number; y: number; life: number; max: number }[]
  allSolved: boolean
  wardens: { x: number; y: number; color: string; name: string; alert: boolean; stunned: boolean; near: boolean }[]
  npc: { x: number; y: number; color: string } | null
}

interface Emissive { x: number; y: number; r: number; color: string; room?: string; scenarioId?: string; kind: string }

const STATUS_COLOR: Record<CaseStatus, string> = { breach: '#E0503A', visited: '#E3A640', solved: '#4CC38A' }

// Door tiles → door, for light occlusion.
const doorTile = new Map<number, string>()
for (const d of doors) for (let y = d.y; y < d.y + d.h; y++) for (let x = d.x; x < d.x + d.w; x++) doorTile.set(y * COLS + x, d.id)

function buildEmissives(): Emissive[] {
  const out: Emissive[] = []
  for (const p of props) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2
    switch (p.kind) {
      case 'desk': {
        const n = p.n ?? 1
        const by = p.face === 'n' ? p.y + p.h - 7 : p.y + 5
        for (let i = 0; i < n; i++) out.push({ x: p.x + (p.w / n) * (i + 0.5), y: by + 6, r: 30, color: '#7FB0FF', room: p.room, kind: 'monitor' })
        break
      }
      case 'console': out.push({ x: cx, y: cy, r: 70, color: '#E0503A', room: p.room, scenarioId: p.scenarioId, kind: 'console' }); break
      case 'rackRow': {
        const n = p.n ?? 6
        out.push({ x: p.x + p.w / 2, y: p.face === 's' ? p.y + p.h + 4 : p.y - 4, r: p.w * 0.6, color: '#5FE39A', room: p.room, kind: 'rack' })
        break
      }
      case 'vending':    out.push({ x: cx, y: p.y + p.h, r: 60, color: '#9CC8FF', room: p.room, kind: 'vending' }); break
      case 'videoWall':  out.push({ x: cx, y: p.y + p.h + 6, r: 90, color: '#6FA8FF', room: 'ops', kind: 'video' }); break
      case 'kiosk':      out.push({ x: cx, y: cy, r: 70, color: '#F2D9A0', room: p.room, kind: 'kiosk' }); break
      case 'phoneBench': out.push({ x: cx, y: cy, r: 40, color: '#9FD0FF', room: p.room, kind: 'phones' }); break
      case 'crac':       out.push({ x: p.x + 13, y: cy, r: 16, color: '#7AE0B0', room: p.room, kind: 'crac' }); break
      case 'screenWall': out.push({ x: cx, y: p.y + p.h + 10, r: 170, color: '#E8E2D0', room: 'briefing', kind: 'screen' }); break
      case 'elevator':   out.push({ x: cx, y: p.y + 2, r: 18, color: '#F06A4A', room: 'lifts', kind: 'liftlight' }); break
    }
  }
  return out
}

function roomClip(g: Ctx, r: Room) {
  // include the surrounding walls so their faces and tops catch the room's light
  g.beginPath()
  g.rect(r.x * TILE - TILE, r.y * TILE - TILE, r.w * TILE + TILE * 2, r.h * TILE + TILE * 2)
  g.clip()
}

export function computeZoom(vw: number, vh: number) {
  return Math.max(0.72, Math.min(1.5, Math.min(vw / 1050, vh / 720)))
}

export class Renderer {
  canvas: HTMLCanvasElement
  ctx: Ctx
  light: HTMLCanvasElement
  lctx: Ctx
  layer: HTMLCanvasElement | null = null
  layerScale = 0
  dpr = 1
  zoom = 1
  vw = 0
  vh = 0
  emissives = buildEmissives()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.light = document.createElement('canvas')
    this.lctx = this.light.getContext('2d')!
  }

  resize(vw: number, vh: number, dpr: number) {
    this.vw = vw; this.vh = vh; this.dpr = dpr
    this.zoom = computeZoom(vw, vh)
    this.canvas.width = Math.round(vw * dpr)
    this.canvas.height = Math.round(vh * dpr)
    this.light.width = this.canvas.width
    this.light.height = this.canvas.height
    const want = Math.max(1, Math.min(2, Math.ceil(dpr * this.zoom * 2) / 2))
    if (want !== this.layerScale) {
      this.layerScale = want
      this.layer = paintStatic(want)
    }
  }

  /** Visible world size. */
  get viewW() { return this.vw / this.zoom }
  get viewH() { return this.vh / this.zoom }

  screenToWorld(sx: number, sy: number, camX: number, camY: number) {
    return { x: camX + sx / this.zoom, y: camY + sy / this.zoom }
  }

  private worldTransform(g: Ctx, s: FrameState) {
    const k = this.zoom * this.dpr
    g.setTransform(k, 0, 0, k, -s.camX * k, -s.camY * k)
  }

  private inView(s: FrameState, x: number, y: number, pad: number) {
    return x > s.camX - pad && x < s.camX + this.viewW + pad && y > s.camY - pad && y < s.camY + this.viewH + pad
  }

  draw(s: FrameState) {
    const g = this.ctx
    const t = s.time

    g.setTransform(1, 0, 0, 1, 0, 0)
    g.fillStyle = '#06080B'
    g.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.worldTransform(g, s)
    if (this.layer) {
      const sx = Math.max(0, s.camX), sy = Math.max(0, s.camY)
      const sw = Math.min(WORLD_W - sx, this.viewW + 2), sh = Math.min(WORLD_H - sy, this.viewH + 2)
      const k = this.layerScale
      if (sw > 0 && sh > 0) g.drawImage(this.layer, sx * k, sy * k, sw * k, sh * k, sx, sy, sw, sh)
    }

    this.drawDoors(g, s)
    this.drawParticles(g, s)
    const p = s.player
    if (s.npc) drawDetective(g, s.npc.x, s.npc.y, s.npc.color, 'up', 0, false)
    drawDetective(g, p.x, p.y, p.color, p.facing, p.phase, p.moving)

    this.drawLighting(s)

    this.worldTransform(g, s)
    this.drawEmissiveSurfaces(g, s)
    this.drawMarkers(g, s)
    this.drawWardens(g, s)

    // name tag
    g.font = '600 10px "IBM Plex Sans", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const nw = g.measureText(p.name).width + 10
    g.fillStyle = 'rgba(8,10,14,0.72)'
    rr(g, p.x - nw / 2, p.y - 62, nw, 15, 3); g.fill()
    g.fillStyle = '#E7E3DA'
    g.fillText(p.name, p.x, p.y - 54.5)
    g.textAlign = 'start'
  }

  // ─── Dynamic world objects ───

  private drawDoors(g: Ctx, s: FrameState) {
    for (const d of doors) {
      if (d.style !== 'slide') continue
      const x = d.x * TILE, y = d.y * TILE, w = d.w * TILE, h = d.h * TILE
      if (!this.inView(s, x, y, 40)) continue
      const open = s.doorOpen[d.id] ?? 0
      const locked = s.lockedDoors.has(d.id)
      g.save()
      g.beginPath(); g.rect(x, y, w, h); g.clip()
      if (d.w >= d.h) {
        // lintel
        g.fillStyle = '#272C33'; g.fillRect(x, y, w, CAP_H)
        g.fillStyle = '#14171C'; g.fillRect(x, y, w, 1.5)
        const pw = w / 2, slide = pw * open * 0.92
        for (const dir of [-1, 1]) {
          const px = dir < 0 ? x - slide : x + pw + slide
          g.fillStyle = 'rgba(120,160,178,0.55)'
          g.fillRect(px, y + CAP_H, pw, TILE - CAP_H - 2)
          g.fillStyle = '#3B4048'
          g.fillRect(px, y + CAP_H, pw, 2)
          g.fillRect(px + (dir < 0 ? pw - 3 : 0), y + CAP_H, 3, TILE - CAP_H - 2)
          g.fillStyle = 'rgba(255,255,255,0.22)'
          g.fillRect(px + 6, y + CAP_H + 5, 2, TILE - CAP_H - 10)
        }
        g.fillStyle = locked ? '#E0503A' : open > 0.5 ? '#4CC38A' : '#7C8590'
        g.fillRect(x + w / 2 - 4, y + 4, 8, 3)
      } else {
        const ph = h / 2, slide = ph * open * 0.92
        for (const dir of [-1, 1]) {
          const py = dir < 0 ? y - slide : y + ph + slide
          g.fillStyle = 'rgba(120,160,178,0.55)'
          g.fillRect(x + 11, py, 10, ph)
          g.fillStyle = '#3B4048'
          g.fillRect(x + 11, py + (dir < 0 ? ph - 3 : 0), 10, 3)
          g.fillRect(x + 11, py, 2, ph)
        }
      }
      g.restore()
    }
  }

  private drawParticles(g: Ctx, s: FrameState) {
    for (const q of s.particles) {
      const k = q.life / q.max
      g.fillStyle = `rgba(200,195,185,${0.22 * k})`
      g.beginPath(); g.arc(q.x, q.y, 2 + (1 - k) * 4, 0, Math.PI * 2); g.fill()
    }
  }

  // ─── Lighting ───

  private castPolygon(s: FrameState, ox: number, oy: number, a0: number, a1: number, R: number, rays: number) {
    const pts: number[] = [ox, oy]
    const opaque = (px: number, py: number) => {
      const c = Math.floor(px / TILE), r = Math.floor(py / TILE)
      if (isWallTile(c, r)) {
        // let light graze the wall face of the row we're looking at
        return !(py - r * TILE > CAP_H && !isWallTile(c, r + 1) && oy > r * TILE)
      }
      const id = doorTile.get(r * COLS + c)
      if (id && (s.lockedDoors.has(id) || (s.doorOpen[id] ?? 0) < 0.4)) {
        const d = doors.find(d => d.id === id)!
        return d.style === 'slide'
      }
      return false
    }
    for (let i = 0; i <= rays; i++) {
      const a = a0 + (a1 - a0) * (i / rays)
      const dx = Math.cos(a), dy = Math.sin(a)
      let hit = -1
      for (let d = 6; d <= R; d += 6) {
        if (opaque(ox + dx * d, oy + dy * d)) { hit = d; break }
      }
      let d = R
      if (hit > 0) {
        let lo = hit - 6, hi = hit
        for (let k = 0; k < 4; k++) {
          const m = (lo + hi) / 2
          if (opaque(ox + dx * m, oy + dy * m)) hi = m; else lo = m
        }
        d = hi
      }
      pts.push(ox + dx * d, oy + dy * d)
    }
    return pts
  }

  private drawLighting(s: FrameState) {
    const L = this.lctx
    const t = s.time
    L.setTransform(1, 0, 0, 1, 0, 0)
    L.globalCompositeOperation = 'source-over'
    L.fillStyle = 'rgba(4,6,11,0.91)'
    L.fillRect(0, 0, this.light.width, this.light.height)

    this.worldTransform(L, s)
    L.globalCompositeOperation = 'destination-out'

    const hole = (x: number, y: number, r: number, I: number) => {
      const gr = L.createRadialGradient(x, y, 0, x, y, r)
      gr.addColorStop(0, `rgba(0,0,0,${I})`)
      gr.addColorStop(0.55, `rgba(0,0,0,${I * 0.72})`)
      gr.addColorStop(1, 'rgba(0,0,0,0)')
      L.fillStyle = gr
      L.fillRect(x - r, y - r, r * 2, r * 2)
    }

    for (const room of rooms) {
      const rx = room.x * TILE, ry = room.y * TILE, rw = room.w * TILE, rh = room.h * TILE
      if (rx > s.camX + this.viewW + 200 || rx + rw < s.camX - 200 || ry > s.camY + this.viewH + 200 || ry + rh < s.camY - 200) continue
      const power = s.roomPower[room.id] ?? 0
      L.save()
      roomClip(L, room)
      if (power > 0.01) {
        const I = (room.dim ? 0.6 : 0.93) * power
        const rad = room.dim ? 150 : 180
        for (const cl of ceilingLights) if (cl.room === room.id) hole(cl.x, cl.y, rad, I)
      }
      for (const e of this.emissives) {
        if (e.room !== room.id) continue
        if (e.kind === 'screen' && !s.allSolved) continue
        const I = e.kind === 'console' ? 0.55 : e.kind === 'rack' || e.kind === 'monitor' ? 0.16 : 0.4
        hole(e.x, e.y, e.r, I)
      }
      if (room.scenarioId && s.caseStatus[room.scenarioId] !== 'solved' && power < 0.5) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.2)
        hole(rx + rw / 2, ry + 18, 300, 0.18 + pulse * 0.18)
      }
      L.restore()
    }

    // detective's own light: small aura + flashlight cone, both occluded by walls
    const p = s.player
    const ox = p.x, oy = p.y - 16
    const fill = (pts: number[], R: number, I: number) => {
      const gr = L.createRadialGradient(ox, oy, 0, ox, oy, R)
      gr.addColorStop(0, `rgba(0,0,0,${I})`)
      gr.addColorStop(0.6, `rgba(0,0,0,${I * 0.6})`)
      gr.addColorStop(1, 'rgba(0,0,0,0)')
      L.fillStyle = gr
      L.beginPath(); L.moveTo(pts[0], pts[1])
      for (let i = 2; i < pts.length; i += 2) L.lineTo(pts[i], pts[i + 1])
      L.closePath(); L.fill()
    }
    fill(this.castPolygon(s, ox, oy, 0, Math.PI * 2, 120, 72), 120, 0.62)
    const half = 0.62
    fill(this.castPolygon(s, ox, oy, p.lightAngle - half, p.lightAngle + half, 330, 56), 330, 0.82)

    L.globalCompositeOperation = 'source-over'
    const g = this.ctx
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.drawImage(this.light, 0, 0)

    // coloured light on top (additive)
    this.worldTransform(g, s)
    g.globalCompositeOperation = 'lighter'
    for (const room of rooms) {
      const rx = room.x * TILE, ry = room.y * TILE, rw = room.w * TILE
      if (!this.inView(s, rx + rw / 2, ry, rw)) continue
      const power = s.roomPower[room.id] ?? 0
      g.save()
      roomClip(g, room)
      for (const e of this.emissives) {
        if (e.room !== room.id) continue
        if (e.kind === 'screen' && !s.allSolved) continue
        const col = e.scenarioId ? STATUS_COLOR[s.caseStatus[e.scenarioId] ?? 'breach'] : e.color
        const gr = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 1.1)
        gr.addColorStop(0, hexA(col, e.kind === 'console' ? 0.22 : e.kind === 'rack' ? 0.07 : 0.12))
        gr.addColorStop(1, hexA(col, 0))
        g.fillStyle = gr
        g.fillRect(e.x - e.r * 1.1, e.y - e.r * 1.1, e.r * 2.2, e.r * 2.2)
      }
      if (room.scenarioId && s.caseStatus[room.scenarioId] !== 'solved' && power < 0.5) {
        const bx = rx + rw / 2, by = ry + 8
        const a = t * 2.6
        const gr = g.createRadialGradient(bx, by, 0, bx, by, 380)
        gr.addColorStop(0, 'rgba(230,60,40,0.28)')
        gr.addColorStop(1, 'rgba(230,60,40,0)')
        g.fillStyle = gr
        g.beginPath(); g.moveTo(bx, by); g.arc(bx, by, 380, a - 0.35, a + 0.35); g.closePath(); g.fill()
        g.beginPath(); g.moveTo(bx, by); g.arc(bx, by, 380, a + Math.PI - 0.35, a + Math.PI + 0.35); g.closePath(); g.fill()
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.2)
        const gl = g.createRadialGradient(bx, by, 0, bx, by, 120)
        gl.addColorStop(0, `rgba(230,60,40,${0.18 + pulse * 0.12})`)
        gl.addColorStop(1, 'rgba(230,60,40,0)')
        g.fillStyle = gl
        g.fillRect(bx - 120, by - 120, 240, 240)
      }
      g.restore()
    }
    g.globalCompositeOperation = 'source-over'
  }

  // ─── Emissive surfaces (drawn after lighting so they read in the dark) ───

  private drawEmissiveSurfaces(g: Ctx, s: FrameState) {
    const t = s.time
    for (const p of props) {
      if (!this.inView(s, p.x + p.w / 2, p.y + p.h / 2, 80)) continue
      switch (p.kind) {
        case 'rackRow': {
          const n = p.n ?? 6, cw = p.w / n
          const ly = p.face === 's' ? p.y + p.h - 3.5 : p.y + 1.5
          const breach = p.room && roomById[p.room]?.scenarioId && s.caseStatus[roomById[p.room].scenarioId!] !== 'solved'
          for (let i = 0; i < n; i++) for (let k = 0; k < 5; k++) {
            const seed = (p.seed ?? 1) * 31 + i * 7 + k * 13
            const on = Math.sin(t * (2 + (seed % 7)) + seed) > -0.2
            let col = '#5FE39A'
            if (k === 4) col = breach && (seed % 3 === 0) ? '#FF5A43' : '#7FB0FF'
            if (k === 2 && seed % 4 === 0) col = '#F2B84B'
            g.fillStyle = on ? col : 'rgba(40,60,50,0.8)'
            g.fillRect(p.x + i * cw + 4 + k * 4.2, ly, 2.4, 2)
          }
          break
        }
        case 'console': {
          const st = s.caseStatus[p.scenarioId!] ?? 'breach'
          const col = STATUS_COLOR[st]
          const sx = p.x + 6, sy = p.face === 'n' ? p.y + p.h - 15 : p.y + 5, sw = p.w - 12, sh = 10
          g.fillStyle = '#05070A'; g.fillRect(sx, sy, sw, sh)
          g.fillStyle = hexA(col, 0.9)
          const scroll = (t * 14) % 3
          for (let k = 0; k < 3; k++) {
            const lw = sw * (0.35 + ((k * 37 + Math.floor(t * 2)) % 5) / 9)
            g.fillRect(sx + 2, sy + 1.5 + k * 3 + (st === 'solved' ? 0 : scroll * 0.3), lw - 4, 1.4)
          }
          if (st !== 'solved' && Math.sin(t * 6) > 0) { g.fillStyle = col; g.fillRect(sx + sw - 6, sy + 2, 3, 3) }
          break
        }
        case 'desk': {
          const n = p.n ?? 1
          const by = p.face === 'n' ? p.y + p.h - 9 : p.y + 3
          for (let i = 0; i < n; i++) {
            const cx = p.x + (p.w / n) * (i + 0.5), mw = Math.min(26, p.w / n - 6)
            g.fillStyle = 'rgba(130,180,255,0.75)'
            g.fillRect(cx - mw / 2 + 1.5, by + (p.face === 'n' ? 0.5 : 2.5), mw - 3, 1.2)
          }
          break
        }
        case 'vending': {
          g.fillStyle = 'rgba(160,205,255,0.55)'
          g.fillRect(p.x + 4, p.y + 9, p.w - 8, p.h - 23)
          const cols = ['#D9432F', '#E5B51E', '#3567B4', '#4CC38A']
          for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
            g.fillStyle = cols[(i + j) % 4]; g.fillRect(p.x + 6 + i * 6.5, p.y + 11 + j * 6, 4, 3)
          }
          break
        }
        case 'videoWall': {
          const n = p.n ?? 3, sw = (p.w - 4) / n
          for (let i = 0; i < n; i++) {
            const sx = p.x + 3 + i * sw, sy = p.y + 3, w = sw - 4, h = p.h - 6
            g.fillStyle = '#0A1830'; g.fillRect(sx, sy, w, h)
            g.strokeStyle = i === 1 ? '#E0503A' : '#6FA8FF'; g.lineWidth = 1
            g.beginPath()
            for (let k = 0; k <= 10; k++) {
              const vx = sx + (w / 10) * k
              const vy = sy + h / 2 + Math.sin(t * 1.5 + k * 0.9 + i) * (h / 3)
              if (k === 0) g.moveTo(vx, vy); else g.lineTo(vx, vy)
            }
            g.stroke()
          }
          break
        }
        case 'kiosk': {
          g.fillStyle = 'rgba(242,217,160,0.9)'; g.fillRect(p.x + 8, p.y + 7, p.w - 16, p.h - 24)
          g.fillStyle = '#2B2F36'
          g.font = '700 9px "IBM Plex Sans Condensed", sans-serif'
          g.textAlign = 'center'; g.textBaseline = 'middle'
          g.fillText('STRIDE', p.x + p.w / 2, p.y + 15)
          g.font = '500 6px "IBM Plex Mono", monospace'
          g.fillText('FIELD MANUAL', p.x + p.w / 2, p.y + 24)
          g.textAlign = 'start'
          break
        }
        case 'phoneBench': {
          for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) {
            const lit = Math.sin(t * 1.3 + i * 1.7 + j * 2.3) > 0.1
            g.fillStyle = lit ? 'rgba(160,210,255,0.85)' : 'rgba(30,40,50,0.9)'
            g.fillRect(p.x + 6 + i * 13.5, p.y + 7 + j * 15, 7, 9)
            if (lit && (i + j) % 3 === 0) { g.fillStyle = '#0B0C0E'; g.fillRect(p.x + 7 + i * 13.5, p.y + 10 + j * 15, 5, 1.5) }
          }
          break
        }
        case 'screenWall': {
          if (!s.allSolved) break
          g.fillStyle = 'rgba(245,240,226,0.95)'; g.fillRect(p.x + 4, p.y + 3, p.w - 8, p.h - 6)
          g.fillStyle = '#B8321F'
          g.font = '700 10px "IBM Plex Sans Condensed", sans-serif'
          g.textAlign = 'center'; g.textBaseline = 'middle'
          g.fillText('LOG WIPE HALTED · 61%', p.x + p.w / 2, p.y + p.h / 2)
          g.textAlign = 'start'
          break
        }
        case 'elevator': {
          g.fillStyle = '#F06A4A'
          g.font = '600 5px "IBM Plex Mono", monospace'
          g.textAlign = 'center'; g.textBaseline = 'middle'
          g.fillText('14', p.x + p.w / 2, p.y + 1)
          g.textAlign = 'start'
          break
        }
        case 'crac': {
          g.fillStyle = '#7AE0B0'; g.fillRect(p.x + 7, p.y + p.h / 2 - 2, 12, 4)
          break
        }
      }
    }

    // locked door lamp
    for (const d of doors) {
      if (!d.lock) continue
      const x = d.x * TILE, y = d.y * TILE
      const on = s.lockedDoors.has(d.id)
      g.fillStyle = on ? (Math.sin(t * 4) > 0 ? '#FF5A43' : '#7A2A20') : '#4CC38A'
      g.fillRect(x + d.w * TILE / 2 - 4, y + 4, 8, 3)
    }
  }

  // ─── Wardens (self-lit, so they are painted over the darkness) ───

  private drawWardens(g: Ctx, s: FrameState) {
    for (const w of s.wardens) {
      if (!this.inView(s, w.x, w.y, 80)) continue
      g.save()
      // seen through a wall they are only a glow
      g.globalAlpha = w.near ? 1 : 0.3
      drawWarden(g, w.x, w.y, 11, w.color, s.time, w.alert, w.stunned)
      if (w.near) {
        g.font = '600 9px "IBM Plex Mono", monospace'
        g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillStyle = w.color
        g.fillText(w.name, w.x, w.y + 12)
        g.textAlign = 'start'
      }
      g.restore()
    }
  }

  // ─── Markers & UI in world space ───

  private drawMarkers(g: Ctx, s: FrameState) {
    const t = s.time
    const p = s.player

    for (const it of interactables) {
      if (!this.inView(s, it.x, it.y, 60)) continue
      const near = s.nearId === it.id

      if (it.kind === 'terminal') {
        const st = s.caseStatus[it.scenarioId!] ?? 'breach'
        const col = STATUS_COLOR[st]
        const bob = Math.sin(t * 3 + it.x) * 2
        const mx = it.x, my = it.y - 34 + bob
        g.save()
        g.translate(mx, my)
        g.fillStyle = 'rgba(0,0,0,0.5)'
        g.beginPath(); g.moveTo(0, -9); g.lineTo(9, 0); g.lineTo(0, 9); g.lineTo(-9, 0); g.closePath(); g.fill()
        g.fillStyle = col
        g.beginPath(); g.moveTo(0, -8); g.lineTo(8, 0); g.lineTo(0, 8); g.lineTo(-8, 0); g.closePath(); g.fill()
        g.fillStyle = '#0B0E13'
        if (st === 'solved') {
          g.strokeStyle = '#0B0E13'; g.lineWidth = 2
          g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(-1, 2.5); g.lineTo(3.5, -2.5); g.stroke()
        } else {
          g.fillRect(-1, -4.5, 2, 5.5); g.fillRect(-1, 2.5, 2, 2)
        }
        g.restore()
      }

      if (it.kind === 'evidence') {
        const st = s.caseStatus[it.scenarioId!]
        if (st === 'solved' || s.foundEvidence.has(it.id)) continue
        const d = Math.hypot(it.x - p.x, it.y - p.y)
        const a = Math.max(0, Math.min(1, (240 - d) / 120))
        if (a <= 0) continue
        const pulse = 0.6 + 0.4 * Math.sin(t * 4 + it.x)
        g.save()
        g.globalAlpha = a
        g.translate(it.x, it.y)
        g.rotate(Math.PI / 4)
        g.strokeStyle = `rgba(240,225,170,${0.9 * pulse})`
        g.lineWidth = 1.4
        g.strokeRect(-4, -4, 8, 8)
        g.rotate(-Math.PI / 4)
        g.strokeStyle = `rgba(240,225,170,${0.35 * pulse})`
        g.beginPath(); g.arc(0, 0, 9 + pulse * 3, 0, Math.PI * 2); g.stroke()
        g.restore()
      }

      if (near) {
        const r = (it.kind === 'terminal' ? 30 : 16) + Math.sin(t * 5) * 1.5
        g.strokeStyle = 'rgba(240,232,210,0.85)'
        g.lineWidth = 1.5
        g.setLineDash([4, 4])
        g.lineDashOffset = -t * 12
        g.beginPath(); g.arc(it.x, it.y, r, 0, Math.PI * 2); g.stroke()
        g.setLineDash([])
      }
    }

    if (s.target) {
      const k = Math.min(1, s.target.age / 0.35)
      g.strokeStyle = `rgba(240,232,210,${0.8 * (1 - k * 0.6)})`
      g.lineWidth = 1.5
      g.beginPath(); g.ellipse(s.target.x, s.target.y, 6 + k * 6, 3 + k * 3, 0, 0, Math.PI * 2); g.stroke()
    }
  }
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export { STATUS_COLOR }
