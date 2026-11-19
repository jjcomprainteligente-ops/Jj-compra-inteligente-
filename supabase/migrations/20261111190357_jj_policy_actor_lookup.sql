-- The managed auth schema grants postgres USAGE without grant option. A GRANT
-- from postgres to our NOLOGIN reader therefore did not confer Auth access.
-- Keep the reader outside Auth; bridge only the current request's own subject.
-- This helper is NOT authentication: the outer gate still checks the live
-- provider session, account, revocation, membership and household state.
create function jj_private.jwt_actor_id() returns uuid
language plpgsql volatile security definer set search_path = '' as $$
begin
  return auth.uid();
exception when invalid_text_representation then
  return null;
end;
$$;
revoke execute on function jj_private.jwt_actor_id() from public, anon, authenticated, service_role;
grant execute on function jj_private.jwt_actor_id() to jj_policy_reader;

-- CREATE OR REPLACE preserves the restricted NOLOGIN owner and existing ACL.
create or replace function jj_private.can_read_household(p_household_id uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
  select jj_private.has_live_session() and exists (
    select 1 from public.jj_households h
    join jj_private.memberships m on m.household_id = h.id
    where h.id = p_household_id and h.status = 'active'
      and m.user_id = jj_private.jwt_actor_id() and m.status = 'active'
  );
$$;
revoke execute on function jj_private.can_read_household(uuid) from public, anon, service_role;
grant execute on function jj_private.can_read_household(uuid) to authenticated;

comment on function jj_private.jwt_actor_id() is 'Private subject bridge only, not authentication. Execute restricted to the policy reader; live-session gate remains mandatory.';
