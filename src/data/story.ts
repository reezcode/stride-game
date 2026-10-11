// The story layer. The cases in ./index.ts describe *systems*; this file says
// what those systems were used for, who did it, and who it was done to.
//
// Every line is written in English and Indonesian side by side with tr().
// `{name}` in any text is replaced with the player's name.

import type { StrideCategory } from '@/stores/game'
import { tr } from '@/i18n'

export type CharId =
  | 'mc' | 'sari' | 'dimas' | 'raka' | 'ratna' | 'laras' | 'ayu' | 'pakjo'
  | 'ibu' | 'yati' | 'dewi' | 'min' | 'unknown' | 'warden'
export type Backdrop = 'day' | 'night' | 'dark' | 'art'
/** Drawn scenes, see game/illustrations.ts */
export type ArtId = 'party' | 'laptop' | 'alone' | 'funeral' | 'homeNight' | 'kost' | 'campus' | 'tower'
export type Motif = 'warm' | 'grief' | 'dread' | 'resolve'

export type Line =
  /** Changes the backdrop; does not wait for input. `room` is a world room id, `art` a drawn scene. */
  | { k: 'bg'; bg: Backdrop; room?: string; art?: ArtId; label?: string; motif?: Motif }
  | { k: 'card'; title: string; sub?: string; small?: string; motif?: Motif }
  | { k: 'narr'; text: string }
  | { k: 'say'; who: CharId; text: string; as?: string; color?: string }
  /** Phone message. Consecutive chat lines with the same thread stack up. `mine` puts it on the right. */
  | { k: 'chat'; from: CharId; text: string; thread: string; mine: boolean; meta?: string }
  /** `open`: any option is accepted and reported to the caller, which decides what a wrong one costs. */
  | { k: 'choice'; who: CharId; prompt: string; answer: string; open?: boolean; options: { id: string; label: string; reply: string }[] }
  | { k: 'proof'; title: string; text: string }

type Pair = [string, string]

// Short builders, so the script below reads as a script.
const N = (en: string, id: string): Line => ({ k: 'narr', text: tr(en, id) })
const S = (who: CharId, en: string, id: string): Line => ({ k: 'say', who, text: tr(en, id) })
const W = (name: string, color: string, en: string, id: string): Line => ({ k: 'say', who: 'warden', as: name, color, text: tr(en, id) })
const CARD = (en: string, id: string, sub?: Pair, extra: { motif?: Motif; small?: Pair } = {}): Line =>
  ({ k: 'card', title: tr(en, id), sub: sub && tr(...sub), small: extra.small && tr(...extra.small), motif: extra.motif })
const ART = (art: ArtId, label?: Pair, motif?: Motif): Line => ({ k: 'bg', bg: 'art', art, label: label && tr(...label), motif })
const DARK: Line = { k: 'bg', bg: 'dark' }
/** A message thread seen on someone's phone. */
function thread(en: string, id: string) {
  const title = tr(en, id)
  return {
    them: (from: CharId, e: string, i: string, meta?: Pair): Line => ({ k: 'chat', thread: title, from, mine: false, text: tr(e, i), meta: meta && tr(...meta) }),
    me:   (from: CharId, e: string, i: string, meta?: Pair): Line => ({ k: 'chat', thread: title, from, mine: true,  text: tr(e, i), meta: meta && tr(...meta) }),
  }
}

export const CAST: Record<CharId, { name: string }> = {
  mc:      { name: '{name}' },
  sari:    { name: 'Sari' },
  dimas:   { name: 'Dimas' },
  raka:    { name: 'Raka' },
  ratna:   { name: 'Bu Ratna' },
  laras:   { name: 'Laras' },
  ayu:     { name: 'Ayu' },
  pakjo:   { name: 'Pak Jo' },
  ibu:     { name: 'Ibu' },
  yati:    { name: 'Bu Yati' },
  dewi:    { name: 'Bu Dewi' },
  min:     { name: 'Pak Min' },
  unknown: { name: '???' },
  warden:  { name: 'Warden' },
}

// ─── Prologue ────────────────────────────────────────────────────────────

const yourPhone = thread('Laras', 'Laras')                       // your phone, talking to her
const herUnknown = thread('Unknown number', 'Nomor tak dikenal') // her phone
const herAyu = thread('Ayu', 'Ayu')                              // her phone

export const prologue: Line[] = [
  DARK,
  CARD('Before you start', 'Sebelum mulai',
    ['This story deals with online harassment and the suicide of a family member. Nothing is shown, but it is at the centre of the plot.',
     'Cerita ini membahas perundungan daring dan bunuh diri seorang anggota keluarga. Tidak ada yang diperlihatkan, tetapi itulah inti ceritanya.'],
    { small: ['If that is close to home today, it is fine to come back another time.', 'Kalau hari ini terasa terlalu dekat, tidak apa-apa kembali lain waktu.'] }),

  ART('party', ['PayVault HQ · 14th floor · Friday 16:40', 'Kantor PayVault · lantai 14 · Jumat 16.40'], 'warm'),
  N('Friday cake in the pantry. Somebody found candles.', 'Kue hari Jumat di pantry. Entah siapa yang menemukan lilin.'),
  S('ratna', "Fraud losses are down forty percent this quarter, and most of that is one person's work. {name}, from Monday you lead the platform team.",
             'Kerugian akibat fraud turun empat puluh persen kuartal ini, dan sebagian besar itu hasil kerja satu orang. {name}, mulai Senin kamu memimpin tim platform.'),
  S('sari', 'Told you! You owe me lunch. I applied for that job too, you know. I am only slightly furious.',
            'Sudah kubilang! Kamu utang traktir makan siang. Aku juga melamar posisi itu, tahu. Aku cuma sedikit kesal.'),
  S('dimas', "Lead already? Six years here and I still can't get a second monitor.",
             'Sudah jadi lead? Enam tahun di sini, aku minta monitor kedua saja belum dikasih.'),
  S('raka', 'Congratulations. Really. Nobody deserves it more.', 'Selamat. Sungguh. Tidak ada yang lebih pantas.'),
  S('mc', 'It was the team. I only wrote the ticket.', 'Itu kerja tim. Aku cuma menulis tiketnya.'),
  S('sari', "See, that's the annoying part. You even mean it.", 'Nah, itu yang menyebalkan. Kamu tulus pula.'),

  yourPhone.them('laras', 'kak!! did you get it??', 'kak!! dapet nggak??'),
  yourPhone.me('mc', 'got it. dinner sunday, my treat', 'dapet. minggu makan malam, aku yang traktir'),
  yourPhone.them('laras', 'PROUD OF YOU. also i finally installed your PayVault thing, you can stop nagging', 'BANGGA BANGET. btw aku akhirnya install PayVault-mu itu, udah ya jangan cerewet lagi'),
  yourPhone.me('mc', "welcome to the future. don't spend it all on boba", 'selamat datang di masa depan. jangan habis buat boba semua'),
  N('You put the phone away, smiling. Across the table, someone watches you do it.', 'Kamu menyimpan ponsel sambil tersenyum. Di seberang meja, seseorang memperhatikanmu.'),

  DARK,
  CARD('That night', 'Malam itu', undefined, { motif: 'dread' }),
  ART('laptop', ['That night', 'Malam itu']),
  N("One of the people who clapped for you goes home, opens a laptop, and types your sister's phone number into a search box.",
    'Salah satu orang yang tadi bertepuk tangan untukmu pulang, membuka laptop, dan mengetik nomor ponsel adikmu di kolom pencarian.'),
  S('unknown', "Always the good one. Let's see how good you are when it isn't you it happens to.",
               'Selalu jadi si anak baik. Coba kita lihat sebaik apa kamu kalau yang kena bukan dirimu.'),
  N("They can't touch you. Your record is spotless. But the systems you all built together have gaps, and they know every one.",
    'Dia tidak bisa menyentuhmu. Catatanmu bersih. Tapi sistem yang kalian bangun bersama punya celah, dan dia hafal semuanya.'),

  DARK,
  CARD('Week one', 'Minggu pertama'),
  ART('alone', ['Kost Melati · room 7', 'Kost Melati · kamar 7']),
  herUnknown.them('unknown', 'Mie ayam at Pak Jo, 12:41. Kost Melati, room 7. I can see where your money goes, Laras.', 'Mie ayam Pak Jo, 12.41. Kost Melati, kamar 7. Aku bisa lihat ke mana uangmu pergi, Laras.'),
  herUnknown.me('laras', 'who is this', 'ini siapa'),
  herUnknown.them('unknown', 'Tell your brother and it gets worse.', 'Bilang ke kakakmu, dan semuanya makin parah.'),
  N('Her phone lights up with a login code she never asked for. Then another. Then four hundred more, all night.',
    'Ponselnya menyala: kode login yang tidak pernah dia minta. Lalu satu lagi. Lalu empat ratus lagi, sepanjang malam.'),

  CARD('Week two', 'Minggu kedua'),
  N("Messages go out from her account to her friends, asking for money. Her wallet empties in transfers she cannot prove she didn't make.",
    'Pesan terkirim dari akunnya ke teman-temannya, meminta uang. Dompetnya terkuras lewat transfer yang tidak bisa dia buktikan bukan ulahnya.'),
  herAyu.them('ayu', "Laras you said you'd pay me back yesterday??", 'Laras katanya kemarin mau balikin??'),
  herAyu.me('laras', "that wasn't me. i swear it wasn't me", 'itu bukan aku. sumpah bukan aku'),
  herAyu.them('ayu', "it's your account.", 'itu akunmu.'),
  yourPhone.me('mc', "you ok? you've been quiet", 'kamu baik? kok diem aja'),
  yourPhone.them('laras', "just exams. don't worry about me kak", 'lagi ujian aja. jangan khawatirin aku kak'),

  CARD('Week three', 'Minggu ketiga'),
  N('Her receipts appear in the campus group chat. The pharmacy. The counselling clinic. Someone adds a laughing emoji. Then everyone does.',
    'Struk-struknya muncul di grup kampus. Apotek. Klinik konseling. Seseorang menambahkan emoji tertawa. Lalu semua orang ikut.'),
  N('She writes to PayVault support four times. Each ticket is closed within a minute, by an admin account that belongs to no admin.',
    'Dia menulis ke layanan PayVault empat kali. Setiap tiket ditutup dalam semenit, oleh akun admin yang bukan milik admin mana pun.'),
  yourPhone.them('laras', 'kak are you awake', 'kak udah tidur?', ['02:07', '02.07']),
  yourPhone.them('laras', 'never mind. sleep well. sunday dinner was nice', 'gapapa. met tidur. makan malam minggu kemarin enak', ['02:19', '02.19']),
  N('You see it at seven, on the train. You call. It rings out.', 'Kamu baru membacanya pukul tujuh, di kereta. Kamu menelepon. Tidak diangkat.'),

  DARK,
  CARD('Laras took her own life on a Tuesday.', 'Laras mengakhiri hidupnya pada hari Selasa.',
    ['She was nineteen. She did not leave a note.', 'Usianya sembilan belas. Dia tidak meninggalkan pesan.'], { motif: 'grief' }),
  ART('funeral'),
  N('The funeral is small. Sari holds your arm. Dimas brings food nobody eats. Raka shakes your hand with both of his.',
    'Pemakamannya sederhana. Sari memegang lenganmu. Dimas membawa makanan yang tak disentuh siapa pun. Raka menjabat tanganmu dengan kedua tangannya.'),
  N('Everyone says the same thing: nobody saw it coming.', 'Semua mengucapkan hal yang sama: tidak ada yang menyangka.'),

  DARK,
  CARD('Eleven days later', 'Sebelas hari kemudian', ['01:31', '01.31']),
  ART('homeNight', ['Home · 01:31', 'Rumah · 01.31']),
  N("You can't sleep. Her phone is in her old room down the hall, wiped clean the afternoon before she died. But one message was scheduled, and tonight it sends.",
    'Kamu tidak bisa tidur. Ponselnya ada di kamar lamanya di ujung lorong, sudah dikosongkan pada sore sebelum dia meninggal. Tapi ada satu pesan terjadwal, dan malam ini pesan itu terkirim.'),
  yourPhone.them('laras', "kak. if you're reading this i couldn't tell you. they said it would get worse if i did, and it got worse anyway",
    'kak. kalau kakak baca ini berarti aku nggak sanggup cerita. katanya kalau aku cerita bakal makin parah, dan ternyata tetap makin parah', ['Scheduled', 'Terjadwal']),
  yourPhone.them('laras', 'i wrote everything down. not at home. my phone knows where', 'semuanya aku catat. bukan di rumah. hp-ku tahu di mana'),
  yourPhone.them('laras', "i'm sorry. don't be angry at yourself. you're the good one, remember", 'maaf ya. jangan marah sama diri sendiri. kakak kan si anak baik, inget'),
  S('mc', 'Wrote what down? Laras… what happened to you?', 'Mencatat apa? Laras… apa yang terjadi padamu?'),
]

// ─── Places ──────────────────────────────────────────────────────────────

export type PlaceId = 'home' | 'kost' | 'campus' | 'hq'

/** Pins on the city map, in story order. x/y are in the map's 1000×620 drawing space. */
export const places: { id: PlaceId; name: string; blurb: string; x: number; y: number }[] = [
  { id: 'home',   name: tr('Home', 'Rumah'), blurb: tr('Where she grew up. Her old room is down the hall.', 'Tempat dia dibesarkan. Kamar lamanya di ujung lorong.'), x: 170, y: 440 },
  { id: 'kost',   name: 'Kost Melati',       blurb: tr('Her boarding house. Room 7.', 'Kos-kosannya. Kamar 7.'), x: 420, y: 230 },
  { id: 'campus', name: tr('Campus', 'Kampus'), blurb: tr('Faculty building. Bu Dewi has the missing pages.', 'Gedung fakultas. Bu Dewi menyimpan halaman yang hilang.'), x: 640, y: 120 },
  { id: 'hq',     name: tr('PayVault HQ', 'Kantor PayVault'), blurb: tr('Your office. 14th floor.', 'Kantormu. Lantai 14.'), x: 830, y: 410 },
]

/** Played the first time you arrive somewhere. */
export const arrivals: Partial<Record<PlaceId, Line[]>> = {
  kost: [
    DARK, CARD('Chapter two', 'Bab dua', ['Kost Melati', 'Kost Melati'], { motif: 'grief' }),
    ART('kost', ['Kost Melati · 02:05', 'Kost Melati · 02.05']),
    N("A row of rented rooms around a courtyard. Room 7's light is off. Someone has left flowers at the door, and they have already dried.",
      'Deretan kamar sewa mengelilingi halaman. Lampu kamar 7 padam. Seseorang meninggalkan bunga di depan pintunya, dan bunga itu sudah kering.'),
    N("Across the yard Pak Jo's warung is still open. It always is. Next door, in room 8, a lamp is on.",
      'Di seberang halaman, warung Pak Jo masih buka. Selalu begitu. Di kamar 8, sebelahnya, lampu masih menyala.'),
  ],
  campus: [
    DARK, CARD('Chapter three', 'Bab tiga', ['The campus', 'Kampus'], { motif: 'dread' }),
    ART('campus', ['Faculty of Economics · 02:40', 'Fakultas Ekonomi · 02.40']),
    N('The gate is chained, but Pak Min knows your face from the funeral and lets you through without a word.',
      'Gerbangnya dirantai, tapi Pak Min mengenali wajahmu dari pemakaman dan membiarkanmu masuk tanpa sepatah kata.'),
    N('One window is lit on the ground floor. Bu Dewi said she would wait. She did not sound like someone who had been sleeping either.',
      'Satu jendela di lantai dasar masih terang. Bu Dewi bilang akan menunggu. Suaranya juga tidak terdengar seperti orang yang habis tidur.'),
  ],
  hq: [
    DARK, CARD('Chapter four', 'Bab empat', ['PayVault HQ', 'Kantor PayVault'], { motif: 'dread' }),
    ART('tower', ['PayVault HQ · 03:10', 'Kantor PayVault · 03.10']),
    N('Forty floors of dark glass, and one floor pulsing red.', 'Empat puluh lantai kaca gelap, dan satu lantai berdenyut merah.'),
    N('Five rooms are dark and the intrusion alarm is going. Someone is inside the systems right now, erasing three weeks of logs, and they have left things behind to guard the work.',
      'Lima ruangan gelap dan alarm penyusupan berbunyi. Seseorang sedang berada di dalam sistem saat ini, menghapus log tiga minggu terakhir, dan dia meninggalkan penjaga untuk mengawal pekerjaannya.'),
    S('mc', 'Whoever you are. I am going to find every single thing you did to her.', 'Siapa pun kamu. Akan kutemukan setiap hal yang kamu lakukan padanya.'),
  ],
}

const reminders = thread('Reminders', 'Pengingat')

/** Things to examine outside the office. Keys match interactable ids in game/world.ts. */
export const clues: Record<string, { place: PlaceId; unlocks?: PlaceId; lines: Line[] }> = {
  'h-laptop': { place: 'home', lines: [
    N('The VPN client is blinking. PayVault on-call: an intrusion alarm on the 14th floor, five rooms, nobody answering the page.',
      'Klien VPN berkedip. Piket PayVault: alarm penyusupan di lantai 14, lima ruangan, tidak ada yang menjawab panggilan.'),
    S('mc', 'Not tonight. Somebody else can take it.', 'Jangan malam ini. Biar orang lain yang urus.'),
  ] },
  'h-photo': { place: 'home', lines: [
    N("Sunday dinner, three weeks ago. She is laughing at something you said. You can't remember what it was.",
      'Makan malam hari Minggu, tiga minggu lalu. Dia tertawa mendengar ucapanmu. Kamu tidak ingat apa yang kamu katakan.'),
  ] },
  'h-phone': { place: 'home', unlocks: 'kost', lines: [
    N('Factory reset, the afternoon before. Messages, photos, apps, all gone. But reminders sync from the SIM, and one is left.',
      'Direset ke setelan pabrik, sore sebelumnya. Pesan, foto, aplikasi, semua hilang. Tapi pengingat tersinkron dari kartu SIM, dan masih tersisa satu.'),
    reminders.me('laras', 'kost melati, room 7. under the desk drawer. before bu yati clears the room', 'kost melati, kamar 7. di bawah laci meja. sebelum bu yati beresin kamar', ['No date', 'Tanpa tanggal']),
    S('mc', 'Her boarding house. Twenty minutes on the bike.', 'Kos-kosannya. Dua puluh menit naik motor.'),
  ] },
  'h-statement': { place: 'home', lines: [
    N('A wallet statement she printed herself. Nine transfers out in two days, each marked "sent by account holder".',
      'Mutasi dompet yang dia cetak sendiri. Sembilan transfer keluar dalam dua hari, semuanya bertanda "dikirim oleh pemilik akun".'),
    N('In the margin, in her handwriting, pressed hard enough to tear the paper: NOT ME. NOT ME. NOT ME.',
      'Di pinggir kertas, dengan tulisan tangannya, ditekan sampai kertasnya sobek: BUKAN AKU. BUKAN AKU. BUKAN AKU.'),
  ] },
  'h-letter': { place: 'home', lines: [
    N('From the faculty, dated week two. "Complaints have been received that you solicited money from fellow students by message. Attend a hearing on the 21st. Dr. Dewi Anggraini."',
      'Dari fakultas, bertanggal minggu kedua. "Kami menerima pengaduan bahwa Saudari meminta uang kepada sesama mahasiswa melalui pesan. Harap hadir pada sidang tanggal 21. Dr. Dewi Anggraini."'),
    S('mc', "She never asked anyone for money in her life. She wouldn't even let me pay for her books.",
            'Seumur hidup dia tidak pernah minta uang ke siapa pun. Bukunya saja tidak mau kubayari.'),
  ] },
  'h-fridge': { place: 'home', lines: [
    N('"kak, leftover rendang, don\'t finish it ALL. L." The container is still behind it. Nobody has been able to move either one.',
      '"kak, sisa rendang, jangan dihabisin SEMUA. L." Wadahnya masih ada di belakang kertas itu. Belum ada yang sanggup memindahkan keduanya.'),
  ] },
  'k-tickets': { place: 'kost', lines: [
    N('Four support tickets to PayVault, printed and stapled. "Someone is inside my account." "Please, I need a human." Each one stamped CLOSED, RESOLVED BY ADMIN, inside a minute.',
      'Empat tiket bantuan ke PayVault, dicetak dan distaples. "Ada orang lain di dalam akun saya." "Tolong, saya butuh bicara dengan manusia." Semuanya dicap DITUTUP, DISELESAIKAN OLEH ADMIN, dalam waktu kurang dari semenit.'),
    S('mc', 'Nobody on our support team closes a ticket in forty seconds.', 'Tidak ada orang di tim support kami yang menutup tiket dalam empat puluh detik.'),
  ] },
  'k-notebook': { place: 'kost', unlocks: 'campus', lines: [
    N('Taped under the drawer: a school exercise book. Dates, times, screenshots glued in. She documented everything, the way you once taught her to do for bugs.',
      'Ditempel di bawah laci: sebuah buku tulis. Tanggal, jam, tangkapan layar yang dilem. Dia mendokumentasikan semuanya, persis seperti yang dulu kamu ajarkan untuk mencatat bug.'),
    N('The last pages have been cut out with a ruler. On the inside cover: "gave the last pages to bu dewi before the hearing. she is the only one who listened."',
      'Halaman-halaman terakhir dipotong rapi dengan penggaris. Di sampul dalam: "halaman terakhir aku titip ke bu dewi sebelum sidang. cuma beliau yang mau dengar."'),
    S('mc', 'Dr. Dewi Anggraini. The name on the letter from the faculty.', 'Dr. Dewi Anggraini. Nama yang ada di surat dari fakultas.'),
    N('You call the faculty number, expecting voicemail. She picks up on the second ring.', 'Kamu menelepon nomor fakultas, mengira akan masuk kotak suara. Dia mengangkat pada dering kedua.'),
  ] },
  'c-board': { place: 'campus', lines: [
    N('Behind the glass: exam timetables, a futsal poster, and a pale rectangle where something was pinned for one morning and then torn down.',
      'Di balik kaca: jadwal ujian, poster futsal, dan satu kotak pucat bekas sesuatu yang ditempel selama satu pagi lalu dicabut.'),
    N('A corner is still stuck under the pin. You can read part of a receipt number, and the word KLINIK.', 'Satu sudutnya masih terjepit paku. Kamu bisa membaca sebagian nomor struk, dan kata KLINIK.'),
  ] },
  'c-file': { place: 'campus', lines: [
    N('The complaint file. Fourteen students, fourteen screenshots, the same message asking for money. Every one of them was sent at 02:03.',
      'Berkas pengaduan. Empat belas mahasiswa, empat belas tangkapan layar, pesan yang sama meminta uang. Semuanya terkirim pukul 02.03.'),
    S('mc', 'Fourteen messages in the same minute. Nobody types that fast. Nobody checked.', 'Empat belas pesan dalam menit yang sama. Tidak ada orang mengetik secepat itu. Dan tidak ada yang memeriksa.'),
  ] },
}

export const talks: Record<string, { place: PlaceId; unlocks?: PlaceId; lines: Line[] }> = {
  'npc-ibu': { place: 'home', lines: [
    S('ibu', "You're up too. I keep thinking I hear her door.", 'Kamu juga belum tidur. Ibu terus merasa mendengar pintu kamarnya.'),
    S('ibu', 'She stopped coming home on Sundays. I thought it was a boy, or exams. I made her favourite anyway and put it in the freezer.',
             'Dia berhenti pulang tiap Minggu. Ibu kira karena pacar, atau ujian. Ibu tetap masak kesukaannya dan menyimpannya di freezer.'),
    S('ibu', 'She asked me once whether people at your work could see what she buys. I laughed. I told her to ask you.',
             'Dia pernah bertanya, apa orang di kantormu bisa melihat apa saja yang dia beli. Ibu tertawa. Ibu suruh dia tanya kamu.'),
    S('mc', 'She never asked me.', 'Dia tidak pernah bertanya padaku.'),
    S('ibu', "No. She would have been protecting you from something. That is who she was. Go and find out what, nak. I can't.",
             'Tidak. Pasti dia sedang melindungimu dari sesuatu. Begitulah dia. Pergilah cari tahu, nak. Ibu tidak sanggup.'),
  ] },
  'npc-ayu': { place: 'kost', lines: [
    S('ayu', "You're her brother. I'm… I was next door. Ayu.", 'Kakaknya Laras, ya. Aku… dulu tetangga kamarnya. Ayu.'),
    S('ayu', 'She messaged me asking to borrow money. Then she said it wasn\'t her. I told her, "it\'s your account." That is the last real thing I said to her.',
             'Dia kirim pesan mau pinjam uang. Lalu dia bilang itu bukan dia. Aku jawab, "itu akunmu." Itu kalimat terakhir yang sungguh-sungguh kuucapkan padanya.'),
    S('ayu', "When her receipts went round the group, I didn't post them. But I laughed. Everybody laughed.", 'Waktu struk-struknya menyebar di grup, bukan aku yang kirim. Tapi aku ikut tertawa. Semua tertawa.'),
    S('mc', 'Did she ever say who was doing it?', 'Dia pernah bilang siapa pelakunya?'),
    S('ayu', 'She said someone could see her. Where she ate, what she bought, like a window into her room. She stopped paying with the app. She said the app was the window.',
             'Katanya ada yang bisa melihatnya. Makan di mana, beli apa, seperti ada jendela ke kamarnya. Dia berhenti bayar pakai aplikasi. Katanya aplikasi itulah jendelanya.'),
  ] },
  'npc-pakjo': { place: 'kost', lines: [
    S('pakjo', 'Mie ayam, every day, twelve-forty. Always scanned the code to pay. PayVault, the blue one.', 'Mie ayam, tiap hari, jam dua belas empat puluh. Selalu bayar pakai scan. PayVault, yang biru itu.'),
    S('pakjo', 'Then one day she pays in coins, counting them out with her hands shaking. Said her wallet was empty and nobody believed her.',
               'Lalu suatu hari dia bayar pakai uang receh, menghitungnya dengan tangan gemetar. Katanya dompetnya kosong dan tidak ada yang percaya.'),
    S('pakjo', 'I told her, eat first, pay whenever. She cried into the bowl. I should have asked her more. Sit, eat something. You look like her when you frown.',
               'Bapak bilang, makan dulu, bayar kapan-kapan. Dia menangis di depan mangkuknya. Harusnya Bapak tanya lebih banyak. Duduk, makan dulu. Kamu mirip dia kalau sedang mengernyit.'),
  ] },
  'npc-yati': { place: 'kost', lines: [
    S('yati', "I haven't cleared her room. I know I said the end of the month. I can't make myself open the door.", 'Kamarnya belum Ibu bereskan. Ibu memang bilang akhir bulan. Tapi Ibu belum sanggup membuka pintunya.'),
    S('yati', 'Two police officers came. They were here ten minutes. They said the bank records show she sent the money herself, so there is nothing to investigate.',
              'Dua polisi datang. Cuma sepuluh menit di sini. Katanya catatan banknya menunjukkan dia sendiri yang mengirim uang itu, jadi tidak ada yang perlu diselidiki.'),
    S('mc', 'The records say that because nobody kept the real ones.', 'Catatannya bilang begitu karena tidak ada yang menyimpan catatan aslinya.'),
    S('yati', "Then find the real ones, nak. A girl who irons her friends' uniforms does not steal from them.", 'Kalau begitu carilah yang asli, nak. Anak yang mau menyetrika seragam teman-temannya tidak akan mencuri dari mereka.'),
  ] },
  'npc-min': { place: 'campus', lines: [
    S('min', 'The screenshots were on that board for one morning. I took them down myself. By then the whole faculty had photographed them.',
             'Tangkapan layar itu sempat menempel di papan itu satu pagi. Saya sendiri yang mencabutnya. Tapi waktu itu satu fakultas sudah memotretnya.'),
    S('min', 'Nobody saw who pinned them up. The camera over this corridor was "under maintenance" that night. It has never been under maintenance before or since.',
             'Tidak ada yang lihat siapa yang menempel. Kamera di lorong ini "sedang perawatan" malam itu. Sebelum dan sesudahnya, kamera itu tidak pernah perawatan.'),
    S('mc', 'Somebody switched it off first.', 'Ada yang mematikannya lebih dulu.'),
  ] },
  'npc-dewi': { place: 'campus', unlocks: 'hq', lines: [
    S('dewi', 'I chaired her hearing. Fourteen complaints, all with screenshots. I was ready to suspend her.', 'Saya yang memimpin sidangnya. Empat belas pengaduan, semua dengan tangkapan layar. Saya sudah siap menskorsnya.'),
    S('dewi', 'Then she put a notebook on my desk and said, "Bu, every message was sent in the same minute, while I was asleep, from a phone I don\'t own." I adjourned. I meant to follow it up.',
              'Lalu dia menaruh sebuah buku tulis di meja saya dan berkata, "Bu, semua pesan itu terkirim pada menit yang sama, waktu saya tidur, dari ponsel yang bukan milik saya." Sidang saya tunda. Saya berniat menindaklanjutinya.'),
    S('dewi', 'She left these pages with me. I did not understand them. I think you will.', 'Dia menitipkan halaman-halaman ini pada saya. Saya tidak mengerti isinya. Saya rasa kamu akan mengerti.'),
    N('Six words copied out in careful capitals, each one ticked: SPOOFING. TAMPERING. REPUDIATION. INFORMATION DISCLOSURE. DENIAL OF SERVICE. ELEVATION OF PRIVILEGE.',
      'Enam kata disalin dengan huruf kapital yang rapi, masing-masing dicentang: SPOOFING. TAMPERING. REPUDIATION. INFORMATION DISCLOSURE. DENIAL OF SERVICE. ELEVATION OF PRIVILEGE.'),
    N('Underneath: "from the security manual at kak\'s office. it has a name for each thing they did to me. everything they know comes out of PAYVAULT. it is someone INSIDE."',
      'Di bawahnya: "dari buku panduan keamanan di kantor kakak. ada nama untuk setiap hal yang mereka lakukan ke aku. semua yang mereka tahu asalnya dari PAYVAULT. pelakunya ORANG DALAM."'),
    S('mc', 'My office. The systems I work on.', 'Kantorku. Sistem yang kukerjakan sendiri.'),
    N('Your phone buzzes again. The on-call page you ignored: intrusion alarm, 14th floor, five rooms. Someone is in there tonight.',
      'Ponselmu bergetar lagi. Panggilan piket yang tadi kamu abaikan: alarm penyusupan, lantai 14, lima ruangan. Ada orang di sana malam ini.'),
  ] },
}

// ─── Puzzles ─────────────────────────────────────────────────────────────

export interface PuzzleItem {
  text: string
  sub?: string
  other?: string        // second column, for side-by-side comparisons
  pick?: boolean        // pick mode: should this be marked?
  why?: string          // shown once solved
}

export interface Puzzle {
  id: string            // interactable id in game/world.ts
  place: PlaceId
  letter: StrideCategory
  title: string
  brief: string
  know: string[]        // what you already know, i.e. the rules to reason from
  mode: 'pick' | 'order'
  layout: 'messages' | 'compare' | 'fields' | 'list'
  columns?: [string, string]
  mark: string          // label for a picked item, e.g. "Not her"
  items: PuzzleItem[]   // order mode: listed in the correct order
  lesson: string        // closes the puzzle, and names the idea
}

const I = (pick: boolean, en: string, id: string, why: Pair, sub?: Pair, other?: Pair): PuzzleItem =>
  ({ pick, text: tr(en, id), why: tr(...why), sub: sub && tr(...sub), other: other && tr(...other) })

export const puzzles: Puzzle[] = [
  {
    id: 'p-spoof', place: 'home', letter: 'S', mode: 'pick', layout: 'messages',
    title: tr('Was it her?', 'Benarkah itu dia?'),
    brief: tr('The family tablet still has three weeks of messages from Laras. You answered every one of them. Mark the ones she never wrote.',
              'Tablet keluarga masih menyimpan pesan Laras selama tiga minggu. Semuanya kamu balas. Tandai pesan yang tidak pernah dia tulis.'),
    know: [
      tr('She never used capital letters.', 'Dia tidak pernah memakai huruf kapital.'),
      tr('She called you "kak", always.', 'Dia selalu memanggilmu "kak".'),
      tr('She never asked anyone for money, or for a code.', 'Dia tidak pernah meminta uang, atau kode, kepada siapa pun.'),
    ],
    mark: tr('Not her', 'Bukan dia'),
    items: [
      I(false, 'kak, have you eaten?', 'kak, udah makan?', ['Lowercase, "kak", and asking after you. Her.', 'Huruf kecil, "kak", dan menanyakan kabarmu. Itu dia.'], ['Week 1 · 19:02', 'Minggu 1 · 19.02']),
      I(true, 'Bro, lend me 500k for a bit. Send it to this number.', 'Bro, pinjam 500rb dulu ya. Transfer ke nomor ini.', ['"Bro", capitals, and asking for money at two in the morning.', '"Bro", huruf kapital, dan minta uang jam dua pagi.'], ['Week 2 · 02:03', 'Minggu 2 · 02.03']),
      I(true, 'Please do not contact me for now. I am busy.', 'Tolong jangan hubungi saya dulu. Saya sedang sibuk.', ['Formal, capitalised, and meant to keep you away.', 'Formal, berhuruf kapital, dan dimaksudkan untuk menjauhkanmu.'], ['Week 2 · 02:04', 'Minggu 2 · 02.04']),
      I(false, "just exams. don't worry about me kak", 'lagi ujian aja. jangan khawatirin aku kak', ['Her, hiding it from you.', 'Itu dia, sedang menyembunyikannya darimu.'], ['Week 2 · 21:40', 'Minggu 2 · 21.40']),
      I(true, 'Hi! New number, save this one. Send me the code you just received.', 'Hai! Nomor baru, simpan ya. Kirim kode yang barusan kamu terima.', ['A "new number" asking for a login code is the oldest trick there is.', '"Nomor baru" yang minta kode login adalah trik paling tua.'], ['Week 3 · 01:55', 'Minggu 3 · 01.55']),
      I(false, 'sunday dinner was nice', 'makan malam minggu kemarin enak', ['Her. The last one.', 'Itu dia. Pesan terakhirnya.'], ['Week 3 · 02:19', 'Minggu 3 · 02.19']),
    ],
    lesson: tr('Three of the messages you answered were never her. Someone was wearing her name, and nothing in the app could tell the difference. That is spoofing: pretending to be someone you are not.',
               'Tiga pesan yang kamu balas ternyata bukan darinya. Seseorang memakai namanya, dan aplikasi tidak bisa membedakannya. Itulah spoofing: berpura-pura menjadi orang lain.'),
  },
  {
    id: 'p-tamper', place: 'kost', letter: 'T', mode: 'pick', layout: 'compare',
    title: tr('Two ledgers', 'Dua catatan'),
    brief: tr('Laras kept her own spending book by hand. Next to it is what PayVault says happened. Mark every line where the two no longer agree.',
              'Laras mencatat pengeluarannya sendiri dengan tangan. Di sebelahnya ada versi PayVault. Tandai setiap baris yang tidak lagi cocok.'),
    know: [
      tr('Her book was written on the day, in pen.', 'Bukunya ditulis pada hari yang sama, dengan pulpen.'),
      tr('A changed sign, name or amount is still a change.', 'Tanda, nama, atau jumlah yang berubah tetaplah perubahan.'),
    ],
    columns: [tr('Her book', 'Buku Laras'), tr('PayVault statement', 'Mutasi PayVault')],
    mark: tr('Altered', 'Diubah'),
    items: [
      I(false, 'Mie ayam, Pak Jo · 15,000', 'Mie ayam, Pak Jo · 15.000', ['Matches.', 'Cocok.'], undefined, ['WARUNG PAK JO · 15,000', 'WARUNG PAK JO · 15.000']),
      I(false, 'Top-up from kak · +200,000', 'Top-up dari kakak · +200.000', ['Matches.', 'Cocok.'], undefined, ['TOP-UP · +200,000', 'TOP-UP · +200.000']),
      I(true, 'Photocopies · 8,000', 'Fotokopi · 8.000', ['A different recipient and a hundred times the amount.', 'Penerima berbeda dan jumlahnya seratus kali lipat.'], undefined, ['TRANSFER OUT USR-7731 · 800,000', 'TRANSFER KELUAR USR-7731 · 800.000']),
      I(false, 'Pharmacy · 62,000', 'Apotek · 62.000', ['Matches.', 'Cocok.'], undefined, ['APOTEK SEHAT · 62,000', 'APOTEK SEHAT · 62.000']),
      I(true, 'Refund, bookshop · +45,000', 'Refund toko buku · +45.000', ['The sign was flipped. Money in became money out.', 'Tandanya dibalik. Uang masuk menjadi uang keluar.'], undefined, ['TRANSFER OUT · −45,000', 'TRANSFER KELUAR · −45.000']),
      I(true, '(nothing written)', '(tidak ada catatan)', ['A transfer she has no record of making.', 'Transfer yang tidak pernah dia catat.'], undefined, ['TRANSFER OUT USR-7731 · 1,250,000 · sent by account holder', 'TRANSFER KELUAR USR-7731 · 1.250.000 · dikirim oleh pemilik akun']),
    ],
    lesson: tr('The numbers were changed after the fact, and the system accepted them without checking. That is tampering: altering data or behaviour that should not change.',
               'Angka-angkanya diubah belakangan, dan sistem menerimanya tanpa memeriksa. Itulah tampering: mengubah data atau perilaku yang seharusnya tidak berubah.'),
  },
  {
    id: 'p-trace', place: 'kost', letter: 'R', mode: 'order', layout: 'list',
    title: tr('The night of the codes', 'Malam penuh kode'),
    brief: tr('A shoebox of sticky notes, one for every thing that happened that night, out of order. PayVault kept no record of it, so rebuild one. Tap the notes in the order they happened.',
              'Sekotak kertas tempel, satu untuk setiap kejadian malam itu, tidak berurutan. PayVault tidak menyimpan catatannya, jadi susun ulang. Ketuk kertas sesuai urutan kejadiannya.'),
    know: [
      tr('A code has to be guessed before anyone can log in.', 'Kode harus tertebak dulu sebelum seseorang bisa masuk.'),
      tr('Whoever is inside locks the owner out before doing anything loud.', 'Siapa pun yang sudah masuk akan mengunci pemiliknya dulu sebelum berbuat sesuatu yang mencolok.'),
    ],
    mark: '',
    items: [
      I(false, 'Login codes start arriving. She asked for none of them.', 'Kode login mulai berdatangan. Tidak satu pun dia minta.', ['01:52', '01.52']),
      I(false, 'Code number 412 is accepted.', 'Kode ke-412 diterima.', ['01:56', '01.56']),
      I(false, '"New device signed in to your account."', '"Perangkat baru masuk ke akun Anda."', ['01:57', '01.57']),
      I(false, 'Her password is changed. Her own phone is signed out.', 'Kata sandinya diganti. Ponselnya sendiri dikeluarkan dari akun.', ['01:59', '01.59']),
      I(false, 'Fourteen friends get the same message asking for money.', 'Empat belas teman menerima pesan yang sama, meminta uang.', ['02:03', '02.03']),
      I(false, 'The wallet is emptied.', 'Dompetnya dikuras.', ['02:10', '02.10']),
    ],
    lesson: tr('With no trustworthy log, it was her word against a machine, and the machine won. That gap has a name: repudiation. The cure is a record nobody can alter or erase.',
               'Tanpa log yang bisa dipercaya, yang ada hanya ucapannya melawan mesin, dan mesin yang menang. Celah itu punya nama: repudiation. Obatnya adalah catatan yang tidak bisa diubah atau dihapus siapa pun.'),
  },
  {
    id: 'p-leak', place: 'campus', letter: 'I', mode: 'pick', layout: 'fields',
    title: tr('What the receipt gave away', 'Yang dibocorkan struk itu'),
    brief: tr('This is the receipt page that was posted in the group. Anyone with the link could open it. Mark every field a stranger never needed to see.',
              'Inilah halaman struk yang disebar di grup. Siapa pun yang punya tautannya bisa membukanya. Tandai setiap kolom yang tidak perlu dilihat orang asing.'),
    know: [
      tr('A receipt has to prove a payment happened. Nothing more.', 'Struk hanya perlu membuktikan bahwa pembayaran terjadi. Tidak lebih.'),
      tr('Anything that points to a person is worth hiding.', 'Apa pun yang menunjuk ke seseorang layak disembunyikan.'),
    ],
    mark: tr('Hide', 'Sembunyikan'),
    items: [
      I(false, 'Receipt no.', 'No. struk', ['Needed to look the payment up.', 'Diperlukan untuk mencari pembayarannya.'], ['TXN-90417', 'TXN-90417']),
      I(true, 'Full name', 'Nama lengkap', ['Names the person.', 'Menyebut nama orangnya.'], ['Laras Wulandari', 'Laras Wulandari']),
      I(true, 'National ID (NIK)', 'NIK', ['Never belongs on a receipt.', 'Tidak pernah pantas ada di struk.'], ['3271••••••••0002', '3271••••••••0002']),
      I(false, 'Amount', 'Jumlah', ['The point of a receipt.', 'Inti dari sebuah struk.'], ['Rp 150.000', 'Rp 150.000']),
      I(true, 'Phone number', 'Nomor ponsel', ['How the harasser reached her.', 'Lewat inilah pelaku menghubunginya.'], ['0812 •••• ••41', '0812 •••• ••41']),
      I(false, 'Date', 'Tanggal', ['Needed.', 'Diperlukan.'], ['16 Mar', '16 Mar']),
      I(false, 'Status', 'Status', ['Needed.', 'Diperlukan.'], ['PAID', 'LUNAS']),
      I(true, 'Home address', 'Alamat', ['Told them where she slept.', 'Memberi tahu di mana dia tidur.'], ['Kost Melati, room 7', 'Kost Melati, kamar 7']),
    ],
    lesson: tr('The page showed far more than a receipt needs, to anyone who asked. That is information disclosure: data reaching people who should never see it.',
               'Halaman itu menampilkan jauh lebih banyak daripada yang dibutuhkan sebuah struk, kepada siapa pun yang membukanya. Itulah information disclosure: data sampai ke orang yang tidak berhak melihatnya.'),
  },
  {
    id: 'p-priv', place: 'campus', letter: 'E', mode: 'pick', layout: 'list',
    title: tr('Who closed her tickets?', 'Siapa yang menutup tiketnya?'),
    brief: tr("In the complaint file is the activity trail Laras printed from her four support tickets. Mark every action the account's role should never have allowed.",
              'Di dalam berkas pengaduan ada jejak aktivitas yang dicetak Laras dari keempat tiket bantuannya. Tandai setiap tindakan yang seharusnya tidak boleh dilakukan oleh peran akun tersebut.'),
    know: [
      tr('Customers can open and read their own tickets.', 'Pelanggan boleh membuat dan membaca tiketnya sendiri.'),
      tr('Support agents can reply. Only admins can close, freeze or export.', 'Agen support boleh membalas. Hanya admin yang boleh menutup, membekukan, atau mengekspor.'),
    ],
    mark: tr('Not allowed', 'Tidak berhak'),
    items: [
      I(false, 'USR-0042 opened a ticket', 'USR-0042 membuat tiket', ['Laras, asking for help.', 'Laras, meminta tolong.'], ['role: customer', 'peran: pelanggan']),
      I(true, 'USR-7731 read every open support ticket', 'USR-7731 membaca semua tiket bantuan yang terbuka', ['That is how they knew she was asking for help.', 'Dari sinilah pelaku tahu dia sedang meminta tolong.'], ['role: customer', 'peran: pelanggan']),
      I(false, 'cs-agent-12 replied to the ticket', 'cs-agent-12 membalas tiket', ["An agent doing an agent's job. Forty seconds too late.", 'Agen menjalankan tugasnya. Terlambat empat puluh detik.'], ['role: support', 'peran: support']),
      I(true, 'USR-7731 closed the ticket as "resolved"', 'USR-7731 menutup tiket sebagai "selesai"', ["A customer account closing someone else's ticket.", 'Akun pelanggan menutup tiket milik orang lain.'], ['role: customer', 'peran: pelanggan']),
      I(true, 'USR-7731 froze wallet USR-0042', 'USR-7731 membekukan dompet USR-0042', ['Freezing a wallet is an admin action.', 'Membekukan dompet adalah tindakan admin.'], ['role: customer', 'peran: pelanggan']),
      I(false, 'admin-ratna exported the monthly report', 'admin-ratna mengekspor laporan bulanan', ['An admin, doing admin work.', 'Admin yang mengerjakan pekerjaan admin.'], ['role: admin', 'peran: admin']),
    ],
    lesson: tr("One ordinary account was doing an admin's work, and nothing on the server asked whether it was allowed to. That is elevation of privilege: gaining rights you were never granted.",
               'Satu akun biasa mengerjakan pekerjaan admin, dan server tidak pernah bertanya apakah akun itu berhak. Itulah elevation of privilege: memperoleh hak yang tidak pernah diberikan.'),
  },
  {
    id: 'p-flood', place: 'hq', letter: 'D', mode: 'pick', layout: 'list',
    title: tr('Hold the line', 'Tahan serbuannya'),
    brief: tr('The reception console still controls the login gateway. The wardens are flooding it so nobody else can sign in tonight. Switch on only the rules that stop a flood without locking real people out.',
              'Konsol resepsionis masih mengendalikan gerbang login. Para penjaga membanjirinya supaya tidak ada orang lain yang bisa masuk malam ini. Aktifkan hanya aturan yang menghentikan banjir tanpa mengunci pengguna asli.'),
    know: [
      tr('Slowing an attacker down is enough. They need thousands of tries.', 'Memperlambat penyerang sudah cukup. Dia butuh ribuan percobaan.'),
      tr("A rule that locks out the real owner does the attacker's job for them.", 'Aturan yang mengunci pemilik asli justru mengerjakan tugas penyerang.'),
    ],
    mark: tr('On', 'Aktif'),
    items: [
      I(false, 'Lock the account forever after one wrong code', 'Kunci akun selamanya setelah satu kode salah', ['Then anyone can lock anyone out with one wrong guess.', 'Dengan begitu siapa pun bisa mengunci akun orang lain dengan satu tebakan salah.']),
      I(true, 'At most 5 code attempts per number every 10 minutes', 'Maksimal 5 percobaan kode per nomor tiap 10 menit', ['412 guesses would now take almost 14 hours.', '412 tebakan kini butuh hampir 14 jam.']),
      I(false, 'Allow unlimited tries, but log them', 'Izinkan percobaan tanpa batas, tapi catat semuanya', ['A log does not slow anything down.', 'Log tidak memperlambat apa pun.']),
      I(true, 'Make each retry wait longer than the last', 'Setiap percobaan ulang harus menunggu lebih lama dari sebelumnya', ['Barely noticed by a person, fatal to a script.', 'Hampir tak terasa bagi manusia, mematikan bagi skrip.']),
      I(true, 'Ask for a human check after three failures', 'Minta verifikasi manusia setelah tiga kali gagal', ['Stops machines, lets people through.', 'Menghentikan mesin, meloloskan manusia.']),
      I(false, 'Block every login in the country until morning', 'Blokir semua login se-Indonesia sampai pagi', ['That is the outage they wanted.', 'Itulah gangguan layanan yang mereka inginkan.']),
    ],
    lesson: tr('A flood only works when nothing slows it. That is denial of service: exhausting a system until real people cannot use it. The answer is a limit that hurts machines and spares humans.',
               'Banjir hanya berhasil kalau tidak ada yang memperlambatnya. Itulah denial of service: menguras sistem sampai pengguna asli tidak bisa memakainya. Jawabannya adalah batas yang menyulitkan mesin tapi tidak menyulitkan manusia.'),
  },
]

export const puzzleById: Record<string, Puzzle> = Object.fromEntries(puzzles.map(p => [p.id, p]))

// ─── Counters (the six answers, never introduced as a framework) ─────────

export interface Counter { id: StrideCategory; name: string; line: string; miss: string }

export const COUNTERS: Counter[] = [
  { id: 'S', name: tr('Verify', 'Verifikasi'), line: tr('Make it prove who it is', 'Paksa dia membuktikan identitasnya'), miss: tr('It never lied about who it was.', 'Dia tidak berbohong soal identitasnya.') },
  { id: 'T', name: tr('Checksum', 'Cocokkan'), line: tr('Compare against the untouched original', 'Bandingkan dengan versi asli'), miss: tr('Nothing was being altered.', 'Tidak ada yang sedang diubah.') },
  { id: 'R', name: tr('Trace', 'Lacak'), line: tr('Put it on a record it cannot erase', 'Catat di log yang tidak bisa dia hapus'), miss: tr("It wasn't hiding its tracks.", 'Dia tidak sedang menghapus jejak.') },
  { id: 'I', name: tr('Seal', 'Segel'), line: tr('Close off what it can see', 'Tutup apa yang bisa dia lihat'), miss: tr("It wasn't looking at anything it shouldn't.", 'Dia tidak sedang mengintip apa pun.') },
  { id: 'D', name: tr('Throttle', 'Batasi'), line: tr('Limit how fast it can come at you', 'Batasi kecepatan serangannya'), miss: tr("It wasn't trying to overwhelm anything.", 'Dia tidak sedang membanjiri apa pun.') },
  { id: 'E', name: tr('Revoke', 'Cabut'), line: tr('Take back rights it gave itself', 'Cabut hak yang dia berikan pada dirinya sendiri'), miss: tr("It hadn't taken any rights it wasn't given.", 'Dia tidak mengambil hak yang bukan miliknya.') },
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

const M = (answer: StrideCategory, en: string, id: string, whyEn: string, whyId: string): Move => ({ answer, text: tr(en, id), why: tr(whyEn, whyId) })

export const wardens: WardenDef[] = [
  {
    id: 'SC-001', name: 'WATCHER', color: '#4F8BE0',
    tagline: tr('It knows where she ate lunch.', 'Dia tahu di mana Laras makan siang.'),
    patrol: [{ x: 430, y: 150 }, { x: 330, y: 292 }, { x: 140, y: 300 }, { x: 330, y: 120 }],
    retreat: { x: 256, y: 432 },
    intro: [
      N('Cold air and fan noise. Something drifts between the racks with a single lens, reading.', 'Udara dingin dan dengung kipas. Sesuatu melayang di antara rak server dengan satu lensa, membaca.'),
      W('WATCHER', '#4F8BE0', 'QUERY: who are you. QUERY: where do you live. QUERY: who do you love.', 'QUERY: siapa kamu. QUERY: di mana kamu tinggal. QUERY: siapa yang kamu sayangi.'),
      S('mc', "That's how they knew her room number. It just looks. Stay out of its sight, find what it hasn't wiped, then break it.", 'Begitulah mereka tahu nomor kamarnya. Dia tinggal melihat. Jangan sampai terlihat, cari apa yang belum dihapusnya, lalu lumpuhkan.'),
    ],
    down: tr('WATCHER goes blind. The Data Center terminal is yours.', 'WATCHER menjadi buta. Terminal Data Center kini milikmu.'),
    moves: [
      M('I', "Its lens widens. Your payslip, your address and your mother's phone number scroll across its face. It is reading files nobody ever gave it.",
             'Lensanya melebar. Slip gajimu, alamatmu, dan nomor ponsel ibumu bergulir di wajahnya. Dia membaca berkas yang tidak pernah diberikan kepadanya.',
             'It was looking at things it had no right to see. That is information disclosure, and the answer is to close the view.',
             'Dia melihat hal yang tidak berhak dilihatnya. Itu information disclosure, dan jawabannya adalah menutup aksesnya.'),
      M('S', 'It holds up a session badge with your own employee number on it and asks the rack to open.',
             'Dia mengacungkan lencana sesi bernomor pegawaimu sendiri dan meminta rak itu terbuka.',
             'It was claiming to be you. Spoofing only works until something checks.', 'Dia mengaku sebagai dirimu. Spoofing hanya berhasil selama tidak ada yang memeriksa.'),
      M('D', 'It fires the same request ten thousand times a second until the rack fans scream and the lights dip.',
             'Dia menembakkan permintaan yang sama sepuluh ribu kali per detik sampai kipas rak meraung dan lampu meredup.',
             'It was trying to drown the system. A flood needs speed, so take the speed away. That is how you stop denial of service.',
             'Dia berusaha menenggelamkan sistem. Banjir butuh kecepatan, jadi ambil kecepatannya. Begitulah cara menghentikan denial of service.'),
      M('R', "It opens tonight's query log and starts deleting every line with its own name on it.",
             'Dia membuka log query malam ini dan mulai menghapus setiap baris yang memuat namanya.',
             'It was making sure nobody could say what it did. Repudiation is beaten by a record that cannot be edited.',
             'Dia memastikan tidak ada yang bisa membuktikan perbuatannya. Repudiation dikalahkan oleh catatan yang tidak bisa diubah.'),
    ],
  },
  {
    id: 'SC-002', name: 'MIMIC', color: '#E0506E',
    tagline: tr('It wears her face.', 'Dia memakai wajah Laras.'),
    patrol: [{ x: 880, y: 130 }, { x: 700, y: 150 }, { x: 700, y: 270 }, { x: 880, y: 250 }],
    retreat: { x: 768, y: 432 },
    intro: [
      N('Two rows of test phones buzz in the dark, one after another. Above them floats a screen with a profile photo on it. Her profile photo.',
        'Dua baris ponsel uji bergetar dalam gelap, bergantian. Di atasnya melayang sebuah layar berisi foto profil. Foto profil Laras.'),
      W('MIMIC', '#E0506E', "it's me kak. i lost my phone. can you send me the code?", 'ini aku kak. hp-ku hilang. bisa kirimin kodenya?'),
      S('mc', "Don't. Don't you use her voice.", 'Jangan. Jangan berani-berani pakai suaranya.'),
    ],
    down: tr('MIMIC loses its face. The Identity Lab terminal is yours.', 'MIMIC kehilangan wajahnya. Terminal Identity Lab kini milikmu.'),
    moves: [
      M('S', 'The screen shows Laras\'s photo and her name. "It\'s me, kak," it types. "You know it\'s me. Just read me the six digits."',
             'Layar itu menampilkan foto dan nama Laras. "Ini aku, kak," ketiknya. "Kakak tahu ini aku. Bacain aja enam angkanya."',
             'It was pretending to be someone it is not. That is spoofing, and it ends when you make it prove itself.',
             'Dia berpura-pura menjadi orang lain. Itu spoofing, dan berakhir saat kamu memaksanya membuktikan diri.'),
      M('D', 'Codes hammer the verifier: 000000, 000001, 000002. Every phone on the bench rings at once and will not stop.',
             'Kode menghantam verifikator: 000000, 000001, 000002. Semua ponsel di meja berdering serentak dan tidak mau berhenti.',
             'Nothing was slowing it down, so it could try forever and bury her in alerts. Limiting the rate stops the flood.',
             'Tidak ada yang memperlambatnya, jadi dia bisa mencoba selamanya dan mengubur Laras dalam notifikasi. Membatasi laju menghentikan banjirnya.'),
      M('T', 'It opens the lockout policy and quietly changes "five attempts" to "five million".',
             'Dia membuka kebijakan pengunci akun dan diam-diam mengubah "lima percobaan" menjadi "lima juta".',
             'It was rewriting something that should not change. Tampering shows up the moment you compare against the original.',
             'Dia menulis ulang sesuatu yang seharusnya tidak berubah. Tampering ketahuan begitu kamu membandingkannya dengan yang asli.'),
      M('E', 'It edits one word in its own guest pass, and the lab now addresses it as "identity administrator".',
             'Dia mengubah satu kata di kartu tamunya, dan lab kini menyapanya "administrator identitas".',
             'It promoted itself. Elevation of privilege is undone by taking back rights nobody granted.',
             'Dia menaikkan pangkatnya sendiri. Elevation of privilege dibatalkan dengan mencabut hak yang tidak pernah diberikan.'),
    ],
  },
  {
    id: 'SC-003', name: 'FORGER', color: '#E0A030',
    tagline: tr('It makes the ledger lie.', 'Dia membuat buku besar berbohong.'),
    patrol: [{ x: 1500, y: 230 }, { x: 1370, y: 110 }, { x: 1370, y: 250 }, { x: 1380, y: 320 }],
    retreat: { x: 1312, y: 432 },
    intro: [
      N('The vault door is shut and the desks are empty. Something with too many pens is rewriting a ledger, line by line.', 'Pintu brankas tertutup dan meja-meja kosong. Sesuatu dengan terlalu banyak pena sedang menulis ulang buku besar, baris demi baris.'),
      W('FORGER', '#E0A030', 'She sent the money. It says so right here. It will always say so.', 'Dia yang mengirim uangnya. Tertulis di sini. Dan akan selalu tertulis begitu.'),
      S('mc', "She told her friends it wasn't her. Nobody believed her, because the numbers agreed with you.", 'Dia bilang ke teman-temannya itu bukan dia. Tidak ada yang percaya, karena angka-angkanya memihakmu.'),
    ],
    down: tr('FORGER drops its pens. The Treasury terminal is yours.', 'FORGER menjatuhkan penanya. Terminal Treasury kini milikmu.'),
    moves: [
      M('T', 'A transfer slip slides across the desk. You signed for 500,000. It now reads minus 500,000, and the ink is still wet.',
             'Selembar slip transfer meluncur di meja. Kamu menandatangani 500.000. Kini tertulis minus 500.000, dan tintanya masih basah.',
             'It changed the number after the fact. That is tampering. Check it against what was really sent.',
             'Dia mengubah angkanya belakangan. Itu tampering. Cocokkan dengan apa yang sebenarnya dikirim.'),
      M('R', '"You sent this yourself," it says, holding up a transfer with no trace of where it came from. "Prove you didn\'t."',
             '"Kamu sendiri yang mengirim ini," katanya sambil mengacungkan transfer tanpa jejak asal-usul. "Buktikan kalau bukan."',
             'With no trustworthy record it is your word against a machine. That gap is called repudiation, and a trail closes it.',
             'Tanpa catatan yang bisa dipercaya, yang ada hanya ucapanmu melawan mesin. Celah itu disebut repudiation, dan jejak audit menutupnya.'),
      M('I', 'It unrolls a printout of every wallet balance in the building and begins reading them aloud to the empty room.',
             'Dia membentangkan cetakan saldo semua dompet di gedung ini dan mulai membacakannya keras-keras ke ruangan kosong.',
             'It was exposing what should stay private. Information disclosure stops when the view is closed.',
             'Dia membeberkan hal yang seharusnya rahasia. Information disclosure berhenti saat aksesnya ditutup.'),
      M('S', "It signs the next transfer with the treasurer's name, in the treasurer's handwriting.",
             'Dia menandatangani transfer berikutnya dengan nama bendahara, dengan tulisan tangan bendahara.',
             'It was acting as someone else. Spoofing fails the moment the signature is checked.',
             'Dia bertindak sebagai orang lain. Spoofing gagal begitu tanda tangannya diperiksa.'),
    ],
  },
  {
    id: 'SC-004', name: 'USURPER', color: '#9A72E8',
    tagline: tr('It gave itself the keys.', 'Dia memberi dirinya sendiri kunci.'),
    patrol: [{ x: 60, y: 660 }, { x: 230, y: 560 }, { x: 420, y: 700 }, { x: 290, y: 760 }],
    retreat: { x: 224, y: 432 },
    intro: [
      N('The video wall is running with nobody watching it. A shape sits at the head of the meeting table like it owns the room.', 'Dinding video menyala tanpa penonton. Sesosok bentuk duduk di ujung meja rapat seolah ruangan itu miliknya.'),
      W('USURPER', '#9A72E8', 'Ticket closed. Ticket closed. Ticket closed. Ticket closed. Is there anything else I can help you with today?', 'Tiket ditutup. Tiket ditutup. Tiket ditutup. Tiket ditutup. Ada lagi yang bisa saya bantu hari ini?'),
      S('mc', 'Four times she asked for help. Four times this thing shut the door on her.', 'Empat kali dia meminta tolong. Empat kali benda ini menutup pintu di depannya.'),
    ],
    down: tr('USURPER is thrown off its chair. The Ops Control terminal is yours.', 'USURPER terlempar dari kursinya. Terminal Ops Control kini milikmu.'),
    moves: [
      M('E', 'It rubs out the word "user" on its badge, writes "admin" over it, and the control panel lights up for it.',
             'Dia menghapus kata "user" di lencananya, menulis "admin" di atasnya, dan panel kontrol menyala untuknya.',
             'It handed itself power nobody gave it. That is elevation of privilege. Take the rights back.',
             'Dia memberi dirinya kuasa yang tidak diberikan siapa pun. Itu elevation of privilege. Cabut haknya.'),
      M('R', 'It closes a ticket marked URGENT, the fourth from the same girl, and leaves nothing to show whose hand did it.',
             'Dia menutup tiket bertanda DARURAT, yang keempat dari gadis yang sama, tanpa meninggalkan jejak siapa yang melakukannya.',
             'It acted and left no trace of who acted. Repudiation ends when every action is signed and kept.',
             'Dia bertindak tanpa meninggalkan jejak pelakunya. Repudiation berakhir ketika setiap tindakan ditandatangani dan disimpan.'),
      M('S', 'It logs in as "admin" with the password "admin123" and tells the room it is the head of operations.',
             'Dia masuk sebagai "admin" dengan kata sandi "admin123" dan mengumumkan bahwa dirinya kepala operasional.',
             'It was passing itself off as someone trusted. Spoofing breaks when identity is actually checked.',
             'Dia menyamar sebagai orang yang dipercaya. Spoofing runtuh ketika identitas benar-benar diperiksa.'),
      M('D', 'It pours ten thousand fake alerts onto the video wall so that the one real alert is lost in the noise.',
             'Dia menuangkan sepuluh ribu peringatan palsu ke dinding video sehingga satu peringatan asli tenggelam dalam kebisingan.',
             'It was overwhelming the people who could have helped. Slow the flood and the real signal comes back.',
             'Dia membanjiri orang-orang yang sebenarnya bisa menolong. Perlambat banjirnya dan sinyal yang asli muncul kembali.'),
    ],
  },
  {
    id: 'SC-005', name: 'BROADCAST', color: '#2FB8A6',
    tagline: tr('It showed everyone.', 'Dia memperlihatkannya ke semua orang.'),
    patrol: [{ x: 1500, y: 613 }, { x: 1200, y: 613 }, { x: 1200, y: 693 }, { x: 1500, y: 693 }],
    retreat: { x: 1344, y: 432 },
    intro: [
      N('Shelves of receipts. Something walks them in order, lifting each page to a light, like it is choosing which to hang up.', 'Rak-rak penuh struk. Sesuatu menyusurinya berurutan, mengangkat setiap lembar ke arah cahaya, seperti memilih mana yang akan dipajang.'),
      W('BROADCAST', '#2FB8A6', 'Pharmacy, 14 March. Counselling clinic, 16 March. Shall I post these to the group?', 'Apotek, 14 Maret. Klinik konseling, 16 Maret. Mau saya kirim ke grup?'),
      S('mc', 'She went to get help, and you turned it into something to laugh at.', 'Dia pergi mencari pertolongan, dan kamu mengubahnya jadi bahan tertawaan.'),
    ],
    down: tr('BROADCAST goes silent. The Records Archive terminal is yours.', 'BROADCAST terdiam. Terminal Records Archive kini milikmu.'),
    moves: [
      M('I', 'It walks the shelf in order, receipt 90001, 90002, 90003, and pins each one to a board in the street outside.',
             'Dia menyusuri rak berurutan, struk 90001, 90002, 90003, lalu menempelkan masing-masing di papan di jalan depan.',
             'Private records, shown to anyone. Information disclosure, and the fix is to close the view.',
             'Catatan pribadi, dipertontonkan ke siapa saja. Information disclosure, dan obatnya adalah menutup aksesnya.'),
      M('T', 'It takes a pharmacy receipt, changes the name printed on it, and files it back as if nothing happened.',
             'Dia mengambil struk apotek, mengubah nama yang tercetak di sana, lalu mengembalikannya seolah tidak terjadi apa-apa.',
             'It altered a record. Tampering is caught by comparing against the untouched copy.',
             'Dia mengubah sebuah catatan. Tampering tertangkap dengan membandingkannya dengan salinan asli.'),
      M('R', 'It reaches up and switches off the camera over the shelves before it starts copying.',
             'Dia meraih ke atas dan mematikan kamera di atas rak sebelum mulai menyalin.',
             'It made sure nothing would remember what it did. Repudiation is beaten by a record it cannot switch off.',
             'Dia memastikan tidak ada yang mengingat perbuatannya. Repudiation dikalahkan oleh catatan yang tidak bisa dia matikan.'),
      M('E', "It finds the archivist's keys in a drawer left open, and hangs them on its own belt.",
             'Dia menemukan kunci arsiparis di laci yang terbuka, lalu menggantungkannya di ikat pinggangnya sendiri.',
             'It took rights that were never its own. That is elevation of privilege. Revoke them.',
             'Dia mengambil hak yang bukan miliknya. Itu elevation of privilege. Cabut.'),
    ],
  },
]

export const wardenById: Record<string, WardenDef> = Object.fromEntries(wardens.map(w => [w.id, w]))

// ─── What each sealed case proves ────────────────────────────────────────

export interface Proof { id: string; title: string; text: string }

export const proofs: Proof[] = [
  { id: 'SC-001', title: tr('Query log · Data Center', 'Log query · Data Center'),
    text: tr("One staff test token read Laras's transactions 214 times. The first read was at 23:12 on the Friday the promotion was announced.",
             'Satu token uji milik staf membaca transaksi Laras 214 kali. Pembacaan pertama terjadi pukul 23.12 pada hari Jumat saat promosi diumumkan.') },
  { id: 'SC-002', title: tr('Bench log · Identity Lab', 'Log meja uji · Identity Lab'),
    text: tr("31,408 login codes were tried against her number from the lab's own test bench at 01:52. The door log shows one badge in the lab that night: 0417.",
             '31.408 kode login dicoba ke nomornya dari meja uji lab itu sendiri pukul 01.52. Log pintu mencatat satu kartu akses di lab malam itu: 0417.') },
  { id: 'SC-003', title: tr('Ledger trace · Treasury', 'Jejak buku besar · Treasury'),
    text: tr('The reversed transfers emptied her wallet into USR-7731, a wallet registered to a SIM card bought with a PayVault staff discount code.',
             'Transfer terbalik itu menguras dompetnya ke USR-7731, dompet yang terdaftar atas kartu SIM yang dibeli dengan kode diskon karyawan PayVault.') },
  { id: 'SC-004', title: tr('Admin session · Ops Control', 'Sesi admin · Ops Control'),
    text: tr('Her four support tickets were closed by a user token edited to say "admin", sent from the wired port at desk P-3. Dimas was on leave in Lombok that week. P-3 is not his desk.',
             'Keempat tiket bantuannya ditutup oleh token pengguna yang diedit menjadi "admin", dikirim dari port kabel di meja P-3. Dimas sedang cuti di Lombok minggu itu. P-3 bukan mejanya.') },
  { id: 'SC-005', title: tr('USB stick · Records Archive', 'Flashdisk · Records Archive'),
    text: tr('The script that scraped her receipts and posted them. First line: "# rk / scratch, do not commit". Built on PayVault laptop PV-0417.',
             'Skrip yang mengambil struk-struknya dan menyebarkannya. Baris pertama: "# rk / scratch, do not commit". Dibuat di laptop PayVault PV-0417.') },
]

export const proofById: Record<string, Proof> = Object.fromEntries(proofs.map(p => [p.id, p]))

const draft = thread('Laras · draft', 'Laras · draf')
const UNSENT: Pair = ['Not sent', 'Tidak terkirim']
const D = (en: string, id: string) => ({ text: tr(en, id), line: draft.me('laras', en, id, UNSENT) })

const drafts = {
  'SC-001': D('kak, someone knows where i eat lunch. and my room number. is that a thing people can just look up?', 'kak, ada yang tahu aku makan siang di mana. sama nomor kamarku. emang itu bisa dicari orang gitu aja?'),
  'SC-002': D('my phone got 400 login codes last night. then my friends got messages from "me". i keep saying it wasn\'t me and it sounds like lying even to me', 'semalam hp-ku dapet 400 kode login. terus temen-temenku dapet pesan dari "aku". aku terus bilang itu bukan aku, dan kedengarannya kayak bohong, bahkan buat aku sendiri'),
  'SC-003': D("my wallet says i sent the money. there's no record that says i didn't. how do you prove you didn't do something", 'dompetku bilang aku yang kirim uangnya. nggak ada catatan yang bilang bukan. gimana caranya buktiin kita nggak ngelakuin sesuatu'),
  'SC-004': D("i wrote to support again. closed in 40 seconds. it's like someone is standing inside the building holding the door shut", 'aku nulis ke support lagi. ditutup dalam 40 detik. kayak ada orang di dalam gedung itu yang nahan pintunya'),
  'SC-005': D("they posted my receipts. the clinic one. everyone saw. i can't tell you kak, they said you're next and i believe them now", 'struk-strukku disebar. yang klinik juga. semua lihat. aku nggak bisa cerita kak, katanya habis ini giliran kakak, dan sekarang aku percaya'),
}

/** Played after a case is sealed: what Laras tried to say, and what you can now prove. */
export const fragments: Record<string, { draft: string; lines: Line[] }> = {
  'SC-001': { draft: drafts['SC-001'].text, lines: [
    N('The restored log still holds a draft from her phone, synced and never sent.', 'Log yang dipulihkan masih menyimpan sebuah draf dari ponselnya, tersinkron tetapi tidak pernah terkirim.'),
    drafts['SC-001'].line,
    S('mc', 'Nobody broke in. They asked for her records by number, and nothing asked who was asking. Then it handed over far more than anyone needed.',
            'Tidak ada yang membobol. Mereka meminta datanya berdasarkan nomor, dan tidak ada yang bertanya siapa yang meminta. Lalu sistem menyerahkan jauh lebih banyak daripada yang dibutuhkan siapa pun.'),
  ] },
  'SC-002': { draft: drafts['SC-002'].text, lines: [
    drafts['SC-002'].line,
    S('mc', 'Six digits and no limit on guesses. They walked into her account as her, and kept her phone screaming while they did it.',
            'Enam digit dan tebakan tanpa batas. Mereka masuk ke akunnya sebagai dirinya, dan membuat ponselnya menjerit sepanjang itu.'),
  ] },
  'SC-003': { draft: drafts['SC-003'].text, lines: [
    drafts['SC-003'].line,
    S('mc', "A number changed on its way in, and a log that kept no copy of what was sent. She couldn't prove it. I can.",
            'Satu angka diubah di tengah jalan, dan log yang tidak menyimpan salinan kiriman aslinya. Dia tidak bisa membuktikannya. Aku bisa.'),
  ] },
  'SC-004': { draft: drafts['SC-004'].text, lines: [
    drafts['SC-004'].line,
    S('mc', 'Someone was. One edited word in a token, and the server never checked it. From a desk on this floor.',
            'Memang ada. Satu kata yang diedit di dalam token, dan server tidak pernah memeriksanya. Dari sebuah meja di lantai ini.'),
  ] },
  'SC-005': { draft: drafts['SC-005'].text, lines: [
    drafts['SC-005'].line,
    S('mc', 'She was protecting me. The whole time, she was protecting me.', 'Dia melindungiku. Selama ini, dia sedang melindungiku.'),
  ] },
}

// ─── Calls during the office chapter ─────────────────────────────────────

const sariCall = thread('Sari', 'Sari')
const teamChat = thread('Platform team', 'Tim platform')
const rakaChat = thread('Raka', 'Raka')

/** Played after the Nth case is sealed. */
export const calls: Record<number, Line[]> = {
  1: [
    sariCall.them('sari', "the on-call page woke me. the door log says YOUR badge is on 14. tell me you're not in there alone", 'panggilan piket bikin aku kebangun. log pintu bilang kartu KAMU ada di lantai 14. bilang kamu nggak sendirian di sana'),
    sariCall.me('mc', "it's about laras. someone here did it to her. i can prove one part already", 'ini soal laras. pelakunya orang sini. satu bagian udah bisa kubuktiin'),
    sariCall.them('sari', "…i'm not going to tell you to go home. send me whatever you seal. if something happens to you, it shouldn't die on your laptop", '…aku nggak akan nyuruh kamu pulang. kirimin ke aku semua yang udah kamu segel. kalau kamu kenapa-napa, buktinya jangan ikut mati di laptopmu'),
  ],
  3: [
    teamChat.them('dimas', 'lombok wifi is terrible but i can see the alarm from here. who is on 14 right now??', 'wifi lombok parah banget tapi alarmnya kelihatan dari sini. siapa yang lagi di lantai 14??'),
    teamChat.them('raka', "I've got it, I'm remoting in. {name}, if that's you up there, go home. You need rest more than anyone. I'll clean it up.", 'Biar aku yang urus, aku remote dari rumah. {name}, kalau itu kamu yang di atas, pulanglah. Kamu yang paling butuh istirahat. Biar aku yang bereskan.'),
    S('mc', '"Clean it up." That is a strange way to describe answering an alarm.', '"Bereskan." Cara yang aneh untuk menyebut menangani alarm.'),
  ],
  4: [
    rakaChat.them('raka', 'Seriously. Go home. Whatever you think you are finding, the logs are corrupted tonight. None of it will hold up.', 'Serius. Pulang. Apa pun yang menurutmu sedang kamu temukan, log-nya rusak malam ini. Tidak akan ada yang bisa dijadikan bukti.'),
    rakaChat.me('mc', 'how do you know what i am finding', 'dari mana kamu tahu apa yang sedang kutemukan'),
    N('He reads it. He does not reply.', 'Dia membacanya. Dia tidak membalas.'),
  ],
}

// ─── Finale ──────────────────────────────────────────────────────────────

export const finaleIntro: Line[] = [
  { k: 'bg', bg: 'night', room: 'briefing', label: tr('Briefing Room · 05:20', 'Ruang Briefing · 05.20'), motif: 'dread' },
  N('The wall screen is on. Someone stands at the podium with their back to you, watching a progress bar that stopped moving an hour ago.',
    'Layar dinding menyala. Seseorang berdiri di podium membelakangimu, menatap bilah progres yang berhenti bergerak sejak sejam lalu.'),
  S('unknown', 'Five wardens. I spent three weeks building those. You should have stayed home and grieved like a normal person.',
               'Lima penjaga. Tiga minggu kuhabiskan untuk membuatnya. Harusnya kamu diam di rumah dan berduka seperti orang normal.'),
  N('You know the voice. But you want to say the name from the evidence, not from the voice.', 'Kamu mengenali suaranya. Tapi kamu ingin menyebut nama itu berdasarkan bukti, bukan berdasarkan suara.'),
  {
    k: 'choice', who: 'mc', answer: 'raka', open: true,
    prompt: tr('Badge 0417 in the lab. Desk P-3. A script signed "rk". It was…', 'Kartu akses 0417 di lab. Meja P-3. Skrip bertanda "rk". Pelakunya…'),
    options: [
      { id: 'sari',  label: 'Sari',  reply: tr("No. Sari is QA. Her badge doesn't open the Identity Lab, and one badge was in there that night.", 'Bukan. Sari itu QA. Kartunya tidak bisa membuka Identity Lab, dan hanya ada satu kartu di sana malam itu.') },
      { id: 'dimas', label: 'Dimas', reply: tr('No. Dimas was on leave in Lombok the week the tickets were closed, and it was done from a wired port on this floor.', 'Bukan. Dimas sedang cuti di Lombok pada minggu tiket-tiket itu ditutup, dan pelakunya memakai port kabel di lantai ini.') },
      { id: 'raka',  label: 'Raka',  reply: '' },
    ],
  },
  S('mc', 'Raka.', 'Raka.'),
  S('raka', 'Lead of the platform team. I taught you that codebase. Go on, then. You have nothing that ties any of it to me.',
            'Lead tim platform. Aku yang mengajarimu codebase itu. Silakan. Kamu tidak punya apa pun yang mengaitkan semua ini denganku.'),
]

/** What happens if you name the wrong colleague. Played instead of the confrontation; you can try again after. */
export const badEndings: Record<string, Line[]> = {
  sari: [
    S('mc', 'Sari.', 'Sari.'),
    N('The figure at the podium does not turn round. You hear the smallest breath of a laugh.', 'Sosok di podium itu tidak menoleh. Kamu mendengar tawa yang nyaris tak terdengar.'),
    S('unknown', "Sari. Yes. That would explain a great deal, wouldn't it. I will make sure security hears your theory.",
                 'Sari. Ya. Itu akan menjelaskan banyak hal, bukan. Akan kupastikan satpam mendengar teorimu.'),
    N("By morning Sari's badge is suspended on your word. She was the one person who told you not to go home. The progress bar on the wall starts moving again.",
      'Menjelang pagi, kartu akses Sari dibekukan atas ucapanmu. Padahal dialah satu-satunya orang yang tidak menyuruhmu pulang. Bilah progres di dinding mulai bergerak lagi.'),
    DARK,
    CARD('The wrong name', 'Nama yang salah',
      ['The wipe finished at 06:12. The five files you sealed each ruled somebody out, and you did not read them.', 'Penghapusan selesai pukul 06.12. Kelima berkas yang kamu segel masing-masing menyingkirkan satu nama, dan kamu tidak membacanya.'],
      { motif: 'grief', small: ['Sari is QA. Her badge has never opened the Identity Lab. Go back and look at what you can prove.', 'Sari itu QA. Kartunya tidak pernah bisa membuka Identity Lab. Kembalilah dan lihat apa yang bisa kamu buktikan.'] }),
  ],
  dimas: [
    S('mc', 'Dimas.', 'Dimas.'),
    N('A pause. Then the figure nods slowly, as if you have said something wise.', 'Hening sejenak. Lalu sosok itu mengangguk pelan, seolah kamu baru mengucapkan sesuatu yang bijak.'),
    S('unknown', 'Dimas, working remotely from Lombok. Clever. I would never have thought of it. You should tell Bu Ratna straight away.',
                 'Dimas, bekerja jarak jauh dari Lombok. Cerdik. Aku tidak akan terpikir sampai ke situ. Sebaiknya kamu segera lapor ke Bu Ratna.'),
    N('Dimas is taken off a plane two days later, still sunburnt, still asking what he is supposed to have done. By then there is nothing left on the servers to clear him.',
      'Dua hari kemudian Dimas diturunkan dari pesawat, kulitnya masih terbakar matahari, masih bertanya apa kesalahannya. Saat itu sudah tidak ada apa pun di server yang bisa membersihkan namanya.'),
    DARK,
    CARD('The wrong name', 'Nama yang salah',
      ['The wipe finished at 06:12. The five files you sealed each ruled somebody out, and you did not read them.', 'Penghapusan selesai pukul 06.12. Kelima berkas yang kamu segel masing-masing menyingkirkan satu nama, dan kamu tidak membacanya.'],
      { motif: 'grief', small: ['The admin requests came from a wired port on this floor, in a week Dimas was not in the country. Go back and look at what you can prove.', 'Permintaan admin itu datang dari port kabel di lantai ini, pada minggu ketika Dimas tidak ada di negeri ini. Kembalilah dan lihat apa yang bisa kamu buktikan.'] }),
  ],
}

export interface Denial { text: string; answer: string; why: string }

export const NEMESIS = {
  name: 'Raka', color: '#8E97A6', hit: 22,
  tagline: tr('Answer each denial with the proof that breaks it.', 'Jawab setiap bantahan dengan bukti yang mematahkannya.'),
}

const DEN = (answer: string, en: string, id: string, whyEn: string, whyId: string): Denial => ({ answer, text: tr(en, id), why: tr(whyEn, whyId) })

export const denials: Denial[] = [
  DEN('SC-002', '"I have never been in the Identity Lab at night. Pull whatever you like."', '"Aku tidak pernah masuk Identity Lab malam-malam. Periksa saja apa pun yang kamu mau."',
      'The lab door logged one badge at 01:52, while 31,408 codes hit her number from the bench inside. Badge 0417. His.',
      'Pintu lab mencatat satu kartu pukul 01.52, saat 31.408 kode menghantam nomor Laras dari meja uji di dalamnya. Kartu 0417. Miliknya.'),
  DEN('SC-004', '"The test token? Three of us hold that. It could have been Dimas. It could have been you."', '"Token uji itu? Kami bertiga memegangnya. Bisa saja Dimas. Bisa saja kamu."',
      "The admin requests came from the wired port at desk P-3. Dimas was in Lombok. P-3 has been Raka's desk for four years.",
      'Permintaan admin itu datang dari port kabel di meja P-3. Dimas sedang di Lombok. P-3 sudah empat tahun menjadi meja Raka.'),
  DEN('SC-003', '"I never touched her money. Show me one rupiah that came to me."', '"Aku tidak pernah menyentuh uangnya. Tunjukkan satu rupiah saja yang masuk ke aku."',
      'Every reversed transfer landed in USR-7731, opened with a SIM bought on his staff discount code.',
      'Semua transfer terbalik itu mendarat di USR-7731, yang dibuka dengan kartu SIM yang dibeli memakai kode diskon karyawannya.'),
  DEN('SC-005', '"Receipts leak. It was a public bucket. Anyone on the internet could have scraped it."', '"Struk memang bisa bocor. Bucket-nya publik. Siapa pun di internet bisa mengambilnya."',
      'Anyone could have. But the script on the USB stick opens with "# rk" and was built on laptop PV-0417, the one issued to him.',
      'Siapa pun memang bisa. Tapi skrip di flashdisk itu diawali "# rk" dan dibuat di laptop PV-0417, laptop yang dipinjamkan kepadanya.'),
  DEN('SC-001', '"Even so. You can\'t show I chose her. It could have been any customer."', '"Tetap saja. Kamu tidak bisa membuktikan aku memilih dia. Bisa saja pelanggan mana pun."',
      'The first read of her records was at 23:12 on the night of the promotion. Hers was the first name searched, and it was searched 214 times.',
      'Pembacaan pertama datanya terjadi pukul 23.12 pada malam promosi. Namanya yang pertama dicari, dan dicari sebanyak 214 kali.'),
]

const lastThread = thread('Laras', 'Laras')
const UNDELIVERED: Pair = ['Not delivered', 'Tidak terkirim']

export const finaleEnd: Line[] = [
  { k: 'bg', bg: 'night', room: 'briefing', label: tr('Briefing Room · 05:40', 'Ruang Briefing · 05.40') },
  N('He looks at the five files on the wall for a long time.', 'Lama dia menatap kelima berkas di dinding.'),
  S('raka', "You got everything. The job, the bonus, the way they all look at you. I only wanted you to know what it feels like when it isn't fair.",
            'Kamu dapat semuanya. Jabatan, bonus, cara mereka semua memandangmu. Aku cuma ingin kamu tahu rasanya ketika hidup tidak adil.'),
  S('mc', 'She was nineteen. She had never met you.', 'Umurnya sembilan belas. Dia bahkan belum pernah bertemu denganmu.'),
  S('raka', "It wasn't supposed to go that far. I can still wipe it. All of it. Nobody has to…", 'Harusnya tidak sampai sejauh itu. Aku masih bisa menghapusnya. Semuanya. Tidak perlu ada yang…'),
  S('mc', "It's already sent. Sari, Bu Ratna, legal, the police cyber unit. Five sealed files, each with a copy you can't reach. You can't delete what has been witnessed.",
          'Sudah terkirim. Sari, Bu Ratna, tim legal, unit siber kepolisian. Lima berkas tersegel, masing-masing dengan salinan yang tidak bisa kamu jangkau. Kamu tidak bisa menghapus apa yang sudah disaksikan.'),
  N('The lift chimes down the hall. Sari, out of breath, then building security, and behind them Bu Ratna with her coat on over her pyjamas.',
    'Lift berdenting di ujung lorong. Sari, terengah-engah, lalu satpam gedung, dan di belakang mereka Bu Ratna dengan mantel menutupi piyamanya.'),
  S('ratna', 'I read all five on the way here. Raka, hand me your badge. {name}… I am so sorry. We should have listened to her tickets.',
             'Kelimanya sudah saya baca dalam perjalanan ke sini. Raka, serahkan kartu aksesmu. {name}… saya sungguh minta maaf. Seharusnya kami mendengarkan tiket-tiketnya.'),
  DARK,
  CARD('After', 'Sesudahnya', ['Raka was arrested that morning. The faculty withdrew every complaint against her. PayVault closed all five gaps within a month, and named the audit programme after her.',
                               'Raka ditangkap pagi itu juga. Fakultas mencabut semua pengaduan terhadapnya. PayVault menutup kelima celah dalam sebulan, dan menamai program auditnya dengan namanya.'], { motif: 'resolve' }),
  lastThread.me('mc', 'i found the manual. you were right, it has a name for every one of them', 'buku panduannya ketemu. kamu bener, semuanya ada namanya', UNDELIVERED),
  lastThread.me('mc', 'Spoofing. Tampering. Repudiation. Information disclosure. Denial of service. Elevation of privilege.', 'Spoofing. Tampering. Repudiation. Information disclosure. Denial of service. Elevation of privilege.', UNDELIVERED),
  lastThread.me('mc', "you weren't lying. i can prove it now. sunday dinner was nice", 'kamu nggak bohong. sekarang aku bisa buktiin. makan malam minggu kemarin enak', UNDELIVERED),
  CARD('Six kinds of harm. Each one has a name.', 'Enam jenis bahaya. Masing-masing punya nama.',
    ['Laras found the words on her own. You made sure someone listened.', 'Laras menemukan kata-katanya sendirian. Kamu memastikan ada yang mendengarkan.'],
    { motif: 'grief', small: ['If someone you know goes quiet, ask twice. If you are struggling yourself, please talk to someone you trust or a local crisis line.',
                              'Kalau seseorang yang kamu kenal mendadak diam, bertanyalah dua kali. Kalau kamu sendiri sedang kesulitan, bicaralah dengan orang yang kamu percaya atau layanan krisis setempat.'] }),
]

export function fill(text: string, name: string) {
  return text.replace(/\{name\}/g, name)
}
