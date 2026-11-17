# Carpeta de recepción V3 | Codex

**Esta carpeta es para subir los 17 archivos V3 desde Safari, sin descomprimir.**

Archivos requeridos:
- `JJ_V3_CODEX_DATOS_Y_MANIFIESTOS.zip` (2 MB)
- `JJ_V3_FOTOS_GITHUB_01_DE_16.zip` a `JJ_V3_FOTOS_GITHUB_16_DE_16.zip` (cada uno menor de 25 MB)

La conexión de ChatGPT con GitHub ha preparado el manifiesto y el verificador, pero **no ha subido las fotos todavía**. No confundir este README con una entrega completada.

## Para Codex

Tras recibir los archivos completos en esta carpeta, ejecutar:

```bash
python referencias/recetas/V3/verificar_16_partes.py --input-dir referencias/recetas/V3/paquetes --verify-only
python referencias/recetas/V3/verificar_16_partes.py --input-dir referencias/recetas/V3/paquetes --output-dir staging/jj-recetas-v3
```

El verificador contrasta SHA-256 del ZIP, CRC de cada miembro, 150 IDs, 5 idiomas, 150 imágenes independientes, hashes, dimensiones mínimas 1536x1024 y coincidencia entre receta e imagen. Aborta si hay archivos faltantes o alterados.

Mantener el PR como borrador hasta las pruebas de integración Expo/web. No inferir SKU, precios o ausencia de alérgenos.
