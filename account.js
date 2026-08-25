(function (window, document) {
  'use strict';

  var TOKEN_KEY = 'pccDashboardToken';
  var profile = null;
  var live = false;
  var dashboard = window.MoonshineOS && window.MoonshineOS.dashboard || {};
  var profileForm = document.querySelector('[data-account-profile]');
  var settingsForm = document.querySelector('[data-account-settings]');

  function $(selector) { return document.querySelector(selector); }
  function token() { return window.sessionStorage.getItem(TOKEN_KEY) || new URLSearchParams(window.location.search).get('dashboard_token') || ''; }
  function headers() { var result = { 'Content-Type': 'application/json' }; if (token()) result.Authorization = 'Bearer ' + token(); return result; }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clean(value) { return String(value == null ? '' : value).trim(); }
  function get(name) {
    if (!profile) return '';
    if (profile[name] !== undefined && profile[name] !== null) return profile[name];
    var camel = name.replace(/_([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
    return profile[camel] || '';
  }
  function profileValue(name) { return get(name) || ''; }

  function renderIdentity() {
    var target = $('[data-account-identity]');
    if (!target) return;
    var publicUrl = profileValue('public_url');
    target.innerHTML = '<div><strong>Partner ID</strong><span>' + escapeHtml(profileValue('partner_id') || profileValue('partnerId') || 'Demo identity') + '</span></div><div><strong>Referral code</strong><span>' + escapeHtml(profileValue('referral_code') || profileValue('referralCode') || 'Not connected') + '</span></div><div><strong>Slug</strong><span>' + escapeHtml(profileValue('slug') || 'Not published') + '</span></div><div><strong>Profile status</strong><span>' + escapeHtml(profileValue('profile_status') || 'Demo') + '</span></div><div><strong>Publication</strong><span>' + escapeHtml(profileValue('publication_status') || 'Not published') + '</span></div>';
    var publicLink = $('[data-account-public]');
    if (publicLink) publicLink.href = publicUrl || '#';
    var copyButton = $('[data-account-copy-public]');
    if (copyButton) copyButton.disabled = !publicUrl;
  }

  function fillForm() {
    if (!profileForm) return;
    ['display_name', 'company_name', 'title', 'phone', 'email', 'website_url', 'booking_url', 'photo_url', 'logo_url', 'bio', 'primary_cta_url'].forEach(function (name) { if (profileForm.elements[name]) profileForm.elements[name].value = profileValue(name); });
    ['markets', 'specialties', 'industries', 'funding_types'].forEach(function (name) { if (profileForm.elements[name]) profileForm.elements[name].value = Array.isArray(get(name)) ? get(name).join(', ') : profileValue(name); });
  }

  function renderSettings() {
    if (!settingsForm) return;
    var settings = dashboard.state && dashboard.state.getState ? dashboard.state.getState('settings', {}) : {};
    settingsForm.elements.theme.value = dashboard.state && dashboard.state.getState ? dashboard.state.getState('theme', 'dark') : 'dark';
    settingsForm.elements.compactMode.checked = Boolean(settings.compactMode);
    settingsForm.elements.showSeedData.checked = settings.showSeedData !== false;
    document.documentElement.setAttribute('data-theme', settingsForm.elements.theme.value);
  }

  function render() { renderIdentity(); fillForm(); renderSettings(); }

  function localPatch(changes) {
    var map = { display_name: 'contactName', company_name: 'company', primary_cta_url: 'primaryCtaUrl', website_url: 'website', booking_url: 'bookingUrl', photo_url: 'photoUrl', logo_url: 'logoUrl' };
    var patch = {};
    Object.keys(changes).forEach(function (name) { if (Array.isArray(changes[name]) ? changes[name].length : changes[name]) patch[map[name] || name] = changes[name]; });
    return patch;
  }

  function profileChanges() {
    var changes = {};
    ['display_name', 'company_name', 'title', 'phone', 'email', 'website_url', 'booking_url', 'photo_url', 'logo_url', 'bio', 'primary_cta_url'].forEach(function (name) { var value = clean(profileForm.elements[name].value); if (value) changes[name] = value; });
    ['markets', 'specialties', 'industries', 'funding_types'].forEach(function (name) { var values = profileForm.elements[name].value.split(',').map(clean).filter(Boolean); if (values.length) changes[name] = values; });
    return changes;
  }

  async function load() {
    if (dashboard.state && dashboard.state.hydrate) dashboard.state.hydrate();
    if (token()) {
      try {
        var response = await fetch('/api/dashboard/distribution', { headers: headers() });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error && data.error.message || 'Unable to load account profile.');
        profile = data.profile;
        live = true;
        render();
        return;
      } catch (error) { var message = $('[data-account-save-status]'); if (message) message.textContent = error.message; }
    }
    profile = dashboard.partnerStore && dashboard.partnerStore.getProfile ? dashboard.partnerStore.getProfile() : {};
    render();
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-account-copy-public]')) {
      var url = profileValue('public_url');
      if (url && navigator.clipboard) navigator.clipboard.writeText(url).then(function () { event.target.textContent = 'Copied'; });
    }
  });

  if (profileForm) profileForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    var changes = profileChanges();
    var status = $('[data-account-save-status]');
    status.textContent = 'Saving...';
    try {
      if (live) {
        var response = await fetch('/api/dashboard/profile', { method: 'PATCH', headers: headers(), body: JSON.stringify(changes) });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error && data.error.message || 'Profile update failed.');
        profile = data.profile;
      } else if (dashboard.partnerStore && dashboard.partnerStore.updateProfile) {
        profile = dashboard.partnerStore.updateProfile(localPatch(changes));
      }
      render();
      status.textContent = 'Saved';
    } catch (error) { status.textContent = error.message || 'Profile update failed.'; }
  });

  if (settingsForm) settingsForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var theme = settingsForm.elements.theme.value;
    var settings = { compactMode: settingsForm.elements.compactMode.checked, showSeedData: settingsForm.elements.showSeedData.checked };
    if (dashboard.state && dashboard.state.setState) dashboard.state.setState({ theme: theme, settings: settings }, { type: 'account.preferences_saved' });
    document.documentElement.setAttribute('data-theme', theme);
    var status = $('[data-settings-status]');
    if (status) status.textContent = 'Saved locally';
  });

  window.PartnerAccount = { render: render, profileChanges: profileChanges };
  load();
})(window, document);
