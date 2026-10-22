// Canonical trusted partner intake: one atomic application + audit event per source submission.
// This endpoint is server-to-server only. Browser roles cannot execute the underlying RPC.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function tokenMatches(expected: string, received: string): Promise<boolean> {
  const enc = new TextEncoder();
  // Compare fixed-size digests; do not short-circuit on candidate length/content.
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
    crypto.subtle.digest("SHA-256", enc.encode(received)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function correlationIdFor(source: string, formId: string, submissionId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(submissionId));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const prefix = source === "tally" && formId === "mOe658" ? "tally_mOe658" : "partner_intake";
  return `${prefix}_${hex.slice(0, 32)}`;
}

function logIngestTrace(correlationId: string, source: string, formId: string, stage: string, outcome: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    event: "partner_crm_ingest_trace",
    source,
    form_id: formId,
    correlation_id: correlationId,
    stage,
    outcome,
    ...details,
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = Deno.env.get("PARTNER_CRM_INGEST_TOKEN");
  const organizationId = Deno.env.get("PARTNER_CRM_ORG_ID");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!token || !organizationId || !serviceKey || !supabaseUrl)
    return json({ error: "integration_not_configured" }, 503);

  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!await tokenMatches(token, provided)) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return json({ error: "invalid_payload" }, 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const source = String(body.source || "").slice(0, 80);
  const submission = String(body.submission_id || "").slice(0, 200);
  const email = String(body.email || "").trim().toLowerCase();
  const formId = String(body.form_id || "").slice(0, 100);
  if (!source || !submission || !email || !email.includes("@"))
    return json({ error: "source_submission_id_email_required" }, 400);
  const correlationId = await correlationIdFor(source, formId, submission);
  const suppliedCorrelationId = typeof body.correlation_id === "string" ? body.correlation_id : "";
  if (suppliedCorrelationId && suppliedCorrelationId !== correlationId)
    return json({ error: "correlation_id_mismatch" }, 400);
  logIngestTrace(correlationId, source, formId, "database_ingest", "started");

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // PostgreSQL function runs with service_role invoker privileges. Its two
  // inserts are a single transaction; a failed event insert rolls back the
  // application. Replays return the same ID and repair old event gaps.
  let data: unknown = null;
  let error: { code?: string } | null = null;
  try {
    const result = await db.rpc("ingest_partner_application", {
      p_organization_id: organizationId,
      p_source: source,
      p_external_submission_id: submission,
      p_email: email,
      p_applicant_name: String(body.name || "").slice(0, 200),
      p_agency_name: String(body.agency_name || "").slice(0, 200),
      p_applicant_type: String(body.applicant_type || "individual").slice(0, 40),
      p_form_id: formId,
      p_answers: body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? body.answers : {},
    });
    data = result.data;
    error = result.error;
  } catch {
    logIngestTrace(correlationId, source, formId, "database_ingest", "failed", { error_code: "transport_error" });
    return json({ error: "ingestion_failed" }, 500);
  }
  if (error) {
    logIngestTrace(correlationId, source, formId, "database_ingest", "failed", { error_code: error.code || "database_error" });
    return json({ error: "ingestion_failed" }, 500);
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row || !row.application_id) {
    logIngestTrace(correlationId, source, formId, "database_ingest", "failed", { error_code: "invalid_ingestion_receipt" });
    return json({ error: "invalid_ingestion_receipt" }, 500);
  }

  logIngestTrace(correlationId, source, formId, "database_ingest", row.was_duplicate ? "duplicate" : "accepted", {
    application_id: row.application_id,
    application_status: row.application_status,
  });

  return json({
    ok: true,
    application_id: row.application_id,
    status: row.application_status,
    duplicate: row.was_duplicate === true,
    correlation_id: correlationId,
  }, row.was_duplicate ? 200 : 201);
});
