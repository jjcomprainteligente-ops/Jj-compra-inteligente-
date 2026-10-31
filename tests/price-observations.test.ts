import { describe, expect, it } from 'vitest';
import {
  compareObservations, normalizedPrice, observationStatus, todayISO,
  validateObservationInput, validatePriceObservation,
  type ObservationInput, type PriceObservation,
} from '../src/domain/priceObservations';
import type { Unit } from '../src/domain/shopping';

const today = '2026-10-30';
const observation = (change: Partial<PriceObservation> = {}): PriceObservation => ({
  id: 'observation-a', product: 'Café', brand: 'Marca local', format: 'Bolsa', quality: 'Molido',
  store: 'Comercio A', quantityMilli: 500000, unit: 'g', priceCents: 400,
  observedOn: today, sourceKind: 'manual', sourceReference: 'Ticket revisado por la persona',
  url: null, ...change,
});
const input = (change: Partial<ObservationInput> = {}): ObservationInput => ({
  product: ' Café ', brand: ' Marca local ', format: ' Bolsa ', quality: ' Molido ',
  store: ' Comercio A ', quantity: '0,5', unit: 'kg', price: '4,00', observedOn: today,
  sourceKind: 'manual', sourceReference: ' Ticket revisado por la persona ', url: '', ...change,
});

describe('observaciones manuales completas y campos acotados', () => {
  it('limpia los campos, conserva céntimos/cantidad y exige procedencia explícita', () => {
    expect(validateObservationInput(input(), today)).toEqual({
      product: 'Café', brand: 'Marca local', format: 'Bolsa', quality: 'Molido', store: 'Comercio A',
      quantityMilli: 500, unit: 'kg', priceCents: 400, observedOn: today,
      sourceKind: 'manual', sourceReference: 'Ticket revisado por la persona', url: null,
    });
    expect(validatePriceObservation({ ...observation(), extraPrice: 42, verified: true })).toEqual(observation());
    expect(observationStatus(observation(), today)).toBe('manual');
    expect(() => validateObservationInput(input({ sourceKind: 'verified' as ObservationInput['sourceKind'] }), today)).toThrow('procedencia');
    expect(() => validatePriceObservation({ ...observation(), sourceKind: 'verified' })).toThrow('procedencia');
  });

  it('distingue un precio ausente de un cero aportado explícitamente', () => {
    const missing = validateObservationInput(input({ price: ' ' }), today);
    const free = validateObservationInput(input({ price: '0' }), today);
    expect(missing.priceCents).toBeNull();
    expect(free.priceCents).toBe(0);
    expect(normalizedPrice(missing)).toBeNull();
    expect(normalizedPrice(free)).toEqual({ cents: 0, unitLabel: '€/kg' });
    expect(observationStatus({ ...observation(), ...missing }, today)).toBe('unknown');
    expect(observationStatus({ ...observation(), ...free }, today)).toBe('manual');
  });

  it.each([
    ['product', 120], ['brand', 80], ['format', 80], ['quality', 120], ['store', 120], ['sourceReference', 300],
  ] as const)('exige %s y limita longitud a %i sin truncar', (field, limit) => {
    expect(() => validateObservationInput(input({ [field]: ' ' }), today)).toThrow();
    expect(() => validateObservationInput(input({ [field]: 'a'.repeat(limit + 1) }), today)).toThrow(String(limit));
    expect(validateObservationInput(input({ [field]: 'a'.repeat(limit) }), today)[field]).toHaveLength(limit);
  });

  it.each([undefined, null, 'caja'])('rechaza unidad runtime ausente o no admitida %s', unit => {
    expect(() => validateObservationInput(input({ unit: unit as Unit }), today)).toThrow('unidad válida');
    expect(() => validatePriceObservation(observation({ unit: unit as Unit }))).toThrow('unidad válida');
  });

  it('valida cantidades y precios sin aceptar agrupadores ni precisión excesiva', () => {
    for (const quantity of ['0', '-2', '1,0001', '1e2', '1000000.001']) {
      expect(() => validateObservationInput(input({ quantity }), today)).toThrow();
    }
    expect(() => validateObservationInput(input({ quantity: '0,5', unit: 'ud' }), today)).toThrow('entera');
    for (const price of ['-1', '1,234', 'Infinity', '1e2', '9'.repeat(100)]) {
      expect(() => validateObservationInput(input({ price }), today)).toThrow();
    }
    for (const priceCents of [undefined, -1, 0.1, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => validatePriceObservation({ ...observation(), priceCents })).toThrow();
    }
  });

  it.each([undefined, null, [], {}, { id: '' }, { ...observation(), id: ' bad ' }, { ...observation(), id: 'x'.repeat(129) }])('rechaza estructura almacenada inválida %j', value => {
    expect(() => validatePriceObservation(value)).toThrow();
  });

  it('rechaza controles invisibles y conserva datos de texto como texto', () => {
    expect(() => validateObservationInput(input({ product: 'Café\u202Eoculto' }), today)).toThrow('caracteres');
    expect(validateObservationInput(input({ product: '<img src=x onerror=alert(1)>' }), today).product).toBe('<img src=x onerror=alert(1)>');
    expect(() => validateObservationInput({ ...input(), observedOn: null } as unknown as ObservationInput, today)).toThrow();
  });
});

describe('fechas reales y antigüedad sin falsa verificación', () => {
  it('usa el día local del dispositivo para el formulario', () => {
    expect(todayISO(new Date(2026, 9, 30, 23, 59))).toBe(today);
    expect(() => todayISO(new Date('invalid'))).toThrow('dispositivo');
  });

  it.each(['2026-02-29', '1900-02-29', '2026-04-31', '2026-00-01', '2026-13-01', '2026-10-00', '2026-10-32', '30/10/2026', '2026-1-1', '2026-10-30T00:00:00Z', ''])('rechaza fecha no real %s', observedOn => {
    expect(() => validateObservationInput(input({ observedOn }), today)).toThrow('fecha');
  });

  it('acepta bisiestos y no bloquea la lectura por un reloj atrasado', () => {
    expect(validateObservationInput(input({ observedOn: '2024-02-29' }), today).observedOn).toBe('2024-02-29');
    expect(validatePriceObservation(observation({ observedOn: '2000-02-29' })).observedOn).toBe('2000-02-29');
    expect(() => validateObservationInput(input({ observedOn: '2026-10-31' }), today)).toThrow('futuro');
    const stored = validatePriceObservation(observation({ observedOn: '2026-10-31' }));
    expect(observationStatus(stored, today)).toBe('unknown');
    expect(() => observationStatus(stored, '2026-02-29')).toThrow();
  });

  it('incluye siete días y excluye el octavo del ranking', () => {
    expect(observationStatus(observation({ observedOn: '2026-10-23' }), today)).toBe('manual');
    expect(observationStatus(observation({ observedOn: '2026-10-22' }), today)).toBe('stale');
    expect(observationStatus(observation({ observedOn: '2024-02-29' }), '2024-03-07')).toBe('manual');
    expect(observationStatus(observation({ observedOn: '2024-02-29' }), '2024-03-08')).toBe('stale');
  });

  it('demo y desconocido nunca se convierten en precios manuales recientes', () => {
    expect(observationStatus(observation({ sourceKind: 'demo', priceCents: null, observedOn: '2099-01-01' }), today)).toBe('demo');
    expect(observationStatus(observation({ sourceKind: 'unknown' }), today)).toBe('unknown');
    expect(observationStatus(observation({ priceCents: null }), today)).toBe('unknown');
  });
});

describe('enlaces explícitos y normalizados, sin llamadas externas', () => {
  it('admite HTTP/S opcional y devuelve el mismo enlace canónico validado', () => {
    expect(validateObservationInput(input({ url: ' HTTPS://EXAMPLE.COM/articulo%20uno ' }), today).url).toBe('https://example.com/articulo%20uno');
    expect(validateObservationInput(input({ url: 'http://example.com' }), today).url).toBe('http://example.com/');
    expect(validateObservationInput(input(), today).url).toBeNull();
  });

  it.each(['javascript:alert(1)', 'file:///tmp/a', 'ftp://example.com', 'example.com', 'https://', 'https://user:pass@example.com/a', 'https://user@example.com', 'https:\n//example.com/a', 'https://example.com/a b', 'https://example.com/' + 'a'.repeat(2048)])('rechaza enlace inseguro o no válido %s', url => {
    expect(() => validateObservationInput(input({ url }), today)).toThrow('enlace');
  });
});

describe('precio normalizado en razones exactas', () => {
  it('convierte gramos/kilos, mililitros/litros y unidades', () => {
    expect(normalizedPrice(observation({ priceCents: 150 }))).toEqual({ cents: 300, unitLabel: '€/kg' });
    expect(normalizedPrice(observation({ priceCents: 150, unit: 'kg', quantityMilli: 500 }))).toEqual({ cents: 300, unitLabel: '€/kg' });
    expect(normalizedPrice(observation({ priceCents: 375, unit: 'ml', quantityMilli: 1_500_000 }))).toEqual({ cents: 250, unitLabel: '€/L' });
    expect(normalizedPrice(observation({ priceCents: 375, unit: 'L', quantityMilli: 1500 }))).toEqual({ cents: 250, unitLabel: '€/L' });
    expect(normalizedPrice(observation({ priceCents: 900, unit: 'ud', quantityMilli: 6000 }))).toEqual({ cents: 150, unitLabel: '€/ud' });
  });

  it('redondea el valor mostrado una vez, sin dividir en coma flotante', () => {
    expect(normalizedPrice(observation({ priceCents: 1, unit: 'ud', quantityMilli: 2000 }))).toEqual({ cents: 1, unitLabel: '€/ud' });
    expect(normalizedPrice(observation({ priceCents: 1, unit: 'ud', quantityMilli: 3000 }))).toEqual({ cents: 0, unitLabel: '€/ud' });
    expect(normalizedPrice(observation({ priceCents: Number.MAX_SAFE_INTEGER, quantityMilli: 1_000_000 })))
      .toEqual({ cents: Number.MAX_SAFE_INTEGER, unitLabel: '€/kg' });
    expect(() => normalizedPrice(observation({ priceCents: Number.MAX_SAFE_INTEGER, quantityMilli: 999999 }))).toThrow('demasiado grande');
    expect(() => validateObservationInput(input({ price: '90071992547409,91', quantity: '0,999', unit: 'kg' }), today)).toThrow('demasiado grande');
  });

  it('ordena por razones exactas incluso cuando ambos importes se muestran iguales', () => {
    const a = observation({ id: 'a', quantityMilli: 100000, priceCents: 100 });
    const b = observation({ id: 'b', quantityMilli: 100001, priceCents: 100 });
    expect(normalizedPrice(a)).toEqual(normalizedPrice(b));
    const compared = compareObservations([a, b], 'a', today);
    expect(compared.ranked.map(value => value.id)).toEqual(['b', 'a']);
    expect(compared.bestIds).toEqual(['b']);
  });

  it('identifica empates verdaderos, cero conocido y conserva el orden original', () => {
    const a = observation({ id: 'a', quantityMilli: 100000, priceCents: 100 });
    const b = observation({ id: 'b', quantityMilli: 1000, unit: 'kg', priceCents: 1000 });
    const values = [a, b];
    const frozen = JSON.stringify(values);
    expect(compareObservations(values, 'a', today).bestIds).toEqual(['a', 'b']);
    expect(JSON.stringify(values)).toBe(frozen);
    expect(compareObservations([...values, observation({ id: 'free', priceCents: 0 })], 'a', today).bestIds).toEqual(['free']);
  });
});

describe('equivalencia declarada y exclusiones trazables', () => {
  it('acepta tamaño distinto del mismo producto/marca/formato/calidad con unidad compatible', () => {
    const a = observation({ id: 'a' });
    const b = observation({ id: 'b', product: ' CAFE\u0301 ', brand: 'MÁRCA  LOCAL', format: 'BOLSA', quality: 'molido', unit: 'kg', quantityMilli: 1000, priceCents: 700 });
    expect(compareObservations([a, b], 'a', today).ranked.map(value => value.id)).toEqual(['b', 'a']);
  });

  it('explica marcas, formatos, calidades, productos y dimensiones incompatibles', () => {
    const values = [observation(), observation({ id: 'brand', brand: 'Otra' }), observation({ id: 'format', format: 'Lata' }),
      observation({ id: 'quality', quality: 'En grano' }), observation({ id: 'product', product: 'Cacao' }),
      observation({ id: 'volume', unit: 'L', quantityMilli: 1000 }), observation({ id: 'count', unit: 'ud', quantityMilli: 1000 })];
    const result = compareObservations(values, values[0].id, today);
    expect(result.ranked).toHaveLength(1);
    const reasons = Object.fromEntries(result.excluded.map(value => [value.observation.id, value.reason]));
    expect(reasons.brand).toMatch(/marca/i);
    expect(reasons.format).toMatch(/formato/i);
    expect(reasons.quality).toMatch(/calidad/i);
    expect(reasons.product).toMatch(/producto/i);
    expect(reasons.volume).toMatch(/unidades no compatibles/i);
    expect(reasons.count).toMatch(/unidades no compatibles/i);
  });

  it('no mezcla demo, origen desconocido, ausencia de precio, fechas futuras ni antiguas con manuales', () => {
    const values = [observation(), observation({ id: 'demo', sourceKind: 'demo', priceCents: 1 }),
      observation({ id: 'unknown', sourceKind: 'unknown', priceCents: 1 }), observation({ id: 'no-price', priceCents: null }),
      observation({ id: 'future', observedOn: '2026-10-31', priceCents: 1 }), observation({ id: 'stale', observedOn: '2026-10-22', priceCents: 1 })];
    const result = compareObservations(values, values[0].id, today);
    expect(result.ranked.map(value => value.id)).toEqual([values[0].id]);
    expect(result.excluded).toHaveLength(5);
    expect(result.excluded.every(value => value.reason.length > 12)).toBe(true);
    expect(result.bestIds).toEqual([values[0].id]);
  });

  it('no sustituye una referencia antigua por otra automáticamente', () => {
    const values = [observation({ id: 'old', observedOn: '2026-10-22' }), observation({ id: 'current' })];
    const result = compareObservations(values, 'old', today);
    expect(result.ranked).toEqual([]);
    expect(result.bestIds).toEqual([]);
    expect(result.excluded).toHaveLength(2);
    expect(result.warning).toMatch(/referencia.*no es apta/i);
    expect(compareObservations(values, 'missing', today).warning).toMatch(/referencia/i);
    expect(compareObservations([], '', today)).toMatchObject({ ranked: [], excluded: [], bestIds: [] });
  });

  it('rechaza identificadores repetidos en vez de producir un ranking ambiguo', () => {
    expect(() => compareObservations([observation(), observation()], observation().id, today)).toThrow('identificadores');
  });
});
