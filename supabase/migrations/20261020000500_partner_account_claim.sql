-- Let a verified partner claim an active record only through its canonical contact email.
-- This avoids service-role auth user management and gives operators no password access.
create or replace function app_private.owns_portal_partner(
  p_organization_id uuid, p_partner_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.partner_portal_accounts a
    join public.memberships m
      on m.organization_id = a.organization_id and m.user_id = a.user_id
    join public.roles r on r.id = m.role_id
    join public.partners p
      on p.id = a.partner_id and p.organization_id = a.organization_id
    where a.organization_id = p_organization_id
      and a.partner_id = p_partner_id
      and a.user_id = (select auth.uid())
      and a.status = 'active'
      and m.status = 'active'
      and r.key in ('partner_portal', 'partner', 'operator', 'admin', 'owner')
      and p.status = 'active'
  );
$$;

create or replace function public.claim_partner_portal_access()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_partner public.partners%rowtype;
  v_partner_role_id uuid;
  v_existing_role_key text;
  v_existing_membership_status text;
  v_existing_partner_id uuid;
  v_created boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  select lower(trim(u.email)) into v_email
  from auth.users u
  where u.id = v_user_id and u.email_confirmed_at is not null;
  if v_email is null then
    raise exception 'A verified email is required' using errcode = '42501';
  end if;

  select p.* into v_partner
  from public.partners p
  join public.organizations o on o.id = p.organization_id and o.status = 'active'
  where p.status = 'active' and lower(trim(p.contact_email)) = v_email
  order by p.created_at
  limit 1;
  if not found then
    raise exception 'No active partner record matches this verified email' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.partners p
    where p.status = 'active' and lower(trim(p.contact_email)) = v_email
      and p.id <> v_partner.id
  ) then
    raise exception 'This email matches multiple partner records; operator review is required' using errcode = '42501';
  end if;

  select a.partner_id into v_existing_partner_id
  from public.partner_portal_accounts a
  where a.organization_id = v_partner.organization_id and a.user_id = v_user_id;
  if found and v_existing_partner_id <> v_partner.id then
    raise exception 'This account is already linked to another partner' using errcode = '42501';
  end if;
  if found and exists (
    select 1 from public.partner_portal_accounts a
    where a.organization_id = v_partner.organization_id and a.user_id = v_user_id
      and a.status = 'suspended'
  ) then
    raise exception 'This partner access is suspended; operator review is required' using errcode = '42501';
  end if;

  select r.id into v_partner_role_id
  from public.roles r
  where r.organization_id is null and r.key = 'partner_portal';
  if v_partner_role_id is null then
    raise exception 'Partner access role is not configured' using errcode = '55000';
  end if;

  select r.key, m.status into v_existing_role_key, v_existing_membership_status
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.organization_id = v_partner.organization_id and m.user_id = v_user_id;

  if found and v_existing_membership_status = 'suspended' then
    raise exception 'This organization membership is suspended; operator review is required' using errcode = '42501';
  elsif found and v_existing_role_key not in ('partner_portal', 'partner', 'operator', 'admin', 'owner') then
    update public.memberships
    set role_id = v_partner_role_id, updated_at = now()
    where organization_id = v_partner.organization_id and user_id = v_user_id;
  elsif not found then
    insert into public.memberships (organization_id, user_id, role_id, status)
    values (v_partner.organization_id, v_user_id, v_partner_role_id, 'active');
  end if;

  if v_existing_partner_id is null then
    insert into public.partner_portal_accounts (
      organization_id, partner_id, user_id, status, created_by
    ) values (
      v_partner.organization_id, v_partner.id, v_user_id, 'active', v_user_id
    );
    v_created := true;
  end if;

  if v_created then
    insert into public.activity_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
    ) values (
      v_partner.organization_id, v_user_id, 'partner_portal.access_claimed',
      'partner', v_partner.id, 'partner_portal', '{}'::jsonb
    );
  end if;

  return v_partner.id;
end;
$$;

revoke all on function public.claim_partner_portal_access() from public;
revoke all on function public.claim_partner_portal_access() from anon;
grant execute on function public.claim_partner_portal_access() to authenticated;
