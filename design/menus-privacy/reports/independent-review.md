# Auditoría final de la pareja: filtros de Menús y privacidad local

Fecha: 9 de noviembre de 2026. Rama inspeccionada: `codex/menus-privacidad-local`; base `52ea41d`. Auditoría de solo lectura sobre los cambios de aplicación y pruebas presentes. No se modificó la app, no se crearon commits y no se ejecutó la suite completa desde este auditor. Este informe es el único archivo escrito por esta revisión final.

## Dictamen

No quedan hallazgos bloqueantes identificados en la revisión estática final de esta pareja, después de corregir los problemas señalados durante su implementación. Esto permite continuar a la verificación integrada y publicación de la compilación que apruebe sus pruebas; no equivale a ausencia absoluta de errores, aprobación estética ni validación en un iPhone físico.

El padre informa TypeScript y 758 pruebas unitarias correctos. Se revisó el contenido de las 13 pruebas del helper de entrega de copias: cubren creación y liberación de URLs, un propietario nuevo tras disponer del anterior, nombres de archivo, límites y contratos simulados de Share. No son una prueba instrumentada de React Strict Mode ni del panel nativo en un dispositivo físico. El componente crea un propietario por configuración del efecto y limpia su propia instancia, patrón compatible con el ciclo de configuración/limpieza de Strict Mode.

## Alcance leído

- `src/domain/menuFilters.ts`, `src/app/components/MenuFilterPanel.tsx` y cambios de `src/app/screens/MenuWorkspace.tsx`.
- `src/domain/dataPrivacy.ts`, `src/storage/dataPrivacy.ts`, `src/app/backupDelivery.ts` y `src/app/screens/DataPrivacyScreen.tsx`.
- Integración en `src/app/ShoppingApp.tsx`, Perfil, rutas y recursos de traducción.
- Catálogos `privacy.ts` y `menuFilters.ts`; pruebas de dominio, entrega y recorridos nuevos.
- Coordinador de escrituras, protección duradera, cargadores/escritores existentes y montaje de menús/comparador, para contrastar conservación y limpieza de estado.

## Garantías verificadas en el código

### Filtros y planificación

Los filtros son estado de sesión y no escriben preferencias alimentarias en almacenamiento. El filtro por tiempo usa los minutos reales del catálogo; las exclusiones usan claves canónicas conocidas con nombres traducidos solo para presentación. Las etiquetas vegetariana/vegana se conceden únicamente cuando el contenido de una receta coincide con los ingredientes revisados de ese catálogo. Reutilizar un identificador en una receta modificada no hereda una clasificación alimentaria.

El algoritmo no duplica recetas ni relaja filtros para completar cinco cenas cuando faltan resultados. Construye una propuesta separada; un menú existente cambia solo al confirmar esa propuesta. La cancelación conserva el plan. Las sustituciones se limitan a recetas compatibles que todavía no estén incluidas. Los bloqueos por referencia protegen el guardado frente a pulsaciones repetidas. El presupuesto se muestra como orientación y no inventa costes, ahorro o un filtrado económico sin fuente.

### Copias y alcance de datos

Solo se exportan las siete claves fijas declaradas: seis documentos de negocio/configuración local y la preferencia de idioma. No se enumera el almacenamiento del navegador ni se incluyen claves de otras aplicaciones. La copia serializa documentos originales como cadenas JSON inertes, por lo que conserva bytes corruptos o de versiones futuras sin interpretar HTML, ejecutar contenido o reescribir los documentos de origen.

La lectura realiza dos capturas y rechaza diferencias detectadas. El código señala expresamente que no se trata de una transacción atómica entre documentos. Hay límites de UTF-8 por documento y para el JSON final; la exportación por categoría reduce el alcance cuando otra categoría es demasiado grande. La exportación no modifica los datos guardados.

Web entrega un Blob JSON con un nombre fijo validado y una URL temporal; la URL se libera después de iniciar la descarga o al salir. El mensaje solo afirma «descarga iniciada», no que el usuario haya guardado el archivo. No existe una alternativa oculta de red o portapapeles. Nativo usa el panel de Share con texto JSON tras una acción explícita y limita el mensaje a 1.000.000 de caracteres. La cancelación se distingue cuando la plataforma la informa; la copia neutral evita afirmar que Android guardó un archivo cuando solo devolvió `sharedAction`.

### Borrado y concurrencia

El borrado opera sobre una sola categoría elegida de una lista cerrada de seis ámbitos. No llama a `AsyncStorage.clear`, no elimina claves ajenas, no restablece idioma y no cambia los contratos o claves anteriores.

La preparación valida el documento y mantiene la instantánea esperada en una clausura privada asociada mediante WeakMap a un descriptor congelado. Un descriptor inventado, usado, caducado o con ámbito inválido no autoriza el borrado. La confirmación de UI exige un segundo paso, una palabra localizada exacta y una casilla con estado ARIA explícito. Los bloqueos inmediatos impiden el reenvío durante la operación.

La escritura usa el coordinador existente, comparación del estado esperado y protección duradera. Un cambio de otra pestaña posterior a la revisión bloquea el borrado obsoleto. También se comprueba que la lectura confirmada coincide con el documento vacío esperado, evitando anunciar éxito si una escritura no produjo el resultado solicitado. Ante un fallo o resultado incierto, la UI mantiene el borrador y exige una revisión explícita nueva antes de intentarlo otra vez; no actualiza silenciosamente la instantánea para borrar contenido concurrente.

La UI bloquea navegación mientras opera. Tras borrar, se recarga el almacén correspondiente y se retira su historial de deshacer. Los almacenes de menús y comparador no permanecen montados al abrir privacidad y vuelven a leerse al entrar. Privacidad sigue accesible cuando una lista no se puede cargar, de modo que se puede exportar su copia original.

## Hallazgos de esta auditoría corregidos

| Hallazgo | Corrección comprobada |
|---|---|
| Volver de Privacidad a Perfil sobreescribía el destino de retorno y producía un ciclo Perfil/Privacidad | El guard de `navigate('profile')` excluye `privacy`, igual que `language`. Hay una regresión de recorrido en el nuevo archivo E2E. |
| `privacy.profileSubtitle` faltaba y podía mostrarse como clave literal | Se añadió el texto compacto en los cuatro idiomas. |
| El contenedor de la propuesta no incluía los botones de confirmar/cancelar del pie | El identificador de la propuesta se movió al Sheet completo, conservando los identificadores de receta/revisión. |
| El aviso general de error de descarga se reutilizaba para fallos de revisión/borrado | La UI distingue el contexto de exportación, borrado e inventario. |
| El texto de Share podía afirmar una acción completada cuando Android solo informa cierre del panel | Texto neutral en es/en/de/fr que solicita comprobar si se guardó la copia. |
| El máximo de caracteres web difería del límite declarado del modelo | El helper deriva el límite web de la constante central de privacidad. |
| La selección de ingredientes podía superar el límite de exclusiones al ampliarse el catálogo | La UI bloquea selecciones nuevas al alcanzar el máximo y conserva la posibilidad de desmarcar. |

La comprobación estática de recursos encontró 67 claves de privacidad y 41 de filtros, con los mismos conjuntos en español, inglés, alemán y francés. No quedaron claves literales usadas por los componentes nuevos sin definir en sus catálogos.

## Límites que deben constar en la entrega

- Un documento corrupto o de versión futura puede exportarse, pero su borrado queda bloqueado para conservar datos que la app no puede validar. No se ofrece un borrado forzado ni se salta una protección duradera incierta.
- La copia conjunta usa dos lecturas estables, no una transacción atómica de todos los documentos.
- El borrado se realiza por categoría y es permanente para esa categoría; la confirmación informa que no hay deshacer. Las demás categorías, el idioma y las recetas incorporadas permanecen.
- La copia nativa es texto JSON mediante Share, no un fichero creado por una biblioteca nativa de archivos. Tiene el límite descrito y depende de las capacidades del panel del dispositivo.
- Los filtros no certifican alérgenos ni seguridad alimentaria. Los ingredientes y etiquetas requieren revisión del usuario.
- El catálogo sigue conteniendo siete recetas iniciales. Las 150 recetas propias en cuatro idiomas están pendientes de recepción e integración; no se presentan como importadas, guardadas o traducidas por esta pareja.
- No hay prueba física de iPhone/Safari, VoiceOver, Dynamic Type, Share nativo, teclado o hardware de cámara/micrófono desde este auditor. La prueba web y una exportación Hermes no sustituyen esos criterios.
- No se introducen cuentas, sincronización, pagos, APIs comerciales, precios verificados o un backend de IA.
- Las capturas permanecen como artefactos locales según el bloqueo anterior de su publicación pública; esta auditoría no autorizó ni intentó subir imágenes.

## Cierre de verificación pendiente del padre

Incorporar el resultado real de la suite integrada, capturas afectadas y prueba remota de la preview. Asociar la publicación al commit exacto guardado en GitHub y mantener `staging` y la protección del proyecto. No convertir esta revisión de código en una afirmación de que B00–B09, el recetario propio o el piloto físico están terminados.
