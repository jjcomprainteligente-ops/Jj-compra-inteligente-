# Estado comprobado de transferencia V3 a GitHub
Fecha: 2026-11-17

## Archivos que SÍ están en GitHub
- `JJ_V3_CODEX_DATOS_Y_MANIFIESTOS.zip` (1.995.677 bytes, SHA-256 `36dba615a6d83bc0ff286ffe4e0d4377f69446ab47d8f9138b9d4957281dc4a6`): las 150 recetas en 5 idiomas, los controles y manifiestos V3.
- **12 imágenes originales** en `fotos/`, con nombres basados en el ID de receta y hash Git de blob comprobado:
  - JJ-B03-CAN-013
  - JJ-B03-ESP-073
  - JJ-B03-FRA-115
  - JJ-B03-GRE-211
  - JJ-B03-ITA-132
  - JJ-E03-001
  - JJ-E03-002
  - JJ-E03-003
  - JJ-E03-006
  - JJ-E03-007
  - JJ-E13-137 (ossobuco nuevo, sin risotto)
  - JJ-E13-194 (samosas nuevas, sin chutney)

## Archivos que NO están en GitHub
- **138 fotografías originales** restantes de las 150 que constan en el manifiesto del paquete V3.
- Los cinco ZIP grandes de fotos no están en esta rama. NO confundir el manifiesto con transferencia efectiva.
- Precios, marcas, SKU y etiquetas reales por tienda siguen pendientes de verificación.

## Bloqueos y protección
La conexión a GitHub permite cargar blobs individuales, pero agota el tiempo al transferir cientos de MB en lotes. En cuanto se disponga del resto de imágenes en el entorno de Codex o de almacenamiento seguro, completar subida e importación por `recipe_id`, verificar cada SHA-256 y que todas tengan resolución mínima 1536 × 1024.

- La solicitud de cambios permanece **en borrador**.
- No fusionar a `main` ni publicar la app como completa hasta contar con las 150 imágenes accesibles.
- El ZIP V3 de datos está disponible desde la rama para comenzar el trabajo de importación de recetas, pero NO implica que estén las 150 fotos.

Regla permanente: una foto por receta, sin mosaicos; nunca sustituir por imágenes provisionales ni eliminar originales.
