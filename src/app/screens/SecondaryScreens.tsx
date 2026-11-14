import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Accessibility, ArrowUpRight, BookOpen, Check, ChevronRight, Clock, Globe, ListChecks,
  MapPin, ShieldCheck, Sprout, Users, Utensils, Wallet,
} from 'lucide-react-native';
import { summarizeList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { LANGUAGE_NAMES } from '../../i18n/types';
import { MealArt } from '../components/Illustrations';
import {
  Button, Card, Notice, Pill, Section, Title, c, f, ui,
} from '../components/ui';
import type { SecondaryProps } from '../types';

/** User-confirmed expenses remain separate from list estimates and checked items. */
export function SavingsScreen({
  active, busy, onNavigate, onBudget, onCreateList, actualSpentCents, expensesLoading, expensesError,
}: SecondaryProps) {
  const { t, formatMoney, formatNumber } = useI18n();
  const summary = active ? summarizeList(active) : undefined;
  const enteredCount = active?.items.filter(item => item.priceKind === 'entered' && item.unitPriceCents !== null).length ?? 0;
  const estimatedCount = active?.items.filter(item => item.priceKind === 'estimated' && item.unitPriceCents !== null).length ?? 0;
  const markedWithEnteredPrice = summary ? summary.checkedCount - summary.spentIncompleteCount : 0;
  const hasKnownPrices = !!summary && summary.itemCount > summary.missingPriceCount;
  const budgetValue = !active || active.budgetCents === null ? t('secondary.undefined') : formatMoney(active.budgetCents);
  const actualSpending = expensesLoading ? t('common.loading') : expensesError ? t('shell.spendingUnavailable') : actualSpentCents == null ? t('visualSecondary.notRecorded') : formatMoney(actualSpentCents);
  const budgetAction = active ? active.budgetCents === null ? t('secondary.defineBudget') : t('secondary.editBudget') : t('secondary.createList');

  return <View style={ui.page}>
    <View style={styles.pageHeading}>
      <Text accessibilityRole="header" style={styles.pageTitle}>{t('visualSecondary.savingsTitle')}</Text>
      <Text style={ui.note}>{t('visualSecondary.savingsSubtitle')}</Text>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel={budgetAction} accessibilityState={{ disabled: busy }}
      testID="edit-budget" accessibilityHint={t('visualSecondary.budgetA11y', { budget: budgetValue, spending: actualSpending })} disabled={busy} onPress={active ? onBudget : onCreateList}
      style={({ pressed }) => [ui.card, styles.budgetCard, (pressed || busy) && { opacity: 0.7 }]}>
      <View style={styles.cardHeading}>
        <Text style={[ui.strong, { flex: 1 }]}>{active ? t('secondary.budgetFor', { name: active.name }) : t('secondary.weeklyBudget')}</Text>
        <ChevronRight size={20} color={c.deep} />
      </View>
      <Text style={[ui.number, { marginTop: 8 }]}>
        {budgetValue}
      </Text>
      <View style={styles.realSpending}>
        <Text style={styles.budgetNote}>{t('visualSecondary.actualSpending')}</Text>
        <Text testID="actual-spend-total" style={styles.budgetNote}>{actualSpending}</Text>
      </View>
    </Pressable>

    <Card style={styles.comparisonCard}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{t('visualSecondary.compareProducts')}</Text>
      <Text style={[ui.body, { marginTop: 10 }]}>{t('visualSecondary.noVerifiedPrices')}</Text>
      <Text style={[ui.note, { marginTop: 6 }]}>{t('visualSecondary.sourcesPending')}</Text>
    </Card>
    <Button label={active ? t('visualSecondary.consultList') : t('secondary.createList')} icon={ListChecks}
      onPress={active ? () => onNavigate('list') : onCreateList} disabled={busy} testID="savings-cta" />
    <View style={styles.savingsPill}><Pill label={t('visualSecondary.noSavingsCalculation')} tone="neutral" /></View>

    {active && summary && <>
      <Section title={t('visualSecondary.listAmounts')} />
      <Card>
        <Text style={ui.note}>{t('visualSecondary.annotatedTotal')}</Text>
        <Text testID="known-total" style={[styles.knownTotal, { marginTop: 5 }]}>
          {hasKnownPrices ? formatMoney(summary.knownTotalCents) : t('secondary.totalPending')}
        </Text>
        <Text style={[ui.note, { marginTop: 9 }]}>{t('visualSecondary.annotatedHelp')}</Text>
        <View style={styles.countRow}>
          <View style={{ flex: 1 }}>
            <Text style={ui.note}>{t('secondary.missingPrices')}</Text>
            <Text testID="missing-price-count" style={styles.count}>{t('secondary.coverage', { missing: formatNumber(summary.missingPriceCount), total: formatNumber(summary.itemCount) })}</Text>
          </View>
          <Pill label={summary.itemCount === 0 ? t('secondary.noProducts') : summary.missingPriceCount > 0 ? t('secondary.partialForecast') : t('secondary.calculatedForecast')}
            tone={summary.missingPriceCount > 0 ? 'yellow' : 'green'} />
        </View>
        <View style={styles.moneyRows}>
          <MoneyRow label={t('visualSecondary.markedAmount')} value={
            summary.checkedCount === 0 ? t('secondary.noMarkedPurchases')
              : markedWithEnteredPrice === 0 ? t('secondary.noEnteredPrice')
                : formatMoney(summary.spentCents)
          } testID="spent-total" />
          <Text style={ui.note}>
            {t('visualSecondary.markingIsNotPayment')}
            {summary.spentIncompleteCount > 0
              ? t('secondary.missingMarkedAmounts', { count: formatNumber(summary.spentIncompleteCount) })
              : ''}
          </Text>
          <MoneyRow label={t('secondary.enteredPrices')} value={enteredCount ? formatMoney(summary.enteredTotalCents) : t('secondary.noData')} testID="entered-total" />
          <MoneyRow label={t('secondary.estimates')} value={estimatedCount ? formatMoney(summary.estimatedTotalCents) : t('secondary.noEstimates')} testID="estimated-total" />
        </View>
      </Card>
      {summary.excessCents > 0 && <View style={{ marginTop: 16 }}>
        <Notice kind="warning" title={t('secondary.overBudgetTitle')}
          text={t('secondary.overBudgetBody', { amount: formatMoney(summary.excessCents) })}
          action={t('secondary.reviewShopping')} onPress={() => onNavigate('list')} />
      </View>}
    </>}

    <Section title={t('shell.yourRecords')} />
    <View style={{ gap: 10 }}><Button secondary label={t('shell.budget')} testID="open-budget-page" disabled={busy} onPress={() => onNavigate('budget')} />
      <Button secondary label={t('shell.history')} testID="open-history" disabled={busy} onPress={() => onNavigate('history')} />
      <Button secondary label={t('shell.stores')} testID="open-stores" disabled={busy} onPress={() => onNavigate('stores')} /></View>
    <Section title={t('visualSecondary.manualTools')} />
    <View style={{ gap: 12 }}>
      <Text style={ui.note}>{t('visualSecondary.manualToolsHelp')}</Text>
      <Button label={t('secondary.openPilot')} testID="open-price-pilot" secondary
        onPress={() => onNavigate('prices')} disabled={busy} />
      <Button label={t('secondary.openLegacy')} secondary onPress={() => onNavigate('comparisons')}
        disabled={busy} testID="open-comparisons" />
    </View>
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
  active, lists, busy, onNavigate, onInfo, onLanguage,
}: SecondaryProps) {
  const { t, language, source, formatMoney, formatNumber } = useI18n();
  const itemCount = lists.reduce((count, list) => count + list.items.length, 0);
  return <View style={ui.page}>
    <View style={styles.pageHeading}>
      <Text accessibilityRole="header" style={styles.pageTitle}>{t('visualSecondary.mySpace')}</Text>
    </View>
    <View style={styles.profileRows}>
      <ProfileRow title={t('visualSecondary.localMode')} subtitle={t('visualSecondary.noAccountOrSync')} icon={ShieldCheck}
        right={<Check color={c.primary} size={20} />} disabled={busy}
        onPress={() => onInfo('secondary.localLists', 'secondary.localNotice')} />
      <ProfileRow title={t('visualSecondary.myHousehold')} subtitle={t('visualSecondary.householdSubtitle')} icon={Users} disabled={busy}
        onPress={() => onInfo('secondary.sharePermissionTitle', 'secondary.sharePermissionInfo')} />
      <ProfileRow title={t('secondary.weeklyBudget')} icon={Wallet} disabled={busy}
        subtitle={!active ? t('secondary.createForBudget') : active.budgetCents === null ? t('secondary.noActiveBudget') : `${formatMoney(active.budgetCents)} · ${active.name}`}
        testID="profile-budget" onPress={() => onNavigate('budget')} />
      <ProfileRow testID="language-settings" title={t('common.language')} subtitle={`${LANGUAGE_NAMES[language]} · ${t(source === 'manual' ? 'common.manualSource' : 'common.deviceSource')}`}
        icon={Globe} disabled={busy} onPress={onLanguage} />
      <ProfileRow testID="profile-stores" title={t('shell.stores')} subtitle={t('shell.storesHelp')} icon={MapPin} disabled={busy} onPress={() => onNavigate('stores')} />
      <ProfileRow testID="profile-notifications" title={t('shell.notifications')} subtitle={t('shell.notificationsHelp')} icon={Clock} disabled={busy} onPress={() => onNavigate('notifications')} />
      <ProfileRow testID="profile-privacy" title={t('secondary.privacy')} subtitle={t('privacy.profileSubtitle')} icon={ShieldCheck} disabled={busy}
        onPress={() => onNavigate('privacy')} />
    </View>

    <Card style={styles.householdCard}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{t('visualSecondary.familyCollaboration')}</Text>
      <Text style={[ui.note, { marginTop: 10 }]}>{t('visualSecondary.comingLater')}</Text>
    </Card>

    <Section title={t('secondary.yourWay')} />
    <View style={styles.profileRows}>
      <ProfileRow title={t('secondary.yourArea')} subtitle="Tenerife" icon={MapPin} disabled={busy}
        onPress={() => onInfo('secondary.yourArea', 'secondary.areaInfo')} />
      <ProfileRow title={t('secondary.accessibility')} subtitle={t('secondary.accessibilitySubtitle')} icon={Accessibility} disabled={busy}
        onPress={() => onInfo('secondary.readingTitle', 'secondary.readingInfo')} />
      <ProfileRow title={t('secondary.help')} subtitle={t('secondary.about')} icon={BookOpen} disabled={busy}
        onPress={() => onInfo('secondary.helpTitle', 'secondary.helpInfo')} />
    </View>
    <Button secondary label={t('shell.states')} testID="open-state-review" disabled={busy} onPress={() => onNavigate('states')} />
    <Text style={[ui.note, styles.localSummary]}>
      {t(lists.length === 1 ? 'secondary.listCountOne' : 'secondary.listCountMany', { count: formatNumber(lists.length) })} · {t(itemCount === 1 ? 'secondary.productCountOne' : 'secondary.productCountMany', { count: formatNumber(itemCount) })}
    </Text>
  </View>;
}

function ProfileRow({ title, subtitle, icon: Icon, onPress, disabled, right, testID }: {
  title: string; subtitle: string; icon: typeof Wallet; onPress: () => void;
  disabled: boolean; right?: React.ReactNode; testID?: string;
}) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={subtitle}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.profileRow, (pressed || disabled) && { opacity: 0.65 }]}>
    <View style={styles.profileRowIcon}><Icon size={21} color={c.primary} strokeWidth={1.7} /></View>
    <View style={{ flex: 1, gap: 4 }}><Text style={ui.strong}>{title}</Text><Text style={ui.note}>{subtitle}</Text></View>
    {right ?? <ChevronRight size={19} color={c.primary} />}
  </Pressable>;
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
  featuredMeal: { backgroundColor: '#F7EAC4', borderColor: '#E7D9AD', borderWidth: 1, paddingVertical: 19, paddingLeft: 17, paddingRight: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 15 },
  featuredName: { fontFamily: f.extra, color: c.deep, fontSize: 21, lineHeight: 28, letterSpacing: -0.6, marginTop: 13 },
  mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  recipeLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 18, minHeight: 70 },
  mealRowIcon: { width: 44, height: 51, borderRadius: 13, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  recipeName: { fontFamily: f.bold, color: c.ink, fontSize: 16, lineHeight: 23 },
  pageHeading: { gap: 5, marginTop: 22, marginBottom: 18 },
  pageTitle: { fontFamily: f.extra, color: c.ink, fontSize: 25, lineHeight: 33, letterSpacing: -0.6 },
  budgetCard: { backgroundColor: c.paleYellow, padding: 16 },
  budgetNote: { fontFamily: f.medium, color: c.deep, fontSize: 13, lineHeight: 21 },
  realSpending: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  comparisonCard: { backgroundColor: c.soft, padding: 16, marginTop: 18, marginBottom: 20 },
  cardTitle: { fontFamily: f.bold, color: c.ink, fontSize: 18, lineHeight: 26 },
  savingsPill: { marginTop: 20 },
  profileRows: { gap: 10 },
  profileRow: { minHeight: 64, borderWidth: 1, borderColor: c.line, borderRadius: 17, padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface },
  profileRowIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  localSummary: { marginTop: 16 },
  householdCard: { backgroundColor: c.soft, padding: 16, marginTop: 24 },
});
