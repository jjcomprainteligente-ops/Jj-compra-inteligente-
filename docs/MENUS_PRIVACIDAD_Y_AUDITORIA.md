# Menús y privacidad local · entrega de dos bloques

9 de noviembre de 2026. Código de aplicación: `fd78ecb09a2d141a9c23426be4a80d087908b1b5`, rama `codex/menus-privacidad-local`, [PR #3](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/3). La base es la entrega local anterior (`52ea41d`, PR #2), cuyo historial y artefactos se conservan.

## Bloque A · filtros de Menús

Se puede filtrar el catálogo por tiempo, preferencia de ingredientes y exclusiones elegidas. Los nombres se traducen para presentar las opciones; las claves de ingredientes permanecen canónicas. Las clasificaciones vegetariana/vegana se aplican al contenido revisado de las siete recetas iniciales, sin heredar una etiqueta por reutilizar un ID. No certifican alérgenos o trazas.

Los filtros viven únicamente mientras la pantalla Menús está montada. No guardan preferencias alimentarias ni alteran el plan existente al aplicarse o restablecerse. Una nueva semana exige cinco recetas distintas y una propuesta confirmada antes de sustituir el plan. Si faltan cinco candidatas, informa del número disponible y conserva los datos. Las sustituciones ofrecen únicamente recetas compatibles que todavía no estén incluidas en la semana.

El presupuesto activo se presenta como orientación y puede revisarse mediante el formulario existente. No filtra por precio ni inventa costes de recetas o ahorros. Se conserva la revisión de ingredientes, las raciones, la cancelación y la incorporación explícita a Mi compra.

La colección continúa siendo el catálogo inicial de siete recetas. Las 150 recetas traducidas del propietario todavía no se han recibido ni importado; este bloque no pretende sustituir ese contenido o su futura biblioteca persistente.

## Bloque B · copias y borrado local

Perfil abre una sección operativa de datos y privacidad. Permite descargar una copia JSON de los siete documentos permitidos, o una categoría individual. No enumera claves ajenas del navegador, no copia cookies o credenciales del entorno y no transmite el archivo a un servicio. El usuario elige dónde conservarlo.

Los documentos se exportan como cadenas originales, por lo que una versión futura o un contenido corrupto puede conservarse sin interpretarlo o reescribirlo. Se realizan dos lecturas y se rechazan cambios detectados; no se promete una transacción atómica entre documentos. Los límites son 10 MiB por documento y 20 MiB para el JSON final. En nativo se comparte texto JSON con el panel del sistema, limitado a un millón de caracteres; no se presenta como un adjunto de archivo nativo. La cancelación se distingue cuando la plataforma la informa y el mensaje de Android no afirma que se haya guardado una copia.

El borrado se ejecuta por categoría: listas y presupuestos, plan de menús, comparaciones, observaciones de precios, gastos confirmados o favoritas/avisos. Exige una revisión, la palabra localizada exacta y una casilla de confirmación. Se conserva el idioma y el catálogo incluido en la app. No existe un borrado global de AsyncStorage ni de datos de otras aplicaciones o dispositivos.

Cada revisión mantiene su instantánea en una clausura privada, asociada a un descriptor congelado mediante WeakMap y válida cinco minutos. La confirmación utiliza el coordinador de escrituras existente, Web Locks y protección duradera de firmas en web. Un cambio concurrente, doble envío, descriptor falso o revisión caducada bloquea la operación. Se comprueba que el resultado persistido sea el estado vacío solicitado antes de anunciar éxito.

Tras el borrado se recarga el almacén correspondiente y se retira su anterior acción Deshacer, para que no pueda resucitar datos borrados. Menús y el comparador se vuelven a leer al montarse. Un fallo conserva la revisión y exige revisar explícitamente los datos actuales antes de un nuevo intento. Un resultado incierto se identifica como tal y no se afirma que nada haya cambiado.

Los documentos que no se pueden validar no se borran desde esta interfaz: se conserva la opción de exportarlos y se explica el problema. Esta limitación evita sobrescribir una versión desconocida o datos corruptos. La ruta de privacidad sigue accesible si la compra no se puede cargar.

## Auditoría de la pareja

Se preservaron las claves y contratos existentes, las cuatro pestañas, Manrope, el logo original y los tokens Verde Mercado Premium. No se añadieron dependencias, backend, autenticación, pagos, servicios de IA ni nuevos almacenes.

La revisión detectó y corrigió un bucle Perfil → Privacidad → Perfil, una clave de traducción ausente, el alcance del selector de la propuesta y mensajes ambiguos de exportación/borrado. La entrega de copias crea y limpia su propietario por efecto; sus pruebas verifican el ciclo de vida de la fábrica y contratos simulados, sin atribuir una ejecución instrumentada de React Strict Mode o hardware real.

### Evidencia real

- TypeScript y **758 pruebas unitarias** correctos.
- **40 casos específicos** correctos en escritorio y móvil, ejecutados además por separado.
- Suite completa: **222 casos correctos**, cero fallos y cero intermitentes; 24 omisiones deliberadas de matrices duplicadas. Los 40 casos nuevos forman parte de estos 222.
- 420 capturas de la matriz base y 24 adicionales de filtros/privacidad, cuatro idiomas, sin problemas detectados de texto, desbordamiento o claves visibles. Los PNG y las copias JSON de los tests permanecen en artefactos locales; los informes de texto están en GitHub.
- Exportaciones web, iOS y Android completadas. Compilar Hermes no acredita instalación, permisos o accesibilidad en un dispositivo físico.
- 75 entradas del manifiesto original verificadas; logo SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596` intacto. La comprobación de la suite confirma que los artefactos históricos permanecen idénticos.
- `npm audit`: cinco paquetes afectados de gravedad moderada en herramientas transitivas; cero altos y cero críticos. No se forzaron versiones incompatibles ni cambios mayores para ocultarlos.

Los informes están en `design/menus-privacy/reports/`. La ejecución completa local es `design/v2/evidence/run-2026-11-09T10-01-49-632Z-6DC7ol/`.

## Preview publicada

Despliegue `dpl_DN9HdAtWMEm7sVCLkoMnGwsgYdpo`, proyecto `jj-compra-inteligente`, destino explícito `staging`, estado READY y fuente `fd78ecb09a2d141a9c23426be4a80d087908b1b5`. Protección conservada; el enlace temporal se entrega en la conversación y no se registra su secreto en GitHub. Caduca el 10 de noviembre a las 09:10 UTC.

Se comprobaron en la página publicada los cuatro idiomas, 27 recursos por hash, fuentes, logo, transporte Brotli y JavaScript exacto. El recorrido remoto guarda datos ficticios en un contexto vacío, aplica filtros sin cambios persistentes, descarga una copia con las siete claves exactas y borra el gasto confirmado tras introducir palabra/casilla. Las demás categorías permanecen idénticas. El cambio de idioma y la recarga conservan los seis documentos de negocio.

## Pendiente

Recibir las 150 recetas y definir su importación y conservación con el contenido real; aprobación estética del propietario/ChatGPT; prueba física iPhone/Safari y Android con teclado, gestos, lectores de pantalla y panel Share; trabajo de marca adicional por su revisión separada. Cuentas, hogares, sincronización y comercio real siguen sujetos a sus fases y condiciones. Esta entrega cierra estos dos bloques locales, no todos los seis paquetes o B00–B09.
