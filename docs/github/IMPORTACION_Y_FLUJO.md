# Importación del código y flujo GitHub → preview

Fecha: 31/10/2026. Repositorio canónico: `jjcomprainteligente-ops/Jj-compra-inteligente-`.

## Conservación

La base remota se revisó en `16ea5dde3067066f52a7fec519c0ebd4fc24cdab`, con tres commits, un README y la auditoría `docs/ESTADO_TECNICO_2026-10-31.md`. Se conservan todos. El README integra su texto inicial y la guía local; la versión local previa se conserva íntegra en `docs/README_LOCAL_ANTES_IMPORTACION.md`.

Se incorpora el código Expo editable, el lockfile, las pruebas, scripts, instrucciones, documentación, bloques, referencias antiguas y fuentes/evidencia visual seleccionada. `IMPORTACION_MANIFIESTO.json` registra SHA-256 de los archivos de aplicación, pruebas, scripts y configuración para comprobar el origen. No se decompila el bundle publicado ni se reconstruye el código a partir de Vercel.

Las entregas ZIP, copias previas, dependencias y compilaciones continúan conservadas en el entorno de trabajo. Quedan fuera de Git por ser artefactos locales, no por haberse eliminado. Los informes antiguos mantienen las rutas que tenían al generarse; una ruta local de un informe no implica que el artefacto forme parte de Git. Las capturas son pruebas con datos ficticios, no precios comerciales.

## Seguridad de la subida

El repositorio es público. Se excluyen credenciales, `.env`, configuración privada, metadatos de Vercel, datos locales y trazas de navegador. Una revisión heurística de los textos candidatos no encontró credenciales reales; esto no es una certificación absoluta. Los avisos de dependencias Expo y la validación en dispositivos físicos documentados en I18N permanecen abiertos.

No se incorporan cuentas, pagos, bases de datos, servicios IA ni fuentes comerciales. La importación no cambia las cuatro claves de datos existentes ni la preferencia de idioma. No se presenta M3 como el logo oficial V2.

## Flujo obligatorio

1. Revisar rama, estado y cambios remotos. Trabajar en entregas pequeñas y preservar el historial; nunca usar push forzado.
2. Comprobar el código con `npm ci`, `npm run check` y la compilación correspondiente. Ejecutar regresiones web cuando cambie el comportamiento o diseño.
3. Subir el código y documentación comprobados a GitHub y verificar el SHA remoto.
4. Publicar únicamente el cliente compilado y recursos necesarios como preview Vercel `staging`, sin promover producción. Identificar el commit de origen en la entrega.
5. Verificar la preview remota antes de compartirla, manteniendo la protección y la caducidad del enlace cuando corresponda. Una preview no equivale a aprobación visual ni prueba en iPhone físico.
6. Auditar completamente después de cada pareja de bloques.

## Continuación visual

Consultar `../V2_CONCILIACION_VISUAL_2026-10-31.md`. La búsqueda no recuperó los originales GPT-6 V2/Premium ni el logo. Recuperar esos adjuntos es una dependencia real antes de modificar marca o composición y afirmar correspondencia visual.

Esta importación guarda la implementación existente; no declara resuelta la discrepancia visual ni marca terminadas las dieciséis pantallas.
