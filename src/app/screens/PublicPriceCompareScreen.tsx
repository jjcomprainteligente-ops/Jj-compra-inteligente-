import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ShoppingList } from '../../domain/shopping';
import type { StoreId } from '../../domain/stores';
import {
  PUBLIC_PRICE_ATTRIBUTION_URL, PUBLIC_PRICE_DATA_URL, estimateListLine,
  isComparablePublicPrice, normalizePublicName, parsePublicPrices,
  publicPriceGroups, type PublicPrice, type PublicPriceChain,
} from '../../domain/publicPriceFeed';
import { publicStoreDestination } from '../../domain/stores';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Notice, Title, c, f, ui } from '../components/ui';

type Props = {
  selectedStores: readonly StoreId[];
  list?: ShoppingList;
  onBack: () => void;
  onStores: () => void;
};
const SUPPORTED: PublicPriceChain[] = ['hiperdino', 'mercadona'];
const nameOf = (chain: PublicPriceChain) => chain === 'hiperdino' ? 'HiperDino' : 'Mercadona';

async function loadPublicPrices(): Promise<PublicPrice[]> {
  const urls = Platform.OS === 'web' ? ['/api/public-prices', PUBLIC_PRICE_DATA_URL] : [PUBLIC_PRICE_DATA_URL];
  let last: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'text/csv' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const parsed = parsePublicPrices(await res.text());
      if (!parsed.length) throw new Error('No compatible rows');
      return parsed;
    } catch (e) { last = e; }
  }
  throw last instanceof Error ? last : new Error('Source unavailable');
}

/** Comparison is done inside JJ. Prices are attributed aggregated indicators, not shelf quotes. */
export function PublicPriceCompareScreen({ selectedStores, list, onBack, onStores }: Props) {
  const { t, formatMoney, formatNumber } = useI18n();
  const [prices, setPrices] = useState<PublicPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [linkFailed, setLinkFailed] = useState(false);
  const reload = async () => {
    setFailed(false); setLoading(true);
    try { setPrices(await loadPublicPrices()); }
    catch { setPrices([]); setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const selected = SUPPORTED.filter(id => selectedStores.includes(id));
  const groups = useMemo(() =>
    publicPriceGroups(prices.filter(price => selected.includes(price.chain))),
    [prices, selectedStores.join('|')]);
  const shown = groups.filter(group => normalizePublicName(group.product).includes(normalizePublicName(search)));
  const listReports = selected.map(chain => {
    let cents = 0, matched = 0;
    for (const item of list?.items ?? []) {
      const group = groups.find(g => estimateListLine(item, g) !== null &&
        g.prices.some(p => p.chain === chain && isComparablePublicPrice(p)));
      const quantity = group && estimateListLine(item, group);
      const matchingPrice = group?.prices.find(p => p.chain === chain && isComparablePublicPrice(p));
      if (!matchingPrice || quantity == null) continue;
      matched++;
      cents += Math.round(quantity * matchingPrice.centsPerUnit);
    }
    return { chain, matched, cents };
  });
  const open = async (url: string) => {
    setLinkFailed(false);
    try { await Linking.openURL(url); } catch { setLinkFailed(true); }
  };

  return <View testID="public-price-screen" style={ui.page}>
    <Title kicker={t('openPrices.comparison')} title={t('openPrices.title')} subtitle={t('openPrices.subtitle')} />
    <Button secondary testID="public-prices-stores" label={t('openPrices.selectStores')} onPress={onStores} />
    <Notice kind="info" title={t('openPrices.limited')} text={t('openPrices.partial')} />
    {!selectedStores.length ? <Notice title={t('openPrices.emptyStores')} text={t('openPrices.noCoverage')} /> :
      !selected.length ? <Notice title={t('openPrices.noCoverage')} text={t('openPrices.limited')} /> : null}
    <Button secondary testID="public-prices-refresh" label={t('openPrices.retry')}
      disabled={loading} onPress={() => { void reload(); }} />
    {loading && <ActivityIndicator color={c.primary} accessibilityLabel={t('openPrices.loading')} />}
    {failed && <Notice kind="error" title={t('openPrices.failure')} text={t('openPrices.source')} />}
    {linkFailed && <Notice kind="error" title={t('storePilot.openErrorTitle')} text={t('storePilot.openError')} />}
    {prices.length > 0 && selected.length > 0 && <>
      {list && list.items.length > 0 && <Card>
        <Text style={styles.title}>{t('openPrices.comparison')}</Text>
        {listReports.map(report => <View key={report.chain} style={styles.report}>
          <Text style={styles.name}>{nameOf(report.chain)}</Text>
          <Text style={ui.note}>{t('openPrices.matchCount', {
            count: formatNumber(report.matched), total: formatNumber(list.items.length),
          })}</Text>
          {report.matched ? <Text style={styles.amount}>
            {formatMoney(report.cents)} · {t('openPrices.partial')}
          </Text> : <Text style={ui.note}>{t('openPrices.noBasket')}</Text>}
        </View>)}
      </Card>}
      <TextInput testID="public-prices-search" accessibilityLabel={t('openPrices.search')}
        value={search} onChangeText={setSearch} style={styles.search}
        placeholder={t('openPrices.search')} placeholderTextColor={c.muted} />
      {shown.map(group => <Card key={group.key}>
        <Text style={styles.title}>{group.product}</Text>
        <Text style={ui.note}>{t('openPrices.range', { unit: group.unit })}</Text>
        {group.prices.map(price => <View key={price.id} style={styles.row}>
          <View style={styles.storeText}>
            <Text style={styles.name}>{nameOf(price.chain)}</Text>
            <Text style={ui.note}>{t('openPrices.date', { date: price.date })}</Text>
            {!isComparablePublicPrice(price) &&
              <Text style={styles.warning}>{t('openPrices.outdated')}</Text>}
          </View>
          <Text style={styles.amount}>{formatMoney(price.centsPerUnit)}</Text>
        </View>)}
        {selected.filter(chain => !group.prices.some(p => p.chain === chain)).map(chain =>
          <Text style={ui.note} key={chain}>{nameOf(chain)}: {t('openPrices.noDate')}</Text>)}
      </Card>)}
      {!shown.length && <Text style={ui.note}>{t('openPrices.noCoverage')}</Text>}
    </>}
    <Card>
      <Text style={styles.title}>{t('openPrices.source')}</Text>
      <Button secondary label={t('openPrices.sourceAction')} onPress={() => { void open(PUBLIC_PRICE_ATTRIBUTION_URL); }} />
      {selected.map(chain => {
        const url = publicStoreDestination(chain)?.url;
        return url ? <Button key={chain} secondary
          label={t('openPrices.storeAction') + ': ' + nameOf(chain)}
          onPress={() => { void open(url); }} /> : null;
      })}
      <Text style={ui.note}>{t('openPrices.noPayment')}</Text>
    </Card>
    <Button secondary label={t('shell.back')} onPress={onBack} />
  </View>;
}

const styles = StyleSheet.create({
  title: { color: c.ink, fontFamily: f.bold, fontSize: 17, marginBottom: 6 },
  search: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 12,
    color: c.ink, paddingHorizontal: 12, minHeight: 48, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, gap: 12 },
  report: { paddingVertical: 9, gap: 5 },
  storeText: { flex: 1 },
  name: { color: c.ink, fontFamily: f.medium, fontSize: 14 },
  amount: { color: c.deep, fontFamily: f.bold, fontSize: 16 },
  warning: { color: c.muted, marginTop: 5, fontSize: 12 },
});
