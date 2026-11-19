# Revisión de aportaciones nuevas de tiendas/precios · 13/11/2026

## Hallazgo verificado en GitHub
La conexión devuelve un único repositorio accesible, `jjcomprainteligente-ops/Jj-compra-inteligente-` (público). Se buscaron repositorios por propietario, todos los accesibles y términos tiendas; no apareció un segundo. Eso no prueba que no exista un repositorio privado sin conectar. Sí hay aportaciones nuevas, inequívocas, dentro del repositorio canónico:

- [PR #16](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/16), rama `producto/b06-fuentes-precios-y-acuerdos-2026-11-12`, HEAD **95686b3ac4541f7179ee7cfd858be97628d4be99**. Tres commits documentales del 12/11 a las20:30–20:32UTC. Base anterior `2ae8d27`; no fusionar su árbol antiguo sobre el trabajo reciente.
- [PR #11](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/11), rama `feature/precios-abiertos-en-jj-2026-11-11`, HEAD **2562d98a46b9e5179b77d6590ec3b582ffd0d63d**. Código y e2e preparados pero su propia descripción reconoce que no se ha compilado/probado/desplegado. No constituye un feed funcional demostrado.
- [Issue #13](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/13): infraestructura de precios dentro de JJ, conectores autorizados, snapshots aislados, API propia y fallos independientes; incluye precisiones por cadena/CP/alcance.
- [Issue #14](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/14): CP real y radios5/10/20/personalizado; depende de ubicaciones licenciadas y precios locales demostrados. No basta prefijo38 ni mediana nacional para ranking local.
- [Issue #17](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/17): **acción inmediata B06.1, SOLO auditoría**, no código/BD ni preview de ese bloque.
- [Issue #18](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/18): B06.2 **bloqueado hasta que la auditoría confirme fuente y permiso/licencia aplicables**.

## Documentos exactos nuevos de producto (SHA95686b3)
1. `docs/B06_CODEX_PLAN_EJECUCION_FUENTES_PRECIOS_2026-11-12.md` · blob5b1529d2a76ff4fe18b8fd9d23f378c967b883d5. Orden de trabajo B06.1–B06.5, dos carriles (abiertos y acuerdos), controles, exclusiones y QA.
2. `docs/B06_CONTRATO_DATOS_PRECIOS_V1_2026-11-12.md` · blobb8c12c8115f079611ba3e30c186006d3d494c888. Contrato propuesto/versionado, source/observations, freshness, geografía, precio nulo, PVP/mediana/histórico/promoción, API y aceptación.
3. `docs/B06_BORRADORES_SOLICITUD_FEEDS_2026-11-12.md` · blob5dbacc3526acb3dee05f1d9ed2abc68140cb5f23. Cuatro solicitudes DINOSOL/Lidl/ALDI/Mercadona, todas DRAFT_READY, NO enviadas. Preparar no es permiso para enviar ni acuerdo conseguido.

El mandato operativo está en issues13/17 y el comentario final de13; el contrato y enum/API son especificaciones propuestas a validar por Codex. La afirmación documental de licencia no reemplaza comprobar los recursos actuales y procedencia. No activar una fuente por el mero texto del PR.

## Comparación con la app actual (096330d2, seguridad en PR19)
Ya están incorporados `src/domain/stores.ts`, `src/i18n/catalogs/storePilot.ts`, `StoresScreen` y su persistencia: Lidl, ALDI, HiperDino, SuperDino, Express y Mercadona, una/varias/todas, compra externa, favoritos anteriores conservados. Hay comparador manual con fecha/unidad/procedencia. No hay ingesta comercial automática ni API propia pública de precios, snapshots publicados ni mapas/CP/radios reales. Tampoco hay `PublicPriceCompareScreen`, `publicPriceFeed`, `PlanBudgetScreen` o `mealJourney` en esta app actual. El nuevo encargo pide avanzar desde esa base; repetir el selector no satisface issue13.

PR11 contiene nuevas entradas recetas/presupuesto y las rutas recetas→ingredientes→tiendas→comparación / presupuesto→tiendas→menús→comparación. Su UI puede conciliarse posteriormente conservando V2/i18n/guardado, tras auditoría y QA. No está autorizado atribuirle funcionamiento probado ni fusionar automáticamente una rama antigua.

## Revisión estática puntual de PR11 (sin ejecutar código)
Archivos leídos: `api/public-prices.js` (blob86d7d17a287686710af7057e90c01bceeb86b25e), `src/domain/publicPriceFeed.ts` (blob79f2b759bcdee323ccb1a519b3c4a16282d09fe4), `src/app/screens/PublicPriceCompareScreen.tsx` (blobd1cb328d1a5c2f85af1ca37cd9044090ffd225e3), `PlanBudgetScreen.tsx`, fragmentos de `ShoppingApp.tsx`, árboles completos de ambas ramas, commits/PRs/issues y comentarios13.

### API y cliente
- La API usa URL fija (no proxy arbitrario), GETsolo, timeout10s y caché de CDN. Son medidas útiles; no acreditan permiso o esquema.
- Descarga upstream con `await text()` antes de aplicar límite de2.000.000 **caracteres**, no límite de bytes/stream; hay exposición a respuestas excesivas antes de validarlas.
- Solo busca substring `precio_por_unidad_eur`; no valida CSV completo, content-type, número de filas, frescura, geografía, duplicados o snapshot antes de responder200. Un HTML con ese texto puede pasar.
- `fetch` sigue redirecciones por defecto; falta control de dominio final/redirecciones inesperadas requerido por el nuevo contrato.
- Sin staging privada, snapshot atómico, última buena, bitácora, ETag upstream, fuente habilitable o endpoint versionado propio. No equivale a la arquitectura pedida.
- `loadPublicPrices` intenta `/api/public-prices` y cae a CSV directo en web; nativo consulta CSV externo directamente. Contradice móvil→API propia y además introduce CORS/disponibilidad/múltiplesorígenes sin prueba.
- `reload` borra precios en fallo en vez de conservar última buena marcadaSTALE. No hay timeout/cancelación cliente, guard de petición antigua o cleanup al desmontar; son riesgos estáticos, no fallos de ejecución demostrados.
- `Linking.openURL` directo en esa pantalla no reutiliza la navegación externa comprobada del piloto; revisar noopener/noreferrer, foco y ausencia de filtración de datos al conciliar.

### Parser y semántica
- Entiende BOM, comas entre comillas y escape doble; no he verificado equivalencia con el CSV real ni ejecutado fixtures de esa rama.
- Fecha regex+Date.parse no rechaza todas las fechas calendáricas imposibles que JS normaliza. El parser admite fechas futuras; el filtro comparable las excluye para sumas pero siguen mostrándose en filas.
- Tamaño de texto limitado tras recepción; sin contrato explícito de número de filas, ancho/longitud de celdas, columna duplicada o integridad de snapshot. Omite filas inválidas silenciosamente y podría publicar pérdida masiva de cobertura sin aviso.
- Solo2cadenas y medianas €/kg/L/ud, sin GTIN/SKU/envase concreto/store/channel/CP/proof/license por registro ni geographic scope. No permite precios locales reales ni heredar HiperDino a SuperDino/Express.
- Suma parcial a partir de nombre exacto+unidad y mediana de cadena; aunque hay avisos, debe quedar apartado de comparación de cesta/SKU real. Igualdad de nombre no demuestra variedad/marca/calidad/paquete ni redondeo a envase vendido.
- `date` se renderiza ISO sin formateador local; nombres del CSV serían de la fuente, no traducciones de producto verificadas.
- `PlanBudgetScreen` limita cinco comidas y1–12personas, usa presupuesto provisional (no gasto). Su semántica declarada es correcta, pero queda pendiente probar tipos, persistencia y flujo sobre la app reciente.

## URLs concretas para B06.1 (no se han consultado en vivo por esta revisión estática)
- tuTándem portal/licencia: https://tutandem.es/datos
- CSV: https://tutandem.es/datos/cesta-diaria.csv
- Datapackage: https://tutandem.es/datos/datapackage.json
- Open Prices documentación/ODbL: https://openfoodfacts.github.io/open-prices/guides/data/
- Open Prices Swagger: https://prices.openfoodfacts.org/api/docs
- HiperDino catálogo/contexto: https://www.hiperdino.es/ y https://www.hiperdino.es/hiperdinoapp ; términos https://www.hiperdino.es/c9494/aviso-legal
- Lidl ofertas: https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402 ; Canarias https://www.lidl.es/c/lidl-plus-en-canarias/s10089416 ; términos https://www.lidl.es/c/aviso-legal/s10075786
- ALDI: https://www.aldi.es/folleto.html ; términos https://www.aldi.es/nota-legal.html
- Mercadona: https://www.mercadona.es/ ; ayuda CP https://ayuda.tienda.mercadona.es/hc/es/articles/360001935371--El-nuevo-servicio-de-compra-online-llega-a-mi-c%C3%B3digo-postal ; precios https://ayuda.tienda.mercadona.es/hc/es/articles/360000857491-Precios-de-los-productos-SPB

## Siguiente entrega pequeña
Cerrar primero la entrega de seguridad ya construida, conservando su procedencia y preview. Después B06.1/issue17: peticiones HTTP reales de recursos abiertos y documentación actual, medir esquema/fechas/licencia/procedencia, cobertura Tenerife reciente por cadena con localización/prueba. Evaluar viabilidad de acceso oficial de4cadenas sin extraer catálogos o sortear controles; falta de derechos→BLOCKED, falta de dato→0 solo cuando medido, fallo de acceso→NEEDS_REVIEWsin fingir0. Entregar informe con conteos y evidencia; no código/BD/preview B06.1. B06.2 se condiciona a resultados reales y reutiliza solo las partes revisadas compatibles del PR11. Mails no enviados, sin coste, sin tocar producción/B07.

Esta revisión solo leyó GitHub y archivos locales. No compiló/ejecutó PR11, no consultó fuentes de precios en vivo, no alteró app/BD, no hizo commits, no envió mensajes comerciales ni fusionó/publicó nada.
