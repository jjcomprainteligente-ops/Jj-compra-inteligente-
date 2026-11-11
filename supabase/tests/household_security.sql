-- B07.2: database authorization, not an end-to-end Auth/login test.
-- Run as the migration owner in the isolated JJ development project.
-- Claims are transaction-local fixtures; PostgreSQL roles and RLS are real.
-- There are no email requests, signed test tokens, or persistent seed rows.
-- A failed assertion aborts the transaction; a successful run ends in ROLLBACK.
begin;
set local statement_timeout = '20s';
set local lock_timeout = '3s';

create temporary table jj_test_fixture (
  key text primary key,
  id uuid not null unique
) on commit drop;
create temporary table jj_test_results (
  name text primary key,
  passed boolean not null check (passed)
) on commit drop;

grant select on pg_temp.jj_test_fixture to authenticated, anon;
grant select, insert on pg_temp.jj_test_results to authenticated, anon;
do $grant_temp_schema$
begin
  execute format('grant usage on schema %I to authenticated, anon',
    pg_catalog.pg_my_temp_schema()::regnamespace::text);
end;
$grant_temp_schema$;

create function pg_temp.jj_fixture(p_key text) returns uuid
language sql stable security invoker set search_path = ''
as $$ select f.id from pg_temp.jj_test_fixture f where f.key = p_key $$;

create function pg_temp.jj_assert(p_name text, p_condition boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_condition is distinct from true then
    raise exception 'B07 test failed: %', p_name using errcode = 'P0701';
  end if;
  insert into pg_temp.jj_test_results(name, passed) values (p_name, true);
end;
$$;

create function pg_temp.jj_count(p_name text, p_query text, p_expected bigint)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_actual bigint;
begin
  execute p_query into strict v_actual;
  perform pg_temp.jj_assert(p_name, v_actual = p_expected);
end;
$$;

create function pg_temp.jj_sqlstate(
  p_name text, p_query text, p_expected text, p_message text default null
)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_code text;
  v_message text;
  v_failed boolean := false;
begin
  begin
    execute p_query;
  exception when others then
    get stacked diagnostics v_code = returned_sqlstate, v_message = message_text;
    if v_code <> p_expected then
      raise exception 'B07 test %: expected SQLSTATE %, got %',
        p_name, p_expected, v_code using errcode = 'P0701';
    end if;
    if p_message is not null and v_message <> p_message then
      raise exception 'B07 test %: expected message %, got %',
        p_name, p_message, v_message using errcode = 'P0701';
    end if;
    v_failed := true;
  end;
  perform pg_temp.jj_assert(p_name, v_failed);
end;
$$;

-- Set claims before selecting a runtime role. User-editable metadata is added
-- only by explicit adversarial cases; it never determines fixture membership.
create function pg_temp.jj_claims(
  p_user text, p_session text, p_extra jsonb default '{}'::jsonb
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', '', true);
  perform pg_catalog.set_config('request.jwt.claim.role', '', true);
  perform pg_catalog.set_config('request.jwt.claims', (
    pg_catalog.jsonb_build_object(
      'sub', pg_temp.jj_fixture(p_user),
      'session_id', pg_temp.jj_fixture(p_session),
      'role', 'authenticated',
      'exp', floor(extract(epoch from pg_catalog.clock_timestamp()))::bigint + 3600,
      'is_anonymous', false
    ) || p_extra
  )::text, true);
end;
$$;

-- Fixture and behavioral cases follow. Every UUID is generated for this run.
insert into pg_temp.jj_test_fixture(key, id)
select label, pg_catalog.gen_random_uuid()
from unnest(array[
  'owner_a', 'owner_b', 'member_a', 'pending_a', 'revoked_a', 'stranger',
  'unconfirmed', 'anonymous', 'banned', 'deleted_user', 'deleting_account',
  'session_owner_a', 'session_owner_b', 'session_member_a', 'session_pending_a',
  'session_revoked_a', 'session_stranger', 'session_unconfirmed',
  'session_anonymous', 'session_banned', 'session_deleted_user',
  'session_deleting_account', 'session_expired', 'session_nonexistent',
  'home_a', 'home_b', 'home_closed', 'home_no_owner',
  'list_a', 'list_b', 'list_closed', 'list_deleted',
  'item_a', 'item_b', 'item_closed', 'item_deleted', 'item_hidden_parent',
  'item_cross_household'
]) as labels(label);

insert into auth.users (
  id, aud, role, email, email_confirmed_at, created_at, updated_at,
  is_anonymous, banned_until, deleted_at, raw_app_meta_data, raw_user_meta_data
)
select f.id, 'authenticated', 'authenticated',
  'jj-rls-' || f.id::text || '@example.invalid',
  case when f.key <> 'unconfirmed' then pg_catalog.clock_timestamp() end,
  pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp(),
  f.key = 'anonymous',
  case when f.key = 'banned' then pg_catalog.clock_timestamp() + interval '1 day' end,
  case when f.key = 'deleted_user' then pg_catalog.clock_timestamp() end,
  '{}'::jsonb, '{}'::jsonb
from pg_temp.jj_test_fixture f
where f.key in (
  'owner_a', 'owner_b', 'member_a', 'pending_a', 'revoked_a', 'stranger',
  'unconfirmed', 'anonymous', 'banned', 'deleted_user', 'deleting_account'
);

insert into auth.sessions (id, user_id, created_at, updated_at, not_after)
select pg_temp.jj_fixture('session_' || name), pg_temp.jj_fixture(name),
  pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp(),
  pg_catalog.clock_timestamp() + interval '1 hour'
from unnest(array[
  'owner_a', 'owner_b', 'member_a', 'pending_a', 'revoked_a', 'stranger',
  'unconfirmed', 'anonymous', 'banned', 'deleted_user', 'deleting_account'
]) as names(name);
insert into auth.sessions (id, user_id, created_at, updated_at, not_after)
values (
  pg_temp.jj_fixture('session_expired'), pg_temp.jj_fixture('member_a'),
  pg_catalog.clock_timestamp() - interval '2 hours',
  pg_catalog.clock_timestamp() - interval '2 hours',
  pg_catalog.clock_timestamp() - interval '1 hour'
);

-- Business fixtures are inserted below after the matching schema migration.
-- These tests never authenticate through Supabase Auth or send a message.
insert into jj_private.account_controls(user_id, state)
select pg_temp.jj_fixture(name),
  case when name = 'deleting_account' then 'deletion_pending' else 'active' end
from unnest(array[
  'owner_a', 'owner_b', 'member_a', 'pending_a', 'revoked_a', 'stranger',
  'unconfirmed', 'anonymous', 'banned', 'deleted_user', 'deleting_account'
]) as names(name);

insert into jj_private.household_namespaces(household_id)
select pg_temp.jj_fixture(name)
from unnest(array['home_a', 'home_b', 'home_closed', 'home_no_owner']) as names(name);
insert into jj_private.resource_ids(resource_id, household_id, resource_kind)
select pg_temp.jj_fixture(name), pg_temp.jj_fixture(name), 'household'
from unnest(array['home_a', 'home_b', 'home_closed', 'home_no_owner']) as names(name);
insert into public.jj_households(id, name)
select pg_temp.jj_fixture(name), 'B07 transaction fixture ' || name
from unnest(array['home_a', 'home_b', 'home_closed']) as names(name);

insert into jj_private.memberships(household_id, user_id, role, status)
values
  (pg_temp.jj_fixture('home_a'), pg_temp.jj_fixture('owner_a'), 'owner', 'active'),
  (pg_temp.jj_fixture('home_b'), pg_temp.jj_fixture('owner_b'), 'owner', 'active'),
  (pg_temp.jj_fixture('home_closed'), pg_temp.jj_fixture('owner_a'), 'owner', 'active');
insert into jj_private.memberships(household_id, user_id, role, status)
select pg_temp.jj_fixture('home_a'), pg_temp.jj_fixture(name), 'member',
  case when name = 'pending_a' then 'pending'
       when name = 'revoked_a' then 'revoked' else 'active' end
from unnest(array[
  'member_a', 'pending_a', 'revoked_a', 'unconfirmed', 'anonymous',
  'banned', 'deleted_user', 'deleting_account'
]) as names(name);

insert into jj_private.resource_ids(resource_id, household_id, resource_kind)
select pg_temp.jj_fixture(list_name), pg_temp.jj_fixture(home_name), 'list'
from (values
  ('list_a', 'home_a'), ('list_b', 'home_b'),
  ('list_closed', 'home_closed'), ('list_deleted', 'home_a')
) as lists(list_name, home_name);
insert into public.jj_shopping_lists(id, household_id, name)
select r.resource_id, r.household_id, 'B07 transaction fixture list'
from jj_private.resource_ids r
where r.resource_kind = 'list' and r.household_id in (
  pg_temp.jj_fixture('home_a'), pg_temp.jj_fixture('home_b'), pg_temp.jj_fixture('home_closed')
);

insert into jj_private.resource_ids(resource_id, household_id, resource_kind, parent_list_id)
select pg_temp.jj_fixture(item_name), pg_temp.jj_fixture(home_name), 'item', pg_temp.jj_fixture(list_name)
from (values
  ('item_a', 'home_a', 'list_a'), ('item_b', 'home_b', 'list_b'),
  ('item_closed', 'home_closed', 'list_closed'), ('item_deleted', 'home_a', 'list_a'),
  ('item_hidden_parent', 'home_a', 'list_deleted'),
  ('item_cross_household', 'home_a', 'list_b')
) as items(item_name, home_name, list_name);
insert into public.jj_shopping_items(
  id, household_id, list_id, name, quantity_milli, unit, category_code
)
select r.resource_id, r.household_id, r.parent_list_id, 'B07 transaction fixture item',
  1000, 'ud', 'other'
from jj_private.resource_ids r
where r.resource_kind = 'item' and r.resource_id <> pg_temp.jj_fixture('item_cross_household')
  and r.household_id in (
    pg_temp.jj_fixture('home_a'), pg_temp.jj_fixture('home_b'), pg_temp.jj_fixture('home_closed')
  );
update public.jj_shopping_lists set deleted_at = clock_timestamp(), revision = revision + 1
where id = pg_temp.jj_fixture('list_deleted');
update public.jj_shopping_items set deleted_at = clock_timestamp(), revision = revision + 1
where id = pg_temp.jj_fixture('item_deleted');
update public.jj_households set status = 'deleting', revision = revision + 1
where id = pg_temp.jj_fixture('home_closed');

create function pg_temp.jj_visible(
  p_name text, p_home text, p_list text, p_item text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_temp.jj_assert(p_name || ':runtime_role', current_user = 'authenticated');
  perform pg_temp.jj_assert(p_name || ':household', (
    select array_agg(h.id order by h.id) = array[pg_temp.jj_fixture(p_home)]
    from public.jj_households h
  ));
  perform pg_temp.jj_assert(p_name || ':list', (
    select array_agg(l.id order by l.id) = array[pg_temp.jj_fixture(p_list)]
    from public.jj_shopping_lists l
  ));
  perform pg_temp.jj_assert(p_name || ':item', (
    select array_agg(i.id order by i.id) = array[pg_temp.jj_fixture(p_item)]
    from public.jj_shopping_items i
  ));
end;
$$;

create function pg_temp.jj_invisible(p_name text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_temp.jj_assert(p_name || ':runtime_role', current_user = 'authenticated');
  perform pg_temp.jj_count(p_name || ':household',
    'select count(*) from public.jj_households', 0);
  perform pg_temp.jj_count(p_name || ':list',
    'select count(*) from public.jj_shopping_lists', 0);
  perform pg_temp.jj_count(p_name || ':item',
    'select count(*) from public.jj_shopping_items', 0);
end;
$$;

create function pg_temp.jj_no_business_mutations(p_name text)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_table text;
begin
  foreach v_table in array array['jj_households', 'jj_shopping_lists', 'jj_shopping_items'] loop
    perform pg_temp.jj_sqlstate(p_name || ':' || v_table || ':insert',
      format('insert into public.%I default values', v_table), '42501');
    perform pg_temp.jj_sqlstate(p_name || ':' || v_table || ':update',
      format('update public.%I set revision = revision + 1', v_table), '42501');
    perform pg_temp.jj_sqlstate(p_name || ':' || v_table || ':delete',
      format('delete from public.%I', v_table), '42501');
    perform pg_temp.jj_sqlstate(p_name || ':' || v_table || ':truncate',
      format('truncate table public.%I', v_table), '42501');
  end loop;
end;
$$;

-- Validate deferred constraints on fixtures before running permission cases.
set constraints all immediate;
set constraints all deferred;

select pg_temp.jj_claims('owner_a', 'session_owner_a');
set local role authenticated;
select pg_temp.jj_visible('owner_a_only_own_household', 'home_a', 'list_a', 'item_a');
select pg_temp.jj_no_business_mutations('authenticated_dml_denied');
reset role;

select pg_temp.jj_claims('owner_b', 'session_owner_b');
set local role authenticated;
select pg_temp.jj_visible('owner_b_only_own_household', 'home_b', 'list_b', 'item_b');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a');
set local role authenticated;
select pg_temp.jj_visible('member_a_only_own_household', 'home_a', 'list_a', 'item_a');
select pg_temp.jj_count('member_a_cannot_guess_household_b',
  $$select count(*) from public.jj_households where id = pg_temp.jj_fixture('home_b')$$, 0);
select pg_temp.jj_count('member_a_cannot_guess_list_b',
  $$select count(*) from public.jj_shopping_lists where id = pg_temp.jj_fixture('list_b')$$, 0);
select pg_temp.jj_count('member_a_cannot_guess_item_b',
  $$select count(*) from public.jj_shopping_items where id = pg_temp.jj_fixture('item_b')$$, 0);
select pg_temp.jj_count('deleted_parent_hides_its_items',
  $$select count(*) from public.jj_shopping_items where id = pg_temp.jj_fixture('item_hidden_parent')$$, 0);
select pg_temp.jj_count('soft_deleted_item_is_hidden',
  $$select count(*) from public.jj_shopping_items where id = pg_temp.jj_fixture('item_deleted')$$, 0);
reset role;

select pg_temp.jj_claims('pending_a', 'session_pending_a');
set local role authenticated;
select pg_temp.jj_invisible('pending_member');
reset role;

select pg_temp.jj_claims('revoked_a', 'session_revoked_a');
set local role authenticated;
select pg_temp.jj_invisible('revoked_member');
reset role;

select pg_temp.jj_claims('stranger', 'session_stranger');
set local role authenticated;
select pg_temp.jj_invisible('stranger');
reset role;

select pg_temp.jj_claims('unconfirmed', 'session_unconfirmed');
set local role authenticated;
select pg_temp.jj_invisible('unconfirmed_email');
reset role;

select pg_temp.jj_claims('anonymous', 'session_anonymous');
set local role authenticated;
select pg_temp.jj_invisible('anonymous_auth_user');
reset role;

select pg_temp.jj_claims('banned', 'session_banned');
set local role authenticated;
select pg_temp.jj_invisible('banned_auth_user');
reset role;

select pg_temp.jj_claims('deleted_user', 'session_deleted_user');
set local role authenticated;
select pg_temp.jj_invisible('deleted_auth_user');
reset role;

select pg_temp.jj_claims('deleting_account', 'session_deleting_account');
set local role authenticated;
select pg_temp.jj_invisible('account_deletion_pending');
reset role;

select pg_temp.jj_claims('member_a', 'session_nonexistent');
set local role authenticated;
select pg_temp.jj_invisible('session_does_not_exist');
reset role;

select pg_temp.jj_claims('member_a', 'session_owner_b');
set local role authenticated;
select pg_temp.jj_invisible('session_belongs_to_another_user');
reset role;

select pg_temp.jj_claims('member_a', 'session_expired');
set local role authenticated;
select pg_temp.jj_invisible('session_not_after_expired');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a',
  jsonb_build_object('exp', floor(extract(epoch from clock_timestamp()))::bigint - 1));
set local role authenticated;
select pg_temp.jj_invisible('jwt_expired');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a', '{"session_id":null}');
set local role authenticated;
select pg_temp.jj_invisible('jwt_missing_session_id');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a', '{"session_id":"not-a-uuid"}');
set local role authenticated;
select pg_temp.jj_invisible('jwt_malformed_session_id');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a', '{"sub":"not-a-uuid"}');
set local role authenticated;
select pg_temp.jj_invisible('jwt_malformed_subject');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a', '{"exp":"not-a-number"}');
set local role authenticated;
select pg_temp.jj_invisible('jwt_malformed_expiry');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a', '{"exp":null}');
set local role authenticated;
select pg_temp.jj_invisible('jwt_missing_expiry');
reset role;

select pg_temp.jj_claims('stranger', 'session_stranger', jsonb_build_object(
  'user_metadata', jsonb_build_object('role', 'owner', 'household_id', pg_temp.jj_fixture('home_a')),
  'role_in_household', 'owner', 'household_id', pg_temp.jj_fixture('home_a')
));
set local role authenticated;
select pg_temp.jj_invisible('editable_metadata_cannot_grant_ownership');
reset role;

select pg_temp.jj_claims('member_a', 'session_member_a', jsonb_build_object(
  'user_metadata', jsonb_build_object('role', 'owner', 'household_id', pg_temp.jj_fixture('home_b'))
));
set local role authenticated;
select pg_temp.jj_visible('metadata_cannot_switch_household', 'home_a', 'list_a', 'item_a');
reset role;

-- Final assertions and the report follow below; do not remove ROLLBACK.
select pg_temp.jj_claims('owner_a', 'session_owner_a');
set local role authenticated;
do $private_privileges$
declare v_table text;
begin
  foreach v_table in array array[
    'account_controls', 'session_revocations', 'household_namespaces', 'resource_ids',
    'memberships', 'invitations', 'membership_requests', 'ownership_transfers',
    'operation_receipts', 'migration_batches', 'account_deletion_jobs'
  ] loop
    perform pg_temp.jj_sqlstate('private_select_denied:' || v_table,
      format('select count(*) from jj_private.%I', v_table), '42501');
    perform pg_temp.jj_assert('private_mutation_grants_denied:' || v_table,
      not has_table_privilege('authenticated', format('jj_private.%I', v_table), 'INSERT,UPDATE,DELETE,TRUNCATE'));
    perform pg_temp.jj_assert('service_role_private_grants_denied:' || v_table,
      not has_table_privilege('service_role', format('jj_private.%I', v_table), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'));
  end loop;
end;
$private_privileges$;
do $public_service_privileges$
declare v_table text;
begin
  foreach v_table in array array['jj_households', 'jj_shopping_lists', 'jj_shopping_items'] loop
    perform pg_temp.jj_assert('service_role_business_grants_denied:' || v_table,
      not has_table_privilege('service_role', format('public.%I', v_table), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'));
  end loop;
end;
$public_service_privileges$;
select pg_temp.jj_sqlstate('cannot_assume_policy_reader_role',
  'set local role jj_policy_reader', '42501');
select pg_temp.jj_sqlstate('cannot_execute_inner_auth_lookup',
  'select jj_private.has_live_session()', '42501');
select pg_temp.jj_assert('cannot_create_private_function',
  not has_schema_privilege('authenticated', 'jj_private', 'CREATE'));
select pg_temp.jj_assert('policy_reader_is_not_inherited',
  not pg_has_role('authenticated', 'jj_policy_reader', 'MEMBER'));
select pg_temp.jj_assert('policy_reader_has_no_login_or_bypass', (
  select not rolcanlogin and not rolbypassrls and not rolsuper and not rolcreaterole
  from pg_roles where rolname = 'jj_policy_reader'
));
select pg_temp.jj_assert('all_business_tables_force_rls', (
  select count(*) = 3 and bool_and(c.relrowsecurity and c.relforcerowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('jj_households', 'jj_shopping_lists', 'jj_shopping_items')
));
select pg_temp.jj_assert('all_private_tables_force_rls', (
  select count(*) = 11 and bool_and(c.relrowsecurity and c.relforcerowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'jj_private' and c.relkind = 'r'
));
reset role;

select set_config('request.jwt.claims', '{}', true);
set local role anon;
select pg_temp.jj_assert('anonymous_runtime_role', current_user = 'anon');
select pg_temp.jj_sqlstate('anonymous_household_select_denied',
  'select count(*) from public.jj_households', '42501');
select pg_temp.jj_sqlstate('anonymous_list_select_denied',
  'select count(*) from public.jj_shopping_lists', '42501');
select pg_temp.jj_sqlstate('anonymous_item_select_denied',
  'select count(*) from public.jj_shopping_items', '42501');
select pg_temp.jj_sqlstate('anonymous_private_helper_denied',
  $$select jj_private.can_read_household(pg_temp.jj_fixture('home_a'))$$, '42501');
select pg_temp.jj_no_business_mutations('anonymous_dml_denied');
reset role;

-- Revocation must apply to the already issued session ID without trusting
-- refreshed role/household metadata or a new client registration request.
insert into jj_private.session_revocations(session_id, user_id)
values (pg_temp.jj_fixture('session_member_a'), pg_temp.jj_fixture('member_a'));
select pg_temp.jj_claims('member_a', 'session_member_a');
set local role authenticated;
select pg_temp.jj_invisible('jj_session_revoked');
reset role;

delete from auth.sessions where id = pg_temp.jj_fixture('session_owner_b');
select pg_temp.jj_claims('owner_b', 'session_owner_b');
set local role authenticated;
select pg_temp.jj_invisible('provider_session_removed');
reset role;

update jj_private.account_controls set state = 'deleted'
where user_id = pg_temp.jj_fixture('owner_a');
select pg_temp.jj_claims('owner_a', 'session_owner_a');
set local role authenticated;
select pg_temp.jj_invisible('account_marked_deleted');
reset role;
-- Fixture-only restoration. There is no account-reactivation API in B07.2.
update jj_private.account_controls set state = 'active'
where user_id = pg_temp.jj_fixture('owner_a');

select pg_temp.jj_sqlstate('cross_household_item_rejected', $$
  insert into public.jj_shopping_items(id, household_id, list_id, name, quantity_milli, unit, category_code)
  values (pg_temp.jj_fixture('item_cross_household'), pg_temp.jj_fixture('home_a'),
    pg_temp.jj_fixture('list_b'), 'Cross household must fail', 1000, 'ud', 'other')
$$, '23514');
select pg_temp.jj_assert('failed_insert_did_not_consume_resource_id', (
  select not attached from jj_private.resource_ids
  where resource_id = pg_temp.jj_fixture('item_cross_household')
));
select pg_temp.jj_sqlstate('cannot_replace_item_household', $$
  update public.jj_shopping_items set household_id = pg_temp.jj_fixture('home_b'),
    list_id = pg_temp.jj_fixture('list_b'), revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('cannot_replace_item_parent_list', $$
  update public.jj_shopping_items set list_id = pg_temp.jj_fixture('list_deleted'), revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('update_requires_revision_advance', $$
  update public.jj_shopping_items set checked = not checked
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('zero_quantity_rejected', $$
  update public.jj_shopping_items set quantity_milli = 0, revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('oversize_quantity_rejected', $$
  update public.jj_shopping_items set quantity_milli = 1000000001, revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('fractional_units_rejected', $$
  update public.jj_shopping_items set quantity_milli = 1001, revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('unknown_category_rejected', $$
  update public.jj_shopping_items set category_code = 'owner', revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('unknown_unit_rejected', $$
  update public.jj_shopping_items set unit = 'crate', revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_sqlstate('empty_name_rejected', $$
  update public.jj_shopping_items set name = ' ', revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');

select pg_temp.jj_sqlstate('unique_owner_index_blocks_second_owner', $$
  update jj_private.memberships set role = 'owner', membership_epoch = membership_epoch + 1
  where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('member_a')
$$, '23505');
select pg_temp.jj_sqlstate('active_household_cannot_finish_without_owner', $$
  update jj_private.memberships set role = 'member', membership_epoch = membership_epoch + 1
  where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('owner_a');
  set constraints all immediate
$$, '23514', 'JJ_EXACTLY_ONE_OWNER');
select pg_temp.jj_sqlstate('new_household_requires_owner_before_commit', $$
  insert into public.jj_households(id, name)
  values (pg_temp.jj_fixture('home_no_owner'), 'Missing owner must fail');
  set constraints all immediate
$$, '23514', 'JJ_EXACTLY_ONE_OWNER');
select pg_temp.jj_sqlstate('new_household_cannot_start_inactive', $$
  insert into public.jj_households(id, name, status)
  values (pg_temp.jj_fixture('home_no_owner'), 'Inactive start must fail', 'deleting')
$$, '23514', 'JJ_HOUSEHOLD_STARTS_ACTIVE');

-- Transfer is represented only as a database invariant here. No public
-- ownership-transfer RPC exists or is claimed by this schema test.
update jj_private.memberships set role = 'member', membership_epoch = membership_epoch + 1
where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('owner_a');
update jj_private.memberships set role = 'owner', membership_epoch = membership_epoch + 1
where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('member_a');
set constraints all immediate;
select pg_temp.jj_assert('deferred_owner_transfer_has_one_owner', (
  select count(*) = 1 and bool_and(user_id = pg_temp.jj_fixture('member_a'))
  from jj_private.memberships where household_id = pg_temp.jj_fixture('home_a') and role = 'owner' and status = 'active'
));
set constraints all deferred;
update jj_private.memberships set role = 'member', membership_epoch = membership_epoch + 1
where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('member_a');
update jj_private.memberships set role = 'owner', membership_epoch = membership_epoch + 1
where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('owner_a');
set constraints all immediate;
set constraints all deferred;

select pg_temp.jj_sqlstate('revoked_member_cannot_rejoin_with_old_epoch', $$
  update jj_private.memberships set status = 'active'
  where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('revoked_a')
$$, '23514', 'JJ_MEMBERSHIP_EPOCH');
select pg_temp.jj_sqlstate('active_member_revocation_requires_new_epoch', $$
  update jj_private.memberships set status = 'revoked'
  where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('member_a')
$$, '23514', 'JJ_MEMBERSHIP_EPOCH');
select pg_temp.jj_sqlstate('membership_role_change_requires_new_epoch', $$
  update jj_private.memberships set role = 'owner'
  where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('member_a')
$$, '23514', 'JJ_MEMBERSHIP_EPOCH');
select pg_temp.jj_sqlstate('membership_history_cannot_be_deleted_while_active', $$
  delete from jj_private.memberships
  where household_id = pg_temp.jj_fixture('home_a') and user_id = pg_temp.jj_fixture('revoked_a')
$$, '23514');

delete from auth.users where id = pg_temp.jj_fixture('member_a');
select pg_temp.jj_assert('deleting_identity_does_not_cascade_shared_items', (
  select count(*) = 5 from public.jj_shopping_items
  where household_id in (pg_temp.jj_fixture('home_a'), pg_temp.jj_fixture('home_b'), pg_temp.jj_fixture('home_closed'))
));

select pg_temp.jj_sqlstate('soft_deleted_item_cannot_be_resurrected', $$
  update public.jj_shopping_items set deleted_at = null, revision = revision + 1
  where id = pg_temp.jj_fixture('item_deleted')
$$, '23514');

delete from public.jj_shopping_items where id = pg_temp.jj_fixture('item_deleted');
select pg_temp.jj_assert('purged_item_keeps_minimal_ledger', (
  select attached and deleted_at is not null from jj_private.resource_ids
  where resource_id = pg_temp.jj_fixture('item_deleted')
));
select pg_temp.jj_sqlstate('purged_item_uuid_cannot_be_reinserted', $$
  insert into public.jj_shopping_items(id, household_id, list_id, name, quantity_milli, unit, category_code)
  values (pg_temp.jj_fixture('item_deleted'), pg_temp.jj_fixture('home_a'),
    pg_temp.jj_fixture('list_a'), 'Replay must fail', 1000, 'ud', 'other')
$$, '23514', 'JJ_RESOURCE_ID_RESERVED');

insert into pg_temp.jj_test_fixture(key, id)
values ('late_item_deleted_parent', gen_random_uuid()), ('late_list_closed_home', gen_random_uuid());
insert into jj_private.resource_ids(resource_id, household_id, resource_kind, parent_list_id)
values (pg_temp.jj_fixture('late_item_deleted_parent'), pg_temp.jj_fixture('home_a'),
  'item', pg_temp.jj_fixture('list_deleted'));
select pg_temp.jj_sqlstate('cannot_insert_under_soft_deleted_parent', $$
  insert into public.jj_shopping_items(id, household_id, list_id, name, quantity_milli, unit, category_code)
  values (pg_temp.jj_fixture('late_item_deleted_parent'), pg_temp.jj_fixture('home_a'),
    pg_temp.jj_fixture('list_deleted'), 'Deleted parent must fail', 1000, 'ud', 'other')
$$, '23514', 'JJ_PARENT_LIST_DELETED');
select pg_temp.jj_sqlstate('cannot_update_item_under_soft_deleted_parent', $$
  update public.jj_shopping_items set checked = true, revision = revision + 1
  where id = pg_temp.jj_fixture('item_hidden_parent')
$$, '23514', 'JJ_PARENT_LIST_DELETED');
insert into jj_private.resource_ids(resource_id, household_id, resource_kind)
values (pg_temp.jj_fixture('late_list_closed_home'), pg_temp.jj_fixture('home_closed'), 'list');
select pg_temp.jj_sqlstate('closed_namespace_rejects_new_content', $$
  insert into public.jj_shopping_lists(id, household_id, name)
  values (pg_temp.jj_fixture('late_list_closed_home'), pg_temp.jj_fixture('home_closed'), 'Closed namespace must fail')
$$, '23514', 'JJ_NAMESPACE_CLOSED');
select pg_temp.jj_sqlstate('closed_household_cannot_be_reopened', $$
  update public.jj_households set status = 'active', revision = revision + 1
  where id = pg_temp.jj_fixture('home_closed')
$$, '23514', 'JJ_NAMESPACE_CLOSED');
select pg_temp.jj_sqlstate('control_characters_cannot_be_stored_in_names', $$
  update public.jj_shopping_items set name = 'Line' || chr(10) || 'Break', revision = revision + 1
  where id = pg_temp.jj_fixture('item_a')
$$, '23514');
select pg_temp.jj_assert('owner_invariant_still_valid_after_negative_cases', (
  select count(*) = 1 from jj_private.memberships
  where household_id = pg_temp.jj_fixture('home_a') and role = 'owner' and status = 'active'
));
set constraints all immediate;

select pg_temp.jj_assert('minimum_expected_check_count',
  (select count(*) >= 140 from pg_temp.jj_test_results));
select jsonb_build_object(
  'suite', 'b07_database_authorization',
  'version', 1,
  'database', current_setting('server_version'),
  'model', 'real_postgres_roles_rls_with_transaction_local_claim_fixtures',
  'authLoginOrJwtSignatureVerified', false,
  'checks', count(*),
  'passed', bool_and(passed),
  'names', jsonb_agg(name order by name),
  'fixtureUsers', (select count(*) from auth.users u join pg_temp.jj_test_fixture f on f.id = u.id),
  'persistentSeed', false,
  'cleanup', 'transaction_rollback_after_this_report'
) as report
from pg_temp.jj_test_results;
rollback;
