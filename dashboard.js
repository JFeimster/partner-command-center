(() => {
  "use strict";

  const KEYS = {
    profile: "moonshine_partner_profile",
    path: "moonshine_partner_path",
    checklist: "moonshine_onboarding_checklist",
    leads: "moonshine_leads",
    links: "moonshine_partner_links",
    training: "moonshine_training_status",
    notes: "moonshine_partner_notes",
    settings: "moonshine_dashboard_settings",
    commission: "moonshine_commission_snapshot",
    activity: "moonshine_activity_feed"
  };

  const checklistTemplate = [
    { id: "profile", label: "Add profile details", helper: "Save name, contact, company, status, and preferred CTA." },
    { id: "path", label: "Select partner path", helper: "Choose direct broker, affiliate partner, or hybrid operator." },
    { id: "primary-link", label: "Save primary partner/referral link", helper: "Add the link you will copy most often." },
    { id: "products", label: "Review funding product overview", helper: "Know what type of capital conversations to route." },
    { id: "test-lead", label: "Submit first test or sample lead", helper: "Validate your local intake workflow." },
    { id: "compliance", label: "Review compliance/disclaimer guidance", helper: "Avoid guaranteed funding, approval, or income claims." },
    { id: "strategy-call", label: "Book intro or strategy call", helper: "Create the next human checkpoint." },
    { id: "resources", label: "Download/start using partner resources", helper: "Pull your scripts, links, and training assets together." }
  ];

  const trainingTemplate = [
    { id: "broker-basics", title: "Broker Basics", description: "Understand intake, qualification, routing, and follow-up expectations." },
    { id: "funding-products", title: "Funding Products Overview", description: "Review common use cases, document needs, and capital fit." },
    { id: "qualify-lead", title: "How to Qualify a Business Lead", description: "Spot readiness signals before wasting cycles." },
    { id: "talk-business", title: "How to Talk to Business Owners", description: "Use clear questions and responsible funding language." },
    { id: "compliance", title: "Compliance and Responsible Marketing", description: "No guaranteed approvals, commissions, or funding outcomes." },
    { id: "affiliate-setup", title: "Affiliate Partner Setup", description: "Organize signup links, referral notes, and program details." },
    { id: "follow-up-scripts", title: "Follow-Up Scripts", description: "Keep opportunities moving without sounding desperate." },
    { id: "faq", title: "FAQ", description: "Capture common partner, borrower, and referral objections." }
  ];

  const defaultLinks = [
    {
      id: cryptoId(),
      title: "Moonshine Broker Resources",
      url: "https://example.com/moonshine-resources",
      category: "Moonshine Capital broker resources",
      notes: "Replace with your actual resource URL.",
      createdAt: new Date().toISOString()
    },
    {
      id: cryptoId(),
      title: "Book Strategy Call",
      url: "https://example.com/calendar",
      category: "Calendar booking link",
      notes: "Replace with your actual calendar booking link.",
      createdAt: new Date().toISOString()
    }
  ];

  const state = {
    profile: {},
    partnerPath: "",
    checklist: [],
    leads: [],
    links: [],
    training: [],
    notes: [],
    settings: {},
    commission: {},
    activity: []
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    loadAll();
    bindNavigation();
    bindForms();
    renderAll();
    showToast("Command Center loaded. Data is local to this browser.");
  }

  function loadAll() {
    state.profile = safeGet(KEYS.profile, {
      name: "Moonshine Partner",
      email: "",
      phone: "",
      company: "Partner Workspace",
      partnerType: "Needs Setup",
      status: "New",
      calendarLink: "",
      primaryLink: "",
      preferredCta: "Book Strategy Call",
      theme: "dark"
    });

    state.partnerPath = safeGet(KEYS.path, "");
    state.checklist = safeGet(KEYS.checklist, checklistTemplate.map(item => ({ ...item, completed: false })));
    state.leads = safeGet(KEYS.leads, []);
    state.links = safeGet(KEYS.links, defaultLinks);
    state.training = safeGet(KEYS.training, trainingTemplate.map(item => ({ ...item, status: "Not Started", notes: "" })));
    state.notes = safeGet(KEYS.notes, []);
    state.settings = safeGet(KEYS.settings, {});
    state.commission = safeGet(KEYS.commission, { pending: 0, closedDeals: 0, referralSignups: 0 });
    state.activity = safeGet(KEYS.activity, []);

    document.documentElement.dataset.theme = state.profile.theme || "dark";

    if (!localStorage.getItem(KEYS.links)) safeSet(KEYS.links, state.links);
    if (!localStorage.getItem(KEYS.checklist)) safeSet(KEYS.checklist, state.checklist);
    if (!localStorage.getItem(KEYS.training)) safeSet(KEYS.training, state.training);
  }

  function renderAll() {
    renderProfile();
    renderPath();
    renderChecklist();
    renderMetrics();
    renderActivity();
    renderLeads();
    renderLinks();
    renderTraining();
    renderNotes();
    renderCommission();
    syncProfileForm();
  }

  function bindNavigation() {
    $$(".nav-link").forEach(button => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });

    $$("[data-jump]").forEach(button => {
      button.addEventListener("click", () => showView(button.dataset.jump));
    });

    $("#menuButton")?.addEventListener("click", () => toggleMobileNav(true));
    $("#mobileScrim")?.addEventListener("click", () => toggleMobileNav(false));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") toggleMobileNav(false);
    });

    $("#globalSearch")?.addEventListener("input", event => {
      const query = event.target.value.trim();
      $("#leadSearch").value = query;
      $("#notesSearch").value = query;
      renderLeads();
      renderNotes();
      if (query && !$("#lead-tracker").classList.contains("active")) {
        showView("lead-tracker", false);
      }
    });
  }

  function bindForms() {
    $("#leadForm")?.addEventListener("submit", handleLeadSubmit);
    $("#linkForm")?.addEventListener("submit", handleLinkSubmit);
    $("#noteForm")?.addEventListener("submit", handleNoteSubmit);
    $("#profileForm")?.addEventListener("submit", handleProfileSubmit);

    $("#leadSearch")?.addEventListener("input", renderLeads);
    $("#statusFilter")?.addEventListener("change", renderLeads);
    $("#notesSearch")?.addEventListener("input", renderNotes);

    $("#exportDataBtn")?.addEventListener("click", exportLocalData);
    $("#importDataInput")?.addEventListener("change", importLocalData);
    $("#copyPrimaryLinkBtn")?.addEventListener("click", copyPrimaryLink);
    $("#saveCommissionBtn")?.addEventListener("click", saveCommission);
    $("#resetDashboardBtn")?.addEventListener("click", resetDashboard);

    $("#leadEditForm")?.addEventListener("submit", saveLeadDialog);
    $("#closeLeadDialog")?.addEventListener("click", closeLeadDialog);
    $("#cancelLeadEdit")?.addEventListener("click", closeLeadDialog);
  }

  function showView(viewId, closeNav = true) {
    const target = document.getElementById(viewId);
    if (!target) return;

    $$(".view").forEach(view => view.classList.toggle("active", view.id === viewId));
    $$(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === viewId));

    if (closeNav) toggleMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleMobileNav(open) {
    document.body.classList.toggle("nav-open", open);
    $("#menuButton")?.setAttribute("aria-expanded", String(open));
    if ($("#mobileScrim")) $("#mobileScrim").hidden = !open;
  }

  function renderProfile() {
    const name = state.profile.name || "Moonshine Partner";
    const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "MP";
    const partnerType = state.partnerPath || state.profile.partnerType || "Needs Setup";

    $("#sidebarInitials").textContent = initials;
    $("#sidebarName").textContent = name;
    $("#sidebarCompany").textContent = state.profile.company || "Partner Workspace";
    $("#sidebarPartnerType").textContent = partnerType;
    $("#sidebarStatus").textContent = state.profile.status || "New";
    $("#welcomeTitle").textContent = `Welcome back, ${firstName(name)}`;
    $("#statusSummary").textContent = getStatusSummary(partnerType);
    $("#notificationCount").textContent = String(Math.min(9, 3 + state.leads.filter(lead => ["New", "Follow-Up Needed"].includes(lead.status)).length));

    const leadPath = $("#leadPartnerPath");
    if (leadPath && partnerType !== "Needs Setup") leadPath.value = partnerType;
  }

  function renderPath() {
    const currentPath = state.partnerPath || "";
    $$(".path-option").forEach(option => {
      const active = option.dataset.path === currentPath;
      option.setAttribute("aria-checked", String(active));
      option.classList.toggle("selected", active);
      option.onclick = () => selectPartnerPath(option.dataset.path);
    });

    $("#partnerPathBadge").textContent = currentPath || "Unselected";
    $("#nextActionsTitle").textContent = currentPath ? `${currentPath} next steps` : "Activate your dashboard";

    const list = $("#nextActionsList");
    if (!list) return;
    list.innerHTML = "";
    getNextActions(currentPath).forEach(action => {
      const li = document.createElement("li");
      li.textContent = action;
      list.appendChild(li);
    });
  }

  function selectPartnerPath(path) {
    state.partnerPath = path;
    state.profile.partnerType = path;
    safeSet(KEYS.path, path);
    safeSet(KEYS.profile, state.profile);
    markChecklist("path", true);
    addActivity(`Partner path selected: ${path}`);
    renderAll();
    showToast(`${path} mode saved.`);
  }

  function getNextActions(path) {
    const defaults = [
      "Save your profile and preferred call-to-action.",
      "Select the partner path that matches your current lane.",
      "Add your primary partner/referral link.",
      "Submit a test lead to verify the local tracker."
    ];

    const actions = {
      "Direct Broker": [
        "Complete broker profile and contact details.",
        "Review lead submission guidelines before live outreach.",
        "Submit the first business funding lead.",
        "Book a broker strategy call."
      ],
      "Affiliate Partner": [
        "Save your external affiliate signup link.",
        "Review partner offer details and terms.",
        "Track referred signups manually.",
        "Add notes about each referral source."
      ],
      "Hybrid Partner": [
        "Save both direct broker and affiliate links.",
        "Separate direct funding leads from affiliate referrals.",
        "Complete broker profile and partner link setup.",
        "Review training before scaling outreach."
      ]
    };

    return actions[path] || defaults;
  }

  function getStatusSummary(path) {
    if (path === "Direct Broker") return "Direct broker mode: focus on qualified business funding leads, responsible intake, and deal follow-up.";
    if (path === "Affiliate Partner") return "Affiliate partner mode: organize referral links, signup sources, and external program activity.";
    if (path === "Hybrid Partner") return "Hybrid mode: track direct borrower opportunities and indirect affiliate referrals in one workspace.";
    return "Select your partner path, complete setup, and start tracking capital opportunities.";
  }

  function renderChecklist() {
    const container = $("#checklistContainer");
    if (!container) return;
    container.innerHTML = "";

    state.checklist.forEach(item => {
      const row = document.createElement("div");
      row.className = "check-item";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = `check-${item.id}`;
      input.checked = Boolean(item.completed);
      input.addEventListener("change", () => {
        markChecklist(item.id, input.checked);
        addActivity(`${input.checked ? "Completed" : "Reopened"} onboarding step: ${item.label}`);
        renderAll();
      });

      const labelWrap = document.createElement("div");
      const label = document.createElement("label");
      label.setAttribute("for", input.id);
      label.textContent = item.label;

      const helper = document.createElement("small");
      helper.textContent = item.helper;

      labelWrap.append(label, helper);
      row.append(input, labelWrap);
      container.appendChild(row);
    });

    const percent = onboardingPercent();
    $("#checklistPercentLabel").textContent = `${percent}%`;
    $("#overviewProgressLabel").textContent = `${percent}%`;
    $("#metricProgress").textContent = `${percent}%`;
    $("#checklistProgressFill").style.width = `${percent}%`;
    $("#overviewProgressFill").style.width = `${percent}%`;
  }

  function markChecklist(id, completed) {
    state.checklist = state.checklist.map(item => item.id === id ? { ...item, completed: Boolean(completed) } : item);
    safeSet(KEYS.checklist, state.checklist);
  }

  function onboardingPercent() {
    if (!state.checklist.length) return 0;
    const complete = state.checklist.filter(item => item.completed).length;
    return Math.round((complete / state.checklist.length) * 100);
  }

  function handleLeadSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const lead = {
      id: cryptoId(),
      ...data,
      nextStep: getDefaultNextStep(data.status),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };

    state.leads.unshift(lead);
    safeSet(KEYS.leads, state.leads);
    markChecklist("test-lead", true);
    addActivity(`New lead saved: ${lead.businessName}`);
    form.reset();
    renderAll();
    showView("lead-tracker");
    showToast("Lead saved locally and added to tracker.");
  }

  function renderLeads() {
    const tbody = $("#leadTableBody");
    if (!tbody) return;

    const search = ($("#leadSearch")?.value || "").trim().toLowerCase();
    const status = $("#statusFilter")?.value || "";
    const leads = state.leads.filter(lead => {
      const searchable = [
        lead.businessName,
        lead.ownerName,
        lead.email,
        lead.phone,
        lead.leadSource,
        lead.status,
        lead.notes,
        lead.nextStep
      ].join(" ").toLowerCase();
      return (!search || searchable.includes(search)) && (!status || lead.status === status);
    });

    tbody.innerHTML = "";
    $("#leadEmptyState").hidden = state.leads.length > 0;

    leads.forEach(lead => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(lead.businessName || "Untitled Business")}</strong><span>${escapeHtml(lead.industry || "Industry not set")}</span></td>
        <td>${escapeHtml(lead.ownerName || "No contact")}<br><small>${escapeHtml(lead.email || lead.phone || "")}</small></td>
        <td>${formatCurrency(lead.fundingAmount || 0)}</td>
        <td>${statusBadge(lead.status || "New")}</td>
        <td>${escapeHtml(lead.leadSource || "Not set")}</td>
        <td>${formatDate(lead.createdAt)}</td>
        <td>${escapeHtml(lead.nextStep || getDefaultNextStep(lead.status))}</td>
        <td>
          <div class="table-actions">
            <button class="small-button" data-action="edit" data-id="${lead.id}" type="button">View/Edit</button>
            <button class="small-button" data-action="advance" data-id="${lead.id}" type="button">Advance</button>
            <button class="small-button" data-action="delete" data-id="${lead.id}" type="button">Delete</button>
          </div>
        </td>
      `;

      tr.querySelector('[data-action="edit"]').addEventListener("click", () => openLeadDialog(lead.id));
      tr.querySelector('[data-action="advance"]').addEventListener("click", () => advanceLeadStatus(lead.id));
      tr.querySelector('[data-action="delete"]').addEventListener("click", () => deleteLead(lead.id));
      tbody.appendChild(tr);
    });
  }

  function openLeadDialog(id) {
    const lead = state.leads.find(item => item.id === id);
    if (!lead) return;

    $("#editLeadId").value = lead.id;
    $("#editLeadStatus").value = lead.status || "New";
    $("#editLeadNextStep").value = lead.nextStep || "";
    $("#editLeadNote").value = "";
    $("#leadDialog")?.showModal();
  }

  function closeLeadDialog() {
    $("#leadDialog")?.close();
  }

  function saveLeadDialog(event) {
    event.preventDefault();
    const id = $("#editLeadId").value;
    const status = $("#editLeadStatus").value;
    const nextStep = $("#editLeadNextStep").value.trim();
    const note = $("#editLeadNote").value.trim();

    state.leads = state.leads.map(lead => {
      if (lead.id !== id) return lead;
      const history = Array.isArray(lead.history) ? lead.history : [];
      if (note) history.unshift({ note, createdAt: new Date().toISOString() });
      return { ...lead, status, nextStep, history, updatedAt: new Date().toISOString() };
    });

    safeSet(KEYS.leads, state.leads);
    addActivity(`Lead updated: ${status}`);
    renderAll();
    closeLeadDialog();
    showToast("Lead updated locally.");
  }

  function advanceLeadStatus(id) {
    const statuses = ["New", "Contacted", "In Review", "Submitted", "Approved", "Funded", "Follow-Up Needed"];
    state.leads = state.leads.map(lead => {
      if (lead.id !== id) return lead;
      const currentIndex = Math.max(0, statuses.indexOf(lead.status));
      const nextStatus = statuses[Math.min(currentIndex + 1, statuses.length - 1)];
      return { ...lead, status: nextStatus, nextStep: getDefaultNextStep(nextStatus), updatedAt: new Date().toISOString() };
    });

    safeSet(KEYS.leads, state.leads);
    addActivity("Lead status advanced.");
    renderAll();
    showToast("Lead moved to the next status.");
  }

  function deleteLead(id) {
    if (!confirm("Delete this local lead? This only removes browser-stored data.")) return;
    state.leads = state.leads.filter(lead => lead.id !== id);
    safeSet(KEYS.leads, state.leads);
    addActivity("Lead deleted from local tracker.");
    renderAll();
    showToast("Lead deleted.");
  }

  function getDefaultNextStep(status = "New") {
    const steps = {
      "New": "Make first contact",
      "Contacted": "Request docs / details",
      "In Review": "Review fit and package",
      "Submitted": "Monitor lender/provider response",
      "Approved": "Confirm terms and next steps",
      "Funded": "Record outcome and follow up",
      "Declined": "Document reason and alternatives",
      "Follow-Up Needed": "Schedule next touchpoint"
    };
    return steps[status] || "Set next step";
  }

  function handleLinkSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    state.links.unshift({
      id: cryptoId(),
      ...data,
      createdAt: new Date().toISOString()
    });

    safeSet(KEYS.links, state.links);
    markChecklist("primary-link", true);
    addActivity(`Partner link saved: ${data.title}`);
    form.reset();
    renderAll();
    showToast("Partner link saved.");
  }

  function renderLinks() {
    const list = $("#linksList");
    if (!list) return;

    list.innerHTML = "";
    $("#linkCountBadge").textContent = `${state.links.length} ${state.links.length === 1 ? "link" : "links"}`;

    if (!state.links.length) {
      list.innerHTML = `<div class="empty-state"><strong>No links saved.</strong><p>Add your primary referral, calendar, or resource link.</p></div>`;
      return;
    }

    state.links.forEach(link => {
      const item = document.createElement("article");
      item.className = "link-item";
      item.innerHTML = `
        <header>
          <div>
            <strong>${escapeHtml(link.title)}</strong>
            <span class="badge badge-blue">${escapeHtml(link.category || "Custom")}</span>
          </div>
        </header>
        <p>${escapeHtml(link.notes || "No notes added.")}</p>
        <div class="table-actions">
          <button class="small-button" type="button" data-action="copy">Copy Link</button>
          <button class="small-button" type="button" data-action="open">Open</button>
          <button class="small-button" type="button" data-action="delete">Delete</button>
        </div>
      `;

      item.querySelector('[data-action="copy"]').addEventListener("click", () => copyText(link.url, "Link copied."));
      item.querySelector('[data-action="open"]').addEventListener("click", () => window.open(link.url, "_blank", "noopener,noreferrer"));
      item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteLink(link.id));
      list.appendChild(item);
    });
  }

  function deleteLink(id) {
    state.links = state.links.filter(link => link.id !== id);
    safeSet(KEYS.links, state.links);
    addActivity("Partner link deleted.");
    renderAll();
    showToast("Link deleted.");
  }

  function renderTraining() {
    const grid = $("#trainingGrid");
    if (!grid) return;

    grid.innerHTML = "";
    state.training.forEach(module => {
      const card = document.createElement("article");
      card.className = "training-card";
      card.innerHTML = `
        <header>
          <div>
            <strong>${escapeHtml(module.title)}</strong>
            <span class="${trainingBadgeClass(module.status)}">${escapeHtml(module.status)}</span>
          </div>
        </header>
        <p>${escapeHtml(module.description)}</p>
        <label for="training-status-${module.id}">Status</label>
        <select id="training-status-${module.id}" data-field="status">
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <label for="training-notes-${module.id}">Notes</label>
        <textarea id="training-notes-${module.id}" data-field="notes" placeholder="Save takeaways locally...">${escapeHtml(module.notes || "")}</textarea>
        <button class="button button-secondary" type="button" data-action="open">Open Resource</button>
      `;

      const statusSelect = card.querySelector('[data-field="status"]');
      statusSelect.value = module.status || "Not Started";
      statusSelect.addEventListener("change", () => updateTraining(module.id, { status: statusSelect.value }));

      const notes = card.querySelector('[data-field="notes"]');
      notes.addEventListener("change", () => updateTraining(module.id, { notes: notes.value }));

      card.querySelector('[data-action="open"]').addEventListener("click", () => {
        updateTraining(module.id, { status: module.status === "Completed" ? "Completed" : "In Progress" });
        addActivity(`Opened resource: ${module.title}`);
        showToast("Resource marked in progress. Add the real resource URL when ready.");
      });

      grid.appendChild(card);
    });
  }

  function updateTraining(id, patch) {
    state.training = state.training.map(module => module.id === id ? { ...module, ...patch } : module);
    safeSet(KEYS.training, state.training);
    if (patch.status === "Completed") markChecklist("resources", true);
    renderTraining();
    renderMetrics();
  }

  function handleNoteSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    state.notes.unshift({
      id: cryptoId(),
      ...data,
      createdAt: new Date().toISOString()
    });

    safeSet(KEYS.notes, state.notes);
    addActivity(`Note saved: ${data.title}`);
    form.reset();
    renderAll();
    showToast("Note saved locally.");
  }

  function renderNotes() {
    const list = $("#notesList");
    if (!list) return;

    const search = ($("#notesSearch")?.value || "").trim().toLowerCase();
    const notes = state.notes.filter(note => [note.title, note.body, note.tag].join(" ").toLowerCase().includes(search));

    list.innerHTML = "";
    if (!notes.length) {
      list.innerHTML = `<div class="empty-state"><strong>No notes found.</strong><p>Save follow-up reminders, referral sources, or training takeaways.</p></div>`;
      return;
    }

    notes.forEach(note => {
      const item = document.createElement("article");
      item.className = "note-item";
      item.innerHTML = `
        <header>
          <div>
            <strong>${escapeHtml(note.title)}</strong>
            <span class="badge badge-gold">${escapeHtml(note.tag || "Note")}</span>
          </div>
          <small>${formatDate(note.createdAt)}</small>
        </header>
        <p>${escapeHtml(note.body)}</p>
        <button class="small-button" type="button">Delete</button>
      `;
      item.querySelector("button").addEventListener("click", () => deleteNote(note.id));
      list.appendChild(item);
    });
  }

  function deleteNote(id) {
    state.notes = state.notes.filter(note => note.id !== id);
    safeSet(KEYS.notes, state.notes);
    addActivity("Note deleted.");
    renderAll();
    showToast("Note deleted.");
  }

  function syncProfileForm() {
    const form = $("#profileForm");
    if (!form) return;

    const fields = {
      profileName: state.profile.name,
      profileEmail: state.profile.email,
      profilePhone: state.profile.phone,
      profileCompany: state.profile.company,
      profilePartnerType: state.partnerPath || state.profile.partnerType,
      profileStatus: state.profile.status,
      calendarLink: state.profile.calendarLink,
      primaryLink: state.profile.primaryLink,
      preferredCta: state.profile.preferredCta,
      themePreference: state.profile.theme || "dark"
    };

    Object.entries(fields).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value || "";
    });
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    state.profile = {
      name: $("#profileName").value.trim() || "Moonshine Partner",
      email: $("#profileEmail").value.trim(),
      phone: $("#profilePhone").value.trim(),
      company: $("#profileCompany").value.trim() || "Partner Workspace",
      partnerType: $("#profilePartnerType").value,
      status: $("#profileStatus").value,
      calendarLink: $("#calendarLink").value.trim(),
      primaryLink: $("#primaryLink").value.trim(),
      preferredCta: $("#preferredCta").value.trim() || "Book Strategy Call",
      theme: $("#themePreference").value || "dark"
    };

    state.partnerPath = state.profile.partnerType === "Needs Setup" ? state.partnerPath : state.profile.partnerType;
    safeSet(KEYS.profile, state.profile);
    safeSet(KEYS.path, state.partnerPath);
    document.documentElement.dataset.theme = state.profile.theme;

    markChecklist("profile", true);
    if (state.profile.primaryLink) markChecklist("primary-link", true);
    addActivity("Profile settings saved.");
    renderAll();
    showToast("Profile saved.");
  }

  function saveCommission() {
    state.commission = {
      pending: Number($("#pendingCommission").value || 0),
      closedDeals: Number($("#closedDeals").value || 0),
      referralSignups: Number($("#referralSignups").value || 0)
    };
    safeSet(KEYS.commission, state.commission);
    addActivity("Commission snapshot updated.");
    renderAll();
    showToast("Commission snapshot saved.");
  }

  function renderCommission() {
    $("#pendingCommission").value = state.commission.pending || "";
    $("#closedDeals").value = state.commission.closedDeals || "";
    $("#referralSignups").value = state.commission.referralSignups || "";
    $("#commissionPendingLabel").textContent = formatCurrency(state.commission.pending || 0);
    $("#closedDealsLabel").textContent = String(state.commission.closedDeals || 0);
    $("#referralSignupsLabel").textContent = String(state.commission.referralSignups || 0);

    const chart = $("#activityChart");
    if (!chart) return;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const funded = state.leads.filter(lead => ["Approved", "Funded"].includes(lead.status)).length;
    const base = Math.max(1, state.leads.length, funded, state.commission.referralSignups || 1);
    const values = [
      Math.max(1, Math.round(base * 0.35)),
      Math.max(1, Math.round(base * 0.55)),
      Math.max(1, Math.round(base * 0.42)),
      Math.max(1, Math.round(base * 0.75)),
      Math.max(1, Math.round(base * 0.62)),
      Math.max(1, base)
    ];

    chart.innerHTML = "";
    values.forEach((value, index) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      const height = Math.max(10, Math.round((value / Math.max(...values)) * 100));
      bar.innerHTML = `<span style="height:${height}%"></span><span>${months[index]}</span>`;
      chart.appendChild(bar);
    });
  }

  function renderMetrics() {
    const leads = state.leads;
    const inReview = leads.filter(lead => ["In Review", "Submitted"].includes(lead.status)).length;
    const funded = leads.filter(lead => ["Approved", "Funded"].includes(lead.status)).length;
    const commission = Number(state.commission.pending || 0);

    $("#metricLeads").textContent = String(leads.length);
    $("#metricReview").textContent = String(inReview);
    $("#metricFunded").textContent = String(funded);
    $("#metricCommission").textContent = formatCurrency(commission);
    $("#metricProgress").textContent = `${onboardingPercent()}%`;
    $("#metricLinks").textContent = String(state.links.length);
  }

  function renderActivity() {
    const list = $("#activityList");
    if (!list) return;

    const items = state.activity.slice(0, 6);
    list.innerHTML = "";

    if (!items.length) {
      ["Dashboard initialized", "Waiting for partner path", "Ready for first local lead"].forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        list.appendChild(li);
      });
      return;
    }

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.message} · ${formatDate(item.createdAt)}`;
      list.appendChild(li);
    });
  }

  function addActivity(message) {
    state.activity.unshift({ id: cryptoId(), message, createdAt: new Date().toISOString() });
    state.activity = state.activity.slice(0, 25);
    safeSet(KEYS.activity, state.activity);
  }

  function exportLocalData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      keys: KEYS,
      data: {
        profile: state.profile,
        partnerPath: state.partnerPath,
        checklist: state.checklist,
        leads: state.leads,
        links: state.links,
        training: state.training,
        notes: state.notes,
        commission: state.commission,
        activity: state.activity
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `moonshine-command-center-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Local dashboard data exported.");
  }

  function importLocalData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const data = parsed.data || parsed;
        if (data.profile) safeSet(KEYS.profile, data.profile);
        if (data.partnerPath !== undefined) safeSet(KEYS.path, data.partnerPath);
        if (Array.isArray(data.checklist)) safeSet(KEYS.checklist, data.checklist);
        if (Array.isArray(data.leads)) safeSet(KEYS.leads, data.leads);
        if (Array.isArray(data.links)) safeSet(KEYS.links, data.links);
        if (Array.isArray(data.training)) safeSet(KEYS.training, data.training);
        if (Array.isArray(data.notes)) safeSet(KEYS.notes, data.notes);
        if (data.commission) safeSet(KEYS.commission, data.commission);
        if (Array.isArray(data.activity)) safeSet(KEYS.activity, data.activity);
        loadAll();
        renderAll();
        showToast("Local data imported.");
      } catch (error) {
        console.error(error);
        showToast("Import failed. Use a valid JSON export.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function copyPrimaryLink() {
    const primary = state.profile.primaryLink || state.links[0]?.url;
    if (!primary) {
      showToast("No primary link saved yet. Add one in Settings or Partner Links.");
      showView("partner-links");
      return;
    }
    copyText(primary, "Primary partner link copied.");
  }

  async function copyText(text, message = "Copied.") {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast(message);
    }
  }

  function resetDashboard() {
    if (!confirm("Reset all Moonshine localStorage dashboard data in this browser?")) return;
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    loadAll();
    renderAll();
    showToast("Dashboard reset.");
  }

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`Failed to parse ${key}. Resetting key.`, error);
      localStorage.removeItem(key);
      return clone(fallback);
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key}.`, error);
      showToast("Browser storage is unavailable or full.");
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cryptoId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function firstName(name) {
    return (name || "Partner").trim().split(/\s+/)[0] || "Partner";
  }

  function formatCurrency(value) {
    const number = Number(value || 0);
    return number.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function formatDate(value) {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function statusBadge(status) {
    const lower = String(status || "").toLowerCase();
    let cls = "badge badge-blue";
    if (["approved", "funded", "active"].some(word => lower.includes(word))) cls = "badge badge-emerald";
    if (["declined", "delete"].some(word => lower.includes(word))) cls = "badge badge-red";
    if (["new", "submitted", "review"].some(word => lower.includes(word))) cls = "badge badge-gold";
    return `<span class="${cls}">${escapeHtml(status || "New")}</span>`;
  }

  function trainingBadgeClass(status) {
    if (status === "Completed") return "badge badge-emerald";
    if (status === "In Progress") return "badge badge-gold";
    return "badge badge-blue";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
})();
