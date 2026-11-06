# V2 — V01/V02: identidad y pantallas existentes

Fecha: 06/11/2026. Estado: código y regresiones comprobados; preview en preparación y revisión visual del propietario pendiente.

## Resultado y fuente de verdad

La app utilizaba el monograma M3 y una composición anterior, distintos de la maqueta solicitada. Esta entrega incorpora el logo 2D exacto y los tokens canónicos, cabecera verde profunda, selección amarilla y estructura de las pantallas existentes conforme a GPT-6 V2. Los originales, 16 referencias y nueve estados están conservados y firmados en `referencias/gpt6-v2/` y en GitHub. Las propuestas B01 antiguas permanecen como historia.

El recorte del logo integrado es byte a byte el PNG entregado: SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`. Contiene exactamente el rectángulo [254,220,1190,550] del JPG aprobado, cuya firma es `7500541f32e14292c013d80f6c8bbc43af87a94a7b646103d6b20289bacb47d0`. La firma c6aa4… del registro anterior no corresponde al PNG recibido ahora. No hay redibujo, recoloración ni 3D.

## V01 — Base visual y navegación

- Logo original en Bienvenida, verde profundo #103F2D, acción #167347, amarillo #FFD24A, crema #FFF8E7, verde suave #E6F1E6 y textos #143E2C/#566B5F. Manrope conserva su licencia y legibilidad.
- Cuatro pestañas: Inicio, Mi compra, Ahorro y Menús; Perfil desde avatar. Bienvenida sin pestañas. Cabecera y zonas seguras ajustadas; retorno al comparador anterior sobre fondo claro.
- Bienvenida con título de marca invariable, idioma accesible y botón para empezar sin cuenta. Se corrigió la reserva de altura del recurso raster: a 375 y 430px el logo conserva proporción y el CTA está dentro de la primera pantalla.
- Los originales y exportaciones anteriores permanecen; `.gitattributes` conserva los recursos suministrados como binarios.

## V02 — Composición y contenido de las vistas existentes

- Inicio: «¿Qué compramos hoy?», entrada manual, categorías que preseleccionan el formulario sin guardar, presupuesto real configurado y accesos a semana/catálogo. En pantallas de menos de 750 px de alto, el CTA se adelanta para mantenerlo accesible.
- Mi compra: filas individuales por categoría, cantidades/notas/precios anotados, controles de 44 pt y CTA amarillo. Edición, borrado con confirmación y deshacer conservados.
- Ahorro: límite amarillo y comparación verde. «Gasto real» figura sin registrar porque no existe una entidad de pagos confirmados. El importe de productos marcados y los totales introducidos/estimados permanecen visibles, claramente separados de pagos y precios comerciales.
- Menús y recetas: semana/catálogo local, filas compactas, cambio de raciones y revisión amarilla. Ingredientes con resumen y detalles editables; los conflictos y decisiones siguen visibles antes de confirmar. Se conserva el aviso sobre privacidad, ausencia de IA/micrófono y alérgenos.
- Perfil: modo local, filas de preferencias/idioma, presupuesto y ayudas; hogar colaborativo identificado como futuro.
- Se mantienen español, inglés, alemán y francés centralizados, elección manual sobre dispositivo y moneda EUR. La preferencia de idioma y los datos existentes no se migran.

La app inicia vacía; los importes de ejemplo de las maquetas no se convierten en datos del propietario. Las capturas de pruebas utilizan datos ficticios aislados. Los tamaños y el contenido real se adaptan a traducciones, accesibilidad y formularios existentes: no se certifica una comparación píxel a píxel ni la aprobación visual mediante pruebas automáticas.

## Pruebas y auditoría de la pareja

- `npm run check`: TypeScript correcto y 496 pruebas en 16 archivos correctas.
- Exportación web/iOS/Android correcta, con hashes en `design/v2/audit/export-manifest.json`. Los paquetes JavaScript/Hermes no equivalen a una app instalable ni a pruebas en teléfonos físicos.
- Suite final congelada:128 pruebas web correctas,0 fallos y0 intermitentes; 12 casos de captura duplicados omitidos deliberadamente. 140 registrados.
- 120 capturas: cuatro idiomas ×375/430/1280px ×10 estados. Matriz completa,0 errores de ejecución,0 claves sin traducir y0 desbordamientos/textos cortados detectados.
- Evidencia final: `design/v2/evidence/run-2026-11-06T15-03-13-733Z-1VEvNi/`, con `report.json`, resultados Playwright y `review.html`.
- Hashes de exportaciones anteriores, entregas visuales y referencias preservados durante la corrida final. Revisión estática independiente y diez pares de contraste normal AA muestreados en `design/v2/audit/`.
- Dominio, almacenamiento, coordinador de escrituras, preferencias, proveedor de idioma, hooks, recetas, comparador antiguo, dependencias y lockfile permanecen sin cambios funcionales. Solo se altera presentación y estado local de navegación/formulario.

## Hallazgos corregidos y ejecuciones conservadas

Se corrigieron contraste del retorno al comparador, prioridad del CTA compacto, dimensionado del logo, aviso global de Menús omitido en la recomposición, anuncio nativo de expansión de ingredientes y tratamiento formal del francés nuevo. Los contadores de precios se reforzaron para ignorar valores nulos.

La nueva prueba de importes partió de un fixture inválido (priceKind entered con precio null); la app lo rechazó correctamente. Se corrigió el fixture a priceKind null sin debilitar la validación. No se presenta ese caso como fallo de los datos de producción.

Se conservan las corridas incompletas del 31/10 y la interrumpida del 06/11 a 14:57. En esta última se reemplazó la exportación antes de confirmar la detención del servidor: sus errores HTTP y 35 fallos no constituyen un diagnóstico de la UI final. La corrida final usa una exportación congelada y preserva todos sus hashes; pasa completa.

## Seguridad y límites abiertos

Auditoría npm actual del 06/11: 10 paquetes afectados, 2 altos, 7 moderados, 1 bajo y0 críticos. Son cadenas de herramientas Expo y sus dependencias (zod,glob,minimatch,deepmerge y propagación). No se ejecutó auditfix forzado ni se degradó Expo a53. El informe permite una corrección parcial y propone cambios mayores para parte del árbol; cualquier endurecimiento posterior debe aislarse y comprobar compatibilidad. No se consideran resueltos los avisos por publicar esta vista.

El escaneo heurístico no encontró credenciales reales en los textos cambiados; no implica una garantía absoluta. Los paquetes de preview excluyen credenciales, datos locales, trazas, fuentes de prueba y metadatos privados. GitHub es la base; la preview debe identificar el commit publicado y conservar protección y entorno staging.

Siguen pendientes Safari/iPhone físico, VoiceOver/DynamicType, teclado y safe areas nativas. También siguen sin implementar las pantallas/funciones de catálogo de productos, voz, cámara, tiendas, historial de pagos y notificaciones. No hay fuentes comerciales, precios verificados, IA conectada, sincronización, pagos ni animación 3D. Las16referencias y nueve estados no se declaran terminados como aplicación por esta corrección de las vistas existentes.

## Continuación

Entregar preview remota verificada y PR de revisión visual. Después resolver diferencias concretas aprobadas y continuar las pantallas ausentes en bloques separados, con auditoría después de cada pareja. No activar funciones futuras desde una apariencia de maqueta.


## Preparación del transporte de la preview

El código está en GitHub, rama `codex/v2-visual`, PR#1. La transferencia directa del JavaScript grande no confirmó su recepción dentro del límite de espera. El intento de construir desde Git terminó con `git_info_fail`; se conserva el despliegue fallido `dpl_2w9PsFKZqRpZprbdbXvFz9tKMfab` como diagnóstico, sin cambiar producción.

Se prepara el mismo JavaScript mediante compresión HTTP Brotli:3.350.985bytes se transfieren como385.119bytes, sin cargador, eval ni modificación de la app. El contenido descomprimido conserva SHA-256 `08d9e75e028ea07d448f00b8061224cfc990506cc15f39a8c25d09070f8e690d`. El blob comprimido tiene SHA-1 `d286f24ae82d6003852c61ff0407359a42d877e3`. El paquete distingue ambas firmas; el verificador exigirá las cabeceras adecuadas, el hash del contenido descomprimido y los recorridos remotos. La publicación no se da por verificada por aceptar los blobs.
