# Internacionalización — contrato y plan

**Alcance autorizado:** incorporar español, inglés, alemán y francés de forma aditiva. Se conservan JJ Compra Inteligente, Tenerife, Verde Mercado, Manrope y M3 provisional. Este trabajo no abre un rediseño ni nuevas integraciones de comercio, pagos o IA.

Este documento fija el comportamiento que debe cumplir la entrega. El resultado de la auditoría completa se registrará en [I18N_ENTREGA_Y_AUDITORIA.md](I18N_ENTREGA_Y_AUDITORIA.md); las comprobaciones aún pendientes no se consideran aprobadas por aparecer aquí.

## 1. Idioma y prioridad

| Código | Nombre en el selector | Configuración de formato |
|---|---|---|
| `es` | Español | `es-ES` |
| `en` | English | `en-GB` |
| `de` | Deutsch | `de-DE` |
| `fr` | Français | `fr-FR` |

1. Una elección manual válida y guardada tiene prioridad sobre el idioma del dispositivo.
2. En modo dispositivo, se recorre la lista de idiomas preferidos hasta encontrar uno compatible. Se admite su variante regional, por ejemplo `de-CH` → `de`.
3. Si no hay uno compatible, se usa español.
4. La bienvenida permite elegir idioma y empezar sin cuenta. Después se accede desde Perfil → Idioma; la opción del dispositivo permite volver a la detección automática.
5. Al volver a primer plano, o recibir un cambio de idioma del navegador, se actualiza la detección. Esto no sustituye una elección manual guardada.

La preferencia y la bienvenida persisten solo en el almacenamiento de esa instalación u origen web. No implican sincronización entre dispositivos, navegadores ni entornos web/nativos. Si un guardado falla o entra en conflicto, no se presenta la selección como confirmada: se conserva la preferencia anterior y se permite reintentar. La prioridad manual aplica tras guardar correctamente.

## 2. Arquitectura y API

| Archivo | Responsabilidad |
|---|---|
| `src/i18n/types.ts` | Idiomas admitidos, nombres propios de cada idioma, configuración regional, tipos y moneda fija. |
| `src/i18n/core.ts` | Detección, resolución de prioridad, traducción, composición de catálogos y formato de importes, cantidades y fechas. |
| `src/i18n/resources.ts` | Reúne los catálogos `common`, `app`, `menus`, `prices`, `recipes`, `legacy`, `errors`, `secondary` y `language`. |
| `src/i18n/LanguageProvider.tsx` | Contexto de la aplicación, estado de carga/error, cambios de idioma y reintentos. En web actualiza `html.lang`. |
| `src/i18n/preferences.ts` | Validación y persistencia independiente de preferencias. |
| `src/i18n/recipes.ts` | Copias de presentación del catálogo de recetas, sin modificar el modelo canónico. |
| `src/i18n/errors.ts` | Presentación localizada de errores conocidos. |
| `src/i18n/assistantLanguage.ts` | Contexto de idioma para una posible integración futura; no realiza llamadas. |

`useI18n()` se usa dentro de `LanguageProvider`. Expone `language`, `source`, `t`, `translateError`, `categoryLabel`, `unitLabel`, los formateadores y el estado `ready`, `busy` y `preferenceError`. Las operaciones `setLanguage`, `followDevice` y `completeWelcome` devuelven una promesa booleana: la interfaz debe comprobar el resultado. `retryPreferences` vuelve a leer; `dismissWelcomeForSession` permite continuar esa sesión ante un error sin afirmar que se guardó la bienvenida.

Las claves son estables y describen su función, por ejemplo `language.title`. `t(key, values)` interpola valores con nombre (`{language}`), sin construir frases traducibles mediante concatenación. Los números interpolados usan la configuración regional. Una traducción ausente o vacía recurre al español; si también falta allí, devuelve la clave para que el defecto sea detectable. El fallback no sustituye la revisión de paridad de los cuatro catálogos. La composición rechaza claves duplicadas o inseguras.

`expo-localization` se incorpora en la versión compatible `~58.0.5`. `app.json` declara los cuatro idiomas mediante su plugin. La configuración nativa necesita una compilación que la incluya; no basta con cambiar un archivo para certificar su comportamiento en un teléfono.

## 3. Formatos e invariantes

| Dato | Regla |
|---|---|
| Marca | `JJ Compra Inteligente` no se traduce. |
| Moneda | `PURCHASE_CURRENCY = 'EUR'` en todos los idiomas. Cambiar a inglés no convierte importes a dólares ni libras. |
| Importes | Se conservan céntimos enteros exactos. `formatMoney` muestra dos decimales; `formatMoneyInput` prepara un campo editable sin símbolo ni separadores de miles. |
| Cantidades | Se conservan milésimas enteras exactas. `formatQuantity` presenta hasta tres decimales sin añadir ceros innecesarios. IDs, unidades canónicas y reglas de equivalencia no cambian. |
| Números | `formatNumber` aplica la configuración regional. Un número no finito se rechaza. No se deriva un valor de negocio de una etiqueta ya formateada. |
| Día de observación | El formulario mantiene `AAAA-MM-DD`. `formatDate('AAAA-MM-DD')` valida el día ISO y lo presenta en UTC para evitar que cambie de día por el huso horario. |
| Instante `Date` | `formatDate(Date)` valida el objeto y usa la zona local del entorno. No debe usarse como sustituto de un día de calendario. |

Ejemplos de presentación: `1250` céntimos → `12,50 €` en español y `€12.50` en inglés; `1250` milésimas → `1,25` o `1.25`. El día `2026-10-31` se presenta como `31/10/2026` en español/inglés/francés y `31.10.2026` en alemán. El espacio junto al símbolo monetario puede ser un espacio Unicode dependiente de `Intl`.

El idioma no modifica presupuestos, precios introducidos, marcas, tiendas, procedencias, estado de compra, selección de recetas, raciones ni reglas de comparación. Los precios manuales continúan siendo aportaciones de la persona; una traducción no los convierte en datos comerciales verificados.

## 4. Texto propio y recetas

Los nombres de listas y productos, notas y demás texto introducido por la persona se conservan en su idioma original. Cambiar el idioma no reescribe sus documentos.

Las recetas locales ofrecen título, ingredientes, pasos y avisos de alérgenos traducidos mediante una copia de presentación. Los cálculos y las transferencias usan sus IDs y valores canónicos. Las etiquetas de categorías conocidas y `ud` también se localizan sin cambiar el valor guardado.

**Límite de procedencia:** el modelo anterior no identifica si cada nombre o nota procede del catálogo o de una edición manual. El vocabulario de ingredientes/notas se reconoce por coincidencia exacta con el texto canónico español. Por tanto, un texto propio idéntico a ese vocabulario puede verse traducido; el valor almacenado permanece intacto. Un texto desconocido permanece literal. No se infieren equivalencias nuevas entre alimentos a partir de su traducción.

## 5. Persistencia y protección de escrituras

La nueva clave es `jjcompraintelwgiemt.preferences.v1`, con este esquema:

```json
{ "version": 1, "language": null, "welcomeCompleted": false }
```

`language` admite `null` para seguir al dispositivo o uno de `es`, `en`, `de`, `fr`. Los documentos corruptos o de una versión incompatible se conservan y generan un error; no se reemplazan silenciosamente. Continuar sin guardar solo omite la bienvenida durante esa sesión.

Estas cuatro claves de negocio conservan nombre, versión y esquema. Cambiar el idioma o completar la bienvenida no las migra ni las reescribe:

| Clave | Datos |
|---|---|
| `jjcompraintelwgiemt.shopping.v1` | Listas, productos y presupuesto. |
| `jjcompraintelwgiemt.menus.v1` | Recetas seleccionadas y raciones. |
| `jjcompraintelwgiemt.comparisons.v1` | Comparador manual anterior. |
| `jjcompraintelwgiemt.price-observations.v1` | Observaciones del comparador piloto. |

El contrato de guardado exige comparar el estado esperado con el último estado disponible, rechazar conflictos y confirmar la persistencia antes de mostrar éxito. Una edición abierta conserva sus campos al cambiar de idioma o recibir una selección desde otra pestaña.

- **Nativo:** una cola serializa operaciones dentro del mismo contexto JavaScript. No es una garantía de coordinación entre varios procesos o instalaciones.
- **Web:** se exigen Web Locks y un registro durable en IndexedDB con metadatos de coordinación y huellas SHA-256. Ese registro no contiene copias de las listas, recetas ni observaciones. Web Locks más una lectura de `localStorage` no bastan: se observó que dos callbacks podían recibir el mismo valor antiguo por caché.
- Antes de escribir se registra una reserva durable; después se vuelve a leer el dato guardado y se confirma su huella. Una reserva pendiente o un resultado ambiguo bloquean nuevas escrituras. No se borra ni se «repara» ese estado silenciosamente. Las preferencias deben usar la misma protección.
- Un conflicto puede rechazar una acción de forma explícita y exigir recarga/reintento. La protección no garantiza escrituras de versiones antiguas en caché que ignoren el protocolo.
- En un navegador sin las capacidades requeridas se rechaza el guardado de forma segura. `localhost` y HTTPS son los contextos previstos para la prueba web; una IP de la red local por HTTP puede carecer de Web Locks. Para probar web desde un teléfono se prefiere HTTPS.

La corrección quedó implementada y comprobada en la auditoría final: se exige durabilidad estricta de las transacciones y se bloquea ante divergencias o resultados inciertos. IndexedDB y localStorage no constituyen una transacción atómica común. El cierre técnico y sus límites están en la entrega; la distribución continúa pendiente de sus otros requisitos.

## 6. IA preparada, sin conexión

`assistantLanguageContext(language)` es una función pura que devuelve idioma, configuración regional, `EUR` e instrucción de respuesta. No incorpora claves, SDK de IA, solicitudes, historial ni consumo de API. No recibe ni envía el texto de la persona. Sus instrucciones no sustituyen la validación ni las confirmaciones de una futura integración.

El flujo «Traer texto de ChatGPT» sigue siendo una importación local con revisión previa. Las búsquedas de ChatGPT ocurren fuera de JJ; la aplicación no busca precios, existencias ni fuentes por su cuenta.

## 7. Dos bloques y auditoría completa

| Bloque | Entrega y criterio |
|---|---|
| I01 — arquitectura | Tipos, detección, prioridad, fallback español, formato exacto y preferencias separadas; pruebas de las reglas e invariantes. |
| I02 — integración | Bienvenida, Perfil → Idioma, navegación, formularios, errores, recetas y accesibilidad en cuatro idiomas, con conservación de datos y borradores. |
| P01 — auditoría tras I01 + I02 | Revisar código, seguridad, dependencias, accesibilidad, traducciones, datos, carreras entre pestañas, recorridos, capturas y exportaciones. Corregir y repetir los fallos antes de distribuir. |

Se conserva la copia previa [B00-B06-source-before-i18n.zip](../archives/B00-B06-source-before-i18n.zip). Las entregas y evidencias anteriores permanecen disponibles. El preview B05 de Vercel no se sustituye; la exportación local `dist-i18n` no constituye una nueva publicación ni un nuevo enlace compartible.

## 8. Estado verificable y cierre técnico

El primer punto de control tuvo 444 pruebas unitarias correctas y una suite web con 117 aprobadas, 5 fallos y 12 omisiones intencionales. Ese resultado se conserva como antecedente: la carrera real de persistencia y las comprobaciones afectadas se corrigieron y repitieron. El resultado final es **TypeScript correcto, 496 pruebas unitarias y 124 recorridos web aprobados, 0 fallidos o inestables y 12 capturas duplicadas omitidas**. Las **120 capturas** completas no detectaron errores JavaScript/consola, claves visibles ni recortes/desbordamientos.

Se generaron exportaciones JavaScript web/iOS/Android. Esto no produce una IPA/APK ni acredita una prueba física. Siguen pendientes iPhone, Safari real, VoiceOver/TalkBack, teclado, zonas seguras y Dynamic Type. Los avisos conocidos de dependencias de herramientas Expo siguen abiertos y requieren el informe actualizado; no se presentan como resueltos por añadir traducciones.

El cierre técnico se documenta en [I18N_ENTREGA_Y_AUDITORIA.md](I18N_ENTREGA_Y_AUDITORIA.md), con la ejecución final, correcciones, evidencias y limitaciones. La [prueba guiada](I18N_PRUEBA_GUIADA.md) permite registrar la validación física pendiente sin atribuirle resultados del navegador automatizado.
