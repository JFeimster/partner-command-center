-- Frictionless, idempotent enrollment for trusted Funding Agent Join intake.
-- This migration is intentionally local in this development batch. It preserves
-- operator decisions for ambiguous, paused, and terminated identities.
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
  v_application public.partner_applications%rowtype;
  v_partner public.partners%rowtype;
  v_matches integer;
  v_inserted boolean;
  v_auto_eligible boolean;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_form_id text := trim(coalesce(p_form_id, ''));
  v_source text := trim(coalesce(p_source, ''));
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_review_reason text;
begin
  if p_organization_id is null
     or v_source <> 'tally'
     or nullif(trim(coalesce(p_external_submission_id, '')), '') is null
     or position('@' in v_email) < 2
     or position('.' in split_part(v_email, '@', 2)) = 0
     or nullif(trim(coalesce(p_applicant_name, '')), '') is null
     or v_form_id not in ('rjM6do', 'mOe658') then
    raise exception 'invalid trusted partner join submission' using errcode = '22023';
  end if;

  v_auto_eligible := v_form_id in ('rjM6do', 'mOe658')
    and v_answers @> '{"consent_to_contact": true}'::jsonb;

  insert into public.partner_applications (
    organization_id, source, external_submission_id, email,
    applicant_name, agency_name, applicant_type, form_id, answers, status
  ) values (
    p_organization_id, v_source, trim(p_external_submission_id), v_email,
    trim(p_applicant_name), nullif(trim(coalesce(p_agency_name, '')), ''),
    coalesce(nullif(trim(p_applicant_type), ''), 'individual'), v_form_id,
    v_answers, 'new'
  )
  on conflict (organization_id, source, external_submission_id) do nothing
  returning * into v_application;
  v_inserted := found;

  if not v_inserted then
    select * into v_application
      from public.partner_applications a
     where a.organization_id = p_organization_id
       and a.source = v_source
       and a.external_submission_id = trim(p_external_submission_id)
     for update;
    if not found then
      raise exception 'canonical partner application missing after conflict';
    end if;
  end if;

  insert into public.partner_intake_events (
    organization_id, application_id, source, external_event_id, event_type, summary
  ) values (
    p_organization_id, v_application.id, v_source, trim(p_external_submission_id),
    'application_received', 'Trusted partner join received'
  )
  on conflict (organization_id, source, external_event_id) do nothing;

  -- Invalid consent stays in the existing operator queue. A signed delivery is
  -- not enough to enroll an applicant without an affirmative consent answer.
  if not v_auto_eligible or v_application.status in ('declined', 'nurture') then
    return query select v_application.id, v_application.status, not v_inserted;
    return;
  end if;

  if v_application.partner_id is not null then
    select * into v_partner
      from public.partners p
     where p.id = v_application.partner_id
       and p.organization_id = p_organization_id
     for update;
    if not found then
      raise exception 'linked partner record is unavailable for this organization' using errcode = '23503';
    end if;
  else
    select count(*) into v_matches
      from public.partners p
     where p.organization_id = p_organization_id
       and lower(trim(p.contact_email)) = v_email;

    if v_matches > 1 then
      v_review_reason := 'Multiple partner records match the verified intake email';
    elsif v_matches = 1 then
      select * into v_partner
        from public.partners p
       where p.organization_id = p_organization_id
         and lower(trim(p.contact_email)) = v_email
       for update;
    else
      insert into public.partners (
        organization_id, partner_code, external_id, name, status,
        contact_email, partner_type, metadata
      ) values (
        p_organization_id,
        'pcc-' || left(replace(v_application.id::text, '-', ''), 16),
        'partner_application:' || v_application.id::text,
        coalesce(nullif(trim(v_application.agency_name), ''), trim(v_application.applicant_name)),
        'active', v_email, 'affiliate_partner',
        jsonb_build_object(
          'origin', 'tally_partner_join',
          'application_id', v_application.id,
          'source', v_source,
          'form_id', v_form_id,
          'external_submission_id', v_application.external_submission_id,
          'auto_enrolled', true,
          'consent_recorded_at', now()
        )
      ) returning * into v_partner;
    end if;
  end if;

  if v_review_reason is not null
     or v_partner.status in ('paused', 'terminated') then
    v_review_reason := coalesce(v_review_reason,
      'Existing partner access is paused or terminated; operator review is required');
    update public.partner_applications
       set status = 'needs_review', updated_at = now()
     where id = v_application.id and status <> 'approved';
    insert into public.partner_intake_events (
      organization_id, application_id, partner_id, source, external_event_id,
      event_type, summary, payload
    ) values (
      p_organization_id, v_application.id, v_partner.id, v_source,
      trim(p_external_submission_id) || ':review', 'identity_review_required',
      v_review_reason, jsonb_build_object('reason', v_review_reason)
    ) on conflict (organization_id, source, external_event_id) do nothing;
    select * into v_application from public.partner_applications where id = v_application.id;
    return query select v_application.id, v_application.status, not v_inserted;
    return;
  end if;

  if v_partner.status = 'pending' then
    update public.partners set status = 'active', updated_at = now()
     where id = v_partner.id and organization_id = p_organization_id;
  end if;

  update public.partner_applications
     set partner_id = v_partner.id, status = 'approved', updated_at = now()
   where id = v_application.id;

  insert into public.partner_intake_events (
    organization_id, application_id, partner_id, source, external_event_id,
    event_type, summary, payload
  ) values (
    p_organization_id, v_application.id, v_partner.id, v_source,
    trim(p_external_submission_id) || ':auto_enrolled',
    'application_auto_approved', 'Partner enrollment automatically approved',
    jsonb_build_object(
      'from_status', v_application.status,
      'to_status', 'approved',
      'partner_id', v_partner.id,
      'form_id', v_form_id,
      'external_submission_id', v_application.external_submission_id,
      'consent_verified', true,
      'profile_status', 'draft',
      'public_microsite_enabled', false
    )
  ) on conflict (organization_id, source, external_event_id) do nothing;

  if not exists (
    select 1 from public.activity_logs l
     where l.organization_id = p_organization_id
       and l.action = 'partner_application.auto_enrolled'
       and l.entity_type = 'partner_application'
       and l.entity_id = v_application.id
       and l.source = 'tally'
  ) then
    insert into public.activity_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
    ) values (
      p_organization_id, null, 'partner_application.auto_enrolled',
      'partner_application', v_application.id, 'tally',
      jsonb_build_object('partner_id', v_partner.id, 'form_id', v_form_id,
                         'submission_id', v_application.external_submission_id,
                         'profile_status', 'draft')
    );
  end if;

  return query select v_application.id, 'approved'::text, not v_inserted;
end;
$$;

revoke all on function public.ingest_partner_application(uuid,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.ingest_partner_application(uuid,text,text,text,text,text,text,text,jsonb)
  to service_role;
