import { mergeMessageCatalogs } from './core';
import { commonMessages } from './catalogs/common';
import { appMessages } from './catalogs/app';
import { menusMessages } from './catalogs/menus';
import { pricesMessages } from './catalogs/prices';
import { recipeMessages } from './catalogs/recipes';
import { legacyMessages } from './catalogs/legacy';
import { errorMessages } from './catalogs/errors';
import { secondaryMessages } from './catalogs/secondary';
import { visualMessages } from './catalogs/visual';
import { visualSecondaryMessages } from './catalogs/visualSecondary';
import { visualMenusMessages } from './catalogs/visualMenus';
import { languageMessages } from './catalogs/language';

export const resources = mergeMessageCatalogs(
  commonMessages, appMessages, menusMessages, pricesMessages, recipeMessages, legacyMessages, errorMessages, secondaryMessages, languageMessages, visualMessages, visualSecondaryMessages, visualMenusMessages,
);
