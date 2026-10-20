-- Make operator status changes atomic with the canonical event/audit record.
drop policy if exists partner_applications_operator_update on public.partner_applications;
drop policy if exists partner_follow_up_tasks_operator_update on public.partner_follow_up_tasks;
revoke update on public.partner_applications from authenticated;
revoke update on public.partner_follow_up_tasks from authenticated;

create or replace function public.triage_partner_application(
  p_application_id uuid, p_status text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_application public.partner_applications%rowtype;
begin
  if p_status not in ('needs_review', 'qualified', 'onboarding', 'nurture') then
    raise exception 'Unsupported triage status' using errcode = '22023';
  end if;
  select * into v_application from public.partner_applications
    where id = p_application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if not (select app_private.is_partner_portal_operator(v_application.organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if v_application.status in ('approved', 'declined') then
    raise exception 'Finalized application cannot be triaged' using errcode = '22023';
  end if;
  if v_application.status = p_status then
    return p_status;
  end if;

  update public.partner_applications
    set status = p_status, updated_at = now()
    where id = p_application_id;
  insert into public.partner_intake_events (
    organization_id, application_id, partner_id, source, event_type, summary, payload
  ) values (
    v_application.organization_id, v_application.id, v_application.partner_id,
    'partner_command', 'operator_triage', 'Application triaged by operator',
    jsonb_build_object('from_status', v_application.status,
                       'to_status', p_status, 'actor_user_id', (select auth.uid()))
  );
  return p_status;
end;
$$;

create or replace function public.complete_partner_follow_up(p_task_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_task public.partner_follow_up_tasks%rowtype;
begin
  select * into v_task from public.partner_follow_up_tasks
    where id = p_task_id for update;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  if not (select app_private.is_partner_portal_operator(v_task.organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if v_task.status = 'completed' then
    return true;
  end if;
  if v_task.status <> 'open' then
    raise exception 'Only open tasks can be completed' using errcode = '22023';
  end if;

  update public.partner_follow_up_tasks
    set status = 'completed', updated_at = now()
    where id = p_task_id;
  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    v_task.organization_id, (select auth.uid()), 'partner_task.completed',
    'partner_follow_up_task', v_task.id, 'partner_command',
    jsonb_build_object('partner_id', v_task.partner_id,
                       'application_id', v_task.application_id)
  );
  return true;
end;
$$;

revoke all on function public.triage_partner_application(uuid,text) from public;
revoke all on function public.complete_partner_follow_up(uuid) from public;
revoke execute on function public.triage_partner_application(uuid,text) from anon;
revoke execute on function public.complete_partner_follow_up(uuid) from anon;
grant execute on function public.triage_partner_application(uuid,text) to authenticated;
grant execute on function public.complete_partner_follow_up(uuid) to authenticated;
