export type Variant = 'v1' | 'v2' | 'v3';

export interface Theme {
  id: Variant;
  name: string;
  primary: string;
  deep: string;
  background: string;
  surface: string;
  soft: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  onPrimary: string;
}

/** B01 proposals only: these tokens do not alter the phase-one application. */
export const themes: Record<Variant, Theme> = {
  v1: {
    id: 'v1',
    name: 'Verde Esencial',
    primary: '#167347',
    deep: '#133D2D',
    background: '#F7FAF6',
    surface: '#FFFFFF',
    soft: '#EDF7EF',
    ink: '#19332A',
    muted: '#4E6657',
    line: '#DCE7DC',
    accent: '#D7EEDC',
    accentInk: '#133D2D',
    onPrimary: '#FFFFFF',
  },
  v2: {
    id: 'v2',
    name: 'Verde Noche',
    primary: '#133D2D',
    deep: '#133D2D',
    background: '#F5F7F4',
    surface: '#FFFFFF',
    soft: '#E7EEE6',
    ink: '#18362B',
    muted: '#4D6155',
    line: '#DCE4DA',
    accent: '#B5F1C8',
    accentInk: '#133D2D',
    onPrimary: '#FFFFFF',
  },
  v3: {
    id: 'v3',
    name: 'Verde Mercado',
    primary: '#167347',
    deep: '#214633',
    background: '#FFF9EF',
    surface: '#FFFFFF',
    soft: '#F2F2DF',
    ink: '#253D2B',
    muted: '#5C6651',
    line: '#E5E5D1',
    accent: '#F2C94C',
    accentInk: '#253D2B',
    onPrimary: '#FFFFFF',
  },
};
