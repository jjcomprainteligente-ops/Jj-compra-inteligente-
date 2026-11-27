# Inventario único | JJ Compra Inteligente

**B08.2 comprobado localmente · 27/11/2026:** revisión efímera de cesta en Ahorro → Mis precios → Revisar cesta manual. Envases enteros, consumo/sobrante, cobertura y gastos/mínimos explícitos; precios siempre no verificados. 2.574 unitarias, 178 Python y 52 casos locales (36 nuevos + 16 regresiones), tipos y exports web/iOS/Android correctos. Conserva 428 inputs anteriores, los 308 recursos y los siete documentos. [Informe](BLOQUE08_2_CESTA_MANUAL.md). GitHub/CI de esta fuente y staging protegida siguen pendientes en este checkpoint. B07, ranking/compra repartida, aceptación física y revisión estética humana no se declaran cerrados. Los registros previos conservan su alcance a la fecha de cada entrega.

**B08.1 preparado, probado y publicado · 27/11/2026:** motor interno de cesta para una tienda: envases enteros, consumo/sobrante y cobertura; costes desconocidos permanecen en null. **Todavía no conectado a pantallas**, sin precios oficiales ni ranking. [PR #35](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/35), fuente `ee03a4b`, CI correcta. 2.484 unitarias (126 nuevas); JS/HTML/308 recursos y 428 inputs anteriores idénticos a B06.2. Staging protegida: cuatro idiomas/319 recursos HTTPS correctos; no se atribuyen como nuevas las matrices anteriores. [Informe](BLOQUE08_1_MOTOR_CESTA.md). Acceso por conversación hasta **28/11/2026 07:32:27 UTC**. Integración visible posterior; B07, B08 completo y aceptación física siguen pendientes.

**B06.2 publicado y auditado · 26/11/2026:** zona opcional por CP/localidad, radios 5/10/20 o enteros1–100 y ubicación puntual voluntaria. Directorio parcial: 209 referencias de localidad, seis fichas comerciales, cinco puntos publicados y uno pendiente. [PR #34](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/34), fuente `37a5979`, CI de fuente correcta. **2.358 unitarias, 178 Python y 122 casos locales**; staging protegida: cuatro idiomas/319 recursos y 32 casos WebKit correctos. Mantiene los 428 inputs probados, recetas/fotos y siete documentos; sin precios conectados. [Informe](BLOQUE06_2_CP_Y_DISTANCIAS.md). Acceso temporal por conversación hasta **27/11/2026 22:49:28 UTC**. B07 y la aceptación visual/física siguen pendientes; no se fusionan main ni las PR anteriores.

**B06.2 en verificación · 26/11/2026:** zona opcional por CP/localidad, radios 5/10/20 o personalizados, ubicación puntual voluntaria y distancias lineales sobre el directorio parcial B06.1. Conserva documentos y recetas; 2.358 unitarias y 178 Python correctas. Las pruebas finales de navegador, auditoría de pareja y publicación siguen en curso. [Detalle](BLOQUE06_2_CP_Y_DISTANCIAS.md).

**B06.1 maestro publicado · 26/11/2026:** directorio parcial en Perfil → Mis tiendas → Ver establecimientos, cuatro UI. Seis fichas oficiales de cuatro formatos, cinco puntos publicados y un CP pendiente; ALDI/Mercadona todavía sin fichas comprobadas en este lote. [PR #33](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/33), fuente `d5df082`, CI correcta. Local: 1.975 unitarias y 24 + 16 casos de navegador; staging protegida: cuatro idiomas/319 recursos y 16 casos nuevos WebKit correctos. Mantiene favoritos, siete documentos y menús V1/V2. Sin distancias, GPS o precios conectados. [Informe actual](BLOQUE06_1_REGISTRO_ESTABLECIMIENTOS.md). Acceso temporal por conversación hasta 27/11/2026 09:16:05 UTC. Los checkpoints anteriores de publicación pendiente conservan su fecha; B06.2, cobertura completa y auditoría de pareja siguen después.

**B06.1 maestro · 26/11/2026 · lote parcial comprobado localmente, publicación en preparación:** consulta de seis fichas oficiales en Perfil → Mis tiendas → Ver establecimientos. Cuatro formatos representados, cinco ubicaciones publicadas y una pendiente por CP; ALDI/Mercadona todavía sin fichas comprobadas en este lote. Conserva los seis formatos, siete documentos y menús V1/V2. Tipos, 1.975 unitarias, 24 casos nuevos y 16 regresiones pasan; exports web/iOS/Android correctos. Sin distancias, GPS o precios conectados. [Informe y alcance](BLOQUE06_1_REGISTRO_ESTABLECIMIENTOS.md). Este bloque geográfico es distinto de la auditoría histórica de precios B06.1; B06.2 y su auditoría de pareja quedan después del cierre actual.

**B05.4 publicada y comprobada · 25/11/2026:** menús de 1–14 comidas para 1–12 personas (propuesta inicial para revisión), planes anteriores conservados y confirmación explícita de propuestas variables y regeneraciones del plan completo. [PR #32](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/32), fuente `97d3168`, CI de fuente correcta. Staging protegida: cuatro idiomas/319 recursos y 24 casos nuevos WebKit correctos; local: 1.853 unitarias, 155 Python y 36 + 24 casos de navegador. Auditoría de pareja completada técnicamente; las 300 decisiones editoriales V3 y aceptación visual/física siguen pendientes. [Informe actual](BLOQUE05_4_MENUS_VARIABLES.md). Acceso temporal por conversación hasta 26/11/2026 22:27:14 UTC. Main y producción conservados; las anotaciones previas de publicación pendiente son checkpoints históricos.

**B05.4 · 25/11/2026 · comprobación local actual:** N=1–14 y personas=1–12 en menús y recorrido por presupuesto. Se preservan V1, siete documentos y 157 recetas/fotos. Tipos, 1.853 unitarias, 155 Python, 36 casos nuevos y 24 regresiones pasan. GitHub/CI/staging pendientes en este checkpoint. [Informe](BLOQUE05_4_MENUS_VARIABLES.md) · [auditoría de pareja](AUDITORIA_PAREJA_B05_3_B05_4_2026-11-25.md). La propuesta de rango no cierra aceptación de producto ni las 300 decisiones editoriales; B06 no se abre automáticamente.

**Registro maestro materializado en Bloque 01 · 13/11/2026.** El propietario autorizó consolidar la app existente, sin empezar de cero. Los hechos de partida proceden de la auditoría de lectura del Bloque 00, cerrada a las 16:43 UTC. [Plan aprobado recibido](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md) · [mensaje inicial de auditoría ya realizada](fuentes/JJ_MENSAJE_INICIAL_CODEX_2026-11-13.md). Las pruebas de aquella auditoría son lecturas de evidencia, no suites recién ejecutadas.

## B05.3 · candidata comprobada del 24/11/2026

Corrección de la revisión dietética y preparación editorial publicadas en [PR #31](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/31), fuente `e3a50e4103cd5003977426583856838391565dac`. CI push/PR correctas; staging protegida:4 idiomas/319 recursos,16 recorridos y8 controles de Inicio correctos. Recuperación por hash sin pérdidas:29 archivos,408 entradas y2.034 archivos de snapshot intactos. Local21/11:1.708 unitarias/155 Python/24 casos de navegador correctos; no se presentan como nuevas suites locales del 24/11. Consulta de dependencias del 24/11:0 avisos conocidos. Escaneo conservado:17 falsos positivos,0 secretos confirmados, salida 1; sin historial ni interiores de comprimidos.

Se mantienen157 recetas,150 fotos,UI y contratos. [Paquete editorial](../../referencias/revision-culinaria/B05_3/README.md):15 lotes/150 IDs/300 decisiones pendientes. Categorías históricas insuficientes; no se activan dietas por nombre, código o alérgenos. B05.4 visible/persistente y aceptación física siguen pendientes; auditoría después de la pareja. Main conserva PR #30, sin promoción de producción ni servicios nuevos. [Informe](BLOQUE05_3_SEGURIDAD_Y_REVISION_CULINARIA.md) · [evidencia](../../design/culinary-review/reports/verification.json).

## Integración V3 · estado operativo del 21/11/2026

**INTEGRADO EN MAIN Y CI CORRECTA; STAGING VERIFICADA.** Main incorpora 150 recetas verificadas y conserva siete anteriores: 157 IDs únicos. Las 120 proyecciones existentes, originales, logo, Manrope y contratos guardados permanecen intactos. Las 150 fotos recibidas tienen 300 derivados locales comprobados; cero faltantes. Tipos, 1.672 unitarias y 135 Python correctos; reproducción de catálogo y 300 derivados correcta. Local: 64 casos de fotografías —1.200 comprobaciones de miniatura/detalle—, 60 de recorrido/Inicio y 24 de menús anteriores correctos. Los dos intentos iniciales corrigieron exclusivamente un oráculo de traducción y una espera de guardado; se conservan sus evidencias, sin cambios de aplicación ni retirada de controles. Fuente `80ab9e14185e3f50758339bd787c3f9b50113bc9`, [PR #30](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/30), CI push [44893148932](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44893148932) / pull_request [44893221491](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44893221491) correcta. Staging `dpl_4infJZdipQwLz3fGcdx7NFD2esfc`, READY y protegida: cuatro idiomas, 157 recetas y 319 recursos por HTTPS; 24 casos de fotografías, 16 recorridos y ocho controles de Inicio publicados correctos, sin fallos, omisiones o intermitencias. Acceso temporal por conversación hasta **22/11/2026 10:29:01 UTC**, sin token en Git ni informes públicos. La UI sigue en es/en/de/fr y BG permanece en la fuente. El propietario autorizó y se fusionó el PR #30 el 21/11/2026 a las 20:41:20 UTC: `1504afd8538a3e38a546d41048b45be6d6cac3bf`, árbol `f67af55e36cdb482f5734db69d5346bbf37405f8`, idéntico al de la candidata `26244016f75e505a7e3b4d47c2a656c87c7a3a29`; [CI de main](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44947600998) correcta. Los 407 inputs de app se volvieron a contrastar sin diferencias. Pendientes: aceptación visual y física detallada, y las entregas del [plan auditado 00–14](AUDITORIA_PENDIENTES_TRAS_PR30_2026-11-21.md). No se reabre el permiso de recetas, fotos o esta fusión. [Registro de main](../../design/recipe-integration150/reports/main-integration.json). [Informe](INTEGRACION_150_RECETAS_Y_FOTOS_2026-11-20.md) · [evidencia final](../../design/recipe-integration150/reports/verification.json).

### Antecedente comprobado · consolidación del 19/11

La candidata `codex/recepcion-v3-segura-2026-11-18`, integrada en main, reúne la app del PR #27 y las fuentes del PR #28. TypeScript, 1.549 unitarias, 110 Python —59 nuevas—, npm y compatibilidad Expo `~58.0.26` correctos; 24 casos locales de menús y 60 de recorridos/Inicio correctos. Exportaciones de tres plataformas verificadas y hashes registrados. Fuente `d0c71a7c2dabac1e5bd2f25e8ad5a70fd829d9dd`, [PR #29](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/29), CI push/PR correctas. Staging protegida: cuatro idiomas/127 recetas/19 recursos HTTPS y 16+8 casos publicados correctos. [Cierre](../../design/v3-intake/reports/verification.json). CI de main [44523616187](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44523616187) correcta; árbol del merge idéntico al de la candidata `761275f`. Se retiraron 21 ramas superadas o duplicadas mediante una operación atómica con SHA esperado; quedan seis ramas y el respaldo etiquetado se conserva. Sin eliminación de archivos de la app o fuentes. Producción y protección conservadas; la preview mantiene su fuente probada anterior, sin nuevo despliegue. [Integración ejecutada](../../design/v3-intake/reports/main-integration.json). [Alcance y respaldo verificable](CONSOLIDACION_V3_Y_RECEPCION_SEGURA_2026-11-18.md).

## Origen histórico y nomenclaturas

Los SHA, ramas y despliegues de esta tabla corresponden al Bloque 00/01 del 13–14/11. No sustituyen el estado operativo del 21/11 ni la fusión ya ejecutada del PR #30.

| Referencia | Identificador comprobado / alcance |
|---|---|
| Repositorio | `jjcomprainteligente-ops/Jj-compra-inteligente-`, público. |
| `main` auditado | `d22d66eff03c5d107f5170ee38cd2bc3167865e2`, commit del 31/10/2026. |
| Base de consolidación | `abb3bca53953e4523af61118e375df90d1a8d416`, PR #20; 28 commits delante de main en el Bloque 00. |
| Referencia de recuperación creada | `codex/respaldo-base-2026-11-13`, inicialmente en ABB. Es una referencia Git del código seguido, no respaldo del ZIP privado ignorado. |
| Rama de integración creada | `codex/integracion-maestra-2026-11-13`, desde ABB; origen comprobado `78480fd40b4a116d53ebb016f31085785f42a6e6`, PR #21. |
| Último origen compilado anterior | `17d5fbc8adf9f8cbd07f7bd930a19a086931a841`, PR #19. EF y ABB posteriores añadieron documentación/evidencia sin inputs de app o dependencias. |
| Bundle anterior de staging | SHA-256 `c3f6a11fb1f74b5abff79deab50c98a5675a4a8fd993e4e7b84516ef6ffb3ab7`. |
| Staging anterior | `dpl_ETU2D6tyLxV89TXVQHB2BNwXQUvz`, READY/protegida según lectura del Bloque 00; acceso temporal fuera de Git, hasta 14/11/2026 14:23:22 UTC. |
| Producción auditada | Alias principal dirigido a `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`, diferente de staging y sin SHA de origen en sus metadatos. No se promociona durante la consolidación. |

**No mezclar índices:** B00–B09 son los bloques del kit antiguo; 00–14 son los del plan maestro del 13/11. En particular, B06.1 de fuentes alimenta el **Bloque 07 maestro**, y B07 de cuentas/hogares corresponde al **Bloque 11 maestro**. El Bloque 01 maestro es consolidación, no el antiguo estudio de identidad B01.

Estados de requisito: `NO_LOCALIZADO / PENDIENTE / BLOQUEADO / EN_CURSO / IMPLEMENTADO_SIN_PROBAR / PROBADO_AUTOMATICAMENTE / VALIDADO_EN_DISPOSITIVO / APROBADO_PROPIETARIO`. Para archivos se distingue `LOCALIZADO_VERIFICADO / REFERENCIADO_NO_ACCESIBLE / AUSENTE / DUPLICADO / PROVISIONAL`. Una aprobación de dirección visual no cierra automáticamente pruebas físicas, idiomas, datos o funciones.

## Matriz de requisitos y próximas acciones

| ID / requisito y decisión | Fuente original / decisión | Código y pantalla existente | Prueba / alcance registrado | Estado real | Bloqueo y próxima acción |
|---|---|---|---|---|---|
| R01 · Conservar app e historial | Propietario y plan maestro; autorización posterior de B05 | App existente y nueva coordinación de compra, sin reinicio | Recetas, IDs, datos fuente, dependencias, logo y protecciones conservados; 28 archivos protegidos comprobados | PROBADO_AUTOMATICAMENTE en el alcance de conservación | 01.1: el propietario confirmó copia en carpeta del proyecto; independencia externa sin inspección. B05 autorizado por el propietario; no se afirma respaldo externo verificado. |
| R02 · 150 recetas / cinco idiomas de fuente | ZIP privado V83, manifiesto interno y controles | Original local ignorado; importador `scripts/import-recipes-v83.py` | Lectura: 150 IDs únicos, 750 fichas; 13/13 hashes internos correctos | LOCALIZADO_VERIFICADO como material | Respaldo independiente pendiente; no publicar el ZIP privado. |
| R03 · Catálogo del cliente y fuente autorizada | Fuente V3 completa y autorización de las 150 | Main tras PR #30: **150 + 7 = 157 IDs únicos**, sin duplicar las 120 ya integradas | 1.672 unitarias, 135 Python, reproducción y recorridos comprobados; igualdad exacta de siete anteriores y 120 V83 | PROBADO_AUTOMATICAMENTE Y STAGING VERIFICADA | PR #30 autorizado y fusionado; CI de main correcta. Aceptación visual/física pendiente. |
| R04 · Autorización y trazabilidad de las 150 | Aprobación expresa e integración solicitada por el propietario | Las treinta identidades que faltaban ya están activas en main; el módulo histórico V83 conserva su selección | Se conservan fuente, IDs, cantidades, traducciones anteriores y estados históricos fechados | APROBADO_PROPIETARIO PARA CATÁLOGO/FOTOS/FUSIÓN; INTEGRADO EN MAIN | No pedir de nuevo autorización del texto, fotos o fusión ni repetir catas por inferencia. Prueba física y revisión visual separadas. |
| R05 · Fotografías integradas | 150 JPEG del perfil app10mb y doce PNG anteriores conservados | Mapa estático por ID, 300 derivados locales, carga progresiva y error localizado | 64 casos locales, 1.200 verificaciones de variantes y 24 casos publicados correctos; originales intactos | PROBADO_AUTOMATICAMENTE Y STAGING VERIFICADA | Aceptación visual y prueba física separadas; foto no certifica derechos, alérgenos o datos comerciales. [Informe](INTEGRACION_150_RECETAS_Y_FOTOS_2026-11-20.md). |
| R06 · Diseño Verde Mercado Premium / GPT-6 V2 | Kit recuperado de 16 vistas/nueve estados y PNG oficial | `src/app/components/ui.tsx`, `assets/brand/jj-logo-horizontal.png`; cuatro tabs y subpantallas | Capturas de consolidación; contraste previo con alcance identificado; PNG exacto comprobado | PROBADO_AUTOMATICAMENTE en alcance técnico | Aceptación estética y dispositivo pendientes; no recrear SVG/3D ni volver a M3. |
| R07 · Navegación y estados | Contrato V2 y cobertura ejecutable | `ShoppingApp.tsx`, pantallas y `StateReviewScreen.tsx` | 16 escenas y nueve ejemplos rotulados en `tests/e2e/coverage-visual.spec.ts` | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | La galería no acredita conexión de servicios ni todos los fallos reales; regresión de consolidación completada; aceptación funcional humana separada. |
| R08 · Guardado y privacidad | Reglas de conservación y pruebas previas | `src/storage/writeFence.ts`, `writeCoordinator.ts`, `dataPrivacy.ts` | Unitarias de baseline ABB y recorridos 78480fd: siete documentos y protección frente a conflicto/incertidumbre | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | Preservar claves y journal técnico; persistencia comprobada sobre origen 78480fd; mantenerla en cambios futuros. |
| R09 · Recorrido diario | Plan maestro02 y orden de continuar14/11 | Menús, revisión, listas, `MoneyScreens.tsx` y `expenses.ts` intactos | B02 local 36/36 y staging 36/36 de 61793e, receta primero, error/duplicados/lista vacía; [guía Safari](BLOQUE02_PRUEBA_SAFARI_IPHONE.md) e [informe](BLOQUE02_ENTREGA_Y_AUDITORIA.md) | PROBADO_AUTOMATICAMENTE local / prueba física PENDIENTE | Staging protegida comprobada; prueba física pendiente. No esperar fotos ni precios. |
| R10 · Dos entradas recetas/presupuesto | PR #11 y Bloque 05 maestro, continuación autorizada | Inicio, PlanningScreens, MenuWorkspace y guardado confirmado; sin feed | PR #26: 48 casos nuevos sobre e1c3; ajuste final 12 casos/20 escenas y staging 16 recorridos + ocho controles de Inicio en cuatro idiomas | PROBADO_AUTOMATICAMENTE (B05.1); aceptación del propietario PENDIENTE | [Entrega](BLOQUE05_DOS_ENTRADAS_Y_PRESUPUESTO.md). Cinco comidas visibles y 1–12 personas; coste pendiente. [B05.2](BLOQUE05_2_MOTOR_COMIDAS_VARIABLES.md), PR #27: motor N aislado preparado, 468 pruebas nuevas; sin cambio de UI ni `menus.v1`. B05.3 prepara 15 lotes y corrige la revisión estática en PR #31; las300 decisiones editoriales siguen pendientes. Activación visible/persistente de N y aceptación física pendientes; no se abre B06 automáticamente. |
| R11 · Seis tiendas | Decisión del piloto y enlaces oficiales | `src/domain/stores.ts`, `StoresScreen` y preferencias locales | Pruebas 78480fd de una/varias/todas, enlaces y persistencia | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | CP, radios y ubicaciones verificadas pendientes del Bloque 06; selección no implica PVP. |
| R12 · Fuentes de precios | PR #16 e issues #13/#14/#17/#18; auditoría PR #20 | Comparador manual y fuentes externas desactivadas para PVP actual | HTTP B06.1 del 13/11: tuTándem histórico; Open Prices 27 observaciones históricas/siete lugares, 0 del 7–13/11 | BLOQUEADO para PVP local actual | Revisar permiso/alcance; indicadores históricos solo separados y atribuidos. No ranking local ni scraping. |
| R13 · Gasto y comparación honesta | Gasto confirmado ≠ presupuesto ≠ estimación | `ShoppingApp.tsx`, `src/domain/expenses.ts`, `PriceWorkspace.tsx` | Unitarias de baseline ABB y recorridos 78480fd; gasto explícito, no derivado de marcar | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | Corregir guías históricas y conservar equivalencias, fuentes, fechas y cobertura. |
| R14 · Idiomas | Cuatro idiomas de lanzamiento; BG completo en Bloque 09 maestro | `src/i18n/types.ts`, catálogos y preferencia manual | Cuatro UI comprobadas en fuente 80ab9e1 y staging de 157 recetas/319 recursos; 407 inputs conservados en main; BG en fuente | PROBADO_AUTOMATICAMENTE para 4 / PENDIENTE BG UI | Mantener respaldo español y EUR; activar BG solo con UI completa y comprobada. |
| R15 · IA revisable | Arquitectura futura del Bloque 10 | `src/i18n/assistantLanguage.ts`; motor local determinista | Preparación local de idioma, sin llamadas IA | PENDIENTE | No habilitar IA, secretos o gasto en Bloque 01. |
| R16 · Cuentas/hogares | B07 antiguo y Bloque 11 maestro | Contratos, tres migraciones y `supabase/tests/household_security.sql` | Snapshot12/11 de 14 tablas RLS/FORCE y 0 filas; matriz sin resultado | BLOQUEADO | Resolver control nativo y prueba real; no BFF/login/RPC/invitaciones/sync activados. |
| R17 · iPhone/Android | Bloques02/12, EAS preparado | `eas.json`, guías y `tests/iphone-pilot/` | Exports/automatización anteriores; no binario firmado ni ejecución física acreditados | PENDIENTE de dispositivo | Probar Safari, teclado, lectores, permisos, safe areas y persistencia; no equiparar WebKit Linux a iPhone. |

## Matriz de vistas y estados

Las 16 escenas están enumeradas en [la cobertura visual](../../tests/e2e/coverage-visual.spec.ts). Su presencia demuestra inventario ejecutable, no aceptación estética ni servicios externos activados.

| Vista V2 | Superficie actual / evidencia de recorrido |
|---|---|
| 01 Bienvenida | Idioma del dispositivo/elección y entrada a la app. |
| 02 Inicio | Acciones locales, presupuesto y acceso a menús. |
| 03 Mi compra | Lista, productos, edición y marcado. |
| 04 Ahorro | Gasto confirmado y comparación manual. |
| 05 Menús | Plan local de cinco cenas y personas. |
| 06 Detalle receta | Receta, cantidades, pasos, avisos y foto local de la entrega para las 150 V3; las siete anteriores conservan su estado sin inventar imágenes. |
| 07 Ingredientes | Revisión/confirmación/cancelación antes de escribir. |
| 08 Buscar producto | Búsqueda entre listas locales. |
| 09 Detalle producto | Ficha de producto guardado. |
| 10 Voz | Captura opcional compatible y alternativa manual. |
| 11 Escáner | Captura opcional compatible y alternativa manual. |
| 12 Mis tiendas | Selección local y salidas oficiales. |
| 13 Presupuesto | Límite y gasto separado. |
| 14 Historial | Registros explícitos de gasto. |
| 15 Perfil/hogar | Perfil local; hogar sincronizado no activado. |
| 16 Notificaciones | Preferencias y recordatorios internos; ofertas sin fuente no conectadas. |

Los nueve estados de la galería están marcados **EJEMPLO**: vacío, sin precio, sin conexión, error de red, micrófono denegado, cámara denegada, código desconocido, duplicado y éxito. Los flujos reales de permisos/errores tienen pruebas específicas; no se sustituyen por esta galería.

## Siete documentos de negocio y cinco idiomas

El prefijo de las claves es `jjcompraintelwgiemt.`. Se conservan `shopping.v1`, `menus.v1`, `comparisons.v1`, `price-observations.v1`, `preferences.v1`, `expenses.v1` y `local-settings.v1`. El journal IndexedDB de huellas es protección técnica adicional y no se anuncia como un octavo documento de negocio. Las migraciones futuras necesitan prueba de recuperación y preservación de estas claves.

| Idioma | Fuente V83 | Interfaz actual | Aceptación física/lingüística externa |
|---|---|---|---|
| es |150 fichas | Activada; respaldo por defecto | Pendiente; automatización no es certificación externa. |
| en |150 fichas | Activada | Pendiente. |
| de |150 fichas | Activada | Pendiente. |
| fr |150 fichas | Activada | Pendiente. |
| bg |150 fichas | No activada en UI | Pendiente del Bloque 09 y revisión. |

Los seis formatos del piloto son Lidl, ALDI, HiperDino, SuperDino, HiperDino Express y Mercadona. Se conservan compatibilidades locales anteriores de otras tiendas; no se heredan tarifas entre los tres formatos Dino ni entre canales.

## Originales y respaldo: manifiesto histórico del Bloque 00/01 · 13–14/11

La tabla conserva la disponibilidad constatada entonces. Su fila de 0/150 fotos describe aquel momento: la entrega V3 posterior aporta las 150 y está integrada en main, con cero faltantes. Véase el estado operativo y el [informe actual](INTEGRACION_150_RECETAS_Y_FOTOS_2026-11-20.md). Los permisos de las treinta recetas y las fotos ya se recibieron; no se reabren por conservar esta tabla. La independencia externa del respaldo sí continúa sin inspección.

| Material | Tamaño / hash verificado en Bloque 00 | Estado |
|---|---|---|
| ZIP privado completo V83 |937.580 B; SHA-256 `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034` | LOCALIZADO_VERIFICADO; ignorado por Git. Copia/restauración locales verificadas en Bloque 01; propietario confirma copia en carpeta del proyecto el 14/11. Independencia e integridad externas no inspeccionadas. |
| ZIP público 120 |639.105 B; SHA-256 `5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62` | LOCALIZADO_VERIFICADO; 120 IDs/600 fichas. No respalda las 30 retenidas. |
| XLSX dentro del ZIP privado |130.761 B; SHA-256 `dfa8e15c6471c862933eb5f6cd81fd1f9e00489f889088cf41f6fa18280c09a1` | LOCALIZADO_VERIFICADO dentro del ZIP; adjunto separado no accesible. |
| Seis originales GPT-6 V2 | [Manifiesto de recepción](../../referencias/gpt6-v2/MANIFIESTO_RECEPCION_2026-10-31.json), tamaños y hashes cotejados | LOCALIZADO_VERIFICADO. Incluye kits, PDF, logo y panel canónico. |
| PNG de logo usado |936×330; SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596` | LOCALIZADO_VERIFICADO; no recrear ni reemplazar. |
| V83 grande/histórico | Referidos por manifiesto ligero: SHA `eb4e1a1fd1afdeae32f95690499e9d59052f167aa339f15a441d94d4802893f9` y `f7a4f1cbec2910ead967f18b016846bb53b12050eeeb3bc7371c644ea61a0d96` | REFERENCIADO_NO_ACCESIBLE; mención a Biblioteca JJ no demuestra copia recuperable. |
| Fotos definitivas V38–V83 | Ningún conjunto original por ID localizado; ZIP ligero con cero imágenes | NO_LOCALIZADO; 0/150 correspondencias definitivas integradas. No significa borrado. |

El [estado público del respaldo](RESPALDO_ESTADO_PUBLICO.json) conserva los recuentos sin contenido privado: `OWNER_CONFIRMED_PROJECT_FOLDER`; el propietario confirma una copia en la carpeta del proyecto el 14/11. `independentBackupVerified` sigue siendo falso: no se inspeccionó ese destino ni su independencia. Los adjuntos históricos del chat no permanecían montados en el Bloque 00; la presencia de una ruta antigua no acredita disponibilidad. Una copia, un ZIP restaurado o un bundle Git dentro del mismo entorno no constituyen respaldo independiente. El bundle Git conserva archivos seguidos, nunca el original privado ignorado. No publicar recetas retenidas, cuerpos completos de auditoría, fotos no aprobadas ni datos locales del propietario.

## PR y dependencias conservadas

Registro remoto de la auditoría 00 del 13/11: 15 PR abiertos. Los seis #11/#12/#15/#16/#19/#20 estaban en borrador; todos los quince figuraban fusionables contra su propia base. Eso no es aprobación ni ausencia de conflictos sobre la nueva integración.

| PR | Base de su PR | Head auditado |
|---|---|---|
| [#1](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/1) | main | `codex/v2-visual` · d7f8c37 |
| [#2](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/2) | codex/v2-visual | `codex/v2-cobertura-local` ·52ea41d |
| [#3](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/3) | codex/v2-cobertura-local | `codex/menus-privacidad-local` ·936459d |
| [#4](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/4) | codex/menus-privacidad-local | `codex/tiendas-precios-piloto` ·2ae8d27 |
| [#5](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/5) | main | `producto/piloto-tiendas-y-precios-2026-11-10` ·21601a2 |
| [#7](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/7) | codex/menus-privacidad-local | `codex/mobile-readiness` ·338ba24 |
| [#8](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/8) | codex/mobile-readiness | `codex/tiendas-y-lista-compartida` ·914fa2e |
| [#9](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/9) | codex/tiendas-y-lista-compartida | `codex/b07-propuesta-hogares` ·4e0fb2a |
| [#10](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/10) | codex/tiendas-y-lista-compartida | `codex/b07-base-segura` ·1db842d |
| [#11](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/11) | codex/tiendas-precios-piloto | `feature/precios-abiertos-en-jj-2026-11-11` ·2562d98 |
| [#12](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/12) | codex/b07-base-segura | `codex/iphone-prueba-recorrido` ·dbb703f |
| [#15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15) | codex/iphone-prueba-recorrido | `codex/v83-recetas-auditadas` ·5795f29 |
| [#16](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/16) | codex/tiendas-precios-piloto | `producto/b06-fuentes-precios-y-acuerdos-2026-11-12` ·95686b3 |
| [#19](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/19) | codex/v83-recetas-auditadas | `codex/cierre-seguridad-y-calidad` ·ef37e7e |
| [#20](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/20) | codex/cierre-seguridad-y-calidad | `codex/b06-1-auditoria-fuentes` ·abb3bca |

```text
main → #1 → #2 → #3 → #7 → #8 → #10 → #12 → #15 → #19 → #20
                         ↑       ↑
                 #4 ya heredado  #9 ya heredado
main → #5 paralelo
#4 → #11 y #16 paralelos
```

#4 y #9 ya son ancestros de ABB mediante merges históricos; no reaplicar sus árboles. PR #11 no está en `codex/v2-cobertura-local`: esa rama es del PR #2. PR #16 contiene tres documentos de producto. El responsable de integración ya incorporó sus archivos exactos desde `95686b3`: [plan de fuentes](../B06_CODEX_PLAN_EJECUCION_FUENTES_PRECIOS_2026-11-12.md), [contrato de precios](../B06_CONTRATO_DATOS_PRECIOS_V1_2026-11-12.md) y [borradores comerciales](../B06_BORRADORES_SOLICITUD_FEEDS_2026-11-12.md). Es conservación documental; no integra código del PR #11 ni habilita feeds.

## Antecedentes del 13–14/11 · procedencia de pruebas y cierre de Bloque 01

Esta sección y las actualizaciones fechadas siguientes conservan sus afirmaciones a la fecha de ejecución. Las próximas acciones y puertas antiguas no rigen sobre el estado operativo del 21/11; solo 01.1 de respaldo independiente continúa pendiente. No describen fotos faltantes ni una fusión actual por aprobar.

| Evidencia anterior | Origen y alcance que se conservan |
|---|---|
| CI ABB | Run [43453268489](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43453268489), success; 981 unitarias/27 archivos, tipos, audit sin vulnerabilidades conocidas, Expo compatible y export web. Leída en auditoría 00, no ejecutada de nuevo por documentación. |
| Chromium/WebKit completos | Bundle `349e6e981b1d1894fd2deb18da3f0321b4e9e8c436879a9eb628c173c636b4eb` ; 298 correctas + 24 omisiones deliberadas  / 16 WebKit. [Procedencia](../../design/closeout/reports/verification.json). |
| Último ajuste visual | Origen 17d5, bundle `c3f6a11f…`; calidad 8/8, 296 escenas; pulsación/foco 9/9, 40 pulsaciones y 2 geometrías. [Informe](../../design/closeout/reports/switch-alignment.json). |
| HTTPS anterior | Cuatro idiomas, 127 recetas, 29 recursos/URLs por hash. [Informe](../../design/closeout/reports/hosted-verification.json). No acredita iPhone físico. |
| B07 | Estado `no_result_native_control_unresolved`. [Informe](../../design/closeout/reports/b07-status.json). Cero aserciones de matriz contadas; no consulta nueva de BD en la actualización documental. |

El baseline nuevo del Bloque 01 sobre ABB está comprobado en copia aislada: instalación limpia, reproducción de la selección pública V83, tipos, 981/981 unitarias (cero fallidas/omitidas), audit sin vulnerabilidades conocidas, compatibilidad Expo y exportaciones web/iOS/Android. El bundle web conserva `c3f6a11f…`; el registro de procedencia verifica 159 huellas de inputs. La evidencia local es `baseline-results.json` del directorio privado `bloque01-checks-syh_45id`; no se publica ese directorio. Estos resultados corresponden a ABB, no a un futuro SHA documental. La ejecución posterior sobre `78480fd40b4a116d53ebb016f31085785f42a6e6` terminó con 298 Chromium correctos/24 omisiones deliberadas y 16/16 WebKit, CI correcta y candidata staging verificada. El HTTPS se revalidó el 14/11 en cuatro idiomas y 29 recursos/URLs; el [registro final](../../design/master-integration/reports/integration-verification.json) identifica SHA, alcance y puerta de respaldo todavía pendiente. [Política de integración](POLITICA_INTEGRACION_Y_RECUPERACION.md).

## Contradicciones conciliadas documentalmente

Los textos previos de README, estado y dirección visual se conservan bajo `ARCHIVO_HISTORICO`. El resumen actual distingue: publicación verificada frente a pendiente antigua; 16 vistas/nueve ejemplos frente a aceptación completa; logo V2 recuperado frente a M3 provisional; gasto confirmado frente a marcado de productos; cero avisos conocidos de una ejecución frente a avisos históricos. El ancla antigua de publicación se redirige al título existente de publicación inicial. No se altera el significado ni los resultados de las entregas originales.

**Dependencia conservada:** respaldo privado independiente sin inspección externa; copia declarada confirmada por el propietario. **Acción actual autorizada:** QA del Bloque 02 sobre la app intacta, con pruebas nuevas y guía Safari. Antes de modificar la aplicación se mantiene la verificación de integridad y recuperación independiente de 01.1. No se habilitan cuentas, feeds, imágenes nuevas ni pagos.


## Actualización documental posterior al primer commit de integración

Origen de la consolidación documental y de las pruebas finales: `78480fd40b4a116d53ebb016f31085785f42a6e6`, [PR #21](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/21), sin cambios en inputs de aplicación respecto de ABB. [CI real correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43514500031); la regresión local terminó correctamente: 298 Chromium/24 omisiones deliberadas y 16/16 WebKit, sin fallos ni intermitencias. La referencia de recuperación conserva ABB y main permanece en D22.

Del PR #5 se conservaron únicamente [dos documentos históricos exactos](../historico/PR05_2026-11-10/README.md), blobs `33c12c20dd98cb69998cf56ac99012df01d6c1ad` y `1adbe9f1d78c19d3934766fc975a49ec4318bfbe`. Se preservan Agromercado Adeje y Mercatenerife como candidatos NO_AUDITADOS, con mayorista separado de minorista; no se habilitan por archivarlos. No se reponen las versiones antiguas de PRODUCTO/PLAN/DECISIONES ni se modifica su árbol sobre la app.

## Estado técnico actualizado 14/11/2026

Origen probado y desplegado `78480fd40b4a116d53ebb016f31085785f42a6e6`, árbol `84b422cd55dcb6688bdf16f514a0105f370b4639`, PR #21. [Ficha única de versión/evidencias](../../design/master-integration/reports/integration-verification.json): baseline limpio ABB 981/981/npm 0/export 3; CI real; Chromium 298 correctos/24 omisiones deliberadas; WebKit 16/16; 159/159 inputs coincidentes. Las matrices pertenecen a 78480fd; el cierre siguiente añade documentación e informes, sin representar otra ejecución.

Candidata staging `dpl_G3PZ39MHNk7a2ipCuLZBTRymtuWg`, READY y protegida. HTTPS revalidado 14/11 con cuatro idiomas, catálogo 127 y 29 recursos/URLs por hash. Acceso temporal fuera de Git hasta 14/11/2026 21:10:36 UTC. Producción sigue en su despliegue anterior; las capturas iniciales muestran Inicio antiguo frente a Bienvenida actual y no prueban equivalencia píxel a píxel ni pérdida de datos. [Comparación de lectura](../../design/master-integration/reports/production-comparison.json).

**Subtareas de base/documentación/QA/staging técnicamente verificadas; 01.1 mantiene pendiente la verificación independiente del respaldo.** El 14/11 el propietario confirmó su copia y ordenó continuar. Se adelanta QA de Bloque 02 con la aplicación intacta; no se afirma cerrado todo el Bloque 01, no se modifica código de app y no se promueve producción. La prueba física y aceptación estética siguen pendientes.


## Bloque 02 · recorrido de una receta · 14/11/2026

QA autorizada sobre la app existente intacta, separando 01.1 sin verificación externa. [Informe y auditoría](BLOQUE02_ENTREGA_Y_AUDITORIA.md): local 36/36 y staging 36/36, 180 capturas lógicas privadas por entorno y siete documentos conservados en los escenarios comprobados; [guía Safari](BLOQUE02_PRUEBA_SAFARI_IPHONE.md) para aceptación física pendiente. [PR #22](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/22), fuente `61793e4833c702a6294eedde1f778cd80dfc074f`; CI 43591993356 correcta. Staging `dpl_DizPGJTNWdRhNnRQxXtToDKwdxEZ`, READY/protegida, cuatro idiomas, 127 recetas y 29 recursos/URLs por hash. Acceso temporal por conversación hasta 15/11/2026 10:52:36 UTC. No se abre el Bloque 03 ni se promueve producción.


## Bloque 03 · registro privado y exportación autorizada ·14/11/2026

Abierto por nueva orden del propietario tras revisión general favorable. [Informe](BLOQUE03_CATALOGO_Y_CONCILIACION.md): 150 recetas/750 fichas y controles por lotes conservados en privado; la app mantiene 127. El [índice público](../../referencias/recetas-v83/catalogo-maestro/INDICE_PUBLICO_150.json) deriva exclusivamente del ZIP público autorizado, sin nuevos datos editoriales de las 30 reservadas. Sus cuatro campos ya existentes se conservan exactamente. La propuesta y nuevos estados de retenidas se excluyeron del árbol tras rechazo automático; se conservan para revisión privada.

Herramienta sin sobrescritura, destino privado 0700/0600 y check sin escritura. TypeScript y 987/987 unitarias correctos; frontera pública restringida y 19/19 pruebas Python correctas. [PR #23](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/23), fuente `e544ec2f9fd332e6ad9ac74b60b2b2885f616419`: CI 43611606343 correcta; Chromium 298+24 deliberados, WebKit 16 y receta primero 36. Staging `dpl_JC4TDzdKay7LUzkP18oRp5DpgayR` comprobada, cuatro idiomas/127 recetas/29 recursos; acceso temporal por conversación hasta 15/11/2026 15:04:16 UTC. No hay cambios de aplicación, IDs, datos locales ni servicios. B03 EN_CURSO; siguiente acción privada sobre las excepciones, sin abrir04 o promover producción.


## Bloque 04.1 · inventario de fuentes y recepción · 14/11/2026

Nueva orden de continuar, conservando la app y los IDs ya comprobados. [Informe](BLOQUE04_FOTOGRAFIAS_Y_RECEPCION.md): 72 imágenes de marca/maquetas/QA, 16 paquetes, XLSX sin medios, historial de 44 commits/33 refs y 20 ramas de partida/19 árboles remotos completos. Cero originales de receta identificados; no significa que no existan en otro almacenamiento. Las rutas antiguas de adjuntos no están montadas.

Manifiesto de 127 activas, sin nuevos estados de las 30 retenidas; inventario de 150 privado. Validador de solo lectura, nunca aprobación automática; `--require-ready` rechaza la recepción incompleta. 32 pruebas de fotos y 51 Python combinadas, 987 unitarias y tipos correctos. Decodificador 13.0.0 aislado y fijado por hashes, con guarda de versión exacta; se descartó la versión 12.3 con avisos antes de entregar. No se alteran dependencias de la app, UI, listas o recetas.

[PR #24](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/24), fuente `65d152f2183eb14f7e184f53207feae7b4f54f88`: CI 43640045443 correcta y staging protegida verificada en cuatro idiomas / 127 recetas / 29 recursos. Acceso temporal por conversación hasta 15/11/2026 19:58:45 UTC. B04.1 prepara la herramienta; B04 sigue bloqueado para vincular originales. Siguiente acción: carpeta o enlace de los originales V38–V83, pregunta enviada sin respuesta asumida. No se abre B05 ni se fusiona/promueve producción; otras dependencias se conservan por separado.
