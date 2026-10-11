// English text for the cases and the field manual. ./index.ts holds the
// Indonesian originals and the structure (ids, answers, colours); this file
// only overrides strings, matched by position.

export const scenariosEn = [
  {
    description: 'API endpoint that returns a user\'s transaction history.',
    context: `PayVault's "Transaction History" feature relies on an API endpoint that takes a transaction ID from the client.
The backend uses that ID directly to query the database, with no session-based authorisation check on the resource itself.`,
    details: [
      'The endpoint takes transaction_id straight from the path or query',
      'There is no authorisation check on the resource (BOLA/IDOR)',
      'The response returns the whole transaction object, including PII',
      'One generic endpoint serves several different screens',
    ],
    systemInfo: [{ note: 'TXN-99182 belongs to a different user than the one in the session' }],
    groundTruth: [
      { explanation: 'With no authorisation check on the object, a user can change the transaction ID and read another user\'s history. It is horizontal privilege escalation by asking for someone else\'s record.' },
      { explanation: 'The API returns far more than the screen needs, including sensitive PII such as the national ID number, origin IP and device ID. That breaks the data-minimisation principle.' },
    ],
    hints: ['Check whether a valid token also has to own TXN-99182', 'Look at everything that comes back in the response body'],
  },
  {
    description: 'Login with an SMS one-time password.',
    context: `PayVault signs users in with a one-time password (OTP) sent by SMS.
The code is 6 digits and stays valid for 10 minutes.
Rate limiting on the verification step has not been implemented.`,
    details: [
      'The OTP is only 6 digits (1,000,000 combinations)',
      'There is no rate limiting on the verification endpoint',
      'Accounts are never locked after repeated failures',
      'A new session token is issued without invalidating the previous one',
      'Every failure returns the same generic error, "Kode OTP salah"',
    ],
    systemInfo: [{
      response: `// Failure: { "error": "Kode OTP salah" }
// Success: { "token": "eyJ...", "user_id": "USR-0042" }`,
      note: 'No X-RateLimit header, and the account is never suspended after N failures',
    }],
    groundTruth: [
      { explanation: 'With no lockout and no rate limit, the OTP can be brute-forced. An outsider can walk the whole code space and take over the account.' },
      { explanation: 'With no limit on requests to `/verify-otp`, the endpoint can be flooded until the authentication service stops answering real users.' },
    ],
    hints: ['Work out the odds of guessing a 6-digit code', 'What happens when a failed attempt costs nothing?'],
  },
  {
    description: 'Transferring money between PayVault users.',
    context: `A transfer takes its amount from the client.
The backend processes it without any sanity check
on the \`amount\` field before debiting and crediting.`,
    details: [
      'The amount is sent as a field in the request body',
      'The backend moves money on the client\'s say-so, with no arithmetic check',
      'Nothing on the server confirms the type or the valid range of the amount',
      'The audit log stores only the outcome, not the request that caused it',
    ],
    systemInfo: [{ note: 'A negative amount (-500000) breaks the double-entry logic' }],
    groundTruth: [
      { explanation: 'With no boundary validation on the server, a negative number is accepted. The sender\'s balance goes up instead of down: a reverse transfer.' },
      { explanation: 'The audit trail does not keep the raw request. That makes non-repudiation and forensics very hard once someone exploits it.' },
    ],
    hints: ['Look at the amount field in the request', 'What does the arithmetic do with a negative number?'],
  },
  {
    title: 'Unprotected Admin Dashboard',
    description: 'PayVault\'s operations dashboard for managing users.',
    context: `Access to the \`/admin\` panel goes through central authentication based on JSON Web Tokens (JWT).
The same signing scheme is used for ordinary users and internal staff.
Authorisation depends entirely on the "role" field carried inside the token.`,
    details: [
      'The "role" field is carried in the JWT claims ("role": "user" or "admin")',
      'Access control is enforced only in the frontend (client-side routing)',
      'Admin endpoints on the backend do not check the role for themselves',
      'Production still accepts the default credentials ("admin/admin123")',
      'There is no monitoring or audit log on the admin endpoints',
    ],
    systemInfo: [{
      request: `// Ordinary JWT claims:
{
  "sub": "USR-0042",
  "role": "user",
  "exp": 1705320000
}

// Edited JWT claims:
{
  "sub": "USR-0042",
  "role": "admin",
  "exp": 1705320000
}`,
      response: `// It works (no server-side authorisation):
{
  "users": [...],  // everything, exposed
  "total": 2100000
}`,
      note: 'The backend checks the token signature but never checks what the claim allows',
    }],
    groundTruth: [
      { explanation: 'Because the server does not check authorisation, anyone can edit the JWT claim and escalate vertically to admin.' },
      { explanation: 'With no audit trail on the admin panel, an intrusion cannot be detected early or traced afterwards.' },
      { explanation: 'Default credentials left in place give direct access and make every other control pointless.' },
    ],
    hints: ['Which layer actually checks privileges?', 'What can someone do if the token\'s claims can be changed?'],
  },
  {
    description: 'Downloading payment receipts from PayVault.',
    context: `Receipt downloads are served from separate cloud storage.
Object URLs follow a predictable pattern.
The bucket is publicly readable, with no access control list.`,
    details: [
      'Document paths use the date and a sequential ID, so they are easy to predict',
      'Sensitive files sit in a public bucket that needs no token',
      'Nothing checks who owns a document when it is downloaded',
      'The URL format invites directory enumeration',
      'The bucket keeps no access log',
    ],
    systemInfo: [{
      note: 'URL format: https://storage.payvault.id/receipts/2024-01-15/TXN-99182.pdf',
      request: `// Unauthenticated enumeration:
GET https://storage.payvault.id/receipts/2024-01-15/TXN-90001.pdf
GET https://storage.payvault.id/receipts/2024-01-15/TXN-90002.pdf
... (and so on, in order)`,
      response: `HTTP 200 OK
Content-Type: application/pdf
// The document shows the name, amount, bank account and time`,
    }],
    groundTruth: [
      { explanation: 'Objects are not protected by any real access control. Predictable names make it trivial to scrape every receipt in bulk.' },
      { explanation: 'With no access telemetry on a public resource, mass downloading cannot be noticed while it happens.' },
    ],
    hints: ['Is the URL random, or easy to guess?', 'What is the least a confidential document should require before it is handed over?'],
  },
]

export const strideEn = {
  S: {
    tagline: 'Faked identity and access',
    description: 'Spoofing is about faking an identity to get past limits on what a user may do. For example: a user with access to A gets access to B through Z, reads another user\'s information, or bypasses authentication.',
    failPoints: [
      { detail: 'Documents, images, files reached through an unprotected path or URI' },
      { detail: 'REST, GraphQL, WebSocket: endpoints that never check who owns the resource' },
      { detail: 'Parameters or queries that reach another user\'s data (IDOR)' },
      { detail: 'Brute force, user enumeration, session spoofing, phishing redirects' },
    ],
    examples: [
      { description: 'Faking an IP address to get past an IP allow-list.',
        code: `// The attacker adds fake headers to get past the IP restriction
X-Forwarded-For: 192.168.1.1  // an allow-listed internal IP
X-Real-IP: 10.0.0.1` },
      { description: 'Changing an ID in the API or URL to read another user\'s data.',
        code: `// User A reads their own data
GET /api/transactions/TXN-001  ✓

// User A changes the ID → reads User B's data
GET /api/transactions/TXN-002  ← IDOR!
// Nothing checks the session against the owner` },
      { description: 'With no rate limit, a 6-digit OTP can be brute-forced in minutes.',
        code: `// 1,000,000 combinations, no rate limit = account takeover
for otp in range(000000, 999999):
    response = POST /verify-otp { "otp": otp }
    if response.status == 200:
        print("Account taken over!")` },
    ],
    quiz: [
      { question: 'A user changes the number in a URL from /invoice/1001 to /invoice/1002 and sees another user\'s invoice. This is an example of?',
        explanation: 'IDOR happens when a system does not check that the person asking for a resource owns it. Changing an ID in the URL to reach someone else\'s data is the textbook case.' },
      { question: 'Which of these is NOT a spoofing threat?',
        options: ['Brute-forcing an OTP to take over an account', 'A predictable session token', 'SQL injection on the login form', 'IP address spoofing to get past an allow-list'],
        explanation: 'SQL injection is tampering (manipulating input or a query), not spoofing. Spoofing is about faking identity and getting past access control.' },
      { question: 'Which keywords fit spoofing best?',
        explanation: 'Spoofing is tied to authentication and access control: how a system verifies who a user is and limits what they may do.' },
    ],
  },
  T: {
    tagline: 'Changed data and behaviour',
    description: 'Tampering is about changing or corrupting data or a system, in its outcome or its behaviour. It targets integrity, from form input to traffic between systems.',
    failPoints: [
      { detail: 'No server-side validation of input from users or other systems' },
      { detail: 'Dangerous characters are not cleaned out before input is processed' },
      { detail: 'No checksum, hash or digital signature to verify integrity' },
    ],
    examples: [
      { description: 'Input is not sanitised, so a dangerous SQL query can be injected.',
        code: `// The input field is not sanitised
username = "admin' OR '1'='1' --"
password = "anything"

// The query that results:
SELECT * FROM users
WHERE username = 'admin' OR '1'='1' --' AND password = 'anything'
// '1'='1' is always true → logged in with no password!` },
      { description: 'Changing URL or body parameters for an illegal gain.',
        code: `// Normal checkout request
POST /checkout
{ "cart_id": "CART-001", "discount_code": "DISC10" }

// Manipulated request
POST /checkout
{ "cart_id": "CART-001", "price_override": 1, "discount": 99 }
// If the backend does not re-check: pay Rp1 for a Rp1,000,000 product!` },
      { description: 'A negative value in the amount field reverses the direction of a transfer.',
        code: `// Normal transfer
POST /transfer { "amount": 100000, "to": "USR-002" }
// Debit 100,000 from the sender → credit 100,000 to the receiver

// Manipulated
POST /transfer { "amount": -100000, "to": "USR-002" }
// Credit 100,000 to the sender ← FREE MONEY!` },
    ],
    quiz: [
      { question: 'An attacker types \'; DROP TABLE users; -- into a login form. This is an example of?',
        explanation: 'This is SQL injection, a kind of tampering. The attacker manipulates the database query through unsanitised input to change what the system does.' },
      { question: 'Which countermeasure best prevents tampering through input?',
        options: ['Encrypting data in the database', 'Server-side input validation and parameterised queries', 'Rate limiting on the endpoint', 'Logging every user action'],
        explanation: 'Server-side validation and parameterised queries are the first line of defence against tampering. Client-side validation alone can be bypassed.' },
      { question: 'amount: -500000 is sent to the transfer API and the sender\'s balance goes up. Which STRIDE category is this?',
        explanation: 'This is tampering: manipulating an input value (amount) to change how the financial system behaves. The backend does not check that the amount is positive.' },
    ],
  },
  R: {
    tagline: 'Actions that leave no trace',
    description: 'Repudiation is about illegal activity or attacks that happen without the system keeping a log strong enough to prove them. A good system can always answer: who did what, when, and from where?',
    failPoints: [
      { detail: 'No structured, trustworthy record of what users do' },
      { detail: 'System events, errors and anomalies are not recorded in enough detail' },
      { detail: 'No digital signature to prove a transaction is genuine and cannot be denied' },
      { detail: 'Timestamps are inaccurate, easy to manipulate, or stored badly' },
    ],
    examples: [
      { title: 'Admin activity with no audit trail',
        description: 'Actions in the admin panel are not recorded, so abuse cannot be proved.',
        code: `// What SHOULD be recorded:
{
  "timestamp": "2024-01-15T10:30:00Z",
  "actor": "admin@payvault.id",
  "action": "DELETE_USER",
  "target": "USR-0042",
  "ip": "192.168.1.101",
  "result": "SUCCESS"
}

// What happened: no log at all
// An attacker deletes 10,000 accounts → nobody can prove who did it` },
      { title: 'Transfer with no digital signature',
        description: 'A user says they never made a transfer, and there is no signature to show otherwise.',
        code: `// Without a digital signature:
User: "I never sent that Rp5 million!"
System: "Our log shows the transfer came from your IP"
User: "An IP can be faked! Where is the proof that I agreed?"
// The system cannot prove consent → the dispute cannot be settled` },
    ],
    quiz: [
      { question: 'A user makes an illegal transfer, then claims "It wasn\'t me." The system has no detailed log of the transaction. This is a problem of?',
        explanation: 'Repudiation happens when a system cannot prove that an action was taken by a particular party. Without a strong audit log, "it wasn\'t me" cannot be disproved.' },
      { question: 'What is most effective against repudiation in financial transactions?',
        options: ['Rate limiting', 'Digital signature plus an immutable audit log', 'Input validation', 'Database encryption'],
        explanation: 'A digital signature proves the user explicitly approved the transaction, and an immutable audit log makes sure the evidence cannot be changed or deleted.' },
      { question: 'What must always be recorded in an audit log for sensitive transactions?',
        options: ['Only success or failure', 'Actor, action, target, timestamp, IP and result', 'Only the error message', 'Only the time of the transaction'],
        explanation: 'A good audit log answers who (actor), what (action and target), when (timestamp), where (IP or device) and how it ended (result). Partial information is not enough for non-repudiation.' },
    ],
  },
  I: {
    tagline: 'Sensitive data leaking out',
    description: 'Information disclosure is about confidential data leaking or being shown to someone with no right to see it. The guiding principle is least privilege: give out only the data that is really needed.',
    failPoints: [
      { detail: 'Outdated encryption algorithms, or encryption implemented wrongly' },
      { detail: 'An API returns more data than is needed (typical of REST APIs)' },
      { detail: 'Sensitive data can be reached by a role that should not have it' },
      { detail: 'The server shows technical details, stack traces or default configuration it has no need to show' },
    ],
    examples: [
      { title: 'Excessive data exposure in an API',
        description: 'One API reused across features returns far too much.',
        code: `// "Check balance" uses the same endpoint as "Full profile"
GET /api/user/profile

// What comes back (too much for a balance check):
{
  "name": "Budi Santoso",
  "balance": 5000000,
  "nik": "3271234567890001",  ← NOT NEEDED to check a balance
  "full_address": "Jl. Merdeka No.1, Jakarta",  ← NOT NEEDED
  "credit_score": 720,  ← VERY SENSITIVE
  "linked_bank_accounts": [...]  ← NOT NEEDED
}` },
      { title: 'Default server configuration exposed',
        description: 'A server\'s default page gives away sensitive technical information.',
        code: `// Opening the domain with no path
GET https://api.payvault.id/

// The default page answers:
{
  "server": "Apache/2.4.51 (Ubuntu)",
  "php_version": "7.4.3",
  "environment": "production",
  "db_host": "postgres://internal.db:5432",
  "debug": true
}
// The attacker now has a full map of the infrastructure!` },
    ],
    quiz: [
      { question: 'The API behind a "Friends list" returns every friend\'s name, photo, national ID and bank account number. The ID and account number are not needed for the feature. This is?',
        options: ['Spoofing', 'Tampering', 'Information disclosure: excessive data exposure', 'Denial of service'],
        explanation: 'This is information disclosure in the excessive-data-exposure pattern. Least privilege applies: an API should return only what the feature really needs.' },
      { question: 'Which of these is a dangerous default configuration?',
        options: ['Rate limiting switched on by default', 'Error stack traces shown to users in production', 'HTTPS switched on by default', 'Passwords hashed before they are stored'],
        explanation: 'A stack trace in production gives an attacker implementation details: library versions, file paths and logic they can exploit.' },
      { question: 'Which principle is the main answer to information disclosure?',
        explanation: 'Least privilege: every part of a system (user, API, service) gets only the minimum access it needs to do its job. No more, no less.' },
    ],
  },
  D: {
    tagline: 'Making a system unreachable',
    description: 'Denial of service is an attempt to make a system unusable or unreachable for its legitimate users. The target can be availability, computing resources or a business flow.',
    failPoints: [
      { detail: 'An endpoint does not limit how many requests it takes in a given time' },
      { detail: 'Business logic that can be abused to stop other users finishing a flow' },
      { detail: 'A bug or weakness that causes a crash or exhausts resources' },
    ],
    examples: [
      { title: 'DDoS attack',
        description: 'Flooding a server with requests from many sources until its resources run out.',
        code: `// The attacker uses a botnet to flood an endpoint
// 100,000 requests a second from 10,000 different IPs
POST /api/transfer → server CPU 100% → service down
GET /api/login    → memory exhausted → Error 503
// Legitimate users cannot use the app` },
      { title: 'Logic locking through stored XSS',
        description: 'XSS stored in the database breaks the interface for every user.',
        code: `// The attacker stores an XSS payload in the "merchant name" field
Merchant name: <script>document.body.innerHTML=''</script>

// Every user who opens the merchant list:
// → the page goes blank
// → they cannot reach the payment feature
// → denial of service through corrupted logic, not volume` },
      { title: 'Account lockout abuse',
        description: 'Using the lockout feature to lock another user out.',
        code: `// The attacker knows the target's username: budi@email.com
// They deliberately get the password wrong 5 times to trigger lockout

POST /login { "username": "budi@email.com", "password": "wrong" } × 5
// Budi's account is locked for 24 hours
// Budi cannot log in: denial of service against one person` },
    ],
    quiz: [
      { question: 'Stored XSS that breaks a page and stops every user reaching a feature falls under which STRIDE category?',
        options: ['Tampering only', 'Denial of service only', 'Tampering and denial of service', 'Information disclosure'],
        explanation: 'It belongs to two categories: tampering (changing the content shown) and denial of service (stopping users reaching the feature). STRIDE categories are not mutually exclusive.' },
      { question: 'Which is the most basic mitigation for denial of service?',
        options: ['Encrypting all data', 'Rate limiting and request throttling', 'Input validation', 'Audit logging'],
        explanation: 'Rate limiting caps how many requests can be sent in a given time, which stops floods and keeps resources free for legitimate users.' },
      { question: 'An attacker deliberately enters the wrong password 10 times to lock a target\'s account. This is?',
        explanation: 'Deliberately locking someone else\'s account is denial of service: the attacker stops the legitimate user reaching the service.' },
    ],
  },
  E: {
    tagline: 'Climbing to a higher level of access',
    description: 'Elevation of privilege is about gaining more access than you should have, above all admin rights. It resembles spoofing but is about climbing privilege levels, not just getting past a check.',
    failPoints: [
      { detail: 'A code weakness that lets a user gain admin or super-user access' },
      { detail: 'Authorisation is not checked on the server, so a role can be manipulated' },
    ],
    examples: [
      { description: 'Changing the role field in a JWT payload to gain admin access.',
        code: `// Original JWT payload (ordinary user):
{ "sub": "USR-0042", "role": "user", "exp": ... }

// The user decodes the JWT (base64), changes the role, re-encodes:
{ "sub": "USR-0042", "role": "admin", "exp": ... }

// If the server does not verify the signature or check the role in the DB:
GET /api/admin/users → 200 OK ← PRIVILEGE ESCALATION!
// Access to all the data of 2 million users` },
      { title: 'SQL injection to change a role',
        description: 'SQL injection used to turn a user into an admin in the database.',
        code: `// SQL injection in the profile update
POST /api/profile/update
{ "name": "Budi'; UPDATE users SET role='admin' WHERE id='USR-0042'; --" }

// Without a parameterised query:
UPDATE users SET name='Budi', role='admin' WHERE id='USR-0042'
// Budi now has the admin role in the database!` },
    ],
    quiz: [
      { question: 'A user changes a JWT payload from "role":"user" to "role":"admin" and reaches the admin dashboard. This is?',
        explanation: 'This is elevation of privilege. The user raises their access from ordinary user to admin. Unlike spoofing, it is about climbing privilege levels, not just getting in.' },
      { question: 'Where should a role or privilege be checked?',
        options: ['Only in the frontend (JavaScript)', 'Only in middleware', 'On the server, at every protected endpoint', 'In the database alone'],
        explanation: 'It must be checked on the server at every protected endpoint. Frontend checks can be bypassed, and middleware alone is not enough if one endpoint is missed.' },
      { question: 'What is the main difference between spoofing and elevation of privilege?',
        options: ['There is none', 'Spoofing bypasses authentication; elevation of privilege raises the privilege level or role', 'Elevation only happens in databases, spoofing only in APIs', 'Spoofing is more dangerous'],
        explanation: 'Spoofing: bypassing authentication or pretending to be another user or entity. Elevation of privilege: actively climbing from a lower level to a higher one (user to admin). They are related but have a different focus.' },
    ],
  },
}
