import React, { useEffect, useRef, useState } from 'react';
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
  const { t, formatDate } = useI18n();
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const mounted = useRef(true);
  const openRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const records = directory && formatId ? establishmentsForFormat(directory, formatId) : [];
  const close = () => {
    openRequest.current++;
    setFailedSource(null);
    onClose();
  };
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
  return <Sheet visible={formatId !== null}
    title={formatId ? t('storeLocations.title', { store: t(`localSettings.store.${formatId}`) }) : t('localSettings.stores')}
    testID="store-locations-sheet" onClose={close}
    footer={<Button secondary icon={null} label={t('common.close')} testID="store-locations-close" onPress={close} />}>
    <View testID="store-locations-content" style={{ gap: 16 }}>
      {!directory ? <View testID="store-locations-unavailable">
        <Notice kind="warning" title={t('storeLocations.unavailableTitle')} text={t('storeLocations.unavailableText')} />
      </View> : <>
        <Notice title={t('storeLocations.partialTitle')} text={t('storeLocations.partialHelp')} />
        <Text style={ui.note}>{t('storeLocations.noDistance')}</Text>
        {records.length === 0 && <View testID="store-locations-empty">
          <Notice title={t('storeLocations.emptyTitle')} text={t('storeLocations.emptyText')} />
        </View>}
        {records.map(record => <View key={record.id} testID={`establishment-${record.id}`}>
          <Card style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={ui.strong}>{record.name}</Text>
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
    </View>
  </Sheet>;
}
