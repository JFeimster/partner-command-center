-- Create one internal review task for each real application review event.
-- This migration adds triggers only; it does not replay existing applications.
create unique index if not exists partner_follow_up_tasks_one_open_auto_review_idx
  on public.partner_follow_up_tasks (organization_id, application_id)
  where application_id is not null
    and title = 'Review new partner application'
    and notes = 'Auto-created from a partner application event. Open the linked application and record the appropriate next status.'
    and status = 'open';

create or replace function app_private.sync_partner_application_review_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auto_notes constant text := 'Auto-created from a partner application event. Open the linked application and record the appropriate next status.';
  v_created_id uuid;
  v_completed_id uuid;
  v_review_needed boolean;
begin
  if tg_op = 'UPDATE'
     and new.status is not distinct from old.status
     and new.email is not distinct from old.email
     and new.answers is not distinct from old.answers
     and new.partner_id is not distinct from old.partner_id then
    return new;
  end if;

  v_review_needed := new.status in ('new', 'needs_review')
    and nullif(btrim(new.email), '') is not null
    and coalesce(new.answers->>'fictional', 'false') <> 'true'
    and (
      new.partner_id is null
      or exists (
        select 1
        from public.partners p
        where p.id = new.partner_id
          and p.organization_id = new.organization_id
          and coalesce(p.metadata->>'fictional', 'false') <> 'true'
      )
    );

  if v_review_needed then
    insert into public.partner_follow_up_tasks (
      id, organization_id, application_id, partner_id, title, status, owner_user_id, notes
    ) values (
      md5('partner-application-review:' || new.id::text || ':' || new.updated_at::text)::uuid,
      new.organization_id, new.id, new.partner_id,
      'Review new partner application', 'open', null, v_auto_notes
    )
    on conflict do nothing
    returning id into v_created_id;

    if v_created_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        new.organization_id, (select auth.uid()), 'partner_task.created',
        'partner_follow_up_task', v_created_id, 'partner_command_automation',
        jsonb_build_object(
          'application_id', new.id,
          'automation_key', 'partner_application_review_v1',
          'application_status', new.status
        )
      );
    end if;
  elsif tg_op = 'UPDATE'
    and old.status in ('new', 'needs_review')
    and (new.status not in ('new', 'needs_review') or not v_review_needed) then
    update public.partner_follow_up_tasks
      set status = 'completed', updated_at = now()
      where organization_id = old.organization_id
        and application_id = old.id
        and title = 'Review new partner application'
        and notes = v_auto_notes
        and status = 'open'
      returning id into v_completed_id;

    if v_completed_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        old.organization_id, (select auth.uid()), 'partner_task.completed',
        'partner_follow_up_task', v_completed_id, 'partner_command_automation',
        jsonb_build_object(
          'application_id', old.id,
          'automation_key', 'partner_application_review_v1',
          'application_status', new.status
        )
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.sync_partner_application_review_task() from public, anon, authenticated;
drop trigger if exists sync_partner_application_review_task on public.partner_applications;
create trigger sync_partner_application_review_task
  after insert or update of status, email, answers, partner_id on public.partner_applications
  for each row execute function app_private.sync_partner_application_review_task();
