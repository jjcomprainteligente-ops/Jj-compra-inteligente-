import React, { useEffect, useId, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Check, MapPin } from 'lucide-react-native';
import { postalReferenceCatalog } from '../../data/postalReferences';
import { findPostalReferences, postalReferenceById, type PostalReferenceLookupResult } from '../../domain/postalReferences';
import { DEFAULT_STORE_RADIUS_KM, parseStoreRadiusKm, STORE_RADIUS_PRESETS } from '../../domain/storeGeography';
import { useI18n } from '../../i18n/LanguageProvider';
import { useStoreArea } from '../StoreAreaProvider';
import { Button, Card, Field, Notice, c, ui } from './ui';

/** Optional session context: never writes favourites or purchase documents. */
export function StoreAreaControls({ idPrefix = 'store-area' }: { idPrefix?: string }) {
  const { t, formatNumber } = useI18n();
  const { area, gpsBusy, gpsError, applyPostal, updateRadius, requestDevice, cancelDevice, clear } = useStoreArea();
  const owner = useId();
  const toggleHost = useRef<React.ElementRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'postal' | 'locality'>('postal');
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState<PostalReferenceLookupResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [radius, setRadius] = useState(String(DEFAULT_STORE_RADIUS_KM));
  const [error, setError] = useState<'invalidRadius' | 'selectFirst' | 'lookup.unavailable' | null>(null);
  const [linkFailed, setLinkFailed] = useState(false);
  useEffect(() => () => cancelDevice(owner), [cancelDevice, owner]);
  const reference = area?.kind === 'postal' ? postalReferenceById(postalReferenceCatalog, area.referenceId) : null;
  const summary = !area ? t('storeGeo.noArea') : area.kind === 'postal' && reference
    ? t('storeGeo.postalSummary', { locality: reference.locality, postalCode: reference.postalCode, radius: formatNumber(area.radiusKm) })
    : t('storeGeo.deviceSummary', { radius: formatNumber(area.radiusKm) });
  const close = () => {
    cancelDevice(owner); setOpen(false); setError(null);
    if (Platform.OS === 'web') requestAnimationFrame(() => {
      (toggleHost.current as unknown as HTMLElement | null)?.querySelector<HTMLElement>('[role="button"]')?.focus();
    });
  };
  const choose = () => {
    setRadius(String(area?.radiusKm ?? DEFAULT_STORE_RADIUS_KM));
    setMode('postal'); setQuery(reference?.postalCode ?? ''); setLookup(null); setSelected(null); setError(null); setOpen(true);
  };
  const validRadius = () => {
    const value = parseStoreRadiusKm(radius);
    if (value === null) setError('invalidRadius');
    return value;
  };
  const apply = () => {
    const value = validRadius();
    if (value === null) return;
    if (!selected) { setError('selectFirst'); return; }
    if (!applyPostal(selected, value)) { setError('lookup.unavailable'); return; }
    close();
  };
  const source = async (url: 'https://www.geonames.org/' | 'https://creativecommons.org/licenses/by/4.0/') => {
    setLinkFailed(false);
    try {
      if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
      else await Linking.openURL(url);
    } catch { setLinkFailed(true); }
  };
  return <View testID={idPrefix} style={{ gap: 12 }}>
    <Card style={{ gap: 12 }}>
      <Text accessibilityRole="header" style={ui.strong}>{t('storeGeo.title')}</Text>
      <Text testID={`${idPrefix}-summary`} accessibilityLiveRegion="polite" style={ui.body}>{summary}</Text>
      <Text style={ui.note}>{t('storeGeo.sessionHelp')}</Text>
      {area && <Text style={ui.note}>{t('storeGeo.attribution')}</Text>}
      <View ref={toggleHost}><Button secondary label={t(open ? 'storeGeo.close' : area ? 'storeGeo.change' : 'storeGeo.choose')}
        testID={`${idPrefix}-toggle`} icon={MapPin} onPress={open ? close : choose} /></View>
      {area && <Button secondary label={t('storeGeo.clear')} testID={`${idPrefix}-clear`} icon={null}
        onPress={() => { clear(); setSelected(null); setLookup(null); setError(null); }} />}
      {area?.kind === 'device' && <Text style={ui.note}>{t('storeGeo.accuracy', { accuracy: formatNumber(Math.ceil(area.accuracyMeters)) })}</Text>}
      {open && <View testID={`${idPrefix}-form`} style={{ gap: 12 }}>
        <View style={{ gap: 8 }}>
          {(['postal', 'locality'] as const).map(value => <Pressable key={value} accessibilityRole="radio"
            accessibilityState={{ checked: mode === value }} aria-checked={mode === value}
            testID={`${idPrefix}-mode-${value}`} onPress={() => { setMode(value); setQuery(''); setLookup(null); setSelected(null); setError(null); }}
            style={[ui.row, { backgroundColor: mode === value ? c.soft : c.surface, gap: 8 }]}>
            <Text style={[ui.body, { flex: 1 }]}>{t(`storeGeo.${value}Mode`)}</Text>
            {mode === value && <Check color={c.primary} size={20} />}
          </Pressable>)}
        </View>
        <Field label={t(`storeGeo.${mode}Input`)} hint={t('storeGeo.commercialContext')} testID={`${idPrefix}-query`} value={query}
          inputMode={mode === 'postal' ? 'numeric' : 'text'} autoCapitalize="none" autoCorrect={false}
          maxLength={mode === 'postal' ? 16 : 80} onChangeText={value => { setQuery(value); setLookup(null); setSelected(null); setError(null); }} />
        <Button secondary label={t('storeGeo.search')} testID={`${idPrefix}-search`} onPress={() => {
          setLookup(findPostalReferences(postalReferenceCatalog, query, mode)); setSelected(null); setError(null);
        }} />
        {lookup && lookup.status !== 'choices' && <Notice kind="warning" title={t('storeGeo.errorTitle')} text={t(`storeGeo.lookup.${lookup.status}`)} />}
        {lookup?.status === 'choices' && <View testID={`${idPrefix}-choices`} style={{ gap: 8 }}>
          {lookup.truncated && <Text style={ui.note}>{t('storeGeo.truncated')}</Text>}
          {lookup.references.map(item => <Pressable key={item.id} accessibilityRole="radio"
            accessibilityLabel={t('storeGeo.selectReference', { locality: item.locality, postalCode: item.postalCode, municipality: item.municipality })}
            accessibilityState={{ checked: selected === item.id }} aria-checked={selected === item.id}
            testID={`${idPrefix}-choice-${item.id}`} onPress={() => { setSelected(item.id); setError(null); }}
            style={[ui.row, { gap: 8, backgroundColor: selected === item.id ? c.soft : c.surface }]}>
            <View style={{ flex: 1, gap: 4 }}><Text style={ui.strong}>{item.locality}</Text>
              <Text style={ui.note}>{item.postalCode} · {item.municipality}</Text></View>
            {selected === item.id && <Check size={20} color={c.primary} />}
          </Pressable>)}
        </View>}
        <Text accessibilityRole="header" style={ui.strong}>{t('storeGeo.radius')}</Text>
        <View style={{ gap: 8 }}>
          {STORE_RADIUS_PRESETS.map(value => <Button key={value} secondary icon={Number(radius) === value ? Check : null}
            label={t('storeGeo.radiusPreset', { radius: formatNumber(value) })} testID={`${idPrefix}-radius-${value}`}
            onPress={() => { setRadius(String(value)); setError(null); }} />)}
        </View>
        <Field label={t('storeGeo.customRadius')} hint={t('storeGeo.radiusHint')} value={radius} maxLength={8}
          inputMode="numeric" testID={`${idPrefix}-radius`} onChangeText={value => { setRadius(value); setError(null); }} />
        {error && <Notice kind="error" title={t('storeGeo.errorTitle')} text={t(`storeGeo.${error}`)} />}
        <Button label={t('storeGeo.apply')} testID={`${idPrefix}-apply`} onPress={apply} />
        {area && <Button secondary label={t('storeGeo.applyRadius')} testID={`${idPrefix}-apply-radius`} onPress={() => {
          const value = validRadius(); if (value !== null && updateRadius(value)) close();
        }} />}
        <Text style={ui.note}>{t('storeGeo.gpsHelp')}</Text>
        <Button secondary icon={MapPin} label={t('storeGeo.gpsAction')} busy={gpsBusy} testID={`${idPrefix}-gps`}
          onPress={() => { const value = validRadius(); if (value !== null) { setError(null); requestDevice(owner, value); } }} />
        {gpsBusy && <Text accessibilityLiveRegion="polite" aria-live="polite" style={ui.note}>{t('storeGeo.gpsBusy')}</Text>}
        {gpsError && gpsError !== 'cancelled' && <Notice kind="warning" title={t('storeGeo.errorTitle')} text={t(`storeGeo.gps.${gpsError}`)} />}
        <Text style={ui.note}>{t('storeGeo.attribution')}</Text>
        <Button secondary icon={null} label={t('storeGeo.sourceAction')} onPress={() => { void source('https://www.geonames.org/'); }} />
        <Button secondary icon={null} label={t('storeGeo.licenseAction')} onPress={() => { void source('https://creativecommons.org/licenses/by/4.0/'); }} />
        {linkFailed && <Notice kind="warning" title={t('storeLocations.openErrorTitle')} text={t('storeLocations.openErrorText')} />}
      </View>}
    </Card>
  </View>;
}
