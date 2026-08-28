import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import @oai/artifact-tool from Bank of Mahesh node_modules
import { SpreadsheetFile, Workbook } from 'file:///D:/Bank%20of%20Mahesh/outputs/security-lab-matrix/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const outputDir = 'D:/Mahesh Fitness Center/outputs/security-lab-matrix';

const rows = [
  // EASY TIER (5 Flaws)
  [
    'Missing HTTPS',
    'Easy',
    'A05:2021 Security Misconfiguration',
    '1. Connect to http://localhost:3000 in browser or curl.\n2. Inspect network traffic and transport protocol.\n3. Verify HTTP plain text transmission without SSL/TLS certificates.',
    'Cleartext credential interception on network\nMan-in-the-Middle (MitM) session hijacking\nData tampering in transit',
    'Enforce HTTPS/TLS encryption with SSL certificates\nRedirect HTTP traffic to HTTPS (301 Moved Permanently)\nImplement HTTP Strict Transport Security (HSTS) headers'
  ],
  [
    'Reflected XSS',
    'Easy',
    'A03:2021 Injection',
    '1. Visit /app/classes?search=<img src=x onerror=alert(1)> in browser.\n2. Observe search query banner above class filter controls.\n3. Verify dangerouslySetInnerHTML renders unsanitized query and executes script.',
    'Session token theft via localStorage/cookies\nDOM manipulation and phishing overlays\nUnauthorized class cancellations in victim session',
    'Contextual output encoding (use React JSX {search})\nStrict Content Security Policy (CSP)\nInput sanitization via DOMPurify'
  ],
  [
    'No rate limiting',
    'Easy',
    'A04:2021 Insecure Design',
    '1. Send >15 rapid POST /api/auth/login or /signup requests.\n2. Inspect response HTTP status codes in Dev Tools / Postman.\n3. Verify requests process without 429 Too Many Requests status code.',
    'Automated credential stuffing & password spraying\nHigh CPU load from bcrypt hashing\nNoisy monitoring and logs',
    'Implement express-rate-limit middleware on auth routes\nPer-IP and per-account request rate caps\nAlert on anomalous request volume spikes'
  ],
  [
    'Unlimited login attempts',
    'Easy',
    'A07:2021 Identification & Auth Failures',
    '1. Submit 20 consecutive POST /api/auth/login requests with invalid passwords.\n2. Verify server returns 401 continuously without account lockout or progressive delay.',
    'Increased success rate of brute-force password guessing\nAccount takeover of weak passwords\nServer resource consumption',
    'Account lockout policy after 5 consecutive failed logins\nProgressive response delay on failed attempts\nCAPTCHA verification on high frequency'
  ],
  [
    'Open CORS policy & exposed headers',
    'Easy',
    'A05:2021 Security Misconfiguration',
    '1. Send curl -I http://localhost:3000/api/system/info.\n2. Inspect response HTTP headers.\n3. Verify Access-Control-Allow-Origin: * and X-Powered-By: Express are exposed.',
    'Cross-origin data leakage to arbitrary web origins\nBackend tech stack fingerprinting\nTargeted exploit selection for Express/Node',
    'Restrict CORS origin strictly to trusted domains\nDisable X-Powered-By header via app.disable()\nMount Helmet security headers middleware'
  ],

  // MEDIUM TIER (5 Flaws)
  [
    'Missing authorization checks',
    'Medium',
    'A01:2021 Broken Access Control',
    '1. Issue unauthenticated GET /api/system/export or GET /api/membership/payments/:id.\n2. Inspect API response payload.\n3. Verify raw user records, audit logs, and payments are returned without authentication.',
    'Unauthorized administrative data export\nPrivacy breaches and regulatory incidents\nFull database disclosure to unauthenticated users',
    'Enforce requireAuth middleware across all sensitive endpoints\nServer-side authorization policies\nDeny by default endpoint permissions'
  ],
  [
    'Horizontal privilege escalation (IDOR)',
    'Medium',
    'A01:2021 Broken Access Control',
    '1. Log in as Member 1 (member@amrfitness.local, kmc-143).\n2. Submit GET /api/member/profile?memberId=kmc-144 or PUT /api/member/profile?memberId=kmc-144.\n3. Verify API returns Member kmc-144\'s private data and updates profile without ownership check.',
    'Unauthorized exposure of private workout and health data\nPotential alteration of target member profiles/bookings\nViolation of data privacy regulations',
    'Strict server-side identity binding (req.user.id)\nValidate requested_member_id === session_member_id\nDeny by default authorization policies'
  ],
  [
    'Sensitive data exposure (Hash leak)',
    'Medium',
    'A02:2021 Cryptographic Failures',
    '1. Issue GET /api/auth/me or GET /api/admin/members.\n2. Inspect JSON response payload under data.user.\n3. Verify passwordHash (bcrypt) and md5Hash fields are returned in plain JSON text.',
    'Offline password hash cracking via dictionary attacks\nCredential reuse risk across secondary platforms\nDirect violation of credential security standards',
    'DTO sanitization omitting passwordHash and md5Hash\nApply user field masking middleware (sanitizeUser)\nResponse schema validation excluding secrets'
  ],
  [
    'Insecure password reset flow',
    'Medium',
    'A07:2021 Identification & Auth Failures',
    '1. Submit POST /api/auth/reset-password with {"email":"admin@amrfitness.local","newPassword":"HackedAdmin@123"}.\n2. Inspect response message.\n3. Verify target account password is reset instantly without token or OTP.',
    'Trivial account takeover of any user by email\nImmediate compromise of lead administrator accounts\nUnauthorized profile modifications and data loss',
    'Time-limited cryptographic reset tokens via email\nMulti-factor authentication (MFA) or current password check\nInstant email alert on password reset'
  ],
  [
    'Verbose error messages & stack trace leakage',
    'Medium',
    'A05:2021 Security Misconfiguration',
    '1. Send request to GET /api/system/debug/error or click System Diagnostics in footer.\n2. Inspect API response HTTP status (500 Internal Server Error) and JSON payload.\n3. Verify server leaks raw Node.js stack traces, file system paths, and internal error codes.',
    'System internal file path and environment disclosure\nFacilitates precise targeted exploit payload creation\nExposes internal application architecture to attackers',
    'Generic error responses in production environments\nLog detailed stack traces to secure server-side logging systems\nDisable verbose error middleware in production builds'
  ],

  // HARD TIER (5 Flaws)
  [
    'Hardcoded secret in client bundle',
    'Hard',
    'A05:2021 Security Misconfiguration',
    '1. Open browser DevTools (F12) -> Sources tab or inspect loaded JS bundle (assets/index-*.js) in Burp Suite.\n2. Search JS assets for API key references to find AMR_SECRET_MASTER_API_KEY_2026_V1.\n3. Send HTTP request to GET /api/admin/dashboard with header "x-admin-key: AMR_SECRET_MASTER_API_KEY_2026_V1".\n4. Verify backend grants full administrative privileges without authenticating.',
    'Complete administrative takeover of the application\nBypasses standard authentication and session controls\nPermanent backdoor exposure while secret exists in client build assets',
    'Never embed administrative API keys or master secrets in client-side code\nImplement strict server-side authentication and session authorization\nEnforce automated secret scanning (GitGuardian/TruffleHog) in build pipelines'
  ],
  [
    'Subscription tier price bypass',
    'Hard',
    'A04:2021 Insecure Design',
    '1. Log in as member and choose Elite tier (PLAN-10003).\n2. Intercept POST /api/membership/subscribe request payload.\n3. Inject {"planId":"PLAN-10003","pricePaise":0,"status":"active"}.\n4. Verify backend activates Elite plan for ₹0 charged.',
    'Financial fraud by bypassing subscription payment gates\nDirect loss of business revenue\nCorrupted payment ledgers and accounting records',
    'Server-side price lookup based on planId\nNever trust client-supplied prices or statuses\nValidate payment gateway signatures/webhooks'
  ],
  [
    'Predictable reset tokens',
    'Hard',
    'A07:2021 Identification & Auth Failures',
    '1. Submit POST /api/auth/forgot-password with target email.\n2. Intercept response to observe resetToken: MD5(email).\n3. Submit POST /api/auth/reset-password-with-token using token MD5(target_email).\n4. Verify target account password is reset via forged token.',
    'Unauthorized password reset for arbitrary accounts\nAdmin account takeover via forged reset tokens\nComplete auth control collapse',
    'Cryptographically secure pseudo-random generators (CSPRNG)\nStore hashed high-entropy reset tokens server-side\nEnforce short expiration TTL (15 minutes)'
  ],
  [
    'Vertical privilege escalation (Role mass assignment)',
    'Hard',
    'A01:2021 Broken Access Control',
    '1. Log in as standard member (member@amrfitness.local).\n2. Submit PUT /api/member/profile or POST /api/auth/signup with payload {"role":"admin"} or {"role":"trainer"}.\n3. Query GET /api/auth/me.\n4. Verify account role is upgraded to admin or trainer.',
    'Standard member escalates privilege to admin or trainer\nUnauthorized management of plans, trainers, and members\nCompromise of administrative audit trail',
    'Strict Request DTO field allowlisting (exclude role)\nRestrict role updates to dedicated admin endpoints\nSeparate internal model properties from public input'
  ],
  [
    'Weak credential hashing (Legacy MD5)',
    'Hard',
    'A02:2021 Cryptographic Failures',
    '1. Extract md5Hash field (e10adc3949ba59abbe56e057f20f883e) from API response.\n2. Supply digest to Hashcat / John / online lookup.\n3. Verify digest cracks to plain-text string "123456" in milliseconds.',
    'Instant offline password cracking via dictionary attacks\nWidespread user account compromise\nFailure to comply with modern cryptographic standards',
    'Use salted bcrypt (cost >= 10) or Argon2id\nDeprecate legacy MD5 algorithms entirely\nAutomatic re-hashing of legacy passwords on login'
  ]
];

const testDataRows = [
  ['Account Type', 'Email Address', 'Password', 'Member ID / Role', 'Notes / Context'],
  ['Admin Account', 'admin@amrfitness.local', 'AMR#Fitness$2026!AdminKey', 'Role: admin', 'Primary lead administrator account'],
  ['Primary Member', 'member@amrfitness.local', 'Member@12345', 'kmc-143 / role: member', 'Primary student member test account'],
  ['Secondary Member', 'priya.s@example.com', 'Fitness@123', 'kmc-144 / role: member', 'Target member for IDOR testing'],
  ['Tertiary Member', 'ananya.v@example.com', 'Fitness@123', 'kmc-145 / role: member', 'Target member for IDOR testing'],
  ['', '', '', '', ''],
  ['Payment Category', 'Field Name', 'Sample Test Value', 'Format / Type', 'Usage Notes'],
  ['Credit / Debit Card', 'Cardholder Name', 'Rahul Sharma', 'Text', 'Cardholder name input'],
  ['Credit / Debit Card', 'Card Number', '4532 8912 3456 7890', '16-digit formatted', 'Simulated Visa/Mastercard'],
  ['Credit / Debit Card', 'Expiry Date', '12/28', 'MM/YY', 'Future expiration date'],
  ['Credit / Debit Card', 'CVV Code', '888', '3 digits', 'Security code'],
  ['UPI / Mobile', 'Virtual Payment Address', 'rahul@okicici', 'VPA string', 'Sample ICICI UPI ID'],
  ['UPI / Mobile', 'Secondary VPA', 'member@paytm', 'VPA string', 'Sample Paytm UPI ID'],
  ['Net Banking', 'Primary Bank Name', 'HDFC Bank NetBanking', 'Select Option', 'HDFC Bank option'],
  ['Net Banking', 'Customer ID', 'HDFC_USER_9941', 'Text ID', 'Customer User ID'],
  ['', '', '', '', ''],
  ['Vulnerability Vectors', 'Parameter / Header', 'Sample Exploit Payload', 'Target Endpoint', 'Expected Result'],
  ['Hardcoded Master Key', 'x-admin-key header', 'AMR_SECRET_MASTER_API_KEY_2026_V1', 'GET /api/admin/dashboard', 'Bypasses auth; grants admin session'],
  ['IDOR Profile Access', 'memberId query param', 'kmc-144', 'GET /api/member/profile?memberId=kmc-144', 'Returns target member private profile'],
  ['IDOR Profile Edit', 'memberId parameter', 'kmc-144', 'PUT /api/member/profile?memberId=kmc-144', 'Updates target member profile details'],
  ['Predictable Reset Token', 'resetToken parameter', 'MD5(target_email)', 'POST /api/auth/reset-password-with-token', 'Resets target user password via forged token'],
  ['Subscription Price Bypass', 'pricePaise body param', '0', 'POST /api/membership/subscribe', 'Activates Elite plan for ₹0 charged'],
  ['Mass Assignment Role', 'role body param', 'admin', 'PUT /api/member/profile', 'Escalates member role to admin']
];

async function buildMatrix() {
  const workbook = Workbook.create();
  
  // Sheet 1: Vulnerability Matrix
  const sheet = workbook.worksheets.add('Vulnerability Matrix');
  sheet.showGridLines = false;

  // Title Block
  sheet.mergeCells('A1:F1');
  sheet.getRange('A1').values = [['AMR Fitness — Security Vulnerability Matrix']];
  sheet.getRange('A2:F2').merge();
  sheet.getRange('A2').values = [['Local CTF training reference only — do not deploy these vulnerabilities outside an isolated lab.']];

  // Table Headers
  sheet.getRange('A4:F4').values = [['Vulnerability / Issue', 'Difficulty', 'OWASP Category', 'Verification Steps', 'Business / Security Impacts', 'Defensive Remediation']];
  
  // Data Rows
  sheet.getRange(`A5:F${rows.length + 4}`).values = rows;

  // Formatting & Styles
  sheet.getRange('A1:F1').format = { fill: '#0F172A', font: { bold: true, color: '#FFFFFF', size: 16 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
  sheet.getRange('A2:F2').format = { fill: '#FDE68A', font: { italic: true, color: '#713F12' }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true };
  sheet.getRange('A4:F4').format = { fill: '#0F766E', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true };
  sheet.getRange(`A5:F${rows.length + 4}`).format = { verticalAlignment: 'top', wrapText: true, borders: { preset: 'inside', style: 'thin', color: '#CBD5E1' } };
  sheet.getRange(`A5:A${rows.length + 4}`).format.font = { bold: true, color: '#0F172A' };
  sheet.getRange(`B5:B${rows.length + 4}`).format.horizontalAlignment = 'center';
  sheet.getRange(`A5:F${rows.length + 4}`).format.rowHeight = 76;
  
  // Column Widths
  sheet.getRange('A:A').format.columnWidth = 28;
  sheet.getRange('B:B').format.columnWidth = 12;
  sheet.getRange('C:C').format.columnWidth = 32;
  sheet.getRange('D:D').format.columnWidth = 55;
  sheet.getRange('E:E').format.columnWidth = 34;
  sheet.getRange('F:F').format.columnWidth = 38;

  // Row Heights
  sheet.getRange('A1:F1').format.rowHeight = 30;
  sheet.getRange('A2:F2').format.rowHeight = 30;
  sheet.getRange('A4:F4').format.rowHeight = 35;
  sheet.freezePanes.freezeRows(4);

  // Conditional Formats for Difficulty Badges
  sheet.getRange(`B5:B${rows.length + 4}`).conditionalFormats.add('containsText', { text: 'Easy', format: { fill: '#DCFCE7', font: { color: '#166534', bold: true } } });
  sheet.getRange(`B5:B${rows.length + 4}`).conditionalFormats.add('containsText', { text: 'Medium', format: { fill: '#FEF3C7', font: { color: '#92400E', bold: true } } });
  sheet.getRange(`B5:B${rows.length + 4}`).conditionalFormats.add('containsText', { text: 'Hard', format: { fill: '#FEE2E2', font: { color: '#991B1B', bold: true } } });

  // Instructor Reset Callout Footer
  const footerRowIndex = rows.length + 6;
  const footerRange = `A${footerRowIndex}:F${footerRowIndex}`;
  sheet.getRange(footerRange).merge();
  sheet.getRange(`A${footerRowIndex}`).values = [['Instructor reset checklist: keep the lab isolated; use only disposable data; remove /api/lab and restore security controls before reuse.']];
  sheet.getRange(footerRange).format = { fill: '#E2E8F0', font: { italic: true, color: '#334155' }, wrapText: true, verticalAlignment: 'center' };
  sheet.getRange(footerRange).format.rowHeight = 32;

  // Sheet 2: Sample Test Data
  const sheet2 = workbook.worksheets.add('Sample Test Data');
  sheet2.showGridLines = true;

  sheet2.mergeCells('A1:E1');
  sheet2.getRange('A1').values = [['AMR Fitness — Sample Working Test Data & Exploit Vectors']];
  sheet2.getRange('A1:E1').format = { fill: '#0F172A', font: { bold: true, color: '#FFFFFF', size: 14 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
  sheet2.getRange('A1:E1').format.rowHeight = 28;

  sheet2.getRange(`A3:E${testDataRows.length + 2}`).values = testDataRows;
  sheet2.getRange(`A3:E3`).format = { fill: '#0F766E', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center' };
  sheet2.getRange(`A9:E9`).format = { fill: '#0F766E', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center' };
  sheet2.getRange(`A18:E18`).format = { fill: '#0F766E', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center' };

  sheet2.getRange('A:A').format.columnWidth = 25;
  sheet2.getRange('B:B').format.columnWidth = 28;
  sheet2.getRange('C:C').format.columnWidth = 35;
  sheet2.getRange('D:D').format.columnWidth = 32;
  sheet2.getRange('E:E').format.columnWidth = 45;

  // Write outputs
  await fs.mkdir(outputDir, { recursive: true });

  const preview = await workbook.render({ sheetName: 'Vulnerability Matrix', range: `A1:F${footerRowIndex}`, scale: 1, format: 'png' });
  await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

  const file1 = `${outputDir}/amr-fitness-vulnerability-matrix.xlsx`;
  const file2 = `${outputDir}/amr-fitness-security-vulnerability-matrix.xlsx`;

  try { await fs.unlink(file1); } catch (e) {}
  try { await fs.unlink(file2); } catch (e) {}

  const output = await SpreadsheetFile.exportXlsx(workbook);
  try {
    await output.save(file1);
    console.log(`Saved ${file1}`);
  } catch (err) {
    console.warn(`Could not save ${file1} (file may be open in Excel): ${err.message}`);
  }

  try {
    await output.save(file2);
    console.log(`Saved ${file2}`);
  } catch (err) {
    console.warn(`Could not save ${file2} (file may be open in Excel): ${err.message}`);
  }
  
  console.log('Successfully generated complete 2-sheet matrix in Mahesh Fitness Center!');
}

buildMatrix().catch(console.error);
