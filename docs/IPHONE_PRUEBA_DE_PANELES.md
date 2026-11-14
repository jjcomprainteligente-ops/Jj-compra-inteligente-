# Prueba física de paneles y datos locales

Esta guía complementa [la prueba de los cuatro idiomas](I18N_PRUEBA_GUIADA.md). Es una lista de aceptación pendiente: las pruebas automatizadas de Chromium o WebKit y una exportación de Expo no acreditan su ejecución en un iPhone real.

## Preparación

Usar el enlace de la entrega que figure en la conversación, anotar su versión y probar primero con datos ficticios. Los enlaces temporales de Vercel caducan. Cada origen web tiene su almacenamiento propio: una lista de otra preview no se traslada automáticamente. No borrar datos de una versión anterior para probar una nueva.

Anotar modelo, versión de iOS, navegador, orientación y tamaño de texto. Repetir en español, inglés, alemán y francés; comprobar el idioma elegido después de recargar. Mantener JJ Compra Inteligente y las cantidades en euros.

## Recorrido de paneles

| Paso | Resultado esperado |
|---|---|
| Menús → Filtros, sin teclado | Encabezado, opciones y botones legibles. El pie queda por encima del indicador inferior. Se puede desplazar todo el contenido. |
| Cerrar por botón visible y volver a abrir | El botón responde; ninguna lista ni menú cambia al cerrar. |
| Tocar fuera del panel | Cierra si no hay una operación ocupada. Con borrador que requiera confirmación, se respeta la advertencia. |
| Añadir producto y escribir nombre, cantidad y nota | El teclado permite llegar a los últimos campos y al botón Guardar. Las ayudas siguen disponibles. |
| Salir sin guardar → Seguir editando | Aparece confirmación y se conserva exactamente el borrador. La lista guardada no cambia. |
| Descartar explícitamente | Se cierra el borrador; no se crea un producto. |
| Guardar y recargar | El producto aparece una sola vez, con cantidad, unidad y nota correctas. |
| Perfil → Privacidad → revisar borrado, después cancelar | Se leen instrucciones y palabra requerida. Cancelar conserva los datos. Probar el borrado únicamente con datos ficticios. |

## Accesibilidad física

1. **VoiceOver:** activar el lector antes de abrir filtros. Debe anunciar el diálogo y su título, recorrer controles con nombre/estado y permitir cerrar mediante el botón visible. La superficie transparente exterior no debe anunciarse como otra acción. Revisar ayudas de cantidad y confirmación de privacidad.
2. **Confirmación:** escribir un borrador y pedir salir. El contenido nuevo debe ser localizable por el lector y el teclado. Nunca debe ejecutarse un descarte o borrado solo por recibir foco.
3. **Teclado externo:** comprobar Tab y Shift+Tab dentro del panel, Escape, confirmación del borrador y retorno al disparador tras cerrar. La prueba web automatizada no sustituye este recorrido de iOS.
4. **Texto grande:** activar un tamaño de accesibilidad grande en iOS. Revisar filtros, producto, gasto y privacidad. Todo el texto y las acciones deben seguir siendo alcanzables; no basta con ver el encabezado.
5. **Zonas seguras y teclado:** probar con indicador de inicio y, cuando se disponga, un iPhone pequeño. Revisar también orientación horizontal en Safari. Anotar cualquier acción tapada por teclado, muesca o indicador.
6. **Movimiento reducido:** activar la preferencia del dispositivo y repetir aperturas/cierres. El recorrido debe conservarse sin animaciones necesarias para entenderlo.

## Copias y persistencia

La web descarga un JSON local; la versión nativa preparada usa el panel Compartir con texto JSON y tiene un límite distinto de tamaño. Comprobar la recepción real en el destino elegido antes de dar una copia por guardada. No subir una copia personal al repositorio ni adjuntarla a un informe público.

La aplicación exige mecanismos de guardado seguro. Si Safari o una sesión privada los bloquean, debe conservar el borrador y explicar que no puede guardar; no debe anunciar éxito. Registrar el mensaje y el contexto. No borrar ni manipular el registro de coordinación para forzar una escritura.

El catálogo disponible sigue siendo el inicial de siete recetas. Las 150 recetas del propietario se integrarán cuando se reciban y revisen; no se utilizan datos de prueba como sustituto de esa biblioteca.

## Registro de aceptación

| Modelo / iOS / navegador | Versión de app | Idioma | Paso | Esperado / observado | Resultado |
|---|---|---|---|---|---|
| Pendiente | Pendiente | es/en/de/fr | Pendiente | Descripción sin datos personales | Pendiente |

Resultados posibles: aprobado, fallo, pendiente o no aplicable con motivo. Un fallo de conservación de datos, confirmación o éxito falso bloquea la aceptación de ese flujo. Compartir una descripción del paso y del dispositivo; usar capturas solo con contenido ficticio o revisado para no divulgar datos personales.
