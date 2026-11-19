# B06.1 · Auditoría real de fuentes abiertas para JJ

Comprobación: **13/11/2026, 15:12–15:17 UTC**. Encargo [issue #17](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/17), plan/contrato del [PR #16](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/16), commit `95686b3ac4541f7179ee7cfd858be97628d4be99`. **Auditoría realizada; integración y comparador conectado no realizados.** No se modifica código de app, BD, producción ni se crea preview B06.

**Resultado:** ambas fuentes responden y publican licencias, pero ninguna acredita precios PVP actuales útiles de Tenerife para el comparador JJ. Las dos quedan `needs_review`, `enabled=false`; uso como PVP local actual `blocked`. La ventana «menos de siete días» es 07–13/11/2026 inclusive por fecha de observación.

## tuTándem

URLs oficiales comprobadas: [portal](https://tutandem.es/datos), [datapackage](https://tutandem.es/datos/datapackage.json), [CSV](https://tutandem.es/datos/cesta-diaria.csv). Todas HTTP 200. El CSV es UTF-8, 91.320 bytes. Cabeceras reales: `fecha, producto, nombre, grupo, unidad, cadena, precio_por_unidad_eur`; coinciden exactamente con el datapackage. **1.471 filas, 28 productos, cinco cadenas, 14 fechas**, 21/10–03/11/2026. Cero filas inválidas, celdas vacías o claves fecha/producto/cadena duplicadas; precios decimales positivos; unidades `kg`, `L`, `ud`. El portal habla de 26 productos, mientras el CSV contiene 28: prevalece el conteo del archivo examinado.

La última observación del archivo es **03/11/2026, diez días antes** de esta auditoría. El datapackage tiene `version=2026-11-03`, `created=2026-11-03T16:27:30.168Z`. La fecha HTTP del 13/11 no hace recientes las observaciones. Mercadona tiene 364 filas/28 productos; HiperDino 238/18; Consum 324/25; bonÀrea 312/24; Dia 233/26. La última fecha de Dia es 29/10; las otras cuatro, 03/11. No hay ALDI ni Lidl, ni separación HiperDino/SuperDino/Express.

Son **medianas nacionales por unidad de referencias equivalentes de cada cadena**, como dice el campo del datapackage y el FAQ. No hay GTIN, tamaño/marca exacta de envase, tienda, isla o CP. Por tanto, **0 PVP Tenerife útiles de menos de siete días**. No sirven para cesta local completa ni ranking a 5/10/20 km. `AGGREGATE_MEDIAN / SPAIN_AGGREGATE / STALE` es el contrato posible para un indicador histórico, sujeto a revisión del alcance.

El portal y datapackage publican **CC BY 4.0** y autorizan expresamente copiar, transformar y usar comercialmente. Se leyó el [resumen oficial](https://creativecommons.org/licenses/by/4.0/) y el [texto legal](https://creativecommons.org/licenses/by/4.0/legalcode.en), HTTP 200. Atribución propuesta: **«tuTándem, precios del súper»**, enlace a `https://tutandem.es/datos`, enlace CC BY 4.0 e indicación de cambios. La licencia no da derechos que el licenciante no posea: el portal declara lecturas de webs públicas de cadenas, pero esta auditoría no demuestra acuerdos escritos con retailers ni concede permiso de scraping a JJ. JJ solo solicitó los ficheros abiertos publicados, sin acceder a retailers.

**Defecto real relevante para PR #11:** con `Origin: https://jj-compra-inteligente.vercel.app`, el CSV devuelve HTTP 200 pero `Access-Control-Allow-Origin: https://tutandem.es`. Esa cabecera no autoriza a JS de Vercel a leer el CSV. El fallback directo web es incompatible con la respuesta observada. Un cliente HTTP que recibe 200 no demuestra que Safari/web pueda leerlo; no se repara en este bloque.

## Open Prices

Se leyeron la [guía oficial de datos](https://openfoodfacts.github.io/open-prices/guides/data/) y [Swagger](https://prices.openfoodfacts.org/api/docs), ambas 200. Swagger enlaza realmente `/api/schema`; esquema OpenAPI recibido 200. Se usaron únicamente filtros de `/api/v1/prices` documentados en ese esquema: `lat`, `lon`, `radius_km`, `date__gte`, `date__lte`, `location_id__in`, `size`, `order_by`.

Consulta reproducible de un círculo que contiene Tenerife:

`https://prices.openfoodfacts.org/api/v1/prices?lat=28.28&lon=-16.57&radius_km=65&size=100&order_by=-date&date__lte=2026-11-13`

**27/27 observaciones, una página completa, siete lugares.** Todas tienen EUR y prueba referenciada: 25 `PRICE_TAG`, dos `RECEIPT`; no se descargan imágenes ni se publican nombres de contribuidores. Hay 27 códigos de producto, 26 con forma y checksum GTIN válidos; el código de 24 dígitos del registro Alcampo no se trata como GTIN equivalente. La fecha más reciente es **03/10/2026**; las demás son de enero/abril de 2026 o junio/agosto/septiembre de 2024. Ninguna es PVP garantizado actual.

Añadiendo `date__gte=2026-11-07` la API responde **HTTP 200, total=0**, `items=[]`, una página completa. El filtrado local de las 27 observaciones históricas confirma ese cero. Una tercera consulta con los siete IDs de lugar (`928,7482,5115,769,525,5641,5621`) y el mismo intervalo también devuelve **200/0**.

| Cadena/formato | Observaciones históricas | Lugares | Última observación | Productos/precios útiles <7 días |
|---|---:|---:|---|---:|
| lidl | 1 | 1 | 2024-08-08 | 0 |
| aldi | 0 | 0 | — | 0 |
| hiperdino | 1 | 1 | 2026-01-30 | 0 |
| superdino | 0 | 0 | — | 0 |
| hiperdino-express | 7 | 1 | 2026-04-06 | 0 |
| mercadona | 16 | 2 | 2026-04-04 | 0 |
| Alcampo | 1 | 1 | 2026-10-03 | 0 |
| Anambra | 1 | 1 | 2024-06-06 | 0 |

Se mantiene **HiperDino Express separado de HiperDino** usando el nombre específico del lugar, aunque la marca agregada diga HiperDino. No se inventa SuperDino ni se traslada la tarifa entre formatos.

Comprobación independiente del [export oficial diario de lugares](https://prices.openfoodfacts.org/data/locations.jsonl.gz), enlazado por la guía: HTTP 200, 1.251.866 bytes comprimidos, **7.881 lugares**, 7.333.611 bytes decodificados; `Last-Modified: 12/11/2026 23:11:30 UTC`. Se revisó todo el export: caja lat27,98–28,65/lon−16,95–−16,07 y país ES + CP38000–38699. Los mismos **siete lugares**; ninguno con coordenadas ausentes, suma `price_count=27`. IDs coincidentes con las 27 observaciones vivas. Se excluyeron 259 coincidencias postales de otros países: los dígitos del CP por sí solos no demuestran Tenerife.

Es un recuento del API público y del snapshot disponible, no una prueba de contribuciones no publicadas, recién añadidas sin localización, borradas o futuras. El círculo puede abarcar mar/otra isla; los 27 resultados concretos se comprobaron por coordenadas, país, CP y localidad en Tenerife. No se extrapola cobertura desde España.

La guía oficial aplica **ODbL** a los datos. Se consultó el [texto ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), HTTP 200: permite uso comercial (3.1), exige conservar atribución/licencia (4.2–4.3), `share-alike` de bases derivadas usadas públicamente (4.4) y oferta de base/alteraciones o método en formato legible por máquina cuando corresponde (4.6). No mezclar una base derivada ODbL con datos comerciales no liberables; una futura arquitectura debe separar snapshots/licencias y revisar compatibilidad. ODbL de la base no concede automáticamente derechos sobre imágenes individuales. **AGPL-3.0 del `info.license` OpenAPI es la licencia del código API, no de la base de precios.** No se declara permiso comercial de una cadena por existir un dato comunitario.

## Recomendación y siguiente paso

- **tuTándem:** `needs_review`, desactivado para PVP local. Puede estudiarse un adaptador de **indicadores históricos nacionales**, atribuido, separado de precios por SKU/tienda y sin mensaje de actualidad. La licencia declarada habilita comercialmente ese material agregado, con las condiciones y límites indicados; revisar procedencia/alcance antes de aprobar B06.2.
- **Open Prices:** `needs_review`, desactivado para PVP local actual por cobertura reciente cero. Puede estudiarse archivo histórico/comunitario con ODbL, sin ranking/cesta exacta, tras resolver diseño de separación y oferta de base derivada. No afirmar que el dataset JJ es ya compatible ni que «open» significa sin obligaciones.
- **B06.2 no queda aprobado por esta auditoría.** El [issue #18](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/18) exige revisar fuente/licencia antes de implementar. Para PVP Tenerife reciente hace falta una fuente autorizada con cobertura real o acuerdos escritos. Los borradores comerciales existentes se pueden preparar; nadie debe enviarlos automáticamente.
- La revisión estática de PR #11 se entrega en el informe del repositorio; no se fusiona código sin compilar/probar ni se corrigen bugs dentro de B06.1.

## Evidencia reproducible

Evidencia pública de esta auditoría: `http-manifest.json` (URL, HTTP, UTC, tamaño, hash y cabeceras seleccionadas), `coverage-summary.json` (conteos agregados) y `source-decisions.json` (estados y condiciones). Se excluyen muestras de precios, localizaciones por fila, cuerpos originales, imágenes y contribuidores. La revisión estática del código propuesto se entrega en `REVISION_REPOSITORIO_TIENDAS_2026-11-13.md`.

Para reproducir, solicitar con GET las URLs de la tabla y las tres consultas API documentadas, conservar los archivos en un directorio nuevo y comparar SHA-256, cabeceras, columnas, fechas y recuentos. La consulta reciente añade `date__gte=2026-11-07` y `date__lte=2026-11-13`; la consulta por lugares utiliza `location_id__in=928,7482,5115,769,525,5641,5621`. Comprobar el `total` y toda la paginación; el resultado examinado cabe completo en una página. Para el export de lugares, descomprimir gzip como datos JSONL y contrastar geografía, país y CP; no ejecutar contenido remoto. CSV, export y API pueden cambiar: una repetición con otros hashes corresponde a otra auditoría, no reemplaza este registro fechado. Los scripts de análisis y cuerpos originales permanecen en evidencia local, fuera del repositorio.

Un intento inicial sin permiso de red no pudo conectar al proxy; las verificaciones reales posteriores sí respondieron 200 fuera de ese aislamiento, manteniendo proxy/CA y sin credenciales. Una ruta inferida de guía `/api/` devolvió 404; se descarta y no se utiliza para diagnosticar falta de API: Swagger, esquema y endpoints documentados sí funcionan. No se han cambiado permisos/red, solicitado servicios de pago ni accedido a webs de supermercados.

| Recurso | HTTP | Bytes | SHA-256 |
|---|---:|---:|---|
| cc-by-legalcode | 200 | 48742 | `58230517b7895aa219ff46a6ed63e67057a1582fb9ea054b16728a8c13525650` |
| cc-by-license | 200 | 31950 | `8dda1ccec4be91fc80821d4e4fd5c568072b9a3a74b2fdc07c249a27e920ef01` |
| odbl-license | 200 | 51176 | `b8d8aebb21bf405f93f6e21bbf0d8f0a749844f9812ec58692f189add6402b47` |
| openprices-api-docs | 200 | 4668 | `62bcdcabb917c9b67ee780433ef8af11dd0d7aa3286752f68541c6c74f3a55e7` |
| openprices-guide | 200 | 30579 | `7bc793a65dfdcdf3b13668c38b9c4f921d23bb68ed2f4038af20b90c0fa2c0f2` |
| openprices-location-export | 200 | 1251866 | `622e975df65208caf87c7a129c03e93b69bc3a54f477e2d36d52abbe443315c7` |
| openprices-schema | 200 | 255595 | `ea4e5d0f9b2aa98439aff8874664a52c497d5f10c806f7afe49b60342ad38d2e` |
| openprices-seven-locations-recent | 200 | 52 | `75b8f59fade12bce67759bb50eea5325585458036865229ddeaa07f6403ac220` |
| openprices-tenerife-circle-all | 200 | 83965 | `1a87167e419dc3c82994be2a7b23c4360af4ce43757a61da1a6abb550cfd5ef5` |
| openprices-tenerife-circle-recent | 200 | 52 | `75b8f59fade12bce67759bb50eea5325585458036865229ddeaa07f6403ac220` |
| tutandem-csv | 200 | 91320 | `c55a53dda608b2b98a602e8ed33dc512434776eaced35307d3c8280cbd393d76` |
| tutandem-datapackage | 200 | 3181 | `3d958b76f92582407927b650ecd6db577c3c270a7ef64885abed0e5a3913ba96` |
| tutandem-origin | 200 | 91320 | `c55a53dda608b2b98a602e8ed33dc512434776eaced35307d3c8280cbd393d76` |
| tutandem-portal | 200 | 39247 | `a8a2d6a423271040d411fd554b69ac5038e0d7f2eb11b67cdfe926824cc773ae` |


## Alcance de la entrega documental

El plan aprobado del PR #16 pide explícitamente «Guardar diagnóstico reproducible y conclusiones en PR documental». Esta entrega contiene únicamente ese informe y evidencia agregada: no modifica aplicación, pruebas de producto, dependencias, base de datos, producción ni crea una preview B06. Los borradores comerciales siguen sin enviar. B06.2 queda pendiente de revisión de fuente, permiso aplicable y semántica histórica/local.
