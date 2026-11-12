> **Publicación V83 autorizada · 12/11/2026:** el propietario confirmó expresamente «Si publica las 120» al responder a la publicación de recetas, cinco traducciones y manifiestos en el repositorio público. Se reanuda GitHub primero y después la preview protegida. Las otras 30 siguen retenidas por sus estados editoriales. [Registro de autorización y bloqueo anterior](V83_PUBLICACION_PENDIENTE_DE_AUTORIZACION.md).

# Estado vigente de construcción

Actualizado el 12 de noviembre de 2026. Este inventario distingue código construido, comprobación técnica, aceptación visual y funciones condicionadas. Las auditorías y entregas fechadas anteriores se conservan como historial.

## Integración de recetas V83 · 12/11/2026

Recibidos y auditados el ZIP acumulado de **150 recetas/750 fichas en es/en/de/fr/bg** y el XLSX del lote 141–150. El manifiesto de 13 archivos y la coincidencia XLSX/JSON se comprobaron en auditoría documental. La [integración V83](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md) incorpora en código **120 recetas nuevas más siete anteriores, 127 registros**; conserva sus IDs y la firma histórica de las siete. BG queda en las fuentes sin activar una quinta interfaz.

GitHub es público: solo se publica la [selección reproducible de 120 recetas y cinco idiomas](../referencias/recetas-v83/README.md), con 600 fichas cuyos valores originales se comprobaron íntegramente. El ZIP completo de 150 se conserva localmente en `referencias/recetas-v83/originales/`, ignorado por Git. Las 30 retenidas no se exponen dentro de otro archivo ni en las traducciones compiladas. La reproducción y las pruebas de CI funcionan desde la selección pública sin necesitar el original local.

Las posiciones 11–20 y 111–120 tienen estados contradictorios; 31–40 siguen pendientes. La pregunta al propietario aún no tiene respuesta: esas 30 no se activan. Una indicación general de continuar no confirma cata o revisión operativa. La carbonara mantiene la condición de huevo/yemas pasteurizados y su advertencia, sin certificación. No se estiman los tiempos desconocidos: son 90 en la fuente completa y 80 entre las 120 seleccionadas. Las partes/unidades se conservan visibles, y las tres sales sin medida y acompañamientos sin cantidad no generan productos automáticos.

La implementación mantiene revisión/confirmación, avisos localizados, diseño/logo y los siete documentos con sus protecciones. Pagina catálogo y sustituciones de 20 en 20 y opciones de exclusión de ingredientes de 40 en 40. **TypeScript, 981 pruebas unitarias —cero fallidas u omitidas, 27 archivos— y exportaciones web/iOS/Android correctos.** No hay dependencias nuevas ni cambios de versión; el audit de esta entrega mantiene tres avisos moderados de herramientas y cero altos/críticos.

La regresión V83 pasó **298 casos Chromium**, con 24 omisiones deliberadas de duplicados y artefactos anteriores intactos. WebKit pasó **16/16 casos**, cero omitidos o intermitentes: recorrido diario y recetas nuevas en cuatro idiomas y dos tamaños CSS, con 120 capturas lógicas. Se comprobaron la transferencia exacta revisada, cancelación sin cambios, ingredientes al gusto fuera de la compra, paginación, presupuesto conservado y persistencia de un ID V83. [Informes de la entrega](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md#comprobaciones-de-esta-entrega).

La subida a GitHub y la nueva publicación V83 siguen pendientes. Los resultados y la publicación del piloto iPhone siguiente corresponden a `54fc7efe` y se conservan como entrega anterior. La instalación nativa, prueba física, aceptación visual y B07.2 siguen pendientes; WebKit Linux no acredita un iPhone físico.

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
- Menús de cinco cenas, personas, sustitución, filtros y revisión de ingredientes antes de añadir. El código conserva las siete recetas iniciales e integra 120 V83; unitarias, exportaciones y matrices de navegador correctas, con nueva publicación todavía pendiente.
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
| B05 · Menús | Motor local, filtros, cantidades y revisión construidos; V83 integra 120 nuevas más siete anteriores, con unitarias, exportaciones y navegador correctos. Fuente pública reproducible de 120 × 5; original de 150 conservado localmente y excluido de Git. Búsquedas con ChatGPT fuera de JJ. | Publicar y verificar V83 y aclarar las 30 retenidas; validar por separado cualquier colección editable/persistente del usuario. No inventar tiempos, medidas ni aprobaciones. |
| B06 · Comparador | Observaciones y comparación manual; selección de tiendas y salida externa construidas. | Fuentes comerciales autorizadas/localizadas antes de importar precios o afirmar ahorro/stock. |
| B07 · Cuentas y hogares | B07.1: contratos y proyección probados. B07.2: proyecto Supabase gratuito UE, esquema/RLS aplicados; grants y HTTP anónimo comprobados. | Matriz dinámica SQL pendiente de confirmación de Supabase; cuentas/BFF, invitaciones, RPC, migración y sincronización todavía no activados. [Auditoría B07](B07_BASE_SEGURA_Y_AUDITORIA.md). |
| B08 · QA y piloto | Suites estáticas, unitarias y de navegador; auditoría después de parejas y previews verificadas. | Piloto físico, accesibilidad nativa, distribución y feedback de personas. Tres avisos moderados de herramientas siguen abiertos en el audit del piloto iPhone. |
| B09 · Comercio | Salida a páginas oficiales sin datos de lista ni pago dentro de JJ. | Acuerdos, cobertura, derechos de datos y responsabilidades antes de otras integraciones. No hay pedidos, stock ni pagos procesados por JJ. |

## Verificación de la entrega de tiendas y compartir

TypeScript y 816 pruebas unitarias correctos. Exportaciones web/iOS/Android completadas. La matriz final de navegador, publicación y sus resultados se documentan en [la auditoría de esta pareja](TIENDAS_COMPARTIR_Y_AUDITORIA.md). La construcción de estas funciones no cierra automáticamente los criterios físicos, visuales o comerciales de la tabla.

## Lo que todavía requiere trabajo de construcción

1. Completar las etapas de recursos de marca con revisión y aprobación de las propuestas; la lámina del raster original no es un SVG ni un icono nuevo.
2. Publicar y verificar V83 tras las unitarias, exportaciones y navegador correctos, conservando IDs y las siete recetas anteriores; resolver las 30 retenidas. La biblioteca editable/persistente y sus controles de copia/borrado son capacidades separadas todavía pendientes.
3. Preparar y aprobar la arquitectura de cuentas/hogares, y después implementar y probar los permisos y la sincronización. Compartir texto no sustituye ese trabajo.
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
