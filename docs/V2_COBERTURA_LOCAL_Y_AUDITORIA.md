# V2 · Cobertura local y auditoría de dos bloques

7 de noviembre de 2026. Continúa la auditoría de completitud `d7f8c37`; no la reemplaza ni presenta su diagnóstico anterior como vigente para esta implementación. Código editable: `dfd2a4eb917ef6d49aab794a0d36d799eed6c77d`, rama `codex/v2-cobertura-local`, [PR #2](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/2), sobre la rama visual del PR #1.

## Entrega A: pantallas y recorridos locales

Se conservan las cuatro pestañas, la paleta Verde Mercado Premium, Manrope, el logo horizontal exacto y los documentos previos. No hay datos comerciales precargados. Buscar muestra productos de las listas guardadas; su ficha identifica lista, cantidad y procedencia manual y permite revisar antes de guardar. Editar desde otra lista conserva la lista activa y escribe en la lista del producto seleccionado.

Voz utiliza reconocimiento del navegador solo cuando existe, con consentimiento y acción explícita, idioma seleccionado y estado de espera hasta recibir el evento real de inicio. El servicio del navegador puede procesar audio; se informa antes de activarlo. El texto manual sirve como alternativa en web y nativo y pasa por revisión de ingredientes. No se persisten audio ni transcripciones completas.

Escáner solicita vídeo sin audio únicamente si el navegador ofrece un decodificador compatible y tras consentimiento. Valida códigos EAN/UPC, libera recursos al salir, ocultar la página o cancelar, incluso cuando el permiso resuelve tarde. Un código no identifica por sí mismo un producto ni un precio. La alternativa manual exige rellenar y confirmar sus datos. Si no hay lista, conserva el código mientras se crea la primera.

Mis tiendas guarda favoritas en este dispositivo. Notificaciones deriva avisos de listas pendientes y del menú realmente guardado cuando se habilitan los avisos internos. No solicita permisos de notificaciones del teléfono ni simula envío programado. Las ofertas comerciales permanecen sin fuente conectada.

## Entrega B: dinero, revisión y estados

Presupuesto e Historial registran gastos confirmados por el usuario, con revisión, fecha de Tenerife, céntimos exactos, edición, eliminación, cancelación y deshacer. Son registros locales: JJ no cobra ni comprueba un ticket. Marcar productos o escribir estimaciones no genera gastos. Inicio, Ahorro y Presupuesto usan la misma distinción entre ausencia de registros, carga, error e importe confirmado.

Receta e Ingredientes son vistas completas con cabecera, cuatro pestañas y acciones al pie. Las raciones del detalle son independientes del plan; los ingredientes seleccionados, excluidos y coincidentes mantienen sus decisiones explícitas. Salir de un texto o revisión pendiente requiere confirmar el descarte. No se insertan ingredientes automáticamente.

Los nueve estados B03.14 tienen una revisión interactiva claramente rotulada como ejemplos, también dentro de cada tarjeta. No se confunden con errores o permisos reales. El aviso de desconexión web procede del navegador; en nativo la conectividad desconocida sigue siendo desconocida. Los duplicados manuales reconocen g/kg y ml/L y requieren decisión, sin sumas automáticas. Añadir, editar, renombrar y guardar presupuesto ofrecen deshacer.

## Correspondencia de las 16 vistas

| Canon | Implementación de esta entrega | Límite explícito |
|---|---|---|
|01 Bienvenida|Logo original, idioma y entrada sin cuenta|3D e icono final pendientes de revisión de marca|
|02 Inicio|Búsqueda, voz, escáner, categorías, presupuesto y gasto confirmado|Búsqueda local|
|03 Mi compra|Listas persistentes, edición, revisión de duplicados y deshacer|Sin sincronización|
|04 Ahorro|Presupuesto, importes anotados y gasto confirmado separados; enlaces a herramientas|Sin ahorro comercial calculado|
|05 Menús|Cinco cenas y catálogo local; CTA antes de los platos|Sin IA conectada ni nuevos filtros de salud|
|06 Detalle receta|Página completa, raciones propias, ingredientes y pasos traducidos|Catálogo local de siete recetas|
|07 Ingredientes|Página completa, grupos y conflictos revisables, pie fijo|Solo añade tras confirmar|
|08 Buscar producto|Nombre y categoría sobre listas guardadas|Sin catálogo remoto|
|09 Detalle producto|Lista de origen, cantidad, precio manual y revisión|Sin precio ni stock verificados|
|10 Voz|Consentimiento, estados reales y alternativa escrita|Capacidad web opcional; nativo usa alternativa manual|
|11 Escáner|Consentimiento, código válido y alternativa manual|Decodificador web opcional; sin identificación comercial|
|12 Mis tiendas|Favoritas reales locales|Sin acuerdos o catálogos conectados|
|13 Presupuesto|Límite por lista y registro confirmado de gastos|No es pago ni lectura automática de ticket|
|14 Historial|Registros reales del usuario, filtros semana/todos, edición y deshacer|Local al dispositivo|
|15 Perfil/Hogar|Idioma, favoritas, presupuesto, avisos y ayudas|Cuenta, compartir hogar y sincronización siguen pendientes|
|16 Notificaciones|Vacío real, filtros y avisos internos derivados|Sin push, planificación o alertas de precios|

## Arquitectura, seguridad y conservación

Se añaden `jjcompraintelwgiemt.expenses.v1` y `jjcompraintelwgiemt.local-settings.v1`. No se reescriben ni migran las cinco claves anteriores. Los nuevos almacenes validan versiones y límites, conservan bytes corruptos/futuros y usan el coordinador de escrituras existente: Web Locks, firmas SHA-256 y registro duradero en IndexedDB. La auditoría de navegador detectó que faltaban ambas claves en su lista permitida; se corrigió y se añadieron regresiones del ciclo completo y conflicto.

Los formularios bloquean reenvíos mientras guardan, conservan borradores ante fallos y no muestran éxito antes de persistir. Una corrupción de gastos o preferencias no bloquea el uso de la compra independiente. La cámara y el micrófono limpian sesiones asíncronas y manejadores. No se añadieron backend, autenticación, claves, analítica, SDK de IA ni nuevas dependencias directas.

Expo se actualizó de 58.0.21 a 58.0.23 y sus dependencias compatibles, sin cambiar de versión mayor ni forzar `overrides`. `npm audit` pasó de 10 paquetes afectados (2 altos, 7 moderados y 1 bajo) a 5 moderados, 0 altos y 0 críticos. Quedan glob/minimatch en CLI/fingerprint y sus cadenas. Sus versiones corregidas exceden los rangos admitidos; no se ocultan ni se fuerza una degradación a Expo53. Informes antes/después en `design/v2/audit/`.

Las 75 entradas del manifiesto de adjuntos se verificaron otra vez. Logo SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596` intacto. Los artefactos históricos se conservan.

## Comprobación y límites de cierre

TypeScript y 660 pruebas unitarias pasan. Exportación web y bundles Hermes de iOS y Android completados con Expo actualizado. La suite final completa terminó con 182 casos correctos, 24 omisiones deliberadas de matrices duplicadas, cero fallos y cero casos inestables. Sus 420 capturas no detectaron errores de ejecución, claves visibles, texto cortado o desbordamientos. Informe completo: `design/v2/entrega-local-2026-11-07/reports/final-report.json`.

La comprobación posterior sobre Vercel encontró una omisión de accesibilidad web en la casilla de confirmar gasto: `accessibilityState` no exponía `aria-checked`. Se añadió ese atributo a la casilla y a los radios de lista, manteniendo los eventos y datos. La regresión exige ahora el ciclo accesible false→true y `.check()`; esta corrección está en `746395e614e68624e012e76d13e0fa377e241c6a`. La aplicación solo cambia esos dos atributos respecto de la matriz completa; se repitió la exportación web/iOS/Android y pasaron 20 de 20 pruebas del recorrido local, sin fallos ni intermitentes. La comparación false→true de la casilla está comprobada antes de verificar la nueva preview.

La matriz nueva recorre 16 pantallas y 9 ejemplos en español, inglés, alemán y francés a 375×754, 430×932 y 1280×1000. Las 120 capturas antiguas se siguen comprobando como diez escenas; no sustituyen las 300 nuevas. Las pruebas de sensores usan APIs simuladas: no acreditan micrófono, cámara o permisos en iPhone físico, Safari o una app nativa instalada. Tampoco equivalen a aprobación estética ni a una comparación píxel a píxel con el canon.

Quedan puertas distintas: revisión visual del propietario/ChatGPT, piloto físico iPhone y Android con lectores de pantalla/teclado/gestos, variantes de marca/3D, controles ampliados de privacidad y hogar, B07, fuentes legítimas y acuerdos de B06/B09. Esta entrega completa los recorridos locales indicados; no completa toda la fase comercial o todos los entregables de los seis paquetes.

## Evidencia pública y artefacto completo

La selección local de revisión está en `design/v2/entrega-local-2026-11-07/`: cien capturas de las 25 escenas a 375×754 en cuatro idiomas y los 24 informes de los tres tamaños, junto al resultado Playwright. Las 320 capturas adicionales se conservan en el artefacto local completo de la ejecución; no se afirma que estén publicadas en esta selección. Los datos provienen exclusivamente de fixtures estáticos en contextos de navegador vacíos. No contienen listas o gastos del propietario. La revisión automática bloqueó publicar los PNG en GitHub público por posible contenido sensible y falta de autorización específica; se conserva la galería local y se publica la evidencia de texto mientras se espera esa decisión.

## Publicación comprobada — 8 de noviembre de 2026

Despliegue `dpl_nMz8gP4TSQgKwmoAH8yGZ23XZM1D`, proyecto `jj-compra-inteligente`, destino explícito `staging`, fuente `746395e614e68624e012e76d13e0fa377e241c6a`. Estado READY y protección conservada. El enlace temporal se entrega por la conversación, sin registrar su credencial en GitHub; vence el 9 de noviembre a las 09:00 UTC.

El verificador remoto pasó español, inglés, alemán y francés. Verificó los 27 recursos por tamaño y hash, logo original, fuentes, transporte Brotli y bytes JavaScript descomprimidos. También guardó una favorita y un gasto ficticio confirmado en contextos aislados HTTPS y conservó las seis claves de negocio al cambiar idioma/recargar. Informe: `design/v2/entrega-local-2026-11-07/reports/hosted-report.json`.
