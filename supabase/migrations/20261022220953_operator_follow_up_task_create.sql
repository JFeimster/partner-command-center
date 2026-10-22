-- Operator-created follow-up tasks use the existing task ledger and organization boundary.
-- A caller-supplied UUID lets a form replay safely without creating duplicate work.
create or replace function public.create_partner_follow_up_task(
  p_organization_id uuid,
  p_task_id uuid,
  p_title text,
  p_notes text default null,
  p_due_at timestamptz default null,
  p_application_id uuid default null,
  p_partner_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := (select auth.uid());
  v_linked_partner_id uuid;
  v_partner_id uuid;
  v_application_answers jsonb;
  v_inserted_id uuid;
  v_title text := trim(coalesce(p_title, ''));
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_organization_id is null or not (select app_private.is_partner_portal_operator(p_organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if p_task_id is null or length(v_title) not between 3 and 160 or length(coalesce(v_notes, '')) > 2000 then
    raise exception 'Invalid task details' using errcode = '22023';
  end if;
  if p_application_id is not null then
    select a.partner_id, a.answers into v_linked_partner_id, v_application_answers
    from public.partner_applications a
    where a.id = p_application_id and a.organization_id = p_organization_id;
    if not found then
      raise exception 'Application is unavailable for this organization' using errcode = '42501';
    end if;
    if coalesce(v_application_answers->>'fictional', 'false') = 'true' then
      raise exception 'Test applications cannot receive operational tasks' using errcode = '22023';
    end if;
    if p_partner_id is not null and v_linked_partner_id is distinct from p_partner_id then
      raise exception 'Application and partner do not match' using errcode = '22023';
    end if;
    v_partner_id := coalesce(p_partner_id, v_linked_partner_id);
  else
    v_partner_id := p_partner_id;
  end if;
  if v_partner_id is not null and not exists (
    select 1 from public.partners p
    where p.id = v_partner_id and p.organization_id = p_organization_id
      and coalesce(p.metadata->>'fictional', 'false') <> 'true'
  ) then
    raise exception 'Partner is unavailable for this organization' using errcode = '42501';
  end if;

  insert into public.partner_follow_up_tasks (
    id, organization_id, application_id, partner_id, title, status,
    owner_user_id, due_at, notes
  ) values (
    p_task_id, p_organization_id, p_application_id, v_partner_id, v_title, 'open',
    v_actor, p_due_at, v_notes
  ) on conflict (id) do nothing returning id into v_inserted_id;

  if v_inserted_id is null then
    return p_task_id;
  end if;

  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    p_organization_id, v_actor, 'partner_task.created', 'partner_follow_up_task',
    v_inserted_id, 'partner_command',
    jsonb_build_object('application_id', p_application_id, 'partner_id', v_partner_id)
  );
  return v_inserted_id;
end;
$$;

revoke all on function public.create_partner_follow_up_task(uuid, uuid, text, text, timestamptz, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.create_partner_follow_up_task(uuid, uuid, text, text, timestamptz, uuid, uuid)
  to authenticated;
