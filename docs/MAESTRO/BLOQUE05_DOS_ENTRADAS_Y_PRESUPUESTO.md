# JJ | Bloque 05.1 · Empezar por recetas o por presupuesto

Fecha de preparación: 15/11/2026. Base conservada: `6301575974c056bd2ca8d0c2055631cd71654e85`. Rama: `codex/bloque05-recetas-presupuesto-2026-11-15`.

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

La candidata conserva un manifiesto de 100 hashes de entradas de aplicación para vincular después sus ejecuciones al commit publicado. El SHA de origen final, PR, CI y despliegue todavía deben registrarse: no se atribuye una prueba a un commit que aún no existía cuando se ejecutó.

**Navegador y exportaciones completas: pendientes de resultado.** La nueva suite prepara 48 casos, cuatro por idioma en Chromium de escritorio y WebKit 375/430. Comprueba ambos recorridos, importes nuevos frente a presupuestos existentes, raciones con menú previo, edición/regreso, selección 0/1/varias/todas, siete documentos, favoritos, errores y doble activación. Los contextos y datos de prueba son temporales; los artefactos permanecen privados y las trazas de enlaces temporales se desactivan.

La auditoría completa de la pareja **B04/B05** está en ejecución e incluirá las regresiones aplicables, tipos, unitarias, Python, dependencias, exportaciones y pruebas visuales/accesibilidad. Sus recuentos, fallos u omisiones y fuentes exactas deben incorporarse cuando termine. No se cuenta como superada antes de disponer del resultado. WebKit con tamaño móvil y exportar iOS/Android no acreditan prueba física, binario firmado, TestFlight o aprobación humana.

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

**B05.1 EN_CURSO:** código de los dos recorridos implementado, validación estática/unitaria acreditada y pruebas de ejecución en curso. Publicación GitHub, CI y nueva staging pendientes de resultado. La entrega solo podrá pasar a PROBADO_AUTOMATICAMENTE al vincular el árbol final con sus comprobaciones y verificar la preview. La aceptación del propietario y la prueba física continúan separadas.

B05 completo conserva como pendientes el número variable de comidas, las categorías que necesiten auditoría de fuente y la aceptación del recorrido por el propietario. No se inventan categorías ni se amplía el catálogo para cerrar un contador. La disponibilidad de precios y la comparación real de cesta dependen de los Bloques 07/08 y no se habilitan desde este bloque.

B04 sigue pendiente de originales V38–V83: cero fotos aprobadas o publicadas. B03 mantiene las excepciones y su frontera privada; B02 físico y la independencia externa de 01.1 siguen abiertos. No se abre B06 automáticamente, no se fusiona main, no se promueve producción y no se comprometen servicios de pago.

Siguiente acción exacta: resolver cualquier fallo de las matrices en curso, repetir solo lo que corresponda al cambio final, registrar la auditoría B04/B05, subir el código comprobado a GitHub y publicar/verificar la staging de ese mismo origen. Después, solicitar la revisión del propietario sin declarar cerrados sus criterios pendientes.
