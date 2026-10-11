import { props, doors, doorRect, isWallTile, TILE, WORLD_W, WORLD_H } from './world'

export const PLAYER_R = 9

interface Rect { x: number; y: number; w: number; h: number }

const solids: Rect[] = props.filter(p => p.solid).map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h }))
let locked: Rect[] = []

function hitsRect(cx: number, cy: number, r: number, b: Rect) {
  const nx = Math.max(b.x, Math.min(cx, b.x + b.w))
  const ny = Math.max(b.y, Math.min(cy, b.y + b.h))
  const dx = cx - nx, dy = cy - ny
  return dx * dx + dy * dy < r * r
}

export function blocked(x: number, y: number, r = PLAYER_R): boolean {
  if (x - r < 0 || y - r < 0 || x + r > WORLD_W || y + r > WORLD_H) return true
  const c0 = Math.floor((x - r) / TILE), c1 = Math.floor((x + r) / TILE)
  const r0 = Math.floor((y - r) / TILE), r1 = Math.floor((y + r) / TILE)
  for (let ry = r0; ry <= r1; ry++) for (let cx = c0; cx <= c1; cx++) {
    if (isWallTile(cx, ry) && hitsRect(x, y, r, { x: cx * TILE, y: ry * TILE, w: TILE, h: TILE })) return true
  }
  for (const b of locked) if (hitsRect(x, y, r, b)) return true
  for (const b of solids) {
    if (x + r < b.x || x - r > b.x + b.w || y + r < b.y || y - r > b.y + b.h) continue
    if (hitsRect(x, y, r, b)) return true
  }
  return false
}

/** Move with per-axis resolution so the player slides along walls. */
export function move(x: number, y: number, dx: number, dy: number) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4))
  const sx = dx / steps, sy = dy / steps
  for (let i = 0; i < steps; i++) {
    if (sx && !blocked(x + sx, y)) x += sx
    if (sy && !blocked(x, y + sy)) y += sy
  }
  return { x, y }
}

// ─── Navigation grid / A* ────────────────────────────────────────────────

const CELL = 16
const NW = Math.ceil(WORLD_W / CELL)
const NH = Math.ceil(WORLD_H / CELL)
let walk = new Uint8Array(NW * NH)

function rebuildNav() {
  walk = new Uint8Array(NW * NH)
  for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) {
    walk[j * NW + i] = blocked(i * CELL + CELL / 2, j * CELL + CELL / 2, PLAYER_R + 1) ? 0 : 1
  }
}

export function setLocks(allSolved: boolean) {
  locked = doors.filter(d => d.lock === 'allSolved' && !allSolved).map(doorRect)
  rebuildNav()
}
setLocks(false)

export function isLockedDoor(id: string) {
  const d = doors.find(d => d.id === id)
  return !!d && locked.some(r => r.x === d.x * TILE && r.y === d.y * TILE)
}

const cellOf = (x: number, y: number) => [
  Math.max(0, Math.min(NW - 1, Math.floor(x / CELL))),
  Math.max(0, Math.min(NH - 1, Math.floor(y / CELL))),
] as const

function nearestWalkable(ci: number, cj: number, maxR = 8): [number, number] | null {
  if (walk[cj * NW + ci]) return [ci, cj]
  for (let r = 1; r <= maxR; r++) {
    let best: [number, number] | null = null, bd = Infinity
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (i < 0 || j < 0 || i >= NW || j >= NH) continue
      if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || !walk[j * NW + i]) continue
      const d = (i - ci) ** 2 + (j - cj) ** 2
      if (d < bd) { bd = d; best = [i, j] }
    }
    if (best) return best
  }
  return null
}

function lineClear(ax: number, ay: number, bx: number, by: number) {
  const d = Math.hypot(bx - ax, by - ay)
  const n = Math.ceil(d / 6)
  for (let k = 1; k <= n; k++) {
    const f = k / n
    if (blocked(ax + (bx - ax) * f, ay + (by - ay) * f, PLAYER_R)) return false
  }
  return true
}

/** Returns world-space waypoints (excluding the start), or null if unreachable. */
export function findPath(sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] | null {
  const [si, sj] = cellOf(sx, sy)
  const start = nearestWalkable(si, sj, 2)
  const [ti, tj] = cellOf(tx, ty)
  const goal = nearestWalkable(ti, tj, 8)
  if (!start || !goal) return null

  const S = start[1] * NW + start[0]
  const G = goal[1] * NW + goal[0]
  const g = new Float32Array(NW * NH).fill(Infinity)
  const came = new Int32Array(NW * NH).fill(-1)
  const closed = new Uint8Array(NW * NH)
  const heap: [number, number][] = []
  const push = (f: number, n: number) => {
    heap.push([f, n])
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p][0] <= heap[i][0]) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]; i = p
    }
  }
  const pop = () => {
    const top = heap[0], last = heap.pop()!
    if (heap.length) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1, r = l + 1
        let m = i
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i], heap[m]]; i = m
      }
    }
    return top
  }
  const h = (n: number) => {
    const dx = Math.abs((n % NW) - goal[0]), dy = Math.abs(Math.floor(n / NW) - goal[1])
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy)
  }

  g[S] = 0
  push(h(S), S)
  while (heap.length) {
    const [, cur] = pop()
    if (cur === G) break
    if (closed[cur]) continue
    closed[cur] = 1
    const ci = cur % NW, cj = Math.floor(cur / NW)
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue
      const ni = ci + di, nj = cj + dj
      if (ni < 0 || nj < 0 || ni >= NW || nj >= NH) continue
      const n = nj * NW + ni
      if (!walk[n] || closed[n]) continue
      if (di && dj && (!walk[cj * NW + ni] || !walk[nj * NW + ci])) continue
      const ng = g[cur] + (di && dj ? 1.414 : 1)
      if (ng < g[n]) { g[n] = ng; came[n] = cur; push(ng + h(n), n) }
    }
  }
  if (came[G] === -1 && G !== S) return null

  const cells: { x: number; y: number }[] = []
  for (let n = G; n !== -1 && n !== S; n = came[n]) {
    cells.push({ x: (n % NW) * CELL + CELL / 2, y: Math.floor(n / NW) * CELL + CELL / 2 })
  }
  cells.reverse()

  // String-pull: keep only the waypoints needed for straight, clear segments.
  const out: { x: number; y: number }[] = []
  let ax = sx, ay = sy, i = 0
  while (i < cells.length) {
    let j = cells.length - 1
    while (j > i && !lineClear(ax, ay, cells[j].x, cells[j].y)) j--
    out.push(cells[j])
    ax = cells[j].x; ay = cells[j].y
    i = j + 1
  }
  return out
}
