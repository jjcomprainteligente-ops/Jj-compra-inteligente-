import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ArrowLeft, Bell, Check, ChartNoAxesColumnIncreasing, Home, Plus, ShoppingCart, UserRound, Utensils } from 'lucide-react-native';
import LegacyComparisons from '../../App';
import { createId } from '../domain/comparisons';
import { applyIngredientReview, type IngredientDraft } from '../domain/ingredientImport';
import { CATEGORIES, UNITS, findDuplicate, validateBudget, validateItemInput, validateListName,
  type Category, type ItemInput, type ShoppingItem, type ShoppingList, type ShoppingState } from '../domain/shopping';
import { useI18n } from '../i18n/LanguageProvider';
import { appError } from '../i18n/errors';
import { translateIngredientName } from '../i18n/recipes';
import type { TranslationValues } from '../i18n/types';
import { Button, Field, Notice, Sheet, c, f, ui } from './components/ui';
import { HomeScreen, ListScreen } from './screens/HomeList';
import { ProfileScreen, SavingsScreen } from './screens/SecondaryScreens';
import { MenuWorkspace } from './screens/MenuWorkspace';
import { PriceWorkspace } from './screens/PriceWorkspace';
import { LanguageScreen, WelcomeScreen } from './screens/LanguageScreen';
import { useShopping } from './useShopping';
import { useExpenses } from './useExpenses';
import { totalExpenses } from '../domain/expenses';
import { useLocalPreferences } from './useLocalPreferences';
import { useConnectivity } from './useConnectivity';
import { SearchScreen, ProductScreen } from './screens/ProductScreens';
import { VoiceScreen, ScannerScreen } from './screens/CaptureScreens';
import { BudgetScreen, HistoryScreen } from './screens/MoneyScreens';
import { StoresScreen } from './screens/LocalSettingsScreens';
import { NotificationsWorkspace } from './screens/NotificationsWorkspace';
import { StateReviewScreen } from './screens/StateReviewScreen';
import { usePriceObservations } from './usePriceObservations';
import type { Screen, SecondaryProps } from './types';

type Editor = { kind: 'list'; id?: string } | { kind: 'budget'; id: string } |
  { kind: 'item'; listId: string; id?: string } | { kind: 'choose' } |
  { kind: 'info'; title: string; body: string } |
  { kind: 'confirm'; title: string; body: string; values?: TranslationValues; action: string; run: () => Promise<boolean> };
const blankItem = (): ItemInput => ({ name: '', quantity: '1', unit: 'ud', category: 'Otros', note: '', price: '', priceKind: 'entered' });
const tabs = [
  { key: 'home', label: 'app.tabHome', icon: Home }, { key: 'list', label: 'app.tabList', icon: ShoppingCart },
  { key: 'savings', label: 'app.tabSavings', icon: ChartNoAxesColumnIncreasing }, { key: 'menus', label: 'app.tabMenus', icon: Utensils },
] as const;
type MainScreen = typeof tabs[number]['key'];
const loadErrorsWithDataNotice = new Set([
  appError('errors.shoppingUnreadable').message, appError('errors.shoppingVersion').message,
]);

function initialScreen(): Screen {
  return Platform.OS === 'web' && typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('view') === 'comparisons' ? 'comparisons' : 'home';
}

export default function ShoppingApp() {
  const { t, ready, welcomeComplete } = useI18n();
  const [fontsLoaded, fontError] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  const bootstrapped = useRef(false);
  const workspaceEntered = useRef(false);
  if ((fontsLoaded || fontError) && ready) bootstrapped.current = true;
  if (bootstrapped.current && welcomeComplete) workspaceEntered.current = true;
  return <SafeAreaProvider><StatusBar style="light" />
    {bootstrapped.current ? workspaceEntered.current ? <Workspace /> : <WelcomeScreen /> : <View style={styles.loading}><ActivityIndicator color={c.primary} /><Text>{t('app.loadingApp')}</Text></View>}
  </SafeAreaProvider>;
}

function Workspace() {
  const { t, formatMoneyInput, formatQuantity, translateError, categoryLabel, unitLabel,
    preferenceError, busy: languageBusy, retryPreferences } = useI18n();
  const store = useShopping();
  const priceStore = usePriceObservations();
  const expenses = useExpenses();
  const localPreferences = useLocalPreferences();
  const connectivity = useConnectivity();
  const navigationBusy = store.busy || priceStore.busy || expenses.busy || localPreferences.busy || languageBusy;
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [mainScreen, setMainScreen] = useState<MainScreen>('home');
  const [searchCategory, setSearchCategory] = useState<Category>();
  const [selectedProduct, setSelectedProduct] = useState<{ listId: string; itemId: string } | null>(null);
  const [voiceDraft, setVoiceDraft] = useState('');
  const [pendingEntry, setPendingEntry] = useState<{ id: string; text: string } | null>(null);
  const consumeEntry = useCallback(() => setPendingEntry(null), []);
  const [menuSection, setMenuSection] = useState<'week' | 'discover'>('week');
  const profileReturnScreen = useRef<Screen>(initialScreen());
  const [editor, setEditor] = useState<Editor | null>(null);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [draft, setDraft] = useState<ItemInput>(blankItem);
  const [formError, setFormError] = useState('');
  const [duplicate, setDuplicate] = useState<ShoppingItem | null>(null);
  const [discard, setDiscard] = useState(false);
  const originalDraft = useRef('');
  const pendingItemAfterList = useRef<ItemInput | null>(null);
  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const active = store.data.lists.find(list => list.id === store.data.activeListId) ?? store.data.lists[0];
  const disabled = store.busy || store.loading || !!store.loadError;
  const navigate = (value: Screen) => {
    if (navigationBusy) return;
    if (value === 'profile' && screen !== 'profile' && screen !== 'language') profileReturnScreen.current = screen;
    if (tabs.some(tab => tab.key === value)) setMainScreen(value as MainScreen);
    else if (['prices', 'budget', 'history', 'stores'].includes(value) && screen !== 'profile') setMainScreen('savings');
    else if (['search', 'product', 'voice', 'scanner'].includes(value)) setMainScreen('list');
    setScreen(value); scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const begin = (next: Editor, initial = '') => {
    if (store.busy) return;
    setEditor(next); setFormError(''); setDuplicate(null); setDiscard(false); store.clearSaveError(); originalDraft.current = initial;
  };
  const createList = () => { pendingItemAfterList.current = null; setName(''); begin({ kind: 'list' }, ''); };
  const editList = () => { if (active) { setName(active.name); begin({ kind: 'list', id: active.id }, active.name); } };
  const editBudget = () => { if (active) { const value = formatMoneyInput(active.budgetCents); setBudget(value); begin({ kind: 'budget', id: active.id }, value); } };
  const openItem = (item?: ShoppingItem, category?: Category, listId?: string, barcode?: string) => {
    const target = listId ? store.data.lists.find(list => list.id === listId) : active;
    if (!target) {
      pendingItemAfterList.current = { ...blankItem(), ...(category ? { category } : {}), ...(barcode ? { note: `EAN/UPC: ${barcode}` } : {}) };
      setName(''); begin({ kind: 'list' }, ''); return;
    }
    const value: ItemInput = item ? { name: item.name, quantity: formatQuantity(item.quantityMilli), unit: item.unit,
      category: item.category, note: item.note, price: formatMoneyInput(item.unitPriceCents), priceKind: item.priceKind ?? 'entered' } : { ...blankItem(), ...(category ? { category } : {}), ...(barcode ? { note: `EAN/UPC: ${barcode}` } : {}) };
    setDraft(value); begin({ kind: 'item', listId: target.id, id: item?.id }, JSON.stringify(value));
  };
  const close = () => {
    if (store.busy) return;
    const value = editor?.kind === 'item' ? JSON.stringify(draft) : editor?.kind === 'list' ? name : editor?.kind === 'budget' ? budget : null;
    if (value !== null && value !== originalDraft.current) { setDiscard(true); return; }
    pendingItemAfterList.current = null;
    setEditor(null);
  };
  const changeList = (state: ShoppingState, id: string, change: (list: ShoppingList) => ShoppingList): ShoppingState => {
    if (!state.lists.some(list => list.id === id)) throw appError('errors.listGone');
    return { ...state, lists: state.lists.map(list => list.id === id ? change(list) : list) };
  };
  const saveList = async () => {
    if (editor?.kind !== 'list') return;
    setFormError('');
    try {
      const validated = validateListName(name);
      const id = editor.id ?? createId();
      const ok = await store.commit(state => editor.id ? changeList(state, id, list => ({ ...list, name: validated })) :
        { lists: [...state.lists, { id, name: validated, budgetCents: null, items: [] }], activeListId: id }, editor.id ? 'states.undoListRenamed' : 'states.undoListCreated');
      if (ok) {
        const pending = pendingItemAfterList.current;
        pendingItemAfterList.current = null;
        if (!editor.id && pending) { setDraft(pending); begin({ kind: 'item', listId: id }, JSON.stringify(pending)); }
        else setEditor(null);
      }
    } catch (error) { setFormError((error as Error).message); }
  };
  const saveBudget = async () => {
    if (editor?.kind !== 'budget') return;
    setFormError('');
    try {
      const value = validateBudget(budget);
      if (await store.commit(state => changeList(state, editor.id, list => ({ ...list, budgetCents: value })), 'states.undoBudgetSaved')) setEditor(null);
    } catch (error) { setFormError((error as Error).message); }
  };
  const saveItem = async (allowDuplicate = false) => {
    if (editor?.kind !== 'item') return;
    setFormError('');
    try {
      const value = validateItemInput(draft);
      const list = store.data.lists.find(value => value.id === editor.listId);
      if (!list) throw appError('errors.listUnavailable');
      const found = findDuplicate(list.items, value.name, value.unit, editor.id);
      if (found && !allowDuplicate) { setDuplicate(found); return; }
      const id = editor.id ?? createId();
      const ok = await store.commit(state => changeList(state, editor.listId, previous => ({ ...previous,
        items: editor.id ? previous.items.map(item => item.id === id ? { ...item, ...value } : item) :
          [...previous.items, { ...value, id, checked: false }],
      })), editor.id ? 'states.undoItemEdited' : 'states.undoItemAdded');
      if (ok) setEditor(null);
    } catch (error) { setFormError((error as Error).message); }
  };
  const confirmDeleteItem = (item: ShoppingItem) => {
    if (!active) return;
    const listId = active.id;
    begin({ kind: 'confirm', title: 'app.deleteItemTitle', body: 'app.deleteItemBody', values: { name: item.name }, action: 'app.deleteItem',
      run: () => store.commit(state => changeList(state, listId, list => ({ ...list, items: list.items.filter(value => value.id !== item.id) })), 'app.undoItemDeleted') });
  };
  const confirmDeleteList = () => {
    if (!active) return;
    const id = active.id;
    begin({ kind: 'confirm', title: 'app.deleteListTitle', body: 'app.deleteListBody', values: { name: active.name }, action: 'app.deleteList',
      run: () => store.commit(state => { const lists = state.lists.filter(list => list.id !== id); return { lists, activeListId: state.activeListId === id ? lists[0]?.id ?? null : state.activeListId }; }, 'app.undoListDeleted') });
  };
  const info = (title: string, body: string) => begin({ kind: 'info', title, body });
  const applyIngredients = (targetListId: string | null, newListName: string, drafts: IngredientDraft[]) => store.commit(state => {
    if (targetListId !== null) {
      return { ...changeList(state, targetListId, list => applyIngredientReview(list, drafts, createId)), activeListId: targetListId };
    }
    const list: ShoppingList = { id: createId(), name: validateListName(newListName), budgetCents: null, items: [] };
    const reviewed = applyIngredientReview(list, drafts, createId);
    return { lists: [...state.lists, reviewed], activeListId: list.id };
  }, 'app.undoIngredientsAdded');
  const openSearch = (category?: Category) => { setSearchCategory(category); navigate('search'); };
  const productList = selectedProduct ? store.data.lists.find(list => list.id === selectedProduct.listId) : undefined;
  const product = productList?.items.find(item => item.id === selectedProduct?.itemId);
  const backToMain = () => navigate(mainScreen);
  const actualSpending = { actualSpentCents: active && expenses.data.expenses.some(record => record.listId === active.id) ? totalExpenses(expenses.data.expenses, active.id) : null, expensesLoading: expenses.loading, expensesError: expenses.loadError };
  const common = { ...actualSpending, active, busy: disabled, onCreate: createList, onOpenList: () => navigate('list'), onMenus: () => { setMenuSection('week'); navigate('menus'); }, onDiscover: () => { setMenuSection('discover'); navigate('menus'); },
    onSearch: openSearch, onVoice: () => navigate('voice'), onScanner: () => navigate('scanner'), onChoose: () => begin({ kind: 'choose' }), onBudget: editBudget, onAdd: (category?: Category) => openItem(undefined, category), onRename: editList, onDeleteList: confirmDeleteList,
    onEdit: (item: ShoppingItem) => openItem(item), onDelete: confirmDeleteItem, onToggle: (item: ShoppingItem) => { if (active) void store.commit(state => changeList(state, active.id,
      list => ({ ...list, items: list.items.map(value => value.id === item.id ? { ...value, checked: !value.checked } : value) })), item.checked ? 'app.undoItemUnchecked' : 'app.undoItemChecked'); } };
  const secondary: SecondaryProps = { active, lists: store.data.lists, busy: disabled, onNavigate: navigate, onInfo: info,
    onBudget: editBudget, onCreateList: createList,
    ...actualSpending, onLanguage: () => navigate('language'),
    onRecipe: () => info('app.recipePreviewTitle', 'app.recipePreviewBody') };
  const titleKey = discard ? 'app.discardTitle' : duplicate ? 'app.duplicateTitle' : editor?.kind === 'list' ? editor.id ? 'app.renameList' : 'app.nextShopping' :
    editor?.kind === 'budget' ? 'app.yourBudget' : editor?.kind === 'item' ? editor.id ? 'app.editItem' : 'app.addItem' : editor?.kind === 'choose' ? 'app.yourLists' : editor?.title ?? '';
  const title = titleKey ? t(titleKey) : '';
  const error = formError || store.saveError;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, screen === 'comparisons' && styles.legacySafe]}>
    {screen === 'comparisons' ? <View style={{ flex: 1 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('app.backToList')} onPress={() => navigate('list')} style={styles.return}><ArrowLeft color={c.primary} size={20} /><Text style={ui.link}>{t('app.backToList')}</Text></Pressable>
      <LegacyComparisons />
    </View> : <View style={styles.shell}>
      <View style={styles.header}>
        <Text testID="screen-title" style={styles.headerTitle}>{t(screen === 'profile' ? 'visualSecondary.mySpace' : screen === 'language' ? 'language.title' : screen === 'prices' ? 'app.tabSavings' : tabs.find(tab => tab.key === screen)?.label ?? `shell.${screen}`)}</Text>
        <Pressable accessibilityRole="button" testID="open-notifications" accessibilityLabel={t('shell.notifications')} disabled={navigationBusy} onPress={() => navigate('notifications')} style={styles.headerAction}><Bell size={22} color={c.surface} /></Pressable>
        <Pressable accessibilityRole="button" testID="open-profile" accessibilityLabel={t('app.openProfile')} disabled={navigationBusy} onPress={() => navigate('profile')} style={styles.avatar}><UserRound size={22} color={c.deep} /></Pressable>
      </View>
      {!['home', 'list', 'savings', 'menus', 'profile', 'language', 'prices'].includes(screen) && <Pressable accessibilityRole="button" testID="subpage-back" accessibilityLabel={t('shell.back')} disabled={navigationBusy} onPress={() => navigate(screen === 'product' ? 'search' : screen === 'history' ? 'budget' : mainScreen)} style={styles.return}><ArrowLeft color={c.primary} size={20} /><Text style={ui.link}>{t('shell.back')}</Text></Pressable>}
      {screen === 'profile' && <Pressable accessibilityRole="button" testID="profile-back" accessibilityLabel={t('app.backToSection', { section: t(tabs.find(tab => tab.key === mainScreen)!.label) })} disabled={navigationBusy} onPress={() => navigate(profileReturnScreen.current)} style={styles.return}><ArrowLeft color={c.primary} size={20} /><Text style={[ui.link, { flex: 1 }]}>{t('app.backToSection', { section: t(tabs.find(tab => tab.key === mainScreen)!.label) })}</Text></Pressable>}
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        {connectivity.online === false && <View style={[ui.page, { paddingTop: 16, paddingBottom: 0 }]}><Notice title={t('states.offline.title')} text={t('states.offline.description')} /></View>}
        {screen !== 'language' && !!preferenceError && <View style={[ui.page, { paddingTop: 16, paddingBottom: 0 }]}>
          <Notice kind="error" title={t('common.language')} text={preferenceError} action={t('common.retry')}
            onPress={() => { void retryPreferences(); }} />
        </View>}
        {screen === 'language' ? <LanguageScreen onBack={() => navigate('profile')} /> : store.loading ? <View style={styles.loading}><ActivityIndicator color={c.primary} /><Text style={ui.body}>{t('app.loadingLists')}</Text></View> : store.loadError ? <View style={[ui.page, { paddingTop: 28 }]}>
          <Notice kind="error" title={t('app.dataAttention')} text={loadErrorsWithDataNotice.has(store.loadError) ? translateError(store.loadError) : t('app.loadErrorBody', { detail: translateError(store.loadError) })} action={t('app.reload')} onPress={() => void store.reload()} />
          <Button label={t('app.openComparator')} secondary onPress={() => navigate('comparisons')} />
        </View> : <>
          {!!store.saveError && !editor && <View style={[ui.page, { paddingTop: 18, paddingBottom: 0 }]}><Notice kind="error" title={t('app.saveFailed')} text={translateError(store.saveError)} /></View>}
          {store.undo && <View style={[ui.page, { paddingTop: 16, paddingBottom: 0 }]}><Notice kind="success" title={t(store.undo.label)} text={t('app.undoBody')}
            action={t('app.undo')} onPress={() => { if (!store.busy) void store.undoLast(); }} /></View>}
          {screen === 'home' ? <HomeScreen {...common} /> : screen === 'list' ? <ListScreen {...common} /> : screen === 'savings' ? <SavingsScreen {...secondary} /> : screen === 'prices' ?
            <PriceWorkspace store={priceStore} onBack={() => navigate('savings')} onLegacy={() => navigate('comparisons')} /> : screen === 'menus' ?
            <MenuWorkspace initialSection={menuSection} shopping={store.data} shoppingBusy={disabled} shoppingError={store.saveError} onApply={applyIngredients} onNavigateList={() => navigate('list')} onNavigateMain={navigate} initialEntry={pendingEntry} onEntryConsumed={consumeEntry} /> :
          screen === 'search' ? <SearchScreen lists={store.data.lists} busy={disabled} initialCategory={searchCategory} onSelect={(listId, itemId) => { setSelectedProduct({ listId, itemId }); navigate('product'); }} onAdd={category => openItem(undefined, category)} /> :
          screen === 'product' ? <ProductScreen list={productList} item={product} busy={disabled} onEdit={() => product && openItem(product, undefined, productList?.id)} onBack={() => navigate('search')} /> :
          screen === 'voice' ? <VoiceScreen busy={disabled} draft={voiceDraft} onDraftChange={setVoiceDraft} onReview={text => { setPendingEntry({ id: createId(), text }); setMenuSection('week'); navigate('menus'); }} onBack={backToMain} /> :
          screen === 'scanner' ? <ScannerScreen busy={disabled} onManual={code => openItem(undefined, undefined, undefined, code)} onBack={backToMain} /> :
          screen === 'budget' ? <BudgetScreen active={active} lists={store.data.lists} store={expenses} onBudget={editBudget} onCreateList={createList} onHistory={() => navigate('history')} onBack={backToMain} /> :
          screen === 'history' ? <HistoryScreen active={active} lists={store.data.lists} store={expenses} onBack={() => navigate('budget')} /> :
          screen === 'stores' ? <StoresScreen store={localPreferences} onBack={backToMain} /> :
          screen === 'notifications' ? <NotificationsWorkspace store={localPreferences} lists={store.data.lists} onOpenList={id => { void store.commit(state => { if (!state.lists.some(list => list.id === id)) throw appError('errors.listGone'); return { ...state, activeListId: id }; }).then(ok => { if (ok) navigate('list'); }); }} onMenus={() => navigate('menus')} /> :
          screen === 'states' ? <StateReviewScreen onBack={backToMain} onShopping={() => navigate('list')} onMenus={() => navigate('menus')} /> : <ProfileScreen {...secondary} />}

        </>}
      </ScrollView>
      {screen === 'list' && active && !store.loading && !store.loadError && <View style={styles.addBar}>
        <Button accent label={t('app.addItem')} testID="add-item" icon={Plus} disabled={store.busy} onPress={() => openItem()} />
      </View>}
      <SafeAreaView edges={['bottom']} style={styles.tabsSafe}><View accessibilityRole="tablist" style={styles.tabs}>{tabs.map(tab => {
        const selected = mainScreen === tab.key;
        return <Pressable key={tab.key} testID={`tab-${tab.key}`} accessibilityRole="tab" accessibilityLabel={t(tab.label)}
          accessibilityState={{ selected, disabled: navigationBusy }} aria-selected={selected} disabled={navigationBusy}
          onPress={() => navigate(tab.key)} style={[styles.tab, selected && styles.tabSelected]}><View style={[styles.tabIcon, selected && { backgroundColor: c.paleYellow }]}><tab.icon size={22} color={selected ? c.primary : c.muted} strokeWidth={selected ? 2 : 1.6} /></View>
          <Text style={[styles.tabLabel, selected && { color: c.primary, fontFamily: f.extra }]}>{t(tab.label)}</Text></Pressable>;
      })}</View></SafeAreaView>
    </View>}
    <Sheet visible={!!editor} title={title} onClose={close} busy={store.busy} testID={editor?.kind === 'confirm' ? 'confirmation-dialog' : 'app-sheet'}
      footer={editor && !discard && !duplicate ? editor.kind === 'list' ? <Button label={t('app.saveList')} testID="save-list" busy={store.busy} onPress={() => void saveList()} icon={Check} /> :
        editor.kind === 'budget' ? <Button label={t('app.saveBudget')} testID="save-budget" busy={store.busy} onPress={() => void saveBudget()} icon={Check} /> :
        editor.kind === 'item' ? <Button label={t('app.saveItem')} testID="save-item" busy={store.busy} onPress={() => void saveItem()} icon={Check} /> : undefined : undefined}>
      {discard ? <View style={{ gap: 14 }}><Text style={ui.body}>{t('app.unsavedBody')}</Text><Button label={t('app.keepEditing')} onPress={() => setDiscard(false)} /><Button label={t('app.discardChanges')} danger onPress={() => { pendingItemAfterList.current = null; setEditor(null); setDiscard(false); }} /></View> : <>
        {!!error && <Notice kind="error" title={t(store.saveError ? 'app.saveFailed' : 'app.reviewValue')} text={translateError(error)} />}
        {duplicate ? <View style={{ gap: 14 }}><Text style={ui.body}>{t('states.duplicateEquivalent', { name: translateIngredientName(duplicate.name, t), quantity: formatQuantity(duplicate.quantityMilli), unit: unitLabel(duplicate.unit) })}</Text>
          <Button label={t('app.addSeparately')} busy={store.busy} onPress={() => void saveItem(true)} />
          <Button label={t('app.editExisting')} secondary onPress={() => openItem(duplicate, undefined, editor?.kind === 'item' ? editor.listId : undefined)} disabled={store.busy} />
          <Button label={t('app.cancel')} secondary onPress={() => setDuplicate(null)} disabled={store.busy} /></View> : editor?.kind === 'list' ? <>
          <Text style={[ui.note, { marginBottom: 18 }]}>{t('app.listNameHint')}</Text>
          <Field label={t('app.fieldListName')} value={name} onChangeText={setName} maxLength={80} editable={!store.busy} autoCapitalize="sentences" autoFocus />
        </> : editor?.kind === 'budget' ? <>
          <Text style={[ui.note, { marginBottom: 18 }]}>{t('app.budgetHint')}</Text>
          <Field label={t('app.fieldBudget')} value={budget} onChangeText={setBudget} maxLength={32} editable={!store.busy} inputMode="decimal" autoFocus placeholder={t('app.budgetExample', { amount: formatMoneyInput(6000) })} />
        </> : editor?.kind === 'item' ? <>
          <Field label={t('app.fieldItemName')} value={draft.name} onChangeText={value => setDraft({ ...draft, name: value })} maxLength={120} editable={!store.busy} autoCapitalize="sentences" autoFocus />
          <Field label={t('app.fieldQuantity')} value={draft.quantity} onChangeText={value => setDraft({ ...draft, quantity: value })} maxLength={32} editable={!store.busy} inputMode="decimal" hint={t('app.quantityHint', { unit: unitLabel('ud') })} />
          <Text style={ui.fieldLabel}>{t('app.fieldUnit')}</Text><View style={styles.choices}>{UNITS.map(unit => <Choice key={unit} label={unitLabel(unit)} a11y={t('app.unitA11y', { unit: unitLabel(unit) })} selected={draft.unit === unit} disabled={store.busy} onPress={() => setDraft({ ...draft, unit })} />)}</View>
          <Text style={ui.fieldLabel}>{t('app.fieldCategory')}</Text><View style={styles.choices}>{CATEGORIES.map(category => <Choice key={category} label={categoryLabel(category)} a11y={t('app.categoryA11y', { category: categoryLabel(category) })} selected={draft.category === category} disabled={store.busy} onPress={() => setDraft({ ...draft, category })} />)}</View>
          <Field label={t('app.fieldPrice')} value={draft.price} onChangeText={value => setDraft({ ...draft, price: value })} maxLength={32} editable={!store.busy} inputMode="decimal" placeholder={t('app.optional')} hint={t('app.priceHint', { unit: unitLabel(draft.unit) })} />
          <Text style={ui.fieldLabel}>{t('app.priceKind')}</Text><View style={styles.choices}><Choice label={t('app.entered')} a11y={t('app.enteredPrice')} selected={draft.priceKind === 'entered'} disabled={store.busy} onPress={() => setDraft({ ...draft, priceKind: 'entered' })} /><Choice label={t('app.estimated')} a11y={t('app.estimatedPrice')} selected={draft.priceKind === 'estimated'} disabled={store.busy} onPress={() => setDraft({ ...draft, priceKind: 'estimated' })} /></View>
          <Text style={[ui.note, { marginBottom: 21 }]}>{t('app.priceKindHint')}</Text>
          <Field label={t('app.fieldNote')} value={draft.note} onChangeText={value => setDraft({ ...draft, note: value })} maxLength={500} editable={!store.busy} multiline hint={t('app.noteHint')} />
        </> : editor?.kind === 'choose' ? <View style={{ gap: 12 }}>{store.data.lists.map(list => <Button key={list.id} label={t('app.openNamedList', { name: list.name })} secondary={list.id !== active?.id} disabled={store.busy} onPress={async () => { if (await store.commit(state => ({ ...state, activeListId: list.id }))) setEditor(null); }} />)}
          <Button label={t('app.createAnotherList')} secondary icon={Plus} onPress={createList} disabled={store.busy} /></View> : editor?.kind === 'confirm' ? <View style={{ gap: 16 }}><Text style={ui.body}>{t(editor.body, editor.action === 'app.deleteItem' ? { ...editor.values, name: translateIngredientName(String(editor.values?.name ?? ''), t) } : editor.values)}</Text>
          <Button label={t(editor.action)} danger busy={store.busy} onPress={async () => { if (await editor.run()) setEditor(null); }} /><Button label={t('app.keep')} secondary disabled={store.busy} onPress={() => setEditor(null)} /></View> : editor?.kind === 'info' ? <View style={{ gap: 22 }}><Text style={ui.body}>{t(editor.body)}</Text><Button label={t('app.understood')} onPress={() => setEditor(null)} /></View> : null}
      </>}
    </Sheet>
  </SafeAreaView>;
}

function Choice({ label, a11y, selected, disabled, onPress }: { label: string; a11y: string; selected: boolean; disabled: boolean; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled} onPress={onPress}
    style={[styles.choice, selected && { backgroundColor: c.deep, borderColor: c.deep }]}><Text style={[styles.choiceText, selected && { color: '#fff' }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.deep }, legacySafe: { backgroundColor: c.background }, shell: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: c.surface },
  loading: { flex: 1, padding: 32, minHeight: 250, gap: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, backgroundColor: c.deep, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flex: 1, fontFamily: f.bold, fontSize: 19, lineHeight: 28, color: c.surface, marginRight: 12 },
  tabsSafe: { backgroundColor: c.surface },
  tabSelected: { backgroundColor: c.paleYellow },
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  avatar: { height: 44, width: 44, backgroundColor: c.soft, borderRadius: 22, borderWidth: 1, borderColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', paddingTop: 8, paddingBottom: 8, paddingHorizontal: 8, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line },
  tab: { flex: 1, minHeight: 58, borderRadius: 15, paddingHorizontal: 3, paddingVertical: 5, marginHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 4 }, tabIcon: { width: 49, height: 29, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { color: c.muted, fontFamily: f.semi, fontSize: 12, lineHeight: 18 },
  addBar: { paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface },
  return: { minHeight: 48, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: c.line },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9, marginBottom: 23 },
  choice: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#748268', backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 11, justifyContent: 'center', maxWidth: '100%' },
  choiceText: { fontFamily: f.semi, color: c.deep, fontSize: 13, lineHeight: 20 },
});
