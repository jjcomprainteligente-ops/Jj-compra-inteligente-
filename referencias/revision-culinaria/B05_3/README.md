# B05.3 | Revisión culinaria pendiente por ID

Esta entrega prepara el trabajo editorial de ChatGPT/producto. Codex genera y
comprueba el paquete; **no clasifica las 150 recetas**. No cambia la aplicación,
las recetas, cantidades, fotos, avisos ni documentos guardados.

## Archivos

- `plantilla_150.json`: 150 IDs y sus dos decisiones independientes, todas
  `pending`, con `value`, `reviewer` y `basis` a `null`. No duplica el contexto.
- `lotes/`: 15 lotes de diez, en orden del catálogo. Cada registro conserva el
  contexto español completo recibido: ingredientes medidos/sin medida/optativos,
  acompañamientos, notas, tiempos desconocidos, pasos, advertencias y contexto
  comercial/alérgenos. Los cinco idiomas permanecen en el ZIP original fijado.
- Cada registro fija `sourceV83SHA256` y `contextSHA256`; la fuente y su ZIP están
  identificados en `source`. No modificar esos campos ni el contexto al revisar.

Las primeras 50 fichas históricas llevan `category: principal`, incluso recetas
descritas como postre en sus propios pasos; las otras 100 no tienen categoría.
Ese dato se conserva en `historicalMetadata`, **sin convertirlo en aprobación**.
No inferir una categoría del código BRK/DES ni una dieta del nombre o alérgenos.
Los permisos de publicación ya recibidos no certifican nuevas clasificaciones.

## Cómo revisar con ChatGPT/producto

Copiar el lote elegido fuera de esta carpeta generada y revisar las diez recetas.
Editar exclusivamente `category` y `dietary`; son decisiones independientes.

Categorías: `breakfast` (desayuno), `main` (plato principal/comida/cena), `dessert`
(postre), `other` (otros usos culinarios). No se deduce calendario ni número de
comidas. Preferencia: `vegan`, `vegetarian` o `any` (revisión realizada, sin ofrecer
las otras dos clasificaciones). Un caso ambiguo permanece `pending` y `null`.

Una decisión revisada usa `status: reviewed`, un valor de su lista, `reviewer`
con el responsable y `basis` con el fundamento y referencias por receta. Leer
ingredientes opcionales, menciones sin medida, acompañamientos, pasos y notas.
No omitir queso/cuajo, caldos, salsas, gelatina u otros ingredientes dependientes
de composición para forzar una etiqueta. No deducir ausencia de alérgenos/trazas.

Una decisión pendiente conserva exactamente los cuatro campos originales.
Puede revisarse categoría sin resolver dieta, o dieta sin resolver categoría.
No cambiar IDs, posiciones, ingredientes, cantidades, tiempos, fuente o huellas.
No añadir afirmaciones de precio, etiquetas comerciales o certificación sanitaria.

## Comprobación y conservación

Desde la raíz del repositorio, con Python estándar:

```sh
python scripts/prepare-culinary-review.py --check
python scripts/prepare-culinary-review.py --validate-response /tmp/jj-revision-lote-01.json
```

`--validate-response` acepta una copia completa de un lote o la plantilla de150.
Comprueba esquema, IDs, integridad del contexto y decisiones; **no certifica el
juicio editorial ni activa datos en la app**. La respuesta debe volver a revisarse
antes de una integración de Codex. No incluir datos personales en los fundamentos.

`--check` es de solo lectura y exige reproducción exacta de los 17 archivos, sin
extras. `--write` solo crea `referencias/revision-culinaria/B05_3/` si aún no existe;
no sobrescribe una entrega ni una respuesta anterior. La escritura es exclusiva
por archivo, no un lote atómico: un fallo deja una preparación incompleta propia,
sale con error y `--check` la rechaza. No borra originales ni archivos existentes.
No regenerar sobre una carpeta existente; conservar cada versión y su trazabilidad.
