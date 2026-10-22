-- Event-derived, organization-scoped Wix Contacts projection.
-- No PII, raw form responses, API tokens, or financial documents are placed in this queue.
create table if not exists public.wix_contact_sync_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  source_event_id uuid not null,
  entity_kind text not null check (entity_kind in ('partner','partner_application','funding_lead','funding_deal')),
  entity_id uuid not null,
  status text not null default 'pending' check (status in ('pending','processing','retry','synced','needs_mapping','ignored','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  leased_until timestamptz,
  wix_contact_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_kind, source_event_id)
);
create index if not exists wix_contact_sync_due_idx
  on public.wix_contact_sync_outbox(status,next_attempt_at,created_at)
  where status in ('pending','retry','processing');
alter table public.wix_contact_sync_outbox enable row level security;
revoke all on public.wix_contact_sync_outbox from public, anon, authenticated;
grant select, insert, update on public.wix_contact_sync_outbox to service_role;

create or replace function app_private.enqueue_wix_partner_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.action <> 'partner.classification.updated' or new.source <> 'partner_command'
     or new.entity_type <> 'partner' or new.entity_id is null then return new; end if;
  if not exists (
    select 1 from public.partners p where p.id = new.entity_id
      and p.organization_id = new.organization_id
      and nullif(btrim(p.contact_email),'') is not null
      and coalesce(p.metadata->>'fictional','false') <> 'true'
  ) then return new; end if;
  insert into public.wix_contact_sync_outbox(organization_id,source_event_id,entity_kind,entity_id)
  values (new.organization_id,new.id,'partner',new.entity_id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_partner_event on public.activity_logs;
create trigger enqueue_wix_partner_event after insert on public.activity_logs
  for each row execute function app_private.enqueue_wix_partner_event();

create or replace function app_private.enqueue_wix_application_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  if nullif(btrim(new.email),'') is null
     or coalesce(new.answers->>'fictional','false') = 'true' then return new; end if;
  insert into public.wix_contact_sync_outbox(organization_id,source_event_id,entity_kind,entity_id)
  values(new.organization_id,case when tg_op='INSERT' then new.id else gen_random_uuid() end,'partner_application',new.id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_application_event on public.partner_applications;
create trigger enqueue_wix_application_event after insert or update of status on public.partner_applications
  for each row execute function app_private.enqueue_wix_application_event();

create or replace function app_private.enqueue_wix_funding_lead_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
  if nullif(btrim(new.email),'') is null
     or coalesce(new.metadata->>'fictional','false')='true' then return new; end if;
  insert into public.wix_contact_sync_outbox(organization_id,source_event_id,entity_kind,entity_id)
  values(new.organization_id,case when tg_op='INSERT' then new.id else gen_random_uuid() end,'funding_lead',new.id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_funding_lead_event on public.leads;
create trigger enqueue_wix_funding_lead_event after insert or update of status on public.leads
  for each row execute function app_private.enqueue_wix_funding_lead_event();

create or replace function app_private.enqueue_wix_funding_deal_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='UPDATE' and new.pipeline_stage is not distinct from old.pipeline_stage then return new; end if;
  if not exists (
    select 1 from public.leads l where l.id=new.lead_id
      and l.organization_id=new.organization_id and nullif(btrim(l.email),'') is not null
      and coalesce(l.metadata->>'fictional','false') <> 'true'
  ) then return new; end if;
  insert into public.wix_contact_sync_outbox(organization_id,source_event_id,entity_kind,entity_id)
  values(new.organization_id,case when tg_op='INSERT' then new.id else gen_random_uuid() end,'funding_deal',new.id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_funding_deal_event on public.brokerflow_deals;
create trigger enqueue_wix_funding_deal_event after insert or update of pipeline_stage on public.brokerflow_deals
  for each row execute function app_private.enqueue_wix_funding_deal_event();

-- Only the service role may claim queue work. A short lease allows recovery from worker crashes.
create or replace function public.claim_wix_contact_sync_outbox(p_limit integer default 10)
returns setof public.wix_contact_sync_outbox language sql security invoker set search_path = '' as $$
  with due as (
    select id from public.wix_contact_sync_outbox
    where attempts < 6 and (
      (status in ('pending','retry') and next_attempt_at <= now())
      or (status='processing' and leased_until < now())
    )
    order by created_at,id
    for update skip locked
    limit least(greatest(p_limit,1),20)
  )
  update public.wix_contact_sync_outbox e
  set status='processing', attempts=e.attempts+1,
      leased_until=now()+interval '3 minutes',updated_at=now()
  from due where e.id=due.id returning e.*;
$$;
revoke all on function public.claim_wix_contact_sync_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_wix_contact_sync_outbox(integer) to service_role;
