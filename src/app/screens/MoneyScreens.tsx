import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calculator, Check, ChevronRight, Pencil, Plus, ReceiptText, Trash2, Wallet, type LucideIcon } from 'lucide-react-native';
import { createId } from '../../domain/comparisons';
import { ExpenseError, todayCanary, totalExpenses, validateExpenseInput, type Expense, type ExpenseInput } from '../../domain/expenses';
import { summarizeList, type ShoppingList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Field, IconButton, Notice, Pill, Section, Sheet, c, f, ui } from '../components/ui';
import type { ExpensesStore } from '../useExpenses';

export interface BudgetScreenProps {
  active?: ShoppingList;
  lists: ShoppingList[];
  store: ExpensesStore;
  onBudget(): void;
  onCreateList(): void;
  onHistory(): void;
  onBack(): void;
}

export interface HistoryScreenProps {
  active?: ShoppingList;
  lists: ShoppingList[];
  store: ExpensesStore;
  onBack(): void;
}

/** These are confirmed, manually entered payments, separate from shopping-list prices. */
export function BudgetScreen({ active, lists, store, onBudget, onCreateList, onHistory }: BudgetScreenProps) {
  const { t, formatMoney, formatNumber } = useI18n();
  const { openNew, panels } = useExpensePanels(store, lists, active);
  const ready = !store.loading && !store.loadError;
  const records = active ? store.data.expenses.filter(expense => expense.listId === active.id) : store.data.expenses;
  const actualTotal = ready ? totalExpenses(records) : 0;
  const summary = active ? summarizeList(active) : undefined;
  const hasAnnotatedAmounts = !!summary && summary.itemCount > summary.missingPriceCount;
  const budgetValue = active?.budgetCents === undefined || active.budgetCents === null
    ? t('moneyViews.noBudget') : formatMoney(active.budgetCents);
  const spendingValue = store.loading ? t('moneyViews.loading') : store.loadError ? t('moneyViews.unavailable')
    : records.length ? formatMoney(actualTotal) : t('moneyViews.notRecorded');
  const limitAction = active ? t('moneyViews.editLimit') : t('secondary.createList');
  const excess = ready && active?.budgetCents !== null && active?.budgetCents !== undefined
    ? Math.max(0, actualTotal - active.budgetCents) : 0;

  return <View style={ui.page}>
    <Text accessibilityRole="header" style={styles.pageHeading}>{t('moneyViews.budgetTitle')}</Text>
    <Pressable testID="budget-limit-card" accessibilityRole="button" accessibilityLabel={limitAction}
      accessibilityHint={`${active ? t('moneyViews.budgetFor', { name: active.name }) : t('moneyViews.budgetTitle')}: ${budgetValue}`}
      onPress={active ? onBudget : onCreateList} disabled={store.busy}
      style={({ pressed }) => [styles.budgetCard, (pressed || store.busy) && styles.dimmed]}>
      <View style={styles.inline}>
        <Text style={[ui.body, styles.flex]}>{active ? t('moneyViews.budgetFor', { name: active.name }) : t('moneyViews.budgetTitle')}</Text>
        <Pencil size={18} color={c.deep} />
      </View>
      <Text testID="budget-limit-value" style={[ui.number, styles.budgetAmount]}>{budgetValue}</Text>
      <View style={styles.wrapRow}>
        <Text style={styles.budgetText}>{t('moneyViews.actualSpent')}</Text>
        <Text testID="budget-actual-value" style={styles.budgetText}>{spendingValue}</Text>
      </View>
    </Pressable>
    <Text style={[ui.note, styles.scope]}>{active ? t('moneyViews.scopeFor', { name: active.name }) : t('moneyViews.scopeAll')}</Text>

    <Section title={t('moneyViews.controlTitle')} />
    <MoneyControl icon={ReceiptText} title={t('moneyViews.actualTitle')}
      subtitle={ready && records.length ? t('moneyViews.actualHelpCount', { count: formatNumber(records.length) }) : ready ? t('moneyViews.noRecordsHelp') : spendingValue}
      value={ready && records.length ? formatMoney(actualTotal) : '—'} testID="budget-recorded-total" />
    <MoneyControl icon={Calculator} title={t('moneyViews.annotatedTitle')}
      subtitle={hasAnnotatedAmounts && summary ? t('moneyViews.coverage', { known: formatNumber(summary.itemCount - summary.missingPriceCount), total: formatNumber(summary.itemCount) }) : t('moneyViews.annotatedEmpty')}
      value={hasAnnotatedAmounts && summary ? formatMoney(summary.knownTotalCents) : '—'} testID="budget-annotated-total" />
    <Text style={[ui.note, styles.smallGap]}>{t('moneyViews.annotatedHelp')}</Text>
    <Text style={[ui.note, styles.smallGap]}>{t('moneyViews.markedHelp')}</Text>

    <View style={styles.statusArea}>
      <ExpensesStatus store={store} />
      {excess > 0 && <Notice kind="warning" title={t('moneyViews.overBudgetTitle')}
        text={t('moneyViews.overBudgetBody', { amount: formatMoney(excess) })} />}
      <ExpenseUndo store={store} />
    </View>
    <View style={styles.primaryActions}>
      <Button accent icon={Plus} testID="record-expense" label={t('moneyViews.recordExpense')}
        onPress={openNew} disabled={!ready || store.busy} />
      <Button secondary icon={ChevronRight} testID="open-expense-history" label={t('moneyViews.viewHistory')}
        onPress={onHistory} disabled={store.busy} />
      <Text style={ui.note}>{t('moneyViews.budgetHelp')}</Text>
    </View>
    {panels}
  </View>;
}

export function HistoryScreen({ active, lists, store }: HistoryScreenProps) {
  const { t, formatMoney, formatNumber, formatDate } = useI18n();
  const { openNew, openEdit, openDelete, panels } = useExpensePanels(store, lists, active);
  const [filter, setFilter] = useState<'week' | 'all'>('week');
  const today = useCanaryToday();
  const monday = new Date(`${today}T12:00:00.000Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const weekStart = monday.toISOString().slice(0, 10);
  const records = store.data.expenses.slice().reverse()
    .filter(expense => filter === 'all' || (expense.date >= weekStart && expense.date <= today))
    .sort((left, right) => right.date.localeCompare(left.date));
  const ready = !store.loading && !store.loadError;
  const emptyWeek = filter === 'week' && store.data.expenses.length > 0;

  return <View style={ui.page}>
    <Text accessibilityRole="header" style={styles.pageHeading}>{t('moneyViews.historyTitle')}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={t('moneyViews.historyTitle')} style={styles.filters}>
      {(['week', 'all'] as const).map(value => <Pressable key={value} accessibilityRole="radio"
        testID={`expenses-filter-${value}`} accessibilityState={{ checked: filter === value }}
        onPress={() => setFilter(value)} style={({ pressed }) => [styles.filter, filter === value && styles.filterSelected, pressed && styles.dimmed]}>
        <Text style={styles.filterText}>{t(value === 'week' ? 'moneyViews.thisWeek' : 'moneyViews.all')}</Text>
      </Pressable>)}
    </View>
    {filter === 'week' && <Text style={[ui.note, styles.filterHelp]}>{t('moneyViews.weekHelp')}</Text>}
    <ExpensesStatus store={store} />
    <ExpenseUndo store={store} />
    {ready && (records.length === 0 ? <Card style={styles.emptyCard}>
      <View style={styles.emptyIcon}><ReceiptText size={27} color={c.primary} strokeWidth={1.6} /></View>
      <Text accessibilityRole="header" testID="expenses-empty" style={styles.emptyTitle}>
        {t(emptyWeek ? 'moneyViews.weekEmptyTitle' : 'moneyViews.emptyTitle')}
      </Text>
      <Text style={[ui.note, styles.center]}>{t(emptyWeek ? 'moneyViews.weekEmptyBody' : 'moneyViews.emptyBody')}</Text>
    </Card> : <>
      <Card style={styles.periodSummary}>
        <Text style={ui.note}>{t('moneyViews.periodTotal')}</Text>
        <Text testID="expenses-period-total" style={ui.number}>{formatMoney(totalExpenses(records))}</Text>
        <Text style={ui.note}>{t('moneyViews.actualHelpCount', { count: formatNumber(records.length) })}</Text>
      </Card>
      <View style={styles.records}>
        {records.map(expense => <Card key={expense.id} style={styles.expenseCard}>
          <View style={styles.expenseTop}>
            <View style={styles.flex}>
              <Text style={ui.strong}>{expense.store || t('moneyViews.paidPurchase')}</Text>
              <Text style={ui.note}>{formatDate(expense.date)}</Text>
            </View>
            <Text style={styles.expenseAmount}>{formatMoney(expense.amountCents)}</Text>
          </View>
          <Text style={ui.note}>{expense.listName ? t('moneyViews.listOf', { name: expense.listName }) : t('moneyViews.noList')}</Text>
          {!!expense.note && <Text style={ui.body}>{expense.note}</Text>}
          <View style={styles.expenseFooter}>
            <Text style={[ui.note, styles.flex]}>{t('moneyViews.manualRecord')}</Text>
            <View style={styles.inline}>
              <IconButton icon={Pencil} label={t('moneyViews.editExpense', { amount: formatMoney(expense.amountCents), date: formatDate(expense.date) })}
                disabled={store.busy} onPress={() => openEdit(expense)} />
              <IconButton icon={Trash2} danger label={t('moneyViews.deleteExpense', { amount: formatMoney(expense.amountCents), date: formatDate(expense.date) })}
                disabled={store.busy} onPress={() => openDelete(expense)} />
            </View>
          </View>
        </Card>)}
      </View>
    </>)}
    <View style={styles.historyAction}>
      <Button icon={Plus} testID="add-expense" label={t('moneyViews.addExpense')}
        onPress={openNew} disabled={!ready || store.busy} />
    </View>
    <View style={styles.historyFootnote}><Pill label={t('moneyViews.lessSpending')} /></View>
    {panels}
  </View>;
}

function MoneyControl({ icon: Icon, title, subtitle, value, testID }: {
  icon: LucideIcon; title: string; subtitle: string; value: string; testID: string;
}) {
  return <Card style={styles.moneyControl}>
    <View style={styles.controlIcon}><Icon size={21} color={c.primary} strokeWidth={1.6} /></View>
    <View style={styles.flex}><Text style={ui.body}>{title}</Text><Text style={ui.note}>{subtitle}</Text></View>
    <Text testID={testID} style={styles.controlValue}>{value}</Text>
  </Card>;
}

function useExpenseErrorText() {
  const { t, translateError } = useI18n();
  return (error: unknown): string => {
    if (error instanceof ExpenseError) return t(error.key);
    if (typeof error === 'string' && /^(?:money|moneyViews)\./u.test(error)) return t(error);
    return translateError(error);
  };
}

function ExpensesStatus({ store }: { store: ExpensesStore }) {
  const { t } = useI18n();
  const errorText = useExpenseErrorText();
  if (store.loading) return <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={t('moneyViews.loading')}>
    <ActivityIndicator color={c.primary} /><Text style={ui.note}>{t('moneyViews.loading')}</Text>
  </View>;
  if (store.loadError) return <Notice kind="error" title={t('moneyViews.loadErrorTitle')} text={errorText(store.loadError)}
    action={t('common.retry')} onPress={() => { if (!store.busy) void store.reload(); }} />;
  if (store.saveError) return <Notice kind="error" title={t('moneyViews.saveErrorTitle')} text={errorText(store.saveError)} />;
  return null;
}

function ExpenseUndo({ store }: { store: ExpensesStore }) {
  const { t } = useI18n();
  if (!store.undo || store.loadError || store.loading) return null;
  return <Notice kind="success" title={t(store.undo.label)} text={t('moneyViews.undoInfo')}
    action={t('app.undo')} onPress={() => { if (!store.busy) void store.undoLast(); }} />;
}

function useCanaryToday(): string {
  const [today, setToday] = useState(() => todayCanary());
  useEffect(() => {
    const refresh = () => setToday(todayCanary());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return today;
}

type EditorSession = { id: string; original?: Expense };

function useExpensePanels(store: ExpensesStore, lists: ShoppingList[], active?: ShoppingList) {
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const writable = !store.busy && !store.loading && !store.loadError;
  const openNew = () => {
    if (!writable || editor || deleting) return;
    store.clearSaveError();
    setEditor({ id: createId() });
  };
  const openEdit = (expense: Expense) => {
    if (!writable || editor || deleting) return;
    store.clearSaveError();
    setEditor({ id: expense.id, original: { ...expense } });
  };
  const openDelete = (expense: Expense) => {
    if (!writable || editor || deleting) return;
    store.clearSaveError();
    setDeleting({ ...expense });
  };
  const panels = <>
    {editor && <ExpenseEditor key={editor.id} session={editor} store={store} lists={lists} active={active}
      onClose={() => setEditor(null)} />}
    {deleting && <DeleteExpense expense={deleting} store={store} onClose={() => setDeleting(null)} />}
  </>;
  return { openNew, openEdit, openDelete, panels };
}

function ExpenseEditor({ session, store, lists, active, onClose }: {
  session: EditorSession; store: ExpensesStore; lists: ShoppingList[]; active?: ShoppingList; onClose(): void;
}) {
  const { t, formatMoney, formatMoneyInput } = useI18n();
  const errorText = useExpenseErrorText();
  const [draft, setDraft] = useState<ExpenseInput>(() => ({
    amount: session.original ? formatMoneyInput(session.original.amountCents) : '',
    date: session.original?.date ?? todayCanary(),
    store: session.original?.store ?? '',
    note: session.original?.note ?? '',
    listId: session.original ? session.original.listId : active?.id ?? null,
    listName: session.original ? session.original.listName : active?.name ?? null,
    confirmed: false,
  }));
  const initialDraft = useRef(JSON.stringify(draft));
  const [step, setStep] = useState<'edit' | 'review' | 'discard'>('edit');
  const previousStep = useRef<'edit' | 'review'>('edit');
  const [reviewed, setReviewed] = useState<Omit<Expense, 'id'> | null>(null);
  const [localError, setLocalError] = useState<unknown>(null);
  const [applying, setApplying] = useState(false);
  const submissionLock = useRef(false);
  const busy = applying || store.busy;
  const dirty = initialDraft.current !== JSON.stringify(draft);
  const error = store.saveError || localError;
  const unavailable = store.loading || !!store.loadError;
  const orphanList = draft.listId && !lists.some(list => list.id === draft.listId);

  const update = <K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) => {
    if (busy) return;
    setDraft(previous => ({ ...previous, [key]: value }));
    setLocalError(null);
  };
  const close = () => {
    if (busy || submissionLock.current) return;
    if (step === 'discard') { setStep(previousStep.current); return; }
    if (!dirty) { onClose(); return; }
    previousStep.current = step;
    setStep('discard');
  };
  const review = () => {
    if (busy || unavailable) return;
    store.clearSaveError();
    setLocalError(null);
    try {
      setReviewed(validateExpenseInput(draft));
      setStep('review');
    } catch (error) { setLocalError(error); }
  };
  const save = async () => {
    if (busy || unavailable || submissionLock.current || !reviewed || step !== 'review') return;
    submissionLock.current = true;
    setApplying(true);
    setLocalError(null);
    store.clearSaveError();
    let saved = false;
    try {
      // Validate again at confirmation; no list, price or payment side effects.
      const expense: Expense = { ...validateExpenseInput(draft), id: session.id };
      saved = await store.commit(state => {
        if (session.original) {
          const current = state.expenses.find(record => record.id === session.id);
          if (!current || JSON.stringify(current) !== JSON.stringify(session.original)) throw new ExpenseError('money.errors.recordChanged');
          return { expenses: state.expenses.map(record => record.id === session.id ? expense : record) };
        }
        if (state.expenses.some(record => record.id === session.id)) throw new ExpenseError('money.errors.recordChanged');
        return { expenses: [...state.expenses, expense] };
      }, session.original ? 'moneyViews.updated' : 'moneyViews.saved');
      if (saved) onClose();
      else setLocalError('moneyViews.saveFailed');
    } catch (error) { setLocalError(error); }
    finally {
      submissionLock.current = false;
      if (!saved) setApplying(false);
    }
  };

  let footer: React.ReactNode;
  if (step === 'discard') footer = <>
    <Button label={t('moneyViews.keepEditing')} secondary onPress={() => setStep(previousStep.current)} />
    <Button label={t('moneyViews.discard')} danger icon={Trash2} onPress={onClose} />
  </>;
  else if (step === 'review') footer = <>
    <Button testID="expense-confirm-save" label={t('moneyViews.confirmSave')} icon={Check} onPress={() => { void save(); }} busy={busy} disabled={unavailable} />
    <Button label={t('moneyViews.backToEdit')} secondary onPress={() => setStep('edit')} disabled={busy} />
  </>;
  else footer = <>
    <Button testID="expense-review" label={t('moneyViews.review')} onPress={review} disabled={busy || unavailable} />
    <Button label={t('moneyViews.cancel')} secondary onPress={close} disabled={busy} />
  </>;

  return <Sheet visible testID="expense-editor" busy={busy} onClose={close} footer={footer}
    title={t(step === 'discard' ? 'moneyViews.discardTitle' : step === 'review' ? 'moneyViews.reviewTitle' : session.original ? 'moneyViews.editTitle' : 'moneyViews.formTitle')}
    subtitle={step === 'discard' ? undefined : t(step === 'review' ? 'moneyViews.reviewHelp' : 'moneyViews.formHelp')}>
    {step === 'discard' ? <Text style={ui.body}>{t('moneyViews.discardBody')}</Text> : <>
      {unavailable && <ExpensesStatus store={store} />}
      {!!error && <Notice kind="error" title={t('moneyViews.saveErrorTitle')} text={errorText(error)} />}
      {step === 'review' && reviewed ? <>
        <ExpenseDetails expense={{ ...reviewed, id: session.id }} />
        <View style={styles.confirmedSummary}><Check size={20} color={c.primary} /><Text style={[ui.body, styles.flex]}>{t('moneyViews.paidConfirm')}</Text></View>
      </> : <>
        <Field label={t('moneyViews.amount')} hint={t('moneyViews.amountHint')} value={draft.amount}
          testID="expense-amount" onChangeText={value => update('amount', value)} placeholder={formatMoneyInput(0)}
          keyboardType="decimal-pad" inputMode="decimal" maxLength={20} editable={!busy} />
        <Field label={t('moneyViews.date')} hint={t('moneyViews.dateHint')} value={draft.date}
          testID="expense-date" onChangeText={value => update('date', value)} placeholder={t('moneyViews.datePlaceholder')}
          autoCapitalize="none" autoCorrect={false} maxLength={10} editable={!busy} />
        <Field label={t('moneyViews.store')} hint={t('moneyViews.storeHint')} value={draft.store}
          testID="expense-store" onChangeText={value => update('store', value)} maxLength={120} editable={!busy} />
        <Field label={t('moneyViews.note')} hint={t('moneyViews.noteHint')} value={draft.note}
          testID="expense-note" onChangeText={value => update('note', value)} multiline maxLength={500} editable={!busy} />
        <View accessibilityRole="radiogroup" accessibilityLabel={t('moneyViews.list')} style={styles.listOptions}>
          <Text style={ui.fieldLabel}>{t('moneyViews.list')}</Text>
          <Text style={ui.note}>{t('moneyViews.listHelp')}</Text>
          <ListChoice label={t('moneyViews.noList')} checked={draft.listId === null} disabled={busy}
            onPress={() => { setDraft(previous => ({ ...previous, listId: null, listName: null })); setLocalError(null); }} />
          {!!orphanList && <ListChoice label={draft.listName ?? t('moneyViews.noList')} checked disabled={busy} onPress={() => {}} />}
          {lists.map(list => <ListChoice key={list.id} label={list.name} checked={draft.listId === list.id} disabled={busy}
            onPress={() => { setDraft(previous => ({ ...previous, listId: list.id, listName: list.name })); setLocalError(null); }} />)}
        </View>
        <Pressable testID="expense-paid-confirmation" accessibilityRole="checkbox" accessibilityLabel={t('moneyViews.paidConfirm')}
          accessibilityState={{ checked: draft.confirmed, disabled: busy }} disabled={busy}
          onPress={() => update('confirmed', !draft.confirmed)} style={({ pressed }) => [styles.confirmation, pressed && styles.dimmed]}>
          <View style={[styles.checkbox, draft.confirmed && styles.checkboxSelected]}>
            {draft.confirmed && <Check size={18} color="#fff" strokeWidth={2.2} />}
          </View>
          <Text style={[ui.body, styles.flex]}>{t('moneyViews.paidConfirm')}</Text>
        </Pressable>
        {!!reviewed && <Text style={ui.note}>{formatMoney(reviewed.amountCents)}</Text>}
      </>}
    </>}
  </Sheet>;
}

function ListChoice({ label, checked, disabled, onPress }: { label: string; checked: boolean; disabled: boolean; onPress(): void }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked, disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.listChoice, checked && styles.listChoiceSelected, (pressed || disabled) && styles.dimmed]}>
    <Text style={[ui.body, styles.flex]}>{label}</Text>
    <View style={[styles.radio, checked && styles.radioSelected]}>{checked && <View style={styles.radioDot} />}</View>
  </Pressable>;
}

function ExpenseDetails({ expense }: { expense: Expense }) {
  const { t, formatMoney, formatDate } = useI18n();
  return <Card style={styles.reviewCard}>
    <Text style={ui.note}>{t('moneyViews.amount')}</Text>
    <Text style={ui.number}>{formatMoney(expense.amountCents)}</Text>
    <Detail label={t('moneyViews.date')} value={formatDate(expense.date)} />
    <Detail label={t('moneyViews.store')} value={expense.store || t('moneyViews.notProvided')} />
    <Detail label={t('moneyViews.list')} value={expense.listName || t('moneyViews.noList')} />
    <Detail label={t('moneyViews.note')} value={expense.note || t('moneyViews.notProvided')} />
  </Card>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={ui.note}>{label}</Text><Text style={ui.body}>{value}</Text></View>;
}

function DeleteExpense({ expense, store, onClose }: { expense: Expense; store: ExpensesStore; onClose(): void }) {
  const { t } = useI18n();
  const errorText = useExpenseErrorText();
  const [localError, setLocalError] = useState<unknown>(null);
  const [applying, setApplying] = useState(false);
  const lock = useRef(false);
  const busy = applying || store.busy;
  const error = store.saveError || localError;
  const remove = async () => {
    if (busy || lock.current || store.loading || store.loadError) return;
    lock.current = true;
    setApplying(true);
    setLocalError(null);
    store.clearSaveError();
    let saved = false;
    try {
      saved = await store.commit(state => {
        const current = state.expenses.find(record => record.id === expense.id);
        if (!current || JSON.stringify(current) !== JSON.stringify(expense)) throw new ExpenseError('money.errors.recordChanged');
        return { expenses: state.expenses.filter(record => record.id !== expense.id) };
      }, 'moneyViews.deleted');
      if (saved) onClose();
      else setLocalError('moneyViews.saveFailed');
    } catch (error) { setLocalError(error); }
    finally {
      lock.current = false;
      if (!saved) setApplying(false);
    }
  };
  return <Sheet visible testID="expense-delete-confirmation" busy={busy} title={t('moneyViews.deleteTitle')}
    subtitle={t('moneyViews.deleteBody')} onClose={() => { if (!busy && !lock.current) onClose(); }}
    footer={<>
      <Button testID="expense-confirm-delete" danger icon={Trash2} label={t('moneyViews.confirmDelete')}
        onPress={() => { void remove(); }} busy={busy} disabled={store.loading || !!store.loadError} />
      <Button secondary label={t('moneyViews.cancel')} onPress={onClose} disabled={busy} />
    </>}>
    {!!error && <Notice kind="error" title={t('moneyViews.saveErrorTitle')} text={errorText(error)} />}
    {(store.loading || !!store.loadError) && <ExpensesStatus store={store} />}
    <ExpenseDetails expense={expense} />
  </Sheet>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dimmed: { opacity: 0.65 },
  pageHeading: { marginTop: 22, marginBottom: 24, fontFamily: f.bold, fontSize: 20, lineHeight: 28, color: c.ink, letterSpacing: -0.4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 7, rowGap: 4 },
  budgetCard: { padding: 18, borderRadius: 18, backgroundColor: c.paleYellow, borderWidth: 1, borderColor: c.line, minHeight: 156 },
  budgetAmount: { marginTop: 20, marginBottom: 12 },
  budgetText: { color: c.deep, fontFamily: f.medium, fontSize: 15, lineHeight: 24 },
  scope: { marginTop: 10 },
  moneyControl: { padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  controlIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  controlValue: { fontFamily: f.bold, fontSize: 16, lineHeight: 24, color: c.primary, flexShrink: 1, maxWidth: '42%' },
  smallGap: { marginTop: 7 },
  statusArea: { marginTop: 18 },
  primaryActions: { gap: 12, marginTop: 18 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 9 },
  filter: { minHeight: 44, minWidth: 80, borderRadius: 12, borderWidth: 1, borderColor: c.line, paddingVertical: 11, paddingHorizontal: 17, justifyContent: 'center' },
  filterSelected: { backgroundColor: c.soft, borderColor: c.primary },
  filterText: { fontFamily: f.semi, fontSize: 14, lineHeight: 21, color: c.deep },
  filterHelp: { marginBottom: 18 },
  emptyCard: { backgroundColor: c.neutral, minHeight: 245, alignItems: 'center', justifyContent: 'center', gap: 15, paddingHorizontal: 23, marginTop: 8 },
  emptyIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: f.extra, fontSize: 20, lineHeight: 28, color: c.ink, textAlign: 'center' },
  center: { textAlign: 'center' },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 18 },
  periodSummary: { backgroundColor: c.soft, gap: 5, marginBottom: 16 },
  records: { gap: 12 },
  expenseCard: { gap: 10 },
  expenseTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  expenseAmount: { fontFamily: f.extra, color: c.deep, fontSize: 24, lineHeight: 33, flexShrink: 1, maxWidth: '65%' },
  expenseFooter: { flexDirection: 'row', gap: 8, alignItems: 'center', borderTopWidth: 1, borderColor: c.line, paddingTop: 8 },
  historyAction: { marginTop: 32 },
  historyFootnote: { marginTop: 32 },
  listOptions: { gap: 9, marginBottom: 24 },
  listChoice: { minHeight: 48, borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  listChoiceSelected: { backgroundColor: c.soft, borderColor: c.primary },
  radio: { width: 20, height: 20, borderWidth: 2, borderColor: c.muted, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: c.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
  confirmation: { minHeight: 56, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, padding: 14, backgroundColor: c.soft },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: c.primary, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: c.primary },
  confirmedSummary: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20 },
  reviewCard: { gap: 8, backgroundColor: c.neutral },
  detail: { gap: 3, paddingTop: 10, borderTopWidth: 1, borderColor: c.line },
});
