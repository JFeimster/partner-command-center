-- Atomic, idempotent canonical partner intake for the trusted Edge Function.
-- Invoker permissions: callable only with Supabase service_role; not exposed to browser roles.
create or replace function public.ingest_partner_application(
  p_organization_id uuid,
  p_source text,
  p_external_submission_id text,
  p_email text,
  p_applicant_name text,
  p_agency_name text,
  p_applicant_type text,
  p_form_id text,
  p_answers jsonb
)
returns table(application_id uuid, application_status text, was_duplicate boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_status text;
  v_inserted boolean;
begin
  if p_organization_id is null or nullif(btrim(p_source), '') is null
    or nullif(btrim(p_external_submission_id), '') is null
    or nullif(btrim(p_email), '') is null then
    raise exception 'missing canonical partner submission identity';
  end if;

  insert into public.partner_applications (
    organization_id, source, external_submission_id, email,
    applicant_name, agency_name, applicant_type, form_id, answers, status
  ) values (
    p_organization_id, p_source, p_external_submission_id, p_email,
    p_applicant_name, nullif(p_agency_name, ''), p_applicant_type,
    nullif(p_form_id, ''), coalesce(p_answers, '{}'::jsonb), 'new'
  )
  on conflict (organization_id, source, external_submission_id) do nothing
  returning id, status into v_id, v_status;
  v_inserted := found;

  if not v_inserted then
    select a.id, a.status into v_id, v_status
      from public.partner_applications a
      where a.organization_id = p_organization_id
        and a.source = p_source
        and a.external_submission_id = p_external_submission_id;
    if v_id is null then
      raise exception 'canonical partner application missing after conflict';
    end if;
  end if;

  -- Both statements commit together or roll back together, including event failures.
  -- A preexisting application without an event is repaired on exact replay.
  insert into public.partner_intake_events (
    organization_id, application_id, source, external_event_id, event_type, summary
  ) values (
    p_organization_id, v_id, p_source, p_external_submission_id,
    'application_received', 'New partner application received'
  )
  on conflict (organization_id, source, external_event_id) do nothing;

  return query select v_id, v_status, not v_inserted;
end;
$$;

-- Public is a PostgreSQL role grant, not a schema visibility setting.
revoke all on function public.ingest_partner_application(uuid,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.ingest_partner_application(uuid,text,text,text,text,text,text,text,jsonb)
  to service_role;
