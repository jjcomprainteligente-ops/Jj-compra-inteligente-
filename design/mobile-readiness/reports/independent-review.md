# Revisión independiente de paneles — 10 de noviembre de 2026

Resultado de la segunda revisión: no se identificaron bloqueos nuevos de seguridad o conservación de datos en el diff actualizado. La lógica de foco y adaptación del scroll es coherente con los callers actuales. Es una revisión estática; las pruebas automatizadas y la comprobación en iPhone físico corresponden a la validación del agente principal. La primera revisión estática no detectó un defecto real de retorno del foco al cerrar que después encontraron las pruebas E2E. Este informe no presenta la inspección estática como validación del comportamiento real.

## Alcance y evidencia

- Repositorio: `/workspace/jjcompraintelwgiemt`, rama `codex/mobile-readiness`.
- Base del diff: commit `936459d2eb67b0b7decb288d619902584d4f490d`; el cambio sigue sin commit en el momento de la segunda revisión.
- Diff inspeccionado: `src/app/components/ui.tsx` y `src/components/ui.tsx` (81 líneas añadidas y 24 retiradas), más el hook nuevo `src/components/useSheetFocus.ts`.
- SHA-256 del contenido revisado: principal `249374983739872d9b1e8fbcb67bca294986112d07fa8d001e4131f5f58ceaf0`; comparador `1617abaead2c603483e0869fe44857ff3f2ce8aa7a1fd91c247d6c68b165869f`; hook `fbb7b306fa881b8cc65d7ce5f5cff59da73b505a65dc24b058db0a2e2c133ab6`.
- Se enumeraron todos los callers actuales de `Sheet`: `ShoppingApp`, `MenuWorkspace` / `MenuPanel`, `MenuFilterPanel`, `PriceWorkspace`, `ExpenseEditor`, `DeleteExpense`, `DataPrivacyScreen` y los tres modales del comparador en `App.tsx`.
- Implementaciones instaladas consultadas: `react-native-web/dist/exports/Modal/ModalFocusTrap.js`, `Modal/index.js`, `ModalAnimation.js`, `react-native-safe-area-context/src/SafeAreaView.web.tsx` y mapeo de `aria-describedby` de React Native Web.
- Se leyó la versión actualizada de `tests/e2e/panel-accessibility.spec.ts`: cuatro idiomas, teclado, borrador sin guardar, bloqueo de persistencia, toque exterior y texto CSS ampliado. Las aserciones de texto ampliado ahora exigen campo visible y tocable, además de foco, y comprueban que el destino destructivo no recibe foco inicial. Esta revisión independiente no ejecutó ni certifica esas pruebas, ni las ejecuciones WebKit o completas anunciadas por el agente principal.
- No se modificó código, configuración, dependencias ni historial; solo se creó este informe fuera del repositorio.

## Comprobaciones

### Cierre exterior, bloqueo y borradores

El scrim es un `View` hermano anterior al panel, con relleno absoluto; no es un ancestro que capture los gestos sobre los controles interiores. Solo solicita responder cuando `busy` es falso y vuelve a comprobarlo al liberar el gesto. Escape / cierre del sistema mantiene la misma guardia. Los caminos siguen invocando `onClose`, sin ocultar directamente el modal ni escribir almacenamiento.

`ShoppingApp.close` conserva la comparación con el borrador original y la revisión antes de descartarlo. `MenuWorkspace.close` conserva `busy` y los locks síncronos de aplicación y plan, además de la revisión de borradores. Precios conserva su revisión de borradores; gastos conserva `submissionLock`, revisión antes de guardar y descarte explícito. `DataPrivacyScreen.close` conserva `busy` y `operationLock`; cancelar no ejecuta ninguna eliminación. Las validaciones de palabra, casilla y descriptor preparado siguen en el caller y no fueron alteradas. En el comparador se mantiene el comportamiento de cierre preexistente: este diff no introduce una nueva política para sus borradores.

El fondo deja de ser un segundo botón de cierre para lectores de pantalla y teclado. El botón interior con nombre traducido sigue disponible. La vista de fondo oculta de accesibilidad no contiene el panel: son hermanos.

### Foco y React Native Web Modal

`useSheetFocus` comparte la lógica entre ambos componentes. La reparación interior solo se ejecuta en web, con modal visible, cuando el elemento activo es exactamente `document.body`, y al cambiar visibilidad o la clave del paso. En el panel principal esa clave también incluye el modo de scroll, para cubrir el remontaje de sus descendientes. No instala listeners globales, no implementa otro trap y no fuerza foco sobre un control destructivo. Si ya hay un control enfocado, lo respeta.

El nodo de destino tiene `tabIndex=-1`: acepta el foco programático sin añadir un paso permanente al orden de Tab. React Native Web conserva su trap y su intento normal de restauración, y ahora el hook añade una restauración de respaldo. La limpieza del layout cerrado captura el disparador antes del autofocus del editor; `onDismiss` espera un `requestAnimationFrame` y solo restaura si el panel sigue cerrado, el foco quedó en `document.body` y el disparador está conectado y habilitado. Si RN restauró correctamente, hay otro control activo o el panel se reabrió, el respaldo no mueve el foco. Los frames se cancelan al cambiar visibilidad y al desmontar. Las referencias DOM solo se consultan en web y no contienen texto de los borradores.

La implementación instalada de RN Web acepta foco dentro del árbol del modal: enfocar el contenedor no introduce un segundo trap. La condición de `document.body` evita robar foco a un modal superpuesto que ya tenga un control activo. Los callers montados directamente con `visible=true` dependen del intento normal de RN para restaurar su disparador: no hubo etapa cerrada en la que capturarlo. Los callers de esta clase revisados —filtros y gastos— no incluyen inputs con autofocus.

La reparación no es un observador general de cambios interiores: una futura transición que elimine el control enfocado sin cambiar la clave necesitaría validación específica. La corrección del caso real de retorno descubierto por E2E debe acreditarse con el resultado de la ejecución actualizada, no solo con esta lectura.

### Descripciones de campos

`useId` genera el identificador, sin derivarlo del texto del usuario y sin interpolarlo en selectores, HTML o scripts. El hint solo se agrega a `aria-describedby` cuando existe el correspondiente `Text nativeID`; se preservan las referencias externas proporcionadas por el caller. Los identificadores generados son válidos como referencias ID de HTML. Se mantiene `accessibilityHint` para nativo y se respeta el hint explícito del caller.

Los callbacks originales de foco y desenfoque ahora se encadenan con el estado visual, en lugar de quedar sustituidos. No se añaden persistencia ni comunicaciones de datos.

### Área segura y límites de diseño

El panel principal usa `SafeAreaView` únicamente en el borde inferior, dentro del proveedor ya existente. El estilo del panel no incluye otro padding inferior de área segura; el padding visual del cuerpo y pie permanece. No cambia la paleta, el logo, los radios ni los límites de ancho y alto. La vista del comparador conserva su disposición centrada anterior.

No se ve una doble aplicación estática del inset inferior en el panel principal. Normalmente se conservan encabezado, cuerpo desplazable y pie fijo. La adaptación mide encabezado y acciones, reserva una altura mínima de cuerpo según `fontScale` y pasa a un único scroll cuando no cabe. La decisión queda fijada hasta el cierre: evita alternancias causadas por volver a medir la nueva estructura. Al cerrar se reinician medidas y modo; el callback de medición no invoca cierres ni persistencia.

La transición sí cambia la estructura y puede remontar controles interiores. En todos los callers actuales, los valores y decisiones importantes viven fuera de `Sheet`: el borrador de compras, filtros, texto de menús, precios, gastos y confirmación de privacidad, junto con sus errores, pasos y locks, pertenecen al padre. Los `Field` editables inspeccionados tienen `value` y callbacks controlados. Los componentes propios dentro del cuerpo revisados son de presentación. Por tanto no se encontró pérdida estática de borrador o bypass de confirmación al remontar. Se pueden reiniciar estado visual local del campo, posición de scroll, selección o cursor; esta estructura no ofrece una garantía para futuros hijos con estado local o inputs no controlados.

La altura disponible usa la ventana y el inset inferior, no una medida directa del área reducida por el teclado. La interacción real entre `KeyboardAvoidingView`, teclado iOS, notch, indicador de inicio, orientación y Dynamic Type debe comprobarse en dispositivo; una prueba CSS o WebKit de escritorio no certifica esos aspectos. No se observó un bloqueo demostrable adicional por lectura estática.

## Dependencias y artefacto de auditoría

No se realizó ninguna consulta npm adicional durante esta revisión. La consulta fresca del 10 de noviembre se entregó por stdout y se resumió en `/workspace/scratch/security-2026-11-10.md`: 5 avisos moderados, 0 altos y 0 críticos; las correcciones disponibles exceden los rangos mayores admitidos por Expo 58.

No existe un JSON guardado de esa consulta fresca entre los artefactos encontrados. El JSON `design/menus-privacy/reports/npm-audit.json` y su copia `/workspace/scratch/menus-privacy/npm-audit.json` tienen fecha del 9 de noviembre. Los otros JSON npm encontrados son del 7 de noviembre o anteriores. No deben presentarse como una nueva consulta del día 10.

Las cinco advertencias permanecen abiertas y documentadas; este diff no las corrige ni justifica afirmar «cero vulnerabilidades».

## Cierre

Sin solicitud de cambios en los tres archivos de código revisados. Integrar los resultados reales de las pruebas enfocadas, WebKit y completas del agente principal antes de publicar, incluidos retorno de foco y contenido tocable al 200 %. Mantener pendientes las comprobaciones nativas explícitas y las cinco advertencias de dependencias.
