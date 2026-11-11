# Estado vigente de construcción

Actualizado el 11 de noviembre de 2026. Este inventario distingue código construido, comprobación técnica, aceptación visual y funciones condicionadas. Las auditorías y entregas fechadas anteriores se conservan como historial.

## Funciones locales construidas

- Bienvenida, idioma del dispositivo y elección manual persistente en español, inglés, alemán y francés; formatos locales y compras en euros.
- Cuatro pestañas y las 16 vistas de preparación V2. Los nueve estados de la galería se identifican como ejemplos; no representan servicios o permisos activados.
- Listas, productos, cantidades y unidades, categorías, revisión de duplicados, presupuestos y deshacer. Guardado con protección frente a datos corruptos, conflictos y resultados inciertos.
- Búsqueda entre productos guardados y ficha local. Voz/cámara opcionales en navegadores compatibles tras consentimiento y gesto; alternativa manual y limpieza de recursos.
- Menús de cinco cenas, siete recetas iniciales, personas, sustitución, filtros y revisión de ingredientes antes de añadir.
- Gastos confirmados introducidos por la persona e historial, separados de estimaciones y productos marcados.
- Comparador manual de formatos equivalentes con tienda, fecha, fuente y cobertura explícitas; sin precios comerciales importados.
- Preferencias y avisos internos locales, exportación JSON y borrado independiente por categoría con confirmación. No hay restauración automática de backups.
- Selección de una, varias o todas las seis tiendas del piloto, conservando favoritas anteriores. Enlaces oficiales separados por formato, sin transmitir listas ni carritos. Compra y pago en el comercio externo.
- Compartir una copia revisada de una lista en texto: pendientes por defecto, opción de incluir comprados, sin notas, precios, presupuesto ni identificadores. Web Share o descarga TXT explícita; panel nativo preparado sin afirmar recepción. No sincroniza hogares.

## Bloques del kit

| Bloque | Construcción actual | Criterio de cierre pendiente |
|---|---|---|
| B00 · Auditoría | Repositorio y seis paquetes originales recuperados y contrastados; historia conservada. | Mantener trazabilidad al integrar nuevas entregas. |
| B01 · Identidad | Dirección V2, paleta y raster oficial exacto; lámina técnica aislada de seis tamaños y fondos. | SVG fiel, transparencia, isotipo, iconos, variantes y propuesta 3D por etapas. No se modifica ni sustituye el original sin aprobación. |
| B02 · UX | Pantallas locales y componentes con cuatro idiomas y estados; referencia canónica conservada. | Aceptación estética del propietario/ChatGPT y contraste/usabilidad completos en dispositivo. |
| B03 · Prototipo iPhone | App Expo y exportaciones web/iOS/Android; navegador a varios tamaños y motor WebKit. | Instalación/ejecución física, teclado, zonas seguras, gestos, Safari y lectores nativos. Exportar no acredita este criterio. |
| B04 · Listas y presupuesto | Funciones locales, revisión y persistencia construidas; compartir texto añadido. | Aceptación física y uso real con listas del piloto. |
| B05 · Menús | Motor local, filtros, cantidades y revisión construidos; búsquedas con ChatGPT fuera de JJ. | Recibir las 150 recetas traducidas e implementar su colección persistente con validación. No se inventa su contenido. |
| B06 · Comparador | Observaciones y comparación manual; selección de tiendas y salida externa construidas. | Fuentes comerciales autorizadas/localizadas antes de importar precios o afirmar ahorro/stock. |
| B07 · Cuentas y hogares | B07.1: contratos y proyección probados. B07.2: proyecto Supabase gratuito UE, esquema/RLS aplicados; grants y HTTP anónimo comprobados. | Matriz dinámica SQL pendiente de confirmación de Supabase; cuentas/BFF, invitaciones, RPC, migración y sincronización todavía no activados. [Auditoría B07](B07_BASE_SEGURA_Y_AUDITORIA.md). |
| B08 · QA y piloto | Suites estáticas, unitarias y de navegador; auditoría después de parejas y previews verificadas. | Piloto físico, accesibilidad nativa, distribución y feedback de personas. Cinco avisos moderados de herramientas siguen abiertos. |
| B09 · Comercio | Salida a páginas oficiales sin datos de lista ni pago dentro de JJ. | Acuerdos, cobertura, derechos de datos y responsabilidades antes de otras integraciones. No hay pedidos, stock ni pagos procesados por JJ. |

## Verificación de la entrega de tiendas y compartir

TypeScript y 816 pruebas unitarias correctos. Exportaciones web/iOS/Android completadas. La matriz final de navegador, publicación y sus resultados se documentan en [la auditoría de esta pareja](TIENDAS_COMPARTIR_Y_AUDITORIA.md). La construcción de estas funciones no cierra automáticamente los criterios físicos, visuales o comerciales de la tabla.

## Lo que todavía requiere trabajo de construcción

1. Completar las etapas de recursos de marca con revisión y aprobación de las propuestas; la lámina del raster original no es un SVG ni un icono nuevo.
2. Incorporar las recetas del propietario cuando se reciban, con biblioteca persistente, identificación estable y controles de copia/borrado propios.
3. Preparar y aprobar la arquitectura de cuentas/hogares, y después implementar y probar los permisos y la sincronización. Compartir texto no sustituye ese trabajo.
4. Completar distribución y validación física con feedback real. No se publica un resultado de piloto sin ejecutarlo.
5. Incorporar datos de comercios únicamente cuando existan fuentes y permisos adecuados; las páginas oficiales abiertas no constituyen un feed autorizado.

No se presenta la aplicación ni B00–B09 como terminados por disponer de una preview o por superar las pruebas de los recorridos existentes.


### Publicación verificada — 11/11/2026

Fuente compilada: `c0c7a312e5ad91313a059c25c8594a12ea48a6dc`, [PR #8](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/8). Incluye ambos padres de integración `338ba24` y `2ae8d27`; no se sustituyó el trabajo previo. Staging READY: `dpl_5HaNVgJxEtpz9zX2gpWScLFnXRWU`, URL base https://jj-compra-inteligente-3y5pjf63u-cmj2hwhc6b-1051.vercel.app . Protección conservada, sin promoción a producción.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash. Comprueba selección de seis tiendas, contratos de navegación externa con mock sin ir a los comercios, copia TXT exacta sin notas privadas, retorno de foco, siete documentos intactos al compartir, backup exacto, borrado confirmado aislado, idiomas persistentes y lámina de marca con PNG original/CSP. El enlace temporal se entrega fuera de GitHub y vence el 12/11/2026 a las 11:21:05 UTC. Informe público: `design/stores-sharing/reports/hosted-verification.json`; capturas y credencial locales.

B07 tiene una propuesta concreta separada en [PR #9](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/9): documento y contrato JSON de 20 operaciones; no activa servicios ni modifica la app. Antes de activar cuentas/hogares deben aprobarse proveedor/proyecto, tratamiento y región, autenticación/correo, costes y retención, conforme a AGENTS.md:18 y B07 original:17. Las 150 recetas, derivados de marca aprobados, aceptación visual y validación física siguen pendientes; cinco avisos npm moderados continúan abiertos.


### Avance B07 — 11/11/2026

El propietario autorizó Supabase en la UE, máximo 0 €, y continuar con la organización conectada para cambiar la cuenta después. Proyecto JJ independiente creado en Frankfurt, free, cotización mensual 0. B07.1 tiene 20 validadores de solicitud y proyección inmutable sin notas/precios/presupuesto; 147 nuevas pruebas, 963 unitarias totales y TypeScript correctos.

B07.2 tiene 14 tablas con RLS/FORCE y dos migraciones aplicadas; clientes sin DML, SELECT autenticado condicionado, lector NOLOGIN/NOBYPASS y helper privado acotado para sesiones reales de Auth. Catálogo/grants y cuatro denegaciones HTTP reales comprobados; base vacía, sin usuarios ni datos de prueba. La revisión estática independiente corrigió getters, historia/épocas, padre eliminado, namespace y coherencia de nombres.

**B07.2 permanece abierto:** la suite dinámica SQL/RLS no llegó a ejecutarse: dos confirmaciones de Supabase caducadas, no resultados de pruebas. No se elude el control ni se atribuye éxito a sus casos escritos. Hay que completar la confirmación nativa, ejecutar la transacción de fixtures y comprobar ROLLBACK. La aplicación local conserva sus siete claves, diseño, logo y dependencias; no hay login/BFF, invitaciones, importación o sincronización activados. El SMTP predeterminado no acredita registro público. Diez INFO de RLS privado sin políticas de cliente son acceso denegado deliberado; índices sin uso corresponden a base vacía, y los dos FK sin cobertura se corrigieron. Siguen cinco avisos npm moderados de herramientas.

[Entrega, auditoría y criterios pendientes](B07_BASE_SEGURA_Y_AUDITORIA.md). Evidencias en `design/b07/reports/`; pruebas transaccionales en `supabase/tests/household_security.sql`. GitHub precede a la nueva vista staging protegida. Se mantienen la auditoría por parejas, las recetas del propietario pendientes y la validación física/visual separada.


### Regresión web final de B07.1–2 — 11/11/2026

298 pruebas Chromium correctas, cero inesperadas/intermitentes, 24 omisiones duplicadas deliberadas; 120 capturas de recorridos y 300 de cobertura V2 en cuatro idiomas, con artefactos anteriores intactos. La matriz SQL no se cuenta como ejecutada. [Informe](../design/b07/reports/browser-summary.json).


### Publicación y verificación remota — 11/11/2026

Fuente compilada `3fa95b99910617121e513533b265be5a8ecee047`, [PR #10](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/10), rama `codex/b07-base-segura`. Commit con dos padres: conserva `914fa2e` y la propuesta `4e0fb2a`; árbol publicado verificado contra el índice local. GitHub recibió el código antes de publicar la vista.

Vercel staging READY `dpl_9cxY4peum9BMcEneBzwnSnPA18WJ`, origen https://jj-compra-inteligente-4ahqufx66-cmj2hwhc6b-1051.vercel.app . Protección del proyecto conservada. Compilado web SHA-256 `6f57257d52de2a76106a4d41fee185dddeb0b0a935283748403eccd905e45d74`; logo original intacto. Transporte Brotli y 23 archivos publicados; no fuentes de app, paquetes nativos, fixtures, listas del propietario ni credenciales.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash, incluidas selección de tiendas, copia TXT revisada y foco, datos locales y exportación/borrado aislado, preferencias de idioma y lámina de raster con CSP. Informe público `design/b07/reports/hosted-verification.json`; imágenes y URL de acceso temporales fuera de Git. El enlace compartido vence el **12/11/2026 a las 17:28:39 UTC**.

La vista sigue siendo la aplicación local: B07.1 está construido/probado, B07.2 sigue abierto por la confirmación caducada de la matriz SQL. Esta publicación no activa cuentas, invitaciones, BFF, importación ni sincronización y no sustituye su prueba de permisos. El PR permanece borrador.


## B07.2 · Corrección de permiso Auth — ejecución confirmada, 11/11/2026

La primera ejecución confirmada de la matriz original e8cc... falló con 42501 porque el GRANT inicial no dio USAGE efectivo de Auth al lector. Se corrigió mediante migración incremental 20261111190357: puente privado de subject, propietario postgres y EXECUTE solo al lector; el gate de sesión/cuenta/membresía/hogar sigue obligatorio y el lector permanece sin Auth USAGE. No se ampliaron permisos de tablas ni se activaron cuentas.

La regresión de lectura pasó diez condiciones y los roles/ACL efectivos; se comprobó su JSON expresamente, no solo ausencia de error. Cero filas en Auth y 14 tablas JJ, cero objetos temporales. La batería completa posterior tuvo dos confirmaciones nativas caducadas; B07.2 continúa abierto. La autorización del propietario ya está dada y no se vuelve a pedir por chat. Los informes iniciales son históricos. [Corrección, evidencia y límites](B07_CORRECCION_PERMISO_AUTH.md).
