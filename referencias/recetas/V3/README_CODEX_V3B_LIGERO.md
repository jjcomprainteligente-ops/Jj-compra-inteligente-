# JJ Compra Inteligente | Entrega V3B ligera para Codex

**Estado: manifiesto y verificador subidos a GitHub; archivos binarios pendientes de subida manual.** Este paquete es una COPIA optimizada del paquete V3 original. Los originales quedan intactos.

## Por qué existe V3B

Los 5 ZIP originales suman ~332 MB de fotografías y exceden los límites cómodos de envío en Codex. V3B los transforma a 150 fotos individuales JPEG de alta calidad (calidad 93, color 4:4:4), conservando encuadres, 150 IDs, cinco idiomas y las dimensiones originales. Las imágenes que ya eran JPG se preservaron sin recomprimir. **148 imágenes miden 1536 × 1024, dos 1600 × 1200.** No son mosaicos.

Los originales V3 están preservados fuera de esta carpeta. V3B modifica únicamente la codificación de foto y actualiza los campos foto/ruta/hash/tamaño dentro de una copia del catálogo. Las recetas, ingredientes, pasos y traducciones no se han modificado.

## Un solo lote para subir desde Safari

**Carpeta de destino:** `referencias/recetas/V3/assets_v3b/` en la rama `codex/importar-catalogo-fotos-v3-2026-11-17`.

Subir los **11 ZIP** (uno de datos, diez de fotos), sin renombrar y sin descomprimir. Cada uno pesa entre 3,1 y 10,6 MB. La interfaz web de GitHub acepta archivos de hasta 25 MiB por archivo; se pueden seleccionar varios en un mismo envío.

Los nombres y SHA-256 están en [MANIFIESTO_ENTREGA_V3B_LIGERA.json](./MANIFIESTO_ENTREGA_V3B_LIGERA.json).

**ATENCIÓN:** No subas los ZIP a una rama o carpeta distinta sin indicarle la ruta al verificador. Si GitHub web te pide un commit, conserva la rama V3 y deja el pull request en borrador.

## Instrucciones para Codex tras la subida

Desde la raíz del repositorio:

```bash
python referencias/recetas/V3/verificar_y_preparar_v3b.py \
  --input-dir referencias/recetas/V3/assets_v3b --verify-only

python referencias/recetas/V3/verificar_y_preparar_v3b.py \
  --input-dir referencias/recetas/V3/assets_v3b \
  --output-dir staging/jj-recetas-v3b
```

El verificador compara los 11 ZIP con SHA-256, comprueba CRC, la presencia de 150 recetas en cinco idiomas, 150 fotos individuales, identidad de ID, tamaño y SHA de cada foto, resolución mínima 1536 × 1024 y consistencia de los vínculos.

El staging genera `staging/jj-recetas-v3b/recetas_v3b.json` y `staging/jj-recetas-v3b/fotos/JJ-ID.jpg`, sin tocar `src/data/recipes.ts`.

**Codex debe importar desde V3B** (`datos/recetas_150_5_idiomas_editorial_comercial_v3b.json`) y no desde el catálogo V3 con rutas .png. Los JSON V3 originales están en `auditoria_original_v3/` dentro del ZIP de datos solo para trazabilidad.

Para Expo/React Native no usar `require(variable)` dinámico; generar un mapa estático de assets o configurar almacenamiento externo con rutas exactas. Evitar empaquetar 95 MB de fotos en el JS o en la primera pantalla. Agregar tests de ID, enlaces, idiomas, filtros y las 4 fotos corregidas.

**No fusionar el PR hasta que**:
- Existan físicamente los 11 ZIP en la ruta elegida.
- Pasen todos los controles del script sobre datos descargados de GitHub.
- Las fotos se muestren correctamente en una preview con 150 recetas.
- No se pierdan las 7 recetas demo ni el diseño actual.
- Se comprueben todos los cambios, pruebas de la app y preview.

Las etiquetas, SKU, precios de supermercado y trazas de alérgenos permanecen pendientes hasta contar con fuentes oficiales por tienda. La foto NO certifica que una receta sea segura para alergias.

[Pull request de trabajo #28](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/28)
