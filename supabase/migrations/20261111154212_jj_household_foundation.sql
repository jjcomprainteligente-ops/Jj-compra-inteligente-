-- B07.2: isolated database foundation, not an activated account/sync API.
-- No client DML, public mutating RPC, Auth signup hook, network or local migration.
-- Apply only to the dedicated JJ project after the independent security review.

create schema jj_private;
revoke all on schema jj_private from public, anon, authenticated, service_role;
alter default privileges in schema jj_private revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema jj_private revoke execute on functions from public, anon, authenticated, service_role;

create role jj_policy_reader nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls;
grant jj_policy_reader to postgres;
grant usage on schema jj_private, public, auth to jj_policy_reader;

-- Minimal controls survive provider deletion; no FK/cascade to Auth identities.
-- No client bootstrap exists yet: an absent account control fails closed.
create table jj_private.account_controls (
  user_id uuid primary key,
  state text not null default 'active' check (state in ('active', 'deletion_pending', 'deleted')),
  session_epoch bigint not null default 1 check (session_epoch > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

-- Revocation is irreversible for a session UUID. Never cascade it with Auth.
create table jj_private.session_revocations (
  session_id uuid primary key,
  user_id uuid not null references jj_private.account_controls(user_id),
  revoked_at timestamptz not null default clock_timestamp()
);
create index jj_session_revocations_user_idx on jj_private.session_revocations(user_id);

-- These two ledgers are deliberately independent of content/receipt retention.
create table jj_private.household_namespaces (
  household_id uuid primary key,
  created_at timestamptz not null default clock_timestamp(),
  closed_at timestamptz
);
create table jj_private.resource_ids (
  resource_id uuid primary key,
  household_id uuid not null references jj_private.household_namespaces(household_id),
  resource_kind text not null check (resource_kind in ('household', 'list', 'item')),
  parent_list_id uuid,
  attached boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  check ((resource_kind = 'household' and resource_id = household_id and parent_list_id is null)
      or (resource_kind = 'list' and parent_list_id is null)
      or (resource_kind = 'item' and parent_list_id is not null))
);
create index jj_resource_ids_household_idx on jj_private.resource_ids(household_id);
create index jj_resource_ids_parent_idx on jj_private.resource_ids(parent_list_id) where parent_list_id is not null;

create table public.jj_households (
  id uuid primary key references jj_private.resource_ids(resource_id),
  name text not null check (char_length(name) between 1 and 80 and char_length(btrim(name)) > 0
    and name !~ U&'[\0001-\001F\007F-\009F\061C\200E\200F\2028\2029\202A-\202E\2066-\2069]'),
  status text not null default 'active' check (status in ('active', 'deleting', 'deleted')),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create table jj_private.memberships (
  household_id uuid not null references public.jj_households(id),
  user_id uuid not null references jj_private.account_controls(user_id),
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  membership_epoch bigint not null default 1 check (membership_epoch > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  primary key (household_id, user_id),
  check (role <> 'owner' or status = 'active')
);
create unique index jj_memberships_one_owner_idx on jj_private.memberships(household_id)
  where role = 'owner' and status = 'active';
create index jj_memberships_actor_idx on jj_private.memberships(user_id, household_id) where status = 'active';

create table public.jj_shopping_lists (
  id uuid primary key references jj_private.resource_ids(resource_id),
  household_id uuid not null references public.jj_households(id),
  name text not null check (char_length(name) between 1 and 80 and char_length(btrim(name)) > 0
    and name !~ U&'[\0001-\001F\007F-\009F\061C\200E\200F\2028\2029\202A-\202E\2066-\2069]'),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  unique (household_id, id)
);
create index jj_shopping_lists_household_idx on public.jj_shopping_lists(household_id, id) where deleted_at is null;
create table public.jj_shopping_items (
  id uuid primary key references jj_private.resource_ids(resource_id),
  household_id uuid not null,
  list_id uuid not null,
  name text not null check (char_length(name) between 1 and 120 and char_length(btrim(name)) > 0
    and name !~ U&'[\0001-\001F\007F-\009F\061C\200E\200F\2028\2029\202A-\202E\2066-\2069]'),
  quantity_milli bigint not null check (quantity_milli between 1 and 1000000000),
  unit text not null check (unit in ('ud', 'g', 'kg', 'ml', 'L')),
  category_code text not null check (category_code in ('produce', 'pantry', 'dairy-eggs', 'meat-fish', 'bakery', 'household', 'other')),
  checked boolean not null default false,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  foreign key (household_id, list_id) references public.jj_shopping_lists(household_id, id),
  check (unit <> 'ud' or quantity_milli % 1000 = 0)
);
create index jj_shopping_items_list_idx on public.jj_shopping_items(household_id, list_id, id) where deleted_at is null;

create table jj_private.invitations (
  id uuid primary key,
  household_id uuid not null references public.jj_households(id),
  issuer_id uuid not null references jj_private.account_controls(user_id),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  status text not null default 'pending' check (status in ('pending', 'redeemed', 'revoked', 'expired')),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  redeemed_by uuid references jj_private.account_controls(user_id),
  redeemed_at timestamptz,
  revoked_at timestamptz,
  unique (household_id, id),
  check (expires_at > created_at),
  check ((redeemed_by is null) = (redeemed_at is null))
);
create index jj_invitations_household_idx on jj_private.invitations(household_id, status);
create index jj_invitations_issuer_idx on jj_private.invitations(issuer_id);
create index jj_invitations_redeemer_idx on jj_private.invitations(redeemed_by) where redeemed_by is not null;
create table jj_private.membership_requests (
  id uuid primary key,
  household_id uuid not null references public.jj_households(id),
  invitation_id uuid not null unique,
  requester_id uuid not null references jj_private.account_controls(user_id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked')),
  created_at timestamptz not null default clock_timestamp(),
  decided_at timestamptz,
  foreign key (household_id, invitation_id) references jj_private.invitations(household_id, id)
);
create index jj_requests_household_idx on jj_private.membership_requests(household_id, status);
create index jj_requests_requester_idx on jj_private.membership_requests(requester_id);
create table jj_private.ownership_transfers (
  id uuid primary key,
  household_id uuid not null references public.jj_households(id),
  sender_id uuid not null,
  recipient_id uuid not null,
  expected_household_revision bigint not null check (expected_household_revision > 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  foreign key (household_id, sender_id) references jj_private.memberships(household_id, user_id),
  foreign key (household_id, recipient_id) references jj_private.memberships(household_id, user_id),
  check (sender_id <> recipient_id and expires_at > created_at)
);
create unique index jj_transfers_pending_idx on jj_private.ownership_transfers(household_id) where status = 'pending';
create index jj_transfers_sender_idx on jj_private.ownership_transfers(household_id, sender_id);
create index jj_transfers_recipient_idx on jj_private.ownership_transfers(household_id, recipient_id);

-- Payloads and plaintext invitation tokens are intentionally absent.
-- A future RPC must authorize receipt lookup again BEFORE returning a result.
create table jj_private.operation_receipts (
  actor_id uuid not null references jj_private.account_controls(user_id),
  scope_type text not null check (scope_type in ('account', 'household')),
  scope_id uuid not null,
  idempotency_key uuid not null,
  operation text not null check (char_length(operation) between 1 and 64),
  contract_version integer not null check (contract_version = 1),
  membership_epoch bigint check (membership_epoch > 0),
  payload_hash bytea not null check (octet_length(payload_hash) = 32),
  result_code text not null check (result_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  resource_id uuid,
  result_revision bigint check (result_revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  primary key (actor_id, scope_type, scope_id, idempotency_key),
  check ((scope_type = 'account' and scope_id = actor_id and membership_epoch is null)
      or (scope_type = 'household' and membership_epoch is not null))
);
create index jj_receipts_scope_idx on jj_private.operation_receipts(scope_type, scope_id);
create table jj_private.migration_batches (
  actor_id uuid not null,
  household_id uuid not null,
  review_id uuid not null,
  idempotency_key uuid not null,
  scope_type text not null default 'household' check (scope_type = 'household'),
  membership_epoch bigint not null check (membership_epoch > 0),
  payload_hash bytea not null check (octet_length(payload_hash) = 32),
  list_count integer not null check (list_count between 1 and 20),
  item_count integer not null check (item_count between 0 and 1000),
  status text not null check (status in ('committed', 'purged')),
  created_at timestamptz not null default clock_timestamp(),
  primary key (actor_id, household_id, review_id),
  unique (actor_id, household_id, idempotency_key),
  foreign key (actor_id, scope_type, household_id, idempotency_key)
    references jj_private.operation_receipts(actor_id, scope_type, scope_id, idempotency_key),
  foreign key (household_id, actor_id) references jj_private.memberships(household_id, user_id)
);
create index jj_migration_batches_household_idx on jj_private.migration_batches(household_id, actor_id);
create table jj_private.account_deletion_jobs (
  id uuid primary key,
  actor_id uuid not null unique references jj_private.account_controls(user_id),
  receipt_hash bytea not null unique check (octet_length(receipt_hash) = 32),
  status text not null check (status in ('prepared', 'memberships_removed', 'auth_pending', 'completed', 'retry_required')),
  error_code text check (error_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null check (expires_at > created_at)
);

-- Ledger attachment is atomic and permanent: an old UUID cannot be reinserted
-- after physical content deletion, even if operation receipts have been purged.
create function jj_private.attach_resource_id() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_household uuid; v_kind text; v_parent uuid;
begin
  if tg_table_name = 'jj_households' then
    v_household := new.id; v_kind := 'household';
  elsif tg_table_name = 'jj_shopping_lists' then
    v_household := new.household_id; v_kind := 'list';
  elsif tg_table_name = 'jj_shopping_items' then
    v_household := new.household_id; v_kind := 'item'; v_parent := new.list_id;
  else raise exception using errcode = '23514', message = 'JJ_RESOURCE_TABLE'; end if;
  perform 1 from jj_private.household_namespaces n
    where n.household_id = v_household and n.closed_at is null for update;
  if not found then raise exception using errcode = '23514', message = 'JJ_NAMESPACE_CLOSED'; end if;
  if v_kind = 'item' then
    perform 1 from public.jj_shopping_lists l
      where l.household_id = v_household and l.id = v_parent and l.deleted_at is null for update;
    if not found then raise exception using errcode = '23514', message = 'JJ_PARENT_LIST_DELETED'; end if;
  end if;
  update jj_private.resource_ids r set attached = true
    where r.resource_id = new.id and r.household_id = v_household
      and r.resource_kind = v_kind and r.parent_list_id is not distinct from v_parent
      and not r.attached and r.deleted_at is null;
  if not found then raise exception using errcode = '23514', message = 'JJ_RESOURCE_ID_RESERVED'; end if;
  return new;
end;
$$;

create function jj_private.protect_resource_lifecycle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    update jj_private.resource_ids set deleted_at = coalesce(deleted_at, clock_timestamp()) where resource_id = old.id;
    if tg_table_name = 'jj_households' then
      update jj_private.household_namespaces set closed_at = coalesce(closed_at, clock_timestamp()) where household_id = old.id;
    end if;
    return old;
  end if;
  if new.id is distinct from old.id then raise exception using errcode = '23514', message = 'JJ_IMMUTABLE_RESOURCE_ID'; end if;
  if new.revision <= old.revision then raise exception using errcode = '23514', message = 'JJ_REVISION_MUST_ADVANCE'; end if;
  if tg_table_name = 'jj_households' then
    if old.status <> 'active' and new.status = 'active' then
      raise exception using errcode = '23514', message = 'JJ_NAMESPACE_CLOSED';
    end if;
    if new.status <> 'active' then
      update jj_private.household_namespaces set closed_at = coalesce(closed_at, clock_timestamp()) where household_id = new.id;
    end if;
  else
    if new.household_id is distinct from old.household_id then raise exception using errcode = '23514', message = 'JJ_IMMUTABLE_HOUSEHOLD'; end if;
    if tg_table_name = 'jj_shopping_items' then
      if new.list_id is distinct from old.list_id then
        raise exception using errcode = '23514', message = 'JJ_IMMUTABLE_PARENT_LIST';
      end if;
      perform 1 from public.jj_shopping_lists l
        where l.household_id = new.household_id and l.id = new.list_id and l.deleted_at is null for update;
      if not found then raise exception using errcode = '23514', message = 'JJ_PARENT_LIST_DELETED'; end if;
    end if;
    if old.deleted_at is not null and new.deleted_at is distinct from old.deleted_at then
      raise exception using errcode = '23514', message = 'JJ_TOMBSTONE_IMMUTABLE';
    end if;
    if new.deleted_at is not null then
      update jj_private.resource_ids set deleted_at = coalesce(deleted_at, new.deleted_at) where resource_id = new.id;
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger jj_households_attach before insert on public.jj_households for each row execute function jj_private.attach_resource_id();
create trigger jj_lists_attach before insert on public.jj_shopping_lists for each row execute function jj_private.attach_resource_id();
create trigger jj_items_attach before insert on public.jj_shopping_items for each row execute function jj_private.attach_resource_id();
create trigger jj_households_lifecycle before update or delete on public.jj_households for each row execute function jj_private.protect_resource_lifecycle();
create trigger jj_lists_lifecycle before update or delete on public.jj_shopping_lists for each row execute function jj_private.protect_resource_lifecycle();
create trigger jj_items_lifecycle before update or delete on public.jj_shopping_items for each row execute function jj_private.protect_resource_lifecycle();

-- Acquire the same household lock BEFORE membership changes, not merely in a
-- deferred checker, so concurrent owner changes cannot both validate a snapshot.
create function jj_private.lock_membership_household() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_household uuid; v_status text;
begin
  if tg_op = 'DELETE' then v_household := old.household_id;
  else v_household := new.household_id; end if;
  if tg_op = 'UPDATE' then
    if new.household_id is distinct from old.household_id or new.user_id is distinct from old.user_id then
      raise exception using errcode = '23514', message = 'JJ_IMMUTABLE_MEMBERSHIP';
    end if;
    if new.membership_epoch < old.membership_epoch
       or ((new.status is distinct from old.status or new.role is distinct from old.role)
           and new.membership_epoch <= old.membership_epoch) then
      raise exception using errcode = '23514', message = 'JJ_MEMBERSHIP_EPOCH';
    end if;
  end if;
  select status into v_status from public.jj_households where id = v_household for update;
  if tg_op = 'DELETE' then
    if v_status = 'active' then
      raise exception using errcode = '23514', message = 'JJ_MEMBERSHIP_HISTORY_REQUIRED';
    end if;
    return old;
  end if;
  new.updated_at := clock_timestamp(); return new;
end;
$$;
create trigger jj_memberships_lock before insert or update or delete on jj_private.memberships
  for each row execute function jj_private.lock_membership_household();

create function jj_private.check_household_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_household uuid; v_status text; v_count integer;
begin
  if tg_table_name = 'jj_households' then
    if tg_op = 'DELETE' then v_household := old.id; else v_household := new.id; end if;
  else
    if tg_op = 'DELETE' then v_household := old.household_id; else v_household := new.household_id; end if;
  end if;
  select status into v_status from public.jj_households where id = v_household;
  if v_status = 'active' then
    select count(*) into v_count from jj_private.memberships
      where household_id = v_household and role = 'owner' and status = 'active';
    if v_count <> 1 then raise exception using errcode = '23514', message = 'JJ_EXACTLY_ONE_OWNER'; end if;
  end if;
  return null;
end;
$$;
create constraint trigger jj_households_owner_check after insert or update on public.jj_households
  deferrable initially deferred for each row execute function jj_private.check_household_owner();
create constraint trigger jj_memberships_owner_check after insert or update or delete on jj_private.memberships
  deferrable initially deferred for each row execute function jj_private.check_household_owner();

-- Managed Auth tables already have RLS. This tiny private lookup intentionally
-- retains postgres ownership; granting a new role SELECT alone cannot read them.
-- It returns only a boolean and cannot select another actor supplied by a caller.
create function jj_private.has_live_session() returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid; v_session uuid; v_claims jsonb; v_session_text text; v_exp text;
begin
  v_actor := auth.uid(); v_claims := auth.jwt();
  v_session_text := v_claims ->> 'session_id'; v_exp := v_claims ->> 'exp';
  if v_actor is null or v_claims ->> 'role' is distinct from 'authenticated'
     or v_session_text is null or v_session_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or v_exp is null or v_exp !~ '^[0-9]{1,12}$' then return false; end if;
  if v_exp::numeric <= extract(epoch from clock_timestamp()) then return false; end if;
  v_session := v_session_text::uuid;
  return exists (
    select 1 from auth.sessions s
    join auth.users u on u.id = s.user_id
    join jj_private.account_controls a on a.user_id = u.id
    where s.id = v_session and s.user_id = v_actor
      and (s.not_after is null or s.not_after > clock_timestamp())
      and u.deleted_at is null and not u.is_anonymous and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= clock_timestamp())
      and a.state = 'active'
      and not exists (select 1 from jj_private.session_revocations r where r.session_id = s.id)
  );
exception when invalid_text_representation then return false;
end;
$$;

-- The outer policy reader is NOLOGIN/NOBYPASSRLS, with column-level SELECT and
-- explicit read-only policies. It cannot read invitation hashes or receipts.
grant select (id, status) on public.jj_households to jj_policy_reader;
grant select (household_id, user_id, status) on jj_private.memberships to jj_policy_reader;
grant create on schema jj_private to jj_policy_reader;
create function jj_private.can_read_household(p_household_id uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
  select jj_private.has_live_session() and exists (
    select 1 from public.jj_households h
    join jj_private.memberships m on m.household_id = h.id
    where h.id = p_household_id and h.status = 'active'
      and m.user_id = auth.uid() and m.status = 'active'
  );
$$;
alter function jj_private.can_read_household(uuid) owner to jj_policy_reader;
revoke create on schema jj_private from jj_policy_reader;

-- Remove Supabase default table/function grants explicitly. Private policies
-- exist only for the non-login reader; all other metadata is default-denied.
do $$ declare t text; begin
  foreach t in array array['account_controls','session_revocations','household_namespaces','resource_ids','memberships','invitations','membership_requests','ownership_transfers','operation_receipts','migration_batches','account_deletion_jobs'] loop
    execute format('alter table jj_private.%I enable row level security', t);
    execute format('alter table jj_private.%I force row level security', t);
    execute format('revoke all on table jj_private.%I from public, anon, authenticated, service_role', t);
  end loop;
end; $$;
alter table public.jj_households enable row level security;
alter table public.jj_households force row level security;
alter table public.jj_shopping_lists enable row level security;
alter table public.jj_shopping_lists force row level security;
alter table public.jj_shopping_items enable row level security;
alter table public.jj_shopping_items force row level security;
revoke all on public.jj_households, public.jj_shopping_lists, public.jj_shopping_items from public, anon, authenticated, service_role;
grant select on public.jj_households, public.jj_shopping_lists, public.jj_shopping_items to authenticated;

create policy jj_policy_reader_households on public.jj_households for select to jj_policy_reader using (true);
create policy jj_policy_reader_memberships on jj_private.memberships for select to jj_policy_reader using (true);
create policy jj_households_select on public.jj_households for select to authenticated
  using (jj_private.can_read_household(id));
create policy jj_lists_select on public.jj_shopping_lists for select to authenticated
  using (deleted_at is null and jj_private.can_read_household(household_id));
create policy jj_items_select on public.jj_shopping_items for select to authenticated
  using (deleted_at is null and jj_private.can_read_household(household_id)
    and exists (select 1 from public.jj_shopping_lists l
      where l.household_id = jj_shopping_items.household_id and l.id = jj_shopping_items.list_id and l.deleted_at is null));

revoke execute on all functions in schema jj_private from public, anon, authenticated, service_role;
grant execute on function jj_private.has_live_session() to jj_policy_reader;
-- USAGE does not expose this schema to PostgREST. No table privileges accompany it.
grant usage on schema jj_private to authenticated;
grant execute on function jj_private.can_read_household(uuid) to authenticated;

comment on schema jj_private is 'JJ B07 private metadata; keep outside exposed Data API schemas.';
comment on function jj_private.has_live_session() is 'Read gate only; no bootstrap, refresh, logout RPC or authentication UI implemented in B07.2.';
comment on table jj_private.resource_ids is 'Permanent namespace attachment ledger. Never purge with receipts; no client writes.';
