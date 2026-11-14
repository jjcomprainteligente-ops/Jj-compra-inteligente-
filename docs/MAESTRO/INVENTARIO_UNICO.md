# Inventario único | JJ Compra Inteligente

**Registro maestro materializado en Bloque 01 · 13/11/2026.** El propietario autorizó consolidar la app existente, sin empezar de cero. Los hechos de partida proceden de la auditoría de lectura del Bloque 00, cerrada a las 16:43 UTC. [Plan aprobado recibido](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md) · [mensaje inicial de auditoría ya realizada](fuentes/JJ_MENSAJE_INICIAL_CODEX_2026-11-13.md). Las pruebas de aquella auditoría son lecturas de evidencia, no suites recién ejecutadas.

## Origen y nomenclaturas

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
| R01 · Conservar app e historial | Propietario y plan maestro del 13/11; auditoría 00 | Entrada `index.ts` → `src/app/ShoppingApp.tsx`; referencias Git anteriores | Comparación 17d5→ABB sin cambios de app/deps; CI ABB correcta | EN_CURSO en Bloque 01 | Copia confirmada por el propietario; verificar independencia de 01.1 antes de modificar app. QA B02 autorizada sobre app intacta. |
| R02 · 150 recetas / cinco idiomas de fuente | ZIP privado V83, manifiesto interno y controles | Original local ignorado; importador `scripts/import-recipes-v83.py` | Lectura: 150 IDs únicos, 750 fichas; 13/13 hashes internos correctos | LOCALIZADO_VERIFICADO como material | Respaldo independiente pendiente; no publicar el ZIP privado. |
| R03 · Catálogo accesible | Fuente pública de 120 y siete recetas previas | `src/data/recipesV83.ts`, `src/data/recipes.ts`; catálogo/detalle Menús | CI 78480fd reproduce la selección pública; pruebas V83 y navegador de origen 78480fd | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | 127 accesibles; conservar IDs y cantidades. Los 80 tiempos V83 desconocidos siguen nulos. |
| R04 · 30 retenidas | Controles de posiciones 11–20, 31–40, 111–120 | Fuera del runtime y de la fuente pública | Lectura de originales: estados superiores y traducciones contradictorios | BLOQUEADO | Conciliar por ID en Bloque 03. 111–120 tienen cata confirmada en metadatos pero pendiente en traducciones; no pedir repetirla por inferencia. |
| R05 · Fotos definitivas | Trabajo histórico V38–V83 referido; originales no accesibles | `Recipe` en `src/domain/menus.ts` sin campo de foto; detalle en `MenuWorkspace.tsx` sin vínculo por receta | Cero correspondencias definitivas verificadas; ZIP ligero sin imágenes | NO_LOCALIZADO para originales / PENDIENTE de integración | Recuperar originales, derechos, resolución y mapa por ID en Bloque 04; no generar sustituciones. |
| R06 · Diseño Verde Mercado Premium / GPT-6 V2 | Kit recuperado de 16 vistas/nueve estados y PNG oficial | `src/app/components/ui.tsx`, `assets/brand/jj-logo-horizontal.png`; cuatro tabs y subpantallas | Capturas de consolidación; contraste previo con alcance identificado; PNG exacto comprobado | PROBADO_AUTOMATICAMENTE en alcance técnico | Aceptación estética y dispositivo pendientes; no recrear SVG/3D ni volver a M3. |
| R07 · Navegación y estados | Contrato V2 y cobertura ejecutable | `ShoppingApp.tsx`, pantallas y `StateReviewScreen.tsx` | 16 escenas y nueve ejemplos rotulados en `tests/e2e/coverage-visual.spec.ts` | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | La galería no acredita conexión de servicios ni todos los fallos reales; regresión de consolidación completada; aceptación funcional humana separada. |
| R08 · Guardado y privacidad | Reglas de conservación y pruebas previas | `src/storage/writeFence.ts`, `writeCoordinator.ts`, `dataPrivacy.ts` | Unitarias de baseline ABB y recorridos 78480fd: siete documentos y protección frente a conflicto/incertidumbre | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | Preservar claves y journal técnico; persistencia comprobada sobre origen 78480fd; mantenerla en cambios futuros. |
| R09 · Recorrido diario | Plan maestro02 y orden de continuar14/11 | Menús, revisión, listas, `MoneyScreens.tsx` y `expenses.ts` intactos | B02 local36/36, receta primero, error/duplicados/lista vacía; [guía Safari](BLOQUE02_PRUEBA_SAFARI_IPHONE.md) e [informe](BLOQUE02_ENTREGA_Y_AUDITORIA.md) | PROBADO_AUTOMATICAMENTE local / prueba física PENDIENTE | Verificación de esta entrega en staging pendiente; no esperar fotos ni precios. |
| R10 · Dos entradas recetas/presupuesto | PR #11 y plan maestro Bloque 05 | Propuesta en rama paralela; `PlanBudgetScreen`/`PublicPriceCompareScreen` no están integradas en ABB | PR #11 sin comprobación de ejecución acreditada en auditoría 00 | IMPLEMENTADO_SIN_PROBAR en rama paralela | Recuperar interfaz selectivamente en Bloque 05, preservando guardado y excluyendo feed bloqueado. |
| R11 · Seis tiendas | Decisión del piloto y enlaces oficiales | `src/domain/stores.ts`, `StoresScreen` y preferencias locales | Pruebas 78480fd de una/varias/todas, enlaces y persistencia | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | CP, radios y ubicaciones verificadas pendientes del Bloque 06; selección no implica PVP. |
| R12 · Fuentes de precios | PR #16 e issues #13/#14/#17/#18; auditoría PR #20 | Comparador manual y fuentes externas desactivadas para PVP actual | HTTP B06.1 del 13/11: tuTándem histórico; Open Prices 27 observaciones históricas/siete lugares, 0 del 7–13/11 | BLOQUEADO para PVP local actual | Revisar permiso/alcance; indicadores históricos solo separados y atribuidos. No ranking local ni scraping. |
| R13 · Gasto y comparación honesta | Gasto confirmado ≠ presupuesto ≠ estimación | `ShoppingApp.tsx`, `src/domain/expenses.ts`, `PriceWorkspace.tsx` | Unitarias de baseline ABB y recorridos 78480fd; gasto explícito, no derivado de marcar | PROBADO_AUTOMATICAMENTE, evidencia nueva de origen 78480fd | Corregir guías históricas y conservar equivalencias, fuentes, fechas y cobertura. |
| R14 · Idiomas | Cuatro idiomas de lanzamiento; BG completo en Bloque 09 maestro | `src/i18n/types.ts`, catálogos y preferencia manual | i18n/HTTPS de 78480fd para es/en/de/fr; fuente V83 también bg | PROBADO_AUTOMATICAMENTE para 4 / PENDIENTE BG UI | Mantener respaldo español y EUR; activar BG solo con UI completa y comprobada. |
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
| 06 Detalle receta | Receta, cantidades, pasos y avisos; foto definitiva pendiente. |
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

## Originales y respaldo: manifiesto resumido

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

## Procedencia de pruebas y cierre pendiente de Bloque 01

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

QA autorizada sobre la app existente intacta, separando 01.1 sin verificación externa. [Informe y auditoría](BLOQUE02_ENTREGA_Y_AUDITORIA.md): local36/36, 180 capturas lógicas privadas y siete documentos conservados en los escenarios comprobados; [guía Safari](BLOQUE02_PRUEBA_SAFARI_IPHONE.md) para aceptación física pendiente. Publicación y HTTPS de esta entrega pendientes. No se abre el Bloque03.
