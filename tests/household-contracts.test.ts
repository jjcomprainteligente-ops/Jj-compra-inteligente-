import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  HOUSEHOLD_CATEGORIES, HOUSEHOLD_LIMITS, HOUSEHOLD_OPERATIONS, HouseholdContractError,
  householdOperationHashInput, parseHouseholdOperation, parseHouseholdOperationJSON,
  parseHouseholdRevision, parseHouseholdUUID, prepareReviewedHouseholdImport, projectReviewedSharedLists,
  type HouseholdOperationName, type HouseholdScope, type ReviewedSharedList,
} from '../src/domain/householdContracts';
import { CATEGORIES, UNITS, type ShoppingList } from '../src/domain/shopping';

const id = (value: number) => parseHouseholdUUID(`1a2b3c4d-0000-4000-8000-${value.toString(16).padStart(12, '0')}`);
const householdScope: HouseholdScope = { type: 'household', householdId: id(1), membershipEpoch: parseHouseholdRevision('1') };
const sharedItem = () => ({ name: 'Café crème / Größe / ñ 😀', quantityMilli: 1250, unit: 'kg', categoryCode: 'pantry', checked: false });
const localList = (): ShoppingList => ({
  id: 'PRIVATE_LIST_ID', name: 'Compra de été', budgetCents: 89123456,
  items: [{ id: 'PRIVATE_ITEM_ID', ...sharedItem(), unit: 'kg', category: 'Despensa',
    note: 'PRIVATE_NOTE', unitPriceCents: 1971, priceKind: 'entered' }],
});
const payloads: Record<HouseholdOperationName, unknown> = {
  create_household: { name: 'Mi hogar' }, create_invitation: {}, revoke_invitation: { invitationId: id(3) },
  redeem_invitation: { token: 'A'.repeat(43) },
  approve_membership: { memberUserId: id(4), expectedMembershipEpoch: '2' },
  reject_membership: { memberUserId: id(4), expectedMembershipEpoch: '2' },
  revoke_membership: { memberUserId: id(4), expectedMembershipEpoch: '2' },
  begin_ownership_transfer: { recipientUserId: id(4), expectedRevision: '3' },
  accept_ownership_transfer: { transferId: id(5), expectedRevision: '3' },
  create_list: { listId: id(6), name: 'Mi lista' }, rename_list: { listId: id(6), name: 'Revisada', expectedRevision: '4' },
  mutate_item: { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem() } },
  delete_list: { listId: id(6), expectedRevision: '5' },
  import_reviewed_local_lists: { reviewId: id(8), lists: [{ id: id(6), name: 'Mi lista', items: [{ id: id(7), ...sharedItem() }] }] },
  read_operation_receipt: { operationId: id(9) },
  export_readable_shared_data: { afterListId: null, limit: 50 }, leave_household: {}, revoke_app_session: {},
  delete_own_account: { confirmation: 'delete-account' }, delete_household: { expectedRevision: '5', confirmation: 'delete-household' },
};
function operation(name: HouseholdOperationName = 'create_list'): Record<string, unknown> {
  return { version: 1, operation: name,
    ...(!['read_operation_receipt', 'export_readable_shared_data'].includes(name) ? { idempotencyKey: id(9) } : {}),
    scope: ['create_household', 'revoke_app_session', 'delete_own_account'].includes(name) ? { type: 'account' }
      : name === 'redeem_invitation' ? { type: 'invitation' } : structuredClone(householdScope),
    payload: structuredClone(payloads[name]),
  };
}
function expectError(action: () => unknown, code: string): void {
  expect(action).toThrowError(expect.objectContaining({ name: 'HouseholdContractError', code }));
}
const digest = (value: unknown) => createHash('sha256').update(householdOperationHashInput(value), 'utf8').digest('hex');

// These are contracts/fixtures, never proof of server authorization or transaction idempotency.
describe('B07 versioned contracts', () => {
  it('covers exactly the 20 proposal operations and uses the current quantity units', () => {
    expect(HOUSEHOLD_OPERATIONS).toHaveLength(20);
    expect(new Set(HOUSEHOLD_OPERATIONS).size).toBe(20);
    expect([...HOUSEHOLD_OPERATIONS].sort()).toEqual(Object.keys(payloads).sort());
    for (const unit of UNITS) {
      const input = operation('mutate_item');
      input.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), unit, quantityMilli: 1000 } };
      expect(parseHouseholdOperation(input).operation).toBe('mutate_item');
    }
  });

  it.each(HOUSEHOLD_OPERATIONS)('validates a detached, frozen %s envelope', name => {
    const input = operation(name);
    const copy = structuredClone(input);
    const parsed = parseHouseholdOperation(input);
    expect(parsed.operation).toBe(name);
    expect(parsed).toEqual(copy);
    expect(parsed).not.toBe(input);
    expect(parsed.payload).not.toBe(input.payload);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.payload)).toBe(true);
    expect(Object.isFrozen(parsed.scope)).toBe(true);
    expect(input).toEqual(copy);
    expect(parseHouseholdOperationJSON(JSON.stringify(input))).toEqual(parsed);
  });

  it.each([undefined, null, [], 'request', 1, new Date(), Object.create({ version: 1 })])('rejects a non-record envelope', value => {
    expectError(() => parseHouseholdOperation(value), 'invalid-shape');
  });
  it.each([0, 2, '1', null, true])('rejects a different contract version %j', version => {
    expectError(() => parseHouseholdOperation({ ...operation(), version }), 'invalid-version');
  });
  it.each(['unknown', 'toString', '__proto__', 'constructor', '', null])('rejects an unknown operation %j', name => {
    expectError(() => parseHouseholdOperation({ ...operation(), operation: name }), 'invalid-operation');
  });
  it.each(['actorId', 'userId', 'role', 'reauthenticated', 'service_role', 'accessToken'])('does not accept authority or credentials in %s', field => {
    const input = operation(); input[field] = 'PRIVATE_CREDENTIAL';
    expectError(() => parseHouseholdOperation(input), 'unknown-field');
    expectError(() => parseHouseholdOperation({ ...operation(), payload: { ...(payloads.create_list as object), [field]: id(11) } }), 'unknown-field');
  });
  it('rejects undefined, inherited, accessor, symbol, non-enumerable and polluted fields without evaluating them', () => {
    const accessor = operation(); Object.defineProperty(accessor, 'payload', { get() { throw new Error('Getter was evaluated'); }, enumerable: true });
    expectError(() => parseHouseholdOperation(accessor), 'invalid-shape');
    const unknownAccessor = operation(); Object.defineProperty(unknownAccessor, 'secret', { get() { throw new Error('Secret getter'); }, enumerable: true });
    expectError(() => parseHouseholdOperation(unknownAccessor), 'unknown-field');
    const symbol = operation(); Object.defineProperty(symbol, Symbol('actorId'), { value: id(11), enumerable: true });
    expectError(() => parseHouseholdOperation(symbol), 'unknown-field');
    const hidden = operation(); Object.defineProperty(hidden, 'version', { value: 1, enumerable: false });
    expectError(() => parseHouseholdOperation(hidden), 'invalid-shape');
    const omitted = operation(); delete omitted.payload;
    expectError(() => parseHouseholdOperation(omitted), 'missing-field');
    expectError(() => parseHouseholdOperation({ ...operation(), payload: undefined }), 'invalid-shape');
    const polluted = JSON.parse('{"version":1,"operation":"create_list","__proto__":{"role":"owner"}}');
    expectError(() => parseHouseholdOperation(polluted), 'unknown-field');
    expect(({} as { role?: string }).role).toBeUndefined();
    const nullPrototype = Object.assign(Object.create(null), operation());
    expect(parseHouseholdOperation(nullPrototype).operation).toBe('create_list');
  });

  it('keeps code/path errors free of supplied secrets and resource content', () => {
    expect.assertions(3);
    const privateName = 'PRIVATE_PRODUCT_NAME';
    try { parseHouseholdOperation({ ...operation(), payload: { name: privateName, token: 'PRIVATE_SECRET' } }); }
    catch (error) {
      expect(error).toBeInstanceOf(HouseholdContractError);
      expect(String(error)).not.toContain(privateName);
      expect(String(error)).not.toContain('PRIVATE_SECRET');
    }
  });
});

describe('operation-specific scopes and revisions', () => {
  it.each(['create_household', 'revoke_app_session', 'delete_own_account'] as const)('%s needs an account session, not preexisting membership', name => {
    const input = operation(name);
    expect(parseHouseholdOperation(input).scope).toEqual({ type: 'account' });
    expectError(() => parseHouseholdOperation({ ...input, scope: householdScope }), 'unknown-field');
    expectError(() => parseHouseholdOperation({ ...input, scope: { type: 'account', userId: id(42) } }), 'unknown-field');
  });
  it('redeems a reviewed token without claiming active household membership', () => {
    expect(parseHouseholdOperation(operation('redeem_invitation')).scope).toEqual({ type: 'invitation' });
    expectError(() => parseHouseholdOperation({ ...operation('redeem_invitation'), scope: householdScope }), 'unknown-field');
    expectError(() => parseHouseholdOperation({ ...operation('redeem_invitation'), payload: { token: 'A'.repeat(43), role: 'owner' } }), 'unknown-field');
  });
  it('permits account-scoped receipt recovery but requires current household scope for list reads', () => {
    const accountReceipt = { ...operation('read_operation_receipt'), scope: { type: 'account' } };
    expect(parseHouseholdOperation(accountReceipt).scope).toEqual({ type: 'account' });
    expect(parseHouseholdOperation(operation('read_operation_receipt')).scope).toEqual(householdScope);
    expectError(() => parseHouseholdOperation({ ...operation('export_readable_shared_data'), scope: { type: 'account' } }), 'missing-field');
    expectError(() => parseHouseholdOperation({ ...operation(), scope: { type: 'household', householdId: id(1) } }), 'missing-field');
  });
  it('does not accept a client reauthentication flag instead of the required destructive confirmation', () => {
    expectError(() => parseHouseholdOperation({ ...operation('delete_own_account'), payload: { reauthenticated: true } }), 'unknown-field');
    expectError(() => parseHouseholdOperation({ ...operation('delete_own_account'), payload: { confirmation: true } }), 'invalid-value');
    expectError(() => parseHouseholdOperation({ ...operation('delete_household'), payload: { expectedRevision: '1', confirmation: 'delete-account' } }), 'invalid-value');
  });
  it('does not accept caller-selected session IDs when revoking the current session', () => {
    expectError(() => parseHouseholdOperation({ ...operation('revoke_app_session'), payload: { sessionId: id(12) } }), 'unknown-field');
  });
  it('requires one stable mutation key; reads do not accept an irrelevant mutation key', () => {
    const missing = operation(); delete missing.idempotencyKey;
    expectError(() => parseHouseholdOperation(missing), 'missing-field');
    expectError(() => parseHouseholdOperation({ ...operation('read_operation_receipt'), idempotencyKey: id(9) }), 'unknown-field');
  });
  it('normalizes UUID case without interpreting its value as authority', () => {
    expect(parseHouseholdUUID(id(13).toUpperCase())).toBe(id(13));
    const input = operation(); input.idempotencyKey = id(14).toUpperCase();
    expect(parseHouseholdOperation(input)).toMatchObject({ idempotencyKey: id(14) });
    expect(parseHouseholdUUID('12345678-1234-1234-1234-123456789abc')).toBe('12345678-1234-1234-1234-123456789abc');
  });
  it.each(['', '1', id(1).replace(/-/g, ''), ` ${id(1)}`, `${id(1)}\n`,
    '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'zzzzzzzz-0000-4000-8000-000000000001', null, 1])('rejects malformed/reserved UUID %j', value => {
    expectError(() => parseHouseholdUUID(value), 'invalid-uuid');
  });
  it.each(['1', '2', '9007199254740993', HOUSEHOLD_LIMITS.revision])('preserves Postgres bigint decimal revision %s without rounding', value => {
    expect(parseHouseholdRevision(value)).toBe(value);
    const input = operation(); input.scope = { ...householdScope, membershipEpoch: value };
    expect(parseHouseholdOperation(input).scope).toMatchObject({ membershipEpoch: value });
  });
  it.each(['0', '-1', '01', '+1', '1.0', '1e1', ' 1', '1\n', '9223372036854775808', '9'.repeat(100), 1, 9007199254740992, null])('rejects ambiguous/out-of-range revision %j', value => {
    expectError(() => parseHouseholdRevision(value), 'invalid-revision');
  });
});

describe('public shared content boundaries', () => {
  it.each(['ud', 'g', 'kg', 'ml', 'L'] as const)('keeps exact quantities for %s', unit => {
    const input = operation('mutate_item');
    input.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), quantityMilli: 1000, unit } };
    expect(parseHouseholdOperation(input).payload).toMatchObject({ item: { quantityMilli: 1000, unit } });
  });
  it.each([0, -1, 0.5, NaN, Infinity, 1_000_000_001, '1000'])('rejects invalid exact quantity %j', quantityMilli => {
    const input = operation('mutate_item');
    input.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), quantityMilli } };
    expectError(() => parseHouseholdOperation(input), 'invalid-value');
  });
  it('permits the quantity bounds but rejects fractional whole units', () => {
    for (const quantityMilli of [1, 1_000_000_000]) {
      const input = operation('mutate_item');
      input.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), quantityMilli } };
      expect(parseHouseholdOperation(input).payload).toMatchObject({ item: { quantityMilli } });
    }
    const invalid = operation('mutate_item');
    invalid.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), unit: 'ud', quantityMilli: 1250 } };
    expectError(() => parseHouseholdOperation(invalid), 'invalid-value');
  });
  it.each([
    { unit: 'box' }, { checked: 'false' }, { checked: 0 }, { categoryCode: 'Despensa' }, { categoryCode: 'Dairy' },
    { note: 'PRIVATE_NOTE' }, { unitPriceCents: 123 }, { budget: 100 }, { owner: true },
  ])('rejects unrecognized or private item fields %j', changes => {
    const input = operation('mutate_item');
    input.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), ...changes } };
    expect(() => parseHouseholdOperation(input)).toThrow(HouseholdContractError);
  });
  it('treats create/update/delete item as distinct payloads with per-item expected revisions', () => {
    const input = operation('mutate_item');
    input.payload = { action: 'update', listId: id(6), itemId: id(7), expectedRevision: '2', item: sharedItem() };
    expect(parseHouseholdOperation(input).payload).toMatchObject({ action: 'update', expectedRevision: '2' });
    input.payload = { action: 'delete', listId: id(6), itemId: id(7), expectedRevision: '2' };
    expect(parseHouseholdOperation(input).payload).toMatchObject({ action: 'delete', expectedRevision: '2' });
    expectError(() => parseHouseholdOperation({ ...input, payload: { ...(input.payload as object), item: sharedItem() } }), 'unknown-field');
    input.payload = { action: 'update', listId: id(6), itemId: id(7), item: sharedItem() };
    expectError(() => parseHouseholdOperation(input), 'missing-field');
    input.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem() }, expectedRevision: '2' };
    expectError(() => parseHouseholdOperation(input), 'unknown-field');
    input.payload = { action: 'increment', listId: id(6) };
    expectError(() => parseHouseholdOperation(input), 'invalid-value');
  });
  it('preserves Unicode, decomposed accents, literal markup and reviewed spaces exactly', () => {
    const name = '  Café\u0301 — Größe / ñ / 汉字 😀 <b>lait</b>  ';
    const input = operation('create_list'); input.payload = { listId: id(6), name };
    expect(parseHouseholdOperation(input).payload).toMatchObject({ name });
    expect(householdOperationHashInput(input)).toContain(name);
  });
  it.each(['', '   ', '\u0000', 'tomate\n[x] pan', '\ud800', '\udc00', 'a\u202eb', 'a\u061cb', 'a\u2066b', 'a\u007fb'])('rejects unsafe text without silently rewriting it %j', name => {
    const input = operation('create_list'); input.payload = { listId: id(6), name };
    expectError(() => parseHouseholdOperation(input), 'invalid-text');
  });
  it('enforces UTF16 name bounds consistently with current local domain limits', () => {
    const input = operation('create_list'); input.payload = { listId: id(6), name: '😀'.repeat(40) };
    expect(parseHouseholdOperation(input).payload).toMatchObject({ name: '😀'.repeat(40) });
    expectError(() => parseHouseholdOperation({ ...input, payload: { listId: id(6), name: '😀'.repeat(41) } }), 'invalid-text');
    input.payload = { listId: id(6), name: 'a'.repeat(81) };
    expectError(() => parseHouseholdOperation(input), 'invalid-text');
    const itemInput = operation('mutate_item');
    itemInput.payload = { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), name: 'a'.repeat(121) } };
    expectError(() => parseHouseholdOperation(itemInput), 'invalid-text');
  });
  it.each(['A'.repeat(42), 'A'.repeat(44), 'A'.repeat(42) + 'B', 'A'.repeat(42) + '=', `${'A'.repeat(42)}\n`])('accepts only canonical 32-byte base64url invitation secrets', token => {
    expectError(() => parseHouseholdOperation({ ...operation('redeem_invitation'), payload: { token } }), 'invalid-value');
  });
  it('accepts all canonical final symbols in a 32-byte base64url secret', () => {
    for (const final of 'AEIMQUYcgkosw048') {
      expect(parseHouseholdOperation({ ...operation('redeem_invitation'), payload: { token: 'A'.repeat(42) + final } }).operation).toBe('redeem_invitation');
    }
  });
  it.each([0, 101, 1.1, '50', null])('bounds export page size %j', limit => {
    expectError(() => parseHouseholdOperation({ ...operation('export_readable_shared_data'), payload: { afterListId: null, limit } }), 'invalid-value');
  });
});

describe('reviewed allowlist projection and preparation', () => {
  it('projects only reviewed shared fields and freezes a detached snapshot without rewriting local data', () => {
    const list = localList();
    const before = structuredClone(list);
    const reviewed = projectReviewedSharedLists([list]);
    expect(reviewed).toEqual([{ name: 'Compra de été', items: [{ ...sharedItem(), categoryCode: 'pantry' }] }]);
    expect(list).toEqual(before);
    for (const secret of ['PRIVATE_LIST_ID', 'PRIVATE_ITEM_ID', 'PRIVATE_NOTE', '1971', '89123456', 'budgetCents', 'priceKind']) {
      expect(JSON.stringify(reviewed)).not.toContain(secret);
    }
    expect(JSON.stringify(reviewed)).not.toContain('Despensa');
    expect(Object.isFrozen(reviewed)).toBe(true);
    expect(Object.isFrozen(reviewed[0])).toBe(true);
    expect(Object.isFrozen(reviewed[0].items)).toBe(true);
    expect(Object.isFrozen(reviewed[0].items[0])).toBe(true);
    list.name = 'Cambio posterior'; list.items[0].name = 'Cambio posterior';
    expect(reviewed[0].name).toBe('Compra de été');
    expect(reviewed[0].items[0].name).toBe(sharedItem().name);
  });
  it('never even reads IDs, notes, prices, budgets or unknown source fields', () => {
    const list = localList();
    for (const [object, names] of [[list, ['id', 'budgetCents', 'token']],
      [list.items[0], ['id', 'note', 'unitPriceCents', 'priceKind', 'password', 'toJSON']]] as const) {
      for (const name of names) Object.defineProperty(object, name, { get() { throw new Error('Private source field read'); } });
    }
    expect(projectReviewedSharedLists([list])[0].items[0].name).toBe(sharedItem().name);
  });
  it('rejects getters on allowed fields and inherited values without invoking them', () => {
    let calls = 0;
    for (const field of ['name', 'items']) {
      const list = localList();
      Object.defineProperty(list, field, { get() { calls++; throw new Error('Allowed list getter read'); }, enumerable: true });
      expectError(() => projectReviewedSharedLists([list]), 'invalid-shape');
    }
    for (const field of ['name', 'quantityMilli', 'unit', 'category', 'checked']) {
      const list = localList();
      Object.defineProperty(list.items[0], field, { get() { calls++; throw new Error('Allowed item getter read'); }, enumerable: true });
      expectError(() => projectReviewedSharedLists([list]), 'invalid-shape');
    }
    const inherited = Object.assign(Object.create({ name: 'Inherited list' }), { items: [] }) as ShoppingList;
    expectError(() => projectReviewedSharedLists([inherited]), 'invalid-shape');
    expect(calls).toBe(0);
  });
  it('maps every canonical stored category explicitly, independent of translation labels', () => {
    const list = localList();
    list.items = CATEGORIES.map((category, index) => ({ ...list.items[0], id: `local-${index}`, category }));
    expect(projectReviewedSharedLists([list])[0].items.map(item => item.categoryCode)).toEqual(HOUSEHOLD_CATEGORIES);
    list.items[0].category = 'Obst und Gemüse' as typeof CATEGORIES[number];
    expectError(() => projectReviewedSharedLists([list]), 'invalid-value');
  });
  it('rejects an invalid projection rather than silently changing or skipping a stored item', () => {
    const list = localList(); list.items[0].name = 'Cafe\u202e';
    const original = structuredClone(list);
    expectError(() => projectReviewedSharedLists([list]), 'invalid-text');
    expect(list).toEqual(original);
  });
  it('prepares stable remote IDs with no source IDs and no side effects; retrying the same prepared input is identical', () => {
    const list = localList();
    const reviewed = projectReviewedSharedLists([list]);
    const input = { scope: householdScope, idempotencyKey: id(9), reviewId: id(8), lists: reviewed,
      identifiers: [{ listId: id(6), itemIds: [id(7)] }] };
    const request = prepareReviewedHouseholdImport(input);
    expect(request).toEqual(prepareReviewedHouseholdImport(input));
    expect(request).toMatchObject({ operation: 'import_reviewed_local_lists', scope: householdScope, idempotencyKey: id(9),
      payload: { reviewId: id(8), lists: [{ id: id(6), items: [{ id: id(7), name: sharedItem().name }] }] } });
    expect(JSON.stringify(request)).not.toContain('PRIVATE_');
    expect(Object.isFrozen(request.payload.lists[0].items[0])).toBe(true);
    expect(request.payload.lists[0].items[0]).not.toBe(reviewed[0].items[0]);
    list.items[0].name = 'Edited after review';
    expect(prepareReviewedHouseholdImport(input)).toEqual(request);
    expect(digest(request)).toBe(digest(prepareReviewedHouseholdImport(input)));
  });
  it('rejects a missing or extra ID map rather than generating new identities', () => {
    const reviewed = projectReviewedSharedLists([localList()]);
    const input = { scope: householdScope, idempotencyKey: id(9), reviewId: id(8), lists: reviewed, identifiers: [] };
    expectError(() => prepareReviewedHouseholdImport(input), 'invalid-shape');
    expectError(() => prepareReviewedHouseholdImport({ ...input, identifiers: [{ listId: id(6), itemIds: [] }] }), 'invalid-shape');
    expectError(() => prepareReviewedHouseholdImport({ ...input, identifiers: [{ listId: id(6), itemIds: [id(7), id(8)] }] }), 'invalid-shape');
  });
  it('rejects poisoned reviewed input instead of forwarding extra fields into the batch', () => {
    const reviewed = [{ name: 'Mi compra', items: [{ ...sharedItem(), note: 'PRIVATE_NOTE' }] }] as unknown as readonly ReviewedSharedList[];
    expectError(() => prepareReviewedHouseholdImport({ scope: householdScope, idempotencyKey: id(9), reviewId: id(8),
      lists: reviewed, identifiers: [{ listId: id(6), itemIds: [id(7)] }] }), 'unknown-field');
  });
  it('rejects accessors on the import preparation without invoking them', () => {
    let calls = 0;
    const input = { scope: householdScope, idempotencyKey: id(9), reviewId: id(8), lists: projectReviewedSharedLists([localList()]),
      identifiers: [{ listId: id(6), itemIds: [id(7)] }] };
    Object.defineProperty(input, 'lists', { get() { calls++; throw new Error('Preparation getter read'); }, enumerable: true });
    expectError(() => prepareReviewedHouseholdImport(input), 'invalid-shape');
    expect(calls).toBe(0);
  });
  it('rejects duplicate IDs across lists/items after UUID normalization', () => {
    const input = operation('import_reviewed_local_lists');
    const lists = [
      { id: id(6), name: 'A', items: [{ id: id(7), ...sharedItem() }] },
      { id: id(10), name: 'B', items: [{ id: id(7).toUpperCase(), ...sharedItem() }] },
    ];
    input.payload = { reviewId: id(8), lists };
    expectError(() => parseHouseholdOperation(input), 'duplicate-id');
    input.payload = { reviewId: id(8), lists: [{ id: id(6), name: 'A', items: [{ id: id(6), ...sharedItem() }] }] };
    expectError(() => parseHouseholdOperation(input), 'duplicate-id');
  });
  it('allows empty reviewed lists but does not permit an empty batch', () => {
    const list = localList(); list.items = [];
    expect(projectReviewedSharedLists([list])).toEqual([{ name: list.name, items: [] }]);
    expectError(() => projectReviewedSharedLists([]), 'invalid-value');
    expectError(() => parseHouseholdOperation({ ...operation('import_reviewed_local_lists'), payload: { reviewId: id(8), lists: [] } }), 'invalid-value');
  });
  it('bounds list count and total item count before preparing network data', () => {
    expectError(() => projectReviewedSharedLists(Array.from({ length: 21 }, localList)), 'too-large');
    const list = localList(); list.items = Array.from({ length: 1001 }, () => ({ ...list.items[0] }));
    expectError(() => projectReviewedSharedLists([list]), 'too-large');
    const first = localList(); first.items = Array.from({ length: 501 }, () => ({ ...first.items[0] }));
    const second = localList(); second.items = Array.from({ length: 500 }, () => ({ ...second.items[0] }));
    expectError(() => projectReviewedSharedLists([first, second]), 'too-large');
    const manyLists = Array.from({ length: 21 }, (_, index) => ({ id: id(index + 100), name: 'A', items: [] }));
    expectError(() => parseHouseholdOperation({ ...operation('import_reviewed_local_lists'), payload: { reviewId: id(8), lists: manyLists } }), 'too-large');
  });
  it('rejects sparse/accessor arrays and custom array fields instead of invoking supplied code', () => {
    const sparse = new Array(1);
    expectError(() => projectReviewedSharedLists(sparse), 'invalid-shape');
    const accessor = [localList()]; Object.defineProperty(accessor, '0', { get() { throw new Error('Array getter read'); }, enumerable: true });
    expectError(() => projectReviewedSharedLists(accessor), 'invalid-shape');
    const custom = [localList()]; Object.defineProperty(custom, 'toJSON', { value() { throw new Error('toJSON read'); } });
    expectError(() => projectReviewedSharedLists(custom), 'invalid-shape');
  });
});

describe('bounded, canonical request hashing input', () => {
  it('uses canonical key ordering and canonical UUIDs, independent of insertion order or lookup key', () => {
    const first = operation('rename_list');
    const second = { payload: { expectedRevision: '4', name: 'Revisada', listId: id(6).toUpperCase() },
      scope: { membershipEpoch: '1', householdId: id(1).toUpperCase(), type: 'household' },
      idempotencyKey: id(42), operation: 'rename_list', version: 1 };
    expect(householdOperationHashInput(first)).toBe(householdOperationHashInput(second));
    expect(digest(first)).toBe(digest(second));
    expect(householdOperationHashInput(first)).not.toContain('idempotencyKey');
  });
  it('binds operation, contract, household, epoch, expected revision and every allowlisted field', () => {
    const base = operation('rename_list');
    const baseDigest = digest(base);
    for (const modified of [
      { ...base, scope: { ...householdScope, householdId: id(2) } },
      { ...base, scope: { ...householdScope, membershipEpoch: '2' } },
      { ...base, payload: { ...payloads.rename_list as object, expectedRevision: '5' } },
      { ...base, payload: { ...payloads.rename_list as object, name: 'Other' } },
      { ...base, payload: { ...payloads.rename_list as object, listId: id(99) } },
      operation('delete_list'),
    ]) expect(digest(modified)).not.toBe(baseDigest);
    const item = operation('mutate_item'); const itemDigest = digest(item);
    for (const change of [{ name: 'Other' }, { quantityMilli: 2000 }, { unit: 'g' }, { categoryCode: 'other' }, { checked: true }]) {
      expect(digest({ ...item, payload: { action: 'create', listId: id(6), item: { id: id(7), ...sharedItem(), ...change } } })).not.toBe(itemDigest);
    }
  });
  it('uses arrays in reviewed order and exact Unicode instead of sorting products or normalizing names', () => {
    const base = operation('import_reviewed_local_lists');
    const items = [{ id: id(7), ...sharedItem() }, { id: id(12), ...sharedItem(), name: 'Cafe\u0301' }];
    const request = { ...base, payload: { reviewId: id(8), lists: [{ id: id(6), name: 'A', items }] } };
    const reversed = { ...request, payload: { reviewId: id(8), lists: [{ id: id(6), name: 'A', items: [...items].reverse() }] } };
    expect(digest(request)).not.toBe(digest(reversed));
    const normalized = { ...request, payload: { reviewId: id(8), lists: [{ id: id(6), name: 'A', items: [items[0], { ...items[1], name: 'Café' }] }] } };
    expect(digest(request)).not.toBe(digest(normalized));
  });
  it('rejects large UTF8 payloads despite compliant per-name and item count limits', () => {
    const items = Array.from({ length: 800 }, (_, index) => ({ id: id(index + 100), ...sharedItem(), name: '汉'.repeat(120) }));
    const input = { ...operation('import_reviewed_local_lists'), payload: { reviewId: id(8), lists: [{ id: id(6), name: 'A', items }] } };
    expect(items.length).toBeLessThanOrEqual(HOUSEHOLD_LIMITS.importItems);
    expectError(() => parseHouseholdOperation(input), 'too-large');
    expectError(() => parseHouseholdOperationJSON(JSON.stringify(input)), 'too-large');
    const list = localList(); list.items = items.map(item => ({ ...list.items[0], name: item.name }));
    expectError(() => projectReviewedSharedLists([list]), 'too-large');
  });
  it('checks raw body length before JSON.parse including insignificant whitespace', () => {
    const input = JSON.stringify(operation());
    expectError(() => parseHouseholdOperationJSON(' '.repeat(HOUSEHOLD_LIMITS.requestBytes) + input), 'too-large');
    expectError(() => parseHouseholdOperationJSON('{invalid-json'), 'invalid-json');
    expectError(() => parseHouseholdOperationJSON('\ud800'), 'invalid-text');
    expectError(() => parseHouseholdOperationJSON(JSON.stringify({ ...operation(), payload: { name: '\ud800', listId: id(6) } })), 'invalid-text');
  });
});
