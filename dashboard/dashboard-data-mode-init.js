/* Auto-initialize Partner Command Center dashboard data modes. */
(function initDashboardDataMode(window, document) {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
  }

  function currency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function injectControls() {
    if (document.querySelector('[data-dashboard-mode]')) return;
    var actions = document.querySelector('.dashboard-topbar-actions');
    if (actions) {
      var wrapper = document.createElement('div');
      wrapper.className = 'cluster';
      wrapper.innerHTML = [
        '<label class="sr-only" for="dashboardDataMode">Dashboard data mode</label>',
        '<select id="dashboardDataMode" data-dashboard-mode aria-label="Dashboard data mode">',
        '<option value="demo">Demo / localStorage</option>',
        '<option value="live">Live API</option>',
        '</select>',
        '<span class="mpc-badge mpc-badge-info" data-dashboard-mode-status>Loading mode</span>'
      ].join('');
      actions.insertBefore(wrapper, actions.firstChild);
    }

    var overview = document.getElementById('overview');
    var metrics = document.querySelector('[data-render-metrics]');
    if (overview && metrics) {
      var modeAlert = document.createElement('div');
      modeAlert.setAttribute('data-dashboard-mode-alert', '');
      modeAlert.hidden = true;
      metrics.insertAdjacentElement('beforebegin', modeAlert);

      var alerts = document.createElement('div');
      alerts.className = 'dashboard-grid dashboard-grid-2';
      alerts.setAttribute('data-render-alerts', '');
      metrics.insertAdjacentElement('afterend', alerts);
    }
  }

  function renderLiveMetrics(state) {
    var summary = state && state.dashboardData && state.dashboardData.summary;
    var target = document.querySelector('[data-render-metrics]');
    if (!summary || !target) return;
    var metrics = [
      ['Submitted leads', summary.total_leads, 'Partner-attributed records'],
      ['Active leads', summary.active_leads, summary.action_needed_leads + ' need action'],
      ['Submitted volume', currency(summary.submitted_volume && summary.submitted_volume.amount), 'Not an approval amount'],
      ['Estimated commissions', currency(summary.estimated_commissions && summary.estimated_commissions.amount), 'Planning estimate only'],
      ['Link clicks', summary.tracking_link_clicks, summary.lead_submissions_from_links + ' attributed submissions']
    ];
    target.innerHTML = metrics.map(function (item) {
      return '<article class="dashboard-metric"><span class="dashboard-metric-label">' + esc(item[0]) + '</span><span class="dashboard-metric-value">' + esc(item[1]) + '</span><span class="dashboard-metric-note">' + esc(item[2]) + '</span></article>';
    }).join('');
  }

  function renderOnboarding(state) {
    var target = document.querySelector('[data-render-onboarding]');
    var progress = document.querySelector('[data-onboarding-progress]');
    if (!target || !progress || !state || !state.onboarding) return;
    var percent = Number(state.onboarding.percent || 0);
    progress.style.setProperty('--progress', percent + '%');
    var steps = [
      ['Partner profile', Boolean(state.partnerProfile && state.partnerProfile.partnerId)],
      ['Partner status active', state.partnerProfile && state.partnerProfile.status === 'active'],
      ['Tracking link assigned', Boolean(state.trackingLinks && state.trackingLinks.length)],
      ['First lead submitted', Boolean(state.leads && state.leads.length)]
    ];
    target.innerHTML = steps.map(function (step) {
      return '<label class="dashboard-check-item"><input type="checkbox" disabled ' + (step[1] ? 'checked' : '') + '><span><strong>' + esc(step[0]) + '</strong><span>' + (step[1] ? 'Complete' : 'Action still needed') + '</span></span></label>';
    }).join('');
  }

  function updateCopy(adapter) {
    var live = adapter.getMode() === 'live' && adapter.getStatus() === 'ready';
    var activitySubtitle = document.querySelector('[data-render-events]') && document.querySelector('[data-render-events]').closest('.dashboard-card') && document.querySelector('[data-render-events]').closest('.dashboard-card').querySelector('.dashboard-card-subtitle');
    if (activitySubtitle) activitySubtitle.textContent = live ? 'Partner-visible activity from Partner Command Center.' : 'Local browser activity feed.';
    var leadHeading = document.querySelector('#lead-tracker h2');
    var leadBody = document.querySelector('#lead-tracker .dashboard-section-header p');
    if (leadHeading) leadHeading.textContent = live ? 'Submitted lead status' : 'Demo pipeline records';
    if (leadBody) leadBody.textContent = live ? 'Read-only partner-visible lead statuses from the canonical Funding Leads workflow.' : 'Review, update, and remove partner workspace leads. These are not lender statuses.';
    var submitHeading = document.querySelector('#submit-lead h2');
    var submitButton = document.querySelector('[data-lead-form] button[type="submit"]');
    if (submitHeading) submitHeading.textContent = live ? 'Start a funding-readiness submission' : 'Create a demo referral record';
    if (submitButton) submitButton.textContent = live ? 'Open Am I Fundable' : 'Save Referral Lead';
  }

  function bindLiveLeadRoute(adapter) {
    var form = document.querySelector('[data-lead-form]');
    if (!form || form.dataset.dataModeBound === 'true') return;
    form.dataset.dataModeBound = 'true';
    form.addEventListener('submit', function (event) {
      if (adapter.getMode() !== 'live') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var formData = new FormData(form);
      adapter.openReadiness({ businessName: formData.get('businessName') || '' });
    }, true);
  }

  async function start() {
    injectControls();
    var dashboard = window.MoonshineOS && window.MoonshineOS.dashboard;
    var adapter = dashboard && dashboard.dataAdapter;
    if (!adapter) return;
    adapter.bindModeControl();
    bindLiveLeadRoute(adapter);
    await adapter.initialize();
    var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    if (dashboard.renderers && dashboard.renderers.renderAll) dashboard.renderers.renderAll(document, state);
    renderLiveMetrics(state);
    renderOnboarding(state);
    adapter.decorateLiveMode();
    updateCopy(adapter);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.setTimeout(start, 0); });
  } else {
    window.setTimeout(start, 0);
  }
})(window, document);
