# JJ Compra Inteligente | B06: Orden ejecutable para Codex
Fecha: 2026-11-12. Estado: plan aprobado por propietario; implementación y pruebas pendientes.

## Objetivo
Llevar precios reales, autorizados, actualizables y verificables a la app existente JJ Compra Inteligente, en Tenerife. DOS FRENTES PARALELOS: (A) fuentes abiertas y (B) solicitudes comerciales a los supermercados. No rediseñar la app, no alterar fotos ni 150 recetas, ni cuentas, listas o presupuestos. No hay pago ni carrito transaccionado en JJ.

Leer ANTES DE ACTUAR: AGENTS.md, README, docs/PLAN_Y_ESTADOS.md, docs/DECISIONES_Y_RIESGOS.md, issue #13, issue #14, PR #11, y comprobar ramas PR #4, #7, #8 y #10. Codex es responsable de programar. No fusionar PRs concurrentes sin revisar diff y tests.

## B06-A1: Auditoría de fuentes abiertas, primero SIN alterar código, base de datos ni producción
- tuTándem: https://tutandem.es/datos ; comprobar en vivo CSV https://tutandem.es/datos/cesta-diaria.csv y datapackage.json. Verificar código HTTP, content-type, cabeceras CSV (fecha, producto, nombre, grupo, unidad, cadena, precio_por_unidad_eur), fechas reales, número de productos/cadenas/filas, licencia CC BY 4.0 publicada, atribución y derechos de procedencia. El portal indicaba generación 03/11/2026 al revisar el 12/11. Si el archivo está caducado, mostrarlo únicamente como histórico. Son MEDIANAS por cadena, no PVP por referencia o tienda Tenerife. No usar como cesta comercial completa ni ranking de tiendas cercanas.
- Open Prices: https://openfoodfacts.github.io/open-prices/guides/data/ y https://prices.openfoodfacts.org/api/docs . Consultar documentación real de endpoints y parámetros antes de programar; contar observaciones recientes verificables de tiendas Tenerife con location/OSM, fecha, fuente/justificante, cadena y GTIN. Si cobertura cero, reportar cero, no extrapolar precios peninsulares. Comprobar licencia ODbL, atribución y obligación de compartir base derivada; evitar mezclar automáticamente con datos comerciales propietarios si no hay compatibilidad.
- Registrar por fuente: permiso explícito, licencia, URL, fecha, lugar/CP, formato, filas/GTIN, respuestas HTTP reales, caducidad y estados APPROVED / NEEDS_REVIEW / BLOCKED / STALE. Sin permiso aplicable => adaptador no habilitado.
- Guardar diagnóstico reproducible y conclusiones en PR documental. Sin ejecución real, estado PENDIENTE, nunca OK.

## B06-A2: Implementación de backend SÓLO para fuentes APROBADAS
- Proyecto Supabase existente JJ Compra Inteligente: fuarodipasfomhhrcsov (eu-central-1). NO tocar proyecto Tenerife Go ni tablas protegidas B07 jj_households, jj_shopping_lists, jj_shopping_items. Crear migraciones nuevas y aisladas para fuentes, snapshots, precios publicados y errores; RLS para cualquier tabla en schema exposed; escritura solo backend.
- Adaptadores aislados por proveedor con dominio allowlist y sin proxy abierto; timeouts, backoff limitado, ETag/If-Modified-Since si existe, controles de volumen y tipado. No scraping de webs comerciales sin permiso ni endpoints privados / bypass.
- Validación del esquema, precio positivo, unidad, fecha, moneda, variación extrema, caída de cobertura y duplicados antes de publicar un nuevo snapshot. Si falla, conservar último snapshot válido marcado STALE; no introducir datos inventados ni ceros.
- API de lectura propia JJ (versionada) para app Expo/web. No consultar sitios de supermercados desde iPhone. Carga paginada, caché y ausencia sin errores, procedencia/licencia/fecha y alcance geográfico. No incluir secretos. No pagos.
- Usar modelo en docs/B06_CONTRATO_DATOS_PRECIOS_V1_2026-11-12.md. No sumar componentes de pago sin aprobación y justificar frecuencia de refresco según fuente.
- Revisar la implementación PR #11 (parser CSV, API Vercel, pantalla) pues NO se ha verificado funcionamiento. Reutilizar interfaz y corregir su capa de datos. No mezclar historial de tickets con PVP actual.
- Pantalla de comparación: marcas/cadenas seleccionadas, precios disponibles con fecha/alcance y fuente, cobertura, cupón vs PVP, no datos disponibles y modo offline. No ranking "más barata" sin cesta completa real para esa tienda.
- Conexión postal y radios 5/10/20/personalizado del issue #14, DESPUÉS de tener localización demostrada y PVP por tienda. Media por cadena no sirve para diferenciar Los Cristianos de Los Gigantes.

## B06-B1: Acuerdos comerciales, en paralelo
- Preparar contactos con DINOSOL (HiperDino, SuperDino, Express), Lidl, ALDI, Mercadona. Usar docs/B06_BORRADORES_SOLICITUD_FEEDS_2026-11-12.md.
- Los borradores requieren aprobación del propietario. NO enviarlos automáticamente ni registrar SENT si nadie envió.
- Preguntar expresamente: API/CSV/SFTP o export periódico, licencia/autorización escrita para reutilización comercial, comparación con terceros, caché/retención, SKU/GTIN y tamaños, PVP final con IGIC, stock, ofertas/cupones, CP y tienda/centro online, frecuencia, SLA y costos, uso de marca/fotos.
- Propuesta de piloto negociable: 30-50 productos básicos, 2-3 establecimientos o zonas de Tenerife, actualización diaria o la frecuencia que concedan; sin pago/cuentas de usuario/checkout.
- Registrar cada respuesta con autorización y condiciones, sin publicar datos personales de contacto. Nunca activar feed comercial por haber recibido una respuesta informal.

## Orden de ejecución por bloques independientes
1. B06.1 Auditoría real y cobertura Tenerife; entrega informe/issue. No codificar en bloque auditoría según AGENTS.md.
2. B06.2 Un adaptador abierto autorizado + snapshot Supabase + endpoint propio; PR de backend + tests. Si los datos son viejos, mostrar histórico sin reclamar actualización.
3. B06.3 Conectar pantalla JJ a API, mantener selector y flujos, test Safari/WebKit e i18n ES/EN/FR/DE.
4. B06.4 Solicitudes y piloto de feed oficial tras permiso escrito. Se puede preparar envíos en paralelo pero el usuario autoriza enviar.
5. B06.5 Staging Vercel verificada, nunca producción sin instrucción; actualizar PLAN_Y_ESTADOS y DECISIONES_Y_RIESGOS con hechos, pruebas, commit, cobertura y pendientes.

## QA obligatoria
npm ci; npm run check; npm run verify:i18n; npm run build:web; npm run test:web cuando sea posible; pruebas Supabase RLS/anon. Casos HTTP 200/304/403/timeout, esquema cambiado, CSV inválido, 0 filas, caída de 50% cobertura, fechas futuras/expiradas, duplicados, cambio de CP/isla, tienda física vs almacén online y promociones condicionadas. Caída de una fuente no puede romper recetas/lista ni borrar snapshots anteriores. Demostrar visibilidad de la fuente/fecha y ausencia de ofertas falsas.

## Resultado medible, no negociable
- Datos y permisos auditados con evidencia; 0 scraping no autorizado.
- Adaptador y backend resistentes, en PR separado con pruebas; datos aislados B07.
- JJ muestra precios de fuentes realmente disponibles y avisa cuando no hay datos actuales.
- Informe por cadena con número de productos locales verificables y última fecha, aunque sea 0.
- 4 comunicaciones comerciales preparadas; envío pendiente de aprobación.
- Staging URL READY comprobada o impedimento preciso, no una URL inventada.

Enlaces: issue #13 https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/13 ; issue #14 https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/issues/14 ; PR #11 https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/11 .
