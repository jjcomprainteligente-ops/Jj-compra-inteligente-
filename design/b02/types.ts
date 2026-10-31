export type Screen = 'home' | 'list' | 'savings' | 'menus' | 'profile';
export type State = 'default' | 'empty' | 'loading' | 'offline' | 'mic-denied' | 'error' | 'long-list' | 'no-price' | 'over-budget' | 'stale-price' | 'incomparable';
export type SheetName = 'add' | 'review' | 'recipe' | 'household' | 'budget' | 'accessibility' | 'privacy';
export interface ScreenProps {
  state: State;
  onNavigate: (screen: Screen, state?: State) => void;
  onInfo: (title: string, body: string) => void;
  onSheet: (sheet: SheetName) => void;
}
