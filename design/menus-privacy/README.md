# Menús y privacidad local · evidencia

Fuente de aplicación: `fd78ecb09a2d141a9c23426be4a80d087908b1b5`. [PR #3](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/3).

- `reports/full-verification.json` y `playwright-results.json`: 222 casos correctos de 246 registrados; 24 omisiones deliberadas de matrices duplicadas; 0 fallos o casos inestables.
- `reports/focused-results.json`: los 40 casos nuevos también pasaron por separado; forman parte de los 222, no son 40 casos adicionales únicos.
- `reports/hosted-verification.json`: staging READY desde el mismo commit; cuatro idiomas y 27 recursos por hash. Incluye copia descargada exacta y borrado de gasto ficticio aislado. No incluye el secreto del enlace compartido.
- `reports/independent-review.md`: revisión estática de la pareja y sus límites.
- `reports/export-manifest.json`, `reference-integrity.json` y `npm-audit.json`: exportaciones, 75 referencias intactas y cinco avisos moderados de herramientas; 0 altos / 0 críticos.

TypeScript y 758 pruebas unitarias correctos. La matriz base tiene 420 capturas y las nuevas vistas 24 capturas adicionales en la ejecución completa. Se conservan en el artefacto local, sin publicar PNG ni archivos de copia personales en GitHub. No hay datos del propietario: los tests usan fixtures en contextos de navegador aislados.

Esto acredita las comprobaciones automatizadas descritas, no la aprobación visual ni una prueba en iPhone físico/Safari o del panel Share nativo. Las 150 recetas traducidas siguen pendientes de recibir.
