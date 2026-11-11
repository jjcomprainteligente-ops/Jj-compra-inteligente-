/**
 * Same-origin, limited read-through for an explicitly reusable CC BY 4.0 CSV.
 * Source: https://tutandem.es/datos
 * No commercial supermarket pages are fetched or scraped here.
 */
export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const upstream = await fetch('https://tutandem.es/datos/cesta-diaria.csv', {
      headers: { Accept: 'text/csv' },
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) throw new Error('Upstream unavailable: ' + upstream.status);
    const csv = await upstream.text();
    if (csv.length > 2_000_000 || !csv.includes('precio_por_unidad_eur')) {
      throw new Error('Invalid source');
    }
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
    response.setHeader('X-Price-Source', 'tuTandem-CC-BY-4.0');
    return response.status(200).send(csv);
  } catch (error) {
    return response.status(503).json({ error: 'Public price data unavailable' });
  }
}
