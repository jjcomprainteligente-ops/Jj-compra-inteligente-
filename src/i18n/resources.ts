import { mergeMessageCatalogs } from './core';
import { commonMessages } from './catalogs/common';
import { appMessages } from './catalogs/app';
import { menusMessages } from './catalogs/menus';
import { pricesMessages } from './catalogs/prices';
import { recipeMessages } from './catalogs/recipes';
import { v3RecipeMessages } from './catalogs/recipesV3';
import { catalogV83UiMessages } from './catalogs/catalogV83Ui';
import { legacyMessages } from './catalogs/legacy';
import { errorMessages } from './catalogs/errors';
import { secondaryMessages } from './catalogs/secondary';
import { visualMessages } from './catalogs/visual';
import { visualSecondaryMessages } from './catalogs/visualSecondary';
import { visualMenusMessages } from './catalogs/visualMenus';
import { languageMessages } from './catalogs/language';

import { moneyMessages } from './catalogs/money';
import { moneyViewsMessages } from './catalogs/moneyViews';
import { entryMessages } from './catalogs/entry';
import { localSettingsMessages } from './catalogs/localSettings';
import { flowPagesMessages } from './catalogs/flowPages';
import { statesMessages } from './catalogs/states';
import { shellMessages } from './catalogs/shell';

import { menuFiltersMessages } from './catalogs/menuFilters';
import { privacyMessages } from './catalogs/privacy';
import { storePilotMessages } from './catalogs/storePilot';
import { listSharingMessages } from './catalogs/listSharing';
import { recipePhotoMessages } from './catalogs/recipePhotos';
import { purchaseJourneyMessages } from './catalogs/purchaseJourney';
import { variableMenusMessages } from './catalogs/variableMenus';
import { storeLocationsMessages } from './catalogs/storeLocations';
import { storeGeographyMessages } from './catalogs/storeGeography';

export const resources = mergeMessageCatalogs(
  v3RecipeMessages, catalogV83UiMessages, recipePhotoMessages, purchaseJourneyMessages, variableMenusMessages,
  storePilotMessages, storeLocationsMessages, storeGeographyMessages, listSharingMessages,
  menuFiltersMessages, privacyMessages,
  moneyMessages, moneyViewsMessages, entryMessages, localSettingsMessages, flowPagesMessages, statesMessages, shellMessages,
  commonMessages, appMessages, menusMessages, pricesMessages, recipeMessages, legacyMessages, errorMessages, secondaryMessages, languageMessages, visualMessages, visualSecondaryMessages, visualMenusMessages,
);
