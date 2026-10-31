import { Platform } from 'react-native';

export const colors = {
  background: '#F8F9F5', paper: '#FFFFFF', ink: '#233E34', muted: '#6F7D73',
  green: '#28533F', greenDark: '#1E4232', sage: '#EAF0E6', sageLine: '#D7E2D2',
  line: '#E3E7DF', coral: '#ED9C7D', coralLight: '#FBEEE6', danger: '#A74235',
};

export const fonts = { regular: 'Manrope_400Regular', medium: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', extra: 'Manrope_800ExtraBold' };
export const shadow = Platform.select({
  web: { boxShadow: '0 8px 32px rgba(35, 62, 52, 0.045)' },
  default: { shadowColor: '#233E34', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
});
