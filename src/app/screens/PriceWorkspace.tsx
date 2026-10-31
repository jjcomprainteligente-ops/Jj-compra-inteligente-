import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, FileText, Pencil, Plus, Scale, Trash2 } from 'lucide-react-native';
import { createId } from '../../domain/comparisons';
import {
  compareObservations, normalizedPrice, observationStatus, todayISO,
  validateObservationInput, validatePriceObservation,
  type ObservationInput, type PriceObservation,
} from '../../domain/priceObservations';
import { UNITS, formatQuantity as canonicalQuantity } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import type { usePriceObservations } from '../usePriceObservations';
import { Button, Card, Field, IconButton, Notice, Pill, Section, Sheet, Title, c, f, ui } from '../components/ui';

interface Props { onBack: () => void; onLegacy: () => void; store: ReturnType<typeof usePriceObservations> }
type Panel = { kind: 'form'; id?: string } | { kind: 'reference' } | { kind: 'delete'; observation: PriceObservation };
const cleanQuery = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
const message = (failure: unknown) => failure instanceof Error ? failure.message : 'prices.actionFailed';
const matchesSearch = (observation: PriceObservation, value: string) =>
  cleanQuery(`${observation.product} ${observation.brand} ${observation.store}`).includes(cleanQuery(value));

function newInput(reference?: PriceObservation, quantityLabel = canonicalQuantity): ObservationInput {
  return {
    product: reference?.product ?? '', brand: reference?.brand ?? '', format: reference?.format ?? '',
    quality: reference?.quality ?? '', store: '', quantity: reference ? quantityLabel(reference.quantityMilli) : '1',
    unit: reference?.unit ?? 'kg', price: '', observedOn: todayISO(), sourceKind: 'manual', sourceReference: '', url: '',
  };
}

function observationInput(observation: PriceObservation, quantityLabel: (milli: number) => string,
  amountLabel: (cents: number | null) => string): ObservationInput {
  return {
    product: observation.product, brand: observation.brand, format: observation.format, quality: observation.quality,
    store: observation.store, quantity: quantityLabel(observation.quantityMilli), unit: observation.unit,
    price: amountLabel(observation.priceCents), observedOn: observation.observedOn,
    sourceKind: observation.sourceKind, sourceReference: observation.sourceReference, url: observation.url ?? '',
  };
}

/** Local, attributed observations. It never reads or writes shopping lists or menus. */
export function PriceWorkspace({ onBack, onLegacy, store }: Props) {
  const { t, formatMoney, formatMoneyInput, formatQuantity, formatNumber, translateError, unitLabel } = useI18n();
  const localMessage = (value: string) => value.startsWith('prices.') ? t(value) : translateError(value);
  const [today, setToday] = useState(() => todayISO());
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [draft, setDraft] = useState<ObservationInput>(() => newInput());
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [query, setQuery] = useState('');
  const [referenceQuery, setReferenceQuery] = useState('');
  const [limit, setLimit] = useState(20);
  const [visitError, setVisitError] = useState('');
  const original = useRef('');
  const actionLock = useRef(false);
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    const timer = setInterval(refresh, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, []);
  useEffect(() => {
    // Keep the displayed reference stable when it ages. Only initialize or
    // replace a reference that no longer exists after a load or deletion.
    if (store.observations.length && !store.observations.some(observation => observation.id === referenceId)) {
      setReferenceId((store.observations.find(observation => observationStatus(observation, today) === 'manual') ?? store.observations[0]).id);
    }
  }, [store.observations, referenceId, today]);
  const reference = useMemo(() => store.observations.find(observation => observation.id === referenceId) ??
    store.observations.find(observation => observationStatus(observation, today) === 'manual') ?? store.observations[0],
  [store.observations, referenceId, today]);
  const report = useMemo(() => reference ? compareObservations(store.observations, reference.id, today) : null,
    [store.observations, reference, today]);
  const disabled = store.busy || store.loading || !!store.loadError;
  const filtered = useMemo(() => store.observations.filter(observation => matchesSearch(observation, query)), [store.observations, query]);
  const referenceOptions = useMemo(() => store.observations.filter(observation => matchesSearch(observation, referenceQuery)), [store.observations, referenceQuery]);
  const update = (change: Partial<ObservationInput>) => { if (!store.busy) { setDraft(previous => ({ ...previous, ...change })); setError(''); setAttempted(false); } };

  const openForm = (observation?: PriceObservation) => {
    if (disabled) return;
    const value = observation ? observationInput(observation, formatQuantity, formatMoneyInput) : newInput(reference, formatQuantity);
    setDraft(value); original.current = JSON.stringify(value); setPanel({ kind: 'form', id: observation?.id });
    setError(''); setAttempted(false); setDiscard(false);
  };
  const close = () => {
    if (store.busy) return;
    if (panel?.kind === 'form' && JSON.stringify(draft) !== original.current && !discard) { setDiscard(true); return; }
    setPanel(null); setDiscard(false); setError(''); setAttempted(false);
  };
  const save = async () => {
    if (panel?.kind !== 'form' || actionLock.current || store.busy) return;
    setError(''); setAttempted(false);
    try {
      const valid = validateObservationInput(draft);
      const id = panel.id ?? createId();
      actionLock.current = true; setAttempted(true);
      const ok = await store.commit(previous => {
        if (panel.id && !previous.some(observation => observation.id === panel.id)) throw new Error('prices.missingObservation');
        const observation = { ...valid, id };
        return panel.id ? previous.map(entry => entry.id === id ? observation : entry) : [...previous, observation];
      });
      if (ok) { setReferenceId(id); setPanel(null); setDiscard(false); }
    } catch (failure) { setError(message(failure)); }
    finally { actionLock.current = false; }
  };
  const confirmDelete = (observation: PriceObservation) => {
    if (disabled) return;
    setPanel({ kind: 'delete', observation }); setError(''); setAttempted(false); setDiscard(false);
  };
  const remove = async () => {
    if (panel?.kind !== 'delete' || actionLock.current || store.busy) return;
    actionLock.current = true; setAttempted(true); setError('');
    try {
      if (await store.commit(previous => previous.filter(observation => observation.id !== panel.observation.id), 'prices.deleted')) setPanel(null);
    } finally { actionLock.current = false; }
  };
  const visit = async (observation: PriceObservation) => {
    setVisitError('');
    try {
      const checked = validatePriceObservation(observation);
      if (!checked.url) throw new Error('prices.openSourceError');
      await Linking.openURL(checked.url);
    } catch { setVisitError('prices.openSourceError'); }
  };
  const title = discard ? t('prices.discardTitle') : panel?.kind === 'form' ? panel.id ? t('prices.editTitle') : t('prices.add') :
    panel?.kind === 'reference' ? t('prices.referenceTitle') : panel?.kind === 'delete' ? t('prices.deleteTitle') : '';
  const panelError = error || (attempted ? store.saveError : '');

  return <View style={ui.page}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('prices.back')} disabled={store.busy} onPress={onBack} style={styles.back}>
      <ArrowLeft color={c.primary} size={18} /><Text style={ui.link}>{t('prices.back')}</Text>
    </Pressable>
    <Title kicker={t('prices.kicker')} title={t('prices.title')} subtitle={t('prices.subtitle')} />
    {store.loading ? <Card style={styles.loading}><ActivityIndicator color={c.primary} /><Text style={ui.body}>{t('prices.loading')}</Text></Card> : store.loadError ? <>
      <Notice kind="error" title={t('prices.loadErrorTitle')} text={localMessage(store.loadError)} action={t('prices.reload')} onPress={() => void store.reload()} />
      <Button label={t('prices.continueSavings')} onPress={onBack} />
    </> : <>
      <Button label={t('prices.add')} testID="add-observation" disabled={disabled} icon={Plus} onPress={() => openForm()} />
      <View style={{ marginTop: 18 }}><Notice title={t('prices.noSourcesTitle')}
        text={t('prices.noSourcesBody')} /></View>
      {!!store.saveError && !panel && <Notice kind="error" title={t('prices.saveErrorTitle')} text={localMessage(store.saveError)} />}
      {!!visitError && <Notice kind="error" title={t('prices.openSourceTitle')} text={localMessage(visitError)} />}
      {store.undo && <Notice kind="success" title={localMessage(store.undo.label)} text={t('prices.undoBody')}
        action={t('prices.undo')} onPress={() => { if (!store.busy) void store.undoLast(); }} />}
      {reference && report ? <>
        <Section title={t('prices.comparisonTitle')} />
        <Pressable testID="comparison-reference" accessibilityRole="button" accessibilityLabel={t('prices.chooseReference')} disabled={disabled}
          onPress={() => { setReferenceQuery(''); setPanel({ kind: 'reference' }); setError(''); setAttempted(false); }} style={styles.reference}>
          <View style={{ flex: 1, gap: 7 }}><Text style={ui.kicker}>{t('prices.declaredReference')}</Text><Text style={ui.strong}>{reference.product} · {reference.brand}</Text>
            <Text style={ui.note}>{reference.format} · {reference.quality}</Text><Text style={ui.note}>{reference.store} · {formatQuantity(reference.quantityMilli)} {unitLabel(reference.unit)}</Text></View>
          <ChevronDown size={21} color={c.primary} />
        </Pressable>
        <Text style={[ui.note, { marginTop: 12, marginBottom: 16 }]}>{t('prices.identityNotice')}</Text>
        {report.warning && <Notice kind="warning" title={t('prices.insufficientComparison')} text={translateError(report.warning)} />}
        {report.ranked.length === 1 && <Notice title={t('prices.oneComparableTitle')} text={t('prices.oneComparableBody')} />}
        {report.ranked.length > 0 && <>
          <Text accessibilityRole="header" style={[ui.sectionTitle, { marginBottom: 13 }]}>{t('prices.unitAmounts')}</Text>
          {report.ranked.map(observation => {
            const price = normalizedPrice(observation);
            const best = report.ranked.length > 1 && report.bestIds.includes(observation.id);
            return <Card key={observation.id} style={[styles.resultCard, best && styles.bestCard]}>
              <View testID="comparison-result" style={{ gap: 10 }}>
                <View style={styles.between}><Text style={[ui.strong, { flex: 1 }]}>{observation.store}</Text><Status observation={observation} today={today} /></View>
                <Text testID="normalized-price" style={styles.unitPrice}>{price ? `${formatMoney(price.cents)} ${price.unitLabel === '€/ud' ? `/${unitLabel('ud')}` : price.unitLabel.replace('€', '').trim()}` : t('prices.noPrice')}</Text>
                <Text style={ui.note}>{observation.priceCents === null ? t('prices.pendingPrice') : t('prices.packagePrice', { price: formatMoney(observation.priceCents) })} · {formatQuantity(observation.quantityMilli)} {unitLabel(observation.unit)}</Text>
                {best && <Pill label={report.bestIds.length > 1 ? t('prices.bestTie') : t('prices.best')} />}
                <Source observation={observation} />
                {observation.url && <SourceButton observation={observation} onPress={() => void visit(observation)} />}
              </View>
            </Card>;
          })}
          <Text style={ui.note}>{t('prices.roundingNotice')}</Text>
        </>}
        {report.excluded.length > 0 && <>
          <Section title={t('prices.excludedTitle', { count: formatNumber(report.excluded.length) })} />
          {report.excluded.slice(0, 20).map(({ observation, reason }) => <Card key={observation.id} style={styles.resultCard}>
            <View testID="excluded-observation" style={{ gap: 9 }}><View style={styles.between}><Text style={[ui.strong, { flex: 1 }]}>{observation.product} · {observation.store}</Text><Status observation={observation} today={today} /></View>
              <Text style={ui.body}>{translateError(reason)}</Text><Source observation={observation} /></View>
          </Card>)}
          {report.excluded.length > 20 && <Text style={ui.note}>{t('prices.excludedLimit')}</Text>}
        </>}
      </> : <Card style={styles.empty}>
        <Scale size={37} color={c.primary} /><Text style={styles.emptyTitle}>{t('prices.emptyTitle')}</Text>
        <Text style={[ui.note, { textAlign: 'center' }]}>{t('prices.emptyBody')}</Text>
      </Card>}

      <Section title={t('prices.savedTitle', { count: formatNumber(store.observations.length) })} />
      {store.observations.length > 0 && <>
        <Field label={t('prices.searchLabel')} value={query} onChangeText={value => { setQuery(value); setLimit(20); }} maxLength={120} placeholder={t('prices.searchPlaceholder')} hint={t('prices.searchHint')} />
        {filtered.length === 0 && <Notice title={t('prices.noMatchesTitle')} text={t('prices.noMatchesBody')} />}
        {filtered.slice(0, limit).map(observation => <Card key={observation.id} style={styles.savedCard}>
          <View testID="observation-card" style={{ gap: 11 }}>
            <View style={styles.between}><Text style={[ui.strong, { flex: 1 }]}>{observation.product}</Text><Status observation={observation} today={today} /></View>
            <Text style={ui.body}>{observation.store} · {observation.brand}</Text><Text style={ui.note}>{observation.format} · {observation.quality}</Text>
            <Text style={ui.strong}>{observation.priceCents === null ? t('prices.noPrice') : formatMoney(observation.priceCents)} · {formatQuantity(observation.quantityMilli)} {unitLabel(observation.unit)}</Text>
            <Source observation={observation} />
            {observation.url && <SourceButton observation={observation} onPress={() => void visit(observation)} />}
            <View style={styles.savedActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('prices.useReference', { product: observation.product, store: observation.store })} disabled={disabled} onPress={() => setReferenceId(observation.id)} style={styles.textAction}><Scale size={17} color={c.primary} /><Text style={ui.link}>{t('prices.compare')}</Text></Pressable>
              <View style={styles.inline}><IconButton label={t('prices.editObservation', { store: observation.store })} icon={Pencil} disabled={disabled} onPress={() => openForm(observation)} />
                <IconButton label={t('prices.deleteObservation', { store: observation.store })} icon={Trash2} danger disabled={disabled} onPress={() => confirmDelete(observation)} /></View>
            </View>
          </View>
        </Card>)}
        {filtered.length > limit && <Button label={t('prices.more')} secondary onPress={() => setLimit(previous => previous + 20)} />}
      </>}
    </>}
    <Section title={t('prices.legacyTitle')} />
    <Text style={[ui.note, { marginBottom: 16 }]}>{t('prices.legacyBody')}</Text>
    <Button label={t('prices.openLegacy')} secondary icon={FileText} onPress={onLegacy} disabled={store.busy} />

    <Sheet visible={!!panel} title={title} onClose={close} busy={store.busy} testID="price-sheet"
      footer={!discard && panel?.kind === 'form' ? <Button label={t('prices.save')} testID="save-observation" busy={store.busy} icon={Check} onPress={() => void save()} /> : undefined}>
      {discard ? <View style={{ gap: 16 }}><Text style={ui.body}>{t('prices.unsavedChanges')}</Text><Button label={t('prices.keepEditing')} onPress={() => setDiscard(false)} /><Button label={t('prices.discard')} danger onPress={() => { setPanel(null); setDiscard(false); setError(''); }} /></View> : <>
        {!!panelError && <Notice kind="error" title={attempted && store.saveError ? t('prices.saveErrorTitle') : t('prices.reviewValue')} text={localMessage(panelError)} />}
        {panel?.kind === 'form' ? <>
          <Text style={[ui.note, { marginBottom: 20 }]}>{t('prices.formNotice')}</Text>
          <Field label={t('prices.productLabel')} value={draft.product} maxLength={120} editable={!store.busy} onChangeText={value => update({ product: value })} autoFocus placeholder={t('prices.productPlaceholder')} />
          <Field label={t('prices.brandLabel')} value={draft.brand} maxLength={80} editable={!store.busy} onChangeText={value => update({ brand: value })} hint={t('prices.brandHint')} />
          <Field label={t('prices.formatLabel')} value={draft.format} maxLength={80} editable={!store.busy} onChangeText={value => update({ format: value })} placeholder={t('prices.formatPlaceholder')} hint={t('prices.formatHint')} />
          <Field label={t('prices.qualityLabel')} value={draft.quality} maxLength={120} editable={!store.busy} onChangeText={value => update({ quality: value })} placeholder={t('prices.qualityPlaceholder')} hint={t('prices.qualityHint')} />
          <Field label={t('prices.storeLabel')} value={draft.store} maxLength={120} editable={!store.busy} onChangeText={value => update({ store: value })} />
          <Field label={t('prices.quantityLabel')} value={draft.quantity} maxLength={32} editable={!store.busy} inputMode="decimal" onChangeText={value => update({ quantity: value })} hint={t('prices.quantityHint')} />
          <Text style={ui.fieldLabel}>{t('prices.contentUnit')}</Text><View style={styles.choices}>{UNITS.map(unit => <Choice key={unit} label={unitLabel(unit)} a11y={t('prices.unitChoice', { unit: unitLabel(unit) })} selected={draft.unit === unit} disabled={store.busy} onPress={() => update({ unit })} />)}</View>
          <Field label={t('prices.priceLabel')} value={draft.price} maxLength={32} editable={!store.busy} inputMode="decimal" onChangeText={value => update({ price: value })} placeholder={t('prices.optional')} hint={t('prices.priceHint')} />
          <Field label={t('prices.dateLabel')} value={draft.observedOn} maxLength={10} editable={!store.busy} onChangeText={value => update({ observedOn: value })} placeholder={t('prices.datePlaceholder')} hint={t('prices.dateHint')} />
          <Text style={ui.fieldLabel}>{t('prices.sourceKind')}</Text><View style={styles.choices}>
            <Choice label={t('prices.sourceManual')} a11y={t('prices.sourceManual')} selected={draft.sourceKind === 'manual'} disabled={store.busy} onPress={() => update({ sourceKind: 'manual' })} />
            <Choice label={t('prices.sourceDemo')} a11y={t('prices.sourceDemo')} selected={draft.sourceKind === 'demo'} disabled={store.busy} onPress={() => update({ sourceKind: 'demo' })} />
            <Choice label={t('prices.sourceUnknown')} a11y={t('prices.sourceUnknown')} selected={draft.sourceKind === 'unknown'} disabled={store.busy} onPress={() => update({ sourceKind: 'unknown' })} />
          </View>
          <Field label={t('prices.sourceLabel')} value={draft.sourceReference} maxLength={300} editable={!store.busy} multiline onChangeText={value => update({ sourceReference: value })} placeholder={t('prices.sourcePlaceholder')} hint={t('prices.sourceHint')} />
          <Field label={t('prices.urlLabel')} value={draft.url} maxLength={2048} editable={!store.busy} inputMode="url" autoCapitalize="none" autoCorrect={false} onChangeText={value => update({ url: value })} hint={t('prices.urlHint')} />
        </> : panel?.kind === 'reference' ? <>
          <Text style={[ui.note, { marginBottom: 18 }]}>{t('prices.referenceHelp')}</Text>
          <Field label={t('prices.referenceSearch')} value={referenceQuery} maxLength={120} onChangeText={setReferenceQuery} placeholder={t('prices.searchPlaceholder')} />
          <View style={{ gap: 12 }}>{referenceOptions.slice(0, 50).map(observation => <Button key={observation.id} label={t('prices.compareFrom', { product: observation.product, store: observation.store })} secondary={observation.id !== reference?.id} disabled={store.busy}
            onPress={() => { setReferenceId(observation.id); setPanel(null); }} />)}</View>
          {referenceOptions.length > 50 && <Text style={[ui.note, { marginTop: 14 }]}>{t('prices.referenceLimit')}</Text>}
          {referenceOptions.length === 0 && <Notice title={t('prices.noReferencesTitle')} text={t('prices.noReferencesBody')} />}
        </> : panel?.kind === 'delete' ? <View style={{ gap: 17 }}>
          <Text style={ui.body}>{t('prices.deleteBody', { product: panel.observation.product, store: panel.observation.store })}</Text>
          <Button label={t('prices.delete')} danger busy={store.busy} onPress={() => void remove()} /><Button label={t('prices.keep')} secondary disabled={store.busy} onPress={close} />
        </View> : null}
      </>}
    </Sheet>
  </View>;
}

function Status({ observation, today }: { observation: PriceObservation; today: string }) {
  const { t } = useI18n();
  const status = observationStatus(observation, today);
  const label = status === 'manual' ? t('prices.statusManual') : status === 'stale' ? t('prices.statusStale') : status === 'demo' ? t('prices.sourceDemo') : observation.priceCents === null ? t('prices.noPrice') : observation.observedOn > today ? t('prices.statusReviewDate') : t('prices.statusUnverified');
  return <Pill label={label} tone={status === 'stale' || status === 'demo' ? 'yellow' : status === 'unknown' ? 'neutral' : 'green'} />;
}

function Source({ observation }: { observation: PriceObservation }) {
  const { t, formatDate } = useI18n();
  return <View style={{ gap: 4 }}><Text style={ui.note}>{t('prices.observedOn', { date: formatDate(observation.observedOn), store: observation.store })}</Text><Text style={ui.note}>{t('prices.sourceReference', { reference: observation.sourceReference })}</Text></View>;
}

function SourceButton({ observation, onPress }: { observation: PriceObservation; onPress: () => void }) {
  const { t } = useI18n();
  return <Pressable accessibilityRole="button" accessibilityLabel={t('prices.openSourceA11y', { store: observation.store })} onPress={onPress} style={styles.textAction}><Text style={ui.link}>{t('prices.openSource')}</Text><ArrowUpRight size={17} color={c.primary} /></Pressable>;
}

function Choice({ label, a11y, selected, disabled, onPress }: { label: string; a11y: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled} onPress={onPress}
    style={[styles.choice, selected && { backgroundColor: c.deep, borderColor: c.deep }, disabled && { opacity: .6 }]}><Text style={[styles.choiceText, selected && { color: '#fff' }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 6 },
  loading: { minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: 17 },
  empty: { alignItems: 'center', gap: 17, paddingVertical: 27 }, emptyTitle: { fontFamily: f.extra, color: c.deep, fontSize: 23, lineHeight: 31, letterSpacing: -.7, textAlign: 'center' },
  reference: { padding: 17, backgroundColor: '#F8EDCA', borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  resultCard: { marginBottom: 13 }, bestCard: { backgroundColor: '#F1F4E7', borderColor: '#A5B58F' },
  unitPrice: { fontFamily: f.extra, color: c.deep, fontSize: 28, lineHeight: 37, letterSpacing: -.8 },
  savedCard: { marginBottom: 15 }, savedActions: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 2, paddingTop: 7, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 }, textAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', flexShrink: 1 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9, marginBottom: 23 },
  choice: { minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#748268', backgroundColor: '#fff', justifyContent: 'center' },
  choiceText: { fontFamily: f.semi, fontSize: 13, lineHeight: 20, color: c.deep },
});
