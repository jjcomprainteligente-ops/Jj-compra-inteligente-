import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  defaultMenuFilters, filterRecipes, MAX_EXCLUDED_INGREDIENTS, MAX_MENU_MINUTES, menuIngredientOptions,
  validateMenuFilters, type MenuFilters,
} from '../../domain/menuFilters';
import { RECIPES } from '../../data/recipes';
import { useI18n } from '../../i18n/LanguageProvider';
import { translateIngredientName } from '../../i18n/recipes';
import { Button, Card, Notice, Section, Sheet, c, f, ui } from './ui';

interface Props {
  filters: MenuFilters;
  busy: boolean;
  budgetCents?: number | null;
  onApply(filters: MenuFilters): void;
  onClose(): void;
}

/** Filter drafts are presentation state only; nothing is persisted by this panel. */
export function MenuFilterPanel({ filters, busy, budgetCents, onApply, onClose }: Props) {
  const { t, formatMoney, formatNumber } = useI18n();
  const [draft, setDraft] = useState<MenuFilters>(() => ({
    ...filters, excludedIngredients: [...filters.excludedIngredients],
  }));
  const ingredients = menuIngredientOptions();
  const count = filterRecipes(RECIPES, draft).length;
  const selectIngredient = (key: string) => setDraft(previous => {
    const included = previous.excludedIngredients.includes(key);
    if (!included && previous.excludedIngredients.length >= MAX_EXCLUDED_INGREDIENTS) return previous;
    return { ...previous, excludedIngredients: included
      ? previous.excludedIngredients.filter(value => value !== key)
      : [...previous.excludedIngredients, key] };
  });

  return <Sheet visible title={t('menuFilters.title')} testID="menu-filter-sheet"
    busy={busy} onClose={onClose}
    footer={<View style={{ gap: 9 }}>
      <Button label={t('menuFilters.apply')} testID="menu-filters-apply" disabled={busy}
        onPress={() => onApply(validateMenuFilters(draft))} />
      <Button label={t('menuFilters.cancel')} secondary disabled={busy} onPress={onClose} />
    </View>}>
    <Text style={ui.note}>{t('menuFilters.sessionOnly')}</Text>
    <Section title={t('menuFilters.time')} />
    <View accessibilityRole="radiogroup" accessibilityLabel={t('menuFilters.time')} style={styles.choices}>
      {[null, ...MAX_MENU_MINUTES].map(value => <FilterChoice
        key={value ?? 'all'} testID={'menu-filter-time-' + (value ?? 'all')}
        label={value === null ? t('menuFilters.noLimit') : t('menuFilters.minutes', { count: formatNumber(value) })}
        checked={draft.maxMinutes === value} disabled={busy}
        onPress={() => setDraft(previous => ({ ...previous, maxMinutes: value }))} />)}
    </View>
    <Section title={t('menuFilters.preference')} />
    <View accessibilityRole="radiogroup" accessibilityLabel={t('menuFilters.preference')} style={styles.choices}>
      {(['any', 'vegetarian', 'vegan'] as const).map(value => <FilterChoice key={value}
        testID={'menu-filter-preference-' + value} label={t('menuFilters.preference.' + value)}
        checked={draft.preference === value} disabled={busy}
        onPress={() => setDraft(previous => ({ ...previous, preference: value }))} />)}
    </View>
    <Text style={[ui.note, { marginTop: 12 }]}>{t('menuFilters.preferenceHelp')}</Text>
    <Section title={t('menuFilters.exclusions')} />
    <Text style={[ui.note, { marginBottom: 12 }]}>{t('menuFilters.exclusionsHelp')}</Text>
    <View style={styles.choices}>
      {ingredients.map(ingredient => {
        const checked = draft.excludedIngredients.includes(ingredient.key);
        const disabled = busy || (!checked && draft.excludedIngredients.length >= MAX_EXCLUDED_INGREDIENTS);
        const name = translateIngredientName(ingredient.name, t);
        return <Pressable key={ingredient.key} accessibilityRole="checkbox"
          accessibilityLabel={t('menuFilters.excludeIngredient', { name })}
          accessibilityState={{ checked, disabled }} aria-checked={checked} disabled={disabled}
          testID={'menu-filter-exclude-' + ingredient.key.replace(/\s+/g, '-')}
          onPress={() => selectIngredient(ingredient.key)}
          style={[styles.choice, checked && styles.selected]}>
          <Text style={[styles.choiceText, checked && styles.selectedText]}>{name}</Text>
        </Pressable>;
      })}
    </View>
    <View style={{ marginTop: 20, gap: 12 }}>
      <Card style={{ backgroundColor: c.soft }}>
        <Text testID="menu-filter-count" accessibilityRole="status" style={ui.strong}>
          {t('menuFilters.count', { count: formatNumber(count), total: formatNumber(RECIPES.length) })}
        </Text>
        <Text style={[ui.note, { marginTop: 7 }]}>{t(count < 5 ? 'menuFilters.needFive' : 'menuFilters.planUnchanged')}</Text>
      </Card>
      <Card style={{ backgroundColor: c.paleYellow }}>
        <Text style={ui.strong}>{t('menuFilters.budgetTitle')}</Text>
        <Text style={[ui.strong, { marginTop: 7 }]}>{budgetCents == null ? t('menuFilters.noBudget') : formatMoney(budgetCents)}</Text>
        <Text style={[ui.note, { marginTop: 7 }]}>{t('menuFilters.budgetHelp')}</Text>
      </Card>
      <Notice title={t('menuFilters.reviewLabels')} text={t('menuFilters.safety')} />
      <Button label={t('menuFilters.reset')} testID="menu-filters-reset" secondary disabled={busy}
        onPress={() => setDraft(defaultMenuFilters())} />
    </View>
  </Sheet>;
}

function FilterChoice({ label, checked, disabled, testID, onPress }: {
  label: string; checked: boolean; disabled: boolean; testID: string; onPress(): void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label}
    accessibilityState={{ checked, disabled }} aria-checked={checked}
    testID={testID} disabled={disabled} onPress={onPress}
    style={[styles.choice, checked && styles.selected]}>
    <Text style={[styles.choiceText, checked && styles.selectedText]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, maxWidth: '100%', borderWidth: 1, borderColor: c.muted, borderRadius: 12, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 11, justifyContent: 'center' },
  selected: { backgroundColor: c.deep, borderColor: c.deep },
  choiceText: { color: c.deep, fontFamily: f.semi, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  selectedText: { color: c.surface },
});
