# Tiendas y listas compartibles

Pareja de construcción del 10–11 de noviembre de 2026. Base de accesibilidad `338ba24`; se integra además el código existente de tiendas `2ae8d27` del PR #4, conservando ambos historiales y los anexos de documentación. No se sustituye `main` ni se elimina otro borrador.

## Bloque A · Tiendas

Mis tiendas distingue Lidl, ALDI, HiperDino, SuperDino, HiperDino Express y Mercadona. Permite una, varias, todas o ninguna; conserva Carrefour/Otra tienda y recordatorios anteriores. El documento y su protección de guardado permanecen en la misma clave. La extensión de IDs es compatible con los datos anteriores; una versión antigua puede rechazar IDs nuevos como ilegibles y no debe usarse para reescribirlos.

Los destinos son seis constantes HTTPS oficiales. Se abren mediante gesto explícito, con `noopener,noreferrer` en web y Linking nativo. La preview añade `Referrer-Policy: no-referrer` y lo verifica en las respuestas, para no transmitir su enlace temporal como referente. No se envían listas, presupuestos, dietas, códigos postales ni carritos. No hay consultas de precios automáticas ni compra dentro de JJ.

## Bloque B · Compartir una copia

La acción Compartir está junto a las acciones de la lista y requiere productos. Abre una copia desprendida del estado actual: cambiar después los datos no cambia silenciosamente el texto revisado. Se incluyen nombre de lista, productos, cantidades, unidades y estado pendiente/comprado. Notas, precios, presupuesto, IDs y otras categorías se excluyen por construcción.

La selección inicial incluye pendientes; incluir comprados es explícito. La vista previa es seleccionable y el texto enviado o descargado coincide con ella. La copia sanea saltos de línea y controles bidi en nombres sin modificar lo guardado. Rechaza datos inválidos o demasiado grandes sin exportación parcial: máximo 2.000 productos, 100.000 caracteres UTF-16 y 256 KiB UTF-8.

Web Share se invoca directamente desde el gesto, sin preparación asíncrona previa. La descarga TXT es una acción independiente: un error no dispara otra entrega. No se utiliza portapapeles ni servidor. Nativo usa Share con texto plano y resultado neutral; completar su acción no demuestra recepción por otra persona. Cancelar o fallar conserva el texto. Un lock síncrono bloquea doble entrega/cierre antes de actualizar la UI; se liberan URLs temporales al salir y no se muestra feedback tardío tras desmontar.

La prueba en Chromium detectó que deshabilitar el propio disparador al abrir el modal impedía restaurar el foco. El disparador conserva su disponibilidad real; el controlador sigue bloqueando reaperturas y la navegación mientras la copia está abierta. Las demás acciones de edición permanecen bloqueadas durante la revisión. La comprobación de retorno de foco se conserva en la suite.

Compartir una copia no crea una cuenta, un hogar ni sincronización. No modifica ninguna de las siete claves de documentos locales.

## Marca y alcance

La lámina aislada `design/brand-original-review/` muestra el mismo PNG oficial en seis anchos y cuatro fondos. No contiene reinterpretación, recorte, recolor, transparencia inventada ni un SVG con raster incrustado. Tiene comprobación local en 375/430/1280. El empaquetador puede incluir únicamente sus dos archivos estáticos revisados, con `JJ_INCLUDE_BRAND_REVIEW=1`, en `/review/brand/index.html`, reutilizando el PNG original por hash. No añade una pantalla al flujo de la app.

Esta lámina avanza la revisión del recurso existente; no completa isotipo, iconos, variantes ni 3D. El contrato V2 vigente exige preservar el logo fuente y el brief de marca exige aprobación antes de integrar derivados.

## Verificación

TypeScript y 816 unitarias correctos; 57 casos nuevos comprueban proyección de datos, formatos, Unicode, límites, entrega, cancelación y limpieza. Exportaciones web/iOS/Android completas. La pasada final sobre `dist-stores-sharing-reviewed` registra 298 Chromium y 92 WebKit correctos, cero fallos/intermitentes; 24 omisiones deliberadas de matrices duplicadas en Chromium. Los 50 casos nuevos también pasan por separado. Se verifican las 420 capturas base y 75 referencias íntegras. Bundle web SHA-256 `2fca9579e738626e352fb6988c678dc088d5fac576c986911ab187fcb3999a4d`. Resultados en `design/stores-sharing/reports/`; la publicación remota se documenta a continuación al terminar su verificación.

La consulta npm nueva del 11 de noviembre registra cinco moderados, cero altos y cero críticos. No existe actualización oficial dentro de los rangos admitidos por Expo; `package.json` y lockfile permanecen idénticos. Los JSON de consultas anteriores no se renombraron como actuales.

Para repetir la verificación de la exportación final elegida:

```sh
npm run check
JJ_EXPORT_DIRECTORY=dist-stores-sharing-reviewed node scripts/verify-v2.cjs
```

Con la misma exportación servida en localhost:8081 y el navegador WebKit instalado:

```sh
npx playwright test --config playwright.stores-webkit.config.ts
npx playwright test --config playwright.webkit.config.ts
```

Las capturas y trazas permanecen locales. Las pruebas usan datos ficticios y contextos aislados. WebKit Linux, las simulaciones de APIs Share y las exportaciones no acreditan iPhone físico, Safari iOS, VoiceOver ni entrega real a otra aplicación. El estado total y los pendientes se recogen en [el inventario vigente](ESTADO_ACTUAL_Y_PENDIENTES.md).


### Publicación verificada — 11/11/2026

Fuente compilada: `c0c7a312e5ad91313a059c25c8594a12ea48a6dc`, [PR #8](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/8). Incluye ambos padres de integración `338ba24` y `2ae8d27`; no se sustituyó el trabajo previo. Staging READY: `dpl_5HaNVgJxEtpz9zX2gpWScLFnXRWU`, URL base https://jj-compra-inteligente-3y5pjf63u-cmj2hwhc6b-1051.vercel.app . Protección conservada, sin promoción a producción.

Verificación remota correcta en es/en/de/fr y 29 recursos/URLs por hash. Comprueba selección de seis tiendas, contratos de navegación externa con mock sin ir a los comercios, copia TXT exacta sin notas privadas, retorno de foco, siete documentos intactos al compartir, backup exacto, borrado confirmado aislado, idiomas persistentes y lámina de marca con PNG original/CSP. El enlace temporal se entrega fuera de GitHub y vence el 12/11/2026 a las 11:21:05 UTC. Informe público: `design/stores-sharing/reports/hosted-verification.json`; capturas y credencial locales.

B07 tiene una propuesta concreta separada en [PR #9](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/9): documento y contrato JSON de 20 operaciones; no activa servicios ni modifica la app. Antes de activar cuentas/hogares deben aprobarse proveedor/proyecto, tratamiento y región, autenticación/correo, costes y retención, conforme a AGENTS.md:18 y B07 original:17. Las 150 recetas, derivados de marca aprobados, aceptación visual y validación física siguen pendientes; cinco avisos npm moderados continúan abiertos.
