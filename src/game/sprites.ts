// Shared canvas helpers + the detective sprite (also used by UI avatars).

export type Ctx = CanvasRenderingContext2D
export type Facing = 'up' | 'down' | 'left' | 'right'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rr(g: Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255
  if (amt < 0) { r *= 1 + amt; gg *= 1 + amt; b *= 1 + amt }
  else { r += (255 - r) * amt; gg += (255 - gg) * amt; b += (255 - b) * amt }
  return `rgb(${r | 0},${gg | 0},${b | 0})`
}

export function withShadow(g: Ctx, blur: number, oy: number, alpha: number, fn: () => void) {
  g.save()
  g.shadowColor = `rgba(0,0,0,${alpha})`
  g.shadowBlur = blur
  g.shadowOffsetY = oy
  fn()
  g.restore()
}

// ─── People ──────────────────────────────────────────────────────────────

export interface BodyLook {
  top: string                 // jacket / shirt
  pants?: string
  skin: string
  hair: string
  style?: 'short' | 'long' | 'bun' | 'cap' | 'hood'
  glasses?: boolean
  apron?: boolean
  backpack?: boolean
  torch?: boolean
}

/**
 * A person seen from a raised three-quarter view, about 48px tall.
 * (x, y) is the point between the feet. `phase` advances with distance
 * walked; `moving` switches the walk cycle on.
 */
export function drawBody(g: Ctx, x: number, y: number, l: BodyLook, facing: Facing, phase: number, moving: boolean) {
  const swing = moving ? Math.sin(phase) : 0
  const bob = moving ? Math.abs(Math.sin(phase)) * 1.4 : 0
  const pants = l.pants ?? '#2B303A'
  const dark = shade(l.top, -0.32), light = shade(l.top, 0.16)
  const side = facing === 'left' || facing === 'right'
  const dir = facing === 'left' ? -1 : 1
  const by = y - bob

  // contact shadow
  g.fillStyle = 'rgba(0,0,0,0.36)'
  g.beginPath(); g.ellipse(x, y + 1, 13, 5, 0, 0, Math.PI * 2); g.fill()

  // legs and shoes
  const leg = (lx: number, lift: number, col: string) => {
    g.fillStyle = col; rr(g, lx, y - 13 - lift, 8, 12, 3); g.fill()
    g.fillStyle = '#17191D'; rr(g, lx - (side ? (dir < 0 ? 2 : 0) : 0.5), y - 4 - lift, side ? 10 : 9, 4.5, 2); g.fill()
  }
  if (side) {
    leg(x - 4 - swing * 4 * dir, Math.max(0, -swing) * 2, shade(pants, -0.25))
    leg(x - 4 + swing * 4 * dir, Math.max(0, swing) * 2, pants)
  } else {
    leg(x - 9, Math.max(0, swing) * 2.4, pants)
    leg(x + 1, Math.max(0, -swing) * 2.4, pants)
  }

  // backpack, seen from behind or as a bulge in profile
  if (l.backpack && facing === 'up') {
    g.fillStyle = '#2A2F38'; rr(g, x - 8, by - 31, 16, 17, 5); g.fill()
    g.fillStyle = '#3B424E'; rr(g, x - 5, by - 24, 10, 7, 2); g.fill()
  } else if (l.backpack && side) {
    g.fillStyle = '#2A2F38'; rr(g, x - dir * 14 - 3, by - 31, 7, 16, 3); g.fill()
  }

  // far arm (profile) or both arms hanging (front/back)
  const arm = (ax: number, sw: number, col: string) => {
    g.fillStyle = col; rr(g, ax, by - 30 + Math.abs(sw), 5.5, 14, 2.7); g.fill()
    g.fillStyle = l.skin; g.beginPath(); g.arc(ax + 2.7, by - 15 + Math.abs(sw) * 0.5 + sw * 1.5, 2.7, 0, Math.PI * 2); g.fill()
  }
  if (side) arm(x - 2.5 - swing * 5 * dir, swing, dark)
  else { arm(x - 14.5, swing * 1.6, dark); arm(x + 9, -swing * 1.6, dark) }

  // torso
  const tg = g.createLinearGradient(x - 11, 0, x + 11, 0)
  tg.addColorStop(0, light); tg.addColorStop(0.55, l.top); tg.addColorStop(1, dark)
  g.fillStyle = tg
  rr(g, x - (side ? 8 : 10.5), by - 33, side ? 16 : 21, 21, 7); g.fill()
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.stroke()
  if (facing === 'down') {
    if (l.apron) {
      g.fillStyle = '#EFEAE0'; rr(g, x - 7, by - 27, 14, 15, 2); g.fill()
      g.strokeStyle = '#EFEAE0'; g.lineWidth = 1.4
      g.beginPath(); g.moveTo(x - 6, by - 27); g.lineTo(x - 3, by - 33); g.moveTo(x + 6, by - 27); g.lineTo(x + 3, by - 33); g.stroke()
    } else {
      // zip and collar
      g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1
      g.beginPath(); g.moveTo(x, by - 30); g.lineTo(x, by - 13); g.stroke()
      g.fillStyle = dark
      g.beginPath(); g.moveTo(x - 5, by - 33); g.lineTo(x, by - 27); g.lineTo(x + 5, by - 33); g.closePath(); g.fill()
    }
    if (l.backpack) {
      g.strokeStyle = '#2A2F38'; g.lineWidth = 2.2
      g.beginPath(); g.moveTo(x - 7, by - 32); g.lineTo(x - 6, by - 17); g.moveTo(x + 7, by - 32); g.lineTo(x + 6, by - 17); g.stroke()
    }
  }
  if (l.style === 'hood' && facing !== 'down') {
    g.fillStyle = dark
    g.beginPath(); g.ellipse(x - (side ? dir * 3 : 0), by - 33, side ? 6 : 8, 4.5, 0, 0, Math.PI * 2); g.fill()
  }

  // near arm in profile, carrying the torch
  if (side) {
    arm(x - 2.5 + swing * 5 * dir, -swing, l.top)
    if (l.torch) { g.fillStyle = '#C9CED6'; rr(g, x + dir * 4 + swing * 5 * dir - 1, by - 17, 6 * 1, 3.4, 1.5); g.fill() }
  } else if (l.torch && facing === 'down') {
    g.fillStyle = '#C9CED6'; rr(g, x + 9.5, by - 14 - swing * 2, 4, 6, 1.5); g.fill()
    g.fillStyle = '#FFF1C8'; g.fillRect(x + 10, by - 9 - swing * 2, 3, 1.6)
  }

  // head
  const hx = x + (side ? dir * 2 : 0), hy = by - 39
  // long hair falls behind the shoulders, either side of the face
  if (l.style === 'long' && facing !== 'up') { g.fillStyle = l.hair; rr(g, hx - 10.5, hy - 7, 6, 19, 3); g.fill(); rr(g, hx + 4.5, hy - 7, 6, 19, 3); g.fill() }
  g.fillStyle = shade(l.skin, -0.14); rr(g, hx - 3, hy + 5, 6, 5, 2); g.fill()          // neck
  g.fillStyle = l.skin
  g.beginPath(); g.arc(hx, hy, 8.4, 0, Math.PI * 2); g.fill()
  if (!side) { g.beginPath(); g.arc(hx - 8.2, hy + 1, 1.8, 0, Math.PI * 2); g.arc(hx + 8.2, hy + 1, 1.8, 0, Math.PI * 2); g.fill() }

  // hair
  g.fillStyle = l.hair
  g.beginPath()
  if (facing === 'up') {
    g.arc(hx, hy, 8.9, 0, Math.PI * 2)
  } else if (side) {
    g.arc(hx - dir * 1.2, hy - 1, 8.9, dir > 0 ? Math.PI * 0.55 : Math.PI * 1.75, dir > 0 ? Math.PI * 1.75 : Math.PI * 0.45, dir < 0)
    g.lineTo(hx + dir * 4, hy - 5)
  } else {
    g.arc(hx, hy - 1, 8.9, Math.PI * 1.02, Math.PI * 1.98)
    g.quadraticCurveTo(hx + 4, hy - 4.5, hx, hy - 4); g.quadraticCurveTo(hx - 5, hy - 3.5, hx - 8.9, hy - 1)
  }
  g.closePath(); g.fill()
  if (l.style === 'long' && facing === 'up') { rr(g, hx - 9, hy - 2, 18, 16, 7); g.fill() }
  if (l.style === 'bun') { g.beginPath(); g.arc(hx - (side ? dir * 6 : 0), hy - (side ? 4 : 9), 4.2, 0, Math.PI * 2); g.fill() }
  if (l.style === 'cap') {
    g.fillStyle = '#20242C'
    g.beginPath(); g.arc(hx, hy - 2, 9, Math.PI, 0); g.closePath(); g.fill()
    if (facing !== 'up') { rr(g, hx - (side ? (dir > 0 ? 0 : 12) : 7), hy - 3, side ? 12 : 14, 3, 1.5); g.fill() }
  }
  if (l.style === 'hood' && facing !== 'up') {
    g.strokeStyle = dark; g.lineWidth = 2.4
    g.beginPath(); g.arc(hx, hy + 1, 9.6, Math.PI * 0.12, Math.PI * 0.88); g.stroke()
  }

  // face
  if (facing !== 'up') {
    g.fillStyle = '#1B1612'
    if (side) {
      g.beginPath(); g.arc(hx + dir * 4, hy + 0.5, 1.15, 0, Math.PI * 2); g.fill()
      g.fillRect(hx + dir * 2.5 - (dir < 0 ? 3 : 0), hy - 2.6, 3, 1)
    } else {
      g.beginPath(); g.arc(hx - 3.2, hy + 0.8, 1.15, 0, Math.PI * 2); g.arc(hx + 3.2, hy + 0.8, 1.15, 0, Math.PI * 2); g.fill()
      g.fillRect(hx - 5, hy - 2.4, 3.4, 1); g.fillRect(hx + 1.6, hy - 2.4, 3.4, 1)
      g.fillStyle = 'rgba(120,60,40,0.55)'; g.fillRect(hx - 1.8, hy + 4.2, 3.6, 1)
    }
    if (l.glasses) {
      g.strokeStyle = '#1B1612'; g.lineWidth = 0.9
      if (side) { g.strokeRect(hx + dir * 2.2 - (dir < 0 ? 4 : 0), hy - 1.4, 4, 3.6) }
      else { g.strokeRect(hx - 5.4, hy - 1.2, 4.4, 3.8); g.strokeRect(hx + 1, hy - 1.2, 4.4, 3.8); g.beginPath(); g.moveTo(hx - 1, hy + 0.4); g.lineTo(hx + 1, hy + 0.4); g.stroke() }
    }
  }
}

/** You: hoodie in your chosen colour, backpack, torch. */
export function drawDetective(g: Ctx, x: number, y: number, color: string, facing: Facing, phase: number, moving: boolean) {
  drawBody(g, x, y, { top: color, skin: '#D2A380', hair: '#2C241D', style: 'hood', backpack: true, torch: true }, facing, phase, moving)
}

export interface CivilianLook { shirt: string; hair: string; skin: string; long?: boolean; style?: BodyLook['style']; glasses?: boolean; apron?: boolean; pants?: string }

/** Someone standing in the world. */
export function drawCivilian(g: Ctx, x: number, y: number, look: CivilianLook, back = false) {
  drawBody(g, x, y, {
    top: look.shirt, skin: look.skin, hair: look.hair, pants: look.pants,
    style: look.style ?? (look.long ? 'long' : 'short'), glasses: look.glasses, apron: look.apron,
  }, back ? 'up' : 'down', 0, false)
}
