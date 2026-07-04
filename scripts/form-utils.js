/*
  Moonshine Partner Command Center
  Batch 03 — Form Utilities

  Serialize, hydrate, validate, and reset static forms.
*/

(function initMoonshineFormUtils(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var ui = window.MoonshineOS.ui || {};

  function getFieldValue(field) {
    if (!field || !field.name || field.disabled) return undefined;

    if (field.type === "checkbox") {
      return field.checked;
    }

    if (field.type === "radio") {
      return field.checked ? field.value : undefined;
    }

    if (field.tagName === "SELECT" && field.multiple) {
      return Array.prototype.slice.call(field.selectedOptions).map(function getOption(option) {
        return option.value;
      });
    }

    return field.value;
  }

  function setFieldValue(field, value) {
    if (!field || !field.name || field.disabled) return;

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }

    if (field.type === "radio") {
      field.checked = String(field.value) === String(value);
      return;
    }

    if (field.tagName === "SELECT" && field.multiple && Array.isArray(value)) {
      Array.prototype.slice.call(field.options).forEach(function selectOption(option) {
        option.selected = value.indexOf(option.value) >= 0;
      });
      return;
    }

    field.value = value == null ? "" : value;
  }

  function serializeForm(form, options) {
    var settings = Object.assign({
      includeEmpty: true,
      trimStrings: true
    }, options || {});

    var data = {};

    if (!form) return data;

    Array.prototype.slice.call(form.elements).forEach(function serializeField(field) {
      var value = getFieldValue(field);

      if (value === undefined) return;

      if (typeof value === "string" && settings.trimStrings) {
        value = value.trim();
      }

      if (!settings.includeEmpty && value === "") return;

      if (field.name in data) {
        if (!Array.isArray(data[field.name])) {
          data[field.name] = [data[field.name]];
        }
        data[field.name].push(value);
      } else {
        data[field.name] = value;
      }
    });

    return data;
  }

  function hydrateForm(form, data) {
    if (!form || !data) return form;

    Array.prototype.slice.call(form.elements).forEach(function hydrateField(field) {
      if (!field.name || !Object.prototype.hasOwnProperty.call(data, field.name)) {
        return;
      }

      setFieldValue(field, data[field.name]);
    });

    return form;
  }

  function clearErrors(form) {
    if (!form) return form;

    Array.prototype.slice.call(form.querySelectorAll("[data-field-error]")).forEach(function removeError(error) {
      error.remove();
    });

    Array.prototype.slice.call(form.querySelectorAll("[aria-invalid='true']")).forEach(function resetInvalid(field) {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    });

    return form;
  }

  function fieldLabel(field) {
    if (!field) return "This field";

    var explicitLabel = field.closest(".mpc-field, .dashboard-field");
    var label = explicitLabel ? explicitLabel.querySelector("label") : null;

    if (!label && field.id) {
      label = document.querySelector('label[for="' + CSS.escape(field.id) + '"]');
    }

    return label ? label.textContent.trim().replace(/\*$/, "").trim() : field.name || "This field";
  }

  function addFieldError(field, message) {
    if (!field) return;

    var id = field.id || field.name || "field";
    var errorId = id + "-error";
    var wrapper = field.closest(".mpc-field, .dashboard-field") || field.parentElement;
    var error = document.createElement("p");

    error.id = errorId;
    error.className = "mpc-field-help";
    error.dataset.fieldError = "";
    error.textContent = message;

    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", errorId);

    if (wrapper) {
      wrapper.appendChild(error);
    }
  }

  function validateRequired(form) {
    var errors = [];

    if (!form) {
      return {
        ok: false,
        errors: [{ name: "form", message: "Form not found." }]
      };
    }

    clearErrors(form);

    Array.prototype.slice.call(form.querySelectorAll("[required]")).forEach(function validateField(field) {
      var value = getFieldValue(field);
      var empty = value == null || value === "" || value === false || (Array.isArray(value) && value.length === 0);

      if (field.type === "radio") {
        var checkedRadio = form.querySelector('input[type="radio"][name="' + CSS.escape(field.name) + '"]:checked');
        empty = !checkedRadio;
      }

      if (empty) {
        var message = fieldLabel(field) + " is required.";
        errors.push({
          name: field.name,
          message: message
        });
        addFieldError(field, message);
      }
    });

    return {
      ok: errors.length === 0,
      errors: errors
    };
  }

  function validateEmail(value) {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function validatePhone(value) {
    if (!value) return false;
    return String(value).replace(/[^\d]/g, "").length >= 10;
  }

  function toNumber(value, fallback) {
    var number = Number(String(value == null ? "" : value).replace(/[$,%\s,]/g, ""));
    return Number.isFinite(number) ? number : fallback;
  }

  function bindSubmit(form, callback, options) {
    if (!form) return function noop() {};

    var settings = Object.assign({
      validate: true,
      preventDefault: true,
      includeEmpty: true
    }, options || {});

    function handleSubmit(event) {
      if (settings.preventDefault) {
        event.preventDefault();
      }

      var validation = settings.validate ? validateRequired(form) : { ok: true, errors: [] };

      if (!validation.ok) {
        var firstInvalid = form.querySelector("[aria-invalid='true']");
        if (firstInvalid) firstInvalid.focus();
        if (ui.toast) ui.toast("Check the required fields before continuing.", { tone: "warning" });
        return;
      }

      var data = serializeForm(form, {
        includeEmpty: settings.includeEmpty
      });

      callback(data, {
        event: event,
        form: form,
        validation: validation
      });
    }

    form.addEventListener("submit", handleSubmit);

    return function unbindSubmit() {
      form.removeEventListener("submit", handleSubmit);
    };
  }

  function resetForm(form, data) {
    if (!form) return form;

    form.reset();
    clearErrors(form);

    if (data) {
      hydrateForm(form, data);
    }

    return form;
  }

  function bindAutosave(form, key, options) {
    var storage = window.MoonshineOS.storage;

    if (!form || !storage || !key) {
      return function noop() {};
    }

    var settings = Object.assign({
      delay: 300,
      includeEmpty: true,
      restore: true
    }, options || {});

    if (settings.restore) {
      hydrateForm(form, storage.get(key, {}));
    }

    var save = ui.debounce ? ui.debounce(function autosave() {
      storage.set(key, serializeForm(form, {
        includeEmpty: settings.includeEmpty
      }));
    }, settings.delay) : function autosaveFallback() {
      storage.set(key, serializeForm(form, {
        includeEmpty: settings.includeEmpty
      }));
    };

    form.addEventListener("input", save);
    form.addEventListener("change", save);

    return function unbindAutosave() {
      form.removeEventListener("input", save);
      form.removeEventListener("change", save);
    };
  }

  window.MoonshineOS.forms = {
    getFieldValue: getFieldValue,
    setFieldValue: setFieldValue,
    serializeForm: serializeForm,
    hydrateForm: hydrateForm,
    clearErrors: clearErrors,
    validateRequired: validateRequired,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    toNumber: toNumber,
    bindSubmit: bindSubmit,
    resetForm: resetForm,
    bindAutosave: bindAutosave
  };
})(window, document);
