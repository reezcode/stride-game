// The story layer. The cases in ./index.ts describe *systems*; this file says
// what those systems were used for, who did it, and who it was done to.
//
// `{name}` in any text is replaced with the player's name.

import type { StrideCategory } from '@/stores/game'

export type CharId = 'mc' | 'sari' | 'dimas' | 'raka' | 'ratna' | 'laras' | 'ayu' | 'unknown' | 'warden'
export type Backdrop = 'day' | 'night' | 'dark'
export type Motif = 'warm' | 'grief' | 'dread' | 'resolve'

export type Line =
  /** Changes the backdrop; does not wait for input. `room` is a world room id. */
  | { k: 'bg'; bg: Backdrop; room?: string; label?: string; motif?: Motif }
  | { k: 'card'; title: string; sub?: string; small?: string; motif?: Motif }
  | { k: 'narr'; text: string }
  | { k: 'say'; who: CharId; text: string; as?: string; color?: string }
  /** Phone message. Consecutive chat lines stack in one thread. */
  | { k: 'chat'; from: CharId; text: string; thread: string; meta?: string }
  | { k: 'choice'; who: CharId; prompt: string; answer: string; options: { id: string; label: string; reply: string }[] }
  | { k: 'proof'; title: string; text: string }

export const CAST: Record<CharId, { name: string; role: string }> = {
  mc:      { name: '{name}',   role: 'Platform engineer' },
  sari:    { name: 'Sari',     role: 'QA engineer' },
  dimas:   { name: 'Dimas',    role: 'Operations' },
  raka:    { name: 'Raka',     role: 'Senior platform engineer' },
  ratna:   { name: 'Bu Ratna', role: 'Head of Engineering' },
  laras:   { name: 'Laras',    role: 'Your sister' },
  ayu:     { name: 'Ayu',      role: '' },
  unknown: { name: '???',      role: '' },
  warden:  { name: 'Warden',   role: '' },
}

// ─── Prologue ────────────────────────────────────────────────────────────

export const prologue: Line[] = [
  { k: 'bg', bg: 'dark' },
  {
    k: 'card', title: 'Before you start',
    sub: 'This story deals with online harassment and the suicide of a family member. Nothing is shown, but it is at the centre of the plot.',
    small: 'If that is close to home today, it is fine to come back another time.',
  },

  { k: 'bg', bg: 'day', room: 'pantry', label: 'PayVault HQ · 14th floor · Friday 16:40', motif: 'warm' },
  { k: 'narr', text: 'Friday cake in the pantry. Somebody found candles.' },
  { k: 'say', who: 'ratna', text: 'Fraud losses are down forty percent this quarter, and most of that is one person\'s work. {name}, from Monday you lead the platform team.' },
  { k: 'say', who: 'sari', text: 'Told you! You owe me lunch. I applied for that job too, you know. I am only slightly furious.' },
  { k: 'say', who: 'dimas', text: 'Lead already? Six years here and I still can\'t get a second monitor.' },
  { k: 'say', who: 'raka', text: 'Congratulations. Really. Nobody deserves it more.' },
  { k: 'say', who: 'mc', text: 'It was the team. I only wrote the ticket.' },
  { k: 'say', who: 'sari', text: 'See, that\'s the annoying part. You even mean it.' },

  { k: 'chat', thread: 'Laras', from: 'laras', text: 'kak!! did you get it??' },
  { k: 'chat', thread: 'Laras', from: 'mc', text: 'got it. dinner sunday, my treat' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'PROUD OF YOU. also i finally installed your PayVault thing, you can stop nagging' },
  { k: 'chat', thread: 'Laras', from: 'mc', text: 'welcome to the future. don\'t spend it all on boba' },
  { k: 'narr', text: 'You put the phone away, smiling. Across the table, someone watches you do it.' },

  { k: 'bg', bg: 'dark', label: 'That night' },
  { k: 'card', title: 'That night', motif: 'dread' },
  { k: 'narr', text: 'One of the people who clapped for you goes home, opens a laptop, and types your sister\'s phone number into a search box.' },
  { k: 'say', who: 'unknown', text: 'Always the good one. Let\'s see how good you are when it isn\'t you it happens to.' },
  { k: 'narr', text: 'They can\'t touch you. Your record is spotless. But the systems you all built together have gaps, and they know every one.' },

  { k: 'bg', bg: 'dark' },
  { k: 'card', title: 'Week one' },
  { k: 'chat', thread: 'Unknown number', from: 'unknown', text: 'Mie ayam at Pak Jo, 12:41. Kost Melati, room 7. I can see where your money goes, Laras.' },
  { k: 'chat', thread: 'Unknown number', from: 'laras', text: 'who is this' },
  { k: 'chat', thread: 'Unknown number', from: 'unknown', text: 'Tell your brother and it gets worse.' },
  { k: 'narr', text: 'Her phone lights up with a login code she never asked for. Then another. Then four hundred more, all night.' },

  { k: 'card', title: 'Week two' },
  { k: 'narr', text: 'Messages go out from her account to her friends, asking for money. Her wallet empties in transfers she cannot prove she didn\'t make.' },
  { k: 'chat', thread: 'Ayu', from: 'ayu', text: 'Laras you said you\'d pay me back yesterday??' },
  { k: 'chat', thread: 'Ayu', from: 'laras', text: 'that wasn\'t me. i swear it wasn\'t me' },
  { k: 'chat', thread: 'Ayu', from: 'ayu', text: 'it\'s your account.' },
  { k: 'chat', thread: 'Laras', from: 'mc', text: 'you ok? you\'ve been quiet' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'just exams. don\'t worry about me kak' },

  { k: 'card', title: 'Week three' },
  { k: 'narr', text: 'Her receipts appear in the campus group chat. The pharmacy. The counselling clinic. Someone adds a laughing emoji. Then everyone does.' },
  { k: 'narr', text: 'She writes to PayVault support four times. Each ticket is closed within a minute, by an admin account that belongs to no admin.' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'kak are you awake', meta: '02:07' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'never mind. sleep well. sunday dinner was nice', meta: '02:19' },
  { k: 'narr', text: 'You see it at seven, on the train. You call. It rings out.' },

  { k: 'card', title: 'Laras took her own life on a Tuesday.', sub: 'She was nineteen. She did not leave a note.', motif: 'grief' },
  { k: 'narr', text: 'The funeral is small. Sari holds your arm. Dimas brings food nobody eats. Raka shakes your hand with both of his.' },
  { k: 'narr', text: 'Everyone says the same thing: nobody saw it coming.' },

  { k: 'bg', bg: 'dark', label: 'Eleven days later · 01:31' },
  { k: 'card', title: 'Eleven days later', sub: '01:31' },
  { k: 'narr', text: 'You can\'t sleep, so you go through her phone again. It was wiped before she died. But one message was scheduled, and tonight it sends.' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'kak. if you\'re reading this i couldn\'t tell you. they said it would get worse if i did, and it got worse anyway', meta: 'Scheduled' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'it started in PayVault. everything they knew about me, they got from there. it\'s someone on the inside' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'there\'s a security manual your office makes everyone skip. i read it. it has a name for each thing they did to me. six of them' },
  { k: 'chat', thread: 'Laras', from: 'laras', text: 'i\'m sorry. don\'t be angry at yourself. you\'re the good one, remember' },

  { k: 'bg', bg: 'night', room: 'lobby', label: 'PayVault HQ · 14th floor · 02:14', motif: 'dread' },
  { k: 'narr', text: 'Forty minutes later you badge onto the 14th floor.' },
  { k: 'narr', text: 'Five rooms are dark and the intrusion alarm is going. Someone is inside the systems right now, erasing three weeks of logs, and they have left things behind to guard the work.' },
  { k: 'say', who: 'mc', text: 'Whoever you are. I am going to find every single thing you did to her.' },
]

// ─── Counters (the six answers, never introduced as a framework) ─────────

export interface Counter { id: StrideCategory; name: string; line: string; miss: string }

export const COUNTERS: Counter[] = [
  { id: 'S', name: 'Verify',   line: 'Make it prove who it is',             miss: 'It never lied about who it was.' },
  { id: 'T', name: 'Checksum', line: 'Compare against the untouched original', miss: 'Nothing was being altered.' },
  { id: 'R', name: 'Trace',    line: 'Put it on a record it cannot erase',  miss: 'It wasn\'t hiding its tracks.' },
  { id: 'I', name: 'Seal',     line: 'Close off what it can see',           miss: 'It wasn\'t looking at anything it shouldn\'t.' },
  { id: 'D', name: 'Throttle', line: 'Limit how fast it can come at you',   miss: 'It wasn\'t trying to overwhelm anything.' },
  { id: 'E', name: 'Revoke',   line: 'Take back rights it gave itself',     miss: 'It hadn\'t taken any rights it wasn\'t given.' },
]

// ─── Wardens ─────────────────────────────────────────────────────────────

export interface Move { text: string; answer: StrideCategory; why: string }

export interface WardenDef {
  id: string                 // scenario id it guards
  name: string
  color: string
  tagline: string
  patrol: { x: number; y: number }[]
  retreat: { x: number; y: number }   // where you fall back to if it beats you
  moves: Move[]
  intro: Line[]
  down: string
}

export const WARDEN_LOCKS = 3
export const WARDEN_HIT = 20

export const wardens: WardenDef[] = [
  {
    id: 'SC-001', name: 'WATCHER', color: '#4F8BE0',
    tagline: 'It knows where she ate lunch.',
    patrol: [{ x: 430, y: 150 }, { x: 330, y: 292 }, { x: 140, y: 300 }, { x: 330, y: 120 }],
    retreat: { x: 256, y: 432 },
    intro: [
      { k: 'narr', text: 'Cold air and fan noise. Something drifts between the racks with a single lens, reading.' },
      { k: 'say', who: 'warden', as: 'WATCHER', color: '#4F8BE0', text: 'QUERY: who are you. QUERY: where do you live. QUERY: who do you love.' },
      { k: 'say', who: 'mc', text: 'That\'s how they knew her room number. It just looks. Stay out of its sight, find what it hasn\'t wiped, then break it.' },
    ],
    down: 'WATCHER goes blind. The Data Center terminal is yours.',
    moves: [
      { answer: 'I', text: 'Its lens widens. Your payslip, your address and your mother\'s phone number scroll across its face. It is reading files nobody ever gave it.',
        why: 'It was looking at things it had no right to see. That is information disclosure, and the answer is to close the view.' },
      { answer: 'S', text: 'It holds up a session badge with your own employee number on it and asks the rack to open.',
        why: 'It was claiming to be you. Spoofing only works until something checks.' },
      { answer: 'D', text: 'It fires the same request ten thousand times a second until the rack fans scream and the lights dip.',
        why: 'It was trying to drown the system. A flood needs speed, so take the speed away. That is how you stop denial of service.' },
      { answer: 'R', text: 'It opens tonight\'s query log and starts deleting every line with its own name on it.',
        why: 'It was making sure nobody could say what it did. Repudiation is beaten by a record that cannot be edited.' },
    ],
  },
  {
    id: 'SC-002', name: 'MIMIC', color: '#E0506E',
    tagline: 'It wears her face.',
    patrol: [{ x: 880, y: 130 }, { x: 700, y: 150 }, { x: 700, y: 270 }, { x: 880, y: 250 }],
    retreat: { x: 768, y: 432 },
    intro: [
      { k: 'narr', text: 'Two rows of test phones buzz in the dark, one after another. Above them floats a screen with a profile photo on it. Her profile photo.' },
      { k: 'say', who: 'warden', as: 'MIMIC', color: '#E0506E', text: 'it\'s me kak. i lost my phone. can you send me the code?' },
      { k: 'say', who: 'mc', text: 'Don\'t. Don\'t you use her voice.' },
    ],
    down: 'MIMIC loses its face. The Identity Lab terminal is yours.',
    moves: [
      { answer: 'S', text: 'The screen shows Laras\'s photo and her name. "It\'s me, kak," it types. "You know it\'s me. Just read me the six digits."',
        why: 'It was pretending to be someone it is not. That is spoofing, and it ends when you make it prove itself.' },
      { answer: 'D', text: 'Codes hammer the verifier: 000000, 000001, 000002. Every phone on the bench rings at once and will not stop.',
        why: 'Nothing was slowing it down, so it could try forever and bury her in alerts. Limiting the rate stops the flood.' },
      { answer: 'T', text: 'It opens the lockout policy and quietly changes "five attempts" to "five million".',
        why: 'It was rewriting something that should not change. Tampering shows up the moment you compare against the original.' },
      { answer: 'E', text: 'It edits one word in its own guest pass, and the lab now addresses it as "identity administrator".',
        why: 'It promoted itself. Elevation of privilege is undone by taking back rights nobody granted.' },
    ],
  },
  {
    id: 'SC-003', name: 'FORGER', color: '#E0A030',
    tagline: 'It makes the ledger lie.',
    patrol: [{ x: 1500, y: 230 }, { x: 1370, y: 110 }, { x: 1370, y: 250 }, { x: 1380, y: 320 }],
    retreat: { x: 1312, y: 432 },
    intro: [
      { k: 'narr', text: 'The vault door is shut and the desks are empty. Something with too many pens is rewriting a ledger, line by line.' },
      { k: 'say', who: 'warden', as: 'FORGER', color: '#E0A030', text: 'She sent the money. It says so right here. It will always say so.' },
      { k: 'say', who: 'mc', text: 'She told her friends it wasn\'t her. Nobody believed her, because the numbers agreed with you.' },
    ],
    down: 'FORGER drops its pens. The Treasury terminal is yours.',
    moves: [
      { answer: 'T', text: 'A transfer slip slides across the desk. You signed for 500,000. It now reads minus 500,000, and the ink is still wet.',
        why: 'It changed the number after the fact. That is tampering. Check it against what was really sent.' },
      { answer: 'R', text: '"You sent this yourself," it says, holding up a transfer with no trace of where it came from. "Prove you didn\'t."',
        why: 'With no trustworthy record it is your word against a machine. That gap is called repudiation, and a trail closes it.' },
      { answer: 'I', text: 'It unrolls a printout of every wallet balance in the building and begins reading them aloud to the empty room.',
        why: 'It was exposing what should stay private. Information disclosure stops when the view is closed.' },
      { answer: 'S', text: 'It signs the next transfer with the treasurer\'s name, in the treasurer\'s handwriting.',
        why: 'It was acting as someone else. Spoofing fails the moment the signature is checked.' },
    ],
  },
  {
    id: 'SC-004', name: 'USURPER', color: '#9A72E8',
    tagline: 'It gave itself the keys.',
    patrol: [{ x: 60, y: 660 }, { x: 230, y: 560 }, { x: 420, y: 700 }, { x: 290, y: 760 }],
    retreat: { x: 224, y: 432 },
    intro: [
      { k: 'narr', text: 'The video wall is running with nobody watching it. A shape sits at the head of the meeting table like it owns the room.' },
      { k: 'say', who: 'warden', as: 'USURPER', color: '#9A72E8', text: 'Ticket closed. Ticket closed. Ticket closed. Ticket closed. Is there anything else I can help you with today?' },
      { k: 'say', who: 'mc', text: 'Four times she asked for help. Four times this thing shut the door on her.' },
    ],
    down: 'USURPER is thrown off its chair. The Ops Control terminal is yours.',
    moves: [
      { answer: 'E', text: 'It rubs out the word "user" on its badge, writes "admin" over it, and the control panel lights up for it.',
        why: 'It handed itself power nobody gave it. That is elevation of privilege. Take the rights back.' },
      { answer: 'R', text: 'It closes a ticket marked URGENT, the fourth from the same girl, and leaves nothing to show whose hand did it.',
        why: 'It acted and left no trace of who acted. Repudiation ends when every action is signed and kept.' },
      { answer: 'S', text: 'It logs in as "admin" with the password "admin123" and tells the room it is the head of operations.',
        why: 'It was passing itself off as someone trusted. Spoofing breaks when identity is actually checked.' },
      { answer: 'D', text: 'It pours ten thousand fake alerts onto the video wall so that the one real alert is lost in the noise.',
        why: 'It was overwhelming the people who could have helped. Slow the flood and the real signal comes back.' },
    ],
  },
  {
    id: 'SC-005', name: 'BROADCAST', color: '#2FB8A6',
    tagline: 'It showed everyone.',
    patrol: [{ x: 1500, y: 613 }, { x: 1200, y: 613 }, { x: 1200, y: 693 }, { x: 1500, y: 693 }],
    retreat: { x: 1344, y: 432 },
    intro: [
      { k: 'narr', text: 'Shelves of receipts. Something walks them in order, lifting each page to a light, like it is choosing which to hang up.' },
      { k: 'say', who: 'warden', as: 'BROADCAST', color: '#2FB8A6', text: 'Pharmacy, 14 March. Counselling clinic, 16 March. Shall I post these to the group?' },
      { k: 'say', who: 'mc', text: 'She went to get help, and you turned it into something to laugh at.' },
    ],
    down: 'BROADCAST goes silent. The Records Archive terminal is yours.',
    moves: [
      { answer: 'I', text: 'It walks the shelf in order, receipt 90001, 90002, 90003, and pins each one to a board in the street outside.',
        why: 'Private records, shown to anyone. Information disclosure, and the fix is to close the view.' },
      { answer: 'T', text: 'It takes a pharmacy receipt, changes the name printed on it, and files it back as if nothing happened.',
        why: 'It altered a record. Tampering is caught by comparing against the untouched copy.' },
      { answer: 'R', text: 'It reaches up and switches off the camera over the shelves before it starts copying.',
        why: 'It made sure nothing would remember what it did. Repudiation is beaten by a record it cannot switch off.' },
      { answer: 'E', text: 'It finds the archivist\'s keys in a drawer left open, and hangs them on its own belt.',
        why: 'It took rights that were never its own. That is elevation of privilege. Revoke them.' },
    ],
  },
]

export const wardenById: Record<string, WardenDef> = Object.fromEntries(wardens.map(w => [w.id, w]))

// ─── What each sealed case proves ────────────────────────────────────────

export interface Proof { id: string; title: string; text: string }

export const proofs: Proof[] = [
  { id: 'SC-001', title: 'Query log · Data Center',
    text: 'One staff test token read Laras\'s transactions 214 times. The first read was at 23:12 on the Friday the promotion was announced.' },
  { id: 'SC-002', title: 'Bench log · Identity Lab',
    text: '31,408 login codes were tried against her number from the lab\'s own test bench at 01:52. The door log shows one badge in the lab that night: 0417.' },
  { id: 'SC-003', title: 'Ledger trace · Treasury',
    text: 'The reversed transfers emptied her wallet into USR-7731, a wallet registered to a SIM card bought with a PayVault staff discount code.' },
  { id: 'SC-004', title: 'Admin session · Ops Control',
    text: 'Her four support tickets were closed by a user token edited to say "admin", sent from the wired port at desk P-3. Dimas was on leave in Lombok that week. P-3 is not his desk.' },
  { id: 'SC-005', title: 'USB stick · Records Archive',
    text: 'The script that scraped her receipts and posted them. First line: "# rk / scratch, do not commit". Built on PayVault laptop PV-0417.' },
]

export const proofById: Record<string, Proof> = Object.fromEntries(proofs.map(p => [p.id, p]))

/** Played after a case is sealed: what Laras tried to say, and what you can now prove. */
export const fragments: Record<string, { draft: string; lines: Line[] }> = {
  'SC-001': {
    draft: 'kak, someone knows where i eat lunch. and my room number. is that a thing people can just look up?',
    lines: [
      { k: 'narr', text: 'The restored log still holds a draft from her phone, synced and never sent.' },
      { k: 'chat', thread: 'Laras · draft', from: 'laras', meta: 'Not sent', text: 'kak, someone knows where i eat lunch. and my room number. is that a thing people can just look up?' },
      { k: 'say', who: 'mc', text: 'Nobody broke in. They asked for her records by number, and nothing asked who was asking. Then it handed over far more than anyone needed.' },
    ],
  },
  'SC-002': {
    draft: 'my phone got 400 login codes last night. then my friends got messages from "me". i keep saying it wasn\'t me and it sounds like lying even to me',
    lines: [
      { k: 'chat', thread: 'Laras · draft', from: 'laras', meta: 'Not sent', text: 'my phone got 400 login codes last night. then my friends got messages from "me". i keep saying it wasn\'t me and it sounds like lying even to me' },
      { k: 'say', who: 'mc', text: 'Six digits and no limit on guesses. They walked into her account as her, and kept her phone screaming while they did it.' },
    ],
  },
  'SC-003': {
    draft: 'my wallet says i sent the money. there\'s no record that says i didn\'t. how do you prove you didn\'t do something',
    lines: [
      { k: 'chat', thread: 'Laras · draft', from: 'laras', meta: 'Not sent', text: 'my wallet says i sent the money. there\'s no record that says i didn\'t. how do you prove you didn\'t do something' },
      { k: 'say', who: 'mc', text: 'A number changed on its way in, and a log that kept no copy of what was sent. She couldn\'t prove it. I can.' },
    ],
  },
  'SC-004': {
    draft: 'i wrote to support again. closed in 40 seconds. it\'s like someone is standing inside the building holding the door shut',
    lines: [
      { k: 'chat', thread: 'Laras · draft', from: 'laras', meta: 'Not sent', text: 'i wrote to support again. closed in 40 seconds. it\'s like someone is standing inside the building holding the door shut' },
      { k: 'say', who: 'mc', text: 'Someone was. One edited word in a token, and the server never checked it. From a desk on this floor.' },
    ],
  },
  'SC-005': {
    draft: 'they posted my receipts. the clinic one. everyone saw. i can\'t tell you kak, they said you\'re next and i believe them now',
    lines: [
      { k: 'chat', thread: 'Laras · draft', from: 'laras', meta: 'Not sent', text: 'they posted my receipts. the clinic one. everyone saw. i can\'t tell you kak, they said you\'re next and i believe them now' },
      { k: 'say', who: 'mc', text: 'She was protecting me. The whole time, she was protecting me.' },
    ],
  },
}

// ─── Finale ──────────────────────────────────────────────────────────────

export const finaleIntro: Line[] = [
  { k: 'bg', bg: 'night', room: 'briefing', label: 'Briefing Room · 04:50', motif: 'dread' },
  { k: 'narr', text: 'The wall screen is on. Someone stands at the podium with their back to you, watching a progress bar that stopped moving an hour ago.' },
  { k: 'say', who: 'unknown', text: 'Five wardens. I spent three weeks building those. You should have stayed home and grieved like a normal person.' },
  { k: 'narr', text: 'You know the voice. But you want to say the name from the evidence, not from the voice.' },
  {
    k: 'choice', who: 'mc', prompt: 'Badge 0417 in the lab. Desk P-3. A script signed "rk". It was…', answer: 'raka',
    options: [
      { id: 'sari',  label: 'Sari',  reply: 'No. Sari is QA. Her badge doesn\'t open the Identity Lab, and one badge was in there that night.' },
      { id: 'dimas', label: 'Dimas', reply: 'No. Dimas was on leave in Lombok the week the tickets were closed, and it was done from a wired port on this floor.' },
      { id: 'raka',  label: 'Raka',  reply: '' },
    ],
  },
  { k: 'say', who: 'mc', text: 'Raka.' },
  { k: 'say', who: 'raka', text: 'Lead of the platform team. I taught you that codebase. Go on, then. You have nothing that ties any of it to me.' },
]

export interface Denial { text: string; answer: string; why: string }

export const NEMESIS = { name: 'Raka', color: '#8E97A6', tagline: 'Answer each denial with the proof that breaks it.', hit: 22 }

export const denials: Denial[] = [
  { answer: 'SC-002', text: '"I have never been in the Identity Lab at night. Pull whatever you like."',
    why: 'The lab door logged one badge at 01:52, while 31,408 codes hit her number from the bench inside. Badge 0417. His.' },
  { answer: 'SC-004', text: '"The test token? Three of us hold that. It could have been Dimas. It could have been you."',
    why: 'The admin requests came from the wired port at desk P-3. Dimas was in Lombok. P-3 has been Raka\'s desk for four years.' },
  { answer: 'SC-003', text: '"I never touched her money. Show me one rupiah that came to me."',
    why: 'Every reversed transfer landed in USR-7731, opened with a SIM bought on his staff discount code.' },
  { answer: 'SC-005', text: '"Receipts leak. It was a public bucket. Anyone on the internet could have scraped it."',
    why: 'Anyone could have. But the script on the USB stick opens with "# rk" and was built on laptop PV-0417, the one issued to him.' },
  { answer: 'SC-001', text: '"Even so. You can\'t show I chose her. It could have been any customer."',
    why: 'The first read of her records was at 23:12 on the night of the promotion. Hers was the first name searched, and it was searched 214 times.' },
]

export const finaleEnd: Line[] = [
  { k: 'bg', bg: 'night', room: 'briefing', label: 'Briefing Room · 05:12' },
  { k: 'narr', text: 'He looks at the five files on the wall for a long time.' },
  { k: 'say', who: 'raka', text: 'You got everything. The job, the bonus, the way they all look at you. I only wanted you to know what it feels like when it isn\'t fair.' },
  { k: 'say', who: 'mc', text: 'She was nineteen. She had never met you.' },
  { k: 'say', who: 'raka', text: 'It wasn\'t supposed to go that far. I can still wipe it. All of it. Nobody has to…' },
  { k: 'say', who: 'mc', text: 'It\'s already sent. Bu Ratna, legal, the police cyber unit. Five sealed files, each with a copy you can\'t reach. You can\'t delete what has been witnessed.' },
  { k: 'narr', text: 'The lift chimes down the hall. Building security, and behind them Bu Ratna, with her coat on over her pyjamas.' },
  { k: 'say', who: 'ratna', text: 'I read all five on the way here. Raka, hand me your badge. {name}… I am so sorry. We should have listened to her tickets.' },
  { k: 'bg', bg: 'dark' },
  { k: 'card', title: 'After', motif: 'resolve', sub: 'Raka was arrested that morning. PayVault closed all five gaps within a month, and named the audit programme after her.' },
  { k: 'chat', thread: 'Laras', from: 'mc', text: 'i found the manual. you were right, it has a name for every one of them', meta: 'Not delivered' },
  { k: 'chat', thread: 'Laras', from: 'mc', text: 'Spoofing. Tampering. Repudiation. Information disclosure. Denial of service. Elevation of privilege.', meta: 'Not delivered' },
  { k: 'chat', thread: 'Laras', from: 'mc', text: 'you weren\'t lying. i can prove it now. sunday dinner was nice', meta: 'Not delivered' },
  {
    k: 'card', title: 'Six kinds of harm. Each one has a name.', motif: 'grief',
    sub: 'Laras found the words on her own. You made sure someone listened.',
    small: 'If someone you know goes quiet, ask twice. If you are struggling yourself, please talk to someone you trust or a local crisis line.',
  },
]

export function fill(text: string, name: string) {
  return text.replace(/\{name\}/g, name)
}
