import React, { useEffect, useRef, useState } from 'react';
import { findNearbyEstablishments } from '../../domain/storeGeography';
import { getStoreAreaPoint, useStoreArea } from '../StoreAreaProvider';
import { Linking, Platform, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { storeEstablishmentRegistry } from '../../data/storeEstablishments';
import { establishmentsForFormat, validateStoreEstablishmentRegistry, type StoreEstablishment } from '../../domain/storeEstablishments';
import type { PilotStoreId } from '../../domain/stores';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Notice, Pill, Sheet, ui } from './ui';

// An invalid static catalogue must not prevent access to saved favourites.
const directory = validateStoreEstablishmentRegistry(storeEstablishmentRegistry) ? storeEstablishmentRegistry : null;

export function StoreEstablishmentsSheet({ formatId, onClose }: { formatId: PilotStoreId | null; onClose(): void }) {
  const { t } = useI18n();
  return <Sheet visible={formatId !== null}
    title={formatId ? t('storeLocations.title', { store: t(`localSettings.store.${formatId}`) }) : t('localSettings.stores')}
    testID="store-locations-sheet" onClose={onClose}
    footer={<Button secondary icon={null} label={t('common.close')} testID="store-locations-close" onPress={onClose} />}>
    <StoreEstablishmentDirectory formatIds={formatId ? [formatId] : []} />
  </Sheet>;
}

/** Can also be shown inline inside an existing menu sheet, without nesting modals. */
export function StoreEstablishmentDirectory({ formatIds }: { formatIds: readonly PilotStoreId[] }) {
  const { t, formatDate, formatNumber } = useI18n();
  const { area } = useStoreArea();
  const [showOutside, setShowOutside] = useState(false);
  const formatKey = formatIds.join('|');
  useEffect(() => { setShowOutside(false); }, [area, formatKey]);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const mounted = useRef(true);
  const openRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; openRequest.current++; };
  }, []);
  const records = directory ? formatIds.flatMap(id => establishmentsForFormat(directory, id)) : [];
  const point = area ? getStoreAreaPoint(area) : null;
  const nearby = area && point && directory ? findNearbyEstablishments(directory, point, area.radiusKm, formatIds) : null;
  const scoped = nearby?.status === 'ok' ? nearby : null;
  const entries: { record: StoreEstablishment; distanceKm?: number }[] = scoped
    ? [...scoped.within.map(item => ({ record: item.establishment, distanceKm: item.distanceKm })),
      ...(showOutside ? scoped.outside.map(item => ({ record: item.establishment, distanceKm: item.distanceKm })) : []),
      ...scoped.pending.map(record => ({ record }))]
    : records.map(record => ({ record }));
  const openSource = async (record: StoreEstablishment) => {
    const request = ++openRequest.current;
    setFailedSource(null);
    try {
      if (Platform.OS === 'web') window.open(record.source.url, '_blank', 'noopener,noreferrer');
      else await Linking.openURL(record.source.url);
    } catch {
      if (mounted.current && request === openRequest.current) setFailedSource(record.id);
    }
  };
  return     <View testID="store-locations-content" style={{ gap: 16 }}>
      {!directory ? <View testID="store-locations-unavailable">
        <Notice kind="warning" title={t('storeLocations.unavailableTitle')} text={t('storeLocations.unavailableText')} />
      </View> : <>
        <Notice title={t('storeLocations.partialTitle')} text={t('storeLocations.partialHelp')} />
        <Text style={ui.note}>{t(area ? 'storeGeo.straightLine' : 'storeLocations.noDistance')}</Text>
        {area && !scoped && <Notice kind="warning" title={t('storeGeo.errorTitle')} text={t('storeGeo.lookup.unavailable')} />}
        {scoped && <>
          <Text accessibilityRole="header" testID="store-nearby-title" style={ui.strong}>{t('storeGeo.withinTitle', { radius: formatNumber(area!.radiusKm) })}</Text>
          {scoped.within.length === 0 && <View testID="store-nearby-empty"><Notice title={t('storeGeo.noNearbyTitle')} text={t('storeGeo.noNearbyText')} /></View>}
          {scoped.outside.length > 0 && <Button secondary testID="store-nearby-outside" label={t(showOutside ? 'storeGeo.hideOutside' : 'storeGeo.showOutside')}
            onPress={() => setShowOutside(value => !value)} />}
        </>}
        {records.length === 0 && <View testID="store-locations-empty">
          <Notice title={t('storeLocations.emptyTitle')} text={t('storeLocations.emptyText')} />
        </View>}
        {entries.map(({ record, distanceKm }) => <View key={record.id} testID={`establishment-${record.id}`}>
          {scoped && record.location.status === 'pending' && <Text accessibilityRole="header" style={ui.strong}>{t('storeGeo.pendingTitle')}</Text>}
          {scoped && distanceKm !== undefined && distanceKm > area!.radiusKm && <Text style={ui.note}>{t('storeGeo.outsideTitle')}</Text>}
          <Card style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={ui.strong}>{record.name}</Text>
            {distanceKm !== undefined && <Text testID={`establishment-distance-${record.id}`} style={ui.strong}>
              {t('storeGeo.distance', { distance: formatNumber(distanceKm, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
            </Text>}
            <Text style={ui.note}>{t(`storeLocations.${record.channel}`)}</Text>
            <View style={{ gap: 4 }}>
              <Text style={ui.body}>{record.address.street}</Text>
              {record.address.locality && record.address.locality !== record.address.municipality &&
                <Text style={ui.note}>{record.address.locality}</Text>}
              <Text style={ui.note}>{[
                record.location.status === 'pending' && record.location.reason === 'conflicting-source' ? null : record.address.postalCode,
                record.address.municipality,
              ].filter(Boolean).join(' · ')}</Text>
              {record.location.status === 'pending' && record.location.reason === 'conflicting-source' && record.address.postalCode &&
                <Text style={ui.note}>{t('storeLocations.pendingPostalCode', { postalCode: record.address.postalCode })}</Text>}
            </View>
            <Text testID={`establishment-location-${record.id}`} style={ui.note}>
              {t(record.location.status === 'published' ? 'storeLocations.locationPublished' : 'storeLocations.locationPending')}
            </Text>
            {record.location.status === 'pending' && record.location.reason === 'conflicting-source' &&
              <Notice kind="warning" title={t('storeLocations.locationPending')} text={t('storeLocations.locationConflict')} />}
            <Text style={ui.note}>{t('storeLocations.locationHint')}</Text>
            <Pill tone="neutral" label={t('storeLocations.priceUnverified')} />
            <Text testID={`establishment-source-date-${record.id}`} style={ui.note}>
              {t('storeLocations.sourceDate', { date: formatDate(record.source.checkedOn) })}
            </Text>
            <Button secondary label={t('storeLocations.sourceAction')}
              accessibilityLabel={t('storeLocations.sourceA11y', { name: record.name })}
              testID={`establishment-source-${record.id}`} icon={ArrowUpRight} onPress={() => { void openSource(record); }} />
            {failedSource === record.id && <View testID={`establishment-source-error-${record.id}`}>
              <Notice kind="error" title={t('storeLocations.openErrorTitle')} text={t('storeLocations.openErrorText')} />
            </View>}
          </Card>
        </View>)}
      </>}
    </View>;
}
