import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle, ArrowLeft, Barcode, CameraOff, Check, Info, MicOff, Package,
  ShoppingBasket, WifiOff, type LucideIcon,
} from 'lucide-react-native';
import { useI18n } from '../../i18n/LanguageProvider';
import { Button, Notice, Title, c, f, ui } from '../components/ui';

export const STATE_KINDS = [
  'empty', 'no_price', 'offline', 'network', 'microphone_denied',
  'camera_denied', 'unknown_barcode', 'duplicate', 'success',
] as const;
export type StateKind = typeof STATE_KINDS[number];
export interface StateAction { label: string; onPress(): void }
export interface StateCardProps {
  kind: StateKind;
  title?: string;
  description?: string;
  primaryAction?: StateAction;
  secondaryAction?: StateAction;
  testID?: string;
  example?: boolean;
}

const icons: Record<StateKind, LucideIcon> = {
  empty: ShoppingBasket, no_price: Info, offline: WifiOff, network: AlertCircle,
  microphone_denied: MicOff, camera_denied: CameraOff, unknown_barcode: Barcode,
  duplicate: Package, success: Check,
};

/** Shared presentation only: callers supply actions and determine whether a state is real. */
export function StateCard({ kind, title, description, primaryAction, secondaryAction, testID, example = false }: StateCardProps) {
  const { t } = useI18n();
  const Icon = icons[kind];
  return <View testID={testID ?? `state-card-${kind}`} style={[styles.card, kind === 'no_price' && styles.neutralCard]}>
    {example && <Text style={[ui.note, { textAlign: 'center', marginBottom: 18 }]}>{t('states.exampleBanner')}</Text>}
    <View style={[styles.iconCircle, kind === 'no_price' && styles.infoCircle]}>
      <Icon size={42} color={c.primary} strokeWidth={2} />
    </View>
    <Text accessibilityRole="header" style={styles.stateTitle}>{title ?? t(`states.${kind}.title`)}</Text>
    <Text style={styles.description}>{description ?? t(`states.${kind}.description`)}</Text>
    {(primaryAction || secondaryAction) && <View style={styles.actions}>
      {primaryAction && <Button accent testID={`state-action-${kind}`} label={primaryAction.label} onPress={primaryAction.onPress} />}
      {secondaryAction && <Button secondary label={secondaryAction.label} onPress={secondaryAction.onPress} />}
    </View>}
  </View>;
}

/** A labelled, interactive visual review. It never reads sensors or persists changes. */
export function StateReviewScreen({ onBack, onShopping, onMenus }: {
  onBack(): void; onShopping(): void; onMenus(): void;
}) {
  const { t } = useI18n();
  const [kind, setKind] = useState<StateKind>('empty');
  const [feedback, setFeedback] = useState<'retry' | 'undo' | null>(null);
  const select = (value: StateKind) => { setKind(value); setFeedback(null); };
  const shopping: StateAction = { label: t('states.shopping'), onPress: onShopping };
  let primaryAction = shopping;
  let secondaryAction: StateAction | undefined;
  if (kind === 'empty') {
    primaryAction = { label: t('states.addManual'), onPress: onShopping };
    secondaryAction = { label: t('states.fromRecipe'), onPress: onMenus };
  } else if (kind === 'microphone_denied') {
    primaryAction = { label: t('states.writeManual'), onPress: onShopping };
  } else if (kind === 'camera_denied' || kind === 'unknown_barcode') {
    primaryAction = { label: t('states.addManual'), onPress: onShopping };
  } else if (kind === 'duplicate') {
    primaryAction = { label: t('states.reviewQuantities'), onPress: onShopping };
  } else if (kind === 'network') {
    primaryAction = { label: t('states.retryExample'), onPress: () => setFeedback('retry') };
    secondaryAction = shopping;
  } else if (kind === 'success') {
    primaryAction = { label: t('states.undoExample'), onPress: () => { setKind('empty'); setFeedback('undo'); } };
    secondaryAction = shopping;
  }

  return <View style={ui.page} testID="state-review-screen">
    <View style={styles.back}><Button secondary icon={ArrowLeft} label={t('states.back')} onPress={onBack} /></View>
    <Title kicker="B03.14" title={t('states.title')} subtitle={t('states.subtitle')} />
    <Notice kind="warning" title={t('states.exampleBanner')} text={t('states.exampleHint')} />
    <View accessibilityRole="radiogroup" accessibilityLabel={t('states.choose')} style={styles.choices}>
      {STATE_KINDS.map(value => <Pressable key={value} testID={`state-choice-${value}`}
        accessibilityRole="radio" accessibilityLabel={t(`states.option.${value}`)}
        accessibilityState={{ checked: kind === value }} aria-checked={kind === value}
        onPress={() => select(value)} style={({ pressed }) => [styles.choice, kind === value && styles.selected, pressed && styles.pressed]}>
        <Text style={[styles.choiceText, kind === value && styles.selectedText]}>{t(`states.option.${value}`)}</Text>
      </Pressable>)}
    </View>
    {feedback && <Notice kind="info" title={t('states.exampleBanner')}
      text={t(feedback === 'retry' ? 'states.retryExampleResult' : 'states.undoExampleResult')} />}
    <StateCard example kind={kind} primaryAction={primaryAction} secondaryAction={secondaryAction} />
  </View>;
}

const styles = StyleSheet.create({
  back: { marginTop: 16 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  choice: { minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 11, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, justifyContent: 'center' },
  selected: { backgroundColor: c.paleYellow, borderColor: c.primary },
  pressed: { opacity: 0.65 },
  choiceText: { fontFamily: f.semi, color: c.muted, fontSize: 13, lineHeight: 21, flexShrink: 1 },
  selectedText: { color: c.deep },
  card: { minHeight: 450, backgroundColor: c.soft, borderRadius: 22, padding: 20, paddingTop: 42, alignItems: 'center' },
  neutralCard: { backgroundColor: c.neutral },
  iconCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: c.paleYellow, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  infoCircle: { backgroundColor: c.soft },
  stateTitle: { fontFamily: f.bold, color: c.deep, fontSize: 21, lineHeight: 29, textAlign: 'center', marginBottom: 16, alignSelf: 'stretch' },
  description: { fontFamily: f.regular, color: c.muted, fontSize: 14, lineHeight: 24, textAlign: 'center', alignSelf: 'stretch' },
  actions: { alignSelf: 'stretch', marginTop: 'auto', paddingTop: 48, gap: 10 },
});
