import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Barcode, Check, ChevronDown, ChevronRight, Leaf, Mic, Pencil, Plus, Share2, ShoppingBag, Trash2, Wallet } from 'lucide-react-native';
import { CATEGORIES, itemTotalCents, summarizeList, type Category, type ShoppingItem, type ShoppingList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { translateIngredientName, translateIngredientNote } from '../../i18n/recipes';
import { Button, Card, IconButton, Notice, Pill, Section, Title, c, f, ui } from '../components/ui';

interface Props {
  active?: ShoppingList; busy: boolean; actualSpentCents?: number | null; expensesLoading?: boolean; expensesError?: string; onCreate(): void; onOpenList(): void; onMenus(): void; onDiscover(): void;
  onSearch(category?: Category): void; onVoice(): void; onScanner(): void; onChoose(): void; onBudget(): void; onAdd(category?: Category): void; onRename(): void; onDeleteList(): void;
  onEdit(item: ShoppingItem): void; onDelete(item: ShoppingItem): void; onToggle(item: ShoppingItem): void; onShare(): void; shareDisabled: boolean;
}

export function HomeScreen(p: Props) {
  const { t } = useI18n();
  const small = useWindowDimensions().height < 750;
  const primaryAction = <View style={{ marginTop: 18 }}><Button label={t(p.active ? 'app.continueShopping' : 'app.createFirstList')}
    onPress={p.active ? p.onOpenList : p.onCreate} disabled={p.busy} testID={p.active ? 'main-cta' : 'create-list'} /></View>;
  const categories = [
    { label: 'visual.fruit', category: 'Fruta y verdura' },
    { label: 'visual.fresh', category: 'Lácteos y huevos' },
    { label: 'visual.pantry', category: 'Despensa' },
    { label: 'visual.more', category: 'Otros' },
  ] as const;
  return <View style={ui.page}>
    <View style={{ marginTop: 14 }}><Pill label={t('visual.localMode')} /></View>
    <Title kicker={t('app.homeKicker')} title={t('visual.homeTitle')} />
    <View style={styles.quickEntry}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('shell.search')} disabled={p.busy}
        testID="open-search" onPress={() => p.onSearch()} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}>
        <Text style={styles.quickText}>{t('app.quickEntry')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('shell.voice')} testID="open-voice" disabled={p.busy} onPress={p.onVoice} style={styles.quickAdd}><Mic color={c.surface} size={21} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('shell.scanner')} testID="open-scanner" disabled={p.busy} onPress={p.onScanner} style={styles.quickAdd}><Barcode color={c.surface} size={21} /></Pressable>
    </View>
    {small && primaryAction}
    <Section title={t('visual.categories')} />
    <View style={styles.categories}>{categories.map(({ label, category }) =>
      <Pressable key={label} accessibilityRole="button" disabled={p.busy}
        accessibilityLabel={t(p.active ? 'visual.categoryAction' : 'app.createShoppingA11y', { category: t(label) })}
        onPress={p.active ? () => p.onAdd(category) : p.onCreate} style={styles.categoryTile}>
        <Text style={styles.categoryText}>{t(label)}</Text>
      </Pressable>)}</View>
    <View style={{ marginTop: 18 }}>{p.active ? <Budget active={p.active} onBudget={p.onBudget} busy={p.busy} actualSpentCents={p.actualSpentCents} expensesLoading={p.expensesLoading} expensesError={p.expensesError} /> : <Card style={styles.budget}>
      <Text style={[ui.note, { color: c.deep }]}>{t('app.listBudget')}</Text>
      <Text style={styles.budgetValue}>{t('app.undefined')}</Text>
      <Text style={[ui.note, { color: c.deep, marginTop: 6 }]}>{t('visual.actualSpend')}</Text>
      <Text style={[ui.note, { marginTop: 8 }]}>{t('app.emptyBudgetBody')}</Text>
    </Card>}</View>
    {!small && primaryAction}
    <Section title={t('visual.cookingIdeas')} />
    <View style={styles.ideas}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('visual.thisWeek')} onPress={p.onMenus} disabled={p.busy} style={[styles.idea, { backgroundColor: c.soft }]}>
        <Text style={ui.body}>{t('visual.thisWeek')}</Text><ChevronRight size={18} color={c.primary} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('visual.discoverRecipes')} onPress={p.onDiscover} disabled={p.busy} style={styles.idea}>
        <Text style={ui.body}>{t('visual.discoverRecipes')}</Text><ChevronRight size={18} color={c.primary} />
      </Pressable>
    </View>
    {p.active && <View style={{ marginTop: 20 }}><Button label={t('app.createAnotherList')} secondary onPress={p.onCreate} disabled={p.busy} testID="create-list" icon={Plus} /></View>}
    <View style={styles.footerNote}><Leaf size={19} color={c.primary} /><Text style={[ui.note, { flex: 1 }]}>{t('app.localListsNote')}</Text></View>
  </View>;
}

export function ListScreen(p: Props) {
  const { t, categoryLabel } = useI18n();
  const summary = p.active ? summarizeList(p.active) : undefined;
  return <View style={ui.page}>
    <Title kicker={t('app.listKicker')} title={t('app.listTitle')} />
    <View style={{ gap: 8, marginBottom: 16 }}><Button secondary label={t('shell.search')} onPress={() => p.onSearch()} testID="list-open-search" disabled={p.busy} /></View>
    {!p.active || !summary ? <Card>
      <ShoppingBag size={40} color={c.primary} /><Text style={[styles.emptyTitle, { marginTop: 19 }]}>{t('app.emptyListTitle')}</Text>
      <Text style={[ui.note, { marginTop: 10, marginBottom: 23 }]}>{t('app.emptyListBody')}</Text>
      <Button label={t('app.createMyList')} onPress={p.onCreate} testID="create-list" disabled={p.busy} icon={Plus} />
    </Card> : <>
      <Pressable accessibilityRole="button" accessibilityLabel={t('app.chooseList')} disabled={p.busy} onPress={p.onChoose} style={styles.listSelector}>
        <Text style={[ui.strong, { fontSize: 18, flex: 1 }]}>{p.active.name}</Text><ChevronDown size={21} color={c.primary} />
      </Pressable>
      <View style={styles.listActions}><Pressable accessibilityRole="button" accessibilityLabel={t('app.renameList')} disabled={p.busy} onPress={p.onRename} style={styles.textAction}><Pencil size={16} color={c.primary} /><Text style={ui.link}>{t('app.rename')}</Text></Pressable>
        <Pressable testID="share-list" accessibilityRole="button" accessibilityLabel={t('listSharing.openA11y')} disabled={p.shareDisabled || p.active.items.length === 0} onPress={p.onShare} style={styles.textAction}><Share2 size={16} color={c.primary} /><Text style={ui.link}>{t('listSharing.open')}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('app.deleteList')} disabled={p.busy} onPress={p.onDeleteList} style={styles.textAction}><Trash2 size={16} color={c.danger} /><Text style={[ui.link, { color: c.danger }]}>{t('app.deleteList')}</Text></Pressable>
      </View>
      <Budget active={p.active} onBudget={p.onBudget} busy={p.busy} actualSpentCents={p.actualSpentCents} expensesLoading={p.expensesLoading} expensesError={p.expensesError} compact />
      <View style={styles.listCount}><Text accessibilityRole="header" style={ui.strong}>{t('app.listCount', { count: summary.itemCount })}</Text>
        <Text style={[ui.note, { flex: 1, textAlign: 'right' }]}>{t('app.progressCounts', { checked: summary.checkedCount, pending: summary.itemCount - summary.checkedCount })}</Text></View>
      {summary.itemCount === 0 && <Card><Text style={ui.strong}>{t('app.noItemsTitle')}</Text><Text style={[ui.note, { marginTop: 8 }]}>{t('app.noItemsBody')}</Text></Card>}
      {CATEGORIES.map(category => {
        const items = p.active!.items.filter(item => item.category === category);
        return items.length > 0 && <View key={category} style={{ marginBottom: 18 }}>
          <Text accessibilityRole="header" style={styles.category}>{categoryLabel(category)}</Text>
          <View style={{ gap: 8 }}>{items.map(item => <ItemRow key={item.id} item={item} {...p} />)}</View>
        </View>;
      })}
      {summary.missingPriceCount > 0 && <Notice title={t('app.incompleteForecast')} text={t('app.missingPricesBody', { count: summary.missingPriceCount })} />}
    </>}
  </View>;
}

function Budget({ active, onBudget, busy, compact = false, actualSpentCents, expensesLoading, expensesError }: { active: ShoppingList; onBudget(): void; busy: boolean; compact?: boolean; actualSpentCents?: number | null; expensesLoading?: boolean; expensesError?: string }) {
  const { t, formatMoney } = useI18n();
  const summary = summarizeList(active);
  const hasPrices = summary.itemCount > summary.missingPriceCount;
  const budgetValue = active.budgetCents === null ? t('app.undefined') : formatMoney(active.budgetCents);
  return <Card style={[styles.budget, compact && styles.compactBudget]}>
    <View style={[styles.between, compact && { flexWrap: 'wrap', gap: 6 }]}><View style={{ flex: 1, minWidth: compact ? 80 : undefined, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {!compact && <Wallet size={18} color={c.deep} />}
      <Text style={[ui.note, { color: c.deep, flex: 1 }]}>{t(compact ? 'app.budget' : 'app.listBudget')}</Text></View>
      {compact && <Text style={[styles.budgetValue, styles.compactBudgetValue]}>{budgetValue}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel={t(active.budgetCents === null ? 'app.defineBudget' : 'app.editBudget')}
        onPress={onBudget} testID="edit-budget" disabled={busy} style={styles.budgetEdit}><Pencil size={19} color={c.deep} /></Pressable>
    </View>
    {!compact && <Text style={[styles.budgetValue, { marginTop: 2 }]}>{budgetValue}</Text>}
    {!compact && <Text testID="home-actual-spend" style={[ui.note, { color: c.deep, marginTop: 5 }]}>{t('visualSecondary.actualSpending')}: {expensesLoading ? t('common.loading') : expensesError ? t('shell.spendingUnavailable') : actualSpentCents == null ? t('visualSecondary.notRecorded') : formatMoney(actualSpentCents)}</Text>}
    {compact && <><View style={[styles.budgetRow, compact && { marginTop: 4, paddingTop: 8 }]}><Text style={[ui.note, { color: c.deep, flex: 1, minWidth: 120 }]}>{t(hasPrices && summary.missingPriceCount > 0 ? 'app.knownPartialForecast' : 'app.knownForecast')}</Text>
      <Text style={[ui.strong, { flex: 1, minWidth: 120, textAlign: 'right' }]}>{hasPrices ? formatMoney(summary.knownTotalCents) : t('app.noPricesYet')}</Text></View>
    {summary.excessCents > 0 && <Text style={[ui.note, { color: c.danger, marginTop: 8 }]}>{t('app.overBudget', { amount: formatMoney(summary.excessCents) })}</Text>}
    <Text style={[ui.note, { color: c.deep, marginTop: compact ? 5 : 9 }]}>{summary.itemCount === 0 ? t('app.emptyBudgetList') : summary.missingPriceCount > 0 ? t(hasPrices ? 'app.unpricedPartial' : 'app.unpriced', { count: summary.missingPriceCount }) : t('app.includesEstimates')}</Text></>}
  </Card>;
}

function ItemRow({ item, busy, onToggle, onEdit, onDelete }: Props & { item: ShoppingItem }) {
  const { t, formatMoney, formatQuantity, unitLabel } = useI18n();
  const name = translateIngredientName(item.name, t);
  const note = translateIngredientNote(item.note, t);
  const total = itemTotalCents(item);
  return <View testID="shopping-item" style={styles.item}>
    <View style={styles.itemTop}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={t('app.checkItemA11y', { name })} accessibilityState={{ checked: item.checked, disabled: busy }} aria-checked={item.checked}
        disabled={busy} onPress={() => onToggle(item)} style={styles.checkboxTarget}>
        <View style={[styles.checkbox, item.checked && { backgroundColor: c.primary, borderColor: c.primary }]}>{item.checked && <Check size={18} color="#fff" />}</View>
      </Pressable>
      <View style={{ flex: 1, gap: 5 }}><Text style={[ui.strong, item.checked && { textDecorationLine: 'line-through', color: c.muted }]}>{name}</Text>
        <Text style={ui.note}>{formatQuantity(item.quantityMilli)} {unitLabel(item.unit)} · {total === null ? t('app.noPrice') : item.priceKind === 'estimated' ? t('app.estimatedAmount', { amount: formatMoney(total) }) : formatMoney(total)}</Text>
        {!!note && <Text style={ui.note}>{note}</Text>}
      </View>
    </View>
    <View style={styles.itemActions}><IconButton label={t('app.editItemA11y', { name })} icon={Pencil} onPress={() => onEdit(item)} disabled={busy} />
      <IconButton label={t('app.deleteItemA11y', { name })} icon={Trash2} onPress={() => onDelete(item)} danger disabled={busy} /></View>
  </View>;
}

const styles = StyleSheet.create({
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryTile: { flex: 1, minWidth: 68, minHeight: 72, paddingVertical: 16, paddingHorizontal: 6, backgroundColor: c.neutral, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  categoryText: { fontFamily: f.medium, fontSize: 13, lineHeight: 20, color: c.deep, textAlign: 'center' },
  quickAdd: { width: 44, height: 44, backgroundColor: c.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idea: { flex: 1, minWidth: 140, minHeight: 58, padding: 12, borderRadius: 16, backgroundColor: c.neutral, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  quickEntry: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8, paddingVertical: 7 },
  quickText: { flex: 1, fontFamily: f.medium, fontSize: 14, lineHeight: 22, color: c.muted },
  budget: { backgroundColor: c.paleYellow, borderColor: c.line, borderRadius: 15, paddingVertical: 11 },
  compactBudget: { paddingHorizontal: 14, paddingVertical: 7 },
  compactBudgetValue: { fontSize: 22, lineHeight: 29, letterSpacing: -.5, flexShrink: 1, textAlign: 'right' },
  budgetEdit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  emptyTitle: { fontFamily: f.extra, fontSize: 24, lineHeight: 32, letterSpacing: -.7, color: c.deep },
  footerNote: { marginTop: 25, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listSelector: { minHeight: 52, backgroundColor: c.soft, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  listActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  textAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 },
  listCount: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9, marginTop: 17, marginBottom: 12 },
  budgetValue: { fontFamily: f.extra, color: c.deep, fontSize: 29, lineHeight: 38, letterSpacing: -.8 },
  budgetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#DCDDC5' },
  category: { fontFamily: f.bold, color: c.deep, fontSize: 19, lineHeight: 27, marginBottom: 10 },
  item: { paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: c.line, borderRadius: 16, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 4 }, itemTop: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  checkboxTarget: { width: 44, minHeight: 44, alignItems: 'center', paddingTop: 2 }, checkbox: { width: 25, height: 25, borderRadius: 8, borderWidth: 1.5, borderColor: '#748268', alignItems: 'center', justifyContent: 'center' },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
