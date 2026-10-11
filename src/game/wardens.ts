// Wardens: the guard programs patrolling each breached room. They wander a
// fixed loop, chase the player on sight, and never leave their room.

import { wardens as defs, type WardenDef } from '@/data/story'
import { rooms, TILE, type Room } from './world'
import { move, findPath } from './physics'

export interface Warden {
  def: WardenDef
  room: Room
  x: number; y: number
  state: 'patrol' | 'chase'
  wp: number
  path: { x: number; y: number }[]
  repath: number
  stun: number
}

const SPEED_PATROL = 46
const SPEED_CHASE = 104
const SIGHT_WALK = 125
const SIGHT_RUN = 215
const TOUCH = 22

export function makeWardens(alive: (id: string) => boolean): Warden[] {
  return defs.filter(d => alive(d.id)).map(def => ({
    def,
    room: rooms.find(r => r.scenarioId === def.id)!,
    x: def.patrol[0].x, y: def.patrol[0].y,
    state: 'patrol', wp: 1, path: [], repath: 0, stun: 0,
  }))
}

function inRoom(r: Room, x: number, y: number) {
  return x >= r.x * TILE && x < (r.x + r.w) * TILE && y >= r.y * TILE && y < (r.y + r.h) * TILE
}

/** Advances one warden. Returns 'spotted' on the frame it notices the player, 'touch' when it reaches them. */
export function stepWarden(w: Warden, dt: number, player: { x: number; y: number; running: boolean }): 'spotted' | 'touch' | null {
  if (w.stun > 0) { w.stun -= dt; return null }

  const dist = Math.hypot(player.x - w.x, player.y - w.y)
  const playerInside = inRoom(w.room, player.x, player.y)
  let event: 'spotted' | 'touch' | null = null

  if (w.state === 'patrol' && playerInside && dist < (player.running ? SIGHT_RUN : SIGHT_WALK)) {
    w.state = 'chase'; w.path = []; w.repath = 0
    event = 'spotted'
  } else if (w.state === 'chase' && !playerInside) {
    w.state = 'patrol'; w.path = []
  }

  if (w.state === 'chase' && dist < TOUCH) return 'touch'

  w.repath -= dt
  if (!w.path.length || (w.state === 'chase' && w.repath <= 0)) {
    const goal = w.state === 'chase' ? player : w.def.patrol[w.wp]
    w.path = findPath(w.x, w.y, goal.x, goal.y) ?? []
    w.repath = 0.45
    if (!w.path.length && w.state === 'patrol') w.wp = (w.wp + 1) % w.def.patrol.length
  }

  const next = w.path[0]
  if (next) {
    const dx = next.x - w.x, dy = next.y - w.y
    const d = Math.hypot(dx, dy)
    if (d < 5) {
      w.path.shift()
      if (!w.path.length && w.state === 'patrol') w.wp = (w.wp + 1) % w.def.patrol.length
    } else {
      const sp = (w.state === 'chase' ? SPEED_CHASE : SPEED_PATROL) * dt
      const before = { x: w.x, y: w.y }
      const r = move(w.x, w.y, (dx / d) * sp, (dy / d) * sp)
      // never follow the player out through a door
      if (inRoom(w.room, r.x, r.y)) { w.x = r.x; w.y = r.y }
      if (Math.hypot(w.x - before.x, w.y - before.y) < sp * 0.1) w.path = []
    }
  }
  return event
}
