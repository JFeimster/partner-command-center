-- Close the operator's pending claim-instructions task after a verified
-- partner self-claims their active canonical account. No message is sent.
create or replace function app_private.complete_partner_claim_tasks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_partner_status text;
  v_partner_email text;
  v_user_email text;
  v_email_confirmed_at timestamptz;
  v_task record;
begin
  if new.status is distinct from 'active'
     or new.created_by is distinct from new.user_id then
    return new;
  end if;

  select p.status, lower(btrim(p.contact_email)), lower(btrim(u.email)), u.email_confirmed_at
    into v_partner_status, v_partner_email, v_user_email, v_email_confirmed_at
  from public.partners p
  join auth.users u on u.id = new.user_id
  where p.id = new.partner_id
    and p.organization_id = new.organization_id;

  if not found
     or v_partner_status is distinct from 'active'
     or v_partner_email is null
     or v_partner_email is distinct from v_user_email
     or v_email_confirmed_at is null then
    return new;
  end if;

  for v_task in
    select t.id, t.application_id
    from public.partner_follow_up_tasks t
    join public.partner_applications a
      on a.id = t.application_id
     and a.organization_id = t.organization_id
     and a.partner_id = new.partner_id
     and a.status = 'approved'
    where t.organization_id = new.organization_id
      and t.partner_id = new.partner_id
      and t.title = 'Send partner portal claim instructions'
      and t.notes = 'Confirm the verified application email, then share the portal sign-in route. No message is sent automatically.'
      and t.status = 'open'
  loop
    update public.partner_follow_up_tasks
      set status = 'completed', updated_at = now()
      where id = v_task.id and status = 'open';

    if found then
      insert into public.activity_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
      ) values (
        new.organization_id, new.user_id, 'partner_task.completed',
        'partner_follow_up_task', v_task.id, 'partner_command_automation',
        jsonb_build_object(
          'automation_key', 'partner_claim_task_v1',
          'partner_id', new.partner_id,
          'application_id', v_task.application_id,
          'portal_user_id', new.user_id
        )
      );
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function app_private.complete_partner_claim_tasks() from public, anon, authenticated;
drop trigger if exists complete_partner_claim_tasks on public.partner_portal_accounts;
create trigger complete_partner_claim_tasks
  after insert or update of status, created_by, user_id, partner_id on public.partner_portal_accounts
  for each row execute function app_private.complete_partner_claim_tasks();
