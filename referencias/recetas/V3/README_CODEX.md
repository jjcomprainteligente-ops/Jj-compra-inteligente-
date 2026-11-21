# JJ Compra Inteligente | Recepción V3 segura

**Estado actualizado · 21/11/2026: recepción completa, integración fusionada en main y CI correcta.** La fuente contiene las 150 recetas, 750 fichas y 150 JPEG, sin faltantes. Los originales y los doce PNG anteriores se conservan; los informes del 18 y 19/11 mantienen su alcance histórico. [PR #30](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/pull/30), fuente de aplicación `80ab9e14185e3f50758339bd787c3f9b50113bc9`; merge autorizado `1504afd8538a3e38a546d41048b45be6d6cac3bf` y [CI de main](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/actions/runs/44947600998) correcta.

Main y la staging comprobada incorporan 150 verificadas más siete anteriores, **157 IDs únicos**, y 300 derivados locales. Las 120 recetas ya integradas mantienen exactamente sus datos y traducciones; no hay migración de los siete documentos. No se requiere otro permiso del texto o de las fotografías. [Fuente completa](APP_LIGERO_10MB/README_CATALOG_V3.md) · [integración y resultados](../../../docs/MAESTRO/INTEGRACION_150_RECETAS_Y_FOTOS_2026-11-20.md) · [verificación publicada](../../../design/recipe-integration150/reports/verification.json).

## Verificar la entrega individual recibida

Usar el Python del entorno con `scripts/requirements-photo-audit.txt` y Pillow 13.0.0 fijado:

```sh
python scripts/verificar_recetas_v3.py --profile app10mb \
  --input-dir referencias/recetas/V3/APP_LIGERO_10MB \
  --photos-dir referencias/recetas/V3/APP_LIGERO_10MB/fotos --verify-only
```

Este comando es de solo lectura y la recepción comprobada termina con `COMPLETE_VERIFIED`, salida 0. El ZIP de datos pesa 1.994.471 bytes y tiene SHA-256 `e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270`. Los 150 archivos individuales sustituyen la necesidad de recibir los antiguos diez ZIP fotográficos para este modo de verificación; no se mezclan con PNG o paquetes de otros perfiles.

## Fuente y perfiles

| Perfil | Manifiesto | Datos y fotos esperados |
|---|---|---|
| `original` | `MANIFIESTO_ENTREGA_V3.json` | ZIP de datos de 1.995.677 bytes y cinco ZIP fotográficos originales; o el mismo ZIP de datos y 150 fotos sueltas |
| `github16` | `MANIFIESTO_GITHUB_16_PARTES.json` | Mismo ZIP de datos original y 16 ZIP fotográficos |
| `v3b` | `MANIFIESTO_ENTREGA_V3B_LIGERA.json` | Su propio ZIP de datos y diez ZIP fotográficos |
| `app10mb` | `APP_LIGERO_10MB/MANIFIESTO_APP_LIGERO_10MB.json` | ZIP de datos de 1.994.471 bytes y diez ZIP JPEG inferiores a 10 MB, o las 150 JPEG sueltas ya recibidas en `APP_LIGERO_10MB/fotos/` |

Cada perfil fija sus propios paquetes de datos, rutas y hashes; no son intercambiables. Un manifiesto identifica los archivos esperados, pero no acredita su recepción. Los doce originales ya subidos se conservan en `fotos/` y pueden utilizarse al completar el perfil `original`, sin volver a transferirlos.

## Herramienta única y entradas compatibles

La lógica se centraliza en `scripts/recetas_v3_intake.py`. Los cuatro verificadores anteriores conservan sus comandos y utilizan el mismo motor. La validación JPEG obtiene las dimensiones reales mediante el decodificador fijado y corrige el intercambio de alto y ancho del lector anterior.

Ejecutar con el Python del entorno que instala `scripts/requirements-photo-audit.txt`, respetando los hashes y sin añadir dependencias. Pillow 13.0.0 es una herramienta de auditoría y permanece fuera de las dependencias de Expo.

Ejemplo conservado para la recepción parcial del perfil `original`, sin crear staging ni cambiar la app:

```sh
python scripts/verificar_recetas_v3.py --profile original \
  --input-dir referencias/recetas/V3 \
  --photos-dir referencias/recetas/V3/fotos \
  --audit-available --report-file /tmp/jj-v3-recepcion.json
```

Una auditoría parcial válida termina con código 2, estado `INCOMPLETE_PHOTOS_PENDING` y una lista explícita de fotos faltantes. Un error técnico o de contenido termina con código 1. El código 2 no acredita una entrega completa. La opción `--audit-available` no crea staging.

Ejemplo de verificación completa si se recibe el perfil `original` con sus propias 150 fotos sueltas:

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

El motor de recepción sigue siendo de solo lectura respecto de la app. La integración posterior cuenta con pruebas y publicación propias: tipos, 1.672 unitarias, 135 Python, 64 casos locales de fotos y matrices de recorrido correctos; staging en cuatro idiomas y 319 recursos comprobados, con 24 casos de fotografías, 16 recorridos y ocho controles de Inicio. La recepción técnica no se presenta como aprobación estética, prueba física o certificación comercial.
