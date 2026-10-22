-- Operator visibility and controlled retry for the service-role-only Wix outbox.
-- Contact details and raw provider payloads remain outside this operator projection.
create or replace function public.list_wix_contact_sync_exceptions(p_organization_id uuid)
returns table (
  id uuid,
  entity_kind text,
  entity_id uuid,
  status text,
  attempts integer,
  last_error_code text,
  created_at timestamptz,
  updated_at timestamptz,
  next_attempt_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select o.id, o.entity_kind, o.entity_id, o.status, o.attempts,
         o.last_error_code, o.created_at, o.updated_at, o.next_attempt_at
  from public.wix_contact_sync_outbox o
  where o.organization_id = p_organization_id
    and (select app_private.is_partner_portal_operator(p_organization_id))
    and o.status in ('retry', 'needs_mapping', 'failed')
  order by o.updated_at desc, o.id
  limit 200;
$$;

create or replace function public.retry_wix_contact_sync_event(
  p_organization_id uuid,
  p_event_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_event public.wix_contact_sync_outbox%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_organization_id is null
     or not (select app_private.is_partner_portal_operator(p_organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;

  select * into v_event
  from public.wix_contact_sync_outbox o
  where o.id = p_event_id and o.organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'Sync event is unavailable for this organization' using errcode = '42501';
  end if;
  if v_event.status not in ('retry', 'failed') then
    raise exception 'Only retryable Wix sync exceptions can be queued' using errcode = '22023';
  end if;

  update public.wix_contact_sync_outbox
  set status = 'pending', attempts = 0, next_attempt_at = now(),
      leased_until = null, last_error_code = null, updated_at = now()
  where id = v_event.id and organization_id = p_organization_id;

  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    p_organization_id, v_actor, 'wix_contact_sync.retry_requested',
    'wix_contact_sync_outbox', v_event.id, 'partner_command',
    jsonb_build_object('entity_kind', v_event.entity_kind, 'previous_status', v_event.status)
  );
  return true;
end;
$$;

revoke all on function public.list_wix_contact_sync_exceptions(uuid) from public, anon, authenticated;
revoke all on function public.retry_wix_contact_sync_event(uuid, uuid) from public, anon, authenticated;
grant execute on function public.list_wix_contact_sync_exceptions(uuid) to authenticated;
grant execute on function public.retry_wix_contact_sync_event(uuid, uuid) to authenticated;
