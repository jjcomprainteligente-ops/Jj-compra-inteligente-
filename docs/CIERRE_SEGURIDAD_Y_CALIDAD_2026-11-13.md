# Seguridad y calidad · entrega del 13/11/2026

Se corrigen los avisos conocidos de dependencias y tres defectos medidos de accesibilidad sobre la aplicación existente. Se añade comprobación reproducible de contraste, áreas de interacción, estados pulsados y rendimiento del recorrido diario. Se conservan Verde Mercado Premium, el logotipo original, los siete documentos locales y sus protecciones, los IDs y el catálogo de **120 recetas V83 más siete anteriores**. Las 30 retenidas siguen fuera del cliente y del contenido público.

Esta entrega amplía B08 y su auditoría; **no cierra todos los bloques B00–B09 ni acredita ausencia absoluta de errores o vulnerabilidades**. La aceptación visual, la prueba física y B07 tienen criterios distintos que siguen abiertos. El punto de partida es `5795f299e35186f372c325299d8a6828993df720`, en la rama `codex/cierre-seguridad-y-calidad`.

## Dependencias: corrección acotada y comprobada

Los tres avisos moderados anteriores procedían del mismo aviso `GHSA-g3hv-75wg-m249` en la cadena de herramientas Expo/fingerprint/minimatch. Se aplica un override limitado a `@expo/fingerprint@0.21.10` para resolver `minimatch@11.0.8`, y el parche Expo pasa de **58.0.24 a 58.0.25**, dentro de SDK 58. No hay dependencias nuevas de la aplicación ni cambios mayores de dependencias directas. La instalación de comprobación usa `npm ci --ignore-scripts`.

El salto mayor de la dependencia transitiva se contrastó con las APIs que Expo consume: constructor `Minimatch`, `.match()`, `.pattern`, `.negate` y los adaptadores de rutas de Expo. Se comprobaron 48 patrones, 102 rutas y cuatro conjuntos de opciones: **19.584 comparaciones directas, 8.160 de adaptadores y 4.080 de directorios; 31.824 en total, sin diferencias semánticas**. La representación interna `.set` cambia; ese consumidor no la utiliza. Esto comprueba el uso real examinado, no la equivalencia de cualquier programa que use minimatch.

Un proyecto de prueba aislado generó exactamente la misma huella Expo antes y después del override: SHA-1 `b88978baf3c3dca506ed641b9a2a8f527b2411fa`, con 17 fuentes. Esa comparación utiliza Expo 58.0.24; no se atribuye esa misma huella al proyecto completo tras el parche 58.0.25. El parche pasa por separado la comprobación oficial de dependencias y la compilación.

El audit actualizado devuelve **cero vulnerabilidades en todas las severidades**, y la comprobación oficial Expo indica dependencias actualizadas. Son resultados fechados del árbol examinado; un audit sin avisos no constituye una garantía de seguridad del producto.

## Correcciones de la interfaz

| Defecto comprobado | Corrección y alcance |
|---|---|
| Interruptor de recordatorios y opciones breves con área insuficiente. | Área mínima de 44 CSS px en los controles afectados de preferencias, unidades y filtros. El filtro «All» inglés se amplía de 41,45 a al menos 44 px. |
| En React Native Web, el interruptor activo ignoraba `thumbColor` y usaba el verde azulado predeterminado ajeno a la paleta. | `activeThumbColor` blanco solo en web; pista primaria/muted de la paleta. Se conserva el comportamiento nativo. Contrastes medidos blanco/primario ≈5,87:1 y blanco/muted ≈5,73:1. |
| La opacidad 0,65 del botón pulsado componía texto blanco y verde a **2,8983:1**. | Fondo opaco de la paleta según variante y primer plano conservado; el botón de icono usa fondo suave opaco. Los estados deshabilitado/ocupado conservan su tratamiento, con la exención aplicable a controles inactivos. |

No se cambian la identidad, las tipografías ni la composición de las pantallas en reposo. Los ejemplos de la galería continúan identificados como tales; no activan servicios, permisos o datos comerciales.

## Evidencia y alcance de las comprobaciones

La matriz completa se ejecutó sobre el export web `dist-cierre-verified`, cuyo JavaScript tiene SHA-256 **`349e6e981b1d1894fd2deb18da3f0321b4e9e8c436879a9eb628c173c636b4eb`**. Después se ajustó únicamente el ancho mínimo del filtro inglés «All». La exportación final `dist-closeout` para web/iOS/Android terminó correctamente; su JavaScript web tiene SHA-256 **`f094b7f4d002c4dacc83350d7b20f1c9858c2a60b35fe22a132cfe07d7995f3b`**. La corrección se comprobó por separado sobre ese export: **2/2 casos ingleses a 375×754 y 430×932, 74 escenas**, sin fallos medidos ni observaciones bajo 44 px. No se atribuye al nuevo compilado la identidad del anterior. Un primer intento focalizado no pudo iniciar Chromium por el sandbox del entorno; se conserva ese fallo de lanzamiento, separado de las pruebas de la app.

| Comprobación ejecutada | Resultado y límite |
|---|---|
| Regresión Chromium completa. | **298 correctas**, 24 omisiones deliberadas de capturas duplicadas; 120 capturas de recorridos y 300 del inventario. Se conservan los artefactos anteriores. |
| WebKit: recorrido diario y V83, cuatro idiomas y dos tamaños móviles. | **16/16 correctas**, sin fallidas, omitidas ni intermitentes. WebKit Linux no es Safari en un iPhone físico. |
| Contraste/áreas, es/en/de/fr ×375×754 y 430×932. | **8/8 casos, 37 escenas por caso: 296 escenas**. Incluye 25 vistas/estados canónicos y 12 paneles o variantes adicionales. |
| Mediciones de esa matriz. | **7.920 textos, 1.704 iconos funcionales, 104 límites de campos y 4.584 controles elegibles**; son observaciones repetidas, no identidades únicas. Cero incumplimientos medidos de texto, iconos, campos, interruptores o mínimo AA de 24 px; cero mediciones declaradas no compatibles. |
| Recomendación Apple de 44 px en la matriz completa inicial. | Dos observaciones: el mismo filtro «All» de inglés a ambos anchos, 41,45×44 px. Cumplía 24 px; motivó la última corrección. Verificación final focalizada: 2/2 casos, 74 escenas, cero observaciones bajo 44 px, sobre el nuevo compilado. |
| Pulsación real mantenida. | **8/8 casos, 40 estados** entre cinco variantes. Cancelación fuera del control antes de soltar, sin escrituras en los documentos locales. |
| Oráculos de calibración positivos/negativos. | **5/5 correctos**: comprueban umbrales, alfa, espaciado, exención inactiva y pintura del interruptor. |
| Navegación de teclado. | **1/1 correcto** con Tab real sobre Button, IconButton y Switch; foco visible observado. No se simula con `.focus()`. |

La auditoría no es una certificación WCAG global. Hay **1.272 registros de revisión de pintura manual** separados, además de widgets complejos, combinaciones de foco y comportamiento físico que necesitan evaluación humana. Estos registros no se contabilizan como fallos ni se presentan como comprobaciones automáticas superadas. VoiceOver, Dynamic Type, zonas seguras y uso nativo siguen pendientes.

Se añade un enganche opcional `QUALITY_AUDIT` a la cobertura visual y configuraciones independientes de calidad, calibración y pulsación. La ejecución ordinaria de cobertura conserva su funcionamiento. Las capturas y trazas sin depurar permanecen locales; los informes públicos contienen resultados y procedencia sin datos del propietario.

## Rendimiento del recorrido diario

El benchmark usa solo loopback y contextos de navegador vacíos/aislados. Recorre la interfaz existente con datos sintéticos de QA; no incorpora analítica, servicios externos ni otra clave de almacenamiento a la aplicación. Registra idioma, tamaño CSS, tiempos anónimos y bytes de recursos, sin nombres, notas, precios, IDs de compra o estado de cuenta.

Se completaron **24 ejecuciones: cuatro idiomas × dos tamaños × tres repeticiones**, sobre el mismo compilado `349e6e…` de la matriz completa. El último cambio de ancho del filtro de búsqueda queda fuera del recorrido medido. Los tiempos acción→pantalla lista incluyen sobrecoste de automatización y variación del entorno compartido; no son una medición de red móvil, Web Vitals ni rendimiento de un iPhone físico. No se inventan participantes, retención o comentarios de un piloto real.

## CI y reproducción desde la fuente pública

El workflow de comprobación usa push y pull request, Node 24, acciones fijadas por SHA, `permissions: contents: read` y checkout sin credenciales persistentes. No usa secretos, despliegues ni `pull_request_target`. Ejecuta instalación sin scripts, reproducción de la selección pública V83, TypeScript, unitarias, audit, comprobación Expo y export web. No necesita el ZIP privado completo de 150 recetas.

Una primera ejecución limpia completó toda esa secuencia. Otra ejecución simultánea con trabajo intenso de navegador registró un timeout de 5.000 ms en una prueba de carga UTF-8: 980 correctas y una fallida; se conserva el registro. Se limita la concurrencia de unitarias a dos workers, sin cambiar aserciones ni ampliar el timeout. La nueva reproducción limpia obtiene **981/981 pruebas correctas en 27 archivos** y completa correctamente el export web. La comprobación de la fuente de trabajo también pasa 981 unitarias y las exportaciones finales web/iOS/Android. La ejecución del workflow remoto sigue pendiente; preparar un workflow no acredita un run verde de GitHub.

Los informes saneados de esta entrega distinguen sus fuentes y resultados efectivos:

- [Dependencias y compatibilidad](../design/closeout/reports/dependencies.json).
- [Unitarias, reproducción limpia, exportaciones y regresión](../design/closeout/reports/verification.json).
- [Calidad B08, matriz completa y corrección final focalizada](../design/closeout/reports/b08-quality.json).
- [Mediciones anónimas de rendimiento](../design/closeout/reports/performance.json).
- [Estado B07 y revisión posterior de lectura](../design/closeout/reports/b07-status.json).
- [Revisión independiente y límites](../design/closeout/reports/independent-review.json).

La publicación, la verificación remota y la ejecución CI de GitHub se documentarán al obtener su resultado; estos informes locales no los sustituyen.

## B07: estado real del control nativo

Se realizó una única solicitud MCP de la matriz SQL original el **12/11/2026 a las 20:33:31,649 UTC**. El proveedor no devolvió resultado antes de interrumpir la espera a las 21:02 UTC. Estado: **`no_result_native_control_unresolved`**. No se contabilizan aserciones, ejecución SQL ni ROLLBACK de esa solicitud; tampoco se afirma caducidad de una confirmación que no se observó.

La revisión posterior fue solo de lectura: las 14 tablas JJ y las dos tablas Auth examinadas seguían con cero filas, sin objetos temporales ni ejecución de la matriz observada. Las 14 tablas conservaban RLS/FORCE; el lector seguía NOLOGIN/NOBYPASS y sin acceso al esquema Auth. El asesor registró diez INFO de acceso privado denegado deliberadamente, cero WARN y cero ERROR. Esta revisión no sustituye la matriz dinámica.

No se reintenta por otro canal, no se crean usuarios ni se envían correos. La autorización de trabajo ya existe: no corresponde pedir otro «sí» por chat. Si el proveedor muestra una confirmación nativa pendiente, debe resolverse ese control concreto. Un «Sigue» no equivale a respuesta del proveedor ni a aprobación de las 30 recetas retenidas.

## Entregas pequeñas que siguen abiertas

1. **Publicar la entrega técnica comprobada:** código e informes en GitHub antes de una nueva preview staging protegida; verificar el contenido remoto y entregar su enlace fuera de Git. Exportaciones finales y las dos comprobaciones inglesas tras el ajuste de 44 px correctas. Hasta registrar la publicación y verificación remota, no se presenta esta entrega como publicada ni se reutiliza el enlace V83 como prueba de ella. Observar por separado la ejecución efectiva de CI en GitHub.
2. **B07: completar la prueba real de permisos** por el control nativo, comprobar su resultado y limpieza. Después siguen pendientes de construcción BFF/cuentas, RPC, invitaciones, migración y sincronización, con configuración SMTP y secretos de servidor adecuados. La app mantiene el modo local.
3. **B08 físico:** instalación y recorrido menú → lista → compra → presupuesto, teclado, lectores, tamaños de texto, zonas seguras y feedback real. Hay perfiles EAS preparados, pero faltan cuentas/firma/distribución Apple y ejecución física; exportar iOS no crea un binario firmado.
4. **Recetas y marca:** resolver los estados de 11–20 y 111–120, y la cata pendiente de 31–40 antes de activar esas 30; revisar y aprobar derivados del logo por etapas sin sustituir el original.
5. **B06/B09:** fuentes y permisos comerciales reales antes de importar precios/stock o ampliar integraciones. Abrir las páginas oficiales no constituye un feed autorizado.

Una colección personal editable de recetas y una restauración automática de backups son posibles ampliaciones separadas. La revisión del encargo original no las identifica como requisitos obligatorios omitidos: no se utilizan para afirmar que la integración V83 esté incompleta.

La última entrega publicada acreditada sigue siendo [V83, PR #15](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/15), con fuente compilada `0ea49b597f45b401747e20d7d880c07f670b3073`. Su preview protegida y su caducidad pertenecen a esa entrega anterior; no acreditan los cambios descritos aquí.
