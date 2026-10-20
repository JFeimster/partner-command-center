-- The portal binds a reviewed Auth user to one canonical partner record.
-- The existing partner CRM and its service-role intake stay authoritative.
insert into public.roles (key, name, description, is_system)
select 'partner_portal', 'Partner portal', 'Scoped access to one approved partner', true
where not exists (
  select 1 from public.roles where organization_id is null and key = 'partner_portal'
);

create unique index if not exists partners_id_organization_uidx
  on public.partners (id, organization_id);

create table if not exists public.partner_portal_accounts (
  organization_id uuid not null references public.organizations(id),
  partner_id uuid not null,
  user_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  unique (organization_id, partner_id, user_id),
  foreign key (partner_id, organization_id)
    references public.partners (id, organization_id)
);

create index if not exists partner_portal_accounts_partner_idx
  on public.partner_portal_accounts (organization_id, partner_id)
  where status = 'active';

alter table public.partner_portal_accounts enable row level security;
grant select, insert, update, delete on public.partner_portal_accounts to authenticated;

create or replace function app_private.is_partner_portal_operator(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and r.key in ('owner', 'admin', 'operator')
  );
$$;

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
      and r.key = 'partner_portal'
      and p.status = 'active'
  );
$$;

revoke all on function app_private.is_partner_portal_operator(uuid) from public;
revoke all on function app_private.owns_portal_partner(uuid, uuid) from public;
grant execute on function app_private.is_partner_portal_operator(uuid) to authenticated;
grant execute on function app_private.owns_portal_partner(uuid, uuid) to authenticated;

create policy partner_portal_accounts_select on public.partner_portal_accounts
  for select to authenticated
  using (user_id = (select auth.uid()) or
         (select app_private.is_partner_portal_operator(organization_id)));
create policy partner_portal_accounts_insert on public.partner_portal_accounts
  for insert to authenticated
  with check ((select app_private.is_partner_portal_operator(organization_id)));
create policy partner_portal_accounts_update on public.partner_portal_accounts
  for update to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)))
  with check ((select app_private.is_partner_portal_operator(organization_id)));
create policy partner_portal_accounts_delete on public.partner_portal_accounts
  for delete to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)));

create policy partners_portal_select on public.partners
  for select to authenticated
  using ((select app_private.owns_portal_partner(organization_id, id)));
create policy referrals_portal_select on public.referrals
  for select to authenticated
  using ((select app_private.owns_portal_partner(organization_id, partner_id)));
create policy tracking_links_portal_select on public.tracking_links
  for select to authenticated
  using (partner_id is not null and
         (select app_private.owns_portal_partner(organization_id, partner_id)));
create policy tracking_links_portal_insert on public.tracking_links
  for insert to authenticated
  with check (partner_id is not null and
              created_by = (select auth.uid()) and
              (select app_private.owns_portal_partner(organization_id, partner_id)));
create policy tracking_links_portal_update on public.tracking_links
  for update to authenticated
  using (partner_id is not null and
         (select app_private.owns_portal_partner(organization_id, partner_id)))
  with check (partner_id is not null and
              (select app_private.owns_portal_partner(organization_id, partner_id)));
create policy tracking_links_portal_delete on public.tracking_links
  for delete to authenticated
  using (partner_id is not null and
         (select app_private.owns_portal_partner(organization_id, partner_id)));
create policy leads_portal_referral_select on public.leads
  for select to authenticated
  using (exists (
    select 1 from public.referrals ref
    where ref.lead_id = leads.id
      and ref.organization_id = leads.organization_id
      and (select app_private.owns_portal_partner(ref.organization_id, ref.partner_id))
  ));

create policy partner_applications_operator_select on public.partner_applications
  for select to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)));
create policy partner_applications_operator_update on public.partner_applications
  for update to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)))
  with check ((select app_private.is_partner_portal_operator(organization_id)));
create policy partner_intake_events_operator_select on public.partner_intake_events
  for select to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)));
create policy partner_follow_up_tasks_operator_select on public.partner_follow_up_tasks
  for select to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)));
create policy partner_follow_up_tasks_operator_update on public.partner_follow_up_tasks
  for update to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)))
  with check ((select app_private.is_partner_portal_operator(organization_id)));

grant select, update on public.partner_applications to authenticated;
grant select on public.partner_intake_events to authenticated;
grant select, update on public.partner_follow_up_tasks to authenticated;

create or replace function public.submit_partner_referral(
  p_request_id uuid,
  p_business_name text,
  p_contact_name text,
  p_email text,
  p_phone text,
  p_consent_confirmed boolean
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_account public.partner_portal_accounts%rowtype;
  v_lead_id uuid;
  v_referral_id uuid;
  v_external_id text;
begin
  if (select auth.uid()) is null or p_request_id is null then
    raise exception 'Authentication and request ID are required' using errcode = '42501';
  end if;
  if not p_consent_confirmed then
    raise exception 'Contact permission is required' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_business_name, ''))) not between 2 and 160 or
     length(trim(coalesce(p_contact_name, ''))) not between 2 and 160 or
     length(trim(coalesce(p_email, ''))) not between 5 and 254 or
     position('@' in coalesce(p_email, '')) < 2 or
     length(coalesce(p_phone, '')) > 40 then
    raise exception 'Invalid referral details' using errcode = '22023';
  end if;

  select a.* into v_account
  from public.partner_portal_accounts a
  where a.user_id = (select auth.uid()) and a.status = 'active'
    and (select app_private.owns_portal_partner(a.organization_id, a.partner_id))
  order by a.created_at
  limit 1;
  if not found then
    raise exception 'No active partner account' using errcode = '42501';
  end if;

  v_external_id := 'portal-referral:' || p_request_id::text;
  insert into public.leads (
    organization_id, external_id, source, status, first_name, last_name,
    email, phone, company_name, consent_at, attribution, metadata, created_by
  ) values (
    v_account.organization_id, v_external_id, 'partner_portal', 'new',
    split_part(trim(p_contact_name), ' ', 1),
    nullif(trim(substr(trim(p_contact_name), length(split_part(trim(p_contact_name), ' ', 1)) + 1)), ''),
    lower(trim(p_email)), nullif(trim(p_phone), ''), trim(p_business_name),
    now(), jsonb_build_object('partner_id', v_account.partner_id),
    jsonb_build_object('request_id', p_request_id), (select auth.uid())
  ) on conflict (organization_id, external_id) do nothing;

  select id into v_lead_id from public.leads
  where organization_id = v_account.organization_id and external_id = v_external_id;
  if v_lead_id is null then
    raise exception 'Could not persist referral lead' using errcode = '23514';
  end if;

  insert into public.referrals (organization_id, partner_id, lead_id, status)
  values (v_account.organization_id, v_account.partner_id, v_lead_id, 'submitted')
  on conflict (organization_id, partner_id, lead_id) do nothing
  returning id into v_referral_id;

  if v_referral_id is not null then
    insert into public.activity_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
    ) values (
      v_account.organization_id, (select auth.uid()), 'partner_referral.submitted',
      'referral', v_referral_id, 'partner_portal',
      jsonb_build_object('partner_id', v_account.partner_id)
    );
  else
    select id into v_referral_id from public.referrals
    where organization_id = v_account.organization_id
      and partner_id = v_account.partner_id and lead_id = v_lead_id;
  end if;
  return v_referral_id;
end;
$$;

revoke all on function public.submit_partner_referral(uuid,text,text,text,text,boolean) from public;
grant execute on function public.submit_partner_referral(uuid,text,text,text,text,boolean) to authenticated;
