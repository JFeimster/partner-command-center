/*
  Moonshine Partner Command Center
  Batch 08 — Lead Store

  Local demo lead CRUD and status helpers.
*/

(function initLeadStore(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var storage = window.MoonshineOS.storage;
  var config = dashboard.config || {};
  var key = config.storageKeys && config.storageKeys.leads || "leads";

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function seedLeads() {
    return clone(dashboard.seedData && dashboard.seedData.leads || []);
  }

  function getLeads() {
    var leads = storage && storage.get ? storage.get(key, null) : null;

    if (!Array.isArray(leads)) {
      leads = seedLeads();
      if (storage && storage.set) {
        storage.set(key, leads);
      }
    }

    return leads;
  }

  function saveLeads(leads, meta) {
    var list = Array.isArray(leads) ? leads : [];

    if (storage && storage.set) {
      storage.set(key, list);
    }

    if (dashboard.state) {
      dashboard.state.setState({
        leads: list
      }, Object.assign({
        type: "leads.save"
      }, meta || {}));
    }

    return list;
  }

  function createLead(data) {
    var partner = dashboard.partnerStore && dashboard.partnerStore.getProfile
      ? dashboard.partnerStore.getProfile()
      : {};

    var lead = Object.assign({
      id: "lead_" + Date.now().toString(36),
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      monthlyRevenue: 0,
      timeInBusiness: "",
      fundingNeed: 0,
      useOfFunds: "",
      urgency: "",
      status: "new",
      source: "Dashboard demo",
      partnerId: partner.partnerId || "MS-DEMO-0000",
      assignedTo: "Unassigned",
      createdAt: now(),
      updatedAt: now(),
      nextStep: "Review demo lead details.",
      notes: "",
      tags: []
    }, data || {});

    var leads = getLeads();
    leads.unshift(lead);
    saveLeads(leads, {
      type: "leads.create",
      leadId: lead.id
    });

    if (dashboard.eventStore && dashboard.eventStore.addEvent) {
      dashboard.eventStore.addEvent({
        type: "lead.created",
        label: "Lead created",
        actor: partner.contactName || "Demo Partner",
        partnerId: lead.partnerId,
        target: lead.businessName,
        message: "Created a local demo lead.",
        tone: "success"
      });
    }

    return lead;
  }

  function getLeadById(id) {
    return getLeads().find(function findLead(lead) {
      return lead.id === id;
    }) || null;
  }

  function updateLead(id, patch) {
    var leads = getLeads();
    var updated = null;

    leads = leads.map(function mapLead(lead) {
      if (lead.id !== id) return lead;

      updated = Object.assign({}, lead, patch || {}, {
        updatedAt: now()
      });

      return updated;
    });

    saveLeads(leads, {
      type: "leads.update",
      leadId: id
    });

    return updated;
  }

  function updateStatus(id, status) {
    var updated = updateLead(id, {
      status: status
    });

    if (updated && dashboard.eventStore && dashboard.eventStore.addEvent) {
      dashboard.eventStore.addEvent({
        type: "lead.status_updated",
        label: "Lead status updated",
        actor: "Dashboard demo",
        partnerId: updated.partnerId,
        target: updated.businessName,
        message: "Updated local demo lead status to " + status + ".",
        tone: "info"
      });
    }

    return updated;
  }

  function removeLead(id) {
    var leads = getLeads().filter(function filterLead(lead) {
      return lead.id !== id;
    });

    saveLeads(leads, {
      type: "leads.remove",
      leadId: id
    });

    return leads;
  }

  function resetLeads() {
    return saveLeads(seedLeads(), {
      type: "leads.reset"
    });
  }

  function filterLeads(filters) {
    var settings = filters || {};
    var leads = getLeads();

    return leads.filter(function applyFilter(lead) {
      if (settings.status && settings.status !== "all" && lead.status !== settings.status) return false;

      if (settings.partnerId && lead.partnerId !== settings.partnerId) return false;

      if (settings.query) {
        var haystack = [
          lead.businessName,
          lead.contactName,
          lead.email,
          lead.phone,
          lead.industry,
          lead.useOfFunds,
          lead.notes,
          (lead.tags || []).join(" ")
        ].join(" ").toLowerCase();

        if (haystack.indexOf(String(settings.query).toLowerCase()) < 0) return false;
      }

      return true;
    });
  }

  function summarizeLeads(leads) {
    var list = Array.isArray(leads) ? leads : getLeads();
    var summary = {
      total: list.length,
      new: 0,
      reviewing: 0,
      needsInfo: 0,
      submitted: 0,
      funded: 0,
      declined: 0,
      archived: 0,
      requestedFunding: 0
    };

    list.forEach(function countLead(lead) {
      if (summary[lead.status] != null) {
        summary[lead.status] += 1;
      }
      summary.requestedFunding += Number(lead.fundingNeed || 0);
    });

    return summary;
  }

  dashboard.leadStore = {
    getLeads: getLeads,
    saveLeads: saveLeads,
    createLead: createLead,
    getLeadById: getLeadById,
    updateLead: updateLead,
    updateStatus: updateStatus,
    removeLead: removeLead,
    resetLeads: resetLeads,
    filterLeads: filterLeads,
    summarizeLeads: summarizeLeads
  };
})(window);
