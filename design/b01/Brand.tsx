import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { themes, type Variant } from './tokens';

type MonogramProps = {
  variant: Variant;
  size?: number;
  color?: string;
  background?: string;
};

/** Original vector studies for JJ. No third-party artwork or logo font. */
export function Monogram({ variant, size = 44, color, background }: MonogramProps) {
  const theme = themes[variant];
  const foreground = color ?? (variant === 'v3' ? theme.deep : '#FFFFFF');
  const field = background ?? (variant === 'v3' ? theme.accent : theme.primary);
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect width={64} height={64} rx={variant === 'v1' ? 18 : variant === 'v2' ? 11 : 32} fill={field} />
      {variant === 'v1' && <>
        <Path d="M16 18H26V39C26 45.7 16.7 48.1 12.5 41.7" fill="none" stroke={foreground} strokeWidth={6.2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M36 18H46V39C46 45.7 36.7 48.1 32.5 41.7" fill="none" stroke={foreground} strokeWidth={6.2} strokeLinecap="round" strokeLinejoin="round" />
      </>}
      {variant === 'v2' && <>
        <Path d="M13 14H30V37C30 46 25 51 16 51H10V43H16C20.5 43 22 41 22 37V22H13Z" fill={foreground} />
        <Path d="M35 14H52V37C52 46 47 51 38 51H32V43H38C42.5 43 44 41 44 37V22H35Z" fill={foreground} />
      </>}
      {variant === 'v3' && <>
        <Path d="M16 17H29M25 17V37C25 44.7 15.1 48 11.5 40.7" fill="none" stroke={foreground} strokeWidth={6.1} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M37 13H50M46 13V36C46 45.2 35.9 49.5 31.5 42.2" fill="none" stroke={foreground} strokeWidth={6.1} strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </Svg>
  );
}

export function Brand({ variant, inverse = false, compact = false }: { variant: Variant; inverse?: boolean; compact?: boolean }) {
  const theme = themes[variant];
  const ink = inverse ? '#FFFFFF' : theme.deep;
  return <View accessibilityRole="image" accessibilityLabel="JJ Compra Inteligente" style={[styles.brand, compact && { gap: 8 }]}>
    <Monogram variant={variant} size={compact ? 36 : 44} color={inverse ? theme.deep : undefined} background={inverse ? theme.accent : undefined} />
    <View style={{ gap: compact ? 0 : 1 }}>
      <Text style={[styles.name, { color: ink, fontSize: compact ? 13 : 15 }, variant === 'v2' && { letterSpacing: 0.1 }]} allowFontScaling>Compra</Text>
      <Text style={[styles.name, { color: ink, fontSize: compact ? 13 : 15 }, variant === 'v2' && { letterSpacing: 0.1 }]} allowFontScaling>Inteligente</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: 'Manrope_700Bold', lineHeight: 19, letterSpacing: -0.25 },
});
