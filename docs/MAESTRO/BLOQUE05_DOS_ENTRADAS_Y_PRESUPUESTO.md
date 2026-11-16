# JJ | Bloque 05.1 · Empezar por recetas o por presupuesto

Preparación: 15/11/2026; cierre verificado: 16/11/2026. Base conservada: `6301575974c056bd2ca8d0c2055631cd71654e85`. Rama: `codex/bloque05-recetas-presupuesto-2026-11-15`.

## Alcance y autorización

El propietario autorizó continuar con B05 después de la pregunta de cambio de bloque. Se amplía la app existente conforme al [Bloque 05 del plan maestro](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md), sin reiniciar el producto. [B04.2](BLOQUE04_2_ESTADO_FOTOGRAFIA.md) se conserva como base; sus resultados anteriores no se presentan como pruebas de este nuevo código.

Esta subtarea incorpora los dos accesos y su coordinación con menús, revisión de ingredientes, tiendas y lista. El número variable de comidas, las categorías pendientes de auditoría y una comparación de cesta con precios actuales conservan sus dependencias y no se anuncian como construidos.

## Revisión selectiva del PR #11

Se revisó [PR #11](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/11), snapshot `2562d98a46b9e5179b77d6590ec3b582ffd0d63d`, sobre su base antigua `2ae8d27adb07cafbc69e9627237b50a7f8f7127b`. No se fusiona esa rama ni se copian sus patches sin adaptar.

| Decisión | Parte revisada | Tratamiento en B05.1 |
|---|---|---|
| Recuperar la intención | Dos accesos de Inicio y orden presupuesto → tiendas | Se implementa sobre los componentes y la base actuales. |
| Recuperar el límite | Objetivo presupuestario para una lista nueva | Se incorpora junto con los ingredientes en una sola escritura confirmada. Una lista existente conserva su propio presupuesto. |
| Corregir | Raciones solicitadas frente a menú guardado | El recorrido usa un plan efímero independiente; el menú anterior no prevalece sobre las raciones solicitadas ni se sobrescribe. |
| Corregir | Tiendas y cancelación | Selección temporal de las seis modalidades; permite ninguna, una, varias o todas, sin cambiar favoritos guardados. |
| Corregir | Volver y errores | Retorno contextual, borrador conservado al editar objetivo o pasar por Perfil/Idioma y confirmación real separada de la salida a Mi compra. |
| Excluir | `api/public-prices.js`, `PublicPriceCompareScreen`, `publicPriceFeed` y sus mensajes/pruebas | No se activa la fuente de precios pendiente de autorización/cobertura. Resolver CORS no acreditaría un PVP vigente de Tenerife. |

El feed revisado no demuestra equivalencia por SKU/envase, cobertura local ni desembolso de envases completos. Las herramientas manuales existentes siguen siendo herramientas por producto; no se presentan como una comparación completa de esta cesta.

## Los dos recorridos

**Ruta A · Por recetas:** Inicio → catálogo o menú → plato y raciones → revisión de ingredientes y duplicados → selección temporal de tiendas → confirmación real → lista guardada y resumen de compra. El paso de tiendas sucede antes de escribir ingredientes. Volver desde tiendas conserva la revisión; un fallo de guardado mantiene la propuesta para reintentar.

**Ruta B · Por presupuesto:** Inicio → presupuesto objetivo, cinco comidas y personas → tiendas inmediatamente después → propuesta de menú → revisión de ingredientes → confirmación → lista guardada y resumen. El formulario admite exactamente cinco comidas y de una a doce personas; no finge generar otra cantidad. El campo de importe empieza vacío, con un ejemplo identificado como tal.

El presupuesto es un objetivo, no un gasto registrado, una estimación comprobada o una garantía de coste. La app indica coste pendiente cuando no hay precios actuales verificados. El coste de ingredientes consumidos puede diferir del desembolso por envases enteros. No se calcula ahorro ni se ordenan tiendas por precio en esta subtarea.

El resumen utiliza el ID de la lista que realmente se guardó. Si se deshace o elimina, muestra que ya no está disponible y no sustituye silenciosamente otra lista. Se puede abrir Mi compra, acudir al comparador manual por producto o abrir destinos oficiales de las tiendas seleccionadas mediante una pulsación explícita. Compra y pago permanecen externos, sin transferencia de carrito.

## Conservación y seguridad

- `PlanningContext`, el formulario y el menú propuesto viven en memoria. No hay una clave o migración nueva. Cambiar tiendas en el recorrido no escribe `favoriteStores`.
- El borrador se conserva al editar el objetivo y al entrar y volver de Perfil, Idioma o Privacidad. Las pestañas generales abandonan el recorrido; un borrado confirmado desde Privacidad limpia también estos borradores para no recuperar datos eliminados.
- Las rutas `plan-*` sin contexto regresan a Inicio. El menú efímero se mantiene montado y oculto para conservar platos y filtros; sus elementos quedan fuera de la accesibilidad mientras se muestra otro paso.
- La ruta nueva no llama a `meal.save`: conserva `menus.v1`, incluso si el menú guardado es ilegible. No afirma repararlo. Las rutas originales mantienen sus controles de carga y escritura.
- La lista solo se modifica después de la confirmación real mediante `store.commit` y las protecciones existentes. Una lista nueva recibe ingredientes y objetivo presupuestario en la misma operación. Una lista existente conserva su presupuesto; no se crea un gasto al confirmar ingredientes.
- El callback de confirmación se separa del escape a Mi compra. Un error al cargar el menú original no puede convertirse en continuación con una lista anterior.
- No hay feeds, scraping, proxy de precios, servicios nuevos, autenticación, cambios de base de datos o dependencias añadidas. Los destinos externos proceden de la lista oficial existente; web conserva `noopener,noreferrer`.

Las siete claves de negocio, sus protecciones, los IDs culinarios, ingredientes, cantidades, pasos y el logo oficial se conservan. El catálogo sigue teniendo 120 V83 y siete anteriores, 127 recetas activas. No se publican recetas retenidas ni estados editoriales nuevos de ellas.

## Diseño e idiomas

Antes de implementar se mostraron dos maquetas temporales de Inicio: accesos compactos y accesos verticales. Se usa la composición compacta como propuesta de trabajo comunicada, sin atribuir aprobación estética al propietario. Se reutilizan Verde Mercado Premium / GPT-6 V2, Manrope, colores, `Card`, `Button`, `Field`, `Pill` y avisos existentes. El acceso Crear/Continuar lista mantiene una posición adecuada para alturas pequeñas.

El componente `Button` admite una etiqueta accesible específica y la ausencia de icono para estos accesos; su comportamiento predeterminado se conserva. Se corrigió la etiqueta alemana para contener el texto visible del botón.

El catálogo central `purchaseJourney.ts` incorpora 54 claves por idioma en es/en/de/fr. Se mantienen el respaldo español, los formatos locales y el euro. No se activa BG ni se añaden categorías culinarias sin auditar.

## Código y pruebas preparados

| Superficie | Archivos principales |
|---|---|
| Coordinación, escritura confirmada y regreso | `src/app/ShoppingApp.tsx`, `src/app/types.ts` |
| Dos entradas y componentes existentes | `src/app/screens/HomeList.tsx`, `src/app/components/ui.tsx` |
| Menú efímero y revisión → tiendas | `src/app/screens/MenuWorkspace.tsx` |
| Formulario, selector y resumen | `src/app/screens/PlanningScreens.tsx` |
| Validación y mensajes | `src/domain/purchaseJourney.ts`, `src/i18n/catalogs/purchaseJourney.ts`, `src/i18n/resources.ts` |
| Validaciones unitarias | `tests/purchase-journey.test.ts` |
| Recorridos en navegador | `playwright.purchase-journey.config.ts`, `tests/purchase-journey/journey.spec.ts` |

Comprobaciones acreditadas en la preparación: **TypeScript correcto, 1.081 unitarias correctas —90 de validación nueva—, 51 pruebas Python correctas, consulta npm con cero avisos conocidos, compatibilidad oficial Expo correcta y export web correcto**. La revisión independiente estática examinó las correcciones de navegación, privacidad y conservación; sus resultados no sustituyen las pruebas de ejecución.

La candidata conserva un manifiesto de 100 hashes de entradas de aplicación para vincular después sus ejecuciones al commit publicado. Fuente final `5f208d882b0ce6e418267464c0a76346bf15b01c`, árbol `87864955ae1663901c3d9baf003a761ae96412c2`, PR #26. Los resultados se vinculan por hashes a cada fuente; la matriz general conserva su origen e1c3 y el ajuste final su alcance propio.

**Navegador y exportaciones completas comprobados.** La suite de los nuevos recorridos pasó 48 casos, cuatro por idioma en Chromium de escritorio y WebKit 375/430. Comprueba ambos recorridos, importes nuevos frente a presupuestos existentes, raciones con menú previo, edición/regreso, selección 0/1/varias/todas, siete documentos, favoritos, errores y doble activación. Los contextos y datos de prueba son temporales; los artefactos permanecen privados y las trazas de enlaces temporales se desactivan.

La auditoría técnica de la pareja **B04/B05** está registrada con fuentes separadas: regresión general y recorridos sobre e1c3; ajuste focal y staging sobre 5f208d8. Incluye tipos, unitarias, Python, dependencias, exportaciones y pruebas visuales/accesibilidad. Los límites y la prueba física permanecen explícitos; no se atribuye una repetición de la matriz general al ajuste visual. WebKit con tamaño móvil y exportar iOS/Android no acreditan prueba física, binario firmado, TestFlight o aprobación humana.

Comandos reproducibles, con las rutas de evidencia elegidas localmente:

```sh
npm run typecheck
npm test -- --maxWorkers 2
npm audit --json
npx expo install --check
npx expo export --platform web --output-dir dist-b05-revision --max-workers 2
npx expo export --platform all --output-dir dist-b05-plataformas --max-workers 2
npx playwright test --config playwright.purchase-journey.config.ts
```

La suite requiere servir primero un export revisado y configurar el origen y el directorio privado de evidencia. El enlace protegido se suministra únicamente por entorno al runner; no se incluye en comandos publicados, informes, código o trazas públicas.

## Estado y puerta de entrega

**B05.1 PROBADO_AUTOMATICAMENTE Y STAGING VERIFICADA:** ambos recorridos construidos y comprobados, código publicado, CI correcta y preview protegida verificada con el mismo export. El cierre documental posterior no cambia la aplicación probada. La aceptación del propietario y la prueba física continúan separadas.

B05 completo conserva como pendientes el número variable de comidas, las categorías que necesiten auditoría de fuente y la aceptación del recorrido por el propietario. No se inventan categorías ni se amplía el catálogo para cerrar un contador. La disponibilidad de precios y la comparación real de cesta dependen de los Bloques 07/08 y no se habilitan desde este bloque.

B04 sigue pendiente de originales V38–V83: cero fotos aprobadas o publicadas. B03 mantiene las excepciones y su frontera privada; B02 físico y la independencia externa de 01.1 siguen abiertos. No se abre B06 automáticamente, no se fusiona main, no se promueve producción y no se comprometen servicios de pago.

Siguiente acción exacta: revisión del propietario de ambas entradas en Safari/iPhone con la preview verificada. Registrar cualquier incidencia, sin declarar aceptación, prueba física o bloques dependientes por inferencia.

## Registro previo a staging · corrección focal del 15/11/2026

La primera fuente se registró en [PR #26](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/26), `e1c3cfbb87d2f71cc16b91f83d8e3b3c11311e38`, árbol `f49464ccbfada5cee764647acdaaa321c23e89c2`. CI 43740593411 y 43740572473 correctas. Sobre esa fuente pasaron 48/48 casos nuevos, 20/20 de fotografías y 8/8 de calidad; la matriz general se ejecutaba entonces sobre ese origen y terminó con 298 casos correctos y 24 omisiones deliberadas, como registra el cierre del 16/11.

La inspección visual detectó alturas distintas en los dos accesos de Inicio. Se ajustó únicamente el estilo condicional de `Button` sin icono: centrado, espacio horizontal de 8 px y crecimiento para igualar la altura. Solo esos dos accesos utilizan la variante. Los otros 99 inputs de aplicación coinciden con la fuente anterior; no cambia su comportamiento predeterminado, menús, raciones, guardado o precios.

El ajuste pasa 12/12 casos focalizados y 20 escenas en cuatro idiomas, Chromium 375/430/1280 px y WebKit 375/430 px: altura uniforme, texto completo en una línea a escala normal, área mínima de 44 px, etiqueta accesible que contiene el texto visible, Crear lista visible y siete documentos conservados. La primera ejecución del test visual leyó preferencias antes de que terminara la transición de bienvenida; se corrigió la espera de Inicio, manteniendo las aserciones y el intento original. No fue un cambio a la persistencia de la app. [Informe del ajuste](../../design/purchase-journey/reports/layout-verification.json).

TypeScript y export web del ajuste correctos. Las pruebas generales anteriores no se presentan como otra ejecución sobre el ajuste final; cada informe conserva fuente/hash. En aquel punto estaban pendientes la publicación, CI y staging del ajuste; sus resultados correctos posteriores constan en el cierre del 16/11.

## Cierre verificable de B05.1 · 16/11/2026

Rama: `codex/bloque05-recetas-presupuesto-2026-11-15`. Fuente funcional `e1c3cfbb87d2f71cc16b91f83d8e3b3c11311e38`, árbol `f49464ccbfada5cee764647acdaaa321c23e89c2`. Fuente final de staging `5f208d882b0ce6e418267464c0a76346bf15b01c`, árbol `87864955ae1663901c3d9baf003a761ae96412c2`. [PR #26](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/26).

Objetivo y resultado: dos entradas operativas sobre la app existente; revisión explícita, tiendas temporales y guardado real. Presupuesto objetivo separado del gasto y del coste pendiente. Ningún feed, precio, ahorro o carrito comercial ficticio.

Código modificado: coordinación de pantallas, borradores, validaciones acotadas, selector temporal, resumen, mensajes y pruebas. Se corrigieron raciones, regreso al editar objetivo, Perfil/Idioma, pantallas sin contexto, borrados de privacidad y alineación de Inicio. Los siete documentos y sus protecciones, recetas, IDs, cantidades, pasos, dependencias y logo permanecen conservados.

Pruebas de fuente funcional: 1.081 unitarias y 51 Python; 298 casos Chromium correctos y 24 omisiones deliberadas; 48 recorridos nuevos, 20 casos de fotografía y ocho casos de calidad correctos. Calidad: 296 escenas y cero fallos medidos de contraste/áreas, con observaciones manuales conservadas; no es certificación WCAG. [Regresión](../../design/purchase-journey/reports/browser-source1.json) · [recorridos](../../design/purchase-journey/reports/journey-source1.json) · [fotos](../../design/purchase-journey/reports/photo-source1.json) · [calidad](../../design/purchase-journey/reports/quality-source1.json).

Pruebas de ajuste final: 12/12 casos y 20 escenas de Inicio. Solo cambia el estilo condicional de los dos botones sin icono; los otros 99 inputs de app coinciden con e1c3. La primera ejecución del test visual se conserva con su fallo de espera prematura; la espera corregida no retira aserciones. No se cuenta esa prueba como una corrección del guardado de la app ni se oculta el intento.

CI: fuente funcional 43740593411/43740572473 y fuente final 43742182685/43742036925 correctas. Se comprobaron tipos, unitarias, catálogo público, 51 Python, dependencias, compatibilidad Expo y export web. La consulta npm registrada reportó cero avisos conocidos; no es una garantía absoluta de seguridad. [Registro CI](../../design/purchase-journey/reports/github-actions.json).

Exportaciones: web, iOS y Android correctas sobre la fuente final. El web generado por `--platform all` difiere del export separado `--platform web`; ambos hashes se registran y no se intercambian. Staging utiliza exclusivamente el web-only SHA-256 `c63325e3c0d348724ad2b3df7e5a44935091bcf6e84e116e6fd11554212d7719`. Los HBC no acreditan binario instalable, firma, TestFlight o ejecución nativa. [Artefactos](../../design/purchase-journey/reports/native-exports.json).

Preview: `dpl_7KXWuSpNMkaD3J2RhpP5XvcRtTjs`, READY/staging y protegida. Origen https://jj-compra-inteligente-ghuhsqz6a-cmj2hwhc6b-1051.vercel.app. Verificación real del 16/11: cuatro idiomas, 127 recetas y 19 recursos/URLs por hash. WebKit 375/430: 16/16 recorridos de ambas entradas y 8/8 controles de Inicio correctos. Sin fallos, omisiones, intermitencias o reintentos en estas ejecuciones publicadas. [HTTPS](../../design/purchase-journey/reports/hosted-verification.json) · [recorridos publicados](../../design/purchase-journey/reports/hosted-journey.json) · [Inicio publicado](../../design/purchase-journey/reports/hosted-home.json).

Acceso: enlace privado temporal por conversación hasta **17/11/2026 20:36:40 UTC**. Se renovó únicamente el acceso anterior caducado. Los originales privados y datos del propietario no se incluyen en el repositorio o paquete web. Vercel gestiona el acceso temporal; el token queda fuera del repositorio, bundle e informes públicos. No se cambió el código durante la renovación. [Despliegue](../../design/purchase-journey/reports/deployment.json).

Diferencia visual y accesibilidad: accesos compactos de Inicio y tres pasos de planificación con componentes/tokens existentes. Altura uniforme, texto completo, etiquetas accesibles y Crear lista visible comprobados a escala normal. Capturas reales privadas, independientes de las maquetas previas. La composición compacta sigue sujeta a revisión humana; no se atribuye aprobación por silencio.

Conservación: 100 hashes de cada fuente vinculados por `git show`; 28 archivos protegidos comprobados. La revisión independiente es de lectura, no otra ejecución de las pruebas. Tres matrices adicionales de una candidata intermedia se mantienen privadas y no se suman al resultado final. [Revisión](../../design/purchase-journey/reports/independent-review.json) · [verificación global](../../design/purchase-journey/reports/verification.json).

Pendientes y riesgos: aceptación del propietario y dispositivo físico; originales de fotos B04; excepciones B03; independencia externa de 01.1. N comidas y categorías no auditadas no se anuncian disponibles. Precios actuales, comparación real de cesta y backend/RLS nuevo no se certifican desde esta entrega. No hay dependencias, servicios de pago, autenticación o migraciones añadidas.

Estado y siguiente paso: **B05.1 PROBADO_AUTOMATICAMENTE, PUBLICADO Y LISTO PARA REVISIÓN DEL PROPIETARIO**. Auditoría técnica B04/B05 registrada con sus fuentes y límites; no equivale a cierre de B04 completo o del proyecto. Probar ambas entradas en el iPhone y registrar la aceptación o incidencias. No se abre B06 automáticamente, no se fusiona main y no se promueve producción. El cierre documental posterior conserva intacto el código y el export probados.
