import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ChevronRight, Package, Pencil, Plus, Search } from 'lucide-react-native';
import { CATEGORIES, itemTotalCents, type Category, type ShoppingItem, type ShoppingList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { translateIngredientName, translateIngredientNote } from '../../i18n/recipes';
import { normalizeProductSearch } from '../captureCapabilities';
import { Button, Card, Field, Notice, Pill, Title, c, f, ui } from '../components/ui';

export function SearchScreen({ lists, busy, initialCategory, onSelect, onAdd }: {
  lists: ShoppingList[]; busy: boolean; initialCategory?: Category;
  onSelect: (listId: string, itemId: string) => void; onAdd: (category?: Category) => void;
}) {
  const { t, categoryLabel, formatQuantity, unitLabel } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | undefined>(initialCategory);
  const [limit, setLimit] = useState(30);
  const results = useMemo(() => {
    const text = normalizeProductSearch(query);
    return lists.flatMap(list => list.items.filter(item => (!category || item.category === category)
      && normalizeProductSearch([item.name, item.note, translateIngredientName(item.name, t), translateIngredientNote(item.note, t), list.name].join(' ')).includes(text))
      .map(item => ({ list, item })));
  }, [lists, query, category, t]);

  return <View style={ui.page} testID="product-search-screen">
    <Title kicker="" title={t('entry.searchTitle')} subtitle={t('entry.searchSubtitle')} />
    <Field label={t('entry.searchLabel')} placeholder={t('entry.searchPlaceholder')} value={query}
      onChangeText={value => { setQuery(value.slice(0, 160)); setLimit(30); }} maxLength={160}
      autoCapitalize="none" autoCorrect={false} testID="product-search-input" />
    <Text style={ui.fieldLabel}>{t('entry.categoryFilter')}</Text>
    <View style={styles.filters}>
      {[undefined, ...CATEGORIES].map(value => <Pressable key={value ?? 'all'} accessibilityRole="button"
        accessibilityState={{ selected: category === value, disabled: busy }} disabled={busy}
        onPress={() => { setCategory(value); setLimit(30); }}
        style={[styles.filter, category === value && styles.selectedFilter]}>
        <Text style={[styles.filterText, category === value && styles.selectedFilterText]}>
          {value ? categoryLabel(value) : t('entry.allCategories')}
        </Text>
      </Pressable>)}
    </View>
    <View style={styles.resultHeading}><Search size={18} color={c.primary} />
      <Text accessibilityRole="header" style={ui.strong}>{t('entry.resultCount', { count: results.length })}</Text>
    </View>
    {results.length === 0 ? <Notice title={t(lists.some(list => list.items.length) ? 'entry.noResultsTitle' : 'entry.emptyTitle')}
      text={t(lists.some(list => list.items.length) ? 'entry.noResultsBody' : 'entry.emptyBody')} />
      : results.slice(0, limit).map(({ list, item }) => <Pressable key={list.id + ':' + item.id}
        testID={'product-result-' + item.id} accessibilityRole="button" disabled={busy}
        accessibilityState={{ disabled: busy }}
        accessibilityLabel={t('entry.openProduct', { product: translateIngredientName(item.name, t), list: list.name })}
        onPress={() => onSelect(list.id, item.id)} style={styles.result}>
        <View style={styles.productIcon}><Package size={21} color={c.primary} /></View>
        <View style={styles.flex}><Text style={ui.strong}>{translateIngredientName(item.name, t)}</Text>
          <Text style={ui.note}>{t('entry.quantityAndUnit', { quantity: formatQuantity(item.quantityMilli), unit: unitLabel(item.unit) })}</Text>
          <Text style={ui.note}>{t('entry.inList', { list: list.name })}</Text>
        </View><ChevronRight size={19} color={c.primary} />
      </Pressable>)}
    {results.length > limit && <Button secondary label={t('entry.moreResults')} disabled={busy}
      onPress={() => setLimit(value => value + 30)} />}
    <View style={styles.footer}><Pill tone="neutral" label={t('entry.localOnly')} />
      <Button label={t('entry.addManually')} icon={Plus} onPress={() => onAdd(category)} disabled={busy} testID="search-add-manually" />
    </View>
  </View>;
}

export function ProductScreen({ list, item, busy, onEdit, onBack }: {
  list?: ShoppingList; item?: ShoppingItem; busy: boolean; onEdit: () => void; onBack: () => void;
}) {
  const { t, categoryLabel, unitLabel, formatQuantity, formatMoney } = useI18n();
  if (!item || !list || !list.items.some(saved => saved.id === item.id)) return <View style={ui.page}>
    <Title kicker="" title={t('entry.productTitle')} />
    <Notice title={t('entry.missingTitle')} text={t('entry.missingBody')} />
    <Button secondary icon={ArrowLeft} label={t('entry.backToSearch')} onPress={onBack} disabled={busy} />
  </View>;
  const total = itemTotalCents(item);
  return <View style={ui.page} testID="product-detail-screen">
    <Title kicker="" title={t('entry.productTitle')} />
    <Card style={styles.productCard}><Text accessibilityRole="header" style={styles.productName}>{translateIngredientName(item.name, t)}</Text>
      <Text style={ui.body}>{categoryLabel(item.category)}</Text>
      <Text style={ui.note}>{t('entry.inList', { list: list.name })}</Text>
    </Card>
    <View style={styles.source}><Pill tone="yellow" label={t('entry.enteredByYou')} /></View>
    <Card style={styles.priceCard}><Text style={ui.strong}>{t('entry.noVerifiedPrice')}</Text>
      <Text style={ui.note}>{t('entry.noVerifiedPriceBody')}</Text>
      {item.unitPriceCents !== null && <View style={styles.priceData}>
        <Text style={ui.body}>{t(item.priceKind === 'estimated' ? 'entry.estimatedUnitPrice' : 'entry.manualUnitPrice', {
          price: formatMoney(item.unitPriceCents), unit: unitLabel(item.unit),
        })}</Text>
        {total !== null && <Text style={ui.note}>{t('entry.manualTotal', { price: formatMoney(total) })}</Text>}
      </View>}
    </Card>
    <View style={styles.detailRow}><Text style={ui.strong}>{t('entry.quantity')}</Text>
      <Text style={styles.quantity}>{t('entry.quantityAndUnit', { quantity: formatQuantity(item.quantityMilli), unit: unitLabel(item.unit) })}</Text>
    </View>
    {!!item.note && <Card><Text style={ui.fieldLabel}>{t('entry.note')}</Text><Text style={ui.body}>{translateIngredientNote(item.note, t)}</Text></Card>}
    <Text style={[ui.note, styles.reviewNote]}>{t('entry.editReviewBody')}</Text>
    <Button label={t('entry.reviewProduct')} icon={Pencil} onPress={onEdit} disabled={busy} testID="product-review-edit" />
    <View style={styles.back}><Button secondary icon={ArrowLeft} label={t('entry.backToSearch')} onPress={onBack} disabled={busy} /></View>
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 3 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 20 },
  filter: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: c.line, borderRadius: 10, justifyContent: 'center', backgroundColor: c.surface },
  selectedFilter: { backgroundColor: c.primary, borderColor: c.primary }, filterText: { color: c.ink, fontFamily: f.semi, fontSize: 13, lineHeight: 20 },
  selectedFilterText: { color: '#fff' }, resultHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  result: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, padding: 12, marginBottom: 10 },
  productIcon: { width: 38, height: 38, backgroundColor: c.soft, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: 20, marginTop: 25 }, productCard: { backgroundColor: c.neutral, gap: 8 },
  productName: { fontFamily: f.extra, color: c.deep, fontSize: 27, lineHeight: 36 }, source: { marginTop: 18, marginBottom: 24 },
  priceCard: { backgroundColor: c.soft, gap: 8 }, priceData: { gap: 6, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 12, marginTop: 5 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between', alignItems: 'center', marginVertical: 26 },
  quantity: { color: c.primary, fontFamily: f.bold, fontSize: 17, lineHeight: 25, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 15 },
  reviewNote: { marginTop: 25, marginBottom: 15 }, back: { marginTop: 12 },
});
