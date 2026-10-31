import { describe, expect, it } from 'vitest';
import { bestOfferIds, formatMoney, parseAmount, sortOffers, totalCents, validateComparisonName, validateOffer, type Offer } from '../src/domain/comparisons';

const makeOffer = (id: string, priceCents: number, shippingCents = 0): Offer => ({
  id, store: 'Tienda', url: 'https://example.com/producto', priceCents, shippingCents,
});

describe('importes en euros', () => {
  it.each([
    ['0', 0], ['0,00', 0], ['12', 1200], ['12,5', 1250], ['12.50', 1250],
    [' 0012,05 ', 1205], ['0.29', 29], ['999999,99', 99999999],
  ])('convierte %s a %i céntimos', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', ' ', '-1', '+1', '1e2', '1,234', '1.234', '1.234,56', '1,234.56', 'NaN', 'Infinity', '.5', '1,', '1 000', '900719925474099100'])('rechaza %s', (input) => {
    expect(() => parseAmount(input)).toThrow();
  });

  it('formatea importes según España', () => {
    expect(formatMoney(123450).replace(/\s/g, ' ')).toBe('1234,50 €');
    expect(formatMoney(0).replace(/\s/g, ' ')).toBe('0,00 €');
  });

  it('conserva los céntimos en el límite máximo seguro', () => {
    expect(parseAmount('90071992547409,91')).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => parseAmount('90071992547409,92')).toThrow();
    expect(formatMoney(Number.MAX_SAFE_INTEGER).replace(/\s/g, ' ')).toBe('90.071.992.547.409,91 €');
  });
});

describe('comparación por coste total', () => {
  it('suma precio y envío y ordena sin modificar la lista original', () => {
    const offers = [makeOffer('a', 1000, 500), makeOffer('b', 1200), makeOffer('c', 1100, 100)];
    expect(totalCents(offers[0])).toBe(1500);
    expect(sortOffers(offers).map((offer) => offer.id)).toEqual(['b', 'c', 'a']);
    expect(offers.map((offer) => offer.id)).toEqual(['a', 'b', 'c']);
  });

  it('destaca todos los empates y conserva el orden entre ellos', () => {
    const offers = [makeOffer('a', 1000, 200), makeOffer('b', 1200), makeOffer('c', 1400)];
    expect([...bestOfferIds(offers)]).toEqual(['a', 'b']);
    expect(sortOffers(offers).map((offer) => offer.id)).toEqual(['a', 'b', 'c']);
    expect([...bestOfferIds([])]).toEqual([]);
    expect(sortOffers([])).toEqual([]);
  });

  it('rechaza un total que exceda la precisión segura', () => {
    expect(() => totalCents(makeOffer('a', Number.MAX_SAFE_INTEGER, 1))).toThrow();
  });

  it.each([[-1, 2], [0.5, 0.5], [Infinity, 0], [Number.MAX_SAFE_INTEGER + 1, 0]])('rechaza componentes inválidos aunque el total parezca válido (%s, %s)', (price, shipping) => {
    expect(() => totalCents(makeOffer('a', price, shipping))).toThrow();
  });
});

describe('validación de formularios', () => {
  const input = { store: ' Tienda ', url: ' https://example.com/articulo ', price: '25,99', shipping: '0' };

  it('devuelve campos limpios y cantidades enteras', () => {
    expect(validateOffer(input)).toEqual({ store: 'Tienda', url: 'https://example.com/articulo', priceCents: 2599, shippingCents: 0 });
    expect(validateComparisonName('  Auriculares  ')).toBe('Auriculares');
    expect(() => validateComparisonName('  ')).toThrow('nombre');
  });

  it.each(['javascript:alert(1)', 'file:///tmp/producto', 'example.com', 'https://', 'ftp://example.com'])('rechaza el enlace %s', (url) => {
    expect(() => validateOffer({ ...input, url })).toThrow('enlace');
  });

  it('permite enlaces HTTP y exige tienda, precio y envío válidos', () => {
    expect(validateOffer({ ...input, url: 'http://example.com' }).url).toBe('http://example.com/');
    expect(() => validateOffer({ ...input, store: ' ' })).toThrow('tienda');
    expect(() => validateOffer({ ...input, price: '-1' })).toThrow('Precio');
    expect(() => validateOffer({ ...input, shipping: '0.001' })).toThrow('Envío');
  });
  it('devuelve exactamente el enlace canónico que ha validado', () => {
    expect(validateOffer({ ...input, url: 'HTTPS://EXAMPLE.COM/a b' }).url).toBe('https://example.com/a%20b');
    // Embedded controls used to normalize silently; new links must reject them.
    expect(() => validateOffer({ ...input, url: 'https:\n//example.com/producto' })).toThrow('enlace');
  });
});
