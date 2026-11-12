> **V83 publicada y comprobada · 12/11/2026:** 120 recetas nuevas y las siete anteriores disponibles. Código y fuente seleccionada en [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), fuente compilada `0ea49b597f45b401747e20d7d880c07f670b3073`. Preview staging protegida comprobada en es/en/de/fr, con 127 recetas y 29 recursos/URLs por hash. El enlace temporal se entrega fuera de Git y vence el **13/11/2026 a las 15:56:07 UTC**. Las 30 retenidas y la prueba física siguen pendientes. [Entrega y límites](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md).

# V83 · Integración de recetas y auditoría

Integración del 12/11/2026 en `codex/v83-recetas-auditadas`, sobre la base `dbb703f62486ac4f639947da429761ed42c062d8`. **Código comprobado: TypeScript, 981 unitarias, exportaciones web/iOS/Android, 298 casos Chromium y 16 WebKit correctos. Código y fuente seleccionada publicados en GitHub; nueva preview V83 protegida y comprobada.** La comprobación documental se distingue de las pruebas ejecutadas sobre la aplicación; ninguna sustituye la validación en un iPhone físico.

## Fuente recibida y verificada

El propietario entregó el ZIP ligero V83 del catálogo acumulado y el XLSX de control del lote 141–150. El acumulado contiene **150 recetas con IDs distintos y 750 fichas**: español, inglés, alemán, francés y búlgaro (`es/en/de/fr/bg`). Hay 150 fichas por idioma; no son 750 recetas distintas.

| Archivo | SHA-256 |
|---|---|
| ZIP adjunto | `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034` |
| XLSX adjunto | `dfa8e15c6471c862933eb5f6cd81fd1f9e00489f889088cf41f6fa18280c09a1` |
| JSON acumulado del ZIP | `57d209dc52ea9488477fde89c04ee6e21f8d36d8f793702990a0087eb59bb94e` |
| JSON del lote 141–150 | `4da128d42b5dc6bf6b5088662d4625dac7634d1aefd2f152c229f2f2994d46ec` |

La auditoría de solo lectura comprobó las 13 entradas del manifiesto por tamaño y SHA-256. No detectó rutas absolutas, `..` ni enlaces simbólicos en el ZIP. El XLSX embebido coincide byte a byte con el adjunto separado; sus diez recetas y 50 fichas coinciden con el tramo final del JSON en los campos revisados. El XLSX no contiene macros ni conexiones externas; dos fórmulas aritméticas se leyeron como texto, sin ejecutarlas. Tampoco se ejecutaron scripts o enlaces suministrados. No se detectaron caracteres de sustitución U+FFFD ni patrones comunes de codificación dañada en el acumulado.

Los originales y los cinco idiomas se conservan sin reescribir sus bytes. El paquete ligero no incluye los ZIP históricos originales: conserva textos heredados del paquete grande que lo contradicen. No se presenta como recibida ni verificada una fuente histórica ausente. La integridad de archivos y la coherencia de campos no equivalen a una revisión lingüística nativa o certificación alimentaria.

## Fuente pública y conservación local

El repositorio de GitHub es **público**. El ZIP completo de 150 recetas se conserva intacto en `referencias/recetas-v83/originales/`, carpeta ignorada por Git. No se sube ese ZIP original a GitHub ni a la preview: contiene las 30 recetas retenidas y las expondría aunque la aplicación no las mostrara. El XLSX del lote final se conserva junto al original; la fuente pública seleccionada permite reproducir la integración sin ese archivo.

La [fuente pública reproducible](../referencias/recetas-v83/README.md) contiene solo las **120 recetas seleccionadas y sus cinco idiomas: 600 fichas**. Su ZIP `fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip` tiene SHA-256 `5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62`. La comparación independiente con decimales exactos confirmó que sus 120 registros conservan íntegros los valores originales. De las 30 retenidas solo se conserva públicamente ID, posición, motivo y hash, sin títulos, ingredientes o instrucciones.

`python3 scripts/import-recipes-v83.py --check` reproduce y compara los artefactos desde esa selección pública, sin acceder al original completo. Las pruebas de CI usan esta fuente y no dependen de un archivo privado ni omiten casos por su ausencia. El modo explícito `--source-zip RUTA --check`, cuando se dispone del adjunto original, repite la auditoría completa de 150 registros y los 13 hashes, y comprueba que produce exactamente la misma selección. El [manifiesto de importación](../referencias/recetas-v83/MANIFIESTO_IMPORTACION.json) distingue ambos alcances.

El búlgaro de las 120 seleccionadas queda en la fuente pública; las otras 30 versiones búlgaras permanecen en el original local. No se activa una quinta interfaz incompleta ni se presenta la selección técnica como autorización comercial o confirmación de catas.

## Disponibilidad conservadora: 120 nuevas y siete anteriores

Se separa la fuente íntegra conservada localmente de las recetas que puede abrir la aplicación. El código incorpora **120 recetas V83 y conserva las siete anteriores: 127 registros disponibles**. No sustituye ni renumera los IDs originales, las recetas anteriores o sus traducciones. La firma histórica de las siete y la admisión de sus IDs en los planes están comprobadas en unitarias y en la regresión de navegador. El recorrido V83 confirma que un nuevo ID se guarda en el plan y sigue resolviéndose después de recargar.

Las otras 30 fichas se conservan en el original local y permanecen fuera de la fuente pública, del catálogo activo y de las traducciones compiladas mientras se aclara su estado. La pregunta al propietario está pendiente de respuesta; ni el tiempo transcurrido ni una indicación general de continuar se interpretan como confirmación de cata o revisión operativa.

| Posiciones de fuente | Dato observado | Decisión de esta preparación |
|---|---|---|
| 11–20 · JJ-E03-011 a JJ-E03-020 | La capa superior impide publicar sin confirmar prueba; las traducciones afirman cata confirmada. | Retenidas. No elegir silenciosamente la capa más permisiva. |
| 31–40 | La capa superior y las cinco traducciones mantienen la cata pendiente. | Retenidas hasta aclaración explícita. |
| 111–120 · JJ-R010 a JJ-R019 | La capa superior confirma cierre/cata; las traducciones mantienen publicación condicionada y cata pendiente. | Retenidas hasta resolver la contradicción. |
| 10 · JJ-E03-010, carbonara | La fuente condiciona el uso a huevo y yemas pasteurizados. | Mantener esa condición y la advertencia explícita en la ficha; no presentarla como certificada. |

Las posiciones 121–130 no son el bloque discrepante 111–120. El nombre «cierre 150 recetas» identifica cobertura documental; no prueba 150 aprobaciones comerciales. Ninguna de las 30 retenidas se activa sin la aclaración del propietario y una entrega revisada.

## Adaptación mínima y conservación del contenido

| Aspecto | Tratamiento implementado |
|---|---|
| Idiomas | Las cuatro interfaces de lanzamiento siguen siendo es/en/de/fr. BG se conserva en la fuente; no se habilita una interfaz búlgara con navegación, formularios, errores o accesibilidad incompletos. |
| Traducciones | Títulos, ingredientes, pasos, avisos y adendas localizadas se centralizan. La ficha se identifica por ID y línea; no se elige arbitrariamente una traducción global cuando el mismo nombre español varía entre recetas. |
| Notas de origen | Las últimas adendas localizadas se muestran junto a la receta. Si una nota original no tiene traducción, se conserva el español con el respaldo identificado expresamente, sin inventar una traducción ni ocultar el original. |
| Tiempo desconocido | En la fuente completa, 90 de 150 recetas no tienen minutos de preparación/cocción; entre las 120 seleccionadas son 80. Se muestran como «Tiempo no indicado» y se excluyen cuando se aplica un máximo de tiempo. No se usa cero ni se estima el total. Reposos, enfriados e infusiones permanecen en los pasos; el tiempo de preparación/cocción no representa necesariamente toda la espera. |
| Precisión | Cantidades medidas representadas como enteros en milésimas. Conservar 0,2/0,3 g y 1,2/1,6 L; no truncar a cero ni redondear gramos como unidades contables. Ajustar personas con las reglas de escalado ya existentes. |
| Partes y tamaños | Diente, hoja, rama, tallo, tira, vaina, rebanada y otras unidades contables se adaptan a `ud` conservando un calificador visible en el nombre. «Ajo (diente)» no significa una cabeza de ajo. «Unidades de 250 g» conserva el número de piezas y tamaño declarado. No se inventa una conversión a gramos. |
| No medidos | Las tres sales de JJ-E03-004, JJ-E03-007 y JJ-E03-010 permanecen visibles al gusto, sin inserción automática en la lista. Nunca se inventa 1 ud o una cantidad cero. |
| Opcionales | Pan/papas sugeridos como acompañamiento permanecen fuera de la transferencia automática, sin cantidades inventadas. Los ingredientes medidos opcionales conservan esa condición. |
| Avisos | Conservar los avisos localizados de alérgenos, manipulación, conservación y límites comerciales; no reemplazarlos por una advertencia genérica ni truncarlos al límite de una nota de compra. |
| Dietas y alérgenos | Las nuevas recetas sin revisión específica no entran por inferencia en los filtros vegetariano/vegano. Una lista vacía de alérgenos no acredita ausencia de alérgenos, trazas o composición de un producto comercial. |
| Lista y guardado | Mantener revisión, cancelación y confirmación existentes. Cancelar no escribe; confirmar ingredientes solo puede cambiar la compra destinada. No trasladar precios ni certificaciones inexistentes. |

La composición, marcas, SKU, trazas, etiquetas y precios oficiales no quedan resueltos por este catálogo. Una cata declarada del usuario no es certificación sanitaria, microbiológica o lingüística externa. No se incorporan precios, ahorro, stock ni autorización comercial ficticios.

## Rendimiento, diseño y arquitectura

El catálogo y las sustituciones muestran recetas de 20 en 20; las opciones de exclusión de ingredientes se amplían de 40 en 40. Los cálculos están memoizados según sus entradas. Los recorridos de navegador comprobaron acceso a la última receta y sustitución paginada, textos y avisos, manteniendo los estilos existentes. Las comprobaciones geométricas cubren texto renderizado en los tamaños CSS probados; no certifican teclado, zonas seguras o VoiceOver físicos.

Se conservan Verde Mercado Premium, el logotipo oficial, los siete documentos locales y sus mecanismos de escritura segura. La integración es un catálogo estático de aplicación: no requiere un backend, importador XLSX en el cliente, telemetría o servicio nuevo. Las listas y planes del usuario no se sustituyen por datos de prueba. La elección de idioma tampoco reescribe esos documentos.

Esto no crea todavía una biblioteca de recetas editables con importación/borrado por el usuario ni sincronización. Cualquier capacidad posterior se debe describir y validar por separado; archivar fuente y ampliar el catálogo no acredita esas funciones.

## Comprobaciones de esta entrega

La auditoría independiente de contenido y la del contrato de aplicación identificaron los límites anteriores. La revisión de implementación comprobó la selección pública contra los originales y ejecutó 18 pruebas focalizadas; corrigió además la validación de arrays con huecos en los ingredientes sin medida. Los informes de esta versión están en [verificación técnica](../design/v83/reports/technical-verification.json), [revisión independiente](../design/v83/reports/independent-review.md), [comparación de fuente pública](../design/v83/reports/independent-public-selection.json), [recorridos WebKit](../design/v83/reports/webkit-journeys.json) y [regresión Chromium](../design/v83/reports/chromium-regression.json). Los resultados de la entrega iPhone anterior pertenecen al commit `54fc7efe3980f4295f3e873aa7710276903c3f7a`, [PR #12](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/12); no se reutilizan como prueba de V83.

La matriz Chromium terminó con **298 casos correctos y 24 omisiones deliberadas de duplicados**, con artefactos anteriores intactos. Incluye 120 capturas de recorridos y 300 del inventario V2, con 16 vistas y nueve ejemplos de estado. La matriz WebKit terminó con **16 casos correctos, cero omitidos y cero intermitentes**: ocho del recorrido diario y ocho de recetas V83, en es/en/de/fr y tamaños CSS 375 × 667 y 430 × 932. Generó 120 capturas lógicas, 80 del recorrido diario y 40 de V83. Se revisaron además dos capturas de detalle, alemán a 375 y francés a 430, sin nuevos problemas visibles en ellas; esto no acredita aceptación visual completa ni ejecución física.

| Comprobación V83 | Estado de esta entrega |
|---|---|
| Manifiesto del ZIP y coincidencia XLSX/JSON | Comprobado en auditoría documental de solo lectura. |
| Reproducción de fuente pública e integridad de la selección | Correctas: 120 registros originales íntegros, 600 fichas, ausencia de los 30 contenidos retenidos y CI independiente del original local. |
| Validación de catálogo, IDs, idiomas, advertencias y medidas | Comprobada en las 18 pruebas V83, incluidas las 120 recetas en los cuatro idiomas de interfaz y el respaldo al español. |
| Hash de las siete recetas anteriores y planes existentes | Firma histórica e IDs comprobados en unitarias; regresión de datos locales y guardado/recarga de un ID V83 correctos en navegador. |
| Escalado de recetas medibles | Correcto para cada receta a 1, 2, 4 y 12 personas, con fracciones, partes contables y límites del contrato de compra. |
| TypeScript y pruebas unitarias | Correctos: 981 pruebas, cero fallidas u omitidas, en 27 archivos; 963 anteriores y 18 de V83. |
| Dependencias y seguridad | Sin dependencias nuevas ni cambio de versiones. El audit actualizado mantiene tres avisos moderados de herramientas Expo/fingerprint/minimatch, cero altos y cero críticos; no se presentan como resueltos ni como garantía de ausencia de vulnerabilidades. |
| Exportaciones web/iOS/Android | Correctas desde `dist-v83-final`. Son paquetes de exportación; no una aplicación iOS firmada o instalada. |
| Regresión Chromium | 298 correctos y 24 omisiones deliberadas de duplicados; artefactos anteriores intactos. |
| UI de recetas nuevas en cuatro idiomas y dos tamaños | Correcta en WebKit Linux, incluidos tiempo desconocido, unidades especiales, avisos largos, paginación y persistencia de la última receta seleccionada. |
| Transferencia exacta revisada, cancelación y siete documentos protegidos | Correctas en los 16 recorridos WebKit: coincidencia entre lo revisado y guardado, ingredientes sin medida excluidos, presupuesto/producto manual conservados y documentos ajenos a cada escritura intactos. |
| GitHub, commit de origen y preview protegida | Publicados y comprobados: [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), fuente `0ea49b597f45b401747e20d7d880c07f670b3073`, staging READY `dpl_Ba9JkTFd9o1pNG6TknGriMgMxVGs`; es/en/de/fr, 29 recursos/URLs por hash y catálogo remoto de 127 recetas verificados. |
| Aclaración editorial de las 30 retenidas | Pendiente de respuesta del propietario; no activar entretanto. |
| Safari/iPhone físico y aceptación visual | Pendientes. WebKit en Linux no sustituye esas pruebas. |


## Publicación protegida comprobada

El propietario autorizó expresamente publicar las 120 recetas seleccionadas, sus cinco traducciones y los manifiestos en el repositorio público. El código y la fuente llegaron a [PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15) antes de desplegar. La fuente de la aplicación publicada es `0ea49b597f45b401747e20d7d880c07f670b3073`, rama `codex/v83-recetas-auditadas`. El original completo y los contenidos de las 30 retenidas siguen fuera de Git y de la preview.

Staging READY `dpl_Ba9JkTFd9o1pNG6TknGriMgMxVGs`, origen protegido https://jj-compra-inteligente-np116q25a-cmj2hwhc6b-1051.vercel.app. La protección `all_except_custom_domains` se conservó; el origen sin credencial no es un acceso público. El enlace temporal se comparte por la conversación y vence el **13/11/2026 a las 15:56:07 UTC**; su credencial, las capturas y el estado del navegador no se guardan en Git.

La verificación remota terminó correctamente en es/en/de/fr, sin errores, con 29 recursos/URLs comprobados por hash. En cada idioma se comprobó explícitamente el catálogo de **127 recetas** y la receta V83 `JJ-E03-001`, además de guardado local, copia de listas, preferencias y los recorridos del verificador. [Informe remoto](../design/v83/reports/hosted-verification.json), [registro del despliegue](../design/v83/reports/deployment.json) y [comprobación independiente de publicación](../design/v83/reports/publication-check.md).

El commit de cierre incorpora la verificación remota y documentación; conserva los inputs de la aplicación compilada del commit de origen. Publicar esta prueba web no confirma las catas de las otras 30 recetas, certificaciones comerciales o alimentarias, aceptación visual física ni distribución nativa.

Los perfiles EAS preparados continúan sin binario firmado ni envío a TestFlight. Las cuentas/hogares y la matriz completa de B07.2 siguen pendientes y separadas. No se declara B00–B09 terminado por ampliar el catálogo o publicar una preview.
