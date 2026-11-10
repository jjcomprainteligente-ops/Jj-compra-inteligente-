import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { AlertCircle, ArrowUpRight, Check, X, type LucideIcon } from 'lucide-react-native';
import { colors as c, fonts as f } from '../theme';
import { useI18n } from '../i18n/LanguageProvider';
import { useSheetFocus } from './useSheetFocus';

export function Button({ label, onPress, icon: Icon, variant = 'primary', disabled, loading, compact, testID }: {
  label: string; onPress: () => void; icon?: LucideIcon; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean; loading?: boolean; compact?: boolean; testID?: string;
}) {
  const primary = variant === 'primary';
  const color = primary ? '#fff' : variant === 'danger' ? c.danger : c.green;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || !!loading }} disabled={disabled || loading} onPress={onPress}
    style={({ pressed }) => [s.button, compact && s.compact, primary ? s.primary : variant === 'secondary' ? s.secondary : variant === 'danger' ? s.danger : s.ghost, (disabled || loading) && s.disabled, pressed && s.pressed]}>
    {loading ? <ActivityIndicator color={color} size="small" /> : Icon && <Icon size={18} color={color} strokeWidth={1.8} />}
    <Text style={[s.buttonText, { color }]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ label, icon: Icon, onPress, danger, disabled }: { label: string; icon: LucideIcon; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={4} style={({ pressed }) => [s.iconButton, pressed && s.pressed, disabled && s.disabled]}>
    <Icon size={19} color={danger ? c.danger : c.muted} strokeWidth={1.7} />
  </Pressable>;
}

export function Field({ label, hint, icon: Icon, onFocus, onBlur, 'aria-describedby': describedBy, ...props }: TextInputProps & {
  label: string; hint?: string; icon?: LucideIcon; 'aria-describedby'?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  const hintId = React.useId();
  const descriptionIds = [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputWrap, focused && s.inputFocused, props.editable === false && { opacity: 0.6 }]}>
      {Icon && <Icon size={18} color={focused ? c.green : c.muted} />}
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#9AA39A"
        accessibilityHint={props.accessibilityHint ?? hint}
        aria-describedby={Platform.OS === 'web' ? descriptionIds : undefined}
        onFocus={event => { setFocused(true); onFocus?.(event); }}
        onBlur={event => { setFocused(false); onBlur?.(event); }} style={[s.input, props.style]} />
    </View>
    {hint && <Text nativeID={hintId} style={s.hint}>{hint}</Text>}
  </View>;
}

export function ErrorBanner({ message, values }: { message: string; values?: Record<string, string | number> }) {
  const { t, translateError } = useI18n();
  const text = message.startsWith('legacy.') ? t(message, values) : translateError(message);
  return <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.error}>
    <AlertCircle color={c.danger} size={19} /><Text style={s.errorText}>{text}</Text>
  </View>;
}

export function Sheet({ visible, title, subtitle, children, onClose, busy = false }: { visible: boolean; title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; busy?: boolean }) {
  const { t } = useI18n();
  const { dialogRef, onDismiss } = useSheetFocus<React.ElementRef<typeof View>>(visible, title);
  return <Modal visible={visible} transparent animationType="fade" onDismiss={onDismiss} onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView style={s.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
        style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => !busy}
        onResponderRelease={() => { if (!busy) onClose(); }} />
      <View ref={dialogRef} style={s.sheet} accessibilityViewIsModal role="dialog" aria-label={title}
        tabIndex={Platform.OS === 'web' ? -1 : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetContent}>
          <View style={s.sheetTop}><View style={{ flex: 1 }}><Text accessibilityRole="header" style={s.sheetTitle}>{title}</Text></View><IconButton label={t('legacy.closeWindow')} icon={X} onPress={onClose} disabled={busy} /></View>
          {subtitle && <Text style={s.sheetSubtitle}>{subtitle}</Text>}
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export function BestBadge({ tie = false }: { tie?: boolean }) {
  const { t } = useI18n();
  return <View style={s.badge}><Check size={12} strokeWidth={2.5} color={c.green} /><Text style={s.badgeText}>{t(tie ? 'legacy.bestTotalTie' : 'legacy.bestTotal')}</Text></View>;
}

export function Eyebrow({ children }: { children: string }) { return <Text style={s.eyebrow}>{children}</Text>; }

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.textLink}><Text style={s.textLinkText}>{label}</Text><ArrowUpRight size={16} color={c.green} /></Pressable>;
}

const s = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1 },
  compact: { minHeight: 44, paddingHorizontal: 17, paddingVertical: 10, borderRadius: 12 },
  primary: { backgroundColor: c.green, borderColor: c.green }, secondary: { backgroundColor: c.paper, borderColor: c.line }, danger: { backgroundColor: '#FCF0ED', borderColor: '#F1D5CC' }, ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  buttonText: { fontFamily: f.bold, fontSize: 14, flexShrink: 1, textAlign: 'center' }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.72 },
  iconButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  field: { gap: 9, marginBottom: 22 }, label: { fontFamily: f.bold, color: c.ink, fontSize: 13 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.paper, borderRadius: 13, borderColor: c.line, borderWidth: 1, paddingHorizontal: 15, minHeight: 56 },
  inputFocused: { borderColor: c.green, backgroundColor: '#FDFEFB' }, input: { fontFamily: f.medium, color: c.ink, fontSize: 15, flex: 1, paddingVertical: 15, minWidth: 0, outlineWidth: 0 },
  hint: { fontFamily: f.regular, fontSize: 12, lineHeight: 19, color: c.muted },
  error: { backgroundColor: '#FBECE7', borderWidth: 1, borderColor: '#F2D4CA', padding: 14, borderRadius: 12, flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'flex-start' },
  errorText: { flex: 1, color: c.danger, fontFamily: f.medium, fontSize: 13, lineHeight: 21 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(19, 37, 29, 0.38)', justifyContent: 'center', alignItems: 'center', padding: 22 },
  sheet: { backgroundColor: c.background, width: '100%', maxWidth: 470, maxHeight: '85%', borderRadius: 24, overflow: 'hidden', outlineWidth: 0 },
  sheetContent: { padding: 25 }, sheetTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }, sheetTitle: { fontFamily: f.extra, fontSize: 23, letterSpacing: -0.7, color: c.ink }, sheetSubtitle: { color: c.muted, fontFamily: f.regular, fontSize: 14, lineHeight: 22, marginBottom: 26 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 7, backgroundColor: '#E6EEDC', alignSelf: 'flex-start', flexShrink: 1 }, badgeText: { fontFamily: f.bold, fontSize: 10, color: c.green, flexShrink: 1 },
  eyebrow: { fontFamily: f.bold, fontSize: 10, letterSpacing: 1.8, color: c.muted }, textLink: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 44 }, textLinkText: { fontFamily: f.bold, fontSize: 13, color: c.green },
});
