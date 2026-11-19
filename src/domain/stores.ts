/** Public destinations reviewed on 2026-11-10. No feed, credentials or cart API. */
export const PILOT_STORE_IDS = ['lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona'] as const;
export type PilotStoreId = typeof PILOT_STORE_IDS[number];

// Keep the previous identifiers readable so an upgrade never discards saved favourites.
export const STORE_IDS = [...PILOT_STORE_IDS, 'carrefour', 'other'] as const;
export type StoreId = typeof STORE_IDS[number];

export type StoreDestinationKind = 'offers' | 'online' | 'locator';
export interface PublicStoreDestination {
  url: string;
  kind: StoreDestinationKind;
  /** A public page is not a connected or authorised price feed. */
  priceFeedConnected: false;
  /** Region/fulfilment centre/branch must be resolved before comparing prices. */
  locationRequired: true;
}

export const PUBLIC_STORE_DESTINATIONS: Readonly<Record<PilotStoreId, PublicStoreDestination>> = {
  lidl: { url: 'https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402', kind: 'offers', priceFeedConnected: false, locationRequired: true },
  aldi: { url: 'https://www.aldi.es/folleto.html', kind: 'offers', priceFeedConnected: false, locationRequired: true },
  hiperdino: { url: 'https://www.hiperdino.es/', kind: 'online', priceFeedConnected: false, locationRequired: true },
  superdino: { url: 'https://www.hiperdino.es/tiendas/', kind: 'locator', priceFeedConnected: false, locationRequired: true },
  'hiperdino-express': { url: 'https://hiperdinoexpress.com/tiendas', kind: 'locator', priceFeedConnected: false, locationRequired: true },
  mercadona: { url: 'https://www.mercadona.es/', kind: 'online', priceFeedConnected: false, locationRequired: true },
};

export function publicStoreDestination(id: StoreId): PublicStoreDestination | undefined {
  return (PILOT_STORE_IDS as readonly string[]).includes(id)
    ? PUBLIC_STORE_DESTINATIONS[id as PilotStoreId] : undefined;
}

export function allPilotStoresSelected(selected: readonly StoreId[]): boolean {
  return PILOT_STORE_IDS.every(id => selected.includes(id));
}

/** Select the pilot in one save, preserving previous out-of-pilot favourites. */
export function selectAllPilotStores(selected: readonly StoreId[]): StoreId[] {
  return [...new Set<StoreId>([...PILOT_STORE_IDS, ...selected])];
}
