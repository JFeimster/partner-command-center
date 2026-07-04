/*
  Moonshine Partner Command Center
  API Example — tally-signup-webhook.example.js

  Future endpoint:
    POST /api/tally-signup-webhook

  Status:
    Example only. Demonstrates a future Tally partner signup webhook handler.
*/

import crypto from "node:crypto";

const ALLOWED_PARTNER_TYPES = [
  "funding-broker",
  "referral-partner",
  "affiliate-partner",
  "center-of-influence",
  "operator"
];

const RESTRICTED_TERMS = [
  "guaranteed funding",
  "guaranteed approval",
  "everyone qualifies",
  "risk-free funding",
  "guaranteed commissions",
  "automatic approval",
  "earn guaranteed income"
];

const COMPLIANCE_MESSAGE =
  "Partner signup received for review. Program access, commissions, deal flow, approval, funding, and income are not guaranteed.";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload, null, 2));
}

function methodNotAllowed(res) {
  sendJson(res, 405, {
    ok: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST for this endpoint."
    }
  });
}

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseJson(raw) {
  try {
    return {
      ok: true,
      data: JSON.parse(raw)
    };
  } catch (error) {
    return {
      ok: false,
      error
    };
  }
}

function verifySignature(req, rawBody) {
  /*
    Replace this with the signature mechanism supported by your Tally/webhook setup.
    If Tally uses a different signing approach in your account, adapt this function.

    Example custom HMAC:
      X-Moonshine-Signature: sha256=<hmac>
  */

  const secret = process.env.MOONSHINE_TALLY_WEBHOOK_SECRET || "example-dev-secret";
  const received = req.headers["x-moonshine-signature"];

  if (!received) {
    return {
      ok: false,
      code: "MISSING_SIGNATURE"
    };
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

  const left = Buffer.from(String(received));
  const right = Buffer.from(String(expected));

  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return {
      ok: false,
      code: "INVALID_SIGNATURE"
    };
  }

  return {
    ok: true
  };
}

function toText(value) {
  return String(value == null ? "" : value).trim();
}

function normalizePartnerType(value) {
  const normalized = toText(value).toLowerCase().replace(/\s+/g, "-");

  const aliases = {
    broker: "funding-broker",
    "funding-broker": "funding-broker",
    "loan-broker": "funding-broker",
    affiliate: "affiliate-partner",
    "affiliate-partner": "affiliate-partner",
    referral: "referral-partner",
    "referral-partner": "referral-partner",
    coi: "center-of-influence",
    "center-of-influence": "center-of-influence",
    accountant: "center-of-influence",
    attorney: "center-of-influence",
    "business-broker": "center-of-influence",
    operator: "operator",
    admin: "operator"
  };

  return aliases[normalized] || normalized;
}

function containsRestrictedLanguage(payload) {
  const text = JSON.stringify(payload || {}).toLowerCase();
  return RESTRICTED_TERMS.filter((term) => text.includes(term));
}

function normalizeTallyPayload(payload) {
  /*
    Adapt this to your actual Tally webhook shape.

    This example accepts either:
      1. Already-normalized payload from integrations/tally-partner-signup.md
      2. A generic object with top-level partner fields
  */

  const partner = payload.partner || payload;

  const partnerType = normalizePartnerType(partner.partner_type || partner.partnerType || partner.type);

  return {
    event_type: payload.event_type || "partner.signup.created",
    source: payload.source || "tally",
    submitted_at: payload.submitted_at || payload.createdAt || new Date().toISOString(),
    form_id: payload.form_id || payload.formId || "",
    submission_id: payload.submission_id || payload.submissionId || `tally_${Date.now().toString(36)}`,
    partner: {
      contact_name: toText(partner.contact_name || partner.contactName || partner.full_name || partner.name),
      email: toText(partner.email),
      phone: toText(partner.phone),
      company: toText(partner.company || partner.brand || partner.organization),
      partner_type: partnerType,
      partner_path: toText(partner.partner_path || partner.partnerPath || partner.intended_workflow),
      primary_audience: toText(partner.primary_audience || partner.primaryAudience || partner.audience),
      channels: Array.isArray(partner.channels) ? partner.channels : toText(partner.channels).split(",").map((item) => item.trim()).filter(Boolean)
    },
    acknowledgments: {
      agreement_acknowledged: Boolean(payload.acknowledgments && payload.acknowledgments.agreement_acknowledged || partner.agreement_acknowledged || partner.agreementAcknowledged),
      compliance_acknowledged: Boolean(payload.acknowledgments && payload.acknowledgments.compliance_acknowledged || partner.compliance_acknowledged || partner.complianceAcknowledged),
      permission_acknowledged: Boolean(payload.acknowledgments && payload.acknowledgments.permission_acknowledged || partner.permission_acknowledged || partner.permissionAcknowledged)
    },
    attribution: payload.attribution || {
      utm_source: payload.utm_source || partner.utm_source || "",
      utm_medium: payload.utm_medium || partner.utm_medium || "",
      utm_campaign: payload.utm_campaign || partner.utm_campaign || "",
      ref: payload.ref || partner.ref || ""
    }
  };
}

function generatePartnerId(partner) {
  const typeMap = {
    "funding-broker": "FB",
    "referral-partner": "RP",
    "affiliate-partner": "AF",
    "center-of-influence": "COI",
    operator: "OPS"
  };

  const prefix = typeMap[partner.partner_type] || "PT";
  const source = [partner.company, partner.contact_name, partner.email].join("-").toLowerCase();

  let checksum = 0;
  for (let i = 0; i < source.length; i += 1) {
    checksum = (checksum + source.charCodeAt(i) * (i + 1)) % 9999;
  }

  return `MS-${prefix}-${String(checksum || Date.now() % 9999).padStart(4, "0")}`;
}

function validateSignup(normalized, rawPayload) {
  const errors = [];

  if (normalized.event_type !== "partner.signup.created") errors.push("event_type");
  if (!normalized.partner.contact_name) errors.push("partner.contact_name");
  if (!normalized.partner.email) errors.push("partner.email");
  if (!normalized.partner.company) errors.push("partner.company");
  if (!normalized.partner.partner_type || !ALLOWED_PARTNER_TYPES.includes(normalized.partner.partner_type)) {
    errors.push("partner.partner_type");
  }
  if (!normalized.partner.primary_audience) errors.push("partner.primary_audience");
  if (!normalized.acknowledgments.agreement_acknowledged) errors.push("acknowledgments.agreement_acknowledged");
  if (!normalized.acknowledgments.compliance_acknowledged) errors.push("acknowledgments.compliance_acknowledged");
  if (!normalized.acknowledgments.permission_acknowledged) errors.push("acknowledgments.permission_acknowledged");

  const restricted = containsRestrictedLanguage(rawPayload);
  if (restricted.length) errors.push("restricted_language");

  return errors;
}

function determineReviewStatus(normalized, errors) {
  if (errors.length) return "needs-info";

  if (normalized.partner.partner_type === "affiliate-partner") {
    return "needs-review";
  }

  return "pending-review";
}

async function savePartnerSignup(record) {
  /*
    Replace with CRM/database create-or-update.

    Recommended:
      - upsert by email and partner_id
      - create activity event
      - queue operator review when needed
      - send welcome only after review/activation rules pass
  */

  return {
    saved: false,
    storage: "example-only",
    record
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res);
  }

  const rawBody = await readRawBody(req);
  const signature = verifySignature(req, rawBody);

  if (!signature.ok) {
    return sendJson(res, 401, {
      ok: false,
      error: {
        code: signature.code,
        message: "Tally webhook signature verification failed."
      }
    });
  }

  const parsed = parseJson(rawBody);

  if (!parsed.ok) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "INVALID_JSON",
        message: "Webhook body must be valid JSON."
      }
    });
  }

  const normalized = normalizeTallyPayload(parsed.data);
  const errors = validateSignup(normalized, parsed.data);
  const reviewStatus = determineReviewStatus(normalized, errors);

  if (errors.length) {
    return sendJson(res, 400, {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Partner signup requires additional review or correction.",
        fields: errors
      },
      status: reviewStatus,
      message: COMPLIANCE_MESSAGE
    });
  }

  const partnerId = generatePartnerId(normalized.partner);

  const record = {
    ...normalized,
    partner_id: partnerId,
    status: reviewStatus,
    received_at: new Date().toISOString(),
    compliance_message: COMPLIANCE_MESSAGE
  };

  const result = await savePartnerSignup(record);

  return sendJson(res, 200, {
    ok: true,
    received: true,
    partner_id: partnerId,
    status: reviewStatus,
    saved: result.saved,
    storage: result.storage,
    message: COMPLIANCE_MESSAGE
  });
}
