# Política de integración y recuperación | Bloque 01 maestro

**Fecha:** 13/11/2026. **Estado:** procedimiento de trabajo materializado; la aplicación de protecciones de GitHub y los resultados de cierre se acreditan por separado. Este documento no fusiona PR, cambia reglas remotas ni despliega por sí mismo.

## Autorización y alcance

El propietario autorizó comenzar el Bloque 01 sobre el producto existente. Se conserva Expo/React Native/TypeScript, Verde Mercado Premium / GPT-6 V2, el PNG oficial, los siete documentos locales y sus protecciones. [AGENTS](../../AGENTS.md), el [plan maestro aprobado del 13/11](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md) y las decisiones confirmadas prevalecen sobre propuestas o textos históricos.

La documentación y los PR revisables dentro del encargo, las pruebas locales sin gasto y la staging protegida comprobada ya están autorizados. La consolidación no autoriza merge a main/producción, publicación App Store, contenidos retenidos, imágenes sustitutas, pagos ni mensajes comerciales. Los bloques funcionales posteriores permanecen fuera de alcance hasta su apertura conforme al plan.

## 01.1 — Respaldar antes de modificar código

1. Verificar fuente y SHA del ZIP privado completo: `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034`, 937.580 bytes. Verificar manifiesto interno, 150 IDs y 750 fichas, sin reescribir contenidos.
2. Preparar copia privada y prueba de restauración sin sobrescribir originales; conservar controles, nombres, bytes y hashes. Una copia/restauración en la misma máquina es solo preparación local.
3. Materializar una ubicación **privada independiente del entorno** y comprobar integridad y capacidad de recuperación. Registrar destino general, fecha, tamaño, SHA y resultado de lectura/restauración sin publicar credenciales o contenido retenido.
4. Mientras ese destino no esté materializado y verificado, marcar **PENDIENTE**; no anunciar protección externa. La referencia Git y el bundle del repositorio no contienen archivos ignorados y no respaldan las 30 recetas retenidas.
5. Mantener V38–V83/fotos y ZIP grandes históricos como `REFERENCIADO_NO_ACCESIBLE` cuando solo exista una mención. No generar ni sustituir para cerrar un contador.

El repositorio es público: no admite el ZIP privado, recetas retenidas, datos locales del propietario, claves, ficheros de entorno ni estado autenticado del navegador. Una eventual publicación de contenido retenido requiere autorización específica y no se deduce de «sigue».

**Estado al materializar esta política:** copia local/restauración preparatoria comprobadas por el trabajo de respaldo; destino privado externo **PENDIENTE**. No se modifica código antes de cerrar esta puerta. La consolidación documental y las lecturas/pruebas independientes no se presentan como respaldo.

## 01.2 — Una base conservada

- Base auditada: `abb3bca53953e4523af61118e375df90d1a8d416`.
- Referencia recuperable creada: `codex/respaldo-base-2026-11-13`, desde ABB.
- Rama de trabajo creada: `codex/integracion-maestra-2026-11-13`, desde ABB. Registrar cada nuevo commit exacto tras publicarlo; no etiquetar cambios sin guardar como un SHA remoto existente.
- `main` auditado permanece en `d22d66eff03c5d107f5170ee38cd2bc3167865e2`; conservarlo hasta revisión y autorización de integración.

La cadena #1/#2/#3/#7/#8/#10/#12/#15/#19/#20 ya forma parte del origen ABB; #4 y #9 también son ancestros por fusiones históricas. No volver a aplicar sus árboles. Conservar ramas y PR aun cuando su trabajo ya sea ancestro. [Inventario de dependencias](INVENTARIO_UNICO.md#pr-y-dependencias-conservadas).

Revisar diferencias y bases de #5/#11/#16 sin mezclarlas automáticamente. La documentación de producto de #16 se ha incorporado byte a byte desde `95686b3`, conservando procedencia; las dos fuentes ausentes de #5 se conservaron bajo `docs/historico/PR05_2026-11-10/` como documentos históricos, sin reponer su árbol antiguo. La UI propuesta de #11 corresponde al Bloque 05 maestro; su fallback CSV, esquema de validación, snapshots y cobertura requieren revisión. Ninguna fuente bloqueada se activa al portar documentos.

## 01.3 — PR y revisión

- Preferir PR pequeños por subbloque, con problema concreto, archivos, origen, pruebas y límites. La consolidación histórica puede contener muchos archivos heredados: explicar ese alcance en vez de atribuirlos a trabajo nuevo.
- Comparar HEAD remoto antes de publicar y utilizar actualización con SHA esperado; conservar cambios concurrentes. Prohibidos push forzado, resets destructivos y reemplazo de árboles antiguos sobre el actual.
- Mantener los originales de README/estado/dirección bajo `ARCHIVO_HISTORICO`; el inventario maestro expresa el estado comprobado y las contradicciones. No cambiar resultados pasados ni trasladarlos a otro SHA.
- Actualizar PLAN_Y_ESTADOS y DECISIONES_Y_RIESGOS con hechos nuevos, sin borrar antecedentes. Anotar fuente, datos, compatibilidad de licencias, respaldo y revisiones visuales cuando apliquen.
- El registro del Bloque 00 devolvió ramas `protected:false` y ningún ruleset listado. Esta política no demuestra una regla remota aplicada; cualquier configuración efectiva debe verificarse y registrarse por separado.

## 01.4 — Comprobar el árbol final

Instalación reproducible desde Git/lockfile en copia aislada, sin el ZIP privado ni datos del propietario. Verificar como mínimo:

- Reproducción de la selección pública V83; tipos y unitarias. Línea de referencia: 981 pruebas/27 archivos, sin convertirla en cifra fija si la suite cambia. Los dos workers limitan carga; no relajar aserciones, timeouts o cobertura para obtener un pase.
- Audit npm y compatibilidad oficial Expo; declarar fecha, árbol y avisos reales. Cero avisos conocidos no implica ausencia absoluta de vulnerabilidades.
- Export web/iOS/Android, verificación i18n y regresión Chromium/WebKit; registrar número correcto, fallido y omitido con motivo y SHA exactos.
- Matriz de navegación, receta→ingredientes→lista→gasto/presupuesto, cancelación, recuperación/errores y los siete documentos locales; comprobar preservación de IDs, logo y assets.
- Enlaces/documentación, secretos, diferencia visual y límites. VoiceOver, teclado nativo, zonas seguras y aceptación del propietario permanecen separados de las pruebas Linux.

Los informes anteriores son referencias: 298 Chromium/24 omisiones y 16 WebKit pertenecen al bundle 349e6e…; el último ajuste 17d5 tiene calidad 8/8 y pulsación/foco 9/9 con bundle c3f6a11f…. El Bloque 01 necesita sus propios resultados sobre el árbol revisado. [Procedencia](INVENTARIO_UNICO.md#procedencia-de-pruebas-y-cierre-pendiente-de-bloque-01).

La CI debe conservar acciones fijadas, mínimos permisos y checkout sin credenciales persistentes. No usar secretos en código no revisado ni exponer entornos/trazas. Preparar un workflow no equivale a observar un run correcto; registrar URL y commit de la ejecución real.

## 01.5 — Staging comprobada y recuperación

Publicar código verificado primero en el repositorio canónico. Empaquetar solo el export web y los recursos permitidos, con origen exacto y árbol limpio. Conservar el logo y su hash; no incluir fuentes privadas, nativos, fixtures ni datos locales. Publicar exclusivamente staging, preservando protección y despliegues anteriores.

Comprobar HTTP, bundle/recursos por hash, idioma y elección persistente, menú, lista, ausencia de precios sin fuente y navegación básica. Registrar commit, bundle, ID de despliegue y recuentos; el token temporal de acceso se comparte solo por conversación, con caducidad. Una página técnica de versión, si se incorpora tras la puerta de respaldo, debe exponer solo versión/commit/fecha seguros y quedar fuera de recorridos de producto innecesarios.

La comparación con producción es de lectura. La producción auditada apunta a un despliegue anterior sin SHA en metadatos; no promoverlo ni sustituirlo por inferencia. Una staging READY no es aceptación humana ni prueba física.

Para recuperar: conservar referencia ABB y despliegue anterior; seleccionar el commit/origen revisado apropiado en una nueva entrega recuperable, comprobarlo y publicar otra staging. No eliminar ramas ni sobrescribir datos para «limpiar». La restauración de contenidos privados se hace desde su respaldo privado verificado. Un rollback o promoción de producción requiere instrucción explícita.

## Cierre y puerta siguiente

Bloque 01 permanece **EN_CURSO** hasta registrar respaldo externo, árbol final, PR/CI, pruebas/exportaciones y staging comprobada, o separar claramente un subbloque bloqueado con su causa. Después se propone una sola siguiente acción; no abrir automáticamente Bloque 02 ni otros frentes.

Los índices del kit antiguo no cambian esta secuencia: B06.1 fuentes → Bloque 07 maestro; B07 hogares → Bloque 11 maestro. El bloque actual no construye menús nuevos, cinco idiomas de UI, geografía de tiendas, feeds ni cuentas.


## Aplicación comprobada de la política · 14/11/2026

PR #21 y origen `78480fd40b4a116d53ebb016f31085785f42a6e6` verificados: CI correcta, 298 Chromium/24 omisiones deliberadas y 16 WebKit; baseline limpio ABB con 981 unitarias, audit 0 y exports 3. Candidata staging READY/protegida y HTTPS revalidado en cuatro idiomas/29 recursos. Ver [estado técnico](../../design/master-integration/reports/integration-verification.json). No hay merge a main ni promoción; siguen conservados D22 y la referencia ABB.

La preparación privada local y su restauración están verificadas; la independencia externa permanece pendiente. Esa puerta no se elimina por terminar las pruebas de la app. Bloque 01 continúa EN_CURSO y no autoriza comenzar otro bloque.

## Confirmación de guardado del propietario · 14/11/2026

El propietario comunicó: «Lo tengo guardado en la carpeta del proyecto sigue». Se registra como confirmación de que guardó una copia en la **carpeta del proyecto declarada por él**. La solicitud de información ya tiene respuesta; no debe seguir describiéndose como «sin respuesta» ni exigirse de nuevo el mismo consentimiento.

El grado de evidencia queda separado en el [estado público de respaldo](RESPALDO_ESTADO_PUBLICO.json): `OWNER_CONFIRMED_PROJECT_FOLDER`, `ownerConfirmedCopy=true`. El agente no ha inspeccionado el destino declarado ni conoce su ubicación o dispositivo; por ello `agentVerifiedRemoteCopy=false`, `externalChecksumReadByAgent=false` e `independentBackupVerified=false`. La declaración no se convierte en una comprobación remota de integridad, restauración o independencia.

Continúan acreditadas las comprobaciones locales anteriores: ZIP de 937.580 bytes, SHA-256 `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034`, copia y restauración locales correctas, 13/13 entradas del manifiesto y 150 IDs/750 fichas. No se ha sustituido esa evidencia por otra ni se publica el archivo privado. El cierre del bloque debe citar este alcance y la decisión adoptada sobre la confirmación, conservando los estados históricos anteriores con su fecha.


## Separación de 01.1 y comprobación de Bloque 02 · 14/11/2026

La orden posterior «sigue», junto con la confirmación de copia, abre la comprobación del recorrido diario sobre la aplicación existente. La base compila y el origen desplegado es conocido; no se oculta ni se declara resuelta la independencia pendiente de 01.1. Esta subtarea añade pruebas de aceptación, una guía de Safari y evidencia de ejecución; mantiene intactos aplicación, dependencias, recursos, originales y mecanismos de almacenamiento. Un eventual fallo P0 se documentará antes de modificar la aplicación. No habilita el Bloque 03, merges a main, producción, servicios ni publicación de las recetas retenidas.
