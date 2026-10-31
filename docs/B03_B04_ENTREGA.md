# B03 y B04 | Aplicación navegable, listas y presupuesto

**Estado: EN REVISIÓN — implementación integrada y verificada en web el 30-10-2026 UTC.** La aceptación nativa de B03/B04 sigue pendiente; no se ha distribuido una aplicación instalable.

## Autorización y resultado previsto

El propietario aprobó B02 con «Me gusta puedes seguir» y autorizó montar B03 y B04 de forma consecutiva. Su petición de continuar prevalece sobre la pausa ordinaria entre esos dos bloques. B05 y posteriores siguen fuera de esta autorización.

Se integra la dirección V3 Verde Mercado y M3 provisional en la aplicación existente. El logo definitivo permanece pospuesto por decisión del propietario. B03 permite recorrer Inicio, Mi compra, Ahorro, Menús y Perfil con una interfaz consistente; B04 convierte la lista y su presupuesto en datos locales editables y persistentes.

## Organización de la implementación

| Área | Ubicación | Responsabilidad |
|---|---|---|
| Entrada de la nueva experiencia | `src/app/ShoppingApp.tsx` e `index.ts` | Entrada activa, navegación, formularios y estados de carga/error. |
| Presentación | `src/app/components/`, `src/app/screens/`, `src/app/theme.ts` | Componentes y arte aprobados, con controles accesibles y estados explícitos. |
| Coordinación del guardado | `src/app/useShopping.ts` | Cargar antes de editar, serializar escrituras y confirmar cambios después de guardar. |
| Reglas de lista | `src/domain/shopping.ts` | Cantidades, unidades, duplicados, precios y resúmenes independientes de la interfaz. |
| Persistencia | `src/storage/shopping.ts` | Validación del documento local versionado, lectura y escritura con errores recuperables. |
| Comparador previo | `App.tsx`, `src/domain/comparisons.ts`, `src/storage/comparisons.ts` | Mantener disponible el trabajo anterior y sus datos. No completa B06. |
| Pruebas | `tests/shopping.test.ts`, `tests/shopping-storage.test.ts`, `tests/e2e/shopping.spec.ts` | Casos de cálculo, datos inválidos, persistencia y recorridos de uso; 127 pruebas de dominio/almacenamiento y 20 recorridos web correctos. |

La copia previa a los cambios se conserva en `archives/B00-B02-source-before-B03-B04.zip`. Los prototipos y evidencias B01/B02 permanecen en sus directorios. No se inicializa un repositorio Git sustituto ni se atribuyen commits o PRs inexistentes.

## Comportamiento de B04

- Varias listas locales con creación, selección, cambio de nombre y eliminación confirmada.
- Productos con nombre, cantidad, unidad (`ud`, `g`, `kg`, `ml`, `L`), categoría, nota, estado comprado y precio unitario opcional.
- Cantidades expresadas en milésimas e importes en céntimos enteros; total por producto redondeado al céntimo después de multiplicar.
- Aviso ante nombres equivalentes en una misma unidad. El usuario decide editar el existente, añadir por separado o cancelar; no hay fusión silenciosa.
- Eliminación confirmada y posibilidad de deshacer la última eliminación o marcado cuando proceda. Un cambio posterior guardado sustituye la acción disponible para deshacer.
- Si falla una escritura, se conservan los datos anteriores y el formulario permite reintentar. Una carga corrupta o incompatible no se reemplaza automáticamente con una lista vacía.

### Significado de los importes

| Concepto | Cálculo o uso |
|---|---|
| Presupuesto | Límite elegido para esa lista; no constituye gasto. Puede quedar sin definir. |
| Precios introducidos | Suma de productos con precio unitario introducido por la persona, multiplicado por su cantidad. |
| Estimaciones | Suma separada de productos cuyo precio se ha señalado como estimado. |
| Previsión conocida | Precios introducidos más estimaciones de la lista completa; es parcial si faltan precios. |
| Gasto registrado | Solo productos marcados como comprados con precio introducido. Se informa si hay productos marcados sin ese dato. |
| Sin precio | Se cuenta como información pendiente. No se presenta como coste cero ni como precio verificado. |

Los precios son aportados por la persona; no se verifica automáticamente su correspondencia con una tienda. Un precio cero introducido explícitamente es válido y se distingue de dejar el campo vacío.

## Datos, límites y seguridad

Las compras usan la clave independiente `jjcompraintelwgiemt.shopping.v1`. Las comparaciones conservan `jjcompraintelwgiemt.comparisons.v1`. No se solicita cuenta, supermercado, credenciales ni clave de API. Los nombres y notas deben representarse como texto, sin interpretar HTML. La validación comprueba versiones, identificadores, unidades, cantidades, coherencia del precio y sumas seguras antes de guardar.

Los datos se guardan en este dispositivo o perfil de navegador. No existe copia en servidor ni sincronización; borrar los datos de la aplicación o desinstalarla puede eliminarlos. AsyncStorage no se presenta como almacenamiento cifrado ni como mecanismo de custodia de secretos.

Menús continúa como **vista previa explícita**. No hay generación de recetas por IA ni incorporación automática de ingredientes. Tampoco hay voz, hogares compartidos, fuentes comerciales, precios en tiempo real, pagos o acuerdos con tiendas. Las búsquedas con ChatGPT se mantienen fuera de la app.

### Auditoría de dependencias y corrección pendiente

La ejecución de `npm audit --omit=dev` registra **8 paquetes con avisos: 3 de severidad alta, 5 baja y 0 crítica**. El informe completo se conserva en [`design/b03-b04/evidence/npm-audit.json`](../design/b03-b04/evidence/npm-audit.json). Parte del recuento corresponde a avisos propagados a paquetes dependientes; las dos dependencias de origen identificadas son:

| Dependencia instalada | Ruta y uso identificados | Aviso |
|---|---|---|
| `deepmerge` 4.3.1 | `@expo/config` 58.0.9, fusión de configuración local durante el trabajo de Expo. | [Contaminación de prototipos al fusionar objetos](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), severidad baja en el informe. |
| `zod` 3.25.76 | Expo CLI 58.1.17, herramientas DevTools/MCP. | [Consumo excesivo de memoria al validar colecciones grandes](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), severidad alta. |

Aunque aparecen en la auditoría con `--omit=dev`, las rutas identificadas pertenecen a las herramientas de desarrollo y generación de la aplicación. La revisión no encontró importaciones de estas dependencias desde `App.tsx`, `index.ts` o `src/`, ni sus marcadores en el paquete web inspeccionado. No se ha identificado una ruta desde los datos que introduce el usuario de la app hacia esas dependencias. Esta inspección delimita la exposición observada; no elimina los avisos ni constituye una garantía de ausencia de vulnerabilidades.

**Pendiente antes de distribuir:** actualizar las herramientas/dependencias mediante versiones compatibles y repetir la auditoría y las pruebas. No se ejecutó `npm audit fix --force`: la solución propuesta en el informe rebajaría Expo 58 a 51.0.39, incompatible con la base React Native 0.88 de este proyecto. Los avisos permanecen abiertos hasta disponer de una corrección compatible verificada; no se declara la auditoría limpia.

## Verificación final — 30-10-2026 UTC

Los resultados siguientes corresponden a la integración final, después de alinear Inicio con B02 y fijar «Añadir producto» sobre la navegación. [Galería de capturas](../design/b03-b04/review.html).

| Comprobación | Resultado y evidencia |
|---|---|
| TypeScript y pruebas | `npm --cache=/tmp/jj-npm run check`: correcto, 127 pruebas en 4 archivos. [Vitest JSON](../design/b03-b04/evidence/vitest-results.json). |
| Navegador | 20/20 recorridos correctos, 0 fallos/omitidos/inestables; escritorio 1280×1000 y móvil 390×844. [Playwright JSON](../design/b03-b04/evidence/playwright-results.json). |
| Persistencia y errores | 12 productos sobreviven recarga; cantidades, precios, duplicados, varias listas, renombrar, borrar/deshacer, borrador al cerrar, almacenamiento lleno, JSON corrupto y versión incompatible comprobados. Comparador previo también probado. |
| Sin conexión | Escritura local con la app ya cargada; recarga después de reconectar. No implica PWA ni recarga web sin red. |
| Exportación | Web y paquetes Hermes de iOS/Android generados sin errores con `expo export --platform all --max-workers 2`. [Archivos y hashes](../design/b03-b04/evidence/export-build.json). No son IPA/APK. |
| Capturas | 50 capturas Chromium: 16 estados en 375×667, 390×844 y 430×932 CSS px, escala 2; dos vistas adicionales con texto web al 130 %. 0 errores JavaScript, sin desbordamiento horizontal detectado ni texto visible fuera del ancho. [Informe](../design/b03-b04/evidence/report.json). |
| Contraste | 14 pares de texto/fondo comprobados por luminancia WCAG, todos ≥4,5:1. [Contraste](../design/b03-b04/evidence/contrast.json). No sustituye revisión de lector de pantalla. |
| Secretos en código | Escaneo limitado de 18 archivos de aplicación: sin coincidencias de formatos de claves comunes. [Método y límites](../design/b03-b04/evidence/source-security.json). No es certificación de seguridad. |
| Dependencias | 8 paquetes con avisos (3 altos, 5 bajos, 0 críticos), procedentes de dos dependencias raíz en herramientas Expo; corrección compatible pendiente antes de distribuir. [Auditoría](../design/b03-b04/evidence/npm-audit.json). |
| Conservación | De los 85 archivos de la copia previa, 75 idénticos, 10 modificados y ninguno eliminado. `App.tsx`, dependencias y fuentes B01/B02 intactos. [Detalle](../design/b03-b04/evidence/preservation.json). |

La consulta al registro confirmó `deepmerge` 4.3.1 como última versión, Expo 58.0.21 como última de `~58.0.21` y CLI 58.1.17 con Zod `^3.25.76` como última de `^58.1.17`. No se identificó una revisión corregida compatible en esas consultas; no se cambiaron dependencias. [Registro](../design/b03-b04/evidence/dependency-review.json).

### Cambios revisables

Archivos anteriores modificados: `index.ts` (nueva entrada); `app.json` (nombre público y colores, identificadores conservados); `src/screens.tsx` (evitar que el formulario antiguo se comprima y tape Guardar en móvil); `src/domain/comparisons.ts` y `src/storage/comparisons.ts` (usar la misma URL HTTP/HTTPS normalizada que se valida, sin migración automática); sus pruebas; `README.md` y los dos registros de estado/decisiones. Los archivos nuevos separan presentación (`src/app/`), dominio, almacenamiento y pruebas de compra. No se creó ni borró historial Git.

### Reproducir

```sh
npm install
npm run check
npm run build:web
npx playwright install chromium
node scripts/verify-web.cjs --all
```

El puerto 8081 debe estar libre. Se puede usar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` con Chromium del sistema. Para obtener también los paquetes nativos: `npx expo export --platform all --max-workers 2`. Para probar en teléfono, `npm start` y una versión de Expo Go compatible con SDK 58 o una compilación de desarrollo compatible; seguir los pasos de [README](../README.md). Los ejemplos se cargan únicamente en los contextos del capturador/pruebas; la app normal empieza vacía.

No hay simulador iOS disponible en este entorno Linux. Quedan pendientes las capturas nativas de iPhone y las pruebas en dispositivo de teclado, VoiceOver/TalkBack, Dynamic Type, gestos, zonas seguras y uso con una mano. Las capturas Chromium a tamaños de iPhone y la simulación de texto grande deberán identificarse como evidencia web, sin convertirlas en validación de iOS.

## Cierre y siguiente paso

La implementación queda entregada para revisión visual y funcional. Mantener abiertos los criterios de iPhone y los avisos de dependencias hasta contar con evidencia nativa y una corrección compatible; no se marca B03/B04 como aprobado ni apto para distribución. El siguiente bloque de producto es B05, pero requiere una nueva autorización; esta entrega no lo inicia.
