import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { ArrowLeft, ArrowRight, Check, ChevronRight, ClipboardList, House, ListChecks, Mic, Minus, Plus, Settings2, ShieldCheck, SlidersHorizontal, Users, Utensils, Wallet, X } from 'lucide-react-native';
import { Brand } from '../b01/Brand';
import { MealArt } from '../b01/Illustrations';
import { HomeScreen, ListScreen } from './HomeList';
import { MenusScreen, ProfileScreen, SavingsScreen } from './SecondaryScreens';
import { Button, Card, f, Notice, Pill, Row, Section, t, Title, ui } from './ui';
import type { Screen, ScreenProps, SheetName, State } from './types';

const screens: Screen[] = ['home', 'list', 'savings', 'menus', 'profile'];
const states: State[] = ['default', 'empty', 'loading', 'offline', 'mic-denied', 'error', 'long-list', 'no-price', 'over-budget', 'stale-price', 'incomparable'];
const sheets: SheetName[] = ['add', 'review', 'recipe', 'household', 'budget', 'accessibility', 'privacy'];
const stateLabels: Record<State, string> = { default: 'Vista habitual', empty: 'Lista vacía', loading: 'Preparando la compra', offline: 'Sin conexión', 'mic-denied': 'Micrófono desactivado', error: 'Error al mostrar lista', 'long-list': 'Lista de 20 productos', 'no-price': 'Sin precios disponibles', 'over-budget': 'Presupuesto superado', 'stale-price': 'Precio antiguo', incomparable: 'Formatos no comparables' };

function initialView(): { screen: Screen; state: State; sheet: SheetName | null } {
  if (Platform.OS !== 'web') return { screen: 'home', state: 'default', sheet: null };
  const p = new URLSearchParams(window.location.search);
  return { screen: screens.includes(p.get('screen') as Screen) ? p.get('screen') as Screen : 'home', state: states.includes(p.get('state') as State) ? p.get('state') as State : 'default', sheet: sheets.includes(p.get('sheet') as SheetName) ? p.get('sheet') as SheetName : null };
}

export default function App() {
  const [loaded, error] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  return <SafeAreaProvider><StatusBar style="dark" />{!loaded && !error ? <View style={s.loader}><ActivityIndicator color={t.primary} /></View> : <UXStudy />}</SafeAreaProvider>;
}

function UXStudy() {
  const [initial] = useState(initialView);
  const [screen, setScreen] = useState<Screen>(initial.screen);
  const [state, setState] = useState<State>(initial.state);
  const [sheet, setSheet] = useState<SheetName | null>(initial.sheet);
  const [info, setInfo] = useState<{ title: string; body: string } | null>(null);
  const [inspector, setInspector] = useState(false);
  const [checked, setChecked] = useState([4, 5]);
  const [previousChecked, setPreviousChecked] = useState<number[] | null>(null);
  const [toast, setToast] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('ud');
  const [price, setPrice] = useState('');
  const [productNote, setProductNote] = useState('');
  const [included, setIncluded] = useState([0, 1, 2]);
  const [draft, setDraft] = useState('Leche, dos barras de pan y huevos');
  const [formError, setFormError] = useState('');
  const [reviewOverrides, setReviewOverrides] = useState<Record<number, { name: string; unit: string }>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [reviewSource, setReviewSource] = useState<'text' | 'recipe'>(initial.screen === 'menus' ? 'recipe' : 'text');
  const small = useWindowDimensions().height <= 720;
  const navigate = (next: Screen, nextState: State = 'default') => { setScreen(next); setState(nextState); setToast(''); };
  const showInfo = (title: string, body: string) => setInfo({ title, body });
  const openSheet = (value: SheetName) => { setFormError(''); if (value === 'review') { setReviewSource(screen === 'menus' ? 'recipe' : 'text'); setReviewOverrides({}); setIncluded([0, 1, 2]); } setEditingIndex(null); setSheet(value); };
  const props: ScreenProps = { state, onNavigate: navigate, onInfo: showInfo, onSheet: openSheet };
  const toggle = (index: number) => {
    setPreviousChecked(checked);
    setChecked(checked.includes(index) ? checked.filter(i => i !== index) : [...checked, index]);
    setToast('Marcado de ejemplo · No se guarda');
  };
  const undo = () => { if (previousChecked) { setChecked(previousChecked); setPreviousChecked(null); } setToast('Vista anterior recuperada · Ejemplo'); };
  const close = () => { if (editingIndex !== null && sheet === 'add') { setEditingIndex(null); setSheet('review'); return; } setSheet(null); setInfo(null); setInspector(false); };
  const confirmPreview = () => { setSheet(null); navigate('list'); setToast('Vista de ejemplo · Sin cambios en tu lista real'); };
  const saveProductPreview = () => { if (!productName.trim()) { setFormError('Escribe el nombre del producto.'); return; } if (editingIndex !== null) { setReviewOverrides(prev => ({ ...prev, [editingIndex]: { name: productName.trim(), unit: `${quantity} ${unit}` } })); setEditingIndex(null); setSheet('review'); } else confirmPreview(); };
  const isListAction = screen === 'list' && state !== 'error' && state !== 'loading';
  const sheetTitles: Record<SheetName, string> = { add: 'Tu producto, a tu manera.', review: 'Antes de añadir, revisa.', recipe: 'Arroz con verduras', household: 'Una lista, entre todos.', budget: 'Un límite para tu semana.', accessibility: 'A tu forma de leer.', privacy: 'Tus datos, bajo tu control.' };

  return <View testID="screen-ready" style={s.root}>
    <SafeAreaView edges={['top']} style={{ backgroundColor: t.background }}><View style={[s.header, small && { paddingTop: 12, paddingBottom: 12 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="JJ Compra Inteligente, ir al inicio" onPress={() => navigate('home')} style={{ minHeight: 44 }}><Brand variant="v3" /></Pressable>
      <View style={s.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="Explorar estados del diseño" onPress={() => setInspector(true)} style={s.headerButton}><SlidersHorizontal size={19} color={t.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => navigate('profile')} style={s.avatar}><Text style={s.avatarText}>JJ</Text></Pressable></View>
    </View></SafeAreaView>
    <View style={s.demoBar}><View style={s.demoDot} /><Text style={s.demoText}>Prototipo visual · Datos de ejemplo</Text></View>
    <ScrollView key={`${screen}-${state}`} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {screen === 'home' && <HomeScreen {...props} small={small} />}
      {screen === 'list' && <ListScreen {...props} checked={checked} onToggle={toggle} onUndo={undo} />}
      {screen === 'savings' && <SavingsScreen {...props} />}
      {screen === 'menus' && <MenusScreen {...props} />}
      {screen === 'profile' && <ProfileScreen {...props} />}
    </ScrollView>
    {!!toast && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.toast}><Text style={s.toastText}>{toast}</Text>{previousChecked && <Pressable accessibilityRole="button" onPress={undo} style={s.toastAction}><Text style={s.toastLink}>Deshacer</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={() => setToast('')} style={s.toastClose}><X size={17} color={t.deep} /></Pressable></View>}
    {isListAction && <View style={s.fixedCTA}><Button testID="main-cta" label={state === 'empty' ? 'Añadir primer producto' : 'Añadir producto'} icon={Plus} onPress={() => openSheet('add')} /></View>}
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: t.surface }}><View style={s.tabs}>
      {([{ key: 'home', label: 'Inicio', icon: House }, { key: 'list', label: 'Mi compra', icon: ListChecks }, { key: 'savings', label: 'Ahorro', icon: Wallet }, { key: 'menus', label: 'Menús', icon: Utensils }] as const).map(({ key, label, icon: Icon }) => <Pressable key={key} accessibilityRole="tab" accessibilityLabel={label} aria-selected={screen === key} accessibilityState={{ selected: screen === key }} onPress={() => navigate(key)} style={s.tab}><View style={[s.tabIcon, screen === key && { backgroundColor: '#FAEAB1' }]}><Icon size={21} color={screen === key ? t.primary : t.muted} strokeWidth={screen === key ? 2 : 1.6} /></View><Text style={[s.tabText, screen === key && { color: t.primary, fontFamily: f.bold }]}>{label}</Text>{screen === key && <View style={s.activeDot} />}</Pressable>)}
    </View></SafeAreaView>

    <Modal visible={!!sheet || !!info || inspector} transparent animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar panel" style={StyleSheet.absoluteFill} onPress={close} />
        <View testID="sheet-ready" accessibilityViewIsModal style={s.sheet}>
          <View style={s.sheetTop}><View style={s.sheetHandle} /><View style={s.sheetHeading}><View style={{ flex: 1 }}><Text style={s.sheetKicker}>{inspector ? 'REVISIÓN DE DISEÑO' : 'EJEMPLO VISUAL'}</Text><Text accessibilityRole="header" style={s.sheetTitle}>{info ? info.title : inspector ? 'Cada estado cuenta.' : sheet ? sheetTitles[sheet] : ''}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={close} style={s.headerButton}><X size={22} color={t.ink} /></Pressable></View></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false}>
            {info ? <><Text style={ui.body}>{info.body}</Text><View style={{ marginTop: 24 }}><Button label="Entendido" onPress={close} /></View></> : inspector ? <>
              <Text style={[ui.note, { marginBottom: 12 }]}>Explora las maquetas. Cambiar de estado no genera datos ni aprueba el diseño.</Text>
              {states.map(value => <Pressable key={value} accessibilityRole="button" onPress={() => { setInspector(false); navigate(value === 'loading' || value === 'mic-denied' ? 'home' : value === 'no-price' || value === 'stale-price' || value === 'incomparable' ? 'savings' : 'list', value); }} style={s.stateOption}><Text style={ui.body}>{stateLabels[value]}</Text><ChevronRight size={18} color={t.primary} /></Pressable>)}
            </> : sheet === 'add' ? <>
              <Text style={[ui.note, { marginBottom: 21 }]}>Borrador de ejemplo. Puedes revisar los campos; no se guardará en la aplicación.</Text>
              <Field label="Nombre del producto" value={productName} onChange={value => { setProductName(value); setFormError(''); }} placeholder="Ej. Leche semidesnatada" />
              <Text style={s.fieldLabel}>Cantidad y unidad</Text><View style={s.quantityRow}><Pressable accessibilityRole="button" accessibilityLabel="Reducir cantidad" onPress={() => setQuantity(Math.max(1, quantity - 1))} style={s.quantityButton}><Minus size={18} color={t.primary} /></Pressable><Text accessibilityLiveRegion="polite" style={s.quantityNumber}>{quantity}</Text><Pressable accessibilityRole="button" accessibilityLabel="Aumentar cantidad" onPress={() => setQuantity(quantity + 1)} style={s.quantityButton}><Plus size={18} color={t.primary} /></Pressable><View style={s.unitChoices}>{['ud', 'g', 'kg', 'L'].map(value => <Pressable key={value} accessibilityRole="button" aria-selected={unit === value} accessibilityState={{ selected: unit === value }} accessibilityLabel={`Unidad ${value}`} onPress={() => setUnit(value)} style={[s.unit, unit === value && { backgroundColor: t.soft, borderColor: t.primary }]}><Text style={s.unitText}>{value}</Text></Pressable>)}</View></View>
              <Field label="Precio opcional (€)" value={price} onChange={setPrice} placeholder="Sin precio" decimal /><Field label="Nota opcional" value={productNote} onChange={setProductNote} placeholder="Marca, tamaño o algo que recordar" />
              <Notice title="Sin precio es distinto de cero" text="Puedes añadirlo más tarde. Mientras falten importes, el total estará pendiente." />
              {!!formError && <Notice kind="error" title="Revisa el nombre" text={formError} />}
              <Button label={editingIndex !== null ? 'Volver a la revisión' : 'Ver en la lista de ejemplo'} icon={Check} onPress={saveProductPreview} /><View style={{ marginTop: 10 }}><Button secondary label="Cancelar" icon={ArrowLeft} onPress={close} /></View>
            </> : sheet === 'review' ? <>
              <Text style={[ui.note, { marginBottom: 15 }]}>{reviewSource === 'recipe' ? 'Ingredientes de la receta de ejemplo. Las cantidades se revisan antes de incorporarlas.' : 'Pega tu texto de ChatGPT o escribe una lista. Esta vista presenta un borrador de muestra; no interpreta el texto.'}</Text>
              {reviewSource !== 'recipe' && <Field label="Texto para revisar" value={draft} onChange={setDraft} multiline />}
              <Pill label="Borrador de ejemplo · No se ha añadido nada" tone="yellow" />
              {(reviewSource === 'recipe' ? [{ name: 'Arroz redondo', unit: '200 g', note: 'Revisa la cantidad que ya tienes' }, { name: 'Calabacín', unit: '1 ud', note: 'Producto de ejemplo' }, { name: 'Tomates', unit: '2 ud', note: 'En la lista figura en g: no unir sin revisar' }] : [{ name: 'Leche semidesnatada', unit: '2 L', note: 'Ya aparece en la lista de ejemplo' }, { name: 'Pan integral', unit: '2 ud', note: 'Revisa si quieres sumar o sustituir' }, { name: 'Huevos', unit: '6 ud', note: 'Puedes corregir o cancelar' }]).map((item, index) => ({ ...item, ...reviewOverrides[index] })).map((item, index) => <View key={item.name} style={[s.reviewItem, !included.includes(index) && { backgroundColor: '#F4F2E7' }]}><Pressable accessibilityRole="checkbox" accessibilityLabel={`Incluir ${item.name}`} aria-checked={included.includes(index)} accessibilityState={{ checked: included.includes(index) }} onPress={() => setIncluded(included.includes(index) ? included.filter(i => i !== index) : [...included, index])} style={s.includeTarget}><View style={[s.includeBox, included.includes(index) && { backgroundColor: t.primary, borderColor: t.primary }]}>{included.includes(index) && <Check size={15} color="#fff" />}</View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Corregir ${item.name}`} onPress={() => { setProductName(item.name); setQuantity(Number.parseInt(item.unit, 10) || 1); setUnit(item.unit.trim().split(' ').pop() || 'ud'); setEditingIndex(index); setSheet('add'); }} style={{ flex: 1, gap: 5, minHeight: 44 }}><Text style={ui.strong}>{item.name}</Text><Text style={ui.note}>{item.note}</Text><Text style={ui.link}>Corregir</Text></Pressable><Text style={s.reviewUnit}>{item.unit}</Text></View>)}
              <View style={{ marginTop: 18 }}><Notice title="Tú tienes la última palabra" text="La revisión y la corrección van antes de cualquier cambio. Los duplicados o unidades distintas nunca se unirán en silencio." /></View><Button label="Confirmar vista de ejemplo" icon={Check} onPress={confirmPreview} /><View style={{ marginTop: 10 }}><Button secondary label="Cancelar sin añadir" icon={ArrowLeft} onPress={close} /></View>
            </> : sheet === 'recipe' ? <>
              <View style={s.recipeHero}><MealArt variant="v3" size={130} /><View style={{ flex: 1, gap: 9 }}><Pill label="Receta de ejemplo" tone="yellow" /><Text style={ui.strong}>Sencillo, de casa.</Text><Text style={ui.note}>25 min · 2 personas</Text><Text style={ui.note}>Sin coste estimado</Text></View></View>
              <Section title="Lo que necesitas" />{['Arroz redondo · 200 g', 'Calabacín · 1 ud', 'Tomates · 2 ud', 'Aceite y especias · Al gusto'].map(value => <View key={value} style={s.ingredient}><Check size={15} color={t.primary} /><Text style={ui.body}>{value}</Text></View>)}
              <Section title="En tres pasos" /><Text style={ui.body}>1. Lava y corta las verduras.{ '\n' }2. Sofríelas y añade el arroz.{ '\n' }3. Añade agua y cocina hasta que esté listo.</Text><Text style={[ui.note, { marginVertical: 19 }]}>Revisa ingredientes y etiquetas si hay alergias o restricciones en casa.</Text><Button label="Revisar ingredientes" onPress={() => { setReviewSource('recipe'); setSheet('review'); }} />
            </> : sheet === 'household' ? <>
              <Pill label="Plan visual · Todavía sin sincronización" tone="yellow" /><Text style={[ui.body, { marginTop: 18, marginBottom: 22 }]}>Así podría funcionar una compra compartida. Ahora no se crean cuentas ni se envían invitaciones.</Text>
              {[['01', 'Invitar con permiso', 'Cada persona acepta antes de ver la lista del hogar.'], ['02', 'Compartir solo lo necesario', 'Miembros y permisos visibles, sin acceso a otros hogares.'], ['03', 'Poder salir y revocar', 'Eliminar una invitación o dejar de compartir será una decisión clara.']].map(([n, title, body]) => <View key={n} style={s.householdStep}><View style={s.stepNumber}><Text style={ui.link}>{n}</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={ui.strong}>{title}</Text><Text style={ui.note}>{body}</Text></View></View>)}
              <View style={{ marginTop: 22 }}><Button label="Volver a mi perfil" icon={ArrowLeft} onPress={close} /></View>
            </> : sheet === 'budget' ? <>
              <Pill label="Presupuesto de ejemplo" tone="yellow" /><Text style={[ui.body, { marginVertical: 20 }]}>El presupuesto es el límite que eliges. No representa lo que ya has gastado.</Text><Card><Text style={ui.note}>Límite semanal de muestra</Text><Text style={ui.number}>60 €</Text></Card><View style={{ marginTop: 20 }}><Notice title="Tres cifras, tres significados" text="Gasto introducido: precios que aportas. Estimación: importe orientativo, separado. Sin precio: dato pendiente, nunca cero." /></View><Button label="Ver ejemplo de límite superado" onPress={() => { setSheet(null); navigate('list', 'over-budget'); }} /><View style={{ marginTop: 10 }}><Button secondary label="Volver sin cambiar nada" icon={ArrowLeft} onPress={close} /></View>
            </> : sheet === 'accessibility' ? <>
              <Text style={ui.body}>La compra debe poder leerse y manejarse a tu ritmo.</Text><Row title="Tamaño del texto" subtitle="Respetar el ajuste del teléfono" onPress={() => showInfo('Texto a tu tamaño', 'Esta es la propuesta de ajuste visual. La adaptación al tamaño del sistema y su uso con lector de pantalla se validarán en el prototipo móvil.')} /><Row title="Menos movimiento" subtitle="Evitar animaciones innecesarias" right={<Pill label="Previsto" tone="neutral" />} /><Row title="Iconos con etiquetas" subtitle="Las acciones importantes también se explican con texto" right={<Check color={t.primary} size={18} />} /><View style={{ marginTop: 23 }}><Button label="Volver al perfil" icon={ArrowLeft} onPress={close} /></View>
            </> : sheet === 'privacy' ? <>
              <View style={s.privacyIcon}><ShieldCheck color={t.primary} size={31} /></View><Text style={ui.body}>En esta demostración no guardamos listas ni solicitamos datos personales.</Text><View style={{ marginTop: 22 }}><Notice title="Sin registro para empezar" text="La lista local seguirá siendo la base del producto. Cuentas y hogares compartidos requerirán decisiones de privacidad específicas." /></View><Text style={[ui.note, { marginBottom: 23 }]}>Exportar y borrar datos se diseñará con opciones claras antes de activar cuentas o sincronización.</Text><Button label="Entendido" icon={Check} onPress={close} />
            </> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

function Field({ label, value, onChange, placeholder, multiline, decimal }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; decimal?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <View style={s.field}><Text style={s.fieldLabel}>{label}</Text><TextInput onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={t.muted} multiline={multiline} keyboardType={decimal ? 'decimal-pad' : 'default'} style={[s.input, focused && { borderColor: t.primary, borderWidth: 2 }, multiline && { minHeight: 89, textAlignVertical: 'top' }]} /></View>;
}

const s = StyleSheet.create({
  root: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: t.background }, loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.background }, header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 }, headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, avatar: { width: 44, height: 44, borderRadius: 23, backgroundColor: t.soft, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: f.bold, color: t.deep, fontSize: 14 }, demoBar: { paddingHorizontal: 24, minHeight: 31, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F6E8BC' }, demoDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.primary }, demoText: { color: t.deep, fontFamily: f.medium, fontSize: 12, lineHeight: 19 },
  tabs: { backgroundColor: t.surface, flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.line, paddingTop: 7, paddingBottom: 7, minHeight: 76 }, tab: { flex: 1, minHeight: 60, alignItems: 'center', gap: 3 }, tabIcon: { width: 48, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, tabText: { fontFamily: f.medium, fontSize: 12, lineHeight: 19, color: t.muted }, activeDot: { width: 3, height: 3, borderRadius: 3, backgroundColor: t.primary }, fixedCTA: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12, backgroundColor: t.background },
  toast: { marginHorizontal: 16, marginBottom: 4, paddingLeft: 14, paddingVertical: 4, borderRadius: 12, backgroundColor: '#E9EFDE', flexDirection: 'row', alignItems: 'center', gap: 8 }, toastText: { fontFamily: f.medium, fontSize: 12, lineHeight: 19, color: t.deep, flex: 1 }, toastAction: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' }, toastLink: { fontFamily: f.bold, fontSize: 12, color: t.primary }, toastClose: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,39,26,0.38)', justifyContent: 'flex-end', alignItems: 'center' }, sheet: { width: '100%', maxWidth: 480, maxHeight: '91%', backgroundColor: t.background, borderTopLeftRadius: 27, borderTopRightRadius: 27, overflow: 'hidden' }, sheetTop: { paddingTop: 9, paddingHorizontal: 24, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: t.line }, sheetHandle: { width: 35, height: 4, backgroundColor: '#BFC9B7', borderRadius: 3, alignSelf: 'center', marginBottom: 18 }, sheetHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, sheetKicker: { fontFamily: f.bold, fontSize: 10, lineHeight: 16, letterSpacing: 1.4, color: t.muted }, sheetTitle: { fontFamily: f.extra, fontSize: 24, lineHeight: 31, letterSpacing: -0.8, color: t.ink, marginTop: 6 }, sheetBody: { paddingHorizontal: 24, paddingTop: 21, paddingBottom: 28 },
  field: { marginBottom: 20, gap: 9 }, fieldLabel: { fontFamily: f.bold, fontSize: 13, lineHeight: 20, color: t.ink }, input: { minHeight: 54, borderWidth: 1, borderColor: '#748268', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, backgroundColor: '#fff', fontFamily: f.medium, color: t.ink, fontSize: 16, lineHeight: 24, outlineWidth: 0 }, quantityRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2, marginTop: 10, marginBottom: 23 }, quantityButton: { width: 44, height: 44, borderWidth: 1, borderColor: t.line, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }, quantityNumber: { fontFamily: f.bold, fontSize: 17, color: t.deep, minWidth: 35, textAlign: 'center' }, unitChoices: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' }, unit: { minWidth: 44, minHeight: 44, borderWidth: 1, borderColor: t.line, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }, unitText: { fontFamily: f.bold, color: t.deep, fontSize: 13 },
  includeTarget: { width: 44, minHeight: 44, justifyContent: 'center' }, includeBox: { width: 23, height: 23, borderWidth: 1.5, borderColor: '#6A7A6A', borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, reviewItem: { borderBottomWidth: 1, borderBottomColor: t.line, paddingVertical: 19, flexDirection: 'row', alignItems: 'center', gap: 12 }, reviewUnit: { fontFamily: f.bold, color: t.deep, fontSize: 14, lineHeight: 21 }, reviewStepper: { flexDirection: 'row', alignItems: 'center', gap: 3 }, miniStep: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: t.soft }, recipeHero: { flexDirection: 'row', gap: 17, alignItems: 'center' }, ingredient: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: t.line }, householdStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 }, stepNumber: { width: 39, height: 39, borderRadius: 12, backgroundColor: t.soft, justifyContent: 'center', alignItems: 'center' }, privacyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 23 }, stateOption: { minHeight: 53, borderBottomWidth: 1, borderBottomColor: t.line, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
});
