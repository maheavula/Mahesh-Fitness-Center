import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import @oai/artifact-tool
import { SpreadsheetFile, Workbook } from 'file:///D:/Bank%20of%20Mahesh/outputs/security-lab-matrix/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const outputDir = 'D:/Mahesh Fitness Center/outputs/security-lab-matrix';

const rows = [
  [
    'Reflected XSS',
    'Easy',
    'A03:2021 Injection',
    '1. Visit /app/classes?search=<img src=x onerror=alert(1)> in browser.\n2. Observe search query banner above class filter controls.\n3. Verify dangerouslySetInnerHTML renders unsanitized query and executes script.',
    'Session token theft via localStorage/cookies\nDOM manipulation and phishing overlays\nUnauthorized class cancellations in victim session',
    'Contextual output encoding (use React JSX {search})\nStrict Content Security Policy (CSP)\nInput sanitization via DOMPurify'
  ],
  [
    'No rate limiting & unlimited login',
    'Easy',
    'A07:2021 Identification & Auth Failures',
    '1. Send >15 rapid POST /api/auth/login requests with invalid passwords.\n2. Inspect response status codes in Dev Tools / Postman.\n3. Verify requests return 401 without 429 throttling or lockout.',
    'Automated credential stuffing & password spraying\nHigh CPU load from bcrypt hashing\nIncreased probability of account takeover',
    'Implement express-rate-limit middleware\nAccount lockout after 5 failed attempts\nCAPTCHA verification on high frequency'
  ],
  [
    'Open CORS & exposed headers',
    'Easy',
    'A05:2021 Security Misconfiguration',
    '1. Send curl -I http://localhost:3000/api/system/info.\n2. Inspect response HTTP headers.\n3. Verify Access-Control-Allow-Origin: * and X-Powered-By: Express are exposed.',
    'Cross-origin data leakage to arbitrary web origins\nBackend tech stack fingerprinting\nTargeted exploit selection for Express/Node',
    'Restrict CORS origin strictly to trusted domains\nDisable X-Powered-By header via app.disable()\nMount Helmet security headers middleware'
  ],
  [
    'Horizontal privilege escalation (IDOR)',
    'Medium',
    'A01:2021 Broken Access Control',
    '1. Log in as Member 1 (member@amrfitness.local, MEM-10001).\n2. Submit GET /api/member/activity?memberId=MEM-10002 or /profile?memberId=MEM-10002.\n3. Verify API returns Member MEM-10002\'s private data without ownership check.',
    'Unauthorized exposure of private workout and health data\nPotential alteration of target member profiles/bookings\nViolation of data privacy regulations',
    'Strict server-side identity binding (req.user.id)\nValidate requested_member_id === session_member_id\nDeny by default authorization policies'
  ],
  [
    'Sensitive data exposure (Password hash leak)',
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
    'Hardcoded secret in client bundle',
    'Hard',
    'A05:2021 Security Misconfiguration',
    '1. Search compiled JS bundle in dist/client/assets/ for AMR_SECRET_MASTER_API_KEY.\n2. Locate AMR_SECRET_MASTER_API_KEY_2026_V1 in client bundle.\n3. Submit GET /api/admin/dashboard with header "x-admin-key: AMR_SECRET_MASTER_API_KEY_2026_V1".\n4. Verify server grants full admin access without authentication.',
    'Complete system and administrative takeover\nBypasses standard authentication and role checks\nPermanent compromise as long as secret is in client bundle',
    'Zero secret client bundles (never embed master keys)\nServer-side authorization only\nAutomated secret scanning (GitGuardian/TruffleHog) in CI/CD'
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
    'Vertical privilege escalation (Role mass assignment)',
    'Hard',
    'A01:2021 Broken Access Control',
    '1. Log in as standard member (member@amrfitness.local).\n2. Submit PUT /api/member/profile or POST /api/auth/signup with payload {"role":"admin"}.\n3. Query GET /api/auth/me.\n4. Verify account role is upgraded to admin.',
    'Standard member escalates privilege to full admin\nUnauthorized management of plans, trainers, and members\nCompromise of administrative audit trail',
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

async function buildMatrix() {
  const workbook = Workbook.create();
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
  sheet.getRange(`A5:F${rows.length + 4}`).format.rowHeight = 72;
  
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

  // Write outputs
  await fs.mkdir(outputDir, { recursive: true });

  const check = await workbook.inspect({ kind: 'table', range: `Vulnerability Matrix!A1:F${footerRowIndex}`, include: 'values,formulas', tableMaxRows: footerRowIndex, tableMaxCols: 6 });
  console.log(check.ndjson);

  const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 30 }, summary: 'formula error scan' });
  console.log(errors.ndjson);

  const preview = await workbook.render({ sheetName: 'Vulnerability Matrix', range: `A1:F${footerRowIndex}`, scale: 1, format: 'png' });
  await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(`${outputDir}/amr-fitness-security-vulnerability-matrix.xlsx`);
  
  console.log('Successfully generated AMR Fitness Security Matrix spreadsheet and preview PNG!');
}

buildMatrix().catch(console.error);
