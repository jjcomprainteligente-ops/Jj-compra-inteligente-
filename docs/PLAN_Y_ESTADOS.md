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
