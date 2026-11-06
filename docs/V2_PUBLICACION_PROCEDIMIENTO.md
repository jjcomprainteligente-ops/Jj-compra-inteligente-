# Publicación de la preview V2

GitHub contiene el código y las referencias; Vercel sirve el cliente web compilado como vista de prueba. Este procedimiento conserva las entregas anteriores y no cambia el proyecto de producción.

## Preparar y comprobar la fuente

1. Revisar la rama, los cambios y el remoto canónico `jjcomprainteligente-ops/Jj-compra-inteligente-`.
2. Ejecutar `npm run check`, exportar la versión final y verificarla:

```sh
EXPO_NO_TELEMETRY=1 npx expo export --platform all --output-dir dist-v2 --max-workers 2
node scripts/verify-v2.cjs
```

La exportación contiene JavaScript y recursos para web/iOS/Android; no equivale a una app instalable ni a una prueba en un iPhone físico. La auditoría debe corresponder a esa exportación final. Si cambia la aplicación, volver a exportar y ejecutar las comprobaciones pertinentes.

3. Guardar código, pruebas, documentación y evidencia revisada en un commit. Subirlo a GitHub y verificar su SHA remoto. Mantener fuera de Git los datos locales, credenciales, compilaciones, previews y trazas de navegador.

## Empaquetar el cliente web

Con el árbol Git limpio:

```sh
node scripts/package-v2-preview.cjs
```

El script crea una carpeta nueva `previews/v2-web-<fecha>-<sufijo>/` y devuelve su ruta en JSON. Rechaza fuentes sin commit, otro remoto, enlaces simbólicos en el export, recursos desconocidos y un logo diferente del PNG aprobado.

Se copian `index.html` y los recursos compilados. El único bundle JavaScript se comprime con Brotli para la transferencia, conservando su nombre y URL; al descomprimirlo se obtienen exactamente los bytes de la exportación comprobada. No se añade un cargador, eval ni se modifica el JavaScript original en `dist-v2/`. Las siete fuentes Manrope se colocan también en rutas planas, acompañadas de las dos licencias existentes en `assets/licenses/`; `vercel.json` conserva las cabeceras `noindex, nofollow` y `nosniff` y redirige sus URL originales a esas copias. Los binarios nativos, `metadata.json`, mapas de código fuente y datos locales quedan fuera de la lista de subida. El PNG del logo se conserva byte a byte, con SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`.

Los metadatos se guardan dentro de `.vercel/`, que no se sube como contenido del sitio:

- `files.json`: lista exacta para la API de Vercel, con `file`, `size` y `sha` (SHA-1).
- `manifest.json`: versión del formato, fecha, commit/árbol/rama/repositorio, entrada web, logo, recursos, tamaños y hashes SHA-1/SHA-256. Los campos `bundle.size`, `sha1` y `sha256` identifican los bytes comprimidos de subida; `contentEncoding: br` y `decodedSize`, `decodedSha1`, `decodedSha256` identifican los bytes JavaScript que debe recibir la aplicación después de la decodificación HTTP.

La regla de cabeceras para la ruta exacta del bundle declara `Content-Encoding: br`, `Content-Type: application/javascript; charset=utf-8` y `Vary: Accept-Encoding`. Esta preview estática requiere un navegador moderno con Brotli sobre HTTPS. `Vary` distingue variantes en cachés, pero no negocia ni genera una alternativa sin compresión. Las fuentes, licencias y logo no reciben esa cabecera de codificación.

El commit identifica la fuente revisada. El script de empaquetado por sí solo no certifica que se haya compilado o probado esa fuente: esa correspondencia se establece con la exportación y auditoría anteriores.

## Publicar y comprobar

1. Subir únicamente los archivos de `files.json`, verificando tamaño y SHA de los bytes de transferencia. Reutilizar blobs existentes solo cuando coincidan. En la API de archivos puede utilizarse `xNowSize` con el tamaño del blob y `xVercelDigest` con su SHA-1; el cuerpo se proporciona en base64 al conector.
2. Crear el despliegue en el proyecto existente `jj-compra-inteligente`, destino explícito `staging`, con los metadatos del commit indicado por `manifest.json`. Mantener la protección del proyecto y los despliegues anteriores.
3. Esperar `READY`. Si la preview está protegida, obtener un enlace temporal autorizado e informar de su caducidad al propietario. No guardar su credencial en Git.
4. Verificar la preview con la ruta que devolvió el empaquetado:

```sh
JJ_PREVIEW_DIRECTORY='previews/v2-web-<fecha>-<sufijo>' \
JJ_PREVIEW_SHARE_URL='<enlace HTTPS temporal autorizado>' \
node scripts/verify-v2-hosted.cjs
```

El verificador valida primero los archivos locales contra sus hashes y descomprime el bundle con un límite de salida acotado a su tamaño declarado. Comprueba longitud y ambos hashes de la decodificación antes de abrir el navegador. Después exige que la respuesta remota del bundle declare Brotli y el MIME JavaScript, y compara los bytes HTTP ya decodificados con los hashes originales; los hashes comprimidos permanecen identificados por separado como expectativas del paquete (`packagedTransferSha1` y `packagedTransferSha256`), no como medición de los bytes de red, que el cliente HTTP ya ha decodificado. Después comprueba el bundle, logo, fuentes y demás URL públicas de la lista, y recorre bienvenida, cuatro pestañas, guardado de lista, cancelación de ingredientes y persistencia del idioma en español, inglés, alemán y francés. Utiliza contextos de navegador aislados con datos ficticios y no guarda cookies ni estado de autenticación.

El tráfico HTTPS mantiene proxy y confianza CA del entorno. El cliente Node decodifica el transporte HTTP y verifica sus cabeceras y hashes. Al entregar ese cuerpo ya decodificado al navegador se retiran únicamente `Content-Encoding` y `Content-Length` de la copia de cabeceras para evitar una segunda decodificación y recalcular la longitud; no se desactiva TLS ni se modifica su almacén persistente de certificados.

La evidencia nueva queda en `.vercel/hosted-evidence/run-.../`, sin sobrescribir las comprobaciones anteriores. El informe identifica solo el origen y el commit; las credenciales del enlace se redactan en los errores. Revisar el resultado antes de entregar el enlace al propietario.

Una preview correcta permite revisar la implementación web. No implica aprobación visual automática, cobertura de funciones futuras ni validación en Safari/iPhone físico.
