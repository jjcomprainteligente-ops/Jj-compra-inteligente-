import type { ShoppingState } from '../domain/shopping';
import type { PriceObservation } from '../domain/priceObservations';
import { loadShopping } from '../storage/shopping';
import { loadPriceObservations } from '../storage/priceObservations';
import { storageSignature } from '../storage/writeCoordinator';

/** Read-only conflict check. Never claims the durable write fence or repairs data. */
export async function manualBasketIsFresh(shopping: ShoppingState, observations: PriceObservation[]): Promise<boolean> {
  try {
    const expectedShopping = storageSignature(shopping);
    const expectedObservations = storageSignature(observations);
    const [currentShopping, currentObservations] = await Promise.all([loadShopping(), loadPriceObservations()]);
    return storageSignature(currentShopping) === expectedShopping &&
      storageSignature(currentObservations) === expectedObservations;
  } catch {
    // Unreadable, incompatible or unavailable storage must not produce a quote.
    return false;
  }
}
