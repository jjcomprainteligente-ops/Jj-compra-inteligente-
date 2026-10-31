# I01 + I02 — Entrega multilingüe y auditoría P01

**Fecha:** 31/10/2026 UTC. **Estado:** implementación y auditoría automática web terminadas; aceptación física y distribución pendientes. No se declara una aplicación libre de todo riesgo.

## Resultado verificable

| Comprobación | Resultado |
|---|---|
| TypeScript y Vitest | npm run check correcto: 16 archivos, 496 pruebas, 0 fallidas |
| Suite completa Playwright | 124 aprobadas, 0 fallidas, 0 inestables; 136 registradas |
| Omisiones | 12 capturas duplicadas del segundo proyecto; la matriz completa se ejecutó una vez |
| Matriz visual | 120 capturas: es/en/de/fr × 375, 430 y 1280 px × 10 estados |
| Texto y ejecución | 0 desbordamientos/recortes/claves sin resolver detectados; 0 errores JS/consola |
| Guardado entre pestañas | Conflictos y guardados simultáneos comprobados; no se pierde el primer guardado |
| Preferencias y borradores | Prioridad manual, detección, fallback, persistencia, errores, cambios remotos y campos conservados |
| Exportaciones | Web y Hermes iOS/Android correctas; no son IPA/APK ni una prueba física |
| Configuración nativa | CFBundleLocalizations contiene es/en/de/fr; nombre e identificadores conservados |
| Conservación | Ningún archivo previo eliminado; tema, Brand e ilustraciones intactos; B05/B06 y dist anteriores sin cambios durante QA |
| Dependencias | 13 paquetes con avisos: 2 altos, 9 moderados, 2 bajos, 0 críticos; auditoría abierta |

La ejecución final fue del 31/10/2026 a las 14:43:39 UTC, duración aproximada 4,6 minutos. Se utilizaron contextos nuevos de Chromium, datos ficticios y almacenamiento aislado. Los tamaños CSS de iPhone no equivalen a Safari o iPhone físicos.

[Galería final](../design/i18n/evidence/run-2026-10-31T14-43-39-214Z-cyg0Cc/review.html) · [Informe de navegador](../design/i18n/evidence/run-2026-10-31T14-43-39-214Z-cyg0Cc/report.json) · [Resultados Playwright](../design/i18n/evidence/run-2026-10-31T14-43-39-214Z-cyg0Cc/playwright-results.json).

## I01 — Arquitectura inicial de idiomas

- Registro central de español, inglés, alemán y francés, ampliable sin reescribir pantallas.
- Preferencias del dispositivo mediante expo-localization compatible con SDK58; negociación de variantes y español de respaldo.
- Preferencia manual guardada por encima del dispositivo, con opción de volver al modo automático.
- Catálogos reutilizables, composición con comprobación de claves y parámetros, fallback español y renderizado como texto.
- Formatos es-ES, en-GB, de-DE y fr-FR; la moneda de compra permanece EUR.
- Céntimos y milésimas exactos; los textos formateados no alteran el modelo de negocio.
- Preferencias independientes en jjcompraintelwgiemt.preferences.v1. Las cuatro claves de negocio conservan nombre, versión y esquema.
- Preparación pura assistantLanguageContext(language): idioma, locale, EUR e instrucciones; sin claves, API, consumo ni asistente conectado.

## I02 — Integración y conservación visual

Bienvenida, Perfil → Idioma, cuatro pestañas, formularios, confirmaciones, errores, avisos locales, accesibilidad, menús, recetas y ambos comparadores usan los recursos centrales. Los avisos y etiquetas existentes están traducidos; no se ha añadido un servicio de notificaciones push.

La bienvenida permite entrar sin cuenta. Las selecciones se confirman después de persistir. Errores de lectura o preferencias futuras no se reemplazan; puede continuarse esa sesión sin afirmar que se guardó una selección.

Cambiar idioma no remonta el espacio de trabajo ni reinicia formularios. Los eventos de otra pestaña no ocultan un fallo de la última selección local. Se conserva el contexto de pestaña y el retorno desde Perfil/Idioma.

No se cambió la paleta ni se redibujó la marca: src/app/theme.ts, Brand.tsx, Illustrations.tsx y src/theme.ts coinciden con la copia previa. Esta entrega no sustituye el trabajo visual V2 ni aprueba un icono/3D.

Los siete IDs de recetas, cantidades, unidades, categorías y texto canónico español permanecen iguales. Títulos, pasos, notas y alérgenos tienen presentación traducida. Una edición propia se conserva. El vocabulario de ingredientes/notas se reconoce por coincidencia exacta: un nombre manual idéntico al catálogo puede verse traducido, pero su valor almacenado no se reescribe. No se infieren equivalencias de alimentos por traducir nombres.

## P01 — Auditoría completa tras los dos bloques

### Incidencias encontradas y corregidas

1. **Pérdida entre pestañas:** la primera corrección con Web Locks y localStorage seguía permitiendo que dos renderers leyesen una copia antigua. Se reprodujo también sin React. Se añadió una reserva transaccional local en IndexedDB con huellas SHA-256, comprobada antes de escribir.
2. **Preferencias simultáneas:** completar bienvenida y elegir idioma no pueden borrar silenciosamente el cambio de otra pestaña. Una lectura obsoleta puede rechazarse con aviso explícito y reintento; el estado confirmado se conserva.
3. **Eventos durante un guardado:** se registra la actualización remota y se vuelve a leer tras finalizar. No se ignora el último idioma persistido ni se oculta un error local por recibir otro evento válido.
4. **Formularios desmontados:** reintentar preferencias o recibir una bienvenida remota no desmonta un espacio ya abierto.
5. **URL del comparador anterior:** enlaces con credenciales, controles, bidi o longitud excesiva se rechazan al modificarse/abrirse. Los registros históricos siguen legibles y no se borran automáticamente.
6. **Alertas duplicadas durante un cierre:** las hojas del comparador no presentan errores nuevos cuando ya están cerrándose.
7. **Pruebas de checkbox:** las acciones de persistencia se esperan explícitamente. No se ha eliminado la comprobación de estado ni de almacenamiento para ocultar un fallo.

El primer recorrido (conservado) tuvo 117 aprobadas, 5 fallos y 12 omisiones. La carrera era un fallo real; las otras incidencias correspondían al cierre de alertas y al momento de comprobar guardados asíncronos. Se corrigieron y se repitió la suite completa, con el resultado final indicado arriba.

[Primera ejecución](../design/i18n/evidence/run-2026-10-31T09-00-12-770Z-pv3Jo0/report.json).

### Protocolo de escritura y límites

Los documentos de negocio siguen en AsyncStorage/localStorage. IndexedDB contiene únicamente claves fijas, estados de coordinación, tokens aleatorios y huellas; no copias de listas o precios.

Bajo Web Lock se valida el estado esperado, se confirma una reserva de IndexedDB con durabilidad estricta, se escribe y se vuelve a leer el documento validado. Solo después se confirma la huella final y el éxito en la interfaz. Se usa la lectura canónica, porque un validador puede normalizar texto o URL.

Los fallos previos no escriben datos nuevos. Si el almacenamiento confirma que continúa exactamente igual tras un fallo, se revierte la reserva. Si el resultado es ambiguo, la reserva queda pendiente y bloquea nuevas escrituras. No se borra ni se repara automáticamente. IndexedDB y localStorage no forman una transacción atómica común; el protocolo protege la divergencia en vez de ocultarla.

La web necesita contexto seguro, Web Locks, IndexedDB con durabilidad estricta y Web Crypto. Sin esas capacidades, el guardado falla de forma explícita y conservadora. Una dirección IP por HTTP puede no servir para probar estos guardados. La ruta nativa conserva la cola del mismo contexto JS, sin IndexedDB.

La garantía se limita a los escritores de esta versión que cooperan. Una pestaña antigua en caché puede ignorar el protocolo. Un borrado externo de solo localStorage deja sus huellas y puede provocar un bloqueo; no se debe borrar el registro de coordinación para forzar una escritura ni borrar datos del propietario para resolverlo sin revisión.

### Dependencias

[Auditoría actual](../design/i18n/audit/npm-audit.json). Los avisos observados pertenecen a herramientas de Expo, con cuatro orígenes: zod, deepmerge, glob y minimatch, propagados a dependientes. No son trece vulnerabilidades raíz independientes. La inspección no identificó importaciones de esas rutas desde el código de app; no equivale a descartar toda vulnerabilidad.

El lockfile anterior y el actual conservan las versiones afectadas. Los únicos paquetes incorporados para idioma fueron expo-localization y rtl-detect. Las consultas de compatibilidad no encontraron parches dentro de los rangos actuales: CLI58 usa zod3 y glob13; las correcciones reportadas exigen ramas mayores. No se forzó un override mayor ni una rebaja a Expo51 incompatible con React Native0.88. Los avisos deben resolverse o evaluarse expresamente antes de distribución.

## Archivos, copias y reproducción

- Fuentes centrales: src/i18n; integración en la entrada, pantallas, componentes, errores y almacenamiento.
- Protección: src/storage/writeCoordinator.ts y writeFence.ts; hooks de compras, menús y observaciones; comparador anterior.
- Regresión nueva: pruebas de catálogo, preferencias, recetas, validación, coordinación, fallos de transacción y recorridos web.
- Documentación: [contrato y plan](I18N_CONTRATO_Y_PLAN.md), [guía física](I18N_PRUEBA_GUIADA.md), PLAN_Y_ESTADOS, DECISIONES_Y_RIESGOS y README.
- Copia previa: archives/B00-B06-source-before-i18n.zip.
- [Conservación](../design/i18n/audit/preservation.json), [exportación y hashes](../design/i18n/audit/export-build.json), [configuración nativa](../design/i18n/audit/native-config.json).
- Nuevo export aislado: dist-i18n. Copia estática preparada: previews/i18n-web; solo HTML, JS web, fuentes y configuración de alojamiento.
- Ningún despliegue nuevo ni cambio del preview B05 durante esta entrega. La aprobación anterior de publicación correspondía a B05.
- Git no está operativo; no hay rama, PR o commit que declarar.

Reproducción:

    npm run check
    npm run build:i18n
    npm run verify:i18n

El verificador utiliza un puerto 8081 propio y una carpeta fechada nueva. Falla si el puerto está ocupado y no termina procesos ajenos. No ejecutar los antiguos capturadores B05/B06 sobre sus evidencias históricas.

## Pendientes y siguiente puerta

1. Safari/iPhone físico, iOS/Android nativos, VoiceOver/TalkBack, Dynamic Type, teclado y zonas seguras. Registrar los cuatro idiomas según la guía; Chromium no valida esos puntos.
2. Avisos de herramientas Expo y actualización compatible antes de distribución.
3. Revisión lingüística/visual del propietario y de ChatGPT; no se atribuye aprobación de producto a pruebas automáticas.
4. El criterio contable anterior de importes marcados sigue pendiente de su separación de pagos confirmados en el Lote3A de V2; esta entrega no crea pagos ni historial.
5. Publicar la nueva vista web en un despliegue de prueba separado si el propietario lo autoriza. Mantener B05 y sus datos de prueba existentes.
6. Retomar los lotes V2 posteriores según aprobación, conservando la auditoría después de cada pareja de bloques.

El trabajo autorizado de I01/I02 y su auditoría automática quedan entregados. No se ha avanzado a nuevas integraciones ni se declara distribución lista.

