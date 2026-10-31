# B01 · Identidad visual para revisión

**Estado vigente: V3 Verde Mercado seleccionada; M3 provisional. El logotipo definitivo se trabajará más adelante. B02 no iniciado.**

Selección del propietario, 2026-10-29: «Verde mercado y m3 pero el logo tendremos que trabajarlo más adelante». Queda aprobada la dirección visual, con la marca abierta para una revisión posterior. Las alternativas y evidencias siguientes se conservan como registro de la entrega; el PDF y ZIP originales son anteriores a esta selección.

El propietario respondió «Sigue» tras B00. Esta entrega contiene tres exploraciones comparables, código de presentación aislado y evidencia reproducible. La selección sigue correspondiendo al propietario, con revisión de producto/UX de ChatGPT.

## Abrir la entrega visual

- [Comparativa de los tres inicios](../design/b01/evidence/B01-comparativa-inicio.png).
- [Monogramas y pruebas de marca](../design/b01/evidence/B01-marcas.png).
- [PDF completo, cinco páginas](../design/b01/evidence/B01-propuestas.pdf).
- [Galería visual con nueve pantallas](../design/b01/review.html).
- [Ejecución y reproducción](../design/b01/README.md).

El PDF compara Inicio y presenta Inicio, Mi compra vacía y Mi compra con productos para cada ruta. Todas utilizan los mismos seis artículos, dos marcados como ejemplo y un presupuesto de muestra de 60 €. No hay precios de supermercados, gasto calculado, ahorro atribuido ni datos comerciales verificados.

## Tres rutas y sus compromisos

| Ruta | Carácter y decisiones | Ventaja | Riesgo por revisar |
|---|---|---|---|
| V1 · Verde Esencial | Verde institucional, marfil, tarjetas blancas y formas suaves; Manrope. | Claridad, familiaridad y lectura estable. | Necesita la marca JJ para distinguirse de otras herramientas de organización. |
| V2 · Verde Noche | Cabecera verde profunda, acción menta temprana y títulos editoriales Georgia; cuerpo Manrope. | Mayor carácter y contraste de la acción principal. | Puede parecer más seria; la serif de sistema cambia entre plataformas. No es un modo oscuro completo. |
| V3 · Verde Mercado | Crema, verde vivo, acento amarillo y trazos de marca con ritmo; Manrope. | Cercanía y energía para la compra cotidiana en Tenerife. | Controlar cuánto amarillo se usa para no dar apariencia de promoción comercial. |

No se ha elegido automáticamente V1 aunque el kit la proponga como recomendación.

## Tres marcas independientes

- **M1 · Doble trazo:** dos letras redondeadas y equilibradas en un cuadrado suave.
- **M2 · Firma editorial:** dos letras sólidas geométricas en una placa más sobria.
- **M3 · Ritmo de mercado:** trazos a distintas alturas en un círculo cálido.

Cada opción dispone de SVG de icono y versiones monocromas blanca/verde. La lámina de marca muestra cabecera con denominación, icono y versiones a 60 y 24 px sobre claro y oscuro. Las letras son vectores originales; no se ha usado un carrito o una hoja como firma.

Dirección y monograma pueden seleccionarse por separado. Por ejemplo, solicitar V1 + M3 constituye una revisión concreta, no exige aprobar la combinación inicial V1 + M1.

## Mini guía por propuesta

| Token | V1 | V2 | V3 |
|---|---|---|---|
| Primario | `#167347` | `#133D2D` | `#167347` |
| Fondo | `#F7FAF6` | `#F5F7F4` | `#FFF9EF` |
| Texto principal | `#19332A` | `#18362B` | `#253D2B` |
| Texto secundario | `#4E6657` | `#4D6155` | `#5C6651` |
| Acento | `#D7EEDC` | `#B5F1C8` | `#F2C94C` |
| Tipografía | Manrope | Georgia/serif + Manrope | Manrope |

- Márgenes laterales 24; botones principales de al menos 54 de altura; pestañas con icono y etiqueta; información de presupuesto mediante texto, no solo color.
- Nombres de producto a 16; cantidades y ausencia de precio a 13; acciones principales a 16. Marca a 15; cabeceras 27–39 según ruta y tamaño.
- Ayudas, textos de navegación y etiquetas de prototipo a 11–14 según función. La validación con Dynamic Type y VoiceOver queda pendiente; no se afirma accesibilidad global por comprobar únicamente contraste.
- Botones de información, opciones, avatar y acceso «Ver lista» con área de al menos 44×44. El campo de voz/texto completo es interactivo; el icono interior no es una diana independiente.
- En tamaños pequeños, la acción principal de Inicio se adelanta al resumen. Las listas vacía y poblada mantienen su acción principal fija sobre la navegación.
- Ilustraciones vectoriales originales de ingredientes y plato; no hay fotografía de terceros. Sombras discretas y estados de pulsación sin animaciones obligatorias.

## Alcance real del prototipo

`design/b01` es un proyecto Expo de presentación que comparte las dependencias ya instaladas. La entrada y el almacenamiento de la aplicación anterior no se modifican. No hay acceso al dominio/AsyncStorage de la app ni integración con IA o servicios.

Se puede navegar de Inicio a Mi compra, volver y explorar la lista vacía. Añadir desde el vacío lleva a los productos de ejemplo, sin crear artículos. Los demás controles muestran una explicación de prototipo; no simulan permisos de micrófono, guardado, compra o pago. El selector de ruta visual sirve para explorar y no registra aprobación.

El código nuevo se limita a `design/b01/`; la otra incorporación es documental (`AGENTS.md`, `docs/`, `bloques/`, `referencias/`). Los originales del kit se conservan, con ampliaciones fechadas en el tablero y decisiones. No se añadió ninguna dependencia al proyecto principal.

## Validación y evidencia

- TypeScript de la aplicación y del prototipo: correcto, sin emitir archivos.
- Suite existente: **50/50 pruebas unitarias**; se mantiene la separación entre lógica y diseño.
- Exportación web de B01: correcta, generada desde su propia carpeta.
- Capturas de la UI ejecutable: **27 vistas** (tres rutas × tres pantallas × tres tamaños CSS: 375×667, 390×844, 430×932), con densidad 2×. En los recorridos comprobados la acción principal queda visible sobre la barra inferior y no hay desbordamiento horizontal.
- Verificación adicional de navegación, aviso de prototipo y ausencia de escrituras locales en los recorridos de muestra. Sin errores JavaScript en esas capturas.
- **41 pares de texto/superficie** superan 4,5:1. Mínimos de los pares revisados: V1 **5,35:1**, V2 **5,63:1**, V3 **4,99:1**. Cálculo de luminancia relativa sRGB; detalle en `design/b01/evidence/contrast.json`.
- Comparación de huellas SHA-256: los **18 archivos anteriores** permanecen intactos; evidencia en `design/b01/evidence/preservation.json`.

Comandos y utilidades:

```sh
# En la raíz: comprobación sin emitir código ni guardar caché de Vitest
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vitest/vitest.mjs run --configLoader native --no-cache

# En design/b01
npm run export:web
node check-contrast.cjs
node capture.cjs
```

En el entorno se ha usado Chromium instalado en `/usr/bin/chromium`, indicado por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Las opciones locales `EXPO_NO_TELEMETRY`, `EXPO_OFFLINE` y `__UNSAFE_EXPO_HOME_DIRECTORY` se han utilizado para ejecutar Expo dentro del espacio permitido; no son configuración de producto.

## Límites y asuntos pendientes

Las capturas proceden de Chromium web a escala iPhone, **no de iOS nativo ni Safari**. No validan barras de navegador reales, teclado, VoiceOver, texto grande o el uso físico con una mano. La comprobación completa de esas condiciones corresponde al prototipo aprobado y QA posterior.

No hay rama ni PR: continúa sin estar disponible un repositorio Git operativo. Se ha aislado el trabajo mediante carpetas nuevas y se conserva la base anterior. Antes de crear PRs debe identificarse el repositorio y la rama correctos; no se ha inicializado ni publicado otro repositorio.

Manrope existente usa licencia MIT/OFL-1.1; Lucide ISC y React Native SVG MIT. Georgia se utiliza como fuente del sistema, sin redistribuirla. No hay servicios de pago ni fuentes nuevas. La disponibilidad legal del nombre/monograma sigue pendiente.

**Resultado de la selección:** V3 Verde Mercado aprobada como dirección visual; M3 elegido como referencia provisional. El diseño final del logo queda pendiente por decisión del propietario. B02 podrá utilizar esta base sin cerrar el logotipo; no se ha iniciado en esta actualización documental.
