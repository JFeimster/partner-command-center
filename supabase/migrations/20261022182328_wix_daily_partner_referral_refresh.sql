-- Daily, idempotent refresh of rolling partner-referral metrics.
-- Called by the authenticated Wix worker; refresh only partners previously mapped and synced.
-- A stable event UUID per partner/day prevents duplicate outbox entries across hourly runs.
create or replace function public.enqueue_wix_daily_partner_metric_refresh(p_limit integer default 100)
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_added integer;
begin
  with eligible as (
    select p.id, p.organization_id,
      md5('wix_partner_metric_refresh:' || p.id::text || ':' || (now() at time zone 'UTC')::date::text)::uuid as daily_event
    from public.partners p
    where coalesce(p.metadata->>'fictional','false') <> 'true'
      and nullif(btrim(p.contact_email),'') is not null
      and exists (
        select 1 from public.wix_contact_sync_outbox prior
        where prior.organization_id=p.organization_id
          and prior.entity_kind='partner'
          and prior.entity_id=p.id
          and prior.status='synced'
          and prior.wix_contact_id is not null
      )
      and not exists (
        select 1 from public.wix_contact_sync_outbox existing
        where existing.entity_kind='partner'
        and existing.source_event_id=
            md5('wix_partner_metric_refresh:' || p.id::text || ':' || (now() at time zone 'UTC')::date::text)::uuid
      )
    order by p.id
    limit least(greatest(p_limit,1),500)
  ), inserted as (
    insert into public.wix_contact_sync_outbox
      (organization_id,source_event_id,entity_kind,entity_id)
    select organization_id,daily_event,'partner',id from eligible
    on conflict do nothing
    returning id
  )
  select count(*) into v_added from inserted;
  return v_added;
end;
$$;
revoke all on function public.enqueue_wix_daily_partner_metric_refresh(integer)
  from public, anon, authenticated;
grant execute on function public.enqueue_wix_daily_partner_metric_refresh(integer)
  to service_role;
