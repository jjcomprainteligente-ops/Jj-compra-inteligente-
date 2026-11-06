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
