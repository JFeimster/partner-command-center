(function (window, document) {
  'use strict';
  var key = 'moonshine.partnerOS.gamePlans';
  var form = document.querySelector('[data-team-plan-form]');
  var summary = document.querySelector('[data-team-plan-summary]');
  var status = document.querySelector('[data-plan-status]');
  function read() { try { var value = JSON.parse(window.localStorage.getItem(key) || 'null'); return value && typeof value === 'object' ? value : null; } catch (error) { return null; } }
  function write(value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (error) {} }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function render(plan) { if (!summary) return; summary.innerHTML = plan ? '<article><strong>' + escapeHtml(plan.goal) + '</strong><small>Status: ' + escapeHtml(plan.status || 'active') + '</small></article><article><strong>Targets</strong><small>Production: ' + escapeHtml(plan.productionTarget || 'Not set') + '<br>Activity: ' + escapeHtml(plan.activityTarget || 'Not set') + '<br>Conversations: ' + escapeHtml(plan.conversationsTarget || 'Not set') + '</small></article><article><strong>Next review</strong><small>' + escapeHtml(plan.nextReviewDate || 'Not set') + '<br>Training: ' + escapeHtml(plan.trainingCommitment || 'Not set') + '</small></article>' : '<div class="mpc-empty"><strong>No Game Plan saved.</strong><p>Set one clear goal and the commitments you intend to review.</p></div>'; }
  function fill(plan) { if (!form || !plan) return; Object.keys(plan).forEach(function (keyName) { if (form.elements[keyName]) form.elements[keyName].value = plan[keyName] || ''; }); }
  if (form) { var existing = read(); fill(existing); render(existing); form.addEventListener('submit', function (event) { event.preventDefault(); var plan = {}; Array.prototype.forEach.call(form.elements, function (field) { if (field.name) plan[field.name] = field.value.trim(); }); plan.status = 'active'; plan.updatedAt = new Date().toISOString(); write(plan); render(plan); if (status) status.textContent = 'Saved locally'; }); }
  var review = document.querySelector('[data-mark-plan-reviewed]');
  if (review) review.addEventListener('click', function () { var plan = read(); if (!plan) { if (status) status.textContent = 'Save a plan first'; return; } plan.status = 'reviewed'; plan.reviewedAt = new Date().toISOString(); write(plan); render(plan); if (status) status.textContent = 'Marked reviewed'; });
})(window, document);