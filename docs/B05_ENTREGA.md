# B05 — Menús, recetas y revisión de ingredientes

**Estado: B05 determinista EN REVISIÓN, preparado para la prueba con el propietario.** El propietario autorizó B05 y pidió hacer la prueba después. Esta autorización permite avanzar sin convertir las comprobaciones web de B03/B04 en una validación nativa.

## Alcance implementado

Plan local de cinco cenas para 1–12 personas, con siete recetas del catálogo, sustitución de platos, ingredientes escalados y pasos. El número de personas y los identificadores de recetas se guardan en una clave independiente; las cantidades se calculan con enteros. Las unidades enteras que necesiten redondeo se avisan en la receta y la revisión.

«Esto he entendido» permite revisar todo el menú, una receta o ingredientes pegados desde ChatGPT: nombre, cantidad, unidad, categoría, nota y selección. El destino se muestra expresamente; una lista nueva solo se crea al confirmar. La confirmación añade el grupo en una única escritura y permite deshacerlo. Cancelar no modifica compras ni presupuestos.

Los duplicados se comparan por nombre normalizado y dimensión compatible (`g`/`kg`, `ml`/`L`, unidades independientes). Se puede conservar el existente, añadir por separado o sumar cuando hay un único producto sin precio y sin marcar. La suma preserva la unidad y la precisión del existente; no se modifica ni se propaga su precio. Los demás casos requieren conservar o separar. El presupuesto se conserva.

El texto admite hasta 6000 caracteres y 50 ingredientes, uno por línea o separados por punto y coma. Se reconocen medidas explícitas, algunos números en palabras y fracciones comunes. Una cantidad ausente se propone como 1 ud con aviso para revisar. Rangos, «al gusto», medidas desconocidas, enlaces, HTML y precios requieren corrección; no hay importación parcial si una línea da problemas. No es un intérprete de lenguaje libre ni verifica datos comerciales.

## IA, voz y privacidad

Las búsquedas con ChatGPT siguen fuera de la app. Este bloque entrega primero el menú determinista, tal como pide B05. No conecta un modelo ni un backend, no solicita claves, no realiza llamadas de IA y no tiene coste por llamada que monitorizar. La parte IA sigue condicionada a una decisión específica sobre arquitectura, coste y privacidad. No se solicita micrófono; la entrada alternativa es texto.

Solo se persiste `{servings, recipeIds}` del menú en `jjcompraintelwgiemt.menus.v1`. No se guarda el texto pegado como historial ni se almacenan gustos de salud. Los ingredientes que se confirmen pasan a la lista local como productos sin precio y sin marcar. Una carga corrupta del menú impide sobrescribirlo y permite seguir usando Mi compra. Un fallo de escritura conserva el estado anterior y la propuesta revisable.

## Organización

| Área | Archivos |
|---|---|
| Catálogo y reglas | `src/data/recipes.ts`, `src/domain/menus.ts` |
| Interpretación local y transferencia | `src/domain/ingredientImport.ts` |
| Guardado del menú | `src/storage/menus.ts`, `src/app/useMealPlan.ts` |
| Interfaz | `src/app/screens/MenuWorkspace.tsx`, integración localizada en `ShoppingApp.tsx` |
| Pruebas | `tests/menus.test.ts`, `tests/ingredient-import.test.ts`, `tests/menus-storage.test.ts`, `tests/e2e/menus.spec.ts` |
| Evidencia | `scripts/verify-b05.cjs`, `scripts/capture-b05.cjs`, `design/b05/` |

La copia de fuentes anterior se conserva en `archives/B00-B04-source-before-B05.zip`. Los entregables y evidencias B00–B04 no se reemplazan. No se añadieron dependencias ni se alteraron las claves de compra/comparaciones. Git sigue sin estar operativo; no hay commit o PR que enlazar.

## Comprobaciones

| Comprobación | Resultado verificable |
|---|---|
| TypeScript y pruebas | `npm --cache=/tmp/jj-npm run check`: correcto. **228 pruebas** en 7 archivos. [Vitest](../design/b05/evidence/vitest-results.json). |
| Recorridos web completos | **36/36 correctos**, 0 fallos, omitidos o inestables, en escritorio 1280×1000 y móvil 390×844. Incluyen los 20 recorridos anteriores y 16 ejecuciones B05. [Playwright](../design/b05/evidence/playwright-results.json). |
| Flujo B05 | Preparar/editar/persistir menú sin red con app cargada; revisar/cancelar/confirmar; omitir ingredientes; duplicados g/kg; productos anteriores con precio/marcado conservados; deshacer grupo; lista nueva solo al confirmar. |
| Errores | Texto ambiguo impide importar parcialmente. Fallos de escritura de menú/compra conservan estado/propuesta y permiten reintentar. Menú corrupto permanece intacto y Mi compra sigue operativa. No se guardó texto como historial. |
| Capturas | **38 capturas**: 12 estados × 3 tamaños (375×667, 390×844, 430×932 CSS px, escala 2) y 2 vistas de texto simulado al 130 %. 0 errores JavaScript/desbordamientos detectados; ningún contexto de revisión alteró las compras de muestra. [Galería](../design/b05/review.html) · [Informe](../design/b05/evidence/report.json). |
| Exportación | Web y paquetes Hermes iOS/Android generados sin error. No son IPA/APK ni prueba nativa. [Archivos y hashes](../design/b05/evidence/export-build.json). |
| Contraste | 11 pares de texto/fondo ≥4,5:1. [Método](../design/b05/evidence/contrast.json). |
| Seguridad | Escaneo limitado de 24 archivos de aplicación sin coincidencias de formatos habituales de claves. No equivale a auditoría integral. [Escaneo](../design/b05/evidence/source-security.json). Dependencias sin cambios; avisos previos abiertos. [Referencia](../design/b05/evidence/dependency-baseline.json). |
| Conservación | Copia previa y lista de cambios; ningún archivo previo eliminado. App.tsx, almacenamiento anterior y dependencias intactos. [Comparación](../design/b05/evidence/preservation.json). |

Para reproducir:

```sh
npm run check
npm run build:web
npx playwright install chromium
node scripts/verify-b05.cjs --all
```

El puerto 8081 debe estar libre. Se admite `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` con Chromium del sistema. El capturador usa exclusivamente contextos de prueba con datos ficticios; no precarga datos en la aplicación. Para repetir paquetes nativos: `npx expo export --platform all --max-workers 2`.

### Aceptación de la parte determinista

- Cancelación y ausencia de cambios silenciosos: verificadas en web.
- Unidades, raciones y repetidos: verificados con pruebas de límites, conversiones y recorridos.
- Ausencia de IA: la compra y los menús funcionan sin servicio externo. No existe un endpoint IA al que inyectar un fallo.
- Coste por llamada: no aplica a esta entrega, que realiza cero llamadas de IA. Medición y límites serían obligatorios antes de conectar un servicio aprobado.
- Validación nativa y prueba del propietario: pendientes; este estado no implica aprobación final.

## Prueba con el propietario

[Recorrido guiado de ocho minutos](B05_PRUEBA_GUIADA.md). Para abrir el proyecto: `npm install`, `npm start`, Expo Go compatible con SDK 58 o compilación de desarrollo compatible. La prueba física de iPhone sigue pendiente, incluidos teclado, VoiceOver, Dynamic Type, gestos y zonas seguras. Web y paquetes Hermes no son una validación nativa ni una IPA/APK.

Los ocho avisos de paquetes de herramientas Expo documentados en B03/B04 (tres altos y cinco bajos, dos dependencias raíz) siguen abiertos. Este bloque no cambia las dependencias y no afirma resolverlos. Se necesita una corrección compatible y verificación antes de distribución; no se fuerza una rebaja de Expo.

No se inicia B06, cuentas, hogares ni comercio. El logo continúa como M3 provisional sobre Verde Mercado.
