# Dirección de arte y sistema visual | JJ Compra Inteligente

> **Correspondencia pendiente:** los tokens y el PNG oficial están aplicados, pero la composición y el mapa completo de pantallas/estados no están cerrados. La fuente activa es V2 y la [auditoría integral](AUDITORIA_COMPLETITUD_V2.md) define los pendientes; conservar los diseños históricos sin convertirlos en aprobaciones del trabajo nuevo.


> **Prioridad vigente 06/11/2026:** referencias recuperadas y logo 2D exacto integrados en la base V2. Tokens canónicos del contrato V2, cabecera verde y navegación amarilla aplicados a las vistas existentes. Véase [entrega V01/V02](V2_ENTREGA_V01_V02_Y_AUDITORIA.md). La revisión visual del propietario y las funciones ausentes siguen pendientes. Las declaraciones de falta de originales y M3 provisional que siguen son históricas.


> **Prioridad vigente — 31/10/2026:** el propietario solicita que la implementación corresponda a la maqueta GPT-6 V2 / Verde Mercado Premium entregada posteriormente. La app actual todavía conserva V3/M3 y no cumple esa correspondencia. Consultar [conciliación V2](V2_CONCILIACION_VISUAL_2026-10-31.md): los originales y el logo exacto deben recuperarse antes de corregir la UI. Las decisiones y alternativas antiguas que siguen se conservan como antecedentes, no como sustituto de GPT-6 V2. «V2 Verde Noche» del estudio B01 es una propuesta diferente.

**Estado vigente:** V3 Verde Mercado seleccionada; M3 provisional, logotipo definitivo pendiente. | **Prioridad de la fase:** máxima

## Selección del propietario — 2026-10-29

«Verde mercado y m3 pero el logo tendremos que trabajarlo más adelante».

La dirección aprobada es **V3 Verde Mercado**, tal como se presentó en B01: verde `#167347`, crema `#FFF9EF`, acento amarillo `#F2C94C` y tipografía Manrope. **M3 se utiliza como referencia provisional**, no como logotipo final aprobado. El trabajo de marca se retoma más adelante y no bloquea el diseño de las pantallas con esta dirección.

Las rutas, recomendaciones y tokens V1 que siguen se conservan como antecedentes del estudio. Para el trabajo posterior prevalecen V3 y los tokens presentados en `design/b01/tokens.ts`; no aplicar automáticamente V1 ni rediseñar ahora el logo.

## Personalidad visual
Competente, cercana, clara y moderna. No parecer una app bancaria ni un catálogo publicitario. El verde debe comunicar confianza, frescura y control económico. Debe poder usarse en supermercado con una mano y bajo luz intensa. Interfaz en español, preparada para otros idiomas sin textos rígidos.

## Tres rutas visuales a explorar (Codex debe enseñar 3 variantes de la misma pantalla de Inicio)
**V1 · Verde Esencial (recomendada):** fondo marfil muy claro `#F7FAF6`, tarjetas blancas, verde institucional `#167347`, verde oscuro `#133D2D`, acentos menta, tipografía redondeada moderada, fotos de comida puntuales. Mucho aire y jerarquía clara. Pensada para confianza + facilidad.
**V2 · Verde Noche:** cabeceras oscuras `#133D2D`, superficies blancas, acento lima discreto `#B5F1C8`, alto contraste y titulares editoriales. Pensada para percepción premium; verificar que no resulte demasiado oscura o seria.
**V3 · Verde Mercado:** verdes vivos `#167347`, crema `#FFF9EF`, acento cítrico `#F2C94C` puntual, ilustraciones pequeñas y etiquetas cálidas. Más familiar y expresiva; evitar parecer infantil.

**No elegir una ruta automáticamente:** entregar comparación V1/V2/V3 con ventajas, riesgos y capturas a escala iPhone. El propietario aprueba una antes de consolidar componentes.

## Tokens propuestos V1
| Uso | Valor | Instrucción |
|---|---|---|
| Primario | `#167347` | Botones importantes, iconos activos, enlaces |
| Verde profundo | `#133D2D` | Cabeceras, texto destacado |
| Superficie general | `#F7FAF6` | Fondo de pantalla |
| Superficie tarjeta | `#FFFFFF` | Cards y hojas |
| Verde suave | `#EDF7EF` | Resaltados y contenedores de resumen |
| Texto principal | `#19332A` | Máxima legibilidad |
| Texto secundario | `#62786A` | Subtítulos, datos de apoyo |
| Advertencia | `#A75D00` | Precio desactualizado, confirmación necesaria |
| Error | `#B42318` | Fallos, sin datos, acciones destructivas |
| Separador | `#DDE8DF` | Límites discretos |

Estos valores requieren comprobación de contraste por Codex; `#167347` sobre blanco ronda **5,9:1**. No usar verde como única señal de éxito/error.

## Estilo de componentes
- Radio orientativo: tarjetas 18–24; controles 12–16; botones 14–18. Mantener consistencia.
- Escala de espaciado: 4/8/12/16/24/32. Márgenes laterales preferentemente 20–24 pt.
- Tipografía propuesta: fuente de sistema iOS/Android o alternativa libre bien soportada; evitar cargar fuentes hasta verificar rendimiento/licencia.
- Títulos de pantalla: 26–30 pt; títulos secciones 20–22 pt; cuerpo 16–17 pt; información auxiliar 13–14 pt (no ocultar datos críticos con letra mínima).
- Botón primario de altura aproximada 52–56 pt; área interactiva mínima iOS 44x44 pt; estados visuales para pulsado, cargando y deshabilitado.
- Iconos de una sola familia, líneas claras y siempre acompañados de etiqueta para tareas críticas.
- Sombras muy discretas. Preferir contraste, espaciado y bordes antes que efectos pesados.
- Fotografías de producto cuando ayudan a identificarlo; evitar imágenes genéricas en listas transaccionales. Garantizar licencias de activos.

## Firma de marca
- Logotipo por explorar: `JJ` como monograma legible y `Compra Inteligente` completo. Proponer 3 exploraciones tipográficas originales y probar tamaños pequeños (icono 60x60 y cabecera).
- No aprobar un logotipo solo porque luce bien en una portada: probar con fondo claro/oscuro, app icon y condiciones de alto contraste.
- Evitar similitudes innecesarias con la marca/identidad de Jowzi; inspiración en el problema, no copia de interfaz.

## Reglas de UX visual
1. En Inicio, la acción principal **Crear/continuar mi compra** es visible sin desplazarse.
2. El asistente funciona como entrada rápida, no como obstáculo para editar manualmente.
3. Presupuesto visible sin presentar como real el precio no disponible.
4. Navegación propuesta: 4 tabs Inicio, Mi compra, Ahorro, Menús. Perfil mediante avatar; validar con test de usuarios.
5. Estados vacíos útiles: qué hacer y CTA claro. Estados sin conexión y sin permisos no deben bloquear la lista local.
6. En cada flujo debe haber salida, deshacer cuando sea posible y mensajes que expliquen lo que ocurrió.
7. Soporte Dynamic Type / tamaño de texto, VoiceOver/TalkBack, contraste AA, no depender del color, y opción de movimiento reducido.
8. El usuario debe poder usar la lista con una sola mano en un supermercado: controles grandes, acciones cercanas a pulgar, opciones no intrusivas.

## Evidencia visual exigida para la aprobación
- Para V1, V2 y V3: Inicio en dispositivo iPhone con contenido realista y otra vista en modo vacío.
- Para la ruta elegida: 5 pantallas principales + estados cruciales (vacío, sin red, cargando, error, sin precios, presupuesto excedido, permiso de micrófono denegado).
- Comparación clara/oscura si se va a soportar ambos modos; si no, documentar que inicialmente se fija modo claro para mantener calidad.
- Capturas tomadas de UI ejecutable por Codex o maquetas identificadas como tales; no presentar imagen generada como prueba de funcionalidad.
- Informe breve de accesibilidad, legibilidad, textos largos y revisión de iPhone pequeño/grande.

## Lo que no queremos
Una pantalla que parezca plantilla SaaS, un muro de tarjetas idénticas, 8 tonos verdes sin jerarquía, un enorme chat ocupando toda la portada, banners de ofertas inventadas, cifras sin fuente, modales repetitivos, fotografías decorativas sin utilidad, logotipo genérico de carrito + hoja.
