(function () {
  'use strict';
  var TOKEN_KEY = 'pccDashboardToken';
  var profile = null;
  function $(s){ return document.querySelector(s); }
  function token(){ return sessionStorage.getItem(TOKEN_KEY) || new URLSearchParams(location.search).get('dashboard_token') || ''; }
  function headers(extra){ var h = Object.assign({'Content-Type':'application/json'}, extra || {}); if(token()) h.Authorization='Bearer '+token(); return h; }
  function copy(value){ if(!value) return; navigator.clipboard.writeText(value); }
  function campaignUrl(){ if(!profile || !profile.referral_url) return ''; var u=new URL(profile.referral_url); var map={campaign:$('[data-campaign]').value,utm_source:$('[data-utm-source]').value,utm_medium:$('[data-utm-medium]').value,utm_campaign:$('[data-utm-campaign]').value}; Object.keys(map).forEach(function(k){ if(map[k].trim()) u.searchParams.set(k,map[k].trim()); }); return u.toString(); }
  function fillForm(){ var f=$('[data-profile-form]'); if(!f||!profile)return; ['display_name','company_name','title','phone','email','website_url','booking_url','photo_url','logo_url','bio','primary_cta_label','primary_cta_url'].forEach(function(k){ if(f.elements[k]) f.elements[k].value=profile[k]||''; }); ['specialties','industries','markets','funding_types'].forEach(function(k){ if(f.elements[k]) f.elements[k].value=(profile[k]||[]).join(', '); }); }
  function render(){
    $('[data-growth-status]').hidden=true; $('[data-growth-content]').hidden=false;
    $('[data-public-url]').value=profile.public_url||'Not published yet'; $('[data-referral-url]').value=profile.referral_url||''; $('[data-lead-form-url]').value=profile.lead_form_url||'';
    document.querySelectorAll('[data-open-public]').forEach(function(a){ a.href=profile.public_url||'#'; if(!profile.public_url)a.setAttribute('aria-disabled','true'); });
    $('[data-public-preview]').src=profile.public_url||'about:blank'; $('[data-publication-status]').textContent=profile.publication_status==='published'?'Published':'Not Published'; $('[data-completeness]').textContent=(profile.profile_completeness||0)+'% complete';
    $('[data-qr-image]').src=profile.qr_png_url||''; $('[data-qr-png]').href=profile.qr_png_url||'#'; $('[data-qr-svg]').href=profile.qr_svg_url||'#'; $('[data-open-lead-form]').href=profile.lead_form_url||'#';
    $('[data-lead-embed]').textContent=profile.lead_form_url?'<iframe src="'+profile.lead_form_url+'" width="100%" height="720" frameborder="0" title="Funding intake"></iframe>':''; fillForm();
  }
  async function load(){
    try { var r=await fetch('/api/dashboard/distribution',{headers:headers()}); var data=await r.json(); if(!r.ok)throw new Error(data.error&&data.error.message||'Unable to load distribution kit.'); profile=data.profile; render(); }
    catch(e){ $('[data-growth-status]').className='growth-error'; $('[data-growth-status]').textContent=e.message; }
  }
  document.addEventListener('click', function(e){ var c=e.target.closest('[data-copy]'); if(c){ var t=c.getAttribute('data-copy'); var value=t==='public'?profile&&profile.public_url:t==='referral'?profile&&profile.referral_url:t==='lead'?profile&&profile.lead_form_url:t==='campaign'?$('[data-campaign-url]').value:''; copy(value); c.textContent='Copied'; setTimeout(function(){c.textContent='Copy';},1200); }
    if(e.target.closest('[data-build-campaign]')){ e.preventDefault(); $('[data-campaign-url]').value=campaignUrl(); }
  });
  $('[data-profile-form]').addEventListener('submit', async function(e){ e.preventDefault(); var f=e.currentTarget; var changes={}; ['display_name','company_name','title','phone','email','website_url','booking_url','photo_url','logo_url','bio','primary_cta_label','primary_cta_url'].forEach(function(k){changes[k]=f.elements[k].value.trim();}); ['specialties','industries','markets','funding_types'].forEach(function(k){changes[k]=f.elements[k].value.split(',').map(function(x){return x.trim();}).filter(Boolean);}); var status=$('[data-save-status]'); status.textContent='Saving…'; try{var r=await fetch('/api/dashboard/profile',{method:'PATCH',headers:headers(),body:JSON.stringify(changes)});var data=await r.json();if(!r.ok)throw new Error(data.error&&data.error.message||'Update failed.');profile=data.profile;render();status.textContent='Saved';}catch(err){status.textContent=err.message;}});
  load();
})();
