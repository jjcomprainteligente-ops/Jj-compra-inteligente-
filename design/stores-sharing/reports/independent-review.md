# Revisión independiente final: tiendas y copia de lista

Fecha: 2026-11-11T01:09:42.462745+00:00. Revisión estática de solo lectura, sobre `codex/tiendas-y-lista-compartida`. Base local `338ba24`, con integración pendiente del PR #4 `2ae8d27` y la función nueva de compartir. No se modificaron fuentes, configuración, historial o documentación del repositorio por este revisor. Este informe se escribe únicamente en scratch.

## Dictamen

No se identificó un defecto bloqueante nuevo en los archivos de código enumerados. La lógica inspeccionada preserva los datos y exige una acción explícita para salir de la aplicación o entregar texto. Esto no certifica por sí solo los recorridos: la entrega debe incorporar los resultados reales de compilación, navegador y verificación remota sobre la fuente final.

### Corrección posterior del retorno de foco

Revisión adicional: 2026-11-11T01:20:47.068591+00:00. Las pruebas de Chromium del agente principal detectaron un fallo al cerrar Compartir: el `busy` de los controles de fondo también deshabilitaba el propio botón disparador antes de que RNWeb Modal capturase su foco. La primera revisión estática no detectó ese comportamiento; no debe presentarse como sustituto de la prueba de ejecución.

Se revisó el ajuste en `ShoppingApp.tsx` y `HomeList.tsx`: `shareDisabled` deriva únicamente del estado real de almacenamiento, mientras `busy` continúa bloqueando las demás acciones detrás del modal. El disparador de Compartir permanece enfocable para que RNWeb pueda capturarlo y restaurarlo. Su handler `openShare` conserva la guardia `navigationBusy`, que incluye el snapshot abierto y el envío ocupado, por lo que mantener el botón habilitado no permite abrir una segunda revisión. El modal y su lock síncrono siguen bloqueando cierres y envíos duplicados.

La fuente no añade un trap ni una restauración paralela del foco, no modifica datos, feedback o formato del texto y mantiene deshabilitado Compartir para una lista vacía o un almacén no utilizable. No se detectó un nuevo bloqueo en esta corrección estática. La prueba final de retorno en Chromium y la compilación revisada corresponden al agente principal; este revisor no las ejecutó.

No se ejecutó la suite completa ni se realizó una prueba física por este agente. Tampoco se consultaron sitios comerciales o registros privados, se leyeron credenciales ni se instalaron dependencias.

## Copia revisada y privacidad

`prepareListShare` accede exclusivamente al nombre de la lista y a nombre, cantidad, unidad y estado comprado de cada producto. No necesita leer notas, precio, presupuesto, categoría, identificadores, fechas ni propiedades desconocidas. Las pruebas de dominio añadidas contienen getters que fallan para demostrar ese contrato cuando se ejecuten. No se exporta el documento JSON de privacidad como si fuera una lista legible.

La copia incluye pendientes por defecto; incorporar comprados exige una opción explícita. No hay escritura de almacenamiento ni inferencia de gastos, precios o ahorros. La marca literal JJ Compra Inteligente se conserva; las etiquetas, encabezados, ayuda, errores y resultados nuevos pertenecen a catálogos es/en/de/fr. La traducción opcional de nombres conocidos afecta a la presentación de la copia, no al dato guardado.

`Workspace.openShare` captura un objeto de lista separado, con cada objeto producto copiado. El panel recibe ese snapshot, no el objeto activo que pueda cambiar después. Navegación queda bloqueada mientras existe la revisión y durante una acción pendiente. Las acciones de edición de lista quedan ocupadas detrás del modal; el disparador de Compartir conserva su estado real de habilitación para poder recibir de nuevo el foco al cerrar y su handler impide reabrir mientras ya hay una revisión. Cambiar el dato persistido en otra pestaña no sustituye el snapshot revisado. Esto es compartir una copia, no sincronización de hogares ni una cuenta.

## Validación y Unicode

El dominio valida cantidad entera segura y positiva hasta 1.000.000.000 milésimas, unidad admitida y cantidades enteras para `ud`, además de booleanos de estado. Rechaza datos malformados y nombres vacíos o fuera de sus límites; no crea una copia parcial.

Los límites son 2.000 productos, 100.000 unidades UTF-16 y 256 KiB UTF-8 para el texto final. El contador UTF-8 no requiere TextEncoder nativo y rechaza sustitutos Unicode huérfanos. El delivery vuelve a comprobar tamaño de caracteres y bytes antes de llamar al navegador o compartir nativo. No se trunca texto para aparentar un resultado completo.

Los nombres se convierten a una sola línea solo en la copia. Se preservan acentos, emoji, caracteres no latinos y secuencias Unicode descompuestas. Controles, saltos de línea y controles bidi, incluido U+061C añadido durante esta revisión, se sustituyen por espacios. El texto con etiquetas como `<img ...>` sigue siendo texto literal: la vista previa usa `Text` y la descarga es `text/plain;charset=utf-8`; no se usa HTML de usuario ni CSV.

## Acción explícita, cancelación y ciclo de vida

El componente usa un lock de referencia antes de las actualizaciones de estado, evitando doble envío o cierre en la ventana anterior al render de `busy`. El cambio de la opción comprados también respeta ese lock. La preparación del texto es local; después de la pulsación no hay un await anterior a `navigator.share`, por lo que se conserva el gesto del usuario.

El texto enviado es la misma cadena inmutable mostrada en la revisión. Abrir la revisión no llama a Share, no descarga ni escribe en el portapapeles. La aplicación no elige destinatario ni construye un enlace a un servicio externo con el contenido de la lista.

En web se exige contexto seguro y disponibilidad de la API para ofrecer Share. AbortError se trata como cancelación; un rechazo no inicia una descarga por otro camino. La descarga `.txt` tiene botón separado y nombre fijo seguro. Es un Blob local; el enlace temporal se elimina, la URL se revoca después de 30 segundos y las URLs pendientes se liberan al salir del componente o ante un error.

Nativo usa `Share.share` con mensaje de texto plano. La interfaz no interpreta `sharedAction` como prueba de recepción o guardado: pide comprobar el destino elegido. Dismissal y AbortError preservan la revisión sin anunciar un envío exitoso. El flag de montaje impide actualizar resultados después del desmontaje; el cleanup dispone el controller y libera los recursos.

## Tiendas y conservación de preferencias

Los destinos públicos son seis constantes HTTPS admitidas por allowlist, sin credenciales, parámetros de lista, presupuesto, notas, dieta o carrito. Carrefour/Otra tienda continúan siendo identificadores legibles y no reciben URLs inventadas. Seleccionar todas añade las seis del piloto conservando las favoritas anteriores; quitar selección es una acción visible.

Las favoritas siguen en el almacén versionado existente y pasan por el validador y coordinación CAS/fence preexistentes. El transform conserva los recordatorios. Un fallo de lectura o escritura no se convierte en un documento vacío sobrescribible. El cambio amplía los IDs admitidos dentro del mismo esquema: una aplicación antigua puede rechazar los nuevos IDs; no debe prometerse compatibilidad retroactiva de lectores antiguos ni afirmar que se migró su ejecución. No se encontró borrado automático en esta integración.

Las estrellas ahora tienen semántica checkbox y `aria-checked` explícito, además del nombre y estado deshabilitado. Abrir una web solo ocurre desde el botón. En web se usan `_blank` y `noopener,noreferrer`; nativo conserva Linking. El código no afirma que un popup se abrió ni que se completó una compra solo porque la llamada retornó. No hay feed de precios, consulta automática, catálogo conectado ni pago en JJ.

## Endurecimiento de referrer aplicado

La primera lectura constató que Linking web aportaba `noopener` sin una política explícita de referrer en la preview. Se recomendó endurecer ese contrato para no depender de la política predeterminada del navegador con URLs de acceso temporal. No se observó ni se provocó una filtración real.

La fuente actual incorpora tanto `noreferrer` en la apertura web como `Referrer-Policy: no-referrer` en la configuración de publicación. El empaquetador exige ese header y el agente principal añadió la comprobación al verificador remoto. Los tests de destinos revisados exigen `_blank`, `noopener` y `noreferrer`. La presencia real del header en Vercel debe acreditarse con la prueba remota, no con esta inspección.

## Lámina técnica opcional

El empaquetador puede añadir únicamente dos archivos concretos de `design/brand-original-review` cuando la opción es exactamente `JJ_INCLUDE_BRAND_REVIEW=1`: HTML y CSS regulares, sin symlinks. El raster se resuelve contra el recurso compilado que coincide con el hash oficial. Este bloque no altera la allowlist de archivos compilados, no abre una ruta arbitraria desde variables, no incluye datos locales ni cambia el logo.

La fuente inspeccionada tiene once referencias al PNG original y una al CSS local, sin scripts, formularios, iframes, recursos externos o imágenes nuevas. Sus 32/48 px no se presentan como iconos aprobados. El board no cierra isotipo, vector, transparencia ni 3D y no cambia la navegación de la aplicación.

La comprobación por regex del empaquetador es una guardia sobre estos archivos fuente revisados; no debe reutilizarse como sanitizador de HTML no confiable (su lectura de src/href se limita a comillas dobles). La fuente actual sí usa esas referencias y no recibe contenido de usuarios.

## Empaquetador y verificador remoto ampliados

Revisión adicional: 2026-11-11T01:35:44.596426+00:00. Se inspeccionaron las últimas modificaciones de `scripts/package-v2-preview.cjs` y `scripts/verify-v2-hosted.cjs`. Esta comprobación sigue siendo estática; no atribuye una ejecución remota aprobada.

El board opcional recibe una CSP limitada a su ruta: `default-src 'none'`, imágenes y estilos únicamente del mismo origen, sin base, objetos, formularios ni frames. No se aplica esa CSP a la aplicación Expo ni se permite JavaScript en la lámina. Se conserva `Referrer-Policy: no-referrer` global. La lista de archivos que admite el verificador se amplía únicamente con los dos paths fijos del board, sin admitir directorios arbitrarios. Los mismos controles de ruta real, hash y tamaño se mantienen.

La comprobación remota de recursos exige ahora la política de referrer y, para el board, una CSP que contenga `default-src 'none'`, además de bytes y huellas exactas. La navegación de la lámina verifica encabezado, once imágenes cargadas con el tamaño nativo del PNG aprobado y ausencia de desbordamiento horizontal. Es evidencia de ese original escalado, no aprobación de derivados o de identidad nueva.

El smoke de tiendas selecciona las seis opciones, verifica el guardado y la semántica checkbox, y sustituye `window.open` por una captura local: no navega a comerciantes reales. Exige seis llamadas HTTPS sin credenciales, parámetros o fragmentos, `_blank`, `noopener` y `noreferrer`; las constantes de destino exactas siguen contrastadas por la fuente y las pruebas de navegador correspondientes.

El smoke de compartir crea un producto QA con una nota privada ficticia, abre la revisión, exige que la nota quede fuera y compara el archivo `.txt` descargado con el texto exacto mostrado, incluido nombre fijo de archivo. Cerrar debe devolver el foco al disparador. Las seis claves de negocio y la preferencia se comparan por separado antes/después, por lo que la afirmación de siete documentos conservados ya tiene una comprobación explícita. El contenido raw de la preferencia en la copia JSON también se compara con el séptimo documento actual. Esta ampliación evita confundir el helper `snapshot` de seis documentos con una verificación de siete.

El patrón de detección de claves visibles incluye ahora `storePilot` y `listSharing`. Las capturas y datos generados por estos recorridos proceden de contextos QA del verificador; sus resultados finales y la prueba efectiva de headers publicados deben incorporarse por el agente principal antes de compartir la preview.

## Pruebas y límites de esta revisión

Se leyeron las pruebas de dominio, delivery y navegador nuevas, además de los contratos existentes de preferencias. Incluyen snapshot revisado, exclusión de campos privados, límites, Unicode, salida exacta, cancelación, error sin fallback, API ausente, bloqueo durante Share y retención de preferencias. No se ejecutaron por este revisor y no se atribuye un número de aprobadas.

Quedan fuera de la evidencia estática el teclado y safe areas físicos, VoiceOver/TalkBack, compartición a una aplicación real, límites del destinatario, Safari en hardware Apple y la aceptación visual. Los mocks nativos y los motores web no cierran esas puertas.

## Huellas de la fuente revisada

| Archivo | SHA-256 |
|---|---|
| `src/domain/listSharing.ts` | `6802c2212b08c68da6e4815e7397437c5e2274abe0b5dc23dc0b32e9ced8db45` |
| `src/app/listShareDelivery.ts` | `fafae6508e6ef3fd133b209adebd31bb8c07ee65539f1c4829651ed438a500a3` |
| `src/app/components/ListShareSheet.tsx` | `8737c8f7e4d85d3fe58d877d43cfe7b868e8eb65fa311e7bd6915b75f3344945` |
| `src/app/ShoppingApp.tsx` | `027d00087d11d1b44323737e3ab5f51d639a61e2a46d4ff44e8568ef5df6e560` |
| `src/app/screens/HomeList.tsx` | `015d781ebf2c29dd25dc362895a24d193299902c6fa2c6eb7bd327d28643bec1` |
| `src/app/screens/LocalSettingsScreens.tsx` | `0286b5bf05e7f6883a4c5baf7db5a70ebc0c498cf898bd56c94d914fb1404658` |
| `src/domain/localPreferences.ts` | `4a0f2dd6ca705888a28a0c30d8fa39b33cb9c0edc4eda67c725d9bf5be0e9f0d` |
| `src/domain/stores.ts` | `525f3067ff91c0a60a1e026188181e700ed95e1435be032ad41e4ddead97f11e` |
| `src/i18n/catalogs/listSharing.ts` | `d0957ad1541b28745de5122d66aa38ed01ff12d628fbd69ea9b81e136077cad8` |
| `src/i18n/catalogs/storePilot.ts` | `2f5fd013e8f79031302cdb83c374a8ffa5450aa238d2070e3d94b5536031d321` |
| `src/i18n/resources.ts` | `de597dfe15d0189bf6eb322fd3929835bba900920ca6bea6d05a1bd3106412a4` |
| `scripts/package-v2-preview.cjs` | `953b6d6e8352c9c6b8379dc0bbcd6d0847414fe35b61c325f214b5b8d4ee6f56` |
| `scripts/verify-v2-hosted.cjs` | `f88a46fa782c484132c856669f4455694efcf3898d463f6f4b068af0995c2ec5` |
| `deployment/preview/vercel.json` | `ded464ceffba6726947dbeb0180d4dd143c110a1615c2ef127fc94919231ec9d` |
| `design/brand-original-review/index.html` | `c2d7205c67f2c6e899f83c28a6bc32c0314ff4302331665853b97b97a656c792` |
| `design/brand-original-review/review.css` | `994b8afbbe7a95bce8ec34d1475d5e368dd10dcff071b188cb5bc140a3cc3a9a` |
