import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { BasketQuote, BasketQuoteRequest } from '../../domain/basketQuoteContracts';
import { expenseToday } from '../../domain/expenses';
import type { ManualBasketBinding } from '../../domain/manualBasket';
import { compareManualBasketRequests, type ManualBasketComparison as Comparison } from '../../domain/manualBasketComparison';
import type { PriceObservation } from '../../domain/priceObservations';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Notice, Pill, Section, c, f, ui } from '../components/ui';

/** A detached in-memory review. The validated request is already deeply frozen. */
export interface ManualBasketSnapshot {
  readonly request: BasketQuoteRequest;
  readonly quote: BasketQuote;
  readonly sourceSignature: string;
  readonly reviewRevision: number;
  readonly storeName: string;
  readonly bindings: readonly Readonly<ManualBasketBinding>[];
  readonly observations: readonly Readonly<PriceObservation>[];
  readonly items: readonly { readonly id: string; readonly name: string }[];
}

export function snapshotManualBasketReview(input: ManualBasketSnapshot): ManualBasketSnapshot {
  const ids = new Set(input.bindings.map(binding => binding.observationId));
  return Object.freeze({
    request: input.request, quote: input.quote, sourceSignature: input.sourceSignature,
    reviewRevision: input.reviewRevision, storeName: input.storeName,
    bindings: Object.freeze(input.bindings.map(binding => Object.freeze({ ...binding }))),
    observations: Object.freeze(input.observations.filter(observation => ids.has(observation.id))
      .map(observation => Object.freeze({ ...observation }))),
    items: Object.freeze(input.items.map(item => Object.freeze({ id: item.id, name: item.name }))),
  });
}

const normalizeDestination = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
const destination = (review: ManualBasketSnapshot) => JSON.stringify([
  normalizeDestination(review.storeName), review.request.target.formatId,
  review.request.target.channel, review.request.target.postalCode,
]);

export function RetainedBasketSummary({ review, onDiscard }: { review: ManualBasketSnapshot; onDiscard: () => void }) {
  const { t, formatMoney, formatNumber } = useI18n();
  return <View testID="basket-retained" style={styles.retained}>
    <Card style={styles.summary}>
      <Pill label={t('comp.optionA')} tone="neutral" />
      <Text accessibilityRole="header" style={ui.strong}>{t('comp.retainedTitle')}</Text>
      <TargetDetails review={review} />
      <Text style={ui.strong}>{t('basket.coverage', { priced: formatNumber(review.quote.coverage.numerator), total: formatNumber(review.quote.coverage.denominator) })}</Text>
      <Text style={ui.body}>{t('basket.knownSubtotal', { price: formatMoney(review.quote.knownGoodsSubtotalCents) })}</Text>
      <Text style={ui.note}>{t('comp.retainedBody')}</Text>
      <Button testID="basket-discard-retained" label={t('comp.discard')} accessibilityLabel={t('comp.discardA11y')} secondary icon={null} onPress={onDiscard} />
    </Card>
  </View>;
}

interface Props {
  first: ManualBasketSnapshot;
  second: ManualBasketSnapshot;
  sourceSignature: string;
  verifyFresh: () => Promise<boolean>;
  onFreshnessFailure: () => void;
}

/** Cross-store attestations are separate from each review's original bindings. */
export function ManualBasketComparison({ first, second, sourceSignature, verifyFresh, onFreshnessFailure }: Props) {
  const { t, formatMoney } = useI18n();
  const [confirmedLineIds, setConfirmedLineIds] = useState<string[]>([]);
  const [storesConfirmed, setStoresConfirmed] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const mounted = useRef(true);
  const revision = useRef(0);
  const busy = useRef(false);
  const latestSignature = useRef(sourceSignature);
  latestSignature.current = sourceSignature;
  const latestReviews = useRef({ first, second });
  latestReviews.current = { first, second };
  const stateContext = useRef({ first, second, sourceSignature });
  const currentContext = stateContext.current.first === first && stateContext.current.second === second
    && stateContext.current.sourceSignature === sourceSignature;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; ++revision.current; busy.current = false; };
  }, []);
  useEffect(() => {
    // Also reset when consumed outside the parent's revision-keyed panel.
    stateContext.current = { first, second, sourceSignature };
    ++revision.current; busy.current = false; setChecking(false);
    setConfirmedLineIds([]); setStoresConfirmed(false); setComparison(null); setError('');
  }, [first, second, sourceSignature]);

  const clearComparison = () => { ++revision.current; busy.current = false; setChecking(false); setComparison(null); setError(''); };
  const compare = async () => {
    if (busy.current) return;
    clearComparison();
    busy.current = true; setChecking(true);
    const generation = revision.current;
    const day = expenseToday();
    try {
      const fresh = await verifyFresh();
      if (!mounted.current || generation !== revision.current || sourceSignature !== latestSignature.current
        || latestReviews.current.first !== first || latestReviews.current.second !== second) return;
      if (!fresh || first.sourceSignature !== sourceSignature || second.sourceSignature !== sourceSignature
        || first.request.asOf !== day || second.request.asOf !== day || expenseToday() !== day) {
        onFreshnessFailure(); return;
      }
      if (destination(first) === destination(second)) { setError('comp.error.sameDestination'); return; }
      const firstIds = new Set(first.bindings.map(binding => binding.observationId));
      if (second.bindings.some(binding => firstIds.has(binding.observationId))) { setError('comp.error.reusedObservation'); return; }
      const result = compareManualBasketRequests({ first: first.request, second: second.request,
        confirmedLineIds, differentStoresConfirmed: storesConfirmed });
      if (result.status === 'compared') setComparison(result);
      else setError(result.status === 'numeric-limit' ? 'comp.error.numericLimit' : 'comp.error.invalidInput');
    } catch {
      if (mounted.current && generation === revision.current && sourceSignature === latestSignature.current
        && latestReviews.current.first === first && latestReviews.current.second === second) onFreshnessFailure();
    } finally {
      if (mounted.current && generation === revision.current && sourceSignature === latestSignature.current
        && latestReviews.current.first === first && latestReviews.current.second === second) { busy.current = false; setChecking(false); }
    }
  };

  // Prop replacement cannot expose the previous review's checks or outcome before effects.
  if (!currentContext) return null;
  return <View testID="basket-comparison" style={styles.panel}>
    <Section title={t('comp.title')} />
    <Notice title={t('basket.manualBadge')} text={t('comp.intro')} />
    <BasketSummary review={first} side="first" />
    <BasketSummary review={second} side="second" />
    <Section title={t('comp.crossTitle')} />
    {first.items.map((item, index) => {
      const firstBinding = first.bindings.find(binding => binding.itemId === item.id);
      const secondBinding = second.bindings.find(binding => binding.itemId === item.id);
      const firstObservation = first.observations.find(observation => observation.id === firstBinding?.observationId);
      const secondObservation = second.observations.find(observation => observation.id === secondBinding?.observationId);
      const enabled = firstBinding?.confirmed === true && secondBinding?.confirmed === true
        && firstObservation?.sourceKind === 'manual' && secondObservation?.sourceKind === 'manual';
      const lineId = `item-${index}`;
      return <Card key={lineId} style={styles.line}>
        <Text accessibilityRole="header" style={ui.strong}>{t('comp.lineTitle', { product: item.name })}</Text>
        <ComparisonLine review={first} index={index} side="first" observation={firstObservation} />
        <ComparisonLine review={second} index={index} side="second" observation={secondObservation} />
        {!enabled && <Text style={ui.note}>{t('comp.missingObservation')}</Text>}
        <CrossConfirmation testID={`basket-cross-confirm-${index}`} label={t('comp.crossConfirm', { product: item.name })}
          checked={confirmedLineIds.includes(lineId)} disabled={checking || !enabled}
          onPress={() => { clearComparison(); setConfirmedLineIds(previous => previous.includes(lineId)
            ? previous.filter(id => id !== lineId) : [...previous, lineId]); }} />
      </Card>;
    })}
    <CrossConfirmation testID="basket-stores-confirm" label={t('comp.storesConfirm')} checked={storesConfirmed} disabled={checking}
      onPress={() => { clearComparison(); setStoresConfirmed(value => !value); }} />
    {!!error && <View testID="basket-comparison-error"><Notice kind="error" title={t('comp.errorTitle')} text={t(error)} /></View>}
    <Button testID="basket-compare" label={t(checking ? 'comp.checking' : 'comp.compare')} busy={checking} onPress={() => void compare()} />
    {comparison && <View testID="basket-comparison-result" accessibilityLiveRegion="polite" style={styles.result}>
      <Card style={styles.summary}>
        <Pill label={t('basket.manualBadge')} tone="yellow" />
        <Text testID="basket-comparison-outcome" style={ui.strong}>{t(`comp.outcome.${comparison.outcome}`)}</Text>
        {comparison.differenceCents !== null && <Text testID="basket-comparison-difference" style={styles.amount}>{t('comp.difference', { price: formatMoney(comparison.differenceCents) })}</Text>}
        {comparison.reasons.map(reason => <Text key={reason} testID={`basket-comparison-reason-${reason}`} style={ui.note}>{t(`comp.reason.${reason}`)}</Text>)}
        <Text style={ui.note}>{t('comp.disclaimer')}</Text>
      </Card>
    </View>}
  </View>;
}

function TargetDetails({ review }: { review: ManualBasketSnapshot }) {
  const { t, formatDate, formatMoney } = useI18n();
  const target = review.request.target;
  return <View style={styles.details}>
    <Text style={ui.strong}>{t('comp.store', { value: review.storeName })}</Text>
    <Text style={ui.note}>{t('comp.format', { value: t(`basket.format.${target.formatId}`) })}</Text>
    <Text style={ui.note}>{t('comp.channel', { value: t(`basket.${target.channel}`) })}</Text>
    <Text style={ui.note}>{t('comp.postal', { value: target.postalCode })}</Text>
    <Text style={ui.note}>{t('comp.date', { date: formatDate(review.request.asOf) })}</Text>
    <Text style={ui.note}>{t('basket.feesLabel')}: {review.request.costs.additionalCents === null ? t('basket.unknownPlaceholder') : formatMoney(review.request.costs.additionalCents)}</Text>
    <Text style={ui.note}>{t('basket.minimumLabel')}: {review.request.costs.minimumGoodsCents === null ? t('basket.unknownPlaceholder') : formatMoney(review.request.costs.minimumGoodsCents)}</Text>
  </View>;
}

function BasketSummary({ review, side }: { review: ManualBasketSnapshot; side: 'first' | 'second' }) {
  const { t, formatMoney, formatNumber } = useI18n();
  const { quote } = review;
  return <Card style={styles.summary}>
    <Pill label={t(side === 'first' ? 'comp.optionA' : 'comp.optionB')} tone="neutral" />
    <Pill label={t('basket.manualBadge')} tone="yellow" />
    <TargetDetails review={review} />
    <Text style={ui.note}>{t('basket.scopeNote')}</Text>
    <Text testID={`basket-comparison-${side}-coverage`} style={ui.strong}>{t('basket.coverage', { priced: formatNumber(quote.coverage.numerator), total: formatNumber(quote.coverage.denominator) })}</Text>
    <Text testID={`basket-comparison-${side}-known-subtotal`} style={ui.strong}>{t('basket.knownSubtotal', { price: formatMoney(quote.knownGoodsSubtotalCents) })}</Text>
    <Text style={ui.note}>{t('basket.subtotalHint')}</Text>
    {quote.goodsOutlayCents !== null && <Text style={ui.body}>{t('basket.goodsOutlay', { price: formatMoney(quote.goodsOutlayCents) })}</Text>}
    {quote.payableTotalCents !== null
      ? <Text testID={`basket-comparison-${side}-payable`} style={ui.strong}>{t('basket.payable', { price: formatMoney(quote.payableTotalCents) })}</Text>
      : <Text testID={`basket-comparison-${side}-no-total`} style={ui.strong}>{t('basket.noTotal')}</Text>}
    {quote.qualificationIssues.map(issue => <Text key={issue} testID={`basket-comparison-${side}-issue-${issue}`} style={ui.note}>{t(`basket.issue.${issue}`)}</Text>)}
  </Card>;
}

function ComparisonLine({ review, index, side, observation }: {
  review: ManualBasketSnapshot; index: number; side: 'first' | 'second'; observation?: Readonly<PriceObservation>;
}) {
  const { t, formatMoney, formatQuantity, formatNumber, formatDate, unitLabel } = useI18n();
  const line = review.quote.lines[index];
  return <View style={styles.observation}>
    <Pill label={t(side === 'first' ? 'comp.optionA' : 'comp.optionB')} tone="neutral" />
    {observation ? <View style={styles.details}>
      <Text style={ui.strong}>{t('basket.observationProduct', { value: observation.product })}</Text>
      <Text style={ui.note}>{t('basket.observationBrand', { value: observation.brand })}</Text>
      <Text style={ui.note}>{t('basket.observationQuality', { value: observation.quality })}</Text>
      <Text style={ui.note}>{t('basket.observationFormat', { value: observation.format })}</Text>
      <Text style={ui.note}>{t('basket.observationPack', { quantity: formatQuantity(observation.quantityMilli), unit: unitLabel(observation.unit) })}</Text>
      <Text style={ui.note}>{t('basket.observationStore', { value: observation.store })}</Text>
      <Text style={ui.body}>{t('basket.observationPrice', { price: observation.priceCents === null ? t('basket.unknownPrice') : formatMoney(observation.priceCents) })}</Text>
      <Text style={ui.note}>{t('basket.observationDate', { date: formatDate(observation.observedOn) })}</Text>
      <Text style={ui.note}>{t('basket.observationSource', { reference: observation.sourceReference })}</Text>
      {!!observation.url && <Text style={ui.note}>{observation.url}</Text>}
    </View> : <Text style={ui.note}>{t('comp.noObservation')}</Text>}
    {line?.status === 'quoted' ? <View style={styles.details}>
      <Text testID={`basket-comparison-${side}-packs-${index}`} style={ui.body}>{t('basket.packages', { count: formatNumber(line.packages) })}</Text>
      <Text testID={`basket-comparison-${side}-outlay-${index}`} style={ui.body}>{t('basket.lineOutlay', { price: formatMoney(line.goodsOutlayCents) })}</Text>
      <Text testID={`basket-comparison-${side}-consumed-${index}`} style={ui.note}>{t('basket.consumed', { price: formatMoney(line.consumedCostCents) })}</Text>
      <Text testID={`basket-comparison-${side}-leftover-${index}`} style={ui.note}>{t('basket.leftover', { quantity: formatQuantity(line.leftoverBaseMilli), unit: unitLabel(line.baseUnit) })}</Text>
    </View> : line && <Text style={ui.note}>{t('basket.pendingLine', { reasons: line.reasons.map(reason => t(`basket.reason.${reason}`)).join(' · ') })}</Text>}
  </View>;
}

function CrossConfirmation({ testID, label, checked, disabled, onPress }: {
  testID: string; label: string; checked: boolean; disabled: boolean; onPress: () => void;
}) {
  return <Pressable testID={testID} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} aria-checked={checked}
    disabled={disabled} onPress={onPress} style={[styles.confirmation, disabled && styles.disabled]}>
    <View style={[styles.checkbox, checked && styles.selected]}>{checked && <Check size={18} color="#fff" />}</View>
    <Text style={[ui.note, styles.confirmText]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  retained: { marginTop: 20 }, panel: { marginTop: 22 }, details: { gap: 5 },
  summary: { gap: 12, marginBottom: 16, backgroundColor: '#F1F4E7' }, line: { gap: 16, marginBottom: 16 },
  observation: { gap: 12, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 16 },
  confirmation: { minHeight: 44, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13, marginBottom: 12 },
  checkbox: { width: 25, height: 25, borderRadius: 6, borderWidth: 1, borderColor: c.primary, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  confirmText: { flex: 1, color: c.ink }, selected: { backgroundColor: c.deep, borderColor: c.deep }, disabled: { opacity: .6 },
  result: { marginTop: 16 }, amount: { fontFamily: f.extra, color: c.deep, fontSize: 22, lineHeight: 31, letterSpacing: -.5 },
});
