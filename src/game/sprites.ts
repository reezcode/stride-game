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

/**
 * Detective in a hooded suit and fedora. (x, y) is the point between the feet.
 * `phase` advances with distance walked; `moving` toggles the gait.
 */
export function drawDetective(g: Ctx, x: number, y: number, color: string, facing: Facing, phase: number, moving: boolean) {
  const swing = moving ? Math.sin(phase) : 0
  const bob = moving ? Math.abs(Math.sin(phase)) * 1.6 : 0
  const dark = shade(color, -0.35)
  const darker = shade(color, -0.55)
  const light = shade(color, 0.18)

  // contact shadow
  g.fillStyle = 'rgba(0,0,0,0.38)'
  g.beginPath(); g.ellipse(x, y, 13, 5, 0, 0, Math.PI * 2); g.fill()

  // legs
  const side = facing === 'left' || facing === 'right'
  g.fillStyle = dark
  if (side) {
    const dir = facing === 'right' ? 1 : -1
    rr(g, x - 6 + swing * 4 * dir, y - 10, 9, 10, 3); g.fill()
    g.fillStyle = darker
    rr(g, x - 3 - swing * 4 * dir, y - 10, 9, 10, 3); g.fill()
  } else {
    rr(g, x - 10, y - 10 - Math.max(0, swing) * 2, 9, 10, 3); g.fill()
    rr(g, x + 1, y - 10 - Math.max(0, -swing) * 2, 9, 10, 3); g.fill()
  }

  const by = y - bob

  // backpack (behind body when facing down, so draw first)
  if (facing === 'left' || facing === 'right') {
    const bx = facing === 'right' ? x - 16 : x + 9
    g.fillStyle = dark
    rr(g, bx, by - 27, 7, 15, 3); g.fill()
  }

  // body
  const grad = g.createLinearGradient(x - 12, 0, x + 12, 0)
  grad.addColorStop(0, light)
  grad.addColorStop(0.55, color)
  grad.addColorStop(1, dark)
  g.fillStyle = grad
  rr(g, x - 12, by - 34, 24, 27, 11); g.fill()
  g.strokeStyle = 'rgba(0,0,0,0.35)'
  g.lineWidth = 1
  g.stroke()

  if (facing === 'up') {
    g.fillStyle = dark
    rr(g, x - 8, by - 27, 16, 14, 4); g.fill()
    g.fillStyle = 'rgba(255,255,255,0.12)'
    g.fillRect(x - 6, by - 25, 12, 2)
  }

  // visor
  if (facing !== 'up') {
    const vx = facing === 'left' ? x - 4 : facing === 'right' ? x + 4 : x
    const vw = facing === 'down' ? 9 : 7
    const vg = g.createLinearGradient(0, by - 30, 0, by - 19)
    vg.addColorStop(0, '#D4ECF5')
    vg.addColorStop(1, '#7FA8BB')
    g.fillStyle = vg
    g.beginPath(); g.ellipse(vx, by - 24, vw, 5, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.stroke()
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.beginPath(); g.ellipse(vx + (facing === 'left' ? -3 : 3), by - 26, 2.5, 1.4, 0, 0, Math.PI * 2); g.fill()
  }

  // fedora
  g.fillStyle = '#2C241D'
  g.beginPath(); g.ellipse(x, by - 34, 14, 4.5, 0, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#3F3329'
  rr(g, x - 8.5, by - 43, 17, 10, 4); g.fill()
  g.fillStyle = '#17120E'
  g.fillRect(x - 8.5, by - 36.5, 17, 2.4)
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.fillRect(x - 6, by - 42, 6, 2)
}

/** A bystander seen from above and in front, in the same proportions as the detective. */
export function drawCivilian(g: Ctx, x: number, y: number, look: { shirt: string; hair: string; skin: string; long?: boolean }, back = false) {
  g.fillStyle = 'rgba(0,0,0,0.38)'
  g.beginPath(); g.ellipse(x, y, 12, 5, 0, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#2B2F38'
  rr(g, x - 9, y - 10, 8, 10, 3); g.fill()
  rr(g, x + 1, y - 10, 8, 10, 3); g.fill()
  if (look.long) { g.fillStyle = look.hair; rr(g, x - 10, y - 44, 20, 26, 8); g.fill() }
  const grad = g.createLinearGradient(x - 11, 0, x + 11, 0)
  grad.addColorStop(0, shade(look.shirt, 0.15)); grad.addColorStop(1, shade(look.shirt, -0.3))
  g.fillStyle = grad
  rr(g, x - 11, y - 30, 22, 22, 8); g.fill()
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.stroke()
  g.fillStyle = look.skin
  g.beginPath(); g.arc(x, y - 36, 8.5, 0, Math.PI * 2); g.fill()
  g.fillStyle = look.hair
  g.beginPath()
  if (back) g.arc(x, y - 36, 8.8, 0, Math.PI * 2)
  else { g.arc(x, y - 37, 8.8, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(x, y - 41, x - 8.8, y - 37) }
  g.fill()
  if (!back) {
    g.fillStyle = '#1B1612'
    g.beginPath(); g.arc(x - 3, y - 35, 1, 0, Math.PI * 2); g.arc(x + 3, y - 35, 1, 0, Math.PI * 2); g.fill()
  }
}
