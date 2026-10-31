# Internacionalización — prueba guiada

Esta guía permite validar español, inglés, alemán y francés en web y en un teléfono. **Los pasos son pruebas pendientes de ejecución por la persona que los registre.** Las capturas automatizadas o una exportación JavaScript no acreditan Safari real, VoiceOver ni una compilación nativa instalada.

Contrato de comportamiento: [I18N_CONTRATO_Y_PLAN.md](I18N_CONTRATO_Y_PLAN.md). Resultados consolidados y evidencias: [I18N_ENTREGA_Y_AUDITORIA.md](I18N_ENTREGA_Y_AUDITORIA.md).

## Preparar el entorno

Usar un perfil de navegador o una instalación destinados a pruebas. Las listas son locales: web, Expo Go y una compilación instalada tienen almacenes independientes. Mantener los datos reales fuera del entorno de inyección de errores. No hace falta una cuenta, clave de IA, permiso de micrófono ni pago.

Con Node.js 24 y las dependencias del proyecto instaladas:

```sh
npm start
```

En iPhone, usar Expo Go compatible con SDK 58 o una compilación de desarrollo compatible. Si hay incompatibilidad de SDK, registrar el mensaje; no actualizar las versiones al azar. Para web local en el ordenador:

```sh
npm run web
```

`localhost` en el teléfono representa al propio teléfono. Para abrir la web desde él se necesita un origen accesible; usar HTTPS para comprobar guardados. Un enlace HTTP con la IP del ordenador puede cargar la interfaz y aun así rechazar escrituras por faltar Web Locks. No atribuir ese rechazo al idioma. El preview previo de B05 no contiene por ello esta entrega: `dist-i18n` es una exportación local que aún no se ha publicado como un nuevo enlace.

Anotar modelo, sistema, navegador o versión de Expo/compilación, origen exacto, idioma del dispositivo, idioma elegido y fecha de prueba. En iPhone cubrir el tamaño pequeño disponible y otro mayor si se dispone de él. En Android registrar también TalkBack y tamaño de fuente. Para un primer arranque limpio, usar otro perfil de prueba; no borrar el almacenamiento que contenga datos reales.

## Referencia de navegación

Los nombres de idioma permanecen como Español, English, Deutsch y Français para poder reconocerlos desde cualquier interfaz.

| Idioma | Pestañas | Ruta de preferencia | Acción de bienvenida |
|---|---|---|---|
| Español | Inicio · Mi compra · Ahorro · Menús | Perfil → Idioma | Empezar sin cuenta |
| English | Home · My shopping · Savings · Menus | Profile → Language | Start without an account |
| Deutsch | Start · Einkauf · Sparen · Menüs | Profil → Sprache | Ohne Konto beginnen |
| Français | Accueil · Mes courses · Économies · Menus | Profil → Langue | Commencer sans compte |

## A. Bienvenida, detección y elección manual

1. Abrir con un perfil de prueba limpio cuyo idioma preferido sea español. Comprobar bienvenida, marca intacta, selector y botón de inicio. Repetir con `en`, `de` y `fr` en perfiles limpios. El primer idioma compatible de la lista de preferencias del dispositivo debe elegirse automáticamente.
2. Probar una variante regional, por ejemplo alemán de Suiza: debe abrir en alemán. Probar solo un idioma no admitido, por ejemplo italiano: debe abrir en español. Si la lista contiene italiano seguido de francés, debe elegir francés.
3. En la bienvenida, elegir otro idioma. Esperar a que termine el guardado y comprobar selección, título, ayuda y botón traducidos. Empezar sin cuenta; recargar o cerrar y abrir. Debe mantenerse el idioma y no repetirse la bienvenida guardada.
4. Abrir Perfil → Idioma y elegir English. Cerrar la aplicación, cambiar el idioma del dispositivo a alemán y volver a abrir. La aplicación debe seguir en inglés porque la elección manual guardada tiene prioridad.
5. Seleccionar la opción de idioma del dispositivo. Volver a primer plano tras cambiar el dispositivo a francés: debe seguir francés. En un navegador, registrar si el cambio de preferencias requiere reiniciar el navegador para que este lo exponga.
6. Cambiar de idioma repetidamente, esperando cada guardado. Un fallo o conflicto debe indicarse; no contar una selección como persistente hasta cerrar y abrir correctamente. No debe perderse el acceso a Perfil ni aparecer un nombre de clave como `language.title`.

## B. Datos propios, cantidades y presupuesto

Realizar este recorrido en los cuatro idiomas, con los separadores de la tabla. Los importes del ejercicio son ficticios y no representan precios comerciales verificados.

| Idioma | Cantidad de prueba | Precio de prueba | Presupuesto | Presentación monetaria esperada |
|---|---|---|---|---|
| `es` | `1,25` kg | `2,40` | `40,00` | Euro, decimal con coma. |
| `en` | `1.25` kg | `2.40` | `40.00` | Euro, decimal con punto; nunca USD/GBP. |
| `de` | `1,25` kg | `2,40` | `40,00` | Euro, decimal con coma. |
| `fr` | `1,25` kg | `2,40` | `40,00` | Euro, decimal con coma. |

1. Crear la lista `Familia Äna — été ñ` y asignarle el presupuesto de prueba. Añadir `Café Órbita edición Å`, cantidad de la tabla, unidad kg, precio de la tabla y nota `Conservar: crème / Größe / ñ / à demain`.
2. Marcar el producto como comprado. Cambiar a cada idioma desde Perfil y regresar a la lista. Nombre, nota, cantidad real, precio, presupuesto y marcado deben conservarse. Solo cambian etiquetas y formatos.
3. Editar un producto e introducir nombre `Borrador aún sin guardar`, cantidad `1,25` (o `1.25`), precio `2,40` (o `2.40`) y nota `No perder: Grüße — été`. Conservar el editor abierto y cambiar el idioma desde otra pestaña web del mismo origen, según el apartado E. Los campos deben conservar su texto y su valor; después de confirmar deben guardarse como 1250 milésimas y 240 céntimos, sin multiplicarse ni redondearse por el cambio de idioma.
4. Dejar un precio vacío: debe seguir siendo pendiente, no cero. Probar un importe con tres decimales y una cantidad con cuatro decimales: deben pedir corrección sin guardar parcialmente. Corregir y guardar. Los mensajes y etiquetas accesibles deben aparecer en el idioma activo.
5. Cerrar y volver a abrir. Comprobar los mismos datos. Si se pierde información, registrar el paso y no borrar el almacenamiento para ocultar el fallo.

Los textos propios que coincidan exactamente con un ingrediente o nota canónicos pueden verse traducidos por el límite de procedencia del modelo anterior. Su valor guardado debe permanecer igual. Para verificar conservación literal, usar los textos Unicode de este ejercicio, que no son vocabulario del catálogo.

## C. Menús, recetas e importación local

1. En cada idioma, abrir Menús, preparar un menú y abrir una receta. Revisar título, ingredientes, pasos y advertencia de alérgenos. Cambiar de dos a cuatro personas: cantidades y selección de recetas deben mantenerse coherentes al cambiar después de idioma.
2. Revisar los ingredientes antes de llevarlos a una lista. Excluir uno y editar la nota de otro a `Solo esta marca: Ä — crème`. Cancelar: la lista de compra debe seguir igual. Repetir y confirmar: solo se incorporan los cambios revisados.
3. Abrir «Traer texto de ChatGPT» o su traducción y pegar este texto de prueba, con un ingrediente por línea:

```text
0,5 kg arroz
2 L leche
3 huevos
```

4. Revisar cantidades, unidades, destino y duplicados antes de confirmar. Probar sumar a un producto y añadir otro por separado. Cancelar y comprobar que no se alteró la lista; después confirmar y probar Deshacer antes de otra modificación guardada.
5. Pegar `arroz al gusto`: debe pedir corrección sin importar solo una parte del texto. Este parser es local y limitado; no traduce peticiones libres, busca precios ni verifica alergias. ChatGPT, si se usa para preparar el texto, funciona fuera de JJ.

## D. Comparadores y fechas

1. Abrir Ahorro → comparador de formatos y fuentes, o su traducción. Crear dos observaciones ficticias del mismo producto, marca, formato y calidad: 500 g a 1,80 € y 1 kg a 3,00 €. Usar tiendas claramente ficticias, la fecha de ayer en `AAAA-MM-DD` y procedencia `Ejercicio manual, sin verificación comercial`.
2. Comprobar 3,60 €/kg frente a 3,00 €/kg con el formato del idioma seleccionado. La fecha visible debe respetar ese idioma y conservar el mismo día al cambiar de zona horaria. El campo de entrada sigue pidiendo `AAAA-MM-DD` en los cuatro idiomas.
3. Cambiar calidad o unidad: debe dejar de considerarse equivalente. Marcar una observación como Demostración, poner una fecha de más de siete días o dejar un precio vacío: debe quedar fuera de la comparación según su motivo, sin convertir el dato en precio verificado.
4. Introducir una fecha futura y un enlace `javascript:alert(1)`: deben rechazarse. No abrir enlaces desconocidos como parte del ejercicio. Una fuente válida solo debe abrirse al solicitarlo.
5. Abrir el comparador anterior. Comprobar que conserva sus registros y su cálculo de precio más envío, sin recibir fecha, formato ni procedencia inventados al cambiar de idioma.

## E. Dos pestañas, conflictos y persistencia

Estos pasos web requieren dos pestañas del **mismo perfil y origen HTTPS/localhost**, con la misma versión nueva de la aplicación. Una ventana privada distinta no necesariamente comparte los mismos datos.

1. En la pestaña A abrir un editor con los datos de borrador del apartado B, sin guardar. En B cambiar el idioma y esperar a que se guarde. A debe actualizar las etiquetas sin cerrar el editor ni perder nombre, nota, cantidad o precio. Guardar desde A y comprobar el resultado tras recargar.
2. Abrir el mismo dato en ambas pestañas. Guardar un cambio desde B; intentar guardar la edición antigua desde A. Debe rechazarse el conflicto con un mensaje visible y conservar el borrador. Recargar/revisar el dato más reciente antes de reintentar; no debe sobrescribirse silenciosamente.
3. Preparar cambios distintos en ambas pestañas y confirmar casi a la vez. Comprobar el resultado recargando ambas. Son aceptables una serialización coherente o un rechazo explícito que preserve el borrador; no son aceptables éxito falso ni desaparición silenciosa del otro cambio.
4. Repetir con el selector de idioma y la finalización de bienvenida en un perfil de prueba preparado para ello. Cambiar idioma no debe deshacer una bienvenida ya guardada. Un conflicto de preferencias puede pedir un reintento.
5. Probar la misma web por una IP LAN con HTTP cuando el navegador no exponga Web Locks. Debe explicar que no puede guardar con seguridad, conservar el borrador y evitar cambios persistidos. Repetir en HTTPS para separar esta limitación del comportamiento de idioma.

La cola nativa solo cubre el mismo contexto JavaScript. Esta prueba no acredita coordinación entre procesos ni protege una pestaña antigua que aún ejecute una versión en caché ajena al protocolo nuevo.

## F. Errores de almacenamiento y privacidad

La inyección de errores se realiza solo en el perfil de QA. Si el comprobador no dispone de herramientas para simularlos, registrar **pendiente**, sin afirmar que pasaron. Las pruebas automatizadas cubren estos escenarios; sus resultados finales deben enlazarse en la auditoría.

| Escenario | Resultado que se debe comprobar |
|---|---|
| Lectura de preferencias rechazada | Error comprensible y reintento. La opción de continuar la sesión no afirma que se guardó la bienvenida. |
| Preferencia corrupta o versión futura | Se conserva el documento original; no se sobrescribe con valores por defecto al elegir idioma, reintentar o recargar. |
| Escritura rechazada por cuota o privacidad | Se conserva la preferencia o documento anterior y el borrador. No aparece un éxito falso. Tras restaurar el almacenamiento se puede revisar y reintentar. |
| Web Locks o IndexedDB no disponibles | Se rechaza el guardado seguro; la interfaz muestra el motivo sin destruir los datos existentes. |
| Reserva durable pendiente o confirmación incierta | Se bloquean nuevas escrituras y se explica el resultado incierto. No se borra el registro para aparentar recuperación automática. Conservar la evidencia para revisión. |

En herramientas del navegador, comparar antes y después del cambio de idioma los cuatro valores completos de negocio enumerados en el contrato: deben ser idénticos si no se ha confirmado una edición de negocio. La preferencia usa su clave propia; el registro de coordinación guarda metadatos y huellas, no una copia de listas o notas.

No incluir notas privadas, capturas de compras reales ni volcados completos de almacenamiento en un informe compartido. Para la revisión de red, usar únicamente los datos ficticios: cambiar idioma no debe enviar listas o texto a un servicio de IA o comercio. El servidor de desarrollo puede solicitar sus propios recursos y actualizaciones; registrar destinos observados sin confundirlos con una API de producto.

## G. Accesibilidad y uso físico en los cuatro idiomas

Repetir bienvenida, Perfil → Idioma, lista, editor, receta, revisión de ingredientes y comparadores. Dar atención adicional al alemán y al francés por los textos largos.

- **VoiceOver/TalkBack:** comprobar lectura de marca, encabezados, pestañas, etiquetas de campos, botones, selector de idioma y estado seleccionado. Cantidades, euros y errores deben entenderse; el color no debe ser la única indicación. Registrar la pronunciación real y cualquier mezcla de idioma.
- **Texto grande:** activar un tamaño grande de accesibilidad/Dynamic Type en el teléfono. Revisar que títulos, ayudas y botones se pueden leer completos y que los controles siguen accesibles mediante desplazamiento. El texto simulado al 130 % en web no sustituye este paso.
- **Teclado y zonas seguras:** editar la última nota o precio con el teclado abierto. Comprobar acceso a guardar, cancelar y mensajes de error, sin quedar bajo el teclado, la muesca o el indicador inferior. Revisar iPhone pequeño y grande cuando estén disponibles.
- **Teclado externo/web:** recorrer con Tab y Shift+Tab, activar selección y acciones, y comprobar foco visible y orden lógico. Revisar que un panel cerrado no deja el foco en un control oculto.
- **Safari físico:** probar orientación admitida, scroll, reapertura, selector de idioma y dos pestañas cuando sea posible. Los tamaños CSS de iPhone en Chromium no equivalen a Safari en iOS.
- **Sin conexión:** con la aplicación ya cargada, probar lista y catálogo local en modo avión, y reabrir en una compilación con el paquete incluido. Expo Go puede necesitar el servidor para arrancar; distinguir ese límite de un fallo de datos locales.

## Registrar y cerrar la prueba

| Entorno y modelo | Idioma dispositivo / elección | Apartado y paso | Esperado / observado | Evidencia | Resultado |
|---|---|---|---|---|---|
| Por completar | Por completar | Por completar | Por completar | Captura o descripción sin datos privados | Pendiente |

Usar como resultado **aprobado**, **fallo**, **pendiente** o **no aplicable con motivo**. Registrar también los casos no ejecutados. Un fallo de integridad, éxito falso o sobrescritura silenciosa impide cerrar esa revisión hasta corregirlo y repetirlo. Los avisos de herramientas y las limitaciones nativas se mantienen visibles en la entrega; esta guía no certifica ausencia de riesgos ni publica una versión nueva.
