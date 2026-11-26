# JJ Compra Inteligente

**B06.2 en verificación · 26/11/2026:** zona opcional por CP/localidad, radios 5/10/20 o personalizados, ubicación puntual voluntaria y distancias lineales sobre el directorio parcial B06.1. Conserva documentos y recetas; 2.358 unitarias y 178 Python correctas. Las pruebas finales de navegador, auditoría de pareja y publicación siguen en curso. [Detalle](docs/MAESTRO/BLOQUE06_2_CP_Y_DISTANCIAS.md).

**B06.1 maestro publicado · 26/11/2026:** directorio parcial en Perfil → Mis tiendas → Ver establecimientos, cuatro UI. Seis fichas oficiales de cuatro formatos, cinco puntos publicados y un CP pendiente; ALDI/Mercadona todavía sin fichas comprobadas en este lote. [PR #33](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/33), fuente `d5df082`, CI correcta. Local: 1.975 unitarias y 24 + 16 casos de navegador; staging protegida: cuatro idiomas/319 recursos y 16 casos nuevos WebKit correctos. Mantiene favoritos, siete documentos y menús V1/V2. Sin distancias, GPS o precios conectados. [Informe actual](docs/MAESTRO/BLOQUE06_1_REGISTRO_ESTABLECIMIENTOS.md). Acceso temporal por conversación hasta 27/11/2026 09:16:05 UTC. Los checkpoints anteriores de publicación pendiente conservan su fecha; B06.2, cobertura completa y auditoría de pareja siguen después.

**B06.1 maestro · 26/11/2026 · lote parcial comprobado localmente, publicación en preparación:** consulta de seis fichas oficiales en Perfil → Mis tiendas → Ver establecimientos. Cuatro formatos representados, cinco ubicaciones publicadas y una pendiente por CP; ALDI/Mercadona todavía sin fichas comprobadas en este lote. Conserva los seis formatos, siete documentos y menús V1/V2. Tipos, 1.975 unitarias, 24 casos nuevos y 16 regresiones pasan; exports web/iOS/Android correctos. Sin distancias, GPS o precios conectados. [Informe y alcance](docs/MAESTRO/BLOQUE06_1_REGISTRO_ESTABLECIMIENTOS.md). Este bloque geográfico es distinto de la auditoría histórica de precios B06.1; B06.2 y su auditoría de pareja quedan después del cierre actual.

**B05.4 publicada y comprobada · 25/11/2026:** menús de 1–14 comidas para 1–12 personas (propuesta inicial para revisión), planes anteriores conservados y confirmación explícita de propuestas variables y regeneraciones del plan completo. [PR #32](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/32), fuente `97d3168`, CI de fuente correcta. Staging protegida: cuatro idiomas/319 recursos y 24 casos nuevos WebKit correctos; local: 1.853 unitarias, 155 Python y 36 + 24 casos de navegador. Auditoría de pareja completada técnicamente; las 300 decisiones editoriales V3 y aceptación visual/física siguen pendientes. [Informe actual](docs/MAESTRO/BLOQUE05_4_MENUS_VARIABLES.md). Acceso temporal por conversación hasta 26/11/2026 22:27:14 UTC. Main y producción conservados; las anotaciones previas de publicación pendiente son checkpoints históricos.

**B05.4 · 25/11/2026 · comprobado localmente, publicación en preparación:** menús de 1–14 comidas para 1–12 personas como propuesta inicial de prueba. Conserva planes anteriores, 157 recetas, fotos y siete documentos. Pasan 1.853 unitarias, 155 Python y 36 casos nuevos más 24 regresiones. [Informe](docs/MAESTRO/BLOQUE05_4_MENUS_VARIABLES.md) · [auditoría de pareja](docs/MAESTRO/AUDITORIA_PAREJA_B05_3_B05_4_2026-11-25.md). Las 300 decisiones editoriales V3 siguen pendientes. Este registro fechado prevalece para B05.4 sobre los checkpoints anteriores de cinco comidas; GitHub/CI/staging se registrarán al comprobarse.

**Entrega B05.3 · 24/11/2026:** corrección de conservación de la revisión dietética y [paquete para ChatGPT/producto](referencias/revision-culinaria/B05_3/README.md) publicados en [PR #31](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/31). CI correcta y staging protegida verificada en cuatro idiomas/319 recursos, con16 + 8 casos publicados correctos. Las 1.708 unitarias/155 Python/24 casos locales conservan su ejecución del 21/11 y sus hashes. Las 150 categorías y 150 preferencias V3 siguen pendientes: no se activan por inferencia. Main mantiene la integración aprobada del PR #30. [Informe actual](docs/MAESTRO/BLOQUE05_3_SEGURIDAD_Y_REVISION_CULINARIA.md).

**Estado actualizado · 21/11/2026 · PR #30 fusionado en main y CI correcta.** Las 150 recetas y sus fotos están integradas; se conservan las siete anteriores: **157 IDs únicos**. La fusión autorizada es `1504afd8538a3e38a546d41048b45be6d6cac3bf`, con árbol idéntico al de la candidata comprobada. [PR #30](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/30) · [CI de main](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44947600998) · [auditoría de pendientes de los bloques 00–14](docs/MAESTRO/AUDITORIA_PENDIENTES_TRAS_PR30_2026-11-21.md). La aplicación completa aún tiene trabajo pendiente.

El [inventario único](docs/MAESTRO/INVENTARIO_UNICO.md) reúne requisitos y fuentes. La [consolidación V3](docs/MAESTRO/CONSOLIDACION_V3_Y_RECEPCION_SEGURA_2026-11-18.md) distingue autorización, recepción, integración en la app y publicación comprobada.

## Base de trabajo

- Repositorio canónico: [jjcomprainteligente-ops/Jj-compra-inteligente-](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-).
- Base vigente: `main`, integrado por `1504afd8538a3e38a546d41048b45be6d6cac3bf` mediante el [PR #30](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/30), autorizado y fusionado el 21/11/2026 a las 20:41:20 UTC. Candidata `26244016f75e505a7e3b4d47c2a656c87c7a3a29`; fuente de aplicación y staging `80ab9e14185e3f50758339bd787c3f9b50113bc9`. El cierre documental conserva los 407 inputs probados. [Registro de integración](design/recipe-integration150/reports/main-integration.json).
- El propietario autorizó la fusión y se ejecutó el 19/11/2026 a las 12:24:36 UTC: commit `65d95466ed767346d2be99c3d8d6556be326684a`, árbol idéntico a la candidata `761275f71ef70e121979d916327906511665bc14`. La [CI de main](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44523616187) es correcta. Este registro documental conserva ese código integrado.
- La consolidación local conserva 99 de los 101 hashes de entrada de la app. Cambian `package.json` y `package-lock.json` por el parche compatible Expo `~58.0.26`, dentro del SDK 58. Pantallas, IDs, cantidades, almacenamiento, logo y tipografía se conservan.

Antecedente de consolidación del 19/11 · fuente `d0c71a7c2dabac1e5bd2f25e8ad5a70fd829d9dd`, [PR #29](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/29). CI de push y PR correctas; staging protegida verificada en cuatro idiomas, 127 recetas y 19 recursos. Pasan 16 recorridos y ocho controles de Inicio publicados. [Evidencia final](design/v3-intake/reports/verification.json). Los resultados de entregas anteriores mantienen su fuente propia.

## Qué funciona en la app

Expo SDK 58, React Native y TypeScript. Cuatro pestañas: Inicio, Mi compra, Ahorro y Menús; Perfil, notificaciones y tiendas como subpantallas. Las listas, la revisión de ingredientes, el presupuesto, los gastos confirmados, la comparación manual y las preferencias funcionan en modo local. Marcar un producto comprado no crea un gasto por sí solo.

Inicio permite empezar por recetas o por presupuesto. El recorrido conserva cinco comidas para 1–12 personas, revisión antes del guardado y selección temporal de tiendas. Una lista existente conserva su presupuesto. El motor de comidas variables está preparado internamente; su activación visible tiene una entrega separada.

Main y la versión de prueba ofrecen **150 recetas verificadas más siete anteriores: 157 accesibles**. Las 120 recetas V83 existentes mantienen datos, cantidades, metadatos y traducciones; se añaden las treinta que faltaban. Los IDs, referencias de menús, cantidades y siete claves locales conservan sus contratos. La aprobación y la fusión del PR #30 ya se recibieron y ejecutaron; la aceptación visual y física conserva su alcance separado.

La interfaz está en **es/en/de/fr**, con preferencia manual persistente, detección del dispositivo, respaldo al español y compras en euros. BG está conservado en las fuentes de recetas, pendiente de una interfaz completa y comprobada. Las seis modalidades de tienda y sus enlaces oficiales no implican precios actuales, disponibilidad ni transferencia de carrito. Compra y pago permanecen en el comercio externo.

IA, cuentas, hogares y sincronización siguen sin activarse. Las etiquetas comerciales, SKU, trazas y precios oficiales por tienda permanecen pendientes de fuentes reales.

## Recepción V3 y autorización vigente

La fuente V3 contiene **150 IDs y 750 fichas en es/en/de/fr/bg**. El propietario aprobó incorporar las 150 recetas el 17/11. Los estados de reserva anteriores permanecen como trazabilidad histórica; no constituyen un nuevo bloqueo de permiso ni requieren volver a pedir esa aprobación.

La base recibida `69582c2010222769db8cf646b745aea544684e42` ya contenía las fuentes V83 y la entrega V3 completa con sus 150 JPEG individuales; el PR #30 incorpora el catálogo y los derivados a la app en main. La copia original local ignorada y los doce PNG anteriores se conservan. El acceso público a esas fuentes no equivale a activarlas en el cliente ni certifica sus datos comerciales.

La recepción del 20/11 comprobó el perfil `app10mb`: ZIP de **1.994.471 bytes**, SHA-256 `e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270`, y **150 JPEG / 96.304.512 bytes**, con IDs, rutas, tamaños, SHA-256 y blob Git coincidentes. Todas las imágenes pasan contenedor y decodificación completa con Pillow 13.0.0 fijado: **cero faltantes**. Los informes de 12 fotos y 138 pendientes describen la recepción parcial anterior. [Fuente recibida](referencias/recetas/V3/APP_LIGERO_10MB/README_CATALOG_V3.md).

El nuevo motor de [recepción segura](referencias/recetas/V3/README_CODEX.md) unifica cuatro perfiles, corrige la lectura JPEG y admite fotos sueltas con `--photos-dir`. La auditoría parcial `--audit-available` informa `INCOMPLETE_PHOTOS_PENDING`, termina con código 2 y no crea staging. La preparación exige una entrega completa verificada y un destino nuevo. La herramienta no escribe en la app ni en sus datos guardados.

## Verificaciones anteriores · consolidación del 19/11

- TypeScript y **1.549 pruebas unitarias** correctos.
- **110 pruebas Python** correctas, incluidas **59 regresiones nuevas** de recepción segura.
- Consulta npm sin avisos conocidos y comprobación Expo correctas con `~58.0.26`; esto no garantiza ausencia absoluta de vulnerabilidades.
- **24 regresiones locales de menús** correctas. La matriz local de **60 casos de recorridos e Inicio** terminó correctamente, sin fallos, omisiones o intermitencias.
- Exportaciones web, iOS y Android correctas, con tamaños y hashes por artefacto registrados en la [evidencia local](design/v3-intake/reports/local-preparation.json). El JavaScript web conserva el SHA-256 `e94ac54f48b69527c065c362712b5cb03824356565a2046711260508c4a6f592`.
- CI de push 44503332195 y PR 44503457652 correctas. Staging `dpl_9GyW8ij3xX4dgZtw7Q3F1jwH2v1K`, READY/protegida, con HTTPS y recorridos publicados comprobados. Acceso temporal por conversación hasta 20/11/2026 10:13:38 UTC; sin credencial en Git.

## Verificaciones de esta integración · 21/11

Tipos, 1.672 unitarias y 135 Python correctos; reproducción de catálogo y 300 derivados correcta. Local: 64 casos de fotografías —1.200 comprobaciones de miniatura/detalle—, 60 de recorrido/Inicio y 24 de menús anteriores correctos. Los dos intentos iniciales corrigieron exclusivamente un oráculo de traducción y una espera de guardado; se conservan sus evidencias, sin cambios de aplicación ni retirada de controles. Fuente `80ab9e14185e3f50758339bd787c3f9b50113bc9`, [PR #30](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/30), CI push [44893148932](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44893148932) / pull_request [44893221491](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44893221491) correcta. Staging `dpl_4infJZdipQwLz3fGcdx7NFD2esfc`, READY y protegida: cuatro idiomas, 157 recetas y 319 recursos por HTTPS; 24 casos de fotografías, 16 recorridos y ocho controles de Inicio publicados correctos, sin fallos, omisiones o intermitencias. 407 inputs vinculados a la fuente, 29 archivos protegidos y 286 referencias originales conservados; siete recetas anteriores y 120 proyecciones previas idénticas. Los originales permanecen intactos; 300 derivados JPEG suman 21.204.828 bytes. Acceso temporal por conversación hasta **22/11/2026 10:29:01 UTC**, sin token en Git ni informes públicos. [Resultados locales](design/recipe-integration150/reports/local-final.json) · [verificación publicada](design/recipe-integration150/reports/verification.json).

El propietario informó de que la app funciona en su iPhone. Ese reporte no incluye modelo ni casos detallados y se conserva separado de una matriz física completa, una aprobación estética o una distribución nativa firmada.

## Respaldo y depuración de ramas

Se verificó un bundle de **111.641.061 bytes**, SHA-256 `7e551562beadb6fe75f44e33f20c5bb7fbf39cce3f9dcc155544bf4671d550a3`, y su restauración de los 26 extremos de rama, con `git fsck --full --strict` correcto.

La etiqueta GitHub `respaldo/ramas-2026-11-18`, commit `76cc65eb80a92a73053cb4159d08062ca73e3900`, conserva mediante 24 padres distintos los 26 extremos y su registro de nombres/SHA. Es respaldo de referencias Git; los archivos privados ignorados quedan fuera de su alcance.

En la limpieza autorizada del 19/11 se retiraron **20 ramas superadas y una duplicada: 21 en total**, con operación atómica, SHA esperado y respaldo verificado. Se conservaron seis ramas en aquel checkpoint. La rama actual del PR #30 corresponde a esta nueva integración; no se retira automáticamente. Los archivos y fuentes permanecen recuperables. [Registro de aquel cierre](design/v3-intake/reports/main-integration.json).

## Siguiente entrega

La integración de catálogo y fotografías está cerrada técnicamente en main. El [plan de entregas pendientes](docs/MAESTRO/AUDITORIA_PENDIENTES_TRAS_PR30_2026-11-21.md) distingue construcción de Codex, revisión de producto, prueba física y datos externos. La siguiente construcción propuesta es completar B05: revisión dietética/categorías y menús variables visibles con persistencia conservadora. Tiendas por CP/distancia viene después, sin esperar precios oficiales. La aceptación visual y física sigue pendiente; no se reabre el permiso de recetas, fotos o esta fusión. Esta auditoría no implementa otro bloque ni promueve producción.

Las entregas anteriores y sus límites conservan sus informes: [B05.1](docs/MAESTRO/BLOQUE05_DOS_ENTRADAS_Y_PRESUPUESTO.md), [B05.2](docs/MAESTRO/BLOQUE05_2_MOTOR_COMIDAS_VARIABLES.md) y [guía iPhone](docs/IPHONE_PILOTO_RECORRIDO_DIARIO.md).

## Historial documental conservado

El texto previo se conserva íntegro a continuación. Sus cifras, enlaces temporales y expresiones como «estado vigente», «M3 provisional», «originales ausentes» o «publicación pendiente» describen sus fechas originales; no sustituyen este punto de partida ni el inventario maestro. Los nombres B00–B09 del kit antiguo no son la numeración 00–14 del plan maestro del 13/11.

<details>
<summary>ARCHIVO_HISTORICO — README anterior a la consolidación documental del Bloque 01</summary>

> **Entrega vigente · 13/11/2026:** seguridad y accesibilidad publicadas en [PR #19](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/19), origen final `17d5fbc8adf9f8cbd07f7bd930a19a086931a841`. [CI remota correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43451697596); 981 unitarias, exports web/iOS/Android, matriz final de calidad 8/8 y pulsación/foco 9/9; audit npm sin vulnerabilidades conocidas. Preview protegida verificada en cuatro idiomas y 29 recursos/URLs. [Informe](docs/CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md) · [despliegue](design/closeout/reports/deployment.json). Acceso temporal por conversación, hasta 14/11/2026 a las 14:23:22 UTC. Auditoría de tiendas en entrega documental separada.

> **Seguridad y calidad · 13/11/2026:** corrección de los tres avisos moderados anteriores, audit actualizado con **cero vulnerabilidades**, Expo 58.0.25 dentro de SDK 58 y correcciones medidas de contraste/áreas de interacción. Conserva Verde Mercado Premium, logo, siete documentos y 127 recetas. Regresión completa: 298 Chromium y 16 WebKit; auditoría de 296 escenas en es/en/de/fr, 40 estados pulsados y 24 ejecuciones de rendimiento anónimo. La última ampliación del filtro inglés pasó por separado 2/2 casos y 74 escenas sobre el compilado final; exportaciones web/iOS/Android y reproducción limpia con 981 unitarias correctas. [Informe, fuentes y límites](docs/CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md). Publicación de esta entrega y CI remota todavía pendientes; los enlaces V83 siguientes acreditan la versión anterior. B07, prueba física y criterios externos siguen abiertos; no se declaran terminados todos los bloques.

> **V83 publicada y comprobada · 12/11/2026:** 120 recetas nuevas y las siete anteriores disponibles. Código y fuente seleccionada en [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), fuente compilada `0ea49b597f45b401747e20d7d880c07f670b3073`. Preview staging protegida comprobada en es/en/de/fr, con 127 recetas y 29 recursos/URLs por hash. El enlace temporal se entrega fuera de Git y vence el **13/11/2026 a las 15:56:07 UTC**. Las 30 retenidas y la prueba física siguen pendientes. [Entrega y límites](docs/RECETAS_V83_INTEGRACION_Y_AUDITORIA.md).

> **Integración actual · 12/11/2026:** la [entrega V83](docs/RECETAS_V83_INTEGRACION_Y_AUDITORIA.md) incorpora en código 120 recetas nuevas y conserva las siete anteriores: 127 disponibles. Los adjuntos completos contienen 150 recetas/750 fichas en cinco idiomas; 30 siguen retenidas hasta aclarar sus estados. GitHub es público: recibe únicamente la [fuente reproducible de 120 recetas](referencias/recetas-v83/README.md), mientras el original completo queda conservado localmente y excluido de Git. La interfaz sigue en es/en/de/fr y BG permanece en la fuente. Correctos: TypeScript, 981 unitarias, exportaciones web/iOS/Android, 298 casos Chromium y 16 WebKit; GitHub y la nueva preview protegida V83 publicados y comprobados en [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15). La prueba física sigue pendiente.

> **Piloto iPhone anterior · 11/11/2026:** validar **menú → lista → compra → presupuesto/gasto confirmado** sobre la app existente y preparar su prueba en iPhone. [Guía del recorrido diario y distribución](docs/IPHONE_PILOTO_RECORRIDO_DIARIO.md). Los perfiles EAS están preparados, pero no hay binario instalable ni prueba física realizada. Preview staging publicada y verificada desde `54fc7efe3980f4295f3e873aa7710276903c3f7a` en [PR #12](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/12); GitHub sigue siendo la base del código. El enlace temporal de acceso se entrega por la conversación y vence el **12/11/2026 a las 22:56:56 UTC**.

> **Verificación del piloto anterior · commit 54fc7efe:** 963 unitarias, 298 Chromium y ocho recorridos WebKit correctos; Chromium omite 24 capturas duplicadas deliberadas. WebKit cubre cuatro idiomas y dos tamaños CSS, con 80 capturas. [Informe técnico](design/iphone-pilot/reports/technical-verification.json) · [Chromium](design/iphone-pilot/reports/chromium-regression.json) · [WebKit diario](design/iphone-pilot/reports/webkit-daily-journey.json). Verificación remota correcta en los cuatro idiomas y 29 recursos/URLs por hash: [informe remoto](design/iphone-pilot/reports/hosted-verification.json) · [despliegue](design/iphone-pilot/reports/deployment.json). No sustituye la prueba en un iPhone físico.

> **Corrección B07.2 — 11/11/2026:** [permiso de lectura Auth corregido](docs/B07_CORRECCION_PERMISO_AUTH.md), regresión de lectura comprobada y base sin datos de prueba. La batería completa de hogares continúa pendiente del aviso nativo de Supabase.

> **Avance B07 — 11/11/2026:** [contratos y base Supabase aislada](docs/B07_BASE_SEGURA_Y_AUDITORIA.md). B07.1 probado; B07.2 aplicado con matriz dinámica pendiente de confirmación. La app conserva el modo local; cuentas y sincronización no están activadas.

> **Estado vigente — 11/11/2026:** consulta [el inventario actual de construcción y pendientes](docs/ESTADO_ACTUAL_Y_PENDIENTES.md) y [la entrega de tiendas y listas compartibles](docs/TIENDAS_COMPARTIR_Y_AUDITORIA.md). Los apartados fechados anteriores se conservan como historial.

# JJ Compra Inteligente

> **Verificación integral posterior:** la preparación completa de los seis adjuntos sigue pendiente. La app no cubre todas las 16 pantallas ni los nueve estados. Véase [auditoría de completitud](docs/AUDITORIA_COMPLETITUD_V2.md), con requisito, código, brecha y criterio de cierre. Los resultados de pruebas previos se conservan y no acreditan por sí solos la totalidad del encargo.


> **Estado actualizado 06/11/2026:** base visual GPT-6 V2 implementada sobre las pantallas existentes, con logo original y cuatro idiomas. La [entrega y auditoría V01/V02](docs/V2_ENTREGA_V01_V02_Y_AUDITORIA.md) contiene las pruebas y límites. Los originales ya están [recuperados](docs/V2_REFERENCIAS_RECUPERADAS.md). Los estados históricos siguientes se conservan como antecedentes.


Aplicación de compra alimentaria con inteligencia artificial para Tenerife.

## Piloto de tiendas · 10/11/2026

Mis tiendas admite Lidl, ALDI, HiperDino, SuperDino, HiperDino Express y Mercadona, de una en una, varias o todas. Guarda la selección y abre la web oficial de compra, ofertas o establecimientos. No importa precios ni transfiere el carrito. La compra y el pago se completan siempre en la tienda externa. Se preservan las favoritas anteriores y las funciones de recetas, listas y gastos. [Investigación y alcance del piloto](docs/PILOTO_TIENDAS_Y_PRECIOS_2026-11-10.md).

## Código fuente recuperado — 31/10/2026

GitHub es la base principal del código y la documentación. Vercel se utiliza para previews de prueba; cada nueva entrega debe identificar el commit que contiene y verificarse antes de compartirse.

El código editable se ha localizado en el proyecto Expo original. La nota técnica anterior se conserva como antecedente en [Estado técnico](docs/ESTADO_TECNICO_2026-10-31.md). Esta importación conserva los tres commits anteriores y el texto inicial de este README.

**Estado visual:** la app conserva todavía Verde Mercado con M3 provisional. No representa las pantallas canónicas GPT-6 V2. La conciliación visual sigue abierta y requiere los originales V2 y el logo oficial, actualmente no disponibles en el entorno. No confundir las antiguas propuestas B01 «V2 Verde Noche» con GPT-6 V2.

No existe una conexión de IA activa; las búsquedas con ChatGPT se hacen fuera de la aplicación.

## Guía de la aplicación existente

Aplicación móvil en español, inglés, alemán y francés para organizar listas de compra y presupuestos locales. B03/B04 integran las cinco pantallas de Verde Mercado, con M3 provisional y el comparador manual anterior conservado. B05 añade menús locales, recetas ajustables y revisión de ingredientes antes de guardarlos. No hay cuentas, backend ni fuentes comerciales conectadas.

## Idiomas — requisito transversal

La bienvenida detecta el idioma preferido compatible del dispositivo y permite elegir Español, English, Deutsch o Français. Puedes cambiarlo en Perfil → Idioma o volver al idioma del dispositivo. Una elección manual guardada tiene prioridad. Las traducciones ausentes recurren al español; los importes siguen en euros y se adaptan los formatos de números y fechas.

La preferencia usa una clave independiente. Los datos existentes, identificadores y cantidades no se reescriben al cambiar idioma. Las recetas, formularios, errores y etiquetas accesibles tienen recursos centralizados. La preparación del idioma de un futuro asistente es local y no realiza llamadas de IA.

[Contrato y plan](docs/I18N_CONTRATO_Y_PLAN.md) · [Entrega y auditoría](docs/I18N_ENTREGA_Y_AUDITORIA.md) · [Prueba guiada en iPhone y web](docs/I18N_PRUEBA_GUIADA.md).

## Listas y presupuesto — B03/B04

Desde Inicio crea una lista; en Mi compra añade, edita y marca productos con cantidades, unidades, categorías, notas y precios opcionales. Puedes mantener varias listas y cambiar su nombre. Los borrados requieren confirmación; el último borrado o marcado puede deshacerse antes de otra modificación guardada.

El presupuesto es tu límite. La previsión suma precios introducidos y estimaciones, mientras que el gasto registrado solo incluye productos marcados con precio introducido. Los productos sin precio se muestran como pendientes de información. Los datos solo cambian en pantalla después de guardarse correctamente; los errores de lectura no borran el almacenamiento.

La entrada es `index.ts` → `src/app/ShoppingApp.tsx`. Los componentes, pantallas, reglas de dominio y almacenamiento tienen responsabilidades separadas. El comparador conserva `App.tsx` y su clave local; se abre desde Ahorro → Abrir comparador manual o, en web, `/?view=comparisons`.

[Entrega y límites de validación](docs/B03_B04_ENTREGA.md). Las propuestas B01 y B02 permanecen en `design/`; no forman parte de la entrada de producción. El archivo previo a B03/B04 se conserva en `archives/B00-B02-source-before-B03-B04.zip`.

## Menús y recetas — B05

En Menús puedes preparar cinco cenas para 1–12 personas, cambiar platos y abrir los pasos e ingredientes de cada receta. El plan queda guardado en este dispositivo. Antes de añadir ingredientes, «Esto he entendido» permite editar cantidades y unidades, quitar productos y resolver los que ya existen. La confirmación guarda todo el grupo; puedes deshacerlo. Los ingredientes entran sin precio y el presupuesto anterior se conserva.

También puedes traer texto de ChatGPT, un ingrediente por línea (`500 g arroz`, `2 L leche`, `3 huevos`). El parser usa reglas locales y pide corregir las líneas ambiguas; no consulta una IA, no guarda el texto como historial y no necesita una clave. Las búsquedas se hacen fuera de la app.

[Entrega B05](docs/B05_ENTREGA.md) · [Prueba guiada en iPhone](docs/B05_PRUEBA_GUIADA.md) · [Capturas B05](design/b05/review.html).

## Comparador piloto — B06

Desde Ahorro abre «Comparar formatos y fuentes». Registra producto, marca, formato, calidad/variante, tienda, contenido total, precio del envase, fecha y procedencia. Las aportaciones recientes se comparan por kg, L o unidad únicamente si los productos y sus dimensiones son equivalentes. Las antiguas, demostraciones, orígenes sin verificar y precios pendientes quedan fuera, con su motivo visible.

No hay fuentes verificadas conectadas ni precios en tiempo real. El piloto admite aportaciones manuales, sin convertirlas en precios actuales verificados. El comparador anterior permanece disponible con sus datos y su cálculo de precio más envío. Las observaciones nuevas no modifican tus compras o menús.

[Entrega B06](docs/B06_ENTREGA.md) · [Capturas B06](design/b06/review.html).

## Ejecutar en Android e iPhone

Necesitas Node.js 24 LTS y npm. El proyecto mantiene Expo SDK 58. Para iPhone, la versión pública de Expo Go de la App Store descrita en la documentación consultada sigue en SDK 54: no se debe asumir compatibilidad al escanear el QR. La [guía de prueba iPhone](docs/IPHONE_PILOTO_RECORRIDO_DIARIO.md) distingue Safari, un cliente compatible y los perfiles de compilación nativa preparados, con sus requisitos pendientes.

```sh
cd jjcompraintelwgiemt
npm ci
npm start
```

Mantén el ordenador y el teléfono en la misma red si usas el servidor de desarrollo y sigue las instrucciones de Expo con un cliente que admita este SDK. Para probar ahora en iPhone, usar el enlace temporal verificado de la preview HTTPS de Safari entregado por la conversación; sus datos locales son independientes de otras versiones.

Con un emulador Android configurado puedes usar `npm run android`. Para un simulador iOS utiliza `npm run ios`; SDK 58 requiere macOS y Xcode 26.4 o posterior, e iOS 16.4 o posterior. El entorno actual es Linux. `eas.json` contiene los perfiles `iphone-preview` y `iphone-testflight`, sin build ni envío iniciados. La ejecución física y en simuladores nativos permanece pendiente.

## Vista previa en el navegador

```sh
npm run web
```

La vista web permite probar los flujos en un navegador. Sus datos locales son independientes de los del teléfono y de otros navegadores o perfiles. Esta vista previa no sustituye la comprobación en Android e iOS.

## Uso del comparador anterior

1. Crea una comparación con el nombre del producto.
2. Añade las ofertas que quieras contrastar. Usa un enlace `https://` o `http://` y comprueba que corresponden al mismo producto.
3. Escribe el precio y los gastos de envío. El envío comienza en **0 €** y puedes editarlo. Se aceptan coma o punto decimal, hasta dos decimales e importes positivos o cero.
4. Consulta el total de producto más envío y abre la oferta para visitar la tienda.
5. Edita las ofertas o el nombre de la comparación cuando cambien. Las eliminaciones requieren confirmación.

Los precios se introducen manualmente: no se importan desde los enlaces ni se consultan o actualizan en las tiendas. El comparador contrasta un producto entre tiendas. Los presupuestos de Mi compra son independientes de esas comparaciones. No incluye cuentas, sincronización ni pagos.

## Fase 1 y búsquedas con ChatGPT

La fase 1 original contiene la estructura inicial y el comparador manual, conservados en esta entrega. Las búsquedas se hacen con ChatGPT, fuera de la aplicación. Después se copian a cada oferta la tienda, el enlace del producto, el precio y el envío. Comprueba esos importes en la tienda antes de guardarlos. Esta fase no necesita una clave de API ni integra un buscador.

La estructura separa la interfaz (`App.tsx`, `src/screens.tsx` y `src/components/`), las reglas de comparación (`src/domain/`), el guardado (`src/storage/`) y las pruebas (`tests/`). Así se puede ampliar la app sin mezclar los cálculos con las pantallas.

## Guardado local

Las listas, presupuestos y comparaciones se guardan en el dispositivo mediante AsyncStorage, en claves independientes. Desinstalar la aplicación o borrar sus datos puede eliminarlas. En la vista web, borrar los datos del navegador también elimina las comparaciones guardadas. No existe copia en un servidor.

Los cambios se muestran como guardados después de que finalice la escritura. Si falla la carga o el guardado, se muestra un error para volver a intentarlo. Los datos que no se puedan leer no se reemplazan automáticamente.

## Comprobaciones del proyecto

```sh
npm run check
```

Este comando ejecuta TypeScript y las pruebas de Vitest. También puedes ejecutar `npm run typecheck`, `npm test` o `npm run test:watch` por separado. La cifra histórica de 496 pruebas cubría importes exactos, cantidades, presupuestos, duplicados, validación, traducciones, preferencias y almacenamiento local, incluidos datos corruptos, conflictos entre instancias y fallos de lectura, reserva o confirmación de escritura.

Para la validación manual, comprueba en Android e iOS: crear una comparación, añadir dos ofertas con diferentes gastos de envío, empatar sus totales, editar y eliminar con confirmación, abrir un enlace y cerrar/abrir la aplicación para verificar la persistencia. Revisa también el teclado decimal y los formularios con el teclado visible.

Se incluyen pruebas de los recorridos web en tamaños de ordenador y móvil:

```sh
npx playwright install chromium
npm run test:web
```

El comando inicia Expo si no hay un servidor en el puerto 8081. La auditoría actual ejecutó 124 recorridos correctos de escritorio/móvil, incluidos los anteriores, los cuatro idiomas y la concurrencia. Doce casos de captura duplicados en el segundo proyecto se omiten deliberadamente; las 120 capturas completas se producen una vez. Las pruebas en teléfonos físicos siguen pendientes. La generación de paquetes JavaScript no equivale a una compilación instalable ni a una prueba en un dispositivo.


Para reproducir la evidencia sobre la aplicación exportada:

```sh
npm run build:i18n
npm run verify:i18n
```

Necesitas Chromium instalado por Playwright (`npx playwright install chromium`) o indicar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. El script sirve `dist-i18n/` en localhost:8081 y genera una carpeta fechada nueva en `design/i18n/evidence/`, conservando las entregas anteriores. El puerto debe estar libre. Los datos ficticios se introducen solo en contextos de prueba; la app inicia vacía. Los antiguos scripts de captura B05/B06 se conservan como antecedentes y no deben utilizarse para sobrescribir sus pruebas.

La web protege las escrituras con Web Locks y huellas transaccionales en IndexedDB; requiere HTTPS o localhost y un navegador con durabilidad estricta disponible. No se reemplazan los cuatro almacenes existentes. Una reserva pendiente o un resultado incierto bloquea nuevas escrituras para proteger los datos. Una IP de la red local por HTTP puede carecer de estas capacidades. El acceso nativo de Expo utiliza su cola local, sin IndexedDB.

La auditoría histórica multilingüe registró 13 paquetes afectados en herramientas de Expo (2 altos, 9 moderados, 2 bajos, 0 críticos). No hay parches compatibles en los rangos consultados; no forzar cambios de versión mayores ni una rebaja a Expo 51. Los detalles de aquella revisión están en [la auditoría multilingüe](docs/I18N_ENTREGA_Y_AUDITORIA.md). La comprobación del 11/11/2026 para el piloto iPhone registra 963 pruebas unitarias correctas y tres avisos moderados, cero altos y cero críticos; véase [el estado de esta entrega](docs/IPHONE_PILOTO_RECORRIDO_DIARIO.md).


## GitHub y estado visual

El código importado y su reproducción desde un clon nuevo están documentados en [Entrega G00 y auditoría](docs/github/G00_ENTREGA_Y_AUDITORIA.md). GitHub es la base principal; las previews Vercel identifican su commit de origen.

La [conciliación GPT-6 V2](docs/V2_CONCILIACION_VISUAL_2026-10-31.md) registra las diferencias actuales y la recuperación pendiente de los originales. La vista actual continúa con M3 provisional y el diseño anterior.

</details>
