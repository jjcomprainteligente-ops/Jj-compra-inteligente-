import React from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '../../i18n/LanguageProvider';
import { Notice, ui } from '../components/ui';
import { useMealPlan } from '../useMealPlan';
import { NotificationsScreen } from './LocalSettingsScreens';

/** Read the saved plan each time this route opens; never create a plan for a notice. */
export function NotificationsWorkspace(props: Omit<React.ComponentProps<typeof NotificationsScreen>, 'mealPlan'>) {
  const meal = useMealPlan();
  const { t, translateError } = useI18n();
  return <>
    {meal.loading && <View style={[ui.page, { paddingTop: 16, paddingBottom: 0 }]}><Text style={ui.note}>{t('common.loading')}</Text></View>}
    {!!meal.loadError && <View style={[ui.page, { paddingTop: 16, paddingBottom: 0 }]}><Notice kind="error" title={t('app.tabMenus')} text={translateError(meal.loadError)} action={t('common.retry')} onPress={() => { void meal.reload(); }} /></View>}
    <NotificationsScreen {...props} mealPlan={meal.plan} />
  </>;
}
