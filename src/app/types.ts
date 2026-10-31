import type { ShoppingList } from '../domain/shopping';

export type Screen = 'home' | 'list' | 'savings' | 'menus' | 'profile' | 'comparisons' | 'prices' | 'language';

export interface SecondaryProps {
  active?: ShoppingList;
  lists: ShoppingList[];
  busy: boolean;
  onNavigate: (screen: Screen) => void;
  onInfo: (title: string, body: string) => void;
  onBudget: () => void;
  onCreateList: () => void;
  onRecipe: () => void;
  onLanguage: () => void;
}
