# JJ | Bloque 04.2 · Estado honesto de fotografía

Trabajo iniciado: 14/11/2026; cierre preparado: 15/11/2026. Base: `cdd8a1e16426d62864f15fae998906b13f6dc7a8`. Rama: `codex/bloque04-2-foto-pendiente-2026-11-14`.

## Alcance de esta continuación

La orden de continuar se aplica a una subtarea independiente dentro de B04: indicar que la fotografía sigue pendiente. No supone recepción de originales ni aprobación visual nueva. El inventario y el control de recepción de [B04.1](BLOQUE04_FOTOGRAFIAS_Y_RECEPCION.md) conservan su evidencia y sus límites.

Antes de implementar se mostraron dos maquetas temporales sobre el compilado existente: A, etiqueta compacta junto a los metadatos; B, nota debajo. Se utiliza A como supuesto de trabajo comunicado, sin registrar aceptación del propietario. La etiqueta usa `Pill` neutral, los colores y Manrope existentes, con ajuste de línea. No se introduce un espacio de fotografía vacío ni se cambia el logo, las filas, las pestañas o la navegación.

## Datos y privacidad

`src/domain/recipePhotos.ts` contiene únicamente los 127 IDs activos y su estado público explícito. El getter devuelve `NO_LOCALIZADA`, `PENDIENTE` o `undefined` para una identidad desconocida. Ninguno habilita imágenes, genera una URL o representa aprobación. Una receta nueva necesita incorporación explícita al registro y comprobación de cobertura.

El manifiesto de recepción no se importa al cliente. No hay rutas, archivos, hashes de fotos, alt, procedencia, licencias o revisión visual en este módulo. Los datos de recepción completos de futuras candidatas deben permanecer en un archivo privado fuera de Git/Vercel: no rellenar la plantilla pública con rutas o referencias privadas. El registro de estado público se revisa por separado. Esta entrega no publica estados nuevos de las recetas retenidas.

`Recipe`, los originales culinarios, IDs, cantidades, pasos, planes y siete documentos locales permanecen intactos. No hay migración, almacenamiento nuevo, red, decodificador de imágenes en la app, servicio, dependencia, integración o coste añadido.

## Pantalla e idiomas

El detalle de receta indica «Foto pendiente» para las identidades registradas. Una identidad desconocida usa «Foto no disponible». Las dos etiquetas están centralizadas en `src/i18n/catalogs/recipePhotos.ts`, con es/en/de/fr y respaldo español del sistema existente. La etiqueta es texto accesible; no lleva alt de una fotografía que no existe.

La lista mantiene sus iconos actuales. La ficha conserva título, metadatos, raciones, ingredientes, pasos, avisos y revisión antes de guardar. No hay representación de imágenes ni fotos definitivas vinculadas. El bundle cambia por el nuevo estado: no se afirma igualdad con C3f ni se atribuyen matrices antiguas a este árbol.

## Comprobaciones y publicación

TypeScript y 991/991 pruebas unitarias correctos, incluidas cuatro pruebas de cobertura/estados/API mínima y búsqueda exacta ante IDs desconocidos/prototipos. Export web correcto. Navegador: 20/20 casos focalizados y 36/36 del recorrido diario correctos, sin fallos, omisiones o reintentos. Cuatro idiomas, Chromium y WebKit, dos anchos móviles y escritorio en la matriz focalizada; 40 fichas y 40 capturas lógicas. Revisión independiente estática correcta. CI remota y staging de esta entrega están pendientes de su resultado; no se declaran aprobadas anticipadamente.

La suite focalizada comprobó receta heredada y V83 en cuatro idiomas, texto visible/accesible sin recorte, ausencia de imágenes/solicitudes nuevas y conservación de los documentos al abrir, ajustar raciones y cerrar. La suite existente comprobó receta → raciones → revisión → lista → gasto/presupuesto, cancelación, errores, duplicados y reapertura. Los artefactos de navegador permanecen privados y utilizan datos de prueba temporales, sin preinstalarlos en el producto.

## Límites y siguiente acción

B04 completo sigue **BLOQUEADO PARA VINCULACIÓN POR FALTA DE ORIGINALES ACCESIBLES**. Cero fotografías aprobadas o publicadas. Faltan carpeta/enlace V38–V83, correspondencia plato/ingredientes, procedencia/derechos, calidad, derivados y validación real de visualización antes de vincular un primer lote. No se abre B05 ni se promueve producción. B02 físico, B03 privado y respaldo 01.1 conservan sus pendientes por separado; no se afirma prueba física de iPhone.

Informes: [local](../../design/recipe-photos/status/reports/local-verification.json) · [estado de foto](../../design/recipe-photos/status/reports/browser.json) · [recorrido diario](../../design/recipe-photos/status/reports/daily-flow.json). Las pruebas se ejecutaron el 14/11 sobre los 97 inputs exactos recogidos en el informe; tras recuperar el entorno el 15/11 se comprobaron hashes, resultados y TypeScript. No se inventa una repetición de navegador.
