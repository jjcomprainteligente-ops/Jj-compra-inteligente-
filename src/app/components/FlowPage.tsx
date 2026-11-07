import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChartNoAxesColumnIncreasing, Home, ShoppingCart, Utensils } from 'lucide-react-native';
import { useI18n } from '../../i18n/LanguageProvider';
import { c, f } from '../theme';

export type FlowDestination = 'home' | 'list' | 'savings' | 'menus';
const tabs = [
  { key: 'home', label: 'app.tabHome', icon: Home },
  { key: 'list', label: 'app.tabList', icon: ShoppingCart },
  { key: 'savings', label: 'app.tabSavings', icon: ChartNoAxesColumnIncreasing },
  { key: 'menus', label: 'app.tabMenus', icon: Utensils },
] as const;

export interface FlowPageProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose(): void;
  onNavigateMain(destination: FlowDestination): void;
  busy?: boolean;
  testID?: string;
}

/** A full-height local flow, with its draft owned by the caller until confirmation. */
export function FlowPage({ visible, title, subtitle, children, footer, onClose, onNavigateMain, busy = false, testID }: FlowPageProps) {
  const { t } = useI18n();
  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  useEffect(() => { if (visible) scroll.current?.scrollTo({ y: 0, animated: false }); }, [title, visible]);
  return <Modal visible={visible} transparent={false} animationType="none" onRequestClose={() => { if (!busy) onClose(); }}>
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <KeyboardAvoidingView testID={testID ?? 'flow-page'} accessibilityViewIsModal role="dialog" aria-label={title}
        style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('flow.back')} accessibilityState={{ disabled: busy }}
            testID="flow-back" disabled={busy} onPress={onClose} style={[styles.back, busy && { opacity: .6 }]}>
            <ArrowLeft size={22} color={c.surface} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>{title}</Text>
        </View>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
        <SafeAreaView edges={['bottom']} style={styles.tabsSafe}>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {tabs.map(tab => <Pressable key={tab.key} testID={`flow-tab-${tab.key}`} accessibilityRole="tab"
              accessibilityLabel={t(tab.label)} accessibilityState={{ selected: tab.key === 'menus', disabled: busy }}
              aria-selected={tab.key === 'menus'} disabled={busy} onPress={() => onNavigateMain(tab.key)}
              style={[styles.tab, tab.key === 'menus' && styles.selected, busy && { opacity: .6 }]}>
              <tab.icon size={22} color={tab.key === 'menus' ? c.primary : c.muted} strokeWidth={tab.key === 'menus' ? 2 : 1.6} />
              <Text style={[styles.tabLabel, tab.key === 'menus' && styles.selectedLabel]}>{t(tab.label)}</Text>
            </Pressable>)}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.deep },
  page: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: c.surface },
  header: { backgroundColor: c.deep, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: c.surface, fontFamily: f.bold, fontSize: 19, lineHeight: 28, paddingRight: 14 },
  body: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 24 },
  subtitle: { color: c.muted, fontFamily: f.regular, fontSize: 13, lineHeight: 21, marginBottom: 18 },
  footer: { paddingHorizontal: 18, paddingVertical: 12, gap: 9, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line },
  tabsSafe: { backgroundColor: c.surface },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, paddingHorizontal: 8, paddingVertical: 8 },
  tab: { flex: 1, minHeight: 58, borderRadius: 15, paddingHorizontal: 3, paddingVertical: 5, marginHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 4 },
  selected: { backgroundColor: c.paleYellow },
  tabLabel: { fontFamily: f.semi, fontSize: 12, lineHeight: 18, color: c.muted, textAlign: 'center' },
  selectedLabel: { color: c.primary, fontFamily: f.extra },
});
