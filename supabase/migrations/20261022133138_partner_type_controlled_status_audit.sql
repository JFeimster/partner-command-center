-- Applied to platform-core as migration 20261022133138_partner_type_controlled_status_audit.
-- Preserve existing partner status constraints and historical records.
alter table public.partners
  add column if not exists partner_type text not null default 'unknown';

do $$
begin
 if not exists (select 1 from pg_constraint where conname='partners_partner_type_check' and conrelid='public.partners'::regclass) then
   alter table public.partners add constraint partners_partner_type_check
     check (partner_type in ('funding_broker','referral_partner','affiliate_partner','center_of_influence','professional_service_provider','community_connector','internal_operator','unknown'));
 end if;
end $$;

create or replace function public.update_partner_operational_fields(p_partner_id uuid,p_status text,p_partner_type text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_partner public.partners%rowtype;
begin
 if (select auth.uid()) is null then
   raise exception 'Authentication required' using errcode='42501';
 end if;
 select * into v_partner from public.partners where id=p_partner_id for update;
 if not found then raise exception 'Partner not found' using errcode='P0002'; end if;
 if not (select app_private.is_partner_portal_operator(v_partner.organization_id)) then
   raise exception 'Operator access required' using errcode='42501';
 end if;
 if p_status not in ('pending','active','paused','terminated') or
    p_partner_type not in ('funding_broker','referral_partner','affiliate_partner','center_of_influence','professional_service_provider','community_connector','internal_operator','unknown') then
   raise exception 'Invalid partner status or type' using errcode='22023';
 end if;
 if p_status='active' and v_partner.status <> 'active' and not exists (
   select 1 from public.partner_applications a
   where a.organization_id=v_partner.organization_id
     and a.partner_id=v_partner.id
     and a.status='approved'
 ) then
   raise exception 'Approval is required before activation' using errcode='22023';
 end if;
 if v_partner.status=p_status and v_partner.partner_type=p_partner_type then return v_partner.id; end if;
 update public.partners set status=p_status, partner_type=p_partner_type, updated_at=now()
 where id=v_partner.id and organization_id=v_partner.organization_id;
 insert into public.activity_logs (
   organization_id, actor_user_id, action, entity_type, entity_id, source, metadata
 ) values (
   v_partner.organization_id,(select auth.uid()),'partner.classification.updated',
   'partner',v_partner.id,'partner_command',
   jsonb_build_object('previous_status',v_partner.status,'status',p_status,
   'previous_partner_type',v_partner.partner_type,'partner_type',p_partner_type,
   'wix_sync_state','pending')
 );
 return v_partner.id;
end;
$$;
revoke all on function public.update_partner_operational_fields(uuid,text,text) from public;
revoke execute on function public.update_partner_operational_fields(uuid,text,text) from anon;
grant execute on function public.update_partner_operational_fields(uuid,text,text) to authenticated;
