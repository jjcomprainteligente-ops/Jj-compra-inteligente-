import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ArrowRight, ArrowUpRight, Check, ChevronRight, CircleHelp, House, ListChecks, Mic, Plus, Settings2, ShieldCheck, Sparkles, Sprout, Utensils, Wallet, X, type LucideIcon } from 'lucide-react-native';
import { Brand } from './Brand';
import { Ingredients, MealArt } from './Illustrations';
import { themes, type Theme, type Variant } from './tokens';

type Screen = 'home' | 'empty' | 'list';
const font = { regular: 'Manrope_400Regular', medium: 'Manrope_500Medium', semi: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', extra: 'Manrope_800ExtraBold' };
const demoItems = [
  { name: 'Plátano de Canarias', quantity: '6 ud', done: false, category: 'Fruta y verdura' },
  { name: 'Tomates', quantity: '500 g', done: false, category: 'Fruta y verdura' },
  { name: 'Leche semidesnatada', quantity: '2 L', done: false, category: 'Despensa y frescos' },
  { name: 'Arroz redondo', quantity: '1 kg', done: false, category: 'Despensa y frescos' },
  { name: 'Huevos', quantity: '6 ud', done: true, category: 'Ya en la cesta' },
  { name: 'Pan integral', quantity: '1 ud', done: true, category: 'Ya en la cesta' },
];

function initialPreview(): { variant: Variant; screen: Screen } {
  if (Platform.OS !== 'web') return { variant: 'v1', screen: 'home' };
  const params = new URLSearchParams(window.location.search);
  const v = params.get('variant'); const s = params.get('screen');
  return { variant: v === 'v2' || v === 'v3' ? v : 'v1', screen: s === 'empty' || s === 'list' ? s : 'home' };
}

export default function App() {
  const [loaded, error] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  return <SafeAreaProvider>{!loaded && !error ? <View style={s.loader}><ActivityIndicator color="#167347" /></View> : <Prototype />}</SafeAreaProvider>;
}

function Prototype() {
  const [initial] = useState(initialPreview);
  const [variant, setVariant] = useState<Variant>(initial.variant);
  const [screen, setScreen] = useState<Screen>(initial.screen);
  const [notice, setNotice] = useState('');
  const [chooser, setChooser] = useState(false);
  const t = themes[variant];
  const night = variant === 'v2';
  const market = variant === 'v3';
  const small = useWindowDimensions().height <= 700;
  const demoNotice = () => setNotice('Esta es una propuesta visual de B01. La lista, el presupuesto y los menús son ejemplos; no se guardan ni se consultan precios.');
  const go = (next: Screen) => { setScreen(next); };
  return <View style={[s.root, { backgroundColor: t.background }]}>
    <StatusBar style={night ? 'light' : 'dark'} />
    <SafeAreaView edges={['top']} style={{ backgroundColor: night ? t.deep : t.background }}>
      <View style={[s.topbar, small && { paddingTop: 10, paddingBottom: 10 }]}>
        <Brand variant={variant} inverse={night} />
        <Pressable accessibilityRole="button" accessibilityLabel="Ver las tres propuestas visuales" onPress={() => setChooser(true)} style={[s.avatar, { backgroundColor: night ? '#2C5743' : t.soft, borderColor: night ? '#4F755F' : t.line }]}><Text style={[s.avatarText, { color: night ? '#fff' : t.deep }]}>JJ</Text></Pressable>
      </View>
    </SafeAreaView>
    <View style={[s.demoStrip, { backgroundColor: night ? '#214D38' : market ? '#F6E8BC' : '#E7F0E5' }]}><View style={[s.demoDot, { backgroundColor: night ? t.accent : t.primary }]} /><Text style={[s.demoLabel, { color: night ? '#E9F8EC' : t.deep }]}>Propuesta visual · Datos de ejemplo</Text></View>
    <ScrollView key={`${variant}-${screen}`} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      {screen === 'home' ? <>
        <View style={[s.homeIntro, { backgroundColor: night ? t.deep : t.background }, small && { paddingTop: 18, paddingBottom: 20 }, night && { paddingBottom: 34 }]}>
          <View style={s.introKicker}><Text style={[s.eyebrow, { color: night ? t.accent : t.muted }]}>TU SEMANA, MÁS SENCILLA</Text>{market && <View style={[s.placePill, { backgroundColor: t.accent }]}><Text style={[s.placeText, { color: t.accentInk }]}>Tenerife</Text></View>}</View>
          <Text accessibilityRole="header" style={[s.headline, { color: night ? '#fff' : t.ink }, night && s.editorialTitle, market && { fontSize: 32, lineHeight: 39 }, small && { fontSize: 28, lineHeight: 34 }]}>Tu compra,{night ? '\n' : ' '}{!night && !small ? '\n' : ''}bajo control<Text style={{ color: night ? t.accent : market ? t.primary : '#167347' }}>.</Text></Text>
          <Text style={[s.introText, { color: night ? '#DCEBDD' : t.muted }]}>Planifica con calma. Compra con criterio.</Text>
          {night && <View style={{ marginTop: 20 }}><Primary label="Continuar mi compra" onPress={() => go('list')} theme={t} mint testID="main-cta" /></View>}
        </View>
        <View style={[s.content, night && { marginTop: -14 }]}>
          {!night && <QuickEntry theme={t} onPress={demoNotice} />}
          {!night && small && <View style={{ marginTop: 16 }}><Primary label="Continuar mi compra" onPress={() => go('list')} theme={t} testID="main-cta" /></View>}
          <Budget theme={t} onPress={demoNotice} small={small} />
          {!night && !small && <View style={{ marginTop: 16 }}><Primary label="Continuar mi compra" onPress={() => go('list')} theme={t} testID="main-cta" /></View>}
          <View style={[s.sectionHeading, { marginTop: night ? 23 : 18 }]}><Text style={[s.sectionTitle, { color: t.ink }]}>Mi compra semanal</Text><Pressable accessibilityRole="button" accessibilityLabel="Ver la lista de ejemplo" onPress={() => go('list')} style={s.textAction}><Text style={[s.textActionLabel, { color: t.primary }]}>Ver lista</Text><ChevronRight size={16} color={t.primary} /></Pressable></View>
          <View style={[s.listSummary, { backgroundColor: t.surface, borderColor: t.line }, market && { borderRadius: 12, borderBottomWidth: 3 }]}>
            <View style={[s.summaryIcon, { backgroundColor: t.soft }]}><ListChecks size={22} color={t.primary} strokeWidth={1.7} /></View>
            <View style={{ flex: 1 }}><Text style={[s.summaryTitle, { color: t.ink }]}>6 productos · 2 en la cesta</Text><Text style={[s.bodySmall, { color: t.muted, marginTop: 4 }]}>Te quedan 4 por comprar</Text></View>
            <View style={[s.progressRing, { borderColor: t.line, borderTopColor: t.primary, borderRightColor: t.primary }]}><Text style={[s.progressText, { color: t.primary }]}>2/6</Text></View>
          </View>
          {night && <View style={{ marginTop: 17 }}><QuickEntry theme={t} onPress={demoNotice} /></View>}
          <View style={[s.sectionHeading, { marginTop: 25 }]}><Text style={[s.sectionTitle, { color: t.ink }]}>Una idea para hoy</Text><View style={s.smallLabel}><Utensils size={14} color={t.muted} /><Text style={[s.bodySmall, { color: t.muted }]}>Menús</Text></View></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver ejemplo de menú, arroz con verduras" onPress={demoNotice} style={[s.mealCard, { backgroundColor: market ? '#F5E9C6' : t.soft, borderColor: t.line }, market && { borderRadius: 12 }]}>
            <View style={{ flex: 1, paddingVertical: 6 }}><Text style={[s.mealTitle, { color: t.deep }]}>Arroz con verduras</Text><Text style={[s.bodySmall, { color: t.muted, marginTop: 7 }]}>25 min · 2 personas</Text><View style={s.mealLink}><Text style={[s.mealLinkText, { color: t.deep }]}>Cocina algo sencillo</Text><ArrowUpRight size={14} color={t.deep} /></View></View><MealArt variant={variant} size={94} />
          </Pressable>
          <View style={s.localNote}><ShieldCheck size={15} color={t.muted} /><Text style={[s.localText, { color: t.muted }]}>Tu lista, también sin conexión.</Text></View>
        </View>
      </> : <View style={s.content}>
        <View style={[s.listHeading, small && { marginTop: 20 }]}><View style={{ flex: 1 }}><Text style={[s.eyebrow, { color: t.muted }]}>MI COMPRA</Text><Text accessibilityRole="header" style={[s.listTitle, { color: t.ink }, night && s.editorialList]}>La compra{market ? '\n' : ' '}de la semana<Text style={{ color: t.primary }}>.</Text></Text></View><Pressable accessibilityRole="button" accessibilityLabel="Opciones de la lista de ejemplo" onPress={demoNotice} style={[s.optionsButton, { borderColor: t.line, backgroundColor: t.surface }]}><Settings2 color={t.primary} size={20} /></Pressable></View>
        {screen === 'empty' ? <>
          <View style={[s.emptyBudget, { borderColor: t.line, backgroundColor: t.surface }]}><Wallet color={t.primary} size={19} /><Text style={[s.bodySmall, { color: t.muted, flex: 1 }]}>Presupuesto de ejemplo</Text><Text style={[s.emptyBudgetValue, { color: t.ink }]}>60 €</Text></View>
          <View style={[s.emptyState, small && { paddingTop: 16, gap: 12 }]}><View style={[s.artField, small && { height: 125, width: 125 }, { backgroundColor: t.soft }, market && { backgroundColor: '#FAEDC9', borderRadius: 35 }]}><Ingredients variant={variant} size={small ? 120 : 160} /></View><Text style={[s.emptyTitle, { color: t.ink }, night && s.editorialEmpty]}>Toda buena compra{ '\n' }empieza con una lista.</Text><Text style={[s.emptyDescription, { color: t.muted }]}>Empieza por lo que te falta en casa.{ '\n' }Nosotros te ayudamos a poner orden.</Text><Text style={[s.emptyHint, { color: t.muted }]}>Vista de ejemplo · Sin registro</Text></View>
          <View style={[s.emptyTip, { borderColor: t.line }]}><Sprout size={20} color={t.primary} /><Text style={[s.tipText, { color: t.muted }]}>Un pequeño hábito para una semana más organizada.</Text></View>
        </> : <>
          <View style={[s.progressCard, { backgroundColor: t.soft }]}><View style={s.progressTop}><Text style={[s.progressTitle, { color: t.deep }]}>2 de 6 productos en la cesta</Text><Text style={[s.bodySmall, { color: t.muted }]}>Quedan 4</Text></View><View style={[s.progressTrack, { backgroundColor: t.line }]}><View style={[s.progressFill, { backgroundColor: t.primary }]} /></View></View>
          <View style={[s.listBudget, { borderColor: t.line, backgroundColor: t.surface }]}><View><Text style={[s.bodySmall, { color: t.muted }]}>Presupuesto de ejemplo</Text><Text style={[s.listBudgetAmount, { color: t.ink }]}>60 €</Text></View><View style={{ alignItems: 'flex-end', gap: 6 }}><Text style={[s.noPriceTitle, { color: t.ink }]}>Total pendiente</Text><Text style={[s.bodySmall, { color: t.muted }]}>6 productos sin precio</Text></View></View>
          {['Fruta y verdura', 'Despensa y frescos', 'Ya en la cesta'].map(category => <View key={category} style={{ marginTop: 23 }}><Text style={[s.category, { color: t.muted }]}>{category}</Text>{demoItems.filter(item => item.category === category).map(item => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.quantity}, ${item.done ? 'en la cesta' : 'pendiente'}, sin precio. Ejemplo visual`} onPress={demoNotice} style={[s.item, { borderColor: t.line }]}><View style={[s.checkbox, { borderColor: item.done ? t.primary : '#6A7A6A', backgroundColor: item.done ? t.primary : t.surface }]}>{item.done && <Check size={16} color="#fff" strokeWidth={2.5} />}</View><View style={{ flex: 1 }}><Text style={[s.itemName, { color: item.done ? t.muted : t.ink }, item.done && { textDecorationLine: 'line-through' }]}>{item.name}</Text><Text style={[s.itemQuantity, { color: t.muted }]}>{item.quantity}</Text></View><Text style={[s.noPrice, { color: t.muted }]}>Sin precio</Text></Pressable>)}</View>)}
          <View style={[s.priceNotice, { backgroundColor: t.soft }]}><CircleHelp color={t.muted} size={17} /><Text style={[s.priceNoticeText, { color: t.muted }]}>Añade precios para conocer el total. El presupuesto es un límite, no el gasto.</Text></View>
        </>}
      </View>}
    </ScrollView>
    {screen !== 'home' && <View style={[s.fixedAction, { backgroundColor: t.background }]}><Primary label={screen === 'empty' ? 'Añadir primer producto' : 'Añadir producto'} icon={Plus} theme={t} onPress={screen === 'empty' ? () => go('list') : demoNotice} testID={screen === 'empty' ? 'empty-cta' : 'list-cta'} /></View>}
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: t.surface }}>
      <View style={[s.tabs, { backgroundColor: t.surface, borderTopColor: t.line }]}>
        {([{ key: 'home', label: 'Inicio', icon: House }, { key: 'list', label: 'Mi compra', icon: ListChecks }, { key: 'savings', label: 'Ahorro', icon: Wallet }, { key: 'menus', label: 'Menús', icon: Utensils }] as const).map(({ key, label, icon: Icon }) => {
          const active = key === 'home' ? screen === 'home' : key === 'list' && screen !== 'home';
          return <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={() => key === 'home' || key === 'list' ? go(key) : demoNotice()} style={s.tab}><View style={[s.tabIcon, active && { backgroundColor: market ? '#F9EBB8' : t.soft }]}><Icon size={21} color={active ? t.primary : t.muted} strokeWidth={active ? 2.1 : 1.6} /></View><Text style={[s.tabText, { color: active ? t.primary : t.muted, fontFamily: active ? font.bold : font.medium }]}>{label}</Text>{active && <View style={[s.tabDot, { backgroundColor: t.primary }]} />}</Pressable>;
        })}
      </View>
    </SafeAreaView>
    <Modal visible={!!notice || chooser} transparent animationType="fade" onRequestClose={() => { setNotice(''); setChooser(false); }}>
      <View style={s.overlay}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar información" style={StyleSheet.absoluteFill} onPress={() => { setNotice(''); setChooser(false); }} /><View accessibilityViewIsModal style={[s.modal, { backgroundColor: t.background }]}><View style={s.modalHeading}><Text style={[s.modalTitle, { color: t.ink }]}>{chooser ? 'Explora las tres propuestas' : 'Estás viendo un prototipo'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => { setNotice(''); setChooser(false); }} style={s.modalClose}><X size={22} color={t.ink} /></Pressable></View>{chooser ? <View style={{ gap: 12 }}>{(['v1', 'v2', 'v3'] as const).map(v => <Pressable key={v} accessibilityRole="button" accessibilityLabel={themes[v].name} onPress={() => { setVariant(v); setChooser(false); }} style={[s.variantOption, { borderColor: t.line, backgroundColor: t.surface }]}><Brand variant={v} compact /><Text style={[s.variantName, { color: t.ink }]}>{themes[v].name.replace('Verde ', '')}</Text></Pressable>)}<Pressable accessibilityRole="button" onPress={() => { setScreen('empty'); setChooser(false); }} style={s.previewEmpty}><Text style={[s.previewEmptyText, { color: t.primary }]}>Ver la lista vacía</Text><ArrowRight size={18} color={t.primary} /></Pressable><Text style={[s.modalText, { color: t.muted }]}>Cambiar aquí sirve para explorar, no aprueba una dirección visual.</Text></View> : <><Text style={[s.modalText, { color: t.muted }]}>{notice}</Text><View style={{ marginTop: 22 }}><Primary label="Entendido" theme={t} onPress={() => setNotice('')} /></View></>}</View></View>
    </Modal>
  </View>;
}

function Primary({ label, onPress, theme: t, mint = false, icon: Icon = ArrowRight, testID }: { label: string; onPress: () => void; theme: Theme; mint?: boolean; icon?: LucideIcon; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.primary, { backgroundColor: mint ? t.accent : t.primary, borderRadius: t.id === 'v3' ? 12 : 16, opacity: pressed ? 0.8 : 1 }]}><Text style={[s.primaryLabel, { color: mint ? t.accentInk : t.onPrimary }]}>{label}</Text><Icon size={20} color={mint ? t.accentInk : t.onPrimary} strokeWidth={1.9} /></Pressable>;
}

function QuickEntry({ theme: t, onPress }: { theme: Theme; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Añadir productos por texto o voz, vista de ejemplo" onPress={onPress} style={[s.quickEntry, { borderColor: t.line, backgroundColor: t.surface }]}><Plus size={20} color={t.primary} /><Text style={[s.quickText, { color: t.muted }]}>¿Qué necesitas comprar?</Text><View style={[s.micField, { backgroundColor: t.soft }]}><Mic size={18} color={t.primary} /></View></Pressable>;
}

function Budget({ theme: t, onPress, small }: { theme: Theme; onPress: () => void; small: boolean }) {
  const market = t.id === 'v3';
  return <View style={[s.budgetCard, { backgroundColor: market ? t.accent : t.surface, borderColor: market ? '#E5BC3D' : t.line, borderRadius: market ? 14 : 22 }, t.id !== 'v2' && { marginTop: 18 }, small && { paddingVertical: 17 }]}><View style={s.budgetHeading}><View style={s.smallLabel}><Wallet size={17} color={t.deep} /><Text style={[s.budgetLabel, { color: t.deep }]}>Tu presupuesto semanal</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Información del presupuesto de ejemplo" onPress={onPress} style={s.budgetHelp}><CircleHelp size={17} color={t.muted} /></Pressable></View><View style={s.budgetAmountRow}><Text style={[s.budgetAmount, { color: t.deep }, t.id === 'v2' && { fontFamily: Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'web' ? 'Georgia' : 'serif', fontWeight: '400' }]}>60<Text style={s.euro}> €</Text></Text><View style={[s.budgetSample, { backgroundColor: market ? '#FFEDA6' : t.soft }]}><Text style={[s.budgetSampleText, { color: t.deep }]}>Presupuesto de ejemplo</Text></View></View><View style={[s.budgetFooter, { borderTopColor: market ? '#D6AF33' : t.line }]}><Text style={[s.bodySmall, { color: t.deep }]}>6 productos sin precio</Text><Text style={[s.bodySmall, { color: t.deep }]}>Total pendiente</Text></View></View>;
}

const s = StyleSheet.create({
  root: { flex: 1 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAF6' },
  topbar: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, avatar: { width: 44, height: 44, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.bold, fontSize: 14 },
  demoStrip: { minHeight: 30, paddingVertical: 6, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 7 }, demoDot: { width: 5, height: 5, borderRadius: 3 }, demoLabel: { fontFamily: font.medium, fontSize: 12, lineHeight: 17 },
  homeIntro: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }, introKicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, eyebrow: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.2, lineHeight: 17 }, headline: { fontFamily: font.extra, fontSize: 32, lineHeight: 39, letterSpacing: -1.3 }, editorialTitle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'web' ? 'Georgia' : 'serif', fontWeight: '400', fontSize: 39, lineHeight: 43, letterSpacing: -1.1 }, introText: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 0 }, placePill: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7 }, placeText: { fontFamily: font.bold, fontSize: 11 },
  content: { paddingHorizontal: 24 }, primary: { minHeight: 54, paddingHorizontal: 19, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }, primaryLabel: { fontFamily: font.bold, fontSize: 16, lineHeight: 21, flexShrink: 1 },
  quickEntry: { minHeight: 54, paddingLeft: 15, paddingRight: 7, paddingVertical: 6, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9 }, quickText: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, flex: 1 }, micField: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetCard: { borderWidth: 1, paddingHorizontal: 19, paddingTop: 13, paddingBottom: 14 }, budgetHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }, smallLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 }, budgetLabel: { fontFamily: font.semi, fontSize: 13 }, budgetHelp: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, budgetAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 9, marginBottom: 17 }, budgetAmount: { fontFamily: font.extra, fontSize: 40, lineHeight: 49, letterSpacing: -1.7 }, euro: { fontSize: 27, letterSpacing: -1 }, budgetSample: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 7, maxWidth: 155 }, budgetSampleText: { fontFamily: font.semi, fontSize: 12, lineHeight: 18 }, budgetFooter: { paddingTop: 13, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  bodySmall: { fontFamily: font.medium, fontSize: 13, lineHeight: 19 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 12 }, sectionTitle: { fontFamily: font.bold, fontSize: 20, letterSpacing: -0.5 }, textAction: { minHeight: 44, minWidth: 72, flexDirection: 'row', alignItems: 'center', gap: 2 }, textActionLabel: { fontFamily: font.bold, fontSize: 13 }, listSummary: { padding: 15, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, summaryIcon: { width: 42, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, summaryTitle: { fontFamily: font.bold, fontSize: 14, lineHeight: 18 }, progressRing: { width: 36, height: 36, borderWidth: 2.5, borderRadius: 20, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }] }, progressText: { fontFamily: font.bold, fontSize: 10, transform: [{ rotate: '15deg' }] },
  mealCard: { borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 17, paddingRight: 5, gap: 8 }, mealTitle: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, letterSpacing: -0.2 }, mealLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 13 }, mealLinkText: { fontFamily: font.bold, fontSize: 11, lineHeight: 17 }, localNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 22 }, localText: { fontFamily: font.medium, fontSize: 12, lineHeight: 19 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, minHeight: 76, paddingTop: 7, paddingBottom: 6 }, tab: { flex: 1, minHeight: 60, alignItems: 'center', gap: 3 }, tabIcon: { width: 49, height: 30, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, tabText: { fontSize: 12, lineHeight: 17 }, tabDot: { width: 3, height: 3, borderRadius: 3 },
  listHeading: { marginTop: 28, marginBottom: 23, flexDirection: 'row', alignItems: 'center', gap: 8 }, listTitle: { fontFamily: font.extra, fontSize: 27, lineHeight: 34, letterSpacing: -1, marginTop: 8 }, editorialList: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'web' ? 'Georgia' : 'serif', fontWeight: '400', fontSize: 31, lineHeight: 37 }, optionsButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, emptyBudget: { borderWidth: 1, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 15, flexDirection: 'row', gap: 9, alignItems: 'center' }, emptyBudgetValue: { fontFamily: font.extra, fontSize: 21, letterSpacing: -0.8 },
  emptyState: { alignItems: 'center', paddingTop: 30, gap: 18 }, artField: { height: 167, width: 167, borderRadius: 90, justifyContent: 'center', alignItems: 'center' }, emptyTitle: { fontFamily: font.extra, fontSize: 23, lineHeight: 31, letterSpacing: -0.7, textAlign: 'center' }, editorialEmpty: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'web' ? 'Georgia' : 'serif', fontWeight: '400', fontSize: 27, lineHeight: 34 }, emptyDescription: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, textAlign: 'center' }, emptyHint: { fontFamily: font.medium, fontSize: 12, lineHeight: 19 }, emptyTip: { borderTopWidth: 1, marginTop: 30, paddingVertical: 21, gap: 10, flexDirection: 'row', alignItems: 'center' }, tipText: { fontFamily: font.medium, fontSize: 12, lineHeight: 20, flex: 1 },
  progressCard: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 13, marginBottom: 15 }, progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, progressTitle: { fontFamily: font.bold, fontSize: 13 }, progressTrack: { height: 5, borderRadius: 5, marginTop: 12, overflow: 'hidden' }, progressFill: { height: 5, width: '33.3333%', borderRadius: 5 }, listBudget: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, listBudgetAmount: { fontFamily: font.extra, fontSize: 27, letterSpacing: -1, marginTop: 4 }, noPriceTitle: { fontFamily: font.bold, fontSize: 13 }, category: { fontFamily: font.bold, fontSize: 13, lineHeight: 19, marginBottom: 4 }, item: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, borderBottomWidth: 1 }, checkbox: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, itemName: { fontFamily: font.semi, fontSize: 16, lineHeight: 21 }, itemQuantity: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, marginTop: 3 }, noPrice: { fontFamily: font.medium, fontSize: 13, lineHeight: 17 }, priceNotice: { padding: 14, borderRadius: 13, gap: 8, flexDirection: 'row', alignItems: 'flex-start', marginTop: 24, marginBottom: 8 }, priceNoticeText: { fontFamily: font.medium, fontSize: 13, lineHeight: 20, flex: 1 }, fixedAction: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(12,35,23,0.4)', padding: 22, justifyContent: 'center', alignItems: 'center' }, modal: { width: '100%', maxWidth: 420, padding: 24, borderRadius: 24 }, modalHeading: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 17 }, modalTitle: { fontFamily: font.extra, fontSize: 21, lineHeight: 27, flex: 1, letterSpacing: -0.6 }, modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, modalText: { fontFamily: font.regular, fontSize: 14, lineHeight: 23 }, variantOption: { padding: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, variantName: { fontFamily: font.bold, fontSize: 13 }, previewEmpty: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, previewEmptyText: { fontFamily: font.bold, fontSize: 14 },
});
