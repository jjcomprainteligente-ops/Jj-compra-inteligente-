# Auditoría de pendientes tras PR #30 | JJ Compra Inteligente

**21/11/2026. Integración de recetas/fotos cerrada técnicamente; aplicación completa todavía parcial.** El propietario autorizó la fusión y pidió verificar lo restante. Se revisan los bloques **00–14 del plan maestro**, distintos de B00–B09 del kit antiguo. No se empieza de cero ni se implementan nuevas funciones en esta auditoría.

## Fusión y verificaciones nuevas

- [PR #30](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/30) fusionado a las **20:41:20 UTC**: `1504afd8538a3e38a546d41048b45be6d6cac3bf`. Padres exactos: main anterior `69582c2010222769db8cf646b745aea544684e42` y candidata `26244016f75e505a7e3b4d47c2a656c87c7a3a29`.
- GitHub y Git local confirman árbol `f67af55e36cdb482f5734db69d5346bbf37405f8`, idéntico al de la candidata. Actualización local por avance rápido, sin reset ni reescritura. [CI del merge](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44947600998): `completed / success`.
- **407 hashes de entrada de app** coinciden con la fuente probada `80ab9e14185e3f50758339bd787c3f9b50113bc9`. Los 29 archivos protegidos y las 286 referencias/activos originales mantienen sus hashes. El cierre modifica exclusivamente documentación y su evidencia; no cambia dependencias, pantallas, datos guardados, servicios o bases de datos.
- Staging `dpl_4infJZdipQwLz3fGcdx7NFD2esfc` vuelve a constar `READY`, target `staging`, fuente `80ab9e1`. Protección `all_except_custom_domains` habilitada; producción sigue en `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`. No hubo nuevo despliegue ni promoción. Acceso temporal por conversación hasta **22/11/2026 10:29:01 UTC**; no guardar la credencial en Git.

Las **1.672 unitarias, 135 Python, 64 casos de fotos locales, 60 recorridos/Inicio, 24 menús anteriores y 24 + 16 + 8 casos publicados** corresponden a la fuente y ejecución del informe previo. Se preservan sus resultados y límites; no se presentan como suites de navegador recién ejecutadas sobre el merge. Este cierre sí comprueba árbol, procedencia, hashes, CI de main y proveedor. [Evidencia anterior inalterada](../../design/recipe-integration150/reports/verification.json) · [registro nuevo de main](../../design/recipe-integration150/reports/main-integration.json).

## Escaneo de secretos de esta auditoría

Se ejecutó **Gitleaks oficial 8.30.1** sobre un snapshot de los **2.009 archivos seguidos de main `1504afd`**, 260.906.066 bytes. Se verificaron SHA-256 del tarball y manifiesto contra el release oficial y su checksum. Reglas oficiales y redacción del 100 %; no se añadieron excepciones ni se cambiaron archivos o dependencias de la app.

Resultado original: **17 alertas `generic-api-key`, salida 1**. Las 17 se revisaron como falsos positivos de identificadores del almacenamiento local; **cero secretos confirmados y cero alertas sin clasificar**. Se conserva la salida original, sin convertirla en un “escáner sin hallazgos”. La evidencia pública solo recoge rutas, líneas y clasificación, sin valores coincidentes.

Alcance: snapshot seguido, sin historial Git, ignorados, entorno o credenciales privadas; **no se recorrió el contenido interno de comprimidos**. No certifica formatos binarios ni ausencia absoluta de secretos o vulnerabilidades. La evidencia de escaneo de este árbol queda registrada; el cierre completo de B12 mantiene RLS cuando se active, dispositivos y demás criterios pendientes. [Herramienta oficial fijada](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1) · [resultados y huellas](../../design/recipe-integration150/reports/main-integration.json).

## Matriz del plan maestro

“Probado” indica alcance técnico, no aceptación estética, licencia, cata nueva, certificación sanitaria o validación física. “Pendiente” distingue construcción que Codex puede completar de información y decisiones externas. Los capítulos de catálogo y fotos tienen su integración cerrada; no se declara cerrado todo requisito editorial o comercial del plan.

| Bloque | Estado verificable | Qué falta y quién lo cierra |
|---|---|---|
| **00 · Recuperación** | Inventario y auditoría entregados. | Mantener trazabilidad; no reabrir la antigua ausencia de materiales ya recibidos. [Inventario](INVENTARIO_UNICO.md). |
| **01 · Base Git/CI/staging** | Consolidación, fusión y CI comprobadas. | **01.1:** comprobar restauración e integridad de privados desde un destino independiente, con el propietario. Bundle Git restaurado y copia declarada no prueban esa independencia. [Estado de respaldo](RESPALDO_ESTADO_PUBLICO.json). |
| **02 · Recorrido diario** | Automatizado y publicado: receta → raciones → revisión → lista → gasto → presupuesto y reapertura. | Propietario + Codex: matriz física por modelo/iOS/idioma/commit, cancelación sin escribir y lista de 10+ productos. [Guía Safari](BLOQUE02_PRUEBA_SAFARI_IPHONE.md). |
| **03 · Catálogo** | **150 V3/750 fichas + 7 anteriores = 157 IDs únicos**, sin duplicar las 120 V83. Importador y conservación probados. | Revisión editorial/lingüística externa y metadatos culinarios no respaldados siguen separados. Etiquetas comerciales, SKU y trazas dependen de productos oficiales; no bloquean otra vez la publicación ya autorizada. [Integración](INTEGRACION_150_RECETAS_Y_FOTOS_2026-11-20.md). |
| **04 · Fotos** | **150 fotos y 300 derivados** integrados, cero faltantes, originales conservados y recursos comprobados. | Propietario/ChatGPT: aceptación estética y revisión humana de plato/ingredientes por lotes. Conservar procedencia y derechos para salida comercial. Codex corrige solo incidencias observadas; no genera sustituciones. [Manifiesto](../../referencias/recetas-v3/manifest-assets.json). |
| **05 · Entradas y menús** | Dos rutas disponibles; UI y guardado de cinco comidas para 1–12 personas. Motor N aislado probado. | Producto define rango/presentación; Codex activa N y su guardado con compatibilidad recuperable. Revisar preferencias dietéticas y categorías por ID antes de habilitarlas para las nuevas recetas. [B05.1](BLOQUE05_DOS_ENTRADAS_Y_PRESUPUESTO.md) · [B05.2](BLOQUE05_2_MOTOR_COMIDAS_VARIABLES.md). |
| **06 · Tiendas y geografía** | Seis formatos seleccionables y enlaces oficiales. | Codex: CP contextual, radios 5/10/20 km/personalizado, edición, cobertura y pruebas. Necesita establecimientos/coordenadas y fuente geográfica verificables; no inventar cercanía ni tiempo de viaje. [Código actual](../../src/domain/stores.ts). |
| **07 · Datos de precios** | Auditoría histórica, contratos y borradores conservados; feeds de PVP actual desactivados. | Producto/cadenas: derechos y datos vigentes por centro/CP/canal/SKU. Codex: adaptadores y snapshots backend acotados, validación, cache, errores y pruebas cuando exista fuente permitida. Los números de fuentes del 13/11 son históricos, no consulta actual. [Contrato](../B06_CONTRATO_DATOS_PRECIOS_V1_2026-11-12.md). |
| **08 · Cesta y salida** | Comparador manual por unidad/equivalencia/antigüedad; compra externa. | Codex: cesta completa/repartida, envases enteros y cobertura sin favorecer cestas incompletas. Precios reales, promociones, centros y transporte dependen de B06/B07. Puede prepararse el cálculo puro con datos de prueba claramente identificados. [Comparador actual](../../src/domain/priceObservations.ts). |
| **09 · Idiomas/visual/a11y** | Cuatro UI es/en/de/fr, recursos centralizados, preferencia, español de respaldo y EUR; BG conservado en fuente. | Codex + producto: BG completo requerido por el plan maestro posterior; revisión lingüística y accesibilidad física. Propietario/ChatGPT: aceptación de Verde Mercado Premium y comparación con las 16 vistas. No anunciar cinco UI ni aprobación por tener capturas. [Tipos](../../src/i18n/types.ts). |
| **10 · IA** | Preparación local de idioma; sin integración IA real. | Decidir proveedor/coste/privacidad. Codex: backend, límites, validadores, confirmación y pruebas de errores antes de activar llamadas. Ningún secreto en cliente; no habilitada por este cierre. [Contexto de idioma](../../src/i18n/assistantLanguage.ts). |
| **11 · Cuentas/hogares** | Contratos y migraciones preparados; login/sync/invitaciones no activos. | Cerrar control pendiente y matriz dinámica de aislamiento; después servicios, clientes, revocación y concurrencia. Esta auditoría no consulta Supabase ni certifica sus políticas actuales a partir de snapshots antiguos. [Informe histórico](../B07_BASE_SEGURA_Y_AUDITORIA.md). |
| **12 · Dispositivos/seguridad** | Tipos, dependencias, exportes y automatización acreditados por SHA. | Dispositivos físicos, VoiceOver/TalkBack, texto grande, teclado, zonas seguras, permisos, fotos, desconexión y reapertura. EAS preparado, pero **sin binario firmado ni TestFlight**; hacen falta proyecto/cuentas/icono aprobado y condiciones de distribución. Escaneo de secretos del snapshot realizado con clasificación de las 17 alertas; controles de servicios y riesgos con su alcance propio todavía pendientes. [Guía](../IPHONE_PILOTO_RECORRIDO_DIARIO.md). |
| **13 · Piloto/lanzamiento** | Propuesta documental; sin piloto ejecutado acreditado. | Propietario/producto: participantes, consentimiento, derechos, revisión legal y acuerdos. Codex: protocolo técnico, incidencias y correcciones. Producción/App Store requieren su autorización concreta; esta fusión no la sustituye. [Piloto](../PILOTO_TIENDAS_Y_PRECIOS_2026-11-10.md). |
| **14 · Mejoras posteriores** | Motor N y exportación local son preparación parcial. | Tras MVP: colección editable/importación-restauración, optimización con precios reales, alertas, carritos oficiales y otras islas, según prioridades y permisos. No se consideran funciones actuales ni fallos de la integración 150. [Plan original](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md). |

## Hallazgo funcional para la siguiente entrega

Las 150 V3 aparecen con el filtro general, pero **no se incluyen todavía al elegir vegano o vegetariano**. `reviewedPreferences` solo contiene las siete recetas anteriores; sin una firma revisada el filtro las excluye conservadoramente. La prueba de V3 exige ese resultado vacío. No es un error introducido por las fotos ni se debe retirar la protección para rellenar resultados. Faltan revisión por ID y metadatos respaldados. Tampoco existe categoría culinaria desayuno/comida/cena/postre en el modelo actual: la categoría de ingrediente no sirve para ese propósito.

Evidencia: [filtro](../../src/domain/menuFilters.ts), [prueba V3](../../tests/v3-recipes.test.ts), [modelo de recetas](../../src/domain/menus.ts). Los tiempos desconocidos siguen desconocidos; no se inventan para pasar un filtro.

Voz y escáner usan APIs web opcionales y ofrecen entrada manual cuando no están disponibles; no hay captura nativa acreditada. Las 16 vistas/nueve estados de revisión son cobertura ejecutable y ejemplos rotulados. No prueban servicios, acuerdos o permisos físicos. [Captura actual](../../src/app/screens/CaptureScreens.tsx).

## Entregas pequeñas propuestas

| Orden | Entrega | Criterio de cierre |
|---|---|---|
| **1 · B05.3** | Revisar categorías y preferencias dietéticas de las 150 por ID, con fuente editorial de producto/ChatGPT; Codex incorpora solo decisiones respaldadas. | Registro revisado, sin alterar cantidades/IDs y sin garantías médicas; filtros con resultados esperados y estado honesto de las no revisadas. |
| **2 · B05.4** | Acordar rango/presentación de N; activar selección y guardado conservando planes de cinco. | Compatibilidad y recuperación comprobadas, cancelación sin escribir, límites y errores en cuatro UI, staging y revisión. **Auditoría de la pareja 05.3/05.4** antes de seguir. |
| **3 · B06.1** | Registrar establecimientos y coordenadas verificadas, formato/canal, fuente/fecha y ámbito Tenerife. | Datos trazables y sin PVP inferido; localidades/centros sin coordenadas quedan identificados. |
| **4 · B06.2** | CP/radios/resultados geográficos con entrada manual y ubicación voluntaria. | Pruebas de CP inválido, municipios limítrofes, Los Cristianos/Los Gigantes y otra isla. Staging, revisión y **auditoría de la pareja**. |
| **Después** | B07/B08 por fuentes permitidas; B09 BG/accesibilidad; B10 IA y B11 hogares con sus puertas; B12 dispositivos; B13 piloto. | Una entrega revisable cada vez. Las dependencias externas no se presentan como código terminado ni obligan a inventar precios. |

La revisión visual y física de la versión actual puede avanzar mientras se preparan especificaciones. El propietario comunicó que funciona en su iPhone: se conserva ese reporte, sin elevarlo a una matriz de dispositivo o aceptación estética completa. Los trabajos posteriores no se activan automáticamente por esta auditoría.

## Conservación y contradicciones resueltas

Se actualizan los prefijos operativos de README, estado, inventario, dirección visual e instrucciones V3. Las antiguas 30 recetas retenidas, 138 fotos ausentes y fusión de PR #30 pendiente quedan como antecedentes fechados, no como bloqueos vigentes. El manifiesto de Bloque 00/01 y sus próximas acciones se identifican como históricos. No se reescriben los JSON de pruebas anteriores ni los historiales documentales; PLAN y DECISIONES reciben entradas nuevas.

No se borran archivos, recetas, originales o ramas, ni se activan servicios, precios, IA o cuentas. La integridad de archivos y cero avisos conocidos en una ejecución no garantizan ausencia absoluta de fallos o vulnerabilidades. La aceptación comercial y la prueba física siguen siendo verificaciones distintas.
