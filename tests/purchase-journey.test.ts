import { describe, expect, it } from 'vitest';
import {
  PurchaseJourneyError, validateJourneyStores, validatePlanningRequest,
  type PurchaseJourneyErrorKey,
} from '../src/domain/purchaseJourney';
import { PILOT_STORE_IDS } from '../src/domain/stores';

type RequestInput = Parameters<typeof validatePlanningRequest>[0];
const valid = (): RequestInput => ({ budget: '50', meals: '5', servings: '2' });

function rejects(run: () => unknown, key: PurchaseJourneyErrorKey) {
  let failure: unknown;
  try { run(); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(PurchaseJourneyError);
  expect(failure).toMatchObject({ key, message: key });
}

describe('a bounded planning request without price or spending claims', () => {
  it.each([
    ['50', 5000], ['50,25', 5025], ['50.25', 5025], ['0,01', 1], ['0.01', 1],
    [' 12,3 ', 1230], ['90071992547409.91', Number.MAX_SAFE_INTEGER],
  ])('parses decimal euros %s with the existing currency contract', (budget, budgetCents) => {
    expect(validatePlanningRequest({ ...valid(), budget })).toEqual({ budgetCents, meals: 5, servings: 2 });
  });

  it.each(Array.from({ length: 14 }, (_, index) => index + 1))('accepts %s meals independently from one through twelve diners', meals => {
    for (let servings = 1; servings <= 12; servings++) {
      expect(validatePlanningRequest({ budget: '50', meals: String(meals), servings: String(servings) })).toEqual({
        budgetCents: 5000, meals, servings,
      });
    }
  });

  it('retains bounded ASCII input compatibility without interpreting calendar days', () => {
    expect(validatePlanningRequest({ budget: '50', meals: '05', servings: ' 4 ' })).toEqual({
      budgetCents: 5000, meals: 5, servings: 4,
    });
    expect(validatePlanningRequest({ budget: '50', meals: ' 14 ', servings: '2' }).meals).toBe(14);
    expect(validatePlanningRequest({ budget: '50', meals: '01', servings: '2' }).meals).toBe(1);
  });

  it.each([
    '', ' ', '0', '0,00', '-1', '+50', '.5', '50,', '1e2', '0x32',
    '1,000.50', '1.000,50', '1 000', '1_000', '50.001', 'Infinity', 'NaN',
    '５０', '90071992547409.92', '1'.repeat(33), ' '.repeat(33) + '50',
  ])('rejects a missing, zero, ambiguous or excessive budget: %j', budget => {
    rejects(() => validatePlanningRequest({ ...valid(), budget }), 'mealJourney.invalidBudget');
  });

  it.each([undefined, null, 50, NaN, Infinity, {}, [], new String('50')].map(budget => ({ budget })))('does not coerce a budget value: $budget', ({ budget }) => {
    rejects(() => validatePlanningRequest({ ...valid(), budget } as RequestInput), 'mealJourney.invalidBudget');
  });

  it.each(['', '0', '00', '-1', '15', '99', '100', '014', '5.0', '5,0', '+5', '5e0', '0x5',
    '５', '１４', '١٤', '1\u200b', '1 4', '1\u0000', '5'.repeat(33), ' '.repeat(33) + '5',
    undefined, null, 5, NaN, Infinity, {}, [], new String('5')])(
    'rejects unsupported meal count %j instead of pretending to generate it', meals => {
      rejects(() => validatePlanningRequest({ ...valid(), meals } as RequestInput), 'mealJourney.invalidMeals');
    },
  );

  it.each(['', '0', '-1', '13', '01', '2.0', '1,5', '1e1', '+2', '１２', '1'.repeat(33), undefined, null, 2])(
    'rejects invalid diner count without numeric coercion: %j', servings => {
      rejects(() => validatePlanningRequest({ ...valid(), servings } as RequestInput), 'mealJourney.invalidPeople');
    },
  );

  it('requires own bounded fields and reports localized error keys for malformed records', () => {
    for (const input of [null, undefined, [], {}, Object.create(valid())]) {
      rejects(() => validatePlanningRequest(input as RequestInput), 'mealJourney.invalidBudget');
    }
    rejects(() => validatePlanningRequest({ budget: '50' } as RequestInput), 'mealJourney.invalidMeals');
    rejects(() => validatePlanningRequest({ budget: '50', meals: '5' } as RequestInput), 'mealJourney.invalidPeople');
    const inheritedMeals = Object.assign(Object.create({ meals: '14' }), { budget: '50', servings: '2' });
    rejects(() => validatePlanningRequest(inheritedMeals as RequestInput), 'mealJourney.invalidMeals');
  });

  it('returns a fresh minimal planning result without mutating input or carrying spending data', () => {
    const input = Object.freeze({ ...valid(), expenseCents: 1000, quotedCostCents: 4500 });
    const before = JSON.stringify(input);
    const first = validatePlanningRequest(input), second = validatePlanningRequest(input);
    expect(first).toEqual({ budgetCents: 5000, meals: 5, servings: 2 });
    expect(first).not.toBe(second);
    first.budgetCents = 7000;
    expect(second.budgetCents).toBe(5000);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('keeps the chosen variable count independent of later edits and ignores calendar or quotation fields', () => {
    const input = Object.freeze({ budget: '50', meals: '14', servings: '12',
      days: 7, quotedCostCents: 5000, expenseCents: 3000 });
    const first = validatePlanningRequest(input), second = validatePlanningRequest(input);
    first.meals = 1;
    expect(second).toEqual({ budgetCents: 5000, meals: 14, servings: 12 });
    expect(input.meals).toBe('14');
  });
});

describe('temporary journey-store selection', () => {
  it('permits none, one, several and all six pilot formats in the selected order', () => {
    expect(validateJourneyStores([])).toEqual([]);
    expect(validateJourneyStores(['lidl'])).toEqual(['lidl']);
    expect(validateJourneyStores(['superdino', 'hiperdino-express', 'hiperdino'])).toEqual([
      'superdino', 'hiperdino-express', 'hiperdino',
    ]);
    expect(validateJourneyStores(PILOT_STORE_IDS)).toEqual([
      'lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona',
    ]);
  });

  it.each([
    ['lidl', 'lidl'], ['carrefour'], ['other'], ['LIDL'], [' lidl'], ['lidl '], ['__proto__'],
    ['constructor'], ['https://example.invalid'], ['lidl', undefined], [0], [null], [{}],
    [...PILOT_STORE_IDS, 'lidl'], new Array(1),
  ].map(stores => ({ stores })))('rejects duplicate, unknown or malformed selections: $stores', ({ stores }) => {
    rejects(() => validateJourneyStores(stores), 'mealJourney.invalidStores');
  });

  it.each([null, undefined, 'lidl', { 0: 'lidl', length: 1 }, new Set(['lidl'])])(
    'requires a real bounded array: %j', input => {
      rejects(() => validateJourneyStores(input as unknown as readonly unknown[]), 'mealJourney.invalidStores');
    },
  );

  it('copies a frozen selection without modifying the caller or sharing returned arrays', () => {
    const input = Object.freeze(['mercadona', 'aldi']);
    const first = validateJourneyStores(input), second = validateJourneyStores(input);
    first.push('lidl');
    expect(second).toEqual(['mercadona', 'aldi']);
    expect(input).toEqual(['mercadona', 'aldi']);
    expect(first).not.toBe(input);
  });
});
