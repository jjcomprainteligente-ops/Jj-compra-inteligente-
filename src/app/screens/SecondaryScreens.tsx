import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Accessibility, ArrowUpRight, BookOpen, Clock, Globe, ListChecks,
  MapPin, ShieldCheck, Sprout, Users, Utensils, Wallet,
} from 'lucide-react-native';
import { summarizeList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { LANGUAGE_NAMES } from '../../i18n/types';
import { MealArt } from '../components/Illustrations';
import {
  Button, Card, Notice, Pill, Row, Section, Title, c, f, ui,
} from '../components/ui';
import type { SecondaryProps } from '../types';

/** Real local-list totals. No price feeds, retailer agreement, or savings claim. */
export function SavingsScreen({
  active, busy, onNavigate, onBudget, onCreateList,
}: SecondaryProps) {
  const { t, formatMoney, formatNumber } = useI18n();
  const summary = active ? summarizeList(active) : undefined;
  const enteredCount = active?.items.filter(item => item.priceKind === 'entered').length ?? 0;
  const estimatedCount = active?.items.filter(item => item.priceKind === 'estimated').length ?? 0;
  const recordedPurchaseCount = summary ? summary.checkedCount - summary.spentIncompleteCount : 0;
  const hasKnownPrices = !!summary && summary.itemCount > summary.missingPriceCount;

  return <View style={ui.page}>
    <Title kicker={t('secondary.savingsKicker')} title={t('secondary.savingsTitle')} subtitle={t('secondary.savingsSubtitle')} />
    <View style={{ marginBottom: 19 }}><Button label={t('secondary.openPilot')} testID="open-price-pilot"
      onPress={() => onNavigate('prices')} disabled={busy} /></View>

    {active && summary ? <>
      <Card>
        <View style={styles.cardHeading}>
          <Text style={ui.note}>{t('secondary.budgetFor', { name: active.name })}</Text>
          <Wallet size={20} color={c.primary} />
        </View>
        <Text style={[ui.number, { marginTop: 9 }]}>
          {active.budgetCents === null ? t('secondary.undefined') : formatMoney(active.budgetCents)}
        </Text>
        <View style={{ marginTop: 13 }}><Pill label={t('secondary.limitNotice')} tone="yellow" /></View>
        <View style={styles.moneyRows}>
          <MoneyRow label={t('secondary.recordedSpending')} value={
            summary.checkedCount === 0 ? t('secondary.noMarkedPurchases')
              : recordedPurchaseCount === 0 ? t('secondary.noEnteredPrice')
                : formatMoney(summary.spentCents)
          } testID="spent-total" />
          <Text style={ui.note}>
            {t('secondary.markedPriceNotice')}
            {summary.spentIncompleteCount > 0
              ? t('secondary.missingMarkedAmounts', { count: formatNumber(summary.spentIncompleteCount) })
              : ''}
          </Text>
          <MoneyRow label={t('secondary.enteredPrices')} value={enteredCount ? formatMoney(summary.enteredTotalCents) : t('secondary.noData')} testID="entered-total" />
          <MoneyRow label={t('secondary.estimates')} value={estimatedCount ? formatMoney(summary.estimatedTotalCents) : t('secondary.noEstimates')} testID="estimated-total" />
        </View>
      </Card>

      <View style={{ marginTop: 15 }}>
        <Button label={active.budgetCents === null ? t('secondary.defineBudget') : t('secondary.editBudget')}
          secondary onPress={onBudget} disabled={busy} testID="edit-budget" />
      </View>

      <Section title={t('secondary.knownList')} />
      <Card>
        <Text style={ui.note}>{t('secondary.knownForecast')}</Text>
        <Text testID="known-total" style={[styles.knownTotal, { marginTop: 5 }]}>
          {hasKnownPrices ? formatMoney(summary.knownTotalCents) : t('secondary.totalPending')}
        </Text>
        <Text style={[ui.note, { marginTop: 9 }]}>{t('secondary.forecastExplanation')}</Text>
        <View style={styles.countRow}>
          <View style={{ flex: 1 }}>
            <Text style={ui.note}>{t('secondary.missingPrices')}</Text>
            <Text testID="missing-price-count" style={styles.count}>{t('secondary.coverage', { missing: formatNumber(summary.missingPriceCount), total: formatNumber(summary.itemCount) })}</Text>
          </View>
          <Pill label={summary.itemCount === 0 ? t('secondary.noProducts') : summary.missingPriceCount > 0 ? t('secondary.partialForecast') : t('secondary.calculatedForecast')}
            tone={summary.missingPriceCount > 0 ? 'yellow' : 'green'} />
        </View>
      </Card>

      {summary.excessCents > 0 && <View style={{ marginTop: 16 }}>
        <Notice kind="warning" title={t('secondary.overBudgetTitle')}
          text={t('secondary.overBudgetBody', { amount: formatMoney(summary.excessCents) })}
          action={t('secondary.reviewShopping')} onPress={() => onNavigate('list')} />
      </View>}
      <View style={{ marginTop: 16 }}>
        <Button label={t('secondary.viewShopping')} icon={ListChecks} onPress={() => onNavigate('list')}
          disabled={busy} testID="savings-cta" />
      </View>
    </> : <>
      <Card style={styles.emptyCard}>
        <View style={styles.featureIcon}><Wallet size={28} color={c.primary} /></View>
        <Text style={styles.emptyTitle}>{t('secondary.emptyTitle')}</Text>
        <Text style={[ui.note, { textAlign: 'center' }]}>{t('secondary.emptyBody')}</Text>
      </Card>
      <View style={{ marginTop: 16 }}><Button label={t('secondary.createList')} onPress={onCreateList} disabled={busy} /></View>
    </>}

    <Section title={t('secondary.compareTitle')} />
    <Notice title={t('secondary.noSourcesTitle')}
      text={t('secondary.noSourcesBody')} />
    <Card>
      <View style={styles.inline}>
        <ShieldCheck size={23} color={c.primary} />
        <Text style={[ui.strong, { flex: 1 }]}>{t('secondary.manualComparator')}</Text>
      </View>
      <Text style={[ui.note, { marginTop: 12, marginBottom: 18 }]}>{t('secondary.manualHelp')}</Text>
      <Button label={t('secondary.openLegacy')} secondary onPress={() => onNavigate('comparisons')}
        disabled={busy} testID="open-comparisons" />
    </Card>
  </View>;
}

/** Preserved B03/B04 preview. The active B05 entry uses MenuWorkspace. */
export function MenusScreen({ busy, onRecipe, onInfo }: SecondaryProps) {
  const { t, formatNumber } = useI18n();
  return <View style={ui.page}>
    <Title kicker={t('secondary.menusKicker')} title={t('secondary.menusTitle')} subtitle={t('secondary.menusSubtitle')} />
    <Pill label={t('secondary.menusPreview')} tone="yellow" />
    <Text style={[ui.note, { marginTop: 12, marginBottom: 18 }]}>{t('secondary.previewNotice')}</Text>

    <Pressable accessibilityRole="button" accessibilityLabel={t('secondary.riceA11y', { title: t('recipes.arroz-verduras.title') })}
      disabled={busy} onPress={onRecipe} style={({ pressed }) => [styles.featuredMeal, pressed && { opacity: 0.8 }]}>
      <View style={{ flex: 1 }}>
        <Pill label={t('secondary.ideaToday')} tone="yellow" />
        <Text style={styles.featuredName}>{t('recipes.arroz-verduras.title')}</Text>
        <View style={styles.mealMeta}><Clock size={15} color={c.muted} /><Text style={ui.note}>{t('secondary.featuredMeta', { minutes: formatNumber(25) })}</Text></View>
        <View style={styles.recipeLink}><Text style={ui.link}>{t('secondary.viewExample')}</Text><ArrowUpRight size={16} color={c.primary} /></View>
      </View>
      <MealArt size={96} />
    </Pressable>
    <Button label={t('secondary.viewExample')} icon={Utensils} onPress={onRecipe}
      disabled={busy} testID="menus-cta" />

    <Section title={t('secondary.moreIdeas')} />
    <MealRow name={t('recipes.lentejas-casa.title')} time={t('secondary.minutes', { count: formatNumber(35) })} onPress={() => onInfo('recipes.lentejas-casa.title', 'secondary.lentilsPreview')} />
    <MealRow name={t('recipes.tortilla-ensalada.title')} time={t('secondary.minutes', { count: formatNumber(20) })} onPress={() => onInfo('recipes.tortilla-ensalada.title', 'secondary.omelettePreview')} />

    <View style={{ marginTop: 23 }}><Notice title={t('secondary.externalIdeasTitle')}
      text={t('secondary.externalIdeasBody')} /></View>
    <View style={styles.inline}>
      <Sprout size={18} color={c.primary} />
      <Text style={[ui.note, { flex: 1 }]}>{t('secondary.cookingSafety')}</Text>
    </View>
  </View>;
}

export function ProfileScreen({
  active, lists, busy, onBudget, onCreateList, onInfo, onLanguage,
}: SecondaryProps) {
  const { t, language, source, formatMoney, formatNumber } = useI18n();
  const itemCount = lists.reduce((count, list) => count + list.items.length, 0);
  return <View style={ui.page}>
    <Title kicker={t('secondary.profileKicker')} title={t('secondary.profileTitle')} subtitle={t('secondary.profileSubtitle')} />
    <Card style={styles.profileCard}>
      <View style={styles.profileAvatar}><Text style={styles.profileInitials}>JJ</Text></View>
      <View style={{ flex: 1, gap: 7 }}>
        <Text style={ui.strong}>{t('secondary.noRegistration')}</Text>
        <Text style={ui.note}>{t(lists.length === 1 ? 'secondary.listCountOne' : 'secondary.listCountMany', { count: formatNumber(lists.length) })} · {t(itemCount === 1 ? 'secondary.productCountOne' : 'secondary.productCountMany', { count: formatNumber(itemCount) })}</Text>
        <Pill label={t('secondary.onDevice')} tone="neutral" />
      </View>
    </Card>

    <Section title={t('secondary.yourWay')} />
    <Card style={{ paddingVertical: 1 }}>
      <Row title={t('secondary.weeklyBudget')} icon={Wallet}
        subtitle={!active ? t('secondary.createForBudget') : active.budgetCents === null ? t('secondary.noActiveBudget') : `${formatMoney(active.budgetCents)} · ${active.name}`}
        onPress={() => { if (!busy) active ? onBudget() : onCreateList(); }} />
      <Row title={t('secondary.yourArea')} subtitle="Tenerife" icon={MapPin}
        onPress={() => onInfo('secondary.yourArea', 'secondary.areaInfo')} />
      <Row testID="language-settings" title={t('common.language')} subtitle={`${LANGUAGE_NAMES[language]} · ${t(source === 'manual' ? 'common.manualSource' : 'common.deviceSource')}`} icon={Globe}
        onPress={() => { if (!busy) onLanguage(); }} />
      <Row title={t('secondary.accessibility')} subtitle={t('secondary.accessibilitySubtitle')} icon={Accessibility}
        onPress={() => onInfo('secondary.readingTitle', 'secondary.readingInfo')} />
    </Card>

    <Section title={t('secondary.savedHere')} />
    <Card>
      <View style={styles.inline}><ShieldCheck color={c.primary} size={24} /><Text style={[ui.strong, { flex: 1 }]}>{t('secondary.localLists')}</Text></View>
      <Text style={[ui.note, { marginTop: 12 }]}>{t('secondary.localNotice')}</Text>
    </Card>

    <Section title={t('secondary.householdTitle')} />
    <Card style={styles.householdCard}>
      <View style={styles.featureIcon}><Users size={25} color={c.primary} /></View>
      <Pill label={t('secondary.householdUnavailable')} tone="yellow" />
      <Text style={[ui.strong, { marginTop: 15 }]}>{t('secondary.shareTitle')}</Text>
      <Text style={[ui.note, { marginTop: 9, marginBottom: 18 }]}>{t('secondary.shareBody')}</Text>
      <Button label={t('secondary.howToShare')} secondary icon={Users} disabled={busy}
        onPress={() => onInfo('secondary.sharePermissionTitle', 'secondary.sharePermissionInfo')} />
    </Card>

    <Section title={t('secondary.transparency')} />
    <Card style={{ paddingVertical: 1 }}>
      <Row title={t('secondary.privacy')} subtitle={t('secondary.privacySubtitle')} icon={ShieldCheck}
        onPress={() => onInfo('secondary.privacy', 'secondary.privacyInfo')} />
      <Row title={t('secondary.help')} subtitle={t('secondary.about')} icon={BookOpen}
        onPress={() => onInfo('secondary.helpTitle', 'secondary.helpInfo')} />
    </Card>
  </View>;
}

function MoneyRow({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return <View style={styles.moneyRow}>
    <Text style={[ui.note, styles.moneyLabel]}>{label}</Text>
    <Text testID={testID} style={styles.moneyValue}>{value}</Text>
  </View>;
}

function MealRow({ name, time, onPress }: { name: string; time: string; onPress: () => void }) {
  const { t } = useI18n();
  return <Pressable accessibilityRole="button" accessibilityLabel={t('secondary.mealA11y', { name, time })}
    onPress={onPress} style={({ pressed }) => [styles.mealRow, pressed && { opacity: 0.75 }]}>
    <View style={styles.mealRowIcon}><Utensils size={21} color={c.primary} strokeWidth={1.6} /></View>
    <View style={{ flex: 1, gap: 5 }}><Text style={styles.recipeName}>{name}</Text><Text style={ui.note}>{t('secondary.mealExampleMeta', { time })}</Text></View>
    <ArrowUpRight color={c.primary} size={19} />
  </Pressable>;
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  moneyRows: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 18, paddingTop: 2 },
  moneyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 9, paddingTop: 15, paddingBottom: 6 },
  moneyLabel: { flex: 1, minWidth: 110 },
  moneyValue: { fontFamily: f.bold, color: c.deep, fontSize: 16, lineHeight: 24, flex: 1, minWidth: 110, textAlign: 'right' },
  knownTotal: { fontFamily: f.extra, color: c.deep, fontSize: 28, lineHeight: 37, letterSpacing: -0.8 },
  countRow: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 17, paddingTop: 15, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 13 },
  count: { fontFamily: f.bold, color: c.deep, fontSize: 18, lineHeight: 27, marginTop: 4 },
  emptyCard: { paddingVertical: 27, alignItems: 'center', gap: 17 },
  emptyTitle: { fontFamily: f.extra, color: c.ink, fontSize: 23, letterSpacing: -0.7, lineHeight: 31, textAlign: 'center' },
  featureIcon: { width: 53, height: 53, borderRadius: 17, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featuredMeal: { backgroundColor: '#F7EAC4', borderColor: '#E7D9AD', borderWidth: 1, paddingVertical: 19, paddingLeft: 17, paddingRight: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 15 },
  featuredName: { fontFamily: f.extra, color: c.deep, fontSize: 21, lineHeight: 28, letterSpacing: -0.6, marginTop: 13 },
  mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  recipeLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 18, minHeight: 70 },
  mealRowIcon: { width: 44, height: 51, borderRadius: 13, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  recipeName: { fontFamily: f.bold, color: c.ink, fontSize: 16, lineHeight: 23 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8EDCA' },
  profileAvatar: { width: 62, height: 62, backgroundColor: c.accent, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontFamily: f.extra, color: c.deep, fontSize: 24 },
  householdCard: { backgroundColor: '#F3F2E3' },
});
