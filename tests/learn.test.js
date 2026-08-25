'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const learn = read('learn.html');
const controller = read('learn.js');
const training = read('data/training-modules.js');
const resources = read('data/resources.js');
const nav = read('data/dashboard-nav.js');

test('Learn exposes Training, 30-Day Sprint, Scripts, and Events', () => {
  ['training', 'sprint', 'scripts', 'events'].forEach((id) => assert.match(learn, new RegExp(`id="${id}"`)));
  ['data-learn-training', 'data-learn-sprint', 'data-learn-scripts'].forEach((target) => assert.match(learn, new RegExp(target)));
  assert.match(learn, /No connected events/);
  assert.match(nav, /href: "\.\/learn\.html"/);
  assert.match(nav, /href: "\.\/learn\.html#sprint"/);
  assert.match(nav, /href: "\.\/learn\.html#scripts"/);
  assert.match(nav, /href: "\.\/learn\.html#events"/);
});

test('Learn reuses canonical training and resource records', () => {
  assert.match(learn, /data\/training-modules\.js/);
  assert.match(learn, /data\/resources\.js/);
  assert.match(controller, /trainingModules/);
  assert.match(controller, /resources/);
  assert.match(controller, /resourceIds/);
  assert.match(training, /window\.MoonshineData\.trainingModules/);
  assert.match(resources, /window\.MoonshineData\.resources/);
  assert.doesNotMatch(controller, /certified|certification|approved DAC/i);
});

test('Learn provides action routing and durable local training progress', () => {
  assert.match(controller, /namespace = 'moonshine\.partnerOS\.'/);
  assert.match(controller, /progressKey = namespace \+ 'trainingProgress'/);
  assert.match(controller, /data-toggle-training/);
  assert.match(controller, /growth\.html/);
  assert.match(controller, /dashboard\.html#leads/);
  assert.match(controller, /capital\.html#product-desk/);
  assert.match(controller, /writeProgress/);
  assert.match(controller, /Mark Complete/);
});

test('Learn does not fabricate events or source claims', () => {
  assert.match(learn, /No verified event calendar or registration inventory/);
  assert.doesNotMatch(learn, /webinar|live training|register now/i);
  assert.doesNotMatch(controller, /verbatim|canonical DAC script|approved script/i);
  assert.match(controller, /Open Script Resource/);
});

console.log('learn tests passed');