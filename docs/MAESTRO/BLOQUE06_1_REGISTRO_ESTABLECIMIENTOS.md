# B06.1 | Registro de establecimientos de Tenerife

**Publicación verificada · 26/11/2026:** el lote parcial B06.1 está en [PR #33](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/33), fuente `d5df08290f12af3e85c4d64903194fd658bb7b84`, árbol `0e7db768896378afc3d9facb79857c8007343c8c`. CI de fuente correcta: push **45788870538** y PR **45789026496**. Staging propia protegida y READY, `dpl_DUhvSabd6ecAaNPL6FNyDRjr7d6z`: **cuatro idiomas/319 recursos por HTTPS y 16 casos nuevos WebKit 375/430 correctos**, sin fallos, omisiones o intermitencias. Web publicado SHA-256 `bce96bb188f2e1a5607c83d5376068bbdbd968cb71485eaabd7276dafc0bac5f`, los mismos 415 inputs probados. La cobertura permanece parcial: seis fichas, cuatro formatos, cinco puntos publicados y un CP pendiente; ALDI/Mercadona todavía sin fichas comprobadas en este lote.


**26/11/2026 · EN CURSO: código integrado localmente y primeras comprobaciones correctas; navegador, exportaciones, escaneo final, GitHub/CI y publicación pendientes en este checkpoint.** Se continúa sobre `9ef0c4ba06157b8351d0f4ba4c9a41818c5645bc`, cierre de B05.4, en la rama `codex/b06-1-establecimientos-2026-11-26`. La entrega se prepara apilada sobre el [PR #32](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/32), todavía sin fusionar en main. No se empieza de cero ni se fusionan ramas por este bloque.

## Diagnóstico y alcance

El selector anterior conservaba seis modalidades piloto, favoritos y enlaces oficiales, pero no un registro de sucursales con dirección, punto geográfico y procedencia propios. La consulta actual de GitHub sigue mostrando el repositorio canónico; no apareció un segundo repositorio de tiendas accesible a la conexión. Esto no demuestra que no exista uno privado sin conectar. Los documentos antiguos de fuentes y precios permanecen conservados.

Este **B06.1 del plan maestro es geográfico**. Es distinto de la auditoría histórica llamada B06.1 sobre fuentes de precios: [informe del 13/11](../auditorias/b06-1-2026-11-13/B06_1_AUDITORIA_FUENTES_2026-11-13.md). Aquella auditoría no se convierte ahora en un feed ni sus recuentos históricos en cobertura actual. El [plan maestro](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md) separa tiendas y geografía de la futura tubería de precios.

La entrega añade referencias trazables y su consulta desde **Perfil → Mis tiendas → Ver establecimientos**. La acción está disponible para las seis modalidades piloto sin exigir marcarlas como favoritas. Consultar o cerrar las fichas no cambia la selección. Los identificadores anteriores de favoritos, incluidos los conservados fuera del piloto, siguen legibles.

No se pide el CP de la persona usuaria, ubicación precisa o permiso GPS. Tampoco se calculan radios, distancias, rutas, tiempos de viaje, precios o disponibilidad. Esas funciones no se simulan mediante el registro de puntos.

## Registro parcial y fuentes

El [registro estático](../../src/data/storeEstablishments.ts) contiene **seis referencias de cuatro modalidades**, con **cinco ubicaciones publicadas y una pendiente**:

| Referencias | Modalidad | Estado |
|---|---|---|
| General del Sur y Quinto Centenario | Lidl | Dos puntos publicados en JSON-LD de sus fichas oficiales. |
| Los Venezolanos, ID 231 | HiperDino | Punto publicado en el mapa de la ficha individual. |
| Gigansol, ID 166 | SuperDino | Punto publicado en el mapa de la ficha individual. |
| Delfín, ID 11 | HiperDino Express | Punto publicado en el mapa de la ficha individual. |
| Los Gigantes, ID 162 | SuperDino | Pendiente por incoherencia de fuente; sin coordenadas en el registro de la app. |

**ALDI y Mercadona no tienen fichas actuales comprobadas en este lote.** La interfaz lo explica como falta de fichas revisadas; no afirma que no tengan tiendas. No es el inventario completo de ninguna cadena o de Tenerife, ni acredita establecimientos próximos a una persona usuaria.

Las seis fichas oficiales individuales respondieron HTTP 200 el 26/11. El [manifiesto de procedencia](../../referencias/tiendas/B06_1/source-manifest.json) fija URL solicitada/final, fecha UTC, tamaño, tipo y SHA-256 del HTML conservado privadamente. La extracción se limita al objeto `GroceryStore` de cada Lidl o al encabezado, dirección y contenedor `data-store` correspondiente en las fichas de Dinosol. Las opciones globales, otras tiendas o el pie de página no acreditan la ubicación del establecimiento leído.

La ficha de **SuperDino Los Gigantes, ID 162**, publica CP **38436** junto con Santiago del Teide. Se conserva ese valor sin corregirlo ni inferir otro. El punto observado queda solo en el manifiesto documental; la app guarda `pending / conflicting-source`, sin coordenadas. En pantalla el CP se rotula expresamente como **publicado y pendiente de comprobar**, separado de los datos presentados sin esa incidencia. La fuente requiere aclaración antes de utilizar el punto en un futuro cálculo de proximidad.

Las localidades solo se separan cuando están publicadas; si faltan permanecen nulas. Un punto `published` indica que figura en la ficha oficial revisada, no precisión geodésica certificada o comprobación física. País e isla pertenecen al ámbito revisado; no se deciden únicamente por los dígitos del CP.

Todos los registros son de canal **físico** y cobertura de precios **`NO_VERIFICADA`**. La existencia de la tienda no acredita reparto, servicio online o centro suministrador para un CP. HiperDino, SuperDino y Express conservan sus formatos y ámbitos distintos. No se reutilizaron OpenStreetMap, Open Prices ni snapshots históricos para completar estas referencias.

`FACTUAL_REFERENCE_ONLY` describe hechos mínimos y su procedencia. No declara licencia abierta, API de cadena, permiso de extracción de directorios o autorización comercial general. El [alcance de fuentes](../../referencias/tiendas/B06_1/README.md) recoge estas limitaciones. Los HTML completos, scripts, claves de terceros, cookies, teléfonos, productos y precios permanecen fuera de Git y del paquete de publicación.

## Comportamiento, idiomas y conservación visual

La consulta usa el [panel de establecimientos](../../src/app/components/StoreEstablishmentsSheet.tsx), montado desde la pantalla existente de tiendas. Muestra nombre, dirección, municipio/localidad publicados, canal, estado de ubicación, precio no verificado, fecha adaptada al idioma y acción para abrir la ficha oficial. Prepara los estados de registro vacío, catálogo indisponible y error al abrir una fuente. Los favoritos y los enlaces generales anteriores siguen disponibles.

Se reutilizan `Sheet`, tarjetas, botones, espaciados y tokens existentes de Verde Mercado Premium. El logo oficial y Manrope se conservan. La adición de una acción y un panel no constituye una nueva identidad visual ni una aceptación estética del propietario.

Los **24 textos nuevos** de [establecimientos](../../src/i18n/catalogs/storeLocations.ts) están centralizados en es/en/de/fr, incluidos accesibilidad, errores y el aviso de CP pendiente. Las fechas usan el formateador existente. No se cambia el respaldo español ni se anuncia una interfaz búlgara completa.

## Seguridad y persistencia

El [contrato y validador](../../src/domain/storeEstablishments.ts) comprueba el esquema exacto, IDs únicos, límites de texto/registros, fechas UTC válidas, orden temporal y datos inertes propios. Rechaza estructuras inesperadas, accesores, prototipos ajenos, arrays dispersos, coordenadas no finitas o incoherentes con el ámbito y URLs que no correspondan al host oficial permitido para el formato. La caja geográfica es un control de coherencia; no sustituye la revisión de procedencia o demuestra por sí sola que un punto pertenece a Tenerife.

La fuente de un punto publicado debe coincidir con la ficha del registro. Los estados pendientes no admiten coordenadas ocultas. No se toman URLs arbitrarias de entrada externa ni se consultan páginas al abrir el panel: la apertura de la ficha depende de una acción explícita. Web conserva `noopener,noreferrer`; nativo usa `Linking`. Los errores asíncronos del panel se acotan mediante solicitud vigente, guard de montaje e invalidación al cerrar, para que una apertura anterior no deje un aviso tardío en otro estado.

El catálogo estático se valida **al cargar el módulo** contra la fecha UTC del dispositivo. Si su reloj es anterior a la fecha del registro, el catálogo puede quedar indisponible de forma conservadora. Corregir el reloj requiere recargar la app para volver a evaluar ese gate. Los favoritos y los enlaces generales no dependen de que el registro supere ese control. No se presenta este comportamiento como una actualización automática de fuentes o una certificación de vigencia de las tiendas.

No hay clave nueva, migración, base de datos, backend, feed, autenticación o servicio de ubicación. Se conservan los **siete documentos de negocio**, sus contratos y los planes de menús V1/V2 de B05.4. El catálogo de 157 recetas y sus fotos permanece fuera del cambio; las **300 decisiones editoriales de categorías y dietas V3** siguen pendientes.

## Comprobaciones de este checkpoint

| Comprobación | Resultado y procedencia |
|---|---|
| TypeScript | Correcto sobre la integración local. |
| Suite unitaria | **1.975 correctas**, cero fallidas o pendientes: 1.853 anteriores más 113 de contrato y nueve de datos/procedencia. |
| Selección focal de integración | **127 correctas**; es un subconjunto, no otras 127 pruebas independientes sumables a la suite completa. |
| Reproducción V83 y V3 | Correcta; se conservan las proyecciones anteriores y las 150 V3. |
| Expediente culinario B05.3 | Reproducción correcta; 150 expedientes y 300 decisiones pendientes, sin activar categorías o dietas. |
| Dependencias | Consulta actual sin avisos conocidos; compatibilidad Expo correcta. No se cambiaron dependencias. |
| Python | La ejecución local conservada de **155 correctas corresponde al 25/11**, con esas fuentes sin modificar. No se presenta como una ejecución nueva del 26/11; la CI propia queda pendiente. |
| Navegador y visual | Nueva matriz de 24 casos y regresiones anteriores pendientes de terminar sobre el compilado de esta entrega. |
| Exportaciones | Web y export conjunto iOS/Android pendientes de cierre en este checkpoint. |
| Escaneo de secretos | Snapshot propio de esta entrega pendiente; el resultado de B05.4 no se atribuye a una fuente nueva. |
| GitHub, CI y staging | Pendientes de publicación y verificación propias del bloque. |

El primer intento de comprobar compatibilidad Expo quedó bloqueado por permisos de red del entorno (`EPERM`). El reintento con permisos adecuados terminó correctamente; se conserva ese intento sin presentarlo como un fallo de la app. Los resultados de exportación o navegador se registrarán cuando terminen, con origen y artefacto propios.

## Criterio de cierre y trabajo siguiente

Antes de declarar terminada esta entrega deben terminar las exportaciones y pruebas de navegador aplicables, conservarse las capturas de estados afectados, comprobarse el snapshot público, subir la fuente a GitHub y pasar la CI. Solo después se publicará y verificará staging protegida con el mismo código probado, manteniendo producción y el acceso privado fuera del repositorio. Los informes de una preview anterior no prueban esta entrega.

El siguiente bloque previsto es **B06.2**, para CP contextual y resultados geográficos con sus fuentes y límites. No se inicia automáticamente antes del cierre de B06.1. La auditoría completa de la pareja corresponde a **B06.1/B06.2**, después de la segunda entrega; la [auditoría anterior B05.3/B05.4](AUDITORIA_PAREJA_B05_3_B05_4_2026-11-25.md) conserva su alcance y fecha.

La aceptación estética, prueba física detallada, accesibilidad con tecnologías de asistencia y distribución nativa firmada siguen separadas. WebKit y exportaciones Hermes no certifican un iPhone físico, Safari o TestFlight. Las comprobaciones de integridad, cero avisos conocidos y controles del código no garantizan ausencia absoluta de fallos o vulnerabilidades. No se habilitan precios, IA o cuentas compartidas por este bloque.


## Cierre local comprobado · 26/11/2026

Tipos y 1.975 unitarias correctos; 24 casos nuevos y 16 regresiones existentes pasan sobre el web independiente SHA-256 `bce96bb188f2e1a5607c83d5376068bbdbd968cb71485eaabd7276dafc0bac5f` (5.675.316 bytes). Los 415 inputs quedan fijados por hash; web/iOS/Android exportados. La primera regresión antigua pasó una y falló una, dejando 14 sin ejecutar: capturaba la referencia antes de concluir el guardado select-all. Ahora espera exactamente las favoritas guardadas; conserva la comparación estricta de toda navegación, aserciones y tiempos. La app no se cambió para resolver esa prueba. Los 24 casos nuevos pasaron en su primer intento.

Se inspeccionaron capturas alemanas de 375 de fichas, CP pendiente y cobertura vacía; la matriz conserva los segmentos, geometría, foco, errores y consulta offline. El gate con reloj del 25/11 muestra fallback sin escrituras; restaurar el reloj y recargar recupera las fichas. La intención de apertura externa se simula; las seis páginas HTTP se comprobaron separadamente. La revisión independiente no encontró bloqueos reproducibles y conserva los 2.046 archivos previos, fotos, fuentes, almacenamiento, tema y foco. [Evidencia local](../../design/store-locations/reports/local-preparation.json). Publicación/CI/escaneo siguen pendientes en este checkpoint; sus resultados se añadirán tras comprobarse.


## Cierre publicado y límites · 26/11/2026

El [origen de prueba](https://jj-compra-inteligente-fi62d0fc0-cmj2hwhc6b-1051.vercel.app) conserva la protección `all_except_custom_domains`. Acceso temporal por conversación hasta **27/11/2026 09:16:05 UTC**, sin credencial en Git. Main `daa3f09` y producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3` se conservan; PR #31, #32 y #33 no se fusionan por esta entrega. El cierre posterior cambia solo documentación y mantiene el compilado probado; no necesita otro despliegue.

Gitleaks oficial 8.30.1 examinó **2.058 archivos / 264.325.398 bytes** del commit de fuente. Salida original **1 por 17 alertas**, todas falsos positivos de identificadores locales de almacenamiento: cero secretos confirmados y cero sin clasificar. Sin excepciones nuevas, con reglas predeterminadas y redacción completa; no cubre historial, ignorados, credenciales de ejecución o interiores de comprimidos. No garantiza ausencia absoluta de vulnerabilidades. La consulta de dependencias y la CI de fuente son correctas.

El entorno de herramientas se reinició durante un upload pendiente. Antes de reanudar se verificaron por hash el snapshot completo, los 415 inputs y los 313 archivos del paquete; la consulta de Vercel confirmó que no existía otro despliegue de esta fuente. Se repitió la subida inmutable por el mismo SHA y se creó una sola staging. HTTPS verifica el contenido decodificado y sus hashes con proxy/CA heredados, sin relajar TLS; las intenciones de abrir fichas se simulan en el navegador, con seis fuentes HTTP contrastadas por separado.

Las 1.975 unitarias, 24 casos nuevos y 16 regresiones locales son del 26/11. Las 155 Python locales conservan su ejecución del 25/11 sobre fuentes intactas; la CI nueva ejecuta sus propios controles. Se conservan recetas, fotos, menús V1/V2 y siete documentos. Cada origen de preview tiene almacenamiento separado: no se copian ni suben datos privados del propietario.

B06.2 y la auditoría de la pareja permanecen después del cierre actual. No hay distancias, GPS o precios conectados ni inventario completo. Continúan pendientes datos geográficos adicionales, el CP conflictivo, 300 decisiones editoriales V3 y aceptación visual/física. Los HBC no son aplicaciones firmadas ni una validación de iPhone físico. [Evidencia final](../../design/store-locations/reports/verification.json).
