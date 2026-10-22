-- Give operators one actionable follow-up after a partner's first active
-- self-created portal link. Existing links are not backfilled.
create or replace function app_private.create_partner_first_link_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner_status text;
  v_partner_metadata jsonb;
  v_task_id uuid;
  v_task_notes text;
  v_created_id uuid;
begin
  if new.partner_id is null
     or new.is_active is distinct from true
     or new.created_by is null then
    return new;
  end if;

  if exists (
    select 1 from public.tracking_links prior
    where prior.organization_id = new.organization_id
      and prior.partner_id = new.partner_id
      and prior.is_active = true
      and prior.id <> new.id
  ) then
    return new;
  end if;

  select p.status, p.metadata
    into v_partner_status, v_partner_metadata
  from public.partners p
  where p.id = new.partner_id
    and p.organization_id = new.organization_id;

  if not found
     or v_partner_status is distinct from 'active'
     or coalesce(v_partner_metadata->>'fictional', 'false') = 'true'
     or not exists (
       select 1 from public.partner_portal_accounts a
       where a.organization_id = new.organization_id
         and a.partner_id = new.partner_id
         and a.user_id = new.created_by
         and a.created_by = a.user_id
         and a.status = 'active'
     ) then
    return new;
  end if;

  v_task_id := md5('partner-first-tracking-link-review:' || new.partner_id::text)::uuid;
  v_task_notes := 'Auto-created after the first active portal tracking link. link_id=' || new.id::text;

  insert into public.partner_follow_up_tasks (
    id, organization_id, partner_id, title, status, owner_user_id, due_at, notes
  ) values (
    v_task_id, new.organization_id, new.partner_id,
    'Review partner first tracking link', 'open', null, now() + interval '1 day', v_task_notes
  )
  on conflict (id) do nothing
  returning id into v_created_id;

  if v_created_id is not null then
    insert into public.activity_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
    ) values (
      new.organization_id, new.created_by, 'partner_task.created',
      'partner_follow_up_task', v_created_id, 'partner_command_automation',
      jsonb_build_object(
        'automation_key', 'partner_first_tracking_link_v1',
        'partner_id', new.partner_id,
        'tracking_link_id', new.id
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function app_private.create_partner_first_link_task() from public, anon, authenticated;
drop trigger if exists create_partner_first_link_task on public.tracking_links;
create trigger create_partner_first_link_task
  after insert or update of is_active, created_by, partner_id on public.tracking_links
  for each row execute function app_private.create_partner_first_link_task();
