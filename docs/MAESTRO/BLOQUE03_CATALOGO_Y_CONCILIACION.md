# JJ | Bloque 03 / Registro maestro y frontera pública

Fecha: 14/11/2026. Base: `e97a41b8e67c907207e5fb4e8642ea3f79e04230`. Rama: `codex/bloque03-catalogo-maestro-2026-11-14`.

El propietario abrió la preview, indicó que iba por buen camino y autorizó continuar. Se registra una revisión general favorable; no se atribuye una prueba física exhaustiva ni autorización para publicar nuevos datos de las recetas retenidas.

## Resultado preparado

El registro completo conserva **150 recetas originales y 750 fichas en es/en/de/fr/bg** en un directorio privado ajeno al repositorio. Incluye identidad, lote, versiones originales, ingredientes/unidades/cantidades/raciones, tiempos, pasos, advertencias y controles editoriales, junto con el análisis de conciliación. La fuente no se reescribe ni se renumeran IDs. La app mantiene **120 V83 + 7 anteriores = 127**.

El registro y la propuesta de conciliación detallada se entregan al propietario en un paquete privado. No están en GitHub ni en Vercel. Las 30 retenidas siguen fuera de la aplicación y de la fuente pública hasta resolver los controles y permisos aplicables. No se anuncian certificaciones lingüísticas externas, sanitarias, de etiquetas/SKU ni fotografías definitivas.

## Exportación pública autorizada

El [índice de 150 identidades](../../referencias/recetas-v83/catalogo-maestro/INDICE_PUBLICO_150.json) y el [control público de 15 lotes](../../referencias/recetas-v83/catalogo-maestro/CONTROL_LOTES_15.json) se generan **exclusivamente desde el ZIP público previamente autorizado**, SHA-256 `5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62`. No se utiliza el registro privado para rellenar nuevas columnas públicas de retenidas.

- Las 120 seleccionadas aportan sus campos de identidad y disponibilidad ya autorizados.
- Las 30 reservadas repiten exactamente los cuatro campos existentes en `PROVENIENCIA.json`: ID, posición, motivo y hash. No añaden nuevas catas, evidencias, dictámenes, categorías o propuestas por ID.
- Los estados completos y las excepciones editoriales permanecen en el registro privado. El código de auditoría y sus pruebas utilizan una frontera explícita entre ambas fuentes.

La revisión automática de aprobación **rechazó** crear el árbol público que incluía la nueva propuesta de conciliación y estados de retenidas: la autorización expresa cubre las 120 seleccionadas. Se preservó esa entrega íntegra en privado y se retiró ese material de la entrega pública. La alternativa restringida permite publicar la herramienta y las referencias ya autorizadas; no se intenta la propuesta rechazada por otro canal.

## Código y pruebas

`audit-recipes-v83.py` reutiliza la validación del importador fijado. Exige un destino privado nuevo fuera del repo, sin enlaces simbólicos ni sobrescritura, permisos 0700/0600 y comprobación `--check` sin escritura. El registro privado conserva el hash canónico actual separado del hash histórico registrado; no anuncia recuperación de originales históricos ni cotejo nuevo de un XLSX externo inaccesible.

Las **19/19 pruebas Python** pasan usando únicamente fixtures sintéticos públicos. Comprueban la lista permitida de campos, igualdad exacta de las filas reservadas con la procedencia pública, ausencia de nuevos estados privados en la exportación, conservación de originales, determinismo, IDs/idiomas/cantidades, permisos, archivos alterados, symlinks, FIFO y errores sin revelar rutas privadas. La revisión independiente detectó un bloqueo potencial por FIFO: se corrigió con lectura no bloqueante y comprobación del descriptor antes de leer, con test aislado y timeout.

Los seis casos nuevos de conservación de menús abarcan los siete IDs anteriores, recetas V83, cantidades esperadas independientes y rechazo de IDs ausentes/retenidos sin borrar documentos. TypeScript y **987/987 unitarias** correctos, 28 archivos; cero fallos/omisiones. El importador de app, los 159 inputs anteriores, el diseño, los siete documentos locales y sus protecciones permanecen intactos. No hay nuevos servicios ni costes Apple.

[Resultados y huellas](../../design/catalog-master/reports/local-verification.json). La herramienta tiene un paso dedicado en CI, sin añadir dependencias.

```sh
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
npm run typecheck
npm test -- --maxWorkers=2
python3 scripts/import-recipes-v83.py --check
python3 scripts/import-recipes-v83.py --source-zip RUTA_PRIVADA_V83 --check
python3 scripts/audit-recipes-v83.py --source-zip RUTA_PRIVADA_V83 --private-output DIRECTORIO_PRIVADO_NUEVO
python3 scripts/audit-recipes-v83.py --source-zip RUTA_PRIVADA_V83 --private-output DIRECTORIO_PRIVADO_EXISTENTE --check
```

## Entrega comprobada y auditoría de pareja

[PR #23](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/23), fuente `e544ec2f9fd332e6ad9ac74b60b2b2885f616419`, árbol `67fde43ccd1c65a9f81d3c80e16a6ede0158b2dc`. CI remota [43611606343](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43611606343) correcta: instalación sin scripts, selección pública, privacidad Python, tipos, unitarias, audit, Expo y export web.

La regresión completa de B02/B03 se ejecutó de nuevo en copia aislada del SHA exacto, sin original privado ni estado del propietario:

| Suite | Correctos | Fallidos | Omitidos | Capturas lógicas |
|---|---:|---:|---:|---:|
| Chromium completo | 298 | 0 | 24 deliberados | 120 matriz + 300 inventario |
| WebKit piloto | 16 | 0 | 0 | 120 |
| Receta primero | 36 | 0 | 0 | 180 |

Cero intermitencias, errores runtime o fallos visuales. 159 huellas antes/después y 1.422 archivos seguidos de la copia coinciden con sus blobs canónicos. Los originales y la aplicación del checkout principal se comprobaron por separado: no se extiende el fingerprint de la copia aislada a archivos privados ignorados. Los servidores propios terminaron. [Regresión y límites](../../design/catalog-master/reports/pair-regression.json).

Nueva preview **READY/staging protegida**, `dpl_JC4TDzdKay7LUzkP18oRp5DpgayR`, fuente `e544ec2f9fd332e6ad9ac74b60b2b2885f616419`. Origen: https://jj-compra-inteligente-c3bha1h5j-cmj2hwhc6b-1051.vercel.app. Acceso temporal por conversación hasta **15/11/2026 15:04:16 UTC**, sin token en Git. Verificación real: cuatro idiomas, catálogo127 y 29 recursos/URLs por hash; logo exacto y bundle C3f conservados. Los23 archivos compilados son idénticos a la candidata anterior; registro/propuesta privados ausentes del paquete. [Despliegue](../../design/catalog-master/reports/deployment.json) · [HTTPS](../../design/catalog-master/reports/hosted-verification.json) · [verificación global](../../design/catalog-master/reports/verification.json).

La producción conserva `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`, sin promoción ni merge a main. El cierre posterior añade solo documentación/evidencias y no representa otra ejecución de navegador. WebKit Linux, viewport CSS y export no acreditan Safari o un iPhone físico; sigue pendiente esa prueba del propietario. La revisión general favorable se conserva sin atribuir aceptación exhaustiva.

## Informe de cierre de subtarea

JJ | Bloque 03 / Registro técnico y frontera pública.

Fecha/hora UTC: 14/11/2026; regresión 15:43–16:02 y publicación/verificación staging posteriores.

Rama y SHA: `codex/bloque03-catalogo-maestro-2026-11-14`, fuente `e544ec2f9fd332e6ad9ac74b60b2b2885f616419`, base `e97a41b8e67c907207e5fb4e8642ea3f79e04230`.

Objetivo: registro privado 150/750, control por lotes y exportación pública dentro de autorización existente, conservando el producto.

Encontrado/modificado: herramienta reproducible, índice desde fuente pública autorizada,19 pruebas Python, seis casos de planes y paso CI. Sin cambios de app, IDs, fuentes originales o almacenamiento.

Pruebas: 19/19 Python, 987/987 unitarias, tipos/importador correctos; Chromium 298+24 deliberados, WebKit 16 y receta primero 36, cero fallos/intermitencias. Resultados ligados a fuente identificada.

Preview: READY/protegida, origen y caducidad indicados arriba; cuatro idiomas, 127 recetas y 29 recursos/URLs comprobados realmente.

Conservación: originales privados, contenidos retenidos, diseño/logo, siete documentos y protecciones intactos. 159 inputs anteriores conservados; registro completo privado y destino 0700/0600. 01.1 independencia externa no inspeccionada.

Pendiente: excepciones editoriales y permisos de publicación del registro privado; prueba física B02; 01.1. La exposición adicional de nuevos estados de retenidas fue rechazada y permanece fuera del repositorio.

Costes: sin nuevas dependencias, servicios de pago, cuentas, IA, binarios firmados o costes Apple.

Estado: **REGISTRO Y HERRAMIENTA VERIFICADOS TÉCNICAMENTE; BLOQUE 03 EN_CURSO**. No se activan las 30 retenidas ni se declara completado todo el proyecto.

Siguiente acción exacta: revisar en privado las excepciones de publicación del catálogo maestro. No se pide repetir catas ya documentadas; únicamente aclaraciones realmente pendientes. No se abre Bloque 04 ni se promueve producción.
