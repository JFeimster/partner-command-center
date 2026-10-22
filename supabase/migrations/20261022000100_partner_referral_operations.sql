-- Operator status changes remain human initiated and are recorded in the
-- canonical organization activity stream for partner-visible history.
create policy activity_logs_partner_referral_updates_select
  on public.activity_logs for select to authenticated
  using (
    action = 'partner_referral.status_changed'
    and entity_type = 'referral'
    and exists (
      select 1 from public.referrals r
      where r.id = activity_logs.entity_id
        and r.organization_id = activity_logs.organization_id
        and (select app_private.owns_portal_partner(r.organization_id, r.partner_id))
    )
  );

create or replace function public.update_partner_referral_status(
  p_referral_id uuid, p_status text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_referral public.referrals%rowtype;
begin
  if p_status not in ('accepted', 'qualified', 'converted', 'rejected') then
    raise exception 'Unsupported referral status' using errcode = '22023';
  end if;

  select * into v_referral from public.referrals
    where id = p_referral_id for update;
  if not found then
    raise exception 'Referral not found' using errcode = 'P0002';
  end if;
  if not (select app_private.is_partner_portal_operator(v_referral.organization_id)) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if v_referral.status = p_status then
    return v_referral.status;
  end if;
  if not (
    (v_referral.status = 'submitted' and p_status in ('accepted', 'rejected')) or
    (v_referral.status = 'accepted' and p_status in ('qualified', 'rejected')) or
    (v_referral.status = 'qualified' and p_status in ('converted', 'rejected'))
  ) then
    raise exception 'Referral status transition is not allowed' using errcode = '22023';
  end if;

  update public.referrals
    set status = p_status,
        converted_at = case when p_status = 'converted' then now() else converted_at end,
        updated_at = now()
    where id = p_referral_id;
  insert into public.activity_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
  ) values (
    v_referral.organization_id, (select auth.uid()), 'partner_referral.status_changed',
    'referral', v_referral.id, 'partner_command',
    jsonb_build_object(
      'partner_id', v_referral.partner_id,
      'from_status', v_referral.status,
      'to_status', p_status
    )
  );
  return p_status;
end;
$$;

revoke all on function public.update_partner_referral_status(uuid, text) from public;
revoke execute on function public.update_partner_referral_status(uuid, text) from anon;
grant execute on function public.update_partner_referral_status(uuid, text) to authenticated;
