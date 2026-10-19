-- Private PostgreSQL event store. Apply only after the activation review.
CREATE SCHEMA IF NOT EXISTS crm_event_engine;
REVOKE ALL ON SCHEMA crm_event_engine FROM PUBLIC;

CREATE TABLE crm_event_engine.case_refs (
  record_id text PRIMARY KEY,
  source_reference text NOT NULL,
  verified_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE crm_event_engine.provider_refs (
  provider_id text PRIMARY KEY,
  notion_page_id text NOT NULL UNIQUE,
  verified_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE crm_event_engine.product_refs (
  provider_id text NOT NULL REFERENCES crm_event_engine.provider_refs(provider_id),
  product_id text NOT NULL,
  notion_page_id text NOT NULL UNIQUE,
  verified_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (provider_id, product_id)
);
CREATE TABLE crm_event_engine.verified_evidence (
  evidence_id text PRIMARY KEY,
  record_id text NOT NULL REFERENCES crm_event_engine.case_refs(record_id),
  provider_id text NOT NULL,
  product_id text NOT NULL,
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('offer', 'funding')),
  external_reference text NOT NULL,
  verified_at timestamptz NOT NULL,
  FOREIGN KEY (provider_id, product_id)
    REFERENCES crm_event_engine.product_refs(provider_id, product_id)
);

CREATE TABLE crm_event_engine.events (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  event_kind text NOT NULL CHECK (event_kind IN ('submission', 'communication')),
  record_id text NOT NULL REFERENCES crm_event_engine.case_refs(record_id),
  aggregate_id text NOT NULL,
  provider_id text,
  product_id text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submission_reference CHECK (
    (event_kind = 'submission' AND provider_id IS NOT NULL AND product_id IS NOT NULL AND occurred_at IS NOT NULL)
    OR (event_kind = 'communication' AND provider_id IS NULL AND product_id IS NULL)
  ),
  FOREIGN KEY (provider_id, product_id)
    REFERENCES crm_event_engine.product_refs(provider_id, product_id)
);
CREATE INDEX events_submission_order ON crm_event_engine.events(aggregate_id, sequence DESC)
  WHERE event_kind = 'submission';
CREATE INDEX events_communication_order ON crm_event_engine.events(record_id, sequence DESC)
  WHERE event_kind = 'communication';

CREATE FUNCTION crm_event_engine.reject_event_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'CRM events are immutable' USING ERRCODE = '55000';
END;
$$;
CREATE TRIGGER events_immutable BEFORE UPDATE OR DELETE ON crm_event_engine.events
  FOR EACH ROW EXECUTE FUNCTION crm_event_engine.reject_event_change();

CREATE TABLE crm_event_engine.integration_errors (
  error_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id text NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('submission', 'communication')),
  error_code text NOT NULL CHECK (error_code ~ '^[A-Z_]{3,64}$'),
  retryable boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  state text NOT NULL DEFAULT 'dead' CHECK (state IN ('pending', 'dead', 'resolved')),
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, error_code)
);

CREATE VIEW crm_event_engine.current_submissions WITH (security_invoker = true) AS
SELECT DISTINCT ON (e.aggregate_id)
  e.aggregate_id AS submission_id, e.record_id, e.provider_id, e.product_id,
  e.payload->>'status' AS status, e.event_id AS last_event_id,
  e.occurred_at AS last_event_at,
  (SELECT prior.payload->>'offer_amount' FROM crm_event_engine.events prior
   WHERE prior.event_kind = 'submission' AND prior.aggregate_id = e.aggregate_id
     AND prior.payload->>'status' = 'offered'
   ORDER BY prior.sequence DESC LIMIT 1) AS offer_amount,
  (CASE WHEN e.payload->>'status' = 'funded' THEN e.payload->>'funded_amount' END) AS funded_amount
FROM crm_event_engine.events e
WHERE e.event_kind = 'submission'
ORDER BY e.aggregate_id, e.sequence DESC;

CREATE VIEW crm_event_engine.applicant_communication_state WITH (security_invoker = true) AS
WITH grouped AS (
  SELECT record_id, COALESCE(payload->>'workflow_id', '') AS workflow_id,
    bool_or(payload->>'status' = 'suppressed') AS suppressed,
    bool_or(payload->>'status' = 'replied' AND payload->>'direction' = 'inbound') AS reply_paused,
    max(sequence) FILTER (WHERE payload->>'direction' = 'outbound') AS latest_outbound_sequence
  FROM crm_event_engine.events WHERE event_kind = 'communication'
  GROUP BY record_id, COALESCE(payload->>'workflow_id', '')
)
SELECT g.record_id, g.workflow_id, flags.suppressed, flags.reply_paused,
  COALESCE(last_out.payload->>'status' = 'queued', false) AS pending_follow_up,
  (COALESCE(last_out.payload->>'status' = 'queued', false)
    AND COALESCE(last_out.payload->>'consent_basis', '') <> ''
    AND NOT flags.suppressed AND NOT flags.reply_paused) AS eligible_send
FROM grouped g
LEFT JOIN crm_event_engine.events last_out ON last_out.sequence = g.latest_outbound_sequence
CROSS JOIN LATERAL (
  SELECT EXISTS (
      SELECT 1 FROM crm_event_engine.events stop
      WHERE stop.event_kind = 'communication' AND stop.record_id = g.record_id
        AND stop.payload->>'status' = 'suppressed'
    ) AS suppressed,
    EXISTS (
      SELECT 1 FROM crm_event_engine.events reply
      WHERE reply.event_kind = 'communication' AND reply.record_id = g.record_id
        AND reply.payload->>'status' = 'replied' AND reply.payload->>'direction' = 'inbound'
        AND COALESCE(reply.payload->>'workflow_id', '') IN ('', g.workflow_id)
    ) AS reply_paused
) flags;

-- Private schema plus row security prevents accidental Supabase Data API exposure.
ALTER TABLE crm_event_engine.case_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_event_engine.provider_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_event_engine.product_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_event_engine.verified_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_event_engine.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_event_engine.integration_errors ENABLE ROW LEVEL SECURITY;
-- Deployment creates a dedicated LOGIN role and grants membership to these NOLOGIN roles.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_event_ingest') THEN
    CREATE ROLE crm_event_ingest NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_event_report') THEN
    CREATE ROLE crm_event_report NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA crm_event_engine TO crm_event_ingest, crm_event_report;
GRANT SELECT ON crm_event_engine.case_refs, crm_event_engine.provider_refs,
  crm_event_engine.product_refs, crm_event_engine.verified_evidence TO crm_event_ingest;
GRANT SELECT, INSERT ON crm_event_engine.events TO crm_event_ingest;
GRANT SELECT, INSERT, UPDATE ON crm_event_engine.integration_errors TO crm_event_ingest;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA crm_event_engine TO crm_event_ingest;
GRANT SELECT ON crm_event_engine.events TO crm_event_report;
GRANT SELECT ON crm_event_engine.current_submissions,
  crm_event_engine.applicant_communication_state TO crm_event_report;
GRANT SELECT ON crm_event_engine.applicant_communication_state TO crm_event_ingest;
CREATE POLICY ingest_cases ON crm_event_engine.case_refs FOR SELECT TO crm_event_ingest USING (true);
CREATE POLICY ingest_providers ON crm_event_engine.provider_refs FOR SELECT TO crm_event_ingest USING (true);
CREATE POLICY ingest_products ON crm_event_engine.product_refs FOR SELECT TO crm_event_ingest USING (true);
CREATE POLICY ingest_evidence ON crm_event_engine.verified_evidence FOR SELECT TO crm_event_ingest USING (true);
CREATE POLICY ingest_event_read ON crm_event_engine.events FOR SELECT TO crm_event_ingest USING (true);
CREATE POLICY ingest_event_insert ON crm_event_engine.events FOR INSERT TO crm_event_ingest WITH CHECK (true);
CREATE POLICY report_event_read ON crm_event_engine.events FOR SELECT TO crm_event_report USING (true);
CREATE POLICY ingest_error_read ON crm_event_engine.integration_errors FOR SELECT TO crm_event_ingest USING (true);
CREATE POLICY ingest_error_insert ON crm_event_engine.integration_errors FOR INSERT TO crm_event_ingest WITH CHECK (true);
CREATE POLICY ingest_error_update ON crm_event_engine.integration_errors FOR UPDATE TO crm_event_ingest
  USING (true) WITH CHECK (true);
