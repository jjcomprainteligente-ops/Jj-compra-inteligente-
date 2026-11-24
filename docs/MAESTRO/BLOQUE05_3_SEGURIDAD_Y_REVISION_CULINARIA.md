# B05.3 | Seguridad de filtros y preparación de revisión culinaria

**24/11/2026 · Corrección y paquete editorial publicados, CI correcta y staging protegida verificada; revisión culinaria de las 150 pendiente.** Esta entrega continúa la aplicación existente después del PR #30. No declara terminadas las categorías ni las preferencias dietéticas V3. Fuente de partida: `daa3f09a02f16c72a700b1a3d3d54888a67e2179`; rama `codex/b05-3-revision-culinaria-2026-11-21`.

## Resultado real y límites de fuente

Se comprobó el ZIP V3 fijado de 1.994.471 bytes, SHA-256 `e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270`. El catálogo editorial no contiene una aprobación estructurada vegana/vegetariana por receta. El original V83 conserva categoría en 50 registros: todos dicen `principal`, incluso postres como `JJ-E03-012`, mientras las otras 100 carecen de ese campo. Los códigos BRK/DES, el nombre del plato y la ausencia de un alérgeno no sustituyen una revisión culinaria.

Por ello no se activan nuevas categorías ni etiquetas dietéticas. Las 150 recetas siguen disponibles con el filtro general y sus fotos, más las siete anteriores: **157 IDs únicos**. La selección dietética anterior conserva seis recetas vegetarianas, incluidas cuatro veganas; ninguna V3 se clasifica automáticamente. El panel ya explica esa limitación en es/en/de/fr y conserva su diseño.

## Corrección de conservación de la revisión

La firma anterior solo fijaba ingredientes medidos. Reutilizar un ID conocido y agregar un ingrediente sin cantidad podía conservar su etiqueta dietética anterior. Ahora la revisión estática incluye secciones diferenciadas para:

- Ingredientes medidos, cantidades, unidades, categorías y notas.
- Ingredientes sin medida y sus notas.
- Condiciones editoriales y acompañamientos opcionales.
- Pasos de preparación y aviso de alérgenos.

Cambiar cualquiera de esas secciones invalida la decisión antigua; el ID no basta. Los siete registros de revisión se conservan en un [módulo estático](../../src/data/legacyDietaryReviews.ts), con la misma clasificación y fuente identificada. No se regeneran desde el catálogo durante la ejecución ni se convierten en aprobación de nuevas recetas.

El [filtro](../../src/domain/menuFilters.ts) valida notas, pasos y avisos con límites explícitos y rechaza controles peligrosos o estructuras malformadas. Mantiene los saltos de línea legítimos de las advertencias. Las recetas, cantidades, traducciones y avisos originales permanecen intactos; la clasificación no certifica alérgenos, productos o trazas.

## Paquete para ChatGPT/producto

El [paquete de revisión](../../referencias/revision-culinaria/B05_3/README.md) contiene **15 lotes de diez y una plantilla de 150 IDs**. Sus 300 decisiones independientes de categoría y dieta están `pending` con valores nulos. Cada receta fija SHA de origen y huella del contexto español íntegro: ingredientes medidos/sin medida/optativos, acompañamientos, pasos, notas, advertencias y condiciones comerciales. Los cinco idiomas permanecen en la fuente recibida.

ChatGPT/producto puede revisar cada lote y editar exclusivamente las dos decisiones, con responsable y fundamento. Las ambigüedades continúan pendientes. Codex verificará las respuestas antes de una integración posterior: ninguna respuesta activa filtros por sí sola. No hay que renumerar recetas, cambiar cantidades o volver a aprobar la publicación ya autorizada.

El [generador y validador](../../scripts/prepare-culinary-review.py) usa solo Python estándar y el motor de recepción fijado existente. `--check` reproduce la entrega sin escribir; `--write` exige una carpeta nueva y publica exclusivamente por archivo. No es un lote atómico: una preparación interrumpida queda incompleta y no supera el control. `--validate-response` verifica estructura, identidad, contexto y huellas, con tamaño acotado, JSON estricto y rechazo de enlaces/archivos no regulares. No certifica el juicio editorial ni modifica la app. La CI incorpora la reproducción del paquete.

## Comprobaciones locales

| Comprobación | Resultado |
|---|---|
| TypeScript | Correcto. |
| Suite unitaria | **1.708 correctas**, cero fallidas/pendientes; 36 regresiones nuevas frente a la base de 1.672. |
| Python | **155 correctas**, incluidas 20 de preparación/validación editorial. |
| Reproducción V83/V3 | Correcta; catálogo y traducciones anteriores conservados. |
| Reproducción editorial | 17 archivos, 3.078.278 bytes; 150 IDs/15 lotes y 300 decisiones pendientes. |
| Navegador | **24 correctas**, cero fallos, omisiones o intermitencias; Chromium y WebKit 375/430, cuatro idiomas, filtros/propuesta/sustitución/cancelación y siete documentos conservados. |
| Exportaciones | Web, iOS y Android correctas; los HBC no son aplicaciones firmadas. |
| Dependencias | Cero avisos conocidos en la consulta; compatibilidad Expo correcta y lockfile intacto. |
| Revisión independiente | 31 comprobaciones de runtime en memoria y 20 negativos focales del validador; no se suman como otra suite completa. |

Los dos arranques iniciales del navegador se conservan: el primero no seleccionó casos por un anclaje de configuración; el segundo falló en la preparación porque los casos españoles existentes requerían una bienvenida ya completada (un fallo, 23 sin ejecutar). Se corrigió solo la configuración, manteniendo aserciones y límites. La tercera ejecución pasó los 24 casos; no se cuentan los intentos anteriores como éxitos.

El caso de idiomas utiliza ahora la URL del proyecto de pruebas, conservando su valor anterior como respaldo. Las capturas y fixtures se guardan de forma privada; no contienen datos del propietario. Ningún componente visual, logo, Manrope o traducción cambia. El estado visual de la entrega es el mismo y continúa sujeto a aceptación del propietario.

[Preparación y artefactos](../../design/culinary-review/reports/local-preparation.json). Las pruebas locales de este informe se ejecutaron el 21/11 y se conservaron por hash tras la interrupción. La recuperación, consulta de dependencias, publicación, CI y verificaciones HTTPS/WebKit se comprobaron el 24/11. La [evidencia final](../../design/culinary-review/reports/verification.json) identifica origen, alcance y límites; los resultados del PR #30 no se atribuyen a esta nueva fuente.

## Publicación y recuperación verificadas · 24/11/2026

Fuente `e3a50e4103cd5003977426583856838391565dac`, árbol `c8e917b71a7b90339c72dc6f8e0062ea902dba60`, [PR #31](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/31). CI de [push 45414553229](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/45414553229) y [PR 45414689681](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/45414689681) correctas. Los 29 archivos de entrega, 408 inputs de app, 2.034 archivos del snapshot de seguridad y cuatro artefactos compilados coinciden con sus huellas conservadas. La revisión independiente de recuperación no encontró pérdida ni cambios concurrentes. Los 603 inputs originales/catálogo/almacenamiento siguen intactos.

Gitleaks oficial 8.30.1 escaneó el snapshot el 21/11, vinculado por sus hashes al commit publicado el 24/11. Conserva salida **1 por 17 alertas**, todas falsos positivos de identificadores locales de persistencia: cero secretos confirmados y cero alertas sin clasificar. No se añadieron excepciones; no cubre historial, privados ignorados ni interiores de comprimidos. La consulta de dependencias del 24/11 no registra avisos conocidos, sin garantía absoluta de seguridad.

Staging `dpl_FdKAbUQtqPP6mhaKRk4jADGbLyDe`, READY, target `staging`, fuente `e3a50e4`. HTTPS: **cuatro idiomas y 319 recursos/URLs por hash**. WebKit 375/430 publicado: **16 recorridos y ocho controles de Inicio**, sin fallos, omisiones o intermitencias. El JavaScript web probado y publicado conserva SHA-256 `dfeb9fdb25cdeb1f31f37056686d28ad05a8120211477903f222590a0cc2a613`; el transporte Brotli no altera sus bytes. Los assets, logo y fuentes se conservan. La verificación HTTPS utiliza Node con proxy/CA heredados y un puente de cuerpos decodificados para Chromium; no relaja TLS ni certifica Safari físico.

El [origen de prueba](https://jj-compra-inteligente-rnum6hs4r-cmj2hwhc6b-1051.vercel.app) sigue protegido. Acceso temporal entregado por conversación hasta **25/11/2026 13:33:47 UTC**, sin credencial en Git o informes públicos. La protección sigue `all_except_custom_domains`, main conserva `daa3f09` y producción `dpl_8V7A8qAdyCukCV7ug5pYYUqo4mF3`; esta entrega no los modifica. El cierre documental posterior conserva el mismo código y artefacto comprobados; no necesita otra compilación o despliegue por documentación.

## Próxima acción

Completar la revisión editorial por lotes con ChatGPT/producto y devolver respuestas con IDs/contextos intactos. Las categorías y preferencias V3 siguen abiertas hasta disponer de decisiones respaldadas. B05.4 requiere concretar el rango y la presentación de comidas variables y su persistencia compatible; no se activa N ni se modifica `menus.v1` en este bloque. La auditoría conjunta se mantiene después de la pareja B05.3/B05.4.

Se conservan las siete claves, las 120 proyecciones V83, las siete recetas anteriores, las 150 fotos y sus originales/derivados. No hay migraciones, dependencias, servicios, precios, IA, Supabase, cuentas, fusión en main o promoción de producción nuevos. La autorización de las 150 recetas/fotos y del PR #30 sigue ejecutada; no se reabre por esta entrega.
