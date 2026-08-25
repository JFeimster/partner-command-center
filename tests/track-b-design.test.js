'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const tokens = read('styles/tokens.css');
const publicCss = read('styles/public.css');
const dashboardCss = read('dashboard.css');
const index = read('index.html');
const marketplace = read('marketplace.html');
const resources = read('resources.html');
const designDoc = read('docs/DESIGN-SYSTEM.md');
const vercel = JSON.parse(read('vercel.json'));

[
  '--neo-black:#0a0a0a',
  '--neo-white:#f4f4f0',
  '--neo-cream:#e8e8e3',
  '--neo-yellow:#facc15',
  '--shadow-brutal:4px 4px 0 #000'
].forEach((token) => assert.ok(tokens.includes(token), `missing canonical token: ${token}`));

assert.ok(designDoc.includes('NEO-BRUTALISM'), 'design system must document neo-brutalist direction');
assert.ok(designDoc.includes('COMMAND\nPIPELINE\nGROWTH\nCAPITAL\nBUILD\nLEARN\nEARN\nTEAM\nACCOUNT'), 'design system must document canonical IA');

assert.ok(index.includes('PARTNER COMMAND.'), 'public index must be Partner Command gateway');
assert.ok(index.includes('Leads. Links. Training. Production. Next move.'), 'gateway must use concise product positioning');
assert.ok(!index.includes('Join the Partner Program'), 'gateway must not act as recruitment site');
assert.ok(!marketplace.includes('Join the Partner Program'), 'marketplace must not act as recruitment site');
assert.ok(!resources.includes('Join the Partner Program'), 'resources must not act as recruitment site');
assert.ok(marketplace.includes('THE ARMORY.'), 'marketplace must use normalized capital-armory hierarchy');
assert.ok(resources.includes('FIELD LIBRARY.'), 'resources must use field-library hierarchy');

assert.ok(publicCss.includes('@media(max-width:720px)'), 'public shell must define mobile behavior');
assert.ok(publicCss.includes('@media(max-width:420px)'), 'public shell must define narrow mobile behavior');
assert.ok(dashboardCss.includes('@media(max-width:1100px)'), 'dashboard must define tablet/off-canvas behavior');
assert.ok(dashboardCss.includes('@media(max-width:760px)'), 'dashboard must define mobile action-stack behavior');
assert.ok(dashboardCss.includes('overflow-x:auto'), 'dashboard data tables must protect against horizontal layout breakage');

function assertLocalHtmlLinksResolve(file) {
  const html = read(file);
  const matches = [...html.matchAll(/href="\.\/([^"?#]+\.html)(?:[?#][^"]*)?"/g)];
  matches.forEach((match) => assert.ok(exists(match[1]), `${file} links to missing ${match[1]}`));
}

['index.html', 'marketplace.html', 'resources.html', 'dashboard.html'].forEach(assertLocalHtmlLinksResolve);

assert.strictEqual(vercel.git.deploymentEnabled, false, 'automatic Vercel deployments must remain disabled');

console.log('Track B design and route contract tests passed');
