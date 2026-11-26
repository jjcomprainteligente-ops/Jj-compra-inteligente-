# Auditoría de pareja B06.1 / B06.2

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
