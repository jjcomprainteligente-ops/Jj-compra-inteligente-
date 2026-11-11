import { describe, expect, it } from 'vitest';
import {
  parsePublicPrices, publicPriceGroups, isComparablePublicPrice, estimateListLine,
} from '../src/domain/publicPriceFeed';
import type { ShoppingItem } from '../src/domain/shopping';

const csv = [
  'fecha,producto,nombre,grupo,unidad,cadena,precio_por_unidad_eur',
  '2026-11-02,arroz,Arroz,despensa,kg,HiperDino,2.15',
  '2026-11-04,arroz,Arroz,despensa,kg,HiperDino,2.10',
  '2026-11-04,arroz,Arroz,despensa,kg,Mercadona,2.00',
  '2026-11-04,arroz,Arroz,despensa,kg,ALDI,1.50',
  '2026-11-04,leche,"Leche, entera",lacteos,L,Mercadona,1.14',
  '2026-11-04,te,Te,despensa,ud,HiperDino,',
].join('\n');

function item(change: Partial<ShoppingItem> = {}): ShoppingItem {
  return { id: '1', name: 'Arroz', quantityMilli: 500000, unit: 'g',
    category: 'Despensa', note: '', checked: false,
    unitPriceCents: null, priceKind: null, ...change };
}

describe('published open prices (CC BY 4.0)', () => {
  it('reads a quoted CSV, validates the schema and keeps newest rows only', () => {
    const entries = parsePublicPrices(csv);
    expect(entries).toHaveLength(3);
    expect(entries.find(p => p.chain === 'hiperdino')?.centsPerUnit).toBe(210);
    expect(entries.find(p => p.product.startsWith('Leche'))?.product).toBe('Leche, entera');
    expect(entries.every(p => p.chain === 'hiperdino' || p.chain === 'mercadona')).toBe(true);
  });

  it('does not treat stale, future, or missing prices as comparable', () => {
    const record = parsePublicPrices(csv)[0];
    expect(isComparablePublicPrice(record, new Date('2026-11-09T12:00:00Z'))).toBe(true);
    expect(isComparablePublicPrice(record, new Date('2026-11-16T12:00:00Z'))).toBe(false);
    expect(isComparablePublicPrice(record, new Date('2026-10-10T12:00:00Z'))).toBe(false);
  });

  it('estimates consumed weights only for a sufficiently matching unit', () => {
    const groups = publicPriceGroups(parsePublicPrices(csv));
    const rice = groups.find(p => p.product === 'Arroz');
    expect(rice).toBeDefined();
    expect(estimateListLine(item(), rice!)).toBe(0.5);
    expect(estimateListLine(item({ name: 'Leche' }), rice!)).toBeNull();
    expect(estimateListLine(item({ unit: 'ud', quantityMilli: 1000 }), rice!)).toBeNull();
  });

  it('rejects unexpected source content and never creates a zero price', () => {
    expect(() => parsePublicPrices('<html>Server error</html>')).toThrow();
    expect(parsePublicPrices([
      'fecha,producto,nombre,grupo,unidad,cadena,precio_por_unidad_eur',
      '2026-11-04,x,Arroz,despensa,kg,HiperDino,0',
      '2026-11-04,y,Café,despensa,kg,HiperDino,',
    ].join('\n'))).toHaveLength(0);
  });
});
