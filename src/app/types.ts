import type { ShoppingList } from '../domain/shopping';

export type Screen = 'home' | 'list' | 'savings' | 'menus' | 'profile' | 'comparisons' | 'prices' | 'language' | 'search' | 'product' | 'voice' | 'scanner' | 'stores' | 'budget' | 'history' | 'notifications' | 'states';

export interface SecondaryProps {
  active?: ShoppingList;
  lists: ShoppingList[];
  busy: boolean;
  actualSpentCents?: number | null;
  expensesLoading?: boolean;
  expensesError?: string;
  onNavigate: (screen: Screen) => void;
  onInfo: (title: string, body: string) => void;
  onBudget: () => void;
  onCreateList: () => void;
  onRecipe: () => void;
  onLanguage: () => void;
}
