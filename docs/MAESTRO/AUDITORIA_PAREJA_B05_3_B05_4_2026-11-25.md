# Auditoría conjunta B05.3/B05.4

**25/11/2026 · Auditoría local de la pareja, sin bloqueos reproducibles encontrados en el alcance examinado.** No certifica ausencia absoluta de errores o vulnerabilidades ni declara terminada toda la app. [B05.3](BLOQUE05_3_SEGURIDAD_Y_REVISION_CULINARIA.md) y [B05.4](BLOQUE05_4_MENUS_VARIABLES.md) conservan su alcance y sus pendientes separados.

## Alcance y procedencia

Se examinaron las instrucciones permanentes, el plan, la auditoría posterior al PR #30, los cambios de B05.4 y los contratos de filtros, menú, almacenamiento, coordinación, revisión de ingredientes e internacionalización. Base conservada: `f4f458ec7de64d0b489f538eafd7b6fa01e7f335`; rama candidata: `codex/b05-4-menus-variables-2026-11-25`. El PR #31 de B05.3 sigue abierto a main al preparar este checkpoint. Esta auditoría no autoriza su fusión ni la de B05.4.

La revisión independiente de seguridad realizó **30 comprobaciones negativas en memoria**: 24 de formatos/prototipos/borradores, cinco de sobres/JSON y una carrera nativa con dos escritores. La carrera produjo una sola escritura: ganó el plan de 14 y el segundo recibió `errors.storageConflict`. Son comprobaciones focales adicionales, no una segunda ejecución de la suite completa. Otra revisión de cierre comprobó el diff, los contratos y los resultados finales guardados; `git diff --check` no encontró errores de formato.

## Resultados por riesgo

| Riesgo | Resultado observado y límite |
|---|---|
| Clasificación dietética heredada por ID | B05.3 fija ingredientes medidos/sin medida, notas, pasos y avisos; cambiar ese contexto invalida la decisión. Se conservan seis vegetarianas y cuatro veganas anteriores; ninguna V3 se clasifica automáticamente. |
| Pérdida al ampliar N | V1 conserva contrato de cinco y serialización; V2 es explícito bajo la misma clave. Lectura sin escrituras, sin migración o truncado implícitos. Versiones desconocidas/corruptas se conservan para exportación. |
| Sustitución involuntaria | Selector separado del plan activo; primeras cantidades distintas de cinco y sustituciones requieren confirmación. Cancelar no escribe. La preparación inicial de cinco conserva su conducta anterior. |
| Conflictos y estados fallidos | Coordinador/fence sin modificaciones; carga fallida impide escritura. Comprobación independiente de carrera y pruebas de staleness correctas. |
| Borradores o filtros dentro del guardado | Validadores rechazan drafts crudos y campos V2 ajenos a `{kind, servings, meals}`. No hay octava clave ni recuperación oculta que evada la firma lógica. |
| Cantidades o compra inventadas | Escalado entero existente, IDs únicos y máximo 2.000 ingredientes. Notas e ingredientes sin medida visibles fuera de las filas comprables. Incorporación solo tras revisión; sin precios oficiales nuevos. |
| Mezcla de recorrido y plan durable | Presupuesto transmite N al editar; plan del recorrido permanece en memoria y conserva el plan guardado. Nueva matriz verifica 14/12 → 1/1 y arroz de 80 g con un oráculo independiente. |
| Idiomas y presentación | Cuatro catálogos centralizados, mismos parámetros y geometría comprobada en Chromium y WebKit 375/430. Se conservan EUR, logo y Manrope; la aceptación visual y física sigue pendiente. |

## Conservación verificada

La revisión independiente cotejó el baseline de **2.035 archivos**, sin ausentes. Encontró únicamente los cambios previstos del bloque en el momento de su lectura. Se conservaron por hash **304 referencias, 301 assets, cinco módulos de datos y los 17 archivos del expediente editorial B05.3**. Se comprobaron directamente los **150 JPEG fuente y los 300 derivados**, sin pérdida, cambios de IDs ni duplicados de recetas. Estas cifras se superponen: no se suman para inventar un total de archivos o fotos.

El catálogo mantiene 157 IDs únicos: 150 V3 más siete anteriores. El expediente sigue con 150 recetas, 15 lotes y **300 decisiones pendientes**. Se conservan los siete documentos de negocio y los módulos de privacidad, coordinación/fence y revisión dietética de la base. La cifra histórica de 603 inputs preservados corresponde a un agregado técnico de otra entrega; no significa 603 recetas ni fotografías.

## Pruebas de la fuente final y trazabilidad

- **1.853 unitarias y 155 Python correctas**; TypeScript, reproducciones V83/V3/editorial y exportaciones correctos.
- **36 casos nuevos y 24 regresiones de navegador correctos** sobre el web final: cero fallos, omisiones o intermitencias en esas ejecuciones. Cuatro idiomas, Chromium y WebKit 375/430; capturas privadas de los estados afectados.
- Consulta de dependencias del 25/11 sin avisos conocidos y Expo compatible; no equivale a garantizar que no existan vulnerabilidades desconocidas.
- Web independiente final: SHA-256 **`003344d3262d81539bf20f93f712f050e449994cd2f22bc39ba173038f78f6d3`**, 5.655.196 bytes. Los 411 inputs de app se fijan por hash. El web del export conjunto es distinto y no hereda estas pruebas por suponer igualdad.

Los fallos iniciales siguen registrados: una prueba unitaria de límites UTF-8/JSON falló durante concurrencia de tareas y luego pasó focalmente y en dos ejecuciones completas sin modificar sus aserciones o límites; no se atribuye una causa exacta sin evidencia. La primera captura de la matriz nueva encontró dos diálogos y se corrigió exclusivamente el selector. La ejecución de 36 anterior a la última corrección de texto se conserva como antecedente; los **36 + 24 indicados arriba sí corresponden al compilado final**.

## Límites y cierre de la pareja

Esta auditoría local cubre la corrección técnica de B05.3 y la implementación compatible de B05.4. **B05.3 editorial sigue abierto** hasta recibir decisiones respaldadas de ChatGPT/producto. El rango de 1–14 comidas y 1–12 personas es la propuesta inicial de preview, pendiente de aceptación explícita del rango y de revisión visual. No se activan categorías o dietas por inferencia para cubrir esa dependencia.

En este checkpoint quedan pendientes el escaneo del snapshot público final, los commits/PR y CI propios de B05.4, la publicación protegida por el commit de fuente y las pruebas HTTPS del recorrido nuevo. Sus resultados se añadirán al cierre; los de B05.3 o una preview anterior no se presentan como prueba de B05.4. El escaneo tendrá su alcance y clasificación propios, sin publicar secretos ni enlaces de acceso protegido en Git.

No se consultó Supabase ni se certificaron políticas actuales a partir de snapshots históricos. No hubo nuevos servicios, credenciales, dependencias, precios, IA o cuentas. Las exportaciones HBC y WebKit de escritorio no son un binario firmado ni Safari físico. Continúan pendientes dispositivos, VoiceOver/TalkBack, distribución nativa, aceptación del propietario y los demás bloques del plan. La finalización de esta pareja no abre B06 ni autoriza fusión en main o promoción a producción.


## Publicación y cierre comprobados · 25/11/2026

**Cierre verificado · 25/11/2026:** código en [PR #32](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/32), fuente `97d31680a8c135e415d0ab91c98a722edb5481ae`, árbol `004ea32ff4f41fb5db0abbcc24b8f16bca86ce38`. CI de fuente [push 45718435874](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/45718435874) y [PR 45718485285](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/45718485285) correctas. Staging propia `dpl_ETiXZZPa4wayg47aKF3XajzpVS7V`, READY/protegida y vinculada a esa fuente: HTTPS **cuatro idiomas/319 recursos** y **24 casos nuevos WebKit 375/430** correctos, sin fallos, omisiones o intermitencias. El web independiente publicado conserva SHA-256 `003344d3262d81539bf20f93f712f050e449994cd2f22bc39ba173038f78f6d3`. La recuperación verifica 411 inputs, 2.045 archivos del snapshot y 313 archivos del paquete, sin diferencias.

Gitleaks oficial 8.30.1 examinó los 2.045 archivos del commit de fuente,264.190.456 bytes. Conserva salida 1 por 17 alertas, todas falsos positivos de identificadores locales de almacenamiento, 0 secretos confirmados y 0 sin clasificar. Reglas predeterminadas, sin nuevas excepciones; no cubre historial, ignorados/credenciales de ejecución ni interiores de comprimidos. El control no garantiza ausencia absoluta de vulnerabilidades.

El [origen de prueba](https://jj-compra-inteligente-dcz5mwz4c-cmj2hwhc6b-1051.vercel.app) sigue protegido. Acceso temporal por conversación hasta **26/11/2026 22:27:14 UTC**; no se guarda la credencial en Git. La revisión automática rechazó inicialmente el upload del bundle por insuficiente claridad del permiso concreto; se comprobaron autorización permanente, destino protegido y procedencia exacta antes de repetir la misma subida, que fue aceptada. La interrupción del entorno no perdió archivos ni creó otro despliegue. Producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`, main `daa3f09` y protección `all_except_custom_domains` se conservan. El cierre posterior solo cambia documentación y mantiene el código/artefacto probado, sin otro despliegue por textos.

El rango 1–14 se presenta como propuesta inicial de preview, pendiente de aceptación visual y de producto; personas 1–12 conserva el límite anterior. Las300 decisiones editoriales V3 siguen pendientes. WebKit/Linux y HBC no sustituyen un iPhone físico ni una app firmada. B06 no se abre automáticamente. Los checkpoints locales anteriores conservan sus pendientes históricos; quedan superados para la publicación por este cierre y su evidencia final.

[Evidencia final](../../design/variable-meals/reports/verification.json).

La confirmación de esta entrega se refiere a crear una primera propuesta de cantidad distinta de cinco o a regenerar el plan completo. La sustitución de un plato individual conserva la selección explícita directa anterior.
