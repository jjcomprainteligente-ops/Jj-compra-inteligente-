# Revisión independiente de integración V83

Revisión del 12/11/2026. Alcance: datos y pruebas de recetas, importador de biblioteca estándar, proyección de i18n, modelo de tiempos/ingredientes y cambios de presentación. No realiza certificación sanitaria, lingüística externa ni prueba física de iPhone. No ejecuta contenido del adjunto ni fórmulas de Excel.

## Evidencia ejecutada por esta revisión

- Prueba focal `npx --no-install vitest run tests/v83-recipes.test.ts`: **18/18 correctas, cero fallidas, cero omitidas**. JSON local: `unit-focused-final.json`.
- Lectura independiente del ZIP original de 150 registros, fijado por SHA-256 `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034`: 14 entradas y 13/13 archivos del manifiesto correctos, 150 identidades y 750 fichas en cinco idiomas.
- Comparación completa con decimales exactos (`json parse_float=Decimal`) de los 120 registros del ZIP público contra la selección de registros originales: **120/120 idénticos en valores**, 600 fichas. Archivo de esta comprobación: `independent-public-selection.json`.
- ZIP público fijado independientemente en el test por SHA-256 `5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62`. Tiene exactamente dos miembros: los 120 registros íntegros y procedencia con 30 IDs/posiciones/motivos/hashes retenidos, sin sus instrucciones, títulos o ingredientes.
- `python3 scripts/import-recipes-v83.py --check`: correcto en modo **public selection only**. Este modo reproduce desde el ZIP público y no exige el original privado.
- `git check-ignore` confirma que el original completo está excluido. `git ls-files --cached referencias/recetas-v83/originales` no presenta archivos. Debe repetirse esta comprobación sobre el índice final de publicación.

## Aserciones del test

La lectura de fuente usa únicamente el ZIP público, con parser ZIP acotado en memoria y sin extracción o subprocesos. La prueba de CI no depende de disponer del original de 150 registros ni oculta su ausencia con omisiones.

Se comprueban procedencia/hash individual de cada registro con canonicalización independiente en JavaScript; posiciones exactas y cinco idiomas de las 120 seleccionadas; ausencia de las 30 retenidas en las identidades y claves de traducción de la aplicación; siete recetas previas y firma histórica completa conservadas; 127 IDs únicos; plan anterior estable y admisión de los nuevos IDs permitidos.

Se comparan todas las cantidades medidas y unidades de fuente, raciones, minutos conocidos o nulos, pasos y advertencias de las 120 recetas en los cuatro idiomas de interfaz. Se prueban tres sales sin cantidad fuera de la transferencia, acompañamientos sin medida, azafrán fraccionario, cuatro piezas de250g como piezas y diente de ajo separado del ajo entero. Se escala cada receta a1/2/4/12 personas sin cantidades nulas o inválidas, precios añadidos ni mutación de datos.

Los filtros excluyen tiempos desconocidos al elegir un máximo y no deducen etiquetas vegetarianas o veganas de las recetas nuevas. Las traducciones por receta/índice conservan el texto recibido; se prueba el respaldo al español. El catálogo de interfaz permanece en es/en/de/fr y el búlgaro se conserva en la fuente sin activar una interfaz incompleta.

## Hallazgo corregido

El nuevo guard de `unmeasuredIngredients` usaba inicialmente `.some()` directamente: un array con huecos omitía la validación y podía causar un `TypeError` posterior. Se comunicó al responsable y se corrigió con `Array.from(...).some(...)`. Se añadió una prueba que exige el error de catálogo controlado; está incluida en las18 correctas.

## Revisión estática de importación y UI

El importador fija hashes de ambas fuentes, rechaza archivos inesperados, rutas inseguras, archivos no regulares o cifrados, expansiones excesivas, claves JSON duplicadas/inseguras, texto de control, números no finitos, identidades/posiciones o cantidades inconsistentes. Los dos modos separan verificación de selección pública y auditoría completa privada. Las escrituras se limitan a artefactos derivados; `--check` no escribe ni archiva y los originales distintos no se sobrescriben.

El modelo nullable distingue ausencia de tiempo de un tiempo de cero. Las cantidades canónicas y los siete documentos locales no cambian de contrato. Las unidades especiales conservan su significado en el nombre; los ingredientes sin medida solo se muestran en la receta. Las advertencias completas siguen en la vista localizada y las notas editoriales en español se identifican como respaldo cuando la fuente no las traduce.

Los componentes conservan tokens, logotipo y flujos de revisión existentes; memoizan el catálogo y paginan recetas/sustituciones de20 en20 y opciones de ingredientes de40 en40. La inspección estática no sustituye sus pruebas de navegador. No se añaden dependencias, red, cuentas, datos de pruebas preinstalados ni almacenamiento nuevo en estos cambios.

## Límites de cierre

Esta revisión no ejecutó la suite completa, las exportaciones de plataformas ni la matriz de navegador; corresponde al responsable registrar esos resultados de la versión final. No certifica Safari/iPhone físico, teclado, VoiceOver, zonas seguras o distribución nativa. Las30 recetas retenidas siguen pendientes de aclaración del propietario; los estados comerciales, productos, etiquetas y trazas no se convierten en certificaciones. Tampoco cierra B07.2 ni la aceptación visual.

No quedan nuevos hallazgos bloqueantes en el alcance revisado. Esto no es una garantía de ausencia absoluta de defectos o vulnerabilidades.
