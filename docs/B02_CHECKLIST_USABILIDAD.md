# B02 · Checklist de usabilidad y evidencia

**Estado vigente: evidencia web completada; revisión del propietario y validación nativa pendientes.** La plantilla de comprobación que sigue conserva sus pendientes de origen; el registro fechado al final recoge los resultados ejecutados. No se marcan como superados controles que no se hayan ejecutado. La dirección es V3 Verde Mercado; M3 sigue provisional por decisión del propietario.

## Evidencia que debe acompañar la revisión

| Área | Criterio observable | Estado de verificación |
|---|---|---|
| Cinco vistas | Inicio, Mi compra, Ahorro, Menús y Perfil/Hogar mantienen identidad y jerarquía. | Pendiente de capturas y revisión visual. |
| Navegación | Cuatro pestañas con texto y selección visible; avatar a Perfil; salida de hojas sin quedar atrapado. | Pendiente de recorrido del prototipo. |
| Ocho estados | Vacío, carga, offline, micro denegado, error, lista larga, sin precio y presupuesto excedido tienen mensaje y siguiente acción. | Pendiente de capturas por estado. |
| Honestidad de datos | Muestras identificadas; presupuesto separado de gasto/estimación; ausencia de precio distinta de cero. | Pendiente de inspección de textos y capturas. |
| Primera acción | Crear/continuar compra visible en Inicio pequeño y grande sin desplazar. | Pendiente de medición del viewport. |
| Uso en lista | Añadir alcanzable sin tapar filas; lista larga desplazable hasta el último producto. | Pendiente de recorrido y capturas. |
| Revisión previa | Receta y entrada de texto muestran revisión, corrección y cancelación antes de una confirmación de muestra. | Pendiente de recorrido F2/F3. |
| Salida manual | La muestra de permiso denegado no impide usar texto; la ausencia de tienda no impide volver a Mi compra. | Pendiente de recorrido F3/F4. |
| Contraste | Medir pares de texto/superficie, incluidos avisos amarillos, errores y botones; umbral AA normal de 4,5:1. | Pendiente de medición documentada. |
| Tacto | Áreas interactivas de al menos 44×44; controles de cantidad independientes y legibles. | Pendiente de inspección/medición. |
| Preservación | App anterior, datos y B01 no sustituidos; nuevas piezas aisladas en B02. | Pendiente de comparación de archivos por el agente principal. |
| Alcance | Ningún backend, servicio de IA, permiso de micro, cuenta, invitación o pago operativo en B02. | Pendiente de revisión del código de presentación. |

## Escenarios para ejecutar y registrar

- [ ] **F1, primera visita:** Inicio vacío → Mi compra vacía → hoja Añadir → cancelar → abrir otra vez → recorrer la confirmación de ejemplo. No exigir cuenta ni tienda. Registrar que cerrar/reabrir con datos reales sigue siendo una prueba de B04.
- [ ] **Lista poblada:** leer nombre, cantidad y unidad sin confundirlos con precio; reconocer comprados/pendientes y acción de editar.
- [ ] **Lista larga:** recorrer 20+ productos; comprobar último elemento, nombres largos y posición de la acción fija. No confundir que los elementos de muestra se dibujen con que exista persistencia de una lista real.
- [ ] **Cantidades:** abrir el selector de ejemplo, distinguir valor/unidad y localizar cancelar/confirmar. Señalar cualquier conversión aún no implementada.
- [ ] **Eliminar y deshacer:** localizar qué se elimina y cómo volver atrás. En B02 confirmar únicamente el diseño de la interacción, sin atribuir un borrado real de la app anterior.
- [ ] **Carga/error:** identificar qué ocurre, encontrar salida/reintento y reconocer datos pendientes. No mostrar éxito ficticio.
- [ ] **Sin red:** leer aviso sin perder lista y acción manual. La escena offline es una muestra, no un corte de red nativo probado.
- [ ] **Micro denegado:** continuar por texto sin insistencia ni bloqueo. Comprobar que la maqueta no pide permiso real.
- [ ] **F2, menú:** Menús → receta → revisar ingredientes → corregir/excluir/cancelar → volver. Registrar que la confirmación solo muestra un resultado visual de ejemplo.
- [ ] **F3, texto externo:** escribir o pegar una lista procedente de ChatGPT externo → abrir revisión de muestra → distinguir texto original y propuesta. No atribuir interpretación a una IA conectada.
- [ ] **F4, sin precios:** localizar artículos sin precio, presupuesto y total pendiente; volver a Mi compra sin fuente autorizada ni tienda seleccionada.
- [ ] **Dato antiguo/no comparable:** reconocer fecha y procedencia de ejemplo, advertencia de antigüedad o formatos distintos. No interpretar el dato como oferta actual ni ahorro confirmado.
- [ ] **Presupuesto excedido:** entender límite y exceso de ejemplo; encontrar opción de revisar sin impedir la edición.
- [ ] **F5, hogar:** desde Perfil abrir la explicación; reconocer que invitar, revocar y sincronizar son una fase posterior. Cerrar sin crear cuenta ni compartir información.

## Tamaño, teclado y accesibilidad

| Prueba | Qué revisar | Evidencia necesaria / límite |
|---|---|---|
| Pantalla pequeña y grande | No hay desbordamiento horizontal ni controles cortados. La acción principal sigue visible; el contenido secundario puede desplazarse. | Capturas con dimensiones CSS y método registrados. Chromium emulado no equivale a iPhone nativo. |
| Texto ampliado | Nombres, cantidades, precios ausentes y avisos no se solapan ni pierden significado; filas/hojas crecen. | Revisión web ampliada como apoyo. **Dynamic Type de iOS pendiente** hasta prueba real. |
| Teclado | Campo enfocado visible, desplazamiento de la hoja y botones de salida accesibles. El teclado no tapa la acción esencial. | Cualquier reducción artificial del viewport es aproximación. **Teclado y safe areas de iOS pendientes**. |
| Zonas seguras | Contenido separado de bordes, barra inferior y gesto de inicio; acción fija no tapa la última fila. | Captura web más validación en dispositivo/simulador posterior. |
| Una mano | Añadir y cantidades alcanzables; no depender de botones mínimos en esquinas. | Evaluación de disposición en captura; **uso físico con pulgar pendiente**. |
| VoiceOver/TalkBack | Etiquetas, roles, estado de selección, orden de lectura, foco al abrir/cerrar hojas y anuncios de error/deshacer. | **Pendiente de lector de pantalla nativo**. No sustituirlo por revisar atributos del DOM. |
| Color y movimiento | Texto/icono además de color; contraste medido; ningún movimiento imprescindible. | Contraste y revisión del prototipo; preferencia nativa de movimiento reducido pendiente si aplica. |

## Cómo registrar el resultado sin exagerarlo

El agente principal añadirá por comprobación: fecha, comando o recorrido, tamaño, archivo de evidencia, resultado y límite. Se debe diferenciar **pasó**, **falló**, **no aplica a la maqueta** y **pendiente de prueba nativa**. Un screenshot legible no prueba persistencia, permisos del sistema, sincronización, compatibilidad iOS ni accesibilidad completa.

Los defectos visuales se corrigen dentro de B02 y se vuelven a capturar los estados afectados. Si el propietario solicita cambios, B02 continúa en revisión. **B03 solo comienza tras aprobación explícita del diseño**, aunque algunas interacciones de presentación ya sean navegables en el navegador. El logo final sigue diferido y no es una condición nueva para aprobar las pantallas.


## Registro de verificación web — 2026-10-29 23:05:51 UTC

| Comprobación ejecutada | Resultado y evidencia | Límite |
|---|---|---|
| Cinco vistas y estados | 19 escenas × 3 tamaños CSS; 57 vistas base capturadas. | No es iOS nativo. |
| Texto al 130 % | Dos vistas adicionales; resumen presupuestario sin recorte interno, texto visible dentro del ancho. | Simulación DOM, no Dynamic Type. |
| Anchura y primera acción | 59/59 comprobaciones sin desbordamiento de documento ni texto visible fuera del ancho; CTA visible en todos los casos aplicables. | El contenido secundario puede necesitar desplazamiento. |
| Navegación | Cuatro pestañas con selección ARIA y avatar a Perfil: 5 comprobaciones correctas. | No valida VoiceOver nativo. |
| F1–F5 | Pasan los cinco recorridos de muestra, incluidos corregir, excluir y cancelar. | No hay persistencia, IA ni invitaciones reales. |
| Lista larga | 20 casillas; último artículo alcanzable; Añadir sigue visible. | No es prueba de listas reales persistentes. |
| Datos locales | 0 escrituras en los recorridos comprobados. | El prototipo solo conserva estado temporal en memoria. |
| Contraste | 31 pares de texto con umbral4,5:1 y 1 borde de campo con umbral3:1 correctos. | No certifica accesibilidad global. |
| Regresión | TypeScript correcto; 50 pruebas existentes aprobadas. | No sustituye pruebas de componentes nativos. |
| Preservación | 67 archivos anteriores y 33 evidencias B01 intactos antes de actualizar los dos registros documentales. | Sin repositorio Git operativo ni PR. |

Evidencia: `design/b02/evidence/verification.json`, `contrast.json`, `preservation.json`; PDF `B02-diseno.pdf`, siete páginas. Las imágenes extra `review-end-390.png` y `long-list-end-390.png` muestran los finales de desplazamiento.

**Pendientes explícitos:** teclado iOS, zonas seguras físicas, VoiceOver/TalkBack, Dynamic Type y prueba física con una mano. Las áreas CSS de los controles principales son de al menos44×44; su comodidad real necesita dispositivo. El estado offline es una maqueta, no una prueba de persistencia desconectada. Eliminar/deshacer representa la interacción prevista; el borrado real de productos se desarrollará después.

**Puerta de revisión:** B02 EN REVISIÓN; falta aprobación del propietario antes de B03. M3 continúa provisional y no bloquea las pantallas.
