-- Keep real partner CRM delivery exceptions visible in the canonical operator task ledger.
-- This is event-driven and does not backfill historical outbox rows.
create or replace function app_private.sync_wix_contact_sync_follow_up_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner_id uuid;
  v_application_id uuid;
  v_task_id uuid;
  v_task_title text;
  v_task_notes text;
  v_changed_id uuid;
  v_action text;
begin
  if new.entity_kind not in ('partner', 'partner_application') then
    return new;
  end if;

  if new.status in ('failed', 'needs_mapping') then
    if new.entity_kind = 'partner' then
      select p.id into v_partner_id
      from public.partners p
      where p.id = new.entity_id
        and p.organization_id = new.organization_id
        and nullif(btrim(p.contact_email), '') is not null
        and coalesce(p.metadata->>'fictional', 'false') <> 'true'
        and not app_private.is_reserved_wix_contact_email(p.contact_email);
      if not found then return new; end if;
    else
      select a.partner_id into v_partner_id
      from public.partner_applications a
      where a.id = new.entity_id
        and a.organization_id = new.organization_id
        and nullif(btrim(a.email), '') is not null
        and coalesce(a.answers->>'fictional', 'false') <> 'true'
        and not app_private.is_reserved_wix_contact_email(a.email)
        and lower(coalesce(a.source, '')) not in ('activation_test', 'synthetic', 'qa');
      if not found then return new; end if;
      v_application_id := new.entity_id;
      if v_partner_id is not null and not exists (
        select 1 from public.partners p
        where p.id = v_partner_id
          and p.organization_id = new.organization_id
          and coalesce(p.metadata->>'fictional', 'false') <> 'true'
      ) then
        v_partner_id := null;
      end if;
    end if;

    v_task_id := md5('wix-contact-sync-exception:' || new.id::text)::uuid;
    v_task_title := case new.status
      when 'needs_mapping' then 'Resolve Wix partner contact mapping'
      else 'Retry failed Wix partner sync'
    end;
    v_task_notes := 'Auto-created for a Wix partner sync exception. Review the linked record and Wix sync queue. outbox_event_id=' || new.id::text;

    insert into public.partner_follow_up_tasks (
      id, organization_id, application_id, partner_id, title, status,
      owner_user_id, due_at, notes
    ) values (
      v_task_id, new.organization_id, v_application_id, v_partner_id,
      v_task_title, 'open', null, now() + interval '1 day', v_task_notes
    ) on conflict (id) do nothing
    returning id into v_changed_id;

    if v_changed_id is not null then
      v_action := 'partner_task.created';
    else
      update public.partner_follow_up_tasks t
      set status = 'open',
          title = v_task_title,
          due_at = case when t.status = 'open' then t.due_at else now() + interval '1 day' end,
          notes = v_task_notes,
          updated_at = now()
      where t.id = v_task_id
        and t.organization_id = new.organization_id
        and t.status in ('completed', 'cancelled')
      returning t.id into v_changed_id;
      if v_changed_id is not null then v_action := 'partner_task.reopened'; end if;
    end if;

    if v_changed_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        new.organization_id, (select auth.uid()), v_action,
        'partner_follow_up_task', v_changed_id, 'partner_command_automation',
        jsonb_build_object(
          'automation_key', 'wix_contact_sync_exception_v1',
          'outbox_event_id', new.id,
          'entity_kind', new.entity_kind,
          'entity_id', new.entity_id,
          'sync_status', new.status,
          'last_error_code', new.last_error_code
        )
      );
    end if;
  elsif new.status in ('synced', 'ignored') then
    v_task_id := md5('wix-contact-sync-exception:' || new.id::text)::uuid;
    v_task_notes := 'Auto-created for a Wix partner sync exception. Review the linked record and Wix sync queue. outbox_event_id=' || new.id::text;

    update public.partner_follow_up_tasks t
    set status = 'completed', updated_at = now()
    where t.id = v_task_id
      and t.organization_id = new.organization_id
      and t.notes = v_task_notes
      and t.status = 'open'
    returning t.id into v_changed_id;

    if v_changed_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        new.organization_id, (select auth.uid()), 'partner_task.completed',
        'partner_follow_up_task', v_changed_id, 'partner_command_automation',
        jsonb_build_object(
          'automation_key', 'wix_contact_sync_exception_v1',
          'outbox_event_id', new.id,
          'entity_kind', new.entity_kind,
          'entity_id', new.entity_id,
          'sync_status', new.status
        )
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.sync_wix_contact_sync_follow_up_task()
  from public, anon, authenticated;

drop trigger if exists sync_wix_contact_sync_follow_up_task
  on public.wix_contact_sync_outbox;
create trigger sync_wix_contact_sync_follow_up_task
  after insert or update of status on public.wix_contact_sync_outbox
  for each row execute function app_private.sync_wix_contact_sync_follow_up_task();
