create or replace function public.create_partner_tracking_link(
  p_slug text, p_destination_url text, p_campaign text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_account public.partner_portal_accounts%rowtype;
  v_partner_code text;
  v_link_id uuid;
  v_destination_url text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_slug !~ '^[a-z0-9][a-z0-9-]{2,79}$' or length(coalesce(p_campaign, '')) > 80 then
    raise exception 'Invalid tracking link details' using errcode = '22023';
  end if;
  begin
    v_destination_url := p_destination_url;
    if split_part(split_part(v_destination_url, '://', 1), ':', 1) <> 'https' or
       split_part(split_part(v_destination_url, '://', 2), '/', 1) <> 'capital.distilledfunding.com' then
      raise exception 'Destination must use the canonical partner site' using errcode = '22023';
    end if;
  exception when others then
    raise exception 'Invalid tracking link destination' using errcode = '22023';
  end;

  select a.* into v_account
  from public.partner_portal_accounts a
  where a.user_id = (select auth.uid()) and a.status = 'active'
    and (select app_private.owns_portal_partner(a.organization_id, a.partner_id))
  order by a.created_at
  limit 1;
  if not found then
    raise exception 'No active partner account' using errcode = '42501';
  end if;
  select partner_code into v_partner_code from public.partners
    where id = v_account.partner_id and organization_id = v_account.organization_id;
  if coalesce(v_partner_code, '') = '' or
     position('ref=' || v_partner_code in v_destination_url) = 0 then
    raise exception 'Destination must preserve partner attribution' using errcode = '22023';
  end if;

  insert into public.tracking_links (
    organization_id, partner_id, slug, destination_url, campaign, is_active, created_by
  ) values (
    v_account.organization_id, v_account.partner_id, p_slug,
    v_destination_url, nullif(trim(p_campaign), ''), true, (select auth.uid())
  ) returning id into v_link_id;
  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    v_account.organization_id, (select auth.uid()), 'partner_tracking_link.created',
    'tracking_link', v_link_id, 'partner_portal',
    jsonb_build_object('campaign', nullif(trim(p_campaign), ''))
  );
  return v_link_id;
end;
$$;

revoke all on function public.create_partner_tracking_link(text,text,text) from public;
revoke execute on function public.create_partner_tracking_link(text,text,text) from anon;
grant execute on function public.create_partner_tracking_link(text,text,text) to authenticated;
