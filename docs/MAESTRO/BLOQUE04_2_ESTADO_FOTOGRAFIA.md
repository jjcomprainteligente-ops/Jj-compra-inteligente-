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

TypeScript y 991/991 pruebas unitarias correctos, incluidas cuatro pruebas de cobertura/estados/API mínima y búsqueda exacta ante IDs desconocidos/prototipos. Export web correcto. Navegador: 20/20 casos focalizados y 36/36 del recorrido diario correctos, sin fallos, omisiones o reintentos. Cuatro idiomas, Chromium y WebKit, dos anchos móviles y escritorio en la matriz focalizada; 40 fichas y 40 capturas lógicas. Revisión independiente estática correcta. CI remota y staging protegida correctas, con sus fuentes y resultados registrados a continuación.

La suite focalizada comprobó receta heredada y V83 en cuatro idiomas, texto visible/accesible sin recorte, ausencia de imágenes/solicitudes nuevas y conservación de los documentos al abrir, ajustar raciones y cerrar. La suite existente comprobó receta → raciones → revisión → lista → gasto/presupuesto, cancelación, errores, duplicados y reapertura. Los artefactos de navegador permanecen privados y utilizan datos de prueba temporales, sin preinstalarlos en el producto.

## Límites y siguiente acción

B04 completo sigue **BLOQUEADO PARA VINCULACIÓN POR FALTA DE ORIGINALES ACCESIBLES**. Cero fotografías aprobadas o publicadas. Faltan carpeta/enlace V38–V83, correspondencia plato/ingredientes, procedencia/derechos, calidad, derivados y validación real de visualización antes de vincular un primer lote. No se abre B05 ni se promueve producción. B02 físico, B03 privado y respaldo 01.1 conservan sus pendientes por separado; no se afirma prueba física de iPhone.

Informes: [local](../../design/recipe-photos/status/reports/local-verification.json) · [estado de foto](../../design/recipe-photos/status/reports/browser.json) · [recorrido diario](../../design/recipe-photos/status/reports/daily-flow.json). Las pruebas se ejecutaron el 14/11 sobre los 97 inputs exactos recogidos en el informe; tras recuperar el entorno el 15/11 se comprobaron hashes, resultados y TypeScript. No se inventa una repetición de navegador.

## Publicación y cierre de la subtarea

Fecha/hora UTC: 15/11/2026; navegador local ejecutado el 14/11 y recuperado con hashes verificados el 15/11.

Rama y SHA: `codex/bloque04-2-foto-pendiente-2026-11-14`, fuente `24f4b37d2215a24cd283d5c6ef94625a0c2ae18f`, árbol `ae1ac66b034964d10f6143e164cabae5679f49ce`. [PR #25](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/25), sobre el cierre de B04.1. El cierre documental posterior no altera el código probado.

Objetivo: hacer visible la ausencia de fotografía sin confundirla con una imagen aprobada.

Encontrado: 127 recetas activas sin originales localizados; la app no consumía un estado de disponibilidad. Se conserva el control de recepción de B04.1.

Modificado: registro mínimo por ID, dos etiquetas localizadas, metadatos de la ficha, cuatro pruebas unitarias, suite/config focalizadas e informes. No cambia el modelo culinario o de persistencia.

Pruebas: TypeScript, 991/991 unitarias; CI de fuente [43703498852](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/43703498852) y push 43703463609 correctas, incluidas 51 Python, audit, Expo y export web. [Registro CI](../../design/recipe-photos/status/reports/github-actions.json). Los 97 hashes de inputs ejecutados coinciden con el commit publicado; no se reescribe el SHA nulo del runner local.

Navegador: 20/20 casos focalizados locales, 36/36 del recorrido diario y 8/8 nuevos casos en staging; sin fallos, omisiones, intermitencias o reintentos. Estos ocho casos de WebKit comprueban es/en/de/fr × 375/430 px, 16 fichas de receta y conservación de los siete documentos. [Prueba publicada](../../design/recipe-photos/status/reports/hosted-photo-status.json). No es prueba física de Safari/iPhone.

Preview: `dpl_Bub9pL1exYBArvvP2zZppoKJZ2RS`, READY/staging y protegida. Origen https://jj-compra-inteligente-qtduzh7m8-cmj2hwhc6b-1051.vercel.app. Fuente 24f4b37d; cuatro idiomas, 127 recetas y 19 recursos/URLs comprobados por hash. Acceso privado temporal por conversación hasta **16/11/2026 10:22:16 UTC**; token fuera de Git. [HTTPS](../../design/recipe-photos/status/reports/hosted-verification.json) · [despliegue](../../design/recipe-photos/status/reports/deployment.json).

Diferencia visual: etiqueta neutral de disponibilidad junto a los metadatos, con salto de línea natural en pantallas pequeñas; resto de ficha, filas, cabeceras, navegación, logo y fuentes conservados. A sigue siendo propuesta de trabajo para revisión del propietario, no aceptación visual atribuida. Se revisó una captura real de staging en español/WebKit 375 además de las muestras de revisión independiente.

Conservación: originales de receta y datos fuente, IDs, ingredientes, pasos, siete documentos y protecciones sin cambios. Registro cliente sin URI o metadatos de recepción; cero imágenes publicadas. 13 archivos compilados incluidos, tres nuevos subidos y diez reutilizados por hash; logo exacto y siete fuentes Manrope con licencias. Bundle nuevo `7ed8b56163b209e1cc11872940faadad7cbbeb80197b486bb8ab5a83d0ef3530`; no se afirma igualdad con C3f.

Riesgos/costes: sin dependencia nueva de app, migración, red para fotografías, servicio de pago, IA o cambio de seguridad del proyecto. Recepciones completas futuras deben permanecer privadas. No se fusiona main ni se promueve producción.

Pendiente: originales V38–V83, derechos/procedencia, correspondencia con plato e ingredientes, revisión y entrega real de imágenes. B02 físico, B03 privado y respaldo 01.1 conservan sus límites.

Estado: **B04.2 PROBADO AUTOMÁTICAMENTE Y PUBLICADO EN STAGING; B04 COMPLETO PENDIENTE DE ORIGINALES**.

Siguiente acción exacta: localizar la carpeta/enlace de originales y revisar un lote de 5–10 antes de preparar vinculación; no se abre B05 automáticamente. La auditoría completa de pareja B04/B05 sigue prevista. [Verificación global](../../design/recipe-photos/status/reports/verification.json).
