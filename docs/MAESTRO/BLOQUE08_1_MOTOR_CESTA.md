# B08.1 · Motor aislado de cesta para una tienda

**B08.1 preparado, probado y publicado · 27/11/2026:** motor interno de cesta para una tienda: envases enteros, consumo/sobrante y cobertura; costes desconocidos permanecen en null. **Todavía no conectado a pantallas**, sin precios oficiales ni ranking. [PR #35](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/35), fuente `ee03a4b`, CI correcta. 2.484 unitarias (126 nuevas); JS/HTML/308 recursos y 428 inputs anteriores idénticos a B06.2. Staging protegida: cuatro idiomas/319 recursos HTTPS correctos; no se atribuyen como nuevas las matrices anteriores. [Informe](BLOQUE08_1_MOTOR_CESTA.md). Acceso por conversación hasta **28/11/2026 07:32:27 UTC**. Integración visible posterior; B07, B08 completo y aceptación física siguen pendientes.

## Preparación conservada anterior a la publicación

**27/11/2026 · preparado y probado localmente; publicación en curso.** Continúa la app existente desde
`a01f2a76101ed669f5456a2dfc2d9e5f127cb403`, cierre B06.2. Rama `codex/b08-1-motor-cesta-2026-11-27`.
Es el Bloque 08 del plan maestro, distinto del antiguo bloque B08 de QA/piloto.

## Motivo y alcance

El comparador actual trabaja por producto con aportaciones manuales. El
[plan maestro](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md) y la
[auditoría de pendientes](AUDITORIA_PENDIENTES_TRAS_PR30_2026-11-21.md) permiten preparar el cálculo
puro de una cesta sin esperar a los feeds. B07 conserva su condición de permisos y datos reales:
esta entrega no activa fuentes, precios oficiales, scraping, backend ni bases de datos.

El motor calcula una propuesta efímera para **una tienda/formato/canal/CP declarados**. Compara
alternativas de envase de un producto confirmado, compra envases enteros y separa desembolso,
cantidad sobrante y coste exacto de lo consumido. No escribe, agrega ni modifica listas,
observaciones, gastos, favoritos o menús. No está conectado a la interfaz.

Elige **una presentación por línea**, repetida tantas veces como haga falta. No mezcla tamaños
de envase para encontrar una combinación global óptima, no reparte la cesta entre tiendas ni
incluye un ranking de comercios. Tampoco añade productos o envases para alcanzar un pedido mínimo.
Estas limitaciones no se convierten en una promesa de «la cesta más barata».

## Contrato y reglas

- [Tipos](../../src/domain/basketQuoteContracts.ts), [entrada](../../src/domain/basketQuoteValidation.ts)
  y [cálculo](../../src/domain/basketQuote.ts) separados; sin dependencia nueva.
- Versión 1; origen `manual` o `test-fixture`. La salida siempre indica `priceVerification: NOT_VERIFIED`
  y moneda EUR. Ninguna bandera del payload puede convertirla en precio comercial verificado.
- IDs opacos y acotados; `productKey` debe representar la identidad confirmada por el llamador.
  No se infieren marcas, variantes, GTIN o equivalencias por texto. Una oferta exige equivalencia
  `confirmed` y clave exacta. Esta comprobación de contrato no acredita que el usuario o fuente tengan razón.
- Una necesidad por `productKey`: duplicados se rechazan. Una agregación futura necesitará revisión
  explícita; no se reparte un mismo envase entre líneas diferentes ni se fusiona información en silencio.
- Coincidencia exacta de establecimiento, formato, canal, CP, país ES e isla Tenerife declarados.
  Se conservan los seis formatos del piloto. El prefijo postal no verifica la existencia de un CP,
  el punto de venta, la entrega o la procedencia comercial.
- Cantidades enteras en milésimas, máximo 1.000.000.000, compatibles con las unidades existentes:
  g/kg, ml/L y ud; ud exige unidades enteras. No se convierte masa en volumen.
- Céntimos enteros seguros; desconocido es `null`. Un cero manual explícito sigue siendo cero,
  sin convertirse en certificación de gratuidad o PVP actual. Campos ausentes o inválidos se rechazan.
- Día de referencia explícito `asOf`, sin leer el reloj. Fechas ISO reales; observación futura,
  inicio futuro, caducidad y antigüedad mayor de siete días excluyen la oferta. Siete días y los
  extremos del intervalo son inclusivos. Fecha de observación no equivale a vigencia comercial.
- Promociones condicionales se excluyen: no se supone que haya cupón, tarjeta, compra múltiple o stock.
- Por línea se elige el menor desembolso de repetir una presentación elegible. Desempate por menor
  sobrante y después ID ordinal; el orden de las ofertas de entrada no decide el resultado.
- Aritmética con BigInt antes de convertir a Number. Racional de consumo reducido en cadenas decimales;
  redondeo half-up de presentación separado. No se suman costes consumidos redondeados para obtener
  el importe de comprar los envases. Desbordamientos se excluyen o detienen el resultado sin truncar.

Ejemplo **aritmético sintético, no precio real**: necesitar 750 g y disponer de envases de 500 g
a 200 céntimos exige dos envases: desembolso 400, consumo proporcional 300 y sobrante 250 g.

## Cobertura, gastos y mínimos

La cobertura cuenta líneas: vacía, ninguna, parcial o completa. Incluye numerador y denominador
exactos; no aparenta un porcentaje del valor monetario desconocido. `knownGoodsSubtotalCents`
es solo la suma conocida; cero líneas cotizadas suman cero, pero el precio de la cesta sigue `null`.

`goodsOutlayCents` solo existe con todas las líneas cubiertas y cesta no vacía. El total pagable
necesita además gastos adicionales conocidos y mínimo de mercancía conocido y cumplido. Ausencia
de gastos o mínimo debe declararse como cero; `null` no se sustituye por cero. Un subtotal parcial
no demuestra que el mínimo esté incumplido. No se ofrecen rankings con esta salida.

El motor no certifica IGIC, transporte, disponibilidad, equivalencias sanitarias, derechos o condiciones
de una fuente. El adaptador/flujo futuro deberá revisar esas condiciones antes de cualquier uso comercial.

## Seguridad y conservación

Entradas de campos exactos, descriptores propios de datos y arrays densas: máximo 200 líneas y 2.000
ofertas, sin huecos, getters, propiedades heredadas, campos extra ni IDs duplicados/huérfanos.
Se toman snapshots desacoplados y se congelan las salidas, sin congelar los objetos del llamador.
Errores codificados y acotados; no se devuelven excepciones, mensajes o texto arbitrario del input.
No hay red, secretos, permisos nuevos, reloj automático ni persistencia.

La interfaz conserva Verde Mercado Premium, PNG oficial y Manrope. No se añade texto de pantalla:
los motivos son códigos para traducir durante una integración posterior. Los cuatro idiomas y el
español de respaldo permanecen intactos; no se cambian recursos, recetas o fotos.

## Comprobaciones locales

- TypeScript y **2.484 pruebas unitarias en 45 archivos**, incluidas 126 nuevas: 50 oráculos de cálculo
  y 76 de límites/validación. Ambos archivos focales pasaron al primer intento.
- Revisión independiente sin incidencia reproducible dentro del alcance de una presentación por línea.
- Auditoría npm: cero avisos conocidos; compatibilidad oficial online Expo correcta. Sin cambios de versiones.
- Web exportado: JS `15750dba3b3d5c207a900c72361245ac1b8c5738adf8dadf94da75d487b3d2fc`, HTML y
  **308 recursos idénticos byte a byte** a la vista probada B06.2. Los 428 inputs anteriores de la app
  y los 2.095 archivos seguidos de base estaban intactos antes de las actualizaciones documentales.
- No se repiten ni se atribuyen como nuevas las matrices de UI/Python del 26/11. La CI de esta entrega
  ejecuta sus propios controles. No hubo exportación nativa nueva ni prueba física.

```sh
npm run typecheck
npm test -- --maxWorkers=2
npm test -- --maxWorkers=2 tests/basket-quote.test.ts tests/basket-quote-validation.test.ts
npx --no-install expo export --platform web --output-dir dist-b081-web --max-workers 2
```

GitHub, CI y staging se registrarán al cerrar la publicación; la nueva vista web mantendrá la misma
interfaz porque el motor aún no se importa desde pantallas. La siguiente entrega podrá preparar su
integración mediante revisión explícita. B08 completo, compra repartida, fuentes oficiales, aceptación
visual/física y distribución nativa conservan sus dependencias; no se activan por terminar este motor.


## Publicación comprobada · 27/11/2026

Fuente `ee03a4baaf5d9d3706125969f72470ed06589cd1`, árbol `244e6cce0d7d6fe3d7120fe356079c5677bcdfc2`. [PR #35](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/35) sobre #34, sin fusionar. CI de fuente: push 45965905190 y PR 45965969192 correctas, con sus propias comprobaciones Python, reproducción, tipos, 2.484 unitarias, auditoría y compilación web.

Staging `dpl_Eb9TR4aV6Jki5hxiUf2cZYjrdpPb`, READY/protegida: **cuatro idiomas y 319 recursos/URLs correctos por HTTPS**, sin relajar TLS/CA. Los 313 archivos publicados coinciden con los del bloque anterior; solo cambia la referencia Git que incorpora el motor. No se añaden datos de ejemplo a la interfaz. El web tiene el mismo SHA-256 `15750dba3b3d5c207a900c72361245ac1b8c5738adf8dadf94da75d487b3d2fc`. No se necesitó subir blobs nuevos; se reutilizaron sus hashes inmutables, sin alterar despliegues anteriores. Acceso temporal fuera de Git hasta **28/11/2026 07:32:27 UTC**.

Gitleaks oficial 8.30.1 revisó **2.103 archivos/265.409.987 bytes**, con reglas predeterminadas y redacción 100%. Conserva salida 1 por los mismos 17 falsos positivos de nombres de almacenamiento; cero secretos confirmados o sin clasificar. No se añadieron excepciones. El alcance no incluye historial, ignorados, credenciales de ejecución o interiores de ZIP, ni garantiza seguridad absoluta. Consulta npm y compatibilidad Expo correctas, sin cambios de dependencias.

Los 431 inputs, incluidos los tres módulos nuevos todavía sin consumidor de pantalla, quedan comprobados por hash. Los 428 anteriores y los siete documentos conservan sus contratos. No se repitieron exportaciones nativas ni se presenta la UI anterior como nueva aceptación física/visual. La auditoría completa de pareja B06.1/B06.2 mantiene su cierre; este es el primer subbloque de la pareja siguiente, cuya auditoría completa se hará tras la próxima entrega. B08.2 no iniciado por este cierre.

Main `daa3f09` y producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3` se conservan, con protección `all_except_custom_domains`. B07 necesita permisos/datos; una presentación por línea no es optimización combinatoria ni ranking. La integración visible, compra repartida, pruebas físicas y salida nativa quedan pendientes. [Evidencia publicada](../../design/basket-engine/reports/verification.json).
