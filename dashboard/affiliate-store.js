/*
  Moonshine Partner Command Center
  Batch 08 — Affiliate Store

  Partner ID links, attribution state, notes, and local events.
*/

(function initAffiliateStore(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var storage = window.MoonshineOS.storage;
  var config = dashboard.config || {};
  var eventKey = config.storageKeys && config.storageKeys.events || "events";
  var notesKey = config.storageKeys && config.storageKeys.notes || "notes";

  function now() {
    return new Date().toISOString();
  }

  function getAttribution() {
    var affiliate = window.MoonshineOS.affiliateTracking;

    if (affiliate && affiliate.getStoredAttribution) {
      return affiliate.getStoredAttribution();
    }

    return storage && storage.get ? storage.get("affiliateAttribution", {}) : {};
  }

  function buildLink(destination, params) {
    var partnerStore = dashboard.partnerStore;
    var profile = partnerStore && partnerStore.getProfile ? partnerStore.getProfile() : {};

    if (partnerStore && partnerStore.getPartnerLink) {
      return partnerStore.getPartnerLink(destination || "./index.html", params || {});
    }

    var url = new URL(destination || "./index.html", window.location.href);
    url.searchParams.set("partner_id", profile.partnerId || "MS-DEMO-0000");

    Object.keys(params || {}).forEach(function setParam(key) {
      if (params[key] != null && params[key] !== "") {
        url.searchParams.set(key, params[key]);
      }
    });

    return url.toString();
  }

  function getEvents() {
    var list = storage && storage.get ? storage.get(eventKey, null) : null;
    return Array.isArray(list) ? list : (dashboard.seedData && dashboard.seedData.events || []);
  }

  function saveEvents(events) {
    var list = Array.isArray(events) ? events : [];

    if (storage && storage.set) {
      storage.set(eventKey, list);
    }

    if (dashboard.state) {
      dashboard.state.setState({
        events: list
      }, {
        type: "events.save"
      });
    }

    return list;
  }

  function addEvent(event) {
    var profile = dashboard.partnerStore && dashboard.partnerStore.getProfile
      ? dashboard.partnerStore.getProfile()
      : {};

    var item = Object.assign({
      id: "event_" + Date.now().toString(36),
      type: "dashboard.event",
      label: "Dashboard event",
      actor: profile.contactName || "Demo Partner",
      actorRole: profile.partnerType || "partner",
      partnerId: profile.partnerId || "MS-DEMO-0000",
      target: "Dashboard",
      message: "Local dashboard event.",
      createdAt: now(),
      icon: "activity",
      tone: "info"
    }, event || {});

    var events = getEvents();
    events.unshift(item);

    if (events.length > 120) {
      events = events.slice(0, 120);
    }

    saveEvents(events);
    return item;
  }

  function getNotes() {
    var notes = storage && storage.get ? storage.get(notesKey, []) : [];
    return Array.isArray(notes) ? notes : [];
  }

  function saveNotes(notes) {
    var list = Array.isArray(notes) ? notes : [];

    if (storage && storage.set) {
      storage.set(notesKey, list);
    }

    if (dashboard.state) {
      dashboard.state.setState({
        notes: list
      }, {
        type: "notes.save"
      });
    }

    return list;
  }

  function addNote(note) {
    var profile = dashboard.partnerStore && dashboard.partnerStore.getProfile
      ? dashboard.partnerStore.getProfile()
      : {};

    var item = Object.assign({
      id: "note_" + Date.now().toString(36),
      title: "Partner note",
      body: "",
      relatedTo: "",
      createdAt: now(),
      updatedAt: now(),
      partnerId: profile.partnerId || "MS-DEMO-0000"
    }, note || {});

    var notes = getNotes();
    notes.unshift(item);
    saveNotes(notes);

    addEvent({
      type: "note.created",
      label: "Note created",
      target: item.title,
      message: "Created a local CRM-lite note.",
      tone: "info"
    });

    return item;
  }

  function removeNote(id) {
    var notes = getNotes().filter(function filterNote(note) {
      return note.id !== id;
    });

    saveNotes(notes);
    return notes;
  }

  dashboard.affiliateStore = {
    getAttribution: getAttribution,
    buildLink: buildLink,
    getEvents: getEvents,
    saveEvents: saveEvents,
    addEvent: addEvent,
    getNotes: getNotes,
    saveNotes: saveNotes,
    addNote: addNote,
    removeNote: removeNote
  };

  dashboard.eventStore = {
    getEvents: getEvents,
    saveEvents: saveEvents,
    addEvent: addEvent
  };

  dashboard.noteStore = {
    getNotes: getNotes,
    saveNotes: saveNotes,
    addNote: addNote,
    removeNote: removeNote
  };
})(window);
