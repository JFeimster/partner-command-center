-- Create one operator follow-up when a verified partner claims an incomplete
-- profile; close it when the required business context is complete. This is
-- event-driven and does not backfill existing partner accounts.
create or replace function app_private.sync_partner_profile_completion_task(
  p_organization_id uuid,
  p_partner_id uuid,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner public.partners%rowtype;
  v_profile jsonb;
  v_verified_claim boolean;
  v_complete boolean;
  v_task_id uuid;
  v_task_status text;
  v_changed_id uuid;
  v_action text;
begin
  select p.* into v_partner
  from public.partners p
  where p.id = p_partner_id and p.organization_id = p_organization_id;
  if not found then return; end if;

  v_profile := case when jsonb_typeof(v_partner.metadata->'portal_profile') = 'object'
    then v_partner.metadata->'portal_profile' else '{}'::jsonb end;
  v_complete := nullif(btrim(coalesce(v_partner.contact_phone, '')), '') is not null
    and (
      nullif(btrim(coalesce(v_profile->>'website_url', '')), '') is not null
      or nullif(btrim(coalesce(v_profile->>'service_area', '')), '') is not null
    );
  v_task_id := md5('partner-profile-completion:' || v_partner.id::text)::uuid;

  select exists (
    select 1
    from public.partner_portal_accounts a
    join auth.users u on u.id = a.user_id
    where a.organization_id = p_organization_id
      and a.partner_id = p_partner_id
      and a.status = 'active'
      and a.created_by = a.user_id
      and u.email_confirmed_at is not null
      and lower(btrim(u.email)) = lower(btrim(v_partner.contact_email))
  ) into v_verified_claim;

  if v_partner.status is distinct from 'active'
     or coalesce(v_partner.metadata->>'fictional', 'false') = 'true'
     or not v_verified_claim then
    update public.partner_follow_up_tasks
      set status = 'completed', updated_at = now()
      where id = v_task_id and organization_id = p_organization_id
        and status = 'open'
      returning id into v_changed_id;
    if v_changed_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        p_organization_id, p_actor_user_id, 'partner_task.completed',
        'partner_follow_up_task', v_changed_id, 'partner_command_automation',
        jsonb_build_object('automation_key', 'partner_profile_completion_v1', 'partner_id', p_partner_id, 'reason', 'partner_access_inactive')
      );
    end if;
    return;
  end if;

  if v_complete then
    update public.partner_follow_up_tasks
      set status = 'completed', updated_at = now()
      where id = v_task_id and organization_id = p_organization_id
        and status = 'open'
      returning id into v_changed_id;
    if v_changed_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        p_organization_id, p_actor_user_id, 'partner_task.completed',
        'partner_follow_up_task', v_changed_id, 'partner_command_automation',
        jsonb_build_object('automation_key', 'partner_profile_completion_v1', 'partner_id', p_partner_id, 'reason', 'profile_completed')
      );
    end if;
    return;
  end if;

  select t.status into v_task_status
  from public.partner_follow_up_tasks t
  where t.id = v_task_id and t.organization_id = p_organization_id;

  if v_task_status = 'open' then return; end if;
  if v_task_status = 'completed' then
    update public.partner_follow_up_tasks
      set status = 'open', due_at = now() + interval '3 days', updated_at = now()
      where id = v_task_id and organization_id = p_organization_id
        and status = 'completed'
      returning id into v_changed_id;
    if v_changed_id is not null then v_action := 'partner_task.reopened'; end if;
  else
    insert into public.partner_follow_up_tasks (
      id, organization_id, partner_id, title, status, owner_user_id, due_at, notes
    ) values (
      v_task_id, p_organization_id, p_partner_id,
      'Complete partner business profile', 'open', null, now() + interval '3 days',
      'Auto-created after a verified partner account claim. Add a contact phone and either a business website or service area.'
    ) on conflict (id) do nothing returning id into v_changed_id;
    if v_changed_id is not null then v_action := 'partner_task.created'; end if;
  end if;

  if v_changed_id is not null then
    insert into public.activity_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
    ) values (
      p_organization_id, p_actor_user_id, v_action,
      'partner_follow_up_task', v_changed_id, 'partner_command_automation',
      jsonb_build_object('automation_key', 'partner_profile_completion_v1', 'partner_id', p_partner_id)
    );
  end if;
end;
$$;

revoke all on function app_private.sync_partner_profile_completion_task(uuid, uuid, uuid)
  from public, anon, authenticated;

create or replace function app_private.sync_partner_profile_completion_task_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_old jsonb;
begin
  if tg_table_name = 'partners' and tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    if v_row->>'contact_phone' is not distinct from v_old->>'contact_phone'
       and v_row->>'status' is not distinct from v_old->>'status'
       and v_row->'metadata'->'portal_profile' is not distinct from v_old->'metadata'->'portal_profile' then
      return new;
    end if;
  end if;
  perform app_private.sync_partner_profile_completion_task(
    (v_row->>'organization_id')::uuid,
    coalesce(v_row->>'partner_id', v_row->>'id')::uuid,
    coalesce(v_row->>'user_id', (select auth.uid())::text)::uuid
  );
  return new;
end;
$$;

revoke all on function app_private.sync_partner_profile_completion_task_trigger()
  from public, anon, authenticated;

drop trigger if exists sync_partner_profile_completion_task_on_claim on public.partner_portal_accounts;
create trigger sync_partner_profile_completion_task_on_claim
  after insert or update of status, created_by, user_id, partner_id
  on public.partner_portal_accounts
  for each row execute function app_private.sync_partner_profile_completion_task_trigger();

drop trigger if exists sync_partner_profile_completion_task_on_profile on public.partners;
create trigger sync_partner_profile_completion_task_on_profile
  after insert or update of contact_phone, metadata, status
  on public.partners
  for each row execute function app_private.sync_partner_profile_completion_task_trigger();
