import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export const BRAND_NAME = 'JJ Compra Inteligente';

/** Exact supplied crop of the approved JPG. No tracing, recolouring or 3D variant. */
export function Brand() {
  return <View style={styles.brand}>
    <Image source={require('../../../assets/brand/jj-logo-horizontal.png')} accessibilityRole="image"
      accessibilityLabel={BRAND_NAME} resizeMode="contain" style={styles.image} />
  </View>;
}

const styles = StyleSheet.create({
  brand: { width: '100%', maxWidth: 440, aspectRatio: 936 / 330, alignSelf: 'center' },
  image: { width: '100%', height: '100%' },
});
