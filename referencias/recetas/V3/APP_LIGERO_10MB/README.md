# JJ Compra Inteligente | RECEPCIÓN DEFINITIVA DE ARCHIVOS V3 APP LIGERO 10MB

**Estado:** comprobador y SHA-256 publicados en GitHub; **los 11 ZIP binarios todavía no están subidos**.

## Por qué esta entrega sustituye al intento de 16 ZIP

Los 16 ZIP originales para GitHub incluían archivos entre 8 y 22 MB, pero el usuario confirmó que desde su entorno no acepta mayores de 20 MB. El nuevo material **V3 APP LIGERO** tiene diez ZIP de fotografías, cada uno inferior a **10.000.000 bytes**, y un ZIP de datos de ~2 MB.

- 150 recetas en cinco idiomas (es/en/de/fr/bg).
- 150 fotografías distintas, una por ID, sin mosaicos.
- Dimensiones originales sin cambiar: al menos 1536x1024.
- Copias JPEG calidad 93, subsampling 4:4:4, sin recorte, manteniendo los originales PNG/JPG fuera de esta entrega.
- Manifest fotográfico incluido con SHA-256 nuevos y hashes de originales trazables.
- Se ejecutó una validación independiente de 150 IDs, 150 hashes, enlaces, idiomas, dimensiones y CRC sin errores.
- La compresión de copia JPEG es **con pérdida**: no declarar fotos idénticas bit a bit; sí preservar alta calidad visual y resolución.

## Subida en Safari

Abrir esta carpeta desde la rama `codex/importar-catalogo-fotos-v3-2026-11-17` y usar **Add file > Upload files** para cargar:

- `JJ_V3_APP_DATOS_150_RECETAS_5_IDIOMAS.zip`
- `JJ_V3_APP_FOTOS_01_DE_10.zip` hasta `JJ_V3_APP_FOTOS_10_DE_10.zip`

No renombrar, descomprimir ni mezclar estos ZIP con los anteriores V3/V3B. Se pueden seleccionar todos a la vez si Safari lo permite. **No subir los PNG originales en paralelo**, para evitar duplicación.

## Trabajo obligatorio de Codex

Una vez que los once ZIP estén físicamente en este directorio:

```sh
python referencias/recetas/V3/verificar_app_ligero_10mb.py \
  --input-dir referencias/recetas/V3/APP_LIGERO_10MB --verify-only

python referencias/recetas/V3/verificar_app_ligero_10mb.py \
  --input-dir referencias/recetas/V3/APP_LIGERO_10MB \
  --output-dir staging/jj-recetas-v3-app-ligero
```

El verificador bloquea cualquier ZIP incompleto, SHA distinto, ID faltante, foto repetida, enlace incorrecto, idioma incompleto o resolución inferior al mínimo.

Solo después de pasar las pruebas: generar mapeo estático de assets o almacenamiento bajo demanda. No alterar IDs de las siete recetas demo existentes ni publicar directamente en producción.

## Límites comerciales y editoriales

Etiquetas comerciales, trazas, SKU y precios por tienda todavía pendientes de fuentes oficiales. La validez visual de las fotos **no es** una certificación médica ni de ausencia de alérgenos.

**No fusionar PR #28 ni declarar la integración terminada hasta ver las 150 imágenes correctamente en la app y pasar npm run check y la preview.**
