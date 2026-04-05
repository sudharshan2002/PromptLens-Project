begin;

truncate table public.app_sessions restart identity;
truncate table public.profiles cascade;

delete from auth.identities;
delete from auth.sessions;
delete from auth.refresh_tokens;
delete from auth.one_time_tokens;
delete from auth.flow_state;
delete from auth.mfa_factors;
delete from auth.mfa_challenges;
delete from auth.mfa_amr_claims;
delete from auth.users;

commit;
