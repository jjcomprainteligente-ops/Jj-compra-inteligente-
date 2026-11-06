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

Se copian `index.html`, los bundles web y los recursos compilados. Las siete fuentes Manrope se colocan también en rutas planas, acompañadas de las dos licencias existentes en `assets/licenses/`; `vercel.json` conserva las cabeceras `noindex, nofollow` y `nosniff` y redirige sus URL originales a esas copias. Los binarios nativos, `metadata.json`, mapas de código fuente y datos locales quedan fuera de la lista de subida. El PNG del logo se conserva byte a byte, con SHA-256 `ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596`.

Los metadatos se guardan dentro de `.vercel/`, que no se sube como contenido del sitio:

- `files.json`: lista exacta para la API de Vercel, con `file`, `size` y `sha` (SHA-1).
- `manifest.json`: versión del formato, fecha, commit/árbol/rama/repositorio, entrada web, logo, recursos, tamaños y hashes SHA-1/SHA-256.

El commit identifica la fuente revisada. El script de empaquetado por sí solo no certifica que se haya compilado o probado esa fuente: esa correspondencia se establece con la exportación y auditoría anteriores.

## Publicar y comprobar

1. Subir únicamente los archivos de `files.json`, verificando tamaño y SHA. Reutilizar blobs existentes solo cuando coincidan.
2. Crear el despliegue en el proyecto existente `jj-compra-inteligente`, destino explícito `staging`, con los metadatos del commit indicado por `manifest.json`. Mantener la protección del proyecto y los despliegues anteriores.
3. Esperar `READY`. Si la preview está protegida, obtener un enlace temporal autorizado e informar de su caducidad al propietario. No guardar su credencial en Git.
4. Verificar la preview con la ruta que devolvió el empaquetado:

```sh
JJ_PREVIEW_DIRECTORY='previews/v2-web-<fecha>-<sufijo>' \
JJ_PREVIEW_SHARE_URL='<enlace HTTPS temporal autorizado>' \
node scripts/verify-v2-hosted.cjs
```

El verificador valida primero los archivos locales contra sus hashes. Después comprueba el bundle, logo, fuentes y demás URL públicas de la lista, y recorre bienvenida, cuatro pestañas, guardado de lista, cancelación de ingredientes y persistencia del idioma en español, inglés, alemán y francés. Utiliza contextos de navegador aislados con datos ficticios y no guarda cookies ni estado de autenticación.

El tráfico HTTPS mantiene proxy y confianza CA del entorno. Las respuestas verificadas por el cliente Node se entregan al navegador; no se desactiva TLS ni se modifica su almacén persistente de certificados.

La evidencia nueva queda en `.vercel/hosted-evidence/run-.../`, sin sobrescribir las comprobaciones anteriores. El informe identifica solo el origen y el commit; las credenciales del enlace se redactan en los errores. Revisar el resultado antes de entregar el enlace al propietario.

Una preview correcta permite revisar la implementación web. No implica aprobación visual automática, cobertura de funciones futuras ni validación en Safari/iPhone físico.
