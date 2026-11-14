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

## Estado de entrega

Registro privado y herramienta preparados; publicación restringida, CI remota, regresión completa de la pareja B02/B03 y staging de esta entrega pendientes. Las pruebas anteriores conservan sus SHA y no se cuentan como ejecuciones nuevas. Bloque 03**EN_CURSO**: no se activan las 30 retenidas, no se declara completada la prueba física de B02 y 01.1 conserva su independencia no inspeccionada.

Siguiente acción: revisar en privado las excepciones de publicación del registro maestro. Cualquier exposición pública adicional de estados o contenido retenidos requiere autorización expresa; no se pide repetir catas ya documentadas. No se abre el Bloque 04 ni se fusiona main/promueve producción.
