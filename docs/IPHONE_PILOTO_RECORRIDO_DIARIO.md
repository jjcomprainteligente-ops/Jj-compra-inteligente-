> **Catálogo V83 · 12/11/2026:** ya se recibieron las 150 recetas. La [entrega V83](RECETAS_V83_INTEGRACION_Y_AUDITORIA.md) incorpora 120 y conserva las siete anteriores; las otras 30 permanecen retenidas por sus estados editoriales. Esta guía conserva los pasos e informes de la entrega anterior; las referencias siguientes a recetas pendientes corresponden a aquel momento.

# Prueba iPhone del recorrido diario

Preparación del 11/11/2026 sobre la aplicación existente. La prioridad fijada por el propietario es **menú → revisión de ingredientes → lista → compra → presupuesto y gasto confirmado**. Esta entrega conserva Verde Mercado Premium, el logotipo oficial, los cuatro idiomas y el guardado local; no rehace las pantallas ni activa cuentas o sincronización.

## Abrir la versión de prueba

Abrir en Safari el enlace temporal entregado por la conversación. La preview staging está publicada y verificada: `dpl_G6ZFWo9HDUazteMj99MBTg16PaLj`, fuente GitHub `54fc7efe3980f4295f3e873aa7710276903c3f7a` en [PR #12](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/12). Su origen protegido es https://jj-compra-inteligente-34ekbbs6j-cmj2hwhc6b-1051.vercel.app; la dirección base no es un acceso público. El enlace compartido vence el **12/11/2026 a las 22:56:56 UTC**. Las credenciales del enlace no se guardan en el repositorio. Una preview anterior no acredita esta entrega.

Cada dominio de preview tiene sus propios datos. Las listas de una preview anterior no se trasladan automáticamente: conservarlas y crear una lista nueva para esta prueba. No es necesario registrarse. Si el navegador impide el guardado seguro, anotar el mensaje y mantener el borrador; no borrar ni manipular los mecanismos de coordinación para forzar un guardado. Preferir una ventana normal si el modo privado bloquea estas capacidades.

Los ejemplos siguientes son datos ficticios que introduce quien prueba, nunca precios verificados ni contenido preinstalado. El catálogo contiene siete recetas iniciales. Las 150 recetas traducidas del propietario siguen pendientes de recepción e integración.

## Recorrido de aceptación

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 · Bienvenida | Elegir español, inglés, alemán o francés y entrar. | La navegación, formularios y recetas aparecen en el idioma seleccionado. Perfil → Idioma permite cambiarlo. La elección manual tiene prioridad y se conserva al recargar. Los importes siguen en euros. |
| 2 · Lista | Crear «Prueba iPhone» y asignar un presupuesto de 40 €. | La lista nueva queda seleccionada; las listas anteriores se conservan. |
| 3 · Producto manual | Añadir «Café de prueba», 2 unidades, precio introducido 1,25 € por unidad y una nota ficticia privada. | Se conserva exactamente la cantidad y el precio introducido. No se marca como precio comercial verificado. |
| 4 · Menú | Preparar cinco cenas para dos personas y abrir una receta. Ajustar esa receta a cuatro personas. | Se ven los ingredientes y pasos traducidos. Las cantidades de esa receta se ajustan; esto no debe cambiar silenciosamente las personas del plan completo. |
| 5 · Cancelación | Revisar los ingredientes de esa receta y cancelar expresamente sin añadir. | La lista, presupuesto, productos previos y resto de datos permanecen iguales. No basta con cerrar una pantalla para asumir que se canceló. |
| 6 · Incorporación | Abrir de nuevo la receta, ajustar a cuatro personas, revisar cantidades/unidades y quitar algún ingrediente que ya se tenga. Anotar los elegidos antes de confirmar. | Solo después de confirmar aparecen exactamente los ingredientes elegidos, con sus cantidades y unidades revisadas. Se añaden pendientes y sin precio; el café y el presupuesto de 40 € se conservan. |
| 7 · Compra | Marcar el café como comprado y consultar Ahorro. | Los productos marcados con precio introducido suman 2,50 €. El gasto real continúa sin registrar; marcar no confirma un pago. Los ingredientes sin precio siguen identificados como tales. |
| 8 · Gasto real | Abrir Presupuesto y registrar 12,35 € con una tienda ficticia. Intentar revisar antes de confirmar que se pagó; después marcar la confirmación de pago, revisar y guardar. | El primer intento pide confirmar el pago y no guarda. La revisión tampoco guarda por sí sola. La confirmación final crea un único gasto real de 12,35 €, sin cambiar la lista ni el presupuesto asignado. |
| 9 · Coherencia | Consultar Inicio, Ahorro e Historial de gastos. | Las tres vistas reflejan el gasto confirmado de 12,35 €. El valor de productos marcados sigue siendo 2,50 € y se distingue del gasto real. |
| 10 · Copia | En Mi compra abrir Compartir y revisar el texto. Activar explícitamente incluir comprados y volver a revisar. | Por defecto solo aparecen pendientes. Al incluir comprados aparece el café. La copia no incluye notas privadas, precios, presupuesto ni identificadores; abrir o cerrar esta revisión no cambia los datos. |
| 11 · Persistencia | Recargar tras recuperar conexión. | Se conservan el idioma, menú, lista, presupuesto y un único gasto confirmado. No reaparece la bienvenida ya completada. |

Se puede probar el catálogo y la lista sin red **después de cargar la app**. Esta comprobación no acredita instalación como PWA, caché de arranque ni apertura en frío de Safari sin conexión. Reconectar antes de recargar durante esta prueba.

## Comprobación en el iPhone real

Registrar modelo, versión de iOS, navegador, orientación, idioma y versión/commit de la entrega. Repetir el recorrido en los cuatro idiomas. La automatización con WebKit en Linux y tamaños móviles no acredita Safari ni un dispositivo físico.

- Con el teclado visible, alcanzar nombre, cantidad, precio, nota y Guardar; comprobar coma/punto decimal según idioma.
- Revisar encabezados y botones inferiores con las zonas seguras y el indicador de inicio, tanto en un iPhone pequeño como en uno grande cuando se disponga de ellos.
- Activar texto grande y VoiceOver; comprobar nombres, estados, orden de lectura, confirmaciones y salida de los paneles. Aplicar también [la guía de paneles y datos locales](IPHONE_PRUEBA_DE_PANELES.md).
- Compartir la copia ficticia en Notas mediante el panel del sistema y comprobar su recepción y texto. El botón de compartir, por sí solo, no acredita que se haya recibido.
- Cerrar y volver a abrir Safari con conexión y comprobar persistencia. No borrar datos de otra versión para realizar la prueba.

| Modelo / iOS / Safari | Commit | Idioma | Paso | Observado | Resultado |
|---|---|---|---|---|---|
| Pendiente | Pendiente | es/en/de/fr | Pendiente | Sin datos personales | Pendiente |

## Preparación nativa: estado y requisitos

`eas.json` prepara dos perfiles de iOS: `iphone-preview` para distribución interna Release en dispositivo, e `iphone-testflight` para distribución de tienda Release. No son una aplicación instalable: no se han iniciado builds, firmado binarios, registrado dispositivos ni enviado nada a TestFlight. No hay proyecto EAS enlazado, credenciales de Apple/Expo ni icono cuadrado aprobado. No se crean ni recortan derivados del logotipo para cubrir ese pendiente.

El proyecto mantiene Expo SDK 58. Según la documentación de Expo consultada para esta entrega, requiere iOS 16.4 o posterior; la compilación local de iOS requiere macOS y Xcode 26.4 o posterior. El entorno de trabajo es Linux y no dispone de Xcode.

La versión pública de Expo Go en la App Store permanece en SDK 54 en la documentación consultada: no se debe prometer que escanear un QR de SDK 58 funcione con esa aplicación. Usar un cliente compatible o una compilación nativa preparada para este proyecto. Las vías actuales de Expo Go compatible mediante `eas go`/TestFlight y la distribución interna o por TestFlight requieren comprobar las cuentas y requisitos de Apple. No se ha contratado un servicio ni aceptado un coste. El perfil no ejecuta una publicación automática.

Antes de distribuir un binario interno se debe comprobar la protección de acceso a su descarga, además de la firma y dispositivos autorizados. La configuración predeterminada de distribución interna de EAS puede permitir descargar por URL sin autenticación. Esto no modifica la protección de la preview web existente.

Referencias oficiales: [incompatibilidad de Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/), [SDK 58](https://docs.expo.dev/versions/v58.0.0/), [distribución interna](https://docs.expo.dev/build/internal-distribution/).

## Verificación técnica y límites de cierre

TypeScript, las 963 pruebas unitarias, la comprobación oficial de compatibilidad de Expo y las exportaciones web/iOS/Android han pasado. Se han alineado cuatro dependencias existentes dentro del mismo SDK. El audit actualizado registra tres avisos moderados en herramientas de Expo/minimatch, cero altos y cero críticos; no se fuerza la rebaja mayor de Expo que propone npm. Estos resultados no garantizan ausencia absoluta de errores ni cierran los avisos pendientes.

La regresión completa pasó **298 casos Chromium**, con 24 omisiones deliberadas de capturas duplicadas y cero fallos inesperados o intermitentes. Pasaron también los **ocho casos WebKit focalizados**: es/en/de/fr en tamaños CSS 375×667 y 430×932, con 80 capturas y ocho informes de recorrido. Comprobaron una receta ajustada de dos a cuatro personas, exclusión de un ingrediente y coincidencia exacta de nombres, cantidades y unidades revisados frente a los guardados, además de cancelación, gasto separado, copia y persistencia tras recargar. El plan completo quedó intacto. La comprobación geométrica se limita a los nodos de texto renderizado; no certifica el contenido de campos, el teclado ni las zonas seguras físicas.

Informes: [verificación técnica](../design/iphone-pilot/reports/technical-verification.json), [regresión Chromium](../design/iphone-pilot/reports/chromium-regression.json) y [recorrido diario WebKit](../design/iphone-pilot/reports/webkit-daily-journey.json). Las capturas y trazas de navegador se mantienen fuera de Git; solo se publican resúmenes revisados sin datos personales ni credenciales. La publicación staging se comprobó también en es/en/de/fr y con 29 recursos/URLs por hash, conservando los flujos locales y la protección del proyecto `all_except_custom_domains`. [Verificación remota](../design/iphone-pilot/reports/hosted-verification.json) · [registro del despliegue](../design/iphone-pilot/reports/deployment.json). Este cierre documental posterior no modifica la aplicación compilada del commit de origen.

El cierre del piloto requiere resultados reales del recorrido anterior en iPhone y aceptación visual. B07.2 continúa abierto con su matriz completa de permisos pendiente; cuentas, hogares, invitaciones y sincronización siguen separados de esta entrega local. La publicación web no equivale a completar B00–B09 ni a publicar una aplicación nativa.
