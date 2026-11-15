import React, { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ArrowUpRight, Check, Store } from 'lucide-react-native';
import {
  PurchaseJourneyError, validateJourneyStores, validatePlanningRequest,
  type PlanningContext, type PlanningRequest,
} from '../../domain/purchaseJourney';
import { PILOT_STORE_IDS, publicStoreDestination, type StoreId } from '../../domain/stores';
import type { ShoppingList } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Field, Notice, Section, Title, c, f, ui } from '../components/ui';

export interface PlanningFormDraft { budget: string; meals: string; servings: string }

/** A planning request stays in memory until reviewed ingredients are confirmed. */
export function PlanBudgetScreen({ initial, initialServings = 2, draft, onDraftChange, busy, onContinue, onBack }: {
  initial: PlanningRequest | null;
  initialServings?: number;
  draft?: PlanningFormDraft | null;
  onDraftChange?: (draft: PlanningFormDraft) => void;
  busy: boolean;
  onContinue: (request: PlanningRequest) => void;
  onBack: () => void;
}) {
  const { t, formatMoneyInput, translateError } = useI18n();
  const [budget, setBudget] = useState(() => draft?.budget ?? (initial ? formatMoneyInput(initial.budgetCents) : ''));
  const [meals, setMeals] = useState(() => draft?.meals ?? '5');
  const [servings, setServings] = useState(() => draft?.servings ?? String(initial?.servings ?? initialServings));
  const [error, setError] = useState<unknown>(null);
  const change = (field: keyof PlanningFormDraft, value: string) => {
    if (busy) return;
    ({ budget: setBudget, meals: setMeals, servings: setServings })[field](value);
    onDraftChange?.({ budget, meals, servings, [field]: value }); setError(null);
  };
  const submit = () => {
    if (busy) return;
    setError(null);
    try { onContinue(validatePlanningRequest({ budget, meals, servings })); }
    catch (failure) { setError(failure); }
  };

  return <View style={ui.page} testID="planning-budget-screen">
    <Title kicker={t('mealJourney.kicker')} title={t('mealJourney.budgetTitle')}
      subtitle={t('mealJourney.budgetHelp')} />
    <Card>
      <Field label={t('mealJourney.amount')} testID="planning-budget-amount"
        value={budget} onChangeText={value => change('budget', value)} editable={!busy}
        inputMode="decimal" maxLength={32}
        placeholder={t('mealJourney.amountExample', { amount: formatMoneyInput(5000) })} />
      <Field label={t('mealJourney.meals')} testID="planning-meals"
        value={meals} onChangeText={value => change('meals', value)} editable={!busy}
        inputMode="numeric" maxLength={2} hint={t('mealJourney.fiveOnlyHelp')} />
      <Field label={t('mealJourney.servings')} testID="planning-servings"
        value={servings} onChangeText={value => change('servings', value)} editable={!busy}
        inputMode="numeric" maxLength={2} hint={t('mealJourney.servingsHelp')} />
    </Card>
    {error !== null && <Notice kind="error" title={t('mealJourney.invalid')}
      text={error instanceof PurchaseJourneyError ? t(error.key) : translateError(error)} />}
    <Notice title={t('mealJourney.limitTitle')} text={t('mealJourney.limitHelp')} />
    <View style={styles.actions}>
      <Button label={t('mealJourney.chooseStores')} testID="planning-budget-continue"
        disabled={busy} onPress={submit} />
      <Button secondary label={t('shell.back')} icon={ArrowLeft} disabled={busy} onPress={onBack} />
    </View>
  </View>;
}

/** A selection for this purchase only; no favourite, storage or network writes. */
export function JourneyStorePicker({ selected, busy, onChange, onContinue, onBack,
  continueLabel = 'mealJourney.continueMenus', hideActions = false }: {
  selected: readonly StoreId[];
  busy: boolean;
  onChange: (ids: StoreId[]) => void;
  onContinue?: () => void;
  onBack?: () => void;
  continueLabel?: string;
  hideActions?: boolean;
}) {
  const { t, formatNumber } = useI18n();
  const selection = PILOT_STORE_IDS.filter(id => selected.includes(id));
  const update = (next: readonly StoreId[]) => {
    if (!busy) onChange(validateJourneyStores(next));
  };
  return <View style={hideActions ? undefined : ui.page} testID="planning-stores-picker">
    {!hideActions && <Title kicker={t('mealJourney.kicker')} title={t('mealJourney.storesTitle')}
      subtitle={t('mealJourney.storesHelp')} />}
    {hideActions && <Text style={[ui.note, styles.pickerHelp]}>{t('mealJourney.storesHelp')}</Text>}
    <View style={styles.actions}>
      <Button secondary label={t('mealJourney.selectAll')} testID="planning-stores-all"
        disabled={busy || selection.length === PILOT_STORE_IDS.length}
        onPress={() => update([...PILOT_STORE_IDS])} />
      <Button secondary label={t('mealJourney.clearStores')} testID="planning-stores-none"
        disabled={busy || selection.length === 0} onPress={() => update([])} />
    </View>
    <Text testID="planning-store-count" accessibilityLiveRegion="polite" style={styles.count}>
      {t(selection.length ? 'mealJourney.selectedCount' : 'mealJourney.noneSelected', {
        count: formatNumber(selection.length),
      })}
    </Text>
    <View style={styles.storeRows}>
      {PILOT_STORE_IDS.map(id => {
        const checked = selection.includes(id);
        const name = t(`localSettings.store.${id}`);
        return <Pressable key={id} testID={`store-choice-${id}`} accessibilityRole="checkbox"
          accessibilityLabel={t('mealJourney.storeChoice', { store: name })}
          accessibilityState={{ checked, disabled: busy }} aria-checked={checked}
          disabled={busy} onPress={() => update(checked ? selection.filter(value => value !== id) : [...selection, id])}
          style={({ pressed }) => [ui.row, styles.choice, checked && styles.selectedChoice,
            busy ? styles.disabled : pressed && styles.pressed]}>
          <View style={ui.rowIcon}><Store color={c.primary} size={20} strokeWidth={1.7} /></View>
          <Text style={[ui.rowTitle, styles.storeName]}>{name}</Text>
          <View style={[styles.checkbox, checked && styles.checked]}>
            {checked && <Check color={c.surface} size={18} />}
          </View>
        </Pressable>;
      })}
    </View>
    {selection.length === 0 && <Notice title={t('mealJourney.noneSelected')}
      text={t('mealJourney.noStoresHelp')} />}
    {!hideActions && <View style={styles.actions}>
      {onContinue && <Button label={t(selection.length ? continueLabel : 'mealJourney.continueWithoutStores')}
        testID="planning-stores-continue" disabled={busy} onPress={() => { if (!busy) onContinue(); }} />}
      {onBack && <Button secondary label={t('shell.back')} icon={ArrowLeft}
        disabled={busy} onPress={onBack} />}
    </View>}
  </View>;
}

/** Saved ingredients and official destinations, with comparison honestly pending. */
export function JourneyResultScreen({ list, context, busy, onBack, onOpenList, onManualPrices, onStores }: {
  list?: ShoppingList;
  context: PlanningContext;
  busy: boolean;
  onBack: () => void;
  onOpenList: () => void;
  onManualPrices: () => void;
  onStores: () => void;
}) {
  const { t, formatMoney, formatNumber } = useI18n();
  const [visitError, setVisitError] = useState(false);
  const selected = PILOT_STORE_IDS.filter(id => context.stores.includes(id));
  const visit = async (id: StoreId) => {
    if (busy || !list) return;
    const destination = publicStoreDestination(id);
    if (!destination) return;
    setVisitError(false);
    try {
      if (Platform.OS === 'web') window.open(destination.url, '_blank', 'noopener,noreferrer');
      else await Linking.openURL(destination.url);
    } catch { setVisitError(true); }
  };

  return <View style={ui.page} testID="planning-result-screen">
    <Title kicker={t('mealJourney.kicker')} title={t('mealJourney.resultTitle')}
      subtitle={t(list ? 'mealJourney.resultHelp' : 'mealJourney.listMissingHelp')} />
    {!list ? <>
      <Notice kind="warning" title={t('mealJourney.listMissingTitle')} text={t('mealJourney.listMissingHelp')} />
      <View style={styles.actions}>
        <Button label={t('mealJourney.openList')} testID="planning-open-list" disabled={busy} onPress={onOpenList} />
        <Button secondary label={t('shell.back')} icon={ArrowLeft} disabled={busy} onPress={onBack} />
      </View>
    </> : <>
      <Card style={styles.summary}>
        <Text accessibilityRole="header" style={ui.strong}>{list.name}</Text>
        <Text style={ui.note}>{t('mealJourney.productsReady', { count: formatNumber(list.items.length) })}</Text>
        {context.mode === 'budget' && <>
          <View style={styles.moneyRow}>
            <Text style={[ui.note, styles.moneyLabel]}>{t('mealJourney.planningBudget')}</Text>
            <Text testID="planning-budget-target" style={[ui.strong, styles.moneyValue]}>
              {context.budgetCents === null ? t('app.undefined') : formatMoney(context.budgetCents)}
            </Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={[ui.note, styles.moneyLabel]}>{t('mealJourney.listBudget')}</Text>
            <Text testID="planning-list-budget" style={[ui.strong, styles.moneyValue]}>
              {list.budgetCents === null ? t('app.undefined') : formatMoney(list.budgetCents)}
            </Text>
          </View>
          <Text style={ui.note}>{t('mealJourney.listBudgetHelp')}</Text>
        </>}
      </Card>
      <Notice title={t('mealJourney.costPendingTitle')} text={t('mealJourney.costPendingHelp')} />
      <Text style={[ui.note, styles.costHelp]}>{t('mealJourney.packageCostsHelp')}</Text>
      <View style={styles.actions}>
        <Button label={t('mealJourney.openList')} testID="planning-open-list" disabled={busy} onPress={onOpenList} />
        <Button secondary label={t('mealJourney.manualPrices')} testID="planning-manual-prices"
          disabled={busy} onPress={onManualPrices} />
      </View>
      <Section title={t('mealJourney.storesSelectionTitle')} />
      {selected.length === 0 && <Notice title={t('mealJourney.noneSelected')} text={t('mealJourney.noStoresHelp')} />}
      {visitError && <Notice kind="error" title={t('storePilot.openErrorTitle')} text={t('storePilot.openError')} />}
      {selected.map(id => {
        const destination = publicStoreDestination(id);
        if (!destination) return null;
        const name = t(`localSettings.store.${id}`);
        return <Card key={id} style={styles.destination}>
          <Text style={ui.strong}>{name}</Text>
          <Text style={ui.note}>{t(`storePilot.${destination.kind}Help`)}</Text>
          <Button secondary label={t(`storePilot.${destination.kind}Action`, { store: name })}
            testID={`planning-store-open-${id}`} icon={ArrowUpRight} disabled={busy}
            onPress={() => { void visit(id); }} />
        </Card>;
      })}
      <View style={styles.actions}>
        <Button secondary label={t('mealJourney.editStores')} testID="planning-edit-stores"
          disabled={busy} onPress={onStores} />
        <Button secondary label={t('shell.back')} icon={ArrowLeft} disabled={busy} onPress={onBack} />
      </View>
      <Card style={styles.externalNote}>
        <Text style={ui.note}>{t('storePilot.externalPayment')}</Text>
        <Text style={ui.note}>{t('storePilot.noCartTransfer')}</Text>
      </Card>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  actions: { gap: 10, marginBottom: 16 },
  pickerHelp: { marginBottom: 16 },
  count: { fontFamily: f.medium, fontSize: 13, lineHeight: 21, color: c.muted, marginBottom: 12 },
  storeRows: { gap: 2, marginBottom: 16 },
  choice: { marginBottom: 6, minHeight: 66 },
  selectedChoice: { borderColor: c.primary, backgroundColor: c.soft },
  storeName: { flex: 1, flexShrink: 1 },
  checkbox: { width: 25, height: 25, borderWidth: 1.5, borderColor: c.muted, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary, borderColor: c.primary },
  disabled: { opacity: 0.65 },
  pressed: { backgroundColor: c.neutral },
  summary: { gap: 12, backgroundColor: c.neutral },
  moneyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  moneyLabel: { flex: 1, minWidth: 120 },
  moneyValue: { flexShrink: 1, textAlign: 'right' },
  costHelp: { marginBottom: 18 },
  destination: { gap: 10 },
  externalNote: { gap: 8, backgroundColor: c.soft, marginTop: 4 },
});
