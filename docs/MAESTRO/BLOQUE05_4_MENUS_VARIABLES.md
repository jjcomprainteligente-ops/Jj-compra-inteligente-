# B05.4 | Selección y guardado de comidas variables

**25/11/2026 · Implementación y comprobaciones locales terminadas; GitHub, CI y publicación propia pendientes en este checkpoint.** Se continúa la aplicación existente sobre `f4f458ec7de64d0b489f538eafd7b6fa01e7f335`, cierre de B05.3, en `codex/b05-4-menus-variables-2026-11-25`. El PR #31 sigue abierto hacia main en el momento de preparar esta entrega; B05.4 se prepara como PR apilada sobre su rama, sin fusionar ninguno de los dos.

## Resultado y alcance

La propuesta inicial para esta vista de prueba permite elegir **1–14 comidas y 1–12 personas**. El rango se presenta para revisión del propietario: la orden de continuar autoriza este avance, pero no equivale a una aprobación explícita de ese rango. La interfaz identifica `Comida 1` hasta `Comida N`, sin asignar días del calendario. Conserva las bases de Verde Mercado Premium, sus componentes, el logo oficial y Manrope; añade el contador de comidas y adapta los textos existentes en es/en/de/fr.

La cantidad seleccionada se distingue de la cantidad del plan activo. Cambiar el contador o los filtros no escribe ni recorta el plan guardado. La primera preparación normal de cinco conserva el comportamiento directo anterior; las primeras propuestas de cantidad distinta de cinco y cualquier sustitución de un plan existente requieren confirmar. Cancelar conserva el plan anterior. La revisión de ingredientes identifica las comidas, personas e IDs efectivos del plan revisado, aunque haya otra cantidad pendiente en el selector.

Las dos entradas existentes siguen separadas. El recorrido de presupuesto transmite la cantidad al editar y volver al menú; sus propuestas permanecen en memoria y no reemplazan el menú guardado. Los ingredientes se incorporan únicamente tras la revisión y confirmación existentes. No se inventan precios ni se interpreta el presupuesto como coste verificado. Las notas editoriales, ingredientes sin medida y acompañamientos se muestran fuera de las filas comprables; no se les asignan cantidades ni se añaden automáticamente.

## Persistencia compatible y conservación

La clave sigue siendo `jjcompraintelwgiemt.menus.v1`: continúan los **siete documentos de negocio**, sin clave adicional ni respaldo oculto. El contrato anterior de cinco comidas conserva su forma y su serialización V1. Las nuevas cantidades usan un sobre V2 y un plan explícito `{kind: 'variable', servings, meals}`; la creación normal de cinco continúa produciendo V1. Se admite la lectura estricta de un V2 válido de cinco sin convertirlo automáticamente.

Leer no escribe, migra ni normaliza el documento durable. Los borradores crudos, filtros de sesión, texto pegado y metadatos de recuperación no se guardan dentro del plan. Los límites validan cantidad, personas, IDs existentes y únicos, arrays completos y un máximo de 2.000 ingredientes antes de agregar. La conversión desde el motor de borradores es explícita; el contrato `MealPlan` anterior sigue limitado a cinco.

Se mantienen el coordinador de escritura y el fence durable. Una carga fallida bloquea escrituras; las entradas se copian antes de esperar y los conflictos no sobrescriben el otro documento. Los documentos corruptos o de versión desconocida se conservan y pueden exportarse en bruto; su lectura fallida no habilita el borrado como si hubieran sido revisados. Esta compatibilidad permite a la aplicación actual leer V1 y V2; no promete que una versión antigua de la app pueda abrir V2 ni convierte el plan durante una vuelta atrás.

## Comprobaciones locales de la fuente final

| Comprobación | Resultado del 25/11 |
|---|---|
| TypeScript | Correcto. |
| Unitarias | **1.853 correctas**, cero fallidas o pendientes; 145 más que las 1.708 de B05.3. |
| Python | **155 correctas**; no se modificaron los scripts ni sus pruebas. |
| Reproducción de fuentes | Catálogo V83, V3 y expediente B05.3 correctos y conservados. |
| Nueva matriz de comidas variables | **36 correctas**, cero fallos, omisiones o intermitencias: tres escenarios, cuatro idiomas y Chromium/WebKit 375/430. |
| Regresión de menús/filtros/privacidad | **24 correctas**, cero fallos, omisiones o intermitencias, sobre el mismo web final. |
| Exportaciones | Web independiente y export conjunto web/iOS/Android correctos; HBC no equivale a aplicación firmada. |
| Dependencias | Consulta sin avisos conocidos y compatibilidad Expo correcta; sin cambios de dependencias o lockfile. |

La nueva matriz comprueba conservación byte a byte de V1 al leer, confirmación/cancelación y reapertura de planes de 1/5/14, cabecera de revisión referida al plan efectivo y conservación de los otros seis documentos. El filtro vegano mantiene el error al pedir 14 y permite las cuatro recetas anteriores revisadas al bajar la cantidad, sin ampliar resultados mediante inferencias. El recorrido de presupuesto pasa de 14 comidas/12 personas a una comida/una persona, conserva el menú guardado y verifica seis cantidades mediante un oráculo independiente, incluido arroz de 80 g para una persona. Hay capturas por segmentos de los estados afectados y controles de geometría; no equivalen a una revisión física de iPhone.

El web independiente probado es `dist-b054-release-web`, bundle `_expo/static/js/web/index-0d5d4dc5bd073fa1556bee700172d36e.js`, **5.655.196 bytes**, SHA-256 **`003344d3262d81539bf20f93f712f050e449994cd2f22bc39ba173038f78f6d3`**. Los 411 inputs finales de la app quedan registrados por hash en evidencia privada. El web del export conjunto es distinto (`6f02d96912ec22e613ffa0c3af009338495a81b134ae4100dff189cdeb7cc16b`) y no se intercambia con el artefacto probado para publicar.

Se conservan los intentos previos: una primera ejecución unitaria tuvo 1.852 aciertos y un fallo en el caso de límites UTF-8/JSON de privacidad durante ejecuciones concurrentes; no se afirma una causa exacta no demostrada. Sin cambiar código, aserciones o tiempos de esa prueba, pasaron las 44 focales, la suite de 1.853 y la suite final de 1.853. La primera matriz nueva falló en el selector de captura al encontrar dos diálogos; se precisó el diálogo interior, sin retirar verificaciones. Una ejecución posterior pasó 36 antes de la última corrección de cuatro textos de notificaciones; tras esa corrección se recompiló y la matriz final de 36, más las 24 regresiones, pasó sobre el artefacto identificado arriba. Los intentos anteriores no se contabilizan como éxitos de ese artefacto.

## Auditoría, entrega y pendientes

La [auditoría conjunta B05.3/B05.4](AUDITORIA_PAREJA_B05_3_B05_4_2026-11-25.md) recoge validación independiente, conservación y límites. Este checkpoint no declara completado el escaneo final del snapshot público, la CI de B05.4 o la prueba publicada: sus resultados deben añadirse al cerrar la entrega. El código comprobado se subirá primero a GitHub y solo después se publicará en staging protegida; la publicación conservará el despliegue de producción y su protección.

Las 150 recetas V3 y sus fotos permanecen disponibles junto con las siete anteriores, 157 IDs. **Las 300 decisiones editoriales de categoría y dieta continúan pendientes** de ChatGPT/producto: B05.3 entrega la corrección técnica y los 15 lotes, no una revisión culinaria ya aprobada. No hay nuevas clasificaciones dietéticas V3. Continúan pendientes aceptación visual y del rango, prueba física detallada, accesibilidad con tecnologías de asistencia y distribución nativa firmada. La UI búlgara, IA, cuentas compartidas, geografía de tiendas y precios oficiales no forman parte de B05.4. No se abre B06 ni se promueve producción automáticamente.


## Publicación y cierre comprobados · 25/11/2026

**Cierre verificado · 25/11/2026:** código en [PR #32](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/32), fuente `97d31680a8c135e415d0ab91c98a722edb5481ae`, árbol `004ea32ff4f41fb5db0abbcc24b8f16bca86ce38`. CI de fuente [push 45718435874](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/45718435874) y [PR 45718485285](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/45718485285) correctas. Staging propia `dpl_ETiXZZPa4wayg47aKF3XajzpVS7V`, READY/protegida y vinculada a esa fuente: HTTPS **cuatro idiomas/319 recursos** y **24 casos nuevos WebKit 375/430** correctos, sin fallos, omisiones o intermitencias. El web independiente publicado conserva SHA-256 `003344d3262d81539bf20f93f712f050e449994cd2f22bc39ba173038f78f6d3`. La recuperación verifica 411 inputs, 2.045 archivos del snapshot y 313 archivos del paquete, sin diferencias.

Gitleaks oficial 8.30.1 examinó los 2.045 archivos del commit de fuente,264.190.456 bytes. Conserva salida 1 por 17 alertas, todas falsos positivos de identificadores locales de almacenamiento, 0 secretos confirmados y 0 sin clasificar. Reglas predeterminadas, sin nuevas excepciones; no cubre historial, ignorados/credenciales de ejecución ni interiores de comprimidos. El control no garantiza ausencia absoluta de vulnerabilidades.

El [origen de prueba](https://jj-compra-inteligente-dcz5mwz4c-cmj2hwhc6b-1051.vercel.app) sigue protegido. Acceso temporal por conversación hasta **26/11/2026 22:27:14 UTC**; no se guarda la credencial en Git. La revisión automática rechazó inicialmente el upload del bundle por insuficiente claridad del permiso concreto; se comprobaron autorización permanente, destino protegido y procedencia exacta antes de repetir la misma subida, que fue aceptada. La interrupción del entorno no perdió archivos ni creó otro despliegue. Producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`, main `daa3f09` y protección `all_except_custom_domains` se conservan. El cierre posterior solo cambia documentación y mantiene el código/artefacto probado, sin otro despliegue por textos.

El rango 1–14 se presenta como propuesta inicial de preview, pendiente de aceptación visual y de producto; personas 1–12 conserva el límite anterior. Las300 decisiones editoriales V3 siguen pendientes. WebKit/Linux y HBC no sustituyen un iPhone físico ni una app firmada. B06 no se abre automáticamente. Los checkpoints locales anteriores conservan sus pendientes históricos; quedan superados para la publicación por este cierre y su evidencia final.

[Evidencia final](../../design/variable-meals/reports/verification.json).

La confirmación de esta entrega se refiere a crear una primera propuesta de cantidad distinta de cinco o a regenerar el plan completo. La sustitución de un plato individual conserva la selección explícita directa anterior.
