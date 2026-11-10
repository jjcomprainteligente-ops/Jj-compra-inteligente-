# Registro de decisiones, preguntas y riesgos
**Regla:** nunca elevar una propuesta a «aprobada» sin confirmación del usuario.

## Decisiones confirmadas
| ID | Fecha | Decisión |
|---|---|---|
| D01 | 2026-10-29 | Marca oficial: JJ Compra Inteligente |
| D02 | 2026-10-29 | Color principal verde |
| D03 | 2026-10-29 | Lanzamiento/validación inicial en Tenerife |
| D04 | 2026-10-29 | Codex hace toda la programación de la app. ChatGPT diseña, especifica y revisa. |
| D05 | 2026-10-29 | Priorizar calidad visual antes de desarrollo de funciones |
| D06 | 2026-10-29 | Preservar repo existente y minimizar costes |
| D07 | 2026-10-29 | La integración de compra dentro de JJ es meta comercial futura, no función prometida de MVP |

## Propuestas pendientes de revisión
| ID | Propuesta | Qué necesitamos verificar |
|---|---|---|
| P01 | Dirección visual V1 Verde Esencial | comparar alternativas en screenshots |
| P02 | Paleta `#167347`/`#133D2D` | verificar contraste y aprobación |
| P03 | Navegación 4 tabs + Perfil en avatar | prototipo y pruebas con usuarios |
| P04 | Expo / React Native / TypeScript | diagnóstico de arquitectura actual |
| P05 | Supabase / backend IA | costes, seguridad, situación del repo |
| P06 | Listas básicas sin cuenta obligatoria | viabilidad de persistencia + migración |
| P07 | Modo demo de comparador sin precios inventados | fuente real de observaciones de precio |

## Riesgos abiertos
| ID | Riesgo | Mitigación |
|---|---|---|
| R01 | No hay visibilidad del repo desde ChatGPT | verificar conexión y permisos de GitHub/Codex |
| R02 | Diseño genérico o poco premium | tres rutas, screenshots a escala real y revisión con usuario |
| R03 | Precios o stock inexactos | origen, fecha, unidad y aviso de faltantes |
| R04 | Integraciones de tiendas no autorizadas | separar compra presencial de checkout integrado |
| R05 | Suscripciones/servicios innecesarios | aprobar gastos antes de activarlos |
| R06 | Falta de continuidad entre tareas de Codex | AGENTS + tablero + decision log + PRs pequeños |
| R07 | Datos de compra familiares sensibles | aislamiento, permisos por hogar, borrado de datos |
| R08 | Cambios no probados en iPhone | screenshots, pruebas y QA antes de aprobar |

## Preguntas abiertas (no bloquean la auditoría)
- URL/owner del repo, rama principal y estado técnico real.
- ¿Qué variante de marca prefiere el propietario tras ver 3 propuestas?
- ¿Qué primer grupo de 20–30 testers en Tenerife podría validar flujos reales?
- ¿Cuáles serán las fuentes legales de precios para la prueba piloto?

## Referencias visuales e históricas archivadas
- `referencias/JJ_Compra_Inteligente_Tres_Conceptos.png`: tres prototipos **anteriores**, sirven para entender el concepto A+B+C, no para aprobar estética final.
- `referencias/JJ_Compra_Inteligente_Fase_2_Estudio_y_Diseno.pdf`: investigación anterior, separar datos verificados de hipótesis.
- `referencias/JJ_Compra_Inteligente_Fase2_Brief_Codex.md`: brief inicial del proyecto.


## Actualización de acuerdos y límites — 2026-10-29 20:43:46 UTC

Se conserva íntegra la versión inicial del kit. Estas notas registran hechos posteriores a B00; no convierten las propuestas visuales o técnicas en decisiones finales.

| ID | Fecha | Estado | Decisión o evidencia |
|---|---|---|---|
| D08 | 2026-10-29 20:43:46 UTC | CONFIRMADA para continuar | La respuesta del propietario «Sigue» después del informe B00 autoriza comenzar B01. La limitación de trazabilidad Git queda visible y pendiente. |
| D09 | 2026-10-29 20:43:46 UTC | CONFIRMADA | Se preserva la app actual. Las exploraciones de identidad se preparan por separado, con el mismo contenido y sin lógica nueva de negocio. |
| D10 | 2026-10-29 20:43:46 UTC | CONFIRMADA previamente | Las búsquedas se hacen con ChatGPT fuera de la app; la base existente recibe enlaces, precios y envío de forma manual. |

### Propuestas que siguen sin aprobar

- V1 Verde Esencial, V2 Verde Noche y V3 Verde Mercado; ninguna está seleccionada.
- Monograma y marca finales; las tres opciones son exploraciones.
- Navegación de cuatro pestañas más Perfil; B01 la representa como candidata, B02 no ha comenzado.
- Supabase, backend de IA, cuentas, sincronización, voz y cualquier servicio de pago o integración comercial.
- La arquitectura Expo/React Native/TypeScript ya existe y es reutilizable; no se autoriza una migración ni una reconstrucción.

### Riesgos verificados y seguimiento

| ID | Hallazgo | Tratamiento previsto |
|---|---|---|
| R01 (actualizado) | La base local no dispone de Git operativo y GitHub lista cero repositorios accesibles. | Identificar repositorio, remoto y rama antes de crear PRs o declarar trazabilidad. No inicializar ni publicar por cuenta propia. |
| R02 (actualizado) | Identidad fragmentada y texto auxiliar muy pequeño; hay contrastes por debajo de AA. | Comparar tres rutas B01 con contraste medido y pantallas completas a escala iPhone. |
| R08 (actualizado) | No hay validación nativa completa en iPhone. Chromium móvil no es prueba de iOS. | Etiquetar cada captura y método correctamente; mantener la validación nativa pendiente hasta que exista evidencia. |
| R09 | El comparador existente no es una lista de supermercado ni cumple aún el modelo de observaciones B06. | Reutilizar módulos sin dar bloques futuros por terminados. |
| R10 | Cambiar nombre público o clave local sin cuidado podría ocultar datos existentes. | Mantener la clave y formato de almacenamiento hasta una migración explícitamente autorizada y probada. |

No existen commits ni PRs para esta entrega. El siguiente paso autorizable tras las propuestas de B01 es seleccionar dirección y logotipo; no avanzar automáticamente a B02.


## Resultado visual B01 — 2026-10-29 21:00:48 UTC

- Estado: **EN REVISIÓN**; no se aprueba ninguna dirección ni logotipo por producir capturas.
- Alternativas: V1 Verde Esencial, V2 Verde Noche y V3 Verde Mercado. Marcas: M1 Doble trazo, M2 Firma editorial y M3 Ritmo de mercado. Dirección y marca se pueden elegir por separado.
- Hechos: prototipo aditivo sin persistencia; 27 vistas sin desbordamiento horizontal y con acción principal visible; 41 pares de texto/superficie por encima de 4,5:1; 50 pruebas unitarias y TypeScript correctos. Los 18 archivos anteriores permanecen idénticos según SHA-256.
- Evidencia y mini guías: `docs/B01_IDENTIDAD_VISUAL.md`, `design/b01/evidence/verification.json`, `contrast.json` y `preservation.json` en esa misma carpeta de evidencia.
- Riesgo R08 sigue abierto: Chromium web no valida Safari/iOS, VoiceOver, Dynamic Type, teclado o interacción física.
- Riesgo R01 sigue abierto: falta Git operativo para ramas, commits y PRs. Se usó una carpeta aislada y no se inicializó un repositorio sustituto.
- Las tipografías, monogramas y tokens son propuestas. La disponibilidad legal de marca y la consistencia de la serif de sistema V2 siguen pendientes.
- **B02 no iniciado.** Esperar selección explícita de dirección y logotipo o una petición de ajustes.

## Selección del propietario — 2026-10-29 22:15:34 UTC

Evidencia literal: «Verde mercado y m3 pero el logo tendremos que trabajarlo más adelante».

- **CONFIRMADA:** V3 Verde Mercado es la dirección visual elegida; no volver a elegir automáticamente V1 ni reabrir la comparación sin una petición del propietario.
- **CONFIRMADA CON CARÁCTER PROVISIONAL:** M3 es la referencia de monograma elegida para continuar. No equivale a aprobar un logotipo definitivo.
- **DIFERIDA EXPRESAMENTE:** trabajar y refinar el logo más adelante. Mantener esta tarea abierta sin convertirla en un bloqueo para diseñar las pantallas con V3.
- B01 tiene la dirección seleccionada y la marca final pendiente. B02 sigue sin iniciar; cuenta con V3 y M3 provisional como base para su siguiente encargo.
- Esta actualización afecta solo a documentación. Se conservan código, almacenamiento, variantes y evidencias originales. No se generan capturas nuevas ni se atribuye nueva validación técnica a esta decisión.


## Entrega UX B02 — 2026-10-29 23:05:51 UTC

- **AUTORIZACIÓN:** el «Sigue» del propietario después de elegir Verde Mercado/M3 autoriza el bloque B02. No cambia la decisión de trabajar el logo más adelante.
- **ENTREGADO PARA REVISIÓN:** cinco vistas, navegación de4 pestañas y avatar a Perfil, ocho estados críticos, datos antiguos/no comparables, revisión de ingredientes, edición de ejemplo y plan visual de hogar. Nada de esto se da por aprobado automáticamente.
- **VERIFICADO EN WEB:** 59 vistas sin recortes de texto, 5 acciones de navegación, F1–F5 y lista de20 productos; 0 errores JavaScript/escrituras locales. Texto130% es simulación, no Dynamic Type.
- **VERIFICADO:**32 contrastes correctos, TypeScript y50 pruebas existentes.67 archivos previos y33 evidencias B01 conservados antes de actualizar los dos registros.
- **ALCANCE:** código de presentación aditivo en `design/b02/`; app de fase1/B01 sin sustitución. Sin dependencias nuevas, IA conectada, búsqueda automática, cuentas, sincronización o comercio. ChatGPT sigue siendo externo.
- **RIESGOS ABIERTOS:** teclado/VoiceOver/Dynamic Type/safeareas/uso físico de iPhone pendientes; Git no operativo. Se documenta la diferencia entre maqueta web, navegación de muestra y producto real.
- **SIGUIENTE PUERTA:** revisión de ChatGPT y propietario, aprobar o pedir ajustes a B02. B03 no iniciado. M3 permanece provisional.

## Autorización y decisiones de implementación B03/B04 — 2026-10-30 UTC

- **CONFIRMADA:** «Me gusta puedes seguir» aprueba la base B02; el propietario pide montar B03 y B04 directamente y recalca cuidar codificación, seguridad y orden. Se realizan consecutivamente dentro de ese alcance. No se inicia B05 por esta autorización.
- **VIGENTE:** V3 Verde Mercado y M3 provisional. El logo definitivo continúa diferido; no se rediseña durante estos bloques.
- **CONSERVACIÓN:** se reutiliza Expo/React Native/TypeScript y se incorpora `src/app/` sin reconstruir el proyecto. El comparador anterior y su almacenamiento deben permanecer disponibles. La copia previa se conserva en `archives/B00-B02-source-before-B03-B04.zip`; los prototipos B01/B02 siguen archivados.
- **DATOS LOCALES:** las listas usan `jjcompraintelwgiemt.shopping.v1`, separado de `jjcompraintelwgiemt.comparisons.v1`. No hay migración destructiva ni sobrescritura automática ante datos corruptos o una versión incompatible.
- **CÁLCULO:** cantidades en milésimas e importes en céntimos enteros; presupuesto, estimaciones, previsión conocida, precios pendientes y gasto registrado se distinguen. El gasto registrado incluye únicamente productos marcados con precio introducido.
- **CONFIRMACIÓN:** se confirma el guardado antes de mostrar éxito. Los duplicados requieren una decisión explícita; las eliminaciones se confirman y ofrecen deshacer cuando procede. Los formularios deben conservarse ante un error de escritura.
- **LÍMITES:** Menús es vista previa identificada. Sin backend, IA conectada, autenticación, sincronización, pagos, scraping ni fuentes de precios comerciales. ChatGPT realiza las búsquedas fuera de la aplicación.
- **VERIFICACIÓN EN CURSO:** se registra el alcance en `docs/B03_B04_ENTREGA.md`; los resultados completos y las capturas deberán añadirse después de ejecutarse. No se eleva una prueba escrita a prueba superada ni una autorización de trabajo a aceptación final.

### Riesgos pendientes de esta integración

| ID | Riesgo o límite | Tratamiento |
|---|---|---|
| R01 (vigente) | Git local no operativo; sin remoto, ramas o PR identificables. | Conservar copia previa y lista de cambios. No crear un repositorio sustituto ni afirmar publicación. |
| R08 (vigente) | Linux no ofrece simulador iOS. Web y exportación JavaScript no validan iPhone real. | Etiquetar dimensiones y método de captura. Mantener pendientes VoiceOver, Dynamic Type, teclado, gestos, zonas seguras y prueba física. |
| R10 (actualizado) | Mezclar claves o modificar identificadores puede ocultar datos previos. | Aislar listas en una clave nueva, preservar la clave del comparador y los identificadores nativos existentes; verificar el comparador anterior. |
| R11 | Fallo de escritura o carga inválida puede provocar pérdida aparente o real. | Bloquear edición hasta cargar correctamente, validar el documento, serializar guardados y mantener formulario/datos anteriores en error. Probar fallos y reintento. |
| R12 | Confundir estimación, ausencia de precio, presupuesto y gasto. | Etiquetas y cálculos separados; ninguna ausencia se representa como precio cero. Pruebas de importes y productos marcados. |
| R13 | Los datos son solo locales, sin copia en servidor ni cifrado prometido. | Informar del alcance local y no almacenar secretos; desinstalar o borrar datos puede eliminarlos. |
| R14 | Una prueba web sin red tras cargar no acredita recarga web offline ni uso nativo completo. | Registrar exactamente qué se prueba. No prometer PWA o validación nativa a partir de esa evidencia. |

El cierre de B03/B04 y su aceptación siguen pendientes de las verificaciones y de la revisión correspondiente. El trabajo del logo, las integraciones y los bloques posteriores no se dan por completados.

## Verificación intermedia y dependencias — 2026-10-30 UTC

- **RESULTADOS INTERMEDIOS:** 127 pruebas Vitest y TypeScript sin errores; 20/20 recorridos E2E correctos en escritorio/móvil, sin omisiones ni inestabilidad en `design/b03-b04/evidence/playwright-results.json`. La primera serie de 35 capturas registra 0 errores JavaScript y ningún desbordamiento horizontal (`design/b03-b04/evidence/report.json`). El ajuste visual final para alinear B03/B04 con B02 obliga a repetir las comprobaciones afectadas y renovar las capturas antes del cierre; no se da todo por aceptado.
- **AUDITORÍA ABIERTA:** `npm audit --omit=dev` registra 8 paquetes con avisos: 3 altos, 5 bajos, 0 críticos. Se conserva el resultado en `design/b03-b04/evidence/npm-audit.json`. Hay propagación de avisos a dependientes; se identifican dos dependencias de origen: `deepmerge` 4.3.1 mediante `@expo/config` 58.0.9 (fusión de configuración local), y `zod` 3.25.76 mediante Expo CLI 58.1.17 (DevTools/MCP).
- **EXPOSICIÓN OBSERVADA:** las rutas identificadas son herramientas de desarrollo/generación. La revisión no encontró importaciones desde `App.tsx`, `index.ts` o `src/`, ni sus marcadores en el paquete web inspeccionado; no se identificó una ruta desde las entradas del usuario de la app. Esto delimita lo inspeccionado, sin descartar vulnerabilidades ni cerrar la auditoría.
- **DECISIÓN TÉCNICA:** no ejecutar `npm audit fix --force`; la propuesta del informe rebajaría Expo 58 a 51.0.39 y rompería la compatibilidad con React Native 0.88. Antes de distribuir debe realizarse una actualización compatible de las herramientas/dependencias, repetir auditoría y pruebas, y registrar la resolución de los avisos. No se declara este trabajo realizado.
- **PENDIENTE NATIVO:** el entorno Linux continúa sin simulador iOS. Los resultados web y las exportaciones no sustituyen capturas de iPhone, VoiceOver/TalkBack, Dynamic Type, teclado, gestos, zonas seguras ni prueba física.

| ID | Riesgo o límite | Tratamiento |
|---|---|---|
| R15 | Avisos de dependencias de Expo aún abiertos: 3 altos y 5 bajos en el recuento de paquetes. | Actualizar herramientas con versiones compatibles y verificar antes de distribuir; evitar una rebaja forzada de Expo que rompa la base actual. Mantener visibles las rutas y el informe. |
| R16 | Las pruebas y capturas intermedias no cubren automáticamente el ajuste visual posterior. | Repetir las comprobaciones afectadas, renovar evidencias y distinguir esos resultados finales de la primera ronda. |


## Entrega B03/B04 — 2026-10-30 UTC

- **IMPLEMENTADO Y VERIFICADO EN WEB:** cinco pantallas, CRUD local de varias listas, cantidades, unidades, categorías, notas, presupuestos e importes separados, duplicados explícitos, borradores protegidos, confirmaciones y deshacer. La acción Añadir producto permanece fija en Mi compra para listas largas.
- **RESULTADOS FINALES:** `npm run check` correcto (127 pruebas y TypeScript); 20/20 recorridos web correctos; 50 capturas sin errores JavaScript ni desbordamiento detectado; 14 pares de contraste correctos. Se repitieron los recorridos/capturas después de los ajustes visuales. Exportación web/iOS/Android correcta. Informes enlazados en B03_B04_ENTREGA.md.
- **CONSERVACIÓN VERIFICADA:** 85 archivos de la copia previa: 75 idénticos, 10 modificados de forma localizada, 0 eliminados. App.tsx, fuentes B01/B02 y archivos de dependencias intactos. El comparador previo tiene sus recorridos completos comprobados. Se corrigió su formulario móvil comprimido y se normalizó el enlace validado antes de abrirlo; no hay migración automática de almacenamiento.
- **R15 ABIERTO:** consultas de registro no identificaron corrección compatible disponible en los rangos actuales (Expo58.0.21, CLI58.1.17/Zod^3.25.76, deepmerge4.3.1). Los 8 avisos de paquetes permanecen documentados. No se forzaron versiones incompatibles ni se declara auditoría limpia.
- **R16 VERIFICADO EN WEB:** evidencias renovadas sobre el ajuste final. Esto no cierra R08 (capturas/uso/accesibilidad nativos pendientes) ni sustituye aprobación del propietario.
- **ALCANCE:** B03/B04 quedan EN REVISIÓN. No se inició B05 ni se conectó IA, backend, hogares, fuentes comerciales o pagos. M3 sigue provisional.


## B05 determinista y prueba posterior — 2026-10-30 UTC

- **AUTORIZACIÓN:** «Sigue con b05 y justo después aremos la prueba». Se desarrolla B05 y se prepara el recorrido posterior sin pedir otra aprobación de implementación. No se atribuye aprobación nativa a ese avance.
- **ALCANCE:** catálogo local de siete recetas, cinco cenas editables, 1–12 personas, ingredientes escalados con redondeos explícitos y revisión obligatoria antes de confirmar. Búsquedas en ChatGPT fuera de la app; sin servicio IA, backend, voz, permisos nuevos ni nuevas dependencias.
- **DATOS:** clave independiente `jjcompraintelwgiemt.menus.v1` con personas e identificadores de recetas. No se persiste texto pegado ni preferencias de salud. Las claves de compras/comparaciones no cambian. Los identificadores del catálogo deberán conservarse o migrarse expresamente en futuras revisiones.
- **TRANSFERENCIA:** una confirmación produce una única escritura de compra. Una lista nueva solo se crea al confirmar. El grupo permite deshacer. Los productos nuevos entran sin precio y sin marcar. Sumar exige una única coincidencia sin precio ni marcado, con conversión exacta; notas, categoría y demás datos del producto existente se conservan. Las coincidencias con precio, marcadas o múltiples deben conservarse o añadirse aparte.
- **ENTRADA LIMITADA:** hasta 6000 caracteres y 50 ingredientes, uno por línea o punto y coma. Las líneas ambiguas impiden importación parcial. No se promete comprender peticiones libres ni equivalencias alimentarias universales. La vista permite corregir cantidades, unidades, categorías y notas antes de guardar.
- **VERIFICADO:** TypeScript y 228 pruebas correctos; 36/36 recorridos web correctos, incluidos 16 de B05; 38 capturas sin errores JavaScript/desbordamientos detectados y sin alterar compras en contextos de revisión. Once pares de contraste correctos y exportación web/Hermes iOS/Android correcta. Informes separados en `design/b05/evidence/`.
- **CONSERVACIÓN:** fuente anterior archivada antes de integrar en `archives/B00-B04-source-before-B05.zip`. App.tsx, dependencias y almacenamiento anterior intactos; ningún archivo previo eliminado. Los entregables y evidencias B00–B04 no se reemplazan. Sin Git operativo, no hay PR/commit.
- **RIESGOS VIGENTES:** R08 (uso y accesibilidad nativos), R15 (avisos en herramientas Expo) y falta de Git continúan abiertos. B05 no modifica dependencias y no afirma resolver esos avisos. No hay costes de llamadas IA porque no se realizan; cualquier servicio futuro exige medir y limitar esos costes antes de habilitarlo.
- **SIGUIENTE:** prueba del propietario según `docs/B05_PRUEBA_GUIADA.md`. B05 queda EN REVISIÓN; no se inicia B06 ni se declara la app lista para distribución.


## B06 y vista web de pruebas — 2026-10-30 UTC

- **AUTORIZACIÓN:** avanzar B06 mientras el propietario prueba B05. Mantener su versión anterior y recibir correcciones sin atribuir resultados de pruebas físicas que aún no ha comunicado.
- **PILOTO LEGÍTIMO:** aportaciones manuales etiquetadas, permitidas por B06; sin scraping, fuentes inventadas ni integraciones comerciales. No existe opción de convertir una aportación en «verificada». Ninguna estimación, ausencia de precio o dato demo se presenta como precio actual.
- **MODELO:** clave nueva `jjcompraintelwgiemt.price-observations.v1`. Campos limitados y validados; precio cero distinto de precio ausente; fecha real y procedencia obligatorias; URL HTTP/S opcional sin credenciales, abierta solo a petición.
- **EQUIVALENCIA:** identidad declarada de producto, marca, formato y calidad; dimensiones masa/volumen/unidades separadas. Normalización €/kg, €/L, €/ud con BigInt y clasificación exacta, sin usar importes redondeados para ordenar. No se anuncia ahorro realizado.
- **ANTIGÜEDAD:** más de siete días se excluye por regla conservadora del piloto. Contexto de fecha actualizado cada minuto y al reanudar; una referencia que envejece no se reemplaza silenciosamente. Datos futuros por retroceso del reloj permanecen guardados y se excluyen.
- **GUARDADO:** hook de observaciones en raíz, una instancia y escrituras serializadas; bloquea navegación durante la escritura. Carga corrupta no se reemplaza, error de escritura conserva formulario, borrado confirma y se puede deshacer. Los otros almacenes permanecen intactos.
- **VERIFICADO:** TypeScript sin errores, 324 pruebas, 52/52 recorridos web (16 nuevos), 41 capturas sin errores JavaScript/desbordamientos detectados y sin modificaciones de datos durante revisión. Paquetes web/iOS/Android exportados. Capturas web/texto130% no son evidencia nativa.
- **CONSERVACIÓN:** backup previo a B06 y entregables anteriores intactos; no se añade dependencia ni se altera el comparador legado. Git, pruebas nativas y avisos previos de Expo siguen abiertos. No se inicia B07.
- **ENLACE WEB:** usuario autorizó expresamente publicar en Vercel la vista B05 comprobada, sin datos personales/credenciales. Copia aislada preparada. Tras resolver la revisión automática de autorización, Vercel exige acceso de cuenta al equipo (403); enlace de consentimiento facilitado. No hay publicación completada mientras falte ese acceso. No usar otro destino o credenciales para eludirlo ni cambiar el público de la protección del proyecto.


### Publicación de la vista estable B05 — 2026-10-30 19:00 UTC

- **ACCESO RESUELTO:** confirmación «Hecho» y consultas del equipo/proyecto correctas. Se utilizó la conexión autorizada y el proyecto existente. Vista entregada: `dpl_67mSMKzUQCXQqc77pj5KgqB8K2zU`, READY, `target: staging`. Protección de Vercel conservada; enlace compartido temporal hasta 31/10/2026 17:59:45 UTC. La URL base puede exigir cuenta al vencer el enlace.
- **RUTAS DE FUENTES:** Vercel omitió las rutas `assets/node_modules/...`; primer intento no servía esas fuentes. Se añadieron copias planas idénticas y siete reescrituras exactas, con MIME `font/ttf` verificado. No se recompiló ni alteró B05. El HTML/JS y las fuentes publicados coinciden por tamaño/SHA1 con los archivos conservados; la configuración añade `noindex, nofollow` y `nosniff`.
- **DESTINO REGISTRADO:** la primera llamada REST sin `target` devolvió inesperadamente `target: production` para el primer despliegue del proyecto (`dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`), aunque la documentación indica preview por defecto. La revisión automática rechazó posteriormente un intento de corrección con `target: production` por exceder la autorización de vista previa; ese intento no se ejecutó. `target: preview` fue rechazado por el esquema REST. La corrección se publicó explícitamente con el destino documentado `staging`, sin eludir el rechazo. El primer despliegue se conserva como historial y no se entrega como enlace de prueba; no se borraron despliegues ni se cambió la protección del proyecto. Futuras publicaciones deberán fijar el destino admitido expresamente.
- **CERTIFICADOS DEL ENTORNO:** el navegador automatizado no confiaba en la CA del proxy. La revisión automática rechazó importar CA al almacén permanente del usuario por su alcance de seguridad; no se aplicó esa modificación. Alternativa completada: cliente HTTPS Node de Playwright con la CA ya configurada, verificación TLS habilitada y respuestas entregadas a Chromium. También se verificaron las 23 URL con curl y validación TLS. No se deshabilitó validación de certificados ni se pidió ampliar permisos para terminar el objetivo.
- **RESULTADO ACOTADO:** recorrido móvil web correcto, fuentes cargadas y cancelación sin alterar compras; capturas e informes separados bajo `.vercel/hosted-evidence/`. Persistencia exclusivamente local a un contexto desechable de prueba. B06 y la entrega B05 previa intactas; no se transfirieron datos de usuarios o credenciales. Continúan abiertos iPhone físico, Git y avisos de dependencias ya documentados.


## Internacionalización transversal y auditoría después de I01/I02 — 31/10/2026 UTC

- **AUTORIZACIÓN:** encargo explícito de cuatro idiomas y «Y si puedes empezar», con revisión completa entre cada dos bloques. I01 e I02 se implementan aditivamente; P01 audita y corrige antes de entregar. Los cambios de arquitectura y su causa se comunicaron en el trabajo.
- **IDIOMA:** el elegido y guardado por la persona prevalece; modo dispositivo recorre idiomas compatibles y usa español de respaldo. Nombres propios de marca intactos, EUR fijo y formatos es-ES/en-GB/de-DE/fr-FR. No se usan traducciones como identificadores o valores de negocio.
- **RECURSOS:** catálogos centrales, claves/parametrización comprobadas, renderizado de texto y errores tipados. Recetas traducidas como presentación conservan IDs, valores y modelo español. El texto manual idéntico al vocabulario canónico puede verse traducido por coincidencia; el almacenamiento no cambia.
- **PERSISTENCIA:** nueva clave preferences.v1, separada de los cuatro almacenes anteriores. Corrupción/versión futura no se reemplaza. Fallos y eventos de otras pestañas no desmontan formularios ni ocultan la última selección fallida. La confirmación ocurre tras persistencia.
- **INTEGRIDAD REAL:** la primera suite detectó dos escrituras exitosas desde la misma instantánea pese a Web Locks; se reprodujo fuera de React. localStorage puede entregar caché antigua entre renderers. La corrección añade huellas SHA256 en IndexedDB, claves fijas y reserva/confirmación bajo bloqueo. Se exige durabilidad estricta; la reserva precede al documento. Lectura canónica posterior evita firmar un objeto que el validador normalice de otra forma.
- **FALLOS:** una reserva pendiente o una confirmación ambigua rechaza escrituras posteriores. Rollback solo tras verificar el estado anterior exacto. No existe reparación silenciosa ni una transacción atómica común IDB/localStorage. Esto favorece conservar divergencias antes que sobrescribir datos.
- **LÍMITES DEL PROTOCOLO:** web HTTPS/localhost con Web Locks, IndexedDB estricto y Web Crypto; HTTP por IP LAN puede no guardar. Nativo conserva cola del mismo proceso JS. Versiones cacheadas que no cooperen y manipulación externa de solo un almacén quedan fuera de la garantía. Recuperación de una reserva ambigua requiere revisión explícita, no borrar datos.
- **SEGURIDAD DE ENTRADAS:** el comparador previo rechaza URL con credenciales/controles/bidi o longitud excesiva antes de abrirlas; registros anteriores permanecen legibles. Nuevos límites no borran documentos antiguos. Parser de ingredientes acotado y sin ejecución; no hay nuevas llamadas de IA, claves, backend o precios conectados.
- **VERIFICACIÓN FINAL:** npm run check, 496 pruebas y TypeScript correctos; 124 recorridos web, 0 fallidos/inestables y 120 capturas sin incidencias detectadas. Doce casos duplicados de matriz se omiten. Paquetes JS web/iOS/Android exportados e idiomas nativos declarados. Estos resultados no equivalen a Safari/iPhone físico.
- **CONSERVACIÓN:** backup previo, cero archivos anteriores eliminados, tema/Brand/ilustraciones idénticos; dist, evidencias B05/B06 y preview previo conservados. El snapshot web multilingüe queda listo para una publicación separada, todavía no ejecutada. Git sigue sin operar.
- **DEPENDENCIAS:** auditoría completa actual13 (2 altos/9 moderados/2 bajos/0 críticos), cuatro orígenes en herramientas Expo: zod/deepmerge/glob/minimatch. El lockfile solo añade expo-localization y rtl-detect; las versiones afectadas son anteriores. No se encontró actualización compatible dentro de SDK58; no usar downgrade forzado u overrides mayores sin comprobar compatibilidad.

| Riesgo pendiente | Tratamiento / criterio de cierre |
|---|---|
| I18N-R01: aceptación nativa y Safari ausentes | Ejecutar la guía física en es/en/de/fr y registrar modelo, versión, resultado y evidencia. |
| I18N-R02: avisos de herramientas sin corrección compatible | Actualización compatible, auditoría y regresión antes de distribuir; no afirmar auditoría limpia. |
| I18N-R03: escritores antiguos y cambios externos no coordinados | Preview nueva separada; no afirmar control sobre código antiguo, no borrar datos para forzar recuperación. |
| I18N-R04: reserva pendiente o divergencia tras interrupción | Bloquear antes de escribir y revisar/reparar explícitamente; no ocultar una confirmación incierta. |
| I18N-R05: soporte de APIs de guardado web | HTTPS/contexto seguro y navegador compatible; error explícito si falta una capacidad; prueba física pendiente. |
| I18N-R06: criterio contable V2 anterior pendiente | No convertir productos marcados en pagos ni crear historial; resolver en Lote3A separado. |

Entrega: docs/I18N_ENTREGA_Y_AUDITORIA.md. No se certifica ausencia absoluta de errores o vulnerabilidades y no se inicia el siguiente lote automáticamente.


## Publicación comprobada y regla permanente — 31/10/2026 UTC

- **AUTORIZACIÓN PERMANENTE:** el propietario pidió subir siempre cada entrega terminada y comprobada para verla y probarla. Se añadió esa regla al AGENTS.md existente; no requiere otra confirmación para cada preview. Se mantienen las condiciones de conservación, prueba, privacidad y protección.
- **EJECUTADO:** I01/I02 publicado en el proyecto/equipo existentes, destino staging explícito, READY. Despliegue dpl_EijJvk6xY9bKAAS2EaYc9exGweNo; B05 conserva su URL. No se deshabilitó protección ni se promovió a producción.
- **CONTENIDO:** manifiesto17 con HTML/JS/fuentes/configuración; sin datos personales, tests, secretos o bundles nativos. Código servido byteidéntico al export auditado, SHA256 daac04335e9c233edfc3a020c77ed547bced49b0a8613db4e6bdefa5a6e19348.
- **POSTPUBLICACIÓN:** 4/4 idiomas y23/23 URL correctos sobre HTTPS; persistencia, revisión/cancelación de ingredientes y preferencias sin alterar compras. Solo datos ficticios en contextos desechables; TLS validado y almacén permanente de certificados intacto. Reporte y doce capturas en previews/i18n-web/.vercel/hosted-evidence/run-L9jTWt/.
- **ACCESO:** enlace temporal hasta01/11/2026 14:27:50UTC, parámetro no almacenado en fuentes. Origen nuevo, datos locales independientes; esto no es sincronización o migración.
- **LÍMITES VIGENTES:** el postdeploy no sustituye iPhone/Safari físico, accesibilidad nativa ni resolución de los13 avisos de herramientas. No se cambia el alcance de producto ni se declara producción lista.


## 31/10/2026 — GitHub canónico y discrepancia visual V2

- **DECISIÓN DEL PROPIETARIO:** copiar el código a `jjcomprainteligente-ops/Jj-compra-inteligente-`; GitHub es la base de todo y Vercel sirve para verificar y revisar previews.
- **CONSERVACIÓN:** se integran los tres commits remotos, README y auditoría anteriores; el código editable se recupera del proyecto original, no de artefactos compilados.
- **SEGURIDAD:** repositorio público; excluir datos locales, credenciales, `.env`, previews, trazas, dependencias y compilaciones. No forzar actualizaciones de ramas ni promover producción automáticamente.
- **DIFERENCIA CONFIRMADA:** la app actual mantiene M3 provisional y Verde Mercado anterior. No coincide con GPT-6 V2. Las alternativas antiguas B01 «V2 Verde Noche» son una referencia distinta.
- **DEPENDENCIA ABIERTA:** originales GPT-6 V2/Premium no encontrados en el entorno ni sus entregas. Se solicita recuperarlos para comparar pantallas y reutilizar el logo exacto; no redibujarlo ni declarar fidelidad desde el recuerdo.
- **LÍMITES VIGENTES:** no se añaden integraciones ni se convierte el marcado de productos en pagos confirmados. Siguen abiertos los avisos de dependencias y la validación física iPhone/Safari.


### Cierre comprobado G00 — 31/10/2026

GitHub confirma el commit de importación `732d1817f3b856384e98191dd82cb92241011271` en `main`. Clon independiente: instalación, TypeScript, 496 pruebas y exportación web correctos. La preview staging `dpl_Ewmo9hTVBK4WTkkjagSscWy5qj4g` incluye metadatos del mismo commit y pasó comprobaciones remotas en cuatro idiomas y 23 recursos/URLs. Fuentes de ejecución idénticas permiten reutilizar la exportación i18n auditada; no se presenta como una nueva corrección visual ni como un binario recompilado idéntico a la exportación web nueva. Informes en `github/G00_ENTREGA_Y_AUDITORIA.md` y `design/github-g00/`.

La dependencia pendiente para V00/V01 es recuperar los originales V2; el diagnóstico no autoriza inventar la marca ni certificar dieciséis pantallas terminadas. Los riesgos técnicos/nativos anteriores permanecen registrados.


## 06/11/2026 — Auditoría de V01/V02 y referencias

- Fuente visual activa: contrato y PNG canónicos V2 recuperados; JPG logo 750054… y recorte actual ab7813…verificados, sin 3D/trazado.
- Cambios de presentación conservan contratos de datos, coordinador de escritura, preferencias e integraciones. Gasto real permanece sin registrar; productos marcados no son pagos.
- 128 pruebas web,496unitarias y 120 capturas finales correctas; TypeScript y tres exportaciones correctos. Se conservan resultados previos e interrupciones con explicación; no se esconden fallos anteriores ni se atribuyen al código final.
- Npm audit06/11 registra10 paquetes afectados:2 altos, 7 moderados, 1 bajo, 0 críticos. No se aplica una degradación mayor de Expo ni se prometen 0 riesgos.
- GitHub precede a la publicación de preview staging. La transferencia directa grande a Vercel no se confirmó; se comprobará otra vía desde la revisión Git, sin promover producción ni retirar protección.
- iPhone/Safari físico, VoiceOver/DynamicType, teclado/safeareas y las funciones aún ausentes siguen pendientes.


## 06/11/2026 — Publicación V2 comprobada

Preview staging READY `dpl_FEo2wA8AwT4zmcZeGFxSBWpgaL7A`, código `3dbcff9435a6d2aad97e7766e2e38d0fabe790c7`, [PR #1](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/1). Cuatro idiomas, 27 recursos/URLs y 12 capturas remotas correctos; JavaScript decodificado y logo coinciden en hashes. Se conserva protección y producción. Enlace temporal fuera de Git. Detalles en `V2_PUBLICACION_VERIFICADA.md`. Estado de V01/V02: EN REVISIÓN VISUAL; avisos de dependencias, pruebas físicas y módulos futuros permanecen abiertos.


## Verificación de totalidad solicitada por el propietario

La aplicación publicada no completa todo el paquete recibido. Siete pantallas y cinco estados carecen de preparación; Presupuesto, receta e ingredientes no corresponden a subpantallas canónicas completas. Se registran además deshacer manual incompleto y detección manual de duplicados limitada a misma unidad. Las pruebas existentes son válidas en su alcance; 120 capturas corresponden a 10 escenas, no a 25 objetivos. Esta revisión solo incorpora documentación y corrige el estado de completitud, sin alterar la app.

No se cuentan como trabajo realizado recursos de marca no preparados, ni se interpreta la petición de totalidad como autorización para fingir pagos, permisos, fuentes comerciales, hogares o 3D aprobado. Los requisitos, referencias y criterios pendientes están en `AUDITORIA_COMPLETITUD_V2.md`.


## 07/11/2026 — V2: auditoría de dos bloques locales y seguridad revisada

Esta actualización continúa la preparación autorizada tras la auditoría de totalidad. La conclusión histórica de incompletitud se conserva como baseline; las nuevas pantallas y flujos se documentan en [V2_COBERTURA_LOCAL_Y_AUDITORIA.md](V2_COBERTURA_LOCAL_Y_AUDITORIA.md). Código editable guardado en GitHub, `dfd2a4eb917ef6d49aab794a0d36d799eed6c77d`, [PR #2 en borrador](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/2); Vercel sigue siendo una vista de prueba separada.

- **DATOS:** gastos confirmados y preferencias de favoritas/avisos usan dos claves versionadas nuevas y el coordinador de escrituras existente. Se preservan las cinco claves anteriores, sus esquemas y los bytes corruptos o de versiones futuras. Marcar productos, anotar precios y seleccionar recetas no registra pagos.
- **CORRECCIÓN DE LA AUDITORÍA:** las dos claves nuevas faltaban en la lista permitida del registro duradero de escrituras web; se añadieron y se probaron su ciclo de confirmación y rechazo de conflictos. No se eliminan reservas ambiguas para hacer pasar un guardado.
- **ENTRADAS OPCIONALES:** voz y escáner dependen de capacidades reales del navegador y requieren consentimiento más acción explícita. Cámara sin audio, limpieza al salir/ocultar y liberación de permisos que resuelven tarde. El servicio de voz del navegador puede procesar audio; se informa antes de activarlo. Nativo y navegadores sin capacidad ofrecen entrada manual y revisión antes de añadir.
- **NOTIFICACIONES Y TIENDAS:** preferencias locales reales y avisos derivados de datos guardados; no push, scheduler, catálogo de supermercado, acuerdo ni precio verificado. La búsqueda y ficha operan sobre listas guardadas.
- **PRESENTACIÓN:** logo horizontal y paleta Verde Mercado Premium conservados. Las 16 vistas son navegables y los nueve estados tienen ejemplos explícitos; el estado de aprobación visual permanece abierto. Receta e ingredientes son páginas completas y protegen el borrador al salir.
- **DEPENDENCIAS:** Expo actualizado a 58.0.23 y versiones transitivas compatibles, sin saltos mayores ni `overrides`. `npm audit` baja de diez paquetes afectados —dos altos, siete moderados y uno bajo— a cinco moderados, cero altos y cero críticos. Se conservaron informes anteriores y posteriores en `design/v2/audit/`.
- **VERIFICACIÓN AUTOMATIZADA COMPLETA:** TypeScript y 660 pruebas unitarias pasan y se exportó web/iOS/Android. La primera suite encontró un selector de pruebas ligado a la posición de una fila que cambia de grupo al excluirla; se corrigió para localizar por identidad accesible sin reducir las expectativas. La suite completa corregida terminó con 182 pruebas web correctas, cero fallos, cero intermitentes y 24 duplicados de matrices deliberadamente omitidos. El informe `design/v2/evidence/run-2026-11-07T16-48-40-655Z-p3mv4e/report.json` confirma 300 capturas de las 16 pantallas y nueve ejemplos, más 120 de diez escenas anteriores: cuatro idiomas, tres tamaños, sin errores de ejecución o fallos de salud visual detectados. Los artefactos anteriores permanecen idénticos. Esto no constituye aprobación estética ni validación en iPhone físico.

| Riesgo / puerta vigente | Tratamiento y criterio de cierre |
|---|---|
| V2-L01: cinco avisos moderados en CLI/fingerprint y glob/minimatch | Mantener registro npm; actualizar cuando exista solución compatible y repetir auditoría/regresión. Las versiones corregidas exceden rangos actuales; no forzar cambios mayores para ocultar el aviso. |
| V2-L02: compatibilidad de hardware y APIs web | Las pruebas de sensores simulan contratos. Probar cámara, micrófono, cancelación y permisos en dispositivos/navegadores reales antes de afirmar soporte físico. |
| V2-L03: aceptación nativa y accesibilidad | Piloto iPhone/Safari y Android con teclado, gestos, safe areas, VoiceOver/TalkBack y tamaño de texto. Compilar Hermes no acredita esas condiciones. |
| V2-L04: aprobación visual y marca | Contrastar capturas con canon y obtener revisión del propietario/ChatGPT. Variantes, iconos y 3D conservan una revisión separada antes de integrar cambios de marca. |
| V2-L05: alcance futuro | Hogares/cuentas/sincronización, privacidad ampliada, IA conectada, fuentes comerciales y checkout siguen condicionados a sus bloques y autorizaciones. No presentarlos como listos por completar navegación local. |
| V2-L06: publicación pendiente de esta entrega | La auditoría automatizada de la pareja está cerrada; publicar solo la compilación comprobada en staging, con GitHub como fuente, protección conservada y verificación remota previa al enlace. |

### Cierre de publicación y ajuste accesible — 2026-11-08

Código final de la preview: `746395e614e68624e012e76d13e0fa377e241c6a`. Tras los 182 casos de la suite completa se añadieron dos atributos `aria-checked` al formulario de gastos; los 20 casos locales se repitieron y pasan, sin fallos ni intermitentes. Exportación web/iOS/Android repetida. Preview staging READY, protección conservada y verificación remota en cuatro idiomas / 27 recursos correcta. El enlace temporal se entrega en la conversación y caduca el 9 de noviembre a las 09:00 UTC; su credencial no se guarda en GitHub.

La publicación de código e informes está cerrada; la aprobación estética y el piloto físico siguen pendientes. La revisión automática bloqueó publicar las 100 capturas seleccionadas en GitHub público por posible información sensible y falta de autorización específica. Se mantienen locales, con petición de autorización separada; los informes de texto se conservan en `design/v2/entrega-local-2026-11-07/reports/`. Este bloqueo de imágenes no bloquea la app publicada ni modifica el resultado de pruebas.

## Decisiones y auditoría de filtros/privacidad — 2026-11-09

- **AUTORIZACIÓN Y ALCANCE:** el propietario pidió seguir con la construcción mientras prepara las recetas en cuatro idiomas. Se completan los filtros de Menús y controles locales de copia/borrado ya pedidos en los documentos, manteniendo Codex como único autor del código. No se activan backend, cuentas, sincronización, precios comerciales, pagos o IA conectada.
- **PREFERENCIAS DE SESIÓN:** filtros de tiempo/ingredientes y preferencia no se guardan. Un menú existente no se altera al filtrar; la propuesta de sustitución exige confirmación y cinco recetas únicas. Las clasificaciones alimentarias están ligadas al contenido revisado, sin promesas sobre alérgenos o coste.
- **DATOS CONSERVADOS:** no se crearon claves ni migraciones. Exportación local por allowlist de siete documentos, con dos lecturas y límites de tamaño. Borrado de seis categorías por separado, contra una revisión privada vigente, con palabra/casilla, CAS/fence y comprobación del estado vacío. Recarga tras éxito elimina la posibilidad de resucitar el estado borrado mediante deshacer.
- **CORRUPCIÓN Y CAMBIOS CONCURRENTES:** un dato no validable no se borra; se conserva como texto inerte en la copia exportada. Un cambio tras la revisión o un resultado incierto bloquea el nuevo intento hasta revisar explícitamente los datos actuales. No se eluden las protecciones de guardado.
- **COMPROBACIÓN:** TypeScript y 758 pruebas unitarias correctos; 40 recorridos nuevos correctos por separado; suite completa: 222 correctos,0 fallos / 0 intermitentes y 24 omisiones deliberadas. 420 capturas base y 24 adicionales. Exportación web/iOS/Android; cuatro idiomas y 27 recursos/bytes exactos verificados en Vercel, incluida exportación y borrado aislado. Fuentes en `fd78ecb`, informes en `design/menus-privacy/reports/`, PR #3.

| Riesgo o puerta | Estado y tratamiento |
|---|---|
| Compatibilidad iPhone/Safari y panel Share | Pendiente prueba física. Los mocks comprueban contratos y ciclo de vida; no acreditan cámara/micrófono, teclado, safe areas, lectores de pantalla o Share reales. |
| Copia nativa y tamaño | Comparte JSON como texto con máximo 1.000.000 de caracteres; web descarga JSON, máximo 20 MiB final / 10 MiB por documento. La copia de varios documentos no es una transacción atómica; se rechazan diferencias detectadas entre lecturas. No se ha implementado restauración automática desde esta copia. |
| Borrado de documentos no validados | Bloqueado para preservar corrupción o versiones futuras; exportación sigue disponible dentro de límites. El borrado es lógico del contenido de la app, no una garantía forense sobre almacenamiento del sistema. |
| Avisos npm | Cinco moderados en herramientas transitivas; 0 altos / 0 críticos. Mantener seguimiento y actualización compatible; sin overrides forzados. |
| Recetas del propietario | Las 150 traducidas siguen pendientes de recibir. No se han inventado ni sustituido por fixtures. La futura colección debe añadirse a los controles de datos al implementarse. |
| Aprobación visual y marca | Pendiente del propietario/ChatGPT; tokens y PNG original conservados. Variantes, iconos y 3D siguen revisión aparte. |

La publicación verificada es `dpl_DN9HdAtWMEm7sVCLkoMnGwsgYdpo`, destino `staging`, protección conservada; el enlace temporal se entrega en la conversación y vence el 10 de noviembre a las 09:10 UTC. Su secreto queda fuera del repositorio. Los despliegues e informes previos permanecen conservados.

## Decisiones y auditoría de paneles/WebKit — 2026-11-10

- **ALCANCE AUTORIZADO:** continuar la construcción y auditar cada pareja de bloques. Se completan mejoras compartidas de accesibilidad y la verificación real de WebKit; no se crean funciones comerciales, cuentas, sincronización o IA conectada. La preferencia visual aprobada y los recursos originales se conservan.
- **FOCO:** RNWeb conserva su trap, Escape y restauración normal. Un hook compartido repara el foco perdido al cambiar de paso y complementa el retorno cuando el autofocus había ocultado el disparador. Solo web, sin listeners globales; el fallback espera el cierre, exige foco en body y un disparador conectado/habilitado. No enfoca una acción destructiva. Las pruebas detectaron el fallo de retorno que no encontró la primera revisión estática y comprobaron la corrección.
- **TEXTO GRANDE:** la revisión visual encontró un recorte real que una primera comprobación de foco no detectaba. Las pruebas exigen visibilidad y toque, conservando el 200 % en nodos remontados. Si cabecera y acciones medidas agotan el cuerpo, el panel pasa a un solo desplazamiento hasta cerrar. Los valores y decisiones importantes pertenecen al padre; no se escriben ni descartan al cambiar la disposición.
- **VERIFICACIÓN FINAL:** TypeScript; 758 unitarias; 248 Chromium y 42 WebKit correctos, sin fallos ni intermitentes. Chromium registra 24 omisiones deliberadas de matrices duplicadas. Exportaciones web/iOS/Android, 420 capturas base y comprobación de integridad de 75 referencias. Informes en `design/mobile-readiness/reports/`.

| Riesgo / puerta | Estado y tratamiento |
|---|---|
| Teclado y zona segura físicos | Pendiente iPhone/Safari, VoiceOver/TalkBack y Dynamic Type. El cálculo usa ventana/inset; no mide directamente el área reducida por el teclado. WebKit Linux y CSS al 200 % no cierran esta puerta. |
| Cambio de disposición | Puede reiniciar cursor, selección y scroll al remontar controles. Los borradores actuales son controlados por componentes propietarios; futuros hijos con estado interno necesitan revisión específica. |
| Futuros pasos de modal | El foco se repara con cambios de título/disposición, no mediante un observador general de contenido. Una nueva transición que elimine el control activo sin cambiar esas claves exige validación de teclado. |
| Seguridad de dependencias | Consulta del 10/11: cinco moderados, cero altos/críticos. Dos advisories transitivos glob/minimatch en herramientas Expo; versiones corregidas exceden los rangos oficiales. Mantener seguimiento sin ocultar avisos ni forzar mayores/downgrades. No existe JSON guardado de la consulta nueva; el informe de texto identifica los comandos y versiones. |
| Datos y privacidad | No se modificaron claves, migraciones, coordinación durable ni confirmaciones de borrado. Pruebas con datos ficticios; copias personales, trazas y capturas quedan fuera de GitHub. |
| Recetas, marca y aceptación | Las 150 recetas siguen pendientes de recepción. Se mantiene el catálogo inicial de siete; variantes/3D y revisión estética siguen por etapas. Hogares y comercio real continúan condicionados. |

La publicación de esta entrega se registrará tras verificar la preview protegida desde el commit guardado en GitHub. No implica promoción a producción ni aceptación visual o física.


### Publicación verificada — 2026-11-10

Fuente de aplicación: `23bde4371aa041a6ab96ab2f62afe815a6f5c472`, [PR #7](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/7), base en la entrega de filtros/privacidad. Preview `staging` READY: `dpl_BX1bmmAu4j653jPPJ3oS9AqjFp6K`, URL base https://jj-compra-inteligente-e3qq1imu1-cmj2hwhc6b-1051.vercel.app . Protección conservada. Verificación remota correcta en es/en/de/fr y 27 recursos por bytes/hash, incluidos filtros, guardado, menús, copia JSON exacta y borrado confirmado aislado. El enlace temporal se entrega únicamente en la conversación; vence el 11 de noviembre de 2026 a las 15:00:33 UTC. Su credencial queda fuera de GitHub. Informe: `design/mobile-readiness/reports/hosted-verification.json`.

Los borradores separados [PR #4, piloto de tiendas](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/4) y [PR #5, especificación de precios y salida externa](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/5) se localizaron en GitHub y permanecen intactos. No forman parte de esta preview ni se fusionaron automáticamente; su validación e integración es una entrega posterior. Se conserva el historial y no se promueve a producción. La prueba física, la revisión visual, las 150 recetas y los cinco avisos moderados siguen pendientes.
