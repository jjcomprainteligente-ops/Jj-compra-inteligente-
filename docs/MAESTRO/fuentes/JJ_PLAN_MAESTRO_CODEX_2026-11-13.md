# JJ COMPRA INTELIGENTE | PLAN MAESTRO DE EJECUCIÓN PARA CODEX

**Versión:** 1.0  
**Fecha de referencia:** 13 de noviembre de 2026  
**Mercado inicial:** Tenerife, Islas Canarias, España  
**Repositorio canónico:** https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-  
**Stack existente:** Expo / React Native / TypeScript, Vercel para web de pruebas, Supabase gratuito ya creado para backend futuro.  
**Principio central:** recuperar y consolidar antes de reconstruir. Una sola línea de integración y evidencias verificables.  
**Responsabilidad:** Codex ejecuta y prueba código. El propietario decide aceptaciones de producto, contenidos, publicación y costes. ChatGPT puede ayudar con especificación y revisión.  

> **NO interpretar los estados descritos en este plan como pruebas recién ejecutadas.** Son un inventario inicial basado en el código y en la documentación consultados el 13/11/2026. Revalidar ramas, PR, despliegues, tablas, archivos, permisos y pruebas antes de actuar.

## A. Diagnóstico de partida. No comenzar de cero

1. El repositorio `main` contiene la base importada el 31/10/2026. La rama `codex/cierre-seguridad-y-calidad` contenía 27 commits adicionales respecto a `main` en la inspección del 13/11. **No usar `main` sin comprobar si ya se actualizó.**
2. PR **#12**: recorrido iPhone preparado, pero no validado físicamente. PR **#15**: V83, 120 recetas nuevas + 7 heredadas. PR **#19**: seguridad y calidad. PR **#20**: auditoría B06.1 de fuentes, solo documentación. Cadena técnica aproximada `#12 → #15 → #19 → #20`, con bases/SHAs que se deben inspeccionar. Todos aparecían abiertos y en borrador, NO fusionados; revalidar.
3. PR **#11** en rama paralela `codex/v2-cobertura-local`: propuesta «empezar por recetas o por presupuesto», cinco comidas y comparación interna. No asumir que está integrado ni verificado. PR **#16**, en otra rama, documenta contratos de precios y contactos de supermercados. Consultar también issues **#13, #14, #17 y #18** y PR de tiendas previos. No mezclar ciegamente.
4. Última preview de pruebas inspeccionada: Vercel staging `dpl_ETU2D6tyLxV89TXVQHB2BNwXQUvz`, origen `17d5fbc8adf9f8cbd07f7bd930a19a086931a841`, estado `READY`, protección SSO conservada. `READY` no acredita aceptación funcional humana. La dirección principal `jj-compra-inteligente.vercel.app` señalaba una producción antigua. No promover sin autorización.
5. Recetas: fuente histórica V83 de **150 IDs diferentes y 750 fichas** (ES/EN/DE/FR/BG). La app reciente compila **120 de esas 150 + 7 heredadas = 127 visibles**. Las posiciones 11–20, 31–40 y 111–120 (30 en total) están retenidas por estados de aprobación contradictorios o pendientes; **no están declaradas borradas**. Los originales privados completos no están garantizados en GitHub público ni en nuevos entornos de Codex.
6. Fotos: el modelo `src/domain/menus.ts`, el catálogo `src/data/recipes.ts` y la pantalla `src/app/screens/MenuWorkspace.tsx` examinados no tienen integración de fotografías por receta. Históricamente se trabajó intensamente de V38 a V83. No volver a generar sin recuperar primero originales, vínculos, controles y hashes.
7. Idiomas: interfaz ES/EN/DE/FR; BG consta en las fuentes V83, pero no en toda la interfaz. No anunciar cinco idiomas completos antes de verificar todas las pantallas, formularios, errores, avisos y accesibilidad.
8. Tiendas: Lidl, ALDI, HiperDino, SuperDino, HiperDino Express y Mercadona; se pueden seleccionar varias. Sin feed de precios actual, sin carrito transferido, sin pagos en JJ y sin geolocalización de precio por sucursal demostrada.
9. B06.1 del PR #20 halló que tuTándem publica medianas nacionales sin tienda/GTIN y que Open Prices solo tenía 27 observaciones históricas en siete lugares de Tenerife, con **cero observaciones recientes en la semana 7–13/11**. Ambas fuentes quedaron `needs_review` y desactivadas como PVP local actual. La lectura del CSV tuTándem desde web Vercel tiene además un problema CORS documentado. **No convertir estos datos en rankings por zona.**
10. Supabase: proyecto `fuarodipasfomhhrcsov` en Frankfurt, plan gratis; 14 tablas con RLS y cero filas al inspeccionar. Los contratos B07 y migraciones existen, pero la matriz dinámica SQL/RLS no consta como superada. No hay cuentas/hogares/sincronización activados. No tocar seguridad sin completar la prueba y control nativo.
11. Últimos informes mencionan 981 pruebas unitarias, 298 Chromium, 16 WebKit, y auditoría de dependencias con cero vulnerabilidades conocidas en la entrega de 13/11. Es evidencia histórica por SHA; volver a ejecutarla sobre el árbol final. Ningún export iOS equivale a binario firmado, TestFlight o prueba física.
12. Referencia visual aprobada: **Verde Mercado Premium / GPT-6 V2**; logo oficial original exacto, 4 pestañas `Inicio / Mi compra / Ahorro / Menús`, perfil por avatar, notificaciones y tiendas como subpantallas. Kit de referencia 16 vistas y 9 estados; el diseño está en desarrollo y su aprobación estética final no está implícita.

## B. Reglas permanentes e innegociables para Codex

**R01. Una tarea a la vez.** Ejecutar bloque numerado en orden. Dentro de cada bloque, realizar subtareas correlativas. No abrir un frente de código paralelo por interés técnico. Contactos comerciales pueden prepararse documentalmente en paralelo, sin alterar la ruta de integración ni enviar nada.

**R02. No destruir trabajo.** Antes de tocar archivos, identificar rama, SHA, PR, archivos modificados, dependencias, cachés de datos y backups. Prohibidos `push --force`, resets destructivos, migraciones de datos no respaldadas, reemplazar fotos originales y cambiar IDs existentes sin migración probada. No borrar ramas o PR antiguos por parecer obsoletos.

**R03. Una fuente de verdad, sin inventar.** Consultar `AGENTS.md`, README, `docs/PLAN_Y_ESTADOS.md`, `docs/DECISIONES_Y_RIESGOS.md`, `docs/PRODUCTO_Y_ALCANCE.md`, `docs/DIRECCION_VISUAL.md`, `docs/PANTALLAS_Y_FLUJOS.md`, `docs/CHECKLIST_CALIDAD.md`, y los informes de V83, B06 y B07. Señalar explícitamente las contradicciones; prevalecen decisiones confirmadas y archivos originales sobre resúmenes desactualizados. El presente plan NO sustituye por sí solo instrucciones de seguridad ya aprobadas.

**R04. Estados rigurosos.** Para cada requisito: `NO_LOCALIZADO / PENDIENTE / BLOQUEADO / EN_CURSO / IMPLEMENTADO_SIN_PROBAR / PROBADO_AUTOMATICAMENTE / VALIDADO_EN_DISPOSITIVO / APROBADO_PROPIETARIO`. No usar «terminado» sin criterios de aceptación. Una captura de maqueta no es función. Un resultado `READY` no equivale a login, compra o iPhone real. Una prueba web no equivale a prueba nativa.

**R05. Comunicación obligatoria.** Al comenzar cada bloque: qué se ha encontrado, qué se va a cambiar, rama y riesgos. Tras cada subtarea importante: breve avance con resultado real. Al cerrar: cambio real, rutas y SHA, pruebas con recuento/errores, preview verificada, diferencia visual, riesgos y siguiente paso. Comunicación en **español comprensible**, no únicamente logs. No prometer trabajo en segundo plano fuera de una sesión de Codex activa.

**R06. Una entrega revisable.** Preferencia: un PR pequeño por bloque (o subbloque cuando el tamaño lo exija), sobre la **rama de integración revisada**. Antes de desplegar staging, subir el código verificado a GitHub e identificar su SHA exacto. Conservar protección y versiones anteriores. La autorización permanente del propietario cubre previews staging verificadas; **no autoriza producción, publicación App Store, cambios de facturación, correos comerciales ni fusiones irreversibles**.

**R07. Costes controlados.** Continuar en niveles gratuitos salvo autorización específica y por escrito. Ninguna suscripción, build de pago, servicio de IA de pago, plan de base de datos o dominio adquirido automáticamente. Documentar el coste estimado y alternativas gratuitas antes de habilitar cualquier gasto.

**R08. Verdad de precios.** Nunca mostrar un precio ficticio como actual, estimaciones como gasto ni ahorro como diferencia entre presupuestos. Siempre distinguir fuente, vigencia, tienda/formato, localización, cantidad, oferta condicionada y cobertura. No scraping no autorizado, API privada ni extracción masiva de retailer sin permiso. Compra y pago exclusivamente externos.

**R09. Privacidad y seguridad.** No subir ZIP privado V83 ni ficheros sensibles a GitHub público o preview. No copiar notas/precios/listas de usuarios a logs, capturas públicas o servicios terceros. Nunca exponer claves `service_role`, secretos de IA o credenciales en cliente. Preservar las siete claves/documentos locales y su protección; las migraciones serán reversibles o recuperables.

**R10. Fotos definitivas, contenido exacto.** Una foto original por receta si está aprobada, no mosaicos, no imágenes genéricas para completar el contador. Resolución mínima objetivo: 1536 px de ancho, confirmar plato/ingredientes y derechos/procedencia. No alterar la receta para encajar una foto equivocada, ni crear otra foto cuando el original ya exista.

**R11. Conservación culinaria.** Cada lote de diez: mismos IDs, raciones, pasos, cantidades, unidades y tiempos; revisión editorial y lingüística interna en ES/EN/DE/FR/BG; alérgenos por ingredientes y precauciones específicas por receta, avisos sobre trazas/ingredientes comerciales; cata solo aprobada si el propietario la confirmó; marca/SKU/etiqueta real/IGIC y precios por tienda quedan pendientes hasta comprobar fuentes y productos reales. La cata no es certificación sanitaria ni lingüística externa. Mantener original + ZIP + control + SHA-256.

**R12. No expansión oculta.** No rediseñar logo, crear 3D, ampliar recetas por inspiración, construir cuentas, cambiar proveedores o activar IA mientras se completa un bloque distinto. Las sugerencias van al backlog con prioridad, coste, riesgo y dependencia.

**R13. Avanzar con honestidad.** Un bloqueo externo no inmoviliza todo el proyecto: cerrar el componente verificable, documentar el bloqueo y pasar al siguiente trabajo independiente **solo cuando el propietario autorice el cambio de bloque conforme a `AGENTS.md`**. Nunca declarar éxitos ficticios para continuar.

## C. Línea única de ejecución. Orden de mayor a menor urgencia

### P0. BLOQUE 00 | Recuperación, inventario y copia segura. Solo lectura primero
**Objetivo:** saber exactamente qué existe antes de modificar una línea.

**Tareas**
- Registrar rama HEAD, SHA, historial, diferencias con `main`, PR y issues abiertos, qué despliegue corresponde a cada SHA, estado real de CI, scripts y activos. Detectar PR apilados y paralelos, especialmente #11, #12, #15, #16, #19, #20.
- Leer `AGENTS.md` y documentación canónica. Construir `docs/MAESTRO/INVENTARIO_UNICO.md`: requisito → conversación/decisión → fuente original → código → test → pantalla → estado → bloqueo → próxima acción. Registrar contradicciones con referencia exacta, no borrarlas.
- Inventariar V38–V83, sus controles, ZIP, SHA-256, catálogos, imágenes, XLSX y 150 originales. Marcar `LOCALIZADO_VERIFICADO / REFERENCIADO_NO_ACCESIBLE / AUSENTE / DUPLICADO / PROVISIONAL`. No asumir que archivos ignorados por Git existen en nuevas sesiones.
- Inventariar las copias que ya existen y proponer un respaldo seguro con hashes SHA-256, tamaños, mapa de IDs y, cuando haya almacenamiento disponible, varias ubicaciones independientes. Este bloque es de **solo lectura**: no copiar, mover ni publicar todavía. Si un ZIP privado solo existe en una máquina, **no anunciarlo como respaldado**. No exponer contenidos retenidos en repo público.
- Preparar matriz de 16 vistas, 9 estados, 7 documentos locales, 5 idiomas, 6 tiendas, flujos de usuario y pruebas móviles. Crear backlog sin duplicados.
- Detectar fotos definitivas existentes y su estado por ID, sin regenerar.

**Entrega:** inventario único, manifiesto de archivos y hashes disponibles, gráfico de ramas/PR, bloqueadores y propuesta de base de integración. **Gate:** no comenzar el Bloque 01 si falta determinar el punto de partida; reportar bloqueos concretos. No cambiar app, BD ni producción en el paso de auditoría.

### P0. BLOQUE 01 | Consolidación GitHub, CI y una preview fiable
**Dependencia:** Bloque 00.

**Objetivo:** tener UNA versión de trabajo reproducible, manteniendo los históricos.

**Tareas**
- Antes de modificar código, materializar y verificar los respaldos aprobados en el Bloque 00, con sus SHA y en un almacenamiento privado adecuado; si algún original es inaccesible, dejarlo marcado sin afirmar protección.
- Revisar cambios y bases reales de #12, #15, #19, #20, #11 y #16, conflictos, tests, assets y dependencias. La cadena apilada se integra de forma ordenada en una rama de integración, nunca con merge a ciegas; un PR documental no sustituye código probado. El PR #11 requiere auditoría estática de CORS/precios y no debe activar fuentes bloqueadas.
- Seleccionar una rama de integración estable sobre el SHA más reciente revisado, con copia/tag o referencia de recuperación del origen anterior. Conservar `main` hasta aceptación y merge explícito autorizado. No usar `push --force`.
- Reproducir instalación limpia, TypeScript, 981 unitarias como línea de referencia (o explicar nueva cifra), tests web Chromium/WebKit, `expo` export web/iOS/Android, auditoría npm, i18n y pruebas de preservación de almacenamiento. No atribuir tests de un SHA a otro.
- Publicar **staging protegida** con SHA exacto y verificar HTTP, recursos, idioma, menú, precio sin fuente, navegación y botones básicos. Confirmar que producción no ha sido promovida.
- Crear una «página estado» de prueba con versión/commit/fecha accesible solo cuando sea apropiado; no publicar secretos ni datos privados. Identificar vínculo entre commit, bundle y Vercel.
- Registrar política de merges: PR pequeños, checks obligatorios, revisión de datos, resolución de conflictos y rollback.

**Entrega:** rama base única, CI reproducible, preview de staging comprobada y captura de diferencias con producción, lista de PR preservados. **Gate:** no abrir nuevas funcionalidades si la base no compila o el origen del deploy es incierto.

### P0. BLOQUE 02 | Primer recorrido completo que realmente se pueda usar
**Dependencia:** Bloque 01. **No esperar a resolver las 30 recetas o precios comerciales.**

**Objetivo:** demostrar utilidad real con las **127 recetas actuales**, sin datos inventados, antes de ampliar funciones.

**Recorrido de aceptación:** bienvenida → idioma → elegir una receta → ajustar 2 y 4 raciones → revisar ingredientes y duplicados → guardar lista → marcar productos → registrar gasto confirmado → ver presupuesto/historial → cerrar y volver a entrar. Comprobar cancelación sin escribir, errores de almacenamiento y lista vacía.

**Tareas**
- Reutilizar lo ya implementado; reparar únicamente errores P0 del recorrido. No crear pantalla nueva si ya existe un flujo válido.
- QA automatizada en web y dos anchos de móvil. Abrir la preview de staging real, no basarse solo en el código. Proporcionar al propietario una guía corta de Safari iPhone con resultado esperado por paso y campo para anotar fallos.
- Si la sesión no permite probar físicamente el iPhone, indicar **PENDIENTE DE PRUEBA FÍSICA**, sin afirmar aceptación. No generar binario ni coste Apple sin autorización.

**Entrega:** recorrido demostrable, capturas reales, evidencia de persistencia, lista de fallos y correcciones en PR separado. **Gate:** el propietario puede revisar un flujo usable; si hay bloqueos, describir el punto exacto.

### P1. BLOQUE 03 | Catálogo maestro: 150 recetas originales, estados y lotes de diez
**Dependencia:** 00 y 01; recomendable después del primer recorrido.

**Objetivo:** reconstruir el catálogo SIN perder recetas ni alterar históricos.

**Tareas**
- Verificar 150 IDs distintos y 750 fichas de fuente ES/EN/DE/FR/BG, manifestos y SHA. Diferenciar 150 fuente + 7 anteriores de 127 actualmente accesibles; no llamar a 157 «150» ni crear duplicados.
- Construir un registro por receta: ID, lote, título ES, 5 idiomas, ingredientes/unidades/cantidades/raciones/tiempos/pasos, categoría desayuno/comida/cena/postre cuando la fuente lo respalde, alérgenos, precauciones, cata, revisión editorial, foto, publicidad, etiqueta comercial, huellas, estado de publicación.
- Conciliar específicamente **11–20**, **31–40**, **111–120** contra los controles V79–V83 y confirmaciones expresas. Evitar preguntar al propietario por una cata ya registrada: citar evidencia y pedir solo la aclaración realmente no resuelta. Si falta evidencia, mantener retenida.
- Por cada lote de 10, completar revisión interna en cinco idiomas y coherencia de números, medidas, pasos, alergias y riesgos particulares; no inventar aprobación nativa externa ni microbiológica. Conservación del original sin reescritura. Los tiempos no indicados siguen desconocidos; no convertir a 0.
- Mantener avisos comerciales pendientes de marca/SKU/etiquetas reales por tienda y formato. No deducir alérgenos desde precio ni ausencia de trazas.
- Preparar importador idempotente, test de IDs, backups, no duplicación y verificación de que los planes existentes siguen encontrando sus IDs.
- Solo activar las 30 retenidas cuando cada registro cumpla el control de aprobación y la verificación técnica. No publicar contenido privado a repo público por accidente.

**Entrega:** matriz 150/150, excepciones explícitas, importador comprobable, lote auditado y reporte del número realmente publicable. **Gate:** consistencia por ID y cero pérdida/renumeración.

### P1. BLOQUE 04 | Recuperar y vincular fotografías definitivas, una por receta
**Dependencia:** 03 para IDs y recetas maestras.

**Objetivo:** que el trabajo visual antiguo aparezca por fin en la app.

**Tareas**
- Hacer inventario exacto de imágenes existentes (V38 y posteriores): archivo, resolución, hash, licencia/procedencia, receta ID, comparación visual con título/ingredientes, calidad, estado `APROBADA / PENDIENTE / RECHAZADA / NO_LOCALIZADA`.
- No usar mosaicos, recortes erróneos, fotografías temáticamente parecidas ni imágenes temporales etiquetadas como finales. Objetivo mínimo **1536 px de ancho para original definitivo**. Diferenciar original a máxima calidad de derivados web optimizados (WebP/AVIF) y thumbnails, generados sin reescribir el original.
- Vincular por ID inmutable en datos/asset manifest. Crear campo `imageAsset`/estado donde corresponda, alt localizado, fallback honesto «foto pendiente» para faltantes; no atribuir imagen errónea a otra receta.
- Verificar que cada foto corresponde a una sola receta salvo uso excepcional aprobado y documentado. Automatizar pruebas para recursos faltantes, dimensiones, integridad, mapping y rutas de deploy.
- Revisar UX de listado y detalle: foto, textos, escalado, cache, lazy loading, accesibilidad y rendimiento iPhone. No instalar 150 originales enormes dentro del paquete nativo sin evaluar tamaño/estrategia de entrega y derechos.
- Resolver de 5 a 10 fotos por lote operativo solo después de recuperar todas las anteriores. Para cada lote: comparar con receta, aprobar calidad, enlazar, volver a comprobar en preview, cerrar el lote; no empezar otra tanda sin registro.

**Entrega:** manifiesto `ID → archivo → hash → tamaño → decisión → pantalla`, visualización real y conteo aprobado/publicado/faltante. **Gate:** ninguna foto incorrecta o provisional se muestra como definitiva.

### P1. BLOQUE 05 | Dos entradas de compra y motor de presupuesto, sin romper el flujo actual
**Dependencia:** 02 y estabilidad de 03; inspeccionar PR #11, NO fusionarlo sin revisar.

**Objetivo:** reflejar exactamente la decisión del propietario: **empezar por recetas O por presupuesto**.

**Ruta A:** Inicio → recetas/menús → escoger platos/raciones → revisar ingredientes → elegir una, varias o todas las tiendas → comparación con cobertura declarada → lista y compra externa.

**Ruta B:** Inicio → introducir presupuesto (ejemplo 50 €), comidas (ejemplo 5), personas → elegir tiendas INMEDIATAMENTE después del presupuesto → menús compatibles → revisar ingredientes → lista → comparación → compra externa.

**Tareas**
- Recuperar lo útil del PR #11 sin incorporar su importación de precios bloqueada, ni romper siete claves locales, listas guardadas, otras pantallas o preferencias.
- Mantener 5 comidas reales como capacidad actual hasta que el motor admita N; si solo admite cinco, indicarlo, no fingir que genera otras cifras. Preparar ampliación a número variable en subbloque con pruebas.
- Crear reglas explícitas de costes: presupuesto ≠ gasto registrado ≠ estimación ≠ desembolso de envases ≠ precio de porción. Sin precios actuales, no garantizar «5 comidas por 50 €»; mostrar presupuesto, planificación y coste pendiente/estimado identificado.
- Mantener filtros de dietas, tiempo, ingredientes no deseados y alérgenos con criterios conservadores. No etiquetar receta como apta para alergia si depende de un SKU desconocido. Incluir desayunos/postres como categorías del catálogo cuando esté auditado; expansión posterior al catálogo original por autorización separada.
- Validar navegación atrás, persistencia, selección múltiple, edición de platos, 1–12 comensales, duplicados y cancelación.

**Entrega:** dos recorridos de punta a punta en staging con pruebas automatizadas, ejemplos sin datos comerciales inventados y aceptación del propietario. **Gate:** ningún valor ficticio presentado como precio o ahorro verificado.

### P1. BLOQUE 06 | Tiendas, código postal y distancias en Tenerife
**Dependencia:** 05; independiente de conectividad a precios.

**Objetivo:** elegir establecimientos reales cercanos sin confundir selección con disponibilidad de precios.

**Tareas**
- Preservar **Lidl, ALDI, HiperDino, SuperDino, HiperDino Express, Mercadona** como seis modalidades, una/varias/todas/ninguna. Distinguir online, tienda física y centros suministradores, incluso dentro de una cadena.
- Al seleccionar tiendas, pedir **código postal** de forma contextual con aviso: surtido, precio, entrega y promociones pueden variar por sucursal, municipio, canal e isla; no solo por cambiar de isla. Se puede editar sin rehacer la lista.
- Buscar puntos de venta sobre fuentes geográficas verificadas. Ofrecer radio **5 km / 10 km / 20 km / personalizado**, distancia geográfica claramente rotulada, permisos voluntarios para ubicación precisa y entrada manual de CP/localidad como alternativa.
- Validar geocodificación y coordenadas de establecimientos. Sin coordenadas verificadas, no inventar radio, kilómetros o «tienda cercana». Distinguir distancia lineal de tiempo/ruta real (nunca simular tráfico).
- A cada resultado mostrar cadena, formato, localización, canal, enlaces oficiales, fuente de ubicación, fecha y cobertura de precio `NO_VERIFICADA / HISTORICA / VERIFICADA`, según corresponda.
- Probar Los Cristianos vs Los Gigantes, municipios limítrofes, CP incorrecto, múltiples islas y cambios de selección.

**Entrega:** selector postal y radios funcionando con ubicaciones comprobables, y advertencia honesta sobre precios no conectados. **Gate:** un mapa de tiendas no equivale a ranking de tiendas baratas.

### P2. BLOQUE 07 | Derecho de uso y tubería de datos de precios. Separada de UX
**Dependencia:** inventario B06.1 y contratos PR #16, 01 y 06.

**Objetivo:** conseguir precios que legal y técnicamente se puedan usar, sin contaminar la app con datos no actuales.

**Tareas**
- Tomar PR #20 como auditoría histórica B06.1, no como feed habilitado; revisar licencias y procedencia de tuTándem (CC BY) y Open Prices (ODbL) por separado. Históricos nacionales o comunitarios, si autorizados, solo pueden mostrarse como HISTÓRICOS y sin ranking PVP Tenerife.
- Mantener `enabled=false` para PVP actual hasta disponer de permisos y cobertura local real. Revisar y corregir limitación CORS de PR #11; preferir adaptador backend permitido, nunca proxy universal ni scraping no autorizado.
- Definir contrato: cadena, formato, sucursal/centro, CP, isla, canal, GTIN/EAN/SKU, marca, variante, cantidad/envase, IGIC/PVP, condiciones de promoción, fecha/hora y vigencia, unidad/kg/L, stock si autorizado, URL/fuente, licencia, cobertura y grado de confianza.
- En Supabase, aislar tablas/snapshots comerciales de B07 hogares; migraciones revisables, RLS, escrituras solo servidor, políticas de retención y atribución; no comprometer datos comerciales propietarios con obligaciones ODbL incompatibles. Backend con validadores, límites, cache, timeout, fallbacks, versiones, paginación, logs saneados.
- Casos: datos caducados, fecha futura, salto de precio, sin CP, oferta condicionada, marcas incompatibles, GTIN erróneo, HiperDino Express vs HiperDino, problemas HTTP, falta de cobertura y regiones distintas.
- Preparar, **no enviar**, solicitudes de feed a DINOSOL, Lidl, ALDI, Mercadona. Solicitar datos autorizados por CP/centro, permisos de comercialización/atribución/cache, SKU, fotos/marcas, actualización y costes. El propietario debe aprobar el envío y todo compromiso comercial.
- Primera prueba de fuente local autorizada con alcance pequeño y explícito, por ejemplo 30–50 productos en 2–3 zonas solo SI se reciben los derechos y el dato. No inventar progreso si no se recibe.

**Entrega:** matriz fuente/licencia/cobertura, backend y test de snapshots únicamente para fuentes aprobadas, borradores comerciales listos y desactivación segura cuando no hay datos. **Gate:** 0 datos no autorizados mostrados como PVP local actual.

### P2. BLOQUE 08 | Comparación de cesta real y salida de compra externa
**Dependencia:** 05, 06 y 07; puede mostrar comparación manual aunque no haya feeds.

**Objetivo:** responder «¿cuánto cuesta y dónde me conviene comprar?» solo si los datos lo permiten.

**Tareas**
- Comparar productos verdaderamente equivalentes por GTIN/variante y precio por kg/L/unidad, usando **envases enteros** para desembolso, no precio por cantidad consumida. Separar coste de la receta vs coste de comprar envases.
- Calcular dos modos: cesta completa en una tienda y compra repartida entre varias. Para varias tiendas, cada una mantiene su pago y carrito externos separados; JJ NO cobra ni envía pedido por su cuenta.
- Incluir formato de tienda, CP/centro, stock solo si verificado, validez, mínimos de pedido, transporte, IGIC y promociones condicionadas; si falta alguno, indicarlo como pendiente en vez de ocultarlo.
- Una cesta parcialmente cotizada nunca puede ganar ranking frente a otra completa. Mostrar cobertura % y productos sin precio. Sin precio vigente mostrar «Sin precio verificado», no 0 € ni ahorro calculado.
- Enlaces correctos y solo oficiales a compra online/ofertas/localizador. Verificar que Lidl/ALDI no se etiqueten como checkout alimentario online sin acreditarlo, y que la app no transfiera carrito donde no existe integración acordada.
- Probar distintos CP Tenerife y múltiple supermercado con 0%, 50% y 100% de cobertura, ofertas caducadas y categorías de compra reales.

**Entrega:** comparación exacta con metodología, origen, fechas y cobertura; tests matemáticos y visualización iPhone. **Gate:** nunca afirmar «la más barata» cuando los datos no permiten conclusión.

### P2. BLOQUE 09 | Finalizar cinco idiomas, diseño canónico y accesibilidad
**Dependencia:** 03–08 estabilizados para evitar retraducciones repetidas. Se pueden corregir fallos críticos de accesibilidad antes.

**Objetivo:** una experiencia uniforme y de calidad, no una mezcla de maquetas.

**Tareas**
- Completar interfaz **ES / EN / DE / FR / BG**: bienvenida, 4 tabs, 16 vistas, 9 estados, buscador, listas, recetas, alérgenos, tiendas, presupuesto, comparación, voz, permisos, privacidad, errores, accesibilidad, categorías, notificaciones y formatos de importes/fechas. BG solo activar al estar completo; idioma del dispositivo y elección manual con persistencia.
- Mantener Verde Mercado Premium, paleta verde/crema/amarillo aprobada, Manrope y **logo oficial original**. No sustituir el PNG exacto por SVG recreado ni generar versiones 3D sin revisión. Trabajar icono/vector/3D y alternativas en una fase de aceptación visual separada.
- Unificar 4 pestañas fijas. Notificaciones, Perfil, Mis tiendas y presupuesto como subpantallas; resolver estados vacíos, sin datos, errores, permisos y duplicados.
- Revisar contraste, 44x44 pt cuando corresponda, fuentes escalables, VoiceOver, foco/teclado, home indicator, safe areas, fotos y elementos de interacción, en Safari y nativo cuando existan dispositivos.
- Contrastar capturas reales 375/430 px con referencia V2, indicando diferencias aprobadas frente a errores. No reciclar renders como capturas de código.

**Entrega:** checklist 5 idiomas × pantallas × estados, evidencias visuales, revisiones lingüísticas internas, accesibilidad y decisiones de diseño pendientes del propietario. **Gate:** ninguna pantalla parcialmente traducida se anuncia como idioma completo.

### P3. BLOQUE 10 | IA real dentro de JJ, acotada y verificable
**Dependencia:** 03, 05 y modelo de precios honesto.

**Objetivo:** añadir IA útil, no una pantalla que parezca conectada.

**Tareas**
- Diseñar casos concretos: transformar texto natural en lista revisable, proponer menú según personas/ingredientes/presupuesto/dietas, sugerir sustituciones, gestionar productos desconocidos y explicar límites de precios.
- Preservar motor determinista de importes, alérgenos y unidades; la IA **sugiere**, el usuario confirma antes de escribir o actuar. Sin inventar fuentes/precios/alergias.
- Arquitectura con backend y claves del servidor, control de uso/costes, opt-in privacidad, no retención innecesaria de listas, sanitización de prompts, límites antiabuso y salida estructurada validada.
- Prototipo medible sin gastos recurrentes por defecto; analizar opciones gratuitas y cuota máxima antes de activar API de pago. Voz/foto/escáner solo con permisos reales y alternativa manual.
- Test con 50 € / 5 comidas, cinco idiomas, alergias, cantidades ambiguas, fallos de red, falta de precios y respuesta no válida.

**Entrega:** módulo IA mínimo con métricas de coste/errores y demo real; si la decisión económica no está aprobada, dejar diseño listo sin llamadas ni costes.

### P3. BLOQUE 11 | Cuentas opcionales, hogares y sincronización Supabase B07
**Dependencia:** apps locales estables, pruebas SQL autorizadas y revisión de privacidad.

**Objetivo:** compartir datos entre teléfonos sin arriesgar listas existentes.

**Tareas**
- Resolver primero la **confirmación nativa** pendiente de la matriz SQL/RLS `supabase/tests/household_security.sql`. Registrar ejecución, aserciones reales, rollback y comprobación posterior de tablas vacías. No eludir controles ni suponer que `NO_RESULT` = aprobado.
- Revisar 14 tablas, RLS/FORCE, grants y Auth existentes sin abrir accesos indiscriminados. Revalidar con docs actuales de Supabase antes de implementar.
- Diseñar registro opcional, sesión segura web/nativa, verificación de correo, BFF y cookies/CSRF cuando aplique, RPC transaccionales e idempotentes, hogares, invitación/aceptación/revocación, permisos, conflictos, migración explícita de datos locales y restauración.
- Sincronización bidireccional probada entre dos dispositivos/cuentas, uso offline, resolución de conflictos, privacidad, borrado/exportación y recuperación de cuenta. Los siete documentos locales previos deben seguir accesibles, con prueba de migración y reversión.
- No utilizar el SMTP por defecto como supuesto registro comercial operativo; requerir remitente y permiso. Mantener modo sin cuenta funcional.

**Entrega:** suite de autorización real y prueba de sincronización/hogar con consentimiento y datos de test aislados; si persisten bloqueos, no habilitar UI engañosa.

### P3. BLOQUE 12 | iPhone real, Android, rendimiento y seguridad integral
**Dependencia:** MVP funcional de bloques anteriores. Primer smoke de iPhone ya se inició en Bloque 02.

**Tareas**
- Prueba física en iPhone del propietario: instalación o Safari según fase, permisos reales de cámara/micro, teclado, VoiceOver, tipografía dinámica, orientación, safe areas, fotos, scroll, gestos, formularios, persistencia y retorno desde páginas de tiendas.
- Pruebas Android cuando haya dispositivo; export web/iOS/Android y build firmado solo cuando cuentas/costos estén autorizados. EAS/TestFlight requiere credenciales Apple y aprobación; nunca pedir contraseña al chat ni simular envío.
- QA end-to-end del flujo de presupuesto/recetas, con datos locales y conectados, varios CP, 5 idiomas, sin internet, datos caducados, fallos de importación y seguridad Auth.
- Exigir tests unitarios, navegador, calidad manual, escáner de secretos, dependencias actualizadas compatibles, RLS, gestión de datos, backup/restore y rendimiento de imágenes. Mantener reporte de riesgos residuales; no prometer certificación WCAG o ausencia absoluta de vulnerabilidades.

**Entrega:** matriz dispositivos reales + defectos priorizados + correcciones y regresiones. **Gate:** no declarar «iPhone terminado» desde WebKit Linux o export JS.

### P4. BLOQUE 13 | Piloto Tenerife, acuerdos y salida comercial gradual
**Dependencia:** experiencia validada, contenido/publicación y derechos de precios.

**Tareas**
- Definir un piloto acotado por zonas y participantes, con consentimiento, métricas anónimas mínimas y feedback sobre utilidad/cobertura de precios, sin registrar datos sensibles por defecto.
- Revisar condiciones de uso, privacidad RGPD, publicidad/atribuciones, licencias de fotos y fuentes, accesibilidad, política de actualizaciones y soporte. Exposición comercial solo según permisos reales.
- Validar con cadenas acuerdos de datos y de enlace/carrito cuando proceda. La compra/pago permanece en web/app de cada comercio; ningún checkout propio.
- Preparar página pública/landing, App Store/Play Store y material de lanzamiento **solo después** de aprobar diseño, costes y cuentas de desarrollador. No publicar producción sin autorización explícita.

**Entrega:** informe de piloto con decisiones de lanzamiento, riesgos abiertos, fuentes permitidas y presupuesto de operación.

### P4. BLOQUE 14 | Mejoras posteriores, solo tras MVP probado
- Posibilidad de planes flexibles de N comidas y optimización multicriterio cuando hay precios reales.
- Colección personal de recetas editable, importación/backup, desayunos, postres y nuevos lotes **después** de cerrar las 150 y sus fotos, sin forzar catálogos nuevos.
- Alertas de cambios de precio/stock únicamente si existe fuente y permiso de notificación.
- Integración de carritos oficiales de tiendas únicamente si la cadena concede API y permisos.
- Extensión a otras islas únicamente tras resolver geografía, disponibilidad, cadena, logística y precios por isla.

## D. Dependencias resumidas y prioridades

| Orden | Bloque | Resultado visible | No puede depender de... | Estado inicial |
|---|---|---|---|---|
| 00 | Recuperación y archivos | Inventario y respaldo verificado | Suposiciones sobre ZIP local | PENDIENTE |
| 01 | Git/CI/preview única | Una versión staging identificada | Merge automático a producción | PENDIENTE |
| 02 | Recorrido usable | Menú → lista → gasto → presupuesto | Precio comercial o 150 fotos | PENDIENTE |
| 03 | 150 recetas | Criterios de publicación por ID | Declarar aprobaciones por inferencia | PARCIAL |
| 04 | Fotografías | Foto real vinculada a receta | Nueva generación antes de recuperar | NO INTEGRADO |
| 05 | Recetas/presupuesto | Dos entradas que funcionan | Activar precios bloqueados PR #11 | PARCIAL_EN_RAMA |
| 06 | Tiendas y CP | Selección y radios geográficos | Afirmar «más barata» | PARCIAL |
| 07 | Fuentes de precios | Feed solo con derechos y cobertura | Scraping, medianas como PVP local | BLOQUEADO_POR_FUENTES |
| 08 | Comparación de cesta | Importes con cobertura y fecha | Datos inventados | PARCIAL_MANUAL |
| 09 | Diseño + BG | 5 idiomas y UX consistente | Reabrir todo el diseño | PARCIAL |
| 10 | IA | Asistente útil y revisable | Clave en cliente, gasto sin permiso | NO CONECTADA |
| 11 | Cuentas/hogar | Sincronización segura y opt-in | Omitir matriz RLS | BLOQUEADO |
| 12 | QA física | App probada en iPhone real | Confundir export con app instalada | PENDIENTE |
| 13 | Piloto y lanzamiento | Feedback y preparación comercial | Publicar sin derechos ni permiso | FUTURO |
| 14 | Mejoras | Backlog posterior | Desviar MVP actual | FUTURO |

## E. Definición universal de «bloque cerrado»

Un bloque se da por cerrado únicamente con:
1. **Antes/después:** qué requisito exacto estaba incumplido y qué comportamiento ahora existe.
2. **Código:** rama, SHA, PR, archivos y migraciones; conservación de trabajo preexistente.
3. **Calidad:** comandos ejecutados y recuento realmente obtenido (pass/fail/skip), pruebas nuevas, regresiones, límites y errores; no extrapolar de una versión anterior.
4. **Evidencia usuario:** capturas desde app ejecutable cuando aplique, URL staging REAL comprobada, pasos de uso en iPhone y resultado esperado.
5. **Datos:** origen, licencia, actualización, integridad y cobertura; si no existe fuente, ausencia visible y explícita.
6. **Privacidad:** secretos, permisos, RLS, fotos, ZIP privados y datos locales sin exposición.
7. **Registro maestro:** `docs/PLAN_Y_ESTADOS.md`, `docs/DECISIONES_Y_RIESGOS.md` y `docs/MAESTRO/INVENTARIO_UNICO.md` actualizados sin borrar historial.
8. **Decisión:** `CERRADO_TECNICAMENTE / REQUIERE_PRUEBA_PROPIETARIO / BLOQUEADO / RECHAZADO`; siguiente bloque propuesto, sin saltar automáticamente contra `AGENTS.md`.

## F. Informe obligatorio después de CADA sesión o subtarea

Formato fijo y en español, sin respuestas vagas:

```text
JJ | Bloque XX / Subtarea XX.YY
Fecha/hora UTC:
Rama y SHA de partida:
Objetivo de este paso:
Encontrado (evidencia comprobable):
Modificado de verdad (archivos / PR / SHA):
Pruebas ejecutadas (número OK / fallidas / omitidas, método y SHA):
Preview (URL, estado, SHA, acceso, comprobación real):
Conservación (origen, recetas, fotos, documentos, backups, hashes):
Pendiente y motivo (interno / externo / aprobación / licencia):
Riesgo o impacto en costes:
Estado de bloque (NO_EMPEZADO/EN_CURSO/BLOQUEADO/CERRADO_TECNICAMENTE):
Siguiente acción exacta (solo una):
Qué necesito del propietario (solo si es indispensable):
```

## G. Control de calidad semanal y de cada dos bloques

- Tras **cada** bloque: revisión editorial/técnica de lo tocado, pruebas focalizadas, fuente/commit/preview y actualización del maestro.
- Tras **cada dos bloques**: regresión completa, matriz de navegación, datos y privacidad, pendientes y diferencia visual; demostrar no regresión de B03/B04/B05, y del comparador anterior.
- Cadencia de comunicación: informar en cada hito real de la sesión, sin prometer continuidad automática cuando Codex no está ejecutándose.
- Un único tablero, con identificador, prioridad, dependencia, estado, evidencia y aceptación. No abrir una nueva versión VXX porque sí; el nombre de versión no acredita progreso.
- Medidas simples de progreso: `requisitos probados / total`, `recetas activas / 150`, `fotos correctas vinculadas / 150`, `idiomas UI completos / 5`, `flujo diario iPhone aceptado sí/no`, `fuentes de PVP local verificadas / tiendas`, `PR fusionados y comprobados / PR pendientes`, `coste mensual real`.

## H. Puertas de aprobación del propietario (no confundir con permisos ya existentes)

- **No hace falta pedir aprobación otra vez:** auditoría de lectura, pruebas locales sin gasto, documentación, commits/PR revisables dentro del encargo, previews de staging verificadas según `AGENTS.md`.
- **Aprobación necesaria:** fusionar/promover a producción, cambiar esquema o permisos con impacto en datos reales cuando no esté autorizado, publicar contenidos retenidos sin aclarar, generar/sustituir masivamente fotos, elegir logo derivado, abrir una suscripción/coste, desplegar IA de pago, enviar correos a supermercados, compartir contenidos privados en repositorio público, instalar/distribuir por tiendas o App Store.
- **Cuando la falta de un permiso bloquee un subbloque:** describir el resultado preparado y la decisión exacta requerida, sin ejecutar acciones similares por otra vía.

## I. Primer encargo ejecutable inmediato: SOLO Bloque 00

**Codex, no te pongas a reprogramar JJ ni a abrir el Bloque 05.** Primero ejecuta una auditoría de lectura comparando los archivos y PR actuales. Entrega tabla de inventario, árbol de dependencias, respaldo real de materiales verificables, diferencias main/staging y una ruta segura de integración. No modificar código, ni lanzar migraciones ni fusionar ramas en esta primera sesión. Informar del estado en español y dejar un plan de PRs concreto para el Bloque 01.

### Documentos y enlaces que debes revisar obligatoriamente
- `AGENTS.md`, `README.md`, `docs/PLAN_Y_ESTADOS.md`, `docs/DECISIONES_Y_RIESGOS.md`, `docs/ESTADO_ACTUAL_Y_PENDIENTES.md`.
- `docs/RECETAS_V83_INTEGRACION_Y_AUDITORIA.md`, `referencias/recetas-v83/README.md`, `docs/CIERRE_SEGURIDAD_Y_CALIDAD_2026-11-13.md`.
- `docs/PILOTO_TIENDAS_Y_PRECIOS_2026-11-10.md`, `docs/TIENDAS_COMPARTIR_Y_AUDITORIA.md`, `docs/B07_BASE_SEGURA_Y_AUDITORIA.md`, `supabase/tests/household_security.sql`.
- `docs/B06_CODEX_PLAN_EJECUCION_FUENTES_PRECIOS_2026-11-12.md` y `docs/B06_CONTRATO_DATOS_PRECIOS_V1_2026-11-12.md` del PR #16.
- PR #11, #12, #15, #16, #19, #20 y sus bases/SHAs; issues #13, #14, #17, #18. Inspeccionar otros PR solo cuando sea relevante.
- 16 vistas/9 estados del kit V2; las fuentes/activos de imágenes V38–V83 si están realmente accesibles.

**Norma final:** siempre preferir un progreso pequeño, conservado, integrado y probado a diez informes que se contradicen. No hay entrega hasta que se pueda señalar una función real o un bloqueo externo comprobable.
