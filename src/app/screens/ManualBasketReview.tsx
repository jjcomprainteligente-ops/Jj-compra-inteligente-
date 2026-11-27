import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react-native';
import { quoteSingleStoreBasket } from '../../domain/basketQuote';
import { MAX_BASKET_LINES, type BasketTarget } from '../../domain/basketQuoteContracts';
import { parseAmount } from '../../domain/comparisons';
import { expenseToday } from '../../domain/expenses';
import { buildManualBasketRequest, type ManualBasketBinding } from '../../domain/manualBasket';
import type { PriceObservation } from '../../domain/priceObservations';
import type { ShoppingList } from '../../domain/shopping';
import { PILOT_STORE_IDS, type PilotStoreId } from '../../domain/stores';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Field, Notice, Pill, Section, Title, c, f, ui } from '../components/ui';
import { ManualBasketComparison, RetainedBasketSummary, snapshotManualBasketReview, type ManualBasketSnapshot } from './ManualBasketComparison';

interface Props {
  list: ShoppingList | undefined;
  observations: PriceObservation[];
  sourceSignature: string;
  onBack: () => void;
  verifyFresh: () => Promise<boolean>;
}

const cleanQuery = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
const PAGE_SIZE = 20;

/** Ephemeral, read-only review. The caller supplies a fresh local-storage check. */
export function ManualBasketReview({ list, observations, sourceSignature, onBack, verifyFresh }: Props) {
  const { t, formatQuantity, formatMoney, formatDate, formatNumber, unitLabel } = useI18n();
  const [storeName, setStoreName] = useState('');
  const [formatId, setFormatId] = useState<PilotStoreId | null>(null);
  const [channel, setChannel] = useState<BasketTarget['channel'] | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [fees, setFees] = useState('');
  const [minimum, setMinimum] = useState('');
  const [bindings, setBindings] = useState<ManualBasketBinding[]>([]);
  const [distinct, setDistinct] = useState(false);
  const [picker, setPicker] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [asOf, setAsOf] = useState(expenseToday);
  const [result, setResult] = useState<ManualBasketSnapshot | null>(null);
  const [retained, setRetained] = useState<ManualBasketSnapshot | null>(null);
  const [error, setError] = useState('');
  const [invalidated, setInvalidated] = useState(false);
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const calculating = useRef(false);
  const day = useRef(asOf);
  // Include every field, including checked products and source metadata.
  const signature = useMemo(() => JSON.stringify([sourceSignature, list, observations]), [sourceSignature, list, observations]);
  const latestSignature = useRef(signature);
  latestSignature.current = signature;
  const previousSignature = useRef(signature);
  const items = useMemo(() => list?.items.filter(item => !item.checked) ?? [], [list]);
  const options = useMemo(() => observations.map((observation, index) => ({ observation, index }))
    .filter(({ observation }) => observation.sourceKind === 'manual' && cleanQuery(
      `${observation.product} ${observation.brand} ${observation.format} ${observation.quality} ${observation.store}`,
    ).includes(cleanQuery(query))), [observations, query]);
  const visibleOptions = options.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearResult = useCallback(() => {
    ++generation.current; calculating.current = false;
    setResult(null); setError(''); setChecking(false);
  }, []);
  const clearConfirmations = useCallback(() => {
    clearResult(); setBindings(previous => previous.map(binding => ({ ...binding, confirmed: false })));
    setDistinct(false);
  }, [clearResult]);
  const invalidate = useCallback(() => {
    clearConfirmations(); setRetained(null); setInvalidated(true);
  }, [clearConfirmations]);
  const freshnessFailed = useCallback(() => { invalidate(); setError('basket.freshnessFailed'); }, [invalidate]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; ++generation.current; calculating.current = false; };
  }, []);
  useEffect(() => {
    if (previousSignature.current === signature) return;
    previousSignature.current = signature;
    invalidate(); setBindings([]); setStoreName(''); setFormatId(null); setChannel(null);
    setPostalCode(''); setFees(''); setMinimum(''); setPicker(null); setQuery(''); setPage(0);
  }, [signature, invalidate]);
  useEffect(() => {
    const refreshDay = () => {
      const today = expenseToday();
      if (today !== day.current) { day.current = today; setAsOf(today); invalidate(); }
    };
    const resumed = () => { refreshDay(); invalidate(); };
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') resumed(); });
    const timer = setInterval(refreshDay, 30_000);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', resumed); window.addEventListener('storage', resumed);
    }
    return () => {
      subscription.remove(); clearInterval(timer);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', resumed); window.removeEventListener('storage', resumed);
      }
    };
  }, [invalidate]);

  const changeTarget = (change: () => void) => { clearConfirmations(); change(); };
  const changeBinding = (itemId: string, observationId: string | null, confirmed = false) => {
    clearResult(); setDistinct(false);
    setBindings(previous => [...previous.filter(binding => binding.itemId !== itemId),
      ...(observationId === null ? [] : [{ itemId, observationId, confirmed }])]);
  };
  const back = () => { clearResult(); setRetained(null); setBindings([]); setDistinct(false); onBack(); };
  const retain = () => {
    if (!result || result.sourceSignature !== signature || result.request.asOf !== expenseToday()) return;
    setRetained(result); clearResult(); setBindings([]); setDistinct(false);
    setStoreName(''); setFormatId(null); setChannel(null); setPostalCode(''); setFees(''); setMinimum('');
    setPicker(null); setQuery(''); setPage(0);
  };
  const calculate = async () => {
    if (calculating.current) return;
    clearResult();
    if (!list) { setError('basket.error.emptyList'); return; }
    if (formatId === null || channel === null) { setError('basket.error.invalidTarget'); return; }
    let costs: { additionalCents: number | null; minimumGoodsCents: number | null };
    try {
      costs = { additionalCents: fees.trim() ? parseAmount(fees) : null,
        minimumGoodsCents: minimum.trim() ? parseAmount(minimum) : null };
    } catch { setError('basket.error.invalidCosts'); return; }
    const today = expenseToday();
    if (today !== day.current) { day.current = today; setAsOf(today); invalidate(); return; }
    const prepared = buildManualBasketRequest({ list, observations,
      target: { storeName, formatId, channel, postalCode, country: 'ES', island: 'tenerife' },
      bindings, costs, asOf: today, distinctProductsConfirmed: distinct });
    if (prepared.status === 'blocked') { setError(prepared.reason); return; }
    calculating.current = true; setChecking(true);
    const revision = generation.current;
    try {
      const fresh = await verifyFresh();
      if (!mounted.current || revision !== generation.current || signature !== latestSignature.current) return;
      if (!fresh) { freshnessFailed(); return; }
      if (expenseToday() !== today) { day.current = expenseToday(); setAsOf(day.current); invalidate(); return; }
      const quote = quoteSingleStoreBasket(prepared.request);
      if (quote.status === 'calculated') {
        setResult(snapshotManualBasketReview({ quote, request: prepared.request, sourceSignature: signature, reviewRevision: revision,
          storeName, bindings, observations, items }));
        setInvalidated(false);
      }
      else setError(quote.status === 'numeric-limit' ? 'basket.error.numericLimit' : 'basket.error.engineInput');
    } catch {
      if (mounted.current && revision === generation.current) {
        freshnessFailed();
      }
    } finally {
      if (mounted.current && revision === generation.current) { calculating.current = false; setChecking(false); }
    }
  };
  // Render guards hide stale reviews before effects run, including the midnight interval.
  const today = expenseToday();
  const currentResult = result?.sourceSignature === signature && result.request.asOf === today && result.request.asOf === asOf ? result : null;
  const currentRetained = retained?.sourceSignature === signature && retained.request.asOf === today && retained.request.asOf === asOf ? retained : null;
  const quote = currentResult?.quote ?? null;
  const retainedObservationIds = new Set(currentRetained?.bindings.map(binding => binding.observationId) ?? []);

  return <View style={ui.page}>
    <Pressable testID="basket-back" accessibilityRole="button" accessibilityLabel={t('basket.back')} onPress={back} style={styles.back}>
      <ArrowLeft size={18} color={c.primary} /><Text style={ui.link}>{t('basket.back')}</Text>
    </Pressable>
    <Title kicker={t('basket.kicker')} title={t('basket.title')} subtitle={t('basket.subtitle')} />
    <Notice title={t('basket.introTitle')} text={t('basket.introBody')} />
    {invalidated && <View testID="basket-stale"><Notice kind="warning" title={t('basket.invalidatedTitle')} text={t('basket.invalidatedBody')} /></View>}
    {list && <Card><Text style={ui.strong}>{t('basket.listLabel', { name: list.name })}</Text><Text style={ui.note}>{t('basket.itemsHint')}</Text></Card>}
    {currentRetained && <RetainedBasketSummary review={currentRetained} onDiscard={() => { setRetained(null); clearResult(); }} />}
    {items.length > MAX_BASKET_LINES ? <View style={styles.empty}><Notice kind="error" title={t('basket.errorTitle')} text={t('basket.error.lineLimit')} /></View> : !items.length ? <View style={styles.empty}><Notice title={t('basket.emptyTitle')} text={t('basket.emptyBody')} /></View> : <>
      {currentRetained && <Section title={t('comp.newReviewTitle')} />}
      <Section title={t('basket.targetTitle')} />
      <Field testID="basket-store" label={t('basket.storeLabel')} hint={t('basket.storeHint')} value={storeName} maxLength={120} editable={!checking}
        onChangeText={value => changeTarget(() => setStoreName(value))} />
      <Text style={ui.fieldLabel}>{t('basket.formatLabel')}</Text><Text style={ui.note}>{t('basket.formatHint')}</Text>
      <View style={styles.choices}>{PILOT_STORE_IDS.map(id => <Choice key={id} testID={`basket-format-${id}`} label={t(`basket.format.${id}`)} selected={formatId === id}
        disabled={checking} onPress={() => changeTarget(() => setFormatId(id))} />)}</View>
      <Text style={ui.fieldLabel}>{t('basket.channelLabel')}</Text>
      <View style={styles.choices}>{(['physical', 'online'] as const).map(value => <Choice key={value} testID={`basket-channel-${value}`} label={t(`basket.${value}`)}
        selected={channel === value} disabled={checking} onPress={() => changeTarget(() => setChannel(value))} />)}</View>
      <Field testID="basket-postal" label={t('basket.postalLabel')} hint={t('basket.postalHint')} value={postalCode} maxLength={5} inputMode="numeric" editable={!checking}
        onChangeText={value => changeTarget(() => setPostalCode(value))} />
      <Text style={ui.note}>{t('basket.scopeNote')}</Text>
      <Section title={t('basket.costsTitle')} />
      <Field testID="basket-fees" label={t('basket.feesLabel')} value={fees} placeholder={t('basket.unknownPlaceholder')} hint={t('basket.costsHint')}
        inputMode="decimal" maxLength={32} editable={!checking} onChangeText={value => { clearResult(); setFees(value); }} />
      <Field testID="basket-minimum" label={t('basket.minimumLabel')} value={minimum} placeholder={t('basket.unknownPlaceholder')} hint={t('basket.costsHint')}
        inputMode="decimal" maxLength={32} editable={!checking} onChangeText={value => { clearResult(); setMinimum(value); }} />
      <Section title={t('basket.bindingsTitle')} />
      <Text style={[ui.note, styles.help]}>{t('basket.bindingsHint')}</Text>
      {items.map((item, index) => {
        const binding = bindings.find(value => value.itemId === item.id);
        const observation = binding ? observations.find(value => value.id === binding.observationId) : undefined;
        return <Card key={`${index}:${item.id}`} style={styles.item}>
          <View style={styles.stack}>
            <Text style={ui.strong}>{item.name}</Text>
            <Text style={ui.note}>{t('basket.itemNeed', { quantity: formatQuantity(item.quantityMilli), unit: unitLabel(item.unit) })}</Text>
            <Button testID={`basket-binding-${index}`} label={t(observation ? 'basket.changeObservation' : 'basket.chooseObservation')} secondary icon={ChevronDown} disabled={checking}
              onPress={() => { setPicker(picker === index ? null : index); setQuery(''); setPage(0); }} />
            {observation ? <>
              <Pill label={t('basket.selectedObservation')} tone="neutral" />
              <ObservationDetails observation={observation} />
              <Confirmation testID={`basket-confirm-${index}`} label={t('basket.confirmBinding')} a11y={t('basket.confirmBindingA11y', { product: item.name })}
                checked={binding?.confirmed === true} disabled={checking} onPress={() => changeBinding(item.id, observation.id, !binding?.confirmed)} />
              <Button label={t('basket.clearBinding')} secondary icon={null} disabled={checking} onPress={() => changeBinding(item.id, null)} />
            </> : <Pill label={t('basket.pending')} tone="yellow" />}
            {picker === index && <View style={styles.picker}>
              <Field testID={`basket-search-${index}`} label={t('basket.searchLabel')} placeholder={t('basket.searchPlaceholder')} value={query} maxLength={120} editable={!checking}
                onChangeText={value => { setQuery(value); setPage(0); }} />
              {options.length ? <Text style={ui.note}>{t('basket.pageRange', { start: formatNumber(page * PAGE_SIZE + 1), end: formatNumber(Math.min((page + 1) * PAGE_SIZE, options.length)), total: formatNumber(options.length) })}</Text> : <Text style={ui.note}>{t('basket.noObservations')}</Text>}
              {visibleOptions.map(({ observation: option, index: originalIndex }) => <Pressable key={`${originalIndex}:${option.id}`} testID={`basket-observation-${originalIndex}`}
                accessibilityRole="button" accessibilityLabel={[
                  t('basket.selectObservationA11y', { product: option.product, store: option.store }),
                  t('basket.observationBrand', { value: option.brand }), t('basket.observationFormat', { value: option.format }),
                  t('basket.observationQuality', { value: option.quality }),
                  t('basket.observationPack', { quantity: formatQuantity(option.quantityMilli), unit: unitLabel(option.unit) }),
                  t('basket.observationPrice', { price: option.priceCents === null ? t('basket.unknownPrice') : formatMoney(option.priceCents) }),
                  t('basket.observationDate', { date: formatDate(option.observedOn) }),
                  t('basket.observationSource', { reference: option.sourceReference }), option.url,
                  retainedObservationIds.has(option.id) ? t('comp.reusedObservationA11y', { product: option.product }) : '',
                ].filter(Boolean).join('. ')} disabled={checking || retainedObservationIds.has(option.id)}
                accessibilityState={{ disabled: checking || retainedObservationIds.has(option.id) }}
                onPress={() => { if (retainedObservationIds.has(option.id)) return; changeBinding(item.id, option.id); setPicker(null); }}
                style={[styles.option, retainedObservationIds.has(option.id) && styles.disabled]}>
                <ObservationDetails observation={option} />
                {retainedObservationIds.has(option.id) && <Text style={ui.note}>{t('comp.reusedObservation')}</Text>}
              </Pressable>)}
              {page > 0 && <Button testID="basket-previous-observations" label={t('basket.previous')} secondary disabled={checking} onPress={() => setPage(value => value - 1)} />}
              {(page + 1) * PAGE_SIZE < options.length && <Button testID="basket-more-observations" label={t('basket.more')} secondary disabled={checking} onPress={() => setPage(value => value + 1)} />}
            </View>}
          </View>
        </Card>;
      })}
      <Confirmation testID="basket-distinct" label={t('basket.distinct')} checked={distinct} disabled={checking}
        onPress={() => { clearResult(); setDistinct(value => !value); }} />
      {!!error && <View testID="basket-error"><Notice kind="error" title={t('basket.errorTitle')} text={t(error)} /></View>}
      <Button testID="basket-calculate" label={t(checking ? 'basket.checking' : 'basket.calculate')} busy={checking} onPress={() => void calculate()} />
      {quote && <View testID="basket-result" accessibilityLiveRegion="polite" style={styles.result}>
        <Section title={t('basket.resultTitle')} />
        <Card style={styles.summary}>
          <Pill label={t('basket.manualBadge')} tone="yellow" />
          <Text style={ui.strong}>{storeName}</Text>
          <Text style={ui.note}>{t('basket.resultDate', { date: formatDate(quote.asOf) })}</Text>
          <Text testID="basket-coverage" style={ui.strong}>{t('basket.coverage', { priced: formatNumber(quote.coverage.numerator), total: formatNumber(quote.coverage.denominator) })}</Text>
          <Text testID="basket-known-subtotal" style={styles.amount}>{t('basket.knownSubtotal', { price: formatMoney(quote.knownGoodsSubtotalCents) })}</Text>
          <Text style={ui.note}>{t('basket.subtotalHint')}</Text>
          {quote.goodsOutlayCents !== null && <Text testID="basket-goods-outlay" style={ui.strong}>{t('basket.goodsOutlay', { price: formatMoney(quote.goodsOutlayCents) })}</Text>}
          {quote.payableTotalCents !== null ? <Text testID="basket-payable" style={ui.strong}>{t('basket.payable', { price: formatMoney(quote.payableTotalCents) })}</Text> : <Text testID="basket-no-total" style={ui.strong}>{t('basket.noTotal')}</Text>}
          {quote.qualificationIssues.map(issue => <Text key={issue} testID={`basket-issue-${issue}`} style={ui.note}>{t(`basket.issue.${issue}`)}</Text>)}
        </Card>
        {quote.lines.map((line, index) => <Card key={line.id} style={styles.item}>
          <View testID={`basket-line-${index}`} style={styles.stack}>
            <Text style={ui.strong}>{items[index]?.name}</Text>
            {line.status === 'quoted' ? <>
              <Text testID={`basket-packs-${index}`} style={ui.body}>{t('basket.packages', { count: formatNumber(line.packages) })}</Text>
              <Text testID={`basket-outlay-${index}`} style={ui.body}>{t('basket.lineOutlay', { price: formatMoney(line.goodsOutlayCents) })}</Text>
              <Text testID={`basket-consumed-${index}`} style={ui.note}>{t('basket.consumed', { price: formatMoney(line.consumedCostCents) })}</Text>
              <Text testID={`basket-leftover-${index}`} style={ui.note}>{t('basket.leftover', { quantity: formatQuantity(line.leftoverBaseMilli), unit: unitLabel(line.baseUnit) })}</Text>
            </> : <Text style={ui.body}>{t('basket.pendingLine', { reasons: line.reasons.map(reason => t(`basket.reason.${reason}`)).join(' · ') })}</Text>}
          </View>
        </Card>)}
        {quote.excludedOffers.length > 0 && <>
          <Section title={t('basket.excludedTitle')} />
          {quote.excludedOffers.map(excluded => {
            const index = quote.lines.findIndex(line => line.id === excluded.lineId);
            return <Text key={`${excluded.lineId}:${excluded.offerId}`} style={[ui.note, styles.help]}>{t('basket.excludedLine', { product: items[index]?.name ?? '', reason: t(`basket.reason.${excluded.reason}`) })}</Text>;
          })}
        </>}
        <Notice title={t('basket.manualBadge')} text={t('basket.rightsNote')} />
        {!currentRetained && <Button testID="basket-retain" label={t('comp.retain')} secondary onPress={retain} />}
      </View>}
      {currentRetained && currentResult && <ManualBasketComparison key={`${currentRetained.reviewRevision}:${currentResult.reviewRevision}`}
        first={currentRetained} second={currentResult}
        sourceSignature={signature} verifyFresh={verifyFresh} onFreshnessFailure={freshnessFailed} />}
    </>}
    <Text style={[ui.note, styles.closeNote]}>{t('basket.closeNote')}</Text>
  </View>;
}

function ObservationDetails({ observation }: { observation: PriceObservation }) {
  const { t, formatQuantity, formatMoney, formatDate, unitLabel } = useI18n();
  return <View style={styles.details}>
    <Text style={ui.strong}>{t('basket.observationProduct', { value: observation.product })}</Text>
    <Text style={ui.note}>{t('basket.observationBrand', { value: observation.brand })}</Text>
    <Text style={ui.note}>{t('basket.observationFormat', { value: observation.format })}</Text>
    <Text style={ui.note}>{t('basket.observationQuality', { value: observation.quality })}</Text>
    <Text style={ui.note}>{t('basket.observationStore', { value: observation.store })}</Text>
    <Text style={ui.body}>{t('basket.observationPack', { quantity: formatQuantity(observation.quantityMilli), unit: unitLabel(observation.unit) })}</Text>
    <Text style={ui.body}>{t('basket.observationPrice', { price: observation.priceCents === null ? t('basket.unknownPrice') : formatMoney(observation.priceCents) })}</Text>
    <Text style={ui.note}>{t('basket.observationDate', { date: formatDate(observation.observedOn) })}</Text>
    <Text style={ui.note}>{t('basket.observationSource', { reference: observation.sourceReference })}</Text>
    {!!observation.url && <Text style={ui.note}>{observation.url}</Text>}
  </View>;
}

function Choice({ testID, label, selected, disabled, onPress }: { testID: string; label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled}
    onPress={onPress} style={[styles.choice, selected && styles.selected, disabled && styles.disabled]}><Text style={[styles.choiceText, selected && styles.selectedText]}>{label}</Text></Pressable>;
}

function Confirmation({ testID, label, a11y, checked, disabled, onPress }: { testID: string; label: string; a11y?: string; checked: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable testID={testID} accessibilityRole="checkbox" accessibilityLabel={a11y ? `${a11y}. ${label}` : label} accessibilityState={{ checked, disabled }} aria-checked={checked} disabled={disabled}
    onPress={onPress} style={[styles.confirmation, disabled && styles.disabled]}>
    <View style={[styles.checkbox, checked && styles.selected]}>{checked && <Check size={18} color="#fff" />}</View><Text style={[ui.note, styles.confirmText]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 6 },
  empty: { marginTop: 18 }, help: { marginBottom: 16 }, closeNote: { marginTop: 20 },
  stack: { gap: 12 }, item: { marginBottom: 14 }, details: { gap: 5 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 22 },
  choice: { minHeight: 44, maxWidth: '100%', paddingHorizontal: 13, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#748268', backgroundColor: '#fff', justifyContent: 'center' },
  choiceText: { fontFamily: f.semi, fontSize: 13, lineHeight: 20, color: c.deep },
  selected: { backgroundColor: c.deep, borderColor: c.deep }, selectedText: { color: '#fff' }, disabled: { opacity: .6 },
  confirmation: { minHeight: 44, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13, marginBottom: 12 },
  checkbox: { width: 25, height: 25, borderRadius: 6, borderWidth: 1, borderColor: c.primary, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  confirmText: { flex: 1, color: c.ink }, picker: { gap: 12, paddingTop: 15, borderTopWidth: 1, borderTopColor: c.line },
  option: { minHeight: 44, padding: 14, borderRadius: 12, backgroundColor: c.neutral, borderWidth: 1, borderColor: c.line },
  result: { marginTop: 7 }, summary: { gap: 13, marginBottom: 16, backgroundColor: '#F1F4E7' },
  amount: { fontFamily: f.extra, color: c.deep, fontSize: 22, lineHeight: 31, letterSpacing: -.5 },
});
