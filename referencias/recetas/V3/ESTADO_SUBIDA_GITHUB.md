# Estado de recepción V3 · 18/11/2026

Descargados y verificados desde la rama de recepción, commit `6c6cde44`:

- ZIP original `JJ_V3_CODEX_DATOS_Y_MANIFIESTOS.zip`: 1.995.677 bytes.
- SHA-256 del ZIP: `36dba615a6d83bc0ff286ffe4e0d4377f69446ab47d8f9138b9d4957281dc4a6`.
- Doce PNG originales.

Los datos contienen 150 IDs únicos y 750 fichas en cinco idiomas. Los doce PNG coinciden con su manifiesto por ID, ruta, tamaño y hash, y pasan las comprobaciones de contenedor y decodificación completa.

Las 138 fotos restantes siguen pendientes de recepción. Los ZIP fotográficos de 16 partes y los once paquetes alternativos APP_LIGERO no están presentes. Sus manifiestos identifican archivos esperados; no acreditan que los binarios se hayan transferido.

Las instrucciones vigentes están en [README_CODEX.md](README_CODEX.md) y los verificadores utilizan un motor común. La opción `--photos-dir` admite fotos sueltas como alternativa exclusiva a los ZIP fotográficos, con el ZIP de datos y los hashes de su perfil. Esto permite conservar lo ya recibido. Los PNG originales y los JPEG de perfiles alternativos no son intercambiables.

El propietario autorizó incorporar las 150 recetas y limpiar las ramas realmente superadas, preservando el trabajo anterior. Esa autorización sigue vigente. Las etiquetas, SKU, precios oficiales y trazas comerciales continúan pendientes de verificación.

El verificador registra la recepción técnica y no activa datos en la app. Una auditoría parcial válida termina con código 2 y estado `INCOMPLETE_PHOTOS_PENDING`, sin crear staging.

La app conserva las 127 recetas actuales. La integración se prepara en una rama de consolidación, con pruebas finales, CI y preview todavía pendientes de registrar. La fusión en main requiere la aceptación y autorización explícitas previstas en la política vigente; no se deducen de «sigue».

La rama de recepción permanece disponible para nuevas fotos. Antes de retirar cualquier rama superada se exige respaldo restaurable, aceptación de la consolidación y comprobación del SHA remoto para preservar cambios concurrentes.
