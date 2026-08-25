'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const team = read('team.html');
const controller = read('team.js');
const nav = read('data/dashboard-nav.js');

test('Team exposes My Team, Game Plans, and Leadership without dead routes', () => {
  ['my-team', 'game-plans', 'leadership'].forEach((id) => assert.match(team, new RegExp(`id="${id}"`)));
  assert.match(nav, /href: "\.\/team\.html"/);
  assert.match(nav, /href: "\.\/team\.html#game-plans"/);
  assert.match(nav, /href: "\.\/team\.html#leadership"/);
  assert.match(team, /No team context connected/);
  assert.match(team, /No attention items/i);
});

test('Team does not fabricate members, relationships, production, or coaching alerts', () => {
  assert.match(team, /verified sponsor, upline, or downline relationship/);
  assert.match(team, /no connected team records/i);
  assert.doesNotMatch(team, /partner_demo_|MS-FB-|MS-AF-|MS-RP-|MS-COI-/);
  assert.doesNotMatch(controller, /samplePartners|demoFundedCount|leadCount/);
});

test('Game Plans use a small durable local model and action links', () => {
  assert.match(team, /data-team-plan-form/);
  ['goal', 'targetDate', 'productionTarget', 'activityTarget', 'conversationsTarget', 'followUpTarget', 'trainingCommitment', 'nextReviewDate'].forEach((name) => assert.match(team, new RegExp(`name="${name}"`)));
  assert.match(controller, /moonshine\.partnerOS\.gamePlans/);
  assert.match(team, /Mark Reviewed/);
  assert.match(team, /Open 30-Day Sprint/);
  assert.match(team, /Open Pipeline/);
  assert.match(team, /Open Earn/);
  assert.match(team, /Open Learn/);
  assert.match(team, /editable planning commitments/);
});

test('Leadership is qualitative and routes to existing operating modules', () => {
  ['CLIENT PRODUCER', 'TEAM BUILDER', 'LOCAL LEADER', 'REGIONAL LEADER', 'NATIONAL LEADER'].forEach((stage) => assert.match(team, new RegExp(stage)));
  assert.match(team, /Current stage/);
  assert.match(team, /Not assessed/);
  assert.match(team, /No rank thresholds or promotion rules/);
  assert.match(team, /learn, use, teach/);
  assert.match(team, /learn\.html/);
  assert.match(team, /capital\.html|dashboard\.html/);
  assert.doesNotMatch(team, /qualify at|requires \d+|minimum \d+|promoted when/i);
});

console.log('team tests passed');