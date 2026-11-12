import { mergeMessageCatalogs } from './core';
import { commonMessages } from './catalogs/common';
import { appMessages } from './catalogs/app';
import { menusMessages } from './catalogs/menus';
import { pricesMessages } from './catalogs/prices';
import { recipeMessages } from './catalogs/recipes';
import { v83RecipeMessages } from './catalogs/recipesV83';
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

export const resources = mergeMessageCatalogs(
  v83RecipeMessages, catalogV83UiMessages,
  storePilotMessages, listSharingMessages,
  menuFiltersMessages, privacyMessages,
  moneyMessages, moneyViewsMessages, entryMessages, localSettingsMessages, flowPagesMessages, statesMessages, shellMessages,
  commonMessages, appMessages, menusMessages, pricesMessages, recipeMessages, legacyMessages, errorMessages, secondaryMessages, languageMessages, visualMessages, visualSecondaryMessages, visualMenusMessages,
);
