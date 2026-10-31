import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AlertCircle, ArrowRight, Check, ChevronRight, CircleHelp, WifiOff, type LucideIcon } from 'lucide-react-native';
import { themes } from '../b01/tokens';

export const t = themes.v3;
export const f = { regular: 'Manrope_400Regular', medium: 'Manrope_500Medium', semi: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', extra: 'Manrope_800ExtraBold' };
export const money = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

export function Title({ kicker, title, subtitle, action }: { kicker: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return <View style={ui.titleRow}><View style={{ flex: 1 }}><Text style={ui.kicker}>{kicker}</Text><Text accessibilityRole="header" style={ui.title}>{title}</Text>{subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}</View>{action}</View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export function Button({ label, onPress, secondary = false, icon: Icon = ArrowRight, testID }: { label: string; onPress: () => void; secondary?: boolean; icon?: LucideIcon; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondaryButton, pressed && { opacity: 0.78 }]}><Text style={[ui.buttonText, secondary && { color: t.deep }]}>{label}</Text><Icon size={20} color={secondary ? t.deep : '#fff'} strokeWidth={1.9} /></Pressable>;
}
export function Section({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={ui.section}><Text accessibilityRole="header" style={ui.sectionTitle}>{title}</Text>{action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} style={ui.sectionAction}><Text style={ui.link}>{action}</Text><ChevronRight size={16} color={t.primary} /></Pressable>}</View>;
}
export function Pill({ label, tone = 'green' }: { label: string; tone?: 'green' | 'yellow' | 'neutral' | 'danger' }) {
  return <View style={[ui.pill, { backgroundColor: tone === 'yellow' ? '#FAEAB1' : tone === 'neutral' ? '#F0F0E7' : tone === 'danger' ? '#FBE9E3' : '#E8F1E2' }]}><Text style={[ui.pillText, tone === 'danger' && { color: '#913C2B' }]}>{label}</Text></View>;
}
export function Notice({ title, text, kind = 'info', action, onPress }: { title: string; text: string; kind?: 'info' | 'warning' | 'error' | 'success' | 'offline'; action?: string; onPress?: () => void }) {
  const Icon = kind === 'error' || kind === 'warning' ? AlertCircle : kind === 'success' ? Check : kind === 'offline' ? WifiOff : CircleHelp;
  return <View accessibilityRole={kind === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[ui.notice, { backgroundColor: kind === 'error' ? '#FCEEE8' : kind === 'warning' ? '#FAEDC9' : '#EAF0E0' }]}><Icon size={19} color={kind === 'error' ? '#913C2B' : t.deep} /><View style={{ flex: 1, gap: 5 }}><Text style={[ui.noticeTitle, kind === 'error' && { color: '#913C2B' }]}>{title}</Text><Text style={ui.note}>{text}</Text>{action && <Pressable accessibilityRole="button" onPress={onPress} style={ui.noticeAction}><Text style={ui.link}>{action}</Text><ArrowRight size={15} color={t.primary} /></Pressable>}</View></View>;
}
export function Row({ title, subtitle, icon: Icon, onPress, right }: { title: string; subtitle?: string; icon?: LucideIcon; onPress?: () => void; right?: React.ReactNode }) {
  const content = <>{Icon && <View style={ui.rowIcon}><Icon size={21} color={t.primary} strokeWidth={1.7} /></View>}<View style={{ flex: 1, gap: 5 }}><Text style={ui.rowTitle}>{title}</Text>{subtitle && <Text style={ui.note}>{subtitle}</Text>}</View>{right ?? <ChevronRight size={18} color={t.muted} />}</>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [ui.row, pressed && { opacity: 0.75 }]}>{content}</Pressable> : <View style={ui.row}>{content}</View>;
}
export const ui = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingBottom: 24 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 23 }, kicker: { color: t.muted, fontFamily: f.bold, fontSize: 11, lineHeight: 17, letterSpacing: 1.3 }, title: { fontFamily: f.extra, color: t.ink, fontSize: 29, lineHeight: 36, letterSpacing: -1, marginTop: 9 }, subtitle: { fontFamily: f.regular, color: t.muted, fontSize: 14, lineHeight: 22, marginTop: 9 },
  card: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 18, padding: 19 }, button: { minHeight: 54, paddingHorizontal: 19, paddingVertical: 15, backgroundColor: t.primary, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }, secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#BAC8AE' }, buttonText: { fontFamily: f.bold, fontSize: 16, lineHeight: 23, color: '#fff', flexShrink: 1 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 23, marginBottom: 12, minHeight: 30 }, sectionTitle: { fontFamily: f.bold, color: t.ink, fontSize: 20, letterSpacing: -0.6, flexShrink: 1 }, sectionAction: { minHeight: 44, minWidth: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }, link: { fontFamily: f.bold, fontSize: 13, color: t.primary, lineHeight: 20 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7 }, pillText: { color: t.deep, fontFamily: f.bold, fontSize: 11, lineHeight: 16 }, notice: { borderRadius: 13, padding: 15, gap: 10, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }, noticeTitle: { fontFamily: f.bold, color: t.deep, fontSize: 14, lineHeight: 21 }, noticeAction: { minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start' },
  note: { fontFamily: f.regular, fontSize: 13, lineHeight: 21, color: t.muted }, body: { fontFamily: f.medium, fontSize: 15, lineHeight: 24, color: t.ink }, strong: { fontFamily: f.bold, fontSize: 16, lineHeight: 23, color: t.ink }, number: { fontFamily: f.extra, fontSize: 34, lineHeight: 43, letterSpacing: -1.2, color: t.deep },
  row: { minHeight: 73, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: t.line }, rowIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: t.soft, justifyContent: 'center', alignItems: 'center' }, rowTitle: { fontFamily: f.semi, color: t.ink, fontSize: 15, lineHeight: 22 },
});
