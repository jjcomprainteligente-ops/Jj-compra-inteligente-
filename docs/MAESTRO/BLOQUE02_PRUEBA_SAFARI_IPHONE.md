# Bloque 02 · Prueba Safari iPhone: de una receta a la compra

**Preparada el 14/11/2026. PENDIENTE DE PRUEBA FÍSICA.** Esta guía describe resultados esperados; no acredita que se hayan ejecutado. Se conserva la app existente, con 127 recetas y Verde Mercado Premium.

## Preparación

Abrir en Safari el **enlace temporal de la conversación**, comprobar su caducidad y anotar la versión indicada en la entrega. La candidata comprobada es `dpl_DizPGJTNWdRhNnRQxXtToDKwdxEZ`, origen GitHub `61793e4833c702a6294eedde1f778cd80dfc074f` ([PR #22](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/22)). Su acceso temporal vence el **15/11/2026 10:52:36 UTC**; los 36 casos automatizados en esa URL no sustituyen esta prueba física. Si la conversación entrega otra candidata, registrar su ID y commit en vez de atribuirle los resultados de esta referencia. El enlace de acceso protegido no se copia a GitHub ni al registro de fallos.

Usar conexión y datos ficticios en un origen de prueba sin listas previas. Cada dominio de preview guarda sus propios datos; no traslada las listas de otro dominio. Si el origen ya tiene información, conservarla y anotar que la primera entrada no se ha probado; no borrarla para forzar la bienvenida. No hacen falta cuenta, plan semanal ni lista creada de antemano.

Repetir en **español, inglés, alemán y francés**. La receta de referencia es **Paella valenciana casera** (`JJ-E03-004`); su título e ingredientes aparecen traducidos. Los importes continúan en euros, con formato del idioma elegido.

## Recorrido y resultado esperado

| Paso | Acción en Safari | Resultado esperado |
|---|---|---|
| 1 · Bienvenida | Elegir idioma y entrar. | Navegación y controles en ese idioma; ninguna lista creada todavía. |
| 2 · Una receta | Abrir Menús → Descubrir y elegir la paella indicada. | Se ve su ficha con ingredientes y pasos, sin preparar cinco cenas ni pedir una lista previa. |
| 3 · Raciones | Elegir 2 raciones y después 4. | El arroz pasa de **180 g a 360 g**. Las demás cantidades cambian de forma coherente; los pasos y advertencias siguen accesibles. |
| 4 · Revisar sin guardar | Revisar los ingredientes para 4 raciones, seleccionar una lista nueva y escribir «QA iPhone receta». Revisar cantidades y quitar un ingrediente que ya se tenga. | La sal «al gusto» no se incorpora automáticamente. Todavía no existe una lista guardada. |
| 5 · Cancelar | Salir de la revisión y confirmar expresamente el descarte cuando se solicite. | No se crea la lista ni se añade ningún ingrediente. Volver a abrir la receta sigue siendo posible. |
| 6 · Guardar | Repetir la revisión a 4 raciones, escribir el nombre de lista y confirmar. | Se crea **una sola lista**, con exactamente los ingredientes elegidos, cantidades y unidades revisadas; pendientes y sin precios atribuidos a tiendas. |
| 7 · Duplicados | Revisar otra vez la misma receta hacia la lista guardada y observar las decisiones de duplicados; después cancelar expresamente. | Las coincidencias se muestran para decidir; abrir y cancelar esta revisión no añade productos ni cambia cantidades. |
| 8 · Compra y presupuesto | En la lista, marcar un ingrediente. Definir un presupuesto ficticio de **40 €** mediante el control de presupuesto. | El marcado se conserva y el presupuesto muestra 40 €. Marcar un producto no registra un pago; un ingrediente sin precio continúa sin precio. |
| 9 · Cancelar gasto | En Presupuesto, abrir el formulario de gasto, escribir **12,35 €** y una tienda ficticia. Salir y descartar. | No aparece ningún gasto guardado. |
| 10 · Confirmar gasto | Repetir el formulario. Intentar revisar sin confirmar el pago; después activar la confirmación, revisar y guardar una vez. | El primer intento pide confirmación y no guarda. La revisión tampoco guarda por sí sola. La confirmación final registra un único gasto de **12,35 €** de esta prueba. |
| 11 · Coherencia | Consultar Presupuesto e Historial. | Ambas vistas reflejan ese único gasto; el presupuesto sigue en 40 €. La lista y sus cantidades no cambian por registrar el gasto. |
| 12 · Cerrar y volver | Cerrar la pestaña de la app y volver a abrir el mismo enlace con conexión; comprobar también cerrar y reabrir Safari cuando sea posible. | Persisten idioma, lista, marcado, presupuesto y un solo gasto. No reaparece la bienvenida completada. Anotar por separado qué tipo de cierre se realizó. |

La lista vacía y la recuperación tras errores de almacenamiento forman parte de la QA técnica del bloque; sus resultados se registran por separado. Si Safari muestra un error de guardado durante esta prueba, debe conservar el borrador y evitar anunciar éxito. Anotar el paso y el mensaje; **no manipular mecanismos de coordinación ni borrar datos para forzar el guardado**.

## Comprobaciones físicas y registro

Con teclado visible, texto grande y VoiceOver, comprobar que se alcanzan los campos, el final de los ingredientes y los botones de confirmar/cancelar. Revisar las zonas seguras y el indicador inferior; los controles deben conservar su nombre y estado. La automatización WebKit en Linux no sustituye estas comprobaciones ni certifica Safari real. No se ha generado un binario, una instalación PWA ni una entrega TestFlight por preparar esta guía.

| Modelo / iOS / Safari | Idioma | ID de preview y commit | Paso | Resultado esperado / observado | Aprobado, fallo o pendiente |
|---|---|---|---|---|---|
| Pendiente | es | Pendiente | Pendiente | Sin ejecutar | Pendiente |
| Pendiente | en | Pendiente | Pendiente | Sin ejecutar | Pendiente |
| Pendiente | de | Pendiente | Pendiente | Sin ejecutar | Pendiente |
| Pendiente | fr | Pendiente | Pendiente | Sin ejecutar | Pendiente |

Para un fallo, añadir: pasos para repetirlo, si se perdió el borrador, si apareció una confirmación y si hay datos duplicados. Mantener capturas y trazas en privado; compartir solo contenido ficticio o revisado, sin notas personales, copias locales ni enlaces de acceso. Un fallo de conservación, un guardado falso o un duplicado de gasto bloquea la aceptación del recorrido.

Esta guía complementa la [prueba de paneles](../IPHONE_PRUEBA_DE_PANELES.md). El recorrido anterior queda conservado como [antecedente histórico](../IPHONE_PILOTO_RECORRIDO_DIARIO.md), con versiones y resultados de su fecha.
