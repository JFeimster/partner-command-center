-- Suppress obviously fictional fixture identities at the event source, not only in the worker.
-- "example.invalid" and example.com/net/org are reserved test domains. No real contact is created.
create or replace function app_private.is_reserved_wix_contact_email(p_email text)
returns boolean language sql immutable set search_path = '' as $$
  select lower(btrim(split_part(coalesce(p_email,''),'@',2))) in
    ('example.invalid','example.com','example.net','example.org','localhost','test.invalid')
    or lower(btrim(split_part(coalesce(p_email,''),'@',2))) ~ '\.(invalid|test)$';
$$;

create or replace function app_private.enqueue_wix_application_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  if nullif(btrim(new.email),'') is null
     or coalesce(new.answers->>'fictional','false') = 'true'
     or app_private.is_reserved_wix_contact_email(new.email)
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

-- Fix prior imports that represented samples as legitimate applications.
update public.partner_applications a
set answers = coalesce(a.answers,'{}'::jsonb)
  || jsonb_build_object('fictional',true,'sync_exclusion_reason','reserved_example_invalid_domain')
where lower(btrim(split_part(a.email,'@',2)))='example.invalid'
  and lower(coalesce(a.source,'')) in ('tally','activation_test')
  and lower(coalesce(a.applicant_name,'')) ~ '(test|fake|qa|demo|sample|synthetic)'
  and coalesce(a.answers->>'fictional','false') <> 'true';

update public.wix_contact_sync_outbox o
set status='ignored',last_error_code='synthetic_reserved_domain',
  leased_until=null,updated_at=now()
from public.partner_applications a
where o.entity_kind='partner_application'
  and o.entity_id=a.id and o.organization_id=a.organization_id
  and app_private.is_reserved_wix_contact_email(a.email)
  and o.status in ('pending','retry','needs_mapping');
