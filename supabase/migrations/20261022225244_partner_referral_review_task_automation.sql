-- Create an internal review task when an approved partner submits a consented
-- portal referral. This migration adds a trigger only; it does not replay data.
create or replace function app_private.sync_partner_referral_review_task()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner_status text;
  v_partner_metadata jsonb;
  v_lead_source text;
  v_lead_consent_at timestamptz;
  v_lead_metadata jsonb;
  v_lead_email text;
  v_task_id uuid;
  v_task_notes text;
  v_created_id uuid;
  v_completed_id uuid;
begin
  v_task_id := md5('partner-referral-review:' || new.id::text)::uuid;
  v_task_notes := 'Auto-created from a verified partner portal referral. referral_id=' || new.id::text;

  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'submitted' then
    select p.status, p.metadata, l.source, l.consent_at, l.metadata, l.email
      into v_partner_status, v_partner_metadata, v_lead_source,
           v_lead_consent_at, v_lead_metadata, v_lead_email
    from public.partners p
    join public.leads l
      on l.id = new.lead_id
     and l.organization_id = new.organization_id
    where p.id = new.partner_id
      and p.organization_id = new.organization_id;

    if not found
       or v_partner_status <> 'active'
       or coalesce(v_partner_metadata->>'fictional', 'false') = 'true'
       or v_lead_source is distinct from 'partner_portal'
       or v_lead_consent_at is null
       or coalesce(v_lead_metadata->>'fictional', 'false') = 'true'
       or app_private.is_reserved_wix_contact_email(v_lead_email) then
      return new;
    end if;

    insert into public.partner_follow_up_tasks (
      id, organization_id, partner_id, title, status, owner_user_id, due_at, notes
    ) values (
      v_task_id, new.organization_id, new.partner_id,
      'Review submitted partner referral', 'open', null, now() + interval '1 day', v_task_notes
    )
    on conflict (id) do nothing
    returning id into v_created_id;

    if v_created_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        new.organization_id, (select auth.uid()), 'partner_task.created',
        'partner_follow_up_task', v_created_id, 'partner_command_automation',
        jsonb_build_object(
          'automation_key', 'partner_referral_review_v1',
          'partner_id', new.partner_id,
          'referral_id', new.id,
          'referral_status', new.status
        )
      );
    end if;
  elsif tg_op = 'UPDATE' and old.status = 'submitted' and new.status <> 'submitted' then
    update public.partner_follow_up_tasks
      set status = 'completed', updated_at = now()
      where id = v_task_id
        and organization_id = old.organization_id
        and partner_id = old.partner_id
        and title = 'Review submitted partner referral'
        and notes = v_task_notes
        and status = 'open'
      returning id into v_completed_id;

    if v_completed_id is not null then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        old.organization_id, (select auth.uid()), 'partner_task.completed',
        'partner_follow_up_task', v_completed_id, 'partner_command_automation',
        jsonb_build_object(
          'automation_key', 'partner_referral_review_v1',
          'partner_id', old.partner_id,
          'referral_id', old.id,
          'referral_status', new.status
        )
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.sync_partner_referral_review_task() from public, anon, authenticated;
drop trigger if exists sync_partner_referral_review_task on public.referrals;
create trigger sync_partner_referral_review_task
  after insert or update of status on public.referrals
  for each row execute function app_private.sync_partner_referral_review_task();
