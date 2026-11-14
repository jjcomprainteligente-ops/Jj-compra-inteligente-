# JJ | Bloque 02 / Recorrido diario y auditoría de conservación

Fecha/hora UTC: 14/11/2026; ejecución local 11:43–11:47 UTC.
Rama y SHA de partida: `codex/bloque02-receta-primero-2026-11-14`, desde `1942a714c322a032185645df142ad1d3eac32646`.
Objetivo de este paso: demostrar el recorrido exacto de una receta a una lista, compra, gasto confirmado, presupuesto e historial sobre la app existente.

## Encontrado y modificado de verdad

La app ya permitía elegir una receta sin una lista ni un menú semanal previos. El piloto anterior empezaba creando la lista y por eso no demostraba el orden solicitado. No se detectó un P0 de aplicación que justificase modificar TSX, dependencias o almacenamiento.

Se añadió `tests/iphone-pilot/recipe-first.spec.ts` y su configuración aislada `playwright.daily-flow.config.ts`, una [guía Safari](BLOQUE02_PRUEBA_SAFARI_IPHONE.md) y avisos que conservan íntegramente las guías históricas. El registro de respaldo recoge la confirmación del propietario, manteniendo explícita la verificación externa pendiente de 01.1. Los resúmenes maestros distinguen esa dependencia de esta QA sobre la app intacta.

## Pruebas ejecutadas y límites

| Comprobación nueva | Resultado real / procedencia |
|---|---|
| TypeScript | Correcto, incluido el caso final de lista vacía. |
| Unitarias | 981/981; 27 archivos; cero fallidas/omitidas. Ejecución del 14/11 a las 11:42 UTC. |
| Catálogo público | Importador `--check` correcto: 120 V83; no publica las 30 retenidas. |
| Auditoría npm | Cero avisos conocidos el 14/11; no equivale a garantía absoluta de seguridad. |
| B02 local | **36/36**, cero fallos/omisiones/intermitencias: 3 casos × 4 idiomas × Chromium escritorio y WebKit 375/430. |
| Capturas reales | 180 capturas lógicas locales; geometría sin cortes/desbordamiento/claves crudas en los textos comprobados. Originales privados. |
| Conservación | 159/159 inputs preexistentes idénticos a ABB; cero cambios de app/deps/assets/tests previos/scripts. ZIP privado y originales conservados. |

[Evidencia local saneada y hashes](../../design/daily-flow/reports/local-acceptance.json). Primero pasaron 24 casos; se añadió un tercer caso sin alterar las aserciones anteriores y pasaron sus 12 ejecuciones. No se suman el smoke ni capturas adjuntas duplicadas. Las 298 pruebas Chromium/24 omisiones deliberadas y 16 WebKit del Bloque 01 pertenecen a `78480fd`; no se presentan como nuevas ejecuciones del Bloque 02.

Los tres casos cubren: (1) bienvenida/idioma, una receta, arroz 180→360 g, once ingredientes/sal excluida, cancelar sin escribir, crear al confirmar, marcar, cancelar gasto, pago confirmado único de 12,35 €, presupuesto 40 €, historial y cierre/reapertura de página; (2) selección vacía/cantidad cero/fallo de cuota, borrador intacto/reintento único y decisión explícita de combinar arroz a 720 g conservando los otros diez; (3) lista guardada con cero productos, presupuesto 20 € sin gasto, alta de producto cancelada y reapertura. Se comparan los siete documentos en las cancelaciones y tras reabrir.

Comandos ejecutados:

```sh
npm run typecheck
npm test -- --maxWorkers=2
python3 scripts/import-recipes-v83.py --check
npm audit --json --audit-level=moderate
node node_modules/@playwright/test/cli.js test --config=playwright.daily-flow.config.ts --workers=2
node node_modules/@playwright/test/cli.js test --config=playwright.daily-flow.config.ts --workers=2 --grep 'B02 empty list'
```

La primera matriz contenía solo los dos primeros casos; la segunda ejecutó únicamente el tercero añadido. La configuración final contiene los tres. Para reproducir: servir un export estático revisado, definir `JJ_DAILY_BASE_URL` y un directorio privado `JJ_DAILY_EVIDENCE_DIR`. En staging protegida, `JJ_DAILY_SHARE_URL` se proporciona por entorno sin poner su valor en comandos, logs públicos o repositorio. Cada test crea su propio contexto sin datos de negocio sembrados.

Preview: pendiente de la publicación de esta entrega y de su prueba real; la candidata anterior de Bloque 01 conserva su evidencia propia.
Conservación: se mantienen Expo/React Native, Verde Mercado Premium, PNG oficial, 127 recetas activas, cuatro idiomas/EUR, siete documentos y sus protecciones. No hay migraciones, imágenes nuevas, precios comerciales, IA, cuentas ni sincronización activados.
Pendiente y motivo: **PENDIENTE DE PRUEBA FÍSICA** y aceptación visual por el propietario. WebKit Linux no acredita Safari, teclado, VoiceOver, zonas seguras ni una app nativa. Cerrar una página en el mismo contexto con conexión no demuestra reinicio del dispositivo o arranque offline. La independencia del respaldo 01.1 no ha sido inspeccionada por el agente; el propietario sí confirmó su copia.
Riesgo o impacto en costes: no se añaden dependencias, servicios, binarios firmados ni costes Apple. El share temporal y las trazas pueden dar acceso a staging; permanecen privados y fuera del repositorio público.
Estado de bloque: **EN_CURSO / REQUIERE_PRUEBA_PROPIETARIO**; QA local correcta, publicación/verificación remota de esta entrega pendiente. Bloque 01.1 permanece separado sin declarar verificación remota falsa.
Siguiente acción exacta: publicar esta entrega revisable en GitHub y verificarla en staging protegida.
Qué necesito del propietario: únicamente realizar la guía en su iPhone cuando se entregue el enlace verificado; sin repetir permisos de publicación ya concedidos.
