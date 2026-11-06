# JJ Compra Inteligente | B02 - Verde Mercado Premium

**Fecha:** 30 de octubre de 2026  
**Estado:** Dirección creativa propuesta para revisión. No es diseño definitivo aprobado.  
**Fuente de verdad:** `00_LOGO_OFICIAL_APROBADO.jpg` conserva las formas del logo elegido.  
**Vista de inspiración:** `01_MOODBOARD_PREMIUM_REFERENCIA.png` es un moodboard, no diseños funcionales ni una fuente fiable de precios.  
**Norma de proyecto:** ChatGPT prepara briefs y revisa; exclusivamente Codex escribe código de la aplicación.

## 1. Principio rector

**Premium cercano, no lujo frío.** Debe combinar la confianza, frescura y humanidad del mercado local con la precisión y el orden de una aplicación tecnológica excelente. Verde Mercado sigue siendo la identidad; no sustituyas la marca por negro y dorado.

## 2. Elementos aprobados que no se rediseñan

- Nombre: `JJ Compra Inteligente`.
- Logo: carrito amarillo dorado, iniciales `JJ` verdes dentro de la cesta, asa verde inclinada, dos ruedas verdes y dos destellos amarillos. Texto principal verde oscuro.
- Contexto: compra de alimentos en Tenerife con listas y presupuestos, menús y comparaciones futuras.
- Cuatro pestañas de navegación: Inicio, Mi compra, Ahorro, Menús. Perfil mediante avatar.
- Distinguir claramente datos de ejemplo de datos reales.
- Prioridad de versión de prueba web en Safari iPhone, además de futura app nativa.

## 3. Paleta orientativa (revisable por legibilidad y muestreo del logo)

| Uso | Color HEX | Propósito |
|---|---|---|
| Verde profundo | `#103F2D` | Encabezados, texto, fondos de marca |
| Verde acción | `#167347` | Botones, enlaces, estado activo |
| Amarillo JJ | `#F8CF4A` | Presupuesto destacado, detalles del logo |
| Crema | `#FBF7EE` | Fondo general, cálido y descansado |
| Blanco | `#FFFFFF` | Tarjetas y listas |
| Verde tenue | `#EAF1E7` | Información secundaria |
| Gris vegetal | `#637364` | Etiquetas y ayudas legibles |
| Advertencia | `#B75C2A` | Únicamente para avisos, no decorar |

No considerar estos HEX exactos para el logo sin comprobar colores de la imagen de referencia. Deben validarse contrastes WCAG AA en los tamaños de texto usados. Evitar texto blanco sobre amarillo y verde claro sin comprobación de contraste.

## 4. Tipografía y composición

- Titulares: sans humanista redondeada y robusta; evaluar **Plus Jakarta Sans** o **Manrope** (sujeto a licencia y pruebas), sin fuentes decorativas difíciles de leer.
- Textos y números: Inter o alternativa compatible con legibilidad elevada; números grandes y alineados en presupuesto.
- Jerarquía de tamaños: hero 28-32 px; títulos de sección 20-24; cuerpo 15-17; pequeñas etiquetas de al menos 12-13 cuando sean accesorias.
- Espaciado coherente de 4/8/12/16/24/32; superficies amplias, evitar saturación de tarjetas.
- Radios orientativos: tarjetas 16-20 px, botones 12-16; sombras de profundidad baja, bordes sutiles.

## 5. Reglas de experiencia visual

- 80 % del uso diario es claro, rápido y legible sobre crema; verde profundo para acentos y bienvenida, no oscurecer la app entera.
- El amarillo JJ no debe ocupar grandes bloques continuos salvo tarjeta de presupuesto o llamada editorial especial.
- Una única acción primaria visible por pantalla.
- Fotografías reales o artísticas de alimentos solo en recetas, sin convertir la lista en catálogo recargado.
- Microinteracciones suaves: 150–250 ms para tocar, 250–350 ms para transiciones; desactivar movimientos decorativos cuando el usuario reduce movimiento.
- Los elementos táctiles principales deben tener dimensión mínima aproximada de 44 puntos en iPhone.
- Estados vacíos, error, carga y sin conexión diseñados expresamente; nada de pantallas en blanco.
- Nunca presentar comparaciones ni porcentajes de ahorro sin fuente, fecha, producto y unidades verificables.

## 6. Pantallas B02 por diseñar

**P01 Inicio**: logo pequeño, saludo contextual, campo «¿Qué necesitas comprar?», acceso a voz, tarjeta de presupuesto que distinga «límite» de «gastado», atajos a lista y menús. Evitar exceso de widgets.

**P02 Mi compra**: lista agrupada por categorías, unidades y cantidades editables, progreso claro, añadir producto; marcar lo comprado nunca implica compra real.

**P03 Ahorro**: filtros zona/supermercado, comparación únicamente con datos reales; si no hay precios, pantalla informativa honesta con acceso a la lista.

**P04 Menús**: elección de personas/tiempo, recetas con foto cuidada, pasos legibles y revisión de ingredientes antes de añadirlos a la lista.

**P05 Perfil y hogar**: presupuesto, zona, idioma, accesibilidad y privacidad; modo local sin registro obligatorio.

**F02 Detalle de receta**: panel fácil de leer, fotografía, tiempo, raciones, ingredientes y revisión de cambios.

**Splash premium**: logo oficial 2D de alta fidelidad, versión 3D solo como extra ligero y opcional; coherencia con el brief del logo ya aprobado.

## 7. Entregables obligatorios de Codex (no iniciar sin orden)

1. Revisar el diseño existente y detectar desvíos respecto al logo y estas reglas; **primera entrega solo auditoría, sin cambios de código**.
2. Producir 2 variaciones de las cinco pantallas centrales en ancho iPhone y una vista para escritorio; no fabricar ofertas ni precios reales.
3. Presentar una tabla de tokens de colores, tipografías, espaciados, radios, tamaños de toque y estados.
4. Crear una preview web privada en Vercel cuando exista conexión con repositorio, sin desplegar a producción ni integrar pagos.
5. Aportar capturas comparables, pruebas en Safari iPhone, accesibilidad básica, modo movimiento reducido y rendimiento.
6. Solicitar aprobación antes de implementar o sustituir el estilo vigente.

## 8. Criterios de aceptación

- El logo aprobado sigue exactamente reconocible a 32, 64 y 128 px.
- La app se siente premium sin aspecto de producto financiero ni lujo inaccesible.
- Todas las pantallas mantienen fondo crema, tipografía verde profundo, botón verde, detalles amarillos.
- La lista funciona como centro del flujo de compra.
- Los presupuestos diferencian límite, estimación, total conocido y gasto real.
- Los elementos navegables y de contacto son accesibles y legibles en iPhone.
- No se introducen funciones nuevas ni fuentes de precios no autorizadas.
- Codex no programa hasta recibir la instrucción de iniciar una etapa específica.

## 9. Próxima orden a Codex (solo lectura)

> Trabaja sobre JJ Compra Inteligente, bloque B02 Verde Mercado Premium. Analiza el repositorio sin modificar archivos ni hacer commits. Conserva el logo definido en `00_LOGO_OFICIAL_APROBADO.jpg`; el moodboard es referencia estética, no especificación exacta de interfaz ni fuente de datos. Audita las pantallas existentes respecto al brief `02_DIRECCION_PREMIUM_Y_BLOQUE_CODEX.md`, enumera diferencias y entrega un plan de implementación mínimo por etapas con capturas de estado actual. No escribas código todavía. Espera mi aprobación.

## 10. Registro de decisiones

- 2026-10-30: logo con carrito amarillo y JJ verde **aprobado**.
- 2026-10-30: paquete original de logotipo 2D/3D respaldado en biblioteca.
- 2026-10-30: Verde Mercado Premium **propuesto**; pendiente de revisión explícita del propietario antes de considerarlo aprobado.
