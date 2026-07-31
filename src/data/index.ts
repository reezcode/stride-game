// Fintech App: "PayVault" — a fictional B2C digital payment & wallet app
export interface Scenario {
  id: string
  code: string
  title: string
  description: string
  context: string
  details: string[]
  systemInfo: {
    endpoint?: string
    method?: string
    request?: string
    response?: string
    note?: string
  }[]
  groundTruth: {
    category: 'S' | 'T' | 'R' | 'I' | 'D' | 'E'
    title: string
    explanation: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low'
  }[]
  hints: string[]
}

export const APP_NAME = 'PayVault'
export const APP_DESCRIPTION = 'Digital wallet & payment platform serving 2M+ users'

export const scenarios: Scenario[] = [
  {
    id: 'SC-001',
    code: 'SC-001',
    title: 'Transaction History API',
    description: 'Endpoint API untuk mengambil riwayat transaksi pengguna.',
    context: `Fitur "Riwayat Transaksi" pada PayVault bergantung pada endpoint API yang menerima ID transaksi dari antarmuka klien. 
Saat ini, logika backend menggunakan parameter ID ini secara langsung untuk melakukan kueri ke database tanpa proses otorisasi berbasis sesi pada level resource.`,
    details: [
      'Endpoint menerima parameter transaction_id secara langsung (path/query)',
      'Tidak terdapat validasi otorisasi (BOLA/IDOR) pada level resource',
      'Payload response mengembalikan objek transaksi secara utuh, mencakup data PII',
      'Satu endpoint API digunakan pada beberapa tampilan antarmuka secara generik',
    ],
    systemInfo: [
      {
        endpoint: 'GET /api/v1/transactions/{id}',
        method: 'GET',
        request: 'Authorization: Bearer <user_token>\nGET /api/v1/transactions/TXN-99182',
        response: `{
  "id": "TXN-99182",
  "amount": 5000000,
  "status": "SUCCESS",
  "sender": {
    "id": "USR-0042",
    "name": "Budi Santoso",
    "account": "082*****789",
    "nik": "3271234567890001"
  },
  "receiver": {
    "id": "USR-0089",
    "name": "Rina Wijaya",
    "account": "081*****123"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "ip_origin": "192.168.1.101",
  "device_id": "DVCE-A1B2C3"
}`,
        note: 'TXN-99182 merupakan aset milik pengguna yang berbeda dari konteks sesi',
      },
    ],
    groundTruth: [
      {
        category: 'S',
        title: 'Insecure Direct Object Reference (IDOR) / BOLA',
        explanation: 'Ketiadaan validasi otorisasi pada level objek (resource) memungkinkan terjadinya eskalasi hak istimewa horizontal. Entitas dapat memanipulasi parameter ID transaksi untuk mengakses data historis pengguna lain secara tidak sah.',
        severity: 'Critical',
      },
      {
        category: 'I',
        title: 'Excessive Data Exposure',
        explanation: 'API mengembalikan payload data berlebih, termasuk Personally Identifiable Information (PII) sensitif seperti NIK, IP origin, dan device ID, yang melanggar prinsip data minimization.',
        severity: 'High',
      },
    ],
    hints: ['Periksa apakah token valid selaras dengan kepemilikan data TXN-99182', 'Evaluasi komponen data yang terlampir pada response body'],
  },
  {
    id: 'SC-002',
    code: 'SC-002',
    title: 'Login & OTP Authentication',
    description: 'Proses autentikasi login dengan OTP SMS untuk PayVault.',
    context: `Sistem autentikasi PayVault menerapkan mekanisme Multi-Factor Authentication (MFA) berbasis One-Time Password (OTP) via SMS. 
Token OTP terdiri dari 6 digit numerik dengan masa aktif 10 menit. 
Namun, kontrol laju (rate limiting) pada verifikasi OTP belum terimplementasi secara komprehensif.`,
    details: [
      'Entropi OTP terbatas pada 6 digit (1.000.000 kombinasi)',
      'Tidak ada mekanisme rate limiting (throttle) pada endpoint verifikasi',
      'Ketiadaan account lockout pasca kegagalan autentikasi berulang',
      'Token sesi di-generate secara independen tanpa invalidasi status token sebelumnya',
      'Sistem mengembalikan pesan error generik "Kode OTP salah" pada seluruh kasus anomali',
    ],
    systemInfo: [
      {
        endpoint: 'POST /api/v1/auth/verify-otp',
        method: 'POST',
        request: `POST /api/v1/auth/verify-otp
{
  "phone": "08123456789",
  "otp": "123456"
}`,
        response: `// Gagal: { "error": "Kode OTP salah" }
// Berhasil: { "token": "eyJ...", "user_id": "USR-0042" }`,
        note: 'Absennya header X-RateLimit dan mekanisme suspensi akun setelah threshold N tercapai',
      },
    ],
    groundTruth: [
      {
        category: 'S',
        title: 'Brute-Force Vulnerability on MFA',
        explanation: 'Ketiadaan mekanisme account lockout atau kontrol laju memungkinkan serangan brute-force terhadap token OTP. Aktor eksternal dapat secara sistematis menebak ruang probabilitas OTP untuk melancarkan Account Takeover (ATO).',
        severity: 'Critical',
      },
      {
        category: 'D',
        title: 'Application-Level Denial of Service (DoS)',
        explanation: 'Absennya pembatasan laju permintaan pada endpoint `/verify-otp` membuka celah pengurasan sumber daya (resource exhaustion) secara masif, yang berpotensi mengganggu ketersediaan layanan autentikasi.',
        severity: 'High',
      },
    ],
    hints: ['Evaluasi rasio probabilitas tebakan pada ruang OTP 6 digit', 'Apa implikasi keamanan dari kegagalan autentikasi tanpa limitasi?'],
  },
  {
    id: 'SC-003',
    code: 'SC-003',
    title: 'Transfer Amount Manipulation',
    description: 'Alur transfer dana antar pengguna PayVault.',
    context: `Proses pemindahan dana antar pengguna bergantung pada input nominal dari antarmuka klien. 
Backend PayVault memproses payload transaksi ini tanpa menerapkan validasi integritas (sanity check) 
atau sanitasi matematis terhadap field \`amount\` sebelum proses mutasi debit/kredit dieksekusi.`,
    details: [
      'Nominal transaksi ditransmisikan sebagai parameter pada body request',
      'Backend menyetujui mutasi finansial berdasarkan parameter klien tanpa validasi matematis',
      'Tidak ada konfirmasi server-side logic terhadap tipe data atau interval nominal yang valid',
      'Log audit transaksi hanya merekam agregat status operasi tanpa snapshot payload sumber',
    ],
    systemInfo: [
      {
        endpoint: 'POST /api/v1/transfer',
        method: 'POST',
        request: `POST /api/v1/transfer
Authorization: Bearer <valid_token>
{
  "to_user": "USR-0089",
  "amount": -500000,
  "currency": "IDR",
  "note": "Bayar utang"
}`,
        response: `{
  "status": "SUCCESS",
  "transaction_id": "TXN-99999",
  "message": "Transfer berhasil",
  "new_balance": 1500000
}`,
        note: 'Injeksi nilai negatif (-500000) mengakibatkan anomali logika pembukuan ganda (double-entry logic)',
      },
    ],
    groundTruth: [
      {
        category: 'T',
        title: 'Business Logic Bypass via Parameter Tampering',
        explanation: 'Ketiadaan validasi batasan nilai (boundary validation) pada sisi server memungkinkan manipulasi input numerik negatif. Anomali logika ini mengakibatkan saldo originasi bertambah alih-alih berkurang (reverse transfer).',
        severity: 'Critical',
      },
      {
        category: 'R',
        title: 'Insufficient Audit Logging',
        explanation: 'Sistem pencatatan log (audit trail) tidak mempertahankan salinan payload permintaan mentah (raw request). Kekurangan ini menyulitkan tindakan non-repudiasi dan forensik digital saat terjadi eksploitasi.',
        severity: 'High',
      },
    ],
    hints: ['Observasi parameter amount pada HTTP request', 'Evaluasi hasil komputasi saat operasi menggunakan integer negatif'],
  },
  {
    id: 'SC-004',
    code: 'SC-004',
    title: 'Admin Dashboard Akses Tidak Terproteksi',
    description: 'Dashboard operasional PayVault untuk administrasi pengguna.',
    context: `Akses menuju panel administratif \`/admin\` dikelola oleh sistem autentikasi terpusat berbasis JSON Web Token (JWT). 
Sistem menggunakan skema signing token yang sama untuk pengguna reguler maupun staf internal. 
Otorisasi bergantung sepenuhnya pada field "role" yang terlampir (stateless) di dalam payload JWT.`,
    details: [
      'Field "role" disematkan pada klaim JWT ("role": "user" atau "admin")',
      'Validasi kontrol akses hanya direalisasikan pada level frontend (client-side routing)',
      'Backend endpoint administratif gagal memvalidasi otoritas berbasis token secara independen',
      'Lingkungan produksi masih mengizinkan kredensial default sistem ("admin/admin123")',
      'Tidak ada sistem pemantauan (monitoring) atau audit logs pada endpoint administratif',
    ],
    systemInfo: [
      {
        endpoint: 'GET /api/v1/admin/users',
        method: 'GET',
        request: `// Klaim JWT Reguler:
{
  "sub": "USR-0042",
  "role": "user",
  "exp": 1705320000
}

// Klaim JWT Termodifikasi:
{
  "sub": "USR-0042",
  "role": "admin",
  "exp": 1705320000
}`,
        response: `// Ekseskusi berhasil (tanpa server-side authorization):
{
  "users": [...],  // Payload terekspos secara menyeluruh
  "total": 2100000
}`,
        note: 'Lapisan backend memprioritaskan verifikasi tanda tangan (signature) token namun mengabaikan otorisasi klaim',
      },
    ],
    groundTruth: [
      {
        category: 'E',
        title: 'Broken Access Control via Token Manipulation',
        explanation: 'Kegagalan validasi level otorisasi pada sisi server (server-side authorization) memungkinkan entitas tidak sah memanipulasi klaim JWT untuk melakukan eskalasi hak istimewa secara vertikal (Privilege Escalation).',
        severity: 'Critical',
      },
      {
        category: 'R',
        title: 'Absence of Security Audit Trails',
        explanation: 'Ketidaksediaan log audit (audit trails) pada panel administratif mencegah pendeteksian intrusi dini dan mempersulit penelusuran (traceability) insiden pasca-kompromi.',
        severity: 'High',
      },
      {
        category: 'S',
        title: 'Use of Default Credentials',
        explanation: 'Kelalaian mitigasi terhadap kredensial bawaan sistem memungkinkan penetrasi akses secara langsung (direct access), menihilkan segala bentuk kontrol keamanan operasional.',
        severity: 'Critical',
      },
    ],
    hints: ['Identifikasi lapisan arsitektur mana yang menangani validasi hak istimewa', 'Evaluasi potensi eksploitasi jika klaim token dikompromikan'],
  },
  {
    id: 'SC-005',
    code: 'SC-005',
    title: 'Payment Receipt & Invoice Download',
    description: 'Fasilitas ekstraksi dokumen bukti pembayaran (invoice) pada PayVault.',
    context: `Layanan unduh resi transaksi mengandalkan arsitektur cloud storage terpisah. 
Format penamaan objek URL dihasilkan berdasarkan pola deterministik (predictable identifiers). 
Konfigurasi bucket penyimpanan saat ini beroperasi pada level akses publik (public read) tanpa mekanisme Access Control List (ACL).`,
    details: [
      'Penamaan path dokumen mengadopsi pola kronologis dan ID sekuensial yang mudah diprediksi',
      'Aset sensitif berlokasi di dalam bucket publik tanpa kebutuhan token autentikasi persisten',
      'Absennya validasi kepemilikan aset (ownership validation) saat dokumen diunduh',
      'Format URL secara implisit memfasilitasi serangan enumerasi direktori',
      'Cloud bucket tidak dikonfigurasi untuk mempertahankan log akses historis (access logging)',
    ],
    systemInfo: [
      {
        endpoint: 'GET /storage/receipts/{date}/{transaction_id}.pdf',
        note: 'Format URL: https://storage.payvault.id/receipts/2024-01-15/TXN-99182.pdf',
        request: `// Vektor serangan enumerasi tanpa batas (Unauthenticated Enumeration):
GET https://storage.payvault.id/receipts/2024-01-15/TXN-90001.pdf
GET https://storage.payvault.id/receipts/2024-01-15/TXN-90002.pdf
... (iterasi deterministik)`,
        response: `HTTP 200 OK
Content-Type: application/pdf
// Dokumen terekspos memuat informasi sensitif: nama entitas, nominal transfer, rekening perbankan, dan data waktu`,
      },
    ],
    groundTruth: [
      {
        category: 'I',
        title: 'BOLA / IDOR - Unauthenticated File Access',
        explanation: 'Akses pada level objek gagal terlindungi oleh mekanisme kontrol akses otentik. Struktur penamaan yang deterministik sangat rentan terhadap serangan enumerasi massal (mass scraping) untuk ekstraksi data.',
        severity: 'Critical',
      },
      {
        category: 'R',
        title: 'Lack of Access Monitoring',
        explanation: 'Absennya telemetri akses pada sumber daya publik membatasi visibilitas keamanan, sehingga aktivitas ekstraksi data massal (data exfiltration) sulit diidentifikasi secara proaktif.',
        severity: 'Medium',
      },
    ],
    hints: ['Analisis apakah pola URL bersifat acak (high entropy) atau mudah diprediksi', 'Pertimbangkan syarat keamanan minimal untuk distribusi dokumen rahasia'],
  },
]

export const strideData = {
  S: {
    letter: 'S',
    name: 'Spoofing',
    color: '#E8453C',
    bgColor: '#FDECEA',
    borderColor: '#F5B8B5',
    icon: 'mask',
    tagline: 'Pemalsuan Identitas & Hak Akses',
    description: `Spoofing berkaitan dengan pemalsuan identitas yang bertujuan untuk menggagalkan 
limitasi akses user. Contohnya: user dengan akses A bisa mendapatkan akses B-Z, 
mendapatkan informasi user lain, atau bypass autentikasi.`,
    keywords: ['Authentication', 'Access Control', 'Permission', 'Session Management'],
    failPoints: [
      {
        title: 'Accessing Resources',
        detail: 'Dokumen, gambar, file — diakses lewat path atau URI yang tidak terproteksi',
        icon: 'folder',
      },
      {
        title: 'API Call',
        detail: 'REST, GraphQL, WebSocket — endpoint API yang tidak memvalidasi kepemilikan resource',
        icon: 'plug',
      },
      {
        title: 'Queries & Filters',
        detail: 'Parameter atau query yang memungkinkan akses ke data user lain (IDOR)',
        icon: 'search',
      },
      {
        title: 'Login Failure',
        detail: 'Bruteforce, user enumeration, session spoofing, phishing redirect',
        icon: 'lock',
      },
    ],
    examples: [
      {
        title: 'IP Spoofing',
        description: 'Pemalsuan identitas IP untuk bypass restriction berbasis IP whitelist.',
        code: `// Attacker menambahkan header palsu untuk bypass IP restriction
X-Forwarded-For: 192.168.1.1  // IP internal yang di-whitelist
X-Real-IP: 10.0.0.1`,
      },
      {
        title: 'IDOR (Insecure Direct Object Reference)',
        description: 'Mengganti ID di API/URL untuk mendapatkan data user lain.',
        code: `// User A mengakses data miliknya
GET /api/transactions/TXN-001  ✓

// User A mengganti ID → mengakses data User B
GET /api/transactions/TXN-002  ← IDOR!
// Tidak ada validasi kepemilikan session vs transaksi`,
      },
      {
        title: 'Account Takeover via OTP Bruteforce',
        description: 'Tanpa rate limiting, OTP 6 digit bisa dibruteforce dalam hitungan menit.',
        code: `// 1.000.000 kombinasi, tanpa rate limit = account takeover
for otp in range(000000, 999999):
    response = POST /verify-otp { "otp": otp }
    if response.status == 200:
        print("Account taken over!")`,
      },
    ],
    quiz: [
      {
        question: 'Seorang user mengganti angka di URL dari /invoice/1001 menjadi /invoice/1002 dan berhasil melihat invoice milik user lain. Ini adalah contoh dari?',
        options: ['SQL Injection', 'IDOR (Insecure Direct Object Reference)', 'XSS Attack', 'CSRF Attack'],
        correct: 1,
        explanation: 'IDOR terjadi ketika sistem tidak memvalidasi apakah user yang mengakses resource adalah pemiliknya. Mengganti ID di URL untuk mengakses data user lain adalah definisi klasik IDOR.',
      },
      {
        question: 'Manakah yang BUKAN merupakan contoh Spoofing threat?',
        options: ['Bruteforce OTP untuk takeover akun', 'Session token yang bisa diprediksi', 'SQL Injection pada form login', 'IP Address spoofing untuk bypass whitelist'],
        correct: 2,
        explanation: 'SQL Injection adalah ancaman Tampering (memanipulasi input/query), bukan Spoofing. Spoofing berfokus pada pemalsuan identitas dan bypass access control.',
      },
      {
        question: 'Keyword apa yang paling relevan dengan Spoofing threat?',
        options: ['Encryption & Hashing', 'Authentication & Access Control', 'Rate Limiting & Monitoring', 'Input Validation & Sanitization'],
        correct: 1,
        explanation: 'Spoofing berkaitan erat dengan Authentication dan Access Control — bagaimana sistem memverifikasi identitas user dan membatasi akses sesuai permission yang dimiliki.',
      },
    ],
  },
  T: {
    letter: 'T',
    name: 'Tampering',
    color: '#D47A00',
    bgColor: '#FEF3E0',
    borderColor: '#F9D49A',
    icon: 'tampering',
    tagline: 'Manipulasi Data & Sistem',
    description: `Tampering berkaitan dengan mengubah atau merusak sebuah data atau sistem 
(berupa outcome atau behaviour-nya). Ancaman ini menarget integritas data 
mulai dari input form hingga komunikasi antar sistem.`,
    keywords: ['Integrity Check', 'Interception', 'Injection', 'Input Validation'],
    failPoints: [
      {
        title: 'Input Validation',
        detail: 'Tidak ada validasi server-side pada input yang diterima dari user atau sistem lain',
        icon: 'code',
      },
      {
        title: 'Input Sanitization',
        detail: 'Input yang mengandung karakter berbahaya tidak dibersihkan sebelum diproses',
        icon: 'brush',
      },
      {
        title: 'Integrity Checking',
        detail: 'Tidak ada mekanisme checksum, hash, atau digital signature untuk memverifikasi integritas data',
        icon: 'shield-check',
      },
    ],
    examples: [
      {
        title: 'SQL Injection via Input Form',
        description: 'Input tidak disanitasi, memungkinkan injeksi SQL query berbahaya.',
        code: `// Input field tidak disanitasi
username = "admin' OR '1'='1' --"
password = "apapun"

// Query yang terbentuk:
SELECT * FROM users 
WHERE username = 'admin' OR '1'='1' --' AND password = 'apapun'
// '1'='1' selalu true → login berhasil tanpa password!`,
      },
      {
        title: 'URL Parameter Manipulation',
        description: 'Memanipulasi parameter URL untuk mendapatkan keuntungan ilegal.',
        code: `// Normal request checkout
POST /checkout
{ "cart_id": "CART-001", "discount_code": "DISC10" }

// Manipulated request
POST /checkout  
{ "cart_id": "CART-001", "price_override": 1, "discount": 99 }
// Jika backend tidak validasi ulang: bayar Rp1 untuk produk Rp1.000.000!`,
      },
      {
        title: 'Negative Amount Transfer',
        description: 'Nilai negatif pada field amount membalikkan arah transaksi keuangan.',
        code: `// Normal transfer
POST /transfer { "amount": 100000, "to": "USR-002" }
// Debit 100.000 dari pengirim → Credit 100.000 ke penerima

// Manipulated
POST /transfer { "amount": -100000, "to": "USR-002" }
// Credit 100.000 ke pengirim ← UANG GRATIS!`,
      },
    ],
    quiz: [
      {
        question: 'Seorang attacker memasukkan teks \'; DROP TABLE users; -- pada form login. Ini adalah contoh?',
        options: ['Spoofing', 'SQL Injection (Tampering)', 'Denial of Service', 'Information Disclosure'],
        correct: 1,
        explanation: 'Ini adalah SQL Injection, kategori Tampering. Attacker memanipulasi query database melalui input yang tidak disanitasi untuk mengubah perilaku sistem.',
      },
      {
        question: 'Manakah countermeasure yang paling tepat untuk mencegah Tampering pada input?',
        options: ['Enkripsi data di database', 'Server-side input validation & parameterized queries', 'Rate limiting pada endpoint', 'Logging semua aktivitas user'],
        correct: 1,
        explanation: 'Server-side validation dan parameterized queries adalah lini pertama pertahanan terhadap Tampering. Client-side validation saja tidak cukup karena bisa di-bypass.',
      },
      {
        question: 'Field amount: -500000 dikirim ke API transfer dan menyebabkan saldo pengirim bertambah. Kategori STRIDE apa ini?',
        options: ['Spoofing', 'Repudiation', 'Tampering', 'Elevation of Privilege'],
        correct: 2,
        explanation: 'Ini adalah Tampering — memanipulasi nilai input (amount) untuk mengubah behavior sistem keuangan. Backend tidak memvalidasi bahwa amount harus positif.',
      },
    ],
  },
  R: {
    letter: 'R',
    name: 'Repudiation',
    color: '#0A8A68',
    bgColor: '#E6F6F1',
    borderColor: '#9FD9C6',
    icon: 'repudiation',
    tagline: 'Aktivitas Ilegal Tanpa Jejak',
    description: `Repudiation berkaitan dengan aktivitas ilegal atau serangan yang terjadi 
namun sistem tidak memiliki bukti log yang cukup kuat untuk membuktikannya. 
Sistem yang baik harus bisa menjawab: "Siapa melakukan apa, kapan, dan dari mana?"`,
    keywords: ['Monitoring', 'Logging', 'User Agreement/Approval', 'Digital Signature', 'Audit Trail'],
    failPoints: [
      {
        title: 'User Activity Log',
        detail: 'Tidak ada pencatatan aktivitas user yang terstruktur dan terpercaya',
        icon: 'chart-bar',
      },
      {
        title: 'System Log',
        detail: 'Event sistem, error, dan anomali tidak dicatat dengan detail yang memadai',
        icon: 'monitor',
      },
      {
        title: 'Digital Signatures',
        detail: 'Tidak ada tanda tangan digital untuk membuktikan keaslian dan non-repudiation transaksi',
        icon: 'signature',
      },
      {
        title: 'Timestamps',
        detail: 'Timestamp tidak akurat, mudah dimanipulasi, atau tidak disimpan dengan benar',
        icon: 'clock',
      },
    ],
    examples: [
      {
        title: 'Aktivitas Admin Tanpa Audit Trail',
        description: 'Aksi di admin panel tidak dicatat, sehingga penyalahgunaan tidak bisa dibuktikan.',
        code: `// Apa yang SEHARUSNYA dicatat:
{
  "timestamp": "2024-01-15T10:30:00Z",
  "actor": "admin@payvault.id",
  "action": "DELETE_USER",
  "target": "USR-0042",
  "ip": "192.168.1.101",
  "result": "SUCCESS"
}

// Yang terjadi: Tidak ada log sama sekali
// Attacker hapus 10.000 akun → tidak bisa dibuktikan siapa pelakunya`,
      },
      {
        title: 'Transfer Tanpa Digital Signature',
        description: 'User mengklaim tidak pernah melakukan transfer, tapi tidak ada bukti digital signature.',
        code: `// Tanpa digital signature:
User: "Saya tidak pernah transfer Rp5 juta itu!"
System: "Log kami menunjukkan transfer terjadi dari IP kamu"
User: "IP bisa dipalsukan! Mana bukti saya yang setuju?"
// Sistem tidak bisa membuktikan consent user → dispute tak terbantahkan`,
      },
    ],
    quiz: [
      {
        question: 'Seorang user melakukan transfer ilegal, lalu mengklaim "Bukan saya yang transfer". Sistem tidak punya log detail transaksi tersebut. Ini adalah masalah?',
        options: ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure'],
        correct: 2,
        explanation: 'Repudiation terjadi ketika sistem tidak bisa membuktikan bahwa suatu aksi dilakukan oleh entitas tertentu. Tanpa audit log yang kuat, klaim "bukan saya" tidak bisa dibantah.',
      },
      {
        question: 'Manakah yang paling efektif untuk mencegah Repudiation pada transaksi keuangan?',
        options: ['Rate limiting', 'Digital signature + immutable audit log', 'Input validation', 'Enkripsi database'],
        correct: 1,
        explanation: 'Digital signature membuktikan bahwa user secara eksplisit menyetujui transaksi, sementara immutable audit log memastikan bukti tidak bisa diubah atau dihapus.',
      },
      {
        question: 'Apa yang harus selalu dicatat dalam audit log transaksi sensitif?',
        options: ['Hanya status sukses/gagal', 'Actor, action, target, timestamp, IP, dan result', 'Hanya error message', 'Hanya waktu transaksi'],
        correct: 1,
        explanation: 'Audit log yang baik harus menjawab 5W1H: Who (actor), What (action + target), When (timestamp), Where (IP/device), dan How (result). Informasi parsial tidak cukup untuk non-repudiation.',
      },
    ],
  },
  I: {
    letter: 'I',
    name: 'Information Disclosure',
    color: '#155FA0',
    bgColor: '#E8F1FC',
    borderColor: '#9DC3ED',
    icon: 'info-disclosure',
    tagline: 'Kebocoran Data Sensitif',
    description: `Information Disclosure berkaitan dengan kebocoran atau pemaparan data rahasia 
kepada pihak yang tidak memiliki hak akses untuk melihat data tersebut. 
Prinsip utama: least privilege — hanya berikan data yang benar-benar diperlukan.`,
    keywords: ['Cryptography', 'Encryption', 'Roles', 'Least Privilege Principle', 'Data Minimization'],
    failPoints: [
      {
        title: 'Weak Cryptography',
        detail: 'Menggunakan algoritma enkripsi yang sudah usang atau implementasi yang salah',
        icon: 'key',
      },
      {
        title: 'Excessive Data Exposure',
        detail: 'API mengembalikan lebih banyak data dari yang diperlukan (typical di REST APIs)',
        icon: 'upload',
      },
      {
        title: 'Failed Access Control',
        detail: 'Data sensitif bisa diakses oleh role yang tidak seharusnya',
        icon: 'door',
      },
      {
        title: 'Default Configurations',
        detail: 'Server menampilkan informasi teknis, stack trace, atau konfigurasi default yang tidak perlu',
        icon: 'settings',
      },
    ],
    examples: [
      {
        title: 'Excessive Data Exposure di API',
        description: 'API yang sama digunakan di beberapa fitur mengembalikan data berlebih.',
        code: `// Fitur "Cek Saldo" menggunakan endpoint yang sama dengan "Profile Lengkap"
GET /api/user/profile

// Response yang dikembalikan (berlebihan untuk fitur cek saldo):
{
  "name": "Budi Santoso",
  "balance": 5000000,
  "nik": "3271234567890001",  ← TIDAK PERLU untuk cek saldo
  "full_address": "Jl. Merdeka No.1, Jakarta",  ← TIDAK PERLU
  "credit_score": 720,  ← SANGAT SENSITIF
  "linked_bank_accounts": [...]  ← TIDAK PERLU
}`,
      },
      {
        title: 'Default Server Configuration Exposed',
        description: 'Halaman default server mengekspos informasi teknis sensitif.',
        code: `// Mengakses domain tanpa path
GET https://api.payvault.id/

// Response dari default page:
{
  "server": "Apache/2.4.51 (Ubuntu)",
  "php_version": "7.4.3",
  "environment": "production",
  "db_host": "postgres://internal.db:5432",
  "debug": true
}
// Attacker mendapat peta lengkap untuk menyerang infrastruktur!`,
      },
    ],
    quiz: [
      {
        question: 'API untuk fitur "Daftar Teman" mengembalikan nama, foto, NIK, dan nomor rekening semua teman. NIK dan rekening tidak diperlukan untuk fitur ini. Ini adalah?',
        options: ['Spoofing', 'Tampering', 'Information Disclosure — Excessive Data Exposure', 'Denial of Service'],
        correct: 2,
        explanation: 'Ini adalah Information Disclosure dengan pola Excessive Data Exposure. Prinsip Least Privilege harus diterapkan: API hanya boleh mengembalikan data yang benar-benar diperlukan oleh fitur tersebut.',
      },
      {
        question: 'Manakah yang merupakan contoh default configuration yang berbahaya?',
        options: ['Rate limiting diaktifkan by default', 'Stack trace error ditampilkan ke user di production', 'HTTPS diaktifkan by default', 'Password di-hash sebelum disimpan'],
        correct: 1,
        explanation: 'Stack trace di production mengekspos detail implementasi sistem kepada attacker, termasuk library versions, file paths, dan logic flow yang bisa dieksploitasi.',
      },
      {
        question: 'Prinsip utama yang menjadi solusi untuk mencegah Information Disclosure adalah?',
        options: ['Defense in Depth', 'Least Privilege Principle', 'Security by Obscurity', 'Zero Trust Network'],
        correct: 1,
        explanation: 'Least Privilege Principle: setiap komponen sistem (user, API, service) hanya mendapat akses minimum yang diperlukan untuk menjalankan fungsinya. Tidak lebih, tidak kurang.',
      },
    ],
  },
  D: {
    letter: 'D',
    name: 'Denial of Service',
    color: '#2E7A56',
    bgColor: '#ECF5EE',
    borderColor: '#A5CDB5',
    icon: 'denial',
    tagline: 'Membuat Sistem Tidak Dapat Diakses',
    description: `Denial of Service adalah percobaan untuk membuat sistem menjadi unusable 
(tidak bisa digunakan) atau inaccessible (tidak bisa diakses) bagi pengguna yang sah. 
Target bisa berupa ketersediaan layanan, resource komputasi, atau alur bisnis.`,
    keywords: ['Rate Limiting', 'Availability', 'Resilience', 'Resource Management'],
    failPoints: [
      {
        title: 'No Rate Limiting',
        detail: 'Endpoint tidak membatasi jumlah request dalam periode waktu tertentu',
        icon: 'bolt',
      },
      {
        title: 'Logic Locking',
        detail: 'Logika bisnis yang bisa dieksploitasi untuk mencegah user lain melanjutkan flow',
        icon: 'lock-access',
      },
      {
        title: 'Application Vulnerability',
        detail: 'Bug atau kelemahan yang menyebabkan crash atau resource exhaustion',
        icon: 'bug',
      },
    ],
    examples: [
      {
        title: 'DDoS Attack',
        description: 'Membanjiri server dengan request dari banyak sumber untuk menghabiskan resource.',
        code: `// Attacker menggunakan botnet untuk flood endpoint
// 100.000 request/detik dari 10.000 IP berbeda
POST /api/transfer → Server CPU 100% → Service down
GET /api/login    → Memory exhausted → Error 503
// Legitimate users tidak bisa menggunakan aplikasi`,
      },
      {
        title: 'Logic Locking via Stored XSS',
        description: 'XSS yang disimpan di database merusak antarmuka untuk semua user.',
        code: `// Attacker menyimpan payload XSS di kolom "nama merchant"
Merchant name: <script>document.body.innerHTML=''</script>

// Semua user yang membuka halaman merchant list:
// → Halaman menjadi kosong/rusak
// → Tidak bisa mengakses fitur pembayaran
// → DoS via logic corruption, bukan volume attack`,
      },
      {
        title: 'Account Lockout Abuse',
        description: 'Memanfaatkan fitur lockout untuk mengunci akun user lain.',
        code: `// Attacker mengetahui username target: budi@email.com
// Sengaja salah password 5x untuk memicu lockout

POST /login { "username": "budi@email.com", "password": "wrong" } × 5
// Account Budi terkunci selama 24 jam
// Budi tidak bisa login — DoS pada level individu`,
      },
    ],
    quiz: [
      {
        question: 'Stored XSS yang merusak tampilan halaman dan mencegah semua user mengakses fitur tersebut masuk ke kategori STRIDE apa?',
        options: ['Tampering saja', 'Denial of Service saja', 'Tampering dan Denial of Service', 'Information Disclosure'],
        correct: 2,
        explanation: 'Ini adalah contoh yang masuk ke dua kategori: Tampering (memanipulasi konten/data yang ditampilkan) dan Denial of Service (mencegah user mengakses fitur). STRIDE tidak mutually exclusive.',
      },
      {
        question: 'Manakah yang merupakan mitigasi Denial of Service yang paling dasar?',
        options: ['Enkripsi semua data', 'Rate limiting & request throttling', 'Input validation', 'Audit logging'],
        correct: 1,
        explanation: 'Rate limiting membatasi jumlah request yang bisa dikirim dalam periode waktu tertentu, mencegah flood attack dan memastikan resource tersedia untuk pengguna yang sah.',
      },
      {
        question: 'Seorang attacker sengaja salah input password 10x untuk mengunci akun target. Ini termasuk?',
        options: ['Spoofing', 'Tampering', 'Denial of Service', 'Elevation of Privilege'],
        correct: 2,
        explanation: 'Mengunci akun user lain secara sengaja adalah Denial of Service — attacker mencegah user yang sah (target) untuk mengakses layanan (login ke akunnya sendiri).',
      },
    ],
  },
  E: {
    letter: 'E',
    name: 'Elevation of Privilege',
    color: '#5B28B8',
    bgColor: '#F1ECFE',
    borderColor: '#C5ADEE',
    icon: 'elevation',
    tagline: 'Eskalasi Hak Akses ke Level Lebih Tinggi',
    description: `Elevation of Privilege berkaitan dengan mendapatkan akses atau privilege yang 
lebih tinggi dari yang seharusnya dimiliki — terutama mendapatkan admin privileges. 
Mirip dengan Spoofing tapi fokus pada eskalasi level privilege, bukan sekedar bypass.`,
    keywords: ['Role-Based Access Control', 'Least Privilege', 'Authorization', 'Privilege Separation'],
    failPoints: [
      {
        title: 'App Vulnerability',
        detail: 'Kelemahan kode yang memungkinkan user memperoleh akses admin atau super user',
        icon: 'bug-off',
      },
      {
        title: 'Broken Access Control',
        detail: 'Otorisasi tidak divalidasi server-side, sehingga role bisa dimanipulasi',
        icon: 'user-off',
      },
    ],
    examples: [
      {
        title: 'JWT Role Manipulation',
        description: 'Mengubah field role di JWT payload untuk mendapatkan akses admin.',
        code: `// JWT Payload asli (user biasa):
{ "sub": "USR-0042", "role": "user", "exp": ... }

// User decode JWT (base64), ubah role, re-encode:
{ "sub": "USR-0042", "role": "admin", "exp": ... }

// Jika server tidak verify signature atau tidak cek role di DB:
GET /api/admin/users → 200 OK ← PRIVILEGE ESCALATION!
// Mendapat akses ke seluruh data 2 juta user`,
      },
      {
        title: 'SQL Injection untuk Ubah Role',
        description: 'SQL Injection digunakan untuk mengubah role user menjadi admin di database.',
        code: `// Exploit SQL injection di profile update
POST /api/profile/update
{ "name": "Budi'; UPDATE users SET role='admin' WHERE id='USR-0042'; --" }

// Jika tidak menggunakan parameterized query:
UPDATE users SET name='Budi', role='admin' WHERE id='USR-0042'
// User Budi sekarang memiliki role admin di database!`,
      },
    ],
    quiz: [
      {
        question: 'User memodifikasi JWT payload dari "role":"user" menjadi "role":"admin" dan berhasil mengakses admin dashboard. Ini adalah?',
        options: ['Spoofing', 'Tampering', 'Elevation of Privilege', 'Information Disclosure'],
        correct: 2,
        explanation: 'Ini adalah Elevation of Privilege. User mengeskalasi level aksesnya dari user biasa ke admin. Perbedaannya dengan Spoofing: EoP fokus pada peningkatan privilege level, bukan hanya bypass akses.',
      },
      {
        question: 'Di mana seharusnya validasi role/privilege dilakukan?',
        options: ['Hanya di frontend (JavaScript)', 'Hanya di middleware', 'Server-side pada setiap endpoint yang dilindungi', 'Cukup di database saja'],
        correct: 2,
        explanation: 'Validasi harus dilakukan server-side pada setiap endpoint yang dilindungi. Frontend validation bisa di-bypass, dan middleware saja tidak cukup jika ada endpoint yang terlewat.',
      },
      {
        question: 'Apa perbedaan utama antara Spoofing dan Elevation of Privilege?',
        options: ['Tidak ada perbedaan, keduanya sama', 'Spoofing adalah bypass autentikasi, EoP adalah peningkatan level privilege/role', 'EoP hanya terjadi di database, Spoofing hanya di API', 'Spoofing lebih berbahaya dari EoP'],
        correct: 1,
        explanation: 'Spoofing: bypass autentikasi atau berpura-pura menjadi user/entitas lain. EoP: secara aktif meningkatkan level privilege dari yang lebih rendah ke yang lebih tinggi (user → admin). Keduanya berkaitan tapi berbeda fokus.',
      },
    ],
  },
}

export type StrideCategory = keyof typeof strideData
