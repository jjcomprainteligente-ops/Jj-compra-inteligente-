# JJ | Bloque 05.2 · Preparación del motor de comidas variables

**Estado: MOTOR PREPARADO, PROBADO_AUTOMATICAMENTE Y STAGING VERIFICADA · 16/11/2026.** El número variable sigue sin activarse en pantalla. No es cierre de B05 completo ni aceptación del propietario.

Base conservada: `ba69cf45704e6a0260ba0a6de0e973aa31245d35`. Rama: `codex/b05-2-motor-comidas-variables-2026-11-16`.

## Alcance y compatibilidad

El [plan maestro, Bloque 05](fuentes/JJ_PLAN_MAESTRO_CODEX_2026-11-13.md) pide preparar la ampliación a N comidas mediante un subbloque probado. Este trabajo continúa [B05.1](BLOQUE05_DOS_ENTRADAS_Y_PRESUPUESTO.md) sobre la app existente, sin reconstruirla ni activar un rango nuevo en pantalla.

El módulo [mealPlanDraft.ts](../../src/domain/mealPlanDraft.ts) crea, valida y permite editar candidatos efímeros. No lee ni escribe almacenamiento; tampoco calcula precios, gastos, ahorro o presupuestos. El formulario y `PlanningRequest.meals: 5` conservan la capacidad visible de cinco comidas. No cambia el diseño Verde Mercado Premium, el logo oficial, Manrope ni la navegación.

El borrador tiene forma `{ kind: 'draft', servings, meals, filters }`. Usa `meals` en lugar de `recipeIds`: incluso un borrador de cinco comidas resulta incompatible con el validador y la persistencia `menus.v1`. Una conversión futura necesitará una decisión explícita; no existe conversión, truncado a cinco ni migración automática en este subbloque. Las siete claves locales y sus protecciones mantienen su contrato.

## Reglas del motor preparado

- Solo admite IDs del catálogo público activo: 127 recetas, compuestas por 120 V83 y siete anteriores. No incorpora ni expone las 30 referencias retenidas.
- N debe ser un entero positivo, acotado técnicamente por la longitud del catálogo disponible. Esto no establece un rango de producto aprobado. El número solicitado debe caber además entre las recetas que cumplen todos los filtros.
- Mantiene de una a doce personas. La selección es determinista, sin recetas repetidas ni relleno para aparentar que alcanza N.
- Conserva los filtros existentes de tiempo, preferencia culinaria e ingredientes excluidos. Si faltan candidatos, devuelve el número disponible y el solicitado; no relaja filtros ni certifica aptitud para alergias.
- Valida de nuevo los filtros y todas las recetas al editar una comida o producir ingredientes. Una sustitución debe conservar N, corresponder al catálogo y seguir cumpliendo los filtros.
- Exige campos propios y selecciones densas, con IDs válidos y únicos. Devuelve copias de comidas y exclusiones; descarta campos extra como importes o precios.
- Limita la propuesta completa a 2.000 ingredientes medidos, sin truncarla. Reutiliza el escalado entero y los redondeos explícitos existentes. Devuelve sugerencias crudas para una revisión posterior: no fusiona productos ni añade ingredientes a la compra.
- Los cuatro errores nuevos están centralizados en español, inglés, alemán y francés, con los mismos parámetros de traducción.

## Corrección focal del contrato anterior

En [menus.ts](../../src/domain/menus.ts), `validateMealPlan` exige ahora `servings` y `recipeIds` propios y rechaza huecos o posiciones heredadas. El recorrido anterior con `some`/`forEach` podía omitir un hueco y aceptar una selección incompleta. El menú válido sigue requiriendo exactamente cinco recetas distintas; se conservan las cantidades, IDs y el esquema guardado. No se reescriben documentos inválidos al encontrarlos.

## Evidencia local obtenida

| Comprobación | Resultado de esta candidata |
|---|---|
| TypeScript | Correcto |
| Suite unitaria completa | 1.549 pruebas correctas en 31 archivos |
| Pruebas añadidas | 453 del motor y 15 regresiones de validación/persistencia: 468 en total |
| Matriz de N y personas | 381 combinaciones, N de 1 a 127 con 1, 2 y 12 personas, incluidas en las 453 anteriores |
| Límites y conservación | 2.000 ingredientes admitidos y exceso rechazado; borradores de 1, 4, 5, 6, 7 y 127 incompatibles con `menus.v1`; siete claves conservadas |
| Python de catálogo/fotografías | 51 pruebas correctas con el entorno aislado y Pillow 13.0.0 fijado |
| Reproducción del catálogo público | Correcta: 120 recetas fuente, cinco idiomas de origen y cuatro de ejecución |
| Consulta npm | Cero avisos conocidos en la consulta realizada; no es garantía absoluta de seguridad |
| Compatibilidad Expo | Dependencias actualizadas conforme al contrato existente |

La primera ejecución unitaria global registró 1.168 pruebas correctas y dos tiempos límite de 5 segundos en comprobaciones que recorrían toda la matriz N. Se parametrizaron las 381 combinaciones como casos independientes, manteniendo las aserciones y el tiempo límite. La ejecución completa posterior pasó las 1.549 pruebas. El intento anterior se conserva como evidencia, sin contarlo como resultado correcto.

La primera ejecución Python usó el intérprete general y falló en cuatro casos por una versión de Pillow distinta de la aprobada. Se ejecutó después con el entorno aislado existente y Pillow 13.0.0: 51 casos correctos, sin relajar la comprobación del decodificador ni modificar el código de fotografías.

Comandos principales reproducibles:

```sh
npm run typecheck
npm test -- --maxWorkers 2
python3 scripts/import-recipes-v83.py --check
npm audit --json
EXPO_NO_TELEMETRY=1 CI=1 npx expo install --check
```

La suite Python requiere el entorno aislado que cumple `scripts/requirements-photo-audit.txt`. Los resultados anteriores de B05.1 no se atribuyen a esta nueva candidata.

## Entrega comprobada

Fuente publicada: `280a6e63ce3c56015a7f8b92cff8136bbece2a32`, árbol `3af0f123fc2530ab44a428ac8d2c7c4dd9c16252`, [PR #27](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/27). CI de push 43962984173 y PR 43963055777 correctas. El cierre documental posterior conserva los 101 hashes de entradas de aplicación de esta fuente; no modifica el código probado.

Navegador local: **60/60** casos de recorridos/Inicio y **24/24** regresiones de menús anteriores, sin omisiones, fallos ni intermitencias. La primera suite cubre es/en/de/fr en Chromium escritorio y WebKit 375/430; la segunda, Chromium escritorio/móvil. Incluye listas existentes, confirmación, presupuestos, errores de escritura, cancelación, navegación y conservación. Las capturas se guardan como evidencia privada; no hay rediseño ni aprobación visual inferida.

Web, iOS y Android exportados correctamente. Esta vez el web del export conjunto coincide con el web independiente, SHA-256 `e94ac54f48b69527c065c362712b5cb03824356565a2046711260508c4a6f592`. Staging usa el web independiente empaquetado en Brotli; los hashes y tamaños quedan registrados por artefacto. Los HBC no equivalen a binario firmado o instalable, TestFlight ni ejecución nativa.

Staging `dpl_F1YBWLx6NgkjCTkScKRkqmcTF1Ty`, READY y protegida, [origen sin credencial](https://jj-compra-inteligente-axpbj4ech-cmj2hwhc6b-1051.vercel.app). Comprobación HTTPS: cuatro idiomas, 127 recetas y 19 recursos/URLs por hash. El verificador usa Node con proxy/CA heredados y puente de cuerpos decodificados para Chromium; su método no acredita Safari físico. Pruebas publicadas independientes: **16/16** recorridos y **8/8** controles de Inicio, cuatro idiomas y WebKit 375/430, sin omisiones, fallos, intermitencias o reintentos.

Acceso privado temporal por conversación hasta **17/11/2026 21:46:49 UTC**. El token y las respuestas privadas de acceso no se guardan en Git, bundle o informes públicos. Se conservan los despliegues anteriores; main sigue en `d22d66eff03c5d107f5170ee38cd2bc3167865e2` y el alias de producción en `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`.

Conservación comprobada: 98 de los 100 inputs anteriores coinciden; cambian únicamente el validador de menús y los errores centralizados. Se añade un módulo, total 101 inputs vinculados por hash al commit. 49 archivos protegidos, incluidas pantallas, almacenamiento, recetas, logo y dependencias, coinciden con la base. La revisión independiente de código es estática y no sustituye las ejecuciones.

[Preparación local histórica](../../design/meal-plan-draft/reports/local-preparation.json) · [resultados, hashes y límites finales](../../design/meal-plan-draft/reports/verification.json). El primer registro señala lo que estaba pendiente en su momento; el segundo acredita los resultados posteriores. No se trasladan a esta fuente resultados de B05.1.

Las pantallas siguen ofreciendo cinco comidas. Activar N en la interfaz requiere concretar el rango, la presentación sin suposiciones de calendario y la conversión o persistencia apropiada; este módulo no habilita esa fase por sí solo. Las categorías culinarias pendientes tampoco se amplían o etiquetan sin auditoría de su fuente.

## Límites que permanecen abiertos

B05 mantiene la aceptación de los dos recorridos por el propietario y la prueba física en iPhone. Una prueba WebKit o un export iOS no acredita ejecución nativa, TestFlight o aprobación visual. El motor no promete encajar un menú en un importe sin precios actuales verificados.

B04 conserva cero fotografías definitivas aprobadas o publicadas y requiere los originales V38–V83. B03 mantiene las excepciones privadas; B02 físico y la independencia externa de la copia 01.1 continúan separados.

No se añaden dependencias, servicios de pago, autenticación, IA, Supabase, migraciones, feeds ni scraping. No se abre B06 automáticamente, no se fusiona main y no se promueve producción.
