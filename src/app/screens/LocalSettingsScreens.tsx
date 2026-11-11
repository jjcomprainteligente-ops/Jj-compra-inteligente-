import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ArrowUpRight, Bell, ChevronRight, ListChecks, Minus, Star, Store, Utensils } from 'lucide-react-native';
import { deriveLocalNotices, STORE_IDS } from '../../domain/localPreferences';
import { PILOT_STORE_IDS, allPilotStoresSelected, publicStoreDestination, selectAllPilotStores, type StoreId } from '../../domain/stores';
import type { MealPlan } from '../../domain/menus';
import type { ShoppingList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Notice, Pill, Section, c, f, ui } from '../components/ui';
import type { LocalPreferencesStore } from '../useLocalPreferences';

function StorageFeedback({ store }: { store: LocalPreferencesStore }) {
  const { t, translateError } = useI18n();
  const error = store.loadError || store.saveError;
  if (store.loading) return <View style={styles.loading}>
    <ActivityIndicator color={c.primary} /><Text style={ui.note}>{t('localSettings.loading')}</Text>
  </View>;
  if (!error) return null;
  return <Notice kind="error" title={t('localSettings.errorTitle')}
    text={error.startsWith('localSettings.error.') ? t(error) : translateError(error)}
    action={t('localSettings.reload')} onPress={() => { void store.reload(); }} />;
}

export function StoresScreen({ store, onContinue, continueLabel = 'mealJourney.compare' }: { store: LocalPreferencesStore; onBack(): void; onContinue?: () => void; continueLabel?: string }) {
  const { t, formatNumber } = useI18n();
  const [visitError, setVisitError] = useState(false);
  const disabled = store.loading || store.busy || !!store.loadError;
  const allSelected = allPilotStoresSelected(store.data.favoriteStores);
  const visit = async (id: StoreId) => {
    const destination = publicStoreDestination(id);
    if (!destination) return;
    setVisitError(false);
    try { await Linking.openURL(destination.url); }
    catch { setVisitError(true); }
  };
  return <View style={ui.page} testID="stores-screen">
    <Text accessibilityRole="header" style={styles.heading}>{t('localSettings.stores')}</Text>
    <Pill label={t('localSettings.zone')} />
    <Text style={[ui.body, styles.noteText]}>{t('storePilot.chooseHelp')}</Text>
    <View style={styles.feedback}><StorageFeedback store={store} /></View>
    <View style={styles.storeActions}>
      <Button secondary label={t('storePilot.selectAll')} testID="stores-select-all" disabled={disabled || allSelected}
        onPress={() => { void store.commit(previous => ({ ...previous, favoriteStores: selectAllPilotStores(previous.favoriteStores) })); }} />
      <Button secondary label={t('storePilot.clear')} testID="stores-clear" disabled={disabled || store.data.favoriteStores.length === 0}
        onPress={() => { void store.commit(previous => ({ ...previous, favoriteStores: [] })); }} />
    </View>
    {!store.loading && !store.loadError && <Text testID="stores-selection-summary" accessibilityLiveRegion="polite" style={[ui.note, styles.noteText]}>
      {t(store.data.favoriteStores.length ? 'storePilot.selectedCount' : 'storePilot.noSelection', { count: formatNumber(store.data.favoriteStores.length) })}
    </Text>}
    {onContinue && <View style={styles.storeJourney}>
      <Text accessibilityRole="header" style={ui.strong}>{t('mealJourney.chooseStores')}</Text>
      <Text style={ui.note}>{t('mealJourney.storeHelp')}</Text>
      {!PILOT_STORE_IDS.some(id => store.data.favoriteStores.includes(id)) &&
        <Text style={ui.note}>{t('mealJourney.selectionRequired')}</Text>}
      <Button label={t(continueLabel)} testID="stores-continue-to-prices"
        disabled={disabled || !PILOT_STORE_IDS.some(id => store.data.favoriteStores.includes(id))}
        onPress={onContinue} />
    </View>}
    {visitError && <Notice kind="error" title={t('storePilot.openErrorTitle')} text={t('storePilot.openError')} />}
    {STORE_IDS.map(id => {
      const selected = store.data.favoriteStores.includes(id);
      const name = t(`localSettings.store.${id}`);
      const destination = publicStoreDestination(id);
      return <View key={id} testID={`store-row-${id}`}>
        <View style={ui.row}>
          <View style={ui.rowIcon}><Store color={c.primary} size={19} strokeWidth={1.7} /></View>
          <View style={styles.rowCopy}><Text style={ui.rowTitle}>{name}</Text><Text style={ui.note}>{t('localSettings.noCatalog')}</Text></View>
          <Pressable testID={`favorite-${id}`} accessibilityRole="button"
            accessibilityLabel={t(selected ? 'localSettings.removeFavorite' : 'localSettings.addFavorite', { store: name })}
            accessibilityState={{ selected, disabled }} disabled={disabled}
            onPress={() => { void store.commit(previous => ({ ...previous, favoriteStores: previous.favoriteStores.includes(id)
              ? previous.favoriteStores.filter(value => value !== id) : [...previous.favoriteStores, id] })); }}
            style={({ pressed }) => [ui.iconButton, (pressed || disabled) && styles.dim]}>
            <Star size={22} color={c.primary} fill={selected ? c.primary : 'transparent'} strokeWidth={1.7} />
          </Pressable>
        </View>
        {selected && destination && <View style={styles.destination} testID={`store-destination-${id}`}>
          <Text style={ui.note}>{t(`storePilot.${destination.kind}Help`)}</Text>
          <Button secondary label={t(`storePilot.${destination.kind}Action`, { store: name })} testID={`store-open-${id}`}
            icon={ArrowUpRight} disabled={disabled} onPress={() => { void visit(id); }} />
        </View>}
      </View>;
    })}
    <Card style={styles.storeNote}>
      <Text accessibilityRole="header" style={ui.strong}>{t('localSettings.noAgreements')}</Text>
      <Text style={[ui.note, styles.noteText]}>{t('localSettings.storesHelp')}</Text>
      <Text style={[ui.note, styles.noteText]}>{t('storePilot.priceScope')}</Text>
      <Text style={[ui.note, styles.noteText]}>{t('storePilot.externalPayment')}</Text>
      <Text style={[ui.note, styles.noteText]}>{t('storePilot.noCartTransfer')}</Text>
    </Card>
  </View>;
}

type NoticeFilter = 'all' | 'list' | 'recipes';

export function NotificationsScreen({ store, lists, mealPlan, onOpenList, onMenus }: {
  store: LocalPreferencesStore;
  lists: ShoppingList[];
  mealPlan?: MealPlan | null;
  onOpenList(id: string): void;
  onMenus(): void;
}) {
  const { t, formatNumber } = useI18n();
  const [filter, setFilter] = useState<NoticeFilter>('all');
  const disabled = store.loading || store.busy || !!store.loadError;
  const notices = !store.loading && !store.loadError
    ? deriveLocalNotices(store.data, lists, mealPlan).filter(notice => filter === 'all' || notice.kind === filter) : [];
  const filters: { value: NoticeFilter; key: string }[] = [
    { value: 'all', key: 'localSettings.all' }, { value: 'list', key: 'localSettings.lists' },
    { value: 'recipes', key: 'localSettings.recipes' },
  ];

  return <View style={ui.page} testID="notifications-screen">
    <Text accessibilityRole="header" style={styles.heading}>{t('localSettings.notifications')}</Text>
    <View style={styles.filters}>{filters.map(entry => <Pressable key={entry.value}
      testID={`notice-filter-${entry.value}`} accessibilityRole="button"
      accessibilityState={{ selected: filter === entry.value }} onPress={() => setFilter(entry.value)}
      style={({ pressed }) => [styles.filter, filter === entry.value && styles.filterSelected, pressed && styles.dim]}>
      <Text style={[styles.filterText, filter === entry.value && styles.filterTextSelected]}>{t(entry.key)}</Text>
    </Pressable>)}</View>
    <StorageFeedback store={store} />

    {!store.loading && !store.loadError && (notices.length === 0
      ? <Card style={styles.empty}>
        <Text accessibilityRole="header" style={styles.emptyTitle}>{t('localSettings.emptyTitle')}</Text>
        <Text style={[ui.body, styles.emptyText]}>{t(store.data.inAppReminders ? 'localSettings.emptyOn' : 'localSettings.emptyOff')}</Text>
      </Card>
      : <View testID="local-notices" style={styles.notices}>{notices.map(notice => <Pressable
        key={`${notice.kind}-${notice.id}`} accessibilityRole="button" testID={`notice-${notice.kind}-${notice.id}`}
        onPress={notice.kind === 'list' ? () => onOpenList(notice.id) : onMenus}
        style={({ pressed }) => [ui.row, pressed && styles.dim]}>
        <View style={ui.rowIcon}>{notice.kind === 'list' ? <ListChecks size={21} color={c.primary} /> : <Utensils size={21} color={c.primary} />}</View>
        <View style={styles.rowCopy}>
          <Text style={ui.rowTitle}>{notice.kind === 'list' ? notice.listName : t('localSettings.menuReady')}</Text>
          <Text style={ui.note}>{notice.kind === 'list'
            ? t('localSettings.listPending', { count: formatNumber(notice.pendingCount) })
            : t('localSettings.menuSummary', { count: formatNumber(notice.recipeCount), people: formatNumber(notice.servings) })}</Text>
        </View><ChevronRight color={c.primary} size={19} />
      </Pressable>)}</View>)}

    <Section title={t('localSettings.preferences')} />
    <View style={ui.row}>
      <View style={ui.rowIcon}><Bell size={21} color={c.primary} strokeWidth={1.7} /></View>
      <View style={styles.rowCopy}><Text style={ui.rowTitle}>{t('localSettings.inAppReminders')}</Text>
        <Text style={ui.note}>{t('localSettings.optional')}</Text></View>
      <Switch testID="in-app-reminders" accessibilityLabel={t('localSettings.inAppReminders')}
        accessibilityHint={t('localSettings.inAppOnly')} disabled={disabled} value={store.data.inAppReminders}
        onValueChange={value => { void store.commit(previous => ({ ...previous, inAppReminders: value })); }}
        trackColor={{ false: c.line, true: c.primary }} thumbColor={c.surface} style={styles.reminderSwitch} />
    </View>
    <Text style={[ui.note, styles.inAppHelp]}>{t('localSettings.inAppOnly')}</Text>
    <View style={ui.row} accessibilityLabel={`${t('localSettings.offers')}. ${t('localSettings.unavailable')}. ${t('localSettings.noSources')}`}>
      <View style={ui.rowIcon}><Store size={21} color={c.muted} strokeWidth={1.7} /></View>
      <View style={styles.rowCopy}><Text style={ui.rowTitle}>{t('localSettings.offers')}</Text>
        <Text style={ui.note}>{t('localSettings.noSources')}</Text></View>
      <Minus color={c.primary} size={19} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  heading: { marginTop: 18, marginBottom: 15, fontFamily: f.bold, color: c.ink, fontSize: 20, lineHeight: 28 },
  rowCopy: { flex: 1, minWidth: 0, gap: 3 },
  feedback: { marginTop: 22 },
  loading: { paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  dim: { opacity: 0.65 },
  storeNote: { backgroundColor: c.soft, marginTop: 21, paddingVertical: 20 },
  storeJourney: { gap: 9, marginVertical: 18, padding: 14, backgroundColor: c.soft, borderRadius: 15 },
  noteText: { marginTop: 9 },
  storeActions: { gap: 9, marginTop: 4 },
  destination: { gap: 10, paddingBottom: 18 },
  filters: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  filter: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: c.neutral, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  filterSelected: { backgroundColor: c.primary },
  filterText: { fontFamily: f.medium, color: c.ink, fontSize: 13, lineHeight: 21 },
  filterTextSelected: { color: c.surface },
  empty: { minHeight: 194, backgroundColor: c.soft, paddingVertical: 22, paddingHorizontal: 16, marginTop: 4, marginBottom: 14 },
  emptyTitle: { fontFamily: f.extra, fontSize: 23, lineHeight: 32, color: c.deep },
  emptyText: { marginTop: 15, color: c.muted },
  notices: { marginTop: 4, marginBottom: 14 },
  inAppHelp: { marginTop: 2, marginBottom: 15, paddingHorizontal: 2 },
  reminderSwitch: { minHeight: 44 },
});
