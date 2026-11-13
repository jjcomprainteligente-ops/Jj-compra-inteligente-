import React, { useEffect, useId, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ArrowRight, Check, ChevronRight, CircleHelp, X, type LucideIcon } from 'lucide-react-native';
import { c, f } from '../theme';
import { useI18n } from '../../i18n/LanguageProvider';
import { useSheetFocus } from '../../components/useSheetFocus';

export { c, f };

export function Button({ label, onPress, secondary, accent, danger, disabled, busy, icon: Icon = ArrowRight, testID }: {
  label: string; onPress: () => void; secondary?: boolean; danger?: boolean;
  accent?: boolean; disabled?: boolean; busy?: boolean; icon?: LucideIcon; testID?: string;
}) {
  const color = danger ? c.danger : secondary || accent ? c.deep : '#fff';
  const pressedBackground = danger ? c.neutral : accent ? c.paleYellow : secondary ? c.soft : c.deep;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled || !!busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, accent && ui.accent, danger && ui.dangerButton,
      disabled || busy ? { opacity: 0.65 } : pressed && { backgroundColor: pressedBackground }]}>
    <Text style={[ui.buttonText, { color }]}>{label}</Text>
    {busy ? <ActivityIndicator color={color} /> : <Icon size={20} color={color} strokeWidth={1.9} />}
  </Pressable>;
}

export function IconButton({ label, icon: Icon, onPress, danger, disabled }: {
  label: string; icon: LucideIcon; onPress: () => void; danger?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [ui.iconButton, disabled ? { opacity: 0.55 } : pressed && { backgroundColor: c.soft, borderRadius: 22 }]}>
    <Icon size={20} color={danger ? c.danger : c.primary} strokeWidth={1.7} />
  </Pressable>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function Title({ kicker, title, subtitle, action }: {
  kicker: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return <View style={ui.titleRow}><View style={{ flex: 1 }}>
    <Text accessibilityRole="header" style={ui.title}>{title}</Text>
    {subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}
  </View>{action}</View>;
}

export function Section({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={ui.section}><Text accessibilityRole="header" style={ui.sectionTitle}>{title}</Text>
    {action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} style={ui.sectionAction}>
      <Text style={ui.link}>{action}</Text><ChevronRight size={16} color={c.primary} />
    </Pressable>}
  </View>;
}

export function Pill({ label, tone = 'green' }: { label: string; tone?: 'green' | 'yellow' | 'neutral' | 'danger' }) {
  return <View style={[ui.pill, { backgroundColor: tone === 'danger' ? c.dangerBg : tone === 'yellow' ? c.paleYellow : tone === 'neutral' ? c.neutral : c.soft }]}>
    <Text style={[ui.pillText, tone === 'danger' && { color: c.danger }]}>{label}</Text>
  </View>;
}

export function Notice({ title, text, kind = 'info', action, onPress }: {
  title: string; text: string; kind?: 'info' | 'warning' | 'error' | 'success'; action?: string; onPress?: () => void;
}) {
  const Icon = kind === 'error' || kind === 'warning' ? AlertCircle : kind === 'success' ? Check : CircleHelp;
  return <View accessibilityRole={kind === 'error' ? 'alert' : undefined} aria-live={kind === 'error' ? 'assertive' : 'polite'}
    style={[ui.notice, { backgroundColor: kind === 'error' ? c.dangerBg : kind === 'warning' ? '#FAEDC9' : c.soft }]}>
    <Icon size={19} color={kind === 'error' ? c.danger : c.deep} />
    <View style={{ flex: 1, gap: 5 }}><Text style={[ui.noticeTitle, kind === 'error' && { color: c.danger }]}>{title}</Text>
      <Text style={ui.note}>{text}</Text>{action && <Pressable accessibilityRole="button" onPress={onPress} style={ui.noticeAction}>
        <Text style={ui.link}>{action}</Text><ArrowRight size={15} color={c.primary} />
      </Pressable>}
    </View>
  </View>;
}

export function Row({ title, subtitle, icon: Icon, onPress, right, testID }: {
  title: string; subtitle?: string; icon?: LucideIcon; onPress?: () => void; right?: React.ReactNode; testID?: string;
}) {
  const children = <>{Icon && <View style={ui.rowIcon}><Icon size={21} color={c.primary} strokeWidth={1.7} /></View>}
    <View style={{ flex: 1, gap: 5 }}><Text style={ui.rowTitle}>{title}</Text>{subtitle && <Text style={ui.note}>{subtitle}</Text>}</View>
    {right ?? <ChevronRight size={18} color={c.muted} />}</>;
  return onPress ? <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={ui.row}>{children}</Pressable> : <View testID={testID} style={ui.row}>{children}</View>;
}

export function Field({ label, hint, onFocus, onBlur, 'aria-describedby': describedBy, ...props }: TextInputProps & {
  label: string; hint?: string; 'aria-describedby'?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hintId = useId();
  const descriptionIds = [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  return <View style={ui.field}><Text style={ui.fieldLabel}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={c.muted}
      accessibilityHint={props.accessibilityHint ?? hint}
      aria-describedby={Platform.OS === 'web' ? descriptionIds : undefined}
      onFocus={event => { setFocused(true); onFocus?.(event); }}
      onBlur={event => { setFocused(false); onBlur?.(event); }}
      style={[ui.input, focused && { borderColor: c.primary, borderWidth: 2 }, props.multiline && { minHeight: 84, textAlignVertical: 'top' }, props.style]} />
    {hint && <Text nativeID={hintId} style={ui.note}>{hint}</Text>}
  </View>;
}

export function Sheet({ visible, title, subtitle, children, footer, onClose, busy, testID }: {
  visible: boolean; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode;
  onClose: () => void; busy?: boolean; testID?: string;
}) {
  const { t } = useI18n();
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [scrollWholePanel, setScrollWholePanel] = useState(false);
  const hasFooter = !!footer;
  useEffect(() => {
    if (!visible) {
      setScrollWholePanel(false);
      setHeaderHeight(0);
      setFooterHeight(0);
      return;
    }
    // Keep the approved fixed header/actions whenever there is readable body
    // space. Short windows or enlarged text use one scroll for the entire panel.
    // Latching until close avoids oscillation as the new layout is measured.
    const availableHeight = Math.max(0, height * 0.92 - insets.bottom);
    const minimumBodyHeight = 144 * Math.max(1, fontScale);
    if (headerHeight > 0 && (!hasFooter || footerHeight > 0) &&
      headerHeight + (hasFooter ? footerHeight : 0) + minimumBodyHeight > availableHeight) {
      setScrollWholePanel(true);
    }
  }, [visible, height, fontScale, insets.bottom, headerHeight, footerHeight, hasFooter]);
  const { dialogRef, onDismiss } = useSheetFocus<React.ElementRef<typeof SafeAreaView>>(visible, `${title}:${scrollWholePanel}`);
  const header = <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)} style={ui.sheetTop}>
    <View style={ui.handle} /><View style={ui.sheetHeading}>
      <View style={{ flex: 1 }}><Text accessibilityRole="header" style={ui.sheetTitle}>{title}</Text>
        {subtitle && <Text style={[ui.note, { marginTop: 9 }]}>{subtitle}</Text>}
      </View><IconButton label={t('common.close')} icon={X} onPress={onClose} disabled={busy} />
    </View>
  </View>;
  const actions = footer && <View onLayout={event => setFooterHeight(event.nativeEvent.layout.height)} style={ui.sheetFooter}>{footer}</View>;
  return <Modal visible={visible} transparent animationType="none" onDismiss={onDismiss} onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView style={ui.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
        style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => !busy}
        onResponderRelease={() => { if (!busy) onClose(); }} />
      <SafeAreaView ref={dialogRef} edges={['bottom']} tabIndex={Platform.OS === 'web' ? -1 : undefined}
        testID={testID ?? 'app-sheet'} accessibilityViewIsModal role="dialog" aria-label={title} style={ui.sheet}>
        {scrollWholePanel ? <ScrollView keyboardShouldPersistTaps="handled">
          {header}<View style={ui.sheetBody}>{children}</View>{actions}
        </ScrollView> : <>
          {header}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.sheetBody}>{children}</ScrollView>
          {actions}
        </>}
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

export const ui = StyleSheet.create({
  page: { paddingHorizontal: 18, paddingBottom: 24 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, marginBottom: 18 },
  kicker: { color: c.muted, fontFamily: f.bold, fontSize: 11, lineHeight: 17, letterSpacing: 1.2 }, title: { fontFamily: f.extra, color: c.ink, fontSize: 26, lineHeight: 34, letterSpacing: -0.7 },
  subtitle: { fontFamily: f.regular, color: c.muted, fontSize: 14, lineHeight: 22, marginTop: 9 }, card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 16 },
  button: { minHeight: 54, paddingHorizontal: 19, paddingVertical: 15, backgroundColor: c.primary, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' },
  secondary: { backgroundColor: c.neutral, borderWidth: 1, borderColor: c.line }, accent: { backgroundColor: c.accent }, dangerButton: { backgroundColor: '#FBE9E3', borderWidth: 1, borderColor: '#D9B9AA' }, buttonText: { fontFamily: f.bold, fontSize: 16, lineHeight: 23, flexShrink: 1 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 23, marginBottom: 12 },
  sectionTitle: { fontFamily: f.bold, color: c.ink, fontSize: 20, letterSpacing: -0.6, flexShrink: 1 }, sectionAction: { minHeight: 44, minWidth: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  link: { fontFamily: f.bold, fontSize: 13, color: c.primary, lineHeight: 20 }, pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, maxWidth: '100%' }, pillText: { color: c.deep, fontFamily: f.bold, fontSize: 12, lineHeight: 18 },
  notice: { borderRadius: 13, padding: 15, gap: 10, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }, noticeTitle: { fontFamily: f.bold, color: c.deep, fontSize: 14, lineHeight: 21 }, noticeAction: { minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start' },
  note: { fontFamily: f.regular, fontSize: 13, lineHeight: 21, color: c.muted }, body: { fontFamily: f.medium, fontSize: 15, lineHeight: 24, color: c.ink }, strong: { fontFamily: f.bold, fontSize: 16, lineHeight: 23, color: c.ink }, number: { fontFamily: f.extra, fontSize: 34, lineHeight: 43, letterSpacing: -1.2, color: c.deep },
  row: { minHeight: 64, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: c.line }, rowIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: c.soft, justifyContent: 'center', alignItems: 'center' }, rowTitle: { fontFamily: f.semi, color: c.ink, fontSize: 15, lineHeight: 22 },
  field: { marginBottom: 21, gap: 9 }, fieldLabel: { fontFamily: f.bold, color: c.ink, fontSize: 13, lineHeight: 20 }, input: { minHeight: 54, borderWidth: 1, borderColor: c.muted, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, backgroundColor: '#fff', fontFamily: f.medium, color: c.ink, fontSize: 16, lineHeight: 24, outlineWidth: 0 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,39,26,0.38)', justifyContent: 'flex-end', alignItems: 'center' }, sheet: { width: '100%', maxWidth: 600, maxHeight: '92%', backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', outlineWidth: 0 }, sheetTop: { paddingTop: 9, paddingHorizontal: 24, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: c.line },
  handle: { width: 35, height: 4, backgroundColor: '#BFC9B7', borderRadius: 3, alignSelf: 'center', marginBottom: 16 }, sheetHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, sheetTitle: { fontFamily: f.extra, fontSize: 24, lineHeight: 31, letterSpacing: -0.8, color: c.ink }, sheetBody: { paddingHorizontal: 24, paddingTop: 21, paddingBottom: 28 }, sheetFooter: { borderTopWidth: 1, borderTopColor: c.line, padding: 16, paddingHorizontal: 24, gap: 9 },
});
