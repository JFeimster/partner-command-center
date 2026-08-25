'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const earn = read('earn.html');
const controller = read('earn.js');
const nav = read('data/dashboard-nav.js');
const commissions = read('data/sample-commissions.js');
const leads = read('data/sample-leads.js');

test('Earn exposes Revenue Plan, Production, and Commissions as one desk', () => {
  ['revenue-plan', 'production', 'commissions'].forEach((id) => assert.match(earn, new RegExp(`id="${id}"`)));
  ['data-earn-plan', 'data-earn-production', 'data-earn-commissions'].forEach((target) => assert.match(earn, new RegExp(target)));
  assert.match(nav, /href: "\.\/earn\.html"/);
  assert.match(nav, /href: "\.\/earn\.html#commissions"/);
  assert.match(nav, /href: "\.\/earn\.html#production"/);
});

test('Revenue Plan uses editable assumptions and translates goal to activity', () => {
  ['income_goal', 'avg_commission', 'funded_rate', 'submitted_rate', 'qualified_rate'].forEach((name) => assert.match(earn, new RegExp(`name="${name}"`)));
  assert.match(controller, /Math\.ceil\(income \/ commission\)/);
  assert.match(controller, /fundedRate/);
  assert.match(controller, /submittedRate/);
  assert.match(controller, /qualifiedRate/);
  assert.match(earn, /editable planning assumptions/);
  assert.match(earn, /not contractual compensation/);
});

test('Production reuses active Partner Command lead state before sample fallback', () => {
  ['new', 'reviewing', 'submitted', 'funded'].forEach((status) => assert.match(controller, new RegExp(`['"]${status}['"]`)));
  assert.match(controller, /dashboard\.state\.getState/);
  assert.match(controller, /dashboard\.leadStore\.getLeads/);
  assert.match(controller, /Sample fallback/);
  assert.match(controller, /fundingNeed/);
  assert.match(controller, /Active pipeline/);
  assert.match(controller, /Funded volume/);
  assert.match(controller, /Open Pipeline/);
  assert.match(earn, /dashboard\/dashboard-state\.js/);
  assert.match(earn, /dashboard\/lead-store\.js/);
  assert.match(leads, /status: "funded"/);
});

test('Commissions remain clearly labeled demo data and support empty state', () => {
  assert.match(earn, /Demo\/sample records/);
  assert.match(controller, /No commission records connected/);
  assert.match(controller, /commission records only/);
  assert.match(commissions, /fictional commission data only/i);
  assert.match(commissions, /does not represent actual earnings/);
  assert.match(earn, /not guaranteed income|not guaranteed earnings/i);
  assert.doesNotMatch(earn, /You can make \$/i);
});

test('Earn preserves calculator federation and does not create duplicate IDs', () => {
  assert.match(controller, /build\.html#calculators/);
  assert.match(earn, /dashboard\.html#leads/);
  assert.doesNotMatch(earn, /name="partner_id"|name="referral_code"/);
  assert.doesNotMatch(controller, /new commission database|createCommission|commissionStore/);
});

console.log('earn tests passed');