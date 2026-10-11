// The playable world: PayVault HQ's 14th floor, the family home and Kost
// Melati. The three places share one tile grid but are sealed off from each
// other; you move between them through the city map (see `zones`).
//
// Rooms and doors are carved out of a solid tile grid, so every tile that is
// not part of a room/door is wall. Props are placed in world pixels.

export const TILE = 32
export const COLS = 78
export const ROWS = 38
export const WORLD_W = COLS * TILE
export const WORLD_H = ROWS * TILE

const t = (n: number) => n * TILE

export type Floor =
  | 'raised' | 'lab' | 'wood' | 'carpet' | 'checker' | 'stone'
  | 'concrete' | 'corridor' | 'carpetWarm' | 'carpetDark'

export interface Room {
  id: string
  name: string
  x: number; y: number; w: number; h: number   // tiles, interior
  floor: Floor
  scenarioId?: string
  dim?: boolean        // night lighting (corridors, common areas)
  lockedUntilSolved?: boolean
}

export const rooms: Room[] = [
  { id: 'datacenter', name: 'Data Center',     x: 1,  y: 1,  w: 15, h: 10, floor: 'raised',   scenarioId: 'SC-001' },
  { id: 'identity',   name: 'Identity Lab',    x: 17, y: 1,  w: 15, h: 10, floor: 'lab',      scenarioId: 'SC-002' },
  { id: 'treasury',   name: 'Treasury',        x: 33, y: 1,  w: 16, h: 10, floor: 'wood',     scenarioId: 'SC-003' },
  { id: 'hall-n',     name: 'North Hall',      x: 1,  y: 12, w: 48, h: 3,  floor: 'corridor', dim: true },
  { id: 'ops',        name: 'Ops Control',     x: 1,  y: 16, w: 13, h: 10, floor: 'carpet',   scenarioId: 'SC-004' },
  { id: 'pantry',     name: 'Pantry',          x: 15, y: 16, w: 7,  h: 10, floor: 'checker',  dim: true },
  { id: 'lobby',      name: 'Reception',       x: 23, y: 16, w: 12, h: 10, floor: 'stone',    dim: true },
  { id: 'archive',    name: 'Records Archive', x: 36, y: 16, w: 13, h: 10, floor: 'concrete', scenarioId: 'SC-005' },
  { id: 'hall-s',     name: 'South Hall',      x: 1,  y: 27, w: 48, h: 2,  floor: 'corridor', dim: true },
  { id: 'training',   name: 'Training Room',   x: 1,  y: 30, w: 16, h: 7,  floor: 'carpetWarm', dim: true },
  { id: 'lifts',      name: 'Lift Lobby',      x: 18, y: 30, w: 11, h: 7,  floor: 'stone',    dim: true },
  { id: 'briefing',   name: 'Briefing Room',   x: 30, y: 30, w: 19, h: 7,  floor: 'carpetDark', lockedUntilSolved: true },

  // Home
  { id: 'home-laras',   name: 'Laras\'s Room', x: 53, y: 1,  w: 11, h: 5, floor: 'carpetWarm', dim: true },
  { id: 'home-mine',    name: 'Your Room',     x: 65, y: 1,  w: 11, h: 5, floor: 'carpet',     dim: true },
  { id: 'home-hall',    name: 'Hallway',       x: 53, y: 7,  w: 23, h: 2, floor: 'wood',       dim: true },
  { id: 'home-living',  name: 'Living Room',   x: 53, y: 10, w: 14, h: 7, floor: 'wood',       dim: true },
  { id: 'home-kitchen', name: 'Kitchen',       x: 68, y: 10, w: 8,  h: 7, floor: 'checker',    dim: true },

  // Kost Melati
  { id: 'kost-7',      name: 'Room 7 · Laras',   x: 53, y: 21, w: 10, h: 6, floor: 'lab',      dim: true },
  { id: 'kost-8',      name: 'Room 8 · Ayu',     x: 64, y: 21, w: 12, h: 6, floor: 'lab',      dim: true },
  { id: 'kost-yard',   name: 'Courtyard',        x: 53, y: 28, w: 23, h: 3, floor: 'concrete', dim: true },
  { id: 'kost-warung', name: 'Pak Jo\'s Warung', x: 53, y: 32, w: 23, h: 5, floor: 'stone',    dim: true },
]

// ─── Zones ───────────────────────────────────────────────────────────────

export type ZoneId = 'home' | 'kost' | 'hq'

export interface Zone {
  id: ZoneId
  name: string
  x: number; y: number; w: number; h: number     // world px
  arrive: { x: number; y: number }               // where you appear when you travel here
}

export const zones: Zone[] = [
  { id: 'home', name: 'Home',        x: t(52), y: 0,     w: t(25), h: t(18), arrive: { x: 1920, y: 492 } },
  { id: 'kost', name: 'Kost Melati', x: t(52), y: t(20), w: t(25), h: t(18), arrive: { x: 2340, y: 946 } },
  { id: 'hq',   name: 'PayVault HQ', x: 0,     y: 0,     w: t(50), h: t(38), arrive: { x: 640,  y: 1010 } },
]
export const zoneById = Object.fromEntries(zones.map(z => [z.id, z])) as Record<ZoneId, Zone>

export function zoneAt(px: number, py: number): Zone {
  return zones.find(z => px >= z.x && px < z.x + z.w && py >= z.y && py < z.y + z.h) ?? zoneById.hq
}

export const roomById: Record<string, Room> = Object.fromEntries(rooms.map(r => [r.id, r]))

export interface Door {
  id: string
  x: number; y: number; w: number; h: number   // tiles
  style: 'slide' | 'open'
  lock?: 'allSolved'
}

export const doors: Door[] = [
  { id: 'd-dc',        x: 7,  y: 11, w: 2, h: 1, style: 'slide' },
  { id: 'd-id',        x: 23, y: 11, w: 2, h: 1, style: 'slide' },
  { id: 'd-tr',        x: 40, y: 11, w: 2, h: 1, style: 'slide' },
  { id: 'd-ops-n',     x: 6,  y: 15, w: 2, h: 1, style: 'slide' },
  { id: 'd-ops-s',     x: 6,  y: 26, w: 2, h: 1, style: 'slide' },
  { id: 'd-pantry',    x: 17, y: 15, w: 2, h: 1, style: 'slide' },
  { id: 'd-pantry-l',  x: 22, y: 20, w: 1, h: 2, style: 'slide' },
  { id: 'd-lobby-n',   x: 26, y: 15, w: 6, h: 1, style: 'open' },
  { id: 'd-lobby-s',   x: 27, y: 26, w: 4, h: 1, style: 'open' },
  { id: 'd-arch-n',    x: 41, y: 15, w: 2, h: 1, style: 'slide' },
  { id: 'd-arch-s',    x: 42, y: 26, w: 2, h: 1, style: 'slide' },
  { id: 'd-training',  x: 8,  y: 29, w: 2, h: 1, style: 'slide' },
  { id: 'd-lifts',     x: 22, y: 29, w: 3, h: 1, style: 'open' },
  { id: 'd-briefing',  x: 38, y: 29, w: 3, h: 1, style: 'slide', lock: 'allSolved' },

  { id: 'h-laras',     x: 57, y: 6,  w: 2, h: 1, style: 'slide' },
  { id: 'h-mine',      x: 69, y: 6,  w: 2, h: 1, style: 'slide' },
  { id: 'h-living',    x: 58, y: 9,  w: 4, h: 1, style: 'open' },
  { id: 'h-kitchen',   x: 71, y: 9,  w: 2, h: 1, style: 'open' },
  { id: 'h-pass',      x: 67, y: 12, w: 1, h: 2, style: 'open' },

  { id: 'k-7',         x: 57, y: 27, w: 2, h: 1, style: 'slide' },
  { id: 'k-8',         x: 69, y: 27, w: 2, h: 1, style: 'slide' },
  { id: 'k-warung',    x: 62, y: 31, w: 5, h: 1, style: 'open' },
]

// Door name plates, painted on the corridor side of the wall next to a door.
export const signs: { text: string; x: number; y: number; align?: CanvasTextAlign }[] = [
  { text: 'DATA CENTER',   x: t(9.2),  y: t(11) + 7, align: 'left' },
  { text: 'IDENTITY LAB',  x: t(25.2), y: t(11) + 7, align: 'left' },
  { text: 'TREASURY',      x: t(42.2), y: t(11) + 7, align: 'left' },
  { text: 'OPS CONTROL',   x: t(8.2),  y: t(15) + 7, align: 'left' },
  { text: 'PANTRY',        x: t(19.2), y: t(15) + 7, align: 'left' },
  { text: 'RECEPTION',     x: t(32.2), y: t(15) + 7, align: 'left' },
  { text: 'ARCHIVE',       x: t(43.2), y: t(15) + 7, align: 'left' },
  { text: 'TRAINING',      x: t(10.2), y: t(29) + 7, align: 'left' },
  { text: 'LIFTS',         x: t(25.2), y: t(29) + 7, align: 'left' },
  { text: 'BRIEFING',      x: t(41.2), y: t(29) + 7, align: 'left' },
  { text: 'LARAS',         x: t(59.2), y: t(6) + 7,  align: 'left' },
  { text: 'ROOM 7',        x: t(59.2), y: t(27) + 7, align: 'left' },
  { text: 'ROOM 8',        x: t(71.2), y: t(27) + 7, align: 'left' },
  { text: 'WARUNG PAK JO · MIE AYAM', x: t(67.2), y: t(31) + 7, align: 'left' },
]

// ─── Grid ────────────────────────────────────────────────────────────────

const grid = new Uint8Array(COLS * ROWS) // 0 wall, 1 floor, 2 door
for (const r of rooms) {
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) grid[y * COLS + x] = 1
}
for (const d of doors) {
  for (let y = d.y; y < d.y + d.h; y++)
    for (let x = d.x; x < d.x + d.w; x++) grid[y * COLS + x] = 2
}

export function tileAt(c: number, r: number) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 0
  return grid[r * COLS + c]
}
export const isWallTile = (c: number, r: number) => tileAt(c, r) === 0
export const isWallAt = (px: number, py: number) => isWallTile(Math.floor(px / TILE), Math.floor(py / TILE))

export function roomAt(px: number, py: number): Room | null {
  const c = px / TILE, r = py / TILE
  for (const room of rooms) {
    if (c >= room.x && c < room.x + room.w && r >= room.y && r < room.y + room.h) return room
  }
  return null
}

export function doorRect(d: Door) {
  return { x: t(d.x), y: t(d.y), w: t(d.w), h: t(d.h) }
}

// ─── Props ───────────────────────────────────────────────────────────────

export type PropKind =
  | 'rackRow' | 'crac' | 'ups' | 'cableTray' | 'desk' | 'chair' | 'console'
  | 'cart' | 'whiteboard' | 'whiteboardV' | 'sideTable' | 'extinguisher' | 'plant'
  | 'printer' | 'phoneBench' | 'hsm' | 'gatePillar' | 'gateFlap' | 'vault'
  | 'safeWall' | 'cashTable' | 'meetingTable' | 'videoWall' | 'cabinet'
  | 'sofa' | 'sofaV' | 'counter' | 'fridge' | 'vending' | 'cooler' | 'roundTable'
  | 'reception' | 'logo' | 'rug' | 'coffeeTable' | 'corkboard' | 'shelf'
  | 'boxes' | 'bookshelf' | 'kiosk' | 'elevator' | 'bench' | 'screenWall'
  | 'podium' | 'trophyCase' | 'longTable' | 'bin' | 'wetSign' | 'hazard'
  | 'bed' | 'wardrobe' | 'tv' | 'bike' | 'stall' | 'mat' | 'spot'

export interface Prop {
  kind: PropKind
  x: number; y: number; w: number; h: number
  solid?: boolean
  face?: 'n' | 's' | 'e' | 'w'   // which side the "front" (screen, LEDs, seat) faces
  seed?: number
  n?: number                       // count of sub-units (rack cabinets, monitors…)
  scenarioId?: string              // for consoles: drives screen colour
  room?: string
}

const NON_SOLID = new Set<PropKind>(['cableTray', 'gateFlap', 'logo', 'rug', 'hazard', 'whiteboard', 'whiteboardV', 'videoWall', 'screenWall', 'corkboard', 'elevator', 'mat'])

const P: Prop[] = []
let seed = 1
function add(kind: PropKind, x: number, y: number, w: number, h: number, extra: Partial<Prop> = {}) {
  const p: Prop = { kind, x, y, w, h, seed: seed++, ...extra }
  if (p.solid === undefined) p.solid = !NON_SOLID.has(kind)
  P.push(p)
  return p
}
function chair(cx: number, cy: number, face: Prop['face'] = 'n') {
  add('chair', cx - 10, cy - 10, 20, 20, { face })
}
function plant(cx: number, cy: number, size = 22) {
  add('plant', cx - size / 2, cy - size / 2, size, size)
}

// Data Center ────────────────────────────────────────────────────────────
add('rackRow', 64, 64, 224, 28, { face: 's', n: 7 })
add('rackRow', 64, 147, 224, 28, { face: 'n', n: 7 })
add('rackRow', 64, 230, 224, 28, { face: 's', n: 7 })
add('cableTray', 60, 72, 232, 12)
add('cableTray', 60, 155, 232, 12)
add('cableTray', 60, 238, 232, 12)
add('whiteboard', 300, 22, 80, 14)
add('ups', 392, 35, 58, 26, { n: 2 })
add('crac', 461, 45, 46, 72)
add('crac', 461, 141, 46, 72)
add('hazard', 452, 38, 6, 180)
add('cart', 320, 150, 30, 22)
add('console', 371, 214, 56, 30, { face: 's', scenarioId: 'SC-001' })
chair(399, 262, 'n')
add('sideTable', 426, 290, 40, 24)
add('extinguisher', 40, 318, 14, 20)
plant(490, 330)

// Identity Lab ───────────────────────────────────────────────────────────
for (const [i, x] of [580, 660, 740].entries()) {
  add('desk', x, 70, 72, 30, { face: 's', n: 1, seed: 100 + i })
  chair(x + 36, 114, 'n')
  add('desk', x, 176, 72, 30, { face: 's', n: 1, seed: 110 + i })
  chair(x + 36, 220, 'n')
}
add('hsm', 848, 34, 40, 26)
add('phoneBench', 930, 46, 88, 36)
add('console', 940, 170, 56, 30, { face: 's', scenarioId: 'SC-002' })
chair(968, 216, 'n')
add('whiteboardV', 546, 208, 12, 90)
add('printer', 600, 288, 40, 30)
add('gatePillar', 718, 300, 12, 36)
add('gatePillar', 806, 300, 12, 36)
add('gateFlap', 730, 312, 76, 10)
plant(1002, 330)
plant(568, 334, 18)

// Treasury ───────────────────────────────────────────────────────────────
add('vault', 1400, 10, 120, 50)
add('safeWall', 1528, 96, 38, 160)
for (const [i, x] of [1090, 1210].entries()) {
  add('desk', x, 96, 112, 30, { face: 's', n: 3, seed: 200 + i })
  chair(x + 30, 142, 'n'); chair(x + 82, 142, 'n')
  add('desk', x, 214, 112, 30, { face: 's', n: 3, seed: 210 + i })
  chair(x + 30, 260, 'n'); chair(x + 82, 260, 'n')
}
add('cashTable', 1408, 160, 64, 40)
add('console', 1430, 280, 56, 30, { face: 's', scenarioId: 'SC-003' })
plant(1078, 58)
plant(1540, 330)
add('rug', 1080, 300, 160, 40)

// Ops Control ────────────────────────────────────────────────────────────
add('cabinet', 44, 516, 28, 26)
add('cabinet', 76, 516, 28, 26)
add('cabinet', 108, 516, 28, 26)
add('videoWall', 290, 500, 140, 22, { n: 3 })
add('rug', 92, 590, 206, 106)
add('meetingTable', 110, 608, 170, 70)
for (const x of [140, 195, 250]) { chair(x, 596, 's'); chair(x, 690, 'n') }
chair(98, 643, 'e'); chair(292, 643, 'w')
add('desk', 320, 620, 100, 34, { face: 's', n: 2, seed: 300 })
chair(370, 670, 'n')
add('console', 336, 720, 56, 30, { face: 's', scenarioId: 'SC-004' })
add('sofa', 48, 786, 100, 34, { face: 'n' })
add('sideTable', 160, 790, 34, 28)
plant(428, 812)
plant(424, 560, 18)

// Pantry ─────────────────────────────────────────────────────────────────
add('counter', 482, 548, 34, 212)
add('fridge', 482, 770, 34, 44)
add('vending', 664, 530, 36, 48)
add('cooler', 676, 764, 22, 22)
add('roundTable', 566, 626, 48, 48)
chair(590, 610, 's'); chair(590, 690, 'n'); chair(632, 650, 'w')
add('roundTable', 566, 736, 48, 48)
chair(590, 720, 's'); chair(632, 760, 'w'); chair(590, 800, 'n')

// Reception ──────────────────────────────────────────────────────────────
add('logo', 868, 640, 120, 120)
add('reception', 744, 556, 112, 40)
chair(800, 540, 's')
add('corkboard', 1106, 596, 12, 68)
add('rug', 990, 700, 124, 120)
add('sofa', 1006, 788, 100, 32, { face: 'n' })
add('sofaV', 1080, 700, 32, 80, { face: 'w' })
add('coffeeTable', 1012, 722, 56, 40)
plant(756, 812)
plant(1100, 540)
plant(758, 620, 18)

// Records Archive ────────────────────────────────────────────────────────
for (const [i, y] of [560, 640, 720].entries()) {
  add('shelf', 1170, y, 120, 26, { seed: 400 + i })
  add('shelf', 1400, y, 140, 26, { seed: 410 + i })
}
add('boxes', 1160, 522, 34, 28)
add('desk', 1170, 780, 90, 30, { face: 'n', n: 1, seed: 420 })
add('console', 1500, 780, 56, 30, { face: 'n', scenarioId: 'SC-005' })
plant(1548, 534, 18)
add('bin', 1300, 806, 16, 16)

// Halls ──────────────────────────────────────────────────────────────────
add('cooler', 44, 388, 22, 22)
add('bench', 380, 388, 72, 20)
plant(520, 398)
add('extinguisher', 940, 386, 14, 20)
add('bench', 1092, 388, 72, 20)
add('wetSign', 640, 446, 18, 18)
add('bin', 1180, 456, 16, 16)
plant(1546, 460)
plant(48, 900, 18)
add('extinguisher', 690, 868, 14, 20)
add('bin', 1110, 904, 16, 16)
plant(1550, 900, 18)

// Training Room ──────────────────────────────────────────────────────────
add('whiteboard', 60, 950, 150, 14)
add('bookshelf', 44, 1148, 180, 30)
add('bookshelf', 350, 1148, 180, 30)
for (const [i, x] of [70, 160].entries()) {
  add('desk', x, 1030, 72, 30, { face: 's', n: 1, seed: 500 + i })
  chair(x + 36, 1074, 'n')
}
add('kiosk', 408, 1012, 64, 44)
plant(520, 990, 18)

// Lift Lobby ─────────────────────────────────────────────────────────────
add('elevator', 600, 936, 80, 26)
add('elevator', 820, 936, 80, 26)
add('bench', 712, 1100, 80, 22)
plant(596, 1160)
plant(906, 1160)

// Briefing Room ──────────────────────────────────────────────────────────
add('screenWall', 1360, 936, 180, 26)
add('podium', 1430, 990, 40, 26)
for (const y of [1060, 1112]) for (let x = 1360; x <= 1540; x += 36) chair(x, y, 'n')
add('trophyCase', 980, 976, 70, 30)
add('longTable', 1000, 1080, 170, 40)
for (const x of [1030, 1085, 1140]) chair(x, 1138, 'n')
plant(1550, 1166, 18)

// Home ───────────────────────────────────────────────────────────────────
add('bed', 1704, 44, 70, 112, { seed: 601 })
add('sideTable', 1780, 44, 34, 24)
add('desk', 1840, 44, 72, 30, { face: 's', n: 1, seed: 602 })
chair(1876, 90, 'n')
add('wardrobe', 1956, 40, 80, 28)
add('rug', 1800, 118, 130, 56)
plant(2030, 176, 18)

add('desk', 2096, 44, 104, 30, { face: 's', n: 2, seed: 610 })
chair(2148, 90, 'n')
add('wardrobe', 2226, 40, 80, 28)
add('bed', 2352, 44, 70, 112, { seed: 611 })

add('sideTable', 2000, 228, 40, 22)
plant(1712, 240, 18)
plant(2416, 272, 18)

add('tv', 1756, 330, 96, 20)
add('rug', 1724, 376, 160, 86)
add('coffeeTable', 1776, 398, 56, 38)
add('sofa', 1744, 474, 120, 34, { face: 'n' })
add('roundTable', 2040, 386, 48, 48)
chair(2064, 370, 's'); chair(2064, 450, 'n'); chair(2024, 410, 'e')
add('cabinet', 2104, 326, 28, 26)
add('mat', 1890, 524, 60, 18)
plant(1712, 528, 20)
plant(2124, 528, 18)

add('fridge', 2184, 326, 34, 44)
add('counter', 2394, 328, 34, 206)
add('sideTable', 2260, 480, 60, 30)
add('bin', 2190, 520, 16, 16)

// Kost Melati ────────────────────────────────────────────────────────────
add('bed', 1704, 684, 70, 112, { seed: 620 })
add('boxes', 1786, 684, 34, 28)
add('boxes', 1790, 820, 34, 28)
add('desk', 1856, 684, 72, 30, { face: 's', n: 1, seed: 621 })
chair(1892, 730, 'n')
add('wardrobe', 1936, 680, 72, 28)
add('bin', 1990, 838, 16, 16)

add('desk', 2060, 684, 72, 30, { face: 's', n: 1, seed: 630 })
chair(2096, 730, 'n')
add('wardrobe', 2150, 680, 72, 28)
add('bed', 2352, 684, 70, 112, { seed: 631 })
add('rug', 2170, 760, 130, 70)
add('spot', 2228, 776, 22, 16)
plant(2064, 846, 18)

add('bench', 1990, 900, 72, 20)
add('bike', 2384, 918, 26, 56)
add('bike', 2350, 922, 26, 56, { seed: 3 })
plant(1712, 912, 20)
plant(2130, 906, 18)
add('bin', 1900, 904, 16, 16)

add('stall', 1716, 1034, 130, 46)
add('spot', 1768, 1094, 22, 16)
add('cooler', 1860, 1040, 22, 22)
for (const [i, x] of [1960, 2110, 2260].entries()) {
  add('roundTable', x, 1090, 48, 48, { seed: 640 + i })
  chair(x + 24, 1074, 's'); chair(x + 24, 1154, 'n'); chair(x + 66, 1114, 'w'); chair(x - 18, 1114, 'e')
}
add('bin', 2400, 1040, 16, 16)
plant(2412, 1164, 18)

for (const p of P) p.room = roomAt(p.x + p.w / 2, p.y + p.h / 2)?.id
export const props: Prop[] = P

// ─── Interactables ───────────────────────────────────────────────────────

export type InteractKind = 'terminal' | 'evidence' | 'manual' | 'debrief' | 'board' | 'flavor' | 'clue' | 'npc' | 'travel'

export interface Interactable {
  id: string
  kind: InteractKind
  x: number; y: number          // anchor (world px)
  range?: number
  label: string
  scenarioId?: string
  detail?: number
  text?: string                 // flavor message
}

function centerOf(kind: PropKind, scenarioId?: string) {
  const p = P.find(p => p.kind === kind && (!scenarioId || p.scenarioId === scenarioId))!
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 }
}

export const interactables: Interactable[] = [
  // Terminals
  ...['SC-001', 'SC-002', 'SC-003', 'SC-004', 'SC-005'].map(id => ({
    id: `term-${id}`, kind: 'terminal' as const, ...centerOf('console', id), range: 66,
    label: 'Case terminal', scenarioId: id,
  })),

  // SC-001 · Data Center
  { id: 'ev-1-0', kind: 'evidence', scenarioId: 'SC-001', detail: 0, x: 446, y: 302, label: 'API spec printout' },
  { id: 'ev-1-1', kind: 'evidence', scenarioId: 'SC-001', detail: 1, x: 120, y: 94,  label: 'Code-review note on rack 3' },
  { id: 'ev-1-2', kind: 'evidence', scenarioId: 'SC-001', detail: 2, x: 335, y: 161, label: 'Packet capture on laptop' },
  { id: 'ev-1-3', kind: 'evidence', scenarioId: 'SC-001', detail: 3, x: 340, y: 38,  label: 'Architecture sketch' },

  // SC-002 · Identity Lab
  { id: 'ev-2-0', kind: 'evidence', scenarioId: 'SC-002', detail: 0, x: 974, y: 66,  label: 'OTP test-bench log' },
  { id: 'ev-2-1', kind: 'evidence', scenarioId: 'SC-002', detail: 1, x: 696, y: 86,  label: 'Sticky note on monitor' },
  { id: 'ev-2-2', kind: 'evidence', scenarioId: 'SC-002', detail: 2, x: 620, y: 303, label: 'Lockout policy draft' },
  { id: 'ev-2-3', kind: 'evidence', scenarioId: 'SC-002', detail: 3, x: 776, y: 192, label: 'Session token dump' },
  { id: 'ev-2-4', kind: 'evidence', scenarioId: 'SC-002', detail: 4, x: 556, y: 253, label: 'Error-message screenshot' },

  // SC-003 · Treasury
  { id: 'ev-3-0', kind: 'evidence', scenarioId: 'SC-003', detail: 0, x: 1146, y: 112, label: 'Transfer request slip' },
  { id: 'ev-3-1', kind: 'evidence', scenarioId: 'SC-003', detail: 1, x: 1440, y: 180, label: 'Ledger reconciliation' },
  { id: 'ev-3-2', kind: 'evidence', scenarioId: 'SC-003', detail: 2, x: 1266, y: 230, label: 'Validation bug ticket' },
  { id: 'ev-3-3', kind: 'evidence', scenarioId: 'SC-003', detail: 3, x: 1545, y: 176, label: 'Audit log extract' },

  // SC-004 · Ops Control
  { id: 'ev-4-0', kind: 'evidence', scenarioId: 'SC-004', detail: 0, x: 195, y: 643, label: 'JWT decoder on laptop' },
  { id: 'ev-4-1', kind: 'evidence', scenarioId: 'SC-004', detail: 1, x: 370, y: 637, label: 'Frontend route guard' },
  { id: 'ev-4-2', kind: 'evidence', scenarioId: 'SC-004', detail: 2, x: 360, y: 524, label: 'API trace on video wall' },
  { id: 'ev-4-3', kind: 'evidence', scenarioId: 'SC-004', detail: 3, x: 90,  y: 529, label: 'Sticky note on cabinet' },
  { id: 'ev-4-4', kind: 'evidence', scenarioId: 'SC-004', detail: 4, x: 177, y: 804, label: 'Monitoring tablet' },

  // SC-005 · Records Archive
  { id: 'ev-5-0', kind: 'evidence', scenarioId: 'SC-005', detail: 0, x: 1215, y: 795, label: 'Receipt URL list' },
  { id: 'ev-5-1', kind: 'evidence', scenarioId: 'SC-005', detail: 1, x: 1230, y: 573, label: 'Bucket policy printout' },
  { id: 'ev-5-2', kind: 'evidence', scenarioId: 'SC-005', detail: 2, x: 1470, y: 653, label: 'Download request log' },
  { id: 'ev-5-3', kind: 'evidence', scenarioId: 'SC-005', detail: 3, x: 1177, y: 536, label: 'USB stick: enum script' },
  { id: 'ev-5-4', kind: 'evidence', scenarioId: 'SC-005', detail: 4, x: 1200, y: 733, label: 'Storage logging config' },

  // Common
  { id: 'manual',  kind: 'manual',  ...centerOf('kiosk'),  range: 60, label: 'STRIDE field manual' },
  { id: 'debrief', kind: 'debrief', ...centerOf('podium'), range: 56, label: 'Mission debrief' },
  { id: 'board',   kind: 'board',   x: 1106, y: 630, range: 50, label: 'Case board' },
  { id: 'coffee',  kind: 'flavor',  x: 499, y: 600, label: 'Coffee machine', text: 'Burnt espresso, 02:14. It will have to do.' },
  { id: 'vending', kind: 'flavor',  x: 682, y: 554, label: 'Vending machine', text: 'Card payments only. Ironic, given the night you are having.' },
  { id: 'lift',    kind: 'travel',  x: 640, y: 974, range: 52, label: 'Lift to the street' },

  // Home (story for each id lives in data/story.ts)
  { id: 'h-laptop',    kind: 'clue', x: 2148, y: 62,  range: 58, label: 'Your work laptop' },
  { id: 'h-photo',     kind: 'clue', x: 2020, y: 240, label: 'Photo on the hall table' },
  { id: 'h-phone',     kind: 'clue', x: 1876, y: 62,  range: 58, label: 'Laras\'s phone' },
  { id: 'h-statement', kind: 'clue', x: 1797, y: 58,  label: 'Printed wallet statement' },
  { id: 'h-letter',    kind: 'clue', x: 1804, y: 417, label: 'Letter from the campus' },
  { id: 'h-fridge',    kind: 'clue', x: 2201, y: 364, range: 52, label: 'Note on the fridge' },
  { id: 'exit-home',   kind: 'travel', x: 1920, y: 530, range: 50, label: 'Front door' },

  // Kost Melati
  { id: 'k-notebook',  kind: 'clue', x: 1892, y: 702, range: 58, label: 'Under the desk drawer' },
  { id: 'k-codes',     kind: 'clue', x: 1803, y: 700, label: 'Sticky notes in a packed box' },
  { id: 'k-tickets',   kind: 'clue', x: 1972, y: 700, range: 52, label: 'Printouts in the wardrobe' },
  { id: 'npc-ayu',     kind: 'npc',  x: 2239, y: 784, range: 56, label: 'Ayu' },
  { id: 'npc-pakjo',   kind: 'npc',  x: 1779, y: 1102, range: 60, label: 'Pak Jo' },
  { id: 'exit-kost',   kind: 'travel', x: 2397, y: 946, range: 52, label: 'Your motorbike' },
]

/** People standing around the world. Painted by the renderer, not the static layer. */
export interface Npc { id: string; x: number; y: number; shirt: string; hair: string; skin: string; long?: boolean }

export const npcs: Npc[] = [
  { id: 'npc-ayu',   x: 2239, y: 792,  shirt: '#6A7FB8', hair: '#2B1D16', skin: '#D0A07A', long: true },
  { id: 'npc-pakjo', x: 1779, y: 1110, shirt: '#E6E1D6', hair: '#8C8780', skin: '#B98458' },
]

export const SPAWN = { x: 2256, y: 130 }   // your room, at home

// ─── Lights ──────────────────────────────────────────────────────────────

export interface CeilingLight { x: number; y: number; room: string }

export const ceilingLights: CeilingLight[] = (() => {
  const out: CeilingLight[] = []
  for (const r of rooms) {
    const isHall = r.h <= 3
    const stepX = isHall ? 5 : 4
    const nx = Math.max(1, Math.round(r.w / stepX))
    const ny = isHall ? 1 : Math.max(1, Math.round(r.h / 4))
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      out.push({
        x: t(r.x) + (t(r.w) / nx) * (i + 0.5),
        y: t(r.y) + (t(r.h) / ny) * (j + 0.5),
        room: r.id,
      })
    }
  }
  return out
})()
