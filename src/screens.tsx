import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ArrowDownUp, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleCheck, ExternalLink, Link as LinkIcon, Package, Pencil, Plus, Search, ShieldCheck, ShoppingBag, Store, Tag, Trash2, Truck, Wallet } from 'lucide-react-native';
import { BestBadge, Button, ErrorBanner, Eyebrow, Field, IconButton } from './components/ui';
import { bestOfferIds, sortOffers, totalCents, validateOffer, type Comparison, type Offer, type OfferInput } from './domain/comparisons';
import { colors as c, fonts as f, shadow } from './theme';
import { useI18n } from './i18n/LanguageProvider';

function BagIllustration({ small = false }: { small?: boolean }) {
  const { t } = useI18n();
  return <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[s.illustration, small && s.illustrationSmall]}>
    <View style={s.orbit} /><View style={s.orbitInner} />
    <View style={s.bag}><ShoppingBag size={small ? 42 : 54} strokeWidth={1.25} color={c.green} /></View>
    <View style={s.checkBubble}><Check size={21} strokeWidth={2.5} color="white" /></View>
    <View style={s.priceBubble}><Tag size={14} color={c.green} /><Text style={s.priceBubbleText}>{t('legacy.bestPrice')}</Text></View>
    <View style={s.dot} /><View style={s.dotSecond} />
  </View>;
}

export function HomeScreen({ comparisons, onCreate, onOpen, busy }: { comparisons: Comparison[]; onCreate: () => void; onOpen: (id: string) => void; busy: boolean }) {
  const { t, locale, formatMoney, formatNumber } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 800;
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const filtered = comparisons.filter(item => `${item.name} ${item.offers.map(o => o.store).join(' ')}`.toLocaleLowerCase(locale).includes(normalizedQuery));
  const count = comparisons.reduce((n, item) => n + item.offers.length, 0);
  return <View>
    <View style={[s.intro, wide && s.introWide]}>
      <View style={{ flex: 1 }}>
        <Eyebrow>{t('legacy.compareChooseSave')}</Eyebrow>
        <Text accessibilityRole="header" style={[s.pageTitle, wide && s.pageTitleWide]}>{t('legacy.homeTitle', { separator: wide ? ' ' : '\n' })}<Text style={{ color: c.coral }}>.</Text></Text>
        <Text style={s.introText}>{t('legacy.homeSubtitle')}</Text>
      </View>
      <View style={s.stats}>
        <View style={s.stat}><Text style={s.statNumber}>{formatNumber(comparisons.length, { minimumIntegerDigits: 2, useGrouping: false })}</Text><Text style={s.statLabel}>{t('legacy.comparisons')}</Text></View>
        <View style={s.statDivider} />
        <View style={s.stat}><Text style={s.statNumber}>{formatNumber(count, { minimumIntegerDigits: 2, useGrouping: false })}</Text><Text style={s.statLabel}>{t('legacy.savedOffers')}</Text></View>
      </View>
    </View>

    <View style={[s.hero, wide && s.heroWide]}>
      <View style={s.heroText}>
        <View style={s.heroTag}><View style={s.liveDot} /><Text style={s.heroTagText}>{t('legacy.heroTag')}</Text></View>
        <Text style={[s.heroTitle, wide && { fontSize: 34, lineHeight: 43 }]}>{t('legacy.heroTitle', { separator: wide ? '\n' : ' ' })}</Text>
        <Text style={s.heroDescription}>{t('legacy.heroDescription')}</Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 23 }}><Button label={t('legacy.newComparison')} icon={Plus} onPress={onCreate} disabled={busy} testID="create-comparison" /></View>
      </View>
      {wide && <BagIllustration />}
    </View>

    <View style={s.sectionHeading}>
      <View style={s.sectionTitleRow}><Text accessibilityRole="header" style={s.sectionTitle}>{t('legacy.yourComparisons')}</Text><View style={s.counter}><Text style={s.counterText}>{formatNumber(comparisons.length)}</Text></View></View>
      {comparisons.length > 0 && <IconButton label={t('legacy.createComparison')} icon={Plus} onPress={onCreate} disabled={busy} />}
    </View>
    {comparisons.length > 0 && <View style={{ maxWidth: 440, marginBottom: 10 }}><Field label={t('legacy.searchComparisons')} placeholder={t('legacy.searchPlaceholder')} icon={Search} value={query} onChangeText={setQuery} autoCapitalize="none" /></View>}

    {comparisons.length === 0 ? <View style={[s.empty, wide && s.emptyWide]}>
      <View style={s.emptyIcon}><ArrowDownUp size={25} strokeWidth={1.5} color={c.green} /></View>
      <View style={[{ flex: wide ? 1 : undefined }, !wide && { alignItems: 'center' }]}><Text style={s.emptyTitle}>{t('legacy.emptyTitle')}</Text><Text style={[s.emptyText, !wide && { textAlign: 'center' }]}>{t('legacy.emptyDescription', { separator: wide ? '\n' : ' ' })}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('legacy.createFirstA11y')} onPress={onCreate} disabled={busy} style={s.emptyAction}><Text style={s.emptyActionText}>{t('legacy.createFirst')}</Text><ArrowRight size={18} color={c.green} /></Pressable>
    </View> : filtered.length === 0 ? <View style={s.empty}><Search size={25} color={c.muted} /><Text style={s.emptyTitle}>{t('legacy.noResults')}</Text><Text style={s.emptyText}>{t('legacy.tryAnother')}</Text><Button label={t('legacy.clearSearch')} variant="secondary" onPress={() => setQuery('')} /></View> : <View style={s.cardGrid}>
      {filtered.map(item => {
        const offers = sortOffers(item.offers);
        return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={t(offers[0] ? 'legacy.openComparisonPrice' : 'legacy.openComparison', { name: item.name, count: formatNumber(item.offers.length), price: offers[0] ? formatMoney(totalCents(offers[0])) : '' })} onPress={() => onOpen(item.id)} disabled={busy} style={({ pressed }) => [s.comparisonCard, wide && { width: '48.9%' }, pressed && { opacity: 0.75 }]}>
          <View style={s.cardTop}><View style={s.productIcon}><Package size={23} color={c.green} strokeWidth={1.5} /></View><ChevronRight size={19} color={c.muted} /></View>
          <Text numberOfLines={2} style={s.cardTitle}>{item.name}</Text>
          <Text style={s.cardDescription}>{t(item.offers.length === 1 ? 'legacy.savedOfferOne' : 'legacy.savedOfferOther', { count: formatNumber(item.offers.length) })}</Text>
          <View style={s.cardBottom}><View style={{ flex: 1 }}><Text style={s.microLabel}>{t(offers.length ? 'legacy.bestDeliveredTotal' : 'legacy.nextStep')}</Text>{offers[0] ? <Text style={s.cardPrice}>{formatMoney(totalCents(offers[0]))}</Text> : <Text style={s.noOffer}>{t('legacy.addFirstOffer')}</Text>}</View>{offers.length > 0 && <View style={s.roundArrow}><ArrowUpRight size={19} color={c.green} /></View>}</View>
        </Pressable>;
      })}
    </View>}

    <View style={[s.steps, !wide && { flexDirection: 'column', gap: 22 }]}>
      {[
        { n: '01', title: t('legacy.stepOneTitle'), text: t('legacy.stepOneText'), icon: LinkIcon },
        { n: '02', title: t('legacy.stepTwoTitle'), text: t('legacy.stepTwoText'), icon: Truck },
        { n: '03', title: t('legacy.stepThreeTitle'), text: t('legacy.stepThreeText'), icon: CircleCheck },
      ].map(({ n, title, text, icon: Icon }) => <View key={n} style={s.step}><View style={s.stepTop}><Icon size={19} color={c.green} strokeWidth={1.6} /><Text style={s.stepNumber}>{n}</Text></View><Text style={s.stepTitle}>{title}</Text><Text style={s.stepText}>{text}</Text></View>)}
    </View>
  </View>;
}

export function DetailScreen({ comparison, onBack, onRename, onDelete, onAdd, onEditOffer, onDeleteOffer, onVisit, busy }: {
  comparison: Comparison; onBack: () => void; onRename: () => void; onDelete: () => void; onAdd: () => void; onEditOffer: (id: string) => void; onDeleteOffer: (id: string) => void; onVisit: (offer: Offer) => void; busy: boolean;
}) {
  const { t, formatMoney, formatNumber } = useI18n();
  const wide = useWindowDimensions().width >= 800;
  const offers = sortOffers(comparison.offers);
  const winners = bestOfferIds(offers);
  const min = offers[0] ? totalCents(offers[0]) : 0;
  const max = offers.length > 0 ? totalCents(offers[offers.length - 1]) : 0;
  return <View>
    <Back label={t('legacy.yourComparisons')} onPress={onBack} disabled={busy} />
    <View style={s.detailHeading}>
      <View style={{ flex: 1 }}><Eyebrow>{t('legacy.yourComparison')}</Eyebrow><Text accessibilityRole="header" style={[s.detailTitle, wide && { fontSize: 36 }]}>{comparison.name}</Text><Text style={s.introText}>{t(offers.length === 1 ? 'legacy.offerSummaryOne' : 'legacy.offerSummaryOther', { count: formatNumber(offers.length) })}</Text></View>
      <View style={s.actions}><IconButton label={t('legacy.renameComparison')} icon={Pencil} onPress={onRename} disabled={busy} /><IconButton label={t('legacy.deleteComparison')} icon={Trash2} onPress={onDelete} disabled={busy} danger /></View>
    </View>
    {offers.length > 0 && <View style={[s.summaryCard, !wide && { flexDirection: 'column', alignItems: 'stretch', gap: 22 }]}>
      <View style={{ flex: 1 }}><View style={s.summaryLabel}><Wallet size={16} color={c.green} /><Text style={s.microLabel}>{t('legacy.bestOption')}</Text></View><Text style={s.summaryPrice}>{formatMoney(min)}</Text><Text style={s.summaryNote}>{t('legacy.shippingIncluded', { shop: winners.size > 1 ? t('legacy.tiedShops', { count: formatNumber(winners.size) }) : offers[0].store })}</Text></View>
      {offers.length > 1 && <View style={s.savings}><Text style={s.savingsLabel}>{t('legacy.difference')}</Text><Text style={s.savingsAmount}>{formatMoney(max - min)}</Text><Text style={s.summaryNote}>{t('legacy.differenceExplanation')}</Text></View>}
    </View>}
    <View style={s.sectionHeading}><View style={{ flex: 1 }}><Text accessibilityRole="header" style={s.sectionTitle}>{t('legacy.savedOffersTitle')}</Text><View style={s.sortLabel}><ArrowDownUp size={12} color={c.muted} /><Text style={s.sortText}>{t('legacy.ascendingTotal')}</Text></View></View><Button label={t('legacy.addOffer')} icon={Plus} compact onPress={onAdd} disabled={busy} /></View>
    {offers.length === 0 ? <View style={s.detailEmpty}><BagIllustration small /><Text style={s.emptyTitle}>{t('legacy.detailEmptyTitle')}</Text><Text style={[s.emptyText, { textAlign: 'center', maxWidth: 330 }]}>{t('legacy.detailEmptyDescription')}</Text><Button label={t('legacy.addFirstOfferButton')} icon={Plus} onPress={onAdd} disabled={busy} /></View> : <View style={{ gap: 14 }}>
      {offers.map((offer, index) => {
        const best = winners.has(offer.id);
        return <View key={offer.id} testID="offer-card" style={[s.offerCard, best && s.bestCard]}>
          <View style={s.offerTop}><View style={[s.storeIcon, best && { backgroundColor: '#E6EEDC' }]}><Store size={22} strokeWidth={1.5} color={c.green} /></View><View style={{ flex: 1, gap: 5 }}><Text style={s.storeName}>{offer.store}</Text><Text numberOfLines={1} style={s.domain}>{new URL(offer.url).hostname}</Text></View>{best ? <BestBadge tie={winners.size > 1} /> : <Text style={s.rank}>{formatNumber(index + 1, { minimumIntegerDigits: 2, useGrouping: false })}</Text>}</View>
          <View style={[s.offerNumbers, !wide && { flexWrap: 'wrap' }]}>
            <View style={s.amountBlock}><Text style={s.amountLabel}>{t('legacy.product')}</Text><Text style={s.amount}>{formatMoney(offer.priceCents)}</Text></View>
            <Text style={s.mathSign}>+</Text><View style={s.amountBlock}><Text style={s.amountLabel}>{t('legacy.shipping')}</Text><Text style={s.amount}>{formatMoney(offer.shippingCents)}</Text></View>
            <View style={s.totalBlock}><Text style={s.amountLabel}>{t('legacy.deliveredTotal')}</Text><Text style={s.offerTotal}>{formatMoney(totalCents(offer))}</Text></View>
          </View>
          <View style={[s.offerBottom, !wide && { gap: 6 }]}><View style={s.actions}><IconButton label={t('legacy.editOfferA11y', { shop: offer.store })} icon={Pencil} onPress={() => onEditOffer(offer.id)} disabled={busy} /><IconButton label={t('legacy.deleteOfferA11y', { shop: offer.store })} icon={Trash2} danger onPress={() => onDeleteOffer(offer.id)} disabled={busy} /></View><Button label={t('legacy.visitShop')} icon={ExternalLink} variant={best ? 'primary' : 'secondary'} compact onPress={() => onVisit(offer)} disabled={busy} /></View>
        </View>;
      })}
    </View>}
    <View style={s.note}><ShieldCheck size={17} color={c.muted} /><Text style={s.noteText}>{t('legacy.manualPriceNotice')}</Text></View>
  </View>;
}

export function OfferScreen({ comparison, offer, onBack, onSave, busy, saveError }: { comparison: Comparison; offer?: Offer; onBack: () => void; onSave: (offer: Omit<Offer, 'id'>) => Promise<boolean>; busy: boolean; saveError: string }) {
  const { t, locale, formatMoney, formatNumber } = useI18n();
  const wide = useWindowDimensions().width >= 800;
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value ?? '.';
  const asInput = (cents: number) => `${BigInt(cents) / 100n}${decimal}${(BigInt(cents) % 100n).toString().padStart(2, '0')}`;
  // Initial values are localised once. Changing language must never rewrite a draft.
  const [input, setInput] = useState<OfferInput>(() => ({ store: offer?.store ?? '', url: offer?.url ?? '', price: offer ? asInput(offer.priceCents) : '', shipping: offer ? asInput(offer.shippingCents) : '0' }));
  const [error, setError] = useState('');
  const update = (key: keyof OfferInput) => (value: string) => { setInput(prev => ({ ...prev, [key]: value })); setError(''); };
  let preview: number | undefined;
  try { preview = totalCents(validateOffer({ ...input, store: 'Preview', url: 'https://example.com' })); } catch { /* Incomplete amounts have no total. */ }
  const submit = async () => {
    try { const value = validateOffer(input); setError(''); await onSave(value); }
    catch (err) { setError(err instanceof Error ? err.message : 'legacy.errorReviewOffer'); }
  };
  return <View>
    <Back label={comparison.name} onPress={onBack} disabled={busy} />
    <Eyebrow>{t(offer ? 'legacy.updateOption' : 'legacy.anotherOption')}</Eyebrow>
    <Text accessibilityRole="header" style={s.detailTitle}>{t(offer ? 'legacy.editOffer' : 'legacy.addOffer')}<Text style={{ color: c.coral }}>.</Text></Text>
    <Text style={[s.introText, { marginBottom: 30 }]}>{t('legacy.comparisonFor', { name: comparison.name })}</Text>
    <View style={[s.formLayout, !wide && { flexDirection: 'column' }]}>
      <View style={[s.formCard, !wide && { flex: 0, flexBasis: 'auto', flexShrink: 0 }]}>
        <View style={s.formSectionTitle}><Store color={c.green} size={18} /><Text style={s.formSectionLabel}>{t('legacy.storeAndProduct')}</Text></View>
        <Field label={t('legacy.shopName')} placeholder={t('legacy.shopExample')} icon={Store} value={input.store} onChangeText={update('store')} maxLength={120} editable={!busy} autoCapitalize="words" autoFocus />
        <Field label={t('legacy.productLink')} placeholder={t('legacy.productUrlExample')} icon={LinkIcon} value={input.url} onChangeText={update('url')} maxLength={2048} editable={!busy} autoCapitalize="none" autoCorrect={false} keyboardType="url" hint={t('legacy.productLinkHint')} />
        <View style={s.formDivider} />
        <View style={s.formSectionTitle}><Tag color={c.green} size={18} /><Text style={s.formSectionLabel}>{t('legacy.actualCost')}</Text></View>
        <Field label={t('legacy.productPrice')} placeholder={formatNumber(0, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })} icon={Tag} value={input.price} onChangeText={update('price')} editable={!busy} keyboardType="decimal-pad" autoCorrect={false} />
        <Field label={t('legacy.shippingCost')} placeholder={formatNumber(0, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })} icon={Truck} value={input.shipping} onChangeText={update('shipping')} editable={!busy} keyboardType="decimal-pad" autoCorrect={false} hint={t('legacy.shippingHint')} />
        {error.length > 0 && <ErrorBanner message={error} />}
        {!!saveError && <ErrorBanner message={saveError} />}
        <View style={{ gap: 10 }}><Button label={t(offer ? 'legacy.saveChanges' : 'legacy.saveOffer')} icon={Check} onPress={submit} loading={busy} testID="save-offer" /><Button label={t('legacy.cancel')} variant="ghost" onPress={onBack} disabled={busy} /></View>
      </View>
      <View style={[s.formSide, wide ? { maxWidth: 330 } : { flex: 0, flexBasis: 'auto', flexShrink: 0 }]}>
        <View style={s.previewCard}><View style={s.summaryLabel}><Wallet size={18} color={c.green} /><Text style={s.microLabel}>{t('legacy.offerTotal')}</Text></View><Text style={s.previewPrice}>{preview !== undefined ? formatMoney(preview) : '—'}</Text><Text style={s.summaryNote}>{t('legacy.pricePlusShipping')}</Text><View style={s.previewDivider} /><Text style={s.previewDescription}>{t('legacy.savedOrderExplanation')}</Text></View>
        <View style={s.tip}><CircleCheck size={20} color={c.green} /><View style={{ flex: 1 }}><Text style={s.tipTitle}>{t('legacy.compareSameProduct')}</Text><Text style={s.tipText}>{t('legacy.compareSameProductHint')}</Text></View></View>
      </View>
    </View>
  </View>;
}

export function Back({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { t } = useI18n();
  return <Pressable accessibilityRole="button" accessibilityLabel={t('legacy.backTo', { label })} disabled={disabled} onPress={onPress} style={s.back}><ArrowLeft size={17} color={c.muted} /><Text numberOfLines={1} style={s.backText}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  intro: { gap: 26, marginTop: 12, marginBottom: 34 }, introWide: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 38 },
  pageTitle: { fontFamily: f.extra, color: c.ink, fontSize: 39, lineHeight: 47, letterSpacing: -1.9, marginTop: 13 }, pageTitleWide: { fontSize: 43, lineHeight: 55 }, introText: { color: c.muted, fontFamily: f.regular, fontSize: 14, lineHeight: 23, marginTop: 9 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 24 }, stat: { gap: 4 }, statNumber: { fontFamily: f.extra, fontSize: 28, color: c.ink, letterSpacing: -1 }, statLabel: { fontFamily: f.medium, fontSize: 11, color: c.muted }, statDivider: { width: 1, height: 36, backgroundColor: c.line },
  hero: { backgroundColor: c.sage, borderRadius: 22, padding: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#DFE7D9', marginBottom: 34 }, heroWide: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 38, paddingVertical: 32 }, heroText: { flex: 1, maxWidth: 540 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 17 }, liveDot: { height: 5, width: 5, backgroundColor: c.green, borderRadius: 5 }, heroTagText: { fontFamily: f.bold, fontSize: 8, color: c.green, letterSpacing: 1.2 },
  heroTitle: { fontFamily: f.extra, fontSize: 28, lineHeight: 37, letterSpacing: -1, color: c.ink }, heroDescription: { fontFamily: f.regular, fontSize: 13, lineHeight: 23, color: '#62725F', marginTop: 13, maxWidth: 425 },
  illustration: { width: 255, height: 235, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 }, illustrationSmall: { width: 200, height: 172, transform: [{ scale: 0.85 }] }, orbit: { position: 'absolute', height: 222, width: 222, borderWidth: 1, borderColor: '#D6E0CD', borderRadius: 150 }, orbitInner: { position: 'absolute', height: 170, width: 170, borderWidth: 1, borderColor: '#D6E0CD', borderRadius: 100 },
  bag: { width: 105, height: 120, backgroundColor: '#F9FAF1', borderRadius: 22, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }], borderWidth: 1, borderColor: '#D6E0CD', ...shadow },
  checkBubble: { width: 43, height: 43, backgroundColor: c.green, borderRadius: 24, position: 'absolute', right: 44, top: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: c.sage },
  priceBubble: { position: 'absolute', bottom: 37, right: 14, backgroundColor: '#FFFDF6', paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, gap: 7, flexDirection: 'row', alignItems: 'center', transform: [{ rotate: '-5deg' }], borderWidth: 1, borderColor: '#DCE4D5' }, priceBubbleText: { fontFamily: f.bold, fontSize: 10, color: c.green },
  dot: { width: 10, height: 10, borderRadius: 8, backgroundColor: c.coral, position: 'absolute', left: 29, top: 45 }, dotSecond: { width: 6, height: 6, borderRadius: 8, backgroundColor: '#ABC39C', position: 'absolute', right: 8, top: 90 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 19 }, sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sectionTitle: { color: c.ink, fontFamily: f.bold, fontSize: 19, letterSpacing: -0.6 }, counter: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: '#ECEFE7' }, counterText: { fontFamily: f.bold, color: c.muted, fontSize: 10 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#D4DDCF', borderRadius: 18, padding: 27, alignItems: 'center', gap: 17, backgroundColor: '#FDFEF9' }, emptyWide: { flexDirection: 'row', padding: 28, gap: 23 }, emptyIcon: { width: 56, height: 56, backgroundColor: c.sage, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }, emptyTitle: { fontFamily: f.bold, fontSize: 16, color: c.ink, textAlign: 'center', letterSpacing: -0.3 }, emptyText: { fontFamily: f.regular, fontSize: 12, lineHeight: 21, color: c.muted, marginTop: 6 }, emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }, emptyActionText: { fontFamily: f.bold, fontSize: 12, color: c.green },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, comparisonCard: { width: '100%', borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, borderRadius: 19, padding: 22, ...shadow }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 }, productIcon: { width: 46, height: 46, backgroundColor: c.sage, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontFamily: f.bold, color: c.ink, fontSize: 20, letterSpacing: -0.5 }, cardDescription: { color: c.muted, fontFamily: f.medium, fontSize: 12, marginTop: 6 }, cardBottom: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 22, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, microLabel: { color: c.green, fontFamily: f.bold, letterSpacing: 1, fontSize: 9 }, cardPrice: { fontSize: 26, color: c.ink, fontFamily: f.extra, marginTop: 5, letterSpacing: -0.8 }, noOffer: { fontFamily: f.medium, fontSize: 13, color: c.muted, marginTop: 9 }, roundArrow: { width: 35, height: 35, borderRadius: 20, backgroundColor: c.sage, justifyContent: 'center', alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 40, paddingTop: 30, marginTop: 35, borderTopWidth: 1, borderTopColor: c.line, paddingBottom: 18 }, step: { flex: 1 }, stepTop: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 11 }, stepNumber: { fontFamily: f.bold, fontSize: 10, color: '#99A28F' }, stepTitle: { fontFamily: f.bold, color: c.ink, fontSize: 12, marginBottom: 5 }, stepText: { fontFamily: f.regular, fontSize: 11, color: c.muted, lineHeight: 19 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 3, marginBottom: 24, alignSelf: 'flex-start', maxWidth: '100%' }, backText: { fontFamily: f.medium, fontSize: 12, color: c.muted, flexShrink: 1 }, detailHeading: { flexDirection: 'row', gap: 8, marginBottom: 28 }, detailTitle: { fontFamily: f.extra, color: c.ink, fontSize: 31, letterSpacing: -1.2, marginTop: 9 }, actions: { flexDirection: 'row', alignItems: 'center' },
  summaryCard: { padding: 26, backgroundColor: c.sage, borderWidth: 1, borderColor: c.sageLine, borderRadius: 20, marginBottom: 34, flexDirection: 'row', alignItems: 'center', gap: 30 }, summaryLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 }, summaryPrice: { fontFamily: f.extra, fontSize: 43, letterSpacing: -1.8, color: c.green, marginTop: 12 }, summaryNote: { fontFamily: f.medium, fontSize: 11, color: c.muted, lineHeight: 18, marginTop: 5 }, savings: { padding: 18, backgroundColor: '#F5F7EF', borderRadius: 13 }, savingsLabel: { color: c.muted, fontFamily: f.bold, fontSize: 8, letterSpacing: 1 }, savingsAmount: { fontFamily: f.extra, fontSize: 24, color: c.green, marginTop: 8, letterSpacing: -0.8 }, sortLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }, sortText: { fontFamily: f.medium, fontSize: 10, color: c.muted }, detailEmpty: { alignItems: 'center', gap: 13, padding: 25, borderRadius: 20, borderColor: c.line, borderWidth: 1, backgroundColor: c.paper },
  offerCard: { backgroundColor: c.paper, borderWidth: 1, borderColor: c.line, borderRadius: 18, padding: 21 }, bestCard: { borderColor: '#A3B996', backgroundColor: '#FCFEF8' }, offerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, storeIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#F0F2ED', alignItems: 'center', justifyContent: 'center' }, storeName: { fontFamily: f.bold, color: c.ink, fontSize: 16, letterSpacing: -0.3 }, domain: { fontFamily: f.regular, color: c.muted, fontSize: 10 }, rank: { fontFamily: f.bold, color: '#A1AA9C', fontSize: 13 }, offerNumbers: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 22 }, amountBlock: { minWidth: 70, flexShrink: 1 }, amountLabel: { fontFamily: f.medium, color: c.muted, fontSize: 10, marginBottom: 7 }, amount: { fontFamily: f.semibold, color: c.ink, fontSize: 16 }, mathSign: { fontFamily: f.regular, color: '#A2AA9D', fontSize: 16, marginTop: 16 }, totalBlock: { flex: 1, alignItems: 'flex-end', minWidth: 110 }, offerTotal: { fontFamily: f.extra, color: c.green, fontSize: 25, letterSpacing: -0.9 }, offerBottom: { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, note: { flexDirection: 'row', gap: 10, paddingVertical: 23, alignItems: 'flex-start' }, noteText: { flex: 1, fontFamily: f.regular, fontSize: 11, lineHeight: 19, color: c.muted },
  formLayout: { flexDirection: 'row', gap: 25, alignItems: 'flex-start' }, formCard: { flex: 1, width: '100%', borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, borderRadius: 20, padding: 24 }, formSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 23 }, formSectionLabel: { fontFamily: f.bold, color: c.ink, fontSize: 14 }, formDivider: { height: 1, backgroundColor: c.line, marginTop: 3, marginBottom: 26 }, formSide: { width: '100%', flex: 1, gap: 20 }, previewCard: { padding: 25, backgroundColor: c.sage, borderWidth: 1, borderColor: c.sageLine, borderRadius: 19 }, previewPrice: { fontFamily: f.extra, color: c.green, fontSize: 35, marginTop: 20, letterSpacing: -1.2 }, previewDivider: { height: 1, backgroundColor: c.sageLine, marginVertical: 23 }, previewDescription: { fontFamily: f.regular, fontSize: 12, lineHeight: 21, color: c.muted }, tip: { padding: 6, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, tipTitle: { fontFamily: f.bold, fontSize: 12, color: c.ink, marginBottom: 6 }, tipText: { fontFamily: f.regular, fontSize: 11, lineHeight: 19, color: c.muted },
});
