# JJ | Bloque 04.1 / Inventario y control de recepción de fotografías

Fecha: 14/11/2026. Rama: `codex/bloque04-control-fotos-2026-11-14`. Base conservada: `b590ed0d09d646a6f541637c59ac98ecfe68128c`.

## Resultado comprobable

Se revisaron los originales accesibles, los paquetes recuperados, el XLSX embebido y el historial Git. **No se localizaron fotografías originales definitivas por receta.** Se distingue esa ausencia de acceso de afirmar que nunca existieron. Las imágenes disponibles son referencias visuales, logos, maquetas y capturas de QA: no se recortan, generan o presentan como fotografías definitivas.

El [manifiesto de recepción de las 127 recetas activas](../../referencias/recetas-v83/fotografias-publicas/MANIFIESTO_FOTOS_ACTIVAS_127.json) registra `NO_LOCALIZADA`, con archivo, alt y referencias nulos. No modifica el catálogo ni lo consume la app todavía. El inventario maestro de 150 se mantiene privado; las 30 retenidas no reciben nuevos estados públicos ni recursos.

## Alcance del inventario

| Fuente inspeccionada | Resultado real |
|---|---|
| Imágenes canónicas accesibles | 72: 25 pantallas, seis paneles/moodboards, seis referencias de marca, logo oficial, 24 capturas hosted y diez vectores históricos. Cero originales de receta identificados. |
| Paquetes locales | 16 entregas/archivos ZIP revisados sin ejecutar contenido ni sobrescribir originales. |
| XLSX embebido V83 | 130.761 bytes, hash fijado; 45 entradas, cero imágenes, dibujos, relaciones de imagen, enlaces externos o fórmulas de imagen. Ninguna fórmula se ejecutó. |
| Historial Git local | 44 commits alcanzables, 33 refs, repositorio no superficial, cero objetos faltantes. 808 rutas históricas de medios/ZIP; ninguna foto de receta recuperada o eliminada respecto a HEAD. |
| GitHub remoto de partida | 20 ramas, 19 árboles distintos completos, cero candidatos fuera de las referencias/marca/QA conocidos y cero assets de releases. Solo el repositorio canónico resulta accesible en la conexión. |
| Adjuntos históricos del chat | Las rutas antiguas no están montadas; no equivalen a disponibilidad del archivo. |

[Inventario, rutas relativas, tamaños, hashes, dimensiones y alcance](../../design/recipe-photos/reports/source-inventory.json). No se añaden como fotografías logos, SVG, pantallas de iPhone, composiciones de varias vistas ni capturas de pruebas. El PNG oficial se conserva idéntico.

## Herramienta y puerta de recepción

`scripts/validate-recipe-photos.py` es un validador **de solo lectura**, sin red ni publicación. Exige exactamente los 127 IDs autorizados: 120 V83 y los siete anteriores. No admite IDs retenidos o desconocidos, repeticiones ni filas omitidas.

- `NO_LOCALIZADA`: archivo, alt, procedencia, licencia y revisión visual nulos. Valida la estructura y mantiene el faltante explícito.
- `PENDIENTE`: original relativo al directorio indicado, hash/tamaño exactos, formato PNG/JPEG/WebP, ancho mínimo **1536 px**, límites de 32 MiB, 24 megapíxeles y 12.000 px por lado. No admite animaciones, imágenes corruptas, truncadas, duplicadas por hash o rutas peligrosas.
- Se comprueban contenedor/CRC, decodificación completa, dimensiones reales y referencias de procedencia, licencia y revisión visual; el alt exige es/en/de/fr. Los originales no se reescriben ni se generan derivados.
- `--require-ready` exige recepción completa y referencias documentadas para revisión manual. **No aprueba derechos, correspondencia con el plato ni publicación**. El estado sigue PENDIENTE; cero aprobaciones automáticas. Con el manifiesto actual rechaza correctamente la puerta.

El recorrido de rutas usa descriptores de directorio y `NOFOLLOW`; las lecturas exigen archivos regulares y `NONBLOCK`, con límites. Los errores de CLI son genéricos y no imprimen rutas o contenido del usuario. Nunca se evalúan fórmulas ni código suministrado en imágenes o documentos.

## Seguridad del decodificador

El entorno preinstalado tenía Pillow 12.3.0. La consulta de PyPI reportó 58 avisos con corrección en 13.0.0; se descartó esa versión para el auditor antes de publicar la entrega. El auditor usa **Pillow 13.0.0 en un venv aislado**, con 82 hashes de wheels oficiales, sin dependencias adicionales ni compilación desde fuentes. Los metadatos de esa versión no reportaban avisos en la consulta; no es garantía absoluta de ausencia de vulnerabilidades.

La versión se exige antes de `Image.open`: invocar con el Python global antiguo falla sin decodificar. La plantilla sin imágenes puede validarse sin importar Pillow. El paquete global, las dependencias npm, el runtime Expo y la arquitectura de la app permanecen intactos.

Las pruebas detectaron que el decodificador toleraba un CRC IEND alterado; se añadió validación acotada del contenedor PNG antes de decodificar. Se corrigió también un cierre de descriptor en errores. JPEG y WebP verifican sus límites de contenedor. [Revisión independiente](../../design/recipe-photos/reports/independent-review.json).

## Comprobaciones ejecutadas

**32/32 pruebas específicas de fotos y 51/51 Python combinadas**, sin fallos u omisiones. Incluyen versiones antiguas, CRC, truncados, bombas, animación, dimensiones falsas, hash incorrecto, traversal, symlinks, FIFO, formatos, permisos y puerta de recepción. Todos los fixtures son sintéticos temporales; ninguna foto de prueba queda en la app.

**987/987 unitarias**, 28 archivos, y TypeScript correctos. Se conservan las 96 entradas de aplicación y las 159 huellas de baseline. La última regresión completa del código de app idéntico pertenece a `e544ec2f9fd332e6ad9ac74b60b2b2885f616419`: 298 Chromium/24 omisiones deliberadas, 16 WebKit y 36 de receta primero. No se atribuye una repetición de esas matrices a esta entrega, que no cambia aplicación o UI. La siguiente auditoría completa de pareja corresponde a B04/B05.

[Informe local y hashes](../../design/recipe-photos/reports/local-verification.json).

```sh
python3 -m venv RUTA_VENV_AUDITOR
RUTA_VENV_AUDITOR/bin/python -m pip --isolated install --only-binary=:all: --no-deps --require-hashes --index-url https://pypi.org/simple -r scripts/requirements-photo-audit.txt
RUTA_VENV_AUDITOR/bin/python -m unittest discover -s tests/python -p 'test_*.py' -v
RUTA_VENV_AUDITOR/bin/python scripts/validate-recipe-photos.py --manifest referencias/recetas-v83/fotografias-publicas/MANIFIESTO_FOTOS_ACTIVAS_127.json
```

## Estado y siguiente acción

Inventario y puerta de recepción preparados. Publicación de esta entrega, CI remota y preview todavía pendientes. B04 completo: **BLOQUEADO PARA VINCULAR FOTOS POR FALTA DE ORIGINALES ACCESIBLES**; B04.1 técnicamente preparado. No se ha afirmado que haya fotografías aprobadas, correspondencia visual comprobada o fotos vinculadas en iPhone. No hay renderizador nuevo ni cambios de diseño, listas, recetas, IDs o almacenamiento; tampoco se dan por cerradas la prueba física de B02, las excepciones privadas de B03 o la independencia de respaldo 01.1.

Se solicitó al propietario únicamente la carpeta o enlace de los originales V38–V83; no se interpreta «sigue» como entrega de archivos, permiso para generarlos o prueba de derechos. Siguiente acción exacta: recibir/localizar ese origen, conservarlo por hash y revisar un lote de 5–10 antes de preparar su vinculación. Sin merge a main, promoción de producción, servicios nuevos ni costes Apple.
