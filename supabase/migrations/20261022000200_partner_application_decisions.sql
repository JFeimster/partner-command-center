-- Operator decisions advance canonical partner applications. Approval links
-- or creates one pending partner record; activation remains a separate action.
create or replace function public.approve_partner_application(p_application_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_application public.partner_applications%rowtype;
  v_partner public.partners%rowtype;
  v_matches integer;
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into v_application from public.partner_applications
    where id = p_application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if not (select app_private.is_partner_portal_operator(v_application.organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if v_application.status = 'approved' and v_application.partner_id is not null then
    return v_application.partner_id;
  end if;
  if v_application.status not in ('qualified', 'onboarding') then
    raise exception 'Application must be qualified or onboarding before approval' using errcode = '22023';
  end if;
  if coalesce(trim(v_application.email), '') = '' or
     coalesce(trim(v_application.agency_name), trim(v_application.applicant_name), '') = '' then
    raise exception 'Application needs a name and email before approval' using errcode = '22023';
  end if;

  if v_application.partner_id is not null then
    select * into v_partner from public.partners p
      where p.id = v_application.partner_id
        and p.organization_id = v_application.organization_id for update;
    if not found then
      raise exception 'Linked partner record is unavailable for this organization' using errcode = '23503';
    end if;
    if v_partner.status = 'terminated' then
      raise exception 'Terminated partner records cannot be approved for reactivation' using errcode = '22023';
    end if;
  else
    select count(*) into v_matches from public.partners p
      where p.organization_id = v_application.organization_id
        and lower(trim(p.contact_email)) = lower(trim(v_application.email))
        and p.status <> 'terminated';
    if v_matches > 1 then
      raise exception 'Multiple partner records match this email; operator review is required' using errcode = '22023';
    elsif v_matches = 1 then
      select * into v_partner from public.partners p
        where p.organization_id = v_application.organization_id
          and lower(trim(p.contact_email)) = lower(trim(v_application.email))
          and p.status <> 'terminated' for update;
    else
      insert into public.partners (
        organization_id, partner_code, external_id, name, status,
        contact_email, partner_type, created_by, metadata
      ) values (
        v_application.organization_id,
        'pcc-' || left(replace(v_application.id::text, '-', ''), 16),
        'partner_application:' || v_application.id::text,
        coalesce(nullif(trim(v_application.agency_name), ''), trim(v_application.applicant_name)),
        'pending', lower(trim(v_application.email)), 'unknown', v_actor,
        jsonb_build_object('origin', 'partner_application', 'application_id', v_application.id,
                           'source', v_application.source)
      ) returning * into v_partner;
    end if;
  end if;

  update public.partner_applications
    set partner_id = v_partner.id, status = 'approved', updated_at = now()
    where id = v_application.id;
  insert into public.partner_intake_events (
    organization_id, application_id, partner_id, source, event_type, summary, payload
  ) values (
    v_application.organization_id, v_application.id, v_partner.id,
    'partner_command', 'operator_approved', 'Application approved by operator',
    jsonb_build_object('from_status', v_application.status, 'to_status', 'approved',
                       'partner_id', v_partner.id, 'actor_user_id', v_actor)
  );
  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    v_application.organization_id, v_actor, 'partner_application.approved',
    'partner_application', v_application.id, 'partner_command',
    jsonb_build_object('partner_id', v_partner.id)
  );
  if not exists (
    select 1 from public.partner_follow_up_tasks t
    where t.organization_id = v_application.organization_id
      and t.application_id = v_application.id and t.status = 'open'
      and t.title = 'Send partner portal claim instructions'
  ) then
    insert into public.partner_follow_up_tasks (
      organization_id, application_id, partner_id, title, status, owner_user_id, notes
    ) values (
      v_application.organization_id, v_application.id, v_partner.id,
      'Send partner portal claim instructions', 'open', v_actor,
      'Confirm the verified application email, then share the portal sign-in route. No message is sent automatically.'
    );
  end if;
  return v_partner.id;
end;
$$;

create or replace function public.decline_partner_application(
  p_application_id uuid, p_reason text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_application public.partner_applications%rowtype;
  v_reason text := trim(coalesce(p_reason, ''));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if length(v_reason) < 3 or length(v_reason) > 500 then
    raise exception 'A concise decision reason is required' using errcode = '22023';
  end if;
  select * into v_application from public.partner_applications
    where id = p_application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if not (select app_private.is_partner_portal_operator(v_application.organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if v_application.status = 'declined' then
    return v_application.status;
  end if;
  if v_application.status = 'approved' then
    raise exception 'An approved application cannot be declined' using errcode = '22023';
  end if;
  update public.partner_applications
    set status = 'declined', updated_at = now()
    where id = v_application.id;
  insert into public.partner_intake_events (
    organization_id, application_id, partner_id, source, event_type, summary, payload
  ) values (
    v_application.organization_id, v_application.id, v_application.partner_id,
    'partner_command', 'operator_declined', 'Application declined by operator',
    jsonb_build_object('from_status', v_application.status, 'to_status', 'declined',
                       'reason', v_reason, 'actor_user_id', (select auth.uid()))
  );
  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    v_application.organization_id, (select auth.uid()), 'partner_application.declined',
    'partner_application', v_application.id, 'partner_command',
    jsonb_build_object('reason', v_reason)
  );
  return 'declined';
end;
$$;

revoke all on function public.approve_partner_application(uuid) from public;
revoke all on function public.decline_partner_application(uuid, text) from public;
revoke execute on function public.approve_partner_application(uuid) from anon;
revoke execute on function public.decline_partner_application(uuid, text) from anon;
grant execute on function public.approve_partner_application(uuid) to authenticated;
grant execute on function public.decline_partner_application(uuid, text) to authenticated;
