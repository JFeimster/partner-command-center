(function (window, document) {
  'use strict';

  var TOKEN_KEY = 'pccDashboardToken';
  var profile = null;
  var WIDGETS = [{
    name: 'Funding Readiness Scorecard',
    description: 'Federated readiness intake for a partner website or campaign.',
    preview: 'https://embed-widgets-kappa.vercel.app/',
    embed: 'https://am-i-fundable.vercel.app/embed.html'
  }];

  function $(selector) { return document.querySelector(selector); }
  function token() { return window.sessionStorage.getItem(TOKEN_KEY) || new URLSearchParams(window.location.search).get('dashboard_token') || ''; }
  function headers(extra) { var result = Object.assign({ 'Content-Type': 'application/json' }, extra || {}); if (token()) result.Authorization = 'Bearer ' + token(); return result; }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function copy(value) { return value && navigator.clipboard ? navigator.clipboard.writeText(value) : Promise.resolve(false); }
  function text(selector, value) { var target = $(selector); if (target) target.textContent = value == null ? '' : value; }
  function value(selector) { var target = $(selector); return target ? target.value.trim() : ''; }

  function buildCampaignUrl(baseProfile, fields) {
    if (!baseProfile || !baseProfile.referral_url) return '';
    var url = new URL(baseProfile.referral_url);
    ['campaign', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) { if (fields && fields[key] && fields[key].trim()) url.searchParams.set(key, fields[key].trim()); });
    return url.toString();
  }

  function campaignUrl() {
    var fields = {};
    ['campaign', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) { fields[key] = value('[data-' + key.replace('_', '-') + ']'); });
    return buildCampaignUrl(profile, fields);
  }

  function embedSnippet() { return profile && profile.lead_form_url ? '<iframe src="' + profile.lead_form_url + '" width="100%" height="720" frameborder="0" title="Funding intake"></iframe>' : ''; }

  function renderInventory() {
    var assets = $('[data-growth-assets]');
    var resources = window.MoonshineData && Array.isArray(window.MoonshineData.resources) ? window.MoonshineData.resources : [];
    if (assets) assets.innerHTML = resources.length ? resources.map(function (resource) {
      var href = resource.href || '';
      return '<article class="growth-inventory-item"><div><h3>' + escapeHtml(resource.title) + '</h3><p>' + escapeHtml(resource.summary || resource.description || 'Partner resource') + '</p><small>' + escapeHtml(resource.category || resource.type || 'Resource') + '</small></div><a class="mpc-button mpc-button-outline mpc-button-sm" href="' + escapeHtml(href) + '">Open</a></article>';
    }).join('') : '<div class="mpc-empty"><strong>No marketing assets assigned.</strong><p>Available partner resources will appear here when the inventory is connected.</p></div>';
    var widgets = $('[data-growth-widgets]');
    if (widgets) widgets.innerHTML = WIDGETS.length ? WIDGETS.map(function (widget) {
      var snippet = '<iframe src="' + widget.embed + '" width="100%" height="640" style="border:0" title="' + widget.name + '"></iframe>';
      return '<article class="growth-inventory-item"><div><h3>' + escapeHtml(widget.name) + '</h3><p>' + escapeHtml(widget.description) + '</p><small>Launch: canonical Embed Widgets inventory</small></div><div class="growth-actions"><a class="mpc-button mpc-button-outline mpc-button-sm" href="' + escapeHtml(widget.preview) + '" target="_blank" rel="noopener">Open</a><button class="mpc-button mpc-button-outline mpc-button-sm" type="button" data-copy-widget="' + escapeHtml(snippet) + '">Copy Embed</button></div></article>';
    }).join('') : '<div class="mpc-empty"><strong>No widgets assigned.</strong><p>Connected widget inventory will appear here when available.</p></div>';
  }

  function render() {
    var publicUrl = profile.public_url || '';
    var referralUrl = profile.referral_url || publicUrl;
    var leadUrl = profile.lead_form_url || '';
    var campaign = campaignUrl();
    $('[data-growth-status]').hidden = true;
    $('[data-growth-content]').hidden = false;
    $('[data-public-url]').value = publicUrl || 'Not published yet';
    $('[data-referral-url]').value = referralUrl;
    $('[data-lead-form-url]').value = leadUrl;
    $('[data-campaign-url]').value = campaign;
    $('[data-public-preview]').src = publicUrl || 'about:blank';
    $('[data-qr-image]').src = profile.qr_png_url || '';
    $('[data-qr-png]').href = profile.qr_png_url || '#';
    $('[data-qr-svg]').href = profile.qr_svg_url || '#';
    $('[data-lead-embed]').textContent = embedSnippet();
    document.querySelectorAll('[data-open-public]').forEach(function (link) { link.href = publicUrl || '#'; link.setAttribute('aria-disabled', String(!publicUrl)); });
    document.querySelectorAll('[data-open-referral]').forEach(function (link) { link.href = referralUrl || '#'; link.setAttribute('aria-disabled', String(!referralUrl)); });
    $('[data-open-lead-form]').href = leadUrl || '#';
    $('[data-open-campaign]').href = campaign || '#';
    text('[data-publication-status]', profile.publication_status === 'published' ? 'Published' : 'Not Published');
    text('[data-completeness]', (profile.profile_completeness || 0) + '% complete');
    fillForm();
    renderInventory();
  }

  function fillForm() {
    var form = $('[data-profile-form]');
    if (!form || !profile) return;
    ['display_name', 'company_name', 'title', 'phone', 'email', 'website_url', 'booking_url', 'photo_url', 'logo_url', 'bio', 'primary_cta_label', 'primary_cta_url'].forEach(function (key) { if (form.elements[key]) form.elements[key].value = profile[key] || ''; });
    ['specialties', 'industries', 'markets', 'funding_types'].forEach(function (key) { if (form.elements[key]) form.elements[key].value = (profile[key] || []).join(', '); });
  }

  function showError(message) {
    var status = $('[data-growth-status]');
    status.hidden = false;
    status.className = 'growth-error';
    status.textContent = message;
  }

  async function load() {
    try {
      var response = await fetch('/api/dashboard/distribution', { headers: headers() });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error && data.error.message || 'Unable to load distribution kit.');
      profile = data.profile;
      render();
    } catch (error) {
      showError(error.message || 'Unable to load distribution kit.');
    }
  }

  document.addEventListener('click', function (event) {
    var copyButton = event.target.closest('[data-copy]');
    if (copyButton) {
      var key = copyButton.getAttribute('data-copy');
      var values = { public: profile && profile.public_url, referral: profile && profile.referral_url, qr: profile && profile.referral_url, lead: profile && profile.lead_form_url, embed: embedSnippet(), campaign: value('[data-campaign-url]') };
      copy(values[key]).then(function () { var original = copyButton.textContent; copyButton.textContent = 'Copied'; window.setTimeout(function () { copyButton.textContent = original; }, 1200); });
      return;
    }
    var widgetButton = event.target.closest('[data-copy-widget]');
    if (widgetButton) { copy(widgetButton.getAttribute('data-copy-widget')).then(function () { widgetButton.textContent = 'Copied'; }); return; }
    if (event.target.closest('[data-build-campaign]')) { event.preventDefault(); var url = campaignUrl(); $('[data-campaign-url]').value = url; $('[data-open-campaign]').href = url || '#'; }
  });

  $('[data-profile-form]').addEventListener('submit', async function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    var changes = {};
    ['display_name', 'company_name', 'title', 'phone', 'email', 'website_url', 'booking_url', 'photo_url', 'logo_url', 'bio', 'primary_cta_label', 'primary_cta_url'].forEach(function (key) { changes[key] = form.elements[key].value.trim(); });
    ['specialties', 'industries', 'markets', 'funding_types'].forEach(function (key) { changes[key] = form.elements[key].value.split(',').map(function (item) { return item.trim(); }).filter(Boolean); });
    var status = $('[data-save-status]');
    status.textContent = 'Saving...';
    try {
      var response = await fetch('/api/dashboard/profile', { method: 'PATCH', headers: headers(), body: JSON.stringify(changes) });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error && data.error.message || 'Update failed.');
      profile = data.profile;
      render();
      status.textContent = 'Saved';
    } catch (error) { status.textContent = error.message || 'Update failed.'; }
  });

  window.PartnerGrowth = { campaignUrl: campaignUrl, buildCampaignUrl: buildCampaignUrl, embedSnippet: embedSnippet, renderInventory: renderInventory };
  renderInventory();
  load();
})(window, document);
