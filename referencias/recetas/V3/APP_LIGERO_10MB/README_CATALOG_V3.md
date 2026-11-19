# Catálogo V3 completo, 150 fotografías para Codex

**Ubicación:** rama `main`, `referencias/recetas/V3/APP_LIGERO_10MB/fotos/`. Estas son 150 fotos individuales JPG, no los antiguos ZIP fragmentados.

**Recetas:** `JJ_V3_APP_DATOS_150_RECETAS_5_IDIOMAS.zip`, en esta misma carpeta. Contiene 150 recetas localizadas en ES, EN, DE, FR y BG, enlaces de fotos por `recipe_id`, ingredientes, pasos y controles editoriales.

**Fotografías:** 150 JPG de alta calidad JPEG 93, color 4:4:4; dimensiones originales conservadas (mínimo 1536 × 1024), una foto por receta, sin mosaicos. Son copias optimizadas con pérdida, no idénticas bit a bit a los originales PNG/JPG, que permanecen respaldados por separado.

**Relación exacta:** `MANIFIESTO_FOTOS_INDIVIDUALES_150.json` ofrece ID, ruta de GitHub, tamaño, SHA-256 y SHA de blob Git para cada foto.

## Para Codex, desde `main`

1. Comprobar que existen 150 `.jpg` en `referencias/recetas/V3/APP_LIGERO_10MB/fotos/` y el ZIP de datos en el directorio padre.
2. Ejecutar `python referencias/recetas/V3/APP_LIGERO_10MB/verificar_github_150.py`.
3. Leer del ZIP `datos/recetas_150_5_idiomas_editorial_comercial_v3.json` y `datos/manifest_photos_150_SHA256_V3.json`. Los campos `photo.photo_path` se almacenan como `fotos/JJ-ID.jpg` y se resuelven en GitHub con el prefijo `referencias/recetas/V3/APP_LIGERO_10MB/`.
4. Crear el mapa estático de imágenes para Expo/React Native (`require()` no admite ruta dinámica) o implementar distribución bajo demanda. Probar las 150 miniaturas, la visualización de recetas y los cinco idiomas, sin romper las siete recetas demo actuales.
5. No declarar terminada la integración en la app hasta que pase los tests y se visualicen correctamente todas las fotografías. Los archivos están en el repo, pero no por eso integrados en la aplicación.

**Comercial:** precios, SKU, marcas y etiquetas reales de supermercados están pendientes de fuente oficial. La foto no certifica ausencia de alérgenos o trazas.

**No usar como fuente principal:** `APP_LIGERO_10MB/*.part01`, `V3/fotos/*.png` ni los antiguos manifiestos de ZIP. Esas rutas pertenecen a intentos de transferencia previos y respaldos. Las 150 fotos de esta entrega están en `APP_LIGERO_10MB/fotos/*.jpg`.