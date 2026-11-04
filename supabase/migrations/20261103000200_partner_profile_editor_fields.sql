-- Extends the existing portal profile editor with the optional fields already
-- collected by Tally 9qjWEE. Canonical identity, partner code, status, and
-- microsite publication fields remain operator controlled.
create or replace function public.update_partner_portal_profile_details(
  p_phone text,
  p_business_name text,
  p_display_name text,
  p_bio text,
  p_photo_url text,
  p_website_url text,
  p_service_area text,
  p_funding_specialties jsonb,
  p_business_summary text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_partner public.partners%rowtype;
  v_phone text := trim(coalesce(p_phone, ''));
  v_business_name text := trim(coalesce(p_business_name, ''));
  v_display_name text := trim(coalesce(p_display_name, ''));
  v_bio text := trim(coalesce(p_bio, ''));
  v_photo_url text := trim(coalesce(p_photo_url, ''));
  v_website text := trim(coalesce(p_website_url, ''));
  v_area text := trim(coalesce(p_service_area, ''));
  v_summary text := trim(coalesce(p_business_summary, ''));
  v_specialties jsonb := case when jsonb_typeof(coalesce(p_funding_specialties, '[]'::jsonb)) = 'array'
    then coalesce(p_funding_specialties, '[]'::jsonb) else '[]'::jsonb end;
  v_metadata jsonb;
  v_profile jsonb;
  v_new_profile jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if length(v_phone) > 40 or length(v_business_name) > 160 or
     length(v_display_name) > 160 or length(v_bio) > 1000 or
     length(v_photo_url) > 512 or length(v_website) > 256 or
     length(v_area) > 120 or length(v_summary) > 500 or
     jsonb_array_length(v_specialties) > 12 then
    raise exception 'Partner profile exceeds field limits' using errcode = '22023';
  end if;
  if v_website <> '' and (
    v_website !~* '^https://[a-z0-9][a-z0-9.-]+(:[0-9]{1,5})?(/[^[:space:]]*)?$'
    or position('@' in split_part(split_part(v_website, '://', 2), '/', 1)) > 0
  ) then
    raise exception 'Website must be a secure public URL' using errcode = '22023';
  end if;
  if v_photo_url <> '' and v_photo_url !~* '^https://[^[:space:]]+$' then
    raise exception 'Photo URL must be a secure public URL' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements_text(v_specialties) value where length(value) > 100) then
    raise exception 'Funding specialties contain an oversized value' using errcode = '22023';
  end if;

  select p.* into v_partner
    from public.partner_portal_accounts a
    join public.partners p on p.id = a.partner_id and p.organization_id = a.organization_id
   where a.user_id = (select auth.uid())
     and a.status = 'active'
     and (select app_private.owns_portal_partner(a.organization_id, a.partner_id))
   order by a.created_at limit 1 for update of p;
  if not found then
    raise exception 'Active partner access is required' using errcode = '42501';
  end if;

  v_metadata := case when jsonb_typeof(v_partner.metadata) = 'object' then v_partner.metadata else '{}'::jsonb end;
  v_profile := case when jsonb_typeof(v_metadata -> 'portal_profile') = 'object'
    then v_metadata -> 'portal_profile' else '{}'::jsonb end;
  v_new_profile := v_profile || jsonb_build_object(
    'business_name', v_business_name,
    'display_name', v_display_name,
    'bio', v_bio,
    'photo_url', v_photo_url,
    'website_url', v_website,
    'service_area', v_area,
    'funding_specialties', v_specialties,
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
    jsonb_build_object('fields', array['contact_phone','business_name','display_name','bio','photo_url',
      'website_url','service_area','funding_specialties','business_summary'])
  );
  return v_partner.id;
end;
$$;

revoke all on function public.update_partner_portal_profile_details(text,text,text,text,text,text,text,jsonb,text)
  from public;
revoke execute on function public.update_partner_portal_profile_details(text,text,text,text,text,text,text,jsonb,text)
  from anon;
grant execute on function public.update_partner_portal_profile_details(text,text,text,text,text,text,text,jsonb,text)
  to authenticated;
