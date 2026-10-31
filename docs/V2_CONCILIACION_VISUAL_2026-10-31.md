# Conciliación visual GPT-6 V2 — 31/10/2026

Revisión de solo lectura realizada sobre `/workspace/jjcompraintelwgiemt`, el resto accesible de `/workspace` y `/tmp`. No se modificó código, diseño, historial ni originales.

## Resultado

Los originales GPT-6 V2 y el kit Premium no están presentes en los archivos accesibles. `/tmp/codex-remote-attachments` ya no existe.

Se buscaron nombres V2/Premium/CANON/LOGO y se calcularon hashes de 489 imágenes raster accesibles y de las imágenes contenidas en 20 ZIP de entregas, copias previas y trazas. No se encontraron las dos firmas conocidas:

- JPG original: `7500541f32e14292c013d80f6c8bbc43af87a94a7b646103d6b20289bacb47d0`.
- Recorte horizontal PNG: `c6aa4ebde1932d0c3953f30a6bc570a95178b7c37c85b59af46c5408927ed8b0`.

Tampoco hay imágenes de 374 × 754 ni 936 × 330. Las coincidencias «v2» de `design/b01` son la propuesta antigua Verde Noche y no las pantallas canónicas GPT-6 V2. Las copias ZIP anidadas de B06 son las mismas copias previas revisadas por separado. El PDF antiguo de `referencias/` contiene el estudio de fase 2, no la auditoría V2 nueva.

Quedaron fuera de la búsqueda `node_modules`, directorios Git/configuración/credenciales, distribuciones generadas y `/tmp/codex-daemon-1000`. No se leyó contenido de credenciales.

## Diferencias confirmadas en el código y la evidencia actual

Se abrieron `src/app/components/Brand.tsx`, `src/app/theme.ts`, `src/app/ShoppingApp.tsx`, `src/app/screens/HomeList.tsx` y la captura `design/i18n/evidence/run-2026-10-31T14-43-39-214Z-cyg0Cc/screenshots/es-375-home.png`.

La captura confirma monograma M3 circular JJ amarillo, cabecera crema, título «Tu compra, bajo control» y pestaña activa verde claro. No es la identidad visual V2 que consta en la auditoría heredada.

| Token | Código actual | V2 según auditoría previa |
|---|---|---|
| background | #FFF9EF | #FFF8E7 |
| primary | #167347 | #167347 |
| deep | #214633 | #103F2D |
| ink | #253D2B | #143E2C |
| muted | #5C6651 | #566B5F |
| accent | #F2C94C | #FFD24A |
| soft | #F2F2DF | #E6F1E6 |

Los valores V2 y la cabecera verde profundo/pestaña amarilla se toman del registro anterior: no se ha podido volver a verificar su manifiesto original. No confundir esa fuente documental con una comparación nueva píxel a píxel.

El código actual mantiene cuatro pestañas y Perfil desde avatar, compatibles con el esquema registrado de V2. Incluye bienvenida/idioma, Inicio, Mi compra, Ahorro, Menús, Perfil, presupuesto como hoja, receta y revisión de ingredientes como paneles, y comparadores propios. `src/app/types.ts` no contiene pantallas de voz, escáner, tiendas, historial o notificaciones. No existe una implementación completa de las dieciséis pantallas canónicas.

## Cobertura de las dieciséis pantallas objetivo

La lista de objetivos procede del registro de la auditoría anterior. La existencia y forma de las vistas actuales se comprobaron en el código; los PNG canónicos todavía deben recuperarse para validar cada equivalencia visual.

| Objetivo canónico V2 | Estado comprobado en la base actual | Referencia del código |
|---|---|---|
| Bienvenida | Existe bienvenida con selección de idioma; utiliza M3 y el diseño anterior. | `src/app/screens/LanguageScreen.tsx`, `WelcomeScreen` |
| Inicio | Existe; estructura «Tu compra, bajo control», entrada rápida, presupuesto y resumen. La captura antigua muestra cabecera crema. | `src/app/screens/HomeList.tsx`, `HomeScreen` |
| Mi compra | Existe lista local, altas/edición/marcado/borrado y presupuesto. No se ha cotejado con el PNG V2. | `src/app/screens/HomeList.tsx`, `ListScreen` |
| Ahorro | Existe resumen de lista y acceso a comparadores manuales. No hay fuentes comerciales conectadas. | `src/app/screens/SecondaryScreens.tsx`, `SavingsScreen` |
| Menús | Existe planificación determinista local y selección de recetas. | `src/app/screens/MenuWorkspace.tsx` |
| Detalle de receta | Existe como panel con ingredientes, pasos y advertencia de alérgenos. No equivale automáticamente a la composición canónica. | `src/app/screens/MenuWorkspace.tsx`, panel `recipe` |
| Ingredientes | Existe panel de revisión editable, unidades/cantidades y duplicados antes de confirmar. | `src/app/screens/MenuWorkspace.tsx`, panel `review` |
| Buscar producto | No hay pantalla de búsqueda de catálogo. La entrada/edición de texto de Mi compra es un formulario manual. | `src/app/ShoppingApp.tsx`, editor `item` |
| Detalle de producto | No hay pantalla canónica de producto; existe edición manual de un artículo y formularios de observación de precios. | `src/app/ShoppingApp.tsx`, `src/app/screens/PriceWorkspace.tsx` |
| Voz | No hay pantalla ni reconocimiento de voz integrado. No se solicita permiso de micrófono. | `src/app/types.ts`; rutas actuales de `ShoppingApp.tsx` |
| Escáner | No hay pantalla ni lectura de códigos/cámara integrada. | `src/app/types.ts`; rutas actuales de `ShoppingApp.tsx` |
| Mis tiendas | No hay módulo de tiendas favoritas; escribir una tienda en una comparación es un dato manual distinto. | `src/app/types.ts`, `src/app/screens/PriceWorkspace.tsx` |
| Presupuesto | Existe como hoja de edición asociada a una lista. No hay entidad de pagos confirmados. | `src/app/ShoppingApp.tsx`, editor `budget`; `src/domain/shopping.ts` |
| Historial | No hay pantalla ni historial de pagos/compras confirmadas. Las listas y el marcado actuales no deben presentarse como comprobantes de pago. | `src/app/types.ts`, `src/domain/shopping.ts` |
| Perfil / Hogar | Existe Perfil local e idioma; la tarjeta Hogar explica que compartir no está disponible. No hay cuentas ni sincronización. | `src/app/screens/SecondaryScreens.tsx`, `ProfileScreen` |
| Notificaciones | No hay pantalla, feed ni servicio de notificaciones. Mensajes locales de error/confirmación no equivalen a ese módulo. | `src/app/types.ts`; rutas actuales de `ShoppingApp.tsx` |

Los nueve estados B03.14 registrados (lista vacía, sin precios, sin conexión, error de red, permiso de micrófono, permiso de cámara, sin código de barras, conflicto de producto y confirmación) también deben conciliarse al recuperar los PNG. La base contiene estados vacíos, errores locales y confirmaciones, pero esta revisión no certifica la cobertura ni la fidelidad de los nueve estados canónicos.

## Matriz de identidad y composición

| Elemento | Estado actual verificado | Objetivo registrado V2, pendiente de reabrir original |
|---|---|---|
| Marca | SVG circular JJ M3 en `Brand.tsx`. | Logo original del carrito y denominación oficial; reutilizar el binario exacto. |
| Cabecera | Fondo crema heredado de `c.background`, con marca y avatar. | Cabecera verde profundo. |
| Pestaña activa | Icono sobre verde suave; etiqueta verde. | Resaltado amarillo. |
| Inicio | Título «Tu compra, bajo control», presupuesto y continuación de lista. | «¿Qué compramos hoy?», búsqueda y categorías con la composición canónica. |
| Navegación | Cuatro pestañas y Perfil desde avatar. | Conservar cuatro pestañas; no añadir Perfil como quinta. |
| Tipografía | Manrope, cuerpo legible y componentes adaptables. | Mantener tipografía permitida y comprobar la composición sin reducir accesibilidad para imitar un PNG. |

## Continuación segura

1. Importar y verificar primero la base actual en GitHub, conservando todos los commits y documentos remotos.
2. Recuperar los dos ZIP nuevos, la auditoría PDF y la composición de dieciséis pantallas mediante adjuntos originales; conservar los binarios con SHA-256 y un manifiesto. No reconstruir el logo ni usar imágenes del estudio antiguo como sustituto.
3. Registrar una matriz pantalla por pantalla con original V2, captura actual, diferencia, referencia de archivo y aceptación. Comparar con contenido y dimensiones equivalentes.
4. Corregir en una rama visual pequeña marca exacta, tokens, cabecera, navegación y composición de las pantallas existentes, manteniendo traducciones, dominio y almacenamiento. No copiar la densidad de una imagen a costa del tamaño de texto o los objetivos táctiles.
5. Separar las pantallas que dependan de nueva funcionalidad. No presentar cámara, voz, pagos, fuentes de supermercados, sincronización o IA como activos por reproducir su diseño.
6. Ejecutar pruebas de regresión y capturas en los cuatro idiomas; mostrar el commit exacto en el informe de la preview. Auditar después de cada pareja de bloques y mantener pendiente la validación en un iPhone físico.

No se propone aplicar los colores aislados ni un logo aproximado antes de recuperar la referencia, porque eso produciría otra interpretación visual en lugar de la fidelidad solicitada.

## Entregas pequeñas y auditoría

| Entrega | Resultado revisable | Puerta de salida |
|---|---|---|
| G00 — Base GitHub | Código, pruebas y documentos preservados, con commit visible; listado de artefactos excluidos. | Importación comprobada frente al origen y remoto. |
| V00 — Referencias y discrepancias | Originales recuperados, manifiesto de hashes y matriz por pantalla/estado. | Archivos exactos accesibles; no basta el recuerdo de la auditoría. |
| V01 — Identidad y estructura existente | Logo exacto, tokens, cabecera y navegación en una rama corta, preservando la lógica actual. | Capturas es/en/de/fr y verificación de contraste, textos, acciones y persistencia. |
| V02 — Composición de pantallas existentes | Inicio, Mi compra, Ahorro, Menús, Perfil y detalles existentes cotejados con V2. | Comparación visual documentada, pruebas de regresión y preview vinculada al commit. |
| Auditoría V01 + V02 | Revisión completa de archivos cambiados, pruebas, seguridad, almacenamiento, accesibilidad y evidencia. | Hallazgos corregidos o registrados como pendientes; aprobación visual del propietario sin declararla por una prueba automática. |
| V03 y posteriores | Pantallas/funciones ausentes en bloques separados, según dependencia y especificación. | Sin simulación de integraciones ni cambios contables implícitos; nueva auditoría después de cada pareja. |

Los avisos de dependencias y la prueba física en iPhone documentados en la entrega multilingüe permanecen abiertos. Esta conciliación no añade garantías de ausencia total de fallos.
