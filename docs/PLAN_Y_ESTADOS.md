# Tablero maestro y control del trabajo | JJ Compra Inteligente
**Estado al crear este kit:** documentación preparada **fuera del repositorio**. Ninguna tarea ejecutada en Codex. GitHub no accesible desde esta conversación (0 repositorios visibles).

## Leyenda
`PENDIENTE` sin comenzar | `EN CURSO` Codex está trabajando | `EN REVISIÓN` evidencia entregada | `APROBADO` usuario aprueba + criterios cumplidos | `BLOQUEADO` falta dependencia. Solo actualizar estado con pruebas y fecha.

| Bloque | Nombre | Dependencia | Estado | Puerta de aprobación |
|---|---|---|---|---|
| B00 | Auditoría repo | acceso GitHub/Codex | BLOQUEADO | diagnóstico aceptado |
| B01 | Identidad visual | B00 | PENDIENTE | elegir V1/V2/V3 y logotipo |
| B02 | Arquitectura UX de pantallas | B01 | PENDIENTE | revisar flujos y vistas |
| B03 | Prototipo visual en iPhone | B02 | PENDIENTE | capturas + prueba de uso aprobadas |
| B04 | Listas y presupuesto | B03 | PENDIENTE | funcionalidades y persistencia validadas |
| B05 | Menús, recetas e IA | B04 | PENDIENTE | precisión + confirmación validadas |
| B06 | Comparador de precios | B04 | PENDIENTE | fuentes legítimas + transparencia |
| B07 | Cuentas y hogares | B04 | PENDIENTE | privacidad, RLS y sincronización |
| B08 | QA y piloto Tenerife | B04–B07 | PENDIENTE | reportes + testers |
| B09 | Comercio real integrado | acuerdos y B08 | BLOQUEADO | autorización comercial + checkout |

## Gestión obligatoria por bloque
- **Objetivo:** una frase de resultado observable.
- **Entradas:** archivos y decisiones aprobadas.
- **Trabajo:** tareas concretas, sin ampliar alcance.
- **Evidencia:** enlaces, screenshots, comandos y pruebas reales.
- **Criterios de aceptación:** checklist verificable.
- **Decisión:** Aprobado / Repetir / Bloqueado + quién y fecha.
- **Siguiente:** exactamente el siguiente bloque autorizable.

## Control de cambios
- Si surge una idea nueva: añadir a `DECISIONES_Y_RIESGOS.md` con estado **propuesta** y revisar prioridad; no asumir aprobación.
- Cualquier cambio de alcance requiere descripción de impacto en tiempo, coste, datos y UX.
- No declarar «funciona» sin prueba; no declarar «subido a GitHub» sin commit/PR visible.
- Al crear una nueva conversación, compartir este tablero y el último PR/commit. No reconstruir el plan desde memoria.

## Mini bitácora (rellena Codex una vez empiece)
| Fecha UTC | Bloque | Cambio/verificación | PR/commit | Resultado | Próximo paso |
|---|---|---|---|---|---|
| 2026-10-29 | Documentación | Kit de trabajo y dirección visual preparado localmente fuera de repo | ninguno | listo para importar | obtener repo y lanzar B00 |


## Actualización vigente tras B00 — 2026-10-29 20:43:46 UTC

La tabla inicial y la bitácora anteriores se conservan como estado de origen del kit. Esta actualización registra el estado de trabajo posterior a la auditoría local.

| Bloque | Estado vigente | Evidencia y límite | Próxima puerta |
|---|---|---|---|
| B00 | APROBADO para continuar en diseño | El propietario respondió «Sigue» tras recibir el diagnóstico. Se auditó la base local sin cambios y pasaron TypeScript y 50 pruebas unitarias. La trazabilidad Git sigue pendiente. | Repositorio/remoto/rama por identificar para futuros PRs. |
| B01 | EN CURSO | Se preparan tres propuestas aisladas: V1 Verde Esencial, V2 Verde Noche y V3 Verde Mercado. No hay dirección ni logotipo elegidos. | Revisión de pantallas y selección explícita del propietario. |
| B02 | PENDIENTE; bloqueado por selección B01 | No autorizado ni iniciado. | Aprobación de identidad y logotipo. |
| B03–B08 | PENDIENTES | No se adelanta funcionalidad ni infraestructura. | Las dependencias originales de cada bloque. |
| B09 | BLOQUEADO | Sin acuerdos, checkout ni autorización comercial. | Las dependencias originales. |

### Evidencia de continuidad

- Base local: `/workspace/jjcompraintelwgiemt`; Expo 58.0.21, React Native 0.88.1, React 19.3.0 y TypeScript 6.0.3.
- La carpeta no es un repositorio Git operativo; el conector GitHub devolvió cero repositorios accesibles. No se conoce remoto, rama ni historial y no hay commit o PR que enlazar.
- El informe de referencia está en `docs/B00_DIAGNOSTICO.md`. La documentación del kit se incorpora mediante archivos nuevos, preservando íntegros los archivos previos de la app.
- En B01 se limita el código al prototipo visual aislado: sin nuevas funciones de negocio, persistencia, backend, IA, cuentas o pagos.
- Las búsquedas con ChatGPT siguen fuera de la app. Ninguna propuesta de integración se considera aprobada.
- Las capturas, comandos y resultados concretos de B01 se añadirán al cierre; no se dan por realizados por esta actualización.

| Fecha UTC | Bloque | Cambio/verificación | PR/commit | Resultado | Próximo paso |
|---|---|---|---|---|---|
| 2026-10-29 20:43:46 UTC | B00 → B01 | Diagnóstico entregado; «Sigue» autoriza continuar con identidad visual; importación documental sin sobrescrituras. | ninguno; Git pendiente | B01 en curso, sin identidad aprobada | entregar tres propuestas y esperar selección |


## Entrega B01 para revisión — 2026-10-29 21:00:48 UTC

Este es el estado vigente posterior a la entrega visual; las tablas anteriores se mantienen como historial.

| Bloque | Estado vigente | Evidencia | Próxima puerta |
|---|---|---|---|
| B01 | EN REVISIÓN | Tres direcciones, tres marcas, nueve pantallas y 27 capturas a tres tamaños. PDF de cinco páginas. 41 pares de contraste AA; TypeScript y 50 pruebas unitarias correctos. Los 18 archivos previos permanecen intactos. | Selección explícita de V1/V2/V3 y M1/M2/M3, o ajustes pedidos por el propietario. |
| B02 | PENDIENTE; bloqueado por selección B01 | No iniciado. | Dirección y marca aprobadas. |

Informe: `docs/B01_IDENTIDAD_VISUAL.md`. Evidencia: `design/b01/evidence/`. Prototipo aislado: `design/b01/`; son capturas Chromium web a escala iPhone, no pruebas iOS nativas. Sin nuevas dependencias, backend ni cambios en la app previa. Sin rama/PR/commit por falta de repositorio Git operativo.

| Fecha UTC | Bloque | Cambio/verificación | PR/commit | Resultado | Próximo paso |
|---|---|---|---|---|---|
| 2026-10-29 21:00:48 UTC | B01 | Alternativas y evidencia entregadas; limitaciones nativas documentadas. | ninguno; Git pendiente | EN REVISIÓN, ninguna identidad elegida | esperar selección del propietario |

## Selección vigente del propietario — 2026-10-29 22:15:34 UTC

Mensaje: «Verde mercado y m3 pero el logo tendremos que trabajarlo más adelante».

| Bloque | Estado vigente | Decisión y alcance | Siguiente paso |
|---|---|---|---|
| B01 | DIRECCIÓN APROBADA; LOGOTIPO DEFINITIVO PENDIENTE | V3 Verde Mercado seleccionada. M3 es la referencia provisional; se pospone el trabajo del logo por decisión del propietario. | Conservar las alternativas y retomar la marca más adelante. |
| B02 | PENDIENTE DE INICIO | Base visual definida: V3 con M3 provisional. El logo definitivo no bloquea las pantallas. No se ha iniciado B02 en esta actualización. | Diseño UX de las cinco vistas dentro de su propio bloque. |

Solo se actualiza documentación. La aplicación, prototipos, capturas, PDF y ZIP anteriores se conservan sin cambios. No hay nuevos commits ni PRs; la trazabilidad Git sigue pendiente. Las tablas anteriores se mantienen como historial y esta selección prevalece sobre sus estados de revisión.


## Entrega B02 para revisión — 2026-10-29 23:05:51 UTC

El propietario respondió «Sigue» tras registrar V3 Verde Mercado y M3 provisional. Eso autorizó B02; el logo definitivo sigue diferido. Las entradas anteriores se conservan como historial.

| Bloque | Estado vigente | Evidencia | Próxima puerta |
|---|---|---|---|
| B02 | EN REVISIÓN | Cinco vistas; ocho estados críticos más antiguo/no comparable; F1–F5 y componentes; 59 vistas comprobadas, 32 contrastes correctos, TypeScript y50 pruebas existentes correctos. | Revisión de ChatGPT y aprobación/ajustes del propietario. |
| B03 | PENDIENTE; no iniciado | Sin validación nativa ni integración del diseño en la aplicación de fase1. | Diseño B02 aprobado. |

Informe: `docs/B02_ENTREGA_VISUAL.md`. Mapa/componentes: `docs/B02_FLUJOS_Y_COMPONENTES.md`. Evidencia y PDF: `design/b02/evidence/`. Prototipo aislado en `design/b02/`, sin dependencias nuevas, backend, persistencia ni IA. Se conservaron67 archivos anteriores y33 evidencias B01; esta actualización solo amplía los registros documentales. No hay rama, commit o PR por falta de Git operativo.

| Fecha UTC | Bloque | Cambio/verificación | PR/commit | Resultado | Próximo paso |
|---|---|---|---|---|---|
| 2026-10-29 23:05:51 UTC | B02 | Entrega UX y pantallas Verde Mercado, M3 provisional; evidencia web y límites nativos documentados. | ninguno | EN REVISIÓN | esperar aprobación de diseño antes de B03 |

## Autorización B03 y B04 — 2026-10-30 UTC

El propietario respondió «Me gusta puedes seguir» y pidió montar B03 y B04 directamente. B02 queda aprobado como base de implementación; esta autorización permite realizar ambos bloques consecutivamente sin otra pausa entre ellos. Las entradas anteriores se conservan como historial. No autoriza avanzar a B05 ni sustituye la revisión de resultados.

| Bloque | Estado vigente | Evidencia y alcance | Siguiente paso |
|---|---|---|---|
| B02 | APROBADO por el propietario | Se conserva la entrega V3 Verde Mercado con M3 provisional; el logo definitivo sigue diferido. | Utilizarla como referencia para la integración. |
| B03 | EN CURSO; autorizado junto con B04 | Integración aditiva de cinco pantallas en la app Expo existente, preservando el comparador manual. | Completar navegación, estados y evidencia de ejecución; validación nativa pendiente. |
| B04 | EN CURSO; autorizado tras B03 sin pausa adicional | Reglas y almacenamiento aislados para listas locales, presupuesto, precios introducidos/estimados, cantidades, duplicados y deshacer; integración y verificación en curso. | Probar 10+ productos, persistencia, errores y recorridos completos. |
| B05–B08 | PENDIENTES | No se han autorizado nuevas integraciones, cuentas ni servicios. | Revisar B03/B04 antes de encargar otro bloque. |
| B09 | BLOQUEADO | Sin acuerdos comerciales ni autorización de checkout. | Mantener sus dependencias originales. |

Registro de trabajo: `docs/B03_B04_ENTREGA.md`. Copia previa: `archives/B00-B02-source-before-B03-B04.zip`. No hay Git operativo ni PR/commit disponible. Los resultados completos de TypeScript, pruebas, exportación y capturas se incorporarán al cierre; no se declaran aprobados en esta entrada. La ausencia de simulador iOS deja pendientes capturas nativas, teclado, VoiceOver, Dynamic Type, gestos y zonas seguras reales.

| Fecha UTC | Bloque | Cambio/verificación | PR/commit | Resultado | Próximo paso |
|---|---|---|---|---|---|
| 2026-10-30 UTC | B02 → B03/B04 | Aprobación de B02 y autorización expresa para integrar pantallas y listas/presupuesto consecutivamente; copia de conservación preparada. | ninguno; Git pendiente | B03/B04 EN CURSO | completar integración y registrar pruebas reales |


## Entrega vigente B03/B04 — 2026-10-30 UTC

Esta entrada prevalece sobre los estados de trabajo anteriores, conservados como historial.

| Bloque | Estado vigente | Evidencia y límites | Próximo paso |
|---|---|---|---|
| B03 | EN REVISIÓN; implementación integrada | Cinco pantallas Verde Mercado/M3 provisional; 50 capturas ejecutadas en tres tamaños CSS de iPhone. Navegación, estados y formularios activos. Capturas y uso nativos pendientes. | Revisión visual y comprobación en iPhone. |
| B04 | EN REVISIÓN; funcionalidad local implementada | Listas, productos, presupuestos, unidades, duplicados, confirmaciones y deshacer. 127 pruebas, 20 recorridos web; 12 productos persistentes y escritura sin red con la app cargada. | Validar en teléfono y revisar la entrega. |
| B05–B08 | PENDIENTES | No iniciados por esta entrega. Menús sigue como vista previa. | Nuevo encargo tras revisión. |
| B09 | BLOQUEADO | Sin acuerdos ni comercio. | Mantener requisitos originales. |

`npm run check` correcto y exportación web/iOS/Android correcta. [Entrega](B03_B04_ENTREGA.md), [capturas](../design/b03-b04/review.html) e informes en `design/b03-b04/evidence/`. No hay PR/commit por falta de Git operativo. Ningún archivo previo eliminado; App.tsx y dependencias intactos. Continúan abiertos iPhone físico/accesibilidad nativa y 8 avisos de paquetes de la cadena de herramientas Expo (3 altos, 5 bajos; dos dependencias raíz). No se declara distribución lista ni aceptación nativa.


## Entrega vigente B05 — 2026-10-30 UTC

El propietario pidió «Sigue con b05 y justo después aremos la prueba». Se autoriza el bloque determinista de menús y recetas seguido de la prueba; no se convierte la evidencia web anterior en aceptación nativa ni se aprueba una integración de IA con costes/backend.

| Bloque | Estado vigente | Evidencia y límites | Siguiente paso |
|---|---|---|---|
| B03/B04 | Implementados; revisión nativa pendiente | Sus fuentes, entregables y capturas previos permanecen conservados. Los recorridos anteriores vuelven a pasar con B05. | Incluir compras y presupuesto en la prueba de teléfono. |
| B05 determinista | EN REVISIÓN; preparado para la prueba | Cinco cenas, siete recetas, personas, cambio de plato, ingredientes escalados, revisión editable, texto de ChatGPT, duplicados y confirmación atómica/deshacer. 228 pruebas y 36 recorridos web correctos; 38 capturas y exportación web/iOS/Android correctas. | Ejecutar [prueba guiada](B05_PRUEBA_GUIADA.md) con el propietario. |
| B05 IA/voz conectadas | CONDICIONADAS; no implementadas | Búsquedas con ChatGPT fuera de la app. No hay llamadas IA, claves, backend ni micrófono. | Decisión específica sobre coste, arquitectura y privacidad si se solicitan después. |
| B06–B08 | PENDIENTES | No iniciados por este encargo. | Nueva prioridad después de la prueba. |
| B09 | BLOQUEADO | Sin acuerdos ni comercio integrado. | Mantener requisitos originales. |

[Entrega B05](B05_ENTREGA.md) · [Capturas](../design/b05/review.html). Fuentes previas en `archives/B00-B04-source-before-B05.zip`; informes B05 separados. Git sigue sin estar operativo, sin PR/commit. Continúan pendientes uso real de iPhone, teclado/VoiceOver/Dynamic Type/zonas seguras y resolución compatible de avisos de dependencias Expo antes de distribuir.


## Entrega vigente B06 — 2026-10-30 UTC

El propietario autorizó «Sigue con bo6. Estoy con las pruebas». Las pruebas de B05 continúan por su cuenta; no se declaran aprobadas ni se modifica su entrega archivada.

| Bloque | Estado vigente | Evidencia y límites | Siguiente paso |
|---|---|---|---|
| B05 | Pruebas del propietario en curso | ZIP, fuentes y capturas conservados; sus recorridos vuelven a pasar con B06. | Incorporar los fallos que comunique. |
| B06 manual | EN REVISIÓN | Observaciones con tienda, producto/formato/calidad, contenido, precio, fecha y procedencia; comparación exacta por unidad; exclusiones visibles. 324 pruebas, 52 recorridos y 41 capturas web correctos. | Revisión y prueba del piloto, sin presentar aportaciones como precios actuales verificados. |
| B06 fuentes verificadas | Sin proveedor conectado | No se simula verificación, stock, descuentos ni acuerdos. Las aportaciones manuales están permitidas por el bloque. | Integrar una fuente solo con procedencia legítima y alcance aprobado. |
| B07–B08 | PENDIENTES | No iniciados por este encargo. | Nueva prioridad después de revisar pruebas. |
| B09 | BLOQUEADO | Sin acuerdos ni comercio integrado. | Mantener requisitos originales. |

[Entrega B06](B06_ENTREGA.md) · [Galería](../design/b06/review.html). Copia previa: `archives/B00-B05-source-before-B06.zip`. Siguen pendientes validación nativa, trazabilidad Git y corrección compatible de avisos en herramientas Expo antes de distribución.

### Solicitud de enlace web

El propietario pidió el enlace y autorizó expresamente subir a Vercel la vista comprobada de B05 (código compilado y tipografías, sin datos de usuario ni credenciales). Se preparó una copia estática independiente en `previews/b05-web/`. La primera revisión automática exigió ese permiso; una vez dado, Vercel respondió 403 por falta de autorización de la conexión al equipo. Se facilitó el enlace de acceso de cuenta. No hay un despliegue publicado ni un enlace de app que declarar hasta completar ese paso; no se eluden permisos ni se sustituye B05 por B06 durante sus pruebas.


### Enlace B05 publicado y comprobado — 2026-10-30 19:00 UTC

El propietario confirmó «Hecho» tras autorizar el acceso de Vercel. La vista estable B05 está publicada en el proyecto existente, despliegue `dpl_67mSMKzUQCXQqc77pj5KgqB8K2zU`, estado **READY**, destino **staging**. URL del despliegue: https://jj-compra-inteligente-lwjqxfixy-cmj2hwhc6b-1051.vercel.app . El enlace compartido facilitado al propietario vence el **31/10/2026 a las 17:59:45 UTC**. La protección del proyecto se conserva; no se guarda el parámetro de acceso en fuentes.

Se conserva el JavaScript B05 original, SHA256 `925616c882beb201f1afb184285f15a4a0365c756879924c1f54801546ba6a34`. El alojamiento excluía las rutas que contenían `node_modules`: se añadieron siete copias idénticas de fuentes en rutas planas y siete reescrituras exactas en `previews/b05-web/vercel.json`. Sin cambios en lógica, listas, recetas, B06, dependencias ni entregables anteriores. Solo se subieron HTML, JavaScript compilado, fuentes y configuración estática de alojamiento; sin datos de usuario, fixtures ni credenciales.

**Verificación ejecutada:** 23 URL HTTPS con estado 200 y tamaño/SHA1 idénticos al manifiesto, incluidas las siete rutas originales reescritas y las siete rutas planas. Chromium a 390×844: inicio, crear lista y persistencia local, generar menú, revisar ingredientes y cancelar sin modificar compras; fuentes cargadas, cero errores JavaScript y sin desbordamiento horizontal. Las peticiones HTTPS del navegador de prueba se realizaron con el cliente Node de Playwright y la CA configurada, manteniendo validación TLS, sin alterar el almacén permanente de certificados. No equivale a Safari/iPhone físico.

Evidencia: `previews/b05-web/.vercel/hosted-evidence/report.json`, `https-report.json` y dos capturas. Reproducción del recorrido: `JJ_B05_SHARE_URL='<enlace compartido vigente>' node scripts/verify-b05-hosted.cjs`, con el proxy y CA del entorno y Chromium configurado. Las listas de esta comprobación existieron únicamente en un contexto de navegador desechable. Los datos del propietario continúan en su propio navegador/dispositivo. B05 sigue en prueba del propietario; B06 conserva su estado de revisión. No se inicia B07 ni se declara aceptación nativa.


## Requisito transversal I01/I02 y auditoría P01 — 31/10/2026 UTC

El propietario encargó es/en/de/fr, detección del dispositivo, elección en bienvenida/Perfil, prioridad manual persistida, recursos centrales, recetas/accesibilidad, euro y formatos locales, preparación del idioma de IA y ampliación futura. Autorizó empezar e impuso una auditoría completa después de cada dos bloques. Las implicaciones de persistencia y protección entre pestañas se comunicaron antes de sus cambios.

| Bloque | Estado vigente | Evidencia y alcance | Siguiente puerta |
|---|---|---|---|
| I01 | IMPLEMENTADO y verificado automáticamente | Registro central, Expo Localization compatible, negociación/fallback es, formatos exactos, preferencias independientes y contrato de IA sin conexión. | Validación nativa y revisión del propietario. |
| I02 | IMPLEMENTADO y verificado en web | Bienvenida, Perfil → Idioma, navegación, formularios, errores, recetas, comparadores y etiquetas accesibles en cuatro idiomas. Tema y recursos visuales anteriores conservados. | Probar los cuatro idiomas en iPhone real. |
| P01 | AUDITORÍA AUTOMÁTICA COMPLETADA tras I01 + I02 | TypeScript, 496 pruebas unitarias, 124 recorridos web correctos y 120 capturas; 0 fallos/inestabilidad. Doce capturas duplicadas se omiten en el segundo proyecto. | No confundir este resultado con certificación nativa o de seguridad absoluta. |
| Publicación de esta versión | PREPARADA, NO PUBLICADA | Snapshot web compilado y fuentes en previews/i18n-web, destino de prueba previsto staging; el preview B05 no se sustituye. | La autorización anterior era B05; revisar y autorizar publicación separada. |
| Lotes V2 posteriores / B07–B09 | Sin avance por este requisito | No se añade integración comercial, IA, sincronización, pagos ni icono/3D. | Seguir aprobación y dependencias de cada bloque; auditar cada pareja. |

La auditoría encontró que Web Locks por sí solo no evita lecturas antiguas de localStorage. Se añadió un registro local de huellas en IndexedDB, con reserva de durabilidad estricta antes de escribir y confirmación de la lectura canónica. Los resultados ambiguos bloquean nuevas escrituras; no se borran datos ni reservas automáticamente. La corrección se verificó con dos pestañas reales y fallos inyectados. Las cuatro claves y esquemas de negocio se conservan; nativo usa cola JS, sin IndexedDB.

[Entrega y auditoría](I18N_ENTREGA_Y_AUDITORIA.md) · [Contrato](I18N_CONTRATO_Y_PLAN.md) · [Guía de prueba](I18N_PRUEBA_GUIADA.md). Copia previa archives/B00-B06-source-before-i18n.zip; fuente/export nuevos separados, sin archivos previos eliminados. No hay Git operativo, PR ni commit.

Siguen pendientes Safari/iPhone físico, VoiceOver/Dynamic Type/teclado/zonas seguras y 13 paquetes con avisos de herramientas Expo (2 altos, 9 moderados, 2 bajos; 0 críticos). No se identificó un parche compatible en los rangos consultados y no se forzaron cambios mayores. También permanece la separación contable de pagos confirmados prevista en V2 Lote3A. No se declara la app lista para distribución.


## Publicación I01/I02 y autorización permanente — 31/10/2026 UTC

El propietario respondió «Sí» y encargó subir siempre una vista de prueba al terminar y comprobar cada entrega, para verla y probarla. Esta autorización está incorporada aditivamente a AGENTS.md; no se repetirá la confirmación para previews de ese alcance.

I01/I02 está publicado en staging READY, dpl_EijJvk6xY9bKAAS2EaYc9exGweNo, URL base https://jj-compra-inteligente-m0ga298mt-cmj2hwhc6b-1051.vercel.app . Enlace compartido hasta 01/11/2026 14:27:50 UTC; protección conservada y B05 independiente. Cuatro idiomas comprobados en la web publicada, listas/menús/cancelación/preferencia tras recarga correctos y 23 URL idénticas al snapshot por tamaño/SHA1. Bundle SHA256 coincide con la auditoría.

[Publicación y verificación](I18N_PUBLICACION.md). Esta vista tiene datos locales propios; no borra ni mueve datos de B05. Siguen pendientes aceptación de iPhone/Safari físico y los avisos de herramientas registrados en la entrega. Sin nuevo bloque funcional ni promoción a producción.


## 31/10/2026 — G00: GitHub como base y conciliación V2

El propietario ordena copiar el código al repositorio `jjcomprainteligente-ops/Jj-compra-inteligente-` y continuar la actualización. Se localiza la fuente editable original, se conserva la base remota `16ea5dd` y sus tres commits y se prepara la importación sin sustituir la app por un bundle de Vercel.

| Entrega | Estado en esta revisión | Evidencia / siguiente paso |
|---|---|---|
| G00 — Importación | EN CURSO | TypeScript y 496 pruebas unitarias correctas; manifiesto y revisión de exclusiones en `docs/github/`. Falta cerrar subida y verificación remota. |
| V00 — Conciliación GPT-6 V2 | DIAGNÓSTICO DOCUMENTADO; ORIGINALES BLOQUEADOS | `V2_CONCILIACION_VISUAL_2026-10-31.md`: 489 raster y 20 ZIP revisados; originales/recorte del logo ausentes. Recuperar adjuntos. |
| V01/V02 — Corrección visual | PENDIENTE DE REFERENCIAS | No aplicar una interpretación nueva del diseño. Preservar idiomas, lógica y datos; cotejar originales antes de corregir. |

GitHub pasa a ser la fuente principal; Vercel conserva su función de preview. La fidelidad V2, Safari/iPhone físico y avisos de dependencias no quedan resueltos por esta importación.


## 31/10/2026 — Cierre G00 verificado en GitHub y preview

- **G00 VERIFICADO:** código visible en `main`, commit `732d1817f3b856384e98191dd82cb92241011271`; tres commits previos preservados. Clon independiente: npm ci, TypeScript, 496 pruebas y exportación web correctos; manifiesto 85/85.
- **PREVIEW VERIFICADA:** despliegue staging `dpl_Ewmo9hTVBK4WTkkjagSscWy5qj4g`, metadatos del commit de origen, cuatro idiomas y 23 recursos/URLs correctos. Reutiliza el artefacto i18n conservado con fuentes runtime idénticas; no incorpora cambios visuales.
- **AUDITORÍA DE ENTREGA:** revisión de importación, secretos/artefactos excluidos, conservación, reproducción y prueba remota en `github/G00_ENTREGA_Y_AUDITORIA.md`, con evidencia `design/github-g00/`.
- **V00 BLOQUEADO EN RECUPERACIÓN DE ORIGINALES:** diagnóstico de diferencias completado; se han solicitado de nuevo los adjuntos V2/Premium. V01/V02 pendientes de esos archivos. No se etiqueta la preview actual como V2.
- **ABIERTOS:** avisos de dependencias, iPhone/Safari físico y separación de pagos confirmados. Sin nuevas funciones comerciales ni servicios.


## 06/11/2026 — V01/V02 comprobados; cierre de auditoría

Originales V2 recuperados y preservados en GitHub. Base visual y pantallas existentes implementadas con logo exacto, cuatro idiomas y datos locales conservados. TypeScript y 496 pruebas unitarias correctos;128 recorridos web correctos,0 fallos/0 intermitentes,12 skip deliberados y 120 capturas saludables. Exportación web/iOS/Android correcta. Evidencia final `design/v2/evidence/run-2026-11-06T15-03-13-733Z-1VEvNi/`.

La auditoría de la pareja está en `V2_ENTREGA_V01_V02_Y_AUDITORIA.md`; preview remota y PR de revisión se están preparando. No se declaran terminadas las 16 pantallas ni nueve estados. Quedan abiertos10 paquetes con avisos (2 altos), pruebas físicas y módulos futuros. Siguiente: entregar la preview de este commit y recoger diferencias visuales concretas antes de ampliar funciones.


## 06/11/2026 — Publicación V2 comprobada

Preview staging READY `dpl_FEo2wA8AwT4zmcZeGFxSBWpgaL7A`, código `3dbcff9435a6d2aad97e7766e2e38d0fabe790c7`, [PR #1](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/1). Cuatro idiomas, 27 recursos/URLs y 12 capturas remotas correctos; JavaScript decodificado y logo coinciden en hashes. Se conserva protección y producción. Enlace temporal fuera de Git. Detalles en `V2_PUBLICACION_VERIFICADA.md`. Estado de V01/V02: EN REVISIÓN VISUAL; avisos de dependencias, pruebas físicas y módulos futuros permanecen abiertos.


## Verificación integral de los seis adjuntos — baseline 416c787

**Estado del encargo completo: PARCIAL / SIN CIERRE.** La revisión anterior de V01/V02 abarca las vistas que ya existían. Su publicación y 128pruebas correctas no completan por sí solas 16pantallas y 9 estados. Auditoría trazable: `AUDITORIA_COMPLETITUD_V2.md`; diferencias visuales: `AUDITORIA_CORRESPONDENCIA_VISUAL_V2.md`.

| Área | Estado comprobado | Cierre pendiente |
|---|---|---|
| Referencias y logo horizontal | Conservados y verificados | Mantener originales; derivados y demo de marca tienen etapas separadas. |
| Pantallas canónicas | 6 vistas centrales presentes, 2 paneles parciales, 1 presupuesto en formulario, 7 ausentes | Completar rutas y composición: Buscar producto, Detalle producto, Voz, Escáner, Mis tiendas, Historial y Notificaciones; Presupuesto completo; receta/ingredientes como páginas. |
| Estados B03.14 | 4 variantes parciales, 5 ausentes | Preparación ejecutable de los nueve, acciones útiles y pruebas por estado; no simular servicios ni permisos. |
| Datos y confirmación | Listas/menús/comparadores locales útiles | Deshacer altas/ediciones manuales, revisión manual de equivalencias g/kg y registro separado de gastos cuando se implemente Historial. |
| Evidencia | 128 pruebas web y 120 capturas de 10 escenas existentes | Matriz 16+9 con pruebas/capturas de cada objetivo en cuatro idiomas; QA física y accesibilidad pendientes. |
| Marca adicional | PNG horizontal estático | Isotipo/iconos/variantes/vector/tamaños/movimiento y demo aislada según B01-L, con aprobación antes de integrar cambios de marca/3D. |
| B07/IA/B09 | Condicionados o bloqueados | No activar cuentas, sincronización, backend IA, precios comerciales ni checkout sin su alcance, permisos y validación. |

Orden de entregas pequeñas para completar la preparación: A) navegación/subpantallas locales, campana y tiendas/presupuesto/historial/notificaciones; B) búsqueda/ficha/entradas manuales y nueve estados; auditoría A+B; C) receta/ingredientes completos y CTA de Menús; D) cotejo visual/idiomas/cobertura 25 y criterios de aceptación; auditoría C+D. Las funciones de hardware/servicios y marca se tratan en sus bloques, sin declararlas listas por preparar la apariencia.


## 07/11/2026 — V2: dos bloques locales y auditoría automatizada completada

El propietario autorizó continuar la preparación que faltaba. El código está guardado en GitHub: `dfd2a4eb917ef6d49aab794a0d36d799eed6c77d`, rama `codex/v2-cobertura-local`, [PR #2 en borrador](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/2), con base en el PR visual anterior y su historial conservado. El alcance de esta pareja es la navegación y los flujos locales V2; no sustituye las puertas de aceptación de B07–B09 o de marca.

| Entrega | Estado vigente | Alcance comprobable / límite |
|---|---|---|
| A — Navegación y entradas locales | IMPLEMENTADA; EN REVISIÓN | Buscar y Detalle de productos guardados, voz y escáner opcionales con consentimiento, favoritas y avisos internos. Cuatro pestañas y cuatro idiomas; sin catálogo comercial ni notificaciones del teléfono. |
| B — Dinero, revisión y estados | IMPLEMENTADA; EN REVISIÓN | Presupuesto completo, gastos confirmados separados de productos marcados, Historial, receta e ingredientes como páginas, deshacer y duplicados g/kg y ml/L con decisión explícita. Nueve estados rotulados como ejemplos; no simulan permisos o servicios. |
| Auditoría tras la pareja A+B | VERIFICACIÓN AUTOMATIZADA COMPLETA | TypeScript, 660 pruebas unitarias y 182 pruebas web correctas; cero fallos y cero intermitentes. 24 duplicados deliberados de matriz omitidos. Exportaciones web/iOS/Android completadas. |
| Correspondencia visual 16+9 | EN REVISIÓN, SIN APROBACIÓN ESTÉTICA | Matriz de 16 pantallas y nueve ejemplos en es/en/de/fr a tres tamaños CSS. Una captura ejecutable no acredita igualdad píxel a píxel ni aceptación del propietario. |
| Preview de esta entrega | PENDIENTE DE VERIFICACIÓN Y PUBLICACIÓN | GitHub precede a Vercel. Publicar staging y verificar el código/recursos antes de entregar el enlace; mantener protección y producción. |

Las cinco claves anteriores y el logo horizontal original se conservan. Se añaden dos almacenes versionados independientes: gastos confirmados y preferencias de tiendas/avisos. Ambos utilizan la protección de escritura existente; se corrigió su admisión en la lista de claves protegidas. Voz y cámara solo se activan en navegadores compatibles tras consentimiento y una acción explícita; nativo mantiene entrada manual. No hay nuevas cuentas, sincronización, pagos, backend de IA o fuentes comerciales.

Seguridad de dependencias: Expo 58.0.21 → 58.0.23, dentro de la misma versión mayor y sin `overrides`. El informe npm posterior registra cinco avisos moderados, cero altos y cero críticos. No se declara ausencia absoluta de vulnerabilidades; las cinco advertencias y sus cadenas de herramientas siguen abiertas.

Auditoría detallada: [V2_COBERTURA_LOCAL_Y_AUDITORIA.md](V2_COBERTURA_LOCAL_Y_AUDITORIA.md). Informe final: `design/v2/evidence/run-2026-11-07T16-48-40-655Z-p3mv4e/report.json`. Registra 182 pruebas web correctas de 206 registradas, 24 omisiones deliberadas de matrices duplicadas, cero fallos/intermitentes y 420 capturas sin errores de ejecución, claves visibles, recortes ni desbordamientos detectados. Son 300 capturas nuevas de 16 pantallas más nueve ejemplos y 120 de las diez escenas anteriores, en cuatro idiomas y tres tamaños. La comprobación de integridad confirma que los artefactos anteriores permanecen idénticos. La navegación visual conserva las seis claves de negocio de sus contextos de prueba. Los sensores se verifican mediante APIs simuladas, sin atribuir pruebas físicas.

Quedan pendientes revisión visual del propietario/ChatGPT, piloto físico iPhone/Safari y Android, accesibilidad nativa, variantes de marca/3D y los módulos comerciales, cuentas y hogares condicionados. La entrega no completa por sí sola todos los seis paquetes ni B00–B09.

### Cierre de publicación y ajuste accesible — 2026-11-08

Código final de la preview: `746395e614e68624e012e76d13e0fa377e241c6a`. Tras los 182 casos de la suite completa se añadieron dos atributos `aria-checked` al formulario de gastos; los 20 casos locales se repitieron y pasan, sin fallos ni intermitentes. Exportación web/iOS/Android repetida. Preview staging READY, protección conservada y verificación remota en cuatro idiomas / 27 recursos correcta. El enlace temporal se entrega en la conversación y caduca el 9 de noviembre a las 09:00 UTC; su credencial no se guarda en GitHub.

La publicación de código e informes está cerrada; la aprobación estética y el piloto físico siguen pendientes. La revisión automática bloqueó publicar las 100 capturas seleccionadas en GitHub público por posible información sensible y falta de autorización específica. Se mantienen locales, con petición de autorización separada; los informes de texto se conservan en `design/v2/entrega-local-2026-11-07/reports/`. Este bloqueo de imágenes no bloquea la app publicada ni modifica el resultado de pruebas.

## Entrega de filtros y privacidad local — 2026-11-09

Continúa la construcción autorizada mientras el propietario termina las traducciones de sus 150 recetas. La elección visual vigente y el código anterior se conservan.

| Bloque de esta pareja | Estado | Evidencia y límite |
|---|---|---|
| A · Filtros de Menús | IMPLEMENTADO; EN REVISIÓN | Tiempo, preferencia e ingredientes excluidos solo en sesión; propuestas de cinco recetas únicas; confirmación antes de cambiar un plan; presupuesto orientativo sin costes inventados. Catálogo inicial de siete recetas. |
| B · Copias y borrado local | IMPLEMENTADO; EN REVISIÓN | Copia JSON de siete documentos permitidos; seis categorías de borrado independientes con revisión, palabra/casilla, CAS y limpieza de deshacer. No borra documentos corruptos o futuros; permite conservarlos exportándolos. |
| Auditoría tras la pareja | VERIFICACIÓN AUTOMATIZADA COMPLETA | TypeScript, 758pruebas unitarias y 222 casos web correctos,0 fallos / 0 intermitentes. 24 omisiones deliberadas de matrices duplicadas. Los 40 casos nuevos también se probaron por separado. |
| Preview de esta pareja | PUBLICADA Y VERIFICADA | Staging READY desde `fd78ecb09a2d141a9c23426be4a80d087908b1b5`, cuatro idiomas y 27 recursos verificados, incluida descarga JSON y borrado confirmado aislado. Protección conservada. |

Código y revisión: [PR #3](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/3), base PR #2. Auditoría y límites: [MENUS_PRIVACIDAD_Y_AUDITORIA.md](MENUS_PRIVACIDAD_Y_AUDITORIA.md). Informes públicos en `design/menus-privacy/reports/`. Las 420 capturas base y 24 nuevas se conservan localmente; no se publican imágenes o archivos personales de copia.

La preview usa el mismo código de aplicación comprobado y su enlace se entrega por la conversación, con caducidad el 10 de noviembre a las 09:10 UTC y sin guardar la credencial en GitHub. No es aprobación estética ni prueba física iPhone/Safari. `npm audit` mantiene cinco avisos moderados, cero altos/críticos. No se añadieron dependencias o servicios externos.

Pendientes: recibir e incorporar las 150 recetas con su biblioteca persistente, revisión visual, piloto físico y de accesibilidad, trabajo de marca adicional por etapas. Hogares/cuentas/sincronización y comercio real siguen condicionados. No se declara terminada toda la fase por cerrar esta pareja.

## Paneles accesibles y compatibilidad WebKit — 2026-11-10

Continúa la construcción autorizada mientras se prepara la biblioteca de recetas del propietario. Se conserva GPT-6 V2 / Verde Mercado Premium y el PNG oficial exacto. Esta pareja no cambia la arquitectura de datos ni añade servicios.

| Bloque | Estado | Comprobación y límite |
|---|---|---|
| A · Paneles y campos compartidos | IMPLEMENTADO; EN REVISIÓN | Zona segura inferior, foco interior/retorno al disparador, cierre táctil accesible, ayudas de campos y desplazamiento integral cuando texto/cabecera/pie dejan sin espacio al cuerpo. Borradores y bloqueos conservados. |
| B · WebKit y preparación del piloto | IMPLEMENTADO; VERIFICADO EN MOTOR | Suite independiente de 42 casos en cuatro idiomas y dos tamaños; capacidades reales Web Locks/WebCrypto/IndexedDB strict. Guía física preparada. WebKit Linux no certifica Safari iOS ni iPhone físico. |
| Auditoría tras la pareja | VERIFICACIÓN AUTOMATIZADA COMPLETA | TypeScript, 758 pruebas unitarias, 248 casos Chromium y 42 WebKit correctos; cero fallos/intermitentes en las pasadas finales. 24 omisiones deliberadas de matrices duplicadas de Chromium. Exportaciones web/iOS/Android completadas. |
| Publicación | PENDIENTE DE VERIFICACIÓN REMOTA | Guardar esta fuente en GitHub antes de subir la compilación comprobada a Vercel staging; conservar protección y despliegues anteriores. |

La nueva matriz de paneles incluye 26 casos de teclado, borrador, guardado ocupado y texto CSS al 200 % en 320×568, en es/en/de/fr. Las 420 capturas base y las adicionales de paneles/WebKit se mantienen locales. Los informes públicos se guardan en `design/mobile-readiness/reports/`. Se verificó la integridad de los 75 archivos originales/extractos; no se modifica la marca.

[Auditoría y comandos](PANELES_WEBKIT_Y_AUDITORIA.md) · [Guía de aceptación física](IPHONE_PRUEBA_DE_PANELES.md). Cinco avisos moderados de herramientas continúan abiertos; no existe un parche oficial compatible hoy. Sin overrides ni degradación de Expo. Pendientes: revisión visual, iPhone/Safari físico y accesibilidad nativa, incorporación de las 150 recetas cuando se reciban, variantes de marca/3D y módulos condicionados de hogares/comercio. No se declara terminada toda la aplicación ni B00–B09.


### Publicación verificada — 2026-11-10

Fuente de aplicación: `23bde4371aa041a6ab96ab2f62afe815a6f5c472`, [PR #7](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/7), base en la entrega de filtros/privacidad. Preview `staging` READY: `dpl_BX1bmmAu4j653jPPJ3oS9AqjFp6K`, URL base https://jj-compra-inteligente-e3qq1imu1-cmj2hwhc6b-1051.vercel.app . Protección conservada. Verificación remota correcta en es/en/de/fr y 27 recursos por bytes/hash, incluidos filtros, guardado, menús, copia JSON exacta y borrado confirmado aislado. El enlace temporal se entrega únicamente en la conversación; vence el 11 de noviembre de 2026 a las 15:00:33 UTC. Su credencial queda fuera de GitHub. Informe: `design/mobile-readiness/reports/hosted-verification.json`.

Los borradores separados [PR #4, piloto de tiendas](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/4) y [PR #5, especificación de precios y salida externa](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/5) se localizaron en GitHub y permanecen intactos. No forman parte de esta preview ni se fusionaron automáticamente; su validación e integración es una entrega posterior. Se conserva el historial y no se promueve a producción. La prueba física, la revisión visual, las 150 recetas y los cinco avisos moderados siguen pendientes.
# Piloto de tiendas y precios · 10/11/2026

En preparación sobre la última entrega `936459d`: selección persistente de una/varias/todas las seis opciones Lidl, ALDI, HiperDino, SuperDino, Express y Mercadona, con enlaces oficiales según su capacidad. La compra/pago siempre ocurre en la tienda externa. Se verificó acceso HTTP a los seis destinos y se investigaron fuentes oficiales; todavía no existe un feed de precios conectado. El comparador manual no usa este selector como filtro. TypeScript y 759 pruebas unitarias correctos; exportaciones web/iOS/Android completadas. Chromium local bloqueado por un socket denegado antes de ejecutar los tests; verificación directa y publicación pendientes de registrar. [Alcance y fuentes](PILOTO_TIENDAS_Y_PRECIOS_2026-11-10.md).


## Tiendas y listas compartibles — 2026-11-11

Se integra el borrador de tiendas `2ae8d27` sobre la entrega de accesibilidad `338ba24`, conservando ambos historiales y los anexos previos. La pareja construida incluye selección de una, varias o todas las seis tiendas del piloto con destinos oficiales, y compartir una copia revisada de la lista en texto, sin notas, precios, presupuesto o IDs. No cambia las siete claves locales ni activa cuentas, fuentes de precios o pagos.

Auditoría completa: TypeScript y 816 unitarias correctos; 298 Chromium y 92 WebKit correctos, cero fallos/intermitentes en las pasadas finales. Chromium registra 24 omisiones deliberadas de matrices duplicadas. Los 50 recorridos nuevos pasaron también por separado. Exportaciones web/iOS/Android, 420 capturas base, capturas adicionales locales e integridad de 75 referencias comprobadas. La prueba detectó y corrigió retorno de foco del botón Compartir; se mantuvo su aserción.

[Auditoría](TIENDAS_COMPARTIR_Y_AUDITORIA.md) · [Inventario vigente](ESTADO_ACTUAL_Y_PENDIENTES.md). Informes públicos en `design/stores-sharing/reports/`; imágenes y trazas locales. La consulta npm nueva del 11/11 mantiene cinco moderados, cero altos/críticos, sin parche oficial compatible ni cambios de dependencias.

Marca: lámina técnica aislada con el PNG exacto, seis tamaños y cuatro fondos; no se presenta como SVG, isotipo, icono o 3D nuevo. Puede incluirse en la preview como revisión estática separada de la app. Los derivados siguen su revisión/aprobación.

Cuentas/hogares no se fingen mediante compartir texto. Se prepara una propuesta independiente de B07 antes de activar proveedor, autenticación y datos remotos, con aprobación de arquitectura y costes conforme a AGENTS.md:18 y B07:17. Siguen pendientes las 150 recetas, la prueba física y la aceptación visual. GitHub precederá a la preview staging protegida de esta entrega.


### Publicación verificada — 11/11/2026

Fuente compilada: `c0c7a312e5ad91313a059c25c8594a12ea48a6dc`, [PR #8](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/8). Incluye ambos padres de integración `338ba24` y `2ae8d27`; no se sustituyó el trabajo previo. Staging READY: `dpl_5HaNVgJxEtpz9zX2gpWScLFnXRWU`, URL base https://jj-compra-inteligente-3y5pjf63u-cmj2hwhc6b-1051.vercel.app . Protección conservada, sin promoción a producción.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash. Comprueba selección de seis tiendas, contratos de navegación externa con mock sin ir a los comercios, copia TXT exacta sin notas privadas, retorno de foco, siete documentos intactos al compartir, backup exacto, borrado confirmado aislado, idiomas persistentes y lámina de marca con PNG original/CSP. El enlace temporal se entrega fuera de GitHub y vence el 12/11/2026 a las 11:21:05 UTC. Informe público: `design/stores-sharing/reports/hosted-verification.json`; capturas y credencial locales.

B07 tiene una propuesta concreta separada en [PR #9](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/9): documento y contrato JSON de 20 operaciones; no activa servicios ni modifica la app. Antes de activar cuentas/hogares deben aprobarse proveedor/proyecto, tratamiento y región, autenticación/correo, costes y retención, conforme a AGENTS.md:18 y B07 original:17. Las 150 recetas, derivados de marca aprobados, aceptación visual y validación física siguen pendientes; cinco avisos npm moderados continúan abiertos.


## B07.1–B07.2 · Contratos y base aislada — 11/11/2026

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


## Piloto iPhone del recorrido diario · 11/11/2026

El propietario priorizó menú → revisión de ingredientes → lista → compra → presupuesto y gasto confirmado sobre la aplicación existente. Se conserva Verde Mercado Premium, el logo oficial, cuatro idiomas y siete documentos locales. Cuentas/hogares y B07.2 permanecen separados y abiertos; no se activa sincronización ni se crean datos QA preinstalados.

Pasaron 298 casos Chromium con 24 omisiones duplicadas deliberadas y ocho casos WebKit focalizados en cuatro idiomas y dos tamaños CSS, con 80 capturas y ocho informes de recorrido. La receta ajustada de dos a cuatro personas y un ingrediente excluido produjo exactamente los nombres/cantidades/unidades revisados, sin alterar el plan completo; cancelación, gasto separado, copia y recarga conservaron los datos esperados. Publicación y comprobación remota siguen pendientes; no se atribuye una prueba física a WebKit Linux. [Informe técnico](../design/iphone-pilot/reports/technical-verification.json), [Chromium](../design/iphone-pilot/reports/chromium-regression.json) y [WebKit](../design/iphone-pilot/reports/webkit-daily-journey.json). TypeScript, 963 pruebas unitarias, compatibilidad oficial de Expo y exportaciones web/iOS/Android correctos. Cuatro dependencias existentes alineadas dentro de SDK 58; audit actualizado: tres moderados de herramientas, cero altos y cero críticos. No se aplica una rebaja mayor de Expo para ocultarlos.

`eas.json` prepara `iphone-preview` (internal/Release/dispositivo) e `iphone-testflight` (store/Release/dispositivo), con commit limpio requerido. No se ejecutan build, firma, distribución ni envío; no hay cuentas enlazadas, credenciales o icono cuadrado aprobado. Linux no permite ejecutar Xcode. La vía inmediata de prueba es Safari con una preview protegida comprobada, después de guardar el código en GitHub. No se asume que Expo Go SDK 54 de la App Store pueda abrir SDK 58, ni se acepta un coste de Apple/EAS.

[Guía de aceptación diaria y límites nativos](IPHONE_PILOTO_RECORRIDO_DIARIO.md). El gasto confirmado debe distinguirse de lo marcado con precio introducido; cancelar la revisión no cambia documentos, confirmar ingredientes solo cambia la compra, confirmar un gasto solo cambia gastos y revisar/compartir una copia no cambia los siete documentos. Se requieren pruebas físicas de teclado, zonas seguras, texto grande, VoiceOver, persistencia y recepción de la copia. La prueba offline se limita a la app ya cargada, sin acreditar PWA o arranque en frío. Las 150 recetas y aceptación visual siguen pendientes.


### Publicación y comprobación del piloto diario · 11/11/2026

Fuente compilada `54fc7efe3980f4295f3e873aa7710276903c3f7a`, [PR #12](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/12), guardada en GitHub antes de publicar. Staging READY `dpl_G6ZFWo9HDUazteMj99MBTg16PaLj`, origen protegido https://jj-compra-inteligente-34ekbbs6j-cmj2hwhc6b-1051.vercel.app; no es una publicación abierta ni una promoción a producción. El cierre documental posterior conserva sin cambios la aplicación de ese commit.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash, con los flujos locales y protección `all_except_custom_domains` conservados. [Informe remoto](../design/iphone-pilot/reports/hosted-verification.json) y [registro del despliegue](../design/iphone-pilot/reports/deployment.json). El enlace compartido se entrega fuera de Git y vence el **12/11/2026 a las 22:56:56 UTC**; no se publican su credencial, capturas privadas ni datos del propietario.

Esta comprobación cierra los pendientes de publicación indicados en la preparación anterior. No acredita prueba física, binario nativo ni envío a TestFlight. Permanecen pendientes la aceptación visual/física, las 150 recetas del propietario, los tres avisos moderados de herramientas y la matriz completa de B07.2; no se activan cuentas ni sincronización.


## Preparación del catálogo V83 · 12/11/2026

En `codex/v83-recetas-auditadas`, base `dbb703f62486ac4f639947da429761ed42c062d8`, se prepara la integración de los nuevos adjuntos: 150 recetas, 750 fichas es/en/de/fr/bg y XLSX del lote 141–150. Auditoría documental: 13 tamaños/hashes del manifiesto coinciden, XLSX embebido idéntico al adjunto y campos del lote concordantes con JSON; no se ejecutan macros, fórmulas ni scripts suministrados. Se conservan originales y BG, sin activar una interfaz búlgara parcial.

La disponibilidad preparada es 120 recetas V83 más siete anteriores, 127 registros, conservando IDs y compatibilidad de planes. Las posiciones 11–20 y 111–120 discrepan entre capas; 31–40 mantienen cata pendiente. La aclaración del propietario sigue sin respuesta: esas 30 permanecen fuera del catálogo activo. Carbonara mantiene huevo/yemas pasteurizados como condición y advertencia; no hay certificación sanitaria ni aprobación comercial automática de 150.

No estimar los 90 tiempos ausentes de la fuente: mostrarlos desconocidos y excluirlos con límite de tiempo. Conservar medidas fraccionarias en milésimas y calificadores de diente/hoja/rama/tamaño al adaptarlos a ud; no convertir un diente en un ajo entero ni inventar gramos. Las tres sales sin medida y acompañamientos sin cantidad se muestran sin transferencia automática; opcionales y avisos/adendas se conservan, con respaldo español rotulado cuando falte traducción. No inferir dieta o ausencia de alérgenos. No añadir precios, stock o certificaciones.

Se prepara paginación de 20 recetas/20 exclusiones y memoización, sin cambiar Verde Mercado Premium, logo, siete documentos, protecciones de escritura o backends. [Alcance, auditoría y cierre pendiente](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md). Pruebas de aplicación, exportación, publicación y verificación remota V83 siguen pendientes; los informes previstos estarán en `design/v83/reports/`. La evidencia anterior del piloto iPhone acredita su fuente `54fc7efe`, no este cambio. GitHub precede a una nueva preview protegida tras comprobar el alcance habilitado. La prueba física, binario/TestFlight, biblioteca editable y B07.2 siguen separados y pendientes.


## V83 · Fuente pública y verificación inicial · 12/11/2026

La integración contiene 120 recetas nuevas y conserva las siete anteriores: 127 IDs disponibles en código. Los adjuntos completos se auditaron como 150 recetas y 750 fichas en es/en/de/fr/bg. La aclaración de las posiciones 11–20, 31–40 y 111–120 sigue pendiente; una indicación general de continuar no confirma sus catas o revisión operativa. Esas 30 no se activan ni se incluyen en las traducciones compiladas. Las condiciones de huevo/yemas pasteurizados, alérgenos, etiquetas y trazas se conservan; no hay aprobación comercial ni certificación implícita.

El repositorio canónico es público. El original de 150 permanece intacto en `referencias/recetas-v83/originales/`, excluido de Git y del despliegue. GitHub recibe solo la selección pública de 120 registros originales íntegros con cinco idiomas, 600 fichas, en `fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip`, SHA-256 `5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62`. La comparación independiente con decimales exactos pasó para los 120 registros. La procedencia de las 30 retenidas conserva únicamente ID, posición, motivo y hash; no su contenido. `--check` reproduce desde esa fuente pública y las pruebas de CI no requieren el original local ni omiten casos por su ausencia. La auditoría completa del original de 150 y sus 13 hashes sigue disponible mediante `--source-zip RUTA --check` cuando se dispone del adjunto.

TypeScript y 981 pruebas unitarias correctos, cero fallidas u omitidas, en 27 archivos: 963 anteriores y 18 V83. Se comprobaron la firma histórica de las siete recetas, datos/traducciones por receta y línea, respaldo español, tiempos nulos, precisión de medidas y escalado a 1/2/4/12 personas. La revisión independiente corrigió la validación de arrays con huecos en los ingredientes sin medida. Exportaciones web/iOS/Android correctas desde `dist-v83-final`; no constituyen un binario iOS firmado. No se añadieron dependencias ni se cambiaron versiones. El audit actualizado mantiene tres avisos moderados de herramientas Expo/fingerprint/minimatch, cero altos y cero críticos; no acredita ausencia absoluta de vulnerabilidades.

La interfaz conserva es/en/de/fr, Verde Mercado Premium, el logotipo y los siete documentos con sus protecciones. Catálogo y sustituciones se amplían de 20 en 20; las exclusiones de ingredientes, de 40 en 40. De las 120 seleccionadas, 80 no tienen tiempo de preparación/cocción y se muestran desconocidas; las tres sales sin medida no pasan automáticamente a la compra. BG queda conservado en las fuentes, sin activar una interfaz incompleta.

Las matrices completas de Chromium y WebKit V83 siguen en ejecución; publicación y verificación remota continúan pendientes. Los informes de esta versión se reunirán en `design/v83/reports/`. La evidencia anterior de `54fc7efe` no sustituye esos resultados. GitHub debe recibir el código comprobado antes de una nueva preview protegida. Prueba física, aceptación visual, firma/TestFlight, colección editable y B07.2 permanecen pendientes y separados. [Documento vigente de integración](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md).


## V83 · Regresión de navegador comprobada · 12/11/2026

La versión final de V83 pasó 298 casos Chromium, con 24 omisiones deliberadas de capturas duplicadas y artefactos anteriores intactos. Se conservaron 120 capturas de recorridos y 300 del inventario V2, que comprende 16 vistas y nueve ejemplos de estado. La matriz WebKit pasó 16/16 casos, cero omitidos y cero intermitentes: ocho del recorrido diario y ocho de recetas nuevas, en es/en/de/fr y tamaños CSS 375 × 667 y 430 × 932; 120 capturas lógicas, 80 diarias y 40 de V83.

Los recorridos comprobaron catálogo y sustitución paginados, última receta accesible, tiempo desconocido explícito, unidades con significado conservado, avisos completos e ingredientes al gusto fuera de la transferencia. La revisión/cancelación, coincidencia exacta entre cantidades revisadas y guardadas, presupuesto y producto manual conservados, documentos ajenos a cada escritura intactos y persistencia de un nuevo ID tras recargar dieron los resultados esperados. Se inspeccionaron dos capturas de detalle, alemán a 375 y francés a 430, sin problemas visibles nuevos en ellas; no equivale a aceptación visual completa ni a un dispositivo físico.

Se mantienen correctos TypeScript, 981 unitarias en 27 archivos, reproducción de la selección pública y exportaciones web/iOS/Android. [Verificación técnica](../design/v83/reports/technical-verification.json), [revisión independiente](../design/v83/reports/independent-review.md), [comparación de fuente](../design/v83/reports/independent-public-selection.json) y [recorridos WebKit](../design/v83/reports/webkit-journeys.json); la evidencia Chromium se incorpora en la misma carpeta. GitHub y la nueva preview V83 quedan pendientes de publicación/verificación, en ese orden, conservando la protección del proyecto. No se reutiliza una preview anterior como prueba de este cambio.

Las 30 recetas retenidas siguen fuera del repositorio público y del cliente hasta aclaración expresa. El original completo permanece local e ignorado por Git; la selección pública reproducible contiene solo las 120 elegidas y sus cinco idiomas. El audit conserva tres avisos moderados de herramientas, cero altos y cero críticos, sin nuevas dependencias. Prueba física, aceptación visual, firma/instalación/TestFlight, colección editable y B07.2 siguen pendientes y separados.

[Informe Chromium V83 disponible](../design/v83/reports/chromium-regression.json).


## V83 · Publicación pública detenida por revisión automática · 12/11/2026

La revisión automática rechazó crear el árbol de la entrega en GitHub: el repositorio es público y falta autorización expresa para exponer las 120 recetas seleccionadas, sus cinco traducciones y los manifiestos derivados de IDs/estados/hashes. No se creó commit, rama remota, PR ni preview V83; no se reintentó por otra vía. Los tres blobs y el árbol intermedio preparados antes del rechazo no constituyen una entrega referenciada. El código local, las 981 unitarias, 298 Chromium y 16 WebKit correctas, las exportaciones y los informes se conservan. Los contenidos de las 30 retenidas y el original completo siguen fuera del índice de Git. La preview exige GitHub primero y queda detenida por ese requisito. [Detalle de acción y autorización pendiente](V83_PUBLICACION_PENDIENTE_DE_AUTORIZACION.md).


## V83 · Autorización expresa de publicación recibida · 12/11/2026

El propietario respondió «Si publica las 120 ( porque no 150 ?)» a la pregunta de publicar el catálogo seleccionado, sus cinco traducciones y manifiestos de IDs, estados y hashes en el repositorio público. Con esta autorización específica se reanuda la publicación previamente rechazada, por el mismo conector y conservando GitHub antes de Vercel. No se modifica la visibilidad ni se eliminan registros anteriores. Se aclaró que las 150 fichas están recibidas: 11–20 y 111–120 tienen estados contradictorios, y 31–40 mantiene cata pendiente. La autorización para publicar 120 no resuelve esos estados ni activa las 30.


## V83 · Publicación autorizada y verificada · 12/11/2026

El propietario autorizó expresamente publicar las 120 recetas seleccionadas, sus cinco traducciones y los manifiestos de IDs/estados/hashes en el repositorio público. Se completó la acción antes detenida mediante el mismo conector, sin cambiar la visibilidad ni eliminar el historial. Código y fuente seleccionada en [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), rama `codex/v83-recetas-auditadas`, fuente compilada `0ea49b597f45b401747e20d7d880c07f670b3073`; GitHub recibió el código antes de Vercel. El original completo de 150 y los contenidos de las 30 retenidas permanecen locales, ignorados por Git y fuera del cliente.

Staging READY `dpl_Ba9JkTFd9o1pNG6TknGriMgMxVGs`, origen protegido https://jj-compra-inteligente-np116q25a-cmj2hwhc6b-1051.vercel.app. Protección `all_except_custom_domains` conservada. La verificación remota pasó en es/en/de/fr, sin errores, con 29 recursos/URLs por hash; en cada idioma comprobó explícitamente 127 recetas y `JJ-E03-001`, además de los recorridos locales. [Informe remoto](../design/v83/reports/hosted-verification.json), [despliegue](../design/v83/reports/deployment.json) y [revisión independiente de publicación](../design/v83/reports/publication-check.md). El enlace temporal se entrega por la conversación y vence el **13/11/2026 a las 15:56:07 UTC**; no se guarda su credencial, capturas ni estado del navegador en Git.

El cierre añade verificación e informes/documentación y conserva los inputs de la aplicación compilada del commit de origen. Se mantienen 981 unitarias, 298 Chromium con 24 omisiones deliberadas y 16 WebKit correctos; el audit conserva tres avisos moderados de herramientas, cero altos o críticos. No se activan las 30 recetas: 11–20 y 111–120 tienen estados contradictorios, y 31–40 sigue pendiente de cata; sus traducciones sí están recibidas. La autorización para publicar 120 no resuelve esos estados. Continúan pendientes Safari/iPhone físico, aceptación visual, firma/instalación/TestFlight, colección editable y B07.2.


## Seguridad y calidad · 13/11/2026

Entrega sobre la app existente y base `5795f299e35186f372c325299d8a6828993df720`, rama `codex/cierre-seguridad-y-calidad`. Se conserva el historial, Verde Mercado Premium, logo original, siete documentos con sus protecciones, IDs y catálogo de 120 V83 más siete anteriores. Las 30 retenidas siguen fuera del cliente y del contenido público. No se declara completado el conjunto B00–B09.

Se resuelve el aviso `GHSA-g3hv-75wg-m249` que producía los tres avisos moderados de herramientas: override exacto de `@expo/fingerprint@0.21.10` a `minimatch@11.0.8`, junto con Expo 58.0.25 dentro del mismo SDK 58. Sin dependencias nuevas de la app ni cambios mayores directos. Instalación sin scripts; audit actualizado con cero vulnerabilidades y comprobación oficial Expo correcta. El uso real de minimatch por Expo pasó 31.824 comparaciones sin diferencias; fixture aislada con 17 fuentes y huella idéntica antes/después del override bajo Expo 58.0.24. No se extrapola esa huella al parche Expo ni a usos arbitrarios de minimatch.

B08 incorpora contraste y áreas reproducibles, estados pulsados, calibración, foco y rendimiento anónimo. Se corrigen el color activo del Switch web, el contraste pulsado de 2,8983:1 por opacidad y las áreas breves afectadas. Matriz completa del compilado `349e6e…`: 298 Chromium correctas y 24 omisiones deliberadas, 16 WebKit correctas, 296 escenas de calidad en cuatro idiomas y dos tamaños, sin fallos medidos de contraste o mínimo AA de 24 px. Las dos observaciones de 41,45×44 px del filtro inglés motivaron el último ajuste a 44 px y su comprobación focalizada separada. Ocho casos de pulsación comprueban 40 estados; pasan cinco calibraciones y un caso con Tab real. Hay 1.272 registros para revisión humana de pintura: no son fallos ni una certificación WCAG.

Se completan 24 ejecuciones anónimas del recorrido diario, cuatro idiomas ×dos tamaños ×tres repeticiones, sin datos del propietario, nuevo servicio de analítica ni nuevas claves de almacenamiento. Tiempos de automatización en entorno compartido, no iPhone físico ni resultados de piloto con personas.

La reproducción limpia con dos workers pasa 981/981 unitarias en 27 archivos usando solo la selección pública V83. Se conserva el intento anterior con un timeout bajo carga concurrente; no se alteran aserciones ni umbrales. Workflow preparado con acciones fijadas por SHA, permisos de lectura y sin secretos/despliegues. Exportaciones finales, comprobación inglesa focalizada, ejecución remota del workflow, GitHub y nueva preview se registrarán por resultado efectivo; todavía no se declaran publicados. GitHub debe preceder a staging protegida y a su verificación.

B07 sigue abierto: una solicitud MCP de la matriz original el 12/11 a las 20:33:31,649 UTC no produjo resultado antes de interrumpir la espera a las 21:02 UTC. Estado `no_result_native_control_unresolved`, cero aserciones o ROLLBACK atribuidos. Revisión posterior solo de lectura: 16 tablas examinadas vacías, sin objetos temporales, 14 RLS/FORCE y lector NOLOGIN/NOBYPASS sin esquema Auth conservados; diez INFO privados deliberados, cero WARN/ERROR. Sin reintentos por otro canal, usuarios ni correos. La autorización existente no requiere otro «sí» por chat; sigue sin resolverse el control del proveedor.

Tras esa matriz siguen pendientes de construcción/validación BFF/cuentas, RPC, invitaciones, migración y sincronización, con SMTP y secretos de servidor adecuados. También quedan prueba física, accesibilidad nativa, firma/distribución Apple, derivados de marca aprobados, estados de las 30 recetas y fuentes comerciales autorizadas. Una biblioteca personal editable o restauración automática de backups son ampliaciones separadas, no requisitos obligatorios omitidos del encargo original revisado. [Informe vigente de alcance, evidencia y límites](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md); informes saneados en `design/closeout/reports/`.


### Seguridad y calidad · verificación final local, 13/11/2026

Exportación final `dist-closeout` correcta para web/iOS/Android; JavaScript web SHA-256 `f094b7f4d002c4dacc83350d7b20f1c9858c2a60b35fe22a132cfe07d7995f3b`. El filtro inglés corregido pasó **2/2 casos, 74 escenas a 375×754 y 430×932**, sin fallos medidos ni observaciones bajo 44 px. Se conserva un intento previo que no llegó a iniciar Chromium por el sandbox del entorno; no se cuenta como ejecución de la aplicación. La fuente de trabajo pasa 981 unitarias; la reproducción limpia con dos workers pasa 981/981 en 27 archivos y export web. La matriz completa/benchmark permanecen identificados con su fuente anterior `349e6e…`; la última diferencia de app es solo el ancho mínimo del filtro. Continúan pendientes GitHub, ejecución CI remota, nueva preview protegida y verificación del contenido publicado. [Informe actualizado](CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md).


## Cierre publicado de seguridad y calidad · 13/11/2026

- [PR #19](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/19), fuente `096330d2b3a3123dc759a1ef0a6123aa67a0d249` y árbol `29c3a5f5b8ede861f99af80d4a8206f1eb5d4d6a`. [CI remota](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43439536526) correcta para ese commit.
- Export final web `f094b7f4d002c4dacc83350d7b20f1c9858c2a60b35fe22a132cfe07d7995f3b`; ajuste final inglés comprobado en dos casos/74 escenas, sin fallos medidos ni recomendaciones de 44 px pendientes. La matriz completa previa conserva su hash y su alcance.
- Preview `dpl_8sVfcijzQ2GK7TUW4hkp2ap2euG3`, `READY`, `staging`, protección conservada. Verificación HTTPS correcta en cuatro idiomas y 29 recursos/URLs por hash; catálogo de 127 recetas. [Informes](../design/closeout/reports/deployment.json).
- Enlace temporal solo en conversación, caduca 14/11/2026 13:08:31 UTC. Cierre documental separado, sin cambios de app, lockfile, almacenamiento, logo ni datos del propietario.
- B07 sigue sin resultado del control nativo; no se cuentan aserciones. Prueba física y 30 recetas retenidas siguen pendientes. No se afirma cierre de B00–B09 ni seguridad absoluta.
- Nueva instrucción: verificar las aportaciones recientes de tiendas en GitHub y continuar en una entrega separada, preservando lo existente. No se activa una fuente comercial por su mera presencia en un repositorio.


## Publicación final del ajuste visual · 13/11/2026

- Origen final `17d5fbc8adf9f8cbd07f7bd930a19a086931a841`, [PR #19](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/19), [CI correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43451697596). Ajuste web del pulgar centrado, con prueba negativa previa y positiva sobre compilado; 8/8 calidad y 9/9 pulsación/foco. Los informes anteriores mantienen sus hashes y alcance.
- Preview `dpl_ETU2D6tyLxV89TXVQHB2BNwXQUvz`, READY/staging/protección conservada; cuatro idiomas y 29 recursos/URLs comprobados por hash. Catálogo 127, logo exacto y siete documentos locales preservados.
- Acceso temporal hasta 14/11/2026 a las 14:23:22 UTC, solo en conversación. [Despliegue final](../design/closeout/reports/deployment.json). Cierre documental sin cambios de app/dependencias. B07 y prueba física siguen abiertos.


## B06.1 · Auditoría real de fuentes, entrega documental · 13/11/2026

El plan aprobado del PR #16 pide expresamente «Guardar diagnóstico reproducible y conclusiones en PR documental». Este registro contiene solo documentación y conteos; no cambia aplicación, dependencias, BD ni producción y no crea preview B06. [Informe reproducible](auditorias/b06-1-2026-11-13/B06_1_AUDITORIA_FUENTES_2026-11-13.md) · [revisión del repositorio](auditorias/b06-1-2026-11-13/REVISION_REPOSITORIO_TIENDAS_2026-11-13.md).

- Leídos PR #16 (`95686b3`) y PR #11 (`2562d98`), issues #13/#14/#17/#18 y contrato. Las seis tiendas ya están en la app; la nueva necesidad son fuentes de precios dentro de JJ. No se fusiona el código no probado del PR #11.
- tuTándem: HTTP 200, esquema correcto, 1.471 filas/28 productos/cinco cadenas; observación más reciente 03/11/2026, diez días. Medianas nacionales sin GTIN/tienda/localización. CC BY 4.0 declarada, con atribución y revisión de procedencia. CORS observado no permite fallback directo desde Vercel.
- Open Prices: API/documentación/export 200; 27 observaciones históricas en siete lugares Tenerife, 0 del 07–13/11. Export completo de 7.881 lugares coincide. ODbL exige atribución y condiciones de base derivada; no mezclar automáticamente con datos propietarios ni derechos de imágenes.
- Ambas fuentes `needs_review`, `enabled=false` para PVP local actual. No hay cesta local completa ni ranking cercano acreditados. B06.2 queda pendiente de revisión de fuente/licencia/alcance; posibles indicadores históricos separados, sin llamarlos PVP Tenerife vigente. Borradores comerciales sin enviar.
- Evidencia pública saneada: URL/HTTP/UTC/hash/contadores; sin cuerpos completos, filas de precios, imágenes, contribuidores ni localizaciones detalladas. Evidencia original privada conservada.


## Bloque 01 maestro · consolidación iniciada · 13/11/2026

El propietario autorizó comenzar el primer bloque posterior a la auditoría, conservando el producto existente. Base revisada: `abb3bca53953e4523af61118e375df90d1a8d416`; `main` permanece en `d22d66eff03c5d107f5170ee38cd2bc3167865e2`. Se crearon referencias local/remota `codex/respaldo-base-2026-11-13` y `codex/integracion-maestra-2026-11-13`, ambas sobre ABB, sin merges ni cambios de código de aplicación.

- Copia privada local del ZIP150 y restauración comprobadas: 937.580 bytes, SHA-256 `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034`, 13/13 entradas del manifiesto y 14 archivos restaurados, 150 IDs/750 fichas. El original se conserva. **Respaldo externo independiente pendiente**, no declarado completo; el usuario tiene una pregunta de destino y un enlace privado de descarga. Ver [estado público saneado](MAESTRO/RESPALDO_ESTADO_PUBLICO.json). No subir el ZIP privado ni su restauración al repositorio público o Vercel.
- Documentos originales del nuevo plan conservados byte a byte en [fuentes del maestro](MAESTRO/fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md), con manifiesto de recepción. El mensaje de auditoría se conserva como instrucción histórica de Bloque00; no anula la autorización posterior de Bloque01.
- Incorporados selectivamente los tres documentos de producto del PR #16 desde `95686b3ac4541f7179ee7cfd858be97628d4be99`: plan, contrato y cuatro borradores. Blobs idénticos `5b1529d2a76ff4fe18b8fd9d23f378c967b883d5`, `b8c12c8115f079611ba3e30c186006d3d494c888`, `5dbacc3526acb3dee05f1d9ed2abc68140cb5f23`. No se fusiona su rama antigua ni el código del PR #11; borradores sin enviar y fuentes PVP desactivadas.
- Inventario único, política de integración y distinción entre documentación vigente e historia en preparación. El historial se conserva.
- Comprobaciones nuevas ejecutándose en copia limpia aislada de ABB sin ZIP privado, credenciales o estado del navegador. Resultados y fuente final todavía pendientes; los informes anteriores conservan su SHA y no se reutilizan como una ejecución nueva.
- Bloque01 sigue **EN_CURSO**; no se abre otro bloque, no se modifica aplicación mientras el requisito de respaldo permanezca abierto y no se promueve producción.


### Baseline limpio comprobado antes del primer commit documental · Bloque01

Sobre ABB se instaló desde el lockfile sin scripts, en copia aislada sin original privado 150 ni datos locales. Importador público, tipos, 981/981 unitarias (0 fallidas/omitidas), auditoría npm 0, compatibilidad Expo y exports web/iOS/Android correctos. El bundle web coincide exactamente con C3f publicado; los HBC nativos conservan sus hashes propios de entorno/ruta. [Reporte saneado](../design/master-integration/reports/baseline-existing-app.json).

El primer commit de integración solo consolida documentación y los documentos exactos de PR16. La matriz de navegador se ejecutará sobre ese árbol identificado, verificando que todos los inputs de aplicación coinciden con el export. El respaldo externo sigue pendiente; no se declara Bloque01 cerrado ni se modifica código de aplicación.


### Integración documental publicada y CI · Bloque01

Publicado origen `78480fd40b4a116d53ebb016f31085785f42a6e6` en PR #21 (borrador hacia main), con 15 archivos documentales nuevos/modificados respecto a ABB, sin cambios de aplicación/dependencias/assets/tests/scripts. La CI 43514500031 terminó correctamente. El diff hacia main contiene el trabajo previo no fusionado; no se atribuye todo a esta entrega.

Revisión selectiva de PR #5: se conservaron solo dos documentos ausentes con blobs exactos `33c12c20dd98cb69998cf56ac99012df01d6c1ad` y `1adbe9f1d78c19d3934766fc975a49ec4318bfbe`. [Procedencia y límites](historico/PR05_2026-11-10/README.md). No se aplican PRODUCTO/PLAN/DECISIONES antiguos. Candidatos locales y mayoristas pendientes de auditoría, no feeds habilitados.

La regresión completa local empezó sobre 78480fd tras superponer solo sus documentos y comprobar 159/159 huellas de inputs idénticas al baseline; bundle web C3f. No se declara terminada antes de su resultado. Respaldo independiente sigue pendiente; bloque EN_CURSO, código conservado.


## Cierre de subtareas verificables de Bloque 01 · 14/11/2026

- Fuente app comprobada/desplegada `78480fd40b4a116d53ebb016f31085785f42a6e6`, PR #21. CI 43514500031 correcta. Baseline limpio ABB 981/981, tipos/importador público/npm 0/Expo/export 3 correctos. Chromium 298 correctos + 24 omisiones deliberadas y WebKit 16/16, cero fallos/intermitencias, sobre 78480fd y bundle C3f. 159/159 huellas coincidentes; no se cambió código de aplicación, dependencias, recursos, scripts o pruebas. [Ficha de versión](../design/master-integration/reports/integration-verification.json).
- Candidata `dpl_G3PZ39MHNk7a2ipCuLZBTRymtuWg`, READY/staging, protección conservada. HTTPS revalidado 14/11: es/en/de/fr, 127 recetas y 29 recursos/URLs por hash; siete documentos conservados en los recorridos. Acceso temporal solo en conversación hasta 14/11/2026 21:10:36 UTC. No se publica el token en Git.
- Comparación de lectura 375/430: producción abre Inicio antiguo; staging abre Bienvenida con logo oficial. Son estados distintos, no un antes/después de la misma pantalla. No se promovió producción ni se fusionó main; ambos mantienen sus referencias anteriores. Capturas privadas, resumen/hashes públicos.
- Documentación exacta de PR #5 y PR #16 conservada selectivamente, sin aplicar árboles antiguos ni activar fuentes. Textos anteriores de README/ESTADO/DIRECCION conservados bajo ARCHIVO_HISTORICO; PLAN y DECISIONES se amplían sin borrar antecedentes.
- **Bloque 01 EN_CURSO: preparación/restauración local de ZIP 150 comprobadas; respaldo privado externo independiente SIN CONFIRMAR.** No atribuir descarga al propietario por un «Sigue». Esa es la única acción pendiente para cerrar la puerta de conservación antes de modificar código. No se abre el Bloque 02. La aprobación visual, el iPhone físico, las 30 recetas y B07 conservan sus criterios separados.
- El siguiente commit es cierre documental: los resultados de navegador pertenecen a 78480fd y no se registran como otra ejecución en el commit de informes. Los datos locales, ZIP privado y capturas/trazas permanecen fuera del repositorio público y de la preview.


## Bloque 02 maestro · QA del recorrido exacto · 14/11/2026

El propietario confirmó una copia «en la carpeta del proyecto» y ordenó continuar. Se registra su declaración sin atribuir inspección externa ni cerrar 01.1. Se adelanta QA del recorrido con la aplicación intacta: no se implementan funciones ni se altera el almacenamiento. Base `1942a714c322a032185645df142ad1d3eac32646`; rama separada `codex/bloque02-receta-primero-2026-11-14`.

La app ya soportaba receta primero; los pilotos previos creaban lista/plan antes. Se añaden tres casos de aceptación en cuatro idiomas y tres proyectos (escritorio Chromium, WebKit375/430), más guía Safari; se conservan las guías antiguas con aviso. Local: **36 correctos/0 fallidos/0 omitidos/0 intermitentes**, 180 capturas lógicas privadas; cancelaciones, error de cuota/reintento, duplicados explícitos, gasto único e historial, lista guardada vacía y siete documentos tras cerrar/reabrir página. TypeScript, 981 unitarias, importador público y npm0 correctos. Los 159 inputs anteriores siguen idénticos; ningún P0 de app demostrado que requiera parche.

[Informe con fuente, comandos y límites](MAESTRO/BLOQUE02_ENTREGA_Y_AUDITORIA.md) · [evidencia local saneada](../design/daily-flow/reports/local-acceptance.json). Publicación/CI/HTTPS de esta entrega pendientes; los resultados de Bloque01 no se atribuyen al SHA nuevo. Prueba física y aceptación visual pendientes; no se abre Bloque03 ni se fusiona main/promueve producción.


### Publicación y comprobación real de Bloque 02 · 14/11/2026

[PR #22](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/22), fuente `61793e4833c702a6294eedde1f778cd80dfc074f`, árbol `9d1065b6e6cdbb66581b4f53dd7f227a5294eace`. CI 43591993356 correcta. Candidata `dpl_DizPGJTNWdRhNnRQxXtToDKwdxEZ` READY/staging protegida: **36/36 casos remotos** y 180 capturas lógicas, cero fallos/omisiones/intermitencias, además de 36/36 locales. HTTPS: cuatro idiomas, 127 recetas y 29 recursos/URLs por hash. Prueba, configuración y los 159 inputs anteriores coinciden; no se cambió aplicación ni se añadieron funciones. [Informe](MAESTRO/BLOQUE02_ENTREGA_Y_AUDITORIA.md) · [recorrido remoto](../design/daily-flow/reports/hosted-acceptance.json).

Acceso temporal por conversación hasta **15/11/2026 10:52:36 UTC**, fuera de Git. Los 23 archivos públicos coinciden con la candidata anterior y se reutilizaron por hash. Producción sigue en `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`; main D22 e integración en 1942 se conservan, sin merges. El cierre siguiente añade solo documentos/informes y no representa otra ejecución de navegador. Estado: QA técnica comprobada, **REQUIERE_PRUEBA_PROPIETARIO** en Safari físico; 01.1 sigue sin inspección independiente externa. Siguiente acción única: realizar la guía de iPhone y registrar resultado; no se abre Bloque 03.
