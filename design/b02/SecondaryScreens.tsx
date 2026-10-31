import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Accessibility, ArrowUpRight, BookOpen, ChevronDown, Clock, Globe, ListChecks, MapPin, ShieldCheck, SlidersHorizontal, Sprout, Users, Utensils, Wallet } from 'lucide-react-native';
import { MealArt } from '../b01/Illustrations';
import { Button, Card, Notice, Pill, Row, Section, Title, f, money, t, ui } from './ui';
import type { ScreenProps } from './types';

/** Presentation only: these screens neither read nor persist application data. */
export function SavingsScreen({ state, onNavigate, onInfo }: ScreenProps) {
  const old = state === 'stale-price';
  const incomparable = state === 'incomparable';
  const focusedObservation = old || incomparable;
  const filterInfo = () => onInfo('Filtros de ejemplo', 'Tenerife y Todas las tiendas muestran la propuesta de filtros. No se han consultado comercios ni catálogos.');
  return <View style={ui.page}>
    <Title kicker="AHORRO" title={old ? 'Un precio antiguo.' : incomparable ? 'Antes de comparar.' : 'Decide con datos.'} subtitle={focusedObservation ? undefined : 'Cada precio necesita su contexto.'} />
    {!focusedObservation && <><View style={s.filters}>
      <Filter label="Tenerife" icon={MapPin} onPress={filterInfo} />
      <Filter label="Todas las tiendas" icon={SlidersHorizontal} onPress={filterInfo} />
    </View>
    <Card style={{ marginBottom: 15 }}>
      <View style={s.between}><Text style={ui.note}>Presupuesto de ejemplo</Text><Wallet size={19} color={t.primary} /></View>
      <View style={[s.between, { marginTop: 7, alignItems: 'flex-end' }]}><Text style={ui.number}>{money(60)}</Text><Pill label="No es gasto real" tone="neutral" /></View>
      <View style={s.summaryBottom}><View><Text style={ui.note}>Total conocido</Text><Text style={s.unknown}>—</Text></View><View style={{ alignItems: 'flex-end', gap: 7 }}><Text style={ui.note}>Productos sin precio</Text><Text style={s.summaryCount}>6 de 6</Text></View></View>
    </Card>
    <Button label="Ver mi compra" icon={ListChecks} onPress={() => onNavigate('list')} testID="savings-cta" />
    </>}

    {!focusedObservation && <Section title="Antes de comparar" />}
    {old ? <>
      <Notice kind="warning" title="Este precio ya es antiguo" text="La fecha no confirma el precio de hoy ni la disponibilidad en tienda." />
      <Card>
        <Pill label="Ejemplo · Precio antiguo" tone="yellow" />
        <View style={[s.between, { marginTop: 16 }]}><View style={{ flex: 1, gap: 5 }}><Text style={ui.strong}>Arroz redondo</Text><Text style={ui.note}>Formato: 1 kg</Text></View><Text style={s.examplePrice}>{money(1.8)}</Text></View>
        <Text style={[ui.note, { marginTop: 5, marginBottom: 14 }]}>Precio de demostración</Text>
        <View style={s.metadata}><Text style={ui.note}>Fecha del ejemplo</Text><Text style={s.metadataValue}>01 sep 2026</Text></View>
        <View style={s.metadata}><Text style={ui.note}>Procedencia</Text><Text style={s.metadataValue}>Aportación manual ficticia</Text></View>
        <Text style={[ui.note, { marginTop: 13 }]}>Una sola observación, sin establecimiento real asociado. No usar como precio actual ni para calcular ahorro.</Text>
      </Card>
    </> : incomparable ? <>
      <Notice kind="warning" title="Estos productos no son equivalentes" text="El tamaño y las características cambian. Un precio menor por envase no demuestra ahorro." />
      <Card><Text style={ui.strong}>Arroz redondo · 1 kg</Text><Text style={[ui.note, { marginTop: 7 }]}>Formato y variedad del primer ejemplo.</Text><View style={s.incomparableDivider}><Text style={s.notEqual}>≠</Text></View><Text style={ui.strong}>Arroz integral · 500 g</Text><Text style={[ui.note, { marginTop: 7 }]}>Otra variedad y otra cantidad. Sin precio comercial.</Text><View style={{ marginTop: 19 }}><Pill label="Comparación no disponible" tone="yellow" /></View></Card>
    </> : <>
      <Notice title={state === 'no-price' ? 'Todavía no hay precios para esta compra' : 'Sin datos suficientes para comparar'} text="No hay una fuente de precios autorizada conectada. Tu lista sigue siendo útil para comprar en persona." />
      <Card style={s.sourceCard}><View style={s.sourceIcon}><ShieldCheck size={25} color={t.primary} strokeWidth={1.6} /></View><Text style={ui.strong}>Cada dato, con su origen</Text><Text style={[ui.note, { textAlign: 'center', marginTop: 9 }]}>Tienda, fecha, formato y precio por unidad. Cuando falte algo, lo verás aquí.</Text><View style={{ marginTop: 17 }}><Pill label="Sin fuentes conectadas" tone="neutral" /></View></Card>
    </>}
    {focusedObservation && <View style={{ marginTop: 16 }}><Button label="Ver mi compra" icon={ListChecks} onPress={() => onNavigate('list')} testID="savings-cta" /></View>}
    <Text style={[ui.note, { marginTop: 19 }]}>Los importes de demostración no son ofertas comerciales. No se muestra ahorro si no puede justificarse.</Text>
  </View>;
}

export function MenusScreen({ state, onNavigate, onInfo, onSheet }: ScreenProps) {
  const preferences = () => onInfo('Preferencias de ejemplo', 'Esta propuesta muestra dos personas y cenas de 25–35 minutos. Cambiar raciones y preferencias será una función posterior; aquí no se guardan ajustes.');
  return <View style={ui.page}>
    <Title kicker="MENÚS" title="Esta semana, fácil." subtitle="Tres cenas, sin complicarte." />
    {state === 'error' && <Notice kind="error" title="La ayuda no está disponible" text="Puedes seguir explorando las recetas de ejemplo y revisar los ingredientes por tu cuenta." action="Ver menú de ejemplo" onPress={() => onNavigate('menus')} />}
    <View style={s.filters}><Filter label="2 personas" icon={Users} onPress={preferences} /><Filter label="25–35 min" icon={Clock} onPress={preferences} /></View>
    {state === 'empty' ? <>
      <Card style={s.menuEmpty}><MealArt variant="v3" size={126} /><Text style={[s.emptyTitle, { textAlign: 'center' }]}>¿Qué apetece cocinar?</Text><Text style={[ui.note, { textAlign: 'center' }]}>Empieza por una idea sencilla. Después revisarás las raciones y lo que necesitas comprar.</Text></Card>
      <Button label="Explorar menú de ejemplo" icon={Utensils} onPress={() => onNavigate('menus')} testID="menus-cta" />
    </> : <>
      <Pressable accessibilityRole="button" accessibilityLabel="Ver receta de ejemplo: Arroz con verduras" onPress={() => onSheet('recipe')} style={({ pressed }) => [s.featuredMeal, pressed && { opacity: 0.8 }]}>
        <View style={{ flex: 1 }}><Pill label="Lunes · Tu menú de ejemplo" tone="yellow" /><Text style={s.featuredName}>Arroz con verduras</Text><View style={s.mealMeta}><Clock size={14} color={t.muted} /><Text style={ui.note}>25 min · 2 personas</Text></View><View style={s.recipeLink}><Text style={ui.link}>Ver receta</Text><ArrowUpRight size={16} color={t.primary} /></View></View><MealArt variant="v3" size={96} />
      </Pressable>
      <Button label="Revisar ingredientes" icon={ListChecks} onPress={() => onSheet('review')} testID="menus-cta" />
      <Section title="También en tu semana" />
      <MealRow day="Miércoles" name="Lentejas de casa" time="35 min" onPress={() => onInfo('Lentejas de casa', 'Receta de ejemplo para dos personas. En esta entrega se diseña su presentación; el detalle completo y la generación de lista se desarrollarán después de aprobar el diseño.')} />
      <MealRow day="Viernes" name="Tortilla con ensalada" time="20 min" onPress={() => onInfo('Tortilla con ensalada', 'Una tercera cena de ejemplo. No se ha calculado el coste ni se ha consultado una fuente de precios.')} />
    </>}
    <View style={{ marginTop: 23 }}><Notice title="Antes de añadir, tú revisas" text="Podrás ajustar cantidades, raciones y productos repetidos. Ninguna sugerencia cambia tu compra sin confirmación." /></View>
    <View style={s.menuNote}><Sprout size={18} color={t.primary} /><Text style={[ui.note, { flex: 1 }]}>Recetas de ejemplo. Confirma ingredientes, restricciones y alérgenos antes de cocinar.</Text></View>
  </View>;
}

export function ProfileScreen({ onInfo, onSheet }: ScreenProps) {
  return <View style={ui.page}>
    <Title kicker="PERFIL Y HOGAR" title="Tu espacio." subtitle="Una compra que encaja contigo." />
    <Card style={s.profileCard}><View style={s.profileAvatar}><Text style={s.profileInitials}>JJ</Text></View><View style={{ flex: 1, gap: 6 }}><Text style={ui.strong}>Tu compra, sin registro</Text><Text style={ui.note}>Modo local propuesto</Text><Pill label="Sin sesión iniciada" tone="neutral" /></View></Card>
    <Section title="A tu manera" />
    <Card style={{ paddingVertical: 1 }}>
      <Row title="Presupuesto semanal" subtitle="60 € · Ejemplo editable" icon={Wallet} onPress={() => onSheet('budget')} />
      <Row title="Tu zona" subtitle="Tenerife" icon={MapPin} onPress={() => onInfo('Tu zona', 'Tenerife es el mercado piloto del diseño. No se solicita ubicación ni se consulta cobertura de comercios.')} />
      <Row title="Idioma" subtitle="Español" icon={Globe} onPress={() => onInfo('Idioma', 'La primera versión se diseña en español. La selección de otros idiomas es una propuesta posterior, no una traducción ya implementada.')} />
      <Row title="Accesibilidad" subtitle="Texto, contraste y uso cómodo" icon={Accessibility} onPress={() => onSheet('accessibility')} />
    </Card>
    <Section title="Un hogar, una lista" />
    <Card style={s.householdCard}><View style={s.householdIcon}><Users size={25} color={t.primary} strokeWidth={1.7} /></View><Pill label="Vista previa · Fase posterior" tone="yellow" /><Text style={[ui.strong, { marginTop: 15 }]}>Compartir también es organizarse.</Text><Text style={[ui.note, { marginTop: 9, marginBottom: 18 }]}>El acceso por hogar, las invitaciones y los permisos se diseñan antes de activar una cuenta compartida.</Text><Button label="Ver cómo compartir" secondary icon={Users} onPress={() => onSheet('household')} testID="profile-cta" /></Card>
    <Section title="Con claridad" />
    <Card style={{ paddingVertical: 1 }}><Row title="Privacidad y datos" subtitle="Qué se guarda y quién puede verlo" icon={ShieldCheck} onPress={() => onSheet('privacy')} /><Row title="Ayuda" subtitle="Sobre este prototipo" icon={BookOpen} onPress={() => onInfo('Sobre esta propuesta', 'Esta es la revisión visual B02 de JJ Compra Inteligente. Los ajustes son ejemplos y no se guardan. La app de fase 1 y sus datos permanecen intactos.')} /></Card>
  </View>;
}

function Filter({ label, icon: Icon, onPress }: { label: string; icon: typeof MapPin; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.filter, pressed && { opacity: 0.7 }]}><Icon size={16} color={t.primary} /><Text style={s.filterText}>{label}</Text><ChevronDown size={14} color={t.muted} /></Pressable>;
}

function MealRow({ day, name, time, onPress }: { day: string; name: string; time: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${day}: ${name}, ${time}. Ejemplo visual`} onPress={onPress} style={({ pressed }) => [s.mealRow, pressed && { opacity: 0.75 }]}><View style={s.mealRowIcon}><Utensils size={21} color={t.primary} strokeWidth={1.6} /></View><View style={{ flex: 1, gap: 5 }}><Text style={s.day}>{day}</Text><Text style={s.recipeName}>{name}</Text><Text style={ui.note}>{time} · 2 personas</Text></View><ArrowUpRight color={t.primary} size={19} /></Pressable>;
}

const s = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 17 }, filter: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#C9D2BE', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFDF7' }, filterText: { fontFamily: f.semi, fontSize: 13, color: t.deep, lineHeight: 19 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, summaryBottom: { borderTopWidth: 1, borderTopColor: t.line, marginTop: 17, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, unknown: { fontFamily: f.bold, color: t.deep, fontSize: 23, lineHeight: 30, marginTop: 3 }, summaryCount: { fontFamily: f.bold, color: t.deep, fontSize: 17, lineHeight: 24 },
  sourceCard: { alignItems: 'center', paddingVertical: 25 }, sourceIcon: { height: 53, width: 53, borderRadius: 17, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 17 }, priceExample: { marginTop: 20, marginBottom: 18, gap: 5 }, examplePrice: { fontFamily: f.extra, color: t.deep, fontSize: 31, lineHeight: 39, letterSpacing: -1 }, metadata: { flexDirection: 'row', gap: 14, justifyContent: 'space-between', paddingVertical: 11, borderTopWidth: 1, borderTopColor: t.line }, metadataValue: { fontFamily: f.semi, color: t.deep, fontSize: 13, lineHeight: 21, flex: 1, textAlign: 'right' }, incomparableDivider: { borderTopWidth: 1, borderTopColor: t.line, alignItems: 'center', marginVertical: 23 }, notEqual: { fontFamily: f.bold, color: t.muted, fontSize: 25, lineHeight: 32, backgroundColor: '#fff', paddingHorizontal: 10, marginTop: -16 },
  featuredMeal: { backgroundColor: '#F7EAC4', borderColor: '#E7D9AD', borderWidth: 1, paddingVertical: 19, paddingLeft: 17, paddingRight: 6, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 15 }, featuredName: { fontFamily: f.extra, color: t.deep, fontSize: 21, lineHeight: 28, letterSpacing: -0.6, marginTop: 13 }, mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 }, recipeLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }, mealRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: 1, borderBottomColor: t.line, paddingVertical: 18 }, mealRowIcon: { width: 44, height: 51, borderRadius: 13, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }, day: { fontFamily: f.bold, color: t.muted, fontSize: 11, letterSpacing: 0.5, lineHeight: 17 }, recipeName: { fontFamily: f.bold, color: t.ink, fontSize: 16, lineHeight: 23 }, menuNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 1 }, menuEmpty: { paddingVertical: 27, alignItems: 'center', gap: 17, marginBottom: 17 }, emptyTitle: { fontFamily: f.extra, color: t.ink, fontSize: 23, letterSpacing: -0.7, lineHeight: 31 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8EDCA' }, profileAvatar: { width: 62, height: 62, backgroundColor: t.accent, borderRadius: 31, alignItems: 'center', justifyContent: 'center' }, profileInitials: { fontFamily: f.extra, color: t.deep, fontSize: 24 }, householdCard: { backgroundColor: '#F3F2E3' }, householdIcon: { width: 50, height: 50, backgroundColor: '#E4EAD7', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
});
