import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, ChevronDown, Globe } from 'lucide-react-native';
import { useI18n } from '../../i18n/LanguageProvider';
import { LANGUAGES, SUPPORTED_LANGUAGES } from '../../i18n/types';
import { BRAND_NAME, Brand } from '../components/Brand';
import { Button, Card, Notice, Title, c, f, ui } from '../components/ui';

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
  const { t, language, busy, preferenceError, completeWelcome, dismissWelcomeForSession } = useI18n();
  const [showLanguages, setShowLanguages] = useState(false);
  return <SafeAreaView style={styles.safe}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.welcomeScroll}>
      <View style={styles.welcomeContent}>
        <View style={styles.logoCard}><Brand /></View>
        <Text testID="welcome-title" accessibilityRole="header" style={styles.welcomeTitle}>{BRAND_NAME}</Text>
        <Text style={styles.tagline}>{t('visual.welcomeTagline')}</Text>
        <View style={styles.summary}><Text style={styles.summaryText}>{t('visual.welcomeSummary')}</Text></View>
        <Pressable testID="welcome-language-toggle" accessibilityRole="button" accessibilityLabel={t('common.chooseLanguage')}
          accessibilityState={{ expanded: showLanguages, disabled: busy }} aria-expanded={showLanguages}
          disabled={busy} onPress={() => setShowLanguages(value => !value)} style={styles.languageToggle}>
          <Globe size={20} color={c.surface} /><Text style={styles.languageLabel}>{t('language.selected', { language: LANGUAGES[language].name })}</Text>
          <ChevronDown size={18} color={c.surface} />
        </Pressable>
        {showLanguages && <Card><Text accessibilityRole="header" style={ui.sectionTitle}>{t('common.chooseLanguage')}</Text>
          <Text style={[ui.note, { marginTop: 10, marginBottom: 18 }]}>{t('language.welcomeHint')}</Text>
          <LanguageChoices />
        </Card>}
        <PreferenceError />
        <View style={{ marginTop: 20, gap: 12 }}>
          <Button accent label={t('language.start')} testID="start-app" busy={busy} onPress={() => { void completeWelcome(); }} />
          {!!preferenceError && <Button label={t('common.continueWithoutPreference')} testID="preferences-session-continue"
            secondary disabled={busy} onPress={dismissWelcomeForSession} />}
          <Text style={styles.localNote}>{t('language.localOnly')}</Text>
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
  safe: { flex: 1, backgroundColor: c.deep },
  welcomeScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  welcomeContent: { width: '100%', maxWidth: 552 },
  logoCard: { minHeight: 180, padding: 20, backgroundColor: c.background, borderRadius: 28, justifyContent: 'center' },
  welcomeTitle: { fontFamily: f.bold, fontSize: 25, lineHeight: 34, color: c.surface, textAlign: 'center', marginTop: 32 },
  tagline: { fontFamily: f.regular, fontSize: 16, lineHeight: 25, color: c.surface, textAlign: 'center', marginTop: 12 },
  summary: { alignSelf: 'center', backgroundColor: c.soft, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18, marginTop: 26 },
  summaryText: { fontFamily: f.medium, fontSize: 13, lineHeight: 20, color: c.deep, textAlign: 'center' },
  languageToggle: { minHeight: 48, marginTop: 20, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: c.soft, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  languageLabel: { flex: 1, fontFamily: f.medium, color: c.surface, fontSize: 14, lineHeight: 22 },
  localNote: { fontFamily: f.regular, color: c.soft, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  choices: { gap: 10 },
  choice: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1,
    borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selected: { borderColor: c.primary, backgroundColor: c.soft },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: c.primary },
  saving: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
