const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const programPage = fs.readFileSync(path.join(root, 'app/marketplace/[id]/page.tsx'), 'utf8');
const linksPage = fs.readFileSync(path.join(root, 'app/dashboard/links/page.tsx'), 'utf8');
const linkForm = fs.readFileSync(path.join(root, 'components/tracking-link-form.tsx'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'lib/auth.ts'), 'utf8');
const loginPage = fs.readFileSync(path.join(root, 'app/auth/login/page.tsx'), 'utf8');
const loginAction = fs.readFileSync(path.join(root, 'app/auth/login/actions.ts'), 'utf8');
const callback = fs.readFileSync(path.join(root, 'app/auth/callback/route.ts'), 'utf8');

test('program detail sends an active catalog program into the attributed link builder', () => {
  assert.match(programPage, /href=\{`\/dashboard\/links\?program=\$\{encodeURIComponent\(program\.id\)\}`\}/);
  assert.match(programPage, /Prepare program link/);
  assert.match(linksPage, /const programId = params\.program && \/\^\[0-9a-f-\]\{32,36\}\$\/i\.test\(params\.program\)/);
  assert.match(linksPage, /getProgram\(programId\)/);
  assert.ok(linksPage.indexOf('await requirePartnerSession(returnTo)') < linksPage.indexOf('await getProgram(programId)'));
  assert.match(linksPage, /`Program: \$\{program\.name\}`\.slice\(0, 80\)/);
  assert.match(linkForm, /defaultValue=\{initialCampaign\}/);
  assert.match(linksPage, /choose an approved Moonshine page as the destination/);
});

test('partner sign-in returns to a validated same-origin program action', () => {
  assert.match(auth, /safeNextPath\(returnTo\)/);
  assert.match(auth, /next=\$\{encodeURIComponent\(next\)\}/);
  assert.match(loginPage, /name="next" value=\{next\}/);
  assert.match(loginAction, /safeNextPath\(formData\.get\("next"\)\)/);
  assert.match(loginAction, /callbackUrl\.searchParams\.set\("next", next\)/);
  assert.match(callback, /safeNextPath\(request\.nextUrl\.searchParams\.get\("next"\)\)/);
});
