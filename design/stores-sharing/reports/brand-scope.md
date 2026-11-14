# Marca JJ: estado comprobado y siguiente entrega concreta

10 de noviembre de 2026. Revisión limitada a los briefs originales recuperados, recursos de marca, `Brand.tsx`, `app.json` y lámina técnica nueva. No se modificaron fuentes de aplicación, datos, dependencias, documentos históricos, configuración de iconos o historial Git.

## Dictamen

El logotipo horizontal original sí está integrado y conserva sus bytes. El paquete completo B01-L de isotipo, iconos, derivados 2D, movimiento y 3D **todavía no está construido ni aprobado**. La lámina de esta entrega mejora su revisión técnica, pero no convierte esos pendientes en entregables terminados.

La referencia activa es V2: `referencias/gpt6-v2/extraidos/v2/04_DOCUMENTACION/00_LEER_PRIMERO.md:4` establece que «sustituye los antiguos ZIP como referencia visual» conservando el historial. Su contrato, `02_CONTRATO_VISUAL_DATOS.md:4`, dice: «No modificar el logo fuente ni crear una versión parecida». El mismo contrato, línea 22, permite 3D en Bienvenida solo «cuando esté aprobada y pueda omitirse» y ordena «Nunca sustituir el logo original».

Por tanto, la instrucción histórica de trazar/reconstruir un SVG no autoriza a redibujar ahora una marca parecida ni a sustituir el recurso actual. Las propuestas de derivados deben preservar la referencia, permanecer aisladas y superar la aprobación correspondiente antes de integrarse.

## Inventario exacto

| Entregable | Existencia comprobada | Pendiente real |
|---|---|---|
| Logo horizontal | `assets/brand/jj-logo-horizontal.png`, 936×330, RGB, 255.528 bytes. `src/app/components/Brand.tsx` referencia ese único archivo sin efectos. | Revisión visual/física de uso; no se necesita otra imagen parecida para mantener la app. |
| Integridad de la referencia | SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`; idéntico al `LOGO_HORIZONTAL_RECORTADO_DE_ORIGINAL.png` V2. JPG aprobado SHA-256 `7500541f32e14292c013d80f6c8bbc43af87a94a7b646103d6b20289bacb47d0`. | No hay cambios que aceptar en el original. |
| Isotipo independiente | V2 aporta `ICONO_REFERENCIA_NO_APROBADO_PARA_PRODUCCION.png` para consulta. | Falta un recurso de aplicación aprobado; no recortar el carrito por iniciativa propia. |
| App icon / variantes de fondo | `app.json` carece de `icon`, `adaptiveIcon` y splash de marca propios. | Recursos y previsualizaciones iOS/Android, máscaras/área segura y aprobación antes de configurar producción. |
| Vector editable | No hay SVG del carrito oficial en los activos de aplicación. Los SVG de `design/b01/assets/` son las alternativas históricas de monogramas. | Vector fiel sometido a revisión. No incrustar el raster en SVG para aparentar un trazado editable. |
| PNG con transparencia | El PNG integrado es RGB, sin canal alfa, y conserva su fondo crema original. | Un derivado transparente necesita preparación y revisión separadas; mostrar el PNG sobre verde no lo convierte en transparente. |
| Claro / oscuro / monocromo | No existen variantes aprobadas del carrito oficial en los activos de aplicación. | Propuestas aisladas y aceptación; la lámina nueva muestra contextos, no nuevas variantes. |
| Seis tamaños | Lámina nueva mide el logo horizontal completo a 32,48,64,128,256,512 px de ancho CSS, sin modificar el archivo. | No equivale a probar un isotipo/icono cuadrado. El nombre completo deja de ser legible en los menores anchos; hacen falta recursos pequeños aprobados y validación física. |
| Modelo/renders 3D | No se encontraron `.glb`, `.gltf`, `.obj`, `.usd`, `.usdz`, `.blend` o `.fbx` del logo en activos de aplicación/paquete de logo. `Brand.tsx` solo usa Image/View. | Modelo fiel, renders frontal/tres cuartos, controles y mediciones; todavía sin implementar. |
| Movimiento y demo 3D | No hay demo de modos 2D/3D ni carga por piezas, rotación, pausa/reset o carga diferida de motor en la app actual. | Implementación aislada, alternativa estática y pruebas de movimiento reducido, teclado, táctil y rendimiento. |

## Qué se puede construir y comprobar ahora sin sustituir el original

1. Mantener el recurso actual y documentar sus dimensiones, modo RGB y huella de integridad.
2. Mostrarlo a los seis anchos exigidos y sobre los fondos canónicos, sin máscaras, recortes, filtros, recoloración o eliminación de fondo.
3. Preparar matrices de aceptación y un inventario de los derivados ausentes; separar fielmente referencia, propuesta y recurso aprobado.
4. Preparar una demostración técnica **aislada** y un protocolo de medición, sin cargar un motor 3D en el flujo principal ni alterar la navegación de cuatro pestañas.
5. Revisar el material conceptual para formular un encargo de derivados fieles que no dependa de modificar el original ni genere texto incorrecto. No inventar que ya existe un vector o modelo aprobado.

Esta tarea realiza los puntos 1–3. No instala dependencias y no solicita confirmación para continuar los bloques funcionales independientes que el propietario ya autorizó.

## Dónde se exige aprobación de marca

Fuente completa: `referencias/gpt6-v2/extraidos/logo/JJ_Logo_2D_3D_Codex/03_BRIEF_CODEx_LOGO_INTERACTIVO.md`.

- Líneas 12–22: los elementos de carrito, JJ, ruedas, asa, destellos, nombre y lenguaje visual «no se pueden cambiar sin nueva aprobación»; «NO rediseñar la marca al construir su versión 3D».
- Línea 72, B01-L.2: «proponer SVG, iconos y pruebas de tamaño. Entregar capturas y esperar aprobación».
- Línea 74, B01-L.3: «construir vista aislada interactiva y medir rendimiento. Entregar capturas/grabación y esperar aprobación».
- Línea 90: «El usuario ha aprobado tanto el diseño 2D como 3D antes de integrar en la aplicación».
- Línea 78: «No añadir servicios de pago ni dependencias pesadas sin permiso».
- V2, `00_LEER_PRIMERO.md:6`: el icono inferior «NO está aprobado automáticamente como icono final de producción».

Son condiciones explícitas de los documentos de marca, no una necesidad inferida de pedir permiso para cualquier tarea reversible. No deben bloquear tiendas, listas, privacidad o preparación de recetas. La aprobación debe solicitarse sobre propuestas concretas y revisables, antes de integrarlas.

## Siguiente entrega de marca propuesta

1. Entrega de derivados 2D **aislada**: vector editable y recursos de isotipo/icono que mantengan fielmente los siete rasgos obligatorios, junto con muestras claras de referencia/propuesta, exportaciones reales y prueba de las seis escalas. No sustituir `assets/brand/jj-logo-horizontal.png`.
2. Revisión/aprobación 2D conforme B01-L.2. El contrato V2 sigue prevaleciendo; cualquier variación de forma o interpretación del símbolo requiere decisión explícita.
3. Demo 3D aislada conforme B01-L.3: modelo del mismo símbolo, carga solo al elegir 3D, controles 2D/3D/reset/pausa, movimientos limitados, alternativa 2D y mediciones reproducibles de carga/render. Nada de botones que aparenten un 3D inexistente.
4. Revisión/aprobación 3D. Solo después considerar su integración opcional y omitible en Bienvenida; iconos nativos y splash también necesitan su recurso aprobado.

No se han atribuido aprobaciones nuevas a la expresión «sigue» ni al nombre del ZIP. Esa orden sí autoriza avanzar en la construcción general ya encargada, conservando estos límites de identidad.

## Lámina y verificación ejecutada

Archivos nuevos del repositorio:

- `design/brand-original-review/index.html`
- `design/brand-original-review/review.css`

La lámina tiene once referencias al **mismo** PNG: portada, seis tamaños y cuatro contextos de fondo. Los fondos no constituyen variantes nuevas. No tiene JavaScript, formularios, analítica, solicitudes externas o efectos sobre imagen; su CSP limita recursos a CSS/imagen locales. El servidor temporal de QA expuso únicamente esos tres archivos.

Comprobación real en Chromium a 375×812,430×932,1280×1000: **3/3 correctas**. Once imágenes cargadas con dimensiones naturales936×330; seis anchos CSS exactos y proporción conservada; cero desbordamiento horizontal de página, cero errores de consola/ejecución y ninguna animación. La muestra512 mantiene su ancho real y permite desplazamiento contenido con teclado en ventanas pequeñas. El PNG servido y el archivo original conservan su SHA-256.

Script reproducible local: `/workspace/scratch/brand-original-review-qa.cjs`. Evidencia: `/workspace/scratch/brand-original-review-qa-MEvCCt/report.json`; tres capturas PNG en esa misma carpeta, locales únicamente. Inspeccionadas visualmente las capturas375 y1280. No se publicaron imágenes, no se creó preview de marca, no se hicieron commits y no se atribuye validación física de iPhone, VoiceOver, nitidez real a distancia de uso ni aceptación estética.
