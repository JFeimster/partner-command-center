-- Minimal, source-verified partner metrics for the authenticated Wix Contacts mirror.
-- Service role only; does not return names, emails, bank details, or individual referrals.
create or replace function public.get_wix_partner_projection_metrics(
  p_organization_id uuid,
  p_partner_id uuid
) returns table(
  portal_status text,
  referrals_90d bigint,
  last_referral_date date
) language plpgsql security invoker set search_path = '' as $$
declare
  v_count integer;
  v_portal text;
begin
  if not exists (
    select 1 from public.partners p
    where p.id=p_partner_id and p.organization_id=p_organization_id
      and coalesce(p.metadata->>'fictional','false') <> 'true'
  ) then return; end if;

  select count(*),max(a.status) into v_count,v_portal
  from public.partner_portal_accounts a
  where a.partner_id=p_partner_id and a.organization_id=p_organization_id;
  if v_count > 1 then
    raise exception 'ambiguous_portal_account' using errcode='P0001';
  end if;
  portal_status := case when v_count = 0 then 'not_provisioned' else v_portal end;
  if portal_status not in ('not_provisioned','active','suspended') then
    raise exception 'invalid_portal_status' using errcode='P0001';
  end if;

  select count(*) filter (where r.referred_at >= now()- interval '90 days'),
         max(r.referred_at)::date
  into referrals_90d,last_referral_date
  from public.referrals r
  where r.partner_id=p_partner_id
    and r.organization_id=p_organization_id
    and r.status in ('submitted','accepted','qualified','converted')
    and coalesce(r.metadata->>'fictional','false') <> 'true';
  return next;
end;
$$;

revoke all on function public.get_wix_partner_projection_metrics(uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.get_wix_partner_projection_metrics(uuid,uuid)
 to service_role;
