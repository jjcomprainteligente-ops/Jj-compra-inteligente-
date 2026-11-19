# JJ Compra Inteligente | V83: cierre 141–150 y respaldo

Este directorio es **la entrega real para Codex**, no un enlace de ChatGPT. Los ZIP se copiaron sin modificar sus bytes y se verificaron con SHA-256. El repositorio es público.

## Archivo listo para importar
- `JJ_V83_CIERRE_150_RECETAS_VERSION_LIGERA.zip` (937.580 bytes). Contiene las 150 recetas acumuladas en cinco idiomas (ES/EN/DE/FR/BG), 10 catas de V83 registradas como aprobadas, controles editoriales, alérgenos por ingredientes, precauciones individuales, hoja Excel y manifiesto. SHA-256: `151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034`.
- Este ZIP ligero **no contiene** el ZIP histórico original incrustado.

## Respaldo original completo (18.890.124 bytes)
- Archivo exacto: `JJ_BLOQUE2_V83_CIERRE_141_150_SABOR_APROBADO.zip`.
- Está preservado como 13 fragmentos binarios Git bajo `respaldo_partes/V83-CIERRE.zip.part01` a `part13`; no se ha cambiado el contenido.
- Para reconstruirlo desde la raíz del repositorio, ejecutar `python referencias/recetas/V83/reconstruir_respaldo.py`.
- SHA-256 esperado del ZIP reconstruido: `eb4e1a1fd1afdeae32f95690499e9d59052f167aa339f15a441d94d4802893f9`.
- El script verifica SHA-256 y prueba el contenido del ZIP. Si hay un fallo, no conserva la reconstrucción defectuosa.

## Restricciones de publicación / uso
- Las 150 recetas están preparadas en cinco idiomas y los controles internos constan en los archivos; esto **no equivale a revisión externa nativa ni certificación sanitaria**.
- Las pruebas culinarias del último lote 141–150 fueron confirmadas por el propietario; no extender esa aprobación a otras pruebas no documentadas.
- **Etiquetas comerciales pendientes**: verificar producto real, marca, SKU, formato de tienda, ingredientes, trazas y alérgenos cuando existan fuentes y precios oficiales por supermercado. El precio, por sí solo, no certifica alérgenos.
- No reemplazar datos ya integrados en la app ni alterar históricos sin cotejar IDs y estructura. Pedir una tarea concreta antes de importar a producción.
