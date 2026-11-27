# B08.2 · Revisión manual de cesta en una tienda

**Publicado, comprobado y auditado · 27/11/2026.** Cierra la pareja B08.1/B08.2 en el alcance manual declarado.
La aprobación estética, las pruebas físicas y los precios comerciales conservan sus propios gates.

## Alcance y recorrido

Ahorro → Mis precios → Calcular mi cesta. Utiliza la lista del recorrido cuando existe;
fuera de él, la lista activa. Si la lista del recorrido desaparece no se sustituye por otra.
Solo se revisan los productos pendientes; los marcados como comprados se excluyen explícitamente.

El borrador y el resultado viven en memoria. Salir cancela la revisión sin modificar listas,
observaciones, menús, preferencias, gastos, comparaciones ni ajustes. No hay octavo documento,
red comercial, cuenta, integración de pago ni permiso nuevo.

## Decisiones de presentación

Se presentaron antes de implementar dos ubicaciones compatibles con Verde Mercado Premium:
resumen dentro de Ahorro o subvista de revisión desde Mis precios. Se eligió la subvista para
dar espacio a las confirmaciones y conservar las cuatro pestañas. No es un rediseño de marca.
Se reutilizan Manrope, tarjetas, campos, avisos, botones y tokens existentes; PNG oficial intacto.
La elección de ubicación no sustituye la revisión estética del propietario.

## Datos y límites

- Establecimiento concreto, formato del piloto, canal y CP se declaran expresamente.
  El texto de tienda de una observación no acredita sucursal, stock ni cobertura territorial.
- Solo observaciones manuales. Cada asociación exige revisar producto, marca, variante,
  presentación, tienda, fecha, origen y precio sin condiciones. No hay asociación automática por nombre.
- Las necesidades deben corresponder a productos distintos. El mismo registro de precio no se
  utiliza dos veces. Nombres de productos repetidos bloquean conservadoramente la revisión:
  se pide distinguirlos en la lista, sin modificarla ni agregar cantidades automáticamente.
- Máximo 200 líneas pendientes; nunca se recorta una lista. Los identificadores heredados no
  pasan al motor: se generan tokens ASCII internos y efímeros, sin exponer textos personales.
- Gastos y mínimo vacíos significan desconocido; el cero debe introducirse expresamente.
  Se separan subtotal conocido, mercancía completa y total con gastos. Una cesta parcial no
  recibe total completo, ranking ni etiqueta de ahorro.
- Envases enteros, coste proporcional consumido y sobrante siguen el motor B08.1; una
  presentación por producto, sin optimización de combinaciones ni compra repartida.
- Precios siempre **no verificados**. IGIC, disponibilidad, derechos y condiciones comerciales
  no quedan acreditados por una confirmación manual. Los precios oficiales siguen condicionados a B07.

## Seguridad y vigencia

Antes de calcular se releen en paralelo ambos documentos, sin reclamar el cerrojo de escritura,
y se comparan sus firmas con el estado revisado. Errores de lectura o diferencias bloquean el
cálculo. La interfaz invalida ante edición, cambio de estado de los documentos, reactivación,
evento de almacenamiento, foco o cambio de día. Se cancelan respuestas tardías al salir.
Esta comprobación local no promete una transacción distribuida ni sincronización de hogares.

El día de referencia utiliza Atlantic/Canary. Etiquetas, accesibilidad, errores y motivos del
motor se centralizan en español, inglés, alemán y francés, con el respaldo español existente.

## Criterios de cierre

Auditoría conjunta B08.1/B08.2: tipos, unitarias, reproducción de referencias/fotos, seguridad,
preservación de los siete documentos, flujos de navegador en cuatro idiomas y tamaños de iPhone,
exportaciones y staging protegida. Los resultados reales y sus límites se registran en los apartados siguientes.
Las pruebas físicas, distribución nativa y aprobación visual humana conservan su propio gate.

## Auditoría conjunta local B08.1/B08.2

- TypeScript correcto; 2.574 unitarias / 47 archivos (126 del motor, 69 del adaptador, 21 de frescura).
- 178 Python y seis reproducciones correctas: V83, V3, revisión culinaria, CP, suite y derivados fotográficos.
- 36 casos nuevos en cuatro idiomas × Chromium/WebKit 375/430; ocho regresiones de precios y ocho de menú/lista. 52 casos locales correctos.
- Cobertura completa/parcial/sin datos, envases, sobrante, gastos desconocidos/cero, origen demo/desconocido, observación antigua, cancelación, errores de lectura, edición externa sin evento, storage/foco y siete documentos sin escrituras.
- Capturas por segmentos, claves traducidas, desbordamientos y objetivos táctiles seleccionados comprobados; las capturas de QA permanecen privadas. No sustituye VoiceOver físico ni aprobación estética.
- npm sin vulnerabilidades conocidas; compatibilidad Expo oficial correcta. Sin cambios de dependencias, permisos o configuración nativa.
- Exportaciones web/iOS/Android correctas; no hay firma, instalación ni prueba física nueva. Web standalone separado para la publicación.
- 428 de los 431 inputs B08.1 permanecen idénticos; tres puntos de integración y cuatro módulos nuevos (435 inputs). Los 308 recursos gráficos mantienen sus bytes y el logo oficial su SHA-256.
- Revisión independiente del motor, adaptador, frescura y UI sin incidencia reproducible pendiente en el alcance manual declarado.

Evidencia reproducible: [informe local](../../design/manual-basket/reports/local-preparation.json). Los contadores locales se distinguen de las comprobaciones HTTPS del cierre siguiente.

## Publicación comprobada y cierre de pareja

Fuente `0af26370f9c576b301ee5abcf91520b2b435bd4f`, árbol `a489f5b690d87d73448c712923bf28639173187a`; PR #36 sobre #35, ambas sin fusionar. CI de push y PR correcta. Solo se publica el paquete web standalone: 313 archivos / 22.884.871 bytes, tres blobs nuevos y 310 reutilizados por SHA1 y tamaño. El código de aplicación queda congelado en los mismos 435 inputs comprobados.

Staging `dpl_3EkPnuWqpSmTGXzH4qiHQrky5Dee` protegida y READY: comprobación HTTPS de cuatro idiomas/319 recursos y ocho casos nuevos de cesta en WebKit 375/430 correctos. Los ocho casos alojados prueban el recorrido completo sin conexión después de cargar la app; los errores, lectura fresca, parcialidad y cancelación tienen además su matriz local de 36 casos. Producción y SSO conservados. Acceso temporal por conversación hasta 2026-11-28 13:59:52 UTC; no se guardan URL de acceso ni credenciales en Git.

Gitleaks 8.30.1 sobre 2.115 archivos / 265.559.252 bytes: exit original 1 por 17 namespaces de almacenamiento ya revisados como falsos positivos, mismas líneas por SHA-256; cero secretos confirmados o hallazgos pendientes. Sin ampliar allowlists. No se inspeccionan credenciales de runtime, ignorados, historial o interiores de ZIP. El cierre documental recibe comprobación adicional antes de commit.

[Recibo público de verificación](../../design/manual-basket/reports/verification.json). No hay nuevo bloque iniciado, cambios en producción, feeds, DB, pagos, ranking ni compra repartida.
