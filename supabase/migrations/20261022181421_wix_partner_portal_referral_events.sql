-- Expand Wix Contacts event capture using verified partner source records.
-- No personal contact values or provider financial data are inserted into the outbox.

create or replace function app_private.enqueue_wix_application_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  if nullif(btrim(new.email),'') is null
     or coalesce(new.answers->>'fictional','false') = 'true'
     or lower(coalesce(new.source,'')) in ('activation_test','synthetic','qa') then
    return new;
  end if;
  insert into public.wix_contact_sync_outbox
    (organization_id,source_event_id,entity_kind,entity_id)
  values
    (new.organization_id,case when tg_op='INSERT' then new.id else gen_random_uuid() end,
     'partner_application',new.id)
  on conflict do nothing;
  return new;
end;
$$;

create or replace function app_private.enqueue_wix_new_partner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if nullif(btrim(new.contact_email),'') is null
    or coalesce(new.metadata->>'fictional','false')='true' then return new; end if;
  insert into public.wix_contact_sync_outbox
     (organization_id,source_event_id,entity_kind,entity_id)
  values(new.organization_id,new.id,'partner',new.id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_new_partner on public.partners;
create trigger enqueue_wix_new_partner
  after insert on public.partners
  for each row execute function app_private.enqueue_wix_new_partner();

create or replace function app_private.enqueue_wix_partner_relationship_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_partner public.partners%rowtype;
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  select * into v_partner from public.partners
   where id=new.partner_id and organization_id=new.organization_id;
  if not found or nullif(btrim(v_partner.contact_email),'') is null
    or coalesce(v_partner.metadata->>'fictional','false')='true' then
    return new;
  end if;
  insert into public.wix_contact_sync_outbox
    (organization_id,source_event_id,entity_kind,entity_id)
  values
    (new.organization_id,gen_random_uuid(),'partner',new.partner_id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_portal_change on public.partner_portal_accounts;
create trigger enqueue_wix_portal_change
  after insert or update of status on public.partner_portal_accounts
  for each row execute function app_private.enqueue_wix_partner_relationship_change();

create or replace function app_private.enqueue_wix_referral_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_partner public.partners%rowtype;
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  if coalesce(new.metadata->>'fictional','false')='true' then return new; end if;
  select * into v_partner from public.partners
   where id=new.partner_id and organization_id=new.organization_id;
  if not found or nullif(btrim(v_partner.contact_email),'') is null
    or coalesce(v_partner.metadata->>'fictional','false')='true' then
    return new;
  end if;
  insert into public.wix_contact_sync_outbox
    (organization_id,source_event_id,entity_kind,entity_id)
  values
    (new.organization_id,gen_random_uuid(),'partner',new.partner_id)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists enqueue_wix_referral_change on public.referrals;
create trigger enqueue_wix_referral_change
  after insert or update of status on public.referrals
  for each row execute function app_private.enqueue_wix_referral_change();

-- Outbox failures and unmatched identities are intentionally NOT retried without correction.
-- The worker re-reads current source state and matches an existing Wix contact by exact email.
