import React, { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ArrowLeft, Check, Home, ListChecks, Plus, UserRound, Utensils, Wallet } from 'lucide-react-native';
import LegacyComparisons from '../../App';
import { createId } from '../domain/comparisons';
import { applyIngredientReview, type IngredientDraft } from '../domain/ingredientImport';
import { CATEGORIES, UNITS, findDuplicate, validateBudget, validateItemInput, validateListName,
  type ItemInput, type ShoppingItem, type ShoppingList, type ShoppingState } from '../domain/shopping';
import { useI18n } from '../i18n/LanguageProvider';
import { appError } from '../i18n/errors';
import { translateIngredientName } from '../i18n/recipes';
import type { TranslationValues } from '../i18n/types';
import { Brand } from './components/Brand';
import { Button, Field, Notice, Sheet, c, f, ui } from './components/ui';
import { HomeScreen, ListScreen } from './screens/HomeList';
import { ProfileScreen, SavingsScreen } from './screens/SecondaryScreens';
import { MenuWorkspace } from './screens/MenuWorkspace';
import { PriceWorkspace } from './screens/PriceWorkspace';
import { LanguageScreen, WelcomeScreen } from './screens/LanguageScreen';
import { useShopping } from './useShopping';
import { usePriceObservations } from './usePriceObservations';
import type { Screen, SecondaryProps } from './types';

type Editor = { kind: 'list'; id?: string } | { kind: 'budget'; id: string } |
  { kind: 'item'; listId: string; id?: string } | { kind: 'choose' } |
  { kind: 'info'; title: string; body: string } |
  { kind: 'confirm'; title: string; body: string; values?: TranslationValues; action: string; run: () => Promise<boolean> };
const blankItem = (): ItemInput => ({ name: '', quantity: '1', unit: 'ud', category: 'Otros', note: '', price: '', priceKind: 'entered' });
const tabs = [
  { key: 'home', label: 'app.tabHome', icon: Home }, { key: 'list', label: 'app.tabList', icon: ListChecks },
  { key: 'savings', label: 'app.tabSavings', icon: Wallet }, { key: 'menus', label: 'app.tabMenus', icon: Utensils },
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
  return <SafeAreaProvider><StatusBar style="dark" />
    {bootstrapped.current ? workspaceEntered.current ? <Workspace /> : <WelcomeScreen /> : <View style={styles.loading}><ActivityIndicator color={c.primary} /><Text>{t('app.loadingApp')}</Text></View>}
  </SafeAreaProvider>;
}

function Workspace() {
  const { t, formatMoneyInput, formatQuantity, translateError, categoryLabel, unitLabel,
    preferenceError, busy: languageBusy, retryPreferences } = useI18n();
  const store = useShopping();
  const priceStore = usePriceObservations();
  const navigationBusy = store.busy || priceStore.busy || languageBusy;
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [mainScreen, setMainScreen] = useState<MainScreen>('home');
  const profileReturnScreen = useRef<Screen>(initialScreen());
  const [editor, setEditor] = useState<Editor | null>(null);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [draft, setDraft] = useState<ItemInput>(blankItem);
  const [formError, setFormError] = useState('');
  const [duplicate, setDuplicate] = useState<ShoppingItem | null>(null);
  const [discard, setDiscard] = useState(false);
  const originalDraft = useRef('');
  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const active = store.data.lists.find(list => list.id === store.data.activeListId) ?? store.data.lists[0];
  const disabled = store.busy || store.loading || !!store.loadError;
  const navigate = (value: Screen) => {
    if (navigationBusy) return;
    if (value === 'profile' && screen !== 'profile' && screen !== 'language') profileReturnScreen.current = screen;
    if (tabs.some(tab => tab.key === value)) setMainScreen(value as MainScreen);
    else if (value === 'prices') setMainScreen('savings');
    setScreen(value); scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const begin = (next: Editor, initial = '') => {
    if (store.busy) return;
    setEditor(next); setFormError(''); setDuplicate(null); setDiscard(false); store.clearSaveError(); originalDraft.current = initial;
  };
  const createList = () => { setName(''); begin({ kind: 'list' }, ''); };
  const editList = () => { if (active) { setName(active.name); begin({ kind: 'list', id: active.id }, active.name); } };
  const editBudget = () => { if (active) { const value = formatMoneyInput(active.budgetCents); setBudget(value); begin({ kind: 'budget', id: active.id }, value); } };
  const openItem = (item?: ShoppingItem) => {
    if (!active) return;
    const value: ItemInput = item ? { name: item.name, quantity: formatQuantity(item.quantityMilli), unit: item.unit,
      category: item.category, note: item.note, price: formatMoneyInput(item.unitPriceCents), priceKind: item.priceKind ?? 'entered' } : blankItem();
    setDraft(value); begin({ kind: 'item', listId: active.id, id: item?.id }, JSON.stringify(value));
  };
  const close = () => {
    if (store.busy) return;
    const value = editor?.kind === 'item' ? JSON.stringify(draft) : editor?.kind === 'list' ? name : editor?.kind === 'budget' ? budget : null;
    if (value !== null && value !== originalDraft.current) { setDiscard(true); return; }
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
        { lists: [...state.lists, { id, name: validated, budgetCents: null, items: [] }], activeListId: id });
      if (ok) setEditor(null);
    } catch (error) { setFormError((error as Error).message); }
  };
  const saveBudget = async () => {
    if (editor?.kind !== 'budget') return;
    setFormError('');
    try {
      const value = validateBudget(budget);
      if (await store.commit(state => changeList(state, editor.id, list => ({ ...list, budgetCents: value })))) setEditor(null);
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
      })));
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
  const common = { active, busy: disabled, onCreate: createList, onOpenList: () => navigate('list'), onMenus: () => navigate('menus'),
    onChoose: () => begin({ kind: 'choose' }), onBudget: editBudget, onAdd: () => openItem(), onRename: editList, onDeleteList: confirmDeleteList,
    onEdit: openItem, onDelete: confirmDeleteItem, onToggle: (item: ShoppingItem) => { if (active) void store.commit(state => changeList(state, active.id,
      list => ({ ...list, items: list.items.map(value => value.id === item.id ? { ...value, checked: !value.checked } : value) })), item.checked ? 'app.undoItemUnchecked' : 'app.undoItemChecked'); } };
  const secondary: SecondaryProps = { active, lists: store.data.lists, busy: disabled, onNavigate: navigate, onInfo: info,
    onBudget: editBudget, onCreateList: createList, onLanguage: () => navigate('language'),
    onRecipe: () => info('app.recipePreviewTitle', 'app.recipePreviewBody') };
  const titleKey = discard ? 'app.discardTitle' : duplicate ? 'app.duplicateTitle' : editor?.kind === 'list' ? editor.id ? 'app.renameList' : 'app.nextShopping' :
    editor?.kind === 'budget' ? 'app.yourBudget' : editor?.kind === 'item' ? editor.id ? 'app.editItem' : 'app.addItem' : editor?.kind === 'choose' ? 'app.yourLists' : editor?.title ?? '';
  const title = titleKey ? t(titleKey) : '';
  const error = formError || store.saveError;
  return <SafeAreaView style={styles.safe}>
    {screen === 'comparisons' ? <View style={{ flex: 1 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('app.backToList')} onPress={() => navigate('list')} style={styles.return}><ArrowLeft color={c.primary} size={20} /><Text style={ui.link}>{t('app.backToList')}</Text></Pressable>
      <LegacyComparisons />
    </View> : <View style={styles.shell}>
      <View style={styles.header}><Brand /><Pressable accessibilityRole="button" testID="open-profile" accessibilityLabel={t('app.openProfile')} disabled={navigationBusy} onPress={() => navigate('profile')} style={[styles.avatar, (screen === 'profile' || screen === 'language') && { borderColor: c.primary }]}><UserRound size={22} color={c.deep} /></Pressable></View>
      {screen === 'profile' && <Pressable accessibilityRole="button" testID="profile-back" accessibilityLabel={t('app.backToSection', { section: t(tabs.find(tab => tab.key === mainScreen)!.label) })} disabled={navigationBusy} onPress={() => navigate(profileReturnScreen.current)} style={styles.return}><ArrowLeft color={c.primary} size={20} /><Text style={[ui.link, { flex: 1 }]}>{t('app.backToSection', { section: t(tabs.find(tab => tab.key === mainScreen)!.label) })}</Text></Pressable>}
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
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
            <MenuWorkspace shopping={store.data} shoppingBusy={disabled} shoppingError={store.saveError} onApply={applyIngredients} onNavigateList={() => navigate('list')} /> : <ProfileScreen {...secondary} />}
        </>}
      </ScrollView>
      {screen === 'list' && active && !store.loading && !store.loadError && <View style={styles.addBar}>
        <Button label={t('app.addItem')} testID="add-item" icon={Plus} disabled={store.busy} onPress={() => openItem()} />
      </View>}
      <View accessibilityRole="tablist" style={styles.tabs}>{tabs.map(tab => {
        const selected = screen === tab.key || (screen === 'prices' && tab.key === 'savings') || ((screen === 'profile' || screen === 'language') && mainScreen === tab.key);
        return <Pressable key={tab.key} testID={`tab-${tab.key}`} accessibilityRole="tab" accessibilityLabel={t(tab.label)}
          accessibilityState={{ selected, disabled: navigationBusy }} aria-selected={selected} disabled={navigationBusy}
          onPress={() => navigate(tab.key)} style={styles.tab}><View style={[styles.tabIcon, selected && { backgroundColor: '#E7EDD9' }]}><tab.icon size={22} color={selected ? c.primary : c.muted} strokeWidth={selected ? 2 : 1.6} /></View>
          <Text style={[styles.tabLabel, selected && { color: c.primary, fontFamily: f.extra }]}>{t(tab.label)}</Text></Pressable>;
      })}</View>
    </View>}
    <Sheet visible={!!editor} title={title} onClose={close} busy={store.busy} testID={editor?.kind === 'confirm' ? 'confirmation-dialog' : 'app-sheet'}
      footer={editor && !discard && !duplicate ? editor.kind === 'list' ? <Button label={t('app.saveList')} testID="save-list" busy={store.busy} onPress={() => void saveList()} icon={Check} /> :
        editor.kind === 'budget' ? <Button label={t('app.saveBudget')} testID="save-budget" busy={store.busy} onPress={() => void saveBudget()} icon={Check} /> :
        editor.kind === 'item' ? <Button label={t('app.saveItem')} testID="save-item" busy={store.busy} onPress={() => void saveItem()} icon={Check} /> : undefined : undefined}>
      {discard ? <View style={{ gap: 14 }}><Text style={ui.body}>{t('app.unsavedBody')}</Text><Button label={t('app.keepEditing')} onPress={() => setDiscard(false)} /><Button label={t('app.discardChanges')} danger onPress={() => { setEditor(null); setDiscard(false); }} /></View> : <>
        {!!error && <Notice kind="error" title={t(store.saveError ? 'app.saveFailed' : 'app.reviewValue')} text={translateError(error)} />}
        {duplicate ? <View style={{ gap: 14 }}><Text style={ui.body}>{t('app.duplicateBody', { name: translateIngredientName(duplicate.name, t) })}</Text>
          <Button label={t('app.addSeparately')} busy={store.busy} onPress={() => void saveItem(true)} />
          <Button label={t('app.editExisting')} secondary onPress={() => openItem(duplicate)} disabled={store.busy} />
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
  safe: { flex: 1, backgroundColor: c.background }, shell: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: c.background },
  loading: { flex: 1, padding: 32, minHeight: 250, gap: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
  header: { paddingHorizontal: 24, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { height: 44, width: 44, backgroundColor: '#F1E4B8', borderRadius: 22, borderWidth: 1, borderColor: '#DCD7BF', alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', paddingTop: 8, paddingBottom: 8, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.line },
  tab: { flex: 1, minHeight: 57, alignItems: 'center', justifyContent: 'center', gap: 4 }, tabIcon: { width: 49, height: 29, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { color: c.muted, fontFamily: f.semi, fontSize: 11, lineHeight: 17 },
  addBar: { paddingHorizontal: 24, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.background },
  return: { minHeight: 48, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: c.line },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9, marginBottom: 23 },
  choice: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#748268', backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 11, justifyContent: 'center', maxWidth: '100%' },
  choiceText: { fontFamily: f.semi, color: c.deep, fontSize: 13, lineHeight: 20 },
});
