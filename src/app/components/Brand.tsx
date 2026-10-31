import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { c, f } from '../theme';

/** The M3 study selected provisionally in B01; the final logo remains open. */
export function Brand() {
  return <View accessibilityRole="image" accessibilityLabel="JJ Compra Inteligente" style={styles.brand}>
    <Svg width={44} height={44} viewBox="0 0 64 64" accessibilityElementsHidden>
      <Rect width={64} height={64} rx={32} fill={c.accent} />
      <Path d="M16 17H29M25 17V37C25 44.7 15.1 48 11.5 40.7M37 13H50M46 13V36C46 45.2 35.9 49.5 31.5 42.2"
        fill="none" stroke={c.deep} strokeWidth={6.1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
    <View><Text style={styles.name}>Compra</Text><Text style={styles.name}>Inteligente</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: f.bold, color: c.deep, fontSize: 15, lineHeight: 20, letterSpacing: -0.3 },
});
