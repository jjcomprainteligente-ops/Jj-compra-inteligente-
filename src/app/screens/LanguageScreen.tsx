import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Globe } from 'lucide-react-native';
import { useI18n } from '../../i18n/LanguageProvider';
import { LANGUAGES, SUPPORTED_LANGUAGES } from '../../i18n/types';
import { Brand } from '../components/Brand';
import { Button, Card, Notice, Title, c, ui } from '../components/ui';

/** Language is a presentation preference; it never edits a shopping document. */
function LanguageChoices() {
  const { language, source, t, busy, setLanguage, followDevice } = useI18n();
  return <View accessibilityRole="radiogroup" accessibilityLabel={t('common.chooseLanguage')} style={styles.choices}>
    {SUPPORTED_LANGUAGES.map(code => {
      const selected = source === 'manual' && language === code;
      return <Pressable key={code} testID={`language-${code}`} accessibilityRole="radio"
        accessibilityLabel={t('language.choose', { language: LANGUAGES[code].name })}
        accessibilityState={{ checked: selected, disabled: busy }} aria-checked={selected}
        disabled={busy} onPress={() => { void setLanguage(code); }}
        style={({ pressed }) => [styles.choice, selected && styles.selected, (pressed || busy) && { opacity: 0.65 }]}>
        <Text style={[ui.strong, { flex: 1 }]}>{LANGUAGES[code].name}</Text>
        <View style={[styles.radio, selected && styles.checked]}>{selected && <Check size={15} color="#fff" />}</View>
      </Pressable>;
    })}
    <Pressable testID="language-auto" accessibilityRole="radio" accessibilityLabel={t('common.deviceLanguage')}
      accessibilityState={{ checked: source === 'device', disabled: busy }} aria-checked={source === 'device'}
      disabled={busy} onPress={() => { void followDevice(); }}
      style={({ pressed }) => [styles.choice, source === 'device' && styles.selected, (pressed || busy) && { opacity: 0.65 }]}>
      <Globe color={c.primary} size={21} />
      <Text style={[ui.strong, { flex: 1 }]}>{t('common.deviceLanguage')}</Text>
      <View style={[styles.radio, source === 'device' && styles.checked]}>{source === 'device' && <Check size={15} color="#fff" />}</View>
    </Pressable>
    <Text style={ui.note}>{t(source === 'manual' ? 'language.manual' : 'language.device', { language: LANGUAGES[language].name })}</Text>
    {busy && <View style={styles.saving} accessibilityRole="status"><ActivityIndicator color={c.primary} /><Text style={ui.note}>{t('common.loading')}</Text></View>}
  </View>;
}

function PreferenceError() {
  const { t, preferenceError, busy, retryPreferences } = useI18n();
  return preferenceError ? <View style={{ gap: 10, marginTop: 16 }}>
    <Notice kind="error" title={t('common.language')} text={preferenceError} />
    <Button label={t('common.retry')} testID="preferences-retry" secondary disabled={busy}
      onPress={() => { void retryPreferences(); }} />
  </View> : null;
}

export function WelcomeScreen() {
  const { t, busy, preferenceError, completeWelcome, dismissWelcomeForSession } = useI18n();
  return <SafeAreaView style={styles.safe}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.welcomeScroll}>
      <View style={styles.welcomeContent}>
        <Brand />
        <Title kicker={t('language.welcomeKicker')} title={t('language.welcomeTitle')} subtitle={t('language.welcomeBody')} />
        <Card><Text accessibilityRole="header" style={ui.sectionTitle}>{t('common.chooseLanguage')}</Text>
          <Text style={[ui.note, { marginTop: 10, marginBottom: 18 }]}>{t('language.welcomeHint')}</Text>
          <LanguageChoices />
        </Card>
        <PreferenceError />
        <View style={{ marginTop: 20, gap: 12 }}>
          <Button label={t('language.start')} testID="start-app" busy={busy} onPress={() => { void completeWelcome(); }} />
          {!!preferenceError && <Button label={t('common.continueWithoutPreference')} testID="preferences-session-continue"
            secondary disabled={busy} onPress={dismissWelcomeForSession} />}
          <Text style={ui.note}>{t('language.localOnly')}</Text>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export function LanguageScreen({ onBack }: { onBack(): void }) {
  const { t, busy } = useI18n();
  return <View style={ui.page}>
    <View style={{ marginTop: 16 }}><Button label={t('language.backProfile')} testID="language-back" icon={ArrowLeft}
      secondary disabled={busy} onPress={onBack} /></View>
    <Title kicker={t('language.settingsKicker')} title={t('language.title')} subtitle={t('language.subtitle')} />
    <Card><LanguageChoices />
      <Text style={[ui.note, { marginTop: 18 }]}>{t('language.manualHint')}</Text>
      <Text style={[ui.note, { marginTop: 10 }]}>{t('language.deviceHint')}</Text>
    </Card>
    <PreferenceError />
    <Text style={[ui.note, { marginTop: 20 }]}>{t('language.formats')}</Text>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  welcomeScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  welcomeContent: { width: '100%', maxWidth: 552 },
  choices: { gap: 10 },
  choice: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selected: { borderColor: c.primary, backgroundColor: c.soft },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary },
  saving: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
