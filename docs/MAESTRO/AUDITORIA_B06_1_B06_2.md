# Auditoría de pareja B06.1 / B06.2

**B06.2 publicado y auditado · 26/11/2026:** zona opcional por CP/localidad, radios 5/10/20 o enteros1–100 y ubicación puntual voluntaria. Directorio parcial: 209 referencias de localidad, seis fichas comerciales, cinco puntos publicados y uno pendiente. [PR #34](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/34), fuente `37a5979`, CI de fuente correcta. **2.358 unitarias, 178 Python y 122 casos locales**; staging protegida: cuatro idiomas/319 recursos y 32 casos WebKit correctos. Mantiene los 428 inputs probados, recetas/fotos y siete documentos; sin precios conectados. [Informe](BLOQUE06_2_CP_Y_DISTANCIAS.md). Acceso temporal por conversación hasta **27/11/2026 22:49:28 UTC**. B07 y la aceptación visual/física siguen pendientes; no se fusionan main ni las PR anteriores.

## Preparación conservada anterior al cierre

Preparación: 26/11/2026. Estado: controles locales en cierre; publicación todavía pendiente.

## Alcance y conservación

B06.1 aporta seis fichas de cadenas oficiales, cuatro formatos presentes y cinco puntos publicados.
La ficha SuperDino 162 mantiene el CP conflictivo 38436 como pendiente y sus coordenadas observadas
solo como evidencia, sin activarlas. B06.2 añade referencias aproximadas de localidad, radio y consulta
voluntaria al dispositivo. No amplía el inventario comercial ni valida precios o entregas.

Se contrastan hashes contra los 2.059 archivos del cierre B06.1. No falta ningún archivo anterior.
Los cambios de código existentes se limitan a diez archivos de integración, dependencia/configuración,
traducciones y CI; los dominios, fuentes y pruebas nuevos son aditivos. Las 150 recetas V3, siete recetas
anteriores, 150 originales fotográficos y 300 derivados mantienen sus fuentes y bytes. La importación
V83/V3, la preparación editorial y la reproducción fotográfica forman parte de los controles.

## Controles

- Dominios geográfico y postal: snapshots estrictos, inputs acotados, fechas, fuentes/licencia,
  identidad única, coordenadas finitas, radio entero, límites inclusivos y desempate estable.
- Directorio: una/varias/todas/ninguna, formatos separados, dentro/fuera del radio, cobertura parcial,
  ninguna distancia para fichas pendientes, fichas oficiales y errores de apertura conservados.
- Privacidad: contexto en memoria, cero escrituras implícitas a los siete documentos, sin red desde
  la búsqueda local, cancelación por propietario y protección ante callbacks de GPS tardíos.
- Permisos: primera acción explícita, solo primer plano, cuatro descripciones y respaldo español;
  timeout global, permisos denegados, datos inválidos, otra isla y precisión/antigüedad acotadas.
- UI: cuatro idiomas, Chromium y WebKit a 375/430 CSS, capturas por segmentos, textos sin claves
  sin traducir, desbordamiento o recorte, objetivos de al menos 44 px y navegación existente.
- Seguridad: lockfile, compatibilidad Expo, avisos npm y escaneo con reglas predeterminadas.
  Se conservan la salida original y la clasificación de falsos positivos; no se añaden excepciones.

Los resultados finales y sus hashes se incorporarán al cerrar las ejecuciones. Se conserva cada intento:
el primer helper de pruebas sustituyó un `undefined` explícito; una prueba de recorrido intentó pulsar
«Quitar selección» cuando la selección ya estaba vacía; se corrigieron las pruebas. La comprobación
fotográfica exige Pillow 13.0.0, frente al 12.3.0 del sistema. Un intento de verificación global encontró
la restricción local de sockets del sandbox. No se relajó ninguna validación de aplicación para superar
estos casos. El reinicio del entorno se recuperó mediante archivos de evidencia, sin sustituir el trabajo.

## Límites pendientes

El inventario completo, fichas ALDI/Mercadona, aclaración del CP conflictivo y cobertura geográfica
restante siguen abiertos. No se infieren establecimientos, coordenadas, etiquetas dietéticas, precios
ni acuerdos comerciales. Las 300 decisiones editoriales V3 siguen pendientes del responsable editorial.

La aceptación visual/física pertenece al propietario. Las pruebas WebKit son de motor web y tamaño CSS,
no de Safari físico o app nativa firmada. La inspección de configuración no sustituye auditar los
manifiestos de release; las configuraciones heredadas de Expo deben revisarse para distribución.
El escaneo no cubre historial, ignorados, credenciales de ejecución ni interiores de ZIP y no demuestra
ausencia absoluta de vulnerabilidades.

B07 no comienza automáticamente. [Detalle B06.2](BLOQUE06_2_CP_Y_DISTANCIAS.md).

## Revisión de SDK en la misma entrega

El primer origen pasó 48 casos nuevos, 24 de B06.1 y 50 regresiones de tiendas/compartición.
La CI pasó unitarias, fuentes y auditoría pero bloqueó una recomendación online nueva de Expo.
Se mantienen el aviso y su salida, se actualizan Expo a 58.1.0 y Location a 58.0.23 y se conserva
la corrección de minimatch para fingerprint 0.22.0. Esta actualización no cambia el diseño ni los
documentos. El cierre final exige verificar otra vez el SDK, los permisos, el compilado y el navegador.


## Cierre publicado y auditoría de pareja · 26/11/2026

Fuente `37a5979d787ef50d17c88fd3bba67c51f0c4b40d`, árbol `81abe57100196794a8b819496708112db1a4f571`, [PR #34](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/34) apilada sobre #33. CI de fuente: push45910494891 y PR45910501746, ambas correctas. Local: **2.358 unitarias/43 archivos, 178 Python, 48 casos B06.2, 24 B06.1 y 50 de tiendas/compartición**; cero fallos, omisiones o intermitencias en las matrices finales. Fuentes V83/V3, fotos, selección editorial y referencias postales reproducidas. Se conservan las ejecuciones previas y los ajustes de pruebas; no se debilitaron controles.

Staging `dpl_AV1SFUdvc8Qz6rzFQzeW7G48rC1q`, READY y protegida: **cuatro idiomas/319 recursos HTTPS y 32 casos WebKit375/430 correctos**. Web SHA-256 `15750dba3b3d5c207a900c72361245ac1b8c5738adf8dadf94da75d487b3d2fc`, 428 inputs coincidentes. La exportación web independiente tiene 313 archivos; omite 308 duplicados exclusivos de la exportación nativa. Metro asigna IDs diferentes al grafo multiplataforma, por lo que se volvieron a probar los bytes de la exportación web concreta. La compresión Brotli preserva el contenido; TLS y CA no se relajan. Enlace temporal solo por conversación hasta **27/11/2026 22:49:28 UTC**.

Expo58.1.0, Location58.0.23 y corrección acotada fingerprint0.22.0/minimatch11.0.8: compatibilidad oficial online y npm audit **cero avisos**. El consumidor de patrones supera 24 comprobaciones. Gitleaks8.30.1 cubre la unión por hash de **2.092 archivos/265.310.372 bytes**: salida original1 por 17 falsos positivos de nombres de almacenamiento, cero secretos confirmados o sin clasificar; deltas ZIP y SDK con salida0. Reglas predeterminadas, redacción100%, sin excepciones. No cubre historial, ignorados, credenciales de ejecución ni interiores de ZIP, ni garantiza seguridad absoluta.

Auditoría técnica B06.1/B06.2 cerrada con límites explícitos: cobertura parcial, CP38436 pendiente, ALDI/Mercadona sin fichas comprobadas en este lote, 300 decisiones editoriales V3, aceptación visual/física y distribución nativa por realizar. Las ubicaciones son referencias aproximadas; no se verifican precios, existencias, rutas, reparto ni promociones. Native HBC/introspección no sustituyen revisar permisos reales, servicios y ATS del binario firmado. Main `daa3f09`, producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3` y protección `all_except_custom_domains` conservados. B07 no iniciado.

[Preparación](../../design/store-geography/reports/local-preparation.json) · [verificación publicada](../../design/store-geography/reports/verification.json). El cierre posterior es documental y conserva el compilado probado.
