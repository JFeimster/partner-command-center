-- Supabase grants new public functions to anon by default; deny that role explicitly.
revoke execute on function public.submit_partner_referral(uuid,text,text,text,text,boolean)
  from anon;
