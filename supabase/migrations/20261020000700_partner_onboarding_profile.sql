-- Show a linked partner only their application status, including legacy intake
-- records that have not yet been connected by partner_id.
create policy partner_applications_portal_select on public.partner_applications
  for select to authenticated
  using (
    exists (
      select 1 from public.partners p
      where p.organization_id = partner_applications.organization_id
        and p.status = 'active'
        and (
          p.id = partner_applications.partner_id
          or lower(trim(p.contact_email)) = lower(trim(partner_applications.email))
        )
        and (select app_private.owns_portal_partner(p.organization_id, p.id))
    )
  );

-- Partners may maintain their own contact and business context without
-- changing canonical partner identity, code, status, or CRM-owned metadata.
create or replace function public.update_partner_portal_profile(
  p_phone text, p_website_url text, p_service_area text, p_business_summary text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_partner public.partners%rowtype;
  v_phone text := trim(coalesce(p_phone, ''));
  v_website text := trim(coalesce(p_website_url, ''));
  v_area text := trim(coalesce(p_service_area, ''));
  v_summary text := trim(coalesce(p_business_summary, ''));
  v_metadata jsonb;
  v_profile jsonb;
  v_new_profile jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if length(v_phone) > 40 or length(v_website) > 256 or
     length(v_area) > 120 or length(v_summary) > 500 then
    raise exception 'Partner profile exceeds field limits' using errcode = '22023';
  end if;
  if v_website <> '' and (
    v_website !~* '^https://[a-z0-9][a-z0-9.-]+(:[0-9]{1,5})?(/[^[:space:]]*)?$'
    or position('@' in split_part(split_part(v_website, '://', 2), '/', 1)) > 0
  ) then
    raise exception 'Website must be a secure public URL' using errcode = '22023';
  end if;

  select p.* into v_partner
  from public.partner_portal_accounts a
  join public.partners p on p.id = a.partner_id and p.organization_id = a.organization_id
  where a.user_id = (select auth.uid()) and a.status = 'active'
    and (select app_private.owns_portal_partner(a.organization_id, a.partner_id))
  order by a.created_at limit 1 for update of p;
  if not found then
    raise exception 'Active partner access is required' using errcode = '42501';
  end if;

  v_metadata := case when jsonb_typeof(v_partner.metadata) = 'object'
    then v_partner.metadata else '{}'::jsonb end;
  v_profile := case when jsonb_typeof(v_metadata -> 'portal_profile') = 'object'
    then v_metadata -> 'portal_profile' else '{}'::jsonb end;
  v_new_profile := v_profile || jsonb_build_object(
    'website_url', v_website,
    'service_area', v_area,
    'business_summary', v_summary
  );
  if coalesce(v_partner.contact_phone, '') = v_phone and v_profile = v_new_profile then
    return v_partner.id;
  end if;

  update public.partners
  set contact_phone = nullif(v_phone, ''),
      metadata = v_metadata || jsonb_build_object('portal_profile', v_new_profile)
  where id = v_partner.id and organization_id = v_partner.organization_id;
  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    v_partner.organization_id, (select auth.uid()), 'partner_profile.updated',
    'partner', v_partner.id, 'partner_portal',
    jsonb_build_object('fields', array['contact_phone','website_url','service_area','business_summary'])
  );
  return v_partner.id;
end;
$$;

revoke all on function public.update_partner_portal_profile(text,text,text,text) from public;
revoke execute on function public.update_partner_portal_profile(text,text,text,text) from anon;
grant execute on function public.update_partner_portal_profile(text,text,text,text) to authenticated;

drop policy if exists activity_logs_partner_portal_select on public.activity_logs;
create policy activity_logs_partner_portal_select on public.activity_logs
  for select to authenticated
  using (
    action in (
      'partner_portal.access_claimed',
      'partner_profile.updated',
      'partner_referral.submitted',
      'partner_tracking_link.created'
    )
    and (
      (entity_type = 'partner' and exists (
        select 1 from public.partners p
        where p.id = activity_logs.entity_id
          and p.organization_id = activity_logs.organization_id
          and (select app_private.owns_portal_partner(p.organization_id, p.id))
      ))
      or (entity_type = 'referral' and exists (
        select 1 from public.referrals r
        where r.id = activity_logs.entity_id
          and r.organization_id = activity_logs.organization_id
          and (select app_private.owns_portal_partner(r.organization_id, r.partner_id))
      ))
      or (entity_type = 'tracking_link' and exists (
        select 1 from public.tracking_links t
        where t.id = activity_logs.entity_id
          and t.organization_id = activity_logs.organization_id
          and (select app_private.owns_portal_partner(t.organization_id, t.partner_id))
      ))
    )
  );
