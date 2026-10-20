-- Controlled authorization smoke for platform-core. Every synthetic row is rolled back.
-- Run as a database owner with the Supabase SQL executor; inspect the single result row.
begin;
set local statement_timeout = '30s';

select set_config('pcc.qa.org', (
  select o.id::text from public.organizations o
  where o.status = 'active' and exists (
    select 1 from public.partners p where p.organization_id = o.id and p.status = 'active'
  ) limit 1
), true);
select set_config('pcc.qa.a', gen_random_uuid()::text, true);
select set_config('pcc.qa.b', gen_random_uuid()::text, true);
select set_config('pcc.qa.operator', gen_random_uuid()::text, true);
select set_config('pcc.qa.partner_a', gen_random_uuid()::text, true);
select set_config('pcc.qa.partner_b', gen_random_uuid()::text, true);
select set_config('pcc.qa.application', gen_random_uuid()::text, true);
select set_config('pcc.qa.spoof_application', gen_random_uuid()::text, true);
select set_config('pcc.qa.task', gen_random_uuid()::text, true);
select set_config('pcc.qa.request', gen_random_uuid()::text, true);

insert into auth.users (id, aud, role, email, email_confirmed_at)
select user_id::uuid, 'authenticated', 'authenticated',
       'pcc-qa-' || replace(user_id, '-', '') || '@example.invalid', now()
from (values (current_setting('pcc.qa.a')), (current_setting('pcc.qa.b')),
             (current_setting('pcc.qa.operator'))) users(user_id);

insert into public.partners (id, organization_id, partner_code, name, status, contact_email, metadata)
select partner_id::uuid, current_setting('pcc.qa.org')::uuid,
       'pccqa' || left(replace(partner_id, '-', ''), 20),
       'PCC synthetic partner', 'active',
       'pcc-qa-' || replace(user_id, '-', '') || '@example.invalid',
       jsonb_build_object('crm_source', 'synthetic-smoke')
from (values (current_setting('pcc.qa.partner_a'), current_setting('pcc.qa.a')),
             (current_setting('pcc.qa.partner_b'), current_setting('pcc.qa.b')))
     partners(partner_id, user_id);

insert into public.partner_applications
  (id, organization_id, partner_id, source, email, applicant_name, applicant_type, status, answers)
values (
  current_setting('pcc.qa.application')::uuid, current_setting('pcc.qa.org')::uuid,
  current_setting('pcc.qa.partner_a')::uuid, 'pcc_synthetic_smoke',
  'pcc-qa-' || replace(current_setting('pcc.qa.a'), '-', '') || '@example.invalid',
  'PCC synthetic applicant', 'affiliate', 'new', '{}'::jsonb
);
insert into public.partner_applications
  (id, organization_id, partner_id, source, email, applicant_name, applicant_type, status, answers)
values (
  current_setting('pcc.qa.spoof_application')::uuid, current_setting('pcc.qa.org')::uuid,
  current_setting('pcc.qa.partner_b')::uuid, 'pcc_synthetic_smoke',
  'pcc-qa-' || replace(current_setting('pcc.qa.a'), '-', '') || '@example.invalid',
  'PCC synthetic mismatched application', 'affiliate', 'new', '{}'::jsonb
);
insert into public.partner_follow_up_tasks
  (id, organization_id, application_id, partner_id, title, status)
values (
  current_setting('pcc.qa.task')::uuid, current_setting('pcc.qa.org')::uuid,
  current_setting('pcc.qa.application')::uuid, current_setting('pcc.qa.partner_a')::uuid,
  'PCC synthetic follow-up', 'open'
);
insert into public.memberships (organization_id, user_id, role_id, status)
select current_setting('pcc.qa.org')::uuid, current_setting('pcc.qa.operator')::uuid,
       r.id, 'active' from public.roles r where r.key = 'operator' and r.organization_id is null;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('pcc.qa.a'), true);
select set_config('pcc.qa.a_claim', public.claim_partner_portal_access()::text, true);
select set_config('pcc.qa.a_claim_repeat', public.claim_partner_portal_access()::text, true);
select set_config('pcc.qa.a_partner_count', count(*)::text, true) from public.partners
where id in (current_setting('pcc.qa.partner_a')::uuid, current_setting('pcc.qa.partner_b')::uuid);
select set_config('pcc.qa.a_operator', app_private.is_partner_portal_operator(current_setting('pcc.qa.org')::uuid)::text, true);
select set_config('pcc.qa.a_task_count', count(*)::text, true) from public.partner_follow_up_tasks
where id = current_setting('pcc.qa.task')::uuid;
select set_config('pcc.qa.a_app_count', count(*)::text, true) from public.partner_applications
where id = current_setting('pcc.qa.application')::uuid;
select set_config('pcc.qa.a_spoof_app_count', count(*)::text, true) from public.partner_applications
where id = current_setting('pcc.qa.spoof_application')::uuid;
select set_config('pcc.qa.a_profile', public.update_partner_portal_profile(
  '555-0100', 'https://example.com', 'Northeast', 'Synthetic partner profile'
)::text, true);
select public.update_partner_portal_profile(
  '555-0100', 'https://example.com', 'Northeast', 'Synthetic partner profile'
);
select set_config('pcc.qa.a_profile_audit_count', count(*)::text, true) from public.activity_logs
where action = 'partner_profile.updated' and entity_id = current_setting('pcc.qa.partner_a')::uuid;
select set_config('pcc.qa.a_crm_metadata', (metadata ->> 'crm_source')::text, true) from public.partners
where id = current_setting('pcc.qa.partner_a')::uuid;
select set_config('pcc.qa.a_referral', public.submit_partner_referral(
  current_setting('pcc.qa.request')::uuid, 'Synthetic business', 'Synthetic contact',
  'pcc-lead-' || replace(current_setting('pcc.qa.a'), '-', '') || '@example.invalid', '', true
)::text, true);
select set_config('pcc.qa.a_referral_repeat', public.submit_partner_referral(
  current_setting('pcc.qa.request')::uuid, 'Synthetic business', 'Synthetic contact',
  'pcc-lead-' || replace(current_setting('pcc.qa.a'), '-', '') || '@example.invalid', '', true
)::text, true);
select set_config('pcc.qa.a_link', public.create_partner_tracking_link(
  'pccqa-' || left(replace(current_setting('pcc.qa.a'), '-', ''), 16),
  'https://capital.distilledfunding.com/?ref=pccqa' || left(replace(current_setting('pcc.qa.partner_a'), '-', ''), 20),
  'synthetic-smoke'
)::text, true);

select set_config('request.jwt.claim.sub', current_setting('pcc.qa.b'), true);
select set_config('pcc.qa.b_claim', public.claim_partner_portal_access()::text, true);
select set_config('pcc.qa.b_partner_a_count', count(*)::text, true) from public.partners
where id = current_setting('pcc.qa.partner_a')::uuid;
select set_config('pcc.qa.b_referral_a_count', count(*)::text, true) from public.referrals
where id = current_setting('pcc.qa.a_referral')::uuid;
select set_config('pcc.qa.b_link_a_count', count(*)::text, true) from public.tracking_links
where id = current_setting('pcc.qa.a_link')::uuid;
select set_config('pcc.qa.b_activity_a_count', count(*)::text, true) from public.activity_logs
where entity_id in (current_setting('pcc.qa.partner_a')::uuid,
                    current_setting('pcc.qa.a_referral')::uuid,
                    current_setting('pcc.qa.a_link')::uuid);
select set_config('pcc.qa.b_app_a_count', count(*)::text, true) from public.partner_applications
where id = current_setting('pcc.qa.application')::uuid;
select set_config('pcc.qa.b_operator', app_private.is_partner_portal_operator(current_setting('pcc.qa.org')::uuid)::text, true);

select set_config('request.jwt.claim.sub', current_setting('pcc.qa.operator'), true);
select set_config('pcc.qa.operator_access', app_private.is_partner_portal_operator(current_setting('pcc.qa.org')::uuid)::text, true);
select set_config('pcc.qa.operator_app_count', count(*)::text, true) from public.partner_applications
where id = current_setting('pcc.qa.application')::uuid;
select set_config('pcc.qa.operator_triage', public.triage_partner_application(
  current_setting('pcc.qa.application')::uuid, 'needs_review'
), true);
select set_config('pcc.qa.operator_task', public.complete_partner_follow_up(
  current_setting('pcc.qa.task')::uuid
)::text, true);

reset role;
select jsonb_build_object(
  'claim_matches_partner', current_setting('pcc.qa.a_claim') = current_setting('pcc.qa.partner_a'),
  'claim_idempotent', current_setting('pcc.qa.a_claim') = current_setting('pcc.qa.a_claim_repeat'),
  'partner_sees_only_own_record', current_setting('pcc.qa.a_partner_count') = '1',
  'partner_cannot_operate', current_setting('pcc.qa.a_operator') = 'false',
  'partner_cannot_read_operator_task', current_setting('pcc.qa.a_task_count') = '0',
  'partner_can_read_own_application', current_setting('pcc.qa.a_app_count') = '1',
  'linked_application_owner_overrides_email', current_setting('pcc.qa.a_spoof_app_count') = '0',
  'profile_updates_own_partner', current_setting('pcc.qa.a_profile') = current_setting('pcc.qa.partner_a'),
  'profile_write_is_idempotent', current_setting('pcc.qa.a_profile_audit_count') = '1',
  'profile_preserves_crm_metadata', current_setting('pcc.qa.a_crm_metadata') = 'synthetic-smoke',
  'referral_idempotent', current_setting('pcc.qa.a_referral') = current_setting('pcc.qa.a_referral_repeat'),
  'second_claim_matches_partner', current_setting('pcc.qa.b_claim') = current_setting('pcc.qa.partner_b'),
  'second_partner_cannot_read_first_partner', current_setting('pcc.qa.b_partner_a_count') = '0',
  'second_partner_cannot_read_first_referral', current_setting('pcc.qa.b_referral_a_count') = '0',
  'second_partner_cannot_read_first_link', current_setting('pcc.qa.b_link_a_count') = '0',
  'second_partner_cannot_read_first_activity', current_setting('pcc.qa.b_activity_a_count') = '0',
  'second_partner_cannot_read_first_application', current_setting('pcc.qa.b_app_a_count') = '0',
  'second_partner_cannot_operate', current_setting('pcc.qa.b_operator') = 'false',
  'operator_can_operate', current_setting('pcc.qa.operator_access') = 'true',
  'operator_can_read_application', current_setting('pcc.qa.operator_app_count') = '1',
  'operator_can_triage', current_setting('pcc.qa.operator_triage') = 'needs_review',
  'operator_can_complete_follow_up', current_setting('pcc.qa.operator_task') = 'true'
) as checks;
rollback;
