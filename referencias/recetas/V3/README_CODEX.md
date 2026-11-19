# JJ Compra Inteligente | Recepción V3 segura

Estado comprobado el 18/11/2026: recibidos el ZIP de datos original y 12 PNG. Se verificó la estructura de 150 recetas y sus 750 fichas en cinco idiomas. Faltan 138 fotografías originales.

El propietario autorizó incorporar las 150 recetas. Esa autorización sigue vigente. La app conserva las 127 recetas actuales hasta completar y comprobar la integración.

## Fuente y perfiles

| Perfil | Manifiesto | Datos y fotos esperados |
|---|---|---|
| `original` | `MANIFIESTO_ENTREGA_V3.json` | ZIP de datos de 1.995.677 bytes y cinco ZIP fotográficos originales; o el mismo ZIP de datos y 150 fotos sueltas |
| `github16` | `MANIFIESTO_GITHUB_16_PARTES.json` | Mismo ZIP de datos original y 16 ZIP fotográficos |
| `v3b` | `MANIFIESTO_ENTREGA_V3B_LIGERA.json` | Su propio ZIP de datos y diez ZIP fotográficos |
| `app10mb` | `APP_LIGERO_10MB/MANIFIESTO_APP_LIGERO_10MB.json` | ZIP de datos de 1.994.471 bytes y diez ZIP JPEG, cada uno inferior a 10 MB |

Cada perfil fija sus propios paquetes de datos, rutas y hashes; no son intercambiables. Un manifiesto identifica los archivos esperados, pero no acredita su recepción. Los doce originales ya subidos se conservan en `fotos/` y pueden utilizarse al completar el perfil `original`, sin volver a transferirlos.

## Herramienta única y entradas compatibles

La lógica se centraliza en `scripts/recetas_v3_intake.py`. Los cuatro verificadores anteriores conservan sus comandos y utilizan el mismo motor. La validación JPEG obtiene las dimensiones reales mediante el decodificador fijado y corrige el intercambio de alto y ancho del lector anterior.

Ejecutar con el Python del entorno que instala `scripts/requirements-photo-audit.txt`, respetando los hashes y sin añadir dependencias. Pillow 13.0.0 es una herramienta de auditoría y permanece fuera de las dependencias de Expo.

Auditar lo ya recibido, sin crear staging ni cambiar la app:

```sh
python scripts/verificar_recetas_v3.py --profile original \
  --input-dir referencias/recetas/V3 \
  --photos-dir referencias/recetas/V3/fotos \
  --audit-available --report-file /tmp/jj-v3-recepcion.json
```

Una auditoría parcial válida termina con código 2, estado `INCOMPLETE_PHOTOS_PENDING` y una lista explícita de fotos faltantes. Un error técnico o de contenido termina con código 1. El código 2 no acredita una entrega completa. La opción `--audit-available` no crea staging.

Cuando estén las 150 fotos sueltas correctas:

```sh
python scripts/verificar_recetas_v3.py --profile original \
  --input-dir referencias/recetas/V3 \
  --photos-dir referencias/recetas/V3/fotos --verify-only
```

La opción `--photos-dir` selecciona el modo de fotos sueltas, como alternativa exclusiva a los ZIP fotográficos. La recepción por ZIP utiliza el perfil correspondiente y un directorio con su paquete de datos y todas sus partes.

La preparación sin `--verify-only` exige verificación completa y crea exclusivamente una carpeta nueva de staging. No escribe en `src/`, `assets/` ni en las fuentes. Un destino existente se rechaza. Un fallo conserva el marcador `INCOMPLETO`; para considerar válido el staging deben existir `ESTADO.txt` y todos los archivos verificados, y estar ausente ese marcador.

## Controles y límites

Se comprueban tamaños y SHA de paquetes, entradas y CRC, expansión ZIP, JSON estricto, 150 IDs inmutables, cinco idiomas y enlaces únicos entre receta y foto. Cada imagen se verifica por tamaño, SHA, dimensiones, contenedor y decodificación completa.

Se rechazan rutas que escapen del directorio permitido, enlaces simbólicos, FIFO, duplicados, perfiles mezclados y cantidades o estructuras inválidas conforme al esquema. Las imágenes se procesan una a una para limitar el uso de memoria.

Las comprobaciones automáticas no certifican derechos, correspondencia visual, revisión lingüística externa, alérgenos o trazas, SKU, etiquetas ni precios comerciales. Esos límites se conservan.

Esta herramienta no modifica la app, sus siete IDs anteriores ni sus siete documentos locales. La integración del catálogo, la optimización de imágenes y la preview requieren sus propias comprobaciones. El estado actual de recepción no acredita 150 fotos publicadas.
