-- Partners can read only their own referral, tracking-link, and portal-access events.
create policy activity_logs_partner_portal_select on public.activity_logs
  for select to authenticated
  using (
    action in (
      'partner_portal.access_claimed',
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

-- Operators can inspect the organization audit stream from the operator workspace.
create policy activity_logs_partner_operator_select on public.activity_logs
  for select to authenticated
  using ((select app_private.is_partner_portal_operator(organization_id)));
