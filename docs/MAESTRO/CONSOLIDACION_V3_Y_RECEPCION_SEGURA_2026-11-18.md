# Consolidación de fuentes y recepción V3 segura

Preparación: 18/11/2026. Verificación local y publicación comprobada: 19/11/2026. Consolidación sobre la app existente, sin rediseño. Base de aplicación `04c3d0db5eab7e60667aa023806f8284ea4b0c06` y fuentes V3 `6c6cde44ae06ef48adf8040ec8b5446003bd87ba`, que incluyen main `e21d7213822bdb02080cff8943abbc28e666adf4`. Rama `codex/recepcion-v3-segura-2026-11-18`.

## Autorización y alcance

El propietario aprobó las 150 recetas y pidió retirar material y ramas superados. La autorización para incorporar el texto queda registrada y sigue vigente. Se prepara la recepción técnica y una base común revisable. El último envío mantiene 138 fotos pendientes; la activación del catálogo fotográfico completo requiere completar y comprobar esos archivos.

La política vigente exige conservar main hasta obtener aceptación y autorización explícita para fusionar. Este trabajo prepara un PR contra main; «sigue» no se interpreta como autorización de esa fusión ni de una promoción a producción.

La autorización de limpieza permite preparar la retirada de ramas cuya superación se haya comprobado, con respaldo verificable y cotejo del SHA remoto. Las ramas con trabajo único se conservan; su edad no determina que sean prescindibles.

## Cambios concretos

- Se reúnen en una rama la aplicación probada del PR #27 y los materiales de recepción del PR #28. La fusión local no presenta conflictos. De las 101 entradas de aplicación de la base, 99 conservan sus hashes. Pantallas, cantidades, IDs, claves locales, logo y tipografía permanecen intactos.
- La comprobación actual de compatibilidad exige el parche Expo 58.0.26 frente a 58.0.25. Se actualizan exclusivamente `package.json` y `package-lock.json` para ese parche, con `expo: ~58.0.26`, dentro del mismo SDK 58 y sin ejecutar scripts de instalación. Los tipos, las pruebas y las exportaciones se repitieron sobre las dependencias finales, con resultados correctos y hashes de artefactos registrados.
- Un motor offline central valida los cuatro perfiles de entrega: `original`, `github16`, `v3b` y `app10mb`. Los cuatro comandos anteriores delegan sus controles en él, evitando implementaciones divergentes y corrigiendo la lectura JPEG con alto y ancho invertidos.
- Verifica tamaños y SHA de paquetes, entradas y CRC de ZIP, rutas, tipos, cifrado, expansión, JSON, estructura de fichas, IDs, idiomas y enlaces únicos de foto. Usa Pillow 13.0.0 fijado para comprobar contenedores y decodificar imágenes completas. Procesa las fotos una a una para limitar el uso de memoria.
- La opción `--photos-dir` permite fotos sueltas como alternativa exclusiva a los ZIP fotográficos. Cada foto se verifica frente al ZIP de datos fijado para su perfil; esto conserva las fotos ya recibidas sin exigir un nuevo empaquetado.
- `--audit-available` es solo lectura, reporta recepción incompleta y termina con código 2; no crea staging. La preparación exige todas las fotos y un destino nuevo, sin sobrescribir app, fuentes o resultados anteriores. Un fallo no se presenta como éxito.

## Estado real de los datos

El ZIP de datos original contiene 150 recetas, 750 fichas en es/en/de/fr/bg y 150 referencias fotográficas. Se han recibido 12 PNG, con un tamaño conjunto de 31.350.602 bytes, además del ZIP de datos de 1.995.677 bytes. Faltan 138 fotos.

Los perfiles no son intercambiables. Por ejemplo, `app10mb` requiere su propio ZIP de datos de 1.994.471 bytes y sus diez paquetes JPEG; sus rutas y hashes difieren de los del perfil original.

Las fuentes V3 permiten publicar texto y fotos, pero mantienen deshabilitadas las afirmaciones de precio real y seguridad de alérgenos. La comprobación por hash y decodificación no certifica derechos, correspondencia visual, revisión lingüística externa ni datos comerciales.

La app conserva 120 recetas V83 y siete anteriores: 127 accesibles. El motor nuevo no escribe el catálogo del cliente ni los siete documentos locales. La incorporación de las 150 recetas y de sus imágenes completas tendrá pruebas y un registro de entrega propios. La presencia de BG en la fuente no habilita por sí sola toda la interfaz en ese idioma.

## Respaldo y limpieza de ramas

Se guardó un bundle de todas las referencias antes de la consolidación: **111.641.061 bytes**, SHA-256 `7e551562beadb6fe75f44e33f20c5bb7fbf39cce3f9dcc155544bf4671d550a3`. Se restauraron los 26 extremos de rama y sus 26 referencias remotas en un repositorio bare privado. La comprobación `git fsck --full --strict` terminó correctamente.

Se creó además en GitHub la etiqueta `respaldo/ramas-2026-11-18`, que apunta al commit `76cc65eb80a92a73053cb4159d08062ca73e3900`. Sus 24 padres distintos conservan los 26 extremos de rama de la captura, junto con un registro de nombres y SHA. El respaldo Git no incluye archivos privados ignorados y no acredita una copia externa de todo el entorno.

La clasificación propone retirar **20 ramas superadas tras aceptar la consolidación y una duplicada exacta de main**. Se conservan main, la rama de recepción V3 y tres ramas con commits únicos: propuesta de precios abiertos, documentación B06 y piloto.

**Todavía no se ha eliminado ninguna rama.** Antes de retirar una referencia se debe reconsultar su SHA, comprobar el respaldo y la integración aceptada, y ejecutar una operación que compruebe el extremo remoto para preservar trabajo concurrente.

## Evidencia de esta candidata

Verificación local terminada: 1.549 unitarias de app, 110 Python —59 nuevas—, tipos, catálogo, npm sin avisos conocidos y compatibilidad Expo correctos. Pasan 60 casos de recorridos/Inicio y 24 regresiones de menús; sin omisiones, fallos o intermitencias. Las exportaciones web/iOS/Android son correctas. El web independiente mantiene el SHA-256 `e94ac54f48b69527c065c362712b5cb03824356565a2046711260508c4a6f592`; el web del export conjunto es distinto y se registra por separado. [Evidencia local](../../design/v3-intake/reports/local-preparation.json) y [recuperación de ramas](../../design/v3-intake/reports/branch-recovery.json). Fuente `d0c71a7c2dabac1e5bd2f25e8ad5a70fd829d9dd`, [PR #29](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/29), CI de push y PR correctas y preview protegida verificada. El cierre documental posterior conserva los inputs de la fuente comprobada. Las matrices antiguas de B05.2 conservan su fuente original y no se atribuyen a esta candidata.

El cierre debe distinguir la verificación de la herramienta de las pruebas de la app. La implementación de pantallas y datos permanece idéntica. El parche de Expo se validó con nuevas comprobaciones y exportaciones, cuyos hashes quedaron registrados. La aceptación estética, la prueba física y la recepción de los 138 originales pendientes conservan sus propios registros.

## Siguiente acción

Revisar el PR #29 con CI y staging verificadas y obtener aceptación y autorización explícita para integrarlo en main. Ejecutar después la limpieza ya autorizada, cotejando los SHA remotos contra el respaldo; todavía no hay ramas eliminadas. La activación de las 150 fotos requiere completar la transferencia. La fusión en main exige la autorización de integración contemplada en la política vigente. Las fuentes comerciales permanecen pendientes de verificación.


## Publicación comprobada · 19/11/2026

Fuente `d0c71a7c2dabac1e5bd2f25e8ad5a70fd829d9dd`, árbol `72a62611f1099fe05e1183a5927368d1b0794b79`, [PR #29](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/29). Conserva como padres la app `04c3d0d` y las fuentes `6c6cde4`. El PR incluye trabajo heredado que aún no estaba integrado en main; los 57 paths de esta recepción no representan por sí solos todo el diff acumulado contra main. CI [push 44503332195](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44503332195) y [PR 44503457652](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44503457652) correctas sobre la fuente exacta.

Staging `dpl_9GyW8ij3xX4dgZtw7Q3F1jwH2v1K`, READY, [origen protegido sin credencial](https://jj-compra-inteligente-16buip6v1-cmj2hwhc6b-1051.vercel.app). Se empaquetan 13 archivos/1.590.470 bytes del web independiente; el JavaScript decodificado conserva el hash e94 indicado. El export web conjunto tiene su hash distinto y no es el artefacto desplegado. HTTPS comprueba cuatro idiomas, 127 recetas y 19 recursos; WebKit 375/430 pasa 16 recorridos y ocho controles de Inicio, sin fallos, omisiones, intermitencias o reintentos. El método HTTPS usa Node con proxy/CA heredados y un puente de cuerpos decodificados para Chromium; no acredita Safari físico. [Resultados, fuente y hashes](../../design/v3-intake/reports/verification.json).

Los 101 inputs finales y los hashes revisados coinciden con la fuente canónica. Los 27 binarios originales se conservan por SHA Git, sin volver a publicarlos como texto. Protección `all_except_custom_domains`, main `e21d721` y producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3` comprobados y conservados. Acceso temporal enviado por conversación hasta **20/11/2026 10:13:38 UTC**; sin token en repositorio o informes públicos. Las 138 fotos, la activación de las 150 recetas, la aceptación visual/física y las fuentes comerciales siguen pendientes.
