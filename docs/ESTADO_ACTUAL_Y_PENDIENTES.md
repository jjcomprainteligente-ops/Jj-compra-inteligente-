# Estado actual de construcción | JJ Compra Inteligente

**Actualizado 14/11/2026. Bloque 03 maestro: registro técnico preparado; publicación y conciliación pendientes. App intacta.** El [inventario único](MAESTRO/INVENTARIO_UNICO.md) reúne fuentes, requisitos y bloqueos. Se conserva la app existente; la rama de integración procede de ABB y main permanece en D22, sin merges ni promoción.

## Estado comprobado

| Área | Resultado y límite |
|---|---|
| Integración | [PR #21](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/21), origen probado/desplegado `78480fd40b4a116d53ebb016f31085785f42a6e6`. Recuperación desde `abb3bca53953e4523af61118e375df90d1a8d416`. Cierre documental separado, sin cambiar inputs de aplicación. |
| Contenido | Fuente privada 150 IDs/750 fichas en 5 idiomas. Runtime 120 V83 + 7 anteriores = 127. Treinta retenidas por estados pendientes/contradictorios, sin cambios de IDs. |
| Fotos | Originales V38–V83 no localizados; cero enlaces definitivos por receta comprobados. No se generan sustitutos. |
| UI y diseño | es/en/de/fr, EUR, Verde Mercado Premium/GPT-6 V2 y PNG oficial exacto. BG en fuente, pendiente en interfaz. Aceptación estética/física separada. |
| Datos locales | Siete documentos y protecciones conservados; 159/159 inputs de app/deps/tests/scripts/assets idénticos. |
| Tiendas/precios | Seis formatos seleccionables y enlaces oficiales; comparador manual. Fuentes de PVP local actual no habilitadas. PR #11 sigue separado para revisión en su bloque. |
| IA y hogares | IA no conectada; B07 sin resultado de matriz nativa y sin cuentas/BFF/sincronización activados. Snapshot 12/11 no sustituye una consulta nueva. |
| Respaldo | Copia privada local y restauración 13/13 correctas. **Copia en carpeta del proyecto confirmada por el propietario; destino e integridad externos no inspeccionados.** |

## Calidad y publicación

Baseline limpio ABB: instalación desde lockfile sin scripts, tipos, importador público, 981/981 unitarias, npm 0 y Expo/export 3 correctos. Sobre `78480fd40b4a116d53ebb016f31085785f42a6e6`: [CI correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43514500031), **298 Chromium correctos/24 omisiones deliberadas y 16/16 WebKit**, cero fallos/intermitencias. Los informes de navegador pertenecen a ese origen y al bundle `c3f6a11fb1f74b5abff79deab50c98a5675a4a8fd993e4e7b84516ef6ffb3ab7`.

Staging `dpl_G3PZ39MHNk7a2ipCuLZBTRymtuWg`, READY, conserva protección. HTTPS revalidado 14/11: cuatro idiomas, 127 recetas y 29 recursos/URLs por hash. [Evidencia de integración](../design/master-integration/reports/integration-verification.json) · [despliegue](../design/master-integration/reports/deployment.json). Acceso temporal por conversación hasta **14/11/2026 21:10:36 UTC**, sin token en Git.

Las capturas iniciales a 375/430 muestran una producción antigua y una staging en bienvenida; no son dos capturas del mismo estado. No se modificó producción. No hay prueba física de iPhone ni publicación de binario firmado acreditadas por este bloque.

## Candidata actual de Bloque 02

`dpl_DizPGJTNWdRhNnRQxXtToDKwdxEZ`, READY/staging protegida, fuente `61793e4833c702a6294eedde1f778cd80dfc074f` en PR #22. Cuatro idiomas, catálogo de 127 recetas y 29 recursos/URLs correctos. Acceso temporal por conversación hasta **15/11/2026 10:52:36 UTC**. [Despliegue](../design/daily-flow/reports/deployment.json) · [recorrido real36/36](../design/daily-flow/reports/hosted-acceptance.json). El apartado anterior conserva las evidencias y candidata del Bloque 01; esta es la entrega actual. El alias principal sigue en `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`, sin promoción.

## Alcance actual y dependencia conservada

El propietario confirmó: «Lo tengo guardado en la carpeta del proyecto sigue». Se registra la copia declarada, sin atribuir una inspección ni una restauración remotas. La verificación independiente de 01.1 permanece abierta antes de modificar la aplicación. [Estado de respaldo](MAESTRO/RESPALDO_ESTADO_PUBLICO.json) · [política](MAESTRO/POLITICA_INTEGRACION_Y_RECUPERACION.md).

La orden posterior de continuar permite comprobar el Bloque 02 sobre la app intacta. [PR #22](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/22), fuente `61793e4833c702a6294eedde1f778cd80dfc074f`: **36/36 locales y 36/36 en staging**, receta primero, raciones, revisión/cancelación, guardado, duplicados, marcado, gasto confirmado, lista vacía y cierre/reapertura. CI remota correcta; no hay cambios de app, dependencias o almacenamiento. [Informe](MAESTRO/BLOQUE02_ENTREGA_Y_AUDITORIA.md) · [guía Safari](MAESTRO/BLOQUE02_PRUEBA_SAFARI_IPHONE.md). **La siguiente acción es la prueba física en iPhone**, con aceptación registrada por el propietario.

## Registro y frontera pública de Bloque 03

Registro privado150/750 y controles por lote preparados sobre la app intacta. Código de auditoría, conservación de planes e índice público de identidades desde la fuente pública autorizada. Las 30 reservadas repiten solo sus cuatro campos ya publicados; no se añaden nuevos estados editoriales privados. El detalle rechazado por revisión automática se conserva en un paquete privado, sin reenviarlo por otra vía.

TypeScript y 987/987 unitarias correctos; exportación restringida y 19/19 pruebas Python correctas. [Informe](MAESTRO/BLOQUE03_CATALOGO_Y_CONCILIACION.md) · [índice autorizado](../referencias/recetas-v83/catalogo-maestro/INDICE_PUBLICO_150.json). Publicación/CI/regresión/staging de esta entrega pendientes. B02 físico y 01.1 mantienen sus límites separados.

## Historial documental conservado

Los apartados siguientes conservan su texto y cifras de entrega. Las afirmaciones de publicación pendiente, M3, fuentes todavía no recibidas o confirmaciones caducadas no constituyen un estado nuevo. B07 vigente: `no_result_native_control_unresolved`; cero aserciones de la matriz contadas. Los nombres B00–B09 son del kit anterior.

<details>
<summary>ARCHIVO_HISTORICO — Estado anterior a la consolidación documental del Bloque 01</summary>

> **Origen final comprobado · 13/11/2026:** [PR #19](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/19), fuente `17d5fbc8adf9f8cbd07f7bd930a19a086931a841` y [CI correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43451697596). Incluye interruptor web centrado, matriz de calidad 8/8 y pulsación/foco 9/9. Preview staging protegida, cuatro idiomas y 29 recursos/URLs verificados; acceso temporal hasta 14/11/2026 a las 14:23:22 UTC. [Registro final](../design/closeout/reports/deployment.json). Los apartados fechados previos conservan su alcance histórico.

> **Publicación comprobada · 13/11/2026:** [PR #19](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/19) y [CI remota correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43439536526) sobre `096330d2b3a3123dc759a1ef0a6123aa67a0d249`. Preview staging `READY`, protegida y verificada en cuatro idiomas, 29 recursos/URLs y 127 recetas. [Evidencia del cierre](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md#publicación-inicial-comprobada-de-esta-entrega). Acceso temporal hasta 14/11/2026 13:08:31 UTC, sin token en Git. Las menciones siguientes a publicación pendiente describen el estado anterior a este cierre.

> **Estado actual · 13/11/2026:** [cierre de seguridad y calidad](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md) sobre la app existente. Audit actualizado: **cero vulnerabilidades**; Expo 58.0.25, correcciones de contraste/áreas y evidencia de B08 en cuatro idiomas. Regresión completa de 298 Chromium y 16 WebKit, 296 escenas de calidad y 24 mediciones anónimas. La última ampliación del filtro inglés pasó por separado 2/2 casos y 74 escenas; exportaciones finales y reproducción limpia con 981 unitarias correctas. GitHub, nueva preview y CI remota de esta entrega siguen pendientes de resultado. La entrega V83 siguiente es la última publicación acreditada, no una prueba de estos cambios. B07, validación física y criterios comerciales no están cerrados.

> **V83 publicada y comprobada · 12/11/2026:** 120 recetas nuevas y las siete anteriores disponibles. Código y fuente seleccionada en [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), fuente compilada `0ea49b597f45b401747e20d7d880c07f670b3073`. Preview staging protegida comprobada en es/en/de/fr, con 127 recetas y 29 recursos/URLs por hash. El enlace temporal se entrega fuera de Git y vence el **13/11/2026 a las 15:56:07 UTC**. Las 30 retenidas y la prueba física siguen pendientes. [Entrega y límites](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md).

# Estado vigente de construcción

Actualizado el 13 de noviembre de 2026. Este inventario distingue código construido, comprobación técnica, aceptación visual y funciones condicionadas. Las auditorías y entregas fechadas anteriores se conservan como historial.

## Seguridad y calidad · 13/11/2026

Se conserva la arquitectura local, Verde Mercado Premium, logo, idiomas y siete documentos con sus protecciones. El override acotado de minimatch se contrastó con 31.824 comparaciones del uso real de Expo, sin diferencias; Expo pasa al parche 58.0.25, dentro de SDK 58. El audit actualizado queda en cero vulnerabilidades y la comprobación oficial Expo es correcta. Los recuentos de tres o cinco avisos en apartados anteriores describen sus entregas históricas.

Se corrigen el color activo del interruptor web, el contraste de botones pulsados y las áreas de interacción afectadas. La matriz completa pasó 298 Chromium y 16 WebKit; la auditoría de calidad, 8 casos y 296 escenas, con cero fallos medidos de contraste y mínimo AA de 24 px. Dos observaciones del filtro inglés de 41,45×44 px motivaron una última corrección a 44 px. Pasó por separado en el compilado final: 2/2 casos ingleses, 74 escenas y cero observaciones bajo 44 px. Se completaron 40 estados pulsados, cinco calibraciones, una prueba de foco con Tab real y 24 ejecuciones de rendimiento anónimo. Estas comprobaciones no son certificación global WCAG ni prueba física.

La reproducción limpia con dos workers obtiene 981/981 unitarias en 27 archivos, sin necesitar el original privado de 150 recetas. El workflow preparado fija acciones por SHA, solo lee contenido y no usa secretos o despliegues. La exportación web de la copia limpia y las exportaciones finales web/iOS/Android son correctas. Su ejecución remota, la publicación GitHub y la nueva preview deben acreditar su resultado antes de marcar esta entrega como publicada. [Informe completo y distinción entre fuentes](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md); informes reunidos en `design/closeout/reports/`.

B07 sigue abierto: la única solicitud de la matriz original del 12/11 a las 20:33 UTC no devolvió resultado y su espera se interrumpió a las 21:02 UTC, sin reintento por otra vía. No se cuentan pruebas SQL ni ROLLBACK. La revisión posterior solo de lectura observó las 16 tablas examinadas vacías, sin objetos temporales, con RLS/FORCE y permisos conservados. No hay cuentas/BFF, RPC, invitaciones o sincronización construidos/activados; ese trabajo continúa tras resolver la prueba real de permisos y las configuraciones de correo/servidor.

## Integración de recetas V83 · 12/11/2026

Recibidos y auditados el ZIP acumulado de **150 recetas/750 fichas en es/en/de/fr/bg** y el XLSX del lote 141–150. El manifiesto de 13 archivos y la coincidencia XLSX/JSON se comprobaron en auditoría documental. La [integración V83](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md) incorpora en código **120 recetas nuevas más siete anteriores, 127 registros**; conserva sus IDs y la firma histórica de las siete. BG queda en las fuentes sin activar una quinta interfaz.

GitHub es público: solo se publica la [selección reproducible de 120 recetas y cinco idiomas](../referencias/recetas-v83/README.md), con 600 fichas cuyos valores originales se comprobaron íntegramente. El ZIP completo de 150 se conserva localmente en `referencias/recetas-v83/originales/`, ignorado por Git. Las 30 retenidas no se exponen dentro de otro archivo ni en las traducciones compiladas. La reproducción y las pruebas de CI funcionan desde la selección pública sin necesitar el original local.

Las posiciones 11–20 y 111–120 tienen estados contradictorios; 31–40 siguen pendientes. La pregunta al propietario aún no tiene respuesta: esas 30 no se activan. Una indicación general de continuar no confirma cata o revisión operativa. La carbonara mantiene la condición de huevo/yemas pasteurizados y su advertencia, sin certificación. No se estiman los tiempos desconocidos: son 90 en la fuente completa y 80 entre las 120 seleccionadas. Las partes/unidades se conservan visibles, y las tres sales sin medida y acompañamientos sin cantidad no generan productos automáticos.

La implementación mantiene revisión/confirmación, avisos localizados, diseño/logo y los siete documentos con sus protecciones. Pagina catálogo y sustituciones de 20 en 20 y opciones de exclusión de ingredientes de 40 en 40. **TypeScript, 981 pruebas unitarias —cero fallidas u omitidas, 27 archivos— y exportaciones web/iOS/Android correctos.** No hay dependencias nuevas ni cambios de versión; el audit de esta entrega mantiene tres avisos moderados de herramientas y cero altos/críticos.

La regresión V83 pasó **298 casos Chromium**, con 24 omisiones deliberadas de duplicados y artefactos anteriores intactos. WebKit pasó **16/16 casos**, cero omitidos o intermitentes: recorrido diario y recetas nuevas en cuatro idiomas y dos tamaños CSS, con 120 capturas lógicas. Se comprobaron la transferencia exacta revisada, cancelación sin cambios, ingredientes al gusto fuera de la compra, paginación, presupuesto conservado y persistencia de un ID V83. [Informes de la entrega](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md#comprobaciones-de-esta-entrega).

Código y fuente seleccionada publicados en [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), antes de desplegar la fuente `0ea49b597f45b401747e20d7d880c07f670b3073`. Staging READY `dpl_Ba9JkTFd9o1pNG6TknGriMgMxVGs`, origen protegido https://jj-compra-inteligente-np116q25a-cmj2hwhc6b-1051.vercel.app y protección `all_except_custom_domains` conservada. Verificación remota correcta en es/en/de/fr: 29 recursos/URLs por hash y catálogo de 127 recetas con `JJ-E03-001` comprobados. [Informe remoto](../design/v83/reports/hosted-verification.json) · [despliegue](../design/v83/reports/deployment.json). El enlace se entrega fuera de Git y vence el **13/11/2026 a las 15:56:07 UTC**. Los resultados del piloto iPhone siguiente, fuente `54fc7efe`, se conservan como entrega anterior. La instalación nativa, prueba física, aceptación visual y B07.2 siguen pendientes; WebKit Linux no acredita un iPhone físico.

## Piloto iPhone anterior · 11/11/2026

El propietario ha fijado **menú → revisión de ingredientes → lista → compra → presupuesto/gasto confirmado** como próximo recorrido de aceptación. Se prepara sobre la app existente, sin rehacer diseño ni activar cuentas/hogares. La [guía del piloto diario](IPHONE_PILOTO_RECORRIDO_DIARIO.md) contiene pasos, resultados esperados y registro físico pendiente.

Los perfiles EAS `iphone-preview` y `iphone-testflight` están preparados; no existe todavía binario instalable, envío a TestFlight ni ejecución en un iPhone físico. La preview protegida para Safari está publicada y verificada desde `54fc7efe3980f4295f3e873aa7710276903c3f7a`, [PR #12](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/12); su enlace temporal se entrega por la conversación y vence el 12/11/2026 a las 22:56:56 UTC. Un motor WebKit con tamaños móviles en Linux no sustituye esa aceptación.

En esta preparación pasaron TypeScript, 963 pruebas unitarias, la comprobación oficial de dependencias de Expo y las exportaciones web/iOS/Android. El audit actualizado registra **tres avisos moderados**, cero altos y cero críticos, en herramientas de Expo/minimatch; los recuentos anteriores se conservan como historia. La regresión completa pasó 298 casos Chromium con 24 omisiones duplicadas deliberadas. Los ocho casos WebKit focalizados pasaron en cuatro idiomas y dos tamaños CSS, con 80 capturas y ocho informes; verificaron una receta de dos a cuatro personas, un ingrediente excluido, coincidencia exacta de los ingredientes revisados/guardados y persistencia del recorrido. [Informes técnico](../design/iphone-pilot/reports/technical-verification.json), [Chromium](../design/iphone-pilot/reports/chromium-regression.json) y [WebKit](../design/iphone-pilot/reports/webkit-daily-journey.json). La verificación remota pasó en cuatro idiomas y 29 recursos/URLs por hash, manteniendo los flujos locales y la protección `all_except_custom_domains`; [informe remoto](../design/iphone-pilot/reports/hosted-verification.json) y [despliegue](../design/iphone-pilot/reports/deployment.json).

En aquel commit estaban disponibles las siete recetas iniciales y seguían pendientes las 150 del propietario; su recepción y preparación V83 se describen arriba. Se conservan las siete claves locales y la protección de escritura, sin datos de pruebas preinstalados. B07.2 sigue abierto y separado de este piloto local; los apartados siguientes incluyen sus avances y publicaciones históricas.

## Funciones locales construidas

- Bienvenida, idioma del dispositivo y elección manual persistente en español, inglés, alemán y francés; formatos locales y compras en euros.
- Cuatro pestañas y las 16 vistas de preparación V2. Los nueve estados de la galería se identifican como ejemplos; no representan servicios o permisos activados.
- Listas, productos, cantidades y unidades, categorías, revisión de duplicados, presupuestos y deshacer. Guardado con protección frente a datos corruptos, conflictos y resultados inciertos.
- Búsqueda entre productos guardados y ficha local. Voz/cámara opcionales en navegadores compatibles tras consentimiento y gesto; alternativa manual y limpieza de recursos.
- Menús de cinco cenas, personas, sustitución, filtros y revisión de ingredientes antes de añadir. El código conserva las siete recetas iniciales e integra 120 V83; unitarias, exportaciones y matrices de navegador correctas, con preview V83 protegida publicada y comprobada.
- Gastos confirmados introducidos por la persona e historial, separados de estimaciones y productos marcados.
- Comparador manual de formatos equivalentes con tienda, fecha, fuente y cobertura explícitas; sin precios comerciales importados.
- Preferencias y avisos internos locales, exportación JSON y borrado independiente por categoría con confirmación. No hay restauración automática de backups.
- Selección de una, varias o todas las seis tiendas del piloto, conservando favoritas anteriores. Enlaces oficiales separados por formato, sin transmitir listas ni carritos. Compra y pago en el comercio externo.
- Compartir una copia revisada de una lista en texto: pendientes por defecto, opción de incluir comprados, sin notas, precios, presupuesto ni identificadores. Web Share o descarga TXT explícita; panel nativo preparado sin afirmar recepción. No sincroniza hogares.

## Bloques del kit

| Bloque | Construcción actual | Criterio de cierre pendiente |
|---|---|---|
| B00 · Auditoría | Repositorio y seis paquetes originales recuperados y contrastados; historia conservada. | Mantener trazabilidad al integrar nuevas entregas. |
| B01 · Identidad | Dirección V2, paleta y raster oficial exacto; lámina técnica aislada de seis tamaños y fondos. | SVG fiel, transparencia, isotipo, iconos, variantes y propuesta 3D por etapas. No se modifica ni sustituye el original sin aprobación. |
| B02 · UX | Pantallas locales y componentes con cuatro idiomas y estados; referencia canónica conservada. | Aceptación estética del propietario/ChatGPT y contraste/usabilidad completos en dispositivo. |
| B03 · Prototipo iPhone | App Expo y exportaciones web/iOS/Android; navegador a varios tamaños y motor WebKit. | Instalación/ejecución física, teclado, zonas seguras, gestos, Safari y lectores nativos. Exportar no acredita este criterio. |
| B04 · Listas y presupuesto | Funciones locales, revisión y persistencia construidas; compartir texto añadido. | Aceptación física y uso real con listas del piloto. |
| B05 · Menús | Motor local, filtros, cantidades y revisión construidos; V83 integra 120 nuevas más siete anteriores, con unitarias, exportaciones y navegador correctos. Fuente pública reproducible de 120 × 5; original de 150 conservado localmente y excluido de Git. Búsquedas con ChatGPT fuera de JJ. | Aclarar las 30 retenidas. No inventar tiempos, medidas ni aprobaciones. Una colección personal editable sería una ampliación separada, no un requisito omitido del encargo original. |
| B06 · Comparador | Observaciones y comparación manual; selección de tiendas y salida externa construidas. | Fuentes comerciales autorizadas/localizadas antes de importar precios o afirmar ahorro/stock. |
| B07 · Cuentas y hogares | B07.1: contratos y proyección probados. B07.2: proyecto Supabase gratuito UE, esquema/RLS aplicados; grants y HTTP anónimo comprobados. | Solicitud nativa de la matriz sin resultado; cero aserciones contadas. Cuentas/BFF, invitaciones, RPC, migración y sincronización todavía pendientes de construcción y validación. [Estado del control y límites](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md#b07-estado-real-del-control-nativo). |
| B08 · QA y piloto | Suites estáticas, unitarias y de navegador; contraste/áreas, pulsación, calibración y rendimiento anónimo añadidos. Audit actualizado con cero vulnerabilidades conocidas. [Entrega de calidad](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md). | Publicar y verificar la entrega comprobada. Piloto físico, revisión humana de accesibilidad, distribución y feedback de personas siguen pendientes; no hay certificación global WCAG. |
| B09 · Comercio | Salida a páginas oficiales sin datos de lista ni pago dentro de JJ. | Acuerdos, cobertura, derechos de datos y responsabilidades antes de otras integraciones. No hay pedidos, stock ni pagos procesados por JJ. |

## Verificación de la entrega de tiendas y compartir

TypeScript y 816 pruebas unitarias correctos. Exportaciones web/iOS/Android completadas. La matriz final de navegador, publicación y sus resultados se documentan en [la auditoría de esta pareja](TIENDAS_COMPARTIR_Y_AUDITORIA.md). La construcción de estas funciones no cierra automáticamente los criterios físicos, visuales o comerciales de la tabla.

## Lo que todavía requiere trabajo de construcción

1. Completar las etapas de recursos de marca con revisión y aprobación de las propuestas; la lámina del raster original no es un SVG ni un icono nuevo.
2. Resolver las 30 recetas retenidas. V83 ya está publicada y comprobada con las 120 seleccionadas, preservando los IDs y las siete recetas anteriores. Una biblioteca personal editable y la restauración automática de backups son ampliaciones opcionales separadas; la auditoría del encargo original no las identifica como requisitos obligatorios omitidos.
3. Completar la prueba dinámica de permisos de la base B07 existente y después construir y validar cuentas/BFF, RPC, invitaciones, migración y sincronización, con SMTP y secretos de servidor adecuados. Compartir texto no sustituye ese trabajo.
4. Completar distribución y validación física con feedback real. No se publica un resultado de piloto sin ejecutarlo.
5. Incorporar datos de comercios únicamente cuando existan fuentes y permisos adecuados; las páginas oficiales abiertas no constituyen un feed autorizado.

No se presenta la aplicación ni B00–B09 como terminados por disponer de una preview o por superar las pruebas de los recorridos existentes.


### Publicación verificada — 11/11/2026

Fuente compilada: `c0c7a312e5ad91313a059c25c8594a12ea48a6dc`, [PR #8](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/8). Incluye ambos padres de integración `338ba24` y `2ae8d27`; no se sustituyó el trabajo previo. Staging READY: `dpl_5HaNVgJxEtpz9zX2gpWScLFnXRWU`, URL base https://jj-compra-inteligente-3y5pjf63u-cmj2hwhc6b-1051.vercel.app . Protección conservada, sin promoción a producción.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash. Comprueba selección de seis tiendas, contratos de navegación externa con mock sin ir a los comercios, copia TXT exacta sin notas privadas, retorno de foco, siete documentos intactos al compartir, backup exacto, borrado confirmado aislado, idiomas persistentes y lámina de marca con PNG original/CSP. El enlace temporal se entrega fuera de GitHub y vence el 12/11/2026 a las 11:21:05 UTC. Informe público: `design/stores-sharing/reports/hosted-verification.json`; capturas y credencial locales.

B07 tiene una propuesta concreta separada en [PR #9](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/9): documento y contrato JSON de 20 operaciones; no activa servicios ni modifica la app. Antes de activar cuentas/hogares deben aprobarse proveedor/proyecto, tratamiento y región, autenticación/correo, costes y retención, conforme a AGENTS.md:18 y B07 original:17. Las 150 recetas, derivados de marca aprobados, aceptación visual y validación física siguen pendientes; cinco avisos npm moderados continúan abiertos.


### Avance B07 — 11/11/2026

El propietario autorizó Supabase en la UE, máximo 0 €, y continuar con la organización conectada para cambiar la cuenta después. Proyecto JJ independiente creado en Frankfurt, free, cotización mensual 0. B07.1 tiene 20 validadores de solicitud y proyección inmutable sin notas/precios/presupuesto; 147 nuevas pruebas, 963 unitarias totales y TypeScript correctos.

B07.2 tiene 14 tablas con RLS/FORCE y dos migraciones aplicadas; clientes sin DML, SELECT autenticado condicionado, lector NOLOGIN/NOBYPASS y helper privado acotado para sesiones reales de Auth. Catálogo/grants y cuatro denegaciones HTTP reales comprobados; base vacía, sin usuarios ni datos de prueba. La revisión estática independiente corrigió getters, historia/épocas, padre eliminado, namespace y coherencia de nombres.

**B07.2 permanece abierto:** la suite dinámica SQL/RLS no llegó a ejecutarse: dos confirmaciones de Supabase caducadas, no resultados de pruebas. No se elude el control ni se atribuye éxito a sus casos escritos. Hay que completar la confirmación nativa, ejecutar la transacción de fixtures y comprobar ROLLBACK. La aplicación local conserva sus siete claves, diseño, logo y dependencias; no hay login/BFF, invitaciones, importación o sincronización activados. El SMTP predeterminado no acredita registro público. Diez INFO de RLS privado sin políticas de cliente son acceso denegado deliberado; índices sin uso corresponden a base vacía, y los dos FK sin cobertura se corrigieron. Siguen cinco avisos npm moderados de herramientas.

[Entrega, auditoría y criterios pendientes](B07_BASE_SEGURA_Y_AUDITORIA.md). Evidencias en `design/b07/reports/`; pruebas transaccionales en `supabase/tests/household_security.sql`. GitHub precede a la nueva vista staging protegida. Se mantienen la auditoría por parejas, las recetas del propietario pendientes y la validación física/visual separada.


### Regresión web final de B07.1–2 — 11/11/2026

298 pruebas Chromium correctas, cero inesperadas/intermitentes, 24 omisiones duplicadas deliberadas; 120 capturas de recorridos y 300 de cobertura V2 en cuatro idiomas, con artefactos anteriores intactos. La matriz SQL no se cuenta como ejecutada. [Informe](../design/b07/reports/browser-summary.json).


### Publicación y verificación remota — 11/11/2026

Fuente compilada `3fa95b99910617121e513533b265be5a8ecee047`, [PR #10](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/10), rama `codex/b07-base-segura`. Commit con dos padres: conserva `914fa2e` y la propuesta `4e0fb2a`; árbol publicado verificado contra el índice local. GitHub recibió el código antes de publicar la vista.

Vercel staging READY `dpl_9cxY4peum9BMcEneBzwnSnPA18WJ`, origen https://jj-compra-inteligente-4ahqufx66-cmj2hwhc6b-1051.vercel.app . Protección del proyecto conservada. Compilado web SHA-256 `6f57257d52de2a76106a4d41fee185dddeb0b0a935283748403eccd905e45d74`; logo original intacto. Transporte Brotli y 23 archivos publicados; no fuentes de app, paquetes nativos, fixtures, listas del propietario ni credenciales.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash, incluidas selección de tiendas, copia TXT revisada y foco, datos locales y exportación/borrado aislado, preferencias de idioma y lámina de raster con CSP. Informe público `design/b07/reports/hosted-verification.json`; imágenes y URL de acceso temporales fuera de Git. El enlace compartido vence el **12/11/2026 a las 17:28:39 UTC**.

La vista sigue siendo la aplicación local: B07.1 está construido/probado, B07.2 sigue abierto por la confirmación caducada de la matriz SQL. Esta publicación no activa cuentas, invitaciones, BFF, importación ni sincronización y no sustituye su prueba de permisos. El PR permanece borrador.


## B07.2 · Corrección de permiso Auth — ejecución confirmada, 11/11/2026

La primera ejecución confirmada de la matriz original e8cc... falló con 42501 porque el GRANT inicial no dio USAGE efectivo de Auth al lector. Se corrigió mediante migración incremental 20261111190357: puente privado de subject, propietario postgres y EXECUTE solo al lector; el gate de sesión/cuenta/membresía/hogar sigue obligatorio y el lector permanece sin Auth USAGE. No se ampliaron permisos de tablas ni se activaron cuentas.

La regresión de lectura pasó diez condiciones y los roles/ACL efectivos; se comprobó su JSON expresamente, no solo ausencia de error. Cero filas en Auth y 14 tablas JJ, cero objetos temporales. La batería completa posterior tuvo dos confirmaciones nativas caducadas; B07.2 continúa abierto. La autorización del propietario ya está dada y no se vuelve a pedir por chat. Los informes iniciales son históricos. [Corrección, evidencia y límites](B07_CORRECCION_PERMISO_AUTH.md).


### Publicación de la corrección — 11/11/2026

Código y evidencia en [PR #10](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/10), fuente `0f6d65a9d700babb2dc1e20f09cf56d10843fc0d`. Árbol remoto verificado con el índice local; el commit exacto se recuperó por el conector autenticado de GitHub cuando el transporte Git de consola pidió autenticación. No se copiaron claves ni se cambió el remoto. Los inputs de la app son idénticos a la exportación revisada.

Staging READY `dpl_2xBghJgvxxnS5qvNwBsjw9N3hHVT`, origen https://jj-compra-inteligente-aqqtwd6or-cmj2hwhc6b-1051.vercel.app . Publicación protegida y comprobada en es/en/de/fr con 29 recursos/URLs por hash, conservando flujo local, copia de lista, preferencias, backup/borrado aislado y raster oficial. Informe `design/b07/reports/policy-actor-lookup-hosted.json`; URL temporal y capturas fuera de Git. El enlace de acceso vence el 12/11/2026 a las 19:06:23 UTC.

La corrección está aplicada en Supabase y su regresión acotada de lectura pasó. La matriz completa después de corregir sigue sin resultado por confirmación nativa caducada; B07.2 permanece abierto y el PR continúa borrador. No se activan cuentas ni sincronización. La autorización del propietario ya está registrada.

</details>
