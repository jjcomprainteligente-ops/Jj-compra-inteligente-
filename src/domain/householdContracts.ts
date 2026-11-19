import type { Category, ShoppingList, Unit } from './shopping';

/** B07.1 contracts only: no network, credentials, persistence or server authorization. */
export const HOUSEHOLD_CONTRACT_VERSION = 1 as const;
export const HOUSEHOLD_LIMITS = Object.freeze({
  requestBytes: 256 * 1024, householdName: 80, listName: 80, itemName: 120,
  quantityMilli: 1_000_000_000, importLists: 20, importItems: 1000, exportPage: 100,
  revision: '9223372036854775807',
});
export const HOUSEHOLD_CATEGORIES = ['produce', 'pantry', 'dairy-eggs', 'meat-fish', 'bakery', 'household', 'other'] as const;
export type HouseholdCategory = typeof HOUSEHOLD_CATEGORIES[number];
export type HouseholdUUID = string & { readonly householdUUID: unique symbol };
export type HouseholdRevision = string & { readonly householdRevision: unique symbol };
export type HouseholdContractErrorCode = 'invalid-shape' | 'unknown-field' | 'missing-field' | 'invalid-version'
  | 'invalid-operation' | 'invalid-scope' | 'invalid-uuid' | 'invalid-revision' | 'invalid-text'
  | 'invalid-value' | 'too-large' | 'duplicate-id' | 'invalid-json';

/** Codes/paths contain no supplied values, token, product name or provider error. */
export class HouseholdContractError extends Error {
  constructor(readonly code: HouseholdContractErrorCode, readonly path: string) {
    super(`${code}:${path}`);
    this.name = 'HouseholdContractError';
  }
}

export type AccountScope = Readonly<{ type: 'account' }>;
export type InvitationScope = Readonly<{ type: 'invitation' }>;
export type HouseholdScope = Readonly<{
  type: 'household'; householdId: HouseholdUUID; membershipEpoch: HouseholdRevision;
}>;
export type ReceiptScope = AccountScope | HouseholdScope;
export interface SharedItemFields {
  readonly name: string;
  readonly quantityMilli: number;
  readonly unit: Unit;
  readonly categoryCode: HouseholdCategory;
  readonly checked: boolean;
}
export interface SharedImportItem extends SharedItemFields { readonly id: HouseholdUUID }
export interface SharedImportList {
  readonly id: HouseholdUUID;
  readonly name: string;
  readonly items: readonly SharedImportItem[];
}
export interface ReviewedSharedList {
  readonly name: string;
  readonly items: readonly SharedItemFields[];
}
export type SharedItemMutation =
  | Readonly<{ action: 'create'; listId: HouseholdUUID; item: SharedImportItem }>
  | Readonly<{ action: 'update'; listId: HouseholdUUID; itemId: HouseholdUUID; expectedRevision: HouseholdRevision; item: SharedItemFields }>
  | Readonly<{ action: 'delete'; listId: HouseholdUUID; itemId: HouseholdUUID; expectedRevision: HouseholdRevision }>;

type MemberTarget = Readonly<{ memberUserId: HouseholdUUID; expectedMembershipEpoch: HouseholdRevision }>;
export interface HouseholdPayloads {
  create_household: Readonly<{ name: string }>;
  create_invitation: Readonly<Record<string, never>>;
  revoke_invitation: Readonly<{ invitationId: HouseholdUUID }>;
  redeem_invitation: Readonly<{ token: string }>;
  approve_membership: MemberTarget;
  reject_membership: MemberTarget;
  revoke_membership: MemberTarget;
  begin_ownership_transfer: Readonly<{ recipientUserId: HouseholdUUID; expectedRevision: HouseholdRevision }>;
  accept_ownership_transfer: Readonly<{ transferId: HouseholdUUID; expectedRevision: HouseholdRevision }>;
  create_list: Readonly<{ listId: HouseholdUUID; name: string }>;
  rename_list: Readonly<{ listId: HouseholdUUID; expectedRevision: HouseholdRevision; name: string }>;
  mutate_item: SharedItemMutation;
  delete_list: Readonly<{ listId: HouseholdUUID; expectedRevision: HouseholdRevision }>;
  import_reviewed_local_lists: Readonly<{ reviewId: HouseholdUUID; lists: readonly SharedImportList[] }>;
  read_operation_receipt: Readonly<{ operationId: HouseholdUUID }>;
  export_readable_shared_data: Readonly<{ afterListId: HouseholdUUID | null; limit: number }>;
  leave_household: Readonly<Record<string, never>>;
  revoke_app_session: Readonly<Record<string, never>>;
  delete_own_account: Readonly<{ confirmation: 'delete-account' }>;
  delete_household: Readonly<{ expectedRevision: HouseholdRevision; confirmation: 'delete-household' }>;
}
export type HouseholdOperationName = keyof HouseholdPayloads;
type ReadOperation = 'read_operation_receipt' | 'export_readable_shared_data';
type AccountOperation = 'create_household' | 'revoke_app_session' | 'delete_own_account';
type OperationScope<K extends HouseholdOperationName> = K extends AccountOperation ? AccountScope
  : K extends 'redeem_invitation' ? InvitationScope : K extends 'read_operation_receipt' ? ReceiptScope : HouseholdScope;
export type HouseholdOperationFor<K extends HouseholdOperationName> = Readonly<{
  version: typeof HOUSEHOLD_CONTRACT_VERSION;
  operation: K;
  scope: OperationScope<K>;
  payload: HouseholdPayloads[K];
}> & (K extends ReadOperation ? object : Readonly<{ idempotencyKey: HouseholdUUID }>);
export type HouseholdOperation = { [K in HouseholdOperationName]: HouseholdOperationFor<K> }[HouseholdOperationName];

function fail(code: HouseholdContractErrorCode, path: string): never { throw new HouseholdContractError(code, path); }
function record(input: unknown, fields: readonly string[], path: string, required = fields): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) fail('invalid-shape', path);
  const descriptors = Object.getOwnPropertyDescriptors(input);
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string' || !fields.includes(key)) fail('unknown-field', path);
    if (!('value' in descriptors[key]) || !descriptors[key].enumerable) fail('invalid-shape', path);
  }
  for (const key of required) if (!Object.hasOwn(descriptors, key)) fail('missing-field', `${path}.${key}`);
  return input as Record<string, unknown>;
}
/** Read only permitted local data properties; private properties are deliberately not inspected. */
function projectedRecord(input: unknown, fields: readonly string[], path: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) fail('invalid-shape', path);
  const projected: Record<string, unknown> = {};
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(input, field);
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) fail('invalid-shape', path);
    projected[field] = descriptor.value;
  }
  return projected;
}
function array(input: unknown, maximum: number, path: string): unknown[] {
  if (!Array.isArray(input)) fail('invalid-shape', path);
  if (input.length > maximum) fail('too-large', path);
  const keys = Reflect.ownKeys(input);
  if (keys.length !== input.length + 1) fail('invalid-shape', path);
  const values: unknown[] = [];
  for (let index = 0; index < input.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) fail('invalid-shape', path);
    values.push(descriptor.value);
  }
  return values;
}
function literal<T extends string | number>(input: unknown, expected: T, path: string): T {
  if (input !== expected) fail('invalid-value', path);
  return expected;
}
function enumeration<const T extends readonly string[]>(input: unknown, values: T, path: string): T[number] {
  if (typeof input !== 'string' || !values.includes(input)) fail('invalid-value', path);
  return input;
}
function integer(input: unknown, minimum: number, maximum: number, path: string): number {
  if (typeof input !== 'number' || !Number.isSafeInteger(input) || input < minimum || input > maximum) fail('invalid-value', path);
  return input;
}
/** Native-compatible UTF-8 count. Malformed UTF-16 is never silently replaced. */
function bytes(text: string, path: string): number {
  let result = 0;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code < 0x80) result++;
    else if (code < 0x800) result += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail('invalid-text', path);
      result += 4;
    } else if (code >= 0xdc00 && code <= 0xdfff) fail('invalid-text', path);
    else result += 3;
  }
  return result;
}
function text(input: unknown, maximum: number, path: string): string {
  if (typeof input !== 'string' || input.length > maximum || !input.trim().length) fail('invalid-text', path);
  bytes(input, path);
  // Reject rather than rewrite: the review and sent payload must describe the same text.
  if (/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/.test(input)) fail('invalid-text', path);
  return input;
}
export function parseHouseholdUUID(input: unknown, path = 'id'): HouseholdUUID {
  // Canonical UUID layout; reserve all-zero and all-one sentinel values. IDs alone never grant access.
  if (typeof input !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(input)
    || /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(input) || /^f{8}-f{4}-f{4}-f{4}-f{12}$/i.test(input)) fail('invalid-uuid', path);
  return input.toLowerCase() as HouseholdUUID;
}
export function parseHouseholdRevision(input: unknown, path = 'revision'): HouseholdRevision {
  if (typeof input !== 'string' || !/^[1-9]\d{0,18}$/.test(input) || BigInt(input) > BigInt(HOUSEHOLD_LIMITS.revision)) fail('invalid-revision', path);
  return input as HouseholdRevision;
}
function householdScope(input: unknown): HouseholdScope {
  const value = record(input, ['type', 'householdId', 'membershipEpoch'], 'scope');
  if (value.type !== 'household') fail('invalid-scope', 'scope');
  return { type: 'household', householdId: parseHouseholdUUID(value.householdId, 'scope.householdId'), membershipEpoch: parseHouseholdRevision(value.membershipEpoch, 'scope.membershipEpoch') };
}
function scope(input: unknown, operation: HouseholdOperationName): AccountScope | InvitationScope | HouseholdScope {
  if (operation === 'create_household' || operation === 'revoke_app_session' || operation === 'delete_own_account') {
    const value = record(input, ['type'], 'scope');
    if (value.type !== 'account') fail('invalid-scope', 'scope');
    return { type: 'account' };
  }
  if (operation === 'redeem_invitation') {
    const value = record(input, ['type'], 'scope');
    if (value.type !== 'invitation') fail('invalid-scope', 'scope');
    return { type: 'invitation' };
  }
  if (operation === 'read_operation_receipt' && input && typeof input === 'object'
    && Object.getOwnPropertyDescriptor(input, 'type')?.value === 'account') {
    record(input, ['type'], 'scope');
    return { type: 'account' };
  }
  return householdScope(input);
}
function sharedFields(input: unknown, path: string, withId = false): SharedItemFields | SharedImportItem {
  const value = record(input, [...(withId ? ['id'] : []), 'name', 'quantityMilli', 'unit', 'categoryCode', 'checked'], path);
  const unit = enumeration(value.unit, ['ud', 'g', 'kg', 'ml', 'L'] as const, `${path}.unit`);
  const quantityMilli = integer(value.quantityMilli, 1, HOUSEHOLD_LIMITS.quantityMilli, `${path}.quantityMilli`);
  if (unit === 'ud' && quantityMilli % 1000 !== 0) fail('invalid-value', `${path}.quantityMilli`);
  if (typeof value.checked !== 'boolean') fail('invalid-value', `${path}.checked`);
  return {
    ...(withId ? { id: parseHouseholdUUID(value.id, `${path}.id`) } : {}),
    name: text(value.name, HOUSEHOLD_LIMITS.itemName, `${path}.name`), quantityMilli, unit,
    categoryCode: enumeration(value.categoryCode, HOUSEHOLD_CATEGORIES, `${path}.categoryCode`), checked: value.checked,
  };
}
function memberTarget(input: unknown): MemberTarget {
  const value = record(input, ['memberUserId', 'expectedMembershipEpoch'], 'payload');
  return { memberUserId: parseHouseholdUUID(value.memberUserId, 'payload.memberUserId'), expectedMembershipEpoch: parseHouseholdRevision(value.expectedMembershipEpoch, 'payload.expectedMembershipEpoch') };
}
function listRevision(input: unknown): HouseholdPayloads['delete_list'] {
  const value = record(input, ['listId', 'expectedRevision'], 'payload');
  return { listId: parseHouseholdUUID(value.listId, 'payload.listId'), expectedRevision: parseHouseholdRevision(value.expectedRevision, 'payload.expectedRevision') };
}
function empty(input: unknown): Readonly<Record<string, never>> { record(input, [], 'payload'); return {}; }
function parseImportedLists(input: unknown): readonly SharedImportList[] {
  const values = array(input, HOUSEHOLD_LIMITS.importLists, 'payload.lists');
  if (!values.length) fail('invalid-value', 'payload.lists');
  const used = new Set<string>();
  let itemCount = 0;
  const register = (value: unknown, path: string) => {
    const id = parseHouseholdUUID(value, path);
    if (used.has(id)) fail('duplicate-id', path);
    used.add(id);
    return id;
  };
  return values.map((entry, listIndex) => {
    const path = `payload.lists.${listIndex}`;
    const value = record(entry, ['id', 'name', 'items'], path);
    const id = register(value.id, `${path}.id`);
    const items = array(value.items, HOUSEHOLD_LIMITS.importItems, `${path}.items`);
    itemCount += items.length;
    if (itemCount > HOUSEHOLD_LIMITS.importItems) fail('too-large', 'payload.lists');
    return { id, name: text(value.name, HOUSEHOLD_LIMITS.listName, `${path}.name`), items: items.map((item, itemIndex) => {
      const itemPath = `${path}.items.${itemIndex}`;
      const parsed = sharedFields(item, itemPath, true) as SharedImportItem;
      register(parsed.id, `${itemPath}.id`);
      return parsed;
    }) };
  });
}
const payloadParsers: { [K in HouseholdOperationName]: (input: unknown) => HouseholdPayloads[K] } = {
  create_household(input) { const value = record(input, ['name'], 'payload'); return { name: text(value.name, HOUSEHOLD_LIMITS.householdName, 'payload.name') }; },
  create_invitation: empty,
  revoke_invitation(input) { const value = record(input, ['invitationId'], 'payload'); return { invitationId: parseHouseholdUUID(value.invitationId, 'payload.invitationId') }; },
  redeem_invitation(input) {
    const value = record(input, ['token'], 'payload');
    if (typeof value.token !== 'string' || !/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value.token)) fail('invalid-value', 'payload.token');
    return { token: value.token };
  },
  approve_membership: memberTarget, reject_membership: memberTarget, revoke_membership: memberTarget,
  begin_ownership_transfer(input) {
    const value = record(input, ['recipientUserId', 'expectedRevision'], 'payload');
    return { recipientUserId: parseHouseholdUUID(value.recipientUserId, 'payload.recipientUserId'), expectedRevision: parseHouseholdRevision(value.expectedRevision, 'payload.expectedRevision') };
  },
  accept_ownership_transfer(input) {
    const value = record(input, ['transferId', 'expectedRevision'], 'payload');
    return { transferId: parseHouseholdUUID(value.transferId, 'payload.transferId'), expectedRevision: parseHouseholdRevision(value.expectedRevision, 'payload.expectedRevision') };
  },
  create_list(input) {
    const value = record(input, ['listId', 'name'], 'payload');
    return { listId: parseHouseholdUUID(value.listId, 'payload.listId'), name: text(value.name, HOUSEHOLD_LIMITS.listName, 'payload.name') };
  },
  rename_list(input) {
    const value = record(input, ['listId', 'expectedRevision', 'name'], 'payload');
    return { listId: parseHouseholdUUID(value.listId, 'payload.listId'), expectedRevision: parseHouseholdRevision(value.expectedRevision, 'payload.expectedRevision'), name: text(value.name, HOUSEHOLD_LIMITS.listName, 'payload.name') };
  },
  mutate_item(input) {
    const header = record(input, ['action', 'listId', 'itemId', 'expectedRevision', 'item'], 'payload', ['action', 'listId']);
    const action = enumeration(header.action, ['create', 'update', 'delete'] as const, 'payload.action');
    const value = record(input, action === 'create' ? ['action', 'listId', 'item'] : action === 'update'
      ? ['action', 'listId', 'itemId', 'expectedRevision', 'item'] : ['action', 'listId', 'itemId', 'expectedRevision'], 'payload');
    const listId = parseHouseholdUUID(value.listId, 'payload.listId');
    if (action === 'create') return { action, listId, item: sharedFields(value.item, 'payload.item', true) as SharedImportItem };
    const itemId = parseHouseholdUUID(value.itemId, 'payload.itemId');
    const expectedRevision = parseHouseholdRevision(value.expectedRevision, 'payload.expectedRevision');
    return action === 'update' ? { action, listId, itemId, expectedRevision, item: sharedFields(value.item, 'payload.item') } : { action, listId, itemId, expectedRevision };
  },
  delete_list: listRevision,
  import_reviewed_local_lists(input) {
    const value = record(input, ['reviewId', 'lists'], 'payload');
    return { reviewId: parseHouseholdUUID(value.reviewId, 'payload.reviewId'), lists: parseImportedLists(value.lists) };
  },
  read_operation_receipt(input) { const value = record(input, ['operationId'], 'payload'); return { operationId: parseHouseholdUUID(value.operationId, 'payload.operationId') }; },
  export_readable_shared_data(input) {
    const value = record(input, ['afterListId', 'limit'], 'payload');
    return { afterListId: value.afterListId === null ? null : parseHouseholdUUID(value.afterListId, 'payload.afterListId'), limit: integer(value.limit, 1, HOUSEHOLD_LIMITS.exportPage, 'payload.limit') };
  },
  leave_household: empty, revoke_app_session: empty,
  delete_own_account(input) { const value = record(input, ['confirmation'], 'payload'); return { confirmation: literal(value.confirmation, 'delete-account', 'payload.confirmation') }; },
  delete_household(input) {
    const value = record(input, ['expectedRevision', 'confirmation'], 'payload');
    return { expectedRevision: parseHouseholdRevision(value.expectedRevision, 'payload.expectedRevision'), confirmation: literal(value.confirmation, 'delete-household', 'payload.confirmation') };
  },
};
export const HOUSEHOLD_OPERATIONS = Object.freeze(Object.keys(payloadParsers) as HouseholdOperationName[]);

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) freeze(entry);
    Object.freeze(value);
  }
  return value;
}
function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Validate before authorization; validation never establishes session, role, membership or revision freshness. */
export function parseHouseholdOperation(input: unknown): HouseholdOperation {
  const value = record(input, ['version', 'operation', 'idempotencyKey', 'scope', 'payload'], 'request', ['version', 'operation', 'scope', 'payload']);
  if (value.version !== HOUSEHOLD_CONTRACT_VERSION) fail('invalid-version', 'version');
  if (typeof value.operation !== 'string' || !Object.hasOwn(payloadParsers, value.operation)) fail('invalid-operation', 'operation');
  const operation = value.operation as HouseholdOperationName;
  const read = operation === 'read_operation_receipt' || operation === 'export_readable_shared_data';
  if (read && Object.hasOwn(value, 'idempotencyKey')) fail('unknown-field', 'request');
  if (!read && !Object.hasOwn(value, 'idempotencyKey')) fail('missing-field', 'idempotencyKey');
  const parsed = {
    version: HOUSEHOLD_CONTRACT_VERSION, operation,
    ...(!read ? { idempotencyKey: parseHouseholdUUID(value.idempotencyKey, 'idempotencyKey') } : {}),
    scope: scope(value.scope, operation), payload: payloadParsers[operation](value.payload),
  } as HouseholdOperation;
  if (bytes(canonicalJSON(parsed), 'request') > HOUSEHOLD_LIMITS.requestBytes) fail('too-large', 'request');
  return freeze(parsed);
}

/** Check the raw body limit before JSON.parse, not only after projecting accepted fields. */
export function parseHouseholdOperationJSON(raw: string): HouseholdOperation {
  if (typeof raw !== 'string') fail('invalid-json', 'request');
  if (raw.length > HOUSEHOLD_LIMITS.requestBytes || bytes(raw, 'request') > HOUSEHOLD_LIMITS.requestBytes) fail('too-large', 'request');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { fail('invalid-json', 'request'); }
  return parseHouseholdOperation(value);
}

/**
 * Canonical UTF-8 hashing input, NOT a hash, receipt, signature or deduplication engine.
 * Bind the verified actor separately on the server. Hash this in memory; never log/persist the
 * string (redeem_invitation includes the reviewed one-time secret). Store only its digest.
 */
export function householdOperationHashInput(input: unknown): string {
  const parsed = parseHouseholdOperation(input);
  const { version, operation, scope: operationScope, payload } = parsed;
  return canonicalJSON({ version, operation, scope: operationScope, payload });
}

// The current local model stores these exact canonical Spanish category values. It does not store translated labels.
const LOCAL_CATEGORY_CODES: Readonly<Record<Category, HouseholdCategory>> = Object.freeze({
  'Fruta y verdura': 'produce', Despensa: 'pantry', 'Lácteos y huevos': 'dairy-eggs',
  'Carne y pescado': 'meat-fish', Panadería: 'bakery', Hogar: 'household', Otros: 'other',
});

/** Detached, frozen review projection. Never reads IDs, notes, prices, budget or unknown fields. */
export function projectReviewedSharedLists(lists: readonly ShoppingList[]): readonly ReviewedSharedList[] {
  const source = array(lists, HOUSEHOLD_LIMITS.importLists, 'lists');
  if (!source.length) fail('invalid-value', 'lists');
  let itemCount = 0;
  const projected = source.map((entry, index) => {
    const value = projectedRecord(entry, ['name', 'items'], `lists.${index}`);
    const items = array(value.items, HOUSEHOLD_LIMITS.importItems, `lists.${index}.items`);
    itemCount += items.length;
    if (itemCount > HOUSEHOLD_LIMITS.importItems) fail('too-large', 'lists');
    return { name: text(value.name, HOUSEHOLD_LIMITS.listName, `lists.${index}.name`), items: items.map((input, itemIndex) => {
      const item = projectedRecord(input, ['name', 'quantityMilli', 'unit', 'category', 'checked'], `lists.${index}.items.${itemIndex}`);
      if (typeof item.category !== 'string' || !Object.hasOwn(LOCAL_CATEGORY_CODES, item.category)) fail('invalid-value', `lists.${index}.items.${itemIndex}.category`);
      return sharedFields({ name: item.name, quantityMilli: item.quantityMilli, unit: item.unit,
        categoryCode: LOCAL_CATEGORY_CODES[item.category as Category], checked: item.checked }, `lists.${index}.items.${itemIndex}`) as SharedItemFields;
    }) };
  });
  if (bytes(canonicalJSON(projected), 'lists') > HOUSEHOLD_LIMITS.requestBytes) fail('too-large', 'lists');
  return freeze(projected);
}

export interface ReviewedImportIdentifiers {
  readonly listId: HouseholdUUID;
  readonly itemIds: readonly HouseholdUUID[];
}

/**
 * Prepares a detached request using caller-supplied, previously generated IDs only.
 * The caller MUST durably save and verify this request BEFORE the first network send;
 * this pure helper neither saves that preparation nor protects against a caller generating new IDs on retry.
 */
export function prepareReviewedHouseholdImport(input: {
  readonly scope: HouseholdScope;
  readonly idempotencyKey: HouseholdUUID;
  readonly reviewId: HouseholdUUID;
  readonly lists: readonly ReviewedSharedList[];
  readonly identifiers: readonly ReviewedImportIdentifiers[];
}): HouseholdOperationFor<'import_reviewed_local_lists'> {
  const preparation = record(input, ['scope', 'idempotencyKey', 'reviewId', 'lists', 'identifiers'], 'preparation');
  const lists = array(preparation.lists, HOUSEHOLD_LIMITS.importLists, 'lists');
  const identifiers = array(preparation.identifiers, HOUSEHOLD_LIMITS.importLists, 'identifiers');
  if (lists.length !== identifiers.length) fail('invalid-shape', 'identifiers');
  const payloadLists = lists.map((list, index) => {
    const value = record(list, ['name', 'items'], `lists.${index}`);
    const identifiersForList = record(identifiers[index], ['listId', 'itemIds'], `identifiers.${index}`);
    const items = array(value.items, HOUSEHOLD_LIMITS.importItems, `lists.${index}.items`);
    const itemIds = array(identifiersForList.itemIds, HOUSEHOLD_LIMITS.importItems, `identifiers.${index}.itemIds`);
    if (items.length !== itemIds.length) fail('invalid-shape', `identifiers.${index}.itemIds`);
    return { id: identifiersForList.listId, name: value.name, items: items.map((item, itemIndex) => ({
      ...sharedFields(item, `lists.${index}.items.${itemIndex}`), id: itemIds[itemIndex],
    })) };
  });
  return parseHouseholdOperation({ version: HOUSEHOLD_CONTRACT_VERSION, operation: 'import_reviewed_local_lists',
    idempotencyKey: preparation.idempotencyKey, scope: preparation.scope, payload: { reviewId: preparation.reviewId, lists: payloadLists },
  }) as HouseholdOperationFor<'import_reviewed_local_lists'>;
}
