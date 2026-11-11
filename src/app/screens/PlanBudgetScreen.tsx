import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { validateBudget } from '../../domain/shopping';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Card, Notice, Title, c, f, ui } from '../components/ui';

/**
 * A temporary planning request, not an expense or an automatic change to the
 * user's existing shopping-list budget. The current meal-plan engine supports
 * exactly five meals, so do not promise a different count yet.
 */
export function PlanBudgetScreen({ onContinue, onBack }: {
  onContinue: (budgetCents: number, servings: number) => void;
  onBack: () => void;
}) {
  const { t, translateError } = useI18n();
  const [money, setMoney] = useState('50');
  const [meals, setMeals] = useState('5');
  const [people, setPeople] = useState('2');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    try {
      const amount = validateBudget(money);
      if (amount === null || amount <= 0) { setError(t('mealJourney.invalidBudget')); return; }
      if (!/^[0-9]{1,2}$/.test(meals.trim()) || Number(meals.trim()) !== 5) {
        setError(t('mealJourney.fiveOnly')); return;
      }
      if (!/^(?:[1-9]|1[0-2])$/.test(people.trim())) { setError(t('mealJourney.invalidPeople')); return; }
      onContinue(amount, Number(people.trim()));
    } catch (cause) { setError(translateError(cause)); }
  };

  return <View style={ui.page} testID="meal-budget-screen">
    <Title kicker={t('mealJourney.kicker')} title={t('mealJourney.budgetTitle')}
      subtitle={t('mealJourney.budgetHelp')} />
    <Card>
      <Text style={styles.label}>{t('mealJourney.amount')}</Text>
      <TextInput accessibilityLabel={t('mealJourney.amount')} testID="meal-budget-amount"
        keyboardType="decimal-pad" style={styles.input} value={money}
        onChangeText={value => { setMoney(value); setError(''); }} maxLength={20} />
      <Text style={styles.label}>{t('mealJourney.meals')}</Text>
      <TextInput accessibilityLabel={t('mealJourney.meals')} testID="meal-budget-meals"
        keyboardType="number-pad" style={styles.input} value={meals}
        onChangeText={value => { setMeals(value); setError(''); }} maxLength={2} />
      <Text style={[ui.note, styles.help]}>{t('mealJourney.fiveOnlyHelp')}</Text>
      <Text style={styles.label}>{t('mealJourney.servings')}</Text>
      <TextInput accessibilityLabel={t('mealJourney.servings')} testID="meal-budget-servings"
        keyboardType="number-pad" style={styles.input} value={people}
        onChangeText={value => { setPeople(value); setError(''); }} maxLength={2} />
    </Card>
    {!!error && <Notice kind="error" title={t('mealJourney.invalid')} text={error} />}
    <Notice title={t('mealJourney.limitTitle')} text={t('mealJourney.limitHelp')} />
    <Button label={t('mealJourney.continueRecipes')} testID="meal-budget-continue" onPress={submit} />
    <Button secondary label={t('shell.back')} onPress={onBack} />
  </View>;
}
