# G00 — Código en GitHub y auditoría de entrega

**Fecha:** 31/10/2026. **Estado:** importación verificada y publicada; revisión visual V2 pendiente de originales.

## Resultado verificable

- Repositorio: https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-
- Código importado en `main`: [`732d1817f3b856384e98191dd82cb92241011271`](https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-/commit/732d1817f3b856384e98191dd82cb92241011271).
- Conservados los tres commits anteriores, el texto del README remoto y la auditoría técnica preexistente, sin push forzado.
- Importación: 714 archivos cambiados; 715 archivos totales en ese commit. Código editable, lockfile, pruebas, documentación, referencias anteriores y evidencia visual revisada. Los ZIP y artefactos anteriores siguen conservados localmente.
- El manifiesto de 85 archivos de aplicación, pruebas, scripts y configuración coincide íntegramente con el contenido recuperado y con un clon nuevo descargado de GitHub.

## Verificación independiente

Un clon público separado, fijado al commit indicado, ejecutó `npm ci`, `npm run check` y una exportación web. Resultado: instalación correcta, TypeScript limpio, 496 pruebas en 16 archivos correctas y exportación correcta. El árbol Git del clon permanece limpio.

El primer intento de instalación encontró una restricción del caché npm fuera del workspace; se repitió con caché en el workspace, sin alterar código o lockfile. No se trata de un fallo de la aplicación.

El JS de dos exportaciones web independientes coincide en SHA-256: `1cb5c33c9be6d2dee6704253f61f99d0fdb7701b04bb2601b07ed6d82d463c10` (3.323.975 bytes). No se afirma que sea idéntico al antiguo export multiplataforma: este conserva otro hash y orden de IDs Metro. La comparación encontró 2.348 factorías y sus grafos de dependencias equivalentes; las siete fuentes conservan sus hashes. Informes en `../../design/github-g00/`.

## Preview trazable

- Destino de prueba Vercel: `staging`, proyecto existente `jj-compra-inteligente`.
- Despliegue: `dpl_Ewmo9hTVBK4WTkkjagSscWy5qj4g`, estado `READY`.
- Origen protegido: https://jj-compra-inteligente-7uot2tons-cmj2hwhc6b-1051.vercel.app
- Metadatos Vercel: commit `732d1817f3b856384e98191dd82cb92241011271`, rama `main`, repositorio canónico.
- El enlace temporal entregado al propietario caduca el **2026-11-01 19:59:58 UTC**. Su credencial no se guarda en Git.

Se reutiliza el artefacto i18n previamente auditado: sus 52 archivos de ejecución/configuración coinciden exactamente con las fuentes importadas. No se ha rehecho su compilación ni modificado la UI para esta preview. El hash del bundle servido es `daac04335e9c233edfc3a020c77ed547bced49b0a8613db4e6bdefa5a6e19348`. La configuración exacta de rewrites de fuentes se conserva en `../../deployment/preview/vercel.json`.

Nueva comprobación remota: cuatro idiomas correctos y 23 recursos/URLs comprobados por tamaño y hash, sin errores registrados. Se probaron bienvenida, cuatro pestañas, guardado local de lista, revisión/cancelación de menú sin cambiar la compra y persistencia de idioma después de recargar. Se guardaron doce capturas con datos ficticios. No se ejecutó otra vez la suite completa de 124 recorridos; su evidencia anterior se conserva y esta comprobación remota es una prueba distinta.

La preview muestra la base anterior Verde Mercado/M3. **No es la corrección visual GPT-6 V2.** Vercel sigue siendo una vista de prueba; GitHub contiene el código y la documentación.

## Auditoría de esta entrega

- Revisión independiente del índice: ningún path de credenciales, `.env`, compilaciones, previews protegidos, ZIP o trazas. No hay symlinks ni submódulos.
- Escaneo textual heurístico de los archivos preparados: ninguna credencial real encontrada. No se promete ausencia absoluta de fallos o secretos por una búsqueda de patrones.
- Fuente y lógica existentes conservadas: no hay cambios en pantallas, reglas de dominio, claves de almacenamiento, idiomas, integraciones o permisos del dispositivo.
- Protección Vercel preservada; se publica únicamente el cliente compilado y sus recursos. No se promociona una nueva versión de producción.
- El índice original contiene espacios de salto Markdown y texto de licencias heredados; se conserva su contenido en esta importación. No se confunden esos avisos de formato con fallos de compilación.

## Pendientes y siguiente bloque

La [conciliación V2](../V2_CONCILIACION_VISUAL_2026-10-31.md) documenta las diferencias y las dieciséis pantallas objetivo. Los originales nuevos no se encontraron: falta recuperar los ZIP V2/Premium, composición y logo exacto antes de corregir la identidad y composición. No se redibujará la marca ni se aplicarán colores aislados desde el recuerdo.

Los 13 paquetes con avisos de herramientas Expo (2 altos, 9 moderados, 2 bajos; 0 críticos) del informe i18n siguen abiertos; esta entrega no actualiza dependencias ni los considera solucionados. iPhone físico/Safari, VoiceOver/Dynamic Type, teclado y zonas seguras también siguen pendientes. No se añaden pagos, cámara, voz, cuentas, sincronización ni fuentes comerciales.

Siguiente: V00, recuperar/verificar referencias; después V01 y V02 con capturas en los cuatro idiomas y auditoría completa tras la pareja. La revisión de esta entrega cubre importación y diagnóstico; no cierra una implementación visual aún no realizada.
