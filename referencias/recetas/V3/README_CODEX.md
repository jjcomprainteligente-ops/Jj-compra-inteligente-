# JJ Compra Inteligente | Importación V3 para Codex

**Estado actual: preparación y verificador en GitHub. Los seis ZIP físicos V3 todavía NO están en este repositorio. No afirmar que las 150 fotografías se han subido.**

## Materiales en el repositorio

- El respaldo V83 de 150 recetas está conservado en referencias/recetas/V83/.
- Este directorio contiene MANIFIESTO_ENTREGA_V3.json con los SHA-256 y tamaños de los seis ZIP V3.
- verificar_y_preparar_v3.py verifica los ZIP, 150 IDs, cinco idiomas, 150 imágenes distintas, resolución de al menos 1536 x 1024, coincidencia de hashes y rutas y crea staging sin tocar la app.

## Dependencia pendiente: obtener archivos V3

Los archivos siguen conservados en la conversación de ChatGPT. Codex **no puede abrir enlaces sandbox de ChatGPT** ni inferir su contenido a partir del manifiesto. Deben entregarse efectivamente al entorno de trabajo de Codex o subirse al repositorio por un medio que admita archivos binarios grandes.

Se requieren sin modificar nombres ni contenido:
1. JJ_V3_CODEX_DATOS_Y_MANIFIESTOS.zip
2. JJ_V3_CODEX_FOTOS_PARTE_01_DE_05.zip
3. JJ_V3_CODEX_FOTOS_PARTE_02_DE_05.zip
4. JJ_V3_CODEX_FOTOS_PARTE_03_DE_05.zip
5. JJ_V3_CODEX_FOTOS_PARTE_04_DE_05.zip
6. JJ_V3_CODEX_FOTOS_PARTE_05_DE_05.zip

Las cinco partes fotográficas suman aproximadamente 332 MB. GitHub avisa por objetos de más de 50 MB y rechaza objetos de más de 100 MB. Por eso no se debe intentar subir los ZIP como un commit ordinario ni añadirlos a la app Expo para servirlos sin optimizar. Evaluar Git LFS o almacenamiento de imágenes con control de costes; mantener los originales y el manifiesto aparte.

## Procedimiento exacto para Codex

1. Inspeccionar ramas actuales, scripts, pruebas y estructura src/data/recipes.ts. Preservar los 7 IDs de demo existentes y su historial.
2. Obtener los seis ZIP desde una fuente realmente accesible. No inventar fotografías ni sustituirlas por URLs de stock.
3. Ejecutar primero:
   python referencias/recetas/V3/verificar_y_preparar_v3.py --input-dir /ruta/con/los/seis/zip --verify-only
4. Si pasa, crear carpeta NUEVA de staging:
   python referencias/recetas/V3/verificar_y_preparar_v3.py --input-dir /ruta/con/los/seis/zip --output-dir staging/jj-recetas-v3
5. Diseñar el importador desde staging conservando recipe_id como clave inmutable. La fuente es recetas_v3.json, en es/en/de/fr/bg. Las imágenes se vinculan con recipe.photo.photo_path. No asumir extensión png.
6. En React Native/Expo, usar un registro estático de imágenes si se empaquetan en el cliente; nunca un require() dinámico con un nombre de archivo. Considerar almacenamiento externo y carga bajo demanda por tamaño total.
7. Añadir pruebas: 150 IDs únicos, 150 archivos únicos, nombres y SHA correctos, 750 fichas por idioma, sin mosaicos, sin guarniciones extra para JJ-E13-137 y JJ-E13-194, accesibilidad y app demo sin regresiones.
8. Ejecutar npm ci, npm run check, npm run build:web y las pruebas de interfaz pertinentes. Crear una preview y auditar antes de plantear merge.
9. Mantener precios, etiquetas y SKU como PENDIENTES hasta contrastar referencias reales por tienda. No inferir ni certificar ausencia de alérgenos y trazas solo por ingredientes o fotografías.

## Correcciones fotográficas incorporadas a V3

- JJ-E04-054: salmorejo con huevo cocido y jamón serrano.
- JJ-E04-106: fotografía conservada, corrección de nota de metadatos.
- JJ-E13-137: ossobuco con gremolata, sin risotto.
- JJ-E13-194: samosas de patata y guisantes, sin chutney.

## Criterios de aceptación

- [ ] Los seis ZIP V3 se encuentran físicamente disponibles para Codex.
- [ ] SHA-256 y tamaño de los seis ZIP pasan.
- [ ] 150 IDs, 150 fotos, cinco idiomas y resolución mínima pasan en el script.
- [ ] La integración funciona en Expo/web sin romper las siete recetas demo.
- [ ] Las imágenes correctas aparecen en fichas, tarjetas y lista de compra cuando proceda.
- [ ] La preview ha sido probada y está vinculada al commit exacto.
- [ ] Cualquier dato comercial no verificado permanece claramente pendiente.

**No fusionar ni declarar importación terminada antes de pasar todas las pruebas.**
