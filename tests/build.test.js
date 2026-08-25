'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const build = read('build.html');
const controller = read('build.js');
const nav = read('data/dashboard-nav.js');
const resources = read('data/resources.js');

test('Build exposes coherent Tools, AI, Resources, and Calculators surfaces', () => {
  ['tools', 'ai', 'resources', 'calculators'].forEach((id) => assert.match(build, new RegExp(`id="${id}"`)));
  ['data-build-tools', 'data-build-ai', 'data-build-resources', 'data-build-calculators'].forEach((target) => assert.match(build, new RegExp(target)));
  assert.match(build, /data-build-filter/);
  assert.match(build, /data-build-search/);
  assert.match(nav, /href: "\.\/build\.html#tools"/);
  assert.match(nav, /href: "\.\/build\.html#ai"/);
  assert.match(nav, /href: "\.\/build\.html#calculators"/);
});

test('Build uses actual local tools and resource inventory', () => {
  assert.match(controller, /tools\/funding-readiness-checklist\.html/);
  assert.match(controller, /tools\/sales-script-generator\.html/);
  assert.match(controller, /tools\/commission-simulator\.html/);
  assert.match(controller, /partner-signup-copilot/);
  assert.match(controller, /MoonshineData\.resources/);
  assert.match(build, /tools\.distilledfunding\.com/);
  assert.match(resources, /window\.MoonshineData\.resources/);
});

test('Build preserves external ownership and does not fabricate tool records', () => {
  assert.match(controller, /https:\/\/chatgpt\.com\/g\/g-/);
  assert.doesNotMatch(controller, /tools\.distilledfunding\.com\/(?!.*canonical)/);
  assert.doesNotMatch(controller, /fake|placeholder|mock|Unsplash/i);
  assert.match(controller, /No connected inventory/);
  assert.match(controller, /No matching build item/);
});

test('Build routes contextual work to existing tools without identity parameters', () => {
  assert.match(build, /Open Pipeline/);
  assert.doesNotMatch(build, /name="partner_id"|name="referral_code"/);
  assert.match(controller, /Open Tool/);
  assert.match(build, /canonical operator/);
});

console.log('build tests passed');