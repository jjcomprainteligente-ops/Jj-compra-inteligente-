# JJ B06 | Contrato de precios v1 y checklist de pruebas
Fecha: 2026-11-12. Estado: especificación de producto para Codex, no API verificada ni feed activo.

## Prohibiciones y distinciones
- Un PVP actual con SKU y sucursal, una mediana nacional y un ticket histórico SON TIPOS DISTINTOS. No utilizar medias para afirmar importe de una cesta en Los Cristianos o Los Gigantes, ni que una cadena es más barata a 5/10/20 km.
- Un precio desconocido ES NULL, no cero ni estimación automática. La cesta es COMPLETE solamente cuando TODOS sus artículos tienen equivalencia/formatos y PVP aplicables al mismo punto de venta y misma condición comercial.
- No asumir misma tarifa entre tienda HiperDino, SuperDino y Express ni entre canal online y físico. Los CP pueden cambiar el servicio online, no necesariamente todas las tiendas.
- Fecha del feed actualizada ≠ fecha de observación del precio. Registrar ambas.
- Las condiciones de las webs de retailers no autorizan extraer sistemáticamente precios; feeds comerciales solo tras permiso escrito.

## Modelo propuesto a validar por Codex
Fuente: source_id, source_name, legal_basis, license_url, attribution_url, permission_scope, commercial_reuse_allowed, automatic_access_allowed, last_checked, enabled, disabled_reason.
Observación: observation_id, source_id, source_record_id, product_code/GTIN opcional, name, brand, pack_size, pack_unit, chain_id, format, store_id opcional, island opcional, postal_code_scope opcional, channel, currency EUR, package_price_cents nullable, base_unit_price_cents nullable, base_unit kg/L/ud, price_kind, date_observed, date_valid_from/to, source_url, license, confidence, snapshot_id.
Price kind ENUM: CURRENT_SKU | OBSERVED_HISTORIC | AGGREGATE_MEDIAN | CONDITIONAL_PROMO | USER_ESTIMATE.
Scope ENUM: EXACT_STORE | ONLINE_FULFILLMENT_AREA | POSTAL_CODE | ISLAND | CANARY_REGION | SPAIN_AGGREGATE | UNKNOWN.
Freshness ENUM: CURRENT | STALE | EXPIRED | UNKNOWN.
La plataforma no debe mostrar precios de retail en un ámbito más específico que el documentado por la fuente.

## Contrato API público (propuesta)
GET /api/prices/v1?chains=...&postcode=...&limit=...
Respuesta: contract_version, snapshot_id, published_at, upstream_status por fuente (ok/invalid/stale/blocked), prices[], coverage total_items/priced_items/status y warnings[]. Límites de paginación y selección de cadenas. Nunca aceptar URL arbitraria, clave privada, dirección personal o identificación de usuario en el endpoint. El backend devuelve 200 con prices=[] y estado de fuente cuando legal o técnicamente no hay precios, en lugar de falsos 0 €. Errores propios HTTP 4xx/5xx sin hacer caer pantallas de recetas/listas.

## Cálculo y geografía
SKU igual solo con GTIN y formatos comparables. Ingrediente genérico necesita verificación de equivalencia; unidades g/kg, ml/L y ud con redondeo a envase vendido. Comprobar promos por cantidad y cupón antes de aplicarlas. Comparación exacta por tienda: todos los renglones cubiertos y frescos, mismo canal/CP; empate/desconocido como estado explícito.
Geocodificación de CP y 5/10/20 km requiere dataset con licencia y geometría verificable. Etiquetar distancia aproximada en línea recta si no hay rutas por carretera. No pedir GPS ni calle obligatoria.

## Control de calidad de fuentes
- HTTP 200 esperado; 304 conserva snapshot; 403, 429, 500, timeout y redirección de dominio inesperado: capturar incidencia sin sobrescribir datos buenos.
- CSV: esquema, BOM, comas entre comillas, filas duplicadas, tamaño máximo, valores vacíos, unidades inválidas, cifras negativas, fechas futuras, fecha caducada, caída súbita de cobertura, miles de artículos nuevos inesperados.
- Revisión de condiciones: si una fuente elimina la licencia o prohibe un uso previo, disabled y evidencia; desconectar sin romper producto.
- Snapshot publicación atómica idempotente; última instantánea buena conservada visible SOLO con indicación de antigüedad, excluida de recomendaciones de actualidad.
- API/backend: ninguna escritura anon, RLS o API con autorización, sin fugas de datos privados, sin secretos en cliente, sin logs con postcode+usuario juntos.
- UI: móvil Safari, errores offline, español/inglés/francés/alemán, 1/varias/todas, 0 cobertura, precios de zona incompatible, sin acceso a web de retailer desde teléfono.

## Gate de publicación
No aprobar hasta presentar: URLs oficiales de licencia, conteos reales de registros Tenerife por cadena, fecha de observación más reciente, licencias, resultados de npm run check, npm run build:web, npm run test:web y pruebas de backend/RLS, PR revisado, captura y staging verificable. Si los datos abiertos solo ofrecen medianas nacionales, el éxito del bloque puede ser un módulo de indicadores con atribución, NUNCA un comparador de cesta local real.

Fuentes oficiales de las licencias a validar: https://tutandem.es/datos y https://openfoodfacts.github.io/open-prices/guides/data/ .
