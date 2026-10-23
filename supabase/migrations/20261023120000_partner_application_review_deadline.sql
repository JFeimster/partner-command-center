-- Give newly created automatic application-review work an actionable SLA.
-- Existing task records are intentionally left unchanged.
create or replace function app_private.set_partner_application_review_task_deadline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'open'
     and new.application_id is not null
     and new.title = 'Review new partner application'
     and new.notes = 'Auto-created from a partner application event. Open the linked application and record the appropriate next status.'
     and new.due_at is null then
    new.due_at := coalesce(new.created_at, now()) + interval '2 days';
  end if;

  return new;
end;
$$;

revoke all on function app_private.set_partner_application_review_task_deadline()
  from public, anon, authenticated;

drop trigger if exists set_partner_application_review_task_deadline
  on public.partner_follow_up_tasks;
create trigger set_partner_application_review_task_deadline
  before insert on public.partner_follow_up_tasks
  for each row execute function app_private.set_partner_application_review_task_deadline();
