# Piloto iPhone · Auditoría independiente del recorrido y compatibilidad

11/11/2026. Revisión estática de la rama `codex/iphone-prueba-recorrido`, sobre HEAD `1db842dc1d5d7c3efe15ea4e942ac43a95cfdaa0` y cambios de trabajo. Este informe es la única escritura propia; no modifiqué aplicación, pruebas, configuración ni documentación, no ejecuté suites, compilaciones, APIs remotas ni recursos de proveedor. B07 permanece aparcado y abierto; no se reintentó SQL.

## Dictamen de esta pasada

No encontré ampliación de acceso a datos, credenciales incorporadas, debilitamiento del guardado ni cambios de identidad visual en el diff revisado. Las cuatro actualizaciones directas coinciden con las versiones compatibles declaradas por el Expo instalado. Los perfiles EAS son preparación de compilaciones Release, no una aplicación instalada ni un envío a Apple.

La versión inicial de la suite tenía dos huecos P2 y dos precisiones P3. Se comunicaron y se revisó su corrección en el patch posterior: **no quedan hallazgos estáticos abiertos en el recorrido revisado**. También se corrigieron dos errores del oráculo de prueba detectados al ampliar cantidades y exclusiones. Se leyó después la evidencia terminada de `exact-daily-webkit`: **8/8 casos correctos, cero inesperados, intermitentes u omitidos**. La regresión Chromium completa comunicada por el agente principal terminó con 298 pruebas aprobadas y 24 omisiones deliberadas. Estos resultados son acotados a las pruebas realizadas y no equivalen a seguridad absoluta ni a una prueba física de iPhone.

Artefactos finales de código revisados: `purchase-journey.spec.ts`, SHA-256 `ffa4a537d9757614dea62469982fe2f177bac038c4ef699eb8a067ce6d8d7bf8`; `playwright.iphone-pilot.config.ts`, `66cc5cd1dccef86311efa22b45e5e897b6b8ad97cbde09979811cd6e064416a8`; `eas.json`, `a65cd53f36b92e6ff7b875f5a8abd842ebda5b14ca7f2fe026f8e0a5da058248`.

## Hallazgos concretos

| Gravedad original | Evidencia en `tests/iphone-pilot/purchase-journey.spec.ts` inicial | Resolución revisada en el patch posterior |
|---|---|---|
| P2 · integridad del recorrido | Líneas iniciales 223–228 exigían más de un producto y ausencia de precios, pero podían dejar pasar omisiones o cantidades/unidades erróneas. | Líneas actuales 235–263 capturan nombres/cantidades/unidades de controles reales, omiten explícitamente un ingrediente y comparan el multiconjunto exacto con lo guardado. No se usan funciones de escalado/agrupación/transferencia para calcular el resultado esperado. |
| P2 · alcance del recorrido | Líneas iniciales 191–221 preparaban cinco cenas y después importaban todo el plan; abrir/cerrar una receta no acreditaba añadir un plato. | Ahora se abre una receta, pasa de dos a cuatro personas y se usa su acción existente de revisar ingredientes. El menú semanal queda idéntico por comparación de snapshots y tras recarga. «Uso diario» significa uso habitual, sin calendario nuevo ni reescritura. |
| P3 · idiomas | El detector inicial omitía namespaces existentes. | Línea 25 obtiene los prefijos del catálogo completo; líneas 114–118 examinan texto y `aria-label` con esos prefijos. |
| P3 · informe | `sevenDocumentsPreservedOnExpenseAndShare` confundía conservar seis ajenos al gasto con conservar siete al compartir. | Líneas 339–341 separan los dos hechos y declaran el alcance geométrico limitado. |

Durante el patch se detectaron y corrigieron dos errores del propio test: eliminar el separador de miles de Intl confundía el punto decimal de campos editables en es/de; reconstruir índices de opciones desde el orden DOM fallaba al reagrupar un ingrediente excluido. El parser actual, líneas 29–34, acepta punto/coma decimal sin agrupación; la unidad, líneas 247–249, se obtiene por el texto de botones seleccionados, independiente del índice visual.

El detector geométrico omite INPUT/TEXTAREA, y las capturas iniciales no acreditan los editores con teclado abierto. No se debe derivar de él una validación completa de formularios, teclado o Dynamic Type. La suite ya declara correctamente que WebKit Linux con tamaños CSS móviles no equivale a iPhone/Safari físico.

## Ruta existente para reforzar el test sin modificar la aplicación

- `src/app/screens/MenuWorkspace.tsx:314`: dentro de la receta, botón accesible con `t('menus.reviewRecipe')`; no tiene testID propio. La receta dispone de `recipe-servings` y botones `flow.increaseServings/reduceServings`.
- Revisión: filas `ingredient-review-row` (`:342`), nombre `ingredient-name` y botón `edit-ingredient`. Al expandir una fila, su campo de cantidad es el único `input[inputmode='decimal']`; las opciones de unidad usan `aria-pressed`.
- `displayName`, `:84`, traduce los nombres canónicos no editados. Los nombres persistidos siguen siendo canónicos españoles. Comparar la fila visible con `translateIngredientName(item.name,t)` es una adaptación de presentación; no debe confundirse con recalcular el resultado de negocio.
- Leer cantidad/unidad desde los controles revisados y convertir el decimal a milésimas mediante una comprobación independiente. Comparar tuples ordenadas o multiconjuntos, sin localizar únicamente por nombre, para detectar omisiones y duplicados.

## Datos y seguridad del recorrido revisado

La configuración genera contextos vacíos y separados (`storageState` vacío), cuatro idiomas y dos viewports WebKit, de 375×667 y 430×932. El test verifica al llegar a bienvenida que las siete claves son nulas. No usa `addInitScript`, seeding de documentos, mocks de API ni escrituras directas en storage para preparar el negocio: lista, presupuesto, producto, menú y gasto se crean mediante UI.

La única escritura técnica directa del test es una base IndexedDB de diagnóstico con nombre separado y contenido fijo sin datos comerciales; se cierra y elimina. Comprueba Web Locks, WebCrypto y durabilidad estricta y **falla si faltan**, en vez de saltar las mutaciones o relajar el fence. No manipula la base de coordinación de la app.

El recorrido comprueba límites financieros relevantes: marcar el producto manual de 2×1,25 € produce 2,50 € en el subtotal marcado, pero no registra un pago. El gasto de 12,35 € requiere confirmación de pago y una revisión final antes de persistir; se valida su vínculo con la lista y que no cambie compras. Revisa totales en presupuesto, inicio, ahorro e historial, y conserva el estado tras recargar. Esta es una confirmación manual del usuario, no una transacción bancaria o comercial verificada.

La revisión de compartir excluye la nota privada de QA y precios, conserva storage y no envía la copia a un destino. El test exige ausencia de requests HTTP ajenos al origen y de errores de ejecución/consola. El modo sin conexión cubre la app ya cargada; la recarga final ocurre con conexión restaurada. No acredita un arranque frío offline ni una PWA instalada.

Las capturas/trazas contienen datos de QA creados en esos contextos, no datos del propietario. El directorio por defecto `design/iphone-pilot/local-evidence/` está ignorado. Las pruebas no cargan fixtures en la preview normal y los contextos no son el almacén del usuario.

## Compatibilidad y dependencias

Versiones examinadas en `package.json` y contrastadas directamente con `node_modules/expo/bundledNativeModules.json` del Expo 58.0.24 instalado:

| Paquete | Versión del proyecto | Expectativa del SDK instalado |
|---|---|---|
| Expo | `~58.0.24` | instalado `58.0.24` |
| expo-font | `~58.0.12` | `~58.0.12` |
| expo-status-bar | `~58.0.5` | `~58.0.5` |
| react-native-safe-area-context | `~5.11.1` | `~5.11.1` |
| React / React Native | `19.3.0` / `0.88.1` | `19.3.0` / `0.88.1` |

Se mantiene el lockfile v3. En las entradas cambiadas no encontré nuevas fuentes fuera de `registry.npmjs.org` ni incorporación de nuevos install scripts. También cambian transitivas del SDK y herramientas; la compatibilidad de versiones declaradas no sustituye una compilación nativa o prueba de dispositivo.

El informe guardado `npm-audit.json` contiene tres avisos moderados y cero altos/críticos, en la cadena Expo/fingerprint/minimatch. Su sugerencia de «corrección» es Expo 52.0.49, un cambio mayor hacia atrás incompatible con este proyecto; no se aplicó. No presentar los tres avisos como corregidos ni el inventario como una garantía de cero vulnerabilidades.

El diff revisado no modifica `src`, assets, el logotipo, colores, recursos i18n, `app.json`, AsyncStorage ni los fences. Por tanto no hay cambios de diseño o de persistencia introducidos en código. Los posibles cambios de renderizado por dependencias requieren la evidencia de regresión que está ejecutando el agente principal.

## Preparación nativa y documentación

`eas.json` contiene solo `iphone-preview` (distribución interna) e `iphone-testflight` (store), ambos Release, dispositivo físico y sin development client. `requireCommit:true` exige trabajo versionado. No contiene submit/auto-submit, scripts, variables de entorno, credenciales ni creación automática de recursos. El archivo por sí solo no compila, no envía a Apple y no contrata servicios.

Faltan acceso Expo/Apple y hardware iPhone para una prueba nativa. Una futura distribución puede necesitar firma, dispositivos registrados o cuenta Apple Developer; no se debe prometer que esos pasos estén hechos ni que tengan coste cero por existir un perfil. La primera vía disponible para el usuario es la preview web en Safari, pendiente de su prueba real.

Se revisaron `docs/IPHONE_PILOTO_RECORRIDO_DIARIO.md` y los cambios del README actual. La nueva guía dirige la primera prueba a Safari, explica separación de datos entre dominios y detalla los perfiles Release, acceso/firma/dispositivos pendientes e icono cuadrado todavía no aprobado. Aclara la incompatibilidad de Expo Go descrita por la documentación consultada por el ejecutor y no promete que un QR SDK 58 funcione con un cliente SDK 54. No se rebaja el SDK ni se modifica el logo. La actualización de anexos históricos se conserva como documentación y no como prueba nativa ejecutada.

## Evidencia disponible y aceptación pendiente

Leí `unit-results.json`: 963 pruebas aprobadas, cero fallidas u omitidas. Leí el log de exportación terminada en `dist-iphone-pilot`; el agente principal comunica exportaciones web/iOS/Android, TypeScript y regresión Chromium de 298 pruebas correctas con 24 omisiones deliberadas. No ejecuté esas comprobaciones.

Leí `design/iphone-pilot/local-evidence/exact-daily-webkit/results.json`: ocho casos esperados, cero inesperados, intermitentes u omitidos y duración aproximada de 71 segundos. Los ocho informes journey cubren es/en/de/fr × 375/430, receta de cuatro raciones, plan semanal intacto, un ingrediente omitido y cinco tuples revisados guardados exactamente, seis documentos ajenos al gasto y siete al compartir conservados, ausencia de requests externos y cero errores de ejecución. Sus 80 capturas lógicas pasan las comprobaciones geométricas/textuales acotadas. Hay 160 PNG en disco por las copias de adjuntos de Playwright; no se cuentan como 160 escenas distintas. Las ejecuciones interrumpidas anteriores permanecen y no se atribuyen a esta pasada correcta.

La revisión independiente del piloto automatizado queda cerrada para los artefactos anteriores y su evidencia final. La entrega al usuario aún debe identificar el commit de GitHub y verificar la preview concreta antes de compartir su enlace. Mantener explícitamente pendientes Safari/iPhone físico, teclado, VoiceOver, Dynamic Type, zonas seguras reales, compartir mediante el sistema, compilación firmada e instalación. Esta auditoría no valida Auth ni hogares y no cambia el estado abierto de B07.
