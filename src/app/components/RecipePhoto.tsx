import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { ImageOff, Utensils } from 'lucide-react-native';
import { recipePhotoAsset } from '../../data/recipePhotoAssets';
import { useI18n } from '../../i18n/LanguageProvider';
import { c, f } from '../theme';

interface Props {
  recipeId: string;
  title: string;
  variant: 'thumbnail' | 'detail';
}

/** Local bundled resources only. Loading and failure never change saved data. */
export function RecipePhoto({ recipeId, title, variant }: Props) {
  const { t } = useI18n();
  const asset = recipePhotoAsset(recipeId);
  const identity = variant + ':' + recipeId;
  const host = useRef<React.ComponentRef<typeof View>>(null);
  const [visibleIdentity, setVisibleIdentity] = useState<string | null>(null);
  const [failedIdentity, setFailedIdentity] = useState<string | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState<string | null>(null);
  const immediate = Platform.OS !== 'web' || variant === 'detail';
  const visible = immediate || visibleIdentity === identity;
  const failed = failedIdentity === identity;
  const testSuffix = variant + '-' + recipeId;

  useEffect(() => {
    if (!asset || immediate) return;
    // React Native Web's Image preloads eagerly, so defer mounting its loader.
    // Older browsers retain the existing paginated maximum of 20 initial rows.
    if (typeof IntersectionObserver === 'undefined' || !host.current) {
      setVisibleIdentity(identity);
      return;
    }
    const node = host.current as unknown as Element;
    let active = true;
    const observer = new IntersectionObserver(entries => {
      if (active && entries.some(entry => entry.isIntersecting)) {
        setVisibleIdentity(identity);
        observer.disconnect();
      }
    }, { rootMargin: '160px' });
    observer.observe(node);
    return () => { active = false; observer.disconnect(); };
  }, [asset, identity, immediate]);

  return <View ref={host} testID={'recipe-photo-' + testSuffix}
    style={[styles.frame, variant === 'thumbnail' ? styles.thumbnail : styles.detail]}>
    {!asset || failed ? <View testID={'recipe-photo-fallback-' + testSuffix}
      accessibilityLabel={t('recipePhotos.unavailable')} accessibilityRole="image"
      style={styles.placeholder}>
      <ImageOff size={variant === 'thumbnail' ? 18 : 28} color={c.muted} />
      {variant === 'detail' && <Text style={styles.fallbackText}>{t('recipePhotos.unavailable')}</Text>}
    </View> : <>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.placeholder}>
        <Utensils size={variant === 'thumbnail' ? 18 : 28} color={c.primary} />
      </View>
      {visible && <Image key={identity} testID={'recipe-photo-image-' + testSuffix}
        source={variant === 'thumbnail' ? asset.thumbnail : asset.detail}
        accessibilityRole="image" accessibilityLabel={t('recipePhotos.imageAlt', { title })}
        resizeMode={variant === 'thumbnail' ? 'cover' : 'contain'} resizeMethod="resize"
        onLoadStart={() => setLoadingIdentity(identity)}
        onLoad={() => setLoadingIdentity(current => current === identity ? null : current)}
        onError={() => { setFailedIdentity(identity); setLoadingIdentity(current => current === identity ? null : current); }}
        style={styles.image} />}
      {visible && loadingIdentity === identity && !failed && <View pointerEvents="none"
        testID={'recipe-photo-loading-' + testSuffix} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.loading}>
        <ActivityIndicator size="small" color={c.primary} />
      </View>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: c.soft, flexShrink: 0 },
  thumbnail: { width: 36, height: 36, borderRadius: 10 },
  detail: { width: '100%', aspectRatio: 3 / 2, borderRadius: 16, marginTop: 14, marginBottom: 4 },
  image: { width: '100%', height: '100%' },
  placeholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontFamily: f.medium, fontSize: 14, lineHeight: 21, color: c.muted, textAlign: 'center', paddingHorizontal: 12 },
});
