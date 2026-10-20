-- A linked application belongs to its explicit partner record. Email is only
-- a legacy fallback while the intake record has no partner_id.
drop policy if exists partner_applications_portal_select on public.partner_applications;
create policy partner_applications_portal_select on public.partner_applications
  for select to authenticated
  using (
    exists (
      select 1 from public.partners p
      where p.organization_id = partner_applications.organization_id
        and p.status = 'active'
        and (
          p.id = partner_applications.partner_id
          or (
            partner_applications.partner_id is null
            and lower(trim(p.contact_email)) = lower(trim(partner_applications.email))
          )
        )
        and (select app_private.owns_portal_partner(p.organization_id, p.id))
    )
  );
