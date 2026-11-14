# JJ Compra Inteligente

**Estado actualizado · 14/11/2026 · Bloque 03 maestro: registro de 150 recetas preparado; conciliación editorial en curso.** Se consolida la aplicación existente; se conserva su código, historial, datos locales y dirección Verde Mercado Premium / GPT-6 V2.

El [inventario único](docs/MAESTRO/INVENTARIO_UNICO.md) reúne requisitos, originales, código, pantallas, pruebas, bloqueos y próximas acciones. La [política de integración y recuperación](docs/MAESTRO/POLITICA_INTEGRACION_Y_RECUPERACION.md) define las condiciones de respaldo, revisión y publicación. Esos registros distinguen comprobación documental, automatización, prueba física y aprobación del propietario.

## Punto de partida comprobado

- Repositorio canónico: [jjcomprainteligente-ops/Jj-compra-inteligente-](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-).
- Base auditada: `abb3bca53953e4523af61118e375df90d1a8d416`, PR #20; 28 commits por delante de `main` en la auditoría del 13/11. `main` seguía en `d22d66eff03c5d107f5170ee38cd2bc3167865e2`.
- Origen de la candidata de integración comprobada: `78480fd40b4a116d53ebb016f31085785f42a6e6`, [PR #21](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/21). Sus 159 entradas de aplicación, dependencias, recursos, scripts y pruebas coinciden con ABB. El JavaScript conserva exactamente el hash de la versión previa; no se rehízo el producto.
- La rama `codex/integracion-maestra-2026-11-13` y la referencia `codex/respaldo-base-2026-11-13` se crearon desde esa base, sin rehacer el producto ni fusionar a producción. Su cierre requiere resultados nuevos sobre el árbol final; esta actualización documental no los sustituye.

## Qué contiene la app existente

Expo SDK 58, React Native y TypeScript. Cuatro pestañas: Inicio, Mi compra, Ahorro y Menús; Perfil, notificaciones y tiendas son subpantallas. Las listas, revisión de ingredientes, cantidades, presupuesto, gastos confirmados, comparación manual y preferencias funcionan en modo local. El gasto procede de registros explícitos de gastos; marcar un producto comprado no crea un gasto por sí solo.

El catálogo contiene **120 recetas V83 y siete anteriores: 127 accesibles**. La fuente privada reúne 150 IDs y 750 fichas en es/en/de/fr/bg. Las posiciones 11–20, 31–40 y 111–120 siguen retenidas por controles pendientes o contradictorios. No se cambia ningún ID ni se infieren aprobaciones.

La interfaz está en **es/en/de/fr**, con detección del dispositivo, elección manual persistente, respaldo al español y compras en euros. BG está en las fuentes V83, todavía no en la interfaz completa. Las fotografías definitivas de recetas no están vinculadas; sus originales V38–V83 no se han localizado en los materiales accesibles.

Mis tiendas conserva Lidl, ALDI, HiperDino, SuperDino, HiperDino Express y Mercadona. La selección y los enlaces oficiales no implican importación de precios ni transferencia de carrito. La [auditoría B06.1](docs/auditorias/b06-1-2026-11-13/B06_1_AUDITORIA_FUENTES_2026-11-13.md) no habilitó PVP local actual. Las dos entradas propuestas por recetas/presupuesto están en el PR #11 y no se consideran integradas.

IA, cuentas, hogares y sincronización no están activados. B07 conserva contratos y migraciones, pero la matriz dinámica de permisos sigue sin resultado nativo. El modo sin cuenta permanece como base de trabajo.

## Conservación y respaldo

Los siete documentos locales y sus protecciones de escritura se conservan. Borrar los datos del navegador/dispositivo puede eliminarlos; la exportación local no equivale a sincronización ni a restauración automática.

El ZIP privado completo de 150 recetas está localizado e ignorado por Git. **El propietario confirmó el 14/11 que guardó una copia en la carpeta del proyecto.** Su destino, independencia e integridad remota no han sido inspeccionados por el agente; la copia y restauración locales sí están verificadas. El [registro del respaldo](docs/MAESTRO/RESPALDO_ESTADO_PUBLICO.json) conserva esta distinción. El ZIP público de 120 recetas no respalda las 30 retenidas. La comprobación independiente de 01.1 permanece abierta antes de modificar la app. El repositorio público y las previews no reciben el ZIP privado ni contenidos retenidos.

## Comprobaciones reales del Bloque 01

- **Baseline limpio ABB:** instalación sin scripts desde el lockfile, reproducción de las 120 recetas públicas, tipos, **981/981 unitarias**, audit sin vulnerabilidades conocidas, compatibilidad Expo y exportaciones web/iOS/Android. [Informe y procedencia](design/master-integration/reports/baseline-existing-app.json).
- **Origen `78480fd40b4a116d53ebb016f31085785f42a6e6`:** [CI real correcta](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43514500031), **298 Chromium correctos y 24 omisiones deliberadas**, **16/16 WebKit**, sin fallos ni intermitencias. Se verificaron nuevamente 159/159 huellas de inputs antes y después. [Chromium](design/master-integration/reports/chromium-regression.json) · [WebKit](design/master-integration/reports/webkit-regression.json).
- **Staging candidata:** `dpl_G3PZ39MHNk7a2ipCuLZBTRymtuWg`, READY/protegida. HTTPS revalidado el 14/11 en cuatro idiomas, catálogo de 127 y 29 recursos/URLs por hash. [Registro de versión](design/master-integration/reports/integration-verification.json) · [despliegue](design/master-integration/reports/deployment.json). Enlace temporal fuera de Git, hasta **14/11/2026 21:10:36 UTC**.
- **Diferencia con producción:** capturas iniciales de lectura a 375/430 muestran la versión antigua en el dominio principal y la bienvenida actual en staging; son estados de entrada distintos, no comparación píxel a píxel ni evidencia de pérdida de listas. Producción no se ha promovido. [Comparación](design/master-integration/reports/production-comparison.json).

Las pruebas de navegador corresponden a ese origen; el cierre posterior solo añade documentación/evidencia y no representa otra ejecución. Las suites anteriores conservan sus propios SHA. WebKit Linux no sustituye la prueba física de iPhone, ni un export iOS es un binario firmado. La aprobación estética sigue pendiente.

La base y sus comprobaciones están preparadas para revisión. **Bloque 01 conserva abierta la verificación independiente de 01.1; Bloque 02 avanza como QA de la app intacta por la orden posterior del propietario.** No se añaden funciones ni se modifica la aplicación para superar esa dependencia. La [guía Safari de Bloque 02](docs/MAESTRO/BLOQUE02_PRUEBA_SAFARI_IPHONE.md) sigue el recorrido de una receta antes de crear la lista. La aceptación en iPhone físico continúa pendiente.

Para reproducir las comprobaciones del proyecto, usa Node.js 24 y el lockfile del árbol revisado:

```sh
npm ci --ignore-scripts
npm run typecheck
npm test -- --maxWorkers=2
npm run build:web
```

La prueba web completa y la multilingüe tienen sus instrucciones en [la guía iPhone](docs/IPHONE_PILOTO_RECORRIDO_DIARIO.md) y [la entrega i18n](docs/I18N_ENTREGA_Y_AUDITORIA.md). Ejecutar esos comandos no acredita por sí solo el cierre de todo el plan.

## Entrega comprobada del Bloque 02

[PR #22](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/22), fuente `61793e4833c702a6294eedde1f778cd80dfc074f`: el recorrido empieza eligiendo una receta, sin lista ni plan semanal previos. **36/36 casos locales y 36/36 en staging real**, cuatro idiomas, escritorio Chromium y WebKit 375/430; cero fallos/omisiones/intermitencias. TypeScript, 981 unitarias, importación pública y npm0 correctos; CI remota de la fuente correcta. Aplicación y 159 inputs anteriores intactos.

La nueva candidata `dpl_DizPGJTNWdRhNnRQxXtToDKwdxEZ` está READY y protegida; 127 recetas y 29 recursos/URLs verificados. Acceso temporal por conversación hasta **15/11/2026 10:52:36 UTC**. Conserva el bundle C3f y el logo oficial; producción sigue igual. [Informe y límites](docs/MAESTRO/BLOQUE02_ENTREGA_Y_AUDITORIA.md) · [guía Safari](docs/MAESTRO/BLOQUE02_PRUEBA_SAFARI_IPHONE.md). **Requiere prueba física y aceptación del propietario.** No se declara cerrado todo el plan ni el subbloque de independencia de respaldo 01.1.

## Registro maestro de recetas · Bloque 03

Registro completo de **150 IDs/750 fichas** y revisión por lotes en privado, conservando originales y la app de 127 recetas. Herramienta de auditoría con destino exclusivo 0700/0600, comprobación sin escritura y pruebas de conservación de planes. TypeScript y 987/987 unitarias correctos.

El [índice público](referencias/recetas-v83/catalogo-maestro/INDICE_PUBLICO_150.json) usa solo el ZIP público autorizado: 120 seleccionadas y las 30 identidades reservadas con los cuatro campos ya existentes en su procedencia. La nueva propuesta y los estados detallados de retenidas permanecen privados después del rechazo automático a su publicación. [Informe técnico y alcance](docs/MAESTRO/BLOQUE03_CATALOGO_Y_CONCILIACION.md). [PR #23](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/23), fuente `e544ec2f9fd332e6ad9ac74b60b2b2885f616419`: CI y regresión nuevas correctas (298 Chromium/24 omisiones deliberadas, 16 WebKit y 36 receta primero). Staging protegida comprobada en cuatro idiomas y 29 recursos; acceso temporal por conversación hasta 15/11/2026 15:04:16 UTC. Las previews anteriores conservan su origen propio.

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
