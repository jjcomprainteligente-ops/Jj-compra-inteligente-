-- B07.2 hardening after the initial deployed foundation.
-- The base migration is immutable; this adds no public mutation endpoint.

create or replace function jj_private.attach_resource_id() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_household uuid; v_kind text; v_parent uuid;
begin
  if tg_table_name = 'jj_households' then
    v_household := new.id; v_kind := 'household';
    if new.status <> 'active' then
      raise exception using errcode = '23514', message = 'JJ_HOUSEHOLD_STARTS_ACTIVE';
    end if;
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
revoke execute on function jj_private.attach_resource_id() from public, anon, authenticated, service_role;

-- Exact FK coverage requested by the provider performance advisor.
create index jj_requests_invitation_fk_idx
  on jj_private.membership_requests(household_id, invitation_id);
create index jj_migration_batches_receipt_fk_idx
  on jj_private.migration_batches(actor_id, scope_type, household_id, idempotency_key);
