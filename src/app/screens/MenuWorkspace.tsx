import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Check, ChevronRight, Clock, FileText, Minus, Plus, RefreshCw, ShoppingBag, Utensils } from 'lucide-react-native';
import { RECIPES } from '../../data/recipes';
import {
  canonicalMeasure, combineIngredients, createMealPlan, normalizeIngredientName, planIngredients, replaceMeal, scaleRecipe,
  type Recipe, type ScaledIngredient,
} from '../../domain/menus';
import { matchingItems, parseIngredientText, type IngredientDraft } from '../../domain/ingredientImport';
import {
  CATEGORIES, UNITS, validateItemInput, validateListName,
  type ShoppingState,
} from '../../domain/shopping';
import { useMealPlan } from '../useMealPlan';
import { useI18n } from '../../i18n/LanguageProvider';
import { menusMessages } from '../../i18n/catalogs/menus';
import { localizedRecipe, translateIngredientName, translateIngredientNote } from '../../i18n/recipes';
import { MealArt } from '../components/Illustrations';
import { Button, Card, Field, IconButton, Notice, Pill, Section, Sheet, Title, c, f, ui } from '../components/ui';

interface Props {
  shopping: ShoppingState;
  shoppingBusy: boolean;
  shoppingError: string;
  onApply: (targetListId: string | null, newListName: string, drafts: IngredientDraft[]) => Promise<boolean>;
  onNavigateList: () => void;
}
type Panel = { kind: 'text' } | { kind: 'review' } | { kind: 'recipe'; recipe: Recipe } | { kind: 'replace'; index: number };
const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
type ReviewSource = { kind: 'text' } | { kind: 'plan'; servings: number } | { kind: 'recipe'; recipe: Recipe; servings: number };
class MenuFeedback extends Error {
  constructor(readonly key: string, readonly values?: Record<string, string | number>) { super(key); }
}

/** Offline planning and explicit ingredient review; no AI request or voice recording. */
export function MenuWorkspace({ shopping, shoppingBusy, shoppingError, onApply, onNavigateList }: Props) {
  const { t, locale, formatQuantity, formatNumber, translateError, categoryLabel, unitLabel } = useI18n();
  const meal = useMealPlan();
  const feedback = (value: unknown) => value instanceof MenuFeedback ? t(value.key, value.values) : translateError(value);
  const day = (index: number) => t('menus.day.' + dayIds[index]);
  const plural = (key: string, count: number, values: Record<string, string | number> = {}) => t(key + (count === 1 ? '.one' : '.other'), { ...values, count: formatNumber(count) });
  const [people, setPeople] = useState(2);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [text, setText] = useState('');
  const [issues, setIssues] = useState<{ line: number; message: string }[]>([]);
  const [drafts, setDrafts] = useState<IngredientDraft[]>([]);
  const [source, setSource] = useState<ReviewSource>({ kind: 'text' });
  const [targetId, setTargetId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string | null>(null);
  const [editedNames, setEditedNames] = useState<Set<string>>(() => new Set());
  const [editedNotes, setEditedNotes] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<unknown>(null);
  const [applying, setApplying] = useState(false);
  const [applyAttempted, setApplyAttempted] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const applyLock = useRef(false);
  const planLock = useRef(false);
  const draftCounter = useRef(0);
  const servings = meal.plan?.servings ?? people;
  const busy = meal.busy || shoppingBusy || applying;
  const target = shopping.lists.find(list => list.id === targetId);
  const selectedCount = drafts.filter(row => row.included && row.decision !== 'skip').length;
  const newListName = newName ?? t('menus.defaultListName');
  const displayName = (row: IngredientDraft) => editedNames.has(row.id) ? row.name : translateIngredientName(row.name, t);
  const displayNote = (row: IngredientDraft) => editedNotes.has(row.id) ? row.note : row.note.split(' · ').map(part => part === menusMessages.es['menus.roundNoteShort'] ? t('menus.roundNoteShort') : translateIngredientNote(part, t)).join(' · ');
  const sourceLabel = source.kind === 'text' ? t('menus.textSource') : source.kind === 'plan' ? plural('menus.reviewPlanSource', source.servings) : plural('menus.recipeSource', source.servings, { title: localizedRecipe(source.recipe, t).title });

  const close = () => {
    if (busy) return;
    if (panel?.kind === 'review' && !discard) { setDiscard(true); return; }
    setPanel(null); setError(''); setDiscard(false);
  };
  const open = (next: Panel) => { if (!busy) { setPanel(next); setError(''); setDiscard(false); } };
  const savePlan = async (next: Parameters<typeof meal.save>[0], after?: () => void) => {
    if (planLock.current || busy) return;
    planLock.current = true; setError('');
    try { if (await meal.save(next)) after?.(); }
    catch (failure) { setError(failure); }
    finally { planLock.current = false; }
  };
  const changePeople = (next: number) => {
    if (next < 1 || next > 12 || busy) return;
    if (meal.plan) void savePlan({ ...meal.plan, servings: next });
    else setPeople(next);
  };
  const review = (ingredients: readonly ScaledIngredient[], origin: ReviewSource) => {
    try {
      const combined = combineIngredients(ingredients);
      const activeId = shopping.lists.find(list => list.id === shopping.activeListId)?.id ?? shopping.lists[0]?.id ?? null;
      const nextDrafts: IngredientDraft[] = combined.map(ingredient => ({
        id: `ingredient-draft-${++draftCounter.current}`, name: ingredient.name,
        quantity: formatQuantity(ingredient.quantityMilli), unit: ingredient.unit, category: ingredient.category,
        note: [ingredient.note, ingredient.rounded ? menusMessages.es['menus.roundNoteShort'] : ''].filter(Boolean).join(' · '),
        included: true, decision: 'pending',
      }));
      setDrafts(nextDrafts);
      setEditedNames(new Set(origin.kind === 'text' ? nextDrafts.map(row => row.id) : []));
      setEditedNotes(new Set(origin.kind === 'text' ? nextDrafts.map(row => row.id) : []));
      setTargetId(activeId); setSource(origin); setExpanded(null); setPanel({ kind: 'review' }); setDiscard(false); setError(''); setApplyAttempted(false);
    } catch (failure) { setError(failure); }
  };
  const parseText = () => {
    setError('');
    try {
      const parsed = parseIngredientText(text);
      setIssues(parsed.issues);
      if (parsed.issues.length) return;
      if (!parsed.ingredients.length) { setError(new MenuFeedback('menus.error.enterIngredient')); return; }
      review(parsed.ingredients.map(ingredient => ({ ...ingredient, rounded: ingredient.rounded ?? false })), { kind: 'text' });
    } catch (failure) { setError(failure); }
  };
  const updateRow = (id: string, change: Partial<IngredientDraft>, resetDecision = false) => {
    if (busy) return;
    setError(''); setApplyAttempted(false);
    setDrafts(previous => previous.map(row => row.id === id ? { ...row, ...change,
      ...(resetDecision ? { decision: 'pending' as const, targetId: undefined } : {}) } : row));
  };
  const chooseTarget = (id: string | null) => {
    if (busy) return;
    setTargetId(id); setError(''); setApplyAttempted(false);
    setDrafts(previous => previous.map(row => ({ ...row, decision: 'pending', targetId: undefined })));
  };
  const confirm = async () => {
    if (applyLock.current || busy) return;
    setError('');
    try {
      if (targetId !== null && !target) throw new MenuFeedback('menus.error.targetMissing');
      if (targetId === null) validateListName(newListName);
      if (!selectedCount) throw new MenuFeedback('menus.error.selectIngredient');
      for (const row of drafts.filter(value => value.included && value.decision !== 'skip')) {
        validateItemInput({ ...row, price: '', priceKind: 'entered' });
        if (target && matchingItems(target, row.name, row.unit).length > 0 && row.decision === 'pending') {
          throw new MenuFeedback('menus.error.decideExisting', { name: displayName(row) });
        }
      }
      applyLock.current = true; setApplying(true); setApplyAttempted(true);
      if (await onApply(targetId, newListName, drafts)) { setPanel(null); setDiscard(false); onNavigateList(); }
      else setError(new MenuFeedback('menus.error.keepProposal'));
    } catch (failure) { setError(failure); }
    finally { applyLock.current = false; setApplying(false); }
  };
  const panelTitle = discard ? t("menus.discardTitle") : panel?.kind === 'text' ? t("menus.importText") :
    panel?.kind === 'review' ? t("menus.reviewTitle") : panel?.kind === 'recipe' ? localizedRecipe(panel.recipe, t).title : panel?.kind === 'replace' ? t('menus.dayDinnerPanel', { day: day(panel.index) }) : '';
  const panelError = (panel?.kind === 'review' && applyAttempted && !applying ? shoppingError : '') || error || (panel?.kind === 'replace' ? meal.saveError : '');

  return <View style={ui.page}>
    <Title kicker={t("menus.kicker")} title={t("menus.title")} subtitle={t("menus.subtitle")} />
    {meal.loading ? <Card style={styles.loading}><ActivityIndicator color={c.primary} /><Text style={ui.body}>{t("menus.loading")}</Text></Card> : meal.loadError ? <>
      <Notice kind="error" title={t("menus.loadErrorTitle")} text={feedback(meal.loadError)} action={t("menus.reload")} onPress={() => void meal.reload()} />
      <Button label={t("menus.continueShopping")} onPress={onNavigateList} icon={ShoppingBag} />
    </> : <>
      <Pill label={t("menus.localPlanning")} tone="yellow" />
      <Text style={[ui.note, { marginTop: 11, marginBottom: 18 }]}>{t("menus.localInfo")}</Text>
      {!!(meal.saveError || (!panel && error)) && <Notice kind="error" title={t("menus.notSaved")} text={feedback(meal.saveError || error)} />}
      <Card style={styles.servingsCard}>
        <View style={{ flex: 1, gap: 5 }}><Text style={ui.strong}>{t("menus.peopleQuestion")}</Text><Text style={ui.note}>{t("menus.peopleHint")}</Text></View>
        <View style={styles.counter}><IconButton label={t("menus.reducePeople")} icon={Minus} disabled={busy || servings <= 1} onPress={() => changePeople(servings - 1)} />
          <Text testID="menu-servings" accessibilityLabel={plural('menus.people', servings)} style={styles.people}>{formatNumber(servings)}</Text>
          <IconButton label={t("menus.increasePeople")} icon={Plus} disabled={busy || servings >= 12} onPress={() => changePeople(servings + 1)} />
        </View>
      </Card>
      {!meal.plan ? <>
        <View style={{ marginTop: 16 }}><Button label={t("menus.prepareMenu")} testID="prepare-menu" busy={meal.busy} disabled={busy} onPress={() => { try { void savePlan(createMealPlan(servings)); } catch (failure) { setError(failure); } }} icon={Utensils} /></View>
        <View style={styles.empty}><MealArt size={112} /><Text style={styles.emptyTitle}>{t("menus.emptyTitle")}</Text><Text style={[ui.note, { textAlign: 'center' }]}>{t("menus.emptyText")}</Text></View>
      </> : <>
        <Section title={t("menus.yourDinners")} />
        <Text style={[ui.note, { marginBottom: 15 }]}>{plural('menus.forPeopleSaved', servings)}</Text>
        {meal.plan.recipeIds.map((id, index) => {
          const recipe = RECIPES.find(item => item.id === id)!;
          return <Card key={`${index}-${id}`} style={styles.mealCard}>
            <Text style={styles.day}>{day(index).toLocaleUpperCase(locale)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('menus.recipeA11y', { title: localizedRecipe(recipe, t).title })} disabled={busy} onPress={() => open({ kind: 'recipe', recipe })} style={styles.recipeLink}>
              <View style={{ flex: 1, gap: 8 }}><Text style={styles.mealName}>{localizedRecipe(recipe, t).title}</Text><View style={styles.inline}><Clock color={c.muted} size={15} /><Text style={ui.note}>{plural('menus.minutesPeople', servings, { minutes: formatNumber(recipe.minutes) })}</Text></View></View><ChevronRight color={c.primary} size={20} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('menus.changeMealA11y', { day: day(index) })} disabled={busy} onPress={() => open({ kind: 'replace', index })} style={styles.changeMeal}><RefreshCw color={c.primary} size={16} /><Text style={ui.link}>{t("menus.changeMeal")}</Text></Pressable>
          </Card>;
        })}
        <Button label={t("menus.reviewMenu")} testID="review-menu" disabled={busy} icon={ShoppingBag} onPress={() => { if (meal.plan) review(planIngredients(meal.plan), { kind: 'plan', servings }); }} />
      </>}
      <Section title={t("menus.ideasTitle")} />
      <Card><View style={styles.inline}><FileText size={23} color={c.primary} /><Text style={[ui.strong, { flex: 1 }]}>{t("menus.chatTitle")}</Text></View>
        <Text style={[ui.note, { marginTop: 12, marginBottom: 18 }]}>{t("menus.chatIntro")}</Text>
        <Button label={t("menus.importText")} testID="import-text" secondary icon={FileText} disabled={busy} onPress={() => { setIssues([]); open({ kind: 'text' }); }} />
      </Card>
      <View style={{ marginTop: 19 }}><Notice title={t("menus.decisionTitle")} text={t("menus.decisionText")} /></View>
    </>}

    <Sheet visible={!!panel} title={panelTitle} busy={busy} onClose={close} testID="menu-sheet"
      subtitle={panel?.kind === 'review' && !discard ? plural('menus.groupedSource', drafts.length, { source: sourceLabel }) : undefined}
      footer={!discard && panel?.kind === 'review' ? <><Text style={ui.note}>{plural('menus.selectedFooter', selectedCount)}</Text><Button label={t("menus.confirm")} testID="confirm-ingredients" busy={applying} disabled={busy || selectedCount === 0} onPress={() => void confirm()} icon={Check} /><Button label={t("menus.cancelProposal")} secondary disabled={busy} onPress={close} /></> :
        !discard && panel?.kind === 'text' ? <Button label={t("menus.parseText")} testID="parse-ingredients" disabled={busy} onPress={parseText} /> : undefined}>
      {discard ? <View style={{ gap: 16 }}><Text style={ui.body}>{t("menus.discardText")}</Text><Button label={t("menus.continueReview")} onPress={() => setDiscard(false)} /><Button label={t("menus.cancelWithoutAdd")} secondary onPress={() => { setPanel(null); setDiscard(false); setError(''); }} /></View> : <>
        {!!panelError && <Notice kind="error" title={applyAttempted && shoppingError && panel?.kind === 'review' ? t("menus.saveIngredientErrorTitle") : t("menus.reviewProposalTitle")} text={feedback(panelError)} />}
        {panel?.kind === 'text' ? <>
          <Text style={[ui.note, { marginBottom: 18 }]}>{t("menus.textGuidance")}</Text>
          <Field label={t("menus.textLabel")} testID="ingredient-text" value={text} onChangeText={value => { setText(value); setIssues([]); setError(''); }} multiline editable={!busy} maxLength={6000} style={{ minHeight: 190 }} hint={t('menus.textHint', { count: formatNumber(text.length) })} placeholder={t('menus.textPlaceholder')} />
          {issues.length > 0 && <Notice kind="error" title={t("menus.linesIssueTitle")} text={issues.map(issue => t('menus.lineIssue', { line: formatNumber(issue.line), message: translateError(issue.message) })).join('\n')} />}
          <Text style={ui.note}>{t("menus.ambiguousText")}</Text>
        </> : panel?.kind === 'review' ? <>
          <Text accessibilityRole="header" style={[ui.strong, { marginBottom: 11 }]}>{t("menus.destinationTitle")}</Text>
          <View style={[styles.options, { marginBottom: 18 }]}>{shopping.lists.map(list => <Choice key={list.id} label={list.name} a11y={t('menus.destinationA11y', { name: list.name })} selected={targetId === list.id} disabled={busy} onPress={() => chooseTarget(list.id)} />)}
            <Choice label={t("menus.newList")} a11y={t("menus.newListA11y")} selected={targetId === null} disabled={busy} onPress={() => chooseTarget(null)} /></View>
          {targetId === null ? <Field label={t("menus.newListName")} value={newListName} maxLength={80} editable={!busy} onChangeText={setNewName} hint={t("menus.newListHint")} /> : <Text style={[ui.note, { marginBottom: 16 }]}>{t('menus.destinationInfo', { name: target?.name ?? t('menus.destinationNotAvailable') })}</Text>}
          <Notice title={t("menus.reviewNoticeTitle")} text={t("menus.reviewNoticeText")} />
          {drafts.map((row, index) => {
            let matches: ReturnType<typeof matchingItems> = [];
            try { if (target && row.name.trim()) matches = matchingItems(target, row.name, row.unit); } catch { /* Inline validation is shown on confirmation. */ }
            const repeatedSuggestion = drafts.slice(0, index).some(previous => {
              if (!previous.included || previous.decision === 'skip') return false;
              try { return normalizeIngredientName(previous.name) === normalizeIngredientName(row.name) && canonicalMeasure(1000, previous.unit).dimension === canonicalMeasure(1000, row.unit).dimension; }
              catch { return false; }
            });
            const canCombine = matches.length === 1 && !matches[0].checked && matches[0].unitPriceCents === null;
            return <Card key={row.id} style={styles.reviewCard}>
              <View testID="ingredient-review-row" style={{ gap: 12 }}>
                <Pressable accessibilityRole="checkbox" accessibilityLabel={t('menus.includeIngredient', { index: formatNumber(index + 1), name: displayName(row) })} accessibilityState={{ checked: row.included, disabled: busy }} aria-checked={row.included}
                  disabled={busy} onPress={() => updateRow(row.id, { included: !row.included })} style={styles.includeRow}>
                  <View style={[styles.check, row.included && { backgroundColor: c.primary, borderColor: c.primary }]}>{row.included && <Check color="#fff" size={18} />}</View><Text style={[ui.strong, { flex: 1 }]}>{t('menus.ingredientLabel', { index: formatNumber(index + 1) })}</Text>
                </Pressable>
                <Field label={t('menus.ingredientNameLabel', { index: formatNumber(index + 1) })} value={displayName(row)} maxLength={120} editable={!busy && row.included} onChangeText={value => { setEditedNames(previous => new Set(previous).add(row.id)); updateRow(row.id, { name: value }, true); }} />
                <Field label={t('menus.ingredientQtyLabel', { index: formatNumber(index + 1) })} value={row.quantity} maxLength={32} editable={!busy && row.included} inputMode="decimal" onChangeText={value => updateRow(row.id, { quantity: value }, true)} />
                <Text style={ui.fieldLabel}>{t("menus.unitLabel")}</Text><View style={styles.options}>{UNITS.map(unit => <Choice key={unit} label={unitLabel(unit)} a11y={t('menus.ingredientUnitA11y', { unit: unitLabel(unit), index: formatNumber(index + 1) })} selected={row.unit === unit} disabled={busy || !row.included} onPress={() => updateRow(row.id, { unit }, true)} />)}</View>
                {!!row.note && expanded !== row.id && <Text style={ui.note}>{displayNote(row)}</Text>}
                <Pressable accessibilityRole="button" accessibilityLabel={t('menus.editDetailsA11y', { index: formatNumber(index + 1) })} disabled={busy} onPress={() => setExpanded(expanded === row.id ? null : row.id)} style={styles.detailAction}><Text style={ui.link}>{expanded === row.id ? t("menus.hideDetails") : t("menus.categoryAndNote")}</Text><ChevronRight color={c.primary} size={16} /></Pressable>
                {expanded === row.id && <><Text style={ui.fieldLabel}>{t("menus.categoryLabel")}</Text><View style={styles.options}>{CATEGORIES.map(category => <Choice key={category} label={categoryLabel(category)} a11y={t('menus.ingredientCategoryA11y', { category: categoryLabel(category), index: formatNumber(index + 1) })} selected={row.category === category} disabled={busy || !row.included} onPress={() => updateRow(row.id, { category })} />)}</View><Field label={t('menus.ingredientNoteLabel', { index: formatNumber(index + 1) })} value={displayNote(row)} maxLength={500} editable={!busy && row.included} onChangeText={value => { setEditedNotes(previous => new Set(previous).add(row.id)); updateRow(row.id, { note: value }); }} multiline /></>}
                {(matches.length > 0 || repeatedSuggestion) && <View style={styles.duplicate}>
                  <Text style={ui.strong}>{matches.length > 0 ? t("menus.alreadyInList") : t("menus.repeatedProposal")}</Text>
                  {matches.length > 0 && <Text style={ui.note}>{matches.map(item => `${item.name}: ${formatQuantity(item.quantityMilli)} ${unitLabel(item.unit)}${item.checked ? ' · ' + t('menus.marked') : ''}${item.unitPriceCents !== null ? ' · ' + t('menus.withPrice') : ''}`).join('\n')}</Text>}
                  <Text style={ui.note}>{t("menus.chooseProposal")}</Text><View style={styles.options}>
                    <Choice label={matches.length > 0 ? t("menus.keepExisting") : t("menus.omitIngredient")} a11y={t('menus.keepExistingA11y', { index: formatNumber(index + 1) })} selected={row.decision === 'skip'} disabled={busy || !row.included} onPress={() => updateRow(row.id, { decision: 'skip', targetId: undefined })} />
                    <Choice label={t("menus.separate")} a11y={t('menus.separateA11y', { index: formatNumber(index + 1) })} selected={row.decision === 'separate'} disabled={busy || !row.included} onPress={() => updateRow(row.id, { decision: 'separate', targetId: undefined })} />
                    {canCombine && !repeatedSuggestion && <Choice label={t("menus.combine")} a11y={t('menus.combineA11y', { index: formatNumber(index + 1) })} selected={row.decision === 'combine'} disabled={busy || !row.included} onPress={() => updateRow(row.id, { decision: 'combine', targetId: matches[0].id })} />}
                  </View>{matches.length > 0 && (!canCombine || repeatedSuggestion) && <Text style={ui.note}>{t("menus.duplicateCaution")}</Text>}
                </View>}
              </View>
            </Card>;
          })}
        </> : panel?.kind === 'recipe' ? <>
          <Pill label={plural('menus.recipePill', servings, { minutes: formatNumber(panel.recipe.minutes) })} tone="yellow" />
          <Section title={t("menus.ingredientsTitle")} />
          {scaleRecipe(panel.recipe, servings).map((ingredient, index) => <View key={index} style={styles.ingredientLine}><Text style={[ui.body, { flex: 1 }]}>{translateIngredientName(ingredient.name, t)}</Text><Text style={[ui.strong, { textAlign: 'right' }]}>{formatQuantity(ingredient.quantityMilli)} {unitLabel(ingredient.unit)}</Text>{ingredient.rounded && <Text style={[ui.note, { width: '100%' }]}>{t("menus.roundNoteLong")}</Text>}</View>)}
          <Section title={t("menus.stepsTitle")} />
          {localizedRecipe(panel.recipe, t).steps.map((step, index) => <View key={index} style={styles.step}><Text style={styles.stepNumber}>{formatNumber(index + 1)}</Text><Text style={[ui.body, { flex: 1 }]}>{step}</Text></View>)}
          <View style={{ marginTop: 19 }}><Notice title={t("menus.allergensTitle")} text={localizedRecipe(panel.recipe, t).allergenNote} /></View>
          <Button label={t("menus.reviewRecipe")} icon={ShoppingBag} onPress={() => review(scaleRecipe(panel.recipe, servings), { kind: 'recipe', recipe: panel.recipe, servings })} />
        </> : panel?.kind === 'replace' && meal.plan ? <>
          <Text style={[ui.note, { marginBottom: 18 }]}>{t("menus.replaceIntro")}</Text>
          <View style={{ gap: 12 }}>{RECIPES.filter(recipe => !meal.plan!.recipeIds.includes(recipe.id)).map(recipe => <Button key={recipe.id} label={localizedRecipe(recipe, t).title} secondary disabled={busy} busy={meal.busy} icon={BookOpen} onPress={() => { try { if (meal.plan) void savePlan(replaceMeal(meal.plan, panel.index, recipe.id), () => setPanel(null)); } catch (failure) { setError(failure); } }} />)}</View>
        </> : null}
      </>}
    </Sheet>
  </View>;
}

function Choice({ label, a11y, selected, disabled, onPress }: { label: string; a11y: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled} onPress={onPress}
    style={[styles.choice, selected && { backgroundColor: c.deep, borderColor: c.deep }, disabled && { opacity: .6 }]}><Text style={[styles.choiceText, selected && { color: '#fff' }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  loading: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 17 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  servingsCard: { backgroundColor: '#F8EDCA', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 2 }, people: { fontFamily: f.extra, fontSize: 27, lineHeight: 36, color: c.deep, minWidth: 32, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 25, paddingBottom: 23, gap: 15 }, emptyTitle: { fontFamily: f.extra, fontSize: 24, lineHeight: 31, letterSpacing: -.7, color: c.deep, textAlign: 'center' },
  mealCard: { paddingVertical: 15, marginBottom: 13 }, day: { fontFamily: f.bold, fontSize: 11, lineHeight: 17, letterSpacing: 1, color: c.muted },
  recipeLink: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 9 }, mealName: { fontFamily: f.extra, fontSize: 20, lineHeight: 28, color: c.deep, letterSpacing: -.5 },
  changeMeal: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#748268', backgroundColor: '#fff', justifyContent: 'center' }, choiceText: { fontFamily: f.semi, fontSize: 13, lineHeight: 20, color: c.deep },
  reviewCard: { marginBottom: 17, padding: 15 }, includeRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 11 }, check: { width: 25, height: 25, borderRadius: 8, borderWidth: 1.5, borderColor: '#748268', alignItems: 'center', justifyContent: 'center' },
  detailAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }, duplicate: { padding: 12, borderRadius: 12, backgroundColor: '#FAEDC9', gap: 10 },
  ingredientLine: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 17 }, stepNumber: { fontFamily: f.bold, color: c.primary, fontSize: 16, lineHeight: 24, minWidth: 22 },
});
