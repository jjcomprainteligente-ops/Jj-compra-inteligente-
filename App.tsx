import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ArrowRight, Check, Info, RefreshCw, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react-native';
import { Button, ErrorBanner, Field, IconButton, Sheet } from './src/components/ui';
import { createId, validateComparisonName, validateOfferUrl, type Comparison, type Offer } from './src/domain/comparisons';
import { loadComparisons, saveComparisons, STORAGE_KEY } from './src/storage/comparisons';
import { saveIfUnchanged } from './src/storage/writeCoordinator';
import { useI18n } from './src/i18n/LanguageProvider';
import { DetailScreen, HomeScreen, OfferScreen } from './src/screens';
import { colors as c, fonts as f } from './src/theme';

type Route = { screen: 'home' } | { screen: 'detail'; comparisonId: string } | { screen: 'offer'; comparisonId: string; offerId?: string };
type NameDialog = { kind: 'create' } | { kind: 'rename'; id: string };
type DeleteDialog = { kind: 'comparison'; id: string } | { kind: 'offer'; comparisonId: string; id: string };

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  return <SafeAreaProvider><StatusBar style="dark" />{!fontsLoaded && !fontError ? <View style={s.loading}><ActivityIndicator size="large" color={c.green} /></View> : <ComparisonApp />}</SafeAreaProvider>;
}

function ComparisonApp() {
  const { t } = useI18n();
  const wide = useWindowDimensions().width >= 800;
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [route, setRoute] = useState<Route>({ screen: 'home' });
  const [nameDialog, setNameDialog] = useState<NameDialog | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog | null>(null);
  const [info, setInfo] = useState(false);
  const [visitError, setVisitError] = useState('');
  const [visitStore, setVisitStore] = useState('');
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const reload = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { setComparisons(await loadComparisons()); }
    catch (error) { setLoadError(error instanceof Error ? error.message : 'legacy.errorLoad'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const navigate = useCallback((next: Route) => {
    if (lock.current) return;
    setRoute(next); setSaveError(''); setVisitError('');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);
  const back = useCallback(() => {
    if (route.screen === 'offer') navigate({ screen: 'detail', comparisonId: route.comparisonId });
    else navigate({ screen: 'home' });
  }, [route, navigate]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (lock.current) return true;
      if (route.screen !== 'home') { back(); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [route, back]);

  // Only expose new state after persistence succeeds. The ref closes the gap before rerender.
  const commit = async (next: Comparison[], onSuccess: () => void): Promise<boolean> => {
    if (lock.current || loading || loadError) return false;
    lock.current = true; setBusy(true); setSaveError('');
    try {
      const saved = await saveIfUnchanged({ key: STORAGE_KEY, expected: comparisons, next, read: loadComparisons, write: saveComparisons });
      setComparisons(saved);
      onSuccess();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'legacy.errorSave');
      return false;
    } finally { lock.current = false; setBusy(false); }
  };
  const current = route.screen === 'home' ? undefined : comparisons.find(item => item.id === route.comparisonId);
  const openName = (dialog: NameDialog) => {
    if (lock.current) return;
    setName(dialog.kind === 'rename' ? comparisons.find(item => item.id === dialog.id)?.name ?? '' : '');
    setNameError(''); setSaveError(''); setNameDialog(dialog);
  };
  const submitName = async () => {
    if (!nameDialog) return;
    let validName: string;
    try { validName = validateComparisonName(name); }
    catch (error) { setNameError((error as Error).message); return; }
    if (nameDialog.kind === 'create') {
      const id = createId();
      await commit([{ id, name: validName, offers: [] }, ...comparisons], () => { setNameDialog(null); setRoute({ screen: 'detail', comparisonId: id }); });
    } else {
      await commit(comparisons.map(item => item.id === nameDialog.id ? { ...item, name: validName } : item), () => setNameDialog(null));
    }
  };
  const saveOffer = async (value: Omit<Offer, 'id'>): Promise<boolean> => {
    if (route.screen !== 'offer' || !current) return false;
    const offer: Offer = { ...value, id: route.offerId ?? createId() };
    const offers = route.offerId ? current.offers.map(item => item.id === route.offerId ? offer : item) : [...current.offers, offer];
    return commit(comparisons.map(item => item.id === current.id ? { ...item, offers } : item), () => setRoute({ screen: 'detail', comparisonId: current.id }));
  };
  const confirmDelete = async () => {
    if (!deleteDialog) return;
    const target = deleteDialog;
    const next = target.kind === 'comparison' ? comparisons.filter(item => item.id !== target.id) : comparisons.map(item => item.id === target.comparisonId ? { ...item, offers: item.offers.filter(offer => offer.id !== target.id) } : item);
    await commit(next, () => { setDeleteDialog(null); if (target.kind === 'comparison') setRoute({ screen: 'home' }); });
  };
  const visit = async (offer: Offer) => {
    setVisitError('');
    let url: string;
    try { url = validateOfferUrl(offer.url); }
    catch (error) { setVisitError(error instanceof Error ? error.message : 'legacy.errorReviewOffer'); return; }
    try { await Linking.openURL(url); }
    catch { setVisitStore(offer.store); setVisitError('legacy.errorOpenLink'); }
  };

  return <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
    <View style={s.topbar}><View style={[s.topbarInner, !wide && { paddingHorizontal: 22 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('legacy.brandHomeA11y')} onPress={() => navigate({ screen: 'home' })} disabled={busy} style={s.brand}>
        <View style={s.logo}><ShoppingBag size={23} color="#fff" strokeWidth={1.5} /><View style={s.logoDot} /></View>
        <View><Text style={s.wordmark}>jjcompra<Text style={{ color: c.coral }}>.</Text></Text><Text style={s.brandSubtitle}>COMPRA INTELIGENTE</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('legacy.localInfoA11y')} onPress={() => setInfo(true)} style={s.localBadge}><ShieldCheck size={16} strokeWidth={1.7} color={c.green} /><Text style={s.localText}>{t(wide ? 'legacy.deviceOnly' : 'legacy.localStorage')}</Text>{wide && <Info size={13} color={c.muted} />}</Pressable>
    </View></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={[s.content, !wide && { paddingHorizontal: 22, paddingTop: 19 }]}>
          {loading ? <View style={s.state}><ActivityIndicator color={c.green} size="large" /><Text style={s.stateText}>{t('legacy.preparing')}</Text></View> : loadError ? <View style={s.state}><View style={s.stateIcon}><ShieldCheck size={30} color={c.green} /></View><Text style={s.stateTitle}>{t('legacy.dataIntact')}</Text><ErrorBanner message={loadError} /><Button label={t('legacy.reload')} icon={RefreshCw} onPress={reload} /></View> : <>
            {!!saveError && route.screen !== 'offer' && !nameDialog && !deleteDialog && <ErrorBanner message={saveError} />}
            {!!visitError && <ErrorBanner message={visitError} values={{ shop: visitStore }} />}
            {route.screen === 'home' && <HomeScreen comparisons={comparisons} onCreate={() => openName({ kind: 'create' })} onOpen={id => navigate({ screen: 'detail', comparisonId: id })} busy={busy} />}
            {route.screen === 'detail' && current && <DetailScreen comparison={current} onBack={back} onRename={() => openName({ kind: 'rename', id: current.id })} onDelete={() => { setSaveError(''); setDeleteDialog({ kind: 'comparison', id: current.id }); }} onAdd={() => navigate({ screen: 'offer', comparisonId: current.id })} onEditOffer={offerId => navigate({ screen: 'offer', comparisonId: current.id, offerId })} onDeleteOffer={id => { setSaveError(''); setDeleteDialog({ kind: 'offer', comparisonId: current.id, id }); }} onVisit={visit} busy={busy} />}
            {route.screen === 'offer' && current && <OfferScreen key={`${current.id}-${route.offerId ?? 'new'}`} comparison={current} offer={current.offers.find(offer => offer.id === route.offerId)} onBack={back} onSave={saveOffer} busy={busy} saveError={saveError} />}
          </>}
        </View>
        <View style={s.footer}><View style={[s.footerInner, !wide && { paddingHorizontal: 22 }]}><Text style={s.footerText}>{t('legacy.footerMotto')}</Text><View style={s.footerRight}><View style={s.footerDot} /><Text style={s.footerText}>{t('legacy.footerMade')}</Text></View></View></View>
      </ScrollView>
    </KeyboardAvoidingView>

    <Sheet visible={nameDialog !== null} title={t(nameDialog?.kind === 'rename' ? 'legacy.renameTitle' : 'legacy.createTitle')} subtitle={t(nameDialog?.kind === 'rename' ? 'legacy.renameDescription' : 'legacy.createDescription')} busy={busy} onClose={() => { setNameDialog(null); setSaveError(''); }}>
      <Field label={t('legacy.productName')} placeholder={t('legacy.productExample')} value={name} onChangeText={value => { setName(value); setNameError(''); }} maxLength={120} autoFocus editable={!busy} onSubmitEditing={submitName} returnKeyType="done" />
      {!!nameDialog && !!nameError && <ErrorBanner message={nameError} />}{!!nameDialog && !!saveError && <ErrorBanner message={saveError} />}
      <Button label={t(nameDialog?.kind === 'rename' ? 'legacy.saveName' : 'legacy.createComparison')} icon={nameDialog?.kind === 'rename' ? Check : ArrowRight} onPress={submitName} loading={busy} testID="save-comparison" />
    </Sheet>
    <Sheet visible={deleteDialog !== null} title={t(deleteDialog?.kind === 'comparison' ? 'legacy.deleteComparisonTitle' : 'legacy.deleteOfferTitle')} subtitle={t(deleteDialog?.kind === 'comparison' ? 'legacy.deleteComparisonDescription' : 'legacy.deleteOfferDescription')} busy={busy} onClose={() => { setDeleteDialog(null); setSaveError(''); }}>
      {!!deleteDialog && !!saveError && <ErrorBanner message={saveError} />}
      <View style={{ gap: 10 }}><Button label={t(deleteDialog?.kind === 'comparison' ? 'legacy.deleteComparison' : 'legacy.deleteOffer')} icon={Trash2} variant="danger" loading={busy} onPress={confirmDelete} /><Button label={t('legacy.keep')} variant="secondary" disabled={busy} onPress={() => { setDeleteDialog(null); setSaveError(''); }} /></View>
    </Sheet>
    <Sheet visible={info} title={t('legacy.yourSpace')} subtitle="JJ Compra Inteligente" onClose={() => setInfo(false)}>
      <View style={s.infoBox}><ShieldCheck color={c.green} size={25} /><Text style={s.infoTitle}>{t('legacy.savedOnDevice')}</Text><Text style={s.infoText}>{t('legacy.localExplanation')}</Text><Text style={s.infoText}>{t('legacy.deletionNotice')}</Text></View>
      <Text style={[s.infoText, { marginVertical: 20 }]}>{t('legacy.enteredDataNotice')}</Text>
      <Button label={t('legacy.understood')} icon={Check} onPress={() => setInfo(false)} />
    </Sheet>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background }, loading: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' }, topbar: { backgroundColor: '#FCFDF9', borderBottomWidth: 1, borderBottomColor: c.line }, topbarInner: { width: '100%', maxWidth: 1160, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, brand: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44 }, logo: { width: 43, height: 45, borderRadius: 12, backgroundColor: c.green, justifyContent: 'center', alignItems: 'center' }, logoDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: c.coral, position: 'absolute', right: 9, bottom: 10, borderWidth: 1, borderColor: c.green }, wordmark: { fontFamily: f.extra, color: c.ink, fontSize: 23, letterSpacing: -1.1, lineHeight: 27 }, brandSubtitle: { fontFamily: f.bold, color: c.muted, fontSize: 6, letterSpacing: 1.9, marginTop: 3 }, localBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 30, backgroundColor: c.sage, minHeight: 44 }, localText: { fontFamily: f.semibold, fontSize: 10, color: c.green },
  content: { width: '100%', maxWidth: 1160, alignSelf: 'center', flexGrow: 1, paddingHorizontal: 40, paddingTop: 25, paddingBottom: 38 }, state: { minHeight: 450, alignItems: 'center', justifyContent: 'center', gap: 24, maxWidth: 500, alignSelf: 'center', width: '100%' }, stateText: { fontFamily: f.medium, color: c.muted, fontSize: 13 }, stateTitle: { fontFamily: f.bold, fontSize: 22, color: c.ink, textAlign: 'center' }, stateIcon: { width: 70, height: 70, backgroundColor: c.sage, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  footer: { borderTopWidth: 1, borderTopColor: c.line }, footerInner: { width: '100%', maxWidth: 1160, paddingHorizontal: 40, alignSelf: 'center', paddingVertical: 21, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, footerText: { color: '#889180', fontFamily: f.medium, fontSize: 9 }, footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 }, footerDot: { width: 4, height: 4, backgroundColor: c.coral, borderRadius: 4 },
  infoBox: { padding: 19, backgroundColor: c.sage, borderRadius: 15, gap: 13 }, infoTitle: { fontFamily: f.bold, color: c.green, fontSize: 14 }, infoText: { fontFamily: f.regular, color: c.muted, fontSize: 13, lineHeight: 22 },
});
